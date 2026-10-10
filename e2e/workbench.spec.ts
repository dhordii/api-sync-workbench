import AxeBuilder from "@axe-core/playwright";
import ExcelJS from "exceljs";
import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

function productThumbnail(kind: "lamp" | "table" | "cable"): string {
  const artwork = {
    lamp: '<path d="M30 54h36M48 54V35m0 0 13-13m-13 13-9-9m22-4 8 8-13 5-5-5 10-8Z"/>',
    table: '<path d="M24 34h48v12H24zm7 12-4 27m38-27 4 27"/>',
    cable: '<path d="M26 29h8v12h-8zm36 26h8v12h-8zM34 35c28 0 6 26 28 26"/>',
  }[kind];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#e8effd"/><g fill="none" stroke="#245fd6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${artwork}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const avatarThumbnail =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%23e8effd'/%3E%3Ccircle cx='48' cy='37' r='16' fill='%23245fd6'/%3E%3Cpath d='M19 86c3-21 14-31 29-31s26 10 29 31' fill='%23245fd6'/%3E%3C/svg%3E";

const products = [
  {
    id: 1,
    title: "Arc desk lamp",
    description: "A focused task light",
    category: "lighting",
    price: 42,
    stock: 12,
    brand: "Northline",
    thumbnail: productThumbnail("lamp"),
    images: [productThumbnail("lamp")],
  },
  {
    id: 2,
    title: "Oak side table",
    description: "Compact solid oak table",
    category: "furniture",
    price: 129,
    stock: 8,
    brand: "Field Office",
    thumbnail: productThumbnail("table"),
    images: [productThumbnail("table")],
  },
  {
    id: 3,
    title: "Cable organizer",
    description: "Keeps desktop cables aligned",
    category: "accessories",
    price: 18,
    stock: 34,
    brand: "Orderly",
    thumbnail: productThumbnail("cable"),
    images: [productThumbnail("cable")],
  },
];

const users = [
  {
    id: 1,
    firstName: "Avery",
    lastName: "Stone",
    email: "avery@example.test",
    phone: "+1 555 0101",
    username: "avery.stone",
    image: avatarThumbnail,
    role: "admin",
  },
  {
    id: 2,
    firstName: "Morgan",
    lastName: "Lee",
    email: "morgan@example.test",
    phone: "+1 555 0102",
    username: "morgan.lee",
    image: avatarThumbnail,
    role: "user",
  },
];

async function mockProducts(page: Page): Promise<void> {
  await page.route("https://dummyjson.com/products?*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ products, total: products.length, skip: 0, limit: 0 }),
    });
  });
}

async function mockUsers(page: Page): Promise<void> {
  await page.route("https://dummyjson.com/users?*", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ users, total: users.length, skip: 0, limit: 0 }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockProducts(page);
  await mockUsers(page);
  await page.goto("/");
});

test("syncs, persists, edits, and resolves a conflict", async ({ page }, testInfo) => {
  await expect(
    page.getByRole("heading", { name: "Move API data without losing local work." }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Fetch changes" }).first().click();
  await expect(page.getByText("Preview ready")).toBeVisible();
  await expect(page.getByText("Arc desk lamp")).toBeVisible();

  await page.getByRole("button", { name: "Apply sync" }).click();
  await expect(page.getByText("Sync committed")).toBeVisible();
  await page.getByRole("button", { name: "View local data" }).click();
  await expect(page.getByText("Oak side table")).toBeVisible();

  if (process.env.CAPTURE_VISUALS === "1") {
    await page.getByRole("button", { name: /Theme: system/ }).click();
    await page.waitForTimeout(200);
    const viewport = testInfo.project.name.startsWith("mobile") ? "mobile" : "desktop";
    await page.screenshot({
      path: `docs/media/${viewport}.png`,
      fullPage: true,
    });
    if (viewport === "desktop") {
      await page.getByRole("button", { name: /Theme: light/ }).click();
      await page.waitForTimeout(200);
      await page.screenshot({
        path: "docs/media/desktop-dark.png",
        fullPage: true,
      });
      await page.getByRole("button", { name: /Theme: dark/ }).click();
    }
  }

  await page.getByRole("button", { name: "Edit" }).first().click();
  await page.getByLabel("Title").fill("My arc desk lamp");
  await page.getByRole("button", { name: "Save local copy" }).click();
  await expect(page.getByText("Local copy saved")).toBeVisible();

  await page.getByText("Demo controls").click();
  await page.getByRole("checkbox", { name: /Change the source copy/ }).check();
  await page.getByRole("button", { name: "Fetch changes" }).first().click();
  await expect(page.getByText("Source simulation applied")).toBeVisible();
  await page.getByRole("button", { name: "Review" }).click();
  await expect(page.getByRole("heading", { name: "Arc desk lamp" })).toBeVisible();
  await page.getByRole("button", { name: /Keep local/ }).click();
  await page.getByRole("button", { name: "Apply sync" }).click();
  await page.getByRole("button", { name: "View local data" }).click();
  await expect(page.getByText("My arc desk lamp")).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: /Local data/ }).click();
  await expect(page.getByText("My arc desk lamp")).toBeVisible();
});

test("recovers from a one-shot request failure", async ({ page }) => {
  await page.getByText("Demo controls").click();
  await page.getByRole("checkbox", { name: /Fail the next request once/ }).check();
  await page.getByRole("button", { name: "Fetch changes" }).first().click();

  await expect(page.getByText("Fetch failed")).toBeVisible();
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("Preview ready")).toBeVisible();
});

test("switches to users and persists the validated resource", async ({ page }) => {
  await page.getByRole("radio", { name: "Users" }).check();
  await page.getByRole("button", { name: "Fetch changes" }).first().click();
  await expect(page.getByText("Avery Stone")).toBeVisible();

  await page.getByRole("button", { name: "Apply sync" }).click();
  await page.getByRole("button", { name: "View local data" }).click();
  await expect(
    page.locator('td[data-label="Email"]', { hasText: "morgan@example.test" }),
  ).toBeVisible();
});

test("downloads inspectable JSON, CSV, and filtered XLSX exports", async ({ page }) => {
  await page.getByRole("button", { name: "Fetch changes" }).first().click();
  await page.getByRole("button", { name: "Apply sync" }).click();
  await page.getByRole("button", { name: "View local data" }).click();

  const [jsonDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "JSON" }).click(),
  ]);
  const jsonPath = await jsonDownload.path();
  if (jsonPath === null) {
    throw new Error("Playwright did not provide a path for the JSON download.");
  }
  const json = JSON.parse(await readFile(jsonPath, "utf8")) as {
    application: string;
    resource: string;
    count: number;
    records: Array<{ title?: string }>;
  };
  expect(json).toMatchObject({
    application: "API Sync Workbench",
    resource: "products",
    count: products.length,
  });
  expect(json.records[0]?.title).toBe("Arc desk lamp");

  const [csvDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "CSV" }).click(),
  ]);
  const csvPath = await csvDownload.path();
  if (csvPath === null) {
    throw new Error("Playwright did not provide a path for the CSV download.");
  }
  const csv = await readFile(csvPath, "utf8");
  expect(csv).toContain('"title"');
  expect(csv).toContain('"Arc desk lamp"');

  await page.getByRole("button", { name: "XLSX" }).click();
  await expect(page.getByRole("heading", { name: "Prepare XLSX export" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search export records" }).fill("Oak");
  await expect(page.getByText("1 selected from 1 matching records")).toBeVisible();
  await page.getByRole("checkbox", { name: "Stock (stock)" }).uncheck();

  const [xlsxDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download XLSX" }).click(),
  ]);
  const xlsxPath = await xlsxDownload.path();
  if (xlsxPath === null) {
    throw new Error("Playwright did not provide a path for the XLSX download.");
  }
  const xlsxBytes = new Uint8Array(await readFile(xlsxPath));
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(xlsxBytes.buffer);
  const worksheet = workbook.getWorksheet("Products");
  const headers = worksheet?.getRow(1).values;

  expect(headers).toContain("Product");
  expect(headers).not.toContain("Stock");
  expect(worksheet?.rowCount).toBe(2);
  expect(worksheet?.getCell("B2").value).toBe("Oak side table");
  expect(worksheet?.autoFilter).toBe("A1:E1");
  expect(worksheet?.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
  await expect(page.getByText("XLSX export ready")).toBeVisible();
});

test("has no automatically detectable accessibility violations", async ({ page }) => {
  const initialResults = await new AxeBuilder({ page }).analyze();
  expect(initialResults.violations).toEqual([]);

  await page.getByRole("button", { name: "Fetch changes" }).first().click();
  await expect(page.getByText("Preview ready")).toBeVisible();
  const previewResults = await new AxeBuilder({ page }).analyze();
  expect(previewResults.violations).toEqual([]);

  await page.getByRole("button", { name: /Theme: system/ }).click();
  await page.getByRole("button", { name: /Theme: light/ }).click();
  await page.waitForTimeout(200);
  const darkResults = await new AxeBuilder({ page }).analyze();
  expect(darkResults.violations).toEqual([]);
});
