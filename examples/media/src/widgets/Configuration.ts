import { configure } from 'instantsearch.js/es/widgets';

export const configuration = configure({
  attributesToSnippet: ['description:25'],
  snippetEllipsisText: '…',
});
