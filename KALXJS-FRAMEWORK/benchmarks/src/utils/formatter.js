/**
 * Formatter Utilities
 * Format metrics for display
 */

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format milliseconds to human readable
 */
export function formatTime(ms, decimals = 2) {
    if (ms < 1000) {
        return `${ms.toFixed(decimals)}ms`;
    } else if (ms < 60000) {
        return `${(ms / 1000).toFixed(decimals)}s`;
    } else {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}m ${seconds}s`;
    }
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 2) {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(num, decimals = 0) {
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Color code based on performance target
 */
export function colorCode(value, target, inverse = false) {
    const ratio = inverse ? target / value : value / target;

    if (ratio <= 0.8) return 'green';
    if (ratio <= 1.0) return 'yellow';
    return 'red';
}

/**
 * Create comparison string
 */
export function formatComparison(baseline, current) {
    const diff = current - baseline;
    const percentDiff = (diff / baseline) * 100;
    const sign = diff > 0 ? '+' : '';

    return {
        diff: sign + formatNumber(diff, 2),
        percentDiff: sign + formatPercent(percentDiff / 100, 2),
        better: diff < 0,
        worse: diff > 0
    };
}

/**
 * Create ASCII table
 */
export function createTable(headers, rows) {
    const colWidths = headers.map((h, i) => {
        const maxContentWidth = Math.max(
            h.length,
            ...rows.map(row => String(row[i] || '').length)
        );
        return maxContentWidth + 2;
    });

    const separator = '+' + colWidths.map(w => '-'.repeat(w)).join('+') + '+';
    const headerRow = '|' + headers.map((h, i) =>
        ` ${h.padEnd(colWidths[i] - 1)}`
    ).join('|') + '|';

    const dataRows = rows.map(row =>
        '|' + row.map((cell, i) =>
            ` ${String(cell || '').padEnd(colWidths[i] - 1)}`
        ).join('|') + '|'
    );

    return [
        separator,
        headerRow,
        separator,
        ...dataRows,
        separator
    ].join('\n');
}

/**
 * Format metric with target comparison
 */
export function formatMetricWithTarget(value, target, unit = '', inverse = false) {
    const formattedValue = unit === 'bytes' ? formatBytes(value) :
        unit === 'ms' ? formatTime(value) :
            unit === '%' ? formatPercent(value) :
                formatNumber(value, 2);

    const status = colorCode(value, target, inverse);
    const statusIcon = status === 'green' ? '✓' :
        status === 'yellow' ? '⚠' : '✗';

    return {
        value: formattedValue,
        status,
        statusIcon,
        meetsTarget: status === 'green'
    };
}

/**
 * Create progress bar
 */
export function createProgressBar(current, total, width = 40) {
    const percent = current / total;
    const filled = Math.floor(width * percent);
    const empty = width - filled;

    return {
        bar: '█'.repeat(filled) + '░'.repeat(empty),
        percent: formatPercent(percent),
        ratio: `${current}/${total}`
    };
}

export default {
    formatBytes,
    formatTime,
    formatPercent,
    formatNumber,
    colorCode,
    formatComparison,
    createTable,
    formatMetricWithTarget,
    createProgressBar
};