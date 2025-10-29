/**
 * KALXJS CLI - Phase 2: Project Creation Testing
 * Comprehensive tests for 'create' command with various configurations
 *
 * @test Basic project creation
 * @test Project name validation
 * @test Directory existence checks
 * @test Feature flags (router, state, scss, etc.)
 * @test Installation options
 * @test Skip prompts mode
 * @test Git initialization
 * @test Output & success messages
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const cliPath = path.resolve(__dirname, '../bin/kalxjs.js');

// Create a temporary directory for test projects
const testTempDir = path.join(os.tmpdir(), 'kalxjs-cli-tests');

// Cleanup helper
async function cleanupTestDir(testDir) {
    if (fs.existsSync(testDir)) {
        await fs.remove(testDir);
    }
}

beforeAll(async () => {
    await fs.ensureDir(testTempDir);
});

afterAll(async () => {
    await cleanupTestDir(testTempDir);
});

describe('Phase 2: Project Creation Testing', () => {

    describe('2.1 Basic Project Creation', () => {
        test('should create basic project with default settings', async () => {
            const projectName = 'test-app-basic';
            const projectPath = path.join(testTempDir, projectName);

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(fs.existsSync(projectPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        });

        test('should create package.json with correct structure', async () => {
            const projectName = 'test-app-pkg';
            const projectPath = path.join(testTempDir, projectName);
            const packageJsonPath = path.join(projectPath, 'package.json');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(fs.existsSync(packageJsonPath)).toBe(true);

                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                expect(packageJson.name).toBe(projectName);
                expect(packageJson.version).toBeDefined();
                expect(packageJson.dependencies).toBeDefined();
            } finally {
                await cleanupTestDir(projectPath);
            }
        });

        test('should contain @kalxjs/core dependency', async () => {
            const projectName = 'test-app-core';
            const projectPath = path.join(testTempDir, projectName);
            const packageJsonPath = path.join(projectPath, 'package.json');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                expect(packageJson.dependencies['@kalxjs/core']).toBeDefined();
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should create index.html entry point', async () => {
            const projectName = 'test-app-html';
            const projectPath = path.join(testTempDir, projectName);
            const htmlPath = path.join(projectPath, 'index.html');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(fs.existsSync(htmlPath)).toBe(true);
                const content = fs.readFileSync(htmlPath, 'utf8');
                expect(content).toContain('<!DOCTYPE html>');
                expect(content).toContain('id="app"');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should create app/main.js entry point', async () => {
            const projectName = 'test-app-main';
            const projectPath = path.join(testTempDir, projectName);
            const mainPath = path.join(projectPath, 'app', 'main.js');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(fs.existsSync(mainPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        });
    });

    describe('2.2 Project Name Validation', () => {
        test('should reject project names starting with numbers', async () => {
            const projectName = '123-invalid-app';
            const projectPath = path.join(testTempDir, projectName);

            expect(() => {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
                );
            }).toThrow();
        });

        test('should reject project names with invalid characters', async () => {
            const projectName = 'invalid@app!';
            const projectPath = path.join(testTempDir, projectName);

            expect(() => {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
                );
            }).toThrow();
        });

        test('should accept valid kebab-case names', async () => {
            const projectName = 'my-valid-app';
            const projectPath = path.join(testTempDir, projectName);

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(fs.existsSync(projectPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        });

        test('should accept simple alphanumeric names', async () => {
            const projectName = 'myapp123';
            const projectPath = path.join(testTempDir, projectName);

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(fs.existsSync(projectPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        });
    });

    describe('2.3 Directory Existence Check', () => {
        test('should error if directory already exists', async () => {
            const projectName = 'test-app-exists';
            const projectPath = path.join(testTempDir, projectName);

            // Create directory first
            await fs.ensureDir(projectPath);

            try {
                expect(() => {
                    execSync(
                        `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
                    );
                }).toThrow();
            } finally {
                await cleanupTestDir(projectPath);
            }
        });

        test('should show clear error message for existing directory', async () => {
            const projectName = 'test-app-error';
            const projectPath = path.join(testTempDir, projectName);

            await fs.ensureDir(projectPath);

            try {
                try {
                    execSync(
                        `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
                    );
                } catch (error) {
                    const output = error.stdout || error.stderr || '';
                    expect(output.toLowerCase()).toContain('exists');
                }
            } finally {
                await cleanupTestDir(projectPath);
            }
        });
    });

    describe('2.4 Feature Flags - Router Option', () => {
        test('should add router dependency with --router flag', async () => {
            const projectName = 'test-app-router';
            const projectPath = path.join(testTempDir, projectName);
            const packageJsonPath = path.join(projectPath, 'package.json');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --router --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                expect(packageJson.dependencies['@kalxjs/router']).toBeDefined();
            } finally {
                await cleanupTestDir(projectPath);
            }
        });

        test('should create navigation directory with router flag', async () => {
            const projectName = 'test-app-router-dir';
            const projectPath = path.join(testTempDir, projectName);
            const navDir = path.join(projectPath, 'app', 'navigation');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --router --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(fs.existsSync(navDir)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        });
    });

    describe('2.5 Feature Flags - State Management', () => {
        test('should add state dependency with --state flag', async () => {
            const projectName = 'test-app-state';
            const projectPath = path.join(testTempDir, projectName);
            const packageJsonPath = path.join(projectPath, 'package.json');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --state --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                expect(packageJson.dependencies['@kalxjs/state']).toBeDefined();
            } finally {
                await cleanupTestDir(projectPath);
            }
        });

        test('should create state directory with state flag', async () => {
            const projectName = 'test-app-state-dir';
            const projectPath = path.join(testTempDir, projectName);
            const stateDir = path.join(projectPath, 'app', 'state');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --state --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(fs.existsSync(stateDir)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        });
    });

    describe('2.6 Feature Flags - Multiple Combinations', () => {
        test('should combine router and state flags', async () => {
            const projectName = 'test-app-multi-1';
            const projectPath = path.join(testTempDir, projectName);
            const packageJsonPath = path.join(projectPath, 'package.json');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --router --state --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                expect(packageJson.dependencies['@kalxjs/router']).toBeDefined();
                expect(packageJson.dependencies['@kalxjs/state']).toBeDefined();
            } finally {
                await cleanupTestDir(projectPath);
            }
        });

        test('should combine multiple features without conflicts', async () => {
            const projectName = 'test-app-multi-2';
            const projectPath = path.join(testTempDir, projectName);
            const packageJsonPath = path.join(projectPath, 'package.json');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --router --state --scss --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                expect(packageJson.dependencies['@kalxjs/core']).toBeDefined();
                expect(fs.existsSync(projectPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        });
    });

    describe('2.7 Installation Options', () => {
        test('should skip npm install with --skip-install flag', async () => {
            const projectName = 'test-app-skip-install';
            const projectPath = path.join(testTempDir, projectName);
            const nodeModulesPath = path.join(projectPath, 'node_modules');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                // node_modules should not exist when using --skip-install
                expect(fs.existsSync(nodeModulesPath)).toBe(false);
            } finally {
                await cleanupTestDir(projectPath);
            }
        });

        test('package.json should be created even with --skip-install', async () => {
            const projectName = 'test-app-pkg-skip';
            const projectPath = path.join(testTempDir, projectName);
            const packageJsonPath = path.join(projectPath, 'package.json');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(fs.existsSync(packageJsonPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        });
    });

    describe('2.8 Skip Prompts Mode', () => {
        test('should use defaults with --skip-prompts flag', async () => {
            const projectName = 'test-app-no-prompts';
            const projectPath = path.join(testTempDir, projectName);

            await cleanupTestDir(projectPath);

            try {
                const output = execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                // Should complete without hanging
                expect(fs.existsSync(projectPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        });

        test('should work with combined flags (skip-install + skip-prompts)', async () => {
            const projectName = 'test-app-combined-skip';
            const projectPath = path.join(testTempDir, projectName);

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --router --state --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(fs.existsSync(projectPath)).toBe(true);

                const packageJsonPath = path.join(projectPath, 'package.json');
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                expect(packageJson.dependencies['@kalxjs/router']).toBeDefined();
                expect(packageJson.dependencies['@kalxjs/state']).toBeDefined();
            } finally {
                await cleanupTestDir(projectPath);
            }
        });
    });

    describe('2.9 Project Directory Structure', () => {
        test('should create required app directory structure', async () => {
            const projectName = 'test-app-structure';
            const projectPath = path.join(testTempDir, projectName);

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                const requiredDirs = [
                    'app',
                    'app/components',
                    'app/core',
                    'app/assets',
                    'public',
                    'config'
                ];

                requiredDirs.forEach(dir => {
                    expect(fs.existsSync(path.join(projectPath, dir))).toBe(true);
                });
            } finally {
                await cleanupTestDir(projectPath);
            }
        });

        test('should create documentation', async () => {
            const projectName = 'test-app-docs';
            const projectPath = path.join(testTempDir, projectName);
            const docsPath = path.join(projectPath, 'docs', 'README.md');

            await cleanupTestDir(projectPath);

            try {
                execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(fs.existsSync(docsPath)).toBe(true);

                const content = fs.readFileSync(docsPath, 'utf8');
                expect(content).toContain('KalxJS');
                expect(content).toContain('Documentation');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('2.10 Success Messages & Output', () => {
        test('should display success message after project creation', async () => {
            const projectName = 'test-app-success';
            const projectPath = path.join(testTempDir, projectName);

            await cleanupTestDir(projectPath);

            try {
                const output = execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(output.toLowerCase()).toContain('success');
            } finally {
                await cleanupTestDir(projectPath);
            }
        });

        test('should provide next steps in output', async () => {
            const projectName = 'test-app-steps';
            const projectPath = path.join(testTempDir, projectName);

            await cleanupTestDir(projectPath);

            try {
                const output = execSync(
                    `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8' }
                );

                expect(output).toContain('Next Steps');
            } finally {
                await cleanupTestDir(projectPath);
            }
        });
    });

    describe('2.11 Error Recovery', () => {
        test('should cleanup on creation failure', async () => {
            const projectName = 'test-app-fail';
            const projectPath = path.join(testTempDir, projectName);

            await cleanupTestDir(projectPath);

            // Try with invalid name (will fail validation)
            try {
                execSync(
                    `node ${cliPath} create 123invalid --skip-install --skip-prompts --cwd ${testTempDir}`,
                    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
                );
            } catch (error) {
                // Error is expected
            }

            // Verify cleanup happened
            expect(fs.existsSync(path.join(testTempDir, '123invalid'))).toBe(false);
        });
    });
});