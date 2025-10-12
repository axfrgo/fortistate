import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import {
  universeRegistryStore,
  universeRegistryActions,
} from "../universes/universeRegistryStore";
import {
  integrationStore,
  integrationActions,
} from "../integrations/integrationStore";
import type {
  IntegrationAccount,
  IntegrationBinding,
  UniverseRuntimeConfig,
} from "../integrations/types";
import "./GoLiveLaunchCenter.css";

interface GoLiveLaunchCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type BindingOverrideMap = Record<string, string>;

type LaunchStatus = { kind: "idle" } | { kind: "success"; launchId?: string; message?: string };

function extractErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch (err) {
    return String(error);
  }
}

export default function GoLiveLaunchCenter({ isOpen, onClose }: GoLiveLaunchCenterProps) {
  const universeState = useSyncExternalStore(
    universeRegistryStore.subscribe,
    universeRegistryStore.get,
    universeRegistryStore.get
  );

  const integrationState = useSyncExternalStore(
    integrationStore.subscribe,
    integrationStore.get,
    integrationStore.get
  );

  const { universes, versions, loading, launching, error } = universeState;
  const { accounts } = integrationState;
  const { user } = useUser();

  const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [entryNodeId, setEntryNodeId] = useState<string | null>(null);
  const [dryRun, setDryRun] = useState<boolean>(true);
  const [telemetryLevel, setTelemetryLevel] = useState<UniverseRuntimeConfig["telemetryLevel"]>("standard");
  const [notifyEmail, setNotifyEmail] = useState<boolean>(false);
  const [notifyInApp, setNotifyInApp] = useState<boolean>(true);
  const [bindingOverrides, setBindingOverrides] = useState<BindingOverrideMap>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [status, setStatus] = useState<LaunchStatus>({ kind: "idle" });
  const [ensuringVersion, setEnsuringVersion] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLocalError(null);
    setStatus({ kind: "idle" });
    setEnsuringVersion(false);

    const controller = new AbortController();

    const prepare = async () => {
      try {
        if (universes.length === 0) {
          await universeRegistryActions.loadUniverses();
        }
        if (accounts.length === 0) {
          await integrationActions.syncAccountsAndBindings();
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setLocalError(extractErrorMessage(err));
        }
      }
    };

    prepare();

    return () => {
      controller.abort();
    };
  }, [isOpen, universes.length, accounts.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (user?.primaryEmailAddress?.emailAddress) {
      setNotifyEmail(true);
    }
  }, [isOpen, user?.primaryEmailAddress?.emailAddress]);

  useEffect(() => {
    if (!isOpen) return;
    if (error) {
      setLocalError(error);
    }
  }, [error, isOpen]);

  useEffect(() => {
    if (!isOpen || universes.length === 0) return;

    setSelectedUniverseId((current) => {
      if (current && universes.some((universe) => universe.id === current)) {
        return current;
      }
      return universes[0]?.id ?? null;
    });
  }, [isOpen, universes]);

  const selectedUniverse = useMemo(() => {
    if (!selectedUniverseId) return null;
    return universes.find((universe) => universe.id === selectedUniverseId) ?? null;
  }, [selectedUniverseId, universes]);

  useEffect(() => {
    if (!selectedUniverse) {
      setSelectedVersionId(null);
      return;
    }

    const preferred = selectedUniverse.activeVersionId ?? selectedUniverse.versionIds[0] ?? null;
    setSelectedVersionId((current) => (current && selectedUniverse.versionIds.includes(current) ? current : preferred));
  }, [selectedUniverse]);

  const selectedVersion = useMemo(() => {
    if (!selectedUniverse || !selectedVersionId) return null;
    const key = `${selectedUniverse.id}:${selectedVersionId}`;
    return versions[key] ?? null;
  }, [selectedUniverse, selectedVersionId, versions]);

  useEffect(() => {
    if (!isOpen || !selectedUniverse || !selectedVersionId) return;
    if (selectedVersion) {
      setEnsuringVersion(false);
      return;
    }

    let cancelled = false;
    setEnsuringVersion(true);

    universeRegistryActions
      .loadUniverseVersion(selectedUniverse.id, selectedVersionId)
      .catch((err) => {
        if (!cancelled) {
          setLocalError(extractErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setEnsuringVersion(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedUniverse, selectedVersionId, selectedVersion]);

  useEffect(() => {
    if (!selectedVersion) return;
    const nodes = selectedVersion.canvasState?.nodes ?? [];
    if (nodes.length === 0) {
      setEntryNodeId(null);
      return;
    }

    setEntryNodeId((current) => {
      if (current && nodes.some((node) => node.id === current)) {
        return current;
      }
      return nodes[0].id;
    });

    const overrides: BindingOverrideMap = {};
    for (const binding of selectedVersion.bindings ?? []) {
      overrides[binding.id] = binding.accountId;
    }
    setBindingOverrides(overrides);
  }, [selectedVersion]);

  const availableBindings = useMemo(() => {
    if (!selectedVersion) return [] as IntegrationBinding[];
    return selectedVersion.bindings ?? [];
  }, [selectedVersion]);

  const nodesForEntry = useMemo(() => {
    if (!selectedVersion) return [] as { id: string; label: string }[];
    return (selectedVersion.canvasState?.nodes ?? []).map((node) => ({
      id: node.id,
      label: typeof node.data === "object" && node.data && "label" in node.data ? String((node.data as Record<string, unknown>).label) : node.id,
    }));
  }, [selectedVersion]);

  const providerAccounts = useMemo(() => {
    const map = new Map<string, IntegrationAccount[]>();
    for (const account of accounts) {
      if (!map.has(account.providerId)) {
        map.set(account.providerId, []);
      }
      map.get(account.providerId)?.push(account);
    }
    return map;
  }, [accounts]);

  const completionChannels = useMemo(() => {
    const channels: UniverseRuntimeConfig["completionChannels"] = [];
    if (notifyInApp) {
      channels.push({ type: "in-app", target: "current" });
    }
    if (notifyEmail && user?.primaryEmailAddress?.emailAddress) {
      channels.push({ type: "email", target: user.primaryEmailAddress.emailAddress });
    }
    return channels;
  }, [notifyInApp, notifyEmail, user]);

  const bindingOverridesArray = useMemo(() => {
    const overrides: UniverseRuntimeConfig["bindingOverrides"] = [];
    for (const binding of availableBindings) {
      const overrideAccountId = bindingOverrides[binding.id];
      if (overrideAccountId && overrideAccountId !== binding.accountId) {
        overrides.push({ bindingId: binding.id, accountId: overrideAccountId });
      }
    }
    return overrides;
  }, [availableBindings, bindingOverrides]);

  const canLaunch = Boolean(
    selectedUniverse &&
    selectedVersionId &&
    (!nodesForEntry.length || entryNodeId) &&
    !launching &&
    !ensuringVersion
  );

  // Debug logging to help identify launch blockers
  useEffect(() => {
    if (isOpen) {
      console.log('[GoLive] Launch readiness check:', {
        hasUniverse: Boolean(selectedUniverse),
        universeId: selectedUniverse?.id,
        hasVersion: Boolean(selectedVersionId),
        versionId: selectedVersionId,
        nodesCount: nodesForEntry.length,
        hasEntryNode: Boolean(entryNodeId),
        entryNodeId,
        isLaunching: launching,
        isEnsuring: ensuringVersion,
        canLaunch,
      });
    }
  }, [isOpen, selectedUniverse, selectedVersionId, nodesForEntry.length, entryNodeId, launching, ensuringVersion, canLaunch]);

  const handleClose = useCallback(() => {
    setLocalError(null);
    setStatus({ kind: "idle" });
    setBindingOverrides({});
    setEntryNodeId(null);
    setDryRun(true);
    setTelemetryLevel("standard");
    setNotifyInApp(true);
    setNotifyEmail(false);
    universeRegistryActions.clearError();
    onClose();
  }, [onClose]);

  const handleLaunch = useCallback(async () => {
    if (!selectedUniverse || !selectedVersionId) {
      setLocalError("Select a universe and version to launch.");
      return;
    }

    setLocalError(null);
    setStatus({ kind: "idle" });

    const config: UniverseRuntimeConfig = {
      universeId: selectedUniverse.id,
      versionId: selectedVersionId,
      entryNodeId,
      dryRun,
      telemetryLevel,
      bindingOverrides: bindingOverridesArray,
      notifyOnCompletion: completionChannels.length > 0,
      completionChannels,
    };

    try {
      const result = await universeRegistryActions.launchUniverse(config);
      setStatus({
        kind: "success",
        launchId: result.launchId,
        message: dryRun ? "Dry run queued successfully." : "Universe launch initiated.",
      });
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      setLocalError(extractErrorMessage(err));
    }
  }, [
    selectedUniverse,
    selectedVersionId,
    entryNodeId,
    dryRun,
    telemetryLevel,
    bindingOverridesArray,
    completionChannels,
    handleClose,
  ]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="go-live-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleClose}
          />

          <motion.div
            className="go-live-panel"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <header>
              <div className="go-live-title">
                <h2>Go-Live Orchestration</h2>
                <p>
                  Launch a saved universe into a live run. Configure runtime parameters, override bindings for
                  production accounts, and decide how you want to be notified when execution finishes.
                </p>
              </div>
            </header>

            <div className="go-live-body">
              <div className="go-live-left">
                <form className="go-live-form" onSubmit={(event) => event.preventDefault()}>
                  <div className="go-live-field">
                    <label className="go-live-label" htmlFor="go-live-universe">
                      Universe
                    </label>
                    {universes.length === 0 ? (
                      <div className="go-live-empty">
                        <strong>No universes saved yet</strong>
                        Save a universe version from the canvas to enable launches.
                      </div>
                    ) : (
                      <select
                        id="go-live-universe"
                        className="go-live-select"
                        value={selectedUniverseId ?? ""}
                        onChange={(event) => setSelectedUniverseId(event.target.value || null)}
                        disabled={loading}
                      >
                        {universes.map((universe) => (
                          <option key={universe.id} value={universe.id}>
                            {universe.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="go-live-field">
                    <label className="go-live-label" htmlFor="go-live-version">
                      Version
                    </label>
                    <select
                      id="go-live-version"
                      className="go-live-select"
                      value={selectedVersionId ?? ""}
                      onChange={(event) => setSelectedVersionId(event.target.value || null)}
                      disabled={!selectedUniverse || (selectedUniverse?.versionIds.length ?? 0) === 0}
                    >
                      {selectedUniverse?.versionIds.map((versionId) => (
                        <option key={versionId} value={versionId}>
                          {versionId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="go-live-field">
                    <label className="go-live-label" htmlFor="go-live-entry-node">
                      Entry node
                    </label>
                    {nodesForEntry.length === 0 ? (
                      <div className="go-live-empty">
                        <strong>No entry nodes detected</strong>
                        Ensure your saved universe has at least one node to launch from.
                      </div>
                    ) : (
                      <select
                        id="go-live-entry-node"
                        className="go-live-select"
                        value={entryNodeId ?? ""}
                        onChange={(event) => setEntryNodeId(event.target.value || null)}
                      >
                        {nodesForEntry.map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="go-live-field">
                    <label className="go-live-label">Runtime mode</label>
                    <div className="go-live-checkbox">
                      <input
                        id="go-live-dry-run"
                        type="checkbox"
                        checked={dryRun}
                        onChange={(event) => setDryRun(event.target.checked)}
                      />
                      <label htmlFor="go-live-dry-run">Dry run (simulate without side effects)</label>
                    </div>
                  </div>

                  <div className="go-live-field">
                    <label className="go-live-label">Telemetry</label>
                    <div className="go-live-radio-set">
                      {(["minimal", "standard", "verbose"] as UniverseRuntimeConfig["telemetryLevel"][]).map(
                        (level) => (
                          <label key={level}>
                            <input
                              type="radio"
                              name="go-live-telemetry"
                              value={level}
                              checked={telemetryLevel === level}
                              onChange={() => setTelemetryLevel(level)}
                            />
                            <span>{level}</span>
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  <div className="go-live-field">
                    <label className="go-live-label">Completion notifications</label>
                    <div className="go-live-checkbox">
                      <input
                        id="go-live-notify-in-app"
                        type="checkbox"
                        checked={notifyInApp}
                        onChange={(event) => setNotifyInApp(event.target.checked)}
                      />
                      <label htmlFor="go-live-notify-in-app">In-app alert</label>
                    </div>
                    <div className="go-live-checkbox">
                      <input
                        id="go-live-notify-email"
                        type="checkbox"
                        checked={notifyEmail}
                        onChange={(event) => setNotifyEmail(event.target.checked)}
                        disabled={!user?.primaryEmailAddress?.emailAddress}
                      />
                      <label htmlFor="go-live-notify-email">
                        Email {user?.primaryEmailAddress?.emailAddress ? `(${user.primaryEmailAddress.emailAddress})` : "(add email in profile)"}
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              <div className="go-live-right">
                <div className="go-live-section-title">Binding overrides</div>
                <div className="go-live-scroll">
                  {ensuringVersion ? (
                    <div className="go-live-empty">
                      <strong>Loading version details…</strong>
                      We are fetching bindings and topology for the selected version.
                    </div>
                  ) : availableBindings.length === 0 ? (
                    <div className="go-live-empty">
                      <strong>No bindings attached</strong>
                      This version does not have integration bindings to override.
                    </div>
                  ) : (
                    availableBindings.map((binding) => {
                      const accountsForProvider = providerAccounts.get(binding.providerId) ?? [];
                      return (
                        <div key={binding.id} className="go-live-binding-card">
                          <div className="go-live-binding-row">
                            <div>
                              <div className="go-live-section-title">{binding.config.summary ?? binding.id}</div>
                              <div className="go-live-chip-row">
                                <span className="go-live-chip">{binding.providerId}</span>
                                <span className="go-live-chip">{binding.config.capabilityId}</span>
                                <span className="go-live-chip">{binding.environment}</span>
                              </div>
                            </div>
                            <select
                              className="go-live-select"
                              value={bindingOverrides[binding.id] ?? binding.accountId}
                              onChange={(event) =>
                                setBindingOverrides((prev) => ({
                                  ...prev,
                                  [binding.id]: event.target.value,
                                }))
                              }
                            >
                              <option value={binding.accountId}>Default ({binding.accountId})</option>
                              {accountsForProvider.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.displayName}
                                </option>
                              ))}
                            </select>
                          </div>

                          {binding.runtimeOptions ? (
                            <div className="go-live-chip-row">
                              <span className="go-live-chip">Runtime overrides enabled</span>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="go-live-footer">
                  <div className="status-text">
                    {localError ? <span className="error-text">{localError}</span> : null}
                    {status.kind === "success" ? (
                      <span className="success-text">
                        {status.message}
                        {status.launchId ? ` (launch #${status.launchId})` : ""}
                      </span>
                    ) : null}
                    {!canLaunch && !localError && status.kind === "idle" ? (
                      <span className="info-text">
                        {!selectedUniverse
                          ? "Select a universe to continue"
                          : !selectedVersionId
                          ? "Select a version to continue"
                          : ensuringVersion
                          ? "Loading version details..."
                          : nodesForEntry.length > 0 && !entryNodeId
                          ? "Select an entry node to continue"
                          : launching
                          ? "Launching..."
                          : "Ready to launch"}
                      </span>
                    ) : null}
                  </div>

                  <div className="go-live-footer-buttons">
                    <button type="button" className="go-live-button" onClick={handleClose} disabled={launching}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="go-live-button primary"
                      onClick={handleLaunch}
                      disabled={!canLaunch}
                    >
                      {launching ? "Launching…" : dryRun ? "Queue dry run" : "Launch universe"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
