#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// This script runs AFTER cucumber tests complete and moves report files

const reportsDir = path.join(__dirname, '..', 'reports', 'current');
const targetDir = process.argv[2]; // Pass target directory as argument

if (!targetDir || !fs.existsSync(targetDir)) {
  console.error('Error: Target directory not provided or does not exist');
  process.exit(1);
}

// Wait for files to be written
setTimeout(() => {
  try {
    // Copy report.html
    const sourceHtml = path.join(reportsDir, 'report.html');
    const targetHtml = path.join(targetDir, 'report.html');
    if (fs.existsSync(sourceHtml)) {
      fs.copyFileSync(sourceHtml, targetHtml);
      console.log(`[MOVE] Copied report.html (${fs.statSync(targetHtml).size} bytes)`);
    }

    // Copy report.json
    const sourceJson = path.join(reportsDir, 'report.json');
    const targetJson = path.join(targetDir, 'report.json');
    if (fs.existsSync(sourceJson)) {
      fs.copyFileSync(sourceJson, targetJson);
      const stats = fs.statSync(targetJson);
      console.log(`[MOVE] Copied report.json (${stats.size} bytes)`);
      
      if (stats.size === 0) {
        console.warn('[MOVE] WARNING: report.json is 0 bytes');
      }
    }
  } catch (error) {
    console.error(`[MOVE] Error: ${error.message}`);
    process.exit(1);
  }
}, 1000);
