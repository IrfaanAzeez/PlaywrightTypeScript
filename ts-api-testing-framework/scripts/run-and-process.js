#!/usr/bin/env node

/*
 * Consolidated Test Runner + Report Processor
 * - Runs Cucumber tests (via npx cucumber-js)
 * - Always runs the built-in post-processing (copies reports to C:\\Reports and generates index.html)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');

function runCommand(cmd, args) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      resolve(code);
    });

    proc.on('error', (err) => {
      console.error(`Error running ${cmd}:`, err);
      resolve(1);
    });
  });
}

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

  const currentReportDir = path.join(projectRoot, 'reports', 'current');

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

  const reportsRoot = process.platform === 'win32' ? 'C:\\Reports' : path.join('/', 'tmp', 'Reports');

  if (!fs.existsSync(reportsRoot)) {
    try {
      fs.mkdirSync(reportsRoot, { recursive: true });
      console.log('[ReportProcessor] Created reports root:', reportsRoot);
    } catch (e) {
      console.error('[ReportProcessor] Failed to create reports root:', reportsRoot, e.message);
      return;
    }
  }

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

  if (fs.existsSync(htmlReportPath)) {
    const destHtmlPath = path.join(latestTestRunDir, 'report.html');
    try {
      fs.copyFileSync(htmlReportPath, destHtmlPath);
      console.log('[ReportProcessor] HTML report saved:', destHtmlPath);
    } catch (e) {
      console.warn('[ReportProcessor] Failed to copy HTML report:', e.message);
    }
  }

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

    let logContent = '';
    const logPath = path.join(projectRoot, 'test.log');
    if (fs.existsSync(logPath)) {
      logContent = fs.readFileSync(logPath, 'utf-8');
    }

    const idx = `<!doctype html><html><head><meta charset="utf-8"><title>${metadata.scenarioName || 'Test Run'}</title></head><body><h1>${metadata.scenarioName || 'Test Run'}</h1><p>Status: ${metadata.status || 'UNKNOWN'}</p><ul><li>Total Steps: ${stats.total}</li><li>Passed: ${stats.passed}</li><li>Failed: ${stats.failed}</li><li>Skipped: ${stats.skipped}</li></ul><h2>Steps</h2><ol>${steps.map(st=>`<li>${(st.keyword||'') + (st.name||'')} - ${st.result?.status || 'unknown'}${st.result?.error_message?`<pre>${st.result.error_message}</pre>`:''}</li>`).join('')}</ol><h2>Logger Output</h2><pre style='background:#f4f4f4;padding:1em;border:1px solid #ccc;max-height:400px;overflow:auto;'>${logContent}</pre></body></html>`;
    const indexPath = path.join(latestTestRunDir, 'index.html');
    fs.writeFileSync(indexPath, idx, 'utf-8');
    console.log('[ReportProcessor] index.html generated:', indexPath);
  } catch (e) {
    console.warn('[ReportProcessor] Failed to generate index.html', e.message);
  }

  try {
    fs.rmSync(path.join(projectRoot, 'reports', 'current'), { recursive: true, force: true });
    console.log('[ReportProcessor] Cleaned up temporary report directory.');
  } catch (e) {
    console.warn('[ReportProcessor] Failed to clean up temporary report directory:', e.message);
  }

  console.log('[ReportProcessor] Report processing completed successfully!');
}

async function main() {
  console.log('[Runner] Starting Cucumber tests...');
  const cucumberExitCode = await runCommand('npx', ['cucumber-js', '--require-module', 'ts-node/register']);
  console.log(`[Runner] Cucumber exited with code: ${cucumberExitCode}`);

  console.log('[Runner] Processing reports...');
  await processReports();

  process.exit(cucumberExitCode);
}

main().catch((err) => {
  console.error('[Runner] Fatal error:', err);
  process.exit(1);
});
