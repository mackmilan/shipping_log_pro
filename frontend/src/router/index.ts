import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/schedules',
    name: 'Schedules',
    component: () => import('../views/SchedulesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/docks',
    name: 'Docks',
    component: () => import('../views/DocksView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/trucks',
    name: 'Trucks',
    component: () => import('../views/TrucksView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/driver',
    name: 'Driver',
    component: () => import('../views/DriverView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/UsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
    return;
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    next(authStore.isDriver ? '/driver' : '/dashboard');
    return;
  }

  if (to.path === '/' && authStore.isAuthenticated) {
    next(authStore.isDriver ? '/driver' : '/dashboard');
    return;
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next(authStore.isDriver ? '/driver' : '/dashboard');
    return;
  }

  next();
});

export default router;
