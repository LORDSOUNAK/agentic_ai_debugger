"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface TraceNodeProps {
  name: string;
  type: string;
  status: string;
  latency?: string;
  tokens?: number;
  content?: string;
}

export function TraceNode({ name, type, status, latency, tokens, content }: TraceNodeProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 glass border-l-4 border-l-blue-500 mb-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-blue-400">{type}</span>
          <h4 className="text-sm font-bold text-slate-100">{name}</h4>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {status}
        </span>
      </div>
      <div className="flex gap-4 text-[10px] text-slate-500 mb-3">
        <span>Latency: {latency || 'N/A'}</span>
        <span>Tokens: {tokens || 0}</span>
      </div>
      {content && (
        <div className="bg-black/30 p-3 rounded-lg border border-white/5 font-mono text-[11px] text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
          {content}
        </div>
      )}
    </motion.div>
  );
}

export function TraceTree({ nodes }: { nodes: TraceNodeProps[] }) {
  return (
    <div className="relative pl-8 border-l border-white/10 ml-4 space-y-6">
      {nodes.map((node, i) => (
        <React.Fragment key={i}>
          {/* Connector Dot */}
          <div className="absolute left-[-5px] top-[24px] w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          <TraceNode {...node} />
        </React.Fragment>
      ))}
    </div>
  );
}
