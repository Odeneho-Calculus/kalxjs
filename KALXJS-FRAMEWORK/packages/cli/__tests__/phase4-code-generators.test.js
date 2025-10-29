/**
 * KALXJS CLI - Phase 4: Code Generators Testing
 * Comprehensive tests for 'generate'/'g' command with component generation
 *
 * @test Basic component generation via generate command
 * @test Component generation with Options API
 * @test Component generation with Composition API
 * @test Custom directory targeting
 * @test Error handling for missing parameters
 * @test Unknown generation type handling
 * @test Component duplication detection
 * @test Component template quality validation
 * @test Component file naming and extensions
 * @test Batch component generation
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const cliPath = path.resolve(__dirname, '../bin/kalxjs.js');

// Create a temporary directory for test projects
const testTempDir = path.join(os.tmpdir(), 'kalxjs-cli-phase4-tests');

// Cleanup helper
async function cleanupTestDir(testDir) {
    if (fs.existsSync(testDir)) {
        await fs.remove(testDir);
    }
}

// Setup test project (create a valid kalxjs project)
async function setupTestProject(projectName) {
    const projectPath = path.join(testTempDir, projectName);
    await cleanupTestDir(projectPath);

    try {
        execSync(
            `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
            { stdio: 'ignore', encoding: 'utf8', cwd: testTempDir }
        );
    } catch (error) {
        console.error(`Failed to setup test project: ${error.message}`);
    }

    return projectPath;
}

beforeAll(async () => {
    await fs.ensureDir(testTempDir);
});

afterAll(async () => {
    await cleanupTestDir(testTempDir);
});

describe('Phase 4: Code Generators (generate/g command)', () => {

    describe('Basic Component Generation via Generate Command', () => {
        test('should generate a .klx component with default Options API', async () => {
            const projectName = 'phase4-test-basic';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} generate component Button`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'Button.klx');
                expect(fs.existsSync(componentPath)).toBe(true);

                const content = fs.readFileSync(componentPath, 'utf8');
                expect(content).toContain('<template>');
                expect(content).toContain('export default');
                expect(content).toContain("name: 'Button'");
                expect(content).toContain('<style scoped>');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should generate component with lowercase class names in CSS', async () => {
            const projectName = 'phase4-test-css-class';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} generate component TestComponent`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'TestComponent.klx');
                const content = fs.readFileSync(componentPath, 'utf8');

                // Check CSS class name is lowercase
                expect(content).toContain('.testcomponent');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should include default props and data in generated component', async () => {
            const projectName = 'phase4-test-props-data';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} generate component Header`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'Header.klx');
                const content = fs.readFileSync(componentPath, 'utf8');

                // Check for default data structure
                expect(content).toContain('data()');
                expect(content).toContain('message:');
                expect(content).toContain('count:');
                expect(content).toContain('methods:');
                expect(content).toContain('increment()');
                expect(content).toContain('mounted()');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('Composition API Component Generation', () => {
        test('should generate a component with Composition API when --composition flag is used', async () => {
            const projectName = 'phase4-test-composition';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} generate component Card --composition`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'Card.klx');
                expect(fs.existsSync(componentPath)).toBe(true);

                const content = fs.readFileSync(componentPath, 'utf8');
                // Composition API uses setup() function
                expect(content).toContain('setup(props)');
                expect(content).toContain('useRef');
                expect(content).toContain('onMounted');
                expect(content).toContain('@kalxjs/core');
                expect(content).toContain('@kalxjs/composition');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should use .value accessor in Composition API component', async () => {
            const projectName = 'phase4-test-composition-value';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} generate component Form --composition`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'Form.klx');
                const content = fs.readFileSync(componentPath, 'utf8');

                // Composition API uses .value for reactive properties
                expect(content).toContain('count.value');
                expect(content).toContain('message:');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('Custom Directory Targeting', () => {
        test('should generate component in custom directory with --dir flag', async () => {
            const projectName = 'phase4-test-custom-dir';
            const projectPath = await setupTestProject(projectName);

            try {
                const customDir = path.join(projectPath, 'src', 'components');
                fs.ensureDirSync(customDir);

                execSync(
                    `node ${cliPath} generate component Sidebar --dir ${customDir}`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(customDir, 'Sidebar.klx');
                expect(fs.existsSync(componentPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should create directories recursively if they do not exist', async () => {
            const projectName = 'phase4-test-recursive-dir';
            const projectPath = await setupTestProject(projectName);

            try {
                const nestedDir = path.join(projectPath, 'app', 'ui', 'components');

                execSync(
                    `node ${cliPath} generate component Tooltip --dir ${nestedDir}`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(nestedDir, 'Tooltip.klx');
                expect(fs.existsSync(componentPath)).toBe(true);
                expect(fs.existsSync(nestedDir)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should generate component in relative path', async () => {
            const projectName = 'phase4-test-relative-path';
            const projectPath = await setupTestProject(projectName);

            try {
                fs.ensureDirSync(path.join(projectPath, 'components'));

                execSync(
                    `node ${cliPath} generate component Modal --dir ./components`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'components', 'Modal.klx');
                expect(fs.existsSync(componentPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('Error Handling', () => {
        test('should show error when type is missing', async () => {
            const projectName = 'phase4-test-missing-type';
            const projectPath = await setupTestProject(projectName);

            try {
                let output = '';
                try {
                    execSync(
                        `node ${cliPath} generate`,
                        { cwd: projectPath, encoding: 'utf8' }
                    );
                } catch (error) {
                    output = error.stdout || error.stderr || error.message;
                }

                // Should contain error message about missing type/name
                expect(output).toMatch(/specify.*type.*name/i);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should show error when component name is missing', async () => {
            const projectName = 'phase4-test-missing-name';
            const projectPath = await setupTestProject(projectName);

            try {
                let output = '';
                try {
                    execSync(
                        `node ${cliPath} generate component`,
                        { cwd: projectPath, encoding: 'utf8' }
                    );
                } catch (error) {
                    output = error.stdout || error.stderr || error.message;
                }

                expect(output).toMatch(/specify.*type.*name/i);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should show error for unknown generation type', async () => {
            const projectName = 'phase4-test-unknown-type';
            const projectPath = await setupTestProject(projectName);

            try {
                let output = '';
                try {
                    execSync(
                        `node ${cliPath} generate route HomePage`,
                        { cwd: projectPath, encoding: 'utf8' }
                    );
                } catch (error) {
                    output = error.stdout || error.stderr || error.message;
                }

                expect(output).toMatch(/unknown.*generation.*type|route/i);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('Component Duplication Detection', () => {
        test('should prevent duplicate component creation with same name', async () => {
            const projectName = 'phase4-test-duplicate';
            const projectPath = await setupTestProject(projectName);

            try {
                // Create first component
                execSync(
                    `node ${cliPath} generate component Navigation`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Try to create duplicate
                let output = '';
                try {
                    execSync(
                        `node ${cliPath} generate component Navigation`,
                        { cwd: projectPath, encoding: 'utf8' }
                    );
                } catch (error) {
                    output = error.stdout || error.stderr || error.message;
                }

                expect(output).toMatch(/already.*exists/i);

                // Verify only one component file exists
                const componentPath = path.join(projectPath, 'Navigation.klx');
                expect(fs.existsSync(componentPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should prevent duplicate components in custom directories', async () => {
            const projectName = 'phase4-test-duplicate-custom-dir';
            const projectPath = await setupTestProject(projectName);

            try {
                const customDir = path.join(projectPath, 'custom-components');
                fs.ensureDirSync(customDir);

                // Create first component
                execSync(
                    `node ${cliPath} generate component Alert --dir ${customDir}`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Try to create duplicate in same directory
                let output = '';
                try {
                    execSync(
                        `node ${cliPath} generate component Alert --dir ${customDir}`,
                        { cwd: projectPath, encoding: 'utf8' }
                    );
                } catch (error) {
                    output = error.stdout || error.stderr || error.message;
                }

                expect(output).toMatch(/already.*exists/i);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('Component Template Quality', () => {
        test('should generate well-formed template structure', async () => {
            const projectName = 'phase4-test-template-quality';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} generate component Panel`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'Panel.klx');
                const content = fs.readFileSync(componentPath, 'utf8');

                // Check for proper component structure
                const sections = {
                    template: /<template>[\s\S]*<\/template>/.test(content),
                    script: /<script>[\s\S]*export default[\s\S]*<\/script>/.test(content),
                    style: /<style scoped>[\s\S]*<\/style>/.test(content)
                };

                expect(sections.template).toBe(true);
                expect(sections.script).toBe(true);
                expect(sections.style).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should include proper Vue component naming conventions', async () => {
            const projectName = 'phase4-test-naming-conventions';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} generate component DataTable`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'DataTable.klx');
                const content = fs.readFileSync(componentPath, 'utf8');

                // Check component name matches file name
                expect(content).toContain("name: 'DataTable'");
                // Check for proper indentation and formatting
                expect(content).toContain('  <div');
                expect(content).toContain('  <template>');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should include proper event handling in template', async () => {
            const projectName = 'phase4-test-event-handling';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} generate component Counter`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'Counter.klx');
                const content = fs.readFileSync(componentPath, 'utf8');

                // Check for proper Vue event binding
                expect(content).toContain('@click="increment"');
                // Check for reactive data binding
                expect(content).toContain('{{ count }}');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('Component File Extensions', () => {
        test('should generate .klx file extension for components', async () => {
            const projectName = 'phase4-test-file-extension';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} generate component FileTest`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                expect(fs.existsSync(path.join(projectPath, 'FileTest.klx'))).toBe(true);
                expect(fs.existsSync(path.join(projectPath, 'FileTest.vue'))).toBe(false);
                expect(fs.existsSync(path.join(projectPath, 'FileTest.js'))).toBe(false);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('Batch Component Generation', () => {
        test('should generate multiple components sequentially', async () => {
            const projectName = 'phase4-test-batch';
            const projectPath = await setupTestProject(projectName);

            try {
                const components = ['Button', 'Input', 'Select', 'Checkbox'];

                for (const component of components) {
                    execSync(
                        `node ${cliPath} generate component ${component}`,
                        { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                    );
                }

                // Verify all components exist
                components.forEach(component => {
                    const componentPath = path.join(projectPath, `${component}.klx`);
                    expect(fs.existsSync(componentPath)).toBe(true);
                });
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 60000);

        test('should handle batch generation with different options', async () => {
            const projectName = 'phase4-test-batch-options';
            const projectPath = await setupTestProject(projectName);

            try {
                // Generate with default options
                execSync(
                    `node ${cliPath} generate component UserProfile`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Generate with composition API
                execSync(
                    `node ${cliPath} generate component Settings --composition`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Verify both exist with correct content
                const userProfilePath = path.join(projectPath, 'UserProfile.klx');
                const settingsPath = path.join(projectPath, 'Settings.klx');

                expect(fs.existsSync(userProfilePath)).toBe(true);
                expect(fs.existsSync(settingsPath)).toBe(true);

                const settingsContent = fs.readFileSync(settingsPath, 'utf8');
                expect(settingsContent).toContain('setup(props)');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 60000);

        test('should generate components in different directories without interference', async () => {
            const projectName = 'phase4-test-batch-multi-dir';
            const projectPath = await setupTestProject(projectName);

            try {
                const dir1 = path.join(projectPath, 'common');
                const dir2 = path.join(projectPath, 'ui');
                fs.ensureDirSync(dir1);
                fs.ensureDirSync(dir2);

                execSync(
                    `node ${cliPath} generate component Loader --dir ${dir1}`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                execSync(
                    `node ${cliPath} generate component Spinner --dir ${dir2}`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                expect(fs.existsSync(path.join(dir1, 'Loader.klx'))).toBe(true);
                expect(fs.existsSync(path.join(dir2, 'Spinner.klx'))).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 60000);
    });

    describe('Component Naming and Formatting', () => {
        test('should preserve component name casing in file name', async () => {
            const projectName = 'phase4-test-casing';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} generate component MyAwesomeButton`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'MyAwesomeButton.klx');
                expect(fs.existsSync(componentPath)).toBe(true);

                const content = fs.readFileSync(componentPath, 'utf8');
                expect(content).toContain("name: 'MyAwesomeButton'");
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should handle single-word component names', async () => {
            const projectName = 'phase4-test-single-word';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} generate component Logo`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'Logo.klx');
                expect(fs.existsSync(componentPath)).toBe(true);

                const content = fs.readFileSync(componentPath, 'utf8');
                expect(content).toContain("name: 'Logo'");
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('Component Generation Flags', () => {
        test('should support g alias for generate command', async () => {
            const projectName = 'phase4-test-g-alias';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} g component Badge`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'Badge.klx');
                expect(fs.existsSync(componentPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should support c alias for component in generate context', async () => {
            const projectName = 'phase4-test-c-type';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} generate c Tag`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'Tag.klx');
                expect(fs.existsSync(componentPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });
});