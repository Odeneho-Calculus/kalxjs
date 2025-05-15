import { h, defineComponent, onMounted } from '@kalxjs/core';

export default defineComponent({
    name: 'App',

    // Component setup with composition API
    setup() {
        console.log('App component setup called');

        // Function to navigate programmatically
        const navigateTo = (path) => {
            console.log(`Navigating to: ${path}`);
            if (window.router) {
                window.router.push(path);
            } else {
                console.warn('Router not available');
                window.location.hash = path;
            }
        };

        // Lifecycle hooks
        onMounted(() => {
            console.log('App component mounted');

            // Make sure the router view container is available
            const routerViewContainer = document.getElementById('router-view');
            if (routerViewContainer && window.router) {
                console.log('Router view container found, initializing router view');

                // Force an initial navigation to the current route
                const currentPath = window.location.hash.slice(1) || '/';
                window.router.push(currentPath);
            }
        });

        return {
            navigateTo
        };
    },

    // Add render function to ensure it works properly
    render() {
        return h('div', { class: 'app' }, [
            h('header', { class: 'app-header' }, [
                h('div', { class: 'logo-container' }, [
                    h('img', { src: './assets/logo.svg', alt: 'KalxJS Logo', class: 'logo' }),
                    h('h1', { class: 'app-title' }, ['PROJECT_NAME'])
                ]),

                h('nav', { class: 'app-nav' }, [
                    h('a', {
                        href: '/',
                        class: 'nav-link',
                        onClick: (e) => {
                            e.preventDefault();
                            this.navigateTo('/');
                        }
                    }, ['Home']),
                    h('a', {
                        href: '/about',
                        class: 'nav-link',
                        onClick: (e) => {
                            e.preventDefault();
                            this.navigateTo('/about');
                        }
                    }, ['About'])
                ])
            ]),

            h('main', { class: 'app-main' }, [
                // Feature information section
                h('section', { class: 'features-section' }, [
                    h('h2', null, ['Enabled Features:']),
                    h('ul', { class: 'features-list' }, [
                        h('li', { class: 'feature-item router' }, ['✓ Router']),
                        h('li', { class: 'feature-item state' }, ['✓ State Management']),
                        h('li', { class: 'feature-item scss' }, ['✓ SCSS Support']),
                        h('li', { class: 'feature-item sfc' }, ['✓ Single File Components']),
                        h('li', { class: 'feature-item api' }, ['✓ API Integration']),
                        h('li', { class: 'feature-item composition' }, ['✓ Composition API']),
                        h('li', { class: 'feature-item performance' }, ['✓ Performance Utilities']),
                        h('li', { class: 'feature-item plugins' }, ['✓ Plugin System']),
                        h('li', { class: 'feature-item testing' }, ['✓ Testing']),
                        h('li', { class: 'feature-item linting' }, ['✓ Linting'])
                    ])
                ]),

                // Router view container
                h('section', { class: 'router-view-container' }, [
                    h('div', { id: 'router-view' })
                ])
            ]),

            h('footer', { class: 'app-footer' }, [
                h('p', null, ['Powered by KalxJS'])
            ])
        ]);
    }
});