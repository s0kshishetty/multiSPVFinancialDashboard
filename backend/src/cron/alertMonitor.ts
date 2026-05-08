import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { analyzeSPV } from '../services/recommendationEngine';

const prisma = new PrismaClient();

export const initCronJobs = () => {
  // Run every day at midnight (for demo purposes we could run more often)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily SPV analysis cron job...');
    try {
      const spvs = await prisma.sPV.findMany({
        include: {
          financialData: {
            orderBy: { date: 'desc' },
            take: 2
          }
        }
      });

      for (const spv of spvs) {
        if (spv.financialData.length >= 2) {
          const recommendation = analyzeSPV(spv.financialData);
          
          if (recommendation !== spv.recommendation) {
            // Update SPV recommendation
            await prisma.sPV.update({
              where: { id: spv.id },
              data: { recommendation }
            });

            // Create Alert
            await prisma.alert.create({
              data: {
                spvId: spv.id,
                condition: 'Recommendation Changed',
                message: `Recommendation changed from ${spv.recommendation} to ${recommendation} for ${spv.name}`,
              }
            });
            console.log(`Alert generated for ${spv.name}: ${recommendation}`);
          }
        }
      }
    } catch (error) {
      console.error('Error running cron job:', error);
    }
  });
  console.log('Cron jobs initialized');
};
