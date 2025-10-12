import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SavedUniverseSummary, SavedUniverseVersion, UniverseDraftMetadata } from "../integrations/types";
import {
  universeRegistryStore,
  universeRegistryActions,
} from "../universes/universeRegistryStore";
import "./SavedUniversesDashboard.css";

interface SavedUniversesDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadUniverse?: (
    universe: SavedUniverseSummary,
    version: SavedUniverseVersion
  ) => Promise<void> | void;
  onSaveUniverse?: (
    metadata: UniverseDraftMetadata
  ) => Promise<{ universe: SavedUniverseSummary; version: SavedUniverseVersion } | void> | void;
}

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

export default function SavedUniversesDashboard({
  isOpen,
  onClose,
  onLoadUniverse,
  onSaveUniverse,
}: SavedUniversesDashboardProps) {
  const universeState = useSyncExternalStore(
    universeRegistryStore.subscribe,
    universeRegistryStore.get,
    universeRegistryStore.get
  );

  const { universes, recentUniverseIds, versions, loading, error } = universeState;

  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);
  const [pendingVersionKey, setPendingVersionKey] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [isSaveFormOpen, setIsSaveFormOpen] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saveTags, setSaveTags] = useState("");
  const [saveIcon, setSaveIcon] = useState("");
  const [isSavingUniverse, setIsSavingUniverse] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLocalError(null);

    const controller = new AbortController();

    const load = async () => {
      if (universes.length > 0) return;
      setBootstrapping(true);
      try {
        await universeRegistryActions.loadUniverses();
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

    load();

    return () => {
      controller.abort();
    };
  }, [isOpen, universes.length]);

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
    if (error) {
      setLocalError(error);
    }
  }, [error, isOpen]);

  useEffect(() => {
    if (!saveFeedback) return;
    const timeout = setTimeout(() => setSaveFeedback(null), 4000);
    return () => clearTimeout(timeout);
  }, [saveFeedback]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedUniverseId) {
      const stillExists = universes.some((universe) => universe.id === selectedUniverseId);
      if (!stillExists) {
        setSelectedUniverseId(null);
      }
    }

    if (!selectedUniverseId && universes.length > 0) {
      const recent = recentUniverseIds
        .map((id) => universes.find((universe) => universe.id === id))
        .find((universe): universe is SavedUniverseSummary => Boolean(universe));

      setSelectedUniverseId((recent ?? universes[0]).id);
    }
  }, [isOpen, universes, recentUniverseIds, selectedUniverseId]);

  const selectedUniverse = useMemo(() => {
    return universes.find((universe) => universe.id === selectedUniverseId) ?? null;
  }, [universes, selectedUniverseId]);

  const recentUniverses = useMemo(() => {
    return recentUniverseIds
      .map((id) => universes.find((universe) => universe.id === id))
      .filter((value): value is SavedUniverseSummary => Boolean(value));
  }, [recentUniverseIds, universes]);

  const otherUniverses = useMemo(() => {
    const selectedRecentIds = new Set(recentUniverses.map((universe) => universe.id));
    return universes.filter((universe) => !selectedRecentIds.has(universe.id));
  }, [recentUniverses, universes]);

  const versionEntries = useMemo(() => {
    if (!selectedUniverse) return [];
    return selectedUniverse.versionIds.map((versionId) => {
      const key = `${selectedUniverse.id}:${versionId}`;
      return {
        key,
        versionId,
        version: versions[key] ?? null,
      };
    });
  }, [selectedUniverse, versions]);

  const handleClose = useCallback(() => {
    setSelectedUniverseId(null);
    setLocalError(null);
    setPendingVersionKey(null);
    setBootstrapping(false);
    setIsSaveFormOpen(false);
    setSaveLabel("");
    setSaveDescription("");
    setSaveTags("");
    setSaveIcon("");
    setSaveFeedback(null);
    setSaveError(null);
    universeRegistryActions.clearError();
    onClose();
  }, [onClose]);

  const handleRefresh = useCallback(async () => {
    setLocalError(null);
    setBootstrapping(true);
    try {
      await universeRegistryActions.loadUniverses();
    } catch (err) {
      setLocalError(extractErrorMessage(err));
    } finally {
      setBootstrapping(false);
    }
  }, []);

  const handleToggleSaveForm = useCallback(() => {
    setIsSaveFormOpen((prev) => !prev);
    setSaveError(null);
    setSaveFeedback(null);
  }, []);

  const handleSubmitSaveUniverse = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!onSaveUniverse) {
        setSaveError("Saving universes isn't available right now.");
        return;
      }

      const label = saveLabel.trim();
      if (!label) {
        setSaveError("Name your universe before saving it.");
        return;
      }

      setIsSavingUniverse(true);
      setSaveError(null);

      const tags = saveTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      try {
        const result = await Promise.resolve(
          onSaveUniverse({
            label,
            description: saveDescription.trim() || undefined,
            icon: saveIcon.trim() || undefined,
            marketTags: tags,
          })
        );

        if (result && "universe" in result && result.universe) {
          setSelectedUniverseId(result.universe.id);
        }

        setLocalError(null);
        setSaveFeedback("Universe saved to your registry.");
        setIsSaveFormOpen(false);
        setSaveLabel("");
        setSaveDescription("");
        setSaveTags("");
        setSaveIcon("");
      } catch (err) {
        setSaveError(extractErrorMessage(err));
      } finally {
        setIsSavingUniverse(false);
      }
    },
    [onSaveUniverse, saveDescription, saveIcon, saveLabel, saveTags]
  );

  const ensureVersion = useCallback(
    async (universe: SavedUniverseSummary, versionId: string): Promise<SavedUniverseVersion> => {
      const key = `${universe.id}:${versionId}`;
      if (versions[key]) return versions[key]!;
      const version = await universeRegistryActions.loadUniverseVersion(universe.id, versionId);
      return version;
    },
    [versions]
  );

  const handleSelectUniverse = useCallback((universeId: string) => {
    setSelectedUniverseId(universeId);
    setLocalError(null);
    universeRegistryActions.setLastViewed(universeId);
  }, []);

  const handleLoadVersion = useCallback(
    async (universe: SavedUniverseSummary, versionId: string) => {
      setLocalError(null);
      const key = `${universe.id}:${versionId}`;
      setPendingVersionKey(key);
      try {
        const version = await ensureVersion(universe, versionId);
        await Promise.resolve(onLoadUniverse?.(universe, version));
      } catch (err) {
        setLocalError(extractErrorMessage(err));
      } finally {
        setPendingVersionKey(null);
      }
    },
    [ensureVersion, onLoadUniverse]
  );

  const handleLoadActiveVersion = useCallback(async () => {
    if (!selectedUniverse || !selectedUniverse.activeVersionId) return;
    await handleLoadVersion(selectedUniverse, selectedUniverse.activeVersionId);
  }, [handleLoadVersion, selectedUniverse]);

  const handlePauseUniverse = useCallback(async (universeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await universeRegistryActions.pauseUniverse(universeId);
    } catch (err) {
      setLocalError(extractErrorMessage(err));
    }
  }, []);

  const handleStopUniverse = useCallback(async (universeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Stop this universe? This will end all active executions.')) return;
    try {
      await universeRegistryActions.stopUniverse(universeId);
    } catch (err) {
      setLocalError(extractErrorMessage(err));
    }
  }, []);

  const handleResumeUniverse = useCallback(async (universeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await universeRegistryActions.launchUniverse({
        universeId,
        versionId: selectedUniverse?.activeVersionId ?? '',
        entryNodeId: null,
        dryRun: false,
        telemetryLevel: 'standard',
        notifyOnCompletion: false,
        completionChannels: [],
      });
    } catch (err) {
      setLocalError(extractErrorMessage(err));
    }
  }, [selectedUniverse]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="saved-universes-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleClose}
          />

          <motion.div
            className="saved-universes-panel"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <header>
              <div className="saved-universes-title">
                <h2>Saved Universes</h2>
                <p>Browse curated universes, inspect versions, and bring one back onto the canvas.</p>
              </div>
              <div className="saved-universes-controls">
                {onSaveUniverse ? (
                  <button
                    type="button"
                    className="su-button primary"
                    onClick={handleToggleSaveForm}
                    disabled={isSavingUniverse}
                  >
                    {isSaveFormOpen ? "Cancel" : "Save Universe"}
                  </button>
                ) : null}
                <button type="button" className="su-button" onClick={handleRefresh} disabled={bootstrapping || loading}>
                  ↻ Refresh
                </button>
              </div>
            </header>

            {saveFeedback ? <div className="su-inline-success">{saveFeedback}</div> : null}

            {onSaveUniverse && isSaveFormOpen ? (
              <form className="su-save-form" onSubmit={handleSubmitSaveUniverse}>
                <div className="su-save-row">
                  <label>
                    <span>Universe name</span>
                    <input
                      type="text"
                      value={saveLabel}
                      onChange={(event) => setSaveLabel(event.target.value)}
                      placeholder="e.g. Customer Onboarding Galaxy"
                      required
                    />
                  </label>
                  <label>
                    <span>Icon</span>
                    <input
                      type="text"
                      value={saveIcon}
                      onChange={(event) => setSaveIcon(event.target.value)}
                      placeholder="🌌"
                      maxLength={4}
                    />
                  </label>
                </div>
                <label>
                  <span>Description</span>
                  <textarea
                    value={saveDescription}
                    onChange={(event) => setSaveDescription(event.target.value)}
                    rows={2}
                    placeholder="Explain the playbook so teammates know when to launch it"
                  />
                </label>
                <label>
                  <span>Tags</span>
                  <input
                    type="text"
                    value={saveTags}
                    onChange={(event) => setSaveTags(event.target.value)}
                    placeholder="automation, onboarding, ai"
                  />
                  <span className="su-field-hint">Separate tags with commas to help organize your registry.</span>
                </label>
                {saveError ? <div className="su-inline-error">{saveError}</div> : null}
                <div className="su-save-actions">
                  <button type="submit" className="su-button primary" disabled={isSavingUniverse}>
                    {isSavingUniverse ? "Saving…" : "Save to Registry"}
                  </button>
                  <button
                    type="button"
                    className="su-button"
                    onClick={handleToggleSaveForm}
                    disabled={isSavingUniverse}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            <div className="saved-universes-body">
              <div className="saved-universes-left">
                <div className="su-toolbar">
                  <span className="su-caption">
                    {universes.length} universes • {recentUniverses.length} recent favorites
                  </span>
                </div>

                <div className="su-grid">
                  {bootstrapping && universes.length === 0 ? (
                    <div className="su-empty-state">
                      <strong>Loading your universe registry…</strong>
                      We are pulling the latest saved canvases and launch-ready templates.
                    </div>
                  ) : universes.length === 0 ? (
                    <div className="su-empty-state">
                      <strong>No universes captured yet</strong>
                      Start by saving your current canvas to create a persistent universe snapshot.
                    </div>
                  ) : (
                    <>
                      {recentUniverses.map((universe) => (
                        <button
                          key={universe.id}
                          type="button"
                          className={`su-card ${selectedUniverseId === universe.id ? "active" : ""}`}
                          onClick={() => handleSelectUniverse(universe.id)}
                        >
                          <div className="su-card-header">
                            <div className="su-card-title">
                              <h3>{universe.label}</h3>
                              {universe.description ? <p>{universe.description}</p> : null}
                            </div>
                            <div className="su-badge-row">
                              {universe.deploymentStatus === 'live' && (
                                <>
                                  <div className="su-chip live">🟢 LIVE</div>
                                  <button
                                    type="button"
                                    className="su-control-btn pause"
                                    onClick={(e) => handlePauseUniverse(universe.id, e)}
                                    title="Pause universe"
                                  >
                                    ⏸
                                  </button>
                                  <button
                                    type="button"
                                    className="su-control-btn stop"
                                    onClick={(e) => handleStopUniverse(universe.id, e)}
                                    title="Stop universe"
                                  >
                                    ⏹
                                  </button>
                                </>
                              )}
                              {universe.deploymentStatus === 'paused' && (
                                <>
                                  <div className="su-chip paused">⏸ PAUSED</div>
                                  <button
                                    type="button"
                                    className="su-control-btn resume"
                                    onClick={(e) => handleResumeUniverse(universe.id, e)}
                                    title="Resume universe"
                                  >
                                    ▶
                                  </button>
                                  <button
                                    type="button"
                                    className="su-control-btn stop"
                                    onClick={(e) => handleStopUniverse(universe.id, e)}
                                    title="Stop universe"
                                  >
                                    ⏹
                                  </button>
                                </>
                              )}
                              <div className="su-chip">Recent</div>
                            </div>
                          </div>
                          <div className="su-chip-row">
                            {universe.marketTags.slice(0, 3).map((tag) => (
                              <span key={tag} className="su-chip">
                                {tag}
                              </span>
                            ))}
                            {universe.dataSensitivity ? (
                              <span className="su-chip">{universe.dataSensitivity}</span>
                            ) : null}
                          </div>
                          <div className="su-metrics">
                            <span>{universe.versionIds.length} versions</span>
                            {universe.activeVersionId ? <span>Active: {universe.activeVersionId}</span> : null}
                            {universe.lastLaunchedAt && (
                              <span>Last launch: {new Date(universe.lastLaunchedAt).toLocaleString()}</span>
                            )}
                          </div>
                        </button>
                      ))}

                      {otherUniverses.map((universe) => (
                        <button
                          key={universe.id}
                          type="button"
                          className={`su-card ${selectedUniverseId === universe.id ? "active" : ""}`}
                          onClick={() => handleSelectUniverse(universe.id)}
                        >
                          <div className="su-card-header">
                            <div className="su-card-title">
                              <h3>{universe.label}</h3>
                              {universe.description ? <p>{universe.description}</p> : null}
                            </div>
                            <div className="su-badge-row">
                              {universe.deploymentStatus === 'live' && (
                                <>
                                  <div className="su-chip live">🟢 LIVE</div>
                                  <button
                                    type="button"
                                    className="su-control-btn pause"
                                    onClick={(e) => handlePauseUniverse(universe.id, e)}
                                    title="Pause universe"
                                  >
                                    ⏸
                                  </button>
                                  <button
                                    type="button"
                                    className="su-control-btn stop"
                                    onClick={(e) => handleStopUniverse(universe.id, e)}
                                    title="Stop universe"
                                  >
                                    ⏹
                                  </button>
                                </>
                              )}
                              {universe.deploymentStatus === 'paused' && (
                                <>
                                  <div className="su-chip paused">⏸ PAUSED</div>
                                  <button
                                    type="button"
                                    className="su-control-btn resume"
                                    onClick={(e) => handleResumeUniverse(universe.id, e)}
                                    title="Resume universe"
                                  >
                                    ▶
                                  </button>
                                  <button
                                    type="button"
                                    className="su-control-btn stop"
                                    onClick={(e) => handleStopUniverse(universe.id, e)}
                                    title="Stop universe"
                                  >
                                    ⏹
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="su-chip-row">
                            {universe.marketTags.slice(0, 3).map((tag) => (
                              <span key={tag} className="su-chip">
                                {tag}
                              </span>
                            ))}
                            {universe.dataSensitivity ? (
                              <span className="su-chip">{universe.dataSensitivity}</span>
                            ) : null}
                          </div>
                          <div className="su-metrics">
                            <span>{universe.versionIds.length} versions</span>
                            {universe.lastLaunchedAt ? (
                              <span>Last launch: {new Date(universe.lastLaunchedAt).toLocaleString()}</span>
                            ) : (
                              <span>Updated {new Date(universe.updatedAt).toLocaleString()}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="saved-universes-right">
                {localError && <div className="su-error">{localError}</div>}

                {!selectedUniverse ? (
                  <div className="su-empty-state">
                    <strong>Select a universe</strong>
                    Choose a universe from the list to inspect versions and metadata.
                  </div>
                ) : (
                  <>
                    <div className="su-detail-header">
                      <div className="su-detail-title">
                        <h3>{selectedUniverse.label}</h3>
                        {selectedUniverse.description ? (
                          <p>{selectedUniverse.description}</p>
                        ) : (
                          <p>No description available for this universe yet.</p>
                        )}
                      </div>
                      <div className="su-detail-actions">
                        <button
                          type="button"
                          className="su-button primary"
                          onClick={handleLoadActiveVersion}
                          disabled={
                            !selectedUniverse.activeVersionId ||
                            pendingVersionKey === `${selectedUniverse.id}:${selectedUniverse.activeVersionId}`
                          }
                        >
                          {pendingVersionKey === `${selectedUniverse.id}:${selectedUniverse.activeVersionId}`
                            ? "Loading…"
                            : "Load active version"}
                        </button>
                        <button type="button" className="su-button" onClick={handleRefresh} disabled={bootstrapping}>
                          Sync registry
                        </button>
                      </div>
                    </div>

                    <div className="su-caption">
                      Owner: {selectedUniverse.ownerId} • Created {new Date(selectedUniverse.createdAt).toLocaleDateString()} •
                      Updated {new Date(selectedUniverse.updatedAt).toLocaleDateString()}
                    </div>

                    <div className="su-versions-list">
                      {versionEntries.length === 0 ? (
                        <div className="su-empty-state">
                          <strong>No versions stored</strong>
                          Save a snapshot of this universe to capture versions for restoration.
                        </div>
                      ) : (
                        versionEntries.map(({ key, versionId, version }) => (
                          <div key={key} className="su-version-card">
                            <div className="su-version-row">
                              <div>
                                <div className="su-version-name">Version {versionId}</div>
                                <div className="su-caption">
                                  {version
                                    ? `Captured ${new Date(version.createdAt).toLocaleString()}`
                                    : "Details not loaded yet"}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="su-button"
                                onClick={() => handleLoadVersion(selectedUniverse, versionId)}
                                disabled={pendingVersionKey === key}
                              >
                                {pendingVersionKey === key ? "Loading…" : "Load"}
                              </button>
                            </div>

                            {version?.lastRunSummary ? (
                              <div className="su-caption">
                                Last run: {version.lastRunSummary.status} • Completed {new Date(version.lastRunSummary.completedAt).toLocaleString()} •
                                Duration {Math.round(version.lastRunSummary.durationMs / 1000)}s
                              </div>
                            ) : null}

                            {version?.bindings?.length ? (
                              <div className="su-caption">Bindings: {version.bindings.length}</div>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
