import { searchBox as searchBoxWidget } from 'instantsearch.js/es/widgets';

export const searchBox = searchBoxWidget({
  container: '[data-widget="searchbox"]',
  placeholder: 'Articles, categories, topics or content',
  showSubmit: false,
});
