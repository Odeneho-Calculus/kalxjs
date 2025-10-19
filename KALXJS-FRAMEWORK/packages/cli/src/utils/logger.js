/**
 * Logger Utility
 * Colorful console logging
 *
 * @module @kalxjs/cli/utils/logger
 */

/**
 * ANSI color codes
 */
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',

    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',

    // Background colors
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
};

/**
 * Format message with color
 */
function colorize(message, color) {
    return `${colors[color]}${message}${colors.reset}`;
}

/**
 * Log info message
 */
export function info(message) {
    console.log(colorize(`ℹ ${message}`, 'blue'));
}

/**
 * Log success message
 */
export function success(message) {
    console.log(colorize(`✓ ${message}`, 'green'));
}

/**
 * Log warning message
 */
export function warn(message) {
    console.log(colorize(`⚠ ${message}`, 'yellow'));
}

/**
 * Log error message
 */
export function error(message) {
    console.error(colorize(`✗ ${message}`, 'red'));
}

/**
 * Log debug message
 */
export function debug(message) {
    if (process.env.DEBUG) {
        console.log(colorize(`[DEBUG] ${message}`, 'dim'));
    }
}

/**
 * Log title/header
 */
export function title(message) {
    console.log(colorize(`\n${message}`, 'bright'));
    console.log(colorize('='.repeat(message.length), 'dim'));
}

/**
 * Log subtitle
 */
export function subtitle(message) {
    console.log(colorize(`\n${message}`, 'cyan'));
}

/**
 * Log list item
 */
export function listItem(message) {
    console.log(`  • ${message}`);
}

/**
 * Log command
 */
export function command(cmd) {
    console.log(colorize(`  $ ${cmd}`, 'dim'));
}

/**
 * Create spinner
 */
export function createSpinner(message) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    let intervalId = null;

    return {
        start() {
            process.stdout.write(`${frames[0]} ${message}`);
            intervalId = setInterval(() => {
                i = (i + 1) % frames.length;
                process.stdout.write(`\r${frames[i]} ${message}`);
            }, 80);
        },
        stop(finalMessage = null) {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            process.stdout.write('\r\x1b[K'); // Clear line
            if (finalMessage) {
                console.log(finalMessage);
            }
        },
        succeed(message) {
            this.stop(colorize(`✓ ${message}`, 'green'));
        },
        fail(message) {
            this.stop(colorize(`✗ ${message}`, 'red'));
        },
    };
}

/**
 * Log table
 */
export function table(data) {
    console.table(data);
}

/**
 * Create progress bar
 */
export function createProgress(total) {
    let current = 0;
    const width = 30;

    return {
        update(value) {
            current = value;
            const percentage = (current / total * 100).toFixed(0);
            const filled = Math.round(width * current / total);
            const empty = width - filled;
            const bar = '█'.repeat(filled) + '░'.repeat(empty);

            process.stdout.write(`\r[${bar}] ${percentage}%`);

            if (current >= total) {
                process.stdout.write('\n');
            }
        },
        increment() {
            this.update(current + 1);
        },
    };
}

/**
 * Log box
 */
export function box(message, options = {}) {
    const { padding = 1, borderColor = 'blue' } = options;
    const lines = message.split('\n');
    const maxLength = Math.max(...lines.map(l => l.length));
    const horizontalBorder = '─'.repeat(maxLength + padding * 2);

    console.log(colorize(`┌${horizontalBorder}┐`, borderColor));
    lines.forEach(line => {
        const padded = line.padEnd(maxLength);
        console.log(colorize(`│${' '.repeat(padding)}${padded}${' '.repeat(padding)}│`, borderColor));
    });
    console.log(colorize(`└${horizontalBorder}┘`, borderColor));
}

/**
 * Clear console
 */
export function clear() {
    console.clear();
}

/**
 * New line
 */
export function newLine() {
    console.log();
}

/**
 * Export logger
 */
export default {
    info,
    success,
    warn,
    error,
    debug,
    title,
    subtitle,
    listItem,
    command,
    createSpinner,
    table,
    createProgress,
    box,
    clear,
    newLine,
    colorize,
};