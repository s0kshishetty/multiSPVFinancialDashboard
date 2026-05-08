"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveAlerts = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getActiveAlerts = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ error: 'Not authenticated' });
    try {
        const alerts = await prisma.alert.findMany({
            where: {
                isActive: true,
                OR: [
                    { userId },
                    { userId: null }
                ]
            },
            include: { spv: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(alerts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
};
exports.getActiveAlerts = getActiveAlerts;
