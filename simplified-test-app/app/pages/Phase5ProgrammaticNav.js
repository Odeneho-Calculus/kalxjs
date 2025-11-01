import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
    name: 'Phase5ProgrammaticNav',

    data() {
        return {
            navigationLog: [],
            currentUrl: '',
            testResults: {}
        };
    },

    methods: {
        addLog(message) {
            this.navigationLog.push({
                timestamp: new Date().toLocaleTimeString(),
                message
            });
            // Keep only last 20 logs
            if (this.navigationLog.length > 20) {
                this.navigationLog.shift();
            }
        },

        // Test 1: router.push() Method
        testPushString() {
            this.addLog('Testing: router.push("/about")');
            window.router.push('/about').then(() => {
                this.addLog('✓ Push to /about completed');
                this.currentUrl = window.location.pathname;
            });
        },

        testPushObject() {
            this.addLog('Testing: router.push({ path: "/product/1" })');
            window.router.push({ path: '/product/1' }).then(() => {
                this.addLog('✓ Push with object completed');
                this.currentUrl = window.location.pathname;
            });
        },

        testPushByName() {
            this.addLog('Testing: router.push({ name: "home" })');
            window.router.push({ name: 'home' }).then(() => {
                this.addLog('✓ Push by name completed');
                this.currentUrl = window.location.pathname;
            });
        },

        testPushPromise() {
            this.addLog('Testing: router.push().then() - Promise handling');
            const promise = window.router.push('/about');
            if (promise && typeof promise.then === 'function') {
                this.addLog('✓ Push returns a Promise');
                promise.then(() => {
                    this.addLog('✓ Promise resolved after navigation');
                }).catch((err) => {
                    this.addLog('✗ Promise rejected: ' + err.message);
                });
            } else {
                this.addLog('✗ Push does not return a Promise');
            }
        },

        testPushWithQuery() {
            this.addLog('Testing: router.push({ path: "/product/1", query: { discount: "10%" } })');
            window.router.push({
                path: '/product/1',
                query: { discount: '10%', color: 'red' }
            }).then(() => {
                this.addLog('✓ Push with query parameters completed');
                this.currentUrl = window.location.pathname + window.location.search;
            });
        },

        // Test 2: router.replace() Method
        testReplaceString() {
            this.addLog('Testing: router.replace("/about") - no history entry');
            window.router.replace('/about').then(() => {
                this.addLog('✓ Replace to /about completed (should skip in history)');
                this.currentUrl = window.location.pathname;
            });
        },

        testReplaceWithParams() {
            this.addLog('Testing: router.replace("/user/john") - with params');
            window.router.replace('/user/john').then(() => {
                this.addLog('✓ Replace with params completed');
                this.currentUrl = window.location.pathname;
            });
        },

        testReplaceVsPush() {
            this.addLog('Testing: Push to /product/1, then Replace to /product/2');
            window.router.push('/product/1').then(() => {
                this.addLog('✓ Pushed to /product/1');
                setTimeout(() => {
                    window.router.replace('/product/2').then(() => {
                        this.addLog('✓ Replaced with /product/2 (back should skip to previous history)');
                    });
                }, 300);
            });
        },

        // Test 3: router.go() Method
        testGoForward() {
            this.addLog('Testing: router.go(1) - move forward one entry');
            if (window.router.go) {
                window.router.go(1);
                this.addLog('✓ router.go(1) called');
                setTimeout(() => {
                    this.currentUrl = window.location.pathname;
                }, 100);
            }
        },

        testGoBackOne() {
            this.addLog('Testing: router.go(-1) - move back one entry');
            if (window.router.go) {
                window.router.go(-1);
                this.addLog('✓ router.go(-1) called');
                setTimeout(() => {
                    this.currentUrl = window.location.pathname;
                }, 100);
            }
        },

        testGoBackMultiple() {
            this.addLog('Testing: router.go(-2) - move back multiple entries');
            if (window.router.go) {
                window.router.go(-2);
                this.addLog('✓ router.go(-2) called');
                setTimeout(() => {
                    this.currentUrl = window.location.pathname;
                }, 100);
            }
        },

        testGoReload() {
            this.addLog('Testing: router.go(0) - reload current route');
            if (window.router.go) {
                window.router.go(0);
                this.addLog('✓ router.go(0) called (reload)');
            }
        },

        // Test 4: router.back() Method
        testBackSimple() {
            this.addLog('Testing: router.back() - navigate to previous route');
            window.router.back();
            this.addLog('✓ router.back() called');
            setTimeout(() => {
                this.currentUrl = window.location.pathname;
            }, 100);
        },

        testBackMultiple() {
            this.addLog('Testing: Multiple router.back() calls');
            window.router.push('/about').then(() => {
                this.addLog('  1. Navigated to /about');
                setTimeout(() => {
                    window.router.push('/product/1').then(() => {
                        this.addLog('  2. Navigated to /product/1');
                        setTimeout(() => {
                            window.router.back();
                            this.addLog('  3. Called back() - should go to /about');
                            setTimeout(() => {
                                window.router.back();
                                this.addLog('  4. Called back() again - should go to /');
                            }, 200);
                        }, 200);
                    });
                }, 200);
            });
        },

        // Test 5: router.forward() Method
        testForwardSimple() {
            this.addLog('Testing: router.forward() - navigate to next route in history');
            window.router.back();
            setTimeout(() => {
                window.router.forward();
                this.addLog('✓ router.forward() called');
                setTimeout(() => {
                    this.currentUrl = window.location.pathname;
                }, 100);
            }, 100);
        },

        testForwardAfterBack() {
            this.addLog('Testing: back() then forward() - should restore');
            const originalPath = window.location.pathname;
            window.router.back();
            setTimeout(() => {
                this.addLog('  1. Called back()');
                window.router.forward();
                this.addLog('  2. Called forward() - should restore original path');
                setTimeout(() => {
                    this.currentUrl = window.location.pathname;
                }, 100);
            }, 100);
        },

        // Test 6: Navigation with Route Objects
        testNavigateWithPathAndParams() {
            this.addLog('Testing: navigate with { path, params, query }');
            window.router.push({
                path: '/user/bob',
                query: { tab: 'settings', view: 'full' }
            }).then(() => {
                this.addLog('✓ Navigation with path and query completed');
                this.currentUrl = window.location.pathname + window.location.search;
            });
        },

        testNavigateByNameWithParams() {
            this.addLog('Testing: navigate by { name, params }');
            window.router.push({
                name: 'product',
                query: { highlight: 'true' }
            }).then(() => {
                this.addLog('✓ Navigation by name with query completed');
                this.currentUrl = window.location.pathname + window.location.search;
            });
        },

        // Test 7: Navigation Promise Handling
        testPromiseResolve() {
            this.addLog('Testing: Promise resolves after component mounts');
            window.router.push('/about').then(() => {
                this.addLog('✓ Promise resolved - component should be mounted');
                setTimeout(() => {
                    const routerView = document.getElementById('router-view');
                    if (routerView && routerView.innerHTML.length > 0) {
                        this.addLog('✓ Router view contains content');
                    }
                }, 100);
            });
        },

        testPromiseChain() {
            this.addLog('Testing: Chaining multiple navigations');
            window.router.push('/about')
                .then(() => {
                    this.addLog('✓ Step 1: Navigated to /about');
                    return window.router.push('/product/1');
                })
                .then(() => {
                    this.addLog('✓ Step 2: Navigated to /product/1');
                    return window.router.push('/user/jane');
                })
                .then(() => {
                    this.addLog('✓ Step 3: Navigated to /user/jane');
                    this.currentUrl = window.location.pathname;
                });
        },

        testRapidNavigations() {
            this.addLog('Testing: Rapid consecutive push calls');
            window.router.push('/about');
            window.router.push('/product/1');
            window.router.push('/user/alice');
            window.router.push('/');
            this.addLog('✓ 4 rapid push calls queued');
            setTimeout(() => {
                this.currentUrl = window.location.pathname;
                this.addLog('Current URL after rapid navigations: ' + this.currentUrl);
            }, 500);
        },

        // Test 8: Navigation to same route
        testNavigateToSameRoute() {
            this.addLog('Testing: Navigation to same route');
            const currentPath = window.location.pathname;
            window.router.push(currentPath).then(() => {
                this.addLog('✓ Pushed to same route: ' + currentPath);
            }).catch((err) => {
                this.addLog('ℹ Navigation to same route (handled): ' + (err?.message || 'no change'));
            });
        },

        // Test 9: Edge case - Navigate to parent from child
        testNavigateToParent() {
            this.addLog('Testing: Navigate from child to parent route');
            window.router.push('/category/electronics/item/1').then(() => {
                this.addLog('✓ Navigated to child route');
                setTimeout(() => {
                    window.router.push('/').then(() => {
                        this.addLog('✓ Navigated back to parent (home)');
                    });
                }, 200);
            });
        },

        // Test 10: Complex navigation scenario
        testComplexNavigation() {
            this.addLog('Testing: Complex navigation scenario');
            this.addLog('Step 1: Navigate to home');
            window.router.push('/').then(() => {
                setTimeout(() => {
                    this.addLog('Step 2: Navigate to about');
                    window.router.push('/about').then(() => {
                        setTimeout(() => {
                            this.addLog('Step 3: Navigate to product with query');
                            window.router.push({
                                path: '/product/2',
                                query: { view: 'detailed' }
                            }).then(() => {
                                setTimeout(() => {
                                    this.addLog('Step 4: Use back button');
                                    window.router.back();
                                    setTimeout(() => {
                                        this.addLog('✓ Complex navigation scenario completed');
                                        this.currentUrl = window.location.pathname;
                                    }, 100);
                                }, 200);
                            });
                        }, 200);
                    });
                }, 200);
            });
        }
    },

    mounted() {
        this.currentUrl = window.location.pathname;
        this.addLog('Phase 5 Testing Page Loaded');
        this.addLog('Ready to test Navigation Methods & Programmatic Control');
    },

    render() {
        return h('div', { class: 'phase5-testing' }, [
            h('div', { class: 'container' }, [
                h('h1', {}, ['Phase 5: Navigation Methods & Programmatic Control']),

                h('div', { class: 'testing-grid' }, [
                    // Test 1: router.push()
                    h('section', { class: 'test-card' }, [
                        h('h2', {}, ['Test 1: router.push() Method']),
                        h('p', {}, ['Test string path, object path, and named route navigation']),
                        h('div', { class: 'button-group' }, [
                            h('button', { onclick: () => this.testPushString() }, 'Push: String Path'),
                            h('button', { onclick: () => this.testPushObject() }, 'Push: Object Path'),
                            h('button', { onclick: () => this.testPushByName() }, 'Push: By Name'),
                            h('button', { onclick: () => this.testPushPromise() }, 'Push: Check Promise'),
                            h('button', { onclick: () => this.testPushWithQuery() }, 'Push: With Query')
                        ])
                    ]),

                    // Test 2: router.replace()
                    h('section', { class: 'test-card' }, [
                        h('h2', {}, ['Test 2: router.replace() Method']),
                        h('p', {}, ['Replace without adding history entry']),
                        h('div', { class: 'button-group' }, [
                            h('button', { onclick: () => this.testReplaceString() }, 'Replace: String'),
                            h('button', { onclick: () => this.testReplaceWithParams() }, 'Replace: With Params'),
                            h('button', { onclick: () => this.testReplaceVsPush() }, 'Replace: vs Push')
                        ])
                    ]),

                    // Test 3: router.go()
                    h('section', { class: 'test-card' }, [
                        h('h2', {}, ['Test 3: router.go() Method']),
                        h('p', {}, ['Navigate through history by entry count']),
                        h('div', { class: 'button-group' }, [
                            h('button', { onclick: () => this.testGoForward() }, 'Go: Forward (+1)'),
                            h('button', { onclick: () => this.testGoBackOne() }, 'Go: Back (-1)'),
                            h('button', { onclick: () => this.testGoBackMultiple() }, 'Go: Back (-2)'),
                            h('button', { onclick: () => this.testGoReload() }, 'Go: Reload (0)')
                        ])
                    ]),

                    // Test 4: router.back()
                    h('section', { class: 'test-card' }, [
                        h('h2', {}, ['Test 4: router.back() Method']),
                        h('p', {}, ['Navigate to previous route']),
                        h('div', { class: 'button-group' }, [
                            h('button', { onclick: () => this.testBackSimple() }, 'Back: Simple'),
                            h('button', { onclick: () => this.testBackMultiple() }, 'Back: Multiple Steps')
                        ])
                    ]),

                    // Test 5: router.forward()
                    h('section', { class: 'test-card' }, [
                        h('h2', {}, ['Test 5: router.forward() Method']),
                        h('p', {}, ['Navigate to next route in history']),
                        h('div', { class: 'button-group' }, [
                            h('button', { onclick: () => this.testForwardSimple() }, 'Forward: Simple'),
                            h('button', { onclick: () => this.testForwardAfterBack() }, 'Forward: After Back')
                        ])
                    ]),

                    // Test 6: Route Objects
                    h('section', { class: 'test-card' }, [
                        h('h2', {}, ['Test 6: Navigation with Route Objects']),
                        h('p', {}, ['Navigate using structured route objects']),
                        h('div', { class: 'button-group' }, [
                            h('button', { onclick: () => this.testNavigateWithPathAndParams() }, 'Route Object: Path + Query'),
                            h('button', { onclick: () => this.testNavigateByNameWithParams() }, 'Route Object: Name + Query')
                        ])
                    ]),

                    // Test 7: Promise Handling
                    h('section', { class: 'test-card' }, [
                        h('h2', {}, ['Test 7: Navigation Promise Handling']),
                        h('p', {}, ['Test promise resolution and chaining']),
                        h('div', { class: 'button-group' }, [
                            h('button', { onclick: () => this.testPromiseResolve() }, 'Promise: Resolve Check'),
                            h('button', { onclick: () => this.testPromiseChain() }, 'Promise: Chain 3 Navigations'),
                            h('button', { onclick: () => this.testRapidNavigations() }, 'Promise: Rapid Calls (4x)')
                        ])
                    ]),

                    // Test 8: Edge Cases
                    h('section', { class: 'test-card' }, [
                        h('h2', {}, ['Test 8: Edge Cases']),
                        h('p', {}, ['Test edge case scenarios']),
                        h('div', { class: 'button-group' }, [
                            h('button', { onclick: () => this.testNavigateToSameRoute() }, 'Edge: Same Route'),
                            h('button', { onclick: () => this.testNavigateToParent() }, 'Edge: Parent Navigation'),
                            h('button', { onclick: () => this.testComplexNavigation() }, 'Edge: Complex Scenario')
                        ])
                    ])
                ]),

                // Navigation Log
                h('section', { class: 'log-section' }, [
                    h('h3', {}, ['Navigation Log']),
                    h('div', { class: 'log-container' }, [
                        h('div', { class: 'current-url' }, [
                            h('strong', {}, ['Current URL: ']),
                            h('code', {}, [this.currentUrl || window.location.pathname])
                        ]),
                        h('div', { class: 'log-entries' }, [
                            this.navigationLog.map((entry, index) =>
                                h('div', { key: index, class: 'log-entry' }, [
                                    h('span', { class: 'log-time' }, [entry.timestamp]),
                                    h('span', { class: 'log-message' }, [entry.message])
                                ])
                            )
                        ])
                    ])
                ])
            ])
        ]);
    }
});