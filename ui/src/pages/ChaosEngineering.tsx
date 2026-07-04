import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const ChaosEngineering = () => {
  const queryClient = useQueryClient();
  const [selectedScenario, setSelectedScenario] = useState('1');
  const [targetService, setTargetService] = useState('auth-service');

  const { data, isLoading, error } = useQuery({
    queryKey: ['chaos'],
    queryFn: async () => {
      const res = await apiClient.get('/chaos');
      return res.data;
    }
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/chaos/start', {
        scenario_id: selectedScenario,
        target_service: targetService,
        duration_seconds: 60
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chaos'] })
  });

  const scenarios = [
    { id: '1', name: 'Database Lock' },
    { id: '2', name: 'CPU Spike' },
    { id: '3', name: 'Memory Leak' },
    { id: '4', name: 'Network Latency' },
    { id: '5', name: 'Packet Loss' },
    { id: '6', name: 'CrashLoopBackOff' },
    { id: '7', name: 'Pod Crash' },
    { id: '8', name: 'Deployment Failure' },
    { id: '9', name: 'Replica Failure' },
    { id: '10', name: 'Node Drain Simulation' },
    { id: '11', name: 'Redis Failure' },
    { id: '12', name: 'API Gateway Failure' },
    { id: '13', name: 'High Error Rate' },
    { id: '14', name: 'Slow Database Queries' },
    { id: '15', name: 'Cascading Failure' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Chaos Engineering</h1>

      {/* Experiment Launcher */}
      <div className="p-6 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Launch Experiment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Scenario</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white"
            >
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Target Service</label>
            <select
              value={targetService}
              onChange={(e) => setTargetService(e.target.value)}
              className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white"
            >
              <option value="auth-service">Auth Service</option>
              <option value="payment-service">Payment Service</option>
              <option value="order-service">Order Service</option>
              <option value="inventory-service">Inventory Service</option>
              <option value="notification-service">Notification Service</option>
              <option value="all">All Services</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="w-full p-2 bg-enterprise-danger hover:bg-red-600 text-white rounded font-semibold transition disabled:opacity-50"
            >
              {startMutation.isPending ? 'Starting...' : '⚡ Launch Chaos'}
            </button>
          </div>
        </div>
        {startMutation.isSuccess && (
          <p className="mt-3 text-enterprise-success">Experiment started successfully!</p>
        )}
        {startMutation.isError && (
          <p className="mt-3 text-enterprise-danger">Failed to start experiment. Another may already be running.</p>
        )}
      </div>

      {/* Active Experiments */}
      <div className="p-6 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Active Experiments</h2>
        {isLoading && <p className="text-slate-400">Loading chaos status...</p>}
        {error && <p className="text-enterprise-danger">Error: Chaos Controller unavailable</p>}
        {data && !data.error && (
          <>
            {Object.keys(data.active_experiments || {}).length === 0 ? (
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-enterprise-success rounded-full animate-pulse"></div>
                <p className="text-enterprise-success">No active chaos experiments. System is stable.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.active_experiments).map(([id, exp]: [string, any]) => (
                  <div key={id} className="p-4 bg-slate-800 rounded-md border-l-4 border-enterprise-warning">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-mono">{id}</span>
                      <span className="px-2 py-1 bg-enterprise-warning/20 text-enterprise-warning text-xs rounded">Active</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">Scenario: {exp.scenario_id} · Target: {exp.target_service}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {data && data.error && (
          <p className="text-enterprise-danger">{data.error}</p>
        )}
      </div>
    </div>
  );
};
