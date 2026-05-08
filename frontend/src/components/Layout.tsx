import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart2, Bell, Settings, CheckCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Compare', path: '/compare', icon: BarChart2 },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-[#0B0F19] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-surface/50 border-r border-white/5 backdrop-blur-xl flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Nexus SPV
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
          <Link to="/tests" className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            location.pathname === '/tests' ? 'bg-primary/20 text-primary shadow-[inset_2px_0_0_0_#3B82F6]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}>
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Tests</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="px-4 pb-3 text-xs text-gray-500 truncate">{user?.email}</div>
          <Link to="/settings" className={`flex items-center space-x-3 px-4 py-3 w-full rounded-xl transition-all ${
            location.pathname === '/settings' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}>
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="mt-2 flex items-center space-x-3 px-4 py-3 w-full rounded-xl transition-all text-gray-400 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface via-[#0B0F19] to-[#0B0F19]">
        <div className="p-8 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
