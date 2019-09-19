import { render } from 'preact-compat';
import numericMenu from '../numeric-menu';
import algoliasearchHelper, {
  SearchParameters,
  SearchResults,
} from 'algoliasearch-helper';

jest.mock('preact-compat', () => {
  const module = require.requireActual('preact-compat');

  module.render = jest.fn();

  return module;
});

const encodeValue = (start, end) =>
  window.encodeURI(JSON.stringify({ start, end }));

describe('Usage', () => {
  it('throws without container', () => {
    expect(() => {
      numericMenu({ container: undefined });
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`container\` option is required.

See documentation: https://www.algolia.com/doc/api-reference/widgets/numeric-menu/js/"
`);
  });
});

describe('numericMenu()', () => {
  let container;
  let widget;
  let helper;

  let items;
  let results;
  let createURL;
  let state;

  beforeEach(() => {
    render.mockClear();

    items = [
      { label: 'All' },
      { end: 4, label: 'less than 4' },
      { start: 4, end: 4, label: '4' },
      { start: 5, end: 10, label: 'between 5 and 10' },
      { start: 10, label: 'more than 10' },
    ];

    container = document.createElement('div');
    widget = numericMenu({
      container,
      attribute: 'price',
      items,
      cssClasses: { root: ['root', 'cx'] },
    });

    helper = algoliasearchHelper(
      {},
      '',
      widget.getWidgetSearchParameters(new SearchParameters(), { uiState: {} })
    );

    jest.spyOn(helper, 'search');

    state = helper.state;
    results = new SearchResults(helper.state, [{ nbHits: 0 }]);

    createURL = () => '#';
    widget.init({ helper, instantSearchInstance: {} });
  });

  it('calls twice render(<RefinementList props />, container)', () => {
    widget.render({ state, results, createURL });
    widget.render({ state, results, createURL });

    expect(render).toHaveBeenCalledTimes(2);
    expect(render.mock.calls[0][0]).toMatchSnapshot();
    expect(render.mock.calls[0][1]).toEqual(container);
    expect(render.mock.calls[1][0]).toMatchSnapshot();
    expect(render.mock.calls[1][1]).toEqual(container);
  });

  it('renders with transformed items', () => {
    widget = numericMenu({
      container,
      attribute: 'price',
      items,
      transformItems: allItems =>
        allItems.map(item => ({ ...item, transformed: true })),
    });

    widget.init({ helper, instantSearchInstance: {} });
    widget.render({ state, results, createURL });

    expect(render.mock.calls[0][0]).toMatchSnapshot();
  });

  it('does not alter the initial items when rendering', () => {
    // Note: https://github.com/algolia/instantsearch.js/issues/1010
    // Make sure we work on a copy of the initial facetValues when rendering,
    // not directly editing it

    // Given
    const initialOptions = [{ start: 0, end: 5, label: '1-5' }];
    const initialOptionsClone = [...initialOptions];
    const testWidget = numericMenu({
      container,
      attribute: 'price',
      items: initialOptions,
    });

    // The life cycle impose all the steps
    testWidget.init({ helper, createURL: () => '', instantSearchInstance: {} });

    // When
    testWidget.render({ state, results, createURL });

    // Then
    expect(initialOptions).toEqual(initialOptionsClone);
  });
});
