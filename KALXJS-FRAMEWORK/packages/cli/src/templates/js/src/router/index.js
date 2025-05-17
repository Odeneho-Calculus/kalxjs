import { createRouter } from '@kalxjs/router';
import Home from '../views/Home';
import About from '../views/About';

const routes = [
    // Use the welcome template as the default home page
    { path: '/', component: 'welcome' },
    
    // Keep traditional component routes for reference
    { path: '/home', component: Home },
    { path: '/about', component: About },
    
    // Add counter demo route
    { path: '/counter', component: 'counter' }
];

export const router = createRouter({
    mode: 'hash', // Use hash mode for better compatibility
    routes
});

export default router;