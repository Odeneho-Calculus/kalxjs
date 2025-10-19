/**
 * Electron Integration for KalxJS
 * Desktop application support using Electron
 */

let electron;
try {
    electron = require('electron');
} catch (e) {
    // Electron not available
}

/**
 * Check if running in Electron
 * @returns {boolean}
 */
export function isElectron() {
    return typeof process !== 'undefined' &&
        process.versions &&
        !!process.versions.electron;
}

/**
 * Electron API wrapper
 */
export const ElectronAPI = {
    /**
     * Get IPC Renderer
     * @returns {Object|null}
     */
    get ipcRenderer() {
        return electron?.ipcRenderer || null;
    },

    /**
     * Get remote
     * @returns {Object|null}
     */
    get remote() {
        return electron?.remote || null;
    },

    /**
     * Send message to main process
     * @param {string} channel - Channel name
     * @param {any} data - Data to send
     */
    send(channel, data) {
        if (this.ipcRenderer) {
            this.ipcRenderer.send(channel, data);
        }
    },

    /**
     * Send message and wait for response
     * @param {string} channel - Channel name
     * @param {any} data - Data to send
     * @returns {Promise<any>}
     */
    async invoke(channel, data) {
        if (this.ipcRenderer) {
            return await this.ipcRenderer.invoke(channel, data);
        }
        throw new Error('Electron IPC not available');
    },

    /**
     * Listen to channel
     * @param {string} channel - Channel name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(channel, callback) {
        if (this.ipcRenderer) {
            this.ipcRenderer.on(channel, callback);
            return () => this.ipcRenderer.removeListener(channel, callback);
        }
        return () => { };
    },

    /**
     * Listen once to channel
     * @param {string} channel - Channel name
     * @param {Function} callback - Callback function
     */
    once(channel, callback) {
        if (this.ipcRenderer) {
            this.ipcRenderer.once(channel, callback);
        }
    },

    /**
     * Get current window
     * @returns {Object|null}
     */
    getCurrentWindow() {
        if (electron?.remote) {
            return electron.remote.getCurrentWindow();
        }
        return null;
    },

    /**
     * Window operations
     */
    window: {
        minimize() {
            ElectronAPI.send('window-minimize');
        },

        maximize() {
            ElectronAPI.send('window-maximize');
        },

        close() {
            ElectronAPI.send('window-close');
        },

        fullscreen(enable = true) {
            ElectronAPI.send('window-fullscreen', enable);
        },

        setTitle(title) {
            ElectronAPI.send('window-set-title', title);
        }
    },

    /**
     * Dialog operations
     */
    dialog: {
        async showOpenDialog(options) {
            return await ElectronAPI.invoke('dialog-open', options);
        },

        async showSaveDialog(options) {
            return await ElectronAPI.invoke('dialog-save', options);
        },

        async showMessageBox(options) {
            return await ElectronAPI.invoke('dialog-message', options);
        }
    },

    /**
     * File system operations
     */
    fs: {
        async readFile(path) {
            return await ElectronAPI.invoke('fs-read-file', path);
        },

        async writeFile(path, content) {
            return await ElectronAPI.invoke('fs-write-file', { path, content });
        },

        async exists(path) {
            return await ElectronAPI.invoke('fs-exists', path);
        }
    },

    /**
     * Shell operations
     */
    shell: {
        async openExternal(url) {
            return await ElectronAPI.invoke('shell-open-external', url);
        },

        async showItemInFolder(path) {
            return await ElectronAPI.invoke('shell-show-item', path);
        }
    }
};

/**
 * Create Electron main process handlers
 * This should be called in the main process
 */
export function createMainProcessHandlers(mainWindow) {
    if (!electron || !electron.ipcMain) {
        throw new Error('This function must be called in Electron main process');
    }

    const { ipcMain, dialog, shell } = electron;
    const fs = require('fs').promises;

    // Window handlers
    ipcMain.on('window-minimize', () => mainWindow.minimize());
    ipcMain.on('window-maximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });
    ipcMain.on('window-close', () => mainWindow.close());
    ipcMain.on('window-fullscreen', (event, enable) => {
        mainWindow.setFullScreen(enable);
    });
    ipcMain.on('window-set-title', (event, title) => {
        mainWindow.setTitle(title);
    });

    // Dialog handlers
    ipcMain.handle('dialog-open', async (event, options) => {
        return await dialog.showOpenDialog(mainWindow, options);
    });
    ipcMain.handle('dialog-save', async (event, options) => {
        return await dialog.showSaveDialog(mainWindow, options);
    });
    ipcMain.handle('dialog-message', async (event, options) => {
        return await dialog.showMessageBox(mainWindow, options);
    });

    // File system handlers
    ipcMain.handle('fs-read-file', async (event, path) => {
        return await fs.readFile(path, 'utf-8');
    });
    ipcMain.handle('fs-write-file', async (event, { path, content }) => {
        return await fs.writeFile(path, content, 'utf-8');
    });
    ipcMain.handle('fs-exists', async (event, path) => {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    });

    // Shell handlers
    ipcMain.handle('shell-open-external', async (event, url) => {
        return await shell.openExternal(url);
    });
    ipcMain.handle('shell-show-item', async (event, path) => {
        shell.showItemInFolder(path);
    });
}

export default {
    isElectron,
    ElectronAPI,
    createMainProcessHandlers
};