"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CsvImportError,
  downloadImportReport,
  getImportHistory,
  getImportIssues,
  getImportRun,
  importMerchantOffersCsv,
  importPriceUpdatesCsv,
  importProductsCsv,
} from "@/lib/products";
import type { ImportAccepted, ImportIssue, ImportJobStatus, ImportPage, ImportRun } from "@/types/import";

type ImportTab = "products" | "offers" | "prices";
const HISTORY_PAGE_SIZE = 10;
const ISSUE_PAGE_SIZE = 25;

const importLabels: Record<ImportTab, string> = {
  products: "Products",
  offers: "Merchant offers",
  prices: "Price refresh",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatStatus(status: ImportJobStatus): string {
  return status === "needs_review" ? "Needs review" : status === "partial" ? "Completed with issues" : status === "processing" ? "Processing" : status[0].toUpperCase() + status.slice(1);
}

function isActive(run: ImportRun | null | undefined): boolean {
  const status = run?.jobStatus ?? run?.status;
  return status === "queued" || status === "processing";
}

function progressLabel(run: ImportRun): string {
  if (run.jobStatus === "queued") return "Waiting to start";
  if (!run.progress) return "Waiting for progress";
  return `${run.progress.record.toLocaleString()} of ${run.progress.received.toLocaleString()} rows completed`;
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 break-words rounded-lg bg-zinc-50 px-3 py-2">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold tabular-nums text-zinc-900">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

export function ImportsAdminClient() {
  const [tab, setTab] = useState<ImportTab>("products");
  const [csv, setCsv] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportAccepted | null>(null);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [history, setHistory] = useState<ImportPage<ImportRun> | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRun, setSelectedRun] = useState<ImportRun | null>(null);
  const [issues, setIssues] = useState<ImportPage<ImportIssue> | null>(null);
  const [issueOffset, setIssueOffset] = useState(0);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [detailRefresh, setDetailRefresh] = useState(0);
  const historyRequest = useRef(0);
  const historyPending = useRef(false);
  const detailRequest = useRef(0);
  const detailPending = useRef(false);
  const submissionKey = useRef<string | null>(null);
  const submitting = useRef(false);

  const loadHistory = useCallback((offset: number) => {
    const requestId = ++historyRequest.current;
    historyPending.current = true;
    return getImportHistory(HISTORY_PAGE_SIZE, offset).then((page) => {
      if (requestId === historyRequest.current) {
        setHistory(page);
        setHistoryError(null);
      }
    }).catch((cause: unknown) => {
      if (requestId === historyRequest.current) {
        setHistoryError(cause instanceof Error ? cause.message : "Could not load import history.");
      }
    }).finally(() => {
      if (requestId === historyRequest.current) historyPending.current = false;
    });
  }, []);

  useEffect(() => () => {
    historyRequest.current += 1;
    detailRequest.current += 1;
  }, []);

  useEffect(() => { void loadHistory(historyOffset); }, [historyOffset, loadHistory]);

  useEffect(() => {
    if (!history?.rows.some(isActive) && !isActive(selectedRun)) return;
    const timer = window.setInterval(() => {
      if (!historyPending.current) void loadHistory(historyOffset);
      if (!detailPending.current) setDetailRefresh((value) => value + 1);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [selectedRun, history, historyOffset, loadHistory]);

  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;
    const requestId = ++detailRequest.current;
    detailPending.current = true;
    Promise.all([
      getImportRun(selectedId),
      getImportIssues(selectedId, ISSUE_PAGE_SIZE, issueOffset),
    ]).then(([run, page]) => {
      if (!cancelled && requestId === detailRequest.current) {
        setSelectedRun(run);
        setIssues(page);
        setDetailError(null);
      }
    }).catch((cause: unknown) => {
      if (!cancelled && requestId === detailRequest.current) setDetailError(cause instanceof Error ? cause.message : "Could not load this report.");
    }).finally(() => {
      if (requestId === detailRequest.current) detailPending.current = false;
    });
    return () => { cancelled = true; };
  }, [selectedId, issueOffset, detailRefresh]);

  const openReport = (id: number) => {
    setSelectedId(id);
    setSelectedRun(null);
    setIssues(null);
    setIssueOffset(0);
    setDetailError(null);
    setDetailRefresh((value) => value + 1);
  };

  const selectTab = (next: ImportTab) => {
    submissionKey.current = null;
    setTab(next);
    setCsv("");
    setFile(null);
    setError(null);
    setResult(null);
  };

  const runImport = async () => {
    if (submitting.current) return;
    setError(null);
    setResult(null);
    const payload = file ?? (csv.trim() ? csv : null);
    if (!payload) {
      setError("Choose a CSV file or open the paste option and add CSV content.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      // Retain the key when a response is lost so the next attempt finds the same job.
      submissionKey.current ??= crypto.randomUUID();
      const response = tab === "products"
        ? await importProductsCsv(payload, submissionKey.current)
        : tab === "offers"
          ? await importMerchantOffersCsv(payload, submissionKey.current)
          : await importPriceUpdatesCsv(payload, submissionKey.current);
      setResult(response);
      submissionKey.current = null;
      if (response.importId) openReport(response.importId);
      setHistoryOffset(0);
      setHistory(null);
      setHistoryError(null);
      void loadHistory(0);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Import failed.");
      if (cause instanceof CsvImportError && cause.importId) {
        openReport(cause.importId);
        setHistoryOffset(0);
        setHistory(null);
        setHistoryError(null);
        void loadHistory(0);
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedId) return;
    setDownloading(true);
    setDetailError(null);
    try {
      await downloadImportReport(selectedId);
    } catch (cause: unknown) {
      setDetailError(cause instanceof Error ? cause.message : "Could not download the report.");
    } finally {
      setDownloading(false);
    }
  };

  const retryReport = () => {
    if (selectedId === null) return;
    setSelectedRun(null);
    setIssues(null);
    setDetailError(null);
    setDetailRefresh((value) => value + 1);
  };

  const requiredColumns = tab === "products"
    ? "Required columns: name, brand, category, skinTypeSource."
    : tab === "offers"
      ? "Required columns: productId, brand, name, merchant, website, price, status."
      : "Required columns: brand, name, price, merchant, stock.";

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Imports run in the background. You can leave this page and return to view status and the saved report.
      </div>

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-0.5 rounded-2xl bg-zinc-100 p-1 ring-1 ring-inset ring-zinc-900/5 contrast-more:ring-zinc-400 sm:grid-cols-3" aria-label="Import type">
          {(Object.keys(importLabels) as ImportTab[]).map((key) => (
            <button key={key} type="button" disabled={busy} aria-pressed={tab === key} onClick={() => selectTab(key)}
              className={`min-h-11 touch-manipulation select-none rounded-xl px-3 text-sm font-medium transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84] disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none ${tab === key ? "bg-white text-[#0e4a84] shadow-[0_1px_3px_rgb(0_0_0/0.08)] contrast-more:ring-1 contrast-more:ring-zinc-500" : "text-zinc-600 hover:bg-white/70 active:bg-zinc-200"}`}>
              {importLabels[key]}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="csv-file" className="text-sm font-medium text-zinc-800">Choose a CSV file</label>
          <input id="csv-file" key={tab} type="file" accept=".csv,text/csv,text/plain" disabled={busy}
            onChange={(event) => { submissionKey.current = null; const picked = event.target.files?.[0] ?? null; setFile(picked); if (picked) setCsv(""); }}
            className="mt-2 block min-h-11 w-full text-base text-zinc-700 file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:text-sm file:font-medium file:text-zinc-800 hover:file:bg-zinc-200 sm:text-sm" />
          {file && <p className="mt-1 break-all text-xs text-zinc-500">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
          <p className="mt-2 break-words text-sm text-zinc-600">{requiredColumns}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {tab === "products"
              ? "Successful rows replace catalog fields. Blank or missing optional fields clear existing values. Merchant offer prices are managed by the offer and price imports."
              : tab === "offers"
                ? "Only matched rows are imported. A product and merchant must match existing records; -1 means price unavailable."
                : "Updates existing offers only. Rows without an existing product-merchant link are skipped."}
            {" "}Malformed or unmatched rows appear in the run report.
          </p>
        </div>

        <details className="rounded-lg border border-zinc-200 px-3">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-zinc-700">Paste CSV instead</summary>
          <textarea value={csv} disabled={busy || Boolean(file)} onChange={(event) => { submissionKey.current = null; setCsv(event.target.value); if (event.target.value.trim()) setFile(null); }}
            rows={8} aria-label="Paste CSV content" placeholder="Paste the header row and CSV records here."
            className="mb-3 min-h-32 w-full rounded-lg border border-zinc-300 px-3 py-3 font-mono text-base text-zinc-900 focus-visible:outline-2 focus-visible:outline-[#0e4b84] sm:text-sm" />
        </details>

        <button type="button" disabled={busy} onClick={() => void runImport()}
          className="min-h-11 w-full rounded-lg bg-[#0e4b84] px-5 text-sm font-semibold text-white hover:bg-[#0b3c6a] disabled:opacity-50 sm:w-auto">
          {busy ? "Submitting…" : `Run ${importLabels[tab].toLowerCase()} import`}
        </button>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        {result && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm" role="status">
            <p>{result.message}</p>
            <button type="button" onClick={() => openReport(result.importId)} className="min-h-11 font-medium text-[#0e4b84] underline">Open report #{result.importId}</button>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="text-base font-semibold text-zinc-900">Import history</h2><p className="text-sm text-zinc-500">Newest runs first</p></div>
          <button type="button" onClick={() => { setHistoryError(null); void loadHistory(historyOffset); }} className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Refresh history</button>
        </div>
        {historyError && <p role="alert" className="text-sm text-red-700">{historyError}</p>}
        {!history && historyError ? <button type="button" onClick={() => { setHistoryError(null); void loadHistory(historyOffset); }} className="min-h-11 rounded-lg border border-zinc-300 px-4 text-sm text-zinc-700">Retry loading history</button> : !history ? <p className="text-sm text-zinc-500">Loading import history…</p> : history.rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">No import runs yet.</p>
        ) : (
          <div className="space-y-2">
            {history.rows.map((run) => (
              <button key={run.id} type="button" onClick={() => openReport(run.id)}
                aria-expanded={selectedId === run.id} className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm focus-visible:outline-2 focus-visible:outline-[#0e4b84] ${selectedId === run.id ? "border-[#0e4b84]" : "border-zinc-200 hover:border-zinc-400"}`}>
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-zinc-900">{importLabels[run.importType]} · #{run.id}</span>
                  <span className="text-xs text-zinc-500">{formatStatus(run.jobStatus ?? run.status)}</span>
                </span>
                <span className="mt-1 block break-all text-sm text-zinc-700">{run.sourceName}</span>
                <span className="mt-2 block text-xs text-zinc-500">{formatDate(run.startedAt)} · {run.reportComplete ? `${run.received.toLocaleString()} rows · ${run.skipped.toLocaleString()} skipped · ${run.failed.toLocaleString()} failed · ${run.partialSuccess.toLocaleString()} partial` : isActive(run) ? progressLabel(run) : "Report incomplete; totals unavailable"}</span>
              </button>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button type="button" disabled={historyOffset === 0} onClick={() => { setHistory(null); setHistoryOffset(Math.max(0, historyOffset - HISTORY_PAGE_SIZE)); }} className="min-h-11 rounded-lg border border-zinc-300 px-4 text-sm disabled:opacity-40">Previous</button>
              <span className="w-full text-center text-xs text-zinc-500 sm:w-auto">{history.total ? `${historyOffset + 1}–${Math.min(historyOffset + history.rows.length, history.total)} of ${history.total}` : "0 runs"}</span>
              <button type="button" disabled={historyOffset + HISTORY_PAGE_SIZE >= history.total} onClick={() => { setHistory(null); setHistoryOffset(historyOffset + HISTORY_PAGE_SIZE); }} className="min-h-11 rounded-lg border border-zinc-300 px-4 text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </section>

      {selectedId !== null && (
        <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="import-report-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><h2 id="import-report-heading" className="text-base font-semibold text-zinc-900">Run report #{selectedId}</h2><p className="break-all text-sm text-zinc-500">{selectedRun ? `${selectedRun.sourceName} · ${formatDate(selectedRun.startedAt)}` : "Loading report…"}</p></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={downloading} onClick={() => void handleDownload()} className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 disabled:opacity-50">{downloading ? "Preparing…" : "Download JSON"}</button>
              <button type="button" onClick={() => { setSelectedId(null); setSelectedRun(null); }} aria-label="Close report" className="min-h-11 rounded-lg px-3 text-sm text-zinc-600 hover:bg-zinc-100">Close</button>
            </div>
          </div>
          {detailError && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">
              <span>{detailError}</span>
              <button type="button" onClick={retryReport} className="min-h-11 rounded-lg border border-red-300 px-3 font-medium hover:bg-red-100">Retry report</button>
            </div>
          )}
          {selectedRun && (
            <>
              <p className="break-all text-xs leading-6 text-zinc-500">
                Started {formatDate(selectedRun.startedAt)} · Finished {formatDate(selectedRun.finishedAt)} · {selectedRun.durationMs === null ? "Duration unavailable" : `${(selectedRun.durationMs / 1000).toFixed(1)} seconds`}<br />
                Actor {selectedRun.actorId || "unknown"} · Request {selectedRun.requestId || "unavailable"}
              </p>
              {!selectedRun.reportComplete ? (
                <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                  <p role="status">{formatStatus(selectedRun.jobStatus ?? selectedRun.status)} · {progressLabel(selectedRun)}</p>
                  {selectedRun.progress && (
                    <progress aria-label="Import rows completed" className="h-2 w-full accent-[#0e4b84]" value={selectedRun.progress.record} max={Math.max(selectedRun.progress.received, 1)} />
                  )}
                  {selectedRun.progress && (
                    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Count label="Created so far" value={selectedRun.progress.created} />
                      <Count label="Updated so far" value={selectedRun.progress.updated} />
                      <Count label="Skipped so far" value={selectedRun.progress.skipped} />
                      <Count label="Failed so far" value={selectedRun.progress.failed} />
                    </dl>
                  )}
                  <p>{isActive(selectedRun) ? "Progress is provisional until the import finishes." : "Report incomplete. Some catalog changes may have been saved. Review the issues before submitting again."}</p>
                  {selectedRun.jobError && <p>{selectedRun.jobError}</p>}
                </div>
              ) : (
                <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] gap-2">
                  <div className="min-w-0 break-words rounded-lg bg-zinc-50 px-3 py-2"><dt className="text-xs text-zinc-500">Status</dt><dd className="mt-0.5 text-sm font-semibold text-zinc-900">{formatStatus(selectedRun.jobStatus ?? selectedRun.status)}</dd></div>
                  <Count label="Received" value={selectedRun.received} />
                  <Count label="Processed" value={selectedRun.processed} />
                  <Count label="Created" value={selectedRun.created} />
                  <Count label="Updated" value={selectedRun.updated} />
                  <Count label="Skipped" value={selectedRun.skipped} />
                  <Count label="Failed" value={selectedRun.failed} />
                  <Count label="Warnings" value={selectedRun.warnings} />
                  <Count label="Partial success" value={selectedRun.partialSuccess} />
                </dl>
              )}
              <h3 className="text-sm font-semibold text-zinc-900">Row issues and skips</h3>
              {!issues ? <p className="text-sm text-zinc-500">Loading rows…</p> : issues.rows.length === 0 ? <p className="text-sm text-zinc-500">No row issues recorded.</p> : (
                <div className="space-y-2">
                  {issues.rows.map((issue) => (
                    <article key={issue.id} className="rounded-lg border border-zinc-200 p-3">
                      <div className="flex flex-wrap justify-between gap-2"><p className="min-w-0 break-words font-medium text-zinc-900 [overflow-wrap:anywhere]">{issue.brand || "Unknown brand"} · {issue.name || "Unnamed record"}</p><span className="shrink-0 text-xs font-medium text-zinc-600">{issue.outcome.replaceAll("_", " ")}</span></div>
                      <p className="mt-1 break-words text-sm text-zinc-700 [overflow-wrap:anywhere]">{issue.reason}</p>
                      <p className="mt-2 break-words text-xs text-zinc-500">Record {issue.recordNumber || "—"} · source line{issue.sourceLineStart === issue.sourceLineEnd ? "" : "s"} {issue.sourceLineStart}{issue.sourceLineStart === issue.sourceLineEnd ? "" : `–${issue.sourceLineEnd}`} · {issue.stage} · {issue.code}</p>
                    </article>
                  ))}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button type="button" disabled={issueOffset === 0} onClick={() => { setIssues(null); setIssueOffset(Math.max(0, issueOffset - ISSUE_PAGE_SIZE)); }} className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm disabled:opacity-40">Previous rows</button>
                    <span className="w-full text-center text-xs text-zinc-500 sm:w-auto">{issues.total ? `${issueOffset + 1}–${Math.min(issueOffset + issues.rows.length, issues.total)} of ${issues.total}` : "0 issues"}</span>
                    <button type="button" disabled={issueOffset + ISSUE_PAGE_SIZE >= issues.total} onClick={() => { setIssues(null); setIssueOffset(issueOffset + ISSUE_PAGE_SIZE); }} className="min-h-11 rounded-lg border border-zinc-300 px-3 text-sm disabled:opacity-40">Next rows</button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
