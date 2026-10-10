import {
  ArrowRight,
  Check,
  ClockCounterClockwise,
  Database,
  DownloadSimple,
  Trash,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CommandBar } from "./components/CommandBar";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ExportDrawer } from "./components/ExportDrawer";
import { HistoryView } from "./components/HistoryView";
import { LedgerStrip } from "./components/LedgerStrip";
import { Notice, type NoticeTone } from "./components/Notice";
import { RecordDrawer, type DrawerState } from "./components/RecordDrawer";
import { RecordTable } from "./components/RecordTable";
import { SyncRail, type OperationPhase } from "./components/SyncRail";
import { TopBar } from "./components/TopBar";
import { RESOURCE_DEFINITIONS } from "./domain/resources";
import {
  buildSyncPreview,
  simulateUpstreamChange,
} from "./domain/syncEngine";
import type {
  ConflictResolution,
  ResourceName,
  SourceRecord,
  StoredRecord,
  SyncPreview,
  SyncRun,
} from "./domain/types";
import {
  applySyncPreview,
  clearResource,
  getStoredRecords,
  getSyncHistory,
  recordFailedSync,
  saveLocalEdit,
} from "./infrastructure/database";
import { fetchResource } from "./infrastructure/dummyJsonClient";
import {
  downloadTextFile,
  recordsToCsv,
  recordsToJson,
} from "./features/exportData";
import { useTheme } from "./features/theme";

type WorkspaceView = "preview" | "local" | "history";

interface NoticeState {
  tone: NoticeTone;
  title: string;
  message: string;
  actionLabel: string | null;
}

function describeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The operation could not be completed. Try again.";
}

