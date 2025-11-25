import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

/**
 * Report Generator
 * Manages test report generation and organization
 * Creates folder structure: Reports/Scenario_Name_YYYY-MM-DD_HH-mm-ss/
 */
export class ReportGenerator {
  private reportsRootDir: string;
  private currentTestRunDir: string | null = null;
  private currentScenarioName: string = '';
  private testRunStartTime: Date = new Date();

  constructor() {
    // Use C:\Reports folder for storing test reports
    const osType = process.platform;
    
    // For Windows: C:\Reports, For Mac/Linux: /tmp/Reports
    if (osType === 'win32') {
      this.reportsRootDir = path.resolve('C:\\Reports');
    } else {
      this.reportsRootDir = path.resolve('/tmp/Reports');
    }
    
    this.ensureReportsDirectory();
  }

  /**
   * Ensure reports root directory exists
   */
  private ensureReportsDirectory(): void {
    if (!fs.existsSync(this.reportsRootDir)) {
      fs.mkdirSync(this.reportsRootDir, { recursive: true });
      logger.info(`Reports directory created: ${this.reportsRootDir}`);
    }
  }

  /**
   * Generate timestamp string (YYYY-MM-DD_HH-mm-ss)
   */
  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  /**
   * Sanitize scenario name for folder creation
   * Removes special characters and replaces spaces with underscores
   */
  private sanitizeScenarioName(scenarioName: string): string {
    return scenarioName
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit to 50 characters
  }

  /**
   * Initialize test run with scenario name
   * Creates folder: Reports/Scenario_Name_YYYY-MM-DD_HH-mm-ss/
   */
  public initializeTestRun(scenarioName: string): string {
    this.currentScenarioName = scenarioName;
    this.testRunStartTime = new Date();

    const sanitizedName = this.sanitizeScenarioName(scenarioName);
    const timestamp = this.getTimestamp();
    const folderName = `${sanitizedName}_${timestamp}`;

    this.currentTestRunDir = path.join(this.reportsRootDir, folderName);

    // Create the test run directory
    if (!fs.existsSync(this.currentTestRunDir)) {
      fs.mkdirSync(this.currentTestRunDir, { recursive: true });
      logger.info(`Test run directory created: ${this.currentTestRunDir}`);
    }

    return this.currentTestRunDir;
  }

  /**
   * Get current test run directory
   */
  public getCurrentTestRunDir(): string | null {
    return this.currentTestRunDir;
  }

  /**
   * Get report file path (HTML)
   */
  public getHtmlReportPath(): string {
    if (!this.currentTestRunDir) {
      throw new Error('Test run not initialized. Call initializeTestRun() first.');
    }
    return path.join(this.currentTestRunDir, 'report.html');
  }

  /**
   * Get report file path (JSON)
   */
  public getJsonReportPath(): string {
    if (!this.currentTestRunDir) {
      throw new Error('Test run not initialized. Call initializeTestRun() first.');
    }
    return path.join(this.currentTestRunDir, 'report.json');
  }

  /**
   * Get metadata file path
   */
  public getMetadataPath(): string {
    if (!this.currentTestRunDir) {
      throw new Error('Test run not initialized. Call initializeTestRun() first.');
    }
    return path.join(this.currentTestRunDir, 'metadata.json');
  }

  /**
   * Get index file path (inside current test run)
   */
  public getIndexPath(): string {
    if (!this.currentTestRunDir) {
      throw new Error('Test run not initialized. Call initializeTestRun() first.');
    }
    return path.join(this.currentTestRunDir, 'index.html');
  }

