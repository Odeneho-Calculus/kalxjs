import { defineComponent, h } from '@kalxjs/core';

export default defineComponent({
    name: 'App',

    data() {
        return {
            isLoading: true
        };
    },

    mounted() {
        console.log('App component mounted');

        // Simulate loading
        setTimeout(() => {
            this.isLoading = false;

            // Extract and execute the script from welcome.klx
            this.loadWelcomeScript();
        }, 500);
    },

    methods: {
        async loadWelcomeScript() {
            try {
                // Fetch the welcome.klx file
                const response = await fetch('/src/components/welcome.klx');
                if (!response.ok) {
                    throw new Error(`Failed to load welcome component: ${response.status}`);
                }

                const content = await response.text();

                // Extract the script part
                const scriptMatch = /<script>([\s\S]*?)<\/script>/i.exec(content);
                if (scriptMatch) {
                    const script = scriptMatch[1].trim();

                    // Create a script element and execute it
                    const scriptElement = document.createElement('script');
                    scriptElement.textContent = script;
                    document.head.appendChild(scriptElement);

                    console.log('Welcome component script loaded');
                } else {
                    console.error('No script section found in welcome.klx');
                }
            } catch (error) {
                console.error('Error loading welcome component script:', error);
            }
        }
    },

    render() {
        console.log('App component render called');

        if (this.isLoading) {
            return h('div', { class: 'loading' }, [
                h('div', { class: 'loading-spinner' }),
                h('h2', {}, ['Loading KalxJS App']),
                h('p', {}, ['Initializing components...'])
            ]);
        }

        // Return the welcome component structure with modern UI
        return h('div', { class: 'app-container' }, [
            h('div', { class: 'welcome-container' }, [
                // Header with animated elements
                h('div', { class: 'welcome-header' }, [
                    h('img', { src: '/src/assets/logo.svg', alt: 'KalxJS Logo', class: 'welcome-logo' }),
                    h('h1', {}, ['Welcome to ', h('span', { class: 'brand-name' }, ['KalxJS'])])
                ]),

                // Content with enhanced styling
                h('div', { class: 'welcome-content' }, [
                    h('p', { class: 'welcome-message' }, [
                        'kalculus! You\'ve successfully created a new KalxJS project with modern dark theme!'
                    ]),

                    // Feature grid with predefined features
                    h('div', { class: 'feature-grid', id: 'feature-grid' }, [
                        // Pre-render some features for immediate display
                        h('div', { class: 'feature-card' }, [
                            h('h3', {}, ['📝 Template-Based Rendering']),
                            h('p', {}, ['Use HTML templates directly with no virtual DOM overhead'])
                        ]),
                        h('div', { class: 'feature-card' }, [
                            h('h3', {}, ['⚡ Reactive State']),
                            h('p', {}, ['Powerful state management with automatic DOM updates'])
                        ]),
                        h('div', { class: 'feature-card' }, [
                            h('h3', {}, ['🧩 Component System']),
                            h('p', {}, ['Create reusable components with clean APIs'])
                        ]),
                        h('div', { class: 'feature-card' }, [
                            h('h3', {}, ['🔄 Routing']),
                            h('p', {}, ['Seamless navigation between different views'])
                        ])
                    ]),

                    // Enhanced Counter demo with modern UI
                    h('div', { class: 'counter-demo' }, [
                        h('h2', {}, ['Interactive Counter Demo']),
                        h('div', { class: 'counter-value', id: 'counter-value' }, ['0']),
                        h('div', { class: 'counter-buttons' }, [
                            h('button', {
                                class: 'counter-button',
                                id: 'decrement-button',
                                onClick: () => window.decrementCounter && window.decrementCounter(),
                                'aria-label': 'Decrement counter'
                            }, ['-']),
                            h('button', {
                                class: 'counter-button reset',
                                id: 'reset-button',
                                onClick: () => window.resetCounter && window.resetCounter(),
                                'aria-label': 'Reset counter'
                            }, ['Reset']),
                            h('button', {
                                class: 'counter-button',
                                id: 'increment-button',
                                onClick: () => window.incrementCounter && window.incrementCounter(),
                                'aria-label': 'Increment counter'
                            }, ['+'])
                        ]),
                        h('div', { class: 'counter-info' }, [
                            h('div', { class: 'stat-item' }, [
                                h('div', { class: 'stat-label' }, ['Double Count:']),
                                h('div', { class: 'stat-value', id: 'double-count' }, ['0'])
                            ]),
                            h('div', { class: 'stat-item' }, [
                                h('div', { class: 'stat-label' }, ['Is Even:']),
                                h('div', { class: 'stat-value', id: 'is-even' }, ['Yes'])
                            ])
                        ]),
                        h('p', { class: 'counter-description' }, [
                            'This counter demonstrates reactive state management in KalxJS. Try clicking the buttons to see the state update in real-time.'
                        ])
                    ]),

                    // Enhanced Getting Started section
                    h('div', { class: 'getting-started' }, [
                        h('h2', {}, ['Getting Started']),
                        h('p', { class: 'getting-started-intro' }, [
                            'Start building your next project with KalxJS in just a few simple steps:'
                        ]),
                        h('div', { class: 'code-block' }, [
                            h('pre', {}, [
                                h('code', {}, [
                                    '// Create a new KalxJS project\n',
                                    'npm init kalx my-awesome-app\n\n',
                                    '// Navigate to your project directory\n',
                                    'cd my-awesome-app\n\n',
                                    '// Start the development server\n',
                                    'npm run dev'
                                ])
                            ])
                        ]),

                        // Enhanced Links section
                        h('div', { class: 'links-section' }, [
                            h('h3', {}, ['Essential Resources']),
                            h('div', { class: 'links-grid' }, [
                                h('a', {
                                    href: 'https://github.com/Odeneho-Calculus/kalxjs',
                                    target: '_blank',
                                    class: 'link-card',
                                    rel: 'noopener'
                                }, [
                                    h('span', { class: 'link-icon' }, ['📚']),
                                    h('span', { class: 'link-text' }, ['Documentation']),
                                    h('span', { class: 'link-description' }, ['Learn how to use KalxJS'])
                                ]),
                                h('a', {
                                    href: 'https://github.com/Odeneho-Calculus/kalxjs/examples',
                                    target: '_blank',
                                    class: 'link-card',
                                    rel: 'noopener'
                                }, [
                                    h('span', { class: 'link-icon' }, ['🔍']),
                                    h('span', { class: 'link-text' }, ['Examples']),
                                    h('span', { class: 'link-description' }, ['Explore sample projects'])
                                ]),
                                h('a', {
                                    href: 'https://github.com/Odeneho-Calculus/kalxjs',
                                    target: '_blank',
                                    class: 'link-card',
                                    rel: 'noopener'
                                }, [
                                    h('span', { class: 'link-icon' }, ['💻']),
                                    h('span', { class: 'link-text' }, ['GitHub']),
                                    h('span', { class: 'link-description' }, ['Star us on GitHub'])
                                ]),
                                h('a', {
                                    href: 'https://github.com/Odeneho-Calculus/kalxjs/issues',
                                    target: '_blank',
                                    class: 'link-card',
                                    rel: 'noopener'
                                }, [
                                    h('span', { class: 'link-icon' }, ['🐞']),
                                    h('span', { class: 'link-text' }, ['Report Bug']),
                                    h('span', { class: 'link-description' }, ['Help us improve'])
                                ])
                            ])
                        ]),

                        // New section: What's Next
                        h('div', { class: 'whats-next-section' }, [
                            h('h3', {}, ['What\'s Next?']),
                            h('ul', { class: 'next-steps-list' }, [
                                h('li', {}, [
                                    h('strong', {}, ['Create your first component: ']),
                                    'Try creating a .klx file in the components directory'
                                ]),
                                h('li', {}, [
                                    h('strong', {}, ['Add state management: ']),
                                    'Explore the reactive system for managing application state'
                                ]),
                                h('li', {}, [
                                    h('strong', {}, ['Style your app: ']),
                                    'Add custom CSS or use the built-in styling options'
                                ]),
                                h('li', {}, [
                                    h('strong', {}, ['Deploy your app: ']),
                                    'Build for production and deploy to your favorite hosting service'
                                ])
                            ])
                        ])
                    ])
                ]),

                // Enhanced Footer
                h('footer', { class: 'welcome-footer' }, [
                    h('div', { class: 'footer-content' }, [
                        h('p', { class: 'footer-tagline' }, ['Built with KalxJS - The Modern JavaScript Framework']),
                        h('p', { class: 'footer-copyright' }, [
                            '© ', new Date().getFullYear(), ' Made with ❤️ by the KalxJS Team'
                        ]),
                        h('div', { class: 'footer-version' }, [
                            'Version 0.1.0-beta'
                        ])
                    ])
                ])
            ])
        ]);
    }
});