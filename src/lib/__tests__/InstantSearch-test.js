import algoliasearchHelper from 'algoliasearch-helper';
import { createSearchClient } from '../../../test/mock/createSearchClient';
import InstantSearch from '../InstantSearch';
import version from '../version';

jest.mock('algoliasearch-helper', () => {
  const module = require.requireActual('algoliasearch-helper');

  return jest.fn((...args) => {
    const helper = module(...args);

    const mock = jest.fn();
    helper.searchOnlyWithDerivedHelpers = mock;

    return helper;
  });
});

describe('Usage', () => {
  it('throws without indexName', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new InstantSearch({ indexName: undefined });
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`indexName\` option is required.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws without searchClient', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new InstantSearch({ indexName: 'indexName', searchClient: undefined });
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`searchClient\` option is required.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws if searchClient does not implement a search method', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new InstantSearch({ indexName: 'indexName', searchClient: {} });
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`searchClient\` must implement a \`search\` method.

See: https://www.algolia.com/doc/guides/building-search-ui/going-further/backend-search/in-depth/backend-instantsearch/js/"
`);
  });

  it('throws with invalid insightsClient', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
        insightsClient: 'insights',
      });
    }).toThrowErrorMatchingInlineSnapshot(
      `"The provided \`insightsClient\` must be a function."`
    );
  });

  it('stores insightsClient on instance', () => {
    const insightsClient = jest.fn();
    const instance = new InstantSearch({
      indexName: 'indexName',
      searchClient: { search: () => {} },
      insightsClient,
    });
    expect(instance.insightsClient).toEqual(insightsClient);
  });

  it('throws if addWidgets is called with a single widget', () => {
    expect(() => {
      const search = new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
      });
      search.addWidgets({});
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`addWidgets\` method expects an array of widgets. Please use \`addWidget\`.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws if a widget without render or init method is added', () => {
    const widgets = [{ render: undefined, init: undefined }];

    expect(() => {
      const search = new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
      });
      search.addWidgets(widgets);
    }).toThrowErrorMatchingInlineSnapshot(`
"The widget definition expects a \`render\` and/or an \`init\` method.

See: https://www.algolia.com/doc/guides/building-search-ui/widgets/create-your-own-widgets/js/"
`);
  });

  it('does not throw with a widget having a init method', () => {
    const widgets = [{ init: () => {} }];

    expect(() => {
      const search = new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
      });
      search.addWidgets(widgets);
    }).not.toThrow();
  });

  it('does not throw with a widget having a render method', () => {
    const widgets = [{ render: () => {} }];

    expect(() => {
      const search = new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
      });
      search.addWidgets(widgets);
    }).not.toThrow();
  });

  it('throws if removeWidgets is called with a single widget', () => {
    expect(() => {
      const search = new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
      });
      search.removeWidgets({});
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`removeWidgets\` method expects an array of widgets. Please use \`removeWidget\`.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws if a widget without dispose method is removed', () => {
    const widgets = [{ init: () => {}, render: () => {}, dispose: undefined }];

    expect(() => {
      const search = new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
      });
      search.removeWidgets(widgets);
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`dispose\` method is required to remove the widget.

See: https://www.algolia.com/doc/guides/building-search-ui/widgets/create-your-own-widgets/js/#the-widget-lifecycle-and-api"
`);
  });
});

