import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomePage.vue')
    },
    {
      path: '/test/:assessmentId',
      name: 'test',
      component: () => import('../views/TestPage.vue'),
      props: true
    },
    {
      path: '/report',
      name: 'report',
      component: () => import('../views/ComprehensiveReport.vue')
    }
  ]
})

export default router
