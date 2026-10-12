# Performance report and benchmarking guide

## How to measure

```bash
npm run build
npm run e2e          # writes perf-report.json and refreshes docs/screenshots/
```

The script (`scripts/e2e-smoke.mjs`) serves the production build with `vite preview` and drives Chromium through Playwright. It measures:

- **Keystroke processing**: time from the start of the `keydown` event (capture phase) until the event bubbles to `window`. By then the engine has updated and React has committed the DOM change.
- **Keydown → next frame**: time from the event's timestamp to the next `requestAnimationFrame`. This is close to input-to-paint latency, so it is bounded below by frame alignment (about 0–16.7 ms at 60 Hz).
- **Memory**: `JSHeapUsedSize`, DOM nodes and event listeners from the Chrome DevTools Protocol, read after a forced garbage collection.
- **Leaks**: the same metrics before and after 30 restart cycles. Each cycle types some characters, then clicks restart.

### Manual check in Chrome DevTools

1. Open the deployed app, then DevTools → **Performance monitor**. Watch *JS heap size*, *DOM nodes* and *JS event listeners* while you take several tests. They should level off rather than keep climbing.
2. DevTools → **Performance**: record while typing quickly. Each keystroke should show as a short task (well under 4 ms), with no long tasks.
3. DevTools → **Network**: reload. The only requests should be same-origin `index.html`, one JS file, one CSS file, the favicon, the manifest and the service worker.

## Latest measured results

Environment: Chromium 141.0.7390.37 (headless), Linux container, 1366×820 viewport, 2026-10-12.

### Load

| Metric | Value |
| --- | --- |
| DOMContentLoaded | 86 ms (local server) |
| Transferred on first load | 99 KB |
| Requests to other origins | 0 |
| Console errors during the whole run | 0 |

### Typing latency (ms)

| Scenario | Samples | Median | p95 | Max |
| --- | --- | --- | --- | --- |
| Words test — keystroke processing | 150 | 0.7 | 1.2 | 4 |
| Words test — keydown → next frame | 150 | 7.9 | 15.9 | 17.2 |
| Time test at full speed — keystroke processing | 3880 | 0.6 | 1.7 | 11.4 |
| Time test at full speed — keydown → next frame | 3680 | 7.6 | 15.8 | 23.7 |

The full-speed time test types continuously for 15 seconds with no delay between keys (about 3,900 characters), so the passage keeps growing as new words are appended.

### Memory

| Moment | JS heap used | JS heap total | DOM nodes | Listeners |
| --- | --- | --- | --- | --- |
| After first load | 2 MB | 2.75 MB | 1200 | 172 |
| After several tests + stats page | 4.48 MB | 5.38 MB | 523 | 200 |
| After 30 more restart cycles | 4.66 MB | 5.38 MB | 523 | 200 |

These numbers are the JavaScript heap only. The browser tab's total memory (renderer process, GPU, and so on) is larger and depends on the browser and OS, so it isn't claimed here.

### Bundle (production build, gzip)

| File | Size |
| --- | --- |
| Main JS (React + app) | ~93.5 KB |
| CSS | ~7.0 KB |
| Statistics page (lazy) | ~3.6 KB |
| Settings dialog (lazy) | ~2.0 KB |
| Custom-text dialog (lazy) | ~1.3 KB |
| Service worker | ~1.4 KB (uncompressed) |

Most of the main bundle is `react-dom` itself; the app code is a small fraction of it.
