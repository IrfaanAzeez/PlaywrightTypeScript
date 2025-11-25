# API Testing Framework - Reporting System

## Overview

The reporting system automatically organizes test reports into structured folders with timestamps and scenario names.

## Report Structure

```
reports/
├── index.html (Master Index - View all test runs)
├── Fetch_SRA_Copy_Parameters_2025-11-25_19-35-25/
│   ├── report.html (Test execution report)
│   ├── report.json (JSON data)
│   └── metadata.json (Test metadata)
├── Fetch_SRA_Copy_Parameters_2025-11-25_19-40-10/
│   ├── report.html
│   ├── report.json
│   └── metadata.json
└── ... (more test runs)
```

## How It Works

### 1. **Test Execution**
```bash
npm run test
```
- Runs all scenarios
- Each scenario creates its own folder with timestamp
- Reports are generated in real-time

### 2. **Report Organization**
Folder naming pattern: `{ScenarioName}_{YYYY-MM-DD}_{HH-mm-ss}`

Example:
- `Fetch_SRA_Copy_Parameters_2025-11-25_19-35-25`
- `Login_User_2025-11-25_19-40-10`

### 3. **Master Index**
Open `reports/index.html` to view:
- Total test runs
- Latest test run date
- All test scenarios
- Direct links to each test report
- Test duration and status

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run test` | Run tests and generate reports |
| `npm run test:report` | Run tests and automatically open master index |
| `npm run report:open` | Open master index report |
| `npm run clean` | Remove all reports and build files |

## Report Contents

### metadata.json
```json
{
  "scenarioName": "Fetch SRA Copy Parameters with valid token",
  "startTime": "2025-11-25T19:35:25.847Z",
  "endTime": "2025-11-25T19:35:26.059Z",
  "duration": 212,
  "environment": "dev",
  "status": "PASSED",
  "steps": 6,
  "failureMessage": null
}
```

### report.html
- Beautiful HTML report
- Step-by-step execution details
- Pass/Fail indicators
- Screenshots (when available)
- Execution timeline

### report.json
- Raw JSON data
- Parseable for CI/CD integration
- Contains all test execution details

## Features

✅ **Automatic Organization** - Folders created with scenario name + timestamp  
✅ **Master Index** - View all test runs at a glance  
✅ **Historical Data** - All test runs preserved for comparison  
✅ **Metadata Tracking** - Test duration, status, and environment  
✅ **Easy Navigation** - Master index links directly to reports  
✅ **Git Ignored** - Reports folder excluded from version control  

## Viewing Reports

### Option 1: Master Index
```bash
npm run test:report
```
Automatically opens `reports/index.html` with all test runs

### Option 2: Manual Navigation
1. Navigate to `reports/` folder
2. Open `index.html` in browser
3. Click on any test run to view detailed report

### Option 3: Direct Report Access
Navigate to specific test run folder and open `report.html`

## Integration with CI/CD

The JSON reports can be parsed and integrated with CI/CD pipelines:

```bash
# Example: Check if tests passed
if [ -f "reports/latest/report.json" ]; then
  cat reports/latest/report.json | jq '.features[].elements[].status'
fi
```

## Cleanup

Remove all reports:
```bash
npm run clean
```

This removes:
- `reports/` directory
- `dist/` directory
- `playwright-report/` directory

## Troubleshooting

### Reports folder not created?
- Ensure `npm run test` completes successfully
- Check console for errors

### No master index?
- Run `npm run test` at least once
- Master index is auto-generated after each test run

### Old reports missing?
- Check `.gitignore` - reports folder should be excluded
- Reports persist in `reports/` directory until manually deleted

## Environment-Specific Reports

Reports automatically capture:
- Test environment (dev, staging, prod)
- Timestamp of execution
- Test duration
- Pass/Fail status
- Error messages (if any)

---

**For questions or issues, check the main README.md**
