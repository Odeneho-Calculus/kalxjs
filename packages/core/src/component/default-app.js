import { h } from '../vdom/vdom';

/**
 * Default App component for when App.klx can't be loaded
 */
export const createDefaultAppComponent = () => {
    return {
        name: 'DefaultApp',
        render() {
            return h('div', { class: 'app' }, [
                h('header', { class: 'app-header' }, [
                    h('h1', null, 'Welcome to KalxJS')
                ]),
                h('main', { class: 'app-main' }, [
                    h('div', { class: 'welcome-container' }, [
                        h('div', { class: 'welcome-header' }, [
                            h('h2', null, ['Getting Started with ', h('span', { class: 'brand-name' }, 'KalxJS')])
                        ]),
                        h('div', { class: 'welcome-content' }, [
                            h('p', { class: 'welcome-message' },
                                "Congratulations! You've successfully created a new KalxJS project!"
                            ),
                            h('div', { class: 'feature-grid' }, [
                                h('div', { class: 'feature-card' }, [
                                    h('h3', null, '📝 Template-Based Rendering'),
                                    h('p', null, 'Use HTML templates directly with no virtual DOM overhead')
                                ]),
                                h('div', { class: 'feature-card' }, [
                                    h('h3', null, '⚡ Reactive State'),
                                    h('p', null, 'Powerful state management with automatic DOM updates')
                                ]),
                                h('div', { class: 'feature-card' }, [
                                    h('h3', null, '🧩 Component System'),
                                    h('p', null, 'Create reusable components with clean APIs')
                                ]),
                                h('div', { class: 'feature-card' }, [
                                    h('h3', null, '🔄 Routing'),
                                    h('p', null, 'Seamless navigation between different views')
                                ])
                            ])
                        ])
                    ])
                ]),
                h('footer', { class: 'app-footer' }, [
                    h('p', null, 'Powered by KalxJS - More powerful than Vue')
                ])
            ]);
        },

        // Add styles when mounted
        mounted() {
            const styleElement = document.createElement('style');
            styleElement.textContent = `
        .app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .app-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .app-header h1 {
          color: #2d3748;
          margin-bottom: 1rem;
          font-size: 2.5rem;
        }
        .app-main {
          margin-bottom: 2rem;
        }
        .app-footer {
          text-align: center;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          color: #718096;
          font-size: 0.875rem;
        }
        .welcome-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        .welcome-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .brand-name {
          color: #42b883;
          font-weight: bold;
        }
        .welcome-content {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .welcome-message {
          font-size: 1.2rem;
          text-align: center;
          margin-bottom: 2rem;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }
        .feature-card {
          background-color: white;
          padding: 1.5rem;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .feature-card h3 {
          color: #42b883;
          margin-top: 0;
        }
      `;
            document.head.appendChild(styleElement);
        }
    };
};