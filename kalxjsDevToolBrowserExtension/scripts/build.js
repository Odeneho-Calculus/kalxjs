/**
 * KALXJS DevTools Extension Build Script
 * Production build script for creating optimized extension
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.dirname(path.dirname(import.meta.url.replace('file://', '')));

class ExtensionBuilder {
    constructor() {
        this.buildDir = path.join(PROJECT_ROOT, 'build');
        this.distDir = path.join(PROJECT_ROOT, 'dist');
        this.startTime = Date.now();
    }

    /**
     * Run complete build process
     */
    async build() {
        console.log('🚀 Starting KALXJS DevTools Extension build...');

        try {
            // Clean previous builds
            await this.clean();

            // Run Rollup build
            await this.runRollupBuild();

            // Validate build output
            await this.validateBuild();

            // Generate build report
            this.generateBuildReport();

            console.log(`✅ Build completed successfully in ${Date.now() - this.startTime}ms`);

        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    }

    /**
     * Clean build directories
     */
    async clean() {
        console.log('🧹 Cleaning build directories...');

        // Remove build directory
        if (fs.existsSync(this.buildDir)) {
            fs.rmSync(this.buildDir, { recursive: true, force: true });
        }

        // Create build directory
        fs.mkdirSync(this.buildDir, { recursive: true });

        console.log('   Build directories cleaned');
    }

    /**
     * Run Rollup build
     */
    async runRollupBuild() {
        console.log('📦 Building extension with Rollup...');

        try {
            // Set production environment
            process.env.NODE_ENV = 'production';

            // Run Rollup build
            execSync('npm run build:prod', {
                stdio: 'inherit',
                cwd: PROJECT_ROOT
            });

            console.log('   Rollup build completed');

        } catch (error) {
            throw new Error(`Rollup build failed: ${error.message}`);
        }
    }

    /**
     * Validate build output
     */
    async validateBuild() {
        console.log('✅ Validating build output...');

        const requiredFiles = [
            'manifest.json',
            'background/service-worker.js',
            'content-script/content.js',
            'content-script/injected.js',
            'devtools/devtools.html',
            'devtools/devtools.js',
            'devtools/panel/panel.html',
            'devtools/panel/panel.js',
            'devtools/panel/panel.css'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.buildDir, file);

            if (!fs.existsSync(filePath)) {
                throw new Error(`Required build file missing: ${file}`);
            }

            // Check file size
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                throw new Error(`Build file is empty: ${file}`);
            }
        }

        // Validate manifest
        const manifestPath = path.join(PROJECT_ROOT, 'manifest.json');
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);

        if (!manifest.manifest_version || manifest.manifest_version !== 3) {
            throw new Error('Invalid manifest version');
        }

        if (!manifest.name || !manifest.version) {
            throw new Error('Manifest missing required fields');
        }

        console.log('   Build output validation passed');
    }

    /**
     * Generate build report
     */
    generateBuildReport() {
        console.log('📊 Generating build report...');

        const report = {
            buildTime: new Date().toISOString(),
            buildDuration: Date.now() - this.startTime,
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development',
            files: {}
        };

        // Analyze build files
        const analyzeDirectory = (dir, prefix = '') => {
            const items = fs.readdirSync(dir);

            items.forEach(item => {
                const itemPath = path.join(dir, item);
                const stats = fs.statSync(itemPath);
                const relativePath = path.join(prefix, item);

                if (stats.isDirectory()) {
                    analyzeDirectory(itemPath, relativePath);
                } else {
                    report.files[relativePath] = {
                        size: stats.size,
                        sizeKB: Math.round(stats.size / 1024 * 100) / 100,
                        modified: stats.mtime.toISOString()
                    };
                }
            });
        };

        analyzeDirectory(this.buildDir);

        // Calculate total size
        const totalSize = Object.values(report.files).reduce((sum, file) => sum + file.size, 0);
        report.totalSize = totalSize;
        report.totalSizeKB = Math.round(totalSize / 1024 * 100) / 100;
        report.totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;

        // Write report
        const reportPath = path.join(this.buildDir, 'build-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Display summary
        console.log(`   Total build size: ${report.totalSizeKB} KB`);
        console.log(`   Build files: ${Object.keys(report.files).length}`);
        console.log(`   Report saved to: ${reportPath}`);
    }
}

// Run build if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const builder = new ExtensionBuilder();
    builder.build();
}

export default ExtensionBuilder;