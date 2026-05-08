"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSPVById = exports.getAllSPVs = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllSPVs = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sector = '', status = '', risk = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;
        const whereClause = {
            name: { contains: search, mode: 'insensitive' },
        };
        if (sector)
            whereClause.sector = sector;
        if (status)
            whereClause.status = status;
        if (risk)
            whereClause.riskLevel = risk;
        const spvs = await prisma.sPV.findMany({
            where: whereClause,
            include: {
                parentGroup: true,
                financialData: {
                    orderBy: { date: 'asc' }
                }
            },
            orderBy: { [sortBy]: sortOrder },
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch SPVs' });
    }
};
exports.getAllSPVs = getAllSPVs;
const getSPVById = async (req, res) => {
    try {
        const { id } = req.params;
        const spv = await prisma.sPV.findUnique({
            where: { id: parseInt(id) },
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch SPV details' });
    }
};
exports.getSPVById = getSPVById;
