export default {
  plugins: ['plugins/markdown'],
  source: {
    include: ['src/**/*.mjs', 'package.json', 'README.md'],
    includePattern: '.+\\.(js(doc|x)?|mjs)$',
    exclude: ['node_modules', 'tests', 'docs'],
  },
  opts: {
    destination: 'docs',
    template: './node_modules/ink-docstrap/template',
    encoding: 'utf8',
    recurse: true,
    private: true,
  },
  templates: {
    collapse: true,
    linenums: true,
    theme: 'united',
    resources: {
      google: 'https://www.google.com/',
    },
    outputSourceFiles: true,
    monospaceLinks: false,
    systemName: 'HLSDownloader',
    inverseNav: true,
    logofile: 'https://nurrony.github.io/hlsdownloader',
    copyright: 'Copyright ©' + new Date().getFullYear() + ' Nur Rony',
  },
};
