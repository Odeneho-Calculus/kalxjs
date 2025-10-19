/**
 * KALXJS Priority 1 - Components Demo
 * Demonstrates Suspense, Teleport, ErrorBoundary, Fragment
 */

import {
    h,
    createApp,
    Suspense,
    useSuspense,
    Teleport,
    usePortal,
    ErrorBoundary,
    useErrorHandler,
    Fragment,
    ref,
    reactive
} from '@kalxjs/core';

// ============================================
// 1. Suspense Component Demo
// ============================================

// Async component
const AsyncUserProfile = {
    async setup() {
        // Simulate API call
        const data = await fetch('/api/user/123').then(r => r.json());

        return () => h('div', { class: 'user-profile' }, [
            h('h2', {}, data.name),
            h('p', {}, data.email)
        ]);
    }
};

// Using Suspense
const SuspenseDemo = {
    setup() {
        return () => h(Suspense, {
            fallback: h('div', { class: 'loading' }, 'Loading user...'),
            onResolve: () => console.log('User loaded!'),
            onError: (error) => console.error('Error loading user:', error)
        }, {
            default: () => h(AsyncUserProfile),
            error: ({ error, retry }) => h('div', {}, [
                h('p', {}, `Error: ${error.message}`),
                h('button', { onClick: retry }, 'Retry')
            ])
        });
    }
};

// Using useSuspense hook
const UserComponent = {
    setup() {
        const { data, loading, error, execute } = useSuspense(
            async () => fetch('/api/user').then(r => r.json())
        );

        // Load on mount
        execute();

        return () => {
            if (loading.value) {
                return h('div', {}, 'Loading...');
            }

            if (error.value) {
                return h('div', {}, `Error: ${error.value.message}`);
            }

            return h('div', {}, [
                h('h2', {}, data.value?.name),
                h('button', { onClick: execute }, 'Reload')
            ]);
        };
    }
};

// ============================================
// 2. Teleport Component Demo
// ============================================

const ModalComponent = {
    setup() {
        const isOpen = ref(false);

        return () => h('div', {}, [
            h('button', {
                onClick: () => isOpen.value = true
            }, 'Open Modal'),

            isOpen.value && h(Teleport, { to: 'body' }, {
                default: () => h('div', {
                    class: 'modal-overlay',
                    onClick: () => isOpen.value = false
                }, [
                    h('div', {
                        class: 'modal',
                        onClick: (e) => e.stopPropagation()
                    }, [
                        h('h2', {}, 'Modal Title'),
                        h('p', {}, 'Modal content goes here'),
                        h('button', {
                            onClick: () => isOpen.value = false
                        }, 'Close')
                    ])
                ])
            })
        ]);
    }
};

// Using usePortal hook
const NotificationComponent = {
    setup() {
        const portal = usePortal('#notifications');

        const showNotification = (message) => {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;

            portal.open(notification);

            setTimeout(() => {
                portal.close();
            }, 3000);
        };

        return () => h('div', {}, [
            h('button', {
                onClick: () => showNotification('Hello from Portal!')
            }, 'Show Notification')
        ]);
    }
};

// ============================================
// 3. Error Boundary Demo
// ============================================

// Component that might throw error
const BuggyComponent = {
    setup() {
        const shouldThrow = ref(false);

        return () => {
            if (shouldThrow.value) {
                throw new Error('Oops! Something went wrong');
            }

            return h('div', {}, [
                h('p', {}, 'This component is working fine'),
                h('button', {
                    onClick: () => shouldThrow.value = true
                }, 'Trigger Error')
            ]);
        };
    }
};

// Using ErrorBoundary
const ErrorBoundaryDemo = {
    setup() {
        const handleError = (error, errorInfo) => {
            console.error('Error caught by boundary:', error);
            console.error('Error info:', errorInfo);

            // Send to error tracking service
            // trackError(error, errorInfo);
        };

        return () => h(ErrorBoundary, {
            onError: handleError,
            fallback: ({ error, reset }) => h('div', {
                class: 'error-container',
                style: {
                    padding: '20px',
                    border: '2px solid red',
                    borderRadius: '8px',
                    backgroundColor: '#ffe0e0'
                }
            }, [
                h('h2', {}, '⚠️ Something went wrong'),
                h('p', {}, error.message),
                h('button', {
                    onClick: reset,
                    style: {
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }
                }, 'Try Again')
            ])
        }, {
            default: () => h(BuggyComponent)
        });
    }
};

// Using useErrorHandler hook
const SafeComponent = {
    setup() {
        const { error, hasError, clearError, retry } = useErrorHandler();

        const riskyOperation = async () => {
            await retry(async () => {
                // Might fail
                if (Math.random() > 0.5) {
                    throw new Error('Random error!');
                }
                console.log('Success!');
            });
        };

        return () => h('div', {}, [
            hasError.value && h('div', { class: 'error' }, [
                h('p', {}, error.value?.message),
                h('button', { onClick: clearError }, 'Clear Error')
            ]),

            h('button', {
                onClick: riskyOperation
            }, 'Run Risky Operation')
        ]);
    }
};

// ============================================
// 4. Fragment Demo
// ============================================

// Component with multiple root nodes
const MultiRootComponent = {
    setup() {
        return () => h(Fragment, { key: 'multi-root' }, [
            h('header', {}, 'Header'),
            h('main', {}, 'Main Content'),
            h('footer', {}, 'Footer')
        ]);
    }
};

// List with fragments
const ListComponent = {
    setup() {
        const items = reactive([
            { id: 1, title: 'Item 1', description: 'Description 1' },
            { id: 2, title: 'Item 2', description: 'Description 2' },
            { id: 3, title: 'Item 3', description: 'Description 3' }
        ]);

        return () => h('div', { class: 'list' },
            items.map(item => h(Fragment, { key: item.id }, [
                h('h3', {}, item.title),
                h('p', {}, item.description)
            ]))
        );
    }
};

// ============================================
// 5. Complete App Example
// ============================================

const CompleteApp = {
    setup() {
        const currentTab = ref('suspense');

        const tabs = {
            suspense: SuspenseDemo,
            teleport: ModalComponent,
            errorBoundary: ErrorBoundaryDemo,
            fragment: MultiRootComponent
        };

        return () => h('div', { class: 'app' }, [
            h('nav', { class: 'tabs' }, [
                h('button', {
                    onClick: () => currentTab.value = 'suspense',
                    class: currentTab.value === 'suspense' ? 'active' : ''
                }, 'Suspense'),
                h('button', {
                    onClick: () => currentTab.value = 'teleport',
                    class: currentTab.value === 'teleport' ? 'active' : ''
                }, 'Teleport'),
                h('button', {
                    onClick: () => currentTab.value = 'errorBoundary',
                    class: currentTab.value === 'errorBoundary' ? 'active' : ''
                }, 'Error Boundary'),
                h('button', {
                    onClick: () => currentTab.value = 'fragment',
                    class: currentTab.value === 'fragment' ? 'active' : ''
                }, 'Fragment')
            ]),

            h('div', { class: 'content' }, [
                h(tabs[currentTab.value])
            ])
        ]);
    }
};

// Create and mount the app
const app = createApp(CompleteApp);
app.mount('#app');

console.log('✅ Components demo initialized!');