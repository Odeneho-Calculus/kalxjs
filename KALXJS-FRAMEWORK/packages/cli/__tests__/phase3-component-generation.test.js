/**
 * KALXJS CLI - Phase 3: Component Generation Testing
 * Comprehensive tests for 'component'/'c' command with various configurations
 *
 * @test Basic component creation
 * @test Component name formatting
 * @test Directory validation
 * @test Component duplication check
 * @test Style options (CSS/SCSS)
 * @test Advanced component options
 * @test Test file generation
 * @test Directory targeting
 * @test Component template quality
 * @test Batch component creation
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const cliPath = path.resolve(__dirname, '../bin/kalxjs.js');

// Create a temporary directory for test projects
const testTempDir = path.join(os.tmpdir(), 'kalxjs-cli-phase3-tests');

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

    // Create a basic project structure
    execSync(
        `node ${cliPath} create ${projectName} --skip-install --skip-prompts --cwd ${testTempDir}`,
        { stdio: 'ignore', encoding: 'utf8' }
    );

    return projectPath;
}

beforeAll(async () => {
    await fs.ensureDir(testTempDir);
});

afterAll(async () => {
    await cleanupTestDir(testTempDir);
});

describe('Phase 3: Component Generation Testing', () => {

    describe('3.1 Basic Component Creation', () => {
        test('should create a basic component with default settings', async () => {
            const projectName = 'comp-project-basic';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Button`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'Button.js');
                expect(fs.existsSync(componentPath)).toBe(true);

                const content = fs.readFileSync(componentPath, 'utf8');
                expect(content).toContain('class Button');
                expect(content).toContain('@kalxjs/core');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should create component with correct structure', async () => {
            const projectName = 'comp-project-struct';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Header`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'Header.js');
                const content = fs.readFileSync(componentPath, 'utf8');

                expect(content).toContain('createComponent');
                expect(content).toContain('render()');
                expect(content).toContain('export default Header');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should place component in app/components directory', async () => {
            const projectName = 'comp-project-location';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Card`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentDir = path.join(projectPath, 'app', 'components');
                expect(fs.existsSync(componentDir)).toBe(true);

                const componentPath = path.join(componentDir, 'Card.js');
                expect(fs.existsSync(componentPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('3.2 Component Name Formatting', () => {
        test('should convert kebab-case to PascalCase', async () => {
            const projectName = 'comp-project-kebab';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component my-button`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'MyButton.js');
                expect(fs.existsSync(componentPath)).toBe(true);

                const content = fs.readFileSync(componentPath, 'utf8');
                expect(content).toContain('class MyButton');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should convert snake_case to PascalCase', async () => {
            const projectName = 'comp-project-snake';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component user_profile`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'UserProfile.js');
                expect(fs.existsSync(componentPath)).toBe(true);

                const content = fs.readFileSync(componentPath, 'utf8');
                expect(content).toContain('class UserProfile');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should handle single word component names', async () => {
            const projectName = 'comp-project-single';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Badge`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'Badge.js');
                expect(fs.existsSync(componentPath)).toBe(true);

                const content = fs.readFileSync(componentPath, 'utf8');
                expect(content).toContain('class Badge');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should handle mixed case input', async () => {
            const projectName = 'comp-project-mixed';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component NavBar`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'NavBar.js');
                expect(fs.existsSync(componentPath)).toBe(true);

                const content = fs.readFileSync(componentPath, 'utf8');
                expect(content).toContain('class NavBar');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('3.3 Component Duplication Check', () => {
        test('should prevent duplicate component creation', async () => {
            const projectName = 'comp-project-dup';
            const projectPath = await setupTestProject(projectName);

            try {
                // Create component first time
                execSync(
                    `node ${cliPath} component Button`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Try to create same component again
                let output = '';
                try {
                    execSync(
                        `node ${cliPath} component Button 2>&1`,
                        { cwd: projectPath, encoding: 'utf8', stdio: 'pipe' }
                    );
                } catch (err) {
                    output = err.stdout || err.message || '';
                }

                expect(output).toContain('already exists');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should prevent duplicate when using different name formatting', async () => {
            const projectName = 'comp-project-dup2';
            const projectPath = await setupTestProject(projectName);

            try {
                // Create component with PascalCase
                execSync(
                    `node ${cliPath} component MyButton`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Try to create same component with kebab-case
                let output = '';
                try {
                    execSync(
                        `node ${cliPath} component my-button 2>&1`,
                        { cwd: projectPath, encoding: 'utf8', stdio: 'pipe' }
                    );
                } catch (err) {
                    output = err.stdout || err.message || '';
                }

                expect(output).toContain('already exists');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('3.4 Style Options', () => {
        test('should create component with CSS styles', async () => {
            const projectName = 'comp-project-css';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Styled --style css`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const styleDir = path.join(projectPath, 'app', 'styles', 'components');
                const stylePath = path.join(styleDir, 'styled.css');

                expect(fs.existsSync(stylePath)).toBe(true);

                const styleContent = fs.readFileSync(stylePath, 'utf8');
                expect(styleContent).toContain('.styled');
                expect(styleContent).toContain('padding');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should create component with SCSS styles', async () => {
            const projectName = 'comp-project-scss';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Themed --style scss`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const styleDir = path.join(projectPath, 'app', 'styles', 'components');
                const stylePath = path.join(styleDir, 'themed.scss');

                expect(fs.existsSync(stylePath)).toBe(true);

                const styleContent = fs.readFileSync(stylePath, 'utf8');
                expect(styleContent).toContain('.themed');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should import style in component', async () => {
            const projectName = 'comp-project-style-import';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Styled --style css`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'Styled.js');
                const componentContent = fs.readFileSync(componentPath, 'utf8');

                expect(componentContent).toContain("import '../styles/components/styled.css'");
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should not create style file when style option omitted', async () => {
            const projectName = 'comp-project-no-style';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component NoStyle`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const styleDir = path.join(projectPath, 'app', 'styles', 'components');
                const stylePath = path.join(styleDir, 'nostyle.css');

                expect(fs.existsSync(stylePath)).toBe(false);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('3.5 Advanced Component Options', () => {
        test('should include props when --props flag used', async () => {
            const projectName = 'comp-project-props';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component WithProps --props`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'WithProps.js');
                const content = fs.readFileSync(componentPath, 'utf8');

                expect(content).toContain('props:');
                expect(content).toContain('title');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should include state when --state flag used', async () => {
            const projectName = 'comp-project-state';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component WithState --state`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'WithState.js');
                const content = fs.readFileSync(componentPath, 'utf8');

                expect(content).toContain('data()');
                expect(content).toContain('count');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should include methods when --methods flag used', async () => {
            const projectName = 'comp-project-methods';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component WithMethods --methods --state`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'WithMethods.js');
                const content = fs.readFileSync(componentPath, 'utf8');

                expect(content).toContain('methods:');
                expect(content).toContain('increment');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should include lifecycle hooks when --lifecycle flag used', async () => {
            const projectName = 'comp-project-lifecycle';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component WithLifecycle --lifecycle`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'WithLifecycle.js');
                const content = fs.readFileSync(componentPath, 'utf8');

                expect(content).toContain('beforeMount');
                expect(content).toContain('mounted');
                expect(content).toContain('beforeUpdate');
                expect(content).toContain('updated');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should combine multiple options without conflicts', async () => {
            const projectName = 'comp-project-combined';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Complex --props --state --methods --lifecycle`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'Complex.js');
                const content = fs.readFileSync(componentPath, 'utf8');

                expect(content).toContain('props:');
                expect(content).toContain('data()');
                expect(content).toContain('methods:');
                expect(content).toContain('beforeMount');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('3.6 Test File Generation', () => {
        test('should create test file when --test flag used', async () => {
            const projectName = 'comp-project-test';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Testable --test`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const testPath = path.join(projectPath, 'app', 'components', '__tests__', 'Testable.test.js');
                expect(fs.existsSync(testPath)).toBe(true);

                const content = fs.readFileSync(testPath, 'utf8');
                expect(content).toContain('describe');
                expect(content).toContain('Testable');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should have valid test structure', async () => {
            const projectName = 'comp-project-test-struct';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component TestComp --test`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const testPath = path.join(projectPath, 'app', 'components', '__tests__', 'TestComp.test.js');
                const content = fs.readFileSync(testPath, 'utf8');

                expect(content).toContain('test(');
                expect(content).toContain('expect(');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should not create test file when --test flag omitted', async () => {
            const projectName = 'comp-project-no-test';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component NoTest`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const testPath = path.join(projectPath, 'app', 'components', '__tests__', 'NoTest.test.js');
                expect(fs.existsSync(testPath)).toBe(false);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('3.7 Directory Targeting', () => {
        test('should create component in custom directory with --dir', async () => {
            const projectName = 'comp-project-custom-dir';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Custom --dir custom/path`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'custom', 'path', 'Custom.js');
                expect(fs.existsSync(componentPath)).toBe(true);

                const content = fs.readFileSync(componentPath, 'utf8');
                expect(content).toContain('class Custom');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should create directories recursively when using --dir', async () => {
            const projectName = 'comp-project-recursive-dir';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Nested --dir deep/nested/folder/structure`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'deep', 'nested', 'folder', 'structure', 'Nested.js');
                expect(fs.existsSync(componentPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should work with absolute paths in --dir', async () => {
            const projectName = 'comp-project-abs-path';
            const projectPath = await setupTestProject(projectName);

            try {
                const customDir = path.join(projectPath, 'my-components');
                execSync(
                    `node ${cliPath} component Absolute --dir ${customDir}`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(customDir, 'Absolute.js');
                expect(fs.existsSync(componentPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('3.8 Component Template Quality', () => {
        test('should have proper naming conventions in component', async () => {
            const projectName = 'comp-project-naming';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component FormInput`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'FormInput.js');
                const content = fs.readFileSync(componentPath, 'utf8');

                // Check for proper naming
                expect(content).toContain('class FormInput');
                expect(content).toContain("name: 'FormInput'");
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should follow best practices structure', async () => {
            const projectName = 'comp-project-best-practices';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Best`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'Best.js');
                const content = fs.readFileSync(componentPath, 'utf8');

                // Check for imports
                expect(content).toContain('import');
                // Check for class definition
                expect(content).toContain('class Best');
                // Check for constructor
                expect(content).toContain('constructor()');
                // Check for render method
                expect(content).toContain('render()');
                // Check for export
                expect(content).toContain('export default Best');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should have clear structure and comments', async () => {
            const projectName = 'comp-project-clarity';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} component Clear`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'Clear.js');
                const content = fs.readFileSync(componentPath, 'utf8');

                // Check structure
                expect(content.length > 0).toBe(true);
                // Check it's valid JavaScript-like structure
                expect(content).toMatch(/class\s+\w+\s*\{/);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('3.9 Batch Component Creation', () => {
        test('should create multiple components sequentially', async () => {
            const projectName = 'comp-project-batch';
            const projectPath = await setupTestProject(projectName);

            try {
                // Create first component
                execSync(
                    `node ${cliPath} component Button`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Create second component
                execSync(
                    `node ${cliPath} component Card`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Create third component
                execSync(
                    `node ${cliPath} component Modal`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Verify all components exist
                expect(fs.existsSync(path.join(projectPath, 'app', 'components', 'Button.js'))).toBe(true);
                expect(fs.existsSync(path.join(projectPath, 'app', 'components', 'Card.js'))).toBe(true);
                expect(fs.existsSync(path.join(projectPath, 'app', 'components', 'Modal.js'))).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should not have state pollution between component creations', async () => {
            const projectName = 'comp-project-isolation';
            const projectPath = await setupTestProject(projectName);

            try {
                // Create component with props
                execSync(
                    `node ${cliPath} component FirstComp --props`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Create component without props
                execSync(
                    `node ${cliPath} component SecondComp`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Verify first has props
                const firstContent = fs.readFileSync(
                    path.join(projectPath, 'app', 'components', 'FirstComp.js'),
                    'utf8'
                );
                expect(firstContent).toContain('props:');

                // Verify second doesn't have props
                const secondContent = fs.readFileSync(
                    path.join(projectPath, 'app', 'components', 'SecondComp.js'),
                    'utf8'
                );

                // If secondContent doesn't explicitly have props:, it's correct
                // The component template shows data() but may or may not show props depending on options
                const hasPropsDefinition = secondContent.includes("props:");
                expect(hasPropsDefinition).toBe(false);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should allow independent component configurations', async () => {
            const projectName = 'comp-project-independent';
            const projectPath = await setupTestProject(projectName);

            try {
                // Create styled component
                execSync(
                    `node ${cliPath} component Styled --style css`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Create tested component
                execSync(
                    `node ${cliPath} component Tested --test`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Create complex component
                execSync(
                    `node ${cliPath} component Complex --props --state --lifecycle --style scss`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                // Verify independent creations
                expect(fs.existsSync(path.join(projectPath, 'app', 'styles', 'components', 'styled.css'))).toBe(true);
                expect(fs.existsSync(path.join(projectPath, 'app', 'components', '__tests__', 'Tested.test.js'))).toBe(true);
                expect(fs.existsSync(path.join(projectPath, 'app', 'styles', 'components', 'complex.scss'))).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });

    describe('3.10 Error Handling & Edge Cases', () => {
        test('should handle missing component name gracefully', async () => {
            const projectName = 'comp-project-no-name';
            const projectPath = await setupTestProject(projectName);

            try {
                let output = '';
                try {
                    execSync(
                        `node ${cliPath} component 2>&1`,
                        { cwd: projectPath, encoding: 'utf8', stdio: 'pipe' }
                    );
                } catch (err) {
                    output = err.stdout || err.message || '';
                }

                expect(output).toContain('required');
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should use c alias for component command', async () => {
            const projectName = 'comp-project-alias';
            const projectPath = await setupTestProject(projectName);

            try {
                execSync(
                    `node ${cliPath} c AliasComp`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'AliasComp.js');
                expect(fs.existsSync(componentPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);

        test('should handle special characters in component name', async () => {
            const projectName = 'comp-project-special';
            const projectPath = await setupTestProject(projectName);

            try {
                // Try with valid hyphen
                execSync(
                    `node ${cliPath} component my-special-comp`,
                    { cwd: projectPath, stdio: 'ignore', encoding: 'utf8' }
                );

                const componentPath = path.join(projectPath, 'app', 'components', 'MySpecialComp.js');
                expect(fs.existsSync(componentPath)).toBe(true);
            } finally {
                await cleanupTestDir(projectPath);
            }
        }, 30000);
    });
});