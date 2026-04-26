import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '@/views/HomePage.vue'
import InvitationPage from '@/views/InvitationPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/invite/:slug',
      component: InvitationPage,
    },
  ],
})

export default router
