module.exports = {
  default: {
    require: ['src/support/world.ts', 'src/support/hooks.ts', 'src/steps/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:cucumber-report.html',
      'json:cucumber-report.json'
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
