export const analyzeSPV = (recentData: any[]): 'Buy' | 'Hold' | 'Sell' => {
  if (!recentData || recentData.length < 2) return 'Hold';

  // Sort by date descending
  const sorted = [...recentData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = sorted[0];
  const previous = sorted[1];

  const profitGrowth = (latest.profit - previous.profit) / previous.profit;
  const revenueGrowth = (latest.revenue - previous.revenue) / previous.revenue;

  if (profitGrowth > 0.05 && revenueGrowth > 0.02) {
    return 'Buy';
  } else if (profitGrowth < -0.05 || revenueGrowth < -0.05) {
    return 'Sell';
  }

  return 'Hold';
};
