import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';
import { pluginTwoslash } from '@rspress/plugin-twoslash';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'Decurl',
  description: 'Type-safe URL Search Params for decode-first applications.',
  lang: 'en',
  icon: '/rspress-icon.png',
  logo: '/rspress-icon.png',
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
});
