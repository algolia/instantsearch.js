import React, { render, unmountComponentAtNode } from 'preact-compat';
import cx from 'classnames';
import RefinementList from '../../components/RefinementList/RefinementList.js';
import connectHierarchicalMenu from '../../connectors/hierarchical-menu/connectHierarchicalMenu';
import defaultTemplates from './defaultTemplates.js';
import { prepareTemplateProps, getContainerNode } from '../../lib/utils.js';
import { component } from '../../lib/suit';

const suit = component('HierarchicalMenu');

const renderer = ({
  cssClasses,
  containerNode,
  showMore,
  templates,
  renderState,
}) => (
  {
    createURL,
    items,
    refine,
    instantSearchInstance,
    isShowingMore,
    toggleShowMore,
    canToggleShowMore,
  },
  isFirstRendering
) => {
  if (isFirstRendering) {
    renderState.templateProps = prepareTemplateProps({
      defaultTemplates,
      templatesConfig: instantSearchInstance.templatesConfig,
      templates,
    });
    return;
  }

  render(
    <RefinementList
      createURL={createURL}
      cssClasses={cssClasses}
      facetValues={items}
      templateProps={renderState.templateProps}
      toggleRefinement={refine}
      showMore={showMore}
      toggleShowMore={toggleShowMore}
      isShowingMore={isShowingMore}
      canToggleShowMore={canToggleShowMore}
    />,
    containerNode
  );
};

const usage = `Usage:
hierarchicalMenu({
  container,
  attributes,
  [ separator=' > ' ],
  [ rootPath ],
  [ showParentLevel=false ],
  [ limit=10 ],
  [ sortBy=['name:asc'] ],
  [ cssClasses.{root, noRefinementRoot, list, childList, item, selectedItem, parentItem, link, label, count, showMore, disabledShowMore} ],
  [ templates.{item, showMoreText} ],
  [ transformItems ]
})`;
/**
 * @typedef {Object} HierarchicalMenuCSSClasses
 * @property {string|string[]} [root] CSS class to add to the root element.
 * @property {string|string[]} [noRefinementRoot] CSS class to add to the root element when no refinements.
 * @property {string|string[]} [list] CSS class to add to the list element.
 * @property {string|string[]} [childList] CSS class to add to the child list element.
 * @property {string|string[]} [item] CSS class to add to each item element.
 * @property {string|string[]} [selectedItem] CSS class to add to each selected item element.
 * @property {string|string[]} [parentItem] CSS class to add to each parent item element.
 * @property {string|string[]} [link] CSS class to add to each link (when using the default template).
 * @property {string|string[]} [label] CSS class to add to each label (when using the default template).
 * @property {string|string[]} [count] CSS class to add to each count element (when using the default template).
 * @property {string|string[]} [showMore] CSS class to add to the show more element.
 * @property {string|string[]} [disabledShowMore] CSS class to add to the disabled show more element.
 */

/**
 * @typedef {Object} HierarchicalMenuTemplates
 * @property {string|function(object):string} [item] Item template, provided with `name`, `count`, `isRefined`, `url` data properties.
 * @property {string|function} [showMoreText] Template used for the show more text.
 */

/**
 * @typedef {Object} HierarchicalMenuWidgetOptions
 * @property {string|HTMLElement} container CSS Selector or HTMLElement to insert the widget.
 * @property {string[]} attributes Array of attributes to use to generate the hierarchy of the menu.
 * @property {number} [limit=10] How much facet values to get.
 * @property {string} [separator=" > "] Separator used in the attributes to separate level values.
 * @property {string} [rootPath] Prefix path to use if the first level is not the root level.
 * @property {boolean} [showParentLevel=true] Show the siblings of the selected parent level of the current refined value. This
 * does not impact the root level.
 *
 * The hierarchical menu is able to show or hide the siblings with `showParentLevel`.
 *
 * With `showParentLevel` set to `true` (default):
 * - Parent lvl0
 *   - **lvl1**
 *     - **lvl2**
 *     - lvl2
 *     - lvl2
 *   - lvl 1
 *   - lvl 1
 * - Parent lvl0
 * - Parent lvl0
 *
 * With `showParentLevel` set to `false`:
 * - Parent lvl0
 *   - **lvl1**
 *     - **lvl2**
 * - Parent lvl0
 * - Parent lvl0
 * @property {string[]|function} [sortBy=['name:asc']] How to sort refinements. Possible values: `count|isRefined|name:asc|name:desc`.
 *
 * You can also use a sort function that behaves like the standard Javascript [compareFunction](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Syntax).
 * @property {HierarchicalMenuTemplates} [templates] Templates to use for the widget.
 * @property {HierarchicalMenuCSSClasses} [cssClasses] CSS classes to add to the wrapping elements.
 * @property {function(object[]):object[]} [transformItems] Function to transform the items passed to the templates.
 */

