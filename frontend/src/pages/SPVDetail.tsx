import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../api';
import type { AlertItem, FinancialDataPoint, Spv } from '../store/useStore';
import { formatIndianCurrency } from '../utils/formatCurrency';

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

const SPVDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [spv, setSpv] = useState<Spv | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSPV = async () => {
      try {
        const response = await api.get<Spv>(`/spvs/${id}`);
        setSpv(response.data);
      } catch (error) {
        console.error('Failed to fetch SPV details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSPV();
  }, [id]);

  if (loading) {
    return <div className="text-white">Loading SPV details...</div>;
  }

  if (!spv) {
    return <div className="text-white">SPV not found.</div>;
  }

  const latestData = spv.financialData?.[spv.financialData.length - 1] || emptyFinancialData;
  const prevData = spv.financialData?.[spv.financialData.length - 2] || emptyFinancialData;
  
  const profitGrowth = prevData.profit ? ((latestData.profit - prevData.profit) / prevData.profit) * 100 : 0;
  const revenueGrowth = prevData.revenue ? ((latestData.revenue - prevData.revenue) / prevData.revenue) * 100 : 0;

  const chartData = spv.financialData?.map((fd: FinancialDataPoint) => ({
    name: new Date(fd.date).toLocaleString('default', { month: 'short' }),
    revenue: fd.revenue,
    profit: fd.profit,
    expenses: fd.expenses,
    assetValue: fd.assetValue
  })) || [];

  return (
    <div className="space-y-6">
      <Link to="/" className="flex items-center text-gray-400 hover:text-white transition-colors w-fit">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">{spv.name}</h2>
          <p className="text-gray-400 mt-2">{spv.description}</p>
        </div>
        <div className="flex gap-3">
          <span className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider ${
            spv.recommendation === 'Buy' ? 'bg-success/20 text-success' :
            spv.recommendation === 'Sell' ? 'bg-danger/20 text-danger' :
            'bg-gray-600/20 text-gray-400'
          }`}>
            Recommendation: {spv.recommendation}
          </span>
          <span className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider ${
            spv.status === 'Healthy' ? 'bg-success/10 text-success border border-success/20' : 
            spv.status === 'Warning' ? 'bg-warning/10 text-warning border border-warning/20' :
            'bg-danger/10 text-danger border border-danger/20'
          }`}>
            Status: {spv.status}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6">
          <p className="text-sm font-medium text-gray-400">Current AUM</p>
          <h3 className="text-2xl font-bold text-white mt-1">{formatIndianCurrency(latestData.assetValue)}</h3>
        </div>
        <div className="glass-panel p-6">
          <p className="text-sm font-medium text-gray-400">Latest Revenue</p>
          <div className="flex items-center mt-1">
            <h3 className="text-2xl font-bold text-white">{formatIndianCurrency(latestData.revenue)}</h3>
            {revenueGrowth !== 0 && (
              <span className={`ml-3 flex items-center text-sm font-medium ${revenueGrowth > 0 ? 'text-success' : 'text-danger'}`}>
                {revenueGrowth > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(revenueGrowth).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div className="glass-panel p-6">
          <p className="text-sm font-medium text-gray-400">Latest Profit</p>
          <div className="flex items-center mt-1">
            <h3 className="text-2xl font-bold text-white">{formatIndianCurrency(latestData.profit)}</h3>
            {profitGrowth !== 0 && (
              <span className={`ml-3 flex items-center text-sm font-medium ${profitGrowth > 0 ? 'text-success' : 'text-danger'}`}>
                {profitGrowth > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(profitGrowth).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div className="glass-panel p-6">
          <p className="text-sm font-medium text-gray-400">SPV Type</p>
          <h3 className="text-xl font-semibold text-white mt-2">{spv.type}</h3>
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Financial Performance Trend</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="name" stroke="#6B7280" tick={{fill: '#9CA3AF'}} />
              <YAxis stroke="#6B7280" tick={{fill: '#9CA3AF'}} tickFormatter={(val) => formatIndianCurrency(val)} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff', borderRadius: '0.5rem' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }} />
              <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Recent Alerts */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
        </div>
        <div className="p-6">
          {spv.alerts && spv.alerts.length > 0 ? (
            <div className="space-y-4">
              {spv.alerts.map((alert: AlertItem) => (
                <div key={alert.id} className="flex items-start p-4 rounded-lg bg-white/5 border border-white/10">
                  <AlertCircle className="w-5 h-5 text-warning mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">{alert.condition}</h4>
                    <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-2">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No recent alerts for this SPV.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SPVDetail;
