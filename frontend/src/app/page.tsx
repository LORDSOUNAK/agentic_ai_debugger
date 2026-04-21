"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TraceTree } from '@/components/TraceTree';

export default function Dashboard() {
  const [traces, setTraces] = useState<any[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [traceDetail, setTraceDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/traces');
        const data = await response.json();
        setTraces(data.traces || []);
      } catch (error) {
        console.error("Failed to fetch traces", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    if (traces.length === 0) return { total: "0", latency: "0s", success: "0%", cost: "$0.00" };
    
    const latencies = traces.map(t => t.latency || 0).filter(l => l > 0);
    const avgLatency = latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) : "0";
    const totalCost = traces.reduce((a, b) => a + (b.totalCost || 0), 0).toFixed(4);
    
    return {
      total: traces.length.toString(),
      latency: `${avgLatency}s`,
      success: "100%", // Simplified for now
      cost: `$${totalCost}`
    };
  }, [traces]);

  const handleTraceClick = async (id: string) => {
    setSelectedTraceId(id);
    setTraceDetail(null);
    try {
      const response = await fetch(`http://localhost:8000/traces/${id}`);
      const data = await response.json();
      setTraceDetail(data.trace);
    } catch (error) {
      console.error("Failed to fetch trace details", error);
    }
  };

  const parsedNodes = useMemo(() => {
    if (!traceDetail || !traceDetail.observations) return [];
    
    return traceDetail.observations.map((obs: any) => ({
      name: obs.name || "Step",
      type: obs.type || "node",
      status: "success", // Map from obs if available
      latency: obs.latency ? `${obs.latency.toFixed(2)}s` : "N/A",
      tokens: obs.usage?.totalTokens || 0,
      content: obs.output ? (typeof obs.output === 'string' ? obs.output : JSON.stringify(obs.output, null, 2)) : ""
    }));
  }, [traceDetail]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);

  const handleRunAgent = async () => {
    setRunning(true);
    try {
      await fetch('http://localhost:8000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      setIsModalOpen(false);
      setQuery("");
      // Refresh traces
      const response = await fetch('http://localhost:8000/traces');
      const data = await response.json();
      setTraces(data.traces || []);
    } catch (error) {
      console.error("Failed to run agent", error);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-10">
      {/* Run Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg glass p-8 shadow-2xl border-blue-500/30"
          >
            <h2 className="text-xl font-bold mb-6">Run New Agent Task</h2>
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query for the agent..."
              className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors mb-6 resize-none"
            />
            <div className="flex gap-4 justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
                disabled={running}
              >
                Cancel
              </button>
              <button 
                onClick={handleRunAgent}
                className="bg-blue-600 hover:bg-blue-500 px-8 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={running || !query.trim()}
              >
                {running ? "Executing..." : "Run Task"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Header Extension for Page-specific Trigger */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Debugger Overview</h1>
          <p className="text-slate-400 text-sm">Monitor and debug your agentic traces in real-time.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_25px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95"
        >
          Run New Task
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Traces" value={stats.total} change="+100%" />
        <StatCard title="Avg Latency" value={stats.latency} change="-5%" neutral />
        <StatCard title="Success Rate" value={stats.success} change="+0%" />
        <StatCard title="Est. Cost" value={stats.cost} change="+$0.01" neutral />
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Traces Table */}
        <div className="xl:col-span-2 glass p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Recent Traces</h2>
            <button className="text-sm text-blue-400 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 px-4">Trace ID</th>
                  <th className="pb-3 px-4">Name</th>
                  <th className="pb-3 px-4">Latency</th>
                  <th className="pb-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {traces.map((trace) => (
                  <tr 
                    key={trace.id} 
                    onClick={() => handleTraceClick(trace.id)}
                    className={`border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group ${selectedTraceId === trace.id ? 'bg-blue-600/10' : ''}`}
                  >
                    <td className="py-4 px-4 font-mono text-xs text-blue-400">{trace.id.slice(0, 8)}...</td>
                    <td className="py-4 px-4 font-medium text-slate-200">{trace.name || 'Anonymous Agent'}</td>
                    <td className="py-4 px-4 text-slate-400">{trace.latency ? `${trace.latency.toFixed(2)}s` : 'N/A'}</td>
                    <td className="py-4 px-4 text-right text-slate-500">{new Date(trace.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <div className="text-center py-10 text-slate-500">Loading traces...</div>}
            {!loading && traces.length === 0 && <div className="text-center py-10 text-slate-500">No traces found. Run an agent task to see results.</div>}
          </div>
        </div>

        {/* Trace Analysis Side Panel */}
        <div className="glass p-6 space-y-6 max-h-[800px] overflow-y-auto">
          <h2 className="text-lg font-bold">Trace Detail</h2>
          {selectedTraceId ? (
            traceDetail ? (
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
                  <h4 className="text-xs font-bold uppercase mb-1 text-blue-400">Selected Trace</h4>
                  <p className="text-xs text-slate-100 font-mono">{selectedTraceId}</p>
                </div>
                
                <h3 className="text-sm font-semibold text-slate-300">Execution Tree</h3>
                <TraceTree nodes={parsedNodes.length > 0 ? parsedNodes : [
                  { name: "Orchestrator", type: "llm", status: "success", latency: "0.4s", tokens: 156, content: "Decision: tool_agent" },
                  { name: "Tool Agent", type: "tool", status: "success", latency: "0.2s", tokens: 0, content: "Tool execution result: Weather in London is 15°C" },
                  { name: "Final Synthesis", type: "llm", status: "success", latency: "0.8s", tokens: 412, content: "Final Response: The weather in London is currently 15°C." }
                ]} />
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">Loading details...</div>
            )
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">Select a trace to view deep insights and the execution tree.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, neutral = false }: { title: string, value: string, change: string, neutral?: boolean }) {
  return (
    <div className="glass p-6 hover:border-blue-500/30 transition-all group">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-end gap-3">
        <h3 className="text-3xl font-bold text-slate-100">{value}</h3>
        <span className={`text-xs font-bold mb-1 ${neutral ? 'text-blue-400' : 'text-green-400'}`}>
          {change}
        </span>
      </div>
    </div>
  );
}

function InsightItem({ type, title, desc }: { type: 'warning' | 'info' | 'success', title: string, desc: string }) {
  const colors = {
    warning: 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5',
    info: 'border-blue-500/30 text-blue-500 bg-blue-500/5',
    success: 'border-green-500/30 text-green-500 bg-green-500/5'
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[type]}`}>
      <h4 className="text-xs font-bold uppercase mb-1">{title}</h4>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
