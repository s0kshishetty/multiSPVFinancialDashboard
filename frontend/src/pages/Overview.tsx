import React, { useCallback, useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Activity, Search, IndianRupee, PieChart, Star, LogOut, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useStore } from '../store/useStore';
import type { Holding, Spv, WatchlistItem } from '../store/useStore';
import { formatIndianCurrency } from '../utils/formatCurrency';
import BasketInvestModal from '../components/BasketInvestModal';

interface SpvListResponse {
  data: Spv[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ChartPoint {
  name: string;
  value: number;
}

const Overview: React.FC = () => {
  // Global Store
  const { cashBalance, activeHoldings, exitedHoldings, watchlist, fetchPortfolio } = useStore();
  
  // Local Data State
  const [opportunities, setOpportunities] = useState<Spv[]>([]);
  const [meta, setMeta] = useState<SpvListResponse['meta']>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'Opportunities' | 'Holdings' | 'Watchlist' | 'Exited'>('Opportunities');
  const [page] = useState(1);
  const [search, setSearch] = useState('');
  const [sectorFilter] = useState('');
  
  // Modals & Selections
  const [selectedForBasket, setSelectedForBasket] = useState<number[]>([]);
  const [showBasketModal, setShowBasketModal] = useState(false);
  
  // Trade Modal
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedSpv, setSelectedSpv] = useState<Spv | null>(null);
  const [tradeType, setTradeType] = useState<'Buy' | 'Sell'>('Buy');
  const [tradeAmount, setTradeAmount] = useState<number>(100000);
  const [tradeStatus, setTradeStatus] = useState<{loading: boolean, error?: string, success?: boolean}>({loading: false});

  const generatePortfolioChart = useCallback((holdings: Holding[]) => {
    // Highly simplified mock chart data based on current holdings for demonstration
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    return months.map(m => ({
      name: m,
      value: holdings.reduce((sum, h) => sum + (h.shares * (((h.spv.financialData?.[0]?.assetValue || 0) / 1000000) * (1 + (Math.random()*0.2 - 0.1)))), 0)
    }));
  }, []);

  // Fetch Opportunities Data
  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<SpvListResponse>(`/spvs?page=${page}&limit=10&search=${search}&sector=${sectorFilter}`);
      
      // Filter out SPVs that are already in Active Holdings or Watchlist
      const activeIds = activeHoldings.map(h => h.spvId);
      const watchlistIds = watchlist.map(w => w.spvId);
      const filteredOpps = response.data.data.filter((spv) => !activeIds.includes(spv.id) && !watchlistIds.includes(spv.id));
      
      setOpportunities(filteredOpps);
      setMeta(response.data.meta);

      // Generate Portfolio Chart Data (Aggregate active holdings NAV over time)
      // Since this requires historical holdings tracking, we'll approximate using the active SPVs' historical NAVs scaled by shares
      if (activeHoldings.length > 0) {
        const cData = generatePortfolioChart(activeHoldings);
        setChartData(cData);
      } else {
        setChartData([]); // Empty if no holdings
      }

    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [activeHoldings, generatePortfolioChart, page, search, sectorFilter, watchlist]);

