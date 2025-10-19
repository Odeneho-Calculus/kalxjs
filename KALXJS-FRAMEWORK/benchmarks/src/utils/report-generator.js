/**
 * Report Generator
 * Generate benchmark reports in multiple formats
 */

import fs from 'fs/promises';
import path from 'path';
import { formatBytes, formatTime, formatNumber, createTable } from './formatter.js';

export class ReportGenerator {
    constructor(outputDir = './reports') {
        this.outputDir = outputDir;
        this.results = [];
    }

    /**
     * Add benchmark result
     */
    addResult(result) {
        this.results.push({
            ...result,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Generate JSON report
     */
    async generateJSON(filename = 'benchmark-report.json') {
        const report = {
            generatedAt: new Date().toISOString(),
            summary: this.generateSummary(),
            results: this.results
        };

        await this.ensureOutputDir();
        const filepath = path.join(this.outputDir, filename);
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));

        return filepath;
    }

    /**
     * Generate HTML report
     */
    async generateHTML(filename = 'benchmark-report.html') {
        const summary = this.generateSummary();

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KALXJS Benchmark Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #f5f7fa;
      color: #2c3e50;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
    }
    h1 { font-size: 36px; margin-bottom: 10px; }
    .subtitle { opacity: 0.9; font-size: 18px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }
    .metric-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .metric-label {
      font-size: 14px;
      color: #6c757d;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #2c3e50;
    }
    .metric-target {
      font-size: 12px;
      color: #28a745;
      margin-top: 4px;
    }
    .metric-target.warning { color: #ffc107; }
    .metric-target.danger { color: #dc3545; }
    .results {
      padding: 40px;
    }
    .result-section {
      margin-bottom: 40px;
    }
    .result-section h2 {
      font-size: 24px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e9ecef;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e9ecef;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #495057;
    }
    tr:hover { background: #f8f9fa; }
    .status-icon {
      display: inline-block;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      text-align: center;
      line-height: 20px;
      font-size: 12px;
    }
    .status-pass { background: #28a745; color: white; }
    .status-warn { background: #ffc107; color: white; }
    .status-fail { background: #dc3545; color: white; }
    footer {
      padding: 20px 40px;
      background: #f8f9fa;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 KALXJS Performance Benchmarks</h1>
      <p class="subtitle">Generated on ${new Date().toLocaleString()}</p>
    </header>

    <div class="summary">
      ${this.generateSummaryHTML(summary)}
    </div>

    <div class="results">
      ${this.generateResultsHTML()}
    </div>

    <footer>
      <p>KALXJS Framework © ${new Date().getFullYear()}</p>
      <p>Benchmark Suite v1.0.0</p>
    </footer>
  </div>
</body>
</html>
    `.trim();

        await this.ensureOutputDir();
        const filepath = path.join(this.outputDir, filename);
        await fs.writeFile(filepath, html);

        return filepath;
    }

    /**
     * Generate console report
     */
    generateConsole() {
        const summary = this.generateSummary();

        console.log('\n' + '='.repeat(80));
        console.log('🚀 KALXJS PERFORMANCE BENCHMARK REPORT');
        console.log('='.repeat(80) + '\n');

        console.log('📊 SUMMARY\n');
        console.log(this.formatSummaryTable(summary));

        console.log('\n📈 DETAILED RESULTS\n');
        this.results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.name}`);
            console.log(this.formatResultTable(result));
            console.log('');
        });

        console.log('='.repeat(80) + '\n');
    }

    /**
     * Generate summary
     */
    generateSummary() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.passed).length;

        const avgMetrics = this.results.reduce((acc, result) => {
            Object.entries(result.metrics || {}).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    acc[key] = (acc[key] || 0) + value;
                }
            });
            return acc;
        }, {});

        Object.keys(avgMetrics).forEach(key => {
            avgMetrics[key] = avgMetrics[key] / totalTests;
        });

