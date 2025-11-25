#!/usr/bin/env node

/**
 * Test Runner Wrapper (Cross-Platform)
 * Runs Cucumber tests and always runs post-processing regardless of test exit code.
 * This ensures index.html is generated even when tests fail.
 */

const { spawn } = require('child_process');
const path = require('path');

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

async function main() {
  console.log('[TestRunner] Starting Cucumber tests...');
  const cucumberExitCode = await runCommand('npx', ['cucumber-js', '--require-module', 'ts-node/register']);
  console.log(`[TestRunner] Cucumber exited with code: ${cucumberExitCode}`);

  console.log('[TestRunner] Running post-processor...');
  const processorExitCode = await runCommand('node', ['scripts/processReports.js']);
  console.log(`[TestRunner] Post-processor exited with code: ${processorExitCode}`);

  // Exit with Cucumber's code so npm sees the test result correctly
  process.exit(cucumberExitCode);
}

main().catch((err) => {
  console.error('[TestRunner] Fatal error:', err);
  process.exit(1);
});
