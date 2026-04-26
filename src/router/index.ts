import { createRouter, createWebHistory } from 'vue-router'
import InvitationPage from '@/views/InvitationPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/invite/:slug',
      component: InvitationPage,
    },
  ],
})

export default router
