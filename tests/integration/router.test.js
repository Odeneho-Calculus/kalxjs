// kalxjs/tests/integration/router.test.js

import { createRouter, RouterView, RouterLink } from '@kalxjs/router';
import { resetDOM } from './setup';

describe('Router Integration Tests', () => {
    beforeEach(() => {
        resetDOM();
    });

    test('router should initialize with correct mode', () => {
        const router = createRouter({
            mode: 'hash',
            routes: [
                { path: '/', component: {} },
                { path: '/about', component: {} }
            ]
        });

        router.init();

        expect(router.mode).toBe('hash');
        expect(router.routes.length).toBe(2);
        expect(router.currentRoute.path).toBe('/');
    });

    test('router should match routes correctly', () => {
        const router = createRouter({
            routes: [
                { path: '/', component: {} },
                { path: '/about', component: {} },
                { path: '/user/:id', component: {} }
            ]
        });

        // Test exact match
        const homeRoute = router._matchRoute('/');
        expect(homeRoute.matched.length).toBe(1);
        expect(homeRoute.matched[0].path).toBe('/');

        // Test dynamic route
        const userRoute = router._matchRoute('/user/123');
        expect(userRoute.matched.length).toBe(1);
        expect(userRoute.matched[0].path).toBe('/user/:id');
        expect(userRoute.params.id).toBe('123');

        // Test non-existent route
        const nonExistentRoute = router._matchRoute('/nonexistent');
        expect(nonExistentRoute.matched.length).toBe(0);
    });

    test('router should handle navigation', () => {
        const router = createRouter({
            mode: 'hash',
            routes: [
                { path: '/', component: {} },
                { path: '/about', component: {} }
            ]
        });

        router.init();

        router.push('/about');
        expect(window.location.hash).toBe('#/about');

        // Test replace
        router.replace('/');
        expect(window.location.hash).toBe('#/');
    });

    test('router should parse query parameters', () => {
        const router = createRouter();

        const route = router._matchRoute('/search?query=kalxjs&page=1');

        expect(route.query).toEqual({
            query: 'kalxjs',
            page: '1'
        });
    });

    test('RouterView should render as a div', () => {
        const view = RouterView();

        expect(view.tag).toBe('div');
        expect(view.props.class).toBe('kal-router-view');
    });

    test('RouterLink should render as an anchor with click handler', () => {
        const link = RouterLink({
            to: '/about',
            children: ['About']
        });

        expect(link.tag).toBe('a');
        expect(link.props.href).toBe('/about');
        expect(typeof link.props.onClick).toBe('function');
        expect(link.children).toEqual(['About']);
    });
});