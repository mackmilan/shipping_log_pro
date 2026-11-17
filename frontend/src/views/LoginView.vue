<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useI18n } from '../i18n';
import LanguageSelector from '../components/common/LanguageSelector.vue';
import { Truck, ShieldCheck, ShieldAlert, UserCheck, Lock, Mail, ArrowRight } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

async function handleLogin() {
  if (!email.value || !password.value) return;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await authStore.login(email.value, password.value);
    router.push('/dashboard');
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || t('login.defaultError');
  } finally {
    isLoading.value = false;
  }
}

async function quickLogin(roleEmail: string, rolePass: string) {
  email.value = roleEmail;
  password.value = rolePass;
  await handleLogin();
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Language Selector at Top Right -->
    <div class="absolute top-5 right-5 z-20">
      <LanguageSelector variant="segmented" />
    </div>

    <!-- Background glow elements -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

    <div class="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-xl shadow-emerald-500/20 mb-4">
          <Truck class="w-7 h-7 text-white" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-white">{{ t('login.title') }}</h1>
        <p class="text-sm text-slate-400 mt-1">
          {{ t('login.subtitle') }}
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-rose-400" />
        {{ errorMessage }}
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1.5">{{ t('login.email') }}</label>
          <div class="relative">
            <Mail class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="email"
              type="email"
              required
              :placeholder="t('login.emailPlaceholder')"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1.5">{{ t('login.password') }}</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-semibold text-sm text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          <span v-if="!isLoading">{{ t('login.signIn') }}</span>
          <span v-else>{{ t('login.authenticating') }}</span>
          <ArrowRight v-if="!isLoading" class="w-4 h-4" />
        </button>
      </form>

      <!-- Quick Demo Login Presets -->
      <div class="mt-8 pt-6 border-t border-slate-800">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
          {{ t('login.demoTitle') }}
        </p>
        <div class="grid grid-cols-1 gap-2">
          <button
            @click="quickLogin('admin@shippinglog.local', 'admin123')"
            type="button"
            class="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-left transition-all text-xs"
          >
            <div class="flex items-center gap-2.5">
              <ShieldCheck class="w-4 h-4 text-indigo-400" />
              <div>
                <span class="font-semibold text-slate-200 block">{{ t('login.admin') }}</span>
                <span class="text-[10px] text-slate-400 font-mono">admin@shippinglog.local</span>
              </div>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-medium">
              {{ t('login.adminDesc') }}
            </span>
          </button>

          <button
            @click="quickLogin('operador@shippinglog.local', 'operador123')"
            type="button"
            class="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-left transition-all text-xs"
          >
            <div class="flex items-center gap-2.5">
              <ShieldAlert class="w-4 h-4 text-emerald-400" />
              <div>
                <span class="font-semibold text-slate-200 block">{{ t('login.operator') }}</span>
                <span class="text-[10px] text-slate-400 font-mono">operador@shippinglog.local</span>
              </div>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
              {{ t('login.operatorDesc') }}
            </span>
          </button>

          <button
            @click="quickLogin('usuario@shippinglog.local', 'user123')"
            type="button"
            class="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-left transition-all text-xs"
          >
            <div class="flex items-center gap-2.5">
              <UserCheck class="w-4 h-4 text-slate-400" />
              <div>
                <span class="font-semibold text-slate-200 block">{{ t('login.viewer') }}</span>
                <span class="text-[10px] text-slate-400 font-mono">usuario@shippinglog.local</span>
              </div>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-700/30 text-slate-400 font-medium">
              {{ t('login.viewerDesc') }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
