import { Workbook } from "exceljs";
import { describe, expect, it } from "vitest";
import type { StoredRecord } from "../domain/types";
import { recordsToCsv, recordsToJson, recordsToXlsx } from "./exportData";

const record: StoredRecord = {
  key: "products:1",
  resource: "products",
  id: 1,
  localData: {
    id: 1,
    title: "=HYPERLINK(\"https://example.com\")",
    dimensions: { width: 10, height: 20 },
    tags: ["desk", "light"],
  },
  sourceData: { id: 1 },
  localHash: "local",
  sourceHash: "source",
  lastSyncedAt: "2026-09-20T10:00:00.000Z",
  localModifiedAt: null,
};

describe("exportData", () => {
  it("flattens nested fields and neutralizes spreadsheet formulas", () => {
    const csv = recordsToCsv([record]);

    expect(csv).toContain('"dimensions.width"');
    expect(csv).toContain('"[""desk"",""light""]"');
    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
  });

  it("exports only the local data with provenance metadata", () => {
    const json = JSON.parse(
      recordsToJson("products", [record], new Date("2026-09-20T12:00:00.000Z")),
    ) as Record<string, unknown>;

    expect(json).toMatchObject({
      application: "API Sync Workbench",
      resource: "products",
      count: 1,
      exportedAt: "2026-09-20T12:00:00.000Z",
    });
    expect(json.records).toEqual([record.localData]);
  });

  it("creates a typed XLSX with selected columns and header filters", async () => {
    const blob = await recordsToXlsx(
      "products",
      [record],
      [
        { key: "id", label: "ID" },
        { key: "title", label: "Product" },
        { key: "dimensions.width", label: "Width" },
      ],
      new Date("2026-09-20T12:00:00.000Z"),
    );
    const workbook = new Workbook();
    await workbook.xlsx.load(await blob.arrayBuffer());
    const sheet = workbook.getWorksheet("Products");

    expect(sheet).toBeDefined();
    expect(sheet?.getRow(1).values).toEqual([undefined, "ID", "Product", "Width"]);
    expect(sheet?.getCell("A2").value).toBe(1);
    expect(sheet?.getCell("B2").value).toBe('=HYPERLINK("https://example.com")');
    expect(sheet?.getCell("B2").formula).toBeUndefined();
    expect(sheet?.getCell("C2").value).toBe(10);
    expect(sheet?.autoFilter).toBe("A1:C1");
    expect(sheet?.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
  });

  it("rejects empty record and column selections", async () => {
    await expect(recordsToXlsx("products", [], [{ key: "id", label: "ID" }])).rejects.toThrow(
      "Select at least one record",
    );
    await expect(recordsToXlsx("products", [record], [])).rejects.toThrow(
      "Select at least one column",
    );
  });
});
