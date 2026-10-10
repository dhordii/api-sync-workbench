---
name: "API Sync Workbench - Reconciliation Ledger"
description: "An inspectable, local-first transfer ledger for reviewing API data before it is committed."
colors:
  canvas: "#f4f6f8"
  surface: "#ffffff"
  surface-muted: "#eef1f5"
  surface-raised: "#ffffff"
  text: "#18202b"
  text-muted: "#526071"
  text-subtle: "#596778"
  rule: "#d9dfe7"
  rule-strong: "#c6cfda"
  accent: "#245fd6"
  accent-hover: "#174cad"
  accent-soft: "#e8effd"
  accent-contrast: "#ffffff"
  focus: "#124fca"
  success: "#16734a"
  success-soft: "#e7f5ee"
  warning: "#9a5a09"
  warning-soft: "#fff3dc"
  danger: "#b42332"
  danger-soft: "#fdecef"
  selection: "#cdddfd"
  dark-canvas: "#11151b"
  dark-surface: "#171d25"
  dark-surface-muted: "#202832"
  dark-surface-raised: "#1c232d"
  dark-text: "#eef3f8"
  dark-text-muted: "#b6c0cc"
  dark-text-subtle: "#8f9ba9"
  dark-rule: "#303a47"
  dark-rule-strong: "#424e5e"
  dark-accent: "#78a3ff"
  dark-accent-hover: "#9abaff"
  dark-accent-soft: "#1e3159"
  dark-accent-contrast: "#0d1a32"
  dark-focus: "#9abaff"
  dark-success: "#68d4a0"
  dark-success-soft: "#17372b"
  dark-warning: "#f0b35a"
  dark-warning-soft: "#3b2c18"
  dark-danger: "#ff8792"
  dark-danger-soft: "#42232a"
  dark-selection: "#28477f"
typography:
  display:
    fontFamily: '"IBM Plex Sans Variable", "Segoe UI", sans-serif'
    fontSize: "clamp(38px, 5vw, 72px)"
    fontWeight: 650
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  headline:
    fontFamily: '"IBM Plex Sans Variable", "Segoe UI", sans-serif'
    fontSize: "23px"
    fontWeight: 700
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"IBM Plex Sans Variable", "Segoe UI", sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  supporting:
    fontFamily: '"IBM Plex Sans Variable", "Segoe UI", sans-serif'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: '"IBM Plex Sans Variable", "Segoe UI", sans-serif'
    fontSize: "12px"
    fontWeight: 650
  control:
    fontFamily: '"IBM Plex Sans Variable", "Segoe UI", sans-serif'
    fontSize: "16px"
    fontWeight: 650
    lineHeight: 1
  metric:
    fontFamily: '"IBM Plex Sans Variable", "Segoe UI", sans-serif'
    fontSize: "22px"
    fontWeight: 650
    letterSpacing: "-0.02em"
    fontFeature: "tabular-nums"
  identifier:
    fontFamily: 'ui-monospace, "Cascadia Code", monospace'
    fontSize: "12px"
    fontWeight: 400
    fontFeature: "tabular-nums"
rounded:
  compact: "8px"
  control: "10px"
  feature: "12px"
  surface: "14px"
  pill: "999px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-contrast}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.accent-contrast}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
    height: "44px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
    height: "44px"
  field-standard:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  status-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "5px 8px"
    height: "28px"
  workspace-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.surface}"
---

# Design System: API Sync Workbench

## Overview

**Creative North Star: "Reconciliation Ledger"**

Reconciliation Ledger makes synchronization feel like an inspectable transfer record. It borrows the clarity of a version-control diff and the staged progression of a shipping manifest, then expresses both through a calm operational surface instead of a generic dashboard. The system is dense enough for real review work, but the hierarchy remains outcome-led: a large promise, concise proof, a live three-station rail, and one continuous workbench.

The visual world is cool, neutral, and exact. Cobalt marks interaction, green, amber, and red carry real status, and IBM Plex Sans keeps the interface direct while monospace is reserved for identifiers and measurements. Borders, separators, and tonal fills explain structure; decorative charts, KPI-card mosaics, gradients, and glow do not belong.

Direction provenance is `manual:reconciliation-ledger` because the direction engine was unavailable. The finish-review evidence consists of `desktop.png`, `mobile.png`, and `desktop-dark.png`; each raster belongs to this same provenance and records the shipped light, responsive, and dark expressions.

**Key Characteristics:**

- A single bordered operational surface rather than a grid of equal cards.
- A status-aware source-to-review-to-local rail that makes sequence and progress visible.
- Compact ledger counters separated by rules and set with tabular numerals.
- Cobalt interaction color with green, amber, and red reserved for semantic state.
- Responsive density that converts the data table into bordered record cards on small screens.

## Colors

The palette behaves like a cool paper ledger in light mode and a charcoal operations console in dark mode; semantic roles remain stable across both themes.

### Primary