export function App() {
  const { theme, setTheme } = useTheme();
  const [resource, setResource] = useState<ResourceName>("products");
  const [view, setView] = useState<WorkspaceView>("preview");
  const [phase, setPhase] = useState<OperationPhase>("idle");
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const [history, setHistory] = useState<SyncRun[]>([]);
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(
    new Map(),
  );
  const [delayMs, setDelayMs] = useState(0);
  const [failNextRequest, setFailNextRequest] = useState(false);
  const [simulateUpstream, setSimulateUpstream] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const previewStartedAt = useRef<Date | null>(null);
  const fetchAbort = useRef<AbortController | null>(null);

  const refreshLocalState = useCallback(async (selectedResource: ResourceName) => {
    const [nextRecords, nextHistory] = await Promise.all([
      getStoredRecords(selectedResource),
      getSyncHistory(),
    ]);
    setRecords(nextRecords.sort((left, right) => left.id - right.id));
    setHistory(nextHistory);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([getStoredRecords(resource), getSyncHistory()]).then(
      ([nextRecords, nextHistory]) => {
        if (!active) {
          return;
        }
        setRecords(nextRecords.sort((left, right) => left.id - right.id));
        setHistory(nextHistory);
      },
    );
    return () => {
      active = false;
      fetchAbort.current?.abort();
    };
  }, [resource]);

  const hasLocalEdits = records.some(
    (record) => record.localHash !== record.sourceHash,
  );
  const unresolvedConflicts = preview
    ? preview.items.filter(
        (item) => item.status === "conflict" && !resolutions.has(item.key),
      ).length
    : 0;
  const busy = phase === "fetching" || phase === "applying";

  const handleResourceChange = (nextResource: ResourceName) => {
    setResource(nextResource);
    setPreview(null);
    setResolutions(new Map());
    setNotice(null);
    setPhase("idle");
    setView("preview");
    setSimulateUpstream(false);
    setExportOpen(false);
  };

  const handleFetch = useCallback(async () => {
    fetchAbort.current?.abort();
    const controller = new AbortController();
    fetchAbort.current = controller;
    const startedAt = new Date();
    previewStartedAt.current = startedAt;
    setPhase("fetching");
    setNotice(null);
    setResolutions(new Map());

    try {
      const fetched = await fetchResource(resource, {
        delayMs,
        failNextRequest,
        signal: controller.signal,
      });

      let nextRecords = fetched.records;
      let simulatedId: number | null = null;
      if (simulateUpstream) {
        const simulation = simulateUpstreamChange(
          fetched.records,
          records,
          RESOURCE_DEFINITIONS[resource].simulateSourceChange,
        );
        nextRecords = simulation.records;
        simulatedId = simulation.simulatedId;
      }

      const nextPreview = await buildSyncPreview(
        resource,
        { ...fetched, records: nextRecords },
        records,
      );
      setPreview(nextPreview);
      setPhase("preview");
      setView("preview");

      if (simulateUpstream && simulatedId !== null) {
        setNotice({
          tone: "warning",
          title: "Source simulation applied",
          message: `Record #${simulatedId} changed in the fetched snapshot. Review the resulting conflict before writing locally.`,
          actionLabel: null,
        });
      } else if (nextPreview.counts.invalid > 0) {
        setNotice({
          tone: "warning",
          title: "Some records failed validation",
          message: `${nextPreview.counts.invalid} source records will be excluded from this sync.`,
          actionLabel: null,
        });
      } else {
        setNotice({
          tone: "info",
          title: "Preview ready",
          message: "Review the proposed changes. IndexedDB has not been modified.",
          actionLabel: null,
        });
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const message = describeError(error);
      setPhase("error");
      setNotice({
        tone: "error",
        title: "Fetch failed",
        message,
        actionLabel: "Retry",
      });
      await recordFailedSync(resource, startedAt, message);
      await refreshLocalState(resource);
    } finally {
      setFailNextRequest(false);
      if (fetchAbort.current === controller) {
        fetchAbort.current = null;
      }
    }
  }, [delayMs, failNextRequest, records, refreshLocalState, resource, simulateUpstream]);

  const handleApply = async () => {
    if (!preview || unresolvedConflicts > 0) {
      return;
    }
    setPhase("applying");
    setNotice(null);

    try {
      await applySyncPreview({
        preview,
        resolutions,
        startedAt: previewStartedAt.current ?? new Date(preview.fetchedAt),
      });
      await refreshLocalState(resource);
      setPhase("success");
      setNotice({
        tone: "success",
        title: "Sync committed",
        message: "The reviewed snapshot was written to IndexedDB in one transaction.",
        actionLabel: "View local data",
      });
    } catch (error) {
      setPhase("error");
      setNotice({
        tone: "error",
        title: "IndexedDB write failed",
        message: `${describeError(error)} The preview is still available.`,
        actionLabel: "Retry write",
      });
    }
  };

  const handleSaveLocalEdit = async (key: string, data: SourceRecord) => {
    await saveLocalEdit(key, data);
    await refreshLocalState(resource);
    setPreview(null);
    setResolutions(new Map());
    setPhase("idle");
    setNotice({
      tone: "success",
      title: "Local copy saved",
      message: "Fetch changes again to verify that the sync protects this edit.",
      actionLabel: "Fetch again",
    });
  };

  const handleResolution = (key: string, resolution: ConflictResolution) => {
    setResolutions((current) => {
      const next = new Map(current);
      next.set(key, resolution);
      return next;
    });
  };

  const handleClearResource = async () => {
    await clearResource(resource);
    await refreshLocalState(resource);
    setPreview(null);
    setResolutions(new Map());
    setPhase("idle");
    setSimulateUpstream(false);
    setNotice({
      tone: "info",
      title: `${RESOURCE_DEFINITIONS[resource].label} cleared`,
      message: "Only this browser's local resource data was removed. Run a fresh sync to restore it.",
      actionLabel: null,
    });
  };

  const exportJson = () => {
    downloadTextFile(
      `api-sync-${resource}.json`,
      recordsToJson(resource, records),
      "application/json;charset=utf-8",
    );
  };

  const exportCsv = () => {
    downloadTextFile(
      `api-sync-${resource}.csv`,
      recordsToCsv(records),
      "text/csv;charset=utf-8",
    );
  };

  const noticeAction = (() => {
    if (!notice?.actionLabel) {
      return undefined;
    }
    if (notice.actionLabel === "View local data") {
      return () => setView("local");
    }
    if (notice.actionLabel === "Retry write") {
      return () => void handleApply();
    }
    return () => void handleFetch();
  })();

  const emptyPreview = !preview && phase !== "fetching";

  return (
    <div className="app-shell">
      <TopBar theme={theme} onThemeChange={setTheme} />

      <main id="main-content" className="main-content">
        <section className="intro" aria-labelledby="page-title">
          <div>
            <h1 id="page-title">Move API data without losing local work.</h1>
            <p>
              Fetch, validate, review, and commit DummyJSON records to IndexedDB with explicit conflict decisions.
            </p>
          </div>
          <div className="intro-proof" aria-label="Project characteristics">
            <span><Check size={16} weight="bold" aria-hidden="true" /> Runtime validated</span>
            <span><Check size={16} weight="bold" aria-hidden="true" /> Transactional writes</span>
            <span><Check size={16} weight="bold" aria-hidden="true" /> No backend required</span>
          </div>
        </section>

        <SyncRail phase={phase} preview={preview} localCount={records.length} />

        <section className="workspace" aria-labelledby="workspace-title">
          <div className="workspace-heading">
            <div>
              <h2 id="workspace-title">Reconciliation workspace</h2>
              <p>Nothing is written until the preview is valid and every conflict has a decision.</p>
            </div>
          </div>

          <CommandBar
            resource={resource}
            onResourceChange={handleResourceChange}
            delayMs={delayMs}
            onDelayChange={setDelayMs}
            failNextRequest={failNextRequest}
            onFailNextRequestChange={setFailNextRequest}
            simulateUpstream={simulateUpstream}
            onSimulateUpstreamChange={setSimulateUpstream}
            onFetch={() => void handleFetch()}
            busy={busy}
            hasLocalEdits={hasLocalEdits}
          />

          {notice ? (
            <Notice
              tone={notice.tone}
              title={notice.title}
              message={notice.message}
              actionLabel={notice.actionLabel ?? undefined}
              onAction={noticeAction}
            />
          ) : null}

          {preview ? <LedgerStrip counts={preview.counts} /> : null}

          <div className="workspace-nav">
            <div className="workspace-tabs" role="tablist" aria-label="Workspace views">
              <button
                role="tab"
                aria-selected={view === "preview"}
                className={view === "preview" ? "is-active" : undefined}
                onClick={() => setView("preview")}
              >
                Sync preview
                {preview ? <span>{preview.items.length}</span> : null}
              </button>
              <button
                role="tab"
                aria-selected={view === "local"}
                className={view === "local" ? "is-active" : undefined}
                onClick={() => setView("local")}
              >
                Local data <span>{records.length}</span>
              </button>
              <button
                role="tab"
                aria-selected={view === "history"}
                className={view === "history" ? "is-active" : undefined}
                onClick={() => setView("history")}
              >
                Run history <span>{history.length}</span>
              </button>
            </div>

            {view === "local" && records.length > 0 ? (
              <div className="data-actions">
                <button className="button button-quiet button-small" onClick={exportJson}>
                  <DownloadSimple aria-hidden="true" size={16} /> JSON
                </button>
                <button className="button button-quiet button-small" onClick={exportCsv}>
                  <DownloadSimple aria-hidden="true" size={16} /> CSV
                </button>
                <button
                  className="button button-secondary button-small"
                  onClick={() => setExportOpen(true)}
                >
                  <DownloadSimple aria-hidden="true" size={16} /> XLSX
                </button>
                <button
                  className="button button-quiet button-small danger-text"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash aria-hidden="true" size={16} /> Clear
                </button>
              </div>
            ) : null}
          </div>

          <div role="tabpanel" className="workspace-panel">
            {view === "preview" ? (
              phase === "fetching" ? (
                <div className="loading-state" aria-live="polite">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <span>Fetching and validating {resource}...</span>
                </div>
              ) : emptyPreview ? (
                <div className="primary-empty">
                  <span className="empty-icon" aria-hidden="true">
                    <Database size={31} weight="duotone" />
                  </span>
                  <h3>Start with a source snapshot</h3>
                  <p>
                    Fetch {RESOURCE_DEFINITIONS[resource].label.toLowerCase()} to compare DummyJSON with this browser's IndexedDB.
                  </p>
                  <button className="button button-primary" onClick={() => void handleFetch()}>
                    Fetch changes <ArrowRight aria-hidden="true" size={17} />
                  </button>
                </div>
              ) : preview ? (
                <RecordTable
                  mode="preview"
                  resource={resource}
                  previewItems={preview.items}
                  records={records}
                  resolutions={resolutions}
                  onEdit={(record) => setDrawer({ mode: "edit", record })}
                  onReviewConflict={(item) => setDrawer({ mode: "conflict", item })}
                />
              ) : null
            ) : view === "local" ? (
              records.length > 0 ? (
                <RecordTable
                  mode="local"
                  resource={resource}
                  previewItems={[]}
                  records={records}
                  resolutions={resolutions}
                  onEdit={(record) => setDrawer({ mode: "edit", record })}
                  onReviewConflict={(item) => setDrawer({ mode: "conflict", item })}
                />
              ) : (
                <div className="primary-empty compact-empty">
                  <span className="empty-icon" aria-hidden="true"><Database size={28} /></span>
                  <h3>No local {resource} yet</h3>
                  <p>Apply a reviewed sync to populate IndexedDB.</p>
                  <button className="button button-secondary" onClick={() => setView("preview")}>
                    Open sync preview
                  </button>
                </div>
              )
            ) : (
              <HistoryView history={history} />
            )}
          </div>

          {view === "preview" && preview ? (
            <footer className="apply-bar">
              <div>
                <strong>
                  {unresolvedConflicts > 0
                    ? `${unresolvedConflicts} conflict decisions required`
                    : "Preview is ready to commit"}
                </strong>
                <span>
                  {phase === "success"
                    ? "This preview has been applied. Fetch again to check for new changes."
                    : "Invalid records are excluded. Local-only changes remain untouched."}
                </span>
              </div>
              <button
                className="button button-primary"
                onClick={() => void handleApply()}
                disabled={busy || unresolvedConflicts > 0 || phase === "success"}
              >
                <Database aria-hidden="true" size={18} />
                {phase === "applying" ? "Writing to IndexedDB" : phase === "success" ? "Sync applied" : "Apply sync"}
              </button>
            </footer>
          ) : null}
        </section>

        <footer className="site-footer">
          <span>API Sync Workbench</span>
          <span>Data stays in this browser.</span>
          <a href="https://dummyjson.com/docs" target="_blank" rel="noreferrer">
            DummyJSON documentation
          </a>
          <span className="footer-history">
            <ClockCounterClockwise aria-hidden="true" size={15} /> {history.length} recorded runs
          </span>
        </footer>
      </main>

      <RecordDrawer
        state={drawer}
        onClose={() => setDrawer(null)}
        onSave={handleSaveLocalEdit}
        onResolve={handleResolution}
      />

      <ExportDrawer
        open={exportOpen}
        resource={resource}
        records={records}
        onClose={() => setExportOpen(false)}
        onExported={(count) => {
          setExportOpen(false);
          setNotice({
            tone: "success",
            title: "XLSX export ready",
            message: `${count} ${count === 1 ? "record was" : "records were"} exported from the current local resource.`,
            actionLabel: null,
          });
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        title={`Clear local ${resource}?`}
        message="This removes the selected resource from IndexedDB in this browser. Sync history remains available."
        confirmLabel="Clear local data"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          void handleClearResource();
        }}
      />
    </div>
  );
}
