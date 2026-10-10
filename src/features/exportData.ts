import type { ResourceName, StoredRecord } from "../domain/types";

export function flattenRecord(
  record: Record<string, unknown>,
  prefix = "",
): Record<string, string | number | boolean | null> {
  const flattened: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(record)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      flattened[path] = JSON.stringify(value);
    } else if (value !== null && typeof value === "object") {
      Object.assign(
        flattened,
        flattenRecord(value as Record<string, unknown>, path),
      );
    } else if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      flattened[path] = value;
    }
  }

  return flattened;
}

function neutralizeSpreadsheetFormula(value: string): string {
  return /^[\t\r +\-=@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number | boolean | null | undefined): string {
  const text = neutralizeSpreadsheetFormula(
    value === null || value === undefined ? "" : String(value),
  );
  return `"${text.replaceAll('"', '""')}"`;
}

export function recordsToCsv(records: StoredRecord[]): string {
  const flattened = records.map((record) => flattenRecord(record.localData));
  const columns = Array.from(
    new Set(flattened.flatMap((record) => Object.keys(record))),
  ).sort((left, right) => left.localeCompare(right));

  const rows = [
    columns.map(csvCell).join(","),
    ...flattened.map((record) =>
      columns.map((column) => csvCell(record[column])).join(","),
    ),
  ];
  return `\uFEFF${rows.join("\r\n")}`;
}

export function recordsToJson(
  resource: ResourceName,
  records: StoredRecord[],
  exportedAt = new Date(),
): string {
  return JSON.stringify(
    {
      application: "API Sync Workbench",
      resource,
      exportedAt: exportedAt.toISOString(),
      count: records.length,
      records: records.map((record) => record.localData),
    },
    null,
    2,
  );
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export interface XlsxExportColumn {
  key: string;
  label: string;
}

function safeWorksheetValue(
  value: string | number | boolean | null | undefined,
): string | number | boolean | null {
  return value === undefined ? null : value;
}

function columnWidth(
  label: string,
  values: Array<string | number | boolean | null | undefined>,
): number {
  let longest = label.length;
  for (const value of values) {
    if (value !== null && value !== undefined) {
      longest = Math.max(longest, String(value).length);
    }
  }
  return Math.min(42, Math.max(12, longest + 2));
}

export async function recordsToXlsx(
  resource: ResourceName,
  records: StoredRecord[],
  columns: XlsxExportColumn[],
  exportedAt = new Date(),
): Promise<Blob> {
  if (records.length === 0) {
    throw new Error("Select at least one record to export.");
  }
  if (columns.length === 0) {
    throw new Error("Select at least one column to export.");
  }

  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  workbook.creator = "API Sync Workbench";
  workbook.created = exportedAt;
  workbook.modified = exportedAt;

  const worksheet = workbook.addWorksheet(resource === "products" ? "Products" : "Users", {
    views: [{ state: "frozen", ySplit: 1, activeCell: "A2" }],
  });
  worksheet.properties.defaultRowHeight = 20;
  worksheet.addRow(columns.map((column) => column.label));

  const flattened = records.map((record) => flattenRecord(record.localData));
  for (const record of flattened) {
    worksheet.addRow(columns.map((column) => safeWorksheetValue(record[column.key])));
  }

  const header = worksheet.getRow(1);
  header.height = 24;
  header.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF245FD6" } };
  header.alignment = { vertical: "middle", horizontal: "center" };

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }
    row.font = { name: "Aptos", size: 10, color: { argb: "FF18202B" } };
    row.alignment = { vertical: "middle" };
    if (rowNumber % 2 === 1) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F6F8" } };
    }
  });

  columns.forEach((column, index) => {
    const worksheetColumn = worksheet.getColumn(index + 1);
    const values = flattened.map((record) => record[column.key]);
    worksheetColumn.width = columnWidth(column.label, values);
    const numericValues = values.filter((value): value is number => typeof value === "number");
    const populatedValues = values.filter((value) => value !== null && value !== undefined);
    if (numericValues.length > 0 && numericValues.length === populatedValues.length) {
      worksheetColumn.numFmt = numericValues.every(Number.isInteger) ? "#,##0" : "#,##0.00";
    }
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlobFile(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
