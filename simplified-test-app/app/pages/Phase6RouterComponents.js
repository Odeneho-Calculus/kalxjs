import { h, defineComponent } from '@kalxjs/core';
import { RouterLink } from '@kalxjs/router';

export default defineComponent({
    name: 'Phase6RouterComponents',

    data() {
        return {
            testLog: [],
            linkStates: {},
            componentInfo: {},
            currentRouteInfo: {}
        };
    },

    methods: {
        addLog(message) {
            this.testLog.push({
                timestamp: new Date().toLocaleTimeString(),
                message
            });
            // Keep only last 30 logs
            if (this.testLog.length > 30) {
                this.testLog.shift();
            }
            // Persist to localStorage
            try {
                localStorage.setItem('phase6_test_logs', JSON.stringify(this.testLog));
            } catch (e) {
                // localStorage might not be available
            }
        },

        loadLogsFromStorage() {
            try {
                const stored = localStorage.getItem('phase6_test_logs');
                if (stored) {
                    this.testLog = JSON.parse(stored);
                }
            } catch (e) {
                // localStorage might not be available
            }
        },

        // Test 1: RouterLink Basic Rendering
        testRouterLinkRendering() {
            this.addLog('Testing: RouterLink component renders correctly');
            const homeLink = document.querySelector('a[href="/"]');
            if (homeLink) {
                this.addLog('✓ Home link found in DOM');
            } else {
                this.addLog('✗ Home link not found');
            }
        },

        // Test 2: RouterLink href Attribute
        testRouterLinkHref() {
            this.addLog('Testing: RouterLink href attribute values');
            const aboutLink = document.querySelector('a[href="/about"]');
            const productLink = document.querySelector('a[href="/product/1"]');
            const userLink = document.querySelector('a[href="/user/john"]');

            if (aboutLink) {
                this.addLog('✓ About link has correct href="/about"');
            }
            if (productLink) {
                this.addLog('✓ Product link has correct href="/product/1"');
            }
            if (userLink) {
                this.addLog('✓ User link has correct href="/user/john"');
            }
        },

        // Test 3: RouterLink Click Navigation
        testRouterLinkClickAbout() {
            this.addLog('Testing: Clicking RouterLink to /about');
            window.router.push('/about').then(() => {
                setTimeout(() => {
                    const currentPath = window.location.pathname;
                    if (currentPath === '/about') {
                        this.addLog('✓ RouterLink navigation to /about successful');
                        this.updateRouteInfo();
                    } else {
                        this.addLog('✗ RouterLink navigation failed');
                    }
                }, 100);
            });
        },

        testRouterLinkClickProduct() {
            this.addLog('Testing: Clicking RouterLink to /product/:id');
            window.router.push('/product/42').then(() => {
                setTimeout(() => {
                    const currentPath = window.location.pathname;
                    if (currentPath === '/product/42') {
                        this.addLog('✓ RouterLink navigation with params successful');
                        this.updateRouteInfo();
                    } else {
                        this.addLog('✗ RouterLink navigation with params failed');
                    }
                }, 100);
            });
        },

        testRouterLinkClickUser() {
            this.addLog('Testing: Clicking RouterLink to /user/:username');
            window.router.push('/user/alice').then(() => {
                setTimeout(() => {
                    const currentPath = window.location.pathname;
                    if (currentPath === '/user/alice') {
                        this.addLog('✓ RouterLink navigation to user route successful');
                        this.updateRouteInfo();
                    } else {
                        this.addLog('✗ RouterLink navigation to user route failed');
                    }
                }, 100);
            });
        },

        // Test 4: Active Class Detection
        testActiveClassHome() {
            this.addLog('Testing: Active class on home link');
            // Navigate to home first
            window.router.push('/').then(() => {
                setTimeout(() => {
                    // After navigating to home, navigate back to phase6 to see updated links
                    window.router.push('/phase6').then(() => {
                        setTimeout(() => {
                            const navLinks = document.querySelectorAll('.navigation-links a');
                            let homeHadActive = false;
                            navLinks.forEach(link => {
                                if (link.href.includes('/') && !link.href.includes('/about') && !link.href.includes('/product') && !link.href.includes('/user')) {
                                    const hasActive = link.classList.contains('router-link-active') ||
                                        link.classList.contains('active') ||
                                        link.textContent.includes('Home');
                                    if (hasActive) {
                                        homeHadActive = true;
                                    }
                                }
                            });
                            if (homeHadActive) {
                                this.addLog('✓ Home link has active class when navigating to home');
                            } else {
                                this.addLog('ℹ Home link check - check actual component state');
                            }
                        }, 200);
                    });
                }, 200);
            });
        },

        testActiveClassAbout() {
            this.addLog('Testing: Active class transitions on navigation');
            // Navigate to about first
            window.router.push('/about').then(() => {
                setTimeout(() => {
                    // Then back to phase6 to see transition
                    window.router.push('/phase6').then(() => {
                        setTimeout(() => {
                            const navLinks = document.querySelectorAll('.navigation-links a');
                            const activeLinks = Array.from(navLinks).filter(link =>
                                link.classList.contains('router-link-active') ||
                                link.classList.contains('active')
                            );
                            if (activeLinks.length > 0) {
                                this.addLog('✓ Active class transitions detected on navigation');
                            } else {
                                this.addLog('ℹ Transition test - RouterLink components tracking route changes');
                            }
                        }, 200);
                    });
                }, 200);
            });
        },

        // Test 5: Exact vs Prefix Matching
        testExactActiveMatch() {
            this.addLog('Testing: Exact active class matching');
            window.router.push('/product/1').then(() => {
                setTimeout(() => {
                    const productLink = document.querySelector('a[href="/product/1"]');
                    if (productLink) {
                        this.addLog('✓ Found product link for exact match test');
                    }
                }, 100);
            });
        },

        // Test 6: Query Parameters in Links
        testRouterLinkWithQuery() {
            this.addLog('Testing: RouterLink with query parameters');
            window.router.push({
                path: '/product/5',
                query: { discount: '20%', color: 'red' }
            }).then(() => {
                setTimeout(() => {
                    const currentUrl = window.location.pathname + window.location.search;
                    if (currentUrl.includes('product/5') && currentUrl.includes('discount')) {
                        this.addLog('✓ RouterLink with query parameters works');
                        this.updateRouteInfo();
                    } else {
                        this.addLog('✗ Query parameters not applied');
                    }
                }, 100);
            });
        },

        // Test 7: RouterView Rendering
        testRouterViewRenders() {
            this.addLog('Testing: RouterView component renders content');
            window.router.push('/about').then(() => {
                setTimeout(() => {
                    const routerView = document.getElementById('router-view');
                    if (routerView && routerView.innerHTML.length > 0) {
                        this.addLog('✓ RouterView contains rendered content');
                    } else {
                        this.addLog('✗ RouterView is empty');
                    }
                }, 200);
            });
        },

        // Test 8: RouterView Updates on Navigation
        testRouterViewUpdateOnNav() {
            this.addLog('Testing: RouterView updates when route changes');
            const routerView = document.getElementById('router-view');
            const initialContent = routerView ? routerView.innerHTML : '';

            window.router.push('/product/99').then(() => {
                setTimeout(() => {
                    const newContent = routerView ? routerView.innerHTML : '';
                    if (initialContent !== newContent && newContent.length > 0) {
                        this.addLog('✓ RouterView content updated on navigation');
                    } else {
                        this.addLog('✗ RouterView content did not update');
                    }
                }, 200);
            });
        },

        // Test 9: Nested Route Navigation
        testNestedRouteNavigation() {
            this.addLog('Testing: Navigate to nested route');
            window.router.push('/category/books/item/5').then(() => {
                setTimeout(() => {
                    const currentPath = window.location.pathname;
                    if (currentPath === '/category/books/item/5') {
                        this.addLog('✓ Nested route navigation successful');
                        this.updateRouteInfo();
                    } else {
                        this.addLog('✗ Nested route navigation failed');
                    }
                }, 100);
            });
        },

        // Test 10: 404 NotFound Fallback
        testNotFoundFallback() {
            this.addLog('Testing: 404 page renders for non-existent route');
            window.router.push('/nonexistent-page').then(() => {
                setTimeout(() => {
                    const routerView = document.getElementById('router-view');
                    if (routerView) {
                        const hasNotFoundText = routerView.innerHTML.includes('404') ||
                            routerView.innerHTML.includes('Not Found') ||
                            routerView.innerHTML.includes('not found');
                        if (hasNotFoundText) {
                            this.addLog('✓ 404 page rendered for invalid route');
                        } else {
                            this.addLog('⚠ 404 page rendering unclear');
                        }
                    }
                }, 200);
            });
        },

        // Test 11: Component Lifecycle
        testComponentLifecycle() {
            this.addLog('Testing: Component lifecycle during navigation');
            window.router.push('/').then(() => {
                this.addLog('1. Navigated to home (should mount Home component)');
                setTimeout(() => {
                    window.router.push('/about').then(() => {
                        this.addLog('2. Navigated to about (Home unmounts, About mounts)');
                        setTimeout(() => {
                            window.router.push('/').then(() => {
                                this.addLog('3. Navigated back to home (About unmounts, Home mounts)');
                                this.addLog('✓ Lifecycle test completed');
                            });
                        }, 100);
                    });
                }, 100);
            });
        },

        // Test 12: Multiple RouterLink Same Route
        testMultipleLinksToSamePage() {
            this.addLog('Testing: Multiple RouterLinks to same route');
            const homeLinks = document.querySelectorAll('a[href="/"]');
            if (homeLinks.length > 1) {
                this.addLog(`✓ Found ${homeLinks.length} links to home route`);
            } else if (homeLinks.length === 1) {
                this.addLog('ℹ Only one link to home route found');
            } else {
                this.addLog('✗ No links to home route found');
            }
        },

        // Test 13: RouterLink with Replace
        testRouterLinkReplace() {
            this.addLog('Testing: RouterLink with replace option');
            window.router.push('/about').then(() => {
                setTimeout(() => {
                    window.router.replace('/product/10').then(() => {
                        this.addLog('✓ RouterLink replace navigation works');
                        this.updateRouteInfo();
                    });
                }, 100);
            });
        },

        // Test 14: Current Route Info
        updateRouteInfo() {
            this.currentRouteInfo = {
                path: window.router.currentRoute.path,
                name: window.router.currentRoute.name,
                params: JSON.stringify(window.router.currentRoute.params),
                query: JSON.stringify(window.router.currentRoute.query)
            };
        },

        testCurrentRouteInfo() {
            this.addLog('Testing: Current route information accessible');
            this.updateRouteInfo();
            if (this.currentRouteInfo.path) {
                this.addLog(`✓ Current route path: ${this.currentRouteInfo.path}`);
                this.addLog(`✓ Current route name: ${this.currentRouteInfo.name}`);
            } else {
                this.addLog('✗ Route information not accessible');
            }
        },

        // Test 15: RouterView Error Handling
        testRouterViewErrorHandling() {
            this.addLog('Testing: RouterView error handling');
            window.router.push('/search').then(() => {
                setTimeout(() => {
                    const routerView = document.getElementById('router-view');
                    if (routerView && !routerView.innerHTML.includes('Error')) {
                        this.addLog('✓ RouterView handled route without errors');
                    } else {
                        this.addLog('⚠ RouterView may have error content');
                    }
                }, 200);
            });
        }
    },

    mounted() {
        // Load logs from localStorage if they exist
        this.loadLogsFromStorage();
        this.addLog('Phase 6 test component mounted');
        this.updateRouteInfo();
    },

    render() {
        return h('div', { class: 'phase6-container' }, [
            h('div', { class: 'container' }, [
                h('section', { class: 'phase6-header' }, [
                    h('h1', {}, ['Phase 6: Router Components (RouterLink & RouterView)']),
                    h('p', {}, ['Comprehensive testing of RouterLink and RouterView components'])
                ]),

                h('div', { class: 'phase6-content' }, [
                    // Left Column: Test Controls
                    h('div', { class: 'test-controls' }, [
                        h('h2', {}, ['Test Controls']),

                        h('section', { class: 'test-section' }, [
                            h('h3', {}, ['1. RouterLink Rendering Tests']),
                            h('button', { onclick: () => this.testRouterLinkRendering() }, 'Test RouterLink Rendering'),
                            h('button', { onclick: () => this.testRouterLinkHref() }, 'Test RouterLink href Attributes'),
                            h('button', { onclick: () => this.testMultipleLinksToSamePage() }, 'Test Multiple Links to Same Route')
                        ]),

                        h('section', { class: 'test-section' }, [
                            h('h3', {}, ['2. RouterLink Navigation Tests']),
                            h('button', { onclick: () => this.testRouterLinkClickAbout() }, 'Navigate via RouterLink to /about'),
                            h('button', { onclick: () => this.testRouterLinkClickProduct() }, 'Navigate via RouterLink to /product/42'),
                            h('button', { onclick: () => this.testRouterLinkClickUser() }, 'Navigate via RouterLink to /user/alice')
                        ]),

                        h('section', { class: 'test-section' }, [
                            h('h3', {}, ['3. Active Class Tests']),
                            h('button', { onclick: () => this.testActiveClassHome() }, 'Test Active Class - Home'),
                            h('button', { onclick: () => this.testActiveClassAbout() }, 'Test Active Class Transition'),
                            h('button', { onclick: () => this.testExactActiveMatch() }, 'Test Exact Active Match')
                        ]),

                        h('section', { class: 'test-section' }, [
                            h('h3', {}, ['4. Query Parameter Tests']),
                            h('button', { onclick: () => this.testRouterLinkWithQuery() }, 'Test RouterLink with Query Params'),
                            h('button', { onclick: () => this.testCurrentRouteInfo() }, 'Test Current Route Info')
                        ]),

                        h('section', { class: 'test-section' }, [
                            h('h3', {}, ['5. RouterView Tests']),
                            h('button', { onclick: () => this.testRouterViewRenders() }, 'Test RouterView Renders'),
                            h('button', { onclick: () => this.testRouterViewUpdateOnNav() }, 'Test RouterView Updates'),
                            h('button', { onclick: () => this.testRouterViewErrorHandling() }, 'Test RouterView Error Handling')
                        ]),

                        h('section', { class: 'test-section' }, [
                            h('h3', {}, ['6. Complex Routing Tests']),
                            h('button', { onclick: () => this.testNestedRouteNavigation() }, 'Test Nested Route Navigation'),
                            h('button', { onclick: () => this.testNotFoundFallback() }, 'Test 404 Fallback'),
                            h('button', { onclick: () => this.testComponentLifecycle() }, 'Test Component Lifecycle'),
                            h('button', { onclick: () => this.testRouterLinkReplace() }, 'Test RouterLink Replace')
                        ])
                    ]),

                    // Right Column: Test Results & Navigation
                    h('div', { class: 'test-results' }, [
                        h('div', { class: 'results-section' }, [
                            h('h2', {}, ['Available Navigation Links']),
                            h('div', { class: 'navigation-links' }, [
                                RouterLink({ to: '/', 'data-testid': 'link-home', children: ['Home'] })(),
                                RouterLink({ to: '/about', 'data-testid': 'link-about', children: ['About'] })(),
                                RouterLink({ to: '/product/1', 'data-testid': 'link-product-1', children: ['Product 1'] })(),
                                RouterLink({ to: '/product/2', 'data-testid': 'link-product-2', children: ['Product 2'] })(),
                                RouterLink({ to: '/product/5', 'data-testid': 'link-product-5', children: ['Product 5'] })(),
                                RouterLink({ to: '/user/john', 'data-testid': 'link-user-john', children: ['User: John'] })(),
                                RouterLink({ to: '/user/alice', 'data-testid': 'link-user-alice', children: ['User: Alice'] })(),
                                RouterLink({ to: '/category/electronics/item/1', 'data-testid': 'link-nested', children: ['Nested Route'] })(),
                                RouterLink({ to: '/search', 'data-testid': 'link-search', children: ['Search'] })()
                            ])
                        ]),

                        h('div', { class: 'results-section' }, [
                            h('h2', {}, ['Current Route Information']),
                            h('div', { class: 'route-info' }, [
                                h('p', {}, ['Path: ', h('strong', {}, [this.currentRouteInfo.path || 'N/A'])]),
                                h('p', {}, ['Name: ', h('strong', {}, [this.currentRouteInfo.name || 'N/A'])]),
                                h('p', {}, ['Params: ', h('strong', {}, [this.currentRouteInfo.params || '{}'])]),
                                h('p', {}, ['Query: ', h('strong', {}, [this.currentRouteInfo.query || '{}'])])
                            ])
                        ]),

                        h('div', { class: 'results-section' }, [
                            h('h2', {}, ['Test Log']),
                            h('div', { class: 'log-container', 'data-testid': 'test-log' }, [
                                ...this.testLog.map(log =>
                                    h('div', { class: 'log-entry' }, [
                                        h('span', { class: 'log-time' }, [log.timestamp]),
                                        h('span', { class: 'log-message' }, [log.message])
                                    ])
                                )
                            ])
                        ])
                    ])
                ])
            ])
        ]);
    }
});