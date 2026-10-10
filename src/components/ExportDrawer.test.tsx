import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { SourceRecord, StoredRecord } from "../domain/types";
import { ExportDrawer } from "./ExportDrawer";

function storedRecord(id: number, localData: SourceRecord): StoredRecord {
  return {
    key: `products:${id}`,
    resource: "products",
    id,
    localData,
    sourceData: localData,
    localHash: `hash-${id}`,
    sourceHash: `hash-${id}`,
    lastSyncedAt: "2026-09-20T10:00:00.000Z",
    localModifiedAt: null,
  };
}

const records = [
  storedRecord(1, {
    id: 1,
    title: "Arc desk lamp",
    category: "lighting",
    brand: "Northline",
    price: 42,
    stock: 12,
  }),
  storedRecord(2, {
    id: 2,
    title: "Oak side table",
    category: "furniture",
    brand: "Field Office",
    price: 129,
    stock: 8,
  }),
];

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    },
  });
});

describe("ExportDrawer", () => {
  it("starts with all records and default columns, then narrows the export safely", () => {
    render(
      <ExportDrawer
        open
        resource="products"
        records={records}
        onClose={vi.fn()}
        onExported={vi.fn()}
      />,
    );

    expect(screen.getByText("2 selected from 2 matching records")).toBeInTheDocument();
    expect(screen.getByText("6 columns · XLSX")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search export records" }), {
      target: { value: "lamp" },
    });
    expect(screen.getByText("1 selected from 1 matching records")).toBeInTheDocument();
    expect(screen.queryByText("Oak side table")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /Arc desk lamp/ }));
    expect(screen.getByText("0 selected from 1 matching records")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download XLSX" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Select visible" }));
    const columnSection = screen.getByRole("heading", { name: "Choose columns" }).parentElement
      ?.parentElement;
    expect(columnSection).not.toBeNull();
    const idCheckbox = within(columnSection as HTMLElement).getByRole("checkbox", {
      name: "ID (id)",
    });
    fireEvent.click(idCheckbox);
    expect(screen.getByText("5 columns · XLSX")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download XLSX" })).toBeEnabled();
  });
});
