import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ReactFlow, Background, Controls, MarkerType, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface TopologyNode { id: string; type: string; label: string; }
interface TopologyEdge { source: string; target: string; }
interface TopologyData { nodes: TopologyNode[]; edges: TopologyEdge[]; }

const nodePositions: Record<string, { x: number; y: number }> = {
  'dashboard-bff':         { x: 350, y: 20 },
  'api-gateway':           { x: 350, y: 130 },
  'auth-service':          { x: 30,  y: 280 },
  'payment-service':       { x: 190, y: 280 },
  'order-service':         { x: 350, y: 280 },
  'inventory-service':     { x: 510, y: 280 },
  'notification-service':  { x: 670, y: 280 },
  'postgres':              { x: 110, y: 420 },
  'redis':                 { x: 670, y: 20 },
  'ai-copilot':            { x: 870, y: 20 },
  'chaos-controller':      { x: 870, y: 130 },
};

const typeStyle: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  service:   { bg: '#f0fdf4', border: '#86efac', text: '#15803d', dot: '#22c55e' },
  platform:  { bg: '#eef2ff', border: '#a5b4fc', text: '#4338ca', dot: '#6366f1' },
  datastore: { bg: '#fefce8', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
};

const CustomNode = ({ data }: { data: { label: string; nodeType: string } }) => {
  const style = typeStyle[data.nodeType] || typeStyle.service;
  return (
    <div style={{
      background: style.bg,
      border: `1.5px solid ${style.border}`,
      borderRadius: 10,
      padding: '8px 14px',
      minWidth: 130,
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: style.text, fontFamily: 'monospace' }}>
          {data.label}
        </span>
      </div>
      <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, display: 'block' }}>
        {data.nodeType}
      </span>
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

export const LiveTopology = () => {
  const { data, isLoading, error } = useQuery<TopologyData>({
    queryKey: ['topology'],
    queryFn: async () => { const res = await apiClient.get('/topology'); return res.data; }
  });

  const { nodes, edges } = useMemo<{ nodes: Node[]; edges: Edge[] }>(() => {
    if (!data) return { nodes: [], edges: [] };

    const rfNodes: Node[] = data.nodes.map((n) => ({
      id: n.id,
      type: 'custom',
      position: nodePositions[n.id] ?? { x: Math.random() * 600, y: Math.random() * 400 },
      data: { label: n.label, nodeType: n.type },
    }));

    const rfEdges: Edge[] = data.edges.map((e, idx) => ({
      id: `e-${e.source}-${e.target}-${idx}`,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: '#c7d2fe', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1', width: 14, height: 14 },
    }));

    return { nodes: rfNodes, edges: rfEdges };
  }, [data]);

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Legend */}
      <div className="flex items-center gap-4 shrink-0">
        {Object.entries(typeStyle).map(([type, s]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.dot }} />
            <span className="text-xs text-slate-500 capitalize">{type}</span>
          </div>
        ))}
        <span className="text-xs text-slate-400 ml-auto">Drag nodes · Scroll to zoom</span>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden">
        {isLoading && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-slate-400">Loading topology map...</p>
          </div>
        )}
        {error && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-red-500">Failed to load topology data.</p>
          </div>
        )}
        {nodes.length > 0 && (
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.3 }}>
            <Background color="#e2e8f0" gap={20} size={1} />
            <Controls style={{ background: 'white', border: '1px solid #e2e8f0' }} />
          </ReactFlow>
        )}
      </div>
    </div>
  );
};
