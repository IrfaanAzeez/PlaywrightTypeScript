#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const currentReportDir = path.join(projectRoot, 'reports', 'current');
// Target reports root on Windows as the ReportGenerator uses C:\\Reports
const targetReportsRoot = process.platform === 'win32' ? 'C:\\Reports' : path.resolve('/tmp/Reports');

function waitForFileNonEmpty(filePath, opts = {}) {
  const { timeoutMs = 10000, intervalMs = 200, minSize = 20 } = opts;
  const start = Date.now();
  return new Promise((resolve) => {
    (function check() {
      try {
        if (fs.existsSync(filePath)) {
          const s = fs.statSync(filePath);
          if (s.size >= minSize) return resolve(true);
        }
      } catch (e) {
        // ignore
      }
      if (Date.now() - start > timeoutMs) return resolve(false);
      setTimeout(check, intervalMs);
    })();
  });
}

function findLatestTestRun(root) {
  if (!fs.existsSync(root)) return null;
  const items = fs.readdirSync(root).map((n) => ({
    name: n,
    path: path.join(root, n),
    stat: fs.statSync(path.join(root, n)),
  })).filter(i => i.stat.isDirectory());
  if (items.length === 0) return null;
  items.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  return items[0].path;
}

async function main() {
  console.log('[DriveProcessor] Starting (copy current reports into target C:\\Reports latest run)');

  if (!fs.existsSync(currentReportDir)) {
    console.log('[DriveProcessor] No current reports folder found at', currentReportDir);
    return;
  }

  const htmlSrc = path.join(currentReportDir, 'report.html');
  const jsonSrc = path.join(currentReportDir, 'report.json');

  if (!fs.existsSync(htmlSrc) && !fs.existsSync(jsonSrc)) {
    console.log('[DriveProcessor] No report files present in current reports.');
    return;
  }

  const latest = findLatestTestRun(targetReportsRoot);
  if (!latest) {
    console.log('[DriveProcessor] No test-run directories found under', targetReportsRoot);
    return;
  }
  console.log('[DriveProcessor] Target latest test-run folder:', latest);

  if (fs.existsSync(htmlSrc)) {
    try {
      fs.copyFileSync(htmlSrc, path.join(latest, 'report.html'));
      console.log('[DriveProcessor] Copied report.html');
    } catch (e) {
      console.warn('[DriveProcessor] Failed to copy report.html', e.message);
    }
  }

  if (fs.existsSync(jsonSrc)) {
    const ready = await waitForFileNonEmpty(jsonSrc, { timeoutMs: 15000, intervalMs: 300, minSize: 20 });
    try {
      fs.copyFileSync(jsonSrc, path.join(latest, 'report.json'));
      console.log('[DriveProcessor] Copied report.json');
      if (!ready) console.warn('[DriveProcessor] Warning: report.json was copied but may be incomplete (timed out waiting)');
    } catch (e) {
      console.warn('[DriveProcessor] Failed to copy report.json', e.message);
    }
  }

  // Generate a small index preview by reading the destination report.json and metadata
  const destJson = path.join(latest, 'report.json');
  const metadataPath = path.join(latest, 'metadata.json');
  let metadata = {};
  if (fs.existsSync(metadataPath)) {
    try { metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')); } catch (e) {}
  }

  let steps = [];
  if (fs.existsSync(destJson)) {
    try {
      const report = JSON.parse(fs.readFileSync(destJson, 'utf-8'));
      if (Array.isArray(report) && report.length > 0 && report[0].elements && report[0].elements.length > 0) {
        steps = report[0].elements[0].steps || [];
      }
    } catch (e) {
      console.warn('[DriveProcessor] Failed to parse dest report.json', e.message);
    }
  }

  const stats = { total: 0, passed: 0, failed: 0, skipped: 0 };
  steps.forEach(s => {
    stats.total++;
    const st = s.result?.status;
    if (st === 'passed') stats.passed++;
    else if (st === 'failed') stats.failed++;
    else stats.skipped++;
  });

  const indexPath = path.join(latest, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('\n[DriveProcessor] Existing index.html content:\n');
    console.log(fs.readFileSync(indexPath, 'utf-8'));
    return;
  }

  // Build simple index if not present
  const idx = `<!doctype html><html><head><meta charset="utf-8"><title>${metadata.scenarioName || 'Test Run'}</title></head><body><h1>${metadata.scenarioName || 'Test Run'}</h1><p>Status: ${metadata.status || 'UNKNOWN'}</p><ul><li>Total Steps: ${stats.total}</li><li>Passed: ${stats.passed}</li><li>Failed: ${stats.failed}</li><li>Skipped: ${stats.skipped}</li></ul><h2>Steps</h2><ol>${steps.map(st=>`<li>${(st.keyword||'') + (st.name||'')} - ${st.result?.status || 'unknown'}${st.result?.error_message?`<pre>${st.result.error_message}</pre>`:''}</li>`).join('')}</ol></body></html>`;
  try {
    fs.writeFileSync(indexPath, idx, 'utf-8');
    console.log('\n[DriveProcessor] Generated index.html content:\n');
    console.log(idx);
  } catch (e) {
    console.warn('[DriveProcessor] Failed to write index.html', e.message);
  }
}

main();
