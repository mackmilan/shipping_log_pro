import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';
import { User, UserRole } from '../types';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  );
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === UserRole.ADMIN);
  const isOperator = computed(
    () => user.value?.role === UserRole.OPERATOR || user.value?.role === UserRole.ADMIN,
  );
  const isDriver = computed(() => user.value?.role === UserRole.DRIVER);
  const isUser = computed(() => user.value?.role === UserRole.USER);

  async function login(email: string, pass: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/auth/login', { email, password: pass });
      token.value = res.data.accessToken;
      user.value = res.data.user;
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Falha no login. Verifique as credenciais.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async function fetchProfile() {
    if (!token.value) return;
    try {
      const res = await api.get('/auth/me');
      user.value = res.data;
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch {
      logout();
    }
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isOperator,
    isDriver,
    isUser,
    login,
    logout,
    fetchProfile,
  };
});
