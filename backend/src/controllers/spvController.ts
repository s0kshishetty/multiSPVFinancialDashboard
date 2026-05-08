import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllSPVs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', sector = '', status = '', risk = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const whereClause: any = {
      name: { contains: search as string, mode: 'insensitive' },
    };

    if (sector) whereClause.sector = sector;
    if (status) whereClause.status = status;
    if (risk) whereClause.riskLevel = risk;

    const spvs = await prisma.sPV.findMany({
      where: whereClause,
      include: {
        parentGroup: true,
        financialData: {
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { [sortBy as string]: sortOrder },
      skip,
      take: limitNumber,
    });

    const total = await prisma.sPV.count({ where: whereClause });

    res.json({
      data: spvs,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SPVs' });
  }
};

export const getSPVById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const spv = await prisma.sPV.findUnique({
      where: { id: parseInt(id as string) },
      include: {
        parentGroup: true,
        financialData: {
          orderBy: { date: 'asc' }
        },
        alerts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!spv) {
      return res.status(404).json({ error: 'SPV not found' });
    }
    
    res.json(spv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SPV details' });
  }
};
