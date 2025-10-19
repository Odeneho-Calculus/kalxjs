import { createApp, h, ref, watch } from '@kalxjs/core';
import { createRouter, RouterView, RouterLink, useRouter } from '@kalxjs/router';
import { onMounted } from '@kalxjs/composition';
import { patchRouter, setupGlobalRouteListener } from './router-patch.js';

// Define route components
const Home = {
    setup() {
        // Use the onMounted hook to log when the component is mounted
        onMounted(() => {
            console.log('Home component mounted');
        });

        // Use the router to enable programmatic navigation
        const { push, router } = useRouter();

        // Function to navigate programmatically
        const navigateTo = (path) => {
            console.log(`Navigating programmatically to ${path}`);
            push(path);
        };

        return () => h('div', { class: 'home-page' }, [
            h('h2', {}, 'Home Page'),
            h('p', {}, 'Welcome to the KalxJS Router example!'),
            h('div', { class: 'navigation-examples' }, [
                h('h3', {}, 'Navigation Examples:'),
                h('div', { class: 'buttons' }, [
                    h('button', {
                        onClick: () => navigateTo('/about'),
                        style: 'margin-right: 10px; padding: 5px 10px;'
                    }, 'Go to About (Programmatic)'),
                    h('button', {
                        onClick: () => navigateTo('/user/456'),
                        style: 'padding: 5px 10px;'
                    }, 'Go to User #456 (Programmatic)')
                ])
            ])
        ]);
    }
};

const About = {
    setup() {
        // Use the onMounted hook to log when the component is mounted
        onMounted(() => {
            console.log('About component mounted');
        });

        return () => h('div', { class: 'about-page' }, [
            h('h2', {}, 'About KalxJS Router'),
            h('p', {}, 'This is a simple example showing how to use the useRouter composition function.'),
            h('div', { class: 'features' }, [
                h('h3', {}, 'Router Features:'),
                h('ul', {}, [
                    h('li', {}, 'Hash-based routing'),
                    h('li', {}, 'Route parameters'),
                    h('li', {}, 'Nested routes'),
                    h('li', {}, 'Programmatic navigation'),
                    h('li', {}, 'Route guards (coming soon)'),
                    h('li', {}, 'Reactive route state')
                ])
            ]),
            h('p', {}, [
                'Go back to ',
                h(RouterLink, { to: '/' }, { default: () => 'Home' })
            ])
        ]);
    }
};

const User = {
    setup() {
        // Use the router composition function to access route params and other router features
        const { params, push } = useRouter();

        // Create a local reactive reference to the user ID
        const userId = ref(params.value.id);

        // Watch for changes to the params
        watch(params, (newParams) => {
            console.log('User params changed:', newParams);
            userId.value = newParams.id;
        });

        // Use the onMounted hook to log when the component is mounted
        onMounted(() => {
            console.log('User component mounted with ID:', userId.value);
        });

        // Function to navigate to a different user
        const navigateToRandomUser = () => {
            const randomId = Math.floor(Math.random() * 1000) + 1;
            console.log(`Navigating to random user: ${randomId}`);
            push(`/user/${randomId}`);
        };

        return () => h('div', { class: 'user-page' }, [
            h('h2', {}, 'User Profile'),
            h('p', {}, `User ID: ${userId.value}`),
            h('div', { class: 'user-actions' }, [
                h('button', {
                    onClick: navigateToRandomUser,
                    style: 'margin-right: 10px; padding: 5px 10px;'
                }, 'View Random User'),
                h('button', {
                    onClick: () => push('/'),
                    style: 'padding: 5px 10px;'
                }, 'Back to Home')
            ])
        ]);
    }
};

// Define the NotFound component as a simple function that returns a vnode
const NotFound = () => {
    console.log('NotFound component rendering');
    return {
        tag: 'div',
        props: {},
        children: [
            {
                tag: 'h2',
                props: {},
                children: ['404 Not Found']
            },
            {
                tag: 'p',
                props: {},
                children: ['The page you are looking for does not exist.']
            }
        ]
    };
}

