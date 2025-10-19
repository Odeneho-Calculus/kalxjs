/**
 * Snapshot Testing Utilities
 * Component snapshot testing
 *
 * @module @kalxjs/testing/snapshot
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Snapshot storage
 */
const snapshots = new Map();

/**
 * Serialize value to snapshot string
 */
function serialize(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value instanceof Date) return `Date(${value.toISOString()})`;
    if (value instanceof RegExp) return value.toString();
    if (value instanceof Error) return `Error(${value.message})`;

    // DOM Element
    if (value instanceof Element) {
        return serializeElement(value);
    }

    // Array
    if (Array.isArray(value)) {
        const items = value.map(item => serialize(item)).join(',\n  ');
        return `[\n  ${items}\n]`;
    }

    // Object
    if (typeof value === 'object') {
        const entries = Object.entries(value)
            .map(([key, val]) => `  ${key}: ${serialize(val)}`)
            .join(',\n');
        return `{\n${entries}\n}`;
    }

    return String(value);
}

/**
 * Serialize DOM element
 */
function serializeElement(element) {
    const tag = element.tagName.toLowerCase();
    const attributes = Array.from(element.attributes)
        .map(attr => ` ${attr.name}="${attr.value}"`)
        .join('');

    const children = Array.from(element.childNodes)
        .map(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent.trim();
                return text ? text : null;
            }
            if (child.nodeType === Node.ELEMENT_NODE) {
                return serializeElement(child);
            }
            return null;
        })
        .filter(Boolean);

    if (children.length === 0) {
        return `<${tag}${attributes} />`;
    }

    if (children.length === 1 && typeof children[0] === 'string') {
        return `<${tag}${attributes}>${children[0]}</${tag}>`;
    }

    const childrenStr = children
        .map(child => `  ${child}`)
        .join('\n');

    return `<${tag}${attributes}>\n${childrenStr}\n</${tag}>`;
}

/**
 * Match snapshot
 */
export function toMatchSnapshot(received, snapshotName) {
    const serialized = serialize(received);
    const stored = snapshots.get(snapshotName);

    if (stored === undefined) {
        // New snapshot
        snapshots.set(snapshotName, serialized);
        return {
            pass: true,
            message: () => `Snapshot saved: ${snapshotName}`,
        };
    }

    // Compare with stored snapshot
    const pass = serialized === stored;

    return {
        pass,
        message: () => {
            if (pass) {
                return `Snapshot matches: ${snapshotName}`;
            }

            return [
                `Snapshot mismatch: ${snapshotName}`,
                '',
                'Expected:',
                stored,
                '',
                'Received:',
                serialized,
            ].join('\n');
        },
    };
}

/**
 * Match inline snapshot
 */
export function toMatchInlineSnapshot(received, inlineSnapshot) {
    const serialized = serialize(received);
    const pass = serialized === inlineSnapshot;

    return {
        pass,
        message: () => {
            if (pass) {
                return 'Inline snapshot matches';
            }

            return [
                'Inline snapshot mismatch',
                '',
                'Expected:',
                inlineSnapshot,
                '',
                'Received:',
                serialized,
            ].join('\n');
        },
    };
}

/**
 * Create snapshot matcher
 */
export function createSnapshotMatcher(testPath, testName) {
    const snapshotPath = path.join(
        path.dirname(testPath),
        '__snapshots__',
        `${path.basename(testPath)}.snap`
    );

    let snapshotCount = 0;

    return {
        matchSnapshot: (received, name) => {
            snapshotCount++;
            const snapshotName = name || `${testName} ${snapshotCount}`;
            return toMatchSnapshot(received, snapshotName);
        },

        matchInlineSnapshot: (received, inlineSnapshot) => {
            return toMatchInlineSnapshot(received, inlineSnapshot);
        },

        save: () => {
            saveSnapshots(snapshotPath);
        },

        load: () => {
            loadSnapshots(snapshotPath);
        },
    };
}

/**
 * Save snapshots to file
 */
function saveSnapshots(filePath) {
    const dir = path.dirname(filePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const content = Array.from(snapshots.entries())
        .map(([name, snapshot]) => {
            return `exports[\`${name}\`] = \`\n${snapshot}\n\`;`;
        })
        .join('\n\n');

    fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Load snapshots from file
 */
function loadSnapshots(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const regex = /exports\[`(.+?)`\] = `\n([\s\S]+?)\n`;/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        const [, name, snapshot] = match;
        snapshots.set(name, snapshot);
    }
}

/**
 * Clear all snapshots
 */
export function clearSnapshots() {
    snapshots.clear();
}

/**
 * Get all snapshots
 */
export function getSnapshots() {
    return new Map(snapshots);
}

/**
 * Update snapshots
 */
export function updateSnapshots(updates) {
    Object.entries(updates).forEach(([name, snapshot]) => {
        snapshots.set(name, serialize(snapshot));
    });
}

/**
 * Snapshot testing plugin for test runner
 */
export function snapshotPlugin(options = {}) {
    const {
        updateSnapshots = false,
        snapshotDir = '__snapshots__',
    } = options;

    return {
        name: 'snapshot-plugin',

        beforeAll(context) {
            context.snapshots = new Map();
        },

        beforeEach(context) {
            context.snapshotCount = 0;
        },

        afterAll(context) {
            if (updateSnapshots) {
                // Save snapshots
                Object.assign(snapshots, context.snapshots);
            }
        },
    };
}