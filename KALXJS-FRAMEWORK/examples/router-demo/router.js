import { createRouter, createWebHistory } from '@kalxjs/router';
import Home from './components/Home.kal';
import About from './components/About.kal';
import User from './components/User.kal';

const routes = [
  { path: '/', component: Home, name: 'Home' },
  { path: '/about', component: About, name: 'About' },
  { path: '/user/:id', component: User, name: 'User', props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
