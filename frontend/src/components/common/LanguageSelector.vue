<script setup lang="ts">
import { useI18n, Locale } from '../../i18n';
import { Globe } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    variant?: 'segmented' | 'compact';
  }>(),
  {
    variant: 'segmented',
  },
);

const { currentLocale, setLocale, availableLocales, t } = useI18n();

function handleSelect(code: Locale) {
  setLocale(code);
}
</script>

<template>
  <div
    v-if="variant === 'segmented'"
    class="inline-flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-sm"
    role="group"
    :aria-label="t('language.select')"
  >
    <button
      v-for="loc in availableLocales"
      :key="loc.code"
      type="button"
      @click="handleSelect(loc.code)"
      :class="[
        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all text-xs',
        currentLocale === loc.code
          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm font-semibold'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent',
      ]"
      :title="loc.label"
    >
      <span class="text-sm leading-none">{{ loc.flag }}</span>
      <span>{{ loc.shortLabel }}</span>
    </button>
  </div>

  <div
    v-else
    class="flex items-center gap-2 text-xs"
  >
    <Globe class="w-3.5 h-3.5 text-slate-400" />
    <select
      :value="currentLocale"
      @change="handleSelect(($event.target as HTMLSelectElement).value as Locale)"
      class="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-emerald-500"
      :aria-label="t('language.select')"
    >
      <option
        v-for="loc in availableLocales"
        :key="loc.code"
        :value="loc.code"
      >
        {{ loc.flag }} {{ loc.label }}
      </option>
    </select>
  </div>
</template>
