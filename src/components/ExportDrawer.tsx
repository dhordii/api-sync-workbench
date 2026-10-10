import { DownloadSimple, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { RESOURCE_DEFINITIONS } from "../domain/resources";
import type { ResourceName, StoredRecord } from "../domain/types";
import { downloadBlobFile, recordsToXlsx } from "../features/exportData";
import {
  createDefaultExportFilters,
  filterExportRecords,
  getAvailableExportColumns,
  getDefaultExportColumnKeys,
  getDistinctFieldValues,
  type ExportFilters,
} from "../features/exportSelection";

interface ExportDrawerProps {
  open: boolean;
  resource: ResourceName;
  records: StoredRecord[];
  onClose: () => void;
  onExported: (count: number) => void;
}

interface ChecklistFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (value: string, checked: boolean) => void;
}

function ChecklistFilter({
  label,
  options,
  selected,
  onChange,
}: ChecklistFilterProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <details className="export-checklist">
      <summary>
        <span>{label}</span>
        <small>{selected.length === 0 ? "All" : `${selected.length} selected`}</small>
      </summary>
      <div className="export-checklist-options">
        {options.map((option) => (
          <label key={option}>
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(event) => onChange(option, event.target.checked)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

function toggleValue(values: string[], value: string, checked: boolean): string[] {
  if (checked) {
    return values.includes(value) ? values : [...values, value];
  }
  return values.filter((item) => item !== value);
}

function dateStamp(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function ExportDrawer({
  open,
  resource,
  records,
  onClose,
  onExported,
}: ExportDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<ExportFilters>(createDefaultExportFilters);
  const [excludedKeys, setExcludedKeys] = useState<Set<string>>(new Set());
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const definition = RESOURCE_DEFINITIONS[resource];
  const availableColumns = useMemo(
    () => getAvailableExportColumns(resource, records),
    [records, resource],
  );
  const defaultColumnKeys = useMemo(
    () => getDefaultExportColumnKeys(resource, availableColumns),
    [availableColumns, resource],
  );
  const categories = useMemo(() => getDistinctFieldValues(records, "category"), [records]);
  const brands = useMemo(() => getDistinctFieldValues(records, "brand"), [records]);
  const roles = useMemo(() => getDistinctFieldValues(records, "role"), [records]);
  const filteredRecords = useMemo(
    () => filterExportRecords(resource, records, filters),
    [filters, records, resource],
  );
  const selectedRecords = useMemo(
    () => filteredRecords.filter((record) => !excludedKeys.has(record.key)),
    [excludedKeys, filteredRecords],
  );
  const selectedColumns = useMemo(
    () => availableColumns.filter((column) => selectedColumnKeys.has(column.key)),
    [availableColumns, selectedColumnKeys],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      setFilters(createDefaultExportFilters());
      setExcludedKeys(new Set());
      setSelectedColumnKeys(new Set(defaultColumnKeys));
      setError(null);
      setExporting(false);
      dialog.showModal();
      window.setTimeout(() => searchRef.current?.focus(), 0);
    }
    if (!open && dialog?.open) {
      dialog.close();
    }
  }, [defaultColumnKeys, open]);

  const closeDialog = () => {
    if (!exporting) {
      dialogRef.current?.close();
    }
  };

  const updateFilter = <Key extends keyof ExportFilters>(
    key: Key,
    value: ExportFilters[Key],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const setVisibleSelection = (selected: boolean) => {
    setExcludedKeys((current) => {
      const next = new Set(current);
      for (const record of filteredRecords) {
        if (selected) {
          next.delete(record.key);
        } else {
          next.add(record.key);
        }
      }
      return next;
    });
  };

  const toggleRecord = (key: string, checked: boolean) => {
    setExcludedKeys((current) => {
      const next = new Set(current);
      if (checked) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleColumn = (key: string, checked: boolean) => {
    setSelectedColumnKeys((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
    setError(null);
  };

  const handleExport = async () => {
    if (selectedRecords.length === 0 || selectedColumns.length === 0) {
      return;
    }
    setExporting(true);
    setError(null);
    try {
      const now = new Date();
      const blob = await recordsToXlsx(resource, selectedRecords, selectedColumns, now);
      downloadBlobFile(`api-sync-${resource}-${dateStamp(now)}.xlsx`, blob);
      onExported(selectedRecords.length);
      dialogRef.current?.close();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The XLSX file could not be created. Try again.",
      );
    } finally {
      setExporting(false);
    }
  };

  if (!open) {
    return <dialog ref={dialogRef} />;
  }

  return (
    <dialog
      className="export-drawer"
      ref={dialogRef}
      onClose={onClose}
      onCancel={(event) => {
        if (exporting) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        closeDialog();
      }}
      aria-labelledby="export-title"
    >
      <header className="drawer-header export-header">
        <div>
          <span>Local {definition.label.toLowerCase()}</span>
          <h2 id="export-title">Prepare XLSX export</h2>
          <p>Filter the local data, exclude individual records, and choose the columns to include.</p>
        </div>
        <button
          className="icon-button"
          onClick={closeDialog}
          aria-label="Close export"
          disabled={exporting}
        >
          <X aria-hidden="true" size={20} />
        </button>
      </header>

      <div className="export-layout">
        <aside className="export-controls" aria-label="Export filters and columns">
          <section className="export-control-section" aria-labelledby="filter-heading">
            <div className="export-section-heading">
              <h3 id="filter-heading">Filter records</h3>
              <button
                type="button"
                className="text-button"
                onClick={() => setFilters(createDefaultExportFilters())}
              >
                Reset filters
              </button>
            </div>

            <label className="search-field export-search">
              <MagnifyingGlass aria-hidden="true" size={18} />
              <span className="sr-only">Search export records</span>
              <input
                ref={searchRef}
                type="search"
                value={filters.query}
                onChange={(event) => updateFilter("query", event.target.value)}
                placeholder={`Search ${definition.label.toLowerCase()}`}
              />
            </label>

            <label className="export-field">
              <span>Local state</span>
              <select
                value={filters.localState}
                onChange={(event) =>
                  updateFilter("localState", event.target.value as ExportFilters["localState"])
                }
              >
                <option value="all">All local states</option>
                <option value="synced">Synced</option>
                <option value="modified">Locally edited</option>
              </select>
            </label>

            {resource === "products" ? (
              <>
                <ChecklistFilter
                  label="Categories"
                  options={categories}
                  selected={filters.categories}
                  onChange={(value, checked) =>
                    updateFilter("categories", toggleValue(filters.categories, value, checked))
                  }
                />
                <ChecklistFilter
                  label="Brands"
                  options={brands}
                  selected={filters.brands}
                  onChange={(value, checked) =>
                    updateFilter("brands", toggleValue(filters.brands, value, checked))
                  }
                />
                <fieldset className="range-fieldset">
                  <legend>Price range</legend>
                  <label>
                    <span>Minimum</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={filters.minimumPrice}
                      onChange={(event) => updateFilter("minimumPrice", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Maximum</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={filters.maximumPrice}
                      onChange={(event) => updateFilter("maximumPrice", event.target.value)}
                    />
                  </label>
                </fieldset>
                <fieldset className="range-fieldset">
                  <legend>Stock range</legend>
                  <label>
                    <span>Minimum</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={filters.minimumStock}
                      onChange={(event) => updateFilter("minimumStock", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Maximum</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={filters.maximumStock}
                      onChange={(event) => updateFilter("maximumStock", event.target.value)}
                    />
                  </label>
                </fieldset>
              </>
            ) : (
              <ChecklistFilter
                label="Roles"
                options={roles}
                selected={filters.roles}
                onChange={(value, checked) =>
                  updateFilter("roles", toggleValue(filters.roles, value, checked))
                }
              />
            )}
          </section>

          <section className="export-control-section" aria-labelledby="columns-heading">
            <div className="export-section-heading">
              <h3 id="columns-heading">Choose columns</h3>
              <span>{selectedColumns.length} selected</span>
            </div>
            <div className="export-inline-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => setSelectedColumnKeys(new Set(defaultColumnKeys))}
              >
                Use defaults
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setSelectedColumnKeys(new Set(availableColumns.map((column) => column.key)))
                }
              >
                Select all
              </button>
            </div>
            <div className="column-checklist">
              {availableColumns.map((column) => (
                <label key={column.key}>
                  <input
                    type="checkbox"
                    aria-label={`${column.label} (${column.key})`}
                    checked={selectedColumnKeys.has(column.key)}
                    onChange={(event) => toggleColumn(column.key, event.target.checked)}
                  />
                  <span>
                    {column.label}
                    <small>{column.key}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </aside>

        <section className="export-records" aria-labelledby="records-heading">
          <div className="export-records-heading">
            <div>
              <h3 id="records-heading">Choose records</h3>
              <p aria-live="polite">
                {selectedRecords.length} selected from {filteredRecords.length} matching records
              </p>
            </div>
            <div className="export-inline-actions">
              <button type="button" className="text-button" onClick={() => setVisibleSelection(true)}>
                Select visible
              </button>
              <button type="button" className="text-button" onClick={() => setVisibleSelection(false)}>
                Clear visible
              </button>
            </div>
          </div>

          {filteredRecords.length > 0 ? (
            <div className="export-record-list">
              {filteredRecords.map((record) => {
                const selected = !excludedKeys.has(record.key);
                const modified = record.localHash !== record.sourceHash;
                return (
                  <label className={selected ? "is-selected" : undefined} key={record.key}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => toggleRecord(record.key, event.target.checked)}
                    />
                    <span className="export-record-copy">
                      <strong>{definition.getTitle(record.localData)}</strong>
                      <small>
                        #{record.id} · {definition.getSubtitle(record.localData)}
                      </small>
                    </span>
                    <span className={modified ? "export-state is-modified" : "export-state"}>
                      {modified ? "Local edit" : "Synced"}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="export-empty">
              <MagnifyingGlass aria-hidden="true" size={25} />
              <strong>No matching records</strong>
              <span>Reset or change the filters to continue.</span>
            </div>
          )}
        </section>
      </div>

      <footer className="export-footer">
        <div>
          <strong>{selectedRecords.length} records</strong>
          <span>{selectedColumns.length} columns · XLSX</span>
        </div>
        {error ? <p className="export-error" role="alert">{error}</p> : null}
        <button type="button" className="button button-quiet" onClick={closeDialog} disabled={exporting}>
          Cancel
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={() => void handleExport()}
          disabled={exporting || selectedRecords.length === 0 || selectedColumns.length === 0}
        >
          <DownloadSimple aria-hidden="true" size={18} />
          {exporting ? "Creating XLSX" : "Download XLSX"}
        </button>
      </footer>
    </dialog>
  );
}
