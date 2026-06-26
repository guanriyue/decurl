import { useI18n } from '@rspress/core/runtime';

type DemoI18n = typeof import('i18n');

export const useDemoI18n = () => {
  return useI18n<DemoI18n>();
};

export const toSearchText = (
  search: string,
  t: ReturnType<typeof useDemoI18n>,
): string => {
  return search.length > 0 ? search : t('demo.empty');
};
