# 🚀 Quick Start - Reporting System

## One-Line Commands

### Run Tests + View Reports
```bash
npm run test:report
```

### Just Run Tests
```bash
npm run test
```

### View Master Index
```bash
npm run report:open
```

### Clean All Reports
```bash
npm run clean
```

---

## Report Locations

📁 **Master Index:** `./reports/index.html`  
📁 **Latest Run:** `./reports/Scenario_Name_YYYY-MM-DD_HH-mm-ss/`  
📁 **All Runs:** `./reports/`

---

## Report Files Per Run

```
reports/Scenario_Name_2025-11-25_20-44-59/
├── report.html ← View this in browser
├── report.json ← Raw test data
└── metadata.json ← Test summary
```

---

## What Gets Generated

✅ HTML report with full details  
✅ JSON data for automation  
✅ Metadata with timing  
✅ Master index linking all runs  
✅ Automatic folder organization  

---

## Report Folder Naming

Pattern: `{ScenarioName}_{YYYY-MM-DD}_{HH-mm-ss}`

Examples:
- `Fetch_SRA_Copy_Parameters_2025-11-25_20-44-59`
- `Login_User_2025-11-25_20-50-15`
- `Create_Account_2025-11-25_21-02-30`

---

## Key Features

📊 **Automatic Organization**  
⏱️ **Timestamps on Every Run**  
📈 **Master Index Dashboard**  
💾 **Historical Tracking**  
🔗 **Easy Navigation**  
📝 **Detailed Metadata**  

---

## First Time Setup

1. Run: `npm run test`
2. Wait for completion
3. Open: `reports/index.html`
4. View all test runs with links to reports

---

## Viewing Reports

**Option 1 - Browser:**
```
File → Open → reports/index.html
```

**Option 2 - Command:**
```bash
npm run report:open
```

**Option 3 - After Tests:**
```bash
npm run test:report
```

---

**That's it! Reports auto-generate with every test run.** ✨
