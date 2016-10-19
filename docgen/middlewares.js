import headings from 'metalsmith-headings';
import layouts from 'metalsmith-layouts';
import msWebpack from 'ms-webpack';
import navigation from 'metalsmith-navigation';
import nav from './plugins/navigation.js';
import sass from 'metalsmith-sass';

import assets from './plugins/assets.js';
import helpers from './plugins/helpers.js';
import ignore from './plugins/ignore.js';
import jsdoc from './plugins/jsdoc-data.js';
import markdown from './plugins/markdown.js';
import onlyChanged from './plugins/onlyChanged.js';
import webpackEntryMetadata from './plugins/webpackEntryMetadata.js';

// performance and debug info for metalsmith, when needed see usage below
// import {start as perfStart, stop as perfStop} from './plugins/perf.js';

import webpackStartConfig from './webpack.config.start.babel.js';
import webpackBuildConfig from './webpack.config.build.babel';

const common = [
  helpers,
  assets({
    source: './assets/',
    destination: './assets/',
  }),
  ignore(fileName => {
    // This is a fix for VIM swp files inside src/,
    // We could also configure VIM to store swp files somewhere else
    // http://stackoverflow.com/questions/1636297/how-to-change-the-folder-path-for-swp-files-in-vim
    if (/\.swp$/.test(fileName)) return true;

    // if it's a build js file, keep it (`build`)
    if (/-build\.js$/.test(fileName)) return false;

    // if it's an example JavaScript file, keep it
    if (/examples\/(.*)?\.js$/.test(fileName)) return false;

    // if it's any other JavaScript file, ignore it, it's handled by build files above
    if (/\.js$/.test(fileName)) return true;

    // ignore scss partials, only include scss entrypoints
    if (/_.*\.s[ac]ss/.test(fileName)) return true;

    // otherwise, keep file
    return false;
  }),
  markdown,
  headings('h2'),
  jsdoc({
    src: '../packages/react-instantsearch/src/widgets/*/@(index|connect).js',
  }),
  jsdoc({
    src: '../packages/react-instantsearch/src/core/InstantSearch.js',
  }),
  nav(),
  // After markdown, so that paths point to the correct HTML file
  navigation({
    core: {
      sortBy: 'nav_sort',
      filterProperty: 'nav_groups',
    },
    widget: {
      sortBy: 'nav_sort',
      filterProperty: 'nav_groups',
    },
    connector: {
      sortBy: 'nav_sort',
      filterProperty: 'nav_groups',
    },
    examples: {
      sortBy: 'nav_sort',
      filterProperty: 'nav_groups',
    },
    gettingstarted: {
      sortBy: 'nav_sort',
      filterProperty: 'nav_groups',
    },
  }, {
    navListProperty: 'navs',
  }),
  // perfStart(),
  sass({
    sourceMap: true,
    sourceMapContents: true,
  }),
  // perfStop(),
];

// development mode
export const start = [
  webpackEntryMetadata(webpackStartConfig),
  ...common,
  onlyChanged,
  layouts('pug'),
];

export const build = [
  msWebpack({
    ...webpackBuildConfig,
    stats: {
      chunks: false,
      modules: false,
      chunkModules: false,
      reasons: false,
      cached: false,
      cachedAssets: false,
    },
  }),
  ...common,
  layouts('pug'),
];
