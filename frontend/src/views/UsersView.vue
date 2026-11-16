<script setup lang="ts">
import { onMounted, ref } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  X,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  XCircle,
} from 'lucide-vue-next';

const users = ref<User[]>([]);
const isLoading = ref(false);

const isModalOpen = ref(false);
const editingUserId = ref<number | null>(null);

const formName = ref('');
const formEmail = ref('');
const formPassword = ref('');
const formRole = ref<UserRole>(UserRole.USER);
const formActive = ref(true);

async function loadUsers() {
  isLoading.value = true;
  try {
    const res = await api.get<User[]>('/users');
    users.value = res.data;
  } catch (err: any) {
    alert(err.response?.data?.message || 'Erro ao carregar usuários');
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadUsers();
});

function openCreateModal() {
  editingUserId.value = null;
  formName.value = '';
  formEmail.value = '';
  formPassword.value = '';
  formRole.value = UserRole.USER;
  formActive.value = true;
  isModalOpen.value = true;
}

function openEditModal(user: User) {
  editingUserId.value = user.id;
  formName.value = user.name;
  formEmail.value = user.email;
  formPassword.value = ''; // Leave blank if not updating
  formRole.value = user.role;
  formActive.value = user.active;
  isModalOpen.value = true;
}

async function handleSubmit() {
  if (!formName.value || !formEmail.value) {
    alert('Preencha nome e e-mail');
    return;
  }

  if (!editingUserId.value && (!formPassword.value || formPassword.value.length < 6)) {
    alert('A senha inicial deve ter pelo menos 6 caracteres');
    return;
  }

  try {
    if (editingUserId.value) {
      await api.put(`/users/${editingUserId.value}`, {
        name: formName.value,
        email: formEmail.value,
        password: formPassword.value || undefined,
        role: formRole.value,
        active: formActive.value,
      });
    } else {
      await api.post('/users', {
        name: formName.value,
        email: formEmail.value,
        password: formPassword.value,
        role: formRole.value,
        active: formActive.value,
      });
    }
    isModalOpen.value = false;
    await loadUsers();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Erro ao salvar usuário');
  }
}

async function handleDelete(id: number) {
  if (!confirm('Deseja realmente remover este usuário?')) return;
  try {
    await api.delete(`/users/${id}`);
    await loadUsers();
  } catch (err: any) {
    alert(err.response?.data?.message || 'Erro ao excluir usuário');
  }
}

function getRoleConfig(role: UserRole) {
  switch (role) {
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
        label: 'Usuário',
        class: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        icon: UserCheck,
      };
  }
}
</script>

<template>
  <AppLayout>
    <div class="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold tracking-tight text-white">Gestão de Usuários & Perfis</h1>
            <span class="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono border border-indigo-500/20">
              Apenas Administrador
            </span>
          </div>
          <p class="text-sm text-slate-400 mt-1">
            Controle de acessos locais: Administrador, Operador e Usuário (sem dependências externas)
          </p>
        </div>

        <button
          @click="openCreateModal"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      <!-- Users Table -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3 px-4">Nome do Usuário</th>
                <th class="py-3 px-4">E-mail</th>
                <th class="py-3 px-4">Perfil de Acesso (Role)</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr
                v-for="u in users"
                :key="u.id"
                class="hover:bg-slate-800/40 transition-colors"
              >
                <td class="py-3.5 px-4 font-semibold text-white">
                  {{ u.name }}
                </td>
                <td class="py-3.5 px-4 font-mono text-slate-300">
                  {{ u.email }}
                </td>
                <td class="py-3.5 px-4">
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                      getRoleConfig(u.role).class,
                    ]"
                  >
                    <component :is="getRoleConfig(u.role).icon" class="w-3.5 h-3.5" />
                    <span>{{ getRoleConfig(u.role).label }}</span>
                  </span>
                </td>
                <td class="py-3.5 px-4">
                  <span
                    v-if="u.active"
                    class="inline-flex items-center gap-1 text-emerald-400 font-medium"
                  >
                    <CheckCircle class="w-3.5 h-3.5" />
                    <span>Ativo</span>
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 text-slate-500 font-medium"
                  >
                    <XCircle class="w-3.5 h-3.5" />
                    <span>Inativo</span>
                  </span>
                </td>
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      @click="openEditModal(u)"
                      class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Editar Usuário"
                    >
                      <Edit class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleDelete(u.id)"
                      class="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Excluir Usuário"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create / Edit Modal -->
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      >
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="text-base font-semibold text-white">
              {{ editingUserId ? 'Editar Usuário' : 'Novo Usuário Local' }}
            </h3>
            <button @click="isModalOpen = false" class="text-slate-400 hover:text-white">
              <X class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Nome Completo *</label>
              <input
                v-model="formName"
                type="text"
                required
                placeholder="Ex: Carlos Eduardo"
                class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">E-mail de Acesso *</label>
              <input
                v-model="formEmail"
                type="email"
                required
                placeholder="carlos@empresa.com"
                class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">
                Senha {{ editingUserId ? '(deixe em branco para não alterar)' : '*' }}
              </label>
              <input
                v-model="formPassword"
                type="password"
                :required="!editingUserId"
                placeholder="••••••••"
                class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Perfil de Acesso (Role) *</label>
              <select
                v-model="formRole"
                class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option :value="UserRole.ADMIN">Administrador (Acesso total)</option>
                <option :value="UserRole.OPERATOR">Operador (Avanço de etapas e docas)</option>
                <option :value="UserRole.USER">Usuário (Somente leitura)</option>
              </select>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input
                id="activeCheckbox"
                v-model="formActive"
                type="checkbox"
                class="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
              />
              <label for="activeCheckbox" class="text-xs text-slate-300 font-medium">
                Usuário Ativo (Pode realizar login)
              </label>
            </div>

            <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                @click="isModalOpen = false"
                class="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white"
              >
                Salvar Usuário
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
