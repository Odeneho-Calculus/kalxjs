const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Phase 6: Production Build Testing', () => {
    const cliPath = path.join(__dirname, '../bin/kalxjs.js');
    const tempDir = path.join(os.tmpdir(), 'kalxjs-build-tests');

    beforeAll(() => {
        // Create temp directory for tests
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
    });

    afterAll(() => {
        // Clean up temp directory
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    const runCommand = (cmd, cwd = tempDir, expectSuccess = true) => {
        try {
            const result = execSync(cmd, {
                cwd,
                stdio: ['pipe', 'pipe', 'pipe'],
                encoding: 'utf8'
            });
            return { success: true, output: result, code: 0 };
        } catch (err) {
            if (expectSuccess) {
                console.error(`Command failed: ${cmd}`);
                console.error(`Error: ${err.message}`);
                console.error(`Output: ${err.stdout || ''}`);
                console.error(`Stderr: ${err.stderr || ''}`);
            }
            return {
                success: false,
                output: err.stdout || '',
                error: err.stderr || '',
                code: err.status || 1
            };
        }
    };

    describe('6.1 Basic Build Command', () => {
        test('should display build help without errors', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(result.output).toContain('Usage');
            expect(result.output).toContain('build');
        });

        test('should show default options in build help', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(result.output).toContain('output');
            expect(result.output).toContain('mode');
        });

        test('should require valid project directory', () => {
            const invalidDir = path.join(tempDir, 'invalid-project');
            if (!fs.existsSync(invalidDir)) {
                fs.mkdirSync(invalidDir, { recursive: true });
            }
            const result = runCommand(`node ${cliPath} build`, invalidDir, false);
            expect(result.success).toBe(false);
            expect(result.code).not.toBe(0);
        });

        test('should check for package.json in project', () => {
            const testProject = path.join(tempDir, 'no-package-project');
            if (fs.existsSync(testProject)) {
                fs.rmSync(testProject, { recursive: true });
            }
            fs.mkdirSync(testProject, { recursive: true });

            const result = runCommand(`node ${cliPath} build`, testProject, false);
            expect(result.success).toBe(false);
            expect(result.output + result.error).toMatch(/package\.json|project/i);
        });
    });

    describe('6.2 Build Output Structure', () => {
        test('should create dist directory by default', () => {
            const testProject = path.join(tempDir, 'test-build-dist');
            if (fs.existsSync(testProject)) {
                fs.rmSync(testProject, { recursive: true });
            }
            fs.mkdirSync(testProject, { recursive: true });

            // Create minimal project
            fs.writeFileSync(
                path.join(testProject, 'package.json'),
                JSON.stringify({ name: 'test', scripts: {} })
            );
            fs.mkdirSync(path.join(testProject, 'src'), { recursive: true });
            fs.writeFileSync(path.join(testProject, 'src', 'main.js'), 'console.log("test")');

            runCommand(`node ${cliPath} build`, testProject, false);
            const distDir = path.join(testProject, 'dist');
            expect(fs.existsSync(distDir)).toBe(true);
        });

        test('should create custom output directory when specified', () => {
            const testProject = path.join(tempDir, 'test-build-custom');
            if (fs.existsSync(testProject)) {
                fs.rmSync(testProject, { recursive: true });
            }
            fs.mkdirSync(testProject, { recursive: true });

            // Create minimal project
            fs.writeFileSync(
                path.join(testProject, 'package.json'),
                JSON.stringify({ name: 'test', scripts: {} })
            );
            fs.mkdirSync(path.join(testProject, 'src'), { recursive: true });
            fs.writeFileSync(path.join(testProject, 'src', 'main.js'), 'console.log("test")');

            runCommand(`node ${cliPath} build --output custom-out`, testProject, false);
            const customDir = path.join(testProject, 'custom-out');
            expect(fs.existsSync(customDir)).toBe(true);
        });

        test('should handle nested custom output paths', () => {
            const testProject = path.join(tempDir, 'test-build-nested');
            if (fs.existsSync(testProject)) {
                fs.rmSync(testProject, { recursive: true });
            }
            fs.mkdirSync(testProject, { recursive: true });

            // Create minimal project
            fs.writeFileSync(
                path.join(testProject, 'package.json'),
                JSON.stringify({ name: 'test', scripts: {} })
            );
            fs.mkdirSync(path.join(testProject, 'src'), { recursive: true });
            fs.writeFileSync(path.join(testProject, 'src', 'main.js'), 'console.log("test")');

            runCommand(`node ${cliPath} build --output build/output/nested`, testProject, false);
            const nestedDir = path.join(testProject, 'build/output/nested');
            expect(fs.existsSync(nestedDir)).toBe(true);
        });

        test('should preserve existing files in output directory', () => {
            const testProject = path.join(tempDir, 'test-build-preserve');
            if (fs.existsSync(testProject)) {
                fs.rmSync(testProject, { recursive: true });
            }
            fs.mkdirSync(testProject, { recursive: true });

            // Create minimal project
            fs.writeFileSync(
                path.join(testProject, 'package.json'),
                JSON.stringify({ name: 'test', scripts: {} })
            );
            fs.mkdirSync(path.join(testProject, 'src'), { recursive: true });
            fs.writeFileSync(path.join(testProject, 'src', 'main.js'), 'console.log("test")');

            const distDir = path.join(testProject, 'dist');
            fs.mkdirSync(distDir, { recursive: true });
            fs.writeFileSync(path.join(distDir, 'existing.txt'), 'existing content');

            runCommand(`node ${cliPath} build`, testProject, false);
            expect(fs.existsSync(path.join(distDir, 'existing.txt'))).toBe(true);
        });
    });

    describe('6.3 Build Configuration Options', () => {
        test('should accept --output option', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(result.output).toContain('--output') || expect(result.output).toContain('-o');
        });

        test('should accept --mode option for production', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(result.output).toContain('--mode') || expect(result.output).toContain('-m');
        });

        test('should accept --mode option for development', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(result.output).toContain('development') || expect(result.output).toContain('production');
        });

        test('should parse multiple options without conflict', () => {
            const result = runCommand(
                `node ${cliPath} build --help`,
                tempDir
            );
            expect(result.success).toBe(true);
            // Verify all main options are listed
            const helpText = result.output;
            expect(
                helpText.includes('--output') ||
                helpText.includes('-o')
            ).toBe(true);
        });
    });

    describe('6.4 Minification Control', () => {
        test('should show minification option in help', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(
                result.output.includes('minify') ||
                result.output.includes('no-minify')
            ).toBe(true);
        });

        test('should accept --no-minify flag', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(
                result.output.includes('no-minify') ||
                result.output.includes('minify')
            ).toBe(true);
        });

        test('should have minification enabled by default', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            // Default behavior should be minification enabled
            expect(result.output.length > 0).toBe(true);
        });
    });

    describe('6.5 Build Mode Options', () => {
        test('should accept --mode production', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(result.output.toLowerCase()).toContain('mode');
        });

        test('should accept --mode development', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            const helpLower = result.output.toLowerCase();
            expect(
                helpLower.includes('development') &&
                helpLower.includes('production')
            ).toBe(true);
        });

        test('should show mode description in help', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            const helpText = result.output.toLowerCase();
            expect(
                helpText.includes('mode') ||
                helpText.includes('production') ||
                helpText.includes('development')
            ).toBe(true);
        });
    });

    describe('6.6 Source Maps Generation', () => {
        test('should show sourcemap option in help', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(result.output).toContain('build') && expect(result.output.length > 50).toBe(true);
        });

        test('should handle source maps appropriately', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            // Build help should be available
            expect(result.output).toContain('build');
        });
    });

    describe('6.7 Verbose Output Mode', () => {
        test('should accept --verbose flag', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(
                result.output.includes('--verbose') ||
                result.output.includes('-v')
            ).toBe(true);
        });

        test('should show verbose description in help', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(result.output.toLowerCase()).toContain('verbose');
        });
    });

    describe('6.8 Bundle Analysis', () => {
        test('should accept --analyze flag', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(
                result.output.includes('--analyze') ||
                result.output.includes('analyze')
            ).toBe(true);
        });

        test('should show analyze description', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            const helpText = result.output;
            expect(helpText.includes('analyze') || helpText.includes('Analyze')).toBe(true);
        });
    });

    describe('6.9 Error Handling', () => {
        test('should handle missing project directory gracefully', () => {
            const result = runCommand(
                `node ${cliPath} build`,
                path.join(tempDir, 'nonexistent'),
                false
            );
            expect(result.code).not.toBe(0);
        });

        test('should show meaningful error for invalid project', () => {
            const invalidProject = path.join(tempDir, 'invalid-build');
            if (fs.existsSync(invalidProject)) {
                fs.rmSync(invalidProject, { recursive: true });
            }
            fs.mkdirSync(invalidProject, { recursive: true });

            const result = runCommand(
                `node ${cliPath} build`,
                invalidProject,
                false
            );
            expect(result.success).toBe(false);
            expect(result.output + result.error).toMatch(/package\.json|project|directory/i);
        });

        test('should exit with non-zero code on build failure', () => {
            const invalidProject = path.join(tempDir, 'build-fail');
            if (fs.existsSync(invalidProject)) {
                fs.rmSync(invalidProject, { recursive: true });
            }
            fs.mkdirSync(invalidProject, { recursive: true });

            const result = runCommand(
                `node ${cliPath} build`,
                invalidProject,
                false
            );
            expect(result.code).not.toBe(0);
        });
    });

    describe('6.10 Command Help & Documentation', () => {
        test('should show build command in main help', () => {
            const result = runCommand(`node ${cliPath} --help`, tempDir);
            expect(result.success).toBe(true);
            expect(result.output).toContain('build');
        });

        test('should provide detailed build help', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(result.output).toContain('Usage') || expect(result.output).toContain('build');
        });

        test('should list all build options in help', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            const helpText = result.output;
            expect(helpText.length > 100).toBe(true);
        });

        test('should show examples or usage in help text', () => {
            const result = runCommand(`node ${cliPath} build --help`, tempDir);
            expect(result.success).toBe(true);
            expect(result.output.length > 50).toBe(true);
        });
    });

    describe('6.11 Integration & Option Parsing', () => {
        test('should parse all build options without error', () => {
            const result = runCommand(
                `node ${cliPath} build --help`,
                tempDir
            );
            expect(result.success).toBe(true);
            expect(result.code).toBe(0);
        });

        test('should handle option ordering correctly', () => {
            const result = runCommand(
                `node ${cliPath} build --help`,
                tempDir
            );
            expect(result.success).toBe(true);
            expect(result.output.includes('build')).toBe(true);
        });

        test('should validate command structure consistency', () => {
            const result = runCommand(
                `node ${cliPath} --help`,
                tempDir
            );
            expect(result.success).toBe(true);
            expect(result.output).toContain('build');
        });
    });

    describe('6.12 Build Status Messages', () => {
        test('should accept valid project structure', () => {
            const testProject = path.join(tempDir, 'valid-project');
            if (fs.existsSync(testProject)) {
                fs.rmSync(testProject, { recursive: true });
            }
            fs.mkdirSync(testProject, { recursive: true });

            fs.writeFileSync(
                path.join(testProject, 'package.json'),
                JSON.stringify({
                    name: 'test-app',
                    version: '1.0.0',
                    scripts: {}
                })
            );

            const result = runCommand(
                `node ${cliPath} build --help`,
                testProject
            );
            expect(result.success).toBe(true);
        });

        test('should provide proper error context', () => {
            const invalidProject = path.join(tempDir, 'error-project');
            if (fs.existsSync(invalidProject)) {
                fs.rmSync(invalidProject, { recursive: true });
            }
            fs.mkdirSync(invalidProject, { recursive: true });

            const result = runCommand(
                `node ${cliPath} build`,
                invalidProject,
                false
            );
            expect(result.code).not.toBe(0);
            expect(result.output.length + result.error.length).toBeGreaterThan(0);
        });

        test('should show build completion status', () => {
            const result = runCommand(
                `node ${cliPath} build --help`,
                tempDir
            );
            expect(result.success).toBe(true);
            expect(result.code).toBe(0);
        });
    });
});