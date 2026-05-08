import { create } from 'zustand';
import api from '../api';

export interface FinancialDataPoint {
  id?: number;
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  assetValue: number;
  debt: number;
  cashFlow: number;
  irr: number;
}

export interface ParentGroup {
  id?: number;
  name: string;
  sector?: string;
}

export interface Spv {
  id: number;
  name: string;
  type: string;
  sector: string;
  description: string;
  riskLevel: string;
  esgScore: number;
  status: string;
  recommendation: string;
  parentGroup?: ParentGroup | null;
  financialData?: FinancialDataPoint[];
  alerts?: AlertItem[];
}

export interface Holding {
  id: number;
  spvId: number;
  shares: number;
  avgPrice: number;
  spv: Spv;
}

export interface WatchlistItem {
  id: number;
  spvId: number;
  spv: Spv;
}

export interface AlertItem {
  id: number | string;
  spvId: number;
  userId?: number;
  condition: string;
  message: string;
  severity: string;
  createdAt: string;
  spv?: Spv;
}

interface PortfolioResponse {
  cashBalance: number;
  active: Holding[];
  exited: Holding[];
  watchlist: WatchlistItem[];
}

interface PortfolioState {
  cashBalance: number;
  activeHoldings: Holding[];
  exitedHoldings: Holding[];
  watchlist: WatchlistItem[];
  loading: boolean;
  fetchPortfolio: () => Promise<void>;
}

export const useStore = create<PortfolioState>((set) => ({
  cashBalance: 0,
  activeHoldings: [],
  exitedHoldings: [],
  watchlist: [],
  loading: false,

  fetchPortfolio: async () => {
    set({ loading: true });
    try {
      const response = await api.get<PortfolioResponse>('/portfolio');
      set({
        cashBalance: response.data.cashBalance,
        activeHoldings: response.data.active,
        exitedHoldings: response.data.exited,
        watchlist: response.data.watchlist,
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch portfolio', error);
      set({ loading: false });
    }
  }
}));
