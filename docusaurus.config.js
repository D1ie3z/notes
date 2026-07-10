// @ts-check
const { themes } = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'D1ie3z // N0t4s',
  tagline: 'Espero te sirvan, son una porquería pero son algo :)',
  favicon: 'img/favicon.ico',

  url: 'https://soy10.site',
  baseUrl: '/',

  organizationName: 'D1ie3z',
  projectName: 'notes',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themes: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        language: ["es", "en"],
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 10,
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: 'D1ie3z // N0t4s',
        items: [
          {
            href: 'https://d1ie3z.com',
            label: '← d1ie3z.com',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `// D1ie3z — just a random one who loves hacking stuff`,
      },
      prism: {
        theme: themes.dracula,
        darkTheme: themes.dracula,
        additionalLanguages: ['bash', 'python', 'javascript'],
      },
    }),
};

module.exports = config;
