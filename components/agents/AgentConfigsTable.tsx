'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AgentConfig } from '@/types/agent';
import { Loader2, RefreshCw, Download, Copy, Check, Search, X } from 'lucide-react';
import { useUIStore } from '@/lib/store/ui-store';

interface AgentConfigsTableProps {
  onSelectConfig?: (config: AgentConfig) => void;
}

export function AgentConfigsTable({ onSelectConfig }: AgentConfigsTableProps) {
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const hasFetchedRef = useRef(false);
  const addToast = useUIStore((state) => state.addToast);

  const accentTextClass = 'text-accent';
  const surfaceClass = 'bg-card border-border';
  const hoverSurfaceClass = 'hover:bg-muted';
  const tableHeadClass = 'bg-muted border-border';
  const rowHoverClass = 'hover:bg-muted';
  const dividerClass = 'divide-border';
  const tableBorderClass = 'border-border';
  const retryBtnClass = 'px-4 py-2 bg-accent text-accent-foreground font-mono font-semibold rounded hover:opacity-90 transition-all';

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/agents/list', { cache: 'no-store' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch agent configurations');
      }

      const data = await response.json();
      setConfigs(Array.isArray(data) ? data : []);
      hasFetchedRef.current = true;
    } catch (err) {
      setError((err as Error).message);
      addToast({
        type: 'error',
        message: `Failed to load configurations: ${(err as Error).message}`,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hasFetchedRef.current = false;
    fetchConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter configs based on search query
  const filteredConfigs = useMemo(() => {
    if (!searchQuery.trim()) {
      return configs;
    }

    const query = searchQuery.toLowerCase().trim();
    return configs.filter((config) => {
      const name = config.agent_name?.toLowerCase() || '';
      const description = config.description?.toLowerCase() || '';
      const model = config.model_name?.toLowerCase() || '';
      const role = config.role?.toLowerCase() || '';

      return (
        name.includes(query) ||
        description.includes(query) ||
        model.includes(query) ||
        role.includes(query)
      );
    });
  }, [configs, searchQuery]);

  const handleCopy = async (config: AgentConfig, index: number) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopiedIndex(index);
      addToast({
        type: 'success',
        message: 'Configuration copied to clipboard',
        duration: 2000,
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to copy configuration',
        duration: 3000,
      });
    }
  };

  const handleSelect = (config: AgentConfig) => {
    if (onSelectConfig) {
      onSelectConfig(config);
      addToast({
        type: 'success',
        message: `Selected configuration: ${config.agent_name}`,
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className={`w-8 h-8 animate-spin ${accentTextClass}`} />
        <p className="text-muted-foreground font-mono text-sm">Loading agent configurations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-danger font-mono text-sm text-center">
          {error}
        </div>
        <button
          onClick={fetchConfigs}
          className={retryBtnClass}
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-muted-foreground font-mono text-sm">No agent configurations found</p>
        <p className="text-muted-foreground font-mono text-xs">Create and execute agents to see configurations here</p>
        <button
          onClick={fetchConfigs}
          className="px-4 py-2 font-mono font-semibold rounded transition-all border bg-accent/10 text-accent hover:bg-accent/20 border-accent/50"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold font-mono text-foreground">
            Agent Configurations
          </h3>
          <p className="text-xs text-muted-foreground font-mono mt-1 break-words">
            {filteredConfigs.length} of {configs.length} configuration{configs.length !== 1 ? 's' : ''} {searchQuery ? 'matching search' : 'available'}
          </p>
        </div>
        <button
          onClick={fetchConfigs}
          className={`p-2 border rounded transition-colors text-muted-foreground self-start sm:self-auto ${surfaceClass} ${hoverSurfaceClass} hover:text-accent`}
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-accent/60">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search by name, description, model, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 text-foreground font-mono text-sm focus:outline-none transition-all duration-300 rounded bg-input border border-border focus:border-accent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-accent"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className={`bg-card border ${tableBorderClass} rounded-lg overflow-hidden max-w-full`}>
        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-[760px]">
            <thead className={`${tableHeadClass} border-b`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Agent Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Temperature
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Max Loops
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Max Tokens
                </th>
                <th className="px-4 py-3 text-right text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dividerClass}`}>
              {filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <p className="text-muted-foreground font-mono text-sm">
                      {searchQuery ? 'No configurations match your search' : 'No configurations found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((config, index) => (
                <tr
                  key={index}
                  className={`${rowHoverClass} transition-colors`}
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm text-foreground">
                      {config.agent_name || 'Unnamed'}
                    </div>
                    {config.description && (
                      <div className="text-xs text-muted-foreground font-mono mt-1 line-clamp-1">
                        {config.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-accent">
                      {config.model_name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      {config.role || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-success">
                      {config.temperature ?? 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-accent">
                      {config.max_loops ?? 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-foreground">
                      {config.max_tokens ? config.max_tokens.toLocaleString() : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {onSelectConfig && (
                        <button
                          onClick={() => handleSelect(config)}
                          className="p-2 border rounded transition-colors bg-success/20 hover:bg-success/40 border-success/50 text-success"
                          title="Use this configuration"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleCopy(config, index)}
                        className="p-2 border rounded transition-colors bg-accent/20 hover:bg-accent/40 border-accent/50 text-accent"
                        title="Copy configuration JSON"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
