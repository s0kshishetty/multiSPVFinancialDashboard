import React, { useState } from 'react';
import { User, Bell, Shield, Sliders, Moon, Sun, Key } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState('dark');
  const [riskThreshold, setRiskThreshold] = useState('Medium');

  const handleSave = () => {
    alert("Settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-white">Platform Settings</h2>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'profile' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <User className="w-5 h-5 mr-3" /> Profile
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'notifications' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Bell className="w-5 h-5 mr-3" /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'preferences' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Sliders className="w-5 h-5 mr-3" /> Preferences
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'security' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Shield className="w-5 h-5 mr-3" /> Security
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'api' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
          >
            <Key className="w-5 h-5 mr-3" /> API Keys
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 glass-panel p-8">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                  <input type="text" defaultValue="John" className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                  <input type="text" defaultValue="Doe" className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                  <input type="email" defaultValue="investor@nexus.com" disabled className="w-full bg-surface/30 border border-white/5 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">Platform Preferences</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Theme</label>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex items-center px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-primary/20 border-primary text-white' : 'bg-surface/50 border-white/10 text-gray-400'}`}
                  >
                    <Moon className="w-4 h-4 mr-2" /> Dark Mode
                  </button>
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex items-center px-4 py-2 rounded-lg border ${theme === 'light' ? 'bg-primary/20 border-primary text-white' : 'bg-surface/50 border-white/10 text-gray-400'}`}
                  >
                    <Sun className="w-4 h-4 mr-2" /> Light Mode
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Light mode is coming in a future update.</p>
              </div>

              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-400 mb-3">Global Risk Threshold</label>
                <select 
                  value={riskThreshold}
                  onChange={(e) => setRiskThreshold(e.target.value)}
                  className="w-full md:w-1/2 bg-surface/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                >
                  <option value="Low">Low Tolerance (Alert heavily)</option>
                  <option value="Medium">Medium Tolerance</option>
                  <option value="High">High Tolerance (Alert minimally)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">Adjusting this will change how aggressively the Recommendation Engine suggests selling.</p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">Notification Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="form-checkbox h-5 w-5 text-primary rounded border-white/20 bg-surface/50 focus:ring-primary focus:ring-offset-surface" />
                  <span className="text-gray-300">Email alerts for Critical events</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="form-checkbox h-5 w-5 text-primary rounded border-white/20 bg-surface/50 focus:ring-primary focus:ring-offset-surface" />
                  <span className="text-gray-300">Push notifications for Trade Executions</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" className="form-checkbox h-5 w-5 text-primary rounded border-white/20 bg-surface/50 focus:ring-primary focus:ring-offset-surface" />
                  <span className="text-gray-300">Weekly Portfolio Summary Report</span>
                </label>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
            <button onClick={handleSave} className="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
