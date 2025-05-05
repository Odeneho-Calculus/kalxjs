import { createRouter } from '@kalxjs/router';
import Home from '../views/Home';
import About from '../views/About';

const routes = [
    { path: '/', component: Home },
    { path: '/about', component: About }
];

export const router = createRouter({
    routes
});

export default router;