describe('InstantSearch lifecycle', () => {
  let algoliasearch;
  let client;
  let appId;
  let apiKey;
  let indexName;
  let searchParameters;
  let search;

  beforeEach(() => {
    client = {
      search(requests) {
        return Promise.resolve({
          results: requests.map(() => ({})),
        });
      },
      addAlgoliaAgent: jest.fn(),
    };

    algoliasearch = jest.fn().mockReturnValue(client);

    appId = 'appId';
    apiKey = 'apiKey';
    indexName = 'lifecycle';

    searchParameters = {
      some: 'configuration',
      values: [-2, -1],
      index: indexName,
      another: { config: 'parameter' },
    };

    search = new InstantSearch({
      indexName,
      searchClient: algoliasearch(appId, apiKey),
      searchParameters,
    });
  });

  afterEach(() => {
    client.addAlgoliaAgent.mockClear();
    algoliasearchHelper.mockClear();
  });

  it('calls algoliasearch(appId, apiKey)', () => {
    expect(algoliasearch).toHaveBeenCalledTimes(1);
    expect(algoliasearch).toHaveBeenCalledWith(appId, apiKey);
  });

  it('calls addAlgoliaAgent', () => {
    expect(client.addAlgoliaAgent).toHaveBeenCalledTimes(1);
    expect(client.addAlgoliaAgent).toHaveBeenCalledWith(
      `instantsearch.js (${version})`
    );
  });

  it('does not call algoliasearchHelper', () => {
    expect(algoliasearchHelper).not.toHaveBeenCalled();
  });

  it('does not fail when passing same references inside multiple searchParameters props', () => {
    const disjunctiveFacetsRefinements = { fruits: ['apple'] };
    const facetsRefinements = disjunctiveFacetsRefinements;
    search = new InstantSearch({
      indexName,
      searchClient: algoliasearch(appId, apiKey),
      searchParameters: {
        disjunctiveFacetsRefinements,
        facetsRefinements,
      },
    });
    search.addWidget({
      getConfiguration: () => ({
        disjunctiveFacetsRefinements: { fruits: ['orange'] },
      }),
      init: () => {},
    });
    search.start();
    expect(search.helper.state.facetsRefinements).toEqual({
      fruits: ['apple'],
    });
  });

  describe('when adding a widget', () => {
    let widget;

    beforeEach(() => {
      widget = {
        getConfiguration: jest.fn().mockReturnValue({
          some: 'modified',
          another: { different: 'parameter' },
        }),
        init: jest.fn(({ helper }) => {
          helper.state.sendMeToUrlSync = true;
        }),
        render: jest.fn(),
      };
      search.addWidget(widget);
    });

    it('does not call widget.getConfiguration', () => {
      expect(widget.getConfiguration).not.toHaveBeenCalled();
    });

    describe('when we call search.start', () => {
      beforeEach(() => {
        search.start();
      });

      it('calls widget.getConfiguration(searchParameters)', () => {
        expect(widget.getConfiguration).toHaveBeenCalledWith(searchParameters);
      });

      it('calls algoliasearchHelper(client, indexName, searchParameters)', () => {
        expect(algoliasearchHelper).toHaveBeenCalledTimes(1);
        expect(algoliasearchHelper).toHaveBeenCalledWith(client, indexName, {
          some: 'modified',
          values: [-2, -1],
          index: indexName,
          another: { different: 'parameter', config: 'parameter' },
        });
      });

      it('calls helper.search()', () => {
        expect(
          search.helper.searchOnlyWithDerivedHelpers
        ).toHaveBeenCalledTimes(1);
      });

      it('calls widget.init(helper.state, helper, templatesConfig)', () => {
        expect(widget.getConfiguration).toHaveBeenCalledTimes(1);
        expect(widget.init).toHaveBeenCalledTimes(1);
        const args = widget.init.mock.calls[0][0];
        expect(args.state).toBe(search.helper.state);
        expect(args.helper).toBe(search.helper);
        expect(args.templatesConfig).toBe(search.templatesConfig);
        expect(args.onHistoryChange).toBe(search._onHistoryChange);
      });

      it('does not call widget.render', () => {
        expect(widget.render).not.toHaveBeenCalled();
      });

      describe('when we have results', () => {
        let results;

        beforeEach(() => {
          results = { some: 'data' };
          search.derivedHelper.emit('result', {
            state: search.helper.state,
            results,
          });
        });

        it('calls widget.render({results, state, helper, templatesConfig, instantSearchInstance})', () => {
          expect(widget.render).toHaveBeenCalledTimes(1);
          expect(widget.render.mock.calls[0][0]).toMatchSnapshot({
            helper: expect.objectContaining({
              state: expect.objectContaining({
                another: {
                  config: 'parameter',
                  different: 'parameter',
                },
              }),
            }),
            instantSearchInstance: expect.any(InstantSearch),
            state: expect.objectContaining({
              another: {
                config: 'parameter',
                different: 'parameter',
              },
            }),
          });
        });
      });
    });
  });

  describe('when we have 5 widgets (at once)', () => {
    let widgets;

    beforeEach(() => {
      widgets = Array.from({ length: 5 }, (_widget, widgetIndex) => ({
        init() {},
        getConfiguration: jest.fn().mockReturnValue({ values: [widgetIndex] }),
      }));
      search.addWidgets(widgets);
      search.start();
    });

    it('recursively merges searchParameters.values array', () => {
      expect(algoliasearchHelper.mock.calls[0][2].values).toEqual([
        -2,
        -1,
        0,
        1,
        2,
        3,
        4,
      ]);
    });
  });

  describe('when render happens', () => {
    const render = jest.fn();
    beforeEach(() => {
      render.mockReset();
      const widgets = Array.from({ length: 5 }, () => ({ render }));

      widgets.forEach(search.addWidget, search);

      search.start();
    });

    it('emits render when all render are done (using on)', () => {
      const onRender = jest.fn();
      search.on('render', onRender);

      expect(render).toHaveBeenCalledTimes(0);
      expect(onRender).toHaveBeenCalledTimes(0);

      search.derivedHelper.emit('result', {
        results: null,
        state: search.helper.state,
      });

      expect(render).toHaveBeenCalledTimes(5);
      expect(onRender).toHaveBeenCalledTimes(1);

      search.derivedHelper.emit('result', {
        results: null,
        state: search.helper.state,
      });

      expect(render).toHaveBeenCalledTimes(10);
      expect(onRender).toHaveBeenCalledTimes(2);
    });

    it('emits render when all render are done (using once)', () => {
      const onRender = jest.fn();
      search.once('render', onRender);

      expect(render).toHaveBeenCalledTimes(0);
      expect(onRender).toHaveBeenCalledTimes(0);

      search.derivedHelper.emit('result', {
        results: null,
        state: search.helper.state,
      });

      expect(render).toHaveBeenCalledTimes(5);
      expect(onRender).toHaveBeenCalledTimes(1);

      search.derivedHelper.emit('result', {
        results: null,
        state: search.helper.state,
      });

      expect(render).toHaveBeenCalledTimes(10);
      expect(onRender).toHaveBeenCalledTimes(1);
    });
  });

  describe('When removing a widget', () => {
    function registerWidget(
      widgetGetConfiguration = {
        facets: ['categories'],
        maxValuesPerFacet: 10,
      },
      dispose = jest.fn()
    ) {
      const widget = {
        getConfiguration: jest.fn(() => widgetGetConfiguration),
        init: jest.fn(),
        render: jest.fn(),
        dispose,
      };

      search.addWidget(widget);

      return widget;
    }

    beforeEach(() => {
      search = new InstantSearch({
        indexName,
        searchClient: algoliasearch(appId, apiKey),
      });
    });

    it('should unmount a widget without configuration', () => {
      const widget1 = registerWidget({});
      const widget2 = registerWidget({});

      expect(search.widgets).toHaveLength(2);

      search.start();
      search.removeWidget(widget1);
      search.removeWidget(widget2);

      expect(search.widgets).toHaveLength(0);
    });

    it('should unmount a widget with facets configuration', () => {
      const widget1 = registerWidget({ facets: ['price'] }, ({ state }) =>
        state.removeFacet('price')
      );
      search.start();

      expect(search.widgets).toHaveLength(1);
      expect(search.helper.state.facets).toEqual(['price']);

      search.removeWidget(widget1);

      expect(search.widgets).toHaveLength(0);
      expect(search.helper.state.facets).toEqual([]);
    });

    it('should unmount a widget with hierarchicalFacets configuration', () => {
      const widget1 = registerWidget(
        {
          hierarchicalFacets: [
            {
              name: 'price',
              attributes: ['foo'],
              separator: ' > ',
              rootPath: 'lvl1',
              showParentLevel: true,
            },
          ],
        },
        ({ state }) => state.removeHierarchicalFacet('price')
      );
      search.start();

      expect(search.widgets).toHaveLength(1);
      expect(search.helper.state.hierarchicalFacets).toEqual([
        {
          name: 'price',
          attributes: ['foo'],
          separator: ' > ',
          rootPath: 'lvl1',
          showParentLevel: true,
        },
      ]);

      search.removeWidget(widget1);

      expect(search.widgets).toHaveLength(0);
      expect(search.helper.state.hierarchicalFacets).toEqual([]);
    });

    it('should unmount a widget with disjunctiveFacets configuration', () => {
      const widget1 = registerWidget(
        { disjunctiveFacets: ['price'] },
        ({ state }) => state.removeDisjunctiveFacet('price')
      );
      search.start();

      expect(search.widgets).toHaveLength(1);
      expect(search.helper.state.disjunctiveFacets).toEqual(['price']);

      search.removeWidget(widget1);

      expect(search.widgets).toHaveLength(0);
      expect(search.helper.state.disjunctiveFacets).toEqual([]);
    });

    it('should unmount a widget with numericRefinements configuration', () => {
      const widget1 = registerWidget(
        {
          numericRefinements: {
            price: {
              '=': [10],
            },
          },
        },
        ({ state }) => state.removeNumericRefinement('price')
      );
      search.start();

      expect(search.widgets).toHaveLength(1);
      expect(search.helper.state.numericRefinements).toEqual({
        price: {
          '=': [10],
        },
      });

      search.removeWidget(widget1);

      expect(search.widgets).toHaveLength(0);
      expect(search.helper.state.numericRefinements).toEqual({});
    });

    it('should unmount a widget with maxValuesPerFacet configuration', () => {
      const widget1 = registerWidget(undefined, ({ state }) =>
        state
          .removeFacet('categories')
          .setQueryParameter('maxValuesPerFacet', undefined)
      );
      search.start();

      expect(search.widgets).toHaveLength(1);
      expect(search.helper.state.facets).toEqual(['categories']);
      expect(search.helper.state.maxValuesPerFacet).toEqual(10);

      search.removeWidget(widget1);

      expect(search.widgets).toHaveLength(0);
      expect(search.helper.state.facets).toEqual([]);
      expect(search.helper.state.maxValuesPerFacet).toBe(undefined);
    });

    it('should unmount multiple widgets at once', () => {
      const widget1 = registerWidget(
        {
          numericRefinements: {
            price: {
              '=': [10],
            },
          },
        },
        ({ state }) => state.removeNumericRefinement('price')
      );

      const widget2 = registerWidget(
        { disjunctiveFacets: ['price'] },
        ({ state }) => state.removeDisjunctiveFacet('price')
      );

      search.start();

      expect(search.widgets).toHaveLength(2);
      expect(search.helper.state.disjunctiveFacets).toEqual(['price']);
      expect(search.helper.state.numericRefinements).toEqual({
        price: {
          '=': [10],
        },
      });

      search.removeWidgets([widget1, widget2]);

      expect(search.widgets).toHaveLength(0);
      expect(search.helper.state.disjunctiveFacets).toEqual([]);
      expect(search.helper.state.numericRefinements).toEqual({});
    });
  });

  describe('When adding widgets after start', () => {
    function registerWidget(widgetGetConfiguration = {}, dispose = jest.fn()) {
      const widget = {
        getConfiguration: jest.fn().mockReturnValue(widgetGetConfiguration),
        init: jest.fn(),
        render: jest.fn(),
        dispose,
      };

      return widget;
    }

    beforeEach(() => {
      search = new InstantSearch({
        indexName,
        searchClient: algoliasearch(appId, apiKey),
      });
    });

    it('should add widgets after start', () => {
      search.start();

      expect(search.helper.searchOnlyWithDerivedHelpers).toHaveBeenCalledTimes(
        1
      );
      expect(search.widgets).toHaveLength(0);
      expect(search.started).toBe(true);

      const widget1 = registerWidget({ facets: ['price'] });
      search.addWidget(widget1);

      expect(search.helper.searchOnlyWithDerivedHelpers).toHaveBeenCalledTimes(
        2
      );
      expect(widget1.init).toHaveBeenCalledTimes(1);

      const widget2 = registerWidget({ disjunctiveFacets: ['categories'] });
      search.addWidget(widget2);

      expect(widget2.init).toHaveBeenCalledTimes(1);
      expect(search.helper.searchOnlyWithDerivedHelpers).toHaveBeenCalledTimes(
        3
      );

      expect(search.widgets).toHaveLength(2);
      expect(search.helper.state.facets).toEqual(['price']);
      expect(search.helper.state.disjunctiveFacets).toEqual(['categories']);
    });

    it('should trigger only one search using `addWidgets()`', () => {
      search.start();

      expect(search.helper.searchOnlyWithDerivedHelpers).toHaveBeenCalledTimes(
        1
      );
      expect(search.widgets).toHaveLength(0);
      expect(search.started).toBe(true);

      const widget1 = registerWidget({ facets: ['price'] });
      const widget2 = registerWidget({ disjunctiveFacets: ['categories'] });

      search.addWidgets([widget1, widget2]);

      expect(search.helper.searchOnlyWithDerivedHelpers).toHaveBeenCalledTimes(
        2
      );
      expect(search.helper.state.facets).toEqual(['price']);
      expect(search.helper.state.disjunctiveFacets).toEqual(['categories']);
    });

    it('should not trigger a search without widgets to add', () => {
      search.start();

      expect(search.helper.searchOnlyWithDerivedHelpers).toHaveBeenCalledTimes(
        1
      );
      expect(search.widgets).toHaveLength(0);
      expect(search.started).toBe(true);

      search.addWidgets([]);

      expect(search.helper.searchOnlyWithDerivedHelpers).toHaveBeenCalledTimes(
        1
      );
      expect(search.widgets).toHaveLength(0);
      expect(search.started).toBe(true);
    });
  });

  it('should remove all widgets without triggering a search on dispose', done => {
    search = new InstantSearch({
      indexName,
      searchClient: algoliasearch(appId, apiKey),
    });

    const widgets = Array.from({ length: 5 }, () => ({
      getConfiguration: () => ({}),
      init: jest.fn(),
      render: jest.fn(),
      dispose: jest.fn(),
    }));

    search.addWidgets(widgets);
    search.start();

    expect(search.widgets).toHaveLength(5);
    expect(search.helper.searchOnlyWithDerivedHelpers).toHaveBeenCalledTimes(1);
    expect(search.started).toBe(true);

    // Calling `dispose()` deletes the reference of the `helper`
    const { helper } = search;

    search.dispose();

    setTimeout(() => {
      // `removeWidgets` is batched. To actually test that the search is not
      // called we have to wait for the timeout. Not the best solution but it
      // works.
      expect(search.widgets).toHaveLength(0);
      expect(helper.searchOnlyWithDerivedHelpers).toHaveBeenCalledTimes(1);
      expect(search.started).toBe(false);
      done();
    }, 100);
  });
});

