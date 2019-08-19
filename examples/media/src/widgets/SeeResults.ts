import { stats } from 'instantsearch.js/es/widgets';

export const seeResults = stats({
  container: '[data-widget="see-results-button"]',
  templates: {
    text:
      'See {{#helpers.formatNumber}}{{nbHits}}{{/helpers.formatNumber}} results',
  },
});
