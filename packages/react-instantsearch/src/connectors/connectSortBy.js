import {PropTypes} from 'react';

import createConnector from '../core/createConnector';

function getCurrentRefinement(props, state) {
  const {id} = props;
  if (state[id]) {
    return state[id];
  }
  if (props.defaultRefinement) {
    return props.defaultRefinement;
  }
  return null;
}

/**
 * connectSortBy connector provides the logic to build a widget that will
 *  displays a list of indexes allowing a user to change the hits are sorting.
 * @name connectSortBy
 * @kind connector
 * @category connector
 * @propType {string} [id="sort_by"] - URL state serialization key.
 * @propType {string} defaultRefinement - The default selected index.
 * @propType {{value, label}[]} items - The list of indexes to search in.
 * @providedPropType {function} refine - a function to remove a single filter
 * @providedPropType {function} createURL - a function to generate a URL for the corresponding state
 * @providedPropType {string[]} currentRefinement - the refinement currently applied
 * @providedPropType {array.<{label: string, value: string}>} items - the list of indexes the SortBy can display.
 */
export default createConnector({
  displayName: 'AlgoliaSortBy',

  propTypes: {
    id: PropTypes.string,
    defaultRefinement: PropTypes.string,
  },

  defaultProps: {
    id: 'sort_by',
  },

  getProps(props, state) {
    const currentRefinement = getCurrentRefinement(props, state);
    return {currentRefinement};
  },

  refine(props, state, nextRefinement) {
    return {
      ...state,
      [props.id]: nextRefinement,
    };
  },

  getSearchParameters(searchParameters, props, state) {
    const selectedIndex = getCurrentRefinement(props, state);
    return searchParameters.setIndex(selectedIndex);
  },

  getMetadata(props) {
    return {id: props.id};
  },
});
