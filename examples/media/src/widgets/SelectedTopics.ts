import { currentRefinements } from 'instantsearch.js/es/widgets';

export const createSelectedTopics = ({ container }) =>
  currentRefinements({
    container,
    includedAttributes: ['topics'],
  });
