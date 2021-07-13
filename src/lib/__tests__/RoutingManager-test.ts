/* globals jsdom */

import qs from 'qs';
import { createSearchClient } from '../../../test/mock/createSearchClient';
import { createWidget } from '../../../test/mock/createWidget';
import { runAllMicroTasks } from '../../../test/utils/runAllMicroTasks';
import { wait } from '../../../test/utils/wait';
import { Router, Widget, UiState, StateMapping, RouteState } from '../../types';
import historyRouter from '../routers/history';
import simple from '../stateMappings/simple';
import instantsearch from '../main';

const createFakeRouter = (args: Partial<Router> = {}): Router => ({
  onUpdate(..._args) {},
  write(..._args) {},
  read() {
    return {};
  },
  createURL(..._args) {
    return '';
  },
  dispose() {
    return undefined;
  },
  ...args,
});

const createFakeStateMapping = (
  args: Partial<StateMapping> = {}
): StateMapping => ({
  stateToRoute(uiState) {
    return uiState;
  },
  routeToState(routeState) {
    return routeState;
  },
  ...args,
});

type Entry = Record<string, unknown>;

type HistoryState = {
  index: number;
  entries: Entry[];
  listeners: Array<(value: Entry) => void>;
};

const createFakeHistory = (
  {
    index = -1,
    entries = [],
    listeners = [],
  }: HistoryState = {} as HistoryState
) => {
  const state: HistoryState = {
    index,
    entries,
    listeners,
  };

  return {
    subscribe(listener: (entry: Entry) => void) {
      state.listeners.push(listener);
    },
    push(value: Entry) {
      state.entries.push(value);
      state.index++;
    },
    back() {
      state.index--;
      listeners.forEach(listener => {
        listener(state.entries[state.index]);
      });
    },
  };
};

const createFakeSearchBox = (): Widget =>
  createWidget({
    render({ helper }) {
      (this as any).refine = (value: string) => {
        helper.setQuery(value).search();
      };
    },
    dispose({ state }) {
      return state.setQuery('');
    },
    getWidgetSearchParameters(searchParameters, { uiState }) {
      return searchParameters.setQuery(uiState.query || '');
    },
    getWidgetUiState(uiState, { searchParameters }) {
      return {
        ...uiState,
        query: searchParameters.query,
      };
    },
  });

const createFakeHitsPerPage = (): Widget =>
  createWidget({
    dispose({ state }) {
      return state;
    },
    getWidgetSearchParameters(parameters) {
      return parameters;
    },
    getWidgetUiState(uiState) {
      return uiState;
    },
  });

