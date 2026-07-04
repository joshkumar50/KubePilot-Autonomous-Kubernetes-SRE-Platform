import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const LiveTopology = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['topology'],
    queryFn: async () => {
      const res = await apiClient.get('/topology');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Live Topology</h1>
      <div className="p-6 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl">
        {isLoading && <p className="text-slate-400">Loading topology map...</p>}
        {error && <p className="text-enterprise-danger">Error: Failed to fetch topology data</p>}
        {data && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Service Nodes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.nodes && data.nodes.map((node: any) => (
                  <div key={node.id} className="p-4 bg-slate-800 rounded-md border border-slate-600">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-3 h-3 bg-enterprise-success rounded-full animate-pulse"></div>
                      <h3 className="text-lg font-bold text-white">{node.label}</h3>
                    </div>
                    <p className="text-sm text-slate-400">Type: {node.type}</p>
                    <p className="text-sm text-slate-400">ID: {node.id}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Connections</h2>
              <div className="space-y-2">
                {data.edges && data.edges.map((edge: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 bg-slate-800 rounded-md">
                    <span className="text-enterprise-accent font-mono">{edge.source}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-enterprise-success font-mono">{edge.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
