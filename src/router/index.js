// Composables
import { createRouter, createWebHistory } from 'vue-router'


const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '',
        name: 'home',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "home" */ '@/views/Home.vue'),
      },
      {
        path: 'console',
        name: 'console',
        component: () => import('@/views/Console.vue')
      },
      {
        path: 'tables',
        name: 'tables',
        component: () => import('@/views/Tables.vue')
      },
      {
        path: 'cluster',
        name: 'cluster',
        component: () => import('@/views/Cluster.vue')
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/views/Users.vue'),
      },
      {
        path: 'logs',
        name: 'logs',
        component: () => import('@/views/Logs.vue')
      },
      {
        path: 'repositories',
        name: 'repositories',
        component:() => import('@/views/Repositories.vue')
      },
      {
        path: 'test',
        name: 'test',
        component:() =>  import('@/views/Test.vue')
      },
      {
        path: 'notebooks',
        name: 'notebooks',
        component: () => import('@/views/Notebooks.vue')
      }
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
