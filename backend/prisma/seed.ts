import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting DB Seed...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create a default admin and investor user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexus.com' },
    update: { passwordHash },
    create: {
      email: 'admin@nexus.com',
      passwordHash,
      role: 'ADMIN',
      riskThreshold: 'HIGH'
    }
  });

  const investor = await prisma.user.upsert({
    where: { email: 'investor@nexus.com' },
    update: {
      passwordHash,
      riskThreshold: 'MEDIUM',
      cashBalance: 500000000.0
    },
    create: {
      email: 'investor@nexus.com',
      passwordHash,
      role: 'INVESTOR',
      riskThreshold: 'MEDIUM',
      cashBalance: 500000000.0 // ₹50 Crores initial cash
    }
  });

  // Clear existing data
  await prisma.financialData.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.portfolioHolding.deleteMany({});
  await prisma.watchlist.deleteMany({});
  await prisma.sPV.deleteMany({});
  await prisma.parentGroup.deleteMany({});

  const parentEntities = [
    { name: 'Reliance Infrastructure Group', sector: 'Diversified Infrastructure', prefix: 'Reliance' },
    { name: 'Adani Ports & Logistics', sector: 'Logistics & Transport', prefix: 'Adani' },
    { name: 'Tata Power Renewables', sector: 'Green Energy', prefix: 'Tata Renewables' },
    { name: 'Brookfield India Infra Trust', sector: 'Real Estate & Infra', prefix: 'Brookfield' },
    { name: 'Larsen & Toubro Concessions', sector: 'Heavy Infrastructure', prefix: 'L&T' },
    { name: 'GMR Airports Infrastructure', sector: 'Aviation', prefix: 'GMR' },
    { name: 'IRB Infrastructure Developers', sector: 'Roads & Highways', prefix: 'IRB' },
    { name: 'JSW Energy Assets', sector: 'Power', prefix: 'JSW' },
    { name: 'Greenko Energy Holdings', sector: 'Renewables', prefix: 'Greenko' },
    { name: 'Cube Highways Group', sector: 'Toll Roads', prefix: 'Cube Highways' },
    { name: 'Macquarie Asia Infra Fund', sector: 'Private Equity', prefix: 'Macquarie' }
  ];

  const spvTypes = ['Roads', 'Solar', 'Wind', 'Data Center', 'Logistics Park', 'Telecom Tower', 'Metro Transit', 'Transmission Line'];
  const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
  const recommendations = ['Buy', 'Hold', 'Sell'];
  const statuses = ['Healthy', 'Warning', 'Critical'];

  console.log('Generating Parent Groups and SPVs...');

  for (const parent of parentEntities) {
    const group = await prisma.parentGroup.create({
      data: {
        name: parent.name,
        sector: parent.sector,
        description: `Institutional investment vehicle managing ${parent.sector.toLowerCase()} assets across the Indian subcontinent.`
      }
    });

    const spvCount = faker.number.int({ min: 5, max: 9 });

    for (let i = 0; i < spvCount; i++) {
      const type = faker.helpers.arrayElement(spvTypes);
      const suffix = faker.helpers.arrayElement(['SPV I', 'SPV II', 'Assets', 'Holdings', 'Trust', 'Project', 'Corridor']);
      const spvName = `${parent.prefix} ${type} ${suffix}`;

      const spv = await prisma.sPV.create({
        data: {
          name: spvName,
          type: type,
          sector: parent.sector,
          description: `Special Purpose Vehicle for ${type.toLowerCase()} operations under ${parent.name}.`,
          riskLevel: faker.helpers.arrayElement(riskLevels),
          esgScore: faker.number.float({ min: 60, max: 98, fractionDigits: 1 }),
          status: faker.helpers.arrayElement(statuses),
          recommendation: faker.helpers.arrayElement(recommendations),
          createdAt: faker.date.past({ years: 3 }),
          parentGroupId: group.id
        }
      });

      // Generate 12 months of realistic historical financial data
      // Indian context: Asset value between 50 Crores (500M) and 5000 Crores (50B)
      let baseAssetValue = faker.number.int({ min: 500000000, max: 50000000000 });
      let baseDebt = baseAssetValue * faker.number.float({ min: 0.3, max: 0.7 }); // 30-70% debt-to-asset ratio
      
      const financialDataList = [];
      for (let month = 0; month < 12; month++) {
        const date = new Date(new Date().getFullYear(), new Date().getMonth() - (11 - month), 1);
        
        // Asset value grows slowly, debt amortizes slightly
        baseAssetValue = baseAssetValue * faker.number.float({ min: 0.99, max: 1.02 });
        baseDebt = baseDebt * faker.number.float({ min: 0.98, max: 1.00 });

        // Revenue is typically 10-20% of asset value annually, so ~1-2% monthly
        const revenue = baseAssetValue * faker.number.float({ min: 0.008, max: 0.02 });
        // Operating expenses are 30-60% of revenue
        const expenses = revenue * faker.number.float({ min: 0.3, max: 0.6 });
        const profit = revenue - expenses;
        // Cash flow is profit + depreciation - capex - debt service (simplified here)
        const cashFlow = profit * faker.number.float({ min: 0.6, max: 0.9 });
        // Realistic IRR for Indian infra: 8% to 18%
        const irr = faker.number.float({ min: 0.08, max: 0.18 });

        financialDataList.push({
          spvId: spv.id,
          date: date,
          revenue,
          expenses,
          profit,
          assetValue: baseAssetValue,
          debt: baseDebt,
          cashFlow,
          irr
        });
      }

      await prisma.financialData.createMany({
        data: financialDataList
      });
      
      // Add 1-2 random alerts for 10% of SPVs
      if (faker.number.int({ min: 1, max: 10 }) <= 1) {
        await prisma.alert.create({
          data: {
            spvId: spv.id,
            condition: faker.helpers.arrayElement(['Debt Service Coverage Ratio Warning', 'Regulatory Compliance Update', 'Refinancing Required']),
            message: `The ${spvName} requires attention regarding recent operational metrics.`,
            severity: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'CRITICAL']),
          }
        });
      }
    }
  }

  console.log('Seed data inserted successfully.');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