  /**
   * Save test metadata
   */
  public saveTestMetadata(metadata: any): void {
    const metadataPath = this.getMetadataPath();
    const data = {
      scenarioName: this.currentScenarioName,
      startTime: this.testRunStartTime.toISOString(),
      endTime: new Date().toISOString(),
      duration: new Date().getTime() - this.testRunStartTime.getTime(),
      environment: process.env.ENVIRONMENT || 'dev',
      ...metadata,
    };

    fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2));
    logger.info(`Test metadata saved: ${metadataPath}`);
  }

  /**
   * Get all test runs
   */
  public getAllTestRuns(): Array<{ name: string; path: string; metadata: any }> {
    const testRuns: Array<{ name: string; path: string; metadata: any }> = [];

    if (!fs.existsSync(this.reportsRootDir)) {
      return testRuns;
    }

    const folders = fs.readdirSync(this.reportsRootDir);

    for (const folder of folders) {
      const folderPath = path.join(this.reportsRootDir, folder);
      const stats = fs.statSync(folderPath);

      if (stats.isDirectory()) {
        const metadataPath = path.join(folderPath, 'metadata.json');
        let metadata = {};

        if (fs.existsSync(metadataPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          } catch (error) {
            logger.error(`Failed to read metadata from ${metadataPath}`);
          }
        }

        testRuns.push({
          name: folder,
          path: folderPath,
          metadata,
        });
      }
    }

    // Sort by most recent first
    testRuns.sort((a, b) => {
      const timeA = new Date(a.metadata?.startTime || 0).getTime();
      const timeB = new Date(b.metadata?.startTime || 0).getTime();
      return timeB - timeA;
    });

    return testRuns;
  }

  /**
   * Parse test steps from report.json
   */
  private async parseTestSteps(): Promise<Array<any>> {
    try {
      let reportJsonPath = this.getJsonReportPath();

      // If report.json doesn't exist in test run dir, check the current reports dir
      if (!fs.existsSync(reportJsonPath)) {
        reportJsonPath = path.join(process.cwd(), 'reports', 'current', 'report.json');
      }

      // Wait briefly for the JSON report to be written if it's empty or not yet present
      const maxAttempts = 15; // ~3 seconds (15 * 200ms)
      let attempts = 0;
      while (attempts < maxAttempts) {
        if (fs.existsSync(reportJsonPath)) {
          try {
            const stats = fs.statSync(reportJsonPath);
            if (stats.size > 10) break;
          } catch (e) {
            // ignore and retry
          }
        }
        attempts++;
        await new Promise((r) => setTimeout(r, 200));
      }

      if (!fs.existsSync(reportJsonPath)) {
        return [];
      }

      const reportData = JSON.parse(fs.readFileSync(reportJsonPath, 'utf-8'));
      
      // Extract steps from Cucumber JSON format
      let steps: Array<any> = [];
      if (Array.isArray(reportData) && reportData.length > 0) {
        const feature = reportData[0];
        if (feature.elements && feature.elements.length > 0) {
          const scenario = feature.elements[0];
          steps = scenario.steps || [];
        }
      }
      
      return steps;
    } catch (error) {
      logger.error(`Error parsing test steps: ${error}`);
      return [];
    }
  }

  /**
   * Calculate test statistics
   */
  private async calculateTestStats(): Promise<{ total: number; passed: number; failed: number; skipped: number }> {
    const steps = await this.parseTestSteps();
    let total = steps.length;
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    steps.forEach((step: any) => {
      const status = step.result?.status;
      if (status === 'passed') passed++;
      else if (status === 'failed') failed++;
      else if (status === 'skipped' || status === 'pending') skipped++;
    });

    return { total, passed, failed, skipped };
  }

  /**
   * Generate index HTML inside current test run folder
   */
  public async generateMasterIndex(): Promise<void> {
    if (!this.currentTestRunDir) {
      throw new Error('Test run not initialized. Call initializeTestRun() first.');
    }

    const indexPath = this.getIndexPath();
    const steps = await this.parseTestSteps();
    const stats = await this.calculateTestStats();
    
    // Read metadata for additional details
    let metadata: any = {};
    try {
      const metadataPath = this.getMetadataPath();
      if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      }
    } catch (error) {
      logger.error(`Error reading metadata: ${error}`);
    }

    // Build step rows HTML
    let stepsHtml = '';
    steps.forEach((step: any, index: number) => {
      const status = step.result?.status || 'unknown';
      const statusClass = status === 'passed' ? 'passed' : status === 'failed' ? 'failed' : 'skipped';
      const statusIcon = status === 'passed' ? '✓' : status === 'failed' ? '✗' : '⊘';
      const stepText = step.keyword ? `${step.keyword}${step.name}` : step.name;
      const errorMsg = step.result?.error_message ? `<div class="error-details">${this.escapeHtml(step.result.error_message)}</div>` : '';
      
      stepsHtml += `
        <tr class="step-${statusClass}">
          <td><span class="status-icon ${statusClass}">${statusIcon}</span></td>
          <td>${index + 1}</td>
          <td>${this.escapeHtml(stepText)}</td>
          <td>${status.toUpperCase()}</td>
          <td>${step.result?.duration ? (step.result.duration / 1000000).toFixed(2) + 'ms' : 'N/A'}</td>
        </tr>
        ${errorMsg ? `<tr class="error-row"><td colspan="5">${errorMsg}</td></tr>` : ''}
      `;
    });

    const testStatus = metadata.status === 'PASSED' || stats.failed === 0 ? 'PASSED' : 'FAILED';
    const statusColor = testStatus === 'PASSED' ? '#28a745' : '#dc3545';
    const statusIcon = testStatus === 'PASSED' ? '✓' : '✗';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Report - ${this.currentScenarioName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-bottom: 5px solid ${statusColor};
    }
    
    .header h1 {
      font-size: 2em;
      margin-bottom: 10px;
    }
    
    .header .scenario-name {
      font-size: 1.1em;
      opacity: 0.9;
      margin-bottom: 15px;
    }
    
    .test-status {
      font-size: 1.8em;
      font-weight: bold;
      color: ${statusColor};
      margin-top: 15px;
    }
    
    .test-status .icon {
      margin-right: 10px;
    }
    
    .content {
      padding: 30px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border-left: 4px solid #667eea;
    }
    
    .stat-card.passed {
      border-left-color: #28a745;
    }
    
    .stat-card.failed {
      border-left-color: #dc3545;
    }
    
    .stat-card.total {
      border-left-color: #667eea;
    }
    
    .stat-card.skipped {
      border-left-color: #ffc107;
    }
    
    .stat-card .label {
      color: #666;
      font-size: 0.9em;
      text-transform: uppercase;
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    .stat-card .value {
      font-size: 2.5em;
      font-weight: bold;
      color: #333;
    }
    
    .info-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-item label {
      font-size: 0.85em;
      color: #667eea;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    
    .info-item .value {
      color: #333;
      word-break: break-all;
    }
    
    .steps-section {
      margin-top: 30px;
    }
    
    .steps-section h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.3em;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    
    .steps-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }
    
    .steps-table thead {
      background: #f8f9fa;
      border-bottom: 2px solid #667eea;
    }
    
    .steps-table th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: #333;
    }
    
    .steps-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #e9ecef;
    }
    
    .steps-table tr:hover {
      background: #f8f9fa;
    }
    
    .status-icon {
      display: inline-block;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      text-align: center;
      line-height: 24px;
      color: white;
      font-weight: bold;
      font-size: 0.9em;
    }
    
    .status-icon.passed {
      background: #28a745;
    }
    
    .status-icon.failed {
      background: #dc3545;
    }
    
    .status-icon.skipped {
      background: #ffc107;
      color: #333;
    }
    
    .step-passed {
      background: #f0fff4;
    }
    
    .step-failed {
      background: #fff5f5;
    }
    
    .step-skipped {
      background: #fffbf0;
    }
    
    .error-row {
      background: #fff5f5 !important;
    }
    
    .error-details {
      color: #dc3545;
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
      padding: 10px;
      border-left: 3px solid #dc3545;
      margin: 5px 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #999;
      font-size: 0.9em;
      border-top: 1px solid #e9ecef;
    }
    
    .no-steps {
      text-align: center;
      padding: 40px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Test Report</h1>
      <div class="scenario-name">${this.escapeHtml(this.currentScenarioName)}</div>
      <div class="test-status">
        <span class="icon">${statusIcon}</span>
        ${testStatus}
      </div>
    </div>
    
    <div class="content">
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="label">Total Steps</div>
          <div class="value">${stats.total}</div>
        </div>
        <div class="stat-card passed">
          <div class="label">Passed</div>
          <div class="value" style="color: #28a745;">${stats.passed}</div>
        </div>
        <div class="stat-card failed">
          <div class="label">Failed</div>
          <div class="value" style="color: #dc3545;">${stats.failed}</div>
        </div>
        <div class="stat-card skipped">
          <div class="label">Skipped</div>
          <div class="value" style="color: #ffc107;">${stats.skipped}</div>
        </div>
      </div>
      
      <div class="info-section">
        <div class="info-item">
          <label>Start Time</label>
          <div class="value">${this.testRunStartTime.toLocaleString()}</div>
        </div>
        <div class="info-item">
          <label>Duration</label>
          <div class="value">${metadata.duration ? metadata.duration + 'ms' : 'N/A'}</div>
        </div>
        <div class="info-item">
          <label>Environment</label>
          <div class="value">${metadata.environment || 'dev'}</div>
        </div>
        <div class="info-item">
          <label>Test Run ID</label>
          <div class="value">${path.basename(this.currentTestRunDir)}</div>
        </div>
      </div>
      
      ${steps.length > 0 ? `
      <div class="steps-section">
        <h2>📋 Test Steps (${stats.passed}/${stats.total} Passed)</h2>
        <table class="steps-table">
          <thead>
            <tr>
              <th style="width: 60px;">Status</th>
              <th style="width: 50px;">Step #</th>
              <th>Step Description</th>
              <th style="width: 100px;">Result</th>
              <th style="width: 80px;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${stepsHtml}
          </tbody>
        </table>
      </div>
      ` : `
      <div class="steps-section">
        <h2>📋 Test Steps</h2>
        <div class="no-steps">No steps data available</div>
      </div>
      `}
    </div>
    
    <div class="footer">
      <p>Generated on ${new Date().toLocaleString()}</p>
      <p>© 2025 API Testing Framework</p>
    </div>
  </div>
</body>
</html>
    `;

    fs.writeFileSync(indexPath, htmlContent);
    logger.info(`Test report index created: ${indexPath}`);
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Get reports root directory
   */
  public getReportsRootDir(): string {
    return this.reportsRootDir;
  }
}

// Export singleton instance
export const reportGenerator = new ReportGenerator();
