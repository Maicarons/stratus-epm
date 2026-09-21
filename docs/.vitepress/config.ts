import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-CN',
  title: 'Stratus EPM',
  description: '开源集团财务管控：合并报表 · 全面预算 · 管理分析',
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/project-plan' },
      { text: '开发计划', link: '/guide/dev-plan' },
      { text: '架构', link: '/guide/architecture' },
      { text: '合并引擎', link: '/guide/consolidation' },
    ],
    sidebar: [
      {
        text: '产品与规划',
        items: [
          { text: '项目方案', link: '/guide/project-plan' },
          { text: '开发计划', link: '/guide/dev-plan' },
          { text: '开源治理', link: '/guide/open-source' },
        ],
      },
      {
        text: '技术',
        items: [
          { text: '架构说明', link: '/guide/architecture' },
          { text: '合并引擎', link: '/guide/consolidation' },
          { text: '预算引擎', link: '/guide/budget' },
          { text: 'API 参考', link: '/guide/api' },
        ],
      },
      {
        text: '使用',
        items: [
          { text: '快速开始', link: '/guide/quickstart' },
          { text: '示例场景', link: '/guide/demo-scenario' },
        ],
      },
    ],
    outline: { label: '本页目录' },
    footer: {
      message: 'Apache-2.0 · Stratus EPM Contributors',
      copyright: 'Copyright 2026',
    },
  },
});
