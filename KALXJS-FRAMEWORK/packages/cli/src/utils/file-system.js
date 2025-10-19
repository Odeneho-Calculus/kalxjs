/**
 * File System Utilities
 * Helper functions for file operations
 *
 * @module @kalxjs/cli/utils/file-system
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/**
 * Check if file exists
 */
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if file exists (sync)
 */
export function fileExistsSync(filePath) {
    return existsSync(filePath);
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
        return true;
    } catch (error) {
        console.error(`Failed to create directory: ${dirPath}`, error);
        return false;
    }
}

/**
 * Read file content
 */
export async function readFile(filePath, encoding = 'utf-8') {
    try {
        return await fs.readFile(filePath, encoding);
    } catch (error) {
        console.error(`Failed to read file: ${filePath}`, error);
        throw error;
    }
}

/**
 * Write file content
 */
export async function writeFile(filePath, content) {
    try {
        const dir = path.dirname(filePath);
        await ensureDir(dir);
        await fs.writeFile(filePath, content, 'utf-8');
        return true;
    } catch (error) {
        console.error(`Failed to write file: ${filePath}`, error);
        throw error;
    }
}

/**
 * Copy file
 */
export async function copyFile(source, destination) {
    try {
        const dir = path.dirname(destination);
        await ensureDir(dir);
        await fs.copyFile(source, destination);
        return true;
    } catch (error) {
        console.error(`Failed to copy file: ${source} to ${destination}`, error);
        throw error;
    }
}

/**
 * Copy directory recursively
 */
export async function copyDir(source, destination) {
    try {
        await ensureDir(destination);
        const entries = await fs.readdir(source, { withFileTypes: true });

        for (const entry of entries) {
            const sourcePath = path.join(source, entry.name);
            const destPath = path.join(destination, entry.name);

            if (entry.isDirectory()) {
                await copyDir(sourcePath, destPath);
            } else {
                await copyFile(sourcePath, destPath);
            }
        }

        return true;
    } catch (error) {
        console.error(`Failed to copy directory: ${source} to ${destination}`, error);
        throw error;
    }
}

/**
 * Delete file
 */
export async function deleteFile(filePath) {
    try {
        await fs.unlink(filePath);
        return true;
    } catch (error) {
        console.error(`Failed to delete file: ${filePath}`, error);
        return false;
    }
}

/**
 * Delete directory recursively
 */
export async function deleteDir(dirPath) {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
        return true;
    } catch (error) {
        console.error(`Failed to delete directory: ${dirPath}`, error);
        return false;
    }
}

/**
 * List directory contents
 */
export async function readDir(dirPath) {
    try {
        return await fs.readdir(dirPath);
    } catch (error) {
        console.error(`Failed to read directory: ${dirPath}`, error);
        throw error;
    }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath) {
    try {
        return await fs.stat(filePath);
    } catch (error) {
        console.error(`Failed to get file stats: ${filePath}`, error);
        throw error;
    }
}

/**
 * Check if path is directory
 */
export async function isDirectory(dirPath) {
    try {
        const stats = await fs.stat(dirPath);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

/**
 * Export all utilities
 */
export default {
    fileExists,
    fileExistsSync,
    ensureDir,
    readFile,
    writeFile,
    copyFile,
    copyDir,
    deleteFile,
    deleteDir,
    readDir,
    getFileStats,
    isDirectory,
};