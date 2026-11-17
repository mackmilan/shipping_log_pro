import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './auth';
import { UserRole } from '../types';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    setActivePinia(createPinia());
  });

  it('initializes with unauthenticated state', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
  });

  it('evaluates admin role correctly', () => {
    const store = useAuthStore();
    store.token = 'dummy-token';
    store.user = {
      id: 1,
      name: 'Admin',
      email: 'admin@shippinglog.local',
      role: UserRole.ADMIN,
      active: true,
      createdAt: '',
    };

    expect(store.isAuthenticated).toBe(true);
    expect(store.isAdmin).toBe(true);
    expect(store.isOperator).toBe(true);
    expect(store.isUser).toBe(false);
  });

  it('evaluates operator role correctly', () => {
    const store = useAuthStore();
    store.token = 'dummy-token';
    store.user = {
      id: 2,
      name: 'Operador',
      email: 'operador@shippinglog.local',
      role: UserRole.OPERATOR,
      active: true,
      createdAt: '',
    };

    expect(store.isAdmin).toBe(false);
    expect(store.isOperator).toBe(true);
    expect(store.isUser).toBe(false);
  });

  it('evaluates driver role correctly', () => {
    const store = useAuthStore();
    store.token = 'dummy-token';
    store.user = {
      id: 4,
      name: 'Carlos Motorista',
      email: 'motorista@shippinglog.local',
      role: UserRole.DRIVER,
      active: true,
      createdAt: '',
    };

    expect(store.isAuthenticated).toBe(true);
    expect(store.isAdmin).toBe(false);
    expect(store.isOperator).toBe(false);
    expect(store.isDriver).toBe(true);
    expect(store.isUser).toBe(false);
  });

  it('evaluates regular user role correctly', () => {
    const store = useAuthStore();
    store.token = 'dummy-token';
    store.user = {
      id: 3,
      name: 'Usuário',
      email: 'usuario@shippinglog.local',
      role: UserRole.USER,
      active: true,
      createdAt: '',
    };

    expect(store.isAdmin).toBe(false);
    expect(store.isOperator).toBe(false);
    expect(store.isUser).toBe(true);
  });

  it('clears state on logout', () => {
    const store = useAuthStore();
    store.token = 'dummy-token';
    store.user = {
      id: 1,
      name: 'Admin',
      email: 'admin@shippinglog.local',
      role: UserRole.ADMIN,
      active: true,
      createdAt: '',
    };

    store.logout();
    expect(store.isAuthenticated).toBe(false);
    expect(store.token).toBeNull();
    expect(store.user).toBeNull();
  });
});
