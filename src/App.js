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
            return h('div', { class: 'loading' }, ['Loading KalxJS App...']);
        }

        // Return the welcome component structure directly
        return h('div', { class: 'app-container' }, [
            h('div', { class: 'welcome-container' }, [
                // Header
                h('div', { class: 'welcome-header' }, [
                    h('img', { src: '/src/assets/logo.svg', alt: 'KalxJS Logo', class: 'welcome-logo' }),
                    h('h1', {}, ['Welcome to ', h('span', { class: 'brand-name' }, ['KalxJS'])])
                ]),

                // Content
                h('div', { class: 'welcome-content' }, [
                    h('p', { class: 'welcome-message' }, [
                        'Congratulations! You\'ve successfully created a new KalxJS project!'
                    ]),

                    // Feature grid
                    h('div', { class: 'feature-grid', id: 'feature-grid' }),

                    // Counter demo
                    h('div', { class: 'counter-demo' }, [
                        h('h2', {}, ['Try the Counter Demo']),
                        h('div', { class: 'counter-value', id: 'counter-value' }, ['0']),
                        h('div', { class: 'counter-buttons' }, [
                            h('button', {
                                class: 'counter-button',
                                id: 'decrement-button',
                                onClick: () => window.decrementCounter && window.decrementCounter()
                            }, ['-']),
                            h('button', {
                                class: 'counter-button reset',
                                id: 'reset-button',
                                onClick: () => window.resetCounter && window.resetCounter()
                            }, ['Reset']),
                            h('button', {
                                class: 'counter-button',
                                id: 'increment-button',
                                onClick: () => window.incrementCounter && window.incrementCounter()
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
                        ])
                    ]),

                    // Getting started
                    h('div', { class: 'getting-started' }, [
                        h('h2', {}, ['Getting Started']),
                        h('div', { class: 'code-block' }, [
                            h('pre', {}, [
                                h('code', {}, [
                                    '// Create a new KalxJS project\n',
                                    'npm init kalx my-app\n\n',
                                    '// Start the development server\n',
                                    'cd my-app\n',
                                    'npm run dev'
                                ])
                            ])
                        ]),

                        // Links section
                        h('div', { class: 'links-section' }, [
                            h('h3', {}, ['Essential Links']),
                            h('div', { class: 'links-grid' }, [
                                h('a', {
                                    href: 'https://github.com/Odeneho-Calculus/kalxjs',
                                    target: '_blank',
                                    class: 'link-card'
                                }, [
                                    h('span', { class: 'link-icon' }, ['📚']),
                                    h('span', { class: 'link-text' }, ['Documentation'])
                                ]),
                                h('a', {
                                    href: 'https://github.com/Odeneho-Calculus/kalxjs/examples',
                                    target: '_blank',
                                    class: 'link-card'
                                }, [
                                    h('span', { class: 'link-icon' }, ['🔍']),
                                    h('span', { class: 'link-text' }, ['Examples'])
                                ]),
                                h('a', {
                                    href: 'https://github.com/Odeneho-Calculus/kalxjs',
                                    target: '_blank',
                                    class: 'link-card'
                                }, [
                                    h('span', { class: 'link-icon' }, ['💻']),
                                    h('span', { class: 'link-text' }, ['GitHub'])
                                ]),
                                h('a', {
                                    href: 'https://github.com/Odeneho-Calculus/kalxjs/issues',
                                    target: '_blank',
                                    class: 'link-card'
                                }, [
                                    h('span', { class: 'link-icon' }, ['🐞']),
                                    h('span', { class: 'link-text' }, ['Report Bug'])
                                ])
                            ])
                        ])
                    ])
                ]),

                // Footer
                h('footer', { class: 'welcome-footer' }, [
                    h('p', {}, ['Made with ❤️ by the KalxJS Team'])
                ])
            ])
        ]);
    }
});