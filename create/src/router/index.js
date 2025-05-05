import { ref, reactive, h } from '@kalxjs-framework/runtime'
import routes from './routes'

export function createRouter({ history = 'html5', routes = [] }) {
    const currentRoute = ref({
        path: window.location.pathname,
        params: {},
        query: {},
        hash: window.location.hash,
        fullPath: window.location.pathname + window.location.search + window.location.hash
    })

    const router = {
        currentRoute,

        // Navigation guards
        beforeEach: null,
        afterEach: null,

        // Router methods
        push(to) {
            return this.navigate(to, 'push')
        },

        replace(to) {
            return this.navigate(to, 'replace')
        },

        async navigate(to, type = 'push') {
            const path = typeof to === 'string' ? to : to.path
            const method = type === 'push' ? 'pushState' : 'replaceState'

            // Run before guards
            if (this.beforeEach) {
                const next = await this.beforeEach(path, currentRoute.value.path)
                if (!next) return false
            }

            // Update history
            history[method](null, '', path)
            await this.handleRoute(path)

            // Run after hooks
            this.afterEach?.(currentRoute.value, currentRoute.value.path)
        },

        async handleRoute(path) {
            const route = routes.find(r => r.path === path)
            if (!route) return false

            // Handle async components
            const component = typeof route.component === 'function' 
                ? await route.component()
                : route.component

            currentRoute.value = {
                ...currentRoute.value,
                path,
                matched: [route],
                component
            }

            return true
        },

        install(app) {
            // Handle browser back/forward
            window.addEventListener('popstate', () => {
                this.handleRoute(window.location.pathname)
            })

            // Register global components
            app.component('router-link', {
                props: {
                    to: { type: [String, Object], required: true },
                    replace: { type: Boolean, default: false }
                },
                setup(props, { slots }) {
                    const navigate = (e) => {
                        e.preventDefault()
                        props.replace ? router.replace(props.to) : router.push(props.to)
                    }
                    return () => h('a', { 
                        href: typeof props.to === 'string' ? props.to : props.to.path,
                        onClick: navigate,
                        class: {
                            active: currentRoute.value.path === props.to
                        }
                    }, slots.default?.())
                }
            })

            app.component('router-view', {
                setup() {
                    return () => {
                        const { component } = currentRoute.value
                        return component ? h(component.default || component) : null
                    }
                }
            })

            // Initialize route
            this.handleRoute(window.location.pathname)
        }
    }

    return router
}