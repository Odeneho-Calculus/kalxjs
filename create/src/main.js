import { createApp } from '@kalxjs-framework/runtime'
import App from './App.klx'
import { createRouter } from './router'
import routes from './router/routes'
import './styles/main.css'

const router = createRouter({ routes })
const app = createApp(App)

app.use(router)
app.mount('#app')