  useEffect(() => {
    fetchPortfolio(); // Load global state on mount
  }, [fetchPortfolio]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]); // Re-fetch opps if holdings change

  const handleTrade = async () => {
    setTradeStatus({ loading: true });
    try {
      if (!selectedSpv) return;
      await api.post('/transactions', {
        spvId: selectedSpv.id,
        type: tradeType,
        amount: tradeAmount
      });
      setTradeStatus({ loading: false, success: true });
      await fetchPortfolio(); // Trigger global update
      setTimeout(() => setShowTradeModal(false), 2000);
    } catch (err: unknown) {
      const message = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setTradeStatus({ loading: false, error: message || 'Transaction failed' });
    }
  };

  const handleHoldAction = async (spvId: number) => {
    try {
      await api.post('/portfolio/watchlist', { spvId });
      await fetchPortfolio(); // Refresh state immediately
    } catch (err) {
      console.error("Failed to add to watchlist", err);
    }
  };

  const openTradeModal = (spv: Spv, type: 'Buy' | 'Sell') => {
    setSelectedSpv(spv);
    setTradeType(type);
    setTradeStatus({ loading: false, error: undefined, success: undefined });
    setShowTradeModal(true);
  };

  const toggleBasketSelection = (id: number) => {
    if (selectedForBasket.includes(id)) {
      setSelectedForBasket(prev => prev.filter(i => i !== id));
    } else {
      setSelectedForBasket(prev => [...prev, id]);
    }
  };

  const selectedFinancialData = selectedSpv?.financialData || [];
  const selectedLatestAssetValue =
    selectedFinancialData[selectedFinancialData.length - 1]?.assetValue ||
    selectedFinancialData[0]?.assetValue ||
    1000000;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h2>
          <p className="text-gray-400 mt-2">Manage your SPV portfolio and execute transactions.</p>
        </div>
        <div className="glass-panel px-6 py-3 border border-success/20">
          <p className="text-sm font-medium text-gray-400">Available Cash</p>
          <h3 className="text-xl font-bold text-success">{formatIndianCurrency(cashBalance)}</h3>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Active Holdings</p>
              <h3 className="text-2xl font-bold text-white mt-1">{activeHoldings.length}</h3>
            </div>
            <div className="p-3 bg-primary/20 rounded-lg text-primary"><Activity className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Watchlist</p>
              <h3 className="text-2xl font-bold text-white mt-1">{watchlist.length}</h3>
            </div>
            <div className="p-3 bg-warning/20 rounded-lg text-warning"><Star className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Exited Positions</p>
              <h3 className="text-2xl font-bold text-white mt-1">{exitedHoldings.length}</h3>
            </div>
            <div className="p-3 bg-gray-500/20 rounded-lg text-gray-400"><LogOut className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      {/* Live Portfolio Chart */}
      {chartData.length > 0 && (
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Portfolio Valuation Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6B7280" tick={{fill: '#9CA3AF'}} />
                <YAxis stroke="#6B7280" tick={{fill: '#9CA3AF'}} tickFormatter={(val) => formatIndianCurrency(val*1000000)} />
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Data Grid with Tabs */}
      <div className="glass-panel overflow-hidden flex flex-col">
        {/* Tab Header */}
        <div className="flex border-b border-white/10 px-6 pt-4 space-x-6">
          {(['Opportunities', 'Holdings', 'Watchlist', 'Exited'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
            >
              {tab} 
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/5 text-xs font-medium">
                {tab === 'Opportunities' ? meta.total || 0 : tab === 'Holdings' ? activeHoldings.length : tab === 'Watchlist' ? watchlist.length : exitedHoldings.length}
              </span>
            </button>
          ))}
        </div>

        {/* Filters & Basket Actions (Only for Opportunities) */}
        {activeTab === 'Opportunities' && (
          <div className="p-4 bg-surface/50 border-b border-white/5 flex justify-between items-center">
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" placeholder="Search..." 
                  className="w-full bg-surface/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {selectedForBasket.length > 0 && (
                <button 
                  onClick={() => setShowBasketModal(true)}
                  className="flex items-center px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg text-sm font-bold transition-colors border border-primary/30"
                >
                  <PieChart className="w-4 h-4 mr-2" />
                  Basket Invest ({selectedForBasket.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-xs uppercase text-gray-300 border-b border-white/10">
              <tr>
                {activeTab === 'Opportunities' && <th className="px-6 py-4 w-12"></th>}
                <th className="px-6 py-4">Parent Group</th>
                <th className="px-6 py-4">SPV Name</th>
                {activeTab === 'Opportunities' && <th className="px-6 py-4">Sector</th>}
                <th className="px-6 py-4">Current NAV</th>
                {activeTab === 'Holdings' && <th className="px-6 py-4">Avg Cost</th>}
                {activeTab === 'Holdings' && <th className="px-6 py-4">Shares Owned</th>}
                {activeTab === 'Holdings' && <th className="px-6 py-4">Unrealized P&L</th>}
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={activeTab === 'Holdings' ? 7 : activeTab === 'Opportunities' ? 6 : 4} className="px-6 py-8 text-center text-gray-400">
                    Loading data...
                  </td>
                </tr>
              )}
              {/* Opportunities View */}
              {activeTab === 'Opportunities' && opportunities.map(spv => {
                const latestFd = spv.financialData?.[spv.financialData.length - 1];
                return (
                  <tr key={spv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedForBasket.includes(spv.id)}
                        onChange={() => toggleBasketSelection(spv.id)}
                        className="rounded border-gray-600 bg-surface/50 text-primary focus:ring-primary h-4 w-4"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{spv.parentGroup?.name || 'Independent'}</td>
                    <td className="px-6 py-4 font-medium text-white"><Link to={`/spv/${spv.id}`} className="hover:text-primary">{spv.name}</Link></td>
                    <td className="px-6 py-4">{spv.sector}</td>
                    <td className="px-6 py-4 font-mono text-white">{formatIndianCurrency(latestFd?.assetValue || 0)}</td>
                    <td className="px-6 py-4 space-x-2">
                      <button onClick={() => openTradeModal(spv, 'Buy')} className="px-3 py-1 bg-success/20 text-success hover:bg-success hover:text-white rounded transition-colors text-xs font-bold">BUY</button>
                      <button onClick={() => handleHoldAction(spv.id)} className="px-3 py-1 bg-warning/20 text-warning hover:bg-warning hover:text-white rounded transition-colors text-xs font-bold">HOLD</button>
                    </td>
                  </tr>
                );
              })}

              {/* Holdings View */}
              {activeTab === 'Holdings' && activeHoldings.map((h: Holding) => {
                const spv = h.spv;
                const latestNav = (spv.financialData?.[0]?.assetValue || 0) / 1000000;
                const pnl = (latestNav - h.avgPrice) * h.shares;
                const pnlPct = ((latestNav - h.avgPrice) / h.avgPrice) * 100;
                
                return (
                  <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-gray-400 text-xs">{spv.parentGroup?.name || 'Independent'}</td>
                    <td className="px-6 py-4 font-medium text-white"><Link to={`/spv/${spv.id}`} className="hover:text-primary">{spv.name}</Link></td>
                    <td className="px-6 py-4 font-mono text-white">{formatIndianCurrency(latestNav * 1000000, false)}</td>
                    <td className="px-6 py-4 font-mono text-gray-400">{formatIndianCurrency(h.avgPrice * 1000000, false)}</td>
                    <td className="px-6 py-4 font-mono text-white">{h.shares.toFixed(4)}</td>
                    <td className="px-6 py-4 font-mono">
                      <span className={pnl >= 0 ? 'text-success' : 'text-danger'}>
                        {formatIndianCurrency(pnl * 1000000, false)} ({pnlPct.toFixed(2)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2 flex">
                      <button onClick={() => openTradeModal(spv, 'Buy')} className="px-3 py-1 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded transition-colors text-xs font-bold">ADD MORE</button>
                      <button onClick={() => openTradeModal(spv, 'Sell')} className="px-3 py-1 bg-danger/20 text-danger hover:bg-danger hover:text-white rounded transition-colors text-xs font-bold">SELL</button>
                    </td>
                  </tr>
                );
              })}

              {/* Watchlist View */}
              {activeTab === 'Watchlist' && watchlist.map((w: WatchlistItem) => {
                const spv = w.spv;
                const latestFd = spv.financialData?.[0];
                return (
                  <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-gray-400 text-xs">{spv.parentGroup?.name || 'Independent'}</td>
                    <td className="px-6 py-4 font-medium text-white"><Link to={`/spv/${spv.id}`} className="hover:text-primary">{spv.name}</Link></td>
                    <td className="px-6 py-4 font-mono text-white">{formatIndianCurrency(latestFd?.assetValue || 0)}</td>
                    <td className="px-6 py-4 space-x-2">
                      <button onClick={() => openTradeModal(spv, 'Buy')} className="px-3 py-1 bg-success/20 text-success hover:bg-success hover:text-white rounded transition-colors text-xs font-bold">BUY</button>
                      <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded text-xs font-bold">HELD</span>
                    </td>
                  </tr>
                );
              })}
              
              {/* Exited View */}
              {activeTab === 'Exited' && exitedHoldings.map((h: Holding) => {
                const spv = h.spv;
                return (
                  <tr key={h.id} className="hover:bg-white/[0.02] opacity-50">
                    <td className="px-6 py-4 text-gray-400 text-xs">{spv.parentGroup?.name || 'Independent'}</td>
                    <td className="px-6 py-4 font-medium text-white"><Link to={`/spv/${spv.id}`} className="hover:text-primary">{spv.name}</Link></td>
                    <td className="px-6 py-4 font-mono text-white">Closed</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded text-xs font-bold">EXITED</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single SPV Trade Modal */}
      {showTradeModal && selectedSpv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 relative border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">{tradeType} Order</h3>
            <p className="text-gray-400 text-sm mb-6">{selectedSpv.name}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Amount (INR)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="number" 
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(Number(e.target.value))}
                    className="w-full bg-surface/80 border border-white/10 rounded-lg pl-9 pr-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-surface/50 rounded-lg border border-white/5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Current NAV</span>
                <span className="text-white font-mono">{formatIndianCurrency(selectedSpv?.financialData?.[0]?.assetValue || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Estimated Units</span>
                <span className="text-white font-mono">{(tradeAmount / (selectedLatestAssetValue / 1000000)).toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Allocation % (of Cash)</span>
                <span className="text-white font-mono">{cashBalance > 0 ? ((tradeAmount / cashBalance) * 100).toFixed(2) : '0.00'}%</span>
              </div>
            </div>

            {tradeStatus.error && <div className="mt-4 p-3 bg-danger/20 text-danger rounded-lg text-sm">{tradeStatus.error}</div>}
            {tradeStatus.success && <div className="mt-4 p-3 bg-success/20 text-success rounded-lg text-sm">Transaction executed successfully!</div>}

            <div className="mt-8 flex space-x-3">
              <button onClick={() => setShowTradeModal(false)} className="flex-1 py-3 px-4 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-medium">Cancel</button>
              <button 
                onClick={handleTrade}
                disabled={tradeStatus.loading || tradeStatus.success}
                className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${tradeType === 'Buy' ? 'bg-success hover:bg-success/90 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-danger hover:bg-danger/90 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'} disabled:opacity-50`}
              >
                {tradeStatus.loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Confirm ${tradeType}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Basket Investment Modal */}
      {showBasketModal && (
        <BasketInvestModal 
          selectedSpvs={opportunities.filter(s => selectedForBasket.includes(s.id))} 
          onClose={() => {
            setShowBasketModal(false);
            setSelectedForBasket([]);
          }} 
        />
      )}
    </div>
  );
};

export default Overview;
