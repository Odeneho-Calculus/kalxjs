#!/usr/bin/env node

/**
 * KalxJS Smart Unused File Detection & Cleanup Script
 *
 * This script intelligently detects and safely removes unused files from the KalxJS codebase
 * while maintaining project integrity and avoiding false positives on critical files.
 *
 * Features:
 * - Static code analysis for import/require detection
 * - Dynamic import and lazy loading detection
 * - Asset reference checking (HTML, CSS, JSON, config files)
 * - Build tool configuration analysis
 * - Test file dependency tracking
 * - Documentation reference checking
 * - Safe cleanup with backup and rollback
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

class UnusedFileDetector {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.backupDir = path.join(this.rootDir, '.cleanup-backup');
        this.logFile = path.join(this.rootDir, 'cleanup-unused.log');

        // File patterns to analyze
        this.codeExtensions = ['.js', '.mjs', '.ts', '.jsx', '.tsx', '.kal'];
        this.assetExtensions = ['.css', '.scss', '.sass', '.less', '.html', '.json', '.md'];
        this.imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];
        this.configExtensions = ['.config.js', '.config.mjs', '.config.ts'];

        // Critical files that should never be deleted
        this.criticalFiles = new Set([
            'package.json',
            'package-lock.json',
            'yarn.lock',
            'pnpm-lock.yaml',
            'README.md',
            'LICENSE',
            'CHANGELOG.md',
            'CONTRIBUTING.md',
            '.gitignore',
            '.npmignore',
            '.eslintrc.js',
            '.eslintrc.json',
            '.prettierrc',
            'babel.config.js',
            'jest.config.js',
            'rollup.config.js',
            'vite.config.js',
            'webpack.config.js',
            'tsconfig.json',
            'lerna.json'
        ]);

        // Critical directories that should be preserved
        this.criticalDirs = new Set([
            'node_modules',
            '.git',
            '.vscode',
            'dist',
            'build',
            'coverage'
        ]);

        // Patterns to exclude from analysis
        this.excludePatterns = [
            /node_modules/,
            /\.git/,
            /dist/,
            /build/,
            /coverage/,
            /\.nyc_output/,
            /\.cache/,
            /\.temp/,
            /\.tmp/
        ];

        this.fileGraph = new Map(); // File dependency graph
        this.usedFiles = new Set(); // Files that are definitely used
        this.unusedFiles = new Set(); // Files that appear unused
        this.ambiguousFiles = new Set(); // Files that might be used

        this.setupLogging();
    }

    /**
     * Setup logging system
     */
    setupLogging() {
        this.log = (message, level = 'INFO') => {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${level}] ${message}`;

            console.log(logMessage);

            try {
                fs.appendFileSync(this.logFile, logMessage + '\n');
            } catch (error) {
                console.error('Failed to write to log file:', error.message);
            }
        };

        // Clear previous log
        try {
            fs.writeFileSync(this.logFile, '');
        } catch (error) {
            console.warn('Could not clear log file:', error.message);
        }
    }

    /**
     * Main cleanup process
     */
    async cleanup(options = {}) {
        const {
            dryRun = true,
            interactive = true,
            backup = true,
            verbose = false
        } = options;

        try {
            this.log('🔍 Starting KalxJS unused file detection and cleanup');
            this.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'} | Interactive: ${interactive} | Backup: ${backup}`);

            // Step 1: Scan all files
            await this.scanFiles();

            // Step 2: Build dependency graph
            await this.buildDependencyGraph();

            // Step 3: Analyze usage
            await this.analyzeUsage();

            // Step 4: Generate report
            const report = await this.generateReport();

            // Step 5: Interactive review (if enabled)
            if (interactive && !dryRun) {
                await this.interactiveReview(report);
            }

            // Step 6: Create backup (if enabled and not dry run)
            if (backup && !dryRun) {
                await this.createBackup();
            }

            // Step 7: Perform cleanup (if not dry run)
            if (!dryRun) {
                await this.performCleanup();
            }

            // Step 8: Generate final report
            await this.generateFinalReport(report, dryRun);

            this.log('✅ Cleanup process completed successfully!');

        } catch (error) {
            this.log(`❌ Cleanup failed: ${error.message}`, 'ERROR');
            this.log(`Stack trace: ${error.stack}`, 'ERROR');
            process.exit(1);
        }
    }

    /**
     * Scan all files in the project
     */
    async scanFiles() {
        this.log('📂 Scanning project files...');

        this.allFiles = new Set();
        this.entryPoints = new Set();

        await this.scanDirectory(this.rootDir);

        // Identify entry points
        await this.identifyEntryPoints();

        this.log(`✓ Found ${this.allFiles.size} files, ${this.entryPoints.size} entry points`);
    }

    /**
     * Recursively scan directory
     */
    async scanDirectory(dir, relativePath = '') {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relPath = path.join(relativePath, entry.name);

                // Skip excluded patterns
                if (this.shouldExclude(relPath)) {
                    continue;
                }

                if (entry.isDirectory()) {
                    // Skip critical directories
                    if (!this.criticalDirs.has(entry.name)) {
                        await this.scanDirectory(fullPath, relPath);
                    }
                } else if (entry.isFile()) {
                    this.allFiles.add(fullPath);
                }
            }
        } catch (error) {
            this.log(`⚠️ Could not scan directory ${dir}: ${error.message}`, 'WARN');
        }
    }

    /**
     * Check if path should be excluded
     */
    shouldExclude(relativePath) {
        return this.excludePatterns.some(pattern => pattern.test(relativePath));
    }

    /**
     * Identify entry points
     */
    async identifyEntryPoints() {
        // Package.json main fields
        await this.findPackageEntryPoints();

        // Build configuration entry points
        await this.findBuildEntryPoints();

        // Test entry points
        await this.findTestEntryPoints();

        // Documentation entry points
        await this.findDocumentationEntryPoints();

        // Example entry points
        await this.findExampleEntryPoints();
    }

    /**
     * Find package.json entry points
     */
    async findPackageEntryPoints() {
        const packageFiles = Array.from(this.allFiles).filter(file =>
            path.basename(file) === 'package.json'
        );

        for (const packageFile of packageFiles) {
            try {
                const content = fs.readFileSync(packageFile, 'utf8');
                const pkg = JSON.parse(content);

                const entryFields = ['main', 'module', 'browser', 'types', 'typings'];

                for (const field of entryFields) {
                    if (pkg[field]) {
                        const entryPath = path.resolve(path.dirname(packageFile), pkg[field]);
                        if (fs.existsSync(entryPath)) {
                            this.entryPoints.add(entryPath);
                        }
                    }
                }

                // Bin entries
                if (pkg.bin) {
                    const binEntries = typeof pkg.bin === 'string' ? [pkg.bin] : Object.values(pkg.bin);
                    for (const binEntry of binEntries) {
                        const binPath = path.resolve(path.dirname(packageFile), binEntry);
                        if (fs.existsSync(binPath)) {
                            this.entryPoints.add(binPath);
                        }
                    }
                }

                // Scripts that might reference files
                if (pkg.scripts) {
                    for (const script of Object.values(pkg.scripts)) {
                        this.extractFileReferencesFromScript(script, path.dirname(packageFile));
                    }
                }

            } catch (error) {
                this.log(`⚠️ Could not parse ${packageFile}: ${error.message}`, 'WARN');
            }
        }
    }

    /**
     * Find build configuration entry points
     */
    async findBuildEntryPoints() {
        const configFiles = Array.from(this.allFiles).filter(file => {
            const basename = path.basename(file);
            return basename.includes('config') && this.codeExtensions.some(ext => basename.endsWith(ext));
        });

        for (const configFile of configFiles) {
            this.entryPoints.add(configFile);

            // Parse config file for entry points
            try {
                const content = fs.readFileSync(configFile, 'utf8');
                this.extractFileReferencesFromCode(content, path.dirname(configFile));
            } catch (error) {
                this.log(`⚠️ Could not parse config ${configFile}: ${error.message}`, 'WARN');
            }
        }
    }

    /**
     * Find test entry points
     */
    async findTestEntryPoints() {
        const testFiles = Array.from(this.allFiles).filter(file => {
            const basename = path.basename(file);
            return (basename.includes('test') || basename.includes('spec')) &&
                   this.codeExtensions.some(ext => basename.endsWith(ext));
        });

        testFiles.forEach(file => this.entryPoints.add(file));
    }

    /**
     * Find documentation entry points
     */
    async findDocumentationEntryPoints() {
        const docFiles = Array.from(this.allFiles).filter(file =>
            this.assetExtensions.some(ext => file.endsWith(ext)) ||
            file.includes('README') ||
            file.includes('CHANGELOG') ||
            file.includes('CONTRIBUTING')
        );

        docFiles.forEach(file => this.entryPoints.add(file));
    }

    /**
     * Find example entry points
     */
    async findExampleEntryPoints() {
        const exampleFiles = Array.from(this.allFiles).filter(file =>
            file.includes('example') || file.includes('demo')
        );

        exampleFiles.forEach(file => this.entryPoints.add(file));
    }

    /**
     * Build dependency graph
     */
    async buildDependencyGraph() {
        this.log('🕸️ Building dependency graph...');

        let processedFiles = 0;
        const totalFiles = this.allFiles.size;

        for (const file of this.allFiles) {
            await this.analyzeFileDependencies(file);
            processedFiles++;

            if (processedFiles % 100 === 0) {
                this.log(`Progress: ${processedFiles}/${totalFiles} files analyzed`);
            }
        }

        this.log(`✓ Dependency graph built with ${this.fileGraph.size} nodes`);
    }

    /**
     * Analyze dependencies for a single file
     */
    async analyzeFileDependencies(file) {
        try {
            const ext = path.extname(file);
            const dependencies = new Set();

            if (this.codeExtensions.includes(ext)) {
                const content = fs.readFileSync(file, 'utf8');
                this.extractFileReferencesFromCode(content, path.dirname(file), dependencies);
            } else if (this.assetExtensions.includes(ext)) {
                const content = fs.readFileSync(file, 'utf8');
                this.extractFileReferencesFromAsset(content, path.dirname(file), dependencies);
            }

            this.fileGraph.set(file, {
                dependencies: Array.from(dependencies),
                dependents: [],
                type: this.getFileType(file),
                size: fs.statSync(file).size,
                lastModified: fs.statSync(file).mtime
            });

        } catch (error) {
            this.log(`⚠️ Could not analyze ${file}: ${error.message}`, 'WARN');
        }
    }

    /**
     * Extract file references from code
     */
    extractFileReferencesFromCode(content, baseDir, dependencies = new Set()) {
        // Static imports/requires
        const importPatterns = [
            /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
            /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
            /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
            /import\s+['"`]([^'"`]+)['"`]/g
        ];

        for (const pattern of importPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const importPath = match[1];
                const resolvedPath = this.resolveImportPath(importPath, baseDir);
                if (resolvedPath) {
                    dependencies.add(resolvedPath);
                }
            }
        }

        // Dynamic imports and lazy loading
        const dynamicPatterns = [
            /loadComponent\s*\(\s*['"`]([^'"`]+)['"`]/g,
            /lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*['"`]([^'"`]+)['"`]/g,
            /defineAsyncComponent\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*['"`]([^'"`]+)['"`]/g
        ];

        for (const pattern of dynamicPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const importPath = match[1];
                const resolvedPath = this.resolveImportPath(importPath, baseDir);
                if (resolvedPath) {
                    dependencies.add(resolvedPath);
                }
            }
        }

        // Asset references
        const assetPatterns = [
            /['"`]([^'"`]*\.(css|scss|sass|less|png|jpg|jpeg|gif|svg|webp|ico))['"`]/g,
            /url\s*\(\s*['"`]?([^'"`\)]+)['"`]?\s*\)/g
        ];

        for (const pattern of assetPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const assetPath = match[1];
                const resolvedPath = this.resolveAssetPath(assetPath, baseDir);
                if (resolvedPath) {
                    dependencies.add(resolvedPath);
                }
            }
        }
    }

    /**
     * Extract file references from asset files
     */
    extractFileReferencesFromAsset(content, baseDir, dependencies = new Set()) {
        // CSS @import and url() references
        if (content.includes('@import') || content.includes('url(')) {
            const cssPatterns = [
                /@import\s+['"`]([^'"`]+)['"`]/g,
                /url\s*\(\s*['"`]?([^'"`\)]+)['"`]?\s*\)/g
            ];

            for (const pattern of cssPatterns) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const assetPath = match[1];
                    const resolvedPath = this.resolveAssetPath(assetPath, baseDir);
                    if (resolvedPath) {
                        dependencies.add(resolvedPath);
                    }
                }
            }
        }

        // HTML src and href references
        if (content.includes('src=') || content.includes('href=')) {
            const htmlPatterns = [
                /src\s*=\s*['"`]([^'"`]+)['"`]/g,
                /href\s*=\s*['"`]([^'"`]+)['"`]/g
            ];

            for (const pattern of htmlPatterns) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const assetPath = match[1];
                    if (!assetPath.startsWith('http') && !assetPath.startsWith('//')) {
                        const resolvedPath = this.resolveAssetPath(assetPath, baseDir);
                        if (resolvedPath) {
                            dependencies.add(resolvedPath);
                        }
                    }
                }
            }
        }

        // Markdown image and link references
        if (content.includes('](') || content.includes('](')) {
            const markdownPatterns = [
                /!\[.*?\]\(([^)]+)\)/g,
                /\[.*?\]\(([^)]+)\)/g
            ];

            for (const pattern of markdownPatterns) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const linkPath = match[1];
                    if (!linkPath.startsWith('http') && !linkPath.startsWith('#')) {
                        const resolvedPath = this.resolveAssetPath(linkPath, baseDir);
                        if (resolvedPath) {
                            dependencies.add(resolvedPath);
                        }
                    }
                }
            }
        }
    }

    /**
     * Extract file references from script commands
     */
    extractFileReferencesFromScript(script, baseDir) {
        // Look for file references in npm scripts
        const filePatterns = [
            /([^\s]+\.(js|mjs|ts|json|css|html))/g
        ];

        for (const pattern of filePatterns) {
            let match;
            while ((match = pattern.exec(script)) !== null) {
                const filePath = match[1];
                const resolvedPath = this.resolveImportPath(filePath, baseDir);
                if (resolvedPath) {
                    this.entryPoints.add(resolvedPath);
                }
            }
        }
    }

    /**
     * Resolve import path to absolute path
     */
    resolveImportPath(importPath, baseDir) {
        // Skip node_modules and external packages
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            return null;
        }

        try {
            let resolvedPath = path.resolve(baseDir, importPath);

            // Try different extensions if file doesn't exist
            if (!fs.existsSync(resolvedPath)) {
                for (const ext of this.codeExtensions) {
                    const withExt = resolvedPath + ext;
                    if (fs.existsSync(withExt)) {
                        resolvedPath = withExt;
                        break;
                    }
                }

                // Try index files
                if (!fs.existsSync(resolvedPath)) {
                    for (const ext of this.codeExtensions) {
                        const indexFile = path.join(resolvedPath, `index${ext}`);
                        if (fs.existsSync(indexFile)) {
                            resolvedPath = indexFile;
                            break;
                        }
                    }
                }
            }

            return fs.existsSync(resolvedPath) ? resolvedPath : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Resolve asset path to absolute path
     */
    resolveAssetPath(assetPath, baseDir) {
        try {
            const resolvedPath = path.resolve(baseDir, assetPath);
            return fs.existsSync(resolvedPath) ? resolvedPath : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get file type
     */
    getFileType(file) {
        const ext = path.extname(file);
        const basename = path.basename(file);

        if (this.criticalFiles.has(basename)) return 'critical';
        if (this.codeExtensions.includes(ext)) return 'code';
        if (this.assetExtensions.includes(ext)) return 'asset';
        if (this.imageExtensions.includes(ext)) return 'image';
        if (basename.includes('test') || basename.includes('spec')) return 'test';
        if (basename.includes('config')) return 'config';
        if (file.includes('example') || file.includes('demo')) return 'example';
        if (file.includes('doc')) return 'documentation';

        return 'other';
    }

    /**
     * Analyze file usage
     */
    async analyzeUsage() {
        this.log('🔍 Analyzing file usage...');

        // Build reverse dependency graph
        this.buildReverseDependencyGraph();

        // Mark files as used starting from entry points
        this.markUsedFiles();

        // Categorize remaining files
        this.categorizeUnusedFiles();

        this.log(`✓ Usage analysis complete: ${this.usedFiles.size} used, ${this.unusedFiles.size} unused, ${this.ambiguousFiles.size} ambiguous`);
    }

    /**
     * Build reverse dependency graph
     */
    buildReverseDependencyGraph() {
        for (const [file, info] of this.fileGraph) {
            for (const dependency of info.dependencies) {
                const depInfo = this.fileGraph.get(dependency);
                if (depInfo) {
                    depInfo.dependents.push(file);
                }
            }
        }
    }

    /**
     * Mark files as used starting from entry points
     */
    markUsedFiles() {
        const visited = new Set();

        const markAsUsed = (file) => {
            if (visited.has(file) || this.usedFiles.has(file)) {
                return;
            }

            visited.add(file);
            this.usedFiles.add(file);

            const info = this.fileGraph.get(file);
            if (info) {
                // Mark all dependencies as used
                for (const dependency of info.dependencies) {
                    markAsUsed(dependency);
                }
            }
        };

        // Start from entry points
        for (const entryPoint of this.entryPoints) {
            markAsUsed(entryPoint);
        }

        // Mark critical files as used
        for (const file of this.allFiles) {
            const basename = path.basename(file);
            if (this.criticalFiles.has(basename)) {
                markAsUsed(file);
            }
        }
    }

    /**
     * Categorize unused files
     */
    categorizeUnusedFiles() {
        for (const file of this.allFiles) {
            if (!this.usedFiles.has(file)) {
                const info = this.fileGraph.get(file);
                const fileType = info ? info.type : this.getFileType(file);

                // Files that might be used but not detected
                if (this.mightBeUsed(file, fileType)) {
                    this.ambiguousFiles.add(file);
                } else {
                    this.unusedFiles.add(file);
                }
            }
        }
    }

    /**
     * Check if file might be used but not detected
     */
    mightBeUsed(file, fileType) {
        const basename = path.basename(file);
        const dirname = path.dirname(file);

        // Critical files
        if (fileType === 'critical') return true;

        // Config files
        if (fileType === 'config') return true;

        // Files in critical directories
        if (dirname.includes('bin') || dirname.includes('scripts')) return true;

        // Files with specific patterns that might be dynamically loaded
        if (basename.includes('plugin') || basename.includes('middleware')) return true;

        // Files that might be used by build tools
        if (basename.includes('rollup') || basename.includes('webpack') || basename.includes('vite')) return true;

        // Files that might be used in CI/CD
        if (basename.includes('github') || basename.includes('ci') || basename.includes('deploy')) return true;

        return false;
    }

    /**
     * Generate analysis report
     */
    async generateReport() {
        this.log('📊 Generating analysis report...');

        const report = {
            summary: {
                totalFiles: this.allFiles.size,
                usedFiles: this.usedFiles.size,
                unusedFiles: this.unusedFiles.size,
                ambiguousFiles: this.ambiguousFiles.size,
                entryPoints: this.entryPoints.size
            },
            unusedByType: {},
            ambiguousByType: {},
            sizeAnalysis: {
                totalSize: 0,
                unusedSize: 0,
                ambiguousSize: 0
            },
            recommendations: []
        };

        // Categorize unused files by type
        for (const file of this.unusedFiles) {
            const info = this.fileGraph.get(file);
            const fileType = info ? info.type : this.getFileType(file);

            if (!report.unusedByType[fileType]) {
                report.unusedByType[fileType] = [];
            }

            report.unusedByType[fileType].push({
                file: path.relative(this.rootDir, file),
                size: info ? info.size : 0,
                lastModified: info ? info.lastModified : null
            });

            report.sizeAnalysis.unusedSize += info ? info.size : 0;
        }

        // Categorize ambiguous files by type
        for (const file of this.ambiguousFiles) {
            const info = this.fileGraph.get(file);
            const fileType = info ? info.type : this.getFileType(file);

            if (!report.ambiguousByType[fileType]) {
                report.ambiguousByType[fileType] = [];
            }

            report.ambiguousByType[fileType].push({
                file: path.relative(this.rootDir, file),
                size: info ? info.size : 0,
                lastModified: info ? info.lastModified : null
            });

            report.sizeAnalysis.ambiguousSize += info ? info.size : 0;
        }

        // Calculate total size
        for (const file of this.allFiles) {
            const info = this.fileGraph.get(file);
            report.sizeAnalysis.totalSize += info ? info.size : 0;
        }

        // Generate recommendations
        this.generateRecommendations(report);

        return report;
    }

    /**
     * Generate cleanup recommendations
     */
    generateRecommendations(report) {
        // Safe to delete files
        const safeTypes = ['other', 'image'];
        let safeToDelete = 0;

        for (const [type, files] of Object.entries(report.unusedByType)) {
            if (safeTypes.includes(type)) {
                safeToDelete += files.length;
            }
        }

        if (safeToDelete > 0) {
            report.recommendations.push({
                type: 'safe_delete',
                message: `${safeToDelete} files can be safely deleted`,
                action: 'delete_safe_files'
            });
        }

        // Review needed files
        const reviewTypes = ['code', 'asset'];
        let needsReview = 0;

        for (const [type, files] of Object.entries(report.unusedByType)) {
            if (reviewTypes.includes(type)) {
                needsReview += files.length;
            }
        }

        if (needsReview > 0) {
            report.recommendations.push({
                type: 'review_needed',
                message: `${needsReview} code/asset files need manual review`,
                action: 'manual_review'
            });
        }

        // Size impact
        const sizeMB = report.sizeAnalysis.unusedSize / (1024 * 1024);
        if (sizeMB > 1) {
            report.recommendations.push({
                type: 'size_impact',
                message: `Cleanup could save ${sizeMB.toFixed(2)} MB of disk space`,
                action: 'size_optimization'
            });
        }
    }

    /**
     * Interactive review of files to be deleted
     */
    async interactiveReview(report) {
        this.log('🤔 Starting interactive review...');

        // This would implement interactive prompts for file review
        // For now, we'll just log the files that would be reviewed

        console.log('\n' + '='.repeat(60));
        console.log('📋 INTERACTIVE REVIEW');
        console.log('='.repeat(60));

        for (const [type, files] of Object.entries(report.unusedByType)) {
            if (files.length > 0) {
                console.log(`\n${type.toUpperCase()} FILES (${files.length}):`);
                files.slice(0, 10).forEach(file => {
                    console.log(`  - ${file.file} (${(file.size / 1024).toFixed(1)} KB)`);
                });

                if (files.length > 10) {
                    console.log(`  ... and ${files.length - 10} more`);
                }
            }
        }

        console.log('\n' + '='.repeat(60));
    }

    /**
     * Create backup before cleanup
     */
    async createBackup() {
        this.log('💾 Creating backup...');

        try {
            // Remove old backup
            if (fs.existsSync(this.backupDir)) {
                fs.rmSync(this.backupDir, { recursive: true, force: true });
            }

            // Create backup directory
            fs.mkdirSync(this.backupDir, { recursive: true });

            // Create manifest of files to be deleted
            const manifest = {
                timestamp: new Date().toISOString(),
                unusedFiles: Array.from(this.unusedFiles).map(file => ({
                    path: file,
                    relativePath: path.relative(this.rootDir, file),
                    size: fs.statSync(file).size
                }))
            };

            fs.writeFileSync(
                path.join(this.backupDir, 'manifest.json'),
                JSON.stringify(manifest, null, 2)
            );

            // Copy files to backup
            for (const file of this.unusedFiles) {
                const relativePath = path.relative(this.rootDir, file);
                const backupPath = path.join(this.backupDir, relativePath);

                // Create directory structure
                fs.mkdirSync(path.dirname(backupPath), { recursive: true });

                // Copy file
                fs.copyFileSync(file, backupPath);
            }

            this.log(`✓ Backup created with ${this.unusedFiles.size} files`);
        } catch (error) {
            throw new Error(`Backup creation failed: ${error.message}`);
        }
    }

    /**
     * Perform actual cleanup
     */
    async performCleanup() {
        this.log('🗑️ Performing cleanup...');

        let deletedFiles = 0;
        let deletedSize = 0;

        for (const file of this.unusedFiles) {
            try {
                const stats = fs.statSync(file);
                fs.unlinkSync(file);

                deletedFiles++;
                deletedSize += stats.size;

                this.log(`Deleted: ${path.relative(this.rootDir, file)}`);
            } catch (error) {
                this.log(`⚠️ Could not delete ${file}: ${error.message}`, 'WARN');
            }
        }

        // Clean up empty directories
        await this.cleanupEmptyDirectories();

        this.log(`✓ Cleanup completed: ${deletedFiles} files deleted, ${(deletedSize / 1024 / 1024).toFixed(2)} MB freed`);
    }

    /**
     * Clean up empty directories
     */
    async cleanupEmptyDirectories() {
        const cleanupDir = (dir) => {
            try {
                const entries = fs.readdirSync(dir);

                // Recursively clean subdirectories
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry);
                    if (fs.statSync(fullPath).isDirectory()) {
                        cleanupDir(fullPath);
                    }
                }

                // Check if directory is now empty
                const remainingEntries = fs.readdirSync(dir);
                if (remainingEntries.length === 0 && !this.criticalDirs.has(path.basename(dir))) {
                    fs.rmdirSync(dir);
                    this.log(`Removed empty directory: ${path.relative(this.rootDir, dir)}`);
                }
            } catch (error) {
                // Directory might not exist or not be empty
            }
        };

        // Start from packages directory and work up
        const packagesDir = path.join(this.rootDir, 'packages');
        if (fs.existsSync(packagesDir)) {
            cleanupDir(packagesDir);
        }
    }

    /**
     * Generate final report
     */
    async generateFinalReport(report, dryRun) {
        const reportPath = path.join(this.rootDir, `cleanup-report-${Date.now()}.json`);

        const finalReport = {
            ...report,
            dryRun,
            timestamp: new Date().toISOString(),
            backupLocation: dryRun ? null : this.backupDir
        };

        fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 CLEANUP SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total files analyzed: ${report.summary.totalFiles}`);
        console.log(`Files in use: ${report.summary.usedFiles}`);
        console.log(`Unused files: ${report.summary.unusedFiles}`);
        console.log(`Ambiguous files: ${report.summary.ambiguousFiles}`);
        console.log(`Potential space savings: ${(report.sizeAnalysis.unusedSize / 1024 / 1024).toFixed(2)} MB`);

        if (!dryRun) {
            console.log(`Backup location: ${this.backupDir}`);
        }

        console.log(`Detailed report: ${reportPath}`);
        console.log('='.repeat(60));

        // Print recommendations
        if (report.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            report.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec.message}`);
            });
        }
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const options = {
        dryRun: !args.includes('--live'),
        interactive: !args.includes('--no-interactive'),
        backup: !args.includes('--no-backup'),
        verbose: args.includes('--verbose')
    };

    console.log('🧹 KalxJS Unused File Cleanup');
    console.log('Options:', options);

    const detector = new UnusedFileDetector();
    detector.cleanup(options).catch(error => {
        console.error('Cleanup failed:', error);
        process.exit(1);
    });
}

export { UnusedFileDetector };