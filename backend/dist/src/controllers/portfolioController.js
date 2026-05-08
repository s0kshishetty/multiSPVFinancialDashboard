"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToWatchlist = exports.getPortfolioSummary = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getPortfolioSummary = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ error: 'Not authenticated' });
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        // Active Holdings (shares > 0)
        const activeHoldings = await prisma.portfolioHolding.findMany({
            where: { userId, shares: { gt: 0 } },
            include: {
                spv: {
                    include: {
                        parentGroup: true,
                        financialData: { orderBy: { date: 'desc' }, take: 1 }
                    }
                }
            }
        });
        // Exited Positions (shares == 0 but exists in DB or just check transactions)
        // To be precise, if they hold 0 shares but have sold in the past, it's exited.
        const exitedHoldings = await prisma.portfolioHolding.findMany({
            where: { userId, shares: 0 },
            include: {
                spv: {
                    include: {
                        parentGroup: true,
                        financialData: { orderBy: { date: 'desc' }, take: 1 }
                    }
                }
            }
        });
        // Watchlist
        const watchlist = await prisma.watchlist.findMany({
            where: { userId },
            include: {
                spv: {
                    include: {
                        parentGroup: true,
                        financialData: { orderBy: { date: 'desc' }, take: 1 }
                    }
                }
            }
        });
        res.json({
            cashBalance: user?.cashBalance || 0,
            active: activeHoldings,
            exited: exitedHoldings,
            watchlist: watchlist
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch portfolio summary' });
    }
};
exports.getPortfolioSummary = getPortfolioSummary;
const addToWatchlist = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ error: 'Not authenticated' });
    const { spvId } = req.body;
    try {
        await prisma.watchlist.upsert({
            where: { userId_spvId: { userId, spvId } },
            update: {},
            create: { userId, spvId }
        });
        res.json({ message: 'Added to Watchlist' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add to watchlist' });
    }
};
exports.addToWatchlist = addToWatchlist;
