import algoliasearchHelper from 'algoliasearch-helper';
import InstantSearch from '../InstantSearch';
import version from '../version';
import connectSearchBox from '../../connectors/search-box/connectSearchBox';
import connectPagination from '../../connectors/pagination/connectPagination';
import index from '../../widgets/index/index';
import { noop } from '../../lib/utils';
import {
  createSearchClient,
  createControlledSearchClient,
} from '../../../test/mock/createSearchClient';
import { createWidget } from '../../../test/mock/createWidget';
import { runAllMicroTasks } from '../../../test/utils/runAllMicroTasks';

jest.useFakeTimers();

jest.mock('algoliasearch-helper', () => {
  const module = require.requireActual('algoliasearch-helper');
  const mock = jest.fn((...args) => {
    const helper = module(...args);

    const searchOnlyWithDerivedHelpers = helper.searchOnlyWithDerivedHelpers.bind(
      helper
    );

    helper.searchOnlyWithDerivedHelpers = jest.fn((...searchArgs) => {
      return searchOnlyWithDerivedHelpers(...searchArgs);
    });

    return helper;
  });

  Object.entries(module).forEach(([key, value]) => {
    mock[key] = value;
  });

  return mock;
});

beforeEach(() => {
  algoliasearchHelper.mockClear();
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

  it('throws if insightsClient is not a function', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
        insightsClient: 'insights',
      });
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`insightsClient\` option should be a function.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
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

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
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
"The widget definition expects a \`dispose\` method.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws if createURL is called before start', () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    expect(() => search.createURL()).toThrowErrorMatchingInlineSnapshot(`
"The \`start\` method needs to be called before \`createURL\`.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws if refresh is called before start', () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    expect(() => search.refresh()).toThrowErrorMatchingInlineSnapshot(`
"The \`start\` method needs to be called before \`refresh\`.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });
});

describe('InstantSearch', () => {
  it('calls addAlgoliaAgent', () => {
    const searchClient = createSearchClient({
      addAlgoliaAgent: jest.fn(),
    });

    // eslint-disable-next-line no-new
    new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    expect(searchClient.addAlgoliaAgent).toHaveBeenCalledTimes(1);
    expect(searchClient.addAlgoliaAgent).toHaveBeenCalledWith(
      `instantsearch.js (${version})`
    );
  });

  it('does not call algoliasearchHelper', () => {
    // eslint-disable-next-line no-new
    new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    expect(algoliasearchHelper).not.toHaveBeenCalled();
  });

  it('does store insightsClient on the instance', () => {
    const insightsClient = () => {};
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
      insightsClient,
    });

    expect(search.insightsClient).toBe(insightsClient);
  });
});

describe('addWidget(s)', () => {
  it('forwards the call of `addWidget` to the main index', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    expect(search.mainIndex.getWidgets()).toHaveLength(0);

    expect(() => search.addWidget(createWidget())).toWarnDev();

    expect(search.mainIndex.getWidgets()).toHaveLength(1);
  });

  it('forwards the call of `addWidgets` to the main index', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    expect(search.mainIndex.getWidgets()).toHaveLength(0);

    search.addWidgets([createWidget()]);

    expect(search.mainIndex.getWidgets()).toHaveLength(1);
  });
});

describe('removeWidget(s)', () => {
  it('forwards the call to `removeWidget` to the main index', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    const widget = createWidget();

    search.addWidgets([widget]);

    expect(search.mainIndex.getWidgets()).toHaveLength(1);

    expect(() => search.removeWidget(widget)).toWarnDev();

    expect(search.mainIndex.getWidgets()).toHaveLength(0);
  });

  it('forwards the call to `removeWidgets` to the main index', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    const widget = createWidget();

    search.addWidgets([widget]);

    expect(search.mainIndex.getWidgets()).toHaveLength(1);

    search.removeWidgets([widget]);

    expect(search.mainIndex.getWidgets()).toHaveLength(0);
  });
});

