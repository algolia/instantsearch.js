import { storiesOf } from 'dev-novel';
import { wrapWithHits } from '../utils/wrap-with-hits.js';
import * as widgets from './widgets/index.js';
import initClearAllStories from './stories/clear-all.stories';
import initCurrentRefinedValuesStories from './stories/current-refined-values.stories';
import initHierarchicalMenuStories from './stories/hierarchical-menu.stories';
import initHitsStories from './stories/hits.stories';
import initHitsPerPageSelectorStories from './stories/hits-per-page-selector.stories';
import initInfiniteHitsStories from './stories/infinite-hits.stories';
import initMenuStories from './stories/menu.stories';
import initNumericRefinementListStories from './stories/numeric-refinement-list.stories';
import initNumericSelectorStories from './stories/numeric-selector.stories';
import initPaginationStories from './stories/pagination.stories';

// transform `container` to jQuery object
const wrap = fn => wrapWithHits(container => fn(window.$(container)));

export default () => {
  initClearAllStories();
  initCurrentRefinedValuesStories();
  initHierarchicalMenuStories();
  initHitsStories();
  initHitsPerPageSelectorStories();
  initInfiniteHitsStories();
  initMenuStories();
  initNumericRefinementListStories();
  initNumericSelectorStories();
  initPaginationStories();

  storiesOf('RefinementList').add(
    'default',
    wrap(containerNode => {
      window.search.addWidget(
        widgets.refinementList({
          containerNode,
          attributeName: 'brand',
          operator: 'or',
          limit: 10,
          title: 'Brands',
        })
      );
    })
  );

  storiesOf('PriceRanges').add(
    'default',
    wrap(containerNode => {
      window.search.addWidget(
        widgets.priceRanges({
          containerNode,
          attributeName: 'price',
        })
      );
    })
  );

  storiesOf('SearchBox').add(
    'default',
    wrap(containerNode => {
      const inputNode = document.createElement('input');
      containerNode.appendChild(inputNode);
      window.search.addWidget(widgets.searchBox({ inputNode }));
    })
  );

  storiesOf('SortBySelector').add(
    'default',
    wrap(containerNode => {
      window.search.addWidget(
        widgets.sortBySelector({
          containerNode,
          indices: [
            { name: 'instant_search', label: 'Most relevant' },
            { name: 'instant_search_price_asc', label: 'Lowest price' },
            { name: 'instant_search_price_desc', label: 'Highest price' },
          ],
        })
      );
    })
  );

  storiesOf('StarRating').add('default', containerNode => {
    window.search.addWidget(
      widgets.starRating({
        containerNode,
        attributeName: 'rating',
        max: 5,
      })
    );
  });

  storiesOf('Stats').add(
    'default',
    wrap(containerNode => {
      window.search.addWidget(widgets.stats({ containerNode }));
    })
  );

  storiesOf('Toggle').add(
    'default',
    wrap(containerNode => {
      window.search.addWidget(
        widgets.toggle({
          containerNode,
          attributeName: 'free_shipping',
          label: 'Free Shipping (toggle single value)',
          title: 'Free Shipping',
        })
      );
    })
  );
};
