import { clearRefinements } from 'instantsearch.js/es/widgets';

export const createClearFilters = ({ container }) =>
  clearRefinements({
    container,
    excludedAttributes: ['topics', 'query'],
    templates: {
      resetLabel: 'Clear filters',
    },
  });
