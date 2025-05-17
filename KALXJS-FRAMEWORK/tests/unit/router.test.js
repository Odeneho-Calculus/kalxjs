// kalxjs/tests/unit/router.test.js

// Import the router
import { createRouter, RouterView, RouterLink } from '@kalxjs/router';

describe('Router', () => {
    let router;

    beforeEach(() => {
        // Set up a basic router for tests
        router = createRouter({
            mode: 'hash',
            routes: [
                { path: '/', component: { name: 'Home' } },
                { path: '/about', component: { name: 'About' } },
                { path: '/user/:id', component: { name: 'User' } },
                { path: '*', component: { name: 'NotFound' } }
            ]
        });

        // Mock the window location and history
        delete window.location;
        window.location = {
            hash: '#/',
            href: 'http://localhost/#/',
            replace: jest.fn()
        };

        window.history = {
            pushState: jest.fn(),
            replaceState: jest.fn(),
            go: jest.fn()
        };

        // Mock addEventListener
        window.addEventListener = jest.fn();
    });

    afterEach(() => {
        // Clean up the mock
        if (typeof window.history.pushState.mockRestore === 'function') {
            window.history.pushState.mockRestore();
        }
        if (typeof window.history.replaceState.mockRestore === 'function') {
            window.history.replaceState.mockRestore();
        }
        if (typeof window.history.go.mockRestore === 'function') {
            window.history.go.mockRestore();
        }
        if (typeof window.addEventListener.mockRestore === 'function') {
            window.addEventListener.mockRestore();
        }
    });

    describe('createRouter', () => {
        test('should create a router instance', () => {
            expect(router).toBeDefined();
            expect(router.routes.length).toBe(4);
            expect(router.mode).toBe('hash');
        });

        test('should initialize with default values', () => {
            const defaultRouter = createRouter();

            expect(defaultRouter.routes).toEqual([]);
            expect(defaultRouter.mode).toBe('hash');
            expect(defaultRouter.base).toBe('');
        });
    });

    describe('Router Navigation', () => {
        test('should push a new route (hash mode)', () => {
            router.push('/about');

            expect(window.location.hash).toBe('/about');
        });

        test('should push a new route (history mode)', () => {
            // Mock pathname slice method
            const originalPathname = window.location.pathname;
            Object.defineProperty(window.location, 'pathname', {
                value: '/base/path',
                writable: true
            });

            const historyRouter = createRouter({
                mode: 'history',
                routes: [
                    { path: '/', component: { name: 'Home' } }
                ]
            });

            historyRouter.push('/about');

            expect(window.history.pushState).toHaveBeenCalled();

            // Restore original pathname
            window.location.pathname = originalPathname;
        });

        test('should replace current route', () => {
            router.replace('/about');

            expect(window.location.replace).toHaveBeenCalled();
        });

        test('should go back in history', () => {
            // Mock history.go method
            window.history.go = jest.fn();

            router.go(-1);

            expect(window.history.go).toHaveBeenCalledWith(-1);
        });
    });

    describe('Route Matching', () => {
        test('should match exact routes', () => {
            const match = router._matchRoute('/about');

            expect(match.matched.length).toBe(1);
            expect(match.matched[0].component.name).toBe('About');
            expect(match.params).toEqual({});
        });

        test('should match dynamic routes', () => {
            const match = router._matchRoute('/user/123');

            expect(match.matched.length).toBe(1);
            expect(match.matched[0].component.name).toBe('User');
            expect(match.params).toEqual({ id: '123' });
        });

        test('should match fallback route', () => {
            const match = router._matchRoute('/nonexistent');

            expect(match.matched.length).toBe(1);
            expect(match.matched[0].component.name).toBe('NotFound');
        });

        test('should parse query parameters', () => {
            const match = router._matchRoute('/about?name=john&age=30');

            expect(match.query).toEqual({
                name: 'john',
                age: '30'
            });
        });
    });

    describe('Router Initialization', () => {
        test('should add event listeners on init', () => {
            router.init();

            expect(window.addEventListener).toHaveBeenCalledWith('hashchange', expect.any(Function));
        });

        test('should add popstate listener for history mode', () => {
            // Mock pathname property
            Object.defineProperty(window.location, 'pathname', {
                value: '/base/path',
                writable: true
            });

            const historyRouter = createRouter({
                mode: 'history',
                routes: []
            });

            historyRouter.init();

            expect(window.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
        });
    });

    describe('Router Components', () => {
        test('RouterView should render correctly', () => {
            const view = RouterView();

            expect(view).toEqual({
                tag: 'div',
                props: { class: 'kal-router-view' },
                children: []
            });
        });

        test('RouterLink should render an anchor tag', () => {
            const link = RouterLink({
                to: '/about',
                children: ['About']
            });

            expect(link.tag).toBe('a');
            expect(link.props.href).toBe('/about');
            expect(link.props.onClick).toBeDefined();
            expect(link.children).toEqual(['About']);
        });
    });
});
