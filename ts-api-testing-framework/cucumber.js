const path = require('path');

// Get current report paths (these will be set dynamically per test run)
const reportDir = './reports/current';
const htmlReportPath = path.join(reportDir, 'report.html');
const jsonReportPath = path.join(reportDir, 'report.json');

module.exports = {
  default: {
    require: ['src/support/world.ts', 'src/support/hooks.ts', 'src/steps/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      `html:${htmlReportPath}`,
      `json:${jsonReportPath}`
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    parallel: 1,
    worldParameters: {
      apiWorld: true
    }
  }
};
