import { sortBy as sortByWidget } from 'instantsearch.js/es/widgets';

export const sortByDesktop = sortByWidget({
  container: '[data-widget="sort-by-desktop"]',
  items: [
    {
      label: 'Most relevant',
      value: 'instant_search_media',
    },
    {
      label: 'Most popular',
      value: 'instant_search_media_engagement_desc',
    },
  ],
});
