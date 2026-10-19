// @ts-check
import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Android Knowledge Hub',
  tagline: 'Hiểu cơ chế, thiết kế có đánh đổi, kiểm chứng bằng thực hành',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://vuphong0x.github.io',
  baseUrl: '/',

  organizationName: 'vuphong0x',
  projectName: 'vuphong0x.github.io',
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'throw',

  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

i18n: {
  defaultLocale: 'vi',
    locales: ['vi'],
  },

themes: [
  [
    '@easyops-cn/docusaurus-search-local',
    /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
    ({
      hashed: true,
      language: ['en', 'vi'],
      highlightSearchTermsOnTargetPage: true,
      explicitSearchResultPath: true,
      docsRouteBasePath: '/',
      indexBlog: false,
    }),
  ],
],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          showLastUpdateTime: true,
          showLastUpdateAuthor: false,
          editUrl:
            'https://github.com/vuphong0x/vuphong0x.github.io/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

    themeConfig:
/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
({
  image: 'img/docusaurus-social-card.jpg',
  colorMode: {
    defaultMode: 'dark',
    disableSwitch: false,
    respectPrefersColorScheme: false,
  },
  navbar: {
    title: 'Android Knowledge Hub',
    logo: {
      alt: 'Android Knowledge Hub',
      src: 'img/logo.svg',
    },
    items: [
      {
        type: 'docSidebar',
        sidebarId: 'knowledgeSidebar',
        position: 'left',
        label: '📚 Tài liệu',
      },
      {
        to: '/interview/senior-android',
        label: 'Lộ trình Senior',
        position: 'left',
      },
      {
        to: '/category/interview',
        label: '💬 Interview',
        position: 'left',
      },
      {
        to: '/quiz',
        label: '🎮 Quiz',
        position: 'left',
      },
      {
        href: 'https://github.com/vuphong0x',
        label: 'GitHub',
        position: 'right',
      },
    ],
  },
  footer: {
    style: 'dark',
    links: [
      {
        title: 'Knowledge',
        items: [
          { label: 'Getting Started', to: '/' },
          { label: 'Kotlin', to: '/category/kotlin' },
          { label: 'Architecture', to: '/category/architecture' },
        ],
      },
      {
        title: 'Quick Links',
        items: [
          { label: 'Interview Questions', to: '/category/interview' },
          { label: 'Performance', to: '/category/performance' },
          { label: 'Testing', to: '/category/testing' },
        ],
      },
      {
        title: 'More',
        items: [
          {
            label: 'GitHub',
            href: 'https://github.com/vuphong0x',
          },
        ],
      },
    ],
    copyright: `Copyright © ${new Date().getFullYear()} Android Knowledge Hub. Built with PhongVV.`,
  },
  prism: {
    theme: prismThemes.github,
    darkTheme: prismThemes.dracula,
    additionalLanguages: ['kotlin', 'groovy', 'java', 'bash', 'diff', 'json'],
  },
}),
};

export default config;
