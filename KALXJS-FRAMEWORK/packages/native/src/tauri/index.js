/**
 * Tauri Integration for KalxJS
 * Lightweight desktop application support using Tauri
 */

let tauri;
try {
    tauri = typeof window !== 'undefined' ? window.__TAURI__ : null;
} catch (e) {
    // Tauri not available
}

/**
 * Check if running in Tauri
 * @returns {boolean}
 */
export function isTauri() {
    return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
}

/**
 * Tauri API wrapper
 */
export const TauriAPI = {
    /**
     * Invoke Tauri command
     * @param {string} command - Command name
     * @param {Object} args - Command arguments
     * @returns {Promise<any>}
     */
    async invoke(command, args = {}) {
        if (!tauri) {
            throw new Error('Tauri is not available');
        }
        return await tauri.invoke(command, args);
    },

    /**
     * Window operations
     */
    window: {
        async getCurrent() {
            return tauri?.window?.getCurrent();
        },

        async minimize() {
            const window = await this.getCurrent();
            return await window?.minimize();
        },

        async maximize() {
            const window = await this.getCurrent();
            return await window?.maximize();
        },

        async toggleMaximize() {
            const window = await this.getCurrent();
            return await window?.toggleMaximize();
        },

        async close() {
            const window = await this.getCurrent();
            return await window?.close();
        },

        async setFullscreen(enable) {
            const window = await this.getCurrent();
            return await window?.setFullscreen(enable);
        },

        async setTitle(title) {
            const window = await this.getCurrent();
            return await window?.setTitle(title);
        },

        async setResizable(resizable) {
            const window = await this.getCurrent();
            return await window?.setResizable(resizable);
        },

        async setAlwaysOnTop(alwaysOnTop) {
            const window = await this.getCurrent();
            return await window?.setAlwaysOnTop(alwaysOnTop);
        }
    },

    /**
     * Dialog operations
     */
    dialog: {
        async open(options = {}) {
            if (!tauri?.dialog) return null;
            return await tauri.dialog.open(options);
        },

        async save(options = {}) {
            if (!tauri?.dialog) return null;
            return await tauri.dialog.save(options);
        },

        async message(message, options = {}) {
            if (!tauri?.dialog) return;
            return await tauri.dialog.message(message, options);
        },

        async ask(message, options = {}) {
            if (!tauri?.dialog) return false;
            return await tauri.dialog.ask(message, options);
        },

        async confirm(message, options = {}) {
            if (!tauri?.dialog) return false;
            return await tauri.dialog.confirm(message, options);
        }
    },

    /**
     * File system operations
     */
    fs: {
        async readTextFile(path, options = {}) {
            if (!tauri?.fs) return '';
            return await tauri.fs.readTextFile(path, options);
        },

        async readBinaryFile(path, options = {}) {
            if (!tauri?.fs) return new Uint8Array();
            return await tauri.fs.readBinaryFile(path, options);
        },

        async writeTextFile(path, contents, options = {}) {
            if (!tauri?.fs) return;
            return await tauri.fs.writeTextFile(path, contents, options);
        },

        async writeBinaryFile(path, contents, options = {}) {
            if (!tauri?.fs) return;
            return await tauri.fs.writeBinaryFile(path, contents, options);
        },

        async removeFile(path, options = {}) {
            if (!tauri?.fs) return;
            return await tauri.fs.removeFile(path, options);
        },

        async exists(path, options = {}) {
            if (!tauri?.fs) return false;
            return await tauri.fs.exists(path, options);
        },

        async createDir(path, options = {}) {
            if (!tauri?.fs) return;
            return await tauri.fs.createDir(path, options);
        },

        async removeDir(path, options = {}) {
            if (!tauri?.fs) return;
            return await tauri.fs.removeDir(path, options);
        }
    },

    /**
     * Shell operations
     */
    shell: {
        async open(url, options = {}) {
            if (!tauri?.shell) return;
            return await tauri.shell.open(url, options);
        },

        async execute(program, args = [], options = {}) {
            if (!tauri?.shell) return;
            return await tauri.shell.Command.create(program, args).execute();
        }
    },

    /**
     * Event system
     */
    event: {
        async listen(event, handler) {
            if (!tauri?.event) return () => { };
            return await tauri.event.listen(event, handler);
        },

        async once(event, handler) {
            if (!tauri?.event) return () => { };
            return await tauri.event.once(event, handler);
        },

        async emit(event, payload) {
            if (!tauri?.event) return;
            return await tauri.event.emit(event, payload);
        }
    },

    /**
     * HTTP client
     */
    http: {
        async fetch(url, options = {}) {
            if (!tauri?.http) return null;
            const client = tauri.http.getClient();
            return await client.request({ url, ...options });
        },

        async get(url, options = {}) {
            return await this.fetch(url, { ...options, method: 'GET' });
        },

        async post(url, body, options = {}) {
            return await this.fetch(url, { ...options, method: 'POST', body });
        }
    },

    /**
     * Path utilities
     */
    path: {
        async appDir() {
            if (!tauri?.path) return '';
            return await tauri.path.appDir();
        },

        async appDataDir() {
            if (!tauri?.path) return '';
            return await tauri.path.appDataDir();
        },

        async documentDir() {
            if (!tauri?.path) return '';
            return await tauri.path.documentDir();
        },

        async downloadDir() {
            if (!tauri?.path) return '';
            return await tauri.path.downloadDir();
        },

        async homeDir() {
            if (!tauri?.path) return '';
            return await tauri.path.homeDir();
        },

        async join(...paths) {
            if (!tauri?.path) return paths.join('/');
            return await tauri.path.join(...paths);
        }
    }
};

export default {
    isTauri,
    TauriAPI
};