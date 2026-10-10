import { describe, expect, it } from "vitest";
import type { ResourceName, SourceRecord, StoredRecord } from "../domain/types";
import {
  createDefaultExportFilters,
  filterExportRecords,
  getAvailableExportColumns,
  getDefaultExportColumnKeys,
  getDistinctFieldValues,
} from "./exportSelection";

function storedRecord(
  resource: ResourceName,
  id: number,
  localData: SourceRecord,
  modified = false,
): StoredRecord {
  return {
    key: `${resource}:${id}`,
    resource,
    id,
    localData,
    sourceData: localData,
    localHash: modified ? `local-${id}` : `source-${id}`,
    sourceHash: `source-${id}`,
    lastSyncedAt: "2026-09-20T10:00:00.000Z",
    localModifiedAt: modified ? "2026-09-20T11:00:00.000Z" : null,
  };
}

const products = [
  storedRecord("products", 1, {
    id: 1,
    title: "Arc lamp",
    category: "lighting",
    brand: "Northline",
    price: 42,
    stock: 12,
    dimensions: { width: 10 },
  }),
  storedRecord(
    "products",
    2,
    {
      id: 2,
      title: "Oak table",
      category: "furniture",
      brand: "Field Office",
      price: 129,
      stock: 3,
    },
    true,
  ),
];

describe("export selection", () => {
  it("combines product filters and treats ranges as inclusive", () => {
    const filters = {
      ...createDefaultExportFilters(),
      categories: ["furniture"],
      minimumPrice: "100",
      maximumPrice: "129",
      maximumStock: "3",
      localState: "modified" as const,
    };

    expect(filterExportRecords("products", products, filters).map((record) => record.id)).toEqual([
      2,
    ]);
  });

  it("filters users by query, role, and local state", () => {
    const users = [
      storedRecord("users", 1, {
        id: 1,
        firstName: "Avery",
        lastName: "Stone",
        email: "avery@example.test",
        role: "admin",
      }),
      storedRecord("users", 2, {
        id: 2,
        firstName: "Morgan",
        lastName: "Lee",
        email: "morgan@example.test",
        role: "user",
      }),
    ];
    const filters = {
      ...createDefaultExportFilters(),
      query: "avery@example",
      roles: ["admin"],
      localState: "synced" as const,
    };

    expect(filterExportRecords("users", users, filters).map((record) => record.id)).toEqual([1]);
  });

  it("keeps preferred columns first and discovers nested fields", () => {
    const columns = getAvailableExportColumns("products", products);
    const defaults = getDefaultExportColumnKeys("products", columns);

    expect(columns.slice(0, 6).map((column) => column.key)).toEqual([
      "id",
      "title",
      "category",
      "brand",
      "price",
      "stock",
    ]);
    expect(columns).toContainEqual({ key: "dimensions.width", label: "Dimensions Width" });
    expect(defaults).toEqual(["id", "title", "category", "brand", "price", "stock"]);
    expect(getDistinctFieldValues(products, "category")).toEqual(["furniture", "lighting"]);
  });
});
