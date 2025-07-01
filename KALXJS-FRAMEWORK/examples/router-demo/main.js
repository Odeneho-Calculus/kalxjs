import { createApp } from '@kalxjs/core';
import App from './App.kal';
import router from './router.js';

const app = createApp(App);

app.use(router);

app.mount('#app');