- **Ledger Cobalt** (`colors.accent` / `colors.dark-accent`): primary actions, selected controls, active tabs, active rail stations, links, and the text caret.
- **Pressed Cobalt** (`colors.accent-hover` / `colors.dark-accent-hover`): hover treatment for primary actions and the basis of the visible focus color.
- **Cobalt Wash** (`colors.accent-soft` / `colors.dark-accent-soft`): selected segments, informational badges, brand marks, and other low-emphasis interaction surfaces.

### Secondary

- **Verified Green** (`colors.success` / `colors.dark-success`): completed rail stations, successful notices, proof checks, and unchanged records.
- **Verified Green Wash** (`colors.success-soft` / `colors.dark-success-soft`): the paired background for successful and complete states.

### Tertiary

- **Review Amber** (`colors.warning` / `colors.dark-warning`): conflicts and locally modified records that require attention without implying failure.
- **Failure Red** (`colors.danger` / `colors.dark-danger`): invalid records, failed operations, destructive text, and error feedback.
- **Semantic Washes** (`colors.warning-soft`, `colors.danger-soft`, `colors.dark-warning-soft`, `colors.dark-danger-soft`): quiet fills that keep warning and error messages readable without turning them into promotional accents.

### Neutral

- **Cool Canvas** (`colors.canvas` / `colors.dark-canvas`): the page-level field behind the product.
- **Ledger Paper** (`colors.surface` / `colors.dark-surface`): workbench, rail, form, table, and record-card surfaces.
- **Ledger Band** (`colors.surface-muted` / `colors.dark-surface-muted`): command bars, table heads, skeletons, and low-emphasis controls.
- **Raised Sheet** (`colors.surface-raised` / `colors.dark-surface-raised`): drawers, dialogs, and popovers.
- **Ledger Ink** (`colors.text` / `colors.dark-text`): primary content and labels.
- **Supporting Ink** (`colors.text-muted`, `colors.text-subtle`, `colors.dark-text-muted`, `colors.dark-text-subtle`): secondary explanations and metadata.
- **Ledger Rules** (`colors.rule`, `colors.rule-strong`, `colors.dark-rule`, `colors.dark-rule-strong`): section separators, table rows, field outlines, and surface boundaries.

**The Inspectable Accent Rule.** Cobalt marks interaction and selection; semantic green, amber, and red must continue to describe actual application state.

## Typography

**Display Font:** IBM Plex Sans Variable with Segoe UI and sans-serif fallbacks

**Body Font:** IBM Plex Sans Variable with Segoe UI and sans-serif fallbacks

**Label/Mono Font:** The platform monospace stack with Cascadia Code for identifiers, timestamps, JSON values, and tabular measurements

**Character:** IBM Plex Sans is practical and technical without feeling mechanical. Strong weights and tight headline tracking establish confidence; tabular numerals and selective monospace make audit evidence scan cleanly.

### Hierarchy

- **Display** (650, `clamp(38px, 5vw, 72px)`, 0.98): the first-viewport outcome headline only; it uses balanced wrapping and restrained negative tracking.
- **Headline** (700, 23px): workbench and drawer titles that divide major operational contexts.
- **Body** (400, 16px, 1.5): instructions and explanatory copy; long lines remain at or below 65 characters where the implementation constrains them.
- **Supporting** (400, 13px, 1.4): notices, proof statements, and compact metadata.
- **Label** (650, 12px): form legends, compact table labels, station metadata, and other scan anchors.
- **Metric** (650, 22px): ledger totals with tabular figures and tight tracking.
- **Identifier** (400, 12px): record IDs, timestamps, JSON comparisons, and measured values.

**The Typography as Evidence Rule.** Use monospace only where the content is an identifier or measurement; ordinary interface copy remains IBM Plex Sans.

## Layout

The main container is fluid with responsive gutters and stops at 1480px. The first viewport moves from a two-column headline-and-proof composition into the three-column sync rail, then into one continuous workbench. Inside the workbench, a heading, command band, contextual notice, ledger strip, tab navigation, record region, and apply bar read as one ordered transaction rather than independent dashboard cards.

At 1040px the intro stacks and the fetch action spans the command band. At 760px the sync rail becomes a vertical sequence, the command band becomes a two-column grid, metrics become three columns, and the table becomes labeled record cards. At 480px controls collapse to one column and ledger metrics become two columns. Drawers occupy the full viewport width on mobile; conflict comparison retains a scrollable minimum width when its three columns cannot fit.

**The One Continuous Surface Rule.** Separate stages with rules, tonal bands, and spacing inside the workbench; do not split the operational flow into a mosaic of equal KPI cards.

## Elevation & Depth

The system is flat by default. Ordinary workbench structure uses a one-pixel rule and tonal bands, not shadow. Shadow is reserved for truly raised overlays: `0 18px 48px rgb(36 55 80 / 16%)` in light mode and `0 22px 58px rgb(0 0 0 / 42%)` in dark mode. The sticky header and drawer header use restrained backdrop blur because content can pass behind them; the modal backdrop uses a dark translucent wash with a small blur.

### Shadow Vocabulary

