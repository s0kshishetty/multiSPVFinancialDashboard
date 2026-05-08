import React, { useState } from 'react';
import api from '../api';
import { useStore } from '../store/useStore';
import type { Spv } from '../store/useStore';
import { formatIndianCurrency } from '../utils/formatCurrency';
import { IndianRupee, PieChart, Loader2 } from 'lucide-react';

interface BasketInvestModalProps {
  selectedSpvs: Spv[];
  onClose: () => void;
}

const BasketInvestModal: React.FC<BasketInvestModalProps> = ({ selectedSpvs, onClose }) => {
  const { cashBalance, fetchPortfolio } = useStore();
  const [totalAmount, setTotalAmount] = useState<number>(1000000); // 10 Lakhs default
  const [allocations, setAllocations] = useState<Record<number, number>>(
    selectedSpvs.reduce((acc, spv) => ({ ...acc, [spv.id]: 100 / selectedSpvs.length }), {})
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAllocationChange = (id: number, value: number) => {
    setAllocations(prev => ({ ...prev, [id]: value }));
  };

  const totalPercentage = Object.values(allocations).reduce((a, b) => a + b, 0);

  const handleInvest = async () => {
    if (Math.abs(totalPercentage - 100) > 0.1) {
      setError('Allocations must sum exactly to 100%');
      return;
    }
    if (totalAmount > cashBalance) {
      setError('Insufficient cash balance');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        totalAmount,
        allocations: selectedSpvs.map(spv => ({
          spvId: spv.id,
          percentage: allocations[spv.id]
        }))
      };

      await api.post('/transactions/basket', payload);
      setSuccess(true);
      await fetchPortfolio(); // Live update
      setTimeout(() => onClose(), 2000);
    } catch (err: unknown) {
      const message = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(message || 'Basket transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl p-6 relative border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
          <PieChart className="w-6 h-6 mr-2 text-primary" /> Basket Investment
        </h3>
        <p className="text-gray-400 text-sm mb-6">Allocate capital across {selectedSpvs.length} selected SPVs simultaneously.</p>
        
        <div className="space-y-6">
          <div className="p-4 bg-surface/50 border border-white/5 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">Available Cash Balance</p>
              <p className="text-xl font-bold text-success">{formatIndianCurrency(cashBalance)}</p>
            </div>
            <div className="text-right">
              <label className="block text-sm font-medium text-gray-400 mb-1">Total Investment (INR)</label>
              <div className="relative w-48">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="number" 
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full bg-surface/80 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-semibold text-white">Target Allocations</h4>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${Math.abs(totalPercentage - 100) < 0.1 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                {totalPercentage.toFixed(1)}% Allocated
              </span>
            </div>
            
            <div className="space-y-4">
              {selectedSpvs.map(spv => {
                const allocPct = allocations[spv.id];
                const allocVal = totalAmount * (allocPct / 100);
                return (
                  <div key={spv.id} className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-white">{spv.name}</span>
                      <span className="text-primary font-mono">{formatIndianCurrency(allocVal, false)}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="range" 
                        min="0" max="100" step="1"
                        value={allocPct}
                        onChange={(e) => handleAllocationChange(spv.id, Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="w-16 flex-shrink-0">
                        <input 
                          type="number" 
                          value={allocPct.toFixed(1)}
                          onChange={(e) => handleAllocationChange(spv.id, Number(e.target.value))}
                          className="w-full bg-surface/50 border border-white/10 rounded text-center text-sm text-white py-1"
                        />
                      </div>
                      <span className="text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {error && <div className="mt-6 p-3 bg-danger/20 text-danger rounded-lg text-sm font-medium">{error}</div>}
        {success && <div className="mt-6 p-3 bg-success/20 text-success rounded-lg text-sm font-medium">Basket order executed successfully!</div>}

        <div className="mt-8 flex space-x-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleInvest}
            disabled={loading || success || Math.abs(totalPercentage - 100) > 0.1}
            className="flex-1 py-3 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Execute Basket Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasketInvestModal;
