#!/usr/bin/env node

/**
 * KalxJS Smart Dependency Analysis Tool
 *
 * This script provides comprehensive dependency analysis for the KalxJS framework:
 * - Maps all file relationships and dependencies
 * - Identifies circular dependencies
 * - Finds unused exports and dead code
 * - Analyzes bundle impact and optimization opportunities
 * - Generates dependency graphs and reports
 *
 * Features:
 * - Static code analysis with AST parsing
 * - Dynamic import detection
 * - Cross-package dependency tracking
 * - Bundle size impact analysis
 * - Circular dependency detection
 * - Dead code elimination suggestions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

class DependencyAnalyzer {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.packagesDir = path.join(this.rootDir, 'packages');
        this.logFile = path.join(this.rootDir, 'dependency-analysis.log');

        // Analysis data structures
        this.dependencyGraph = new Map(); // file -> { imports: [], exports: [], dependents: [] }
        this.packageGraph = new Map(); // package -> { dependencies: [], dependents: [] }
        this.circularDependencies = [];
        this.unusedExports = new Map();
        this.deadCode = new Map();
        this.bundleAnalysis = new Map();

        // File patterns
        this.codeExtensions = ['.js', '.mjs', '.ts', '.jsx', '.tsx', '.kal'];
        this.excludePatterns = [
            /node_modules/,
            /\.git/,
            /dist/,
            /build/,
            /coverage/,
            /\.test\./,
            /\.spec\./
        ];

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
     * Main analysis process
     */
    async analyze(options = {}) {
        const {
            includeTests = false,
            generateGraphs = true,
            checkCircular = true,
            findDeadCode = true,
            analyzeBundles = true,
            outputFormat = 'json'
        } = options;

        try {
            this.log('🔍 Starting KalxJS dependency analysis');

            // Step 1: Scan all files
            await this.scanFiles(includeTests);

            // Step 2: Parse dependencies
            await this.parseDependencies();

            // Step 3: Build dependency graph
            await this.buildDependencyGraph();

            // Step 4: Analyze packages
            await this.analyzePackages();

            // Step 5: Check for circular dependencies
            if (checkCircular) {
                await this.findCircularDependencies();
            }

            // Step 6: Find unused exports and dead code
            if (findDeadCode) {
                await this.findUnusedExports();
                await this.findDeadCode();
            }

            // Step 7: Analyze bundle impact
            if (analyzeBundles) {
                await this.analyzeBundleImpact();
            }

            // Step 8: Generate reports
            const report = await this.generateReport();

            // Step 9: Generate graphs (if requested)
            if (generateGraphs) {
                await this.generateGraphs();
            }

            // Step 10: Output results
            await this.outputResults(report, outputFormat);

            this.log('✅ Dependency analysis completed successfully!');

            return report;

        } catch (error) {
            this.log(`❌ Analysis failed: ${error.message}`, 'ERROR');
            this.log(`Stack trace: ${error.stack}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Scan all files in the project
     */
    async scanFiles(includeTests) {
        this.log('📂 Scanning project files...');

        this.allFiles = new Set();
        this.packages = new Map();

        // Scan packages directory
        if (fs.existsSync(this.packagesDir)) {
            await this.scanDirectory(this.packagesDir, includeTests);
        }

        // Scan root src directory if it exists
        const rootSrcDir = path.join(this.rootDir, 'src');
        if (fs.existsSync(rootSrcDir)) {
            await this.scanDirectory(rootSrcDir, includeTests);
        }

        this.log(`✓ Found ${this.allFiles.size} files in ${this.packages.size} packages`);
    }

    /**
     * Recursively scan directory
     */
    async scanDirectory(dir, includeTests, packageName = null) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(this.rootDir, fullPath);

                // Skip excluded patterns
                if (this.shouldExclude(relativePath, includeTests)) {
                    continue;
                }

                if (entry.isDirectory()) {
                    // Check if this is a package directory
                    const currentPackageName = packageName ||
                        (dir === this.packagesDir ? entry.name : null);

                    await this.scanDirectory(fullPath, includeTests, currentPackageName);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (this.codeExtensions.includes(ext)) {
                        this.allFiles.add(fullPath);

                        // Track package membership
                        if (packageName) {
                            if (!this.packages.has(packageName)) {
                                this.packages.set(packageName, {
                                    name: packageName,
                                    path: path.join(this.packagesDir, packageName),
                                    files: new Set(),
                                    dependencies: new Set(),
                                    dependents: new Set()
                                });
                            }
                            this.packages.get(packageName).files.add(fullPath);
                        }
                    }
                }
            }
        } catch (error) {
            this.log(`⚠️ Could not scan directory ${dir}: ${error.message}`, 'WARN');
        }
    }

    /**
     * Check if path should be excluded
     */
    shouldExclude(relativePath, includeTests) {
        // Always exclude certain patterns
        if (this.excludePatterns.some(pattern => pattern.test(relativePath))) {
            return true;
        }

        // Exclude test files if not requested
        if (!includeTests && (relativePath.includes('.test.') || relativePath.includes('.spec.'))) {
            return true;
        }

        return false;
    }

    /**
     * Parse dependencies from all files
     */
    async parseDependencies() {
        this.log('🔍 Parsing dependencies...');

        let processedFiles = 0;
        const totalFiles = this.allFiles.size;

        for (const file of this.allFiles) {
            await this.parseFileDependencies(file);
            processedFiles++;

            if (processedFiles % 50 === 0) {
                this.log(`Progress: ${processedFiles}/${totalFiles} files parsed`);
            }
        }

        this.log(`✓ Parsed dependencies for ${processedFiles} files`);
    }

    /**
     * Parse dependencies for a single file
     */
    async parseFileDependencies(file) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const dependencies = this.extractDependencies(content, file);
            const exports = this.extractExports(content, file);

            this.dependencyGraph.set(file, {
                imports: dependencies.imports,
                dynamicImports: dependencies.dynamicImports,
                exports: exports,
                dependents: [],
                size: content.length,
                lines: content.split('\n').length
            });

        } catch (error) {
            this.log(`⚠️ Could not parse ${file}: ${error.message}`, 'WARN');
        }
    }

    /**
     * Extract dependencies from file content
     */
    extractDependencies(content, filePath) {
        const imports = [];
        const dynamicImports = [];
        const baseDir = path.dirname(filePath);

        // Static imports
        const staticImportPatterns = [
            /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"`]([^'"`]+)['"`]/g,
            /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
            /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
        ];

        for (const pattern of staticImportPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const importPath = match[1];
                const resolvedPath = this.resolveImportPath(importPath, baseDir);

                if (resolvedPath) {
                    imports.push({
                        path: resolvedPath,
                        originalPath: importPath,
                        type: 'static'
                    });
                }
            }
        }

        // Dynamic imports
        const dynamicImportPatterns = [
            /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
            /loadComponent\s*\(\s*['"`]([^'"`]+)['"`]/g,
            /lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*['"`]([^'"`]+)['"`]/g
        ];

        for (const pattern of dynamicImportPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const importPath = match[1];
                const resolvedPath = this.resolveImportPath(importPath, baseDir);

                if (resolvedPath) {
                    dynamicImports.push({
                        path: resolvedPath,
                        originalPath: importPath,
                        type: 'dynamic'
                    });
                }
            }
        }

        return { imports, dynamicImports };
    }

    /**
     * Extract exports from file content
     */
    extractExports(content, filePath) {
        const exports = [];

        // Named exports
        const namedExportPatterns = [
            /export\s+(?:const|let|var|function|class)\s+(\w+)/g,
            /export\s*\{\s*([^}]+)\s*\}/g,
            /export\s+(\w+)\s+from/g
        ];

        for (const pattern of namedExportPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const exportName = match[1];

                if (exportName.includes(',')) {
                    // Multiple exports in braces
                    const names = exportName.split(',').map(name => name.trim());
                    names.forEach(name => {
                        exports.push({
                            name: name.replace(/\s+as\s+\w+/, ''),
                            type: 'named',
                            line: this.getLineNumber(content, match.index)
                        });
                    });
                } else {
                    exports.push({
                        name: exportName,
                        type: 'named',
                        line: this.getLineNumber(content, match.index)
                    });
                }
            }
        }

        // Default exports
        const defaultExportPattern = /export\s+default\s+/g;
        let match;
        while ((match = defaultExportPattern.exec(content)) !== null) {
            exports.push({
                name: 'default',
                type: 'default',
                line: this.getLineNumber(content, match.index)
            });
        }

        return exports;
    }

    /**
     * Get line number from character index
     */
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    /**
     * Resolve import path to absolute path
     */
    resolveImportPath(importPath, baseDir) {
        // Skip external packages
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
     * Build dependency graph with reverse relationships
     */
    async buildDependencyGraph() {
        this.log('🕸️ Building dependency graph...');

        // Build reverse dependencies
        for (const [file, info] of this.dependencyGraph) {
            for (const dependency of [...info.imports, ...info.dynamicImports]) {
                const depInfo = this.dependencyGraph.get(dependency.path);
                if (depInfo) {
                    depInfo.dependents.push({
                        file,
                        type: dependency.type
                    });
                }
            }
        }

        this.log(`✓ Built dependency graph with ${this.dependencyGraph.size} nodes`);
    }

    /**
     * Analyze package-level dependencies
     */
    async analyzePackages() {
        this.log('📦 Analyzing package dependencies...');

        for (const [packageName, packageInfo] of this.packages) {
            for (const file of packageInfo.files) {
                const fileInfo = this.dependencyGraph.get(file);
                if (!fileInfo) continue;

                // Check dependencies
                for (const dependency of [...fileInfo.imports, ...fileInfo.dynamicImports]) {
                    const depPackage = this.getPackageFromFile(dependency.path);
                    if (depPackage && depPackage !== packageName) {
                        packageInfo.dependencies.add(depPackage);

                        // Add reverse dependency
                        const depPackageInfo = this.packages.get(depPackage);
                        if (depPackageInfo) {
                            depPackageInfo.dependents.add(packageName);
                        }
                    }
                }
            }
        }

        this.log(`✓ Analyzed ${this.packages.size} packages`);
    }

    /**
     * Get package name from file path
     */
    getPackageFromFile(filePath) {
        const relativePath = path.relative(this.packagesDir, filePath);
        if (relativePath.startsWith('..')) {
            return null; // File is not in packages directory
        }

        const pathParts = relativePath.split(path.sep);
        return pathParts[0];
    }

    /**
     * Find circular dependencies
     */
    async findCircularDependencies() {
        this.log('🔄 Finding circular dependencies...');

        const visited = new Set();
        const recursionStack = new Set();
        const cycles = [];

        const dfs = (file, path = []) => {
            if (recursionStack.has(file)) {
                // Found a cycle
                const cycleStart = path.indexOf(file);
                const cycle = path.slice(cycleStart).concat([file]);
                cycles.push(cycle);
                return;
            }

            if (visited.has(file)) {
                return;
            }

            visited.add(file);
            recursionStack.add(file);
            path.push(file);

            const fileInfo = this.dependencyGraph.get(file);
            if (fileInfo) {
                for (const dependency of fileInfo.imports) {
                    dfs(dependency.path, [...path]);
                }
            }

            recursionStack.delete(file);
            path.pop();
        };

        // Check all files
        for (const file of this.allFiles) {
            if (!visited.has(file)) {
                dfs(file);
            }
        }

        this.circularDependencies = cycles;
        this.log(`✓ Found ${cycles.length} circular dependencies`);
    }

    /**
     * Find unused exports
     */
    async findUnusedExports() {
        this.log('🔍 Finding unused exports...');

        const allImports = new Map(); // exportName -> [importingFiles]

        // Collect all imports
        for (const [file, info] of this.dependencyGraph) {
            for (const dependency of info.imports) {
                const depInfo = this.dependencyGraph.get(dependency.path);
                if (depInfo) {
                    // This is a simplified approach - in reality, we'd need to parse
                    // the specific imports from each file
                    for (const exportItem of depInfo.exports) {
                        const key = `${dependency.path}:${exportItem.name}`;
                        if (!allImports.has(key)) {
                            allImports.set(key, []);
                        }
                        allImports.get(key).push(file);
                    }
                }
            }
        }

        // Find unused exports
        for (const [file, info] of this.dependencyGraph) {
            const unusedInFile = [];

            for (const exportItem of info.exports) {
                const key = `${file}:${exportItem.name}`;
                if (!allImports.has(key) || allImports.get(key).length === 0) {
                    unusedInFile.push(exportItem);
                }
            }

            if (unusedInFile.length > 0) {
                this.unusedExports.set(file, unusedInFile);
            }
        }

        this.log(`✓ Found unused exports in ${this.unusedExports.size} files`);
    }

    /**
     * Find dead code
     */
    async findDeadCode() {
        this.log('💀 Finding dead code...');

        // This is a simplified dead code detection
        // In practice, this would require more sophisticated analysis

        for (const [file, info] of this.dependencyGraph) {
            const deadCodeItems = [];

            // Files with no dependents might be dead code
            if (info.dependents.length === 0) {
                // Check if it's an entry point
                if (!this.isEntryPoint(file)) {
                    deadCodeItems.push({
                        type: 'unreferenced_file',
                        description: 'File has no dependents and is not an entry point'
                    });
                }
            }

            // Exports that are never imported
            const unusedExports = this.unusedExports.get(file) || [];
            for (const unusedExport of unusedExports) {
                deadCodeItems.push({
                    type: 'unused_export',
                    name: unusedExport.name,
                    line: unusedExport.line,
                    description: `Export '${unusedExport.name}' is never imported`
                });
            }

            if (deadCodeItems.length > 0) {
                this.deadCode.set(file, deadCodeItems);
            }
        }

        this.log(`✓ Found dead code in ${this.deadCode.size} files`);
    }

    /**
     * Check if file is an entry point
     */
    isEntryPoint(file) {
        const basename = path.basename(file);

        // Common entry point patterns
        const entryPatterns = [
            'index.js',
            'index.mjs',
            'index.ts',
            'main.js',
            'main.mjs',
            'main.ts'
        ];

        if (entryPatterns.includes(basename)) {
            return true;
        }

        // Check if referenced in package.json
        const packageDir = this.getPackageFromFile(file);
        if (packageDir) {
            const packageJsonPath = path.join(this.packagesDir, packageDir, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                try {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    const entryFields = ['main', 'module', 'browser', 'types'];

                    for (const field of entryFields) {
                        if (packageJson[field]) {
                            const entryPath = path.resolve(path.dirname(packageJsonPath), packageJson[field]);
                            if (entryPath === file) {
                                return true;
                            }
                        }
                    }
                } catch (error) {
                    // Ignore parsing errors
                }
            }
        }

        return false;
    }

    /**
     * Analyze bundle impact
     */
    async analyzeBundleImpact() {
        this.log('📊 Analyzing bundle impact...');

        for (const [packageName, packageInfo] of this.packages) {
            const analysis = {
                totalFiles: packageInfo.files.size,
                totalSize: 0,
                totalLines: 0,
                dependencies: packageInfo.dependencies.size,
                dependents: packageInfo.dependents.size,
                circularDeps: 0,
                unusedExports: 0,
                deadCodeFiles: 0
            };

            // Calculate size and lines
            for (const file of packageInfo.files) {
                const fileInfo = this.dependencyGraph.get(file);
                if (fileInfo) {
                    analysis.totalSize += fileInfo.size;
                    analysis.totalLines += fileInfo.lines;
                }

                // Count unused exports
                const unusedExports = this.unusedExports.get(file);
                if (unusedExports) {
                    analysis.unusedExports += unusedExports.length;
                }

                // Count dead code files
                if (this.deadCode.has(file)) {
                    analysis.deadCodeFiles++;
                }
            }

            // Count circular dependencies involving this package
            for (const cycle of this.circularDependencies) {
                const packageFiles = cycle.filter(file =>
                    packageInfo.files.has(file)
                );
                if (packageFiles.length > 0) {
                    analysis.circularDeps++;
                }
            }

            this.bundleAnalysis.set(packageName, analysis);
        }

        this.log(`✓ Analyzed bundle impact for ${this.bundleAnalysis.size} packages`);
    }

    /**
     * Generate comprehensive report
     */
    async generateReport() {
        this.log('📋 Generating analysis report...');

        const report = {
            summary: {
                totalFiles: this.allFiles.size,
                totalPackages: this.packages.size,
                circularDependencies: this.circularDependencies.length,
                filesWithUnusedExports: this.unusedExports.size,
                filesWithDeadCode: this.deadCode.size,
                timestamp: new Date().toISOString()
            },
            packages: {},
            circularDependencies: [],
            unusedExports: {},
            deadCode: {},
            recommendations: []
        };

        // Package analysis
        for (const [packageName, analysis] of this.bundleAnalysis) {
            report.packages[packageName] = {
                ...analysis,
                dependencies: Array.from(this.packages.get(packageName).dependencies),
                dependents: Array.from(this.packages.get(packageName).dependents)
            };
        }

        // Circular dependencies
        report.circularDependencies = this.circularDependencies.map(cycle => ({
            cycle: cycle.map(file => path.relative(this.rootDir, file)),
            length: cycle.length
        }));

        // Unused exports
        for (const [file, exports] of this.unusedExports) {
            report.unusedExports[path.relative(this.rootDir, file)] = exports;
        }

        // Dead code
        for (const [file, deadCodeItems] of this.deadCode) {
            report.deadCode[path.relative(this.rootDir, file)] = deadCodeItems;
        }

        // Generate recommendations
        this.generateRecommendations(report);

        return report;
    }

    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations(report) {
        const recommendations = [];

        // Circular dependency recommendations
        if (report.circularDependencies.length > 0) {
            recommendations.push({
                type: 'circular_dependencies',
                severity: 'high',
                message: `Found ${report.circularDependencies.length} circular dependencies that should be resolved`,
                action: 'Refactor code to eliminate circular imports'
            });
        }

        // Unused exports recommendations
        const totalUnusedExports = Object.values(report.unusedExports)
            .reduce((sum, exports) => sum + exports.length, 0);

        if (totalUnusedExports > 0) {
            recommendations.push({
                type: 'unused_exports',
                severity: 'medium',
                message: `Found ${totalUnusedExports} unused exports across ${Object.keys(report.unusedExports).length} files`,
                action: 'Remove unused exports to reduce bundle size'
            });
        }

        // Dead code recommendations
        if (Object.keys(report.deadCode).length > 0) {
            recommendations.push({
                type: 'dead_code',
                severity: 'medium',
                message: `Found dead code in ${Object.keys(report.deadCode).length} files`,
                action: 'Remove dead code to improve maintainability'
            });
        }

        // Package dependency recommendations
        const packagesWithManyDeps = Object.entries(report.packages)
            .filter(([name, info]) => info.dependencies > 5)
            .length;

        if (packagesWithManyDeps > 0) {
            recommendations.push({
                type: 'package_dependencies',
                severity: 'low',
                message: `${packagesWithManyDeps} packages have more than 5 dependencies`,
                action: 'Consider splitting large packages or reducing dependencies'
            });
        }

        report.recommendations = recommendations;
    }

    /**
     * Generate dependency graphs
     */
    async generateGraphs() {
        this.log('📈 Generating dependency graphs...');

        // Generate DOT format for Graphviz
        const packageGraphDot = this.generatePackageGraphDot();
        const fileGraphDot = this.generateFileGraphDot();

        // Save graphs
        const graphsDir = path.join(this.rootDir, 'dependency-graphs');
        if (!fs.existsSync(graphsDir)) {
            fs.mkdirSync(graphsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(graphsDir, 'packages.dot'), packageGraphDot);
        fs.writeFileSync(path.join(graphsDir, 'files.dot'), fileGraphDot);

        this.log(`✓ Generated dependency graphs in ${graphsDir}`);
    }

    /**
     * Generate package dependency graph in DOT format
     */
    generatePackageGraphDot() {
        let dot = 'digraph PackageDependencies {\n';
        dot += '  rankdir=LR;\n';
        dot += '  node [shape=box, style=filled, fillcolor=lightblue];\n\n';

        // Add nodes
        for (const [packageName] of this.packages) {
            dot += `  "${packageName}";\n`;
        }

        dot += '\n';

        // Add edges
        for (const [packageName, packageInfo] of this.packages) {
            for (const dependency of packageInfo.dependencies) {
                dot += `  "${packageName}" -> "${dependency}";\n`;
            }
        }

        dot += '}\n';
        return dot;
    }

    /**
     * Generate file dependency graph in DOT format (simplified)
     */
    generateFileGraphDot() {
        let dot = 'digraph FileDependencies {\n';
        dot += '  rankdir=LR;\n';
        dot += '  node [shape=ellipse, style=filled, fillcolor=lightgreen];\n\n';

        // Only include files with dependencies to keep graph manageable
        const relevantFiles = new Set();

        for (const [file, info] of this.dependencyGraph) {
            if (info.imports.length > 0 || info.dependents.length > 0) {
                relevantFiles.add(file);
                info.imports.forEach(imp => relevantFiles.add(imp.path));
            }
        }

        // Add nodes (use relative paths for readability)
        for (const file of relevantFiles) {
            const relativePath = path.relative(this.rootDir, file);
            const label = relativePath.replace(/\//g, '\\n');
            dot += `  "${file}" [label="${label}"];\n`;
        }

        dot += '\n';

        // Add edges
        for (const file of relevantFiles) {
            const info = this.dependencyGraph.get(file);
            if (info) {
                for (const dependency of info.imports) {
                    if (relevantFiles.has(dependency.path)) {
                        const style = dependency.type === 'dynamic' ? 'dashed' : 'solid';
                        dot += `  "${file}" -> "${dependency.path}" [style=${style}];\n`;
                    }
                }
            }
        }

        dot += '}\n';
        return dot;
    }

    /**
     * Output results in specified format
     */
    async outputResults(report, format) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        if (format === 'json') {
            const outputPath = path.join(this.rootDir, `dependency-analysis-${timestamp}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
            this.log(`📄 Report saved to: ${outputPath}`);
        }

        // Always output summary to console
        this.printSummary(report);
    }

    /**
     * Print analysis summary
     */
    printSummary(report) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 KALXJS DEPENDENCY ANALYSIS SUMMARY');
        console.log('='.repeat(60));

        console.log(`\n📂 Project Overview:`);
        console.log(`  Total files analyzed: ${report.summary.totalFiles}`);
        console.log(`  Total packages: ${report.summary.totalPackages}`);

        console.log(`\n🔄 Circular Dependencies:`);
        console.log(`  Found: ${report.summary.circularDependencies}`);
        if (report.circularDependencies.length > 0) {
            console.log(`  Longest cycle: ${Math.max(...report.circularDependencies.map(c => c.length))} files`);
        }

        console.log(`\n💀 Dead Code Analysis:`);
        console.log(`  Files with unused exports: ${report.summary.filesWithUnusedExports}`);
        console.log(`  Files with dead code: ${report.summary.filesWithDeadCode}`);

        console.log(`\n📦 Package Analysis:`);
        const packageStats = Object.values(report.packages);
        if (packageStats.length > 0) {
            const totalSize = packageStats.reduce((sum, pkg) => sum + pkg.totalSize, 0);
            const avgDeps = packageStats.reduce((sum, pkg) => sum + pkg.dependencies, 0) / packageStats.length;

            console.log(`  Total codebase size: ${(totalSize / 1024).toFixed(1)} KB`);
            console.log(`  Average dependencies per package: ${avgDeps.toFixed(1)}`);
        }

        console.log(`\n💡 Recommendations:`);
        if (report.recommendations.length > 0) {
            report.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`);
            });
        } else {
            console.log(`  No issues found - great job! 🎉`);
        }

        console.log('\n' + '='.repeat(60));
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);

    const options = {
        includeTests: args.includes('--include-tests'),
        generateGraphs: !args.includes('--no-graphs'),
        checkCircular: !args.includes('--no-circular'),
        findDeadCode: !args.includes('--no-dead-code'),
        analyzeBundles: !args.includes('--no-bundles'),
        outputFormat: args.includes('--format=html') ? 'html' : 'json'
    };

    console.log('🔍 KalxJS Dependency Analyzer');
    console.log('Options:', options);

    const analyzer = new DependencyAnalyzer();
    analyzer.analyze(options).catch(error => {
        console.error('Analysis failed:', error);
        process.exit(1);
    });
}

export { DependencyAnalyzer };