import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ReactFlow, Background, Controls, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Manual positioning for our known nodes since we don't have dagre installed
const nodePositions: Record<string, { x: number, y: number }> = {
  'dashboard-bff': { x: 350, y: 50 },
  'api-gateway': { x: 350, y: 150 },
  'auth-service': { x: 50, y: 300 },
  'payment-service': { x: 200, y: 300 },
  'order-service': { x: 350, y: 300 },
  'inventory-service': { x: 500, y: 300 },
  'notification-service': { x: 650, y: 300 },
  'postgres': { x: 125, y: 450 },
  'redis': { x: 650, y: 50 },
  'ai-copilot': { x: 850, y: 50 },
  'chaos-controller': { x: 850, y: 150 },
};

const CustomNode = ({ data }: any) => {
  return (
    <div className={`px-4 py-2 rounded-lg border-2 shadow-lg min-w-[150px] text-center ${
      data.type === 'datastore' ? 'bg-slate-800 border-enterprise-warning text-white' :
      data.type === 'platform' ? 'bg-slate-900 border-enterprise-accent text-white' :
      'bg-slate-800 border-enterprise-success text-white'
    }`}>
      <div className="font-bold text-sm">{data.label}</div>
      <div className="text-xs text-slate-400 mt-1">{data.type}</div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export const LiveTopology = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['topology'],
    queryFn: async () => {
      const res = await apiClient.get('/topology');
      return res.data;
    }
  });

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    const rfNodes = data.nodes.map((n: any) => ({
      id: n.id,
      type: 'custom',
      position: nodePositions[n.id] || { x: Math.random() * 500, y: Math.random() * 500 },
      data: { label: n.label, type: n.type }
    }));

    const rfEdges = data.edges.map((e: any, idx: number) => ({
      id: `e-${e.source}-${e.target}-${idx}`,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: '#4f46e5', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#4f46e5',
      },
    }));

    return { nodes: rfNodes, edges: rfEdges };
  }, [data]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-white shrink-0">Live Topology</h1>
      <div className="flex-1 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl overflow-hidden relative min-h-[600px]">
        {isLoading && <p className="text-slate-400 p-6 absolute z-10">Loading topology map...</p>}
        {error && <p className="text-enterprise-danger p-6 absolute z-10">Error: Failed to fetch topology data</p>}
        {nodes.length > 0 && (
          <ReactFlow 
            nodes={nodes} 
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-900"
          >
            <Background color="#334155" gap={16} />
            <Controls className="bg-slate-800 border-slate-700 fill-white" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
};