describe('RoutingManager', () => {
  describe('within instantsearch', () => {
    // eslint-disable-next-line jest/no-done-callback
    test('should write in the router on searchParameters change', done => {
      const searchClient = createSearchClient();
      const router = createFakeRouter({
        write: jest.fn(),
      });

      const search = instantsearch({
        indexName: 'indexName',
        searchClient,
        routing: {
          router,
        },
      });

      const widget = createWidget({
        render: jest.fn(),
        getWidgetUiState: jest.fn((uiState, { searchParameters }) => ({
          ...uiState,
          q: searchParameters.query,
        })),
        getWidgetSearchParameters: jest.fn(
          searchParameters => searchParameters
        ),
      });

      search.addWidgets([widget]);

      search.start();

      search.once('render', async () => {
        // initialization is done at this point
        expect(widget.render).toHaveBeenCalledTimes(1);
        expect(widget.getWidgetSearchParameters).toHaveBeenCalledTimes(1);

        await runAllMicroTasks();

        expect(router.write).toHaveBeenCalledTimes(0);

        search.mainIndex.getHelper()!.setQuery('q'); // routing write updates on change

        await runAllMicroTasks();

        expect(router.write).toHaveBeenCalledTimes(1);
        expect(router.write).toHaveBeenCalledWith({
          indexName: {
            q: 'q',
          },
        });

        done();
      });
    });

    // eslint-disable-next-line jest/no-done-callback
    test('should update the searchParameters on router state update', done => {
      const searchClient = createSearchClient();

      let onRouterUpdateCallback: (args: UiState) => void;
      const router = createFakeRouter({
        onUpdate: fn => {
          onRouterUpdateCallback = fn;
        },
      });

      const search = instantsearch({
        indexName: 'indexName',
        searchClient,
        routing: {
          router,
        },
      });

      const widget = createWidget({
        render: jest.fn(),
        getWidgetSearchParameters: jest.fn((searchParameters, { uiState }) =>
          searchParameters.setQuery(uiState.query)
        ),
      });

      search.addWidgets([widget]);

      search.start();

      search.once('render', () => {
        // initialization is done at this point

        expect(search.mainIndex.getHelper()!.state.query).toBeUndefined();

        // this simulates a router update with a uiState of {query: 'a'}
        onRouterUpdateCallback({
          indexName: {
            query: 'a',
          },
        });

        search.once('render', () => {
          // the router update triggers a new search
          // and given that the widget reads q as a query parameter
          expect(search.mainIndex.getHelper()!.state.query).toEqual('a');
          done();
        });
      });
    });

    // eslint-disable-next-line jest/no-done-callback
    test('should apply state mapping on differences after searchFunction', done => {
      const searchClient = createSearchClient();

      const router = createFakeRouter({
        write: jest.fn(),
      });

      const stateMapping = createFakeStateMapping({
        stateToRoute(uiState) {
          return Object.keys(uiState).reduce((state, indexId) => {
            const indexState = uiState[indexId];

            return {
              ...state,
              [indexId]: {
                query: indexState.query && indexState.query.toUpperCase(),
              },
            };
          }, {});
        },
      });

      const search = instantsearch({
        indexName: 'indexName',
        searchFunction: helper => {
          helper.setQuery('test').search();
        },
        searchClient,
        routing: {
          stateMapping,
          router,
        },
      });

      search.addWidgets([
        createWidget({
          getWidgetUiState(uiState, { searchParameters }) {
            return {
              ...uiState,
              query: searchParameters.query,
            };
          },
          getWidgetSearchParameters: jest.fn(
            searchParameters => searchParameters
          ),
        }),
      ]);

      search.start();

      search.once('render', () => {
        // initialization is done at this point

        expect(search.mainIndex.getHelper()!.state.query).toEqual('test');

        expect(router.write).toHaveBeenLastCalledWith({
          indexName: {
            query: 'TEST',
          },
        });

        done();
      });
    });

    test('should keep the UI state up to date on state changes', async () => {
      const searchClient = createSearchClient();
      const stateMapping = createFakeStateMapping({});
      const router = createFakeRouter({
        write: jest.fn(),
      });

      const search = instantsearch({
        indexName: 'indexName',
        searchClient,
        routing: {
          stateMapping,
          router,
        },
      });

      const fakeSearchBox: any = createFakeSearchBox();
      const fakeHitsPerPage = createFakeHitsPerPage();

      search.addWidgets([fakeSearchBox, fakeHitsPerPage]);

      search.start();

      await runAllMicroTasks();

      // Trigger an update - push a change
      fakeSearchBox.refine('Apple');

      await runAllMicroTasks();

      expect(router.write).toHaveBeenCalledTimes(1);
      expect(router.write).toHaveBeenLastCalledWith({
        indexName: {
          query: 'Apple',
        },
      });

      await runAllMicroTasks();

      // Trigger change
      search.removeWidgets([fakeHitsPerPage]);

      await runAllMicroTasks();

      // The UI state hasn't changed so `router.write` wasn't called a second
      // time
      expect(router.write).toHaveBeenCalledTimes(1);
    });

    test('should keep the UI state up to date on first render', async () => {
      const searchClient = createSearchClient();
      const stateMapping = createFakeStateMapping({});
      const router = createFakeRouter({
        write: jest.fn(),
      });

      const search = instantsearch({
        indexName: 'indexName',
        searchFunction(helper) {
          // Force the value of the query
          helper.setQuery('Apple iPhone').search();
        },
        searchClient,
        routing: {
          router,
          stateMapping,
        },
      });

      const fakeSearchBox = createFakeSearchBox();
      const fakeHitsPerPage = createFakeHitsPerPage();

      search.addWidgets([fakeSearchBox, fakeHitsPerPage]);

      // Trigger the call to `searchFunction` -> Apple iPhone
      search.start();

      await runAllMicroTasks();

      expect(router.write).toHaveBeenCalledTimes(1);
      expect(router.write).toHaveBeenLastCalledWith({
        indexName: {
          query: 'Apple iPhone',
        },
      });

      // Trigger change
      search.removeWidgets([fakeHitsPerPage]);

      await runAllMicroTasks();

      // The UI state hasn't changed so `router.write` wasn't called a second
      // time
      expect(router.write).toHaveBeenCalledTimes(1);
    });

    test('should keep the UI state up to date on router.update', async () => {
      const searchClient = createSearchClient();
      const stateMapping = createFakeStateMapping({});
      const history = createFakeHistory();
      const router = createFakeRouter({
        onUpdate(fn) {
          history.subscribe(state => {
            fn(state);
          });
        },
        write: jest.fn(state => {
          history.push(state);
        }),
      });

      const search = instantsearch({
        indexName: 'indexName',
        searchClient,
        routing: {
          router,
          stateMapping,
        },
      });

      const fakeSearchBox: any = createFakeSearchBox();
      const fakeHitsPerPage = createFakeHitsPerPage();

      search.addWidgets([fakeSearchBox, fakeHitsPerPage]);

      search.start();

      await runAllMicroTasks();

      // Trigger an update - push a change
      fakeSearchBox.refine('Apple');

      await runAllMicroTasks();

      expect(router.write).toHaveBeenCalledTimes(1);
      expect(router.write).toHaveBeenLastCalledWith({
        indexName: {
          query: 'Apple',
        },
      });

      // Trigger an update - push a change
      fakeSearchBox.refine('Apple iPhone');

      await runAllMicroTasks();

      expect(router.write).toHaveBeenCalledTimes(2);
      expect(router.write).toHaveBeenLastCalledWith({
        indexName: {
          query: 'Apple iPhone',
        },
      });

      await runAllMicroTasks();

      // Trigger an update - Apple iPhone → Apple
      history.back();

      await runAllMicroTasks();

      // Trigger change
      search.removeWidgets([fakeHitsPerPage]);

      await runAllMicroTasks();

      expect(router.write).toHaveBeenCalledTimes(3);
      expect(router.write).toHaveBeenLastCalledWith({
        indexName: {
          query: 'Apple',
        },
      });
    });

    test('skips duplicate route state entries', async () => {
      let triggerChange = false;
      const searchClient = createSearchClient();
      const stateMapping = createFakeStateMapping({
        stateToRoute(uiState) {
          if (triggerChange) {
            return {
              ...uiState,
              indexName: {
                ...uiState.indexName,
                triggerChange,
              },
            };
          }

          return uiState;
        },
      });
      const history = createFakeHistory();
      const router = createFakeRouter({
        onUpdate(fn) {
          history.subscribe(state => {
            fn(state);
          });
        },
        write: jest.fn(state => {
          history.push(state);
        }),
      });

      const search = instantsearch({
        indexName: 'indexName',
        searchClient,
        routing: {
          router,
          stateMapping,
        },
      });

      const fakeSearchBox: any = createFakeSearchBox();
      const fakeHitsPerPage1 = createFakeHitsPerPage();
      const fakeHitsPerPage2 = createFakeHitsPerPage();

      search.addWidgets([fakeSearchBox, fakeHitsPerPage1, fakeHitsPerPage2]);

      search.start();

      await runAllMicroTasks();

      // Trigger an update - push a change
      fakeSearchBox.refine('Apple');

      await runAllMicroTasks();

      expect(router.write).toHaveBeenCalledTimes(1);
      expect(router.write).toHaveBeenLastCalledWith({
        indexName: {
          query: 'Apple',
        },
      });

      // Trigger change without UI state change
      search.removeWidgets([fakeHitsPerPage1]);

      await runAllMicroTasks();

      expect(router.write).toHaveBeenCalledTimes(1);

      await runAllMicroTasks();

      triggerChange = true;
      // Trigger change without UI state change but with a route change
      search.removeWidgets([fakeHitsPerPage2]);

      await runAllMicroTasks();

      expect(router.write).toHaveBeenCalledTimes(2);
      expect(router.write).toHaveBeenLastCalledWith({
        indexName: {
          query: 'Apple',
          triggerChange: true,
        },
      });
    });
    test('cleans URL on dispose', async () => {
      const searchClient = createSearchClient();
      const writeDelay = 400;

      const search = instantsearch({
        indexName: 'indexName',
        searchClient,
        routing: {
          router: historyRouter({
            writeDelay,
          }),
          stateMapping: simple(),
        },
      });

      const fakeSearchBox: any = createFakeSearchBox();
      search.addWidgets([fakeSearchBox]);

      search.start();

      await runAllMicroTasks();

      // Wait for ${writeDelay} to pass then check URL has been initialized
      await wait(1.5 * writeDelay);
      expect(window.location.search).toEqual(``);
      expect(window.history.length).toEqual(1);

      // Trigger an update - push a change
      fakeSearchBox.refine('Apple');

      // Wait for ${writeDelay} to pass then check URL has been updated
      await wait(1.5 * writeDelay);
      expect(window.location.search).toEqual(
        `?${encodeURI('indexName[query]=Apple')}`
      );
      expect(window.history.length).toEqual(2);

      // Trigger a dispose
      search.dispose();

      // Wait for ${writeDelay} to pass then check URL has been cleaned
      await wait(1.5 * writeDelay);
      expect(window.location.search).toEqual('');
      expect(window.history.length).toEqual(2);
    });
  });

  describe('windowTitle', () => {
    test('should update the window title with URL query params on first render', async () => {
      jsdom.reconfigure({
        url: 'https://website.com/?query=query',
      });

      const setWindowTitle = jest.spyOn(window.document, 'title', 'set');
      const searchClient = createSearchClient();
      const stateMapping = createFakeStateMapping({});
      const router = historyRouter({
        windowTitle(routeState: RouteState) {
          return `Searching for "${routeState.query}"`;
        },
      } as any);

      const search = instantsearch({
        indexName: 'instant_search',
        searchClient,
        routing: {
          router,
          stateMapping,
        },
      });

      const fakeSearchBox = createFakeSearchBox();

      search.addWidgets([fakeSearchBox]);
      search.start();

      await runAllMicroTasks();

      expect(setWindowTitle).toHaveBeenCalledTimes(1);
      expect(setWindowTitle).toHaveBeenLastCalledWith('Searching for "query"');

      setWindowTitle.mockRestore();
    });
  });

  describe('parseURL', () => {
    const createFakeUrlWithRefinements: ({
      length,
    }: {
      length: number;
    }) => string = ({ length }) =>
      [
        'https://website.com/',
        Array.from(
          { length },
          (_v, i) => `refinementList[brand][${i}]=brand-${i}`
        ).join('&'),
      ].join('?');

    test('should parse refinements with more than 20 filters per category as array', () => {
      jsdom.reconfigure({
        url: createFakeUrlWithRefinements({ length: 22 }),
      });

      const router = historyRouter();
      // @ts-expect-error: This method is considered private but we still use it
      // in the test after the TypeScript migration.
      // In a next refactor, we can consider changing this test implementation.
      const parsedUrl = router.parseURL({
        qsModule: qs,
        location: window.location,
      });

      expect(parsedUrl.refinementList.brand).toBeInstanceOf(Array);
      expect(parsedUrl).toMatchInlineSnapshot(`
        Object {
          "refinementList": Object {
            "brand": Array [
              "brand-0",
              "brand-1",
              "brand-2",
              "brand-3",
              "brand-4",
              "brand-5",
              "brand-6",
              "brand-7",
              "brand-8",
              "brand-9",
              "brand-10",
              "brand-11",
              "brand-12",
              "brand-13",
              "brand-14",
              "brand-15",
              "brand-16",
              "brand-17",
              "brand-18",
              "brand-19",
              "brand-20",
              "brand-21",
            ],
          },
        }
      `);
    });

    test('should support returning 100 refinements as array', () => {
      jsdom.reconfigure({
        url: createFakeUrlWithRefinements({ length: 100 }),
      });

      const router = historyRouter();
      // @ts-expect-error: This method is considered private but we still use it
      // in the test after the TypeScript migration.
      // In a next refactor, we can consider changing this test implementation.
      const parsedUrl = router.parseURL({
        qsModule: qs,
        location: window.location,
      });

      expect(parsedUrl.refinementList.brand).toBeInstanceOf(Array);
    });
  });

  describe('createURL', () => {
    it('returns an URL for a `routeState` with refinements', () => {
      const router = historyRouter();
      const actual = router.createURL({
        query: 'iPhone',
        page: 5,
      });

      expect(actual).toBe('https://website.com/?query=iPhone&page=5');
    });

    it('returns an URL for an empty `routeState` with index', () => {
      const router = historyRouter();
      const actual = router.createURL({
        indexName: {},
      });

      expect(actual).toBe('https://website.com/');
    });

    it('returns an URL for an empty `routeState`', () => {
      const router = historyRouter();
      const actual = router.createURL({});

      expect(actual).toBe('https://website.com/');
    });
  });
});
