import { h, defineComponent } from '@kalxjs/core';
import ThemeSwitcher from '../components/ThemeSwitcher.js';

export default defineComponent({
    name: 'FeaturesView',

    components: {
        ThemeSwitcher
    },

    data() {
        return {
            categories: [
                {
                    title: 'Core Framework',
                    features: [
                        { name: 'Virtual DOM', description: 'Efficient DOM updates with virtual DOM diffing', icon: '🔄' },
                        { name: 'Component System', description: 'Modular, reusable component architecture', icon: '🧩' },
                        { name: 'Reactive Data', description: 'Automatic UI updates when data changes', icon: '⚡' },
                        { name: 'Lifecycle Hooks', description: 'Control component behavior at every stage', icon: '🎯' }
                    ]
                },
                {
                    title: 'Routing & Navigation',
                    features: [
                        { name: 'Client-Side Routing', description: 'Built-in routing system with hash and history modes', icon: '🧭' },
                        { name: 'Dynamic Routes', description: 'Route parameters and query strings support', icon: '🔗' },
                        { name: 'Navigation Guards', description: 'Control navigation flow with guards', icon: '🛡️' },
                        { name: 'Lazy Loading', description: 'Load components on-demand for better performance', icon: '📦' }
                    ]
                },
                {
                    title: 'State Management',
                    features: [
                        { name: 'Centralized Store', description: 'Global state management for complex apps', icon: '🏪' },
                        { name: 'Reactive Store', description: 'Automatic tracking and updates', icon: '📡' },
                        { name: 'Actions & Mutations', description: 'Predictable state mutations with clear intent', icon: '📝' },
                        { name: 'Time Travel Debugging', description: 'Debug with DevTools extension', icon: '⏱️' }
                    ]
                },
                {
                    title: 'Developer Experience',
                    features: [
                        { name: 'DevTools Extension', description: 'Chrome extension for advanced debugging', icon: '🛠️' },
                        { name: 'Hot Module Reloading', description: 'Fast development with HMR support', icon: '🔥' },
                        { name: 'TypeScript Support', description: 'Full TypeScript support with type safety', icon: '📘' },
                        { name: 'CLI Tools', description: 'Generate projects, components, and pages', icon: '⌨️' }
                    ]
                }
            ],
            expandedCategory: null,
            showBackToTop: false
        };
    },

    mounted() {
        // Add scroll listener for back-to-top button
        window.addEventListener('scroll', this.handleScroll);

        // Animate content in
        setTimeout(() => {
            this.$update();
        }, 100);
    },

    beforeUnmount() {
        window.removeEventListener('scroll', this.handleScroll);
    },

    methods: {
        handleScroll() {
            this.showBackToTop = window.scrollY > 300;
            this.$update();
        },

        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },

        toggleCategory(index) {
            this.expandedCategory = this.expandedCategory === index ? null : index;
            this.$update();
        },

        navigateToHome(e) {
            e.preventDefault();

            // Add a small animation before navigation
            const featuresView = document.querySelector('.features-view');
            if (featuresView) {
                featuresView.classList.add('fade-out');

                setTimeout(() => {
                    window.router.push('/');
                }, 300);
            } else {
                window.router.push('/');
            }
        }
    },

    render() {
        return h('div', { class: 'features-view fade-in' }, [
            h('div', { class: 'container' }, [
                // Header section
                h('header', { class: 'page-header flex flex-between' }, [
                    h('div', { class: 'logo' }, [
                        h('h1', { class: 'logo-text' }, ['KalxJS']),
                        h('span', { class: 'logo-tagline' }, ['Modern JavaScript Framework'])
                    ]),

                    // Theme switcher component
                    h(ThemeSwitcher)
                ]),

                // Features section
                h('section', { class: 'features-showcase-section' }, [
                    h('h2', { class: 'section-title' }, ['Explore Features']),

                    h('p', { class: 'section-subtitle' }, [
                        'Discover the powerful features that make KalxJS the perfect choice for modern web development'
                    ]),

                    // Features by category
                    h('div', { class: 'features-categories' },
                        this.categories.map((category, catIndex) =>
                            h('div', {
                                class: `feature-category-card ${this.expandedCategory === catIndex ? 'expanded' : ''}`,
                                onClick: () => this.toggleCategory(catIndex)
                            }, [
                                h('div', { class: 'category-header' }, [
                                    h('h3', { class: 'category-title' }, [category.title]),
                                    h('span', { class: 'expand-icon' }, [this.expandedCategory === catIndex ? '▼' : '▶'])
                                ]),

                                this.expandedCategory === catIndex ? h('div', { class: 'category-features fade-in' },
                                    category.features.map((feature, featureIndex) =>
                                        h('div', {
                                            class: 'feature-item',
                                            style: `animation-delay: ${featureIndex * 50}ms`
                                        }, [
                                            h('div', { class: 'feature-icon' }, [feature.icon]),
                                            h('div', { class: 'feature-info' }, [
                                                h('h4', { class: 'feature-name' }, [feature.name]),
                                                h('p', { class: 'feature-description' }, [feature.description])
                                            ])
                                        ])
                                    )
                                ) : null
                            ])
                        )
                    )
                ]),

                // Key highlights section
                h('section', { class: 'highlights-section mt-4' }, [
                    h('h2', { class: 'section-title' }, ['Why Choose KalxJS?']),

                    h('div', { class: 'highlights-grid' }, [
                        h('div', { class: 'highlight-card' }, [
                            h('div', { class: 'highlight-icon' }, ['⚡']),
                            h('h3', {}, ['Lightning Fast']),
                            h('p', {}, ['Optimized virtual DOM and reactive system for peak performance'])
                        ]),

                        h('div', { class: 'highlight-card' }, [
                            h('div', { class: 'highlight-icon' }, ['📚']),
                            h('h3', {}, ['Easy to Learn']),
                            h('p', {}, ['Simple API inspired by modern frameworks, comprehensive documentation'])
                        ]),

                        h('div', { class: 'highlight-card' }, [
                            h('div', { class: 'highlight-icon' }, ['🎨']),
                            h('h3', {}, ['Highly Flexible']),
                            h('p', {}, ['Build anything from small widgets to large-scale applications'])
                        ]),

                        h('div', { class: 'highlight-card' }, [
                            h('div', { class: 'highlight-icon' }, ['🔒']),
                            h('h3', {}, ['Type Safe']),
                            h('p', {}, ['Full TypeScript support with excellent type inference'])
                        ])
                    ])
                ]),

                // Navigation
                h('div', { class: 'navigation-container text-center mt-4' }, [
                    h('a', {
                        class: 'btn btn-outline',
                        href: '/',
                        onClick: this.navigateToHome
                    }, ['Back to Home'])
                ]),

                // Back to top button
                this.showBackToTop ? h('button', {
                    class: 'back-to-top-btn',
                    onClick: this.scrollToTop
                }, ['↑']) : null
            ])
        ]);
    }
});