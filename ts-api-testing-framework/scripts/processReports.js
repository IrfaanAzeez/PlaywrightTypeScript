#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const currentReportDir = path.join(projectRoot, 'reports', 'current');

// Match ReportGenerator: on Windows use C:\\Reports, otherwise /tmp/Reports
const reportsRoot = process.platform === 'win32' ? 'C:\\Reports' : path.join('/', 'tmp', 'Reports');

async function waitForJsonFile(filePath, opts = {}) {
  const { timeoutMs = 15000, intervalMs = 300, minSize = 20 } = opts;
  const start = Date.now();
  return new Promise((resolve) => {
    (function check() {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.size >= minSize) return resolve(true);
        }
      } catch (e) {
        // ignore and retry
      }
      if (Date.now() - start > timeoutMs) return resolve(false);
      setTimeout(check, intervalMs);
    })();
  });
}

async function processReports() {
  console.log('[ReportProcessor] Starting report processing...');

  if (!fs.existsSync(currentReportDir)) {
    console.log('[ReportProcessor] No current reports found. Skipping.');
    return;
  }

  const htmlReportPath = path.join(currentReportDir, 'report.html');
  const jsonReportPath = path.join(currentReportDir, 'report.json');

  if (!fs.existsSync(htmlReportPath) && !fs.existsSync(jsonReportPath)) {
    console.log('[ReportProcessor] No report files found.');
    return;
  }

  // Ensure reports root exists (may be C:\Reports)
  if (!fs.existsSync(reportsRoot)) {
    try {
      fs.mkdirSync(reportsRoot, { recursive: true });
      console.log('[ReportProcessor] Created reports root:', reportsRoot);
    } catch (e) {
      console.error('[ReportProcessor] Failed to create reports root:', reportsRoot, e.message);
      return;
    }
  }

  // Find latest test-run directory under reportsRoot (exclude 'current')
  const testRunDirs = fs
    .readdirSync(reportsRoot)
    .filter((file) => {
      const p = path.join(reportsRoot, file);
      try {
        return fs.statSync(p).isDirectory() && file !== 'current';
      } catch (e) {
        return false;
      }
    })
    .map((name) => ({ name, path: path.join(reportsRoot, name), mtime: fs.statSync(path.join(reportsRoot, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  let latestTestRunDir = testRunDirs.length > 0 ? testRunDirs[0].path : null;
  if (!latestTestRunDir) {
    // Create a fallback folder if none exist
    const folderName = `manual_run_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    latestTestRunDir = path.join(reportsRoot, folderName);
    try {
      fs.mkdirSync(latestTestRunDir, { recursive: true });
      console.log('[ReportProcessor] Created fallback test-run directory:', latestTestRunDir);
    } catch (e) {
      console.error('[ReportProcessor] Failed to create fallback test-run directory:', e.message);
      return;
    }
  } else {
    console.log('[ReportProcessor] Latest test run directory:', latestTestRunDir);
  }

  // Copy HTML (if present)
  if (fs.existsSync(htmlReportPath)) {
    const destHtmlPath = path.join(latestTestRunDir, 'report.html');
    try {
      fs.copyFileSync(htmlReportPath, destHtmlPath);
      console.log('[ReportProcessor] HTML report saved:', destHtmlPath);
    } catch (e) {
      console.warn('[ReportProcessor] Failed to copy HTML report:', e.message);
    }
  }

  // Copy JSON (wait until non-empty)
  if (fs.existsSync(jsonReportPath)) {
    const ready = await waitForJsonFile(jsonReportPath, { timeoutMs: 20000, intervalMs: 300, minSize: 20 });
    const destJsonPath = path.join(latestTestRunDir, 'report.json');
    try {
      fs.copyFileSync(jsonReportPath, destJsonPath);
      const copiedSize = fs.existsSync(destJsonPath) ? fs.statSync(destJsonPath).size : 0;
      console.log('[ReportProcessor] JSON report saved:', destJsonPath, '(size:', copiedSize + ')');
      if (!ready) console.warn('[ReportProcessor] Warning: JSON report may have been incomplete when copied (timed out waiting).');
    } catch (e) {
      console.warn('[ReportProcessor] Failed to copy JSON report:', e.message);
    }
  }

  // Generate simple index.html inside the test-run folder using metadata + report.json
  try {
    const metadataPath = path.join(latestTestRunDir, 'metadata.json');
    let metadata = {};
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    }

    const destJsonPath = path.join(latestTestRunDir, 'report.json');
    let steps = [];
    if (fs.existsSync(destJsonPath)) {
      try {
        const report = JSON.parse(fs.readFileSync(destJsonPath, 'utf-8'));
        if (Array.isArray(report) && report.length > 0 && report[0].elements && report[0].elements.length > 0) {
          const scenario = report[0].elements[0];
          steps = scenario.steps || [];
        }
      } catch (e) {
        console.warn('[ReportProcessor] Failed to parse report.json for index generation', e.message);
      }
    }

    const stats = { total: 0, passed: 0, failed: 0, skipped: 0 };
    steps.forEach((s) => {
      stats.total++;
      const st = s.result && s.result.status;
      if (st === 'passed') stats.passed++;
      else if (st === 'failed') stats.failed++;
      else stats.skipped++;
    });

    const idx = `<!doctype html><html><head><meta charset="utf-8"><title>${metadata.scenarioName || 'Test Run'}</title></head><body><h1>${metadata.scenarioName || 'Test Run'}</h1><p>Status: ${metadata.status || 'UNKNOWN'}</p><ul><li>Total Steps: ${stats.total}</li><li>Passed: ${stats.passed}</li><li>Failed: ${stats.failed}</li><li>Skipped: ${stats.skipped}</li></ul><h2>Steps</h2><ol>${steps.map(st=>`<li>${(st.keyword||'') + (st.name||'')} - ${st.result?.status || 'unknown'}${st.result?.error_message?`<pre>${st.result.error_message}</pre>`:''}</li>`).join('')}</ol></body></html>`;
    const indexPath = path.join(latestTestRunDir, 'index.html');
    fs.writeFileSync(indexPath, idx, 'utf-8');
    console.log('[ReportProcessor] index.html generated:', indexPath);
  } catch (e) {
    console.warn('[ReportProcessor] Failed to generate index.html', e.message);
  }

  try {
    fs.rmSync(currentReportDir, { recursive: true, force: true });
    console.log('[ReportProcessor] Cleaned up temporary report directory.');
  } catch (e) {
    console.warn('[ReportProcessor] Failed to clean up temporary report directory:', e.message);
  }

  console.log('[ReportProcessor] Report processing completed successfully!');
}

processReports().catch((err) => {
  console.error('[ReportProcessor] Fatal error:', err);
  process.exit(1);
});
