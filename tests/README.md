# Desktop acceptance

Run the frontend preview at `http://127.0.0.1:5175`, then `npm run test:desktop`.
`PRISM_PREVIEW_URL` overrides that URL; `PRISM_BROWSER_PATH` overrides the local
Chrome executable. This suite uses the installed `@playwright/test` runner and
Chrome, with desktop projects at 1366×768 and 1920×1080, Indonesian locale,
Jakarta timezone and reduced motion. It does not cover mobile.

The browser starts with fresh production synthetic state for each test. The
fixed Date controls screenshot timestamps while processing timers remain live.
Nonlocal requests are blocked; the full evaluation flow also asserts no outbound
HTTP requests or browser errors. Native Chrome PDF resources are allowed. File upload uses independent registered public PDF
bytes through the actual input and SHA-256 recognition path. Exported XLSX files
are opened with ExcelJS and checked for exact HEA output, percentage strings,
partial exclusions and source values. These checks verify the prepared frontend
scenario, not a backend parser, financial implementation or evaluator acceptance.

Screenshots use Playwright `expect(page).toHaveScreenshot`. Local baselines live
in `test-results/snapshots/{project}/prism-*.png`; traces, failed captures and
XLSX downloads live in `test-results/playwright/`. Those folders are
ignored by Git. Create a first local baseline with `npm run test:desktop:update`,
inspect the images, then rerun `npm run test:desktop` to verify comparison. Updating
an image is not evidence of visual acceptance; changes still require inspection.
The same Chrome/browser, fonts and platform should be used when comparing images.
Only the native PDF iframe is masked; the upload test asserts its registered source
URL and review values. Freeze baselines before refactoring and compare afterward;
do not update them to hide interface changes.

Coverage includes sidebar collapse, all main result pages, mandatory confirmation,
warning acknowledgement, explicit price groups, partial results, real upload
failure/recovery, dirty navigation save/discard, Radix keyboard focus trapping,
reduced and active motion, and real procurement search/sort/pagination.

For final verification prefer the built Vite preview, so development hot reload
cannot reset the prepared in-memory state during a flow. After starting Storybook
at port 6006, `npm run test:storybook:browser` runs a separate smoke suite over all
ten component stories at both desktop sizes. It checks Select/Tabs, the long table
and filter, file selection, dialog keyboard focus/Escape and error retry. Override
`PRISM_STORYBOOK_URL` if needed. The first long-table baseline can be created with
`npm run test:storybook:browser -- --update-snapshots` and inspected locally.

Architecture verification uses isolated `ApplicationProviders` and module providers, navigation
remounts, preserved formatter variants, revision/confirmation checks, subscriber
isolation and immutable historical snapshots. A fixed-clock fingerprint checks all
original seeded values, IDs, event order and prepared snapshots. Browser coverage
also compares computed styles on direct routes and navigation, retains tab drafts,
and checks that ExcelJS loads when exporting. `prism/architecture` in ESLint guards
static/type imports, re-exports, literal dynamic imports, layer violations, browser globals and cycles; tests can construct isolated adapters. Node suites exercise domain/application without DOM.

Production bundle measurement (Vite, minified kB; gzip in parentheses):

| JavaScript | Before | After |
| --- | ---: | ---: |
| Entry | 514.16 (161.73) | 502.93 (159.75) |
| ExcelJS, deferred | 936.98 (270.74) | 936.98 (270.74) |
| All JS chunks combined | 1572.95 (473.28) | 1577.15 (476.62) |

Combined sizes include lazy chunks; they are not initial-page transfer sizes.
The emitted CSS is byte-identical to the frozen baseline. All fixture bytes and
registry fingerprints are unchanged. The entry shrank; additional lazy modules
increased the combined transfer slightly. Obsolete acceptance runners were removed.

Verified on 4 October 2026: typecheck, ESLint, 71 unit/interaction/Node tests,
application build and Storybook build; 14 desktop, four local-workflow and two
Storybook browser tests pass at both sizes without updating screenshots.
`npm run fixtures:prepare` validates eight originals and creates the ignored
`fixture-kit/`. `PRISM_WORKFLOW_GUIDE` dapat menambahkan panduan lokal eksternal
sebagai `PANDUAN-WORKFLOW.md`; panduan tidak diperlukan untuk menyiapkan bytes. Tooling tests validate commands, links,
output names and copied fingerprints. Konfigurasi Storybook memakai `PRISM_STORYBOOK_CONFIG_DIR` atau pengaturan Git
lokal `prism.storybookConfigDir`; konfigurasi tidak disertakan dalam repository.

## Perubahan dokumen pengadaan

`npm run test:procurement` memeriksa card OE, penggantian dan konfirmasi ulang,
penghapusan dengan konfirmasi/batal, sumber lama melalui navigasi browser,
unggahan gagal, metadata header, serta chip dokumen pada Petak/Tabel vendor.
Alur kini memiliki tiga tahap. Identitas, vendor dan OE berada pada tahap
Identitas & vendor; URL lama `tab=dokumen` dialihkan ke `tab=ringkasan`.
Suite memakai 1366×768, 1520×842, 1920×1080, 2053×972, 705×842 dan 390×844; screenshot observasi
disimpan di `test-results/procurement-documents/`, tanpa mengubah golden lama.
Gunakan `PRISM_PREVIEW_URL` untuk memilih URL preview build lokal.
