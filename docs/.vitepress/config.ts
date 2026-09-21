import { defineConfig } from 'vitepress';

const zhNav = [
  { text: '指南', link: '/guide/project-plan' },
  { text: '开发计划', link: '/guide/dev-plan' },
  { text: '架构', link: '/guide/architecture' },
  { text: '合并引擎', link: '/guide/consolidation' },
  { text: 'English', link: '/en/' },
];

const enNav = [
  { text: 'Guide', link: '/en/guide/project-plan' },
  { text: 'Dev Plan', link: '/en/guide/dev-plan' },
  { text: 'Architecture', link: '/en/guide/architecture' },
  { text: 'Consolidation', link: '/en/guide/consolidation' },
  { text: '中文', link: '/' },
];

const zhSidebar = [
  {
    text: '产品与规划',
    items: [
      { text: '项目方案', link: '/guide/project-plan' },
      { text: '开发计划', link: '/guide/dev-plan' },
      { text: '路线图', link: '/guide/roadmap' },
      { text: '开源治理', link: '/guide/open-source' },
    ],
  },
  {
    text: '技术',
    items: [
      { text: '架构说明', link: '/guide/architecture' },
      { text: '数据模型', link: '/guide/data-model' },
      { text: '合并引擎', link: '/guide/consolidation' },
      { text: '预算引擎', link: '/guide/budget' },
      { text: 'API 参考', link: '/guide/api' },
      { text: '连接器规划', link: '/guide/connectors' },
      { text: '附注模块规划', link: '/guide/notes-module' },
      { text: '安全与权限', link: '/guide/security' },
    ],
  },
  {
    text: '使用',
    items: [
      { text: '快速开始', link: '/guide/quickstart' },
      { text: '示例场景', link: '/guide/demo-scenario' },
      { text: '术语表', link: '/guide/glossary' },
      { text: 'FAQ', link: '/guide/faq' },
    ],
  },
  {
    text: '手册与 ADR',
    items: [
      { text: '开发手册（节选）', link: '/guide/handbook-index' },
      { text: 'ADR 索引', link: '/guide/adr-index' },
    ],
  },
];

const enSidebar = [
  {
    text: 'Product',
    items: [
      { text: 'Project Plan', link: '/en/guide/project-plan' },
      { text: 'Development Plan', link: '/en/guide/dev-plan' },
      { text: 'Roadmap', link: '/en/guide/roadmap' },
      { text: 'Open Source', link: '/en/guide/open-source' },
    ],
  },
  {
    text: 'Technical',
    items: [
      { text: 'Architecture', link: '/en/guide/architecture' },
      { text: 'Data Model', link: '/en/guide/data-model' },
      { text: 'Consolidation', link: '/en/guide/consolidation' },
      { text: 'Budgeting', link: '/en/guide/budget' },
      { text: 'API Reference', link: '/en/guide/api' },
      { text: 'Connectors', link: '/en/guide/connectors' },
      { text: 'Notes Module', link: '/en/guide/notes-module' },
      { text: 'Security', link: '/en/guide/security' },
    ],
  },
  {
    text: 'Usage',
    items: [
      { text: 'Quickstart', link: '/en/guide/quickstart' },
      { text: 'Demo Scenario', link: '/en/guide/demo-scenario' },
      { text: 'Glossary', link: '/en/guide/glossary' },
      { text: 'FAQ', link: '/en/guide/faq' },
    ],
  },
];

export default defineConfig({
  lang: 'zh-CN',
  title: 'Stratus EPM',
  description: 'Open-source group consolidation, budgeting and management reporting',
  cleanUrls: true,
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'Stratus EPM',
      description: '开源集团财务管控：合并报表 · 全面预算 · 管理分析',
      themeConfig: {
        nav: zhNav,
        sidebar: zhSidebar,
        outline: { label: '本页目录' },
        docFooter: { prev: '上一篇', next: '下一篇' },
        footer: {
          message: 'Apache-2.0 · Stratus EPM Contributors',
          copyright: 'Copyright 2026',
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: 'Stratus EPM',
      description: 'Open-source group financial consolidation, budgeting & reporting',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
        outline: { label: 'On this page' },
        docFooter: { prev: 'Previous', next: 'Next' },
        footer: {
          message: 'Apache-2.0 · Stratus EPM Contributors',
          copyright: 'Copyright 2026',
        },
      },
    },
  },
  themeConfig: {
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Maicarons/stratus-epm' }],
  },
});