        return {
            totalTests,
            passedTests,
            failedTests: totalTests - passedTests,
            passRate: (passedTests / totalTests) * 100,
            avgMetrics
        };
    }

    /**
     * Format summary as table
     */
    formatSummaryTable(summary) {
        const headers = ['Metric', 'Value', 'Status'];
        const rows = [
            ['Total Tests', summary.totalTests, ''],
            ['Passed', summary.passedTests, '✓'],
            ['Failed', summary.failedTests, summary.failedTests > 0 ? '✗' : '✓'],
            ['Pass Rate', `${summary.passRate.toFixed(1)}%`, summary.passRate >= 80 ? '✓' : '⚠']
        ];

        return createTable(headers, rows);
    }

    /**
     * Format result as table
     */
    formatResultTable(result) {
        const headers = ['Metric', 'Value', 'Target', 'Status'];
        const rows = Object.entries(result.metrics || {}).map(([key, value]) => {
            const target = result.targets?.[key] || 'N/A';
            const status = this.getMetricStatus(key, value, target);
            return [
                key,
                this.formatMetricValue(key, value),
                target === 'N/A' ? 'N/A' : this.formatMetricValue(key, target),
                status
            ];
        });

        return createTable(headers, rows);
    }

    /**
     * Generate summary HTML
     */
    generateSummaryHTML(summary) {
        return `
      <div class="metric-card">
        <div class="metric-label">Total Tests</div>
        <div class="metric-value">${summary.totalTests}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Passed</div>
        <div class="metric-value" style="color: #28a745;">${summary.passedTests}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Failed</div>
        <div class="metric-value" style="color: ${summary.failedTests > 0 ? '#dc3545' : '#28a745'};">${summary.failedTests}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Pass Rate</div>
        <div class="metric-value">${summary.passRate.toFixed(1)}%</div>
        <div class="metric-target ${summary.passRate >= 80 ? '' : 'warning'}">
          Target: ≥80%
        </div>
      </div>
    `;
    }

    /**
     * Generate results HTML
     */
    generateResultsHTML() {
        return this.results.map((result, index) => `
      <div class="result-section">
        <h2>${index + 1}. ${result.name}</h2>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Target</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(result.metrics || {}).map(([key, value]) => {
            const target = result.targets?.[key] || 'N/A';
            const status = this.getMetricStatusIcon(key, value, target);
            return `
                <tr>
                  <td>${key}</td>
                  <td><strong>${this.formatMetricValue(key, value)}</strong></td>
                  <td>${target === 'N/A' ? 'N/A' : this.formatMetricValue(key, target)}</td>
                  <td>${status}</td>
                </tr>
              `;
        }).join('')}
          </tbody>
        </table>
      </div>
    `).join('');
    }

    /**
     * Get metric status
     */
    getMetricStatus(key, value, target) {
        if (target === 'N/A') return '-';
        const ratio = value / target;
        return ratio <= 1 ? '✓' : ratio <= 1.2 ? '⚠' : '✗';
    }

    /**
     * Get metric status icon (HTML)
     */
    getMetricStatusIcon(key, value, target) {
        if (target === 'N/A') return '<span class="status-icon">-</span>';
        const ratio = value / target;
        if (ratio <= 1) {
            return '<span class="status-icon status-pass">✓</span>';
        } else if (ratio <= 1.2) {
            return '<span class="status-icon status-warn">⚠</span>';
        } else {
            return '<span class="status-icon status-fail">✗</span>';
        }
    }

    /**
     * Format metric value based on type
     */
    formatMetricValue(key, value) {
        if (key.includes('size') || key.includes('Size') || key.includes('memory') || key.includes('Memory')) {
            return formatBytes(value);
        }
        if (key.includes('time') || key.includes('Time') || key.match(/^(tti|fcp|lcp|fid|tbt)/i)) {
            return formatTime(value);
        }
        return formatNumber(value, 2);
    }

    /**
     * Ensure output directory exists
     */
    async ensureOutputDir() {
        try {
            await fs.access(this.outputDir);
        } catch {
            await fs.mkdir(this.outputDir, { recursive: true });
        }
    }

    /**
     * Save all reports
     */
    async saveAll() {
        const results = {
            json: await this.generateJSON(),
            html: await this.generateHTML()
        };

        this.generateConsole();

        return results;
    }
}

export default ReportGenerator;