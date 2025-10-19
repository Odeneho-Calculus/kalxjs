/**
 * RouterLink component
 * Renders a link that navigates to a route when clicked
 */
import { h, inject, computed } from '@kalxjs/core';

export const RouterLink = {
    name: 'RouterLink',

    setup(props, { slots }) {
        console.log('RouterLink setup running');

        // Get the router instance from the parent component
        const router = inject('router');
        console.log('RouterLink - Router injected:', router ? 'YES' : 'NO');

        if (!router) {
            console.error('No router provided. Make sure to provide the router in your root component.');
            return () => h('a', {
                href: '#',
                style: {
                    color: 'red',
                    textDecoration: 'none',
                    padding: '5px 10px',
                    border: '1px solid red',
                    borderRadius: '4px',
                    margin: '0 5px'
                }
            }, slots.default ? slots.default() : 'Link');
        }

        // Compute the href
        const href = computed(() => {
            const to = props.to;
            return typeof to === 'string' ? to : (to && to.path) || '/';
        });

        // Handle click
        const handleClick = (e) => {
            console.log('RouterLink - Click event triggered');
            e.preventDefault();

            const to = props.to;
            console.log('RouterLink - Navigating to:', to);

            if (props.replace) {
                router.replace(to);
            } else {
                router.push(to);
            }
        };

        // Render the link
        return () => {
            console.log('RouterLink - Rendering link to:', props.to);

            // Determine if the link is active
            const currentPath = router.currentRoute.path;
            const to = props.to;
            const isActive = typeof to === 'string'
                ? currentPath === to
                : (to && to.path && currentPath === to.path);

            // Create the link element
            return h('a', {
                href: href.value,
                style: {
                    color: isActive ? '#ff9800' : '#333',
                    textDecoration: 'none',
                    fontWeight: isActive ? 'bold' : 'normal',
                    padding: '5px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    margin: '0 5px',
                    backgroundColor: isActive ? '#fff8e1' : 'transparent'
                },
                onClick: handleClick
            }, slots.default ? slots.default() : 'Link');
        };
    }
};