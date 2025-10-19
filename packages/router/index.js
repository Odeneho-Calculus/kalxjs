/**
 * KalxJS Router
 * A simple and efficient router for KalxJS applications
 */
import { createWebHashHistory } from './history/hash.js';
import { createWebHistory } from './history/html5.js';
import { createRouter } from './router.js';
import { RouterLink } from './components/RouterLink.js';
import { RouterView } from './components/RouterView.js';

export {
    createRouter,
    createWebHashHistory,
    createWebHistory,
    RouterLink,
    RouterView
};