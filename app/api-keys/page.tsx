'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SearchBar } from '@/components/ui/SearchBar';
import { Pagination } from '@/components/ui/Pagination';
import { useApiKeys, type ApiKeyRow } from '@/lib/hooks/useApiKeys';
import { useUIStore } from '@/lib/store/ui-store';
import { API_KEY_CREATED_EVENT } from '@/lib/store/onboarding-store';
import {
  KeyRound,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  XCircle,
  SearchX,
} from 'lucide-react';

function formatCreatedAt(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return ' - ';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const headerCell =
  'px-4 h-10 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap';

export default function ApiKeysPage() {
  const { keys, isLoading, error, refetch, createKey, deleteKey } =
    useApiKeys();
  const addToast = useUIStore((s) => s.addToast);

  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Create flow
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke flow
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyRow | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const filteredKeys = useMemo(() => {
    if (!keys) return [];
    const q = query.trim().toLowerCase();
    if (!q) return keys;
    return keys.filter(
      (row) =>
        (row.name || '').toLowerCase().includes(q) ||
        row.key.toLowerCase().includes(q),
    );
  }, [keys, query]);

  const totalPages = Math.max(1, Math.ceil(filteredKeys.length / itemsPerPage));
  const paginatedKeys = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredKeys.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredKeys, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const openCreate = () => {
    setKeyName('');
    setGeneratedKey(null);
    setCopied(false);
    setIsCreateOpen(true);
  };

  const handleCreate = async () => {
    const name = keyName.trim();
    if (!name || isCreating) return;
    setIsCreating(true);
    try {
      const created = await createKey(name);
      setGeneratedKey(created.key);
      window.dispatchEvent(new Event(API_KEY_CREATED_EVENT));
      addToast({ type: 'success', message: `API key "${name}" created.` });
    } catch (err) {
      addToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to create API key',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedKey) return;
    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      addToast({ type: 'error', message: 'Failed to copy to clipboard' });
    }
  };

  const handleRevoke = async () => {
    if (!keyToRevoke || isRevoking) return;
    setIsRevoking(true);
    try {
      await deleteKey(keyToRevoke.id);
      addToast({
        type: 'success',
        message: `API key "${keyToRevoke.name || 'Untitled'}" revoked.`,
      });
      setKeyToRevoke(null);
    } catch (err) {
      addToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to revoke API key',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-8 box-border">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-end justify-between gap-3 mb-6">
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-xs text-muted-foreground">Workspace</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                API Keys
              </h1>
              <p className="text-sm text-muted-foreground">
                Create and revoke the keys that authenticate your apps against
                the Swarms API.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={openCreate}
              className="flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Create key
            </Button>
          </div>

          {/* Keys section */}
          <section className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search keys by name…"
                className="flex-1 max-w-sm"
              />
              {keys && keys.length > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap ml-auto">
                  {filteredKeys.length.toLocaleString()} of{' '}
                  {keys.length.toLocaleString()}{' '}
                  {keys.length === 1 ? 'key' : 'keys'}
                </span>
              )}
              <button
                type="button"
                onClick={refetch}
                disabled={isLoading}
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 flex-shrink-0"
                aria-label="Refresh API keys"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>

            {isLoading && !keys ? (
              <div className="p-5 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-md border border-border bg-subtle px-4 py-3"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-48 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-5">
                <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-4 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{error}</p>
                    <button
                      type="button"
                      onClick={refetch}
                      className="text-xs text-accent hover:underline mt-1"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ) : !keys || keys.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto mb-3 w-9 h-9 rounded-full border border-border bg-subtle flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No API keys yet
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Create your first key to start calling the Swarms API.
                </p>
                <Button variant="primary" size="sm" onClick={openCreate}>
                  <Plus className="w-3.5 h-3.5" />
                  Create key
                </Button>
              </div>
            ) : filteredKeys.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto mb-3 w-9 h-9 rounded-full border border-border bg-subtle flex items-center justify-center">
                  <SearchX className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No keys match &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Try a different name, or clear the search.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery('')}
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <div
                className="overflow-x-auto max-w-full"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border bg-subtle">
                      <th className={headerCell}>Name</th>
                      <th className={headerCell}>Key</th>
                      <th className={`${headerCell} hidden sm:table-cell`}>
                        Created
                      </th>
                      <th className={`${headerCell} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedKeys.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 min-w-[160px]">
                          <div
                            className="text-sm text-foreground truncate max-w-[220px]"
                            title={row.name || 'Untitled key'}
                          >
                            {row.name || 'Untitled key'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-muted-foreground">
                            {row.key}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatCreatedAt(row.created_at)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => setKeyToRevoke(row)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                              title="Revoke key"
                              aria-label={`Revoke ${row.name || 'key'}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-border">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredKeys.length}
                  onItemsPerPageChange={(n) => {
                    setItemsPerPage(n);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}

            <div className="px-5 py-3 border-t border-border bg-subtle/50">
              <p className="text-xs text-muted-foreground">
                Requests made from this dashboard use your most recently
                created key.
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Create key modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={generatedKey ? 'API key created' : 'Create API key'}
        footer={
          generatedKey ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateOpen(false)}
            >
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreate}
                isLoading={isCreating}
                disabled={!keyName.trim()}
              >
                {isCreating ? 'Generating…' : 'Generate key'}
              </Button>
            </>
          )
        }
      >
        {generatedKey ? (
          <div className="space-y-4">
            <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              Copy your key now - it will not be shown again.
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">
                Your API key
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={generatedKey}
                  readOnly
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 h-9 px-3 rounded-md border border-border bg-input text-foreground text-xs font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-w-0"
                />
                <Button
                  variant={copied ? 'success' : 'secondary'}
                  size="md"
                  onClick={handleCopy}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Give your key a descriptive name so you can identify it later.
            </p>
            <Input
              label="Key name"
              value={keyName}
              placeholder="e.g. Production, Development, My App…"
              autoFocus
              maxLength={100}
              onChange={(e) => setKeyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
            />
          </div>
        )}
      </Modal>

      {/* Revoke confirmation modal */}
      <Modal
        isOpen={keyToRevoke !== null}
        onClose={() => {
          if (!isRevoking) setKeyToRevoke(null);
        }}
        title="Revoke API key"
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => setKeyToRevoke(null)}
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleRevoke}
              isLoading={isRevoking}
            >
              {isRevoking ? 'Revoking…' : 'Revoke key'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Any application using{' '}
            <span className="font-medium text-foreground">
              {keyToRevoke?.name || 'this key'}
            </span>{' '}
            will immediately lose access. This cannot be undone.
          </p>
          {keyToRevoke && (
            <div className="rounded-md border border-border bg-subtle px-3 py-2 text-xs font-mono text-muted-foreground truncate">
              {keyToRevoke.key}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