describe('start', () => {
  it('creates two Helper one for the instance + one for the index', () => {
    const searchClient = createSearchClient();
    const indexName = 'indexName';
    const search = new InstantSearch({
      indexName,
      searchClient,
    });

    expect(algoliasearchHelper).toHaveBeenCalledTimes(0);

    search.start();

    expect(algoliasearchHelper).toHaveBeenCalledTimes(2);
    expect(algoliasearchHelper).toHaveBeenCalledWith(searchClient, indexName);
  });

  it('replaces the regular `search` with `searchOnlyWithDerivedHelpers`', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    search.start();

    expect(
      search.mainHelper.searchOnlyWithDerivedHelpers
    ).toHaveBeenCalledTimes(1);
  });

  it('calls the provided `searchFunction` with a single request', () => {
    const searchFunction = jest.fn(helper => helper.setQuery('test').search());
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchFunction,
      searchClient,
    });

    expect(searchFunction).toHaveBeenCalledTimes(0);
    expect(searchClient.search).toHaveBeenCalledTimes(0);

    search.start();

    expect(searchFunction).toHaveBeenCalledTimes(1);
    expect(searchClient.search).toHaveBeenCalledTimes(1);
    expect(search.mainIndex.getHelper().state.query).toBe('test');
  });

  it('calls the provided `searchFunction` with multiple requests', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
      searchFunction(helper) {
        const nextState = helper.state
          .addDisjunctiveFacet('brand')
          .addDisjunctiveFacetRefinement('brand', 'Apple');

        helper.setState(nextState).search();
      },
    });

    expect(() => {
      search.start();
    }).not.toThrow();
  });

  it('forwards the `initialUiState` to the main index', () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
      initialUiState: {
        indexName: {
          refinementList: {
            brand: ['Apple'],
          },
        },
      },
    });

    search.start();

    expect(search.mainIndex.getWidgetState()).toEqual({
      indexName: {
        refinementList: {
          brand: ['Apple'],
        },
      },
    });
  });

  it('forwards the router state to the main index', () => {
    const router = {
      read: jest.fn(() => ({
        indexName: {
          hierarchicalMenu: {
            'hierarchicalCategories.lvl0': ['Cell Phones'],
          },
        },
      })),
      write: jest.fn(),
      onUpdate: jest.fn(),
      createURL: jest.fn(() => '#'),
    };

    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
      routing: {
        router,
      },
    });

    search.start();

    expect(search.mainIndex.getWidgetState()).toEqual({
      indexName: {
        hierarchicalMenu: {
          'hierarchicalCategories.lvl0': ['Cell Phones'],
        },
      },
    });
  });

  it('calls `init` on the added widgets', () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    const widget = createWidget();

    search.addWidgets([widget]);

    search.start();

    expect(widget.init).toHaveBeenCalledTimes(1);
  });

  it('triggers a single search with `routing`', async () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      routing: true,
      searchClient,
    });

    expect(searchClient.search).toHaveBeenCalledTimes(0);

    search.start();

    await runAllMicroTasks();

    expect(searchClient.search).toHaveBeenCalledTimes(1);
  });

  it('triggers a search without errors', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    expect(searchClient.search).toHaveBeenCalledTimes(0);

    search.start();

    expect(searchClient.search).toHaveBeenCalledTimes(1);
  });

  it('triggers a search with errors', done => {
    const searchClient = createSearchClient({
      search: jest.fn(() => Promise.reject(new Error('SERVER_ERROR'))),
    });

    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    expect(searchClient.search).toHaveBeenCalledTimes(0);

    search.start();

    search.on('error', event => {
      expect(searchClient.search).toHaveBeenCalledTimes(1);
      expect(event.error).toEqual(new Error('SERVER_ERROR'));
      done();
    });
  });

  it('does start without widgets', () => {
    const searchClient = createSearchClient();
    const instance = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    expect(() => instance.start()).not.toThrow();
  });

  it('does not to start twice', () => {
    const searchClient = createSearchClient();
    const instance = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    expect(() => instance.start()).not.toThrow();
    expect(() => {
      instance.start();
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`start\` method has already been called once.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });
});

describe('dispose', () => {
  it('cancels the scheduled search', async () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    search.addWidgets([createWidget(), createWidget()]);

    search.start();

    await runAllMicroTasks();

    // The call to `addWidgets` schedules a new search
    search.addWidgets([createWidget()]);

    search.dispose();

    // Without the cancel operation, the function call throws an error which
    // prevents the test to complete. We can't assert that the function throws
    // because we don't have access to the promise that throws in the first place.
    await runAllMicroTasks();
  });

  it('cancels the scheduled render', async () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    search.addWidgets([createWidget(), createWidget()]);

    search.start();

    // We only wait for the search to schedule the render. We have now a render
    // that is scheduled, it will be processed in the next microtask if not canceled.
    await Promise.resolve();

    search.dispose();

    // Without the cancel operation, the function call throws an error which
    // prevents the test to complete. We can't assert that the function throws
    // because we don't have access to the promise that throws in the first place.
    await runAllMicroTasks();
  });

  it('cancels the scheduled stalled render', async () => {
    const { searches, searchClient } = createControlledSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    search.addWidgets([createWidget(), createWidget()]);

    search.start();

    // Resolve the `search`
    searches[0].resolver();

    // Wait for the `render`
    await runAllMicroTasks();

    // Simulate a search
    search.mainHelper.search();

    search.dispose();

    // Reaches the delay
    jest.runOnlyPendingTimers();

    // Without the cancel operation, the function call throws an error which
    // prevents the test to complete. We can't assert that the function throws
    // because we don't have access to the promise that throws in the first place.
    await runAllMicroTasks();
  });

  it('removes the widgets from the main index', () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    search.addWidgets([createWidget(), createWidget()]);

    search.start();

    expect(search.mainIndex.getWidgets()).toHaveLength(2);

    search.dispose();

    expect(search.mainIndex.getWidgets()).toHaveLength(0);
  });

  it('calls `dispose` on the main index', () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    const mainIndexDispose = jest.spyOn(search.mainIndex, 'dispose');

    search.start();

    expect(mainIndexDispose).toHaveBeenCalledTimes(0);

    search.dispose();

    expect(mainIndexDispose).toHaveBeenCalledTimes(1);
  });

  it('stops the instance', () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    expect(search.started).toBe(false);

    search.start();

    expect(search.started).toBe(true);

    search.dispose();

    expect(search.started).toBe(false);
  });

  it('removes the listeners on the main Helper', () => {
    const onEventName = jest.fn();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    search.start();

    const { mainHelper } = search;

    mainHelper.on('eventName', onEventName);

    mainHelper.emit('eventName');

    expect(onEventName).toHaveBeenCalledTimes(1);

    search.dispose();

    mainHelper.emit('eventName');

    expect(onEventName).toHaveBeenCalledTimes(1);
  });

  it('removes the listeners on the instance', async () => {
    const onRender = jest.fn();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    search.on('render', onRender);

    search.start();

    await runAllMicroTasks();

    expect(onRender).toHaveBeenCalledTimes(1);

    search.dispose();

    onRender.mockClear();

    search.on('render', onRender);

    search.start();

    await runAllMicroTasks();

    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it('removes the Helpers references', () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    search.start();

    expect(search.mainHelper).not.toBe(null);
    expect(search.helper).not.toBe(null);

    search.dispose();

    expect(search.mainHelper).toBe(null);
    expect(search.helper).toBe(null);

    search.start();

    expect(search.mainHelper).not.toBe(null);
    expect(search.helper).not.toBe(null);
  });
});

describe('scheduleSearch', () => {
  it('defers the call to the `search` method', async () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    search.addWidgets([createWidget()]);

    search.start();

    const mainHelperSearch = jest.spyOn(search.mainHelper, 'search');

    search.scheduleSearch();

    expect(mainHelperSearch).toHaveBeenCalledTimes(0);

    await runAllMicroTasks();

    expect(mainHelperSearch).toHaveBeenCalledTimes(1);
  });

  it('deduplicates the calls to the `search` method', async () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    search.addWidgets([createWidget()]);

    search.start();

    const mainHelperSearch = jest.spyOn(search.mainHelper, 'search');

    search.scheduleSearch();
    search.scheduleSearch();
    search.scheduleSearch();
    search.scheduleSearch();

    expect(mainHelperSearch).toHaveBeenCalledTimes(0);

    await runAllMicroTasks();

    expect(mainHelperSearch).toHaveBeenCalledTimes(1);
  });
});

describe('scheduleRender', () => {
  it('defers the call to the `render` method', async () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    const widget = createWidget();

    search.addWidgets([widget]);

    search.start();

    expect(widget.render).toHaveBeenCalledTimes(0);

    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(1);
  });

  it('deduplicates the calls to the `render` method', async () => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    const widget = createWidget();

    search.addWidgets([widget]);

    search.start();

    expect(widget.render).toHaveBeenCalledTimes(0);

    search.scheduleRender();
    search.scheduleRender();
    search.scheduleRender();
    search.scheduleRender();

    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(1);
  });

  it('emits a `render` event once the render is complete', done => {
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
    });

    const widget = createWidget();

    search.addWidgets([widget]);

    search.start();

    expect(widget.render).toHaveBeenCalledTimes(0);

    search.on('render', () => {
      expect(widget.render).toHaveBeenCalledTimes(1);
      done();
    });
  });
});

describe('scheduleStalledRender', () => {
  it('calls the `render` method on the main index', async () => {
    const { searches, searchClient } = createControlledSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    const widget = createWidget();

    search.addWidgets([widget]);

    search.start();

    // Resolve the `search`
    searches[0].resolver();

    // Wait for the `render`
    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(1);

    // Trigger a new search
    search.mainHelper.search();

    // Reaches the delay
    jest.runOnlyPendingTimers();

    // Wait for the `render`
    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(2);
  });

  it('deduplicates the calls to the `render` method', async () => {
    const { searches, searchClient } = createControlledSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    const widget = createWidget();

    search.addWidgets([widget]);

    search.start();

    // Resolve the `search`
    searches[0].resolver();

    // Wait for the `render`
    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(1);

    // Trigger multiple searches
    search.mainHelper.search();
    search.mainHelper.search();
    search.mainHelper.search();
    search.mainHelper.search();

    // Reaches the delay
    jest.runOnlyPendingTimers();

    // Wait for the `render`
    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(2);
  });

  it('triggers a `render` once the search expires the delay', async () => {
    const { searches, searchClient } = createControlledSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    const widget = createWidget();

    search.addWidgets([widget]);

    expect(widget.render).toHaveBeenCalledTimes(0);

    search.start();

    expect(widget.render).toHaveBeenCalledTimes(0);

    // Resolve the `search`
    searches[0].resolver();

    // Wait for the `render`
    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(1);
    expect(widget.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        searchMetadata: {
          isSearchStalled: false,
        },
      })
    );

    // Trigger a new search
    search.mainHelper.search();

    expect(widget.render).toHaveBeenCalledTimes(1);

    // The delay is reached
    jest.runOnlyPendingTimers();

    // Wait for the `render`
    await runAllMicroTasks();

    // Widgets render because of the stalled search
    expect(widget.render).toHaveBeenCalledTimes(2);
    expect(widget.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        searchMetadata: {
          isSearchStalled: true,
        },
      })
    );

    // Resolve the `search`
    searches[1].resolver();

    // Wait for the `render`
    await runAllMicroTasks();

    // Widgets render because of the results
    expect(widget.render).toHaveBeenCalledTimes(3);
    expect(widget.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        searchMetadata: {
          isSearchStalled: false,
        },
      })
    );
  });
});

describe('createURL', () => {
  const createRouter = () => ({
    read: jest.fn(() => ({})),
    write: jest.fn(),
    onUpdate: jest.fn(),
    createURL: jest.fn(() => '#'),
  });

  it('at top-level returns the default URL for the main index state', () => {
    const router = createRouter();
    router.createURL.mockImplementation(() => 'https://algolia.com');

    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
      routing: {
        router,
      },
    });

    search.start();

    expect(search.createURL()).toBe('https://algolia.com');
  });

  it('at top-level returns a custom URL for the main index state', () => {
    const router = createRouter();
    router.createURL.mockImplementation(() => 'https://algolia.com');

    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
      routing: {
        router,
      },
    });

    search.addWidgets([connectSearchBox(noop)({})]);
    search.start();

    expect(search.createURL({ indexName: { query: 'Apple' } })).toBe(
      'https://algolia.com'
    );
  });

  it('returns the default URL for the main index state', () => {
    const router = createRouter();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
      initialUiState: {
        indexName: {
          query: 'Apple',
        },
      },
      routing: {
        router,
      },
    });

    search.addWidgets([connectSearchBox(noop)({})]);
    search.start();
    search.createURL();

    expect(router.createURL).toHaveBeenCalledWith({
      indexName: {
        query: 'Apple',
      },
    });
  });

  it('returns the URL for nested index states', async () => {
    const router = createRouter();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient: createSearchClient(),
      initialUiState: {
        indexName: {
          query: 'Google',
        },
        indexNameLvl1: {
          query: 'Samsung',
        },
        indexNameLvl2: {
          query: 'Google',
        },
      },
      routing: {
        router,
      },
    });

    search.addWidgets([
      connectSearchBox(noop)({}),
      index({ indexName: 'indexNameLvl1' }).addWidgets([
        connectSearchBox(noop)({}),
        index({ indexName: 'indexNameLvl2' }).addWidgets([
          connectSearchBox(noop)({}),
          connectPagination(noop)({}),
          createWidget({
            render({ helper, createURL }) {
              createURL(helper.state.setPage(3).setQuery('Apple'));
            },
          }),
        ]),
      ]),
    ]);

    search.start();

    // We need to run all micro tasks for the `render` method of the last
    // widget to be called and its `createURL` to be triggered.
    await runAllMicroTasks();

    expect(router.createURL).toHaveBeenCalledWith({
      indexName: {
        query: 'Google',
      },
      indexNameLvl1: {
        query: 'Samsung',
      },
      indexNameLvl2: {
        query: 'Apple',
        page: 4,
      },
    });
  });
});

describe('refresh', () => {
  it('calls `clearCache` on the main Helper', () => {
    const clearCache = jest.fn();
    const searchClient = createSearchClient({
      clearCache,
    });

    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    search.start();

    expect(clearCache).toHaveBeenCalledTimes(0);

    search.refresh();

    expect(clearCache).toHaveBeenCalledTimes(1);
  });

  it('triggers a `search` with the cache emptied', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'indexName',
      searchClient,
    });

    search.start();

    // it is called once with start
    expect(searchClient.search).toHaveBeenCalledTimes(1);

    search.refresh();

    expect(searchClient.search).toHaveBeenCalledTimes(2);
  });
});
