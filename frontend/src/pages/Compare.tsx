import React, { useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import api from '../api';
import type { FinancialDataPoint, Spv } from '../store/useStore';
import { formatIndianCurrency } from '../utils/formatCurrency';

interface SpvListResponse {
  data: Spv[];
}

const emptyFinancialData: FinancialDataPoint = {
  date: '',
  revenue: 0,
  expenses: 0,
  profit: 0,
  assetValue: 0,
  debt: 0,
  cashFlow: 0,
  irr: 0,
};

const getLatestFinancialData = (spv: Spv) =>
  spv.financialData?.[spv.financialData.length - 1] || emptyFinancialData;

const Compare: React.FC = () => {
  const [allSpvs, setAllSpvs] = useState<Spv[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSPVs = async () => {
      try {
        const response = await api.get<SpvListResponse>('/spvs?limit=100');
        setAllSpvs(response.data.data);
        // Select first 3 by default
        if (response.data.data.length >= 3) {
          setSelectedIds(response.data.data.slice(0, 3).map((s) => s.id));
        }
      } catch (error) {
        console.error('Failed to fetch SPVs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSPVs();
  }, []);

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sId => sId !== id));
    } else {
      if (selectedIds.length < 5) setSelectedIds([...selectedIds, id]);
    }
  };

  if (loading) return <div className="text-white">Loading compare engine...</div>;

  const selectedSpvs = allSpvs.filter(s => selectedIds.includes(s.id));

  // Prepare Radar Chart Data
  const radarData = selectedSpvs.map(spv => {
    const latestFd = getLatestFinancialData(spv);
    return {
      name: spv.name,
      ESG: spv.esgScore,
      IRR: latestFd.irr ? latestFd.irr * 100 : 0,
      Profitability: latestFd.revenue ? (latestFd.profit / latestFd.revenue) * 100 : 0,
      DebtRatio: latestFd.assetValue ? (latestFd.debt / latestFd.assetValue) * 100 : 0,
    };
  });

  // Transform Radar Data for Recharts
  const radarMetrics = ['ESG', 'IRR', 'Profitability', 'DebtRatio'];
  const formattedRadarData = radarMetrics.map(metric => {
    const obj: Record<string, string | number> = { subject: metric };
    radarData.forEach(d => obj[d.name] = d[metric as keyof typeof d]);
    return obj;
  });

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-white">Compare SPVs</h2>
      
      {/* SPV Selector */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select up to 5 SPVs to Compare</h3>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {allSpvs.map(spv => (
            <button
              key={spv.id}
              onClick={() => toggleSelect(spv.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedIds.includes(spv.id) 
                  ? 'bg-primary/20 text-primary border-primary/50' 
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {spv.name}
            </button>
          ))}
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <>
          {/* Side-by-side metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {selectedSpvs.map((spv, index) => {
              const latestFd = getLatestFinancialData(spv);
              return (
                <div key={spv.id} className="glass-panel p-5 border-t-4" style={{ borderTopColor: colors[index % colors.length] }}>
                  <h4 className="text-md font-bold text-white truncate" title={spv.name}>{spv.name}</h4>
                  <p className="text-xs text-gray-400 mt-1 mb-4">{spv.sector}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Risk Score</span>
                      <span className={`text-sm font-semibold ${spv.riskLevel === 'LOW' ? 'text-success' : spv.riskLevel === 'HIGH' ? 'text-danger' : 'text-warning'}`}>{spv.riskLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">ESG Score</span>
                      <span className="text-sm font-semibold text-white">{spv.esgScore.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Asset Valuation</span>
                      <span className="text-sm font-semibold text-white">{formatIndianCurrency(latestFd.assetValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Debt Ratio</span>
                      <span className="text-sm font-semibold text-white">{(latestFd.assetValue ? (latestFd.debt / latestFd.assetValue) * 100 : 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">IRR</span>
                      <span className="text-sm font-semibold text-white">{(latestFd.irr ? latestFd.irr * 100 : 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Multi-Dimensional Analysis</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={formattedRadarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                    <Legend />
                    {selectedSpvs.map((spv, index) => (
                      <Radar key={spv.id} name={spv.name} dataKey={spv.name} stroke={colors[index % colors.length]} fill={colors[index % colors.length]} fillOpacity={0.4} />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Asset Valuation Comparison</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedSpvs.map(s => ({
                    name: s.name.split(' ')[0],
                    AssetValue: s.financialData?.[s.financialData.length - 1]?.assetValue || 0,
                    Debt: s.financialData?.[s.financialData.length - 1]?.debt || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="name" stroke="#6B7280" tick={{fill: '#9CA3AF'}} />
                    <YAxis stroke="#6B7280" tick={{fill: '#9CA3AF'}} tickFormatter={(value) => formatIndianCurrency(value)} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                    <Legend />
                    <Bar dataKey="AssetValue" stackId="a" fill="#3B82F6" />
                    <Bar dataKey="Debt" stackId="a" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-panel p-12 text-center text-gray-400">
          Please select at least one SPV to view the comparison.
        </div>
      )}
    </div>
  );
};

export default Compare;
