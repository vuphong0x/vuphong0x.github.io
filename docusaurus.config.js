// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Android Knowledge Hub',
  tagline: 'Comprehensive Android development guide & interview prep',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://vuphong0x.github.io',
  baseUrl: '/',

  organizationName: 'vuphong0x',
  projectName: 'vuphong0x.github.io',
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'warn',

  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      ({
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      }),
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
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
      image: 'img/android-social-card.png',
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
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
            label: '📚 Docs',
          },
          {
            to: '/docs/interview/',
            label: '💬 Interview',
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
              {label: 'Getting Started', to: '/docs/'},
              {label: 'Kotlin', to: '/docs/foundation/kotlin/'},
              {label: 'Architecture', to: '/docs/architecture/'},
            ],
          },
          {
            title: 'Quick Links',
            items: [
              {label: 'Interview Questions', to: '/docs/interview/'},
              {label: 'Performance', to: '/docs/performance/'},
              {label: 'Testing', to: '/docs/testing/'},
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
        copyright: `Copyright © ${new Date().getFullYear()} Android Knowledge Hub. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['kotlin', 'groovy', 'java', 'bash', 'diff', 'json'],
      },
    }),
};

export default config;
