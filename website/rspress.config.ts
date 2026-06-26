import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';
import { pluginTwoslash } from '@rspress/plugin-twoslash';

const base = normalizeBase(process.env.RSPRESS_BASE);

function normalizeBase(value = '/') {
  if (value === '/') {
    return '/';
  }

  return `/${value.replace(/^\/|\/$/g, '')}/`;
}

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  base,
  title: 'Decurl',
  description: 'Type-safe URL Search Params for decode-first applications.',
  lang: 'en',
  icon: '/decurl_logo_64.svg',
  logo: '/decurl_logo_64.svg',
  logoText: 'Decurl',
  plugins: [pluginTwoslash(), pluginPreview()],
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'Decurl',
      description: 'Type-safe URL Search Params for decode-first applications.',
    },
    {
      lang: 'zh',
      label: '简体中文',
      title: 'Decurl',
      description: '面向 URL Search Params 的类型安全状态管理库。',
    },
  ],
  themeConfig: {
    enableContentAnimation: true,
  },
  globalStyles: path.join(__dirname, 'tailwind.css'),
});
