import { createApp } from '@kalxjs/core';
import App from './App.js';
import './styles/main.scss';
import router from './router';
import store from './store';

const app = createApp(App);

if (router) {
    app.use(router);
}

if (store) {
    app.use(store);
}

app.mount('#app');