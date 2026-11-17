import { ref, computed, App } from 'vue';
import { ptBR } from './locales/pt-BR';
import { en } from './locales/en';

export type Locale = 'pt-BR' | 'en';

export interface LocaleOption {
  code: Locale;
  label: string;
  flag: string;
  shortLabel: string;
}

export const availableLocales: LocaleOption[] = [
  { code: 'pt-BR', label: 'Português (Brasil)', shortLabel: 'PT-BR', flag: '🇧🇷' },
  { code: 'en', label: 'English (International)', shortLabel: 'EN', flag: '🌐' },
];

export const LOCALE_STORAGE_KEY = 'shipping_log_locale';

function getInitialLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (saved === 'pt-BR' || saved === 'en') {
      return saved;
    }
  }
  return 'pt-BR';
}

export const currentLocale = ref<Locale>(getInitialLocale());

export const messages: Record<Locale, typeof ptBR> = {
  'pt-BR': ptBR,
  en: en,
};

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return typeof current === 'string' ? current : undefined;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const locale = currentLocale.value;
  let text = getNestedValue(messages[locale], key);

  // Fallback to pt-BR if not found in current locale
  if (!text && locale !== 'pt-BR') {
    text = getNestedValue(messages['pt-BR'], key);
  }

  // Fallback to key itself if still not found
  if (!text) {
    return key;
  }

  // Replace {param} placeholders
  if (params) {
    for (const [paramKey, paramVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    }
  }

  return text;
}

export function setLocale(newLocale: Locale) {
  if (newLocale === 'pt-BR' || newLocale === 'en') {
    currentLocale.value = newLocale;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }
  }
}

export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '—';

  const locale = currentLocale.value === 'pt-BR' ? 'pt-BR' : 'en-US';
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes));
  if (m < 60) {
    return `${m} min`;
  }
  const hours = Math.floor(m / 60);
  const remainingM = m % 60;
  return remainingM > 0 ? `${hours}h ${remainingM}m` : `${hours}h`;
}

export function useI18n() {
  return {
    locale: computed(() => currentLocale.value),
    currentLocale,
    setLocale,
    t,
    formatDate,
    formatTime,
    availableLocales,
  };
}

export const i18nPlugin = {
  install(app: App) {
    app.config.globalProperties.$t = t;
    app.config.globalProperties.$formatDate = formatDate;
    app.provide('i18n', useI18n());
  },
};
