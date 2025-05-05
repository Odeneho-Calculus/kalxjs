const routes = [
    {
        path: '/',
        component: () => import('../pages/Home.klx')
    },
    {
        path: '/about',
        component: () => import('../pages/About.klx')
    }
]

export default routes