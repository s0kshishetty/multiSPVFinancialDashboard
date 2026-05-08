"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const recommendationEngine_1 = require("../services/recommendationEngine");
const prisma = new client_1.PrismaClient();
const initCronJobs = () => {
    // Run every day at midnight (for demo purposes we could run more often)
    node_cron_1.default.schedule('0 0 * * *', async () => {
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
                    const recommendation = (0, recommendationEngine_1.analyzeSPV)(spv.financialData);
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
        }
        catch (error) {
            console.error('Error running cron job:', error);
        }
    });
    console.log('Cron jobs initialized');
};
exports.initCronJobs = initCronJobs;
