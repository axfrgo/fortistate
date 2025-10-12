import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  IntegrationAccount,
  IntegrationBinding,
  IntegrationProviderMeta,
  IntegrationCapabilitySpec,
} from "../integrations/types";
import { integrationStore, integrationActions } from "../integrations/integrationStore";
import "./ConnectionCenter.css";

interface ConnectionCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = "accounts" | "bindings" | "providers";

type BindingEnriched = IntegrationBinding & {
  provider?: IntegrationProviderMeta;
  account?: IntegrationAccount;
};

const statusLabel: Record<IntegrationAccount["status"], string> = {
  connected: "Connected",
  pending: "Pending",
  expired: "Expired",
  error: "Error",
  disabled: "Disabled",
};

function extractErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return JSON.stringify(error);
}

export default function ConnectionCenter({ isOpen, onClose }: ConnectionCenterProps) {
  const integrationState = useSyncExternalStore(
    integrationStore.subscribe,
    integrationStore.get,
    integrationStore.get
  );

  const { accounts, bindings, providers, syncing, error } = integrationState;

  const [activeTab, setActiveTab] = useState<TabKey>("accounts");
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [pendingProviderId, setPendingProviderId] = useState<string | null>(null);
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [pendingBindingId, setPendingBindingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [customStatus, setCustomStatus] = useState<"idle" | "opening" | "waiting" | "connecting" | "connected" | "error">("idle");
  const [customFeedback, setCustomFeedback] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const authWindowRef = useRef<Window | null>(null);
  const pendingProviderIdRef = useRef<string | null>(null);
  const pendingConnectionUrlRef = useRef<string | null>(null);
  const pendingConnectionOriginRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setActiveTab("accounts");
    setLocalError(null);
    setShowProviderPicker(false);

    const controller = new AbortController();

    const prime = async () => {
      setBootstrapping(true);
      try {
        const tasks: Array<Promise<unknown>> = [];

        if (providers.length === 0) {
          tasks.push(integrationActions.loadProviders());
        }

        tasks.push(integrationActions.syncAccountsAndBindings());

        await Promise.all(tasks);
      } catch (err) {
        if (!controller.signal.aborted) {
          setLocalError(extractErrorMessage(err));
        }
      } finally {
        if (!controller.signal.aborted) {
          setBootstrapping(false);
        }
      }
    };

    prime();

    return () => {
      controller.abort();
    };
  }, [isOpen, providers.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const bindingsEnriched = useMemo<BindingEnriched[]>(() => {
    if (!bindings?.length) return [];
    return bindings.map((binding) => ({
      ...binding,
      provider: providers.find((item) => item.id === binding.providerId),
      account: accounts.find((item) => item.id === binding.accountId),
    }));
  }, [bindings, providers, accounts]);

  const handleClose = useCallback(() => {
    setShowProviderPicker(false);
    setPendingProviderId(null);
    setPendingAccountId(null);
    setPendingBindingId(null);
    setLocalError(null);
    setCustomUrl("");
    setCustomName("");
    setCustomStatus("idle");
    setCustomFeedback(null);
    setCustomError(null);
    if (authWindowRef.current && !authWindowRef.current.closed) {
      authWindowRef.current.close();
    }
    authWindowRef.current = null;
    pendingProviderIdRef.current = null;
    pendingConnectionUrlRef.current = null;
    pendingConnectionOriginRef.current = null;
    integrationActions.clearError();
    onClose();
  }, [onClose]);

  const handleRefresh = useCallback(async () => {
    setLocalError(null);
    try {
      await integrationActions.syncAccountsAndBindings();
    } catch (err) {
      setLocalError(extractErrorMessage(err));
    }
  }, []);

  const handleRefreshAccount = useCallback(async (account: IntegrationAccount) => {
    setLocalError(null);
    setPendingAccountId(account.id);
    try {
      await integrationActions.refreshAccount(account.id);
    } catch (err) {
      setLocalError(extractErrorMessage(err));
    } finally {
      setPendingAccountId(null);
    }
  }, []);

  const handleConnectAccount = useCallback(async (provider: IntegrationProviderMeta) => {
    setPendingProviderId(provider.id);
    setLocalError(null);
    try {
      await integrationActions.connectAccount(provider.id);
      setShowProviderPicker(false);
    } catch (err) {
      setLocalError(extractErrorMessage(err));
    } finally {
      setPendingProviderId(null);
    }
  }, []);

  const handleDisconnectAccount = useCallback(async (account: IntegrationAccount) => {
    setPendingAccountId(account.id);
    setLocalError(null);
    try {
      await integrationActions.disconnectAccount(account.id);
    } catch (err) {
      setLocalError(extractErrorMessage(err));
    } finally {
      setPendingAccountId(null);
    }
  }, []);

  const handleRemoveBinding = useCallback(async (binding: IntegrationBinding) => {
    setPendingBindingId(binding.id);
    setLocalError(null);
    try {
      await integrationActions.deleteBinding(binding.id);
    } catch (err) {
      setLocalError(extractErrorMessage(err));
    } finally {
      setPendingBindingId(null);
    }
  }, []);

  const parseCustomUrl = useCallback((value: string): URL => {
    let candidate = value.trim();
    if (!candidate) {
      throw new Error("Enter the login URL for the app you want to connect.");
    }
    if (!/^https?:\/\//i.test(candidate)) {
      candidate = `https://${candidate}`;
    }
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error("Only HTTP(S) URLs are supported for connections.");
    }
    return parsed;
  }, []);

  const finalizeCustomConnection = useCallback(
    (payload?: {
      accountName?: string;
      metadata?: Record<string, unknown>;
      credentials?: Record<string, unknown>;
      connectionId?: string;
    }) => {
      const targetUrl = pendingConnectionUrlRef.current ?? customUrl.trim();
      if (!targetUrl) {
        setCustomError("Start the connection by entering a URL above.");
        setCustomStatus("error");
        return;
      }

      try {
        setCustomStatus("connecting");
        const result = integrationActions.connectCustomApp(targetUrl, {
          displayName: customName,
          accountName: payload?.accountName,
          metadata: payload?.metadata,
          credentials: payload?.credentials,
          connectionId: payload?.connectionId,
        });

        setCustomStatus("connected");
        setCustomFeedback(
          `Connected ${result.account.displayName}. You can now bind it to universes and automations.`
        );
        setCustomError(null);
        setCustomUrl("");
        setCustomName("");

        // Reset pending references
        pendingProviderIdRef.current = null;
        pendingConnectionUrlRef.current = null;
        pendingConnectionOriginRef.current = null;
      } catch (err) {
        setCustomError(extractErrorMessage(err));
        setCustomStatus("error");
      } finally {
        if (authWindowRef.current && !authWindowRef.current.closed) {
          authWindowRef.current.close();
        }
        authWindowRef.current = null;
      }
    },
    [customName, customUrl]
  );

  const handleManualComplete = useCallback(() => {
    finalizeCustomConnection();
  }, [finalizeCustomConnection]);

  const handleAbortCustom = useCallback(() => {
    if (authWindowRef.current && !authWindowRef.current.closed) {
      authWindowRef.current.close();
    }
    authWindowRef.current = null;
    pendingProviderIdRef.current = null;
    pendingConnectionUrlRef.current = null;
    pendingConnectionOriginRef.current = null;
    setCustomStatus("idle");
    setCustomFeedback(null);
    setCustomError(null);
  }, []);

  const handleStartCustomConnection = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setCustomFeedback(null);
      setCustomError(null);
      setCustomStatus((prev) => (prev === "error" || prev === "connected" ? "idle" : prev));

      let parsed: URL;
      try {
        parsed = parseCustomUrl(customUrl);
      } catch (err) {
        setCustomError(err instanceof Error ? err.message : String(err));
        setCustomStatus("error");
        return;
      }

      const normalized = parsed.toString();

      try {
        setCustomStatus("opening");
        const provider = integrationActions.ensureCustomProvider(normalized, {
          displayName: customName || parsed.hostname.replace(/^www\./, ""),
        });

        pendingProviderIdRef.current = provider.id;
        pendingConnectionUrlRef.current = normalized;
        pendingConnectionOriginRef.current = parsed.origin;

        const connectUrl = new URL(normalized);
        connectUrl.searchParams.set("fortistate_integration", provider.id);
        connectUrl.searchParams.set("fortistate_origin", window.location.origin);

        const popup = window.open(connectUrl.toString(), "_blank", "width=720,height=780");
        authWindowRef.current = popup ?? null;

        setCustomStatus("waiting");
        setCustomFeedback(
          popup
            ? `Complete the sign-in flow for ${provider.name} in the new window. We'll finish the connection automatically.`
            : `We couldn't open a popup. Sign in manually at ${connectUrl.origin} and press “Finish connection” once you're done.`
        );
      } catch (err) {
        setCustomError(extractErrorMessage(err));
        setCustomStatus("error");
        pendingProviderIdRef.current = null;
        pendingConnectionUrlRef.current = null;
        pendingConnectionOriginRef.current = null;
        if (authWindowRef.current && !authWindowRef.current.closed) {
          authWindowRef.current.close();
        }
        authWindowRef.current = null;
      }
    },
    [customName, customUrl, parseCustomUrl]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      if (!pendingProviderIdRef.current) return;
      if (!event.data || typeof event.data !== "object") return;
      const data = event.data as Record<string, unknown>;
      if (data.type !== "fortistate:integration-success") return;
      if (pendingConnectionOriginRef.current && event.origin !== pendingConnectionOriginRef.current) {
        return;
      }

      finalizeCustomConnection({
        accountName: typeof data.accountName === "string" ? data.accountName : undefined,
        metadata:
          data.metadata && typeof data.metadata === "object"
            ? (data.metadata as Record<string, unknown>)
            : undefined,
        credentials:
          data.credentials && typeof data.credentials === "object"
            ? (data.credentials as Record<string, unknown>)
            : undefined,
        connectionId: typeof data.connectionId === "string" ? data.connectionId : undefined,
      });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [finalizeCustomConnection, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      if (authWindowRef.current && !authWindowRef.current.closed) {
        authWindowRef.current.close();
      }
      authWindowRef.current = null;
      pendingProviderIdRef.current = null;
      pendingConnectionUrlRef.current = null;
      pendingConnectionOriginRef.current = null;
      setCustomStatus("idle");
      setCustomFeedback(null);
      setCustomError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (customStatus !== "connected") return;
    const timeout = window.setTimeout(() => {
      setCustomStatus("idle");
      setCustomFeedback(null);
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [customStatus]);

  const tabActions: { key: TabKey; label: string }[] = [
    { key: "accounts", label: "Accounts" },
    { key: "bindings", label: "Bindings" },
    { key: "providers", label: "Providers" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="connection-center-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleClose}
          />

          <motion.div
            className="connection-center-panel"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <header>
              <div className="connection-center-title">
                <h2>Connection Center</h2>
                <p>
                  Establish accounts, review bindings, and browse provider capabilities to fuel
                  your universes.
                </p>
              </div>

              <div className="connection-center-tabs">
                {tabActions.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`connection-center-tab ${tab.key === activeTab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </header>

            <div className="connection-center-body">
              {localError && <div className="cc-error">{localError}</div>}

              <div className="connection-center-content">
                {activeTab === "accounts" && (
                  <div className="connection-center-scroll">
                    <div className="connection-center-toolbar">
                      <button
                        type="button"
                        className="cc-button"
                        onClick={handleRefresh}
                        disabled={syncing || bootstrapping}
                      >
                        ↻ Refresh
                      </button>
                      <button
                        type="button"
                        className="cc-button primary"
                        onClick={() => setShowProviderPicker((prev) => !prev)}
                        disabled={providers.length === 0 || syncing || bootstrapping}
                      >
                        ✚ Connect account
                      </button>
                      <span className="cc-caption">
                        Connected accounts power automations, ingestion, and telemetry flows.
                      </span>
                    </div>

                    <div className="cc-custom-card">
                      <form className="cc-custom-form" onSubmit={handleStartCustomConnection}>
                        <div className="cc-custom-header">
                          <div>
                            <h4>Connect any app by URL</h4>
                            <p>
                              Paste the login or OAuth authorize URL for the SaaS app you want to use in
                              Fortistate. We'll launch the sign-in flow and capture the connection for you.
                            </p>
                          </div>
                          {customStatus === "connected" ? (
                            <span className="cc-badge success">Connected</span>
                          ) : null}
                        </div>

                        <div className="cc-custom-fields">
                          <label>
                            <span>App URL</span>
                            <input
                              type="url"
                              placeholder="https://app.example.com/oauth/authorize"
                              value={customUrl}
                              onChange={(event) => {
                                const value = event.target.value;
                                setCustomUrl(value);
                                if (customStatus === "error") {
                                  setCustomStatus("idle");
                                  setCustomError(null);
                                } else if (customStatus === "connected") {
                                  setCustomStatus("idle");
                                  setCustomFeedback(null);
                                }
                              }}
                              disabled={customStatus === "waiting" || customStatus === "connecting"}
                              required
                            />
                          </label>
                          <label>
                            <span>Display name (optional)</span>
                            <input
                              type="text"
                              placeholder="Friendly name shown in your studio"
                              value={customName}
                              onChange={(event) => {
                                const value = event.target.value;
                                setCustomName(value);
                                if (customStatus === "error") {
                                  setCustomStatus("idle");
                                  setCustomError(null);
                                } else if (customStatus === "connected") {
                                  setCustomStatus("idle");
                                  setCustomFeedback(null);
                                }
                              }}
                              disabled={customStatus === "waiting" || customStatus === "connecting"}
                            />
                          </label>
                        </div>

                        {customError ? <div className="cc-inline-error">{customError}</div> : null}
                        {customFeedback ? <div className="cc-inline-hint">{customFeedback}</div> : null}

                        <div className="cc-custom-actions">
                          <button
                            type="submit"
                            className="cc-button primary"
                            disabled={customStatus === "opening" || customStatus === "waiting" || customStatus === "connecting"}
                          >
                            {customStatus === "opening" || customStatus === "waiting"
                              ? "Awaiting sign-in…"
                              : "Connect & Sign In"}
                          </button>
                          <button
                            type="button"
                            className="cc-button"
                            onClick={handleManualComplete}
                            disabled={customStatus !== "waiting"}
                          >
                            Finish connection
                          </button>
                          <button
                            type="button"
                            className="cc-button"
                            onClick={handleAbortCustom}
                            disabled={customStatus !== "waiting" && customStatus !== "error"}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>

                    {showProviderPicker && (
                      <div className="cc-provider-picker">
                        <div className="cc-caption">
                          Choose a provider to launch the connection handshake.
                        </div>
                        <div className="cc-provider-grid">
                          {providers.map((provider) => (
                            <div key={provider.id} className="cc-provider-card">
                              <h4>{provider.name}</h4>
                              <p>{provider.description}</p>
                              <div className="cc-provider-tags">
                                <span className="cc-tag">{provider.category}</span>
                                {provider.capabilities.slice(0, 2).map((capability: IntegrationCapabilitySpec) => (
                                  <span key={capability.id} className="cc-tag">
                                    {capability.label}
                                  </span>
                                ))}
                              </div>
                              <button
                                type="button"
                                className="cc-button primary"
                                onClick={() => handleConnectAccount(provider)}
                                disabled={pendingProviderId === provider.id}
                              >
                                {pendingProviderId === provider.id ? "Connecting…" : "Connect"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {bootstrapping && accounts.length === 0 ? (
                      <div className="cc-empty-state">
                        <strong>Bootstrapping connection data…</strong>
                        Hang tight while we contact your integration providers.
                      </div>
                    ) : accounts.length === 0 ? (
                      <div className="cc-empty-state">
                        <strong>No accounts connected (yet)</strong>
                        Use “Connect account” to authorize a provider and start wiring in live data.
                      </div>
                    ) : (
                      <div className="cc-account-grid">
                        {accounts.map((account) => (
                          <div key={account.id} className="cc-account-card">
                            <div className="cc-account-header">
                              <div>
                                <div className="cc-account-name">{account.displayName}</div>
                                <div className="cc-account-meta">
                                  {account.providerName}
                                  {account.metadata?.workspaceName
                                    ? ` • ${account.metadata.workspaceName}`
                                    : ""}
                                </div>
                              </div>
                              <span className={`cc-status ${account.status}`}>
                                {statusLabel[account.status] ?? account.status}
                              </span>
                            </div>

                            {account.scopes.length ? (
                              <div className="cc-caption">
                                Scopes enabled: {account.scopes.join(", ")}
                              </div>
                            ) : null}

                            <div className="cc-account-actions">
                              <button
                                type="button"
                                className="cc-button"
                                onClick={() => handleRefreshAccount(account)}
                                disabled={
                                  syncing ||
                                  bootstrapping ||
                                  pendingAccountId === account.id ||
                                  pendingProviderId !== null
                                }
                              >
                                {pendingAccountId === account.id ? "Refreshing…" : "Refresh"}
                              </button>
                              <button
                                type="button"
                                className="cc-button"
                                onClick={() => handleDisconnectAccount(account)}
                                disabled={pendingAccountId === account.id}
                              >
                                {pendingAccountId === account.id ? "Disconnecting…" : "Disconnect"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "bindings" && (
                  <div className="connection-center-scroll">
                    <div className="connection-center-toolbar">
                      <button
                        type="button"
                        className="cc-button"
                        onClick={handleRefresh}
                        disabled={syncing || bootstrapping}
                      >
                        ↻ Refresh
                      </button>
                      <span className="cc-caption">
                        Bindings attach provider capabilities to universes, nodes, and automations.
                      </span>
                    </div>

                    {bindingsEnriched.length === 0 ? (
                      <div className="cc-empty-state">
                        <strong>No bindings detected</strong>
                        Wiring accounts to nodes happens inside the universe canvas and inspector.
                        Once attached, they will surface here for quick auditing.
                      </div>
                    ) : (
                      <div className="cc-bindings-list">
                        {bindingsEnriched.map((binding) => (
                          <div key={binding.id} className="cc-binding-card">
                            <div className="cc-binding-row">
                              <div>
                                <div className="cc-account-name">
                                  {binding.config.summary ?? binding.id}
                                </div>
                                <div className="cc-binding-meta">
                                  {binding.provider?.name ?? "Unknown provider"}
                                  {binding.account?.displayName
                                    ? ` • ${binding.account.displayName}`
                                    : ""}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="cc-button"
                                onClick={() => handleRemoveBinding(binding)}
                                disabled={pendingBindingId === binding.id}
                              >
                                {pendingBindingId === binding.id ? "Removing…" : "Remove"}
                              </button>
                            </div>

                            <div className="cc-caption">
                              Scope: {binding.scope === "node" ? "Node" : "Universe"}{" "}
                              → {binding.scope === "node" ? binding.nodeId ?? "Detached" : binding.universeId}
                            </div>
                            {binding.config.capabilityId ? (
                              <div className="cc-caption">
                                Capability: {binding.config.capabilityId}
                              </div>
                            ) : null}
                            {binding.config.settings &&
                            Object.keys(binding.config.settings).length ? (
                              <div className="cc-caption">
                                Settings: {JSON.stringify(binding.config.settings)}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "providers" && (
                  <div className="connection-center-scroll">
                    <div className="connection-center-toolbar">
                      <span className="cc-caption">
                        Browse available providers and their core capabilities. Catalog updates roll
                        in automatically from Fortistate.
                      </span>
                    </div>

                    {providers.length === 0 ? (
                      <div className="cc-empty-state">
                        <strong>No providers registered</strong>
                        The catalog is loading. If this persists, confirm your integration config
                        is reachable.
                      </div>
                    ) : (
                      <div className="cc-provider-grid">
                        {providers.map((provider) => (
                          <div key={provider.id} className="cc-provider-card">
                            <h4>{provider.name}</h4>
                            <p>{provider.description}</p>
                            <div className="cc-provider-tags">
                              <span className="cc-tag">{provider.category}</span>
                              {provider.capabilities.map((capability: IntegrationCapabilitySpec) => (
                                <span key={capability.id} className="cc-tag">
                                  {capability.label}
                                </span>
                              ))}
                              {provider.marketTags.slice(0, 2).map((tag) => (
                                <span key={tag} className="cc-tag">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            {provider.oauth ? (
                              <div className="cc-caption">
                                OAuth scopes: {provider.oauth.scopes.join(", ")}
                              </div>
                            ) : (
                              <div className="cc-caption">API credential based</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
