#!/usr/bin/env node

/*
 * Post-Test Report Processor (fixed)
 * Waits for report.json to be fully written before copying and generating index.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const currentReportDir = path.join(projectRoot, 'reports', 'current');
const reportsRoot = path.join(projectRoot, 'reports');

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
        // ignore
      }
      if (Date.now() - start > timeoutMs) return resolve(false);
      setTimeout(check, intervalMs);
    })();
  });
}

function safeCopy(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    return true;
  } catch (e) {
    console.warn('[ReportProcessor] copy failed:', e.message);
    return false;
  }
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

  const testRunDirs = fs
    .readdirSync(reportsRoot)
    .filter((file) => fs.statSync(path.join(reportsRoot, file)).isDirectory() && file !== 'current')
    .sort()
    .reverse();

  if (testRunDirs.length === 0) {
    console.log('[ReportProcessor] No test-run directories found.');
    return;
  }

  const latestTestRunDir = path.join(reportsRoot, testRunDirs[0]);
  console.log('[ReportProcessor] Latest test run directory:', latestTestRunDir);

  if (fs.existsSync(htmlReportPath)) {
    const destHtml = path.join(latestTestRunDir, 'report.html');
    safeCopy(htmlReportPath, destHtml) && console.log('[ReportProcessor] HTML report saved:', destHtml);
  }

  if (fs.existsSync(jsonReportPath)) {
    const ready = await waitForJsonFile(jsonReportPath);
    const destJson = path.join(latestTestRunDir, 'report.json');
    safeCopy(jsonReportPath, destJson) && console.log('[ReportProcessor] JSON report saved:', destJson);
    if (!ready) console.warn('[ReportProcessor] Warning: waited but report.json may still be incomplete.');
  }

  // Generate index
  try {
    const metadataPath = path.join(latestTestRunDir, 'metadata.json');
    let metadata = {};
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    }

    const destJson = path.join(latestTestRunDir, 'report.json');
    let steps = [];
    if (fs.existsSync(destJson)) {
      try {
        const report = JSON.parse(fs.readFileSync(destJson, 'utf-8'));
        if (Array.isArray(report) && report.length > 0 && report[0].elements && report[0].elements.length > 0) {
          const scenario = report[0].elements[0];
          steps = scenario.steps || [];
        }
      } catch (e) {
        console.warn('[ReportProcessor] Failed to parse report.json', e.message);
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

    const idx = `<!doctype html><html><head><meta charset="utf-8"><title>${metadata.scenarioName || 'Test Run'}</title></head><body><h1>${metadata.scenarioName || 'Test Run'}</h1><p>Status: ${metadata.status || 'UNKNOWN'}</p><ul><li>Total Steps: ${stats.total}</li><li>Passed: ${stats.passed}</li><li>Failed: ${stats.failed}</li><li>Skipped: ${stats.skipped}</li></ul><h2>Steps</h2><ol>${steps
      .map(
        (st) =>
          `<li>${(st.keyword || '') + (st.name || '')} - ${st.result?.status || 'unknown'}${st.result?.error_message ? `<pre>${st.result.error_message}</pre>` : ''}</li>`
      )
      .join('')}</ol></body></html>`;

    const idxPath = path.join(latestTestRunDir, 'index.html');
    fs.writeFileSync(idxPath, idx, 'utf-8');
    console.log('[ReportProcessor] index.html generated:', idxPath);
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

processReports();
