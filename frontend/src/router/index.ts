import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Settings from '../views/Settings.vue'
import Login from '../views/Login.vue'
import Setup from '../views/Setup.vue'
import Reports from '../views/Reports.vue'
import { authState } from '../auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: Login, meta: { public: true } },
    { path: '/setup', name: 'setup', component: Setup, meta: { public: true } },
    { path: '/', name: 'dashboard', component: Dashboard },
    { path: '/add', name: 'add-expense', component: () => import('../views/AddExpense.vue') },
    { path: '/list', name: 'expenses-list', component: () => import('../views/ExpensesList.vue') },
    { path: '/users', name: 'settings-users', component: () => import('../views/SettingsUsers.vue') },
    { path: '/categories', name: 'settings-categories', component: () => import('../views/SettingsCategories.vue') },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/Reports.vue')
    },
    {
      path: '/yearly-report',
      name: 'yearly-report',
      component: () => import('../views/YearlyReport.vue')
    }
  ]
})

router.beforeEach(async (to, from) => {
  // Check if system is setup
  if (to.name !== 'setup') {
    try {
      const res = await fetch('http://localhost:3000/api/auth/status')
      const data = await res.json()
      if (!data.isSetupComplete) {
        return { name: 'setup' }
      }
    } catch (e) {
      console.error('Setup status check failed', e)
    }
  }

  const isPublic = to.meta.public
  const isAuthenticated = !!authState.token

  if (!isPublic && !isAuthenticated) {
    return { name: 'login' }
  } else if ((to.name === 'login' || to.name === 'setup') && isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
