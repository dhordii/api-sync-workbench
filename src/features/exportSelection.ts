import type { ResourceName, StoredRecord } from "../domain/types";
import { flattenRecord } from "./exportData";

export type LocalStateFilter = "all" | "synced" | "modified";

export interface ExportFilters {
  query: string;
  localState: LocalStateFilter;
  categories: string[];
  brands: string[];
  roles: string[];
  minimumPrice: string;
  maximumPrice: string;
  minimumStock: string;
  maximumStock: string;
}

export interface ExportColumn {
  key: string;
  label: string;
}

const PREFERRED_COLUMNS: Record<
  ResourceName,
  Array<ExportColumn & { selectedByDefault: boolean }>
> = {
  products: [
    { key: "id", label: "ID", selectedByDefault: true },
    { key: "title", label: "Product", selectedByDefault: true },
    { key: "category", label: "Category", selectedByDefault: true },
    { key: "brand", label: "Brand", selectedByDefault: true },
    { key: "price", label: "Price", selectedByDefault: true },
    { key: "stock", label: "Stock", selectedByDefault: true },
    { key: "description", label: "Description", selectedByDefault: false },
    { key: "thumbnail", label: "Thumbnail URL", selectedByDefault: false },
    { key: "images", label: "Image URLs", selectedByDefault: false },
  ],
  users: [
    { key: "id", label: "ID", selectedByDefault: true },
    { key: "firstName", label: "First name", selectedByDefault: true },
    { key: "lastName", label: "Last name", selectedByDefault: true },
    { key: "email", label: "Email", selectedByDefault: true },
    { key: "phone", label: "Phone", selectedByDefault: true },
    { key: "username", label: "Username", selectedByDefault: true },
    { key: "role", label: "Role", selectedByDefault: true },
    { key: "image", label: "Image URL", selectedByDefault: false },
  ],
};

export function createDefaultExportFilters(): ExportFilters {
  return {
    query: "",
    localState: "all",
    categories: [],
    brands: [],
    roles: [],
    minimumPrice: "",
    maximumPrice: "",
    minimumStock: "",
    maximumStock: "",
  };
}

function normalizedText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLocaleLowerCase() : "";
}

function matchesSelectedValue(value: unknown, selected: string[]): boolean {
  if (selected.length === 0) {
    return true;
  }
  const normalized = normalizedText(value);
  return selected.some((item) => normalizedText(item) === normalized);
}

function parseOptionalNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesNumberRange(
  value: unknown,
  minimumText: string,
  maximumText: string,
): boolean {
  if (typeof value !== "number") {
    return minimumText === "" && maximumText === "";
  }
  const minimum = parseOptionalNumber(minimumText);
  const maximum = parseOptionalNumber(maximumText);
  return (minimum === null || value >= minimum) && (maximum === null || value <= maximum);
}

export function filterExportRecords(
  resource: ResourceName,
  records: StoredRecord[],
  filters: ExportFilters,
): StoredRecord[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return records.filter((record) => {
    const data = record.localData;
    const locallyModified = record.localHash !== record.sourceHash;
    if (
      (filters.localState === "synced" && locallyModified) ||
      (filters.localState === "modified" && !locallyModified)
    ) {
      return false;
    }
    if (query && !JSON.stringify(data).toLocaleLowerCase().includes(query)) {
      return false;
    }

    if (resource === "products") {
      return (
        matchesSelectedValue(data.category, filters.categories) &&
        matchesSelectedValue(data.brand, filters.brands) &&
        matchesNumberRange(data.price, filters.minimumPrice, filters.maximumPrice) &&
        matchesNumberRange(data.stock, filters.minimumStock, filters.maximumStock)
      );
    }

    return matchesSelectedValue(data.role, filters.roles);
  });
}

function humanizeColumnKey(key: string): string {
  return key
    .replaceAll(".", " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getAvailableExportColumns(
  resource: ResourceName,
  records: StoredRecord[],
): ExportColumn[] {
  const availableKeys = new Set(
    records.flatMap((record) => Object.keys(flattenRecord(record.localData))),
  );
  const preferred = PREFERRED_COLUMNS[resource];
  const preferredKeys = new Set(preferred.map((column) => column.key));
  const known = preferred.filter((column) => availableKeys.has(column.key));
  const additional = Array.from(availableKeys)
    .filter((key) => !preferredKeys.has(key))
    .sort((left, right) => left.localeCompare(right))
    .map((key) => ({ key, label: humanizeColumnKey(key) }));

  return [...known, ...additional];
}

export function getDefaultExportColumnKeys(
  resource: ResourceName,
  availableColumns: ExportColumn[],
): string[] {
  const availableKeys = new Set(availableColumns.map((column) => column.key));
  return PREFERRED_COLUMNS[resource]
    .filter((column) => column.selectedByDefault && availableKeys.has(column.key))
    .map((column) => column.key);
}

export function getDistinctFieldValues(
  records: StoredRecord[],
  field: string,
): string[] {
  return Array.from(
    new Set(
      records
        .map((record) => record.localData[field])
        .filter((value): value is string => typeof value === "string" && value.trim() !== "")
        .map((value) => value.trim()),
    ),
  ).sort((left, right) => left.localeCompare(right));
}
