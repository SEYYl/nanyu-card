import { createRouter, createWebHistory } from 'vue-router'
import FrontPage from '../views/FrontPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: FrontPage },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../views/AdminLogin.vue'),
    },
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      children: [
        { path: '', name: 'admin', component: () => import('../views/admin/Dashboard.vue') },
        { path: 'site', name: 'admin-site', component: () => import('../views/admin/SiteConfig.vue') },
        { path: 'highlights', name: 'admin-highlights', component: () => import('../views/admin/Highlights.vue') },
        { path: 'taxonomy', name: 'admin-taxonomy', component: () => import('../views/admin/Taxonomy.vue') },
        { path: 'projects', name: 'admin-projects', component: () => import('../views/admin/Projects.vue') },
        { path: 'projects/:id', name: 'admin-project-edit', component: () => import('../views/admin/ProjectEdit.vue') },
        { path: 'settings', name: 'admin-settings', component: () => import('../views/admin/Settings.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
