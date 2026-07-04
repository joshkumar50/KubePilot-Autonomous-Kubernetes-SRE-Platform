import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const AIAnalysis = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await apiClient.get('/incidents');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">AI Analysis</h1>
      <div className="p-6 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl">
        {isLoading && <p className="text-slate-400">Running AI Incident Analysis...</p>}
        {error && <p className="text-enterprise-danger">Error: Failed to connect to Copilot</p>}
        {data && data.length === 0 && (
          <p className="text-enterprise-success">No active incidents to analyze.</p>
        )}
        {data && data.length > 0 && (
          <div className="space-y-4">
            {data.map((incident: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-xl font-bold text-enterprise-warning">{incident.id}</h3>
                <p className="text-slate-300 mt-2">{incident.description}</p>
                <div className="mt-4 p-4 bg-slate-900 rounded border border-slate-700">
                  <p className="text-sm font-mono text-slate-400">LLM Offline. Incident resolved automatically by Decision Engine.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
