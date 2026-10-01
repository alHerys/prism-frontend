# Desktop acceptance

Run the frontend preview at `http://127.0.0.1:5175`, then `npm run test:desktop`.
`PRISM_PREVIEW_URL` overrides that URL; `PRISM_BROWSER_PATH` overrides the local
Chrome executable. This suite uses the installed `@playwright/test` runner and
Chrome, with desktop projects at 1366×768 and 1920×1080, Indonesian locale,
Jakarta timezone and reduced motion. It does not cover mobile.

The browser starts with fresh production synthetic state for each test. The
fixed Date controls screenshot timestamps while processing timers remain live.
Nonlocal requests are blocked; the full evaluation flow also asserts no outbound
requests or browser errors. File upload uses independent registered public PDF
bytes through the actual input and SHA-256 recognition path. Exported XLSX files
are opened with ExcelJS and checked for exact HEA output, percentage strings,
partial exclusions and source values. These checks verify the prepared frontend
scenario, not a backend parser, financial implementation or evaluator acceptance.

Screenshots use Playwright `expect(page).toHaveScreenshot`. Local baselines live
in `.impeccable/review/snapshots/{project}/prism-*.png`; traces, failed captures and
XLSX downloads live in `.impeccable/review/playwright-results/`. Those folders are
ignored by Git. Create a first local baseline with `npm run test:desktop:update`,
inspect the images, then rerun `npm run test:desktop` to verify comparison. Updating
an image is not evidence of visual acceptance; changes still require inspection.
The same Chrome/browser, fonts and platform should be used when comparing images.

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
