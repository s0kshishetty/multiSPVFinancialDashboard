import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AlertCircle, AlertTriangle, Info, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { SOCKET_URL } from '../api';
import type { AlertItem } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get<AlertItem[]>('/alerts');
        setAlerts(response.data);
      } catch (error) {
        console.error('Failed to fetch alerts', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();

    // Connect to WebSocket
    const newSocket = io(SOCKET_URL, { auth: { token } });

    newSocket.on('new_alert', (alert: AlertItem) => {
      setAlerts(prev => [alert, ...prev]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return { bg: 'bg-danger/20', text: 'text-danger', border: 'border-danger/30', icon: AlertCircle };
      case 'MEDIUM': return { bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/30', icon: AlertTriangle };
      case 'LOW': return { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30', icon: Info };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-white/10', icon: Info };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">System Alerts</h2>
          <p className="text-gray-400 mt-2">Real-time risk, maturity, and covenant notifications.</p>
        </div>
        <div className="flex items-center text-sm font-medium">
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          <span className="text-success">Live WebSocket Connected</span>
        </div>
      </div>

      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Active Alerts ({alerts.length})</h3>
          <button className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
            <Check className="w-4 h-4 mr-1" /> Mark All Read
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading alerts...</div>
        ) : (
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No active alerts. Portfolio is fully compliant.</div>
            ) : (
              alerts.map(alert => {
                const styles = getSeverityStyles(alert.severity);
                const Icon = styles.icon;
                return (
                  <div key={alert.id} className={`flex items-start p-5 rounded-xl border ${styles.border} bg-surface/50 hover:bg-white/5 transition-all`}>
                    <div className={`p-3 rounded-lg ${styles.bg} ${styles.text} mr-4 flex-shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-white font-bold text-lg">{alert.condition}</h4>
                        <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${styles.bg} ${styles.text}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-gray-400 mt-1">{alert.message}</p>
                      <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                        {alert.spvId && (
                          <Link to={`/spv/${alert.spvId}`} className="text-primary hover:underline font-medium">View SPV Details</Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
