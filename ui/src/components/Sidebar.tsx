import { Link } from 'react-router-dom';
import { Activity, Server, Share2, AlertCircle, Brain, RefreshCw, Zap, Eye, History, Settings } from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Activity },
    { name: 'Cluster View', path: '/cluster', icon: Server },
    { name: 'Live Topology', path: '/topology', icon: Share2 },
    { name: 'Incident Center', path: '/incidents', icon: AlertCircle },
    { name: 'AI Analysis', path: '/ai', icon: Brain },
    { name: 'Recovery Center', path: '/recovery', icon: RefreshCw },
    { name: 'Chaos Engineering', path: '/chaos', icon: Zap },
    { name: 'Observability', path: '/observability', icon: Eye },
    { name: 'Audit Center', path: '/audit', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-enterprise-card h-screen border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700 flex items-center space-x-2">
        <Server className="text-enterprise-accent" />
        <span className="text-xl font-bold text-white">KubePilot</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className="flex items-center space-x-3 p-2 rounded hover:bg-slate-700 transition">
              <Icon size={18} className="text-slate-400" />
              <span className="text-slate-300">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  );
};
