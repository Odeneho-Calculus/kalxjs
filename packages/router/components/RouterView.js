/**
 * RouterView component
 * Renders the component for the current route
 */
import { h, inject, ref, watch, reactive } from '@kalxjs/core';

export const RouterView = {
    name: 'RouterView',

    setup(props, { slots }) {
        console.log('RouterView setup running');
        
        // Get the router instance from the parent component
        const router = inject('router');
        console.log('RouterView - Router injected:', router ? 'YES' : 'NO');
        
        if (router) {
            console.log('RouterView - Current route:', router.currentRoute);
            if (router.currentRoute && router.currentRoute.matched) {
                console.log('RouterView - Matched routes count:', router.currentRoute.matched.length);
            }
        }

        if (!router) {
            console.error('No router provided. Make sure to provide the router in your root component.');
            return () => h('div', {
                class: 'router-view-error',
                style: {
                    padding: '20px',
                    margin: '20px',
                    border: '2px solid red',
                    backgroundColor: '#ffeeee',
                    color: 'red'
                }
            }, 'Router not found. Please make sure the router is provided to the application.');
        }

        // Keep track of the current component and route state
        const currentComponent = ref(null);
        const routeState = reactive({
            path: router.currentRoute.path || '/',
            matched: router.currentRoute.matched || [],
            params: router.currentRoute.params || {},
            query: router.currentRoute.query || {},
            component: null
        });

        // Debug the router's currentRoute
        console.log('RouterView - Router currentRoute:', {
            path: router.currentRoute.path,
            matched: router.currentRoute.matched,
            params: router.currentRoute.params,
            query: router.currentRoute.query
        });

        // Listen for the custom kalroute event
        if (typeof window !== 'undefined') {
            window.addEventListener('kalroute', (event) => {
                console.log('RouterView - kalroute event received:', event.detail.route);
                
                // Update the route state
                Object.assign(routeState, event.detail.route);
                
                // Force update view
                updateView();
            });
        }

        // Watch for route changes using the reactive system
        watch(() => router.currentRoute.path, (newPath, oldPath) => {
            console.log(`RouterView - Route changed from "${oldPath}" to "${newPath}"`);
            
            // Update the route state
            Object.assign(routeState, router.currentRoute);
            
            updateView();
        }, { immediate: true });

        // Also watch the matched array for changes
        watch(() => router.currentRoute.matched, (newMatched) => {
            console.log('RouterView - Matched routes changed:', newMatched);
            
            // Update the route state
            routeState.matched = newMatched || [];
            
            updateView();
        }, { immediate: true });

        // Update the view based on the current route
        const updateView = () => {
            console.log('RouterView - updateView called');
            
            // Check if matched exists
            if (!routeState.matched || !Array.isArray(routeState.matched)) {
                console.error('RouterView - routeState.matched is invalid:', routeState.matched);
                routeState.matched = [];
            }
            
            console.log('RouterView - Current routeState:', routeState);

            if (!routeState.matched || !routeState.matched.length) {
                console.warn('No matched routes found for', routeState.path);
                
                // Try to manually match the route
                if (typeof router._matchRoute === 'function') {
                    console.log('RouterView - Trying to manually match route for path:', routeState.path);
                    const path = routeState.path || '/';
                    const matchedRoute = router._matchRoute(path);
                    console.log('RouterView - Manual match result:', matchedRoute);
                    
                    if (matchedRoute) {
                        // Update the route state with the matched route
                        Object.assign(routeState, {
                            matched: matchedRoute.matched || [],
                            params: matchedRoute.params || {},
                            query: matchedRoute.query || {},
                            meta: matchedRoute.meta || {}
                        });
                        
                        if (matchedRoute.component) {
                            console.log('RouterView - Using manually matched component');
                            currentComponent.value = matchedRoute.component;
                            routeState.component = matchedRoute.component;
                            return;
                        }
                    }
                }
                
                currentComponent.value = null;
                routeState.component = null;
                return;
            }

            // Get the component for the current route
            const route = routeState.matched[routeState.matched.length - 1];
            console.log('RouterView - Selected route:', route);
            
            if (route && route.component) {
                console.log('RouterView - Selected route component:', 
                    route.component.name || 'Anonymous Component');
                currentComponent.value = route.component;
                routeState.component = route.component;
            } else {
                console.error('RouterView - No component found in the matched route');
                currentComponent.value = null;
                routeState.component = null;
            }
        };

        // Initial view update
        updateView();

        // Force update when the component is mounted
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                console.log('RouterView - Forcing update after mount');
                if (router && typeof router.forceUpdate === 'function') {
                    router.forceUpdate();
                }
            }, 50);
        }

        // Render the component
        return () => {
            console.log('RouterView - render function called, currentComponent:', 
                currentComponent.value ? (currentComponent.value.name || 'Anonymous') : 'None');
            
            if (!currentComponent.value) {
                return h('div', {
                    class: 'router-view-empty',
                    style: {
                        padding: '20px',
                        margin: '20px',
                        border: '2px solid orange',
                        backgroundColor: '#fff8e1',
                        color: 'orange'
                    }
                }, [
                    h('h3', {}, 'No component found for the current route'),
                    h('p', {}, `Current path: ${routeState.path || 'unknown'}`),
                    h('p', {}, `Matched routes: ${routeState.matched ? 
                        routeState.matched.length : 'none'}`),
                    h('button', {
                        onClick: () => {
                            console.log('Forcing route update');
                            if (router && typeof router.forceUpdate === 'function') {
                                router.forceUpdate();
                            } else {
                                updateView();
                            }
                        },
                        style: {
                            padding: '8px 16px',
                            backgroundColor: '#ff9800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }
                    }, 'Force Route Update')
                ]);
            }

            console.log('RouterView - Rendering component:', currentComponent.value.name || 'Anonymous');
            return h(currentComponent.value);
        };
    }
};