- **Raised overlay:** used only by the demo popover, record drawer, and destructive confirmation dialog.

**The Flat Ledger Rule.** A surface gets a border for structure or a shadow for elevation, never both as decoration.

## Shapes

The form language is softly technical: rectangular surfaces with controlled rounding, never bubbly cards. Inputs and ordinary controls use the control radius (10px). The workbench, sync rail, dialogs, and comparison shells use the surface radius (14px). Twelve-pixel corners support compact feature tiles and mobile record cards, while pills (999px) are reserved for status badges and count chips. One-pixel rules and clipped corners keep every region legible as part of the ledger.

**The Radius by Responsibility Rule.** Use 10px for interaction, 14px for operational surfaces, 12px for compact feature geometry, and full pills only for status or counts.

## Components

### Buttons

- **Shape:** compact and stable with a 10px radius, a 44px minimum touch target, and 10px by 15px internal padding.
- **Primary:** Ledger Cobalt with high-contrast text; it owns `Fetch changes`, `Apply sync`, `Save local copy`, and source-replacement decisions.
- **Hover / Focus:** primary hover deepens the cobalt; controls use a three-pixel mixed-color focus outline, normally with a three-pixel offset and a two-pixel offset inside the segmented picker. Pressed buttons move down by one pixel and scale to 0.99.
- **Secondary / Quiet:** secondary buttons use Cobalt Wash for an explicit alternative; quiet buttons are transparent and become a muted neutral surface on hover.
- **Danger:** destructive confirmation uses a dedicated deep-red fill, while destructive utility actions may remain red text until confirmation.

### Chips

- **Style:** status badges are 28px-tall semantic pills with an icon, 5px by 8px padding, 11px text, and 650 weight.
- **State:** new and updated use cobalt, unchanged uses green, local edits and conflicts use amber, and invalid uses red. Count chips remain neutral.

### Cards / Containers

- **Corner Style:** operational shells use the 14px surface radius; mobile record cards use a tighter 12px radius.
- **Background:** Ledger Paper for the workbench and records, Ledger Band for command and table-header regions, and Raised Sheet for overlays.
- **Shadow Strategy:** flat and bordered at rest; only overlays receive the raised-overlay shadow.
- **Border:** one-pixel Ledger Rules define the rail, workbench, fields, comparison grid, table rows, and mobile record cards.
- **Internal Padding:** desktop workbench bands typically use 26px horizontal padding; mobile bands reduce to 17px or 18px.

### Inputs / Fields

- **Style:** 44px minimum height, 10px radius, Ledger Paper background, and a one-pixel strong rule. Search uses an inline magnifier and transparent input inside the same shell.
- **Focus:** the global three-pixel focus outline remains visible outside the field; the caret follows Ledger Cobalt.
- **Error / Disabled:** validation errors use Failure Red on its semantic wash. Disabled controls retain shape but reduce opacity and use a not-allowed cursor.

### Navigation

Workspace tabs are quiet, horizontally scrollable controls with a two-pixel cobalt underline for the active view. Each label can carry a neutral count pill. Export and clear actions stay at the opposite edge on desktop, then form an even two-column action grid on narrow screens.

### XLSX Export Drawer

The XLSX action opens a right-side preparation drawer because record filtering, row selection, and column selection form one protected task. Filters and columns occupy a muted control rail while the selectable record ledger remains the primary surface. The sticky footer always states the exact record and column counts before download. On mobile, the drawer fills the viewport and the two regions stack without hiding controls or selected-state feedback.

### Sync Rail

The signature rail is a three-station ordered list for source, review, and local destination. Stations share one bordered shell; subtle chevrons connect them on desktop and rotate into downward connectors on mobile. Idle stations are neutral, the live station is cobalt, and completed stations are green. Copy always comes from real operation state.

### Ledger Strip

Six preview counters sit in one rule-separated definition list. Labels are compact and muted; values use 22px semibold tabular numerals. The strip reflows from six to three to two columns without turning the metrics into cards.

### Notices

Inline notices use a semantic icon, title, explanation, and optional recovery action in a single compact row. Essential state stays in the workbench and never depends on a transient toast.

## Do's and Don'ts

### Do:

- **Do** keep the source-to-review-to-local progression visible and tied to real state.
- **Do** use one continuous bordered workbench with internal rules and tonal bands.
- **Do** preserve the semantic palette across light and dark themes.
- **Do** keep primary touch targets at least 44px and preserve the visible focus outline.
- **Do** convert dense tables into labeled record cards below 760px.
- **Do** respect reduced-motion preferences while retaining complete content and state.

### Don't:

- **Don't** replace the ledger with an equal grid of KPI cards or decorative charts.
- **Don't** use gradients, glow, glass effects, or section-level theme inversions.
- **Don't** use semantic green, amber, or red as generic decoration.
- **Don't** use pills for ordinary buttons, fields, containers, or navigation shells.
- **Don't** hide essential errors, recovery actions, or transaction results in transient toasts.
- **Don't** introduce animation without operational meaning.