/**
 * The hierarchical menu widget is used to create a navigation based on a hierarchy of facet attributes.
 *
 * It is commonly used for categories with subcategories.
 *
 * All attributes (lvl0, lvl1 here) must be declared as [attributes for faceting](https://www.algolia.com/doc/guides/searching/faceting/#declaring-attributes-for-faceting) in your
 * Algolia settings.
 *
 * By default, the separator we expect is ` > ` (with spaces) but you can use
 * a different one by using the `separator` option.
 * @requirements
 * Your objects must be formatted in a specific way to be
 * able to display hierarchical menus. Here's an example:
 *
 * ```javascript
 * {
 *   "objectID": "123",
 *   "name": "orange",
 *   "categories": {
 *     "lvl0": "fruits",
 *     "lvl1": "fruits > citrus"
 *   }
 * }
 * ```
 *
 * Every level must be specified entirely.
 * It's also possible to have multiple values per level, for example:
 *
 * ```javascript
 * {
 *   "objectID": "123",
 *   "name": "orange",
 *   "categories": {
 *     "lvl0": ["fruits", "vitamins"],
 *     "lvl1": ["fruits > citrus", "vitamins > C"]
 *   }
 * }
 * ```
 * @type {WidgetFactory}
 * @devNovel HierarchicalMenu
 * @category filter
 * @param {HierarchicalMenuWidgetOptions} $0 The HierarchicalMenu widget options.
 * @return {Widget} A new HierarchicalMenu widget instance.
 * @example
 * search.addWidget(
 *   instantsearch.widgets.hierarchicalMenu({
 *     container: '#hierarchical-categories',
 *     attributes: ['hierarchicalCategories.lvl0', 'hierarchicalCategories.lvl1', 'hierarchicalCategories.lvl2'],
 *   })
 * );
 */
export default function hierarchicalMenu({
  container,
  attributes,
  separator = ' > ',
  rootPath = null,
  showParentLevel = true,
  limit = 10,
  sortBy = ['name:asc'],
  cssClasses: userCssClasses = {},
  templates = defaultTemplates,
  showMore = false,
  showMoreLimit,
  transformItems,
} = {}) {
  if (!container || !attributes || !attributes.length) {
    throw new Error(usage);
  }

  const containerNode = getContainerNode(container);

  const cssClasses = {
    root: cx(suit(), userCssClasses.root),
    noRefinementRoot: cx(
      suit({ modifierName: 'noRefinement' }),
      userCssClasses.noRefinementRoot
    ),
    list: cx(suit({ descendantName: 'list' }), userCssClasses.list),
    childList: cx(
      suit({ descendantName: 'list', modifierName: 'child' }),
      userCssClasses.childList
    ),
    item: cx(suit({ descendantName: 'item' }), userCssClasses.item),
    selectedItem: cx(
      suit({ descendantName: 'item', modifierName: 'selected' }),
      userCssClasses.selectedItem
    ),
    parentItem: cx(
      suit({ descendantName: 'item', modifierName: 'parent' }),
      userCssClasses.parentItem
    ),
    link: cx(suit({ descendantName: 'link' }), userCssClasses.link),
    label: cx(suit({ descendantName: 'label' }), userCssClasses.label),
    count: cx(suit({ descendantName: 'count' }), userCssClasses.count),
    showMore: cx(suit({ descendantName: 'showMore' }), userCssClasses.showMore),
    disabledShowMore: cx(
      suit({ descendantName: 'showMore', modifierName: 'disabled' }),
      userCssClasses.disabledShowMore
    ),
  };

  const specializedRenderer = renderer({
    cssClasses,
    containerNode,
    templates,
    showMore,
    renderState: {},
  });

  try {
    const makeHierarchicalMenu = connectHierarchicalMenu(
      specializedRenderer,
      () => unmountComponentAtNode(containerNode)
    );
    return makeHierarchicalMenu({
      attributes,
      separator,
      rootPath,
      showParentLevel,
      limit,
      showMoreLimit,
      sortBy,
      transformItems,
    });
  } catch (error) {
    throw new Error(usage);
  }
}
