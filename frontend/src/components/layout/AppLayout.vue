<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  CalendarClock,
  Warehouse,
  Truck,
  Users,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Menu,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const roleBadge = computed(() => {
  switch (authStore.user?.role) {
    case UserRole.ADMIN:
      return {
        label: 'Administrador',
        class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        icon: ShieldCheck,
      };
    case UserRole.OPERATOR:
      return {
        label: 'Operador',
        class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: ShieldAlert,
      };
    default:
      return {
        label: 'Usuário (Visualizador)',
        class: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        icon: UserCheck,
      };
  }
});

const navItems = computed(() => {
  const items = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      description: 'Indicadores e Visão Geral',
    },
    {
      name: 'Janelas de Descarga',
      path: '/schedules',
      icon: CalendarClock,
      description: 'Controle de Etapas e Tempos',
    },
    {
      name: 'Docas',
      path: '/docks',
      icon: Warehouse,
      description: 'Status e Ocupação',
    },
    {
      name: 'Caminhões',
      path: '/trucks',
      icon: Truck,
      description: 'Frotas e Motoristas',
    },
  ];

  if (authStore.isAdmin) {
    items.push({
      name: 'Usuários',
      path: '/users',
      icon: Users,
      description: 'Controle de Acessos e Roles',
    });
  }

  return items;
});

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <div class="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div>
        <!-- Brand Header -->
        <div class="p-5 border-b border-slate-800 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Truck class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              ShippingLog <span class="text-emerald-400 text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 font-mono">PRO</span>
            </h1>
            <p class="text-[11px] text-slate-400">Controle de Descargas</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="p-3 space-y-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
              route.path === item.path
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
            ]"
          >
            <component
              :is="item.icon"
              :class="[
                'w-5 h-5 transition-colors',
                route.path === item.path ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300',
              ]"
            />
            <div class="flex flex-col">
              <span>{{ item.name }}</span>
            </div>
          </router-link>
        </nav>
      </div>

      <!-- User Profile & Session -->
      <div class="p-3 border-t border-slate-800 bg-slate-900/40">
        <div class="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 mb-2">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-semibold text-slate-200 truncate">{{ authStore.user?.name }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span
              :class="[
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border',
                roleBadge.class,
              ]"
            >
              <component :is="roleBadge.icon" class="w-3 h-3" />
              {{ roleBadge.label }}
            </span>
            <span class="text-[10px] text-slate-400 truncate max-w-[90px]">{{ authStore.user?.email }}</span>
          </div>
        </div>

        <button
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
        >
          <LogOut class="w-4 h-4" />
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col min-w-0 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>
