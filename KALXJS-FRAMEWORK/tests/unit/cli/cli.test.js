/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const {
    createProject,
    createComponent,
    createView,
    program,
    version
} = require('@kalxjs/cli');

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('commander');
jest.mock('inquirer');
jest.mock('chalk', () => ({
    cyan: jest.fn(text => `CYAN:${text}`),
    green: jest.fn(text => `GREEN:${text}`),
    red: jest.fn(text => `RED:${text}`)
}));
jest.mock('ora', () => jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn()
})));

describe('@kalxjs/cli', () => {
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock console methods
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();

        // Mock path.resolve to return predictable paths
        path.resolve.mockImplementation((...args) => args.join('/'));

        // Mock path.join to join paths with forward slashes
        path.join.mockImplementation((...args) => args.join('/'));

        // Mock process.cwd
        process.cwd = jest.fn().mockReturnValue('/current/dir');
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    describe('createProject', () => {
        test('should create project with basic structure', async () => {
            // Setup
            fs.existsSync.mockReturnValue(false);

            // Test
            await createProject('my-project', {});

            // Assert
            expect(fs.mkdirSync).toHaveBeenCalledWith('/current/dir/my-project', { recursive: true });
            expect(fs.mkdirSync).toHaveBeenCalledWith('/current/dir/my-project/src', { recursive: true });
            expect(fs.mkdirSync).toHaveBeenCalledWith('/current/dir/my-project/src/components', { recursive: true });
            expect(fs.mkdirSync).toHaveBeenCalledWith('/current/dir/my-project/src/views', { recursive: true });
            expect(fs.mkdirSync).toHaveBeenCalledWith('/current/dir/my-project/src/assets', { recursive: true });
            expect(fs.mkdirSync).toHaveBeenCalledWith('/current/dir/my-project/public', { recursive: true });

            // Check package.json creation
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/my-project/package.json',
                expect.stringContaining('"name": "my-project"')
            );

            // Check index.html creation
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/my-project/index.html',
                expect.stringContaining('<title>my-project</title>')
            );

            // Check main.js creation
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/my-project/src/main.js',
                expect.stringContaining('import kalxjs from')
            );

            // Check App.js creation
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/my-project/src/App.js',
                expect.stringContaining('export default {')
            );

            // Check README.md creation
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/my-project/README.md',
                expect.stringContaining('# my-project')
            );

            // Check .gitignore creation
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/my-project/.gitignore',
                expect.stringContaining('node_modules')
            );
        });

        test('should fail if project directory already exists', async () => {
            // Setup
            fs.existsSync.mockReturnValue(true);
            const ora = require('ora');

            // Test
            await createProject('existing-project', {});

            // Assert
            expect(ora().fail).toHaveBeenCalledWith(expect.stringContaining('already exists'));
            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        test('should include router if option is enabled', async () => {
            // Setup
            fs.existsSync.mockReturnValue(false);

            // Test
            await createProject('my-project', { router: true });

            // Assert
            // Check package.json includes router
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/my-project/package.json',
                expect.stringContaining('"@kalxjs/router"')
            );

            // Check main.js includes router setup
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/my-project/src/main.js',
                expect.stringContaining('import { createRouter } from')
            );

            // Check Home view creation
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/my-project/src/views/Home.js',
                expect.stringContaining('export default {')
            );
        });

        test('should include state if option is enabled', async () => {
            // Setup
            fs.existsSync.mockReturnValue(false);

            // Test
            await createProject('my-project', { state: true });

            // Assert
            // Check package.json includes state
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/my-project/package.json',
                expect.stringContaining('"@kalxjs/state"')
            );

            // Check main.js includes state setup
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/my-project/src/main.js',
                expect.stringContaining('import { createStore } from')
            );
        });

        test('should handle errors during project creation', async () => {
            // Setup
            fs.existsSync.mockReturnValue(false);
            fs.mkdirSync.mockImplementationOnce(() => {
                throw new Error('Mock error');
            });
            const ora = require('ora');

            // Test
            await createProject('my-project', {});

            // Assert
            expect(ora().fail).toHaveBeenCalledWith('Failed to create project');
            expect(console.error).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('createComponent', () => {
        test('should create component with correct name formatting', () => {
            // Setup
            fs.existsSync.mockImplementation(path => {
                // Return true for components directory, false for component file
                return path === '/current/dir/src/components';
            });

            // Test
            createComponent('user-profile', {});

            // Assert
            // Check component file creation with PascalCase name
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/src/components/UserProfile.js',
                expect.stringContaining('name: \'UserProfile\'')
            );

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('UserProfile created successfully'));
        });

        test('should include script section if option is enabled', () => {
            // Setup
            fs.existsSync.mockImplementation(path => {
                // Return true for components directory, false for component file
                return path === '/current/dir/src/components';
            });

            // Test
            createComponent('button', { script: true });

            // Assert
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/src/components/Button.js',
                expect.stringContaining('methods: {')
            );
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/src/components/Button.js',
                expect.stringContaining('mounted() {')
            );
        });

        test('should fail if components directory does not exist', () => {
            // Setup
            fs.existsSync.mockReturnValue(false);

            // Test
            createComponent('user-profile', {});

            // Assert
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('src/components directory not found'));
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        test('should fail if component already exists', () => {
            // Setup
            fs.existsSync.mockReturnValue(true);

            // Test
            createComponent('user-profile', {});

            // Assert
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('already exists'));
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        test('should handle errors during component creation', () => {
            // Setup
            fs.existsSync.mockImplementation(path => {
                // Return true for components directory, false for component file
                return path === '/current/dir/src/components';
            });

            fs.writeFileSync.mockImplementationOnce(() => {
                throw new Error('Mock error');
            });

            // Test
            createComponent('user-profile', {});

            // Assert
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to create component'));
        });
    });

    describe('createView', () => {
        test('should create view with correct name formatting', () => {
            // Setup
            fs.existsSync.mockImplementation(path => {
                // Return true for views directory, false for view file
                return path === '/current/dir/src/views';
            });

            // Test
            createView('user-dashboard', {});

            // Assert
            // Check view file creation with PascalCase name
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/src/views/UserDashboard.js',
                expect.stringContaining('name: \'UserDashboard\'')
            );

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('UserDashboard created successfully'));
        });

        test('should create views directory if it does not exist', () => {
            // Setup
            fs.existsSync.mockReturnValue(false);

            // Test
            createView('home', {});

            // Assert
            expect(fs.mkdirSync).toHaveBeenCalledWith('/current/dir/src/views', { recursive: true });
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/src/views/Home.js',
                expect.stringContaining('name: \'Home\'')
            );
        });

        test('should include script section if option is enabled', () => {
            // Setup
            fs.existsSync.mockReturnValue(true);

            // Test
            createView('about', { script: true });

            // Assert
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/src/views/About.js',
                expect.stringContaining('methods: {')
            );
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                '/current/dir/src/views/About.js',
                expect.stringContaining('mounted() {')
            );
        });

        test('should fail if view already exists', () => {
            // Setup
            fs.existsSync.mockImplementation(path => {
                if (path === '/current/dir/src/views/Home.js') {
                    return true;
                }
                return false;
            });

            // Test
            createView('home', {});

            // Assert
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('already exists'));
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        test('should handle errors during view creation', () => {
            // Setup
            fs.existsSync.mockReturnValue(true);

            fs.writeFileSync.mockImplementationOnce(() => {
                throw new Error('Mock error');
            });

            // Test
            createView('contact', {});

            // Assert
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to create view'));
        });
    });
});