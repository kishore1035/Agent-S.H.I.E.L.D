import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, X, Check, Shield, Wrench, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { workflowShape, workflowSpec } from '../workflows';
import type { NodeKey, NodeStatus, WorkflowProgress } from '../types';

interface WorkflowDagProps {
  activeAgent: string;
  onSelectAgent: (agentId: string) => void;
  progress?: Record<string, WorkflowProgress>;
}

const AGENTS = [
  { id: 'coding-agent', name: 'Coding Agent', role: 'Python Sandbox & Healing' },
  { id: 'research-agent', name: 'Research Agent', role: 'Web & Context Synthesis' },
  { id: 'data-agent', name: 'Data Agent', role: 'CSV/SQL Analytics' },
  { id: 'ops-agent', name: 'Ops Agent', role: 'Container & Deployment' },
];

export const WorkflowDag: React.FC<WorkflowDagProps> = ({
  activeAgent,
  onSelectAgent,
  progress = {},
}) => {
  const [selectedNodeKey, setSelectedNodeKey] = useState<NodeKey | null>(null);

  const shape = workflowShape(activeAgent);
  const spec = workflowSpec(activeAgent);
  const agentProgress = progress[activeAgent] || {};

  const selectedNode = shape.nodes.find((n) => n.key === selectedNodeKey);

  const getNodeStatus = (key: NodeKey): NodeStatus => {
    return agentProgress[key] || 'pending';
  };

  const statusColors: Record<NodeStatus, { bg: string; border: string; text: string; dot: string; stroke: string }> = {
    pending: { bg: 'bg-[#222634]/80', border: 'border-[#4f5d75]/50', text: 'text-[#bfc0c0]', dot: 'bg-[#4f5d75]', stroke: '#4f5d75' },
    routed: { bg: 'bg-[#4f5d75]/30', border: 'border-[#bfc0c0]/50', text: 'text-[#ffffff]', dot: 'bg-[#bfc0c0]', stroke: '#bfc0c0' },
    sandbox: { bg: 'bg-[#ef8354]/15', border: 'border-[#ef8354]/40', text: 'text-[#ef8354]', dot: 'bg-[#ef8354]', stroke: '#ef8354' },
    healed: { bg: 'bg-[#ef8354]/25', border: 'border-[#ef8354]/60', text: 'text-[#ffffff]', dot: 'bg-[#ffffff]', stroke: '#ef8354' },
    completed: { bg: 'bg-[#ef8354]/20', border: 'border-[#ef8354]/60', text: 'text-[#ef8354]', dot: 'bg-[#ef8354]', stroke: '#ef8354' },
    error: { bg: 'bg-rose-950/40', border: 'border-rose-600/60', text: 'text-rose-300', dot: 'bg-rose-400', stroke: '#f43f5e' },
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-[#4f5d75]/60 relative overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#4f5d75]/50">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#ef8354]" />
            <h2 id="workflow-title" className="text-base font-bold text-[#ffffff]">
              Specialist Agent Workflow Graph
            </h2>
          </div>
          <p id="workflow-subtitle" className="text-xs text-[#bfc0c0] mt-0.5">
            Select an agent to inspect its internal routing, execution pipeline, and sandbox boundaries.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#bfc0c0]" aria-label="Node status legend">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4f5d75]" />Pending</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#bfc0c0]" />Routed</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef8354]" />Sandbox</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ffffff]" />Healed</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef8354] shadow-[0_0_6px_#ef8354]" />Completed</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />Error</span>
        </div>
      </div>

      {/* Agent Selector Tabs */}
      <div id="workflow-tabs" className="flex flex-wrap gap-2 my-4 p-1.5 rounded-xl bg-[#222634] border border-[#4f5d75]/50">
        {AGENTS.map((ag) => {
          const isActive = activeAgent === ag.id;
          return (
            <button
              key={ag.id}
              type="button"
              data-workflow-agent={ag.id}
              onClick={() => {
                onSelectAgent(ag.id);
                setSelectedNodeKey(null);
              }}
              className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg text-xs transition-all relative ${
                isActive
                  ? 'bg-[#4f5d75] text-[#ffffff] font-semibold shadow-md border border-[#ef8354]/40'
                  : 'text-[#bfc0c0] hover:text-[#ffffff] hover:bg-[#4f5d75]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{ag.name}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#ef8354] shadow-[0_0_8px_#ef8354] animate-pulse" />
                )}
              </div>
              <div className="text-[10px] text-[#bfc0c0]/70 text-left truncate font-normal mt-0.5">
                {ag.role}
              </div>
            </button>
          );
        })}
      </div>

      {/* DAG Flow Canvas */}
      <div className="relative w-full max-w-full overflow-x-auto min-h-[300px] p-4 rounded-xl bg-[#222634]/90 border border-[#4f5d75]/40">
        <svg
          viewBox="0 0 1180 300"
          className="min-w-[900px] h-[280px]"
          style={{ overflow: 'visible' }}
        >
          {/* Connector Edges */}
          {shape.edges.map(([fromKey, toKey], idx) => {
            const fromNode = shape.nodes.find((n) => n.key === fromKey);
            const toNode = shape.nodes.find((n) => n.key === toKey);
            if (!fromNode || !toNode) return null;

            const startX = fromNode.x + 130;
            const startY = fromNode.y + 24;
            const endX = toNode.x;
            const endY = toNode.y + 24;
            const midX = (startX + endX) / 2;

            const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
            const isCompleted = getNodeStatus(toKey) === 'completed';

            return (
              <g key={idx}>
                <path
                  d={d}
                  fill="none"
                  stroke={isCompleted ? '#ef8354' : '#4f5d75'}
                  strokeWidth="2"
                  opacity={isCompleted ? 0.95 : 0.4}
                />
                <path
                  d={d}
                  fill="none"
                  stroke={isCompleted ? '#ef8354' : '#bfc0c0'}
                  strokeWidth="1.5"
                  className={isCompleted ? '' : 'flowing-stroke'}
                />
              </g>
            );
          })}

          {/* Interactive DAG Nodes */}
          {shape.nodes.map((node) => {
            const status = getNodeStatus(node.key);
            const color = statusColors[status];
            const isSelected = selectedNodeKey === node.key;

            return (
              <g
                key={node.key}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNodeKey(node.key)}
                className="cursor-pointer group"
              >
                {/* Selected Aura */}
                {isSelected && (
                  <rect
                    x="-6"
                    y="-6"
                    width="142"
                    height="60"
                    rx="14"
                    fill="none"
                    stroke="#ef8354"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-spin"
                    style={{ transformOrigin: '65px 24px' }}
                  />
                )}

                <foreignObject width="130" height="48">
                  <button
                    type="button"
                    data-workflow-node={node.key}
                    data-status={status}
                    className={`workflow-node w-full h-full rounded-xl p-2 flex flex-col justify-center border transition-all text-left ${color.bg} ${color.border} ${
                      isSelected ? 'ring-2 ring-[#ef8354] shadow-[0_0_20px_rgba(239,131,84,0.3)]' : 'hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="font-semibold text-xs text-[#ffffff] truncate">
                        {node.title}
                      </span>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
                    </div>
                    <div className={`text-[10px] font-mono capitalize truncate mt-0.5 ${color.text}`}>
                      {status}
                    </div>
                  </button>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Inspector Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            id="workflow-inspector"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-xl bg-[#222634] border border-[#ef8354]/40 overflow-hidden shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#ef8354]/15 text-[#ef8354] border border-[#ef8354]/30">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#ffffff]">
                    Worker: <span className="text-[#ef8354]">{activeAgent}</span> · Node: {selectedNode.title} ({selectedNode.key})
                  </h4>
                  <p className="text-xs text-[#bfc0c0] font-mono">
                    Status: <span className="text-[#ef8354] font-semibold">{getNodeStatus(selectedNode.key)}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="workflow-inspector-close"
                onClick={() => setSelectedNodeKey(null)}
                className="text-[#bfc0c0] hover:text-[#ffffff] p-1.5 rounded-lg hover:bg-[#4f5d75]/30 flex items-center gap-1 text-xs"
              >
                <span>Close</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#bfc0c0] mt-2 leading-relaxed">
              {selectedNode.description || 'Internal pipeline stage coordinating sandbox execution and deterministic boundary checks.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
