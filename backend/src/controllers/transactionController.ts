import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const executeTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const { spvId, type, amount } = req.body; 
  
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const spv = await prisma.sPV.findUnique({ 
      where: { id: spvId },
      include: { financialData: { orderBy: { date: 'desc' }, take: 1 } }
    });

    if (!user || !spv || !spv.financialData[0]) {
      return res.status(404).json({ error: 'User or SPV not found' });
    }

    const currentPrice = spv.financialData[0].assetValue / 1000000; // Simplified NAV
    const shares = amount / currentPrice;

    if (type === 'Buy') {
      if (user.cashBalance < amount) return res.status(400).json({ error: 'Insufficient funds' });

      // If holding was exited (shares=0), we can just update it
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { cashBalance: { decrement: amount } }
        }),
        prisma.portfolioHolding.upsert({
          where: { userId_spvId: { userId, spvId } },
          update: { shares: { increment: shares }, avgPrice: currentPrice }, // Simplified avg price logic
          create: { userId, spvId, shares, avgPrice: currentPrice }
        }),
        prisma.transaction.create({
          data: { spvId, userId, type, shares, price: currentPrice, total: amount }
        }),
        // Remove from watchlist if bought
        prisma.watchlist.deleteMany({
          where: { userId, spvId }
        })
      ]);
    } else if (type === 'Sell') {
      const holding = await prisma.portfolioHolding.findUnique({
        where: { userId_spvId: { userId, spvId } }
      });

      if (!holding || holding.shares < shares) return res.status(400).json({ error: 'Insufficient shares' });

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { cashBalance: { increment: amount } }
        }),
        prisma.portfolioHolding.update({
          where: { userId_spvId: { userId, spvId } },
          data: { shares: { decrement: shares } }
        }),
        prisma.transaction.create({
          data: { spvId, userId, type, shares, price: currentPrice, total: amount }
        })
      ]);
    }

    res.json({ message: 'Transaction successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Transaction failed' });
  }
};

export const executeBasketTransaction = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const { allocations, totalAmount } = req.body; 
  // allocations: [{spvId, percentage}]

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.cashBalance < totalAmount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const transactionOps: any[] = [
      prisma.user.update({
        where: { id: userId },
        data: { cashBalance: { decrement: totalAmount } }
      })
    ];

    for (const alloc of allocations) {
      const allocAmount = totalAmount * (alloc.percentage / 100);
      
      const spv = await prisma.sPV.findUnique({ 
        where: { id: alloc.spvId },
        include: { financialData: { orderBy: { date: 'desc' }, take: 1 } }
      });
      
      if (spv && spv.financialData[0]) {
        const currentPrice = spv.financialData[0].assetValue / 1000000;
        const shares = allocAmount / currentPrice;

        transactionOps.push(
          prisma.portfolioHolding.upsert({
            where: { userId_spvId: { userId, spvId: alloc.spvId } },
            update: { shares: { increment: shares }, avgPrice: currentPrice },
            create: { userId, spvId: alloc.spvId, shares, avgPrice: currentPrice }
          }),
          prisma.transaction.create({
            data: { spvId: alloc.spvId, userId, type: 'Buy', shares, price: currentPrice, total: allocAmount }
          }),
          prisma.watchlist.deleteMany({
            where: { userId, spvId: alloc.spvId }
          })
        );
      }
    }

    await prisma.$transaction(transactionOps);
    res.json({ message: 'Basket Investment successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Basket transaction failed' });
  }
};
