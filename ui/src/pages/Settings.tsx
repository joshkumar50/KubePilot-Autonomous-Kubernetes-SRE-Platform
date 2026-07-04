import React from 'react';
import { useStore } from '../store/useStore';

export const Settings = () => {
  const { isPollingActive, setPollingActive } = useStore();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      <div className="p-6 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Platform Configuration</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-md">
            <div>
              <h3 className="text-white font-medium">Live Data Polling</h3>
              <p className="text-sm text-slate-400">Enable or disable real-time data refresh across all pages</p>
            </div>
            <button
              onClick={() => setPollingActive(!isPollingActive)}
              className={`px-4 py-2 rounded font-semibold transition ${
                isPollingActive
                  ? 'bg-enterprise-success text-white'
                  : 'bg-slate-600 text-slate-300'
              }`}
            >
              {isPollingActive ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-md">
            <div>
              <h3 className="text-white font-medium">AI Engine</h3>
              <p className="text-sm text-slate-400">Local Ollama (offline fallback active)</p>
            </div>
            <span className="px-3 py-1 bg-enterprise-warning/20 text-enterprise-warning text-sm rounded">Offline</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-md">
            <div>
              <h3 className="text-white font-medium">Event Bus</h3>
              <p className="text-sm text-slate-400">Redis Streams (kubepilot-system)</p>
            </div>
            <span className="px-3 py-1 bg-enterprise-success/20 text-enterprise-success text-sm rounded">Connected</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-md">
            <div>
              <h3 className="text-white font-medium">Telemetry</h3>
              <p className="text-sm text-slate-400">OpenTelemetry + Prometheus</p>
            </div>
            <span className="px-3 py-1 bg-enterprise-success/20 text-enterprise-success text-sm rounded">Active</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-md">
            <div>
              <h3 className="text-white font-medium">Platform Version</h3>
              <p className="text-sm text-slate-400">KubePilot Autonomous SRE Platform</p>
            </div>
            <span className="text-slate-300 font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