// Alternative object-based definition with setup function
// const NotFound = {
//     setup() {
//         return () => h('div', {}, [
//             h('h2', {}, '404 Not Found'),
//             h('p', {}, 'The page you are looking for does not exist.')
//         ]);
//     }
// };

// Create router instance
let router = createRouter({
    mode: 'hash',
    routes: [
        { path: '/', component: Home },
        { path: '/about', component: About },
        { path: '/user/:id', component: User },
        // Use a simpler wildcard route for better compatibility
        { path: '*', component: NotFound }
    ]
});

// Patch the router for better reactivity
router = patchRouter(router);

// Log the router for debugging
console.log('Router created with routes:', router.routes.map(r => r.path));

// Navigation component using useRouter with reactive path
const Navigation = {
    setup() {
        // Use the path from useRouter - it's already reactive
        const { path, isActive } = useRouter();

        return () => {
            console.log('Navigation component rendering with path:', path.value);

            return h('nav', {
                style: 'background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px;',
                'data-component': 'navigation',
                'data-current-path': path.value
            }, [
                h(RouterLink, {
                    to: '/',
                    class: isActive('/') ? 'active' : '',
                    style: 'margin-right: 15px; text-decoration: none; color: #333; font-weight: ' + (isActive('/') ? 'bold' : 'normal')
                }, { default: () => 'Home' }),

                h(RouterLink, {
                    to: '/about',
                    class: isActive('/about') ? 'active' : '',
                    style: 'margin-right: 15px; text-decoration: none; color: #333; font-weight: ' + (isActive('/about') ? 'bold' : 'normal')
                }, { default: () => 'About' }),

                h(RouterLink, {
                    to: '/user/123',
                    class: path.value.startsWith('/user/') ? 'active' : '',
                    style: 'margin-right: 15px; text-decoration: none; color: #333; font-weight: ' + (path.value.startsWith('/user/') ? 'bold' : 'normal')
                }, { default: () => 'User Profile' }),

                h(RouterLink, {
                    to: '/nonexistent',
                    class: isActive('/nonexistent') ? 'active' : '',
                    style: 'text-decoration: none; color: #333; font-weight: ' + (isActive('/nonexistent') ? 'bold' : 'normal')
                }, { default: () => '404 Page' }),
            ]);
        };
    }
};

// App component
const App = {
    setup() {
        return () => h('div', {
            style: 'font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;'
        }, [
            h('h1', {
                style: 'color: #333; text-align: center; margin-bottom: 20px;'
            }, 'KalxJS Router Example'),

            h('p', {
                style: 'text-align: center; margin-bottom: 30px; color: #666;'
            }, 'A simple router example using the useRouter composition function'),

            h(Navigation),

            h('div', {
                class: 'content',
                style: 'background-color: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);'
            }, [
                h(RouterView)
            ])
        ]);
    }
};

// Create the app
const app = createApp(App);

// Install the router
app.use(router);

// Log before mounting
console.log('App created, router installed, about to mount');

// Ensure hash is set before mounting
if (window.location.hash === '') {
    console.log('Setting initial hash to /');
    window.location.hash = '/';
}

// Set up global route listener
setupGlobalRouteListener();

// Mount the app
setTimeout(() => {
    console.log('Mounting app with current hash:', window.location.hash);

    // Ensure the router has routes before mounting
    console.log('Router routes before mounting:', router.routes);

    // Initialize the router
    router._onRouteChange();

    // Mount the app
    app.mount('#app');

    // Log the router state after mounting
    setTimeout(() => {
        console.log('App mounted successfully');
        console.log('Current router state:', {
            routes: router.routes.map(r => r.path),
            currentRoute: router.currentRoute
        });
    }, 100);
}, 0);
