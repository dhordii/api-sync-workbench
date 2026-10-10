# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, TypeScript, and Vite. The application is a client-only static site prepared for GitHub Pages.

## Users

The primary audience is prospective freelance clients evaluating the author's ability to build reliable API integrations and production-quality frontend applications.

## Product Purpose

API Sync Workbench demonstrates a safe, inspectable synchronization workflow from an external REST API into a browser-local database. A visitor can fetch real DummyJSON data, review a deterministic diff, apply it transactionally, edit the local result, resolve conflicts, recover from failures, and export the stored data.

Success means a first-time visitor can understand the workflow and complete a sync in under 30 seconds while still being able to inspect the reliability mechanisms behind it.

## Positioning

The product proves integration reliability through a working reconciliation flow rather than static dashboard metrics: runtime validation, three-way comparison, conflict decisions, atomic IndexedDB writes, retry-safe previews, and an auditable run history.

## Operating Context

The interface opens directly as an operational dashboard. DummyJSON supplies `products` and `users`; IndexedDB is the local destination. The visitor selects a resource, fetches a source snapshot, reviews the proposed changes, resolves conflicts when necessary, applies the sync, and inspects or exports the local records.

## Capabilities and Constraints

- English-only user interface.
- Products and users share one sync engine through resource adapters.
- Safe one-way pull from DummyJSON to IndexedDB.
- Preview categories: new, updated, unchanged, locally modified, conflict, and invalid.
- Local records are editable through a detail drawer.
- Conflicts are resolved per record with `Keep local` or `Use source`.
- JSON and CSV export are supported. XLSX export lets visitors filter the current local resource, exclude individual records, choose columns, and download a typed worksheet with native Excel filters.
- Demo controls provide API delay, a one-shot request failure, and a clearly labeled upstream-change simulation.
- Light, dark, and system themes are supported.
- All primary workflows remain functional on desktop and mobile.
- DummyJSON mutations are non-persistent and must never be presented as durable remote writes.
- Authentication, a backend, cloud accounts, scheduling, custom endpoints, automatic deletion, field-level merge, and true two-way sync are outside the first release.

## Brand Commitments

The product name is **API Sync Workbench**. The interface must feel like a focused reliability tool, not a generic admin template. Avoid equal KPI-card grids, decorative charts, purple glow treatments, and animation without operational meaning.

## Evidence on Hand

- Real source data and imagery come from DummyJSON.
- No testimonials, customer logos, performance claims, or production usage claims are available and none may be invented.
- The repository started empty with no existing brand assets or visual system.

## Product Principles

1. Preview before mutation.
2. Preserve local work unless the user explicitly chooses otherwise.
3. Make every visible status reflect real application state.
4. Keep recovery paths available after errors.
5. Demonstrate reliability with inspectable behavior, not marketing claims.

## Accessibility & Inclusion

Target WCAG 2.2 AA. All workflows must support keyboard navigation, visible focus, meaningful labels, reduced motion, adequate contrast, and responsive layouts down to a 390 px viewport.