describe('dispose', () => {
  it('should set the helper to `null`', () => {
    const search = new InstantSearch({
      indexName: '',
      searchClient: {
        search() {
          return Promise.resolve({
            results: [
              {
                query: 'fake query',
              },
            ],
          });
        },
      },
    });

    search.start();

    expect(search.helper).not.toBe(null);

    search.dispose();

    expect(search.helper).toBe(null);

    search.start();

    expect(search.helper).not.toBe(null);
  });

  it('should remove the listeners on the helper', done => {
    const search = new InstantSearch({
      indexName: '',
      searchClient: {
        search() {
          return Promise.resolve({
            results: [
              {
                query: 'fake query',
              },
            ],
          });
        },
      },
    });

    search.on('error', () => {
      done.fail('InstantSearch should not throw an error.');
    });

    search.start();

    search.dispose();

    done();
  });

  it('should set the DerivedHelper to `null`', () => {
    const search = new InstantSearch({
      indexName: '',
      searchClient: {
        search() {
          return Promise.resolve({
            results: [
              {
                query: 'fake query',
              },
            ],
          });
        },
      },
    });

    search.start();

    expect(search.derivedHelper).not.toBe(null);

    search.dispose();

    expect(search.derivedHelper).toBe(null);

    search.start();

    expect(search.derivedHelper).not.toBe(null);
  });

  it('should detach the DerivedHelper', () => {
    const search = new InstantSearch({
      indexName: '',
      searchClient: {
        search() {
          return Promise.resolve({
            results: [
              {
                query: 'fake query',
              },
            ],
          });
        },
      },
    });

    search.start();

    expect(search.helper.derivedHelpers).toHaveLength(1);

    const { helper } = search;

    search.dispose();

    expect(helper.derivedHelpers).toHaveLength(0);
  });
});

it('Allows to start without widgets', () => {
  const instance = new InstantSearch({
    searchClient: {
      search() {
        return Promise.resolve({
          results: [
            {
              query: 'fake query',
            },
          ],
        });
      },
    },
    indexName: 'bogus',
  });

  expect(() => instance.start()).not.toThrow();
});

it('Does not allow to start twice', () => {
  const instance = new InstantSearch({
    searchClient: {
      search() {
        return Promise.resolve({
          results: [
            {
              query: 'fake query',
            },
          ],
        });
      },
    },
    indexName: 'bogus',
  });

  expect(() => instance.start()).not.toThrow();
  expect(() => {
    instance.start();
  }).toThrowErrorMatchingInlineSnapshot(`
"The \`start\` method has already been called once.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
});
