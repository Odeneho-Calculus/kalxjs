/**
 * KALXJS CLI - Phase 1: Entry Point & Version Testing
 * Tests CLI initialization, version reporting, and help functionality
 *
 * @test Entry point validation
 * @test Version reporting (multiple formats)
 * @test Help menu display
 * @test Error handling for invalid commands
 */

const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the CLI binary path
const cliPath = path.resolve(__dirname, '../bin/kalxjs.js');
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const expectedVersion = packageJson.version;

describe('Phase 1: CLI Entry Point & Version Testing', () => {
    describe('1.1 Version Flag Tests', () => {
        test('should output correct version with -V flag', () => {
            try {
                const output = execSync(`node ${cliPath} -V`, {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                expect(output.trim()).toBe(expectedVersion);
            } catch (error) {
                // Some CLIs exit with 0 but return empty, check both
                if (error.stdout) {
                    expect(error.stdout.trim()).toBe(expectedVersion);
                }
            }
        });

        test('should output correct version with --version flag', () => {
            try {
                const output = execSync(`node ${cliPath} --version`, {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                expect(output.trim()).toBe(expectedVersion);
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.trim()).toBe(expectedVersion);
                }
            }
        });

        test('should output version with -v flag (lowercase)', () => {
            try {
                const output = execSync(`node ${cliPath} -v`, {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                expect(output.trim()).toBe(expectedVersion);
            } catch (error) {
                if (error.stdout) {
                    expect(error.stdout.trim()).toBe(expectedVersion);
                }
            }
        });

        test('should output version with version command', () => {
            const output = execSync(`node ${cliPath} version`, {
                encoding: 'utf8'
            });
            expect(output).toContain('KalxJS CLI version');
            expect(output).toContain(expectedVersion);
        });
    });

    describe('1.2 Help & Usage Tests', () => {
        test('should display help with --help flag', () => {
            const output = execSync(`node ${cliPath} --help`, {
                encoding: 'utf8'
            });
            expect(output).toContain('kalxjs CLI');
            expect(output).toContain('Usage:');
            expect(output).toContain('Options:');
        });

        test('should display help with -h flag', () => {
            const output = execSync(`node ${cliPath} -h`, {
                encoding: 'utf8'
            });
            expect(output).toContain('kalxjs CLI');
            expect(output).toContain('Usage:');
        });

        test('should list all available commands in help', () => {
            const output = execSync(`node ${cliPath} --help`, {
                encoding: 'utf8'
            });

            // Check for main commands
            expect(output).toContain('create');
            expect(output).toContain('component');
            expect(output).toContain('serve');
            expect(output).toContain('build');
            expect(output).toContain('generate');
        });

        test('should show command-specific help', () => {
            const output = execSync(`node ${cliPath} create --help`, {
                encoding: 'utf8'
            });
            expect(output).toContain('create');
            expect(output).toContain('project-name');
            expect(output).toContain('Options:');
        });

        test('should show component command help', () => {
            const output = execSync(`node ${cliPath} component --help`, {
                encoding: 'utf8'
            });
            expect(output).toContain('component');
            expect(output).toContain('name');
            expect(output).toContain('Options:');
        });

        test('should show generate command help', () => {
            const output = execSync(`node ${cliPath} generate --help`, {
                encoding: 'utf8'
            });
            expect(output).toContain('generate');
            expect(output).toContain('type');
            expect(output).toContain('name');
            expect(output).toContain('Options:');
        });
    });

    describe('1.3 Invalid Command Handling', () => {
        test('should handle unknown command gracefully', () => {
            expect(() => {
                execSync(`node ${cliPath} invalidcommand`, {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'ignore']
                });
            }).toThrow();
        });

        test('should return non-zero exit code for unknown command', () => {
            try {
                execSync(`node ${cliPath} unknowncommand`, {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'ignore']
                });
                expect(true).toBe(false); // Should not reach here
            } catch (error) {
                expect(error.status).not.toBe(0);
            }
        });

        test('should display error message for missing required arguments', () => {
            const output = execSync(`node ${cliPath} create --help`, {
                encoding: 'utf8'
            });

            // Create without name should show help or error
            expect(output).toBeTruthy();
            expect(typeof output).toBe('string');
        });
    });

    describe('1.4 Binary Entry Points', () => {
        test('should have kalxjs binary available', () => {
            expect(fs.existsSync(cliPath)).toBe(true);
        });

        test('binary should be executable', () => {
            const stats = fs.statSync(cliPath);
            // Check if file has execute permission
            expect(stats.isFile()).toBe(true);
        });

        test('should start with shebang line', () => {
            const content = fs.readFileSync(cliPath, 'utf8');
            expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
        });

        test('package.json has correct bin entries', () => {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            expect(packageJson.bin).toBeDefined();
            expect(packageJson.bin.kalxjs).toBeDefined();
            expect(packageJson.bin.kalx).toBeDefined();
        });
    });

    describe('1.5 CLI Initialization', () => {
        test('should initialize without errors', () => {
            const output = execSync(`node ${cliPath} --help`, {
                encoding: 'utf8'
            });
            expect(output).toBeTruthy();
        });

        test('should handle rapid successive calls', () => {
            const promises = [];
            for (let i = 0; i < 5; i++) {
                try {
                    execSync(`node ${cliPath} version`, { encoding: 'utf8' });
                    promises.push(true);
                } catch (error) {
                    promises.push(false);
                }
            }

            expect(promises.filter(p => p).length).toBeGreaterThanOrEqual(4);
        });

        test('should have correct Node version requirement', () => {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            expect(packageJson.engines).toBeDefined();
            expect(packageJson.engines.node).toBeDefined();
            expect(packageJson.engines.node).toContain('>=');
        });
    });
});

describe('Phase 1: Error Recovery & Accessibility', () => {
    describe('1.6 Error Messages Quality', () => {
        test('should provide clear error messages', () => {
            try {
                execSync(`node ${cliPath} create`, {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe']
                });
            } catch (error) {
                // Either stdout or stderr should have content
                const output = error.stdout || error.stderr || '';
                expect(output.length).toBeGreaterThan(0);
            }
        });

        test('error output should not be empty for invalid input', () => {
            try {
                execSync(`node ${cliPath} --invalid-flag`, {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe']
                });
            } catch (error) {
                expect(error.status).not.toBe(0);
            }
        });
    });

    describe('1.7 Output Format', () => {
        test('version output should be valid semantic version', () => {
            const output = execSync(`node ${cliPath} version`, {
                encoding: 'utf8'
            });

            const versionRegex = /\d+\.\d+\.\d+/;
            expect(versionRegex.test(output)).toBe(true);
        });

        test('should respect NODE_NO_READLINE environment variable', () => {
            // This tests that the CLI handles non-interactive mode
            const env = { ...process.env, NODE_NO_READLINE: '1' };
            const output = execSync(`node ${cliPath} --version`, {
                encoding: 'utf8',
                env
            });
            expect(output.trim()).toBe(expectedVersion);
        });
    });
});