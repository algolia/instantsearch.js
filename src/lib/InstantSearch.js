import algoliasearchHelper from 'algoliasearch-helper';
import EventEmitter from 'events';
import RoutingManager from './RoutingManager';
import simpleMapping from './stateMappings/simple';
import historyRouter from './routers/history';
import version from './version';
import createHelpers from './createHelpers';
import {
  createDocumentationMessageGenerator,
  createDocumentationLink,
  findIndex,
  isPlainObject,
  mergeDeep,
  noop,
  warning,
} from './utils';

const withUsage = createDocumentationMessageGenerator({
  name: 'instantsearch',
});

const ROUTING_DEFAULT_OPTIONS = {
  stateMapping: simpleMapping(),
  router: historyRouter(),
};

function defaultCreateURL() {
  return '#';
}

/**
 * Widgets are the building blocks of InstantSearch.js. Any
 * valid widget must have at least a `render` or a `init` function.
 * @typedef {Object} Widget
 * @property {function} [render] Called after each search response has been received
 * @property {function} [getConfiguration] Let the widget update the configuration
 * of the search with new parameters
 * @property {function} [init] Called once before the first search
 */

/**
 * The actual implementation of the InstantSearch. This is
 * created using the `instantsearch` factory function.
 * @fires Instantsearch#render This event is triggered each time a render is done
 */
class InstantSearch extends EventEmitter {
  constructor(options) {
    super();

    const {
      indexName = null,
      numberLocale,
      searchParameters,
      routing = null,
      searchFunction,
      stalledSearchDelay = 200,
      searchClient = null,
      insightsClient = null,
    } = options;

    if (indexName === null) {
      throw new Error(withUsage('The `indexName` option is required.'));
    }

    if (searchClient === null) {
      throw new Error(withUsage('The `searchClient` option is required.'));
    }

    if (typeof options.urlSync !== 'undefined') {
      throw new Error(
        withUsage(
          'The `urlSync` option was removed in InstantSearch.js 3. You may want to use the `routing` option.'
        )
      );
    }

    if (typeof searchClient.search !== 'function') {
      throw new Error(
        `The \`searchClient\` must implement a \`search\` method.

See: https://www.algolia.com/doc/guides/building-search-ui/going-further/backend-search/in-depth/backend-instantsearch/js/`
      );
    }

    if (typeof searchClient.addAlgoliaAgent === 'function') {
      searchClient.addAlgoliaAgent(`instantsearch.js (${version})`);
    }

    if (insightsClient && typeof insightsClient !== 'function') {
      throw new Error('The provided `insightsClient` must be a function.');
    }

    warning(
      !searchParameters,
      `The \`searchParameters\` option is deprecated and will not be supported in InstantSearch.js 4.x.

You can replace it with the \`configure\` widget:

\`\`\`
search.addWidgets([
  configure(${JSON.stringify(searchParameters, null, 2)})
]);
\`\`\`

See ${createDocumentationLink({
        name: 'configure',
      })}`
    );

    this.client = searchClient;
    this.insightsClient = insightsClient;
    this.helper = null;
    this.indexName = indexName;
    this.searchParameters = { ...searchParameters, index: indexName };
    this.widgets = [];
    this.templatesConfig = {
      helpers: createHelpers({ numberLocale }),
      compileOptions: {},
    };
    this._stalledSearchDelay = stalledSearchDelay;

    if (searchFunction) {
      this._searchFunction = searchFunction;
    }

    if (routing === true) this.routing = ROUTING_DEFAULT_OPTIONS;
    else if (isPlainObject(routing))
      this.routing = {
        ...ROUTING_DEFAULT_OPTIONS,
        ...routing,
      };
  }

  /**
   * Adds a widget. This can be done before and after InstantSearch has been started. Adding a
   * widget after InstantSearch started is considered **EXPERIMENTAL** and therefore
   * it is possibly buggy, if you find anything please
   * [open an issue](https://github.com/algolia/instantsearch.js/issues/new?title=Problem%20with%20hot%20addWidget).
   * @param  {Widget} widget The widget to add to InstantSearch. Widgets are simple objects
   * that have methods that map the search life cycle in a UI perspective. Usually widgets are
   * created by [widget factories](widgets.html) like the one provided with InstantSearch.js.
   * @return {undefined} This method does not return anything
   */
  addWidget(widget) {
    this.addWidgets([widget]);
  }

  /**
   * Adds multiple widgets. This can be done before and after the InstantSearch has been started. This feature
   * is considered **EXPERIMENTAL** and therefore it is possibly buggy, if you find anything please
   * [open an issue](https://github.com/algolia/instantsearch.js/issues/new?title=Problem%20with%20addWidgets).
   * @param  {Widget[]} widgets The array of widgets to add to InstantSearch.
   * @return {undefined} This method does not return anything
   */
  addWidgets(widgets) {
    if (!Array.isArray(widgets)) {
      throw new Error(
        withUsage(
          'The `addWidgets` method expects an array of widgets. Please use `addWidget`.'
        )
      );
    }

    // The routing manager widget is always added manually at the last position.
    // By removing it from the last position and adding it back after, we ensure
    // it keeps this position.
    // fixes #3148
    const lastWidget = this.widgets.pop();

    widgets.forEach(widget => {
      // Add the widget to the list of widget
      if (widget.render === undefined && widget.init === undefined) {
        throw new Error(`The widget definition expects a \`render\` and/or an \`init\` method.

See: https://www.algolia.com/doc/guides/building-search-ui/widgets/create-your-own-widgets/js/`);
      }

      this.widgets.push(widget);
    });

    // Second part of the fix for #3148
    if (lastWidget) this.widgets.push(lastWidget);

    // Init the widget directly if instantsearch has been already started
    if (this.started && Boolean(widgets.length)) {
      this.searchParameters = this.widgets.reduce(enhanceConfiguration, {
        ...this.helper.state,
      });

      this.helper.setState(this.searchParameters);

      widgets.forEach(widget => {
        if (widget.init) {
          widget.init({
            state: this.helper.state,
            helper: this.helper,
            templatesConfig: this.templatesConfig,
            createURL: this._createAbsoluteURL,
            onHistoryChange: this._onHistoryChange,
            instantSearchInstance: this,
          });
        }
      });

      this.helper.search();
    }
  }

  /**
   * Removes a widget. This can be done after the InstantSearch has been started. This feature
   * is considered **EXPERIMENTAL** and therefore it is possibly buggy, if you find anything please
   * [open an issue](https://github.com/algolia/instantsearch.js/issues/new?title=Problem%20with%20removeWidget).
   * @param  {Widget} widget The widget instance to remove from InstantSearch. This widget must implement a `dispose()` method in order to be gracefully removed.
   * @return {undefined} This method does not return anything
   */
  removeWidget(widget) {
    this.removeWidgets([widget]);
  }

  /**
   * Removes multiple widgets. This can be done only after the InstantSearch has been started. This feature
   * is considered **EXPERIMENTAL** and therefore it is possibly buggy, if you find anything please
   * [open an issue](https://github.com/algolia/instantsearch.js/issues/new?title=Problem%20with%20addWidgets).
   * @param  {Widget[]} widgets Array of widgets instances to remove from InstantSearch.
   * @return {undefined} This method does not return anything
   */
  removeWidgets(widgets) {
    if (!Array.isArray(widgets)) {
      throw new Error(
        withUsage(
          'The `removeWidgets` method expects an array of widgets. Please use `removeWidget`.'
        )
      );
    }

    widgets.forEach(widget => {
      if (
        !this.widgets.includes(widget) ||
        typeof widget.dispose !== 'function'
      ) {
        throw new Error(
          `The \`dispose\` method is required to remove the widget.

See: https://www.algolia.com/doc/guides/building-search-ui/widgets/create-your-own-widgets/js/#the-widget-lifecycle-and-api`
        );
      }

      this.widgets = this.widgets.filter(w => w !== widget);

      const nextState = widget.dispose({
        helper: this.helper,
        state: this.helper.state,
      });

      // re-compute remaining widgets to the state
      // in a case two widgets were using the same configuration but we removed one
      if (nextState) {
        this.searchParameters = this.widgets.reduce(enhanceConfiguration, {
          ...nextState,
        });

        this.helper.setState(this.searchParameters);
      }
    });

    // If there's multiple call to `removeWidget()` let's wait until they are all made
    // and then check for widgets.length & make a search on next tick
    //
    // This solves an issue where you unmount a page and removing widget by widget
    setTimeout(() => {
      // no need to trigger a search if we don't have any widgets left
      if (this.widgets.length > 0) {
        this.helper.search();
      }
    }, 0);
  }

  /**
   * Clears the cached answers from Algolia and triggers a new search.
   *
   * @return {undefined} Does not return anything
   */
  refresh() {
    if (this.helper) {
      this.helper.clearCache().search();
    }
  }

  /**
   * Ends the initialization of InstantSearch.js and triggers the
   * first search. This method should be called after all widgets have been added
   * to the instance of InstantSearch.js. InstantSearch.js also supports adding and removing
   * widgets after the start as an **EXPERIMENTAL** feature.
   *
   * @return {undefined} Does not return anything
   */
  start() {
    if (this.started) {
      throw new Error(
        withUsage('The `start` method has already been called once.')
      );
    }

    if (this.routing) {
      const routingManager = new RoutingManager({
        ...this.routing,
        instantSearchInstance: this,
      });
      this._onHistoryChange = routingManager.onHistoryChange.bind(
        routingManager
      );
      this._createURL = routingManager.createURL.bind(routingManager);
      this._createAbsoluteURL = this._createURL;
      this.widgets.push(routingManager);
    } else {
      this._createURL = defaultCreateURL;
      this._createAbsoluteURL = defaultCreateURL;
      this._onHistoryChange = noop;
    }

    this.searchParameters = this.widgets.reduce(
      enhanceConfiguration,
      this.searchParameters
    );

    const helper = algoliasearchHelper(
      this.client,
      this.searchParameters.index || this.indexName,
      this.searchParameters
    );

    if (this._searchFunction) {
      this._mainHelperSearch = helper.search.bind(helper);
      helper.search = () => {
        const helperSearchFunction = algoliasearchHelper(
          {
            search: () => new Promise(noop),
          },
          helper.state.index,
          helper.state
        );
        helperSearchFunction.once('search', state => {
          helper.overrideStateWithoutTriggeringChangeEvent(state);
          this._mainHelperSearch();
        });
        this._searchFunction(helperSearchFunction);
      };
    }

    this.helper = helper;
    this._init(helper.state, this.helper);
    this.helper.on('result', this._render.bind(this, this.helper));
    this.helper.on('error', e => {
      this.emit('error', e);
    });

    this._searchStalledTimer = null;
    this._isSearchStalled = true;

    this.helper.search();

    this.helper.on('search', () => {
      if (
        !this._isSearchStalled &&
        !this._searchStalledTimer &&
        this.helper.lastResults
      ) {
        this._searchStalledTimer = setTimeout(() => {
          this._isSearchStalled = true;
          this._render(
            this.helper,
            this.helper.lastResults,
            this.helper.lastResults._state
          );
        }, this._stalledSearchDelay);
      }
    });

    // track we started the search if we add more widgets,
    // to init them directly after add
    this.started = true;
  }

  /**
   * Removes all widgets without triggering a search afterwards. This is an **EXPERIMENTAL** feature,
   * if you find an issue with it, please
   * [open an issue](https://github.com/algolia/instantsearch.js/issues/new?title=Problem%20with%20dispose).
   * @return {undefined} This method does not return anything
   */
  dispose() {
    this.removeWidgets(this.widgets);
    // You can not start an instance two times, therefore a disposed instance needs to set started as false
    // otherwise this can not be restarted at a later point.
    this.started = false;

    // The helper needs to be reset to perform the next search from a fresh state.
    // If not reset, it would use the state stored before calling `dispose()`.
    this.helper.removeAllListeners();
    this.helper = null;
  }

  createURL(params) {
    if (!this._createURL) {
      throw new Error(
        'The `start` method needs to be called before `createURL`.'
      );
    }
    return this._createURL(this.helper.state.setQueryParameters(params));
  }

  _render(helper, results, state) {
    if (!this.helper.hasPendingRequests()) {
      clearTimeout(this._searchStalledTimer);
      this._searchStalledTimer = null;
      this._isSearchStalled = false;
    }

    this.widgets.forEach(widget => {
      if (!widget.render) {
        return;
      }
      widget.render({
        templatesConfig: this.templatesConfig,
        results,
        state,
        helper,
        createURL: this._createAbsoluteURL,
        instantSearchInstance: this,
        searchMetadata: {
          isSearchStalled: this._isSearchStalled,
        },
      });
    });

    /**
     * Render is triggered when the rendering of the widgets has been completed
     * after a search.
     * @event InstantSearch#render
     */
    this.emit('render');
  }

  _init(state, helper) {
    this.widgets.forEach(widget => {
      if (widget.init) {
        widget.init({
          state,
          helper,
          templatesConfig: this.templatesConfig,
          createURL: this._createAbsoluteURL,
          onHistoryChange: this._onHistoryChange,
          instantSearchInstance: this,
        });
      }
    });
  }
}

export function enhanceConfiguration(configuration, widgetDefinition) {
  if (!widgetDefinition.getConfiguration) {
    return configuration;
  }

  // Get the relevant partial configuration asked by the widget
  const partialConfiguration = widgetDefinition.getConfiguration(configuration);

  if (!partialConfiguration) {
    return configuration;
  }

  if (!partialConfiguration.hierarchicalFacets) {
    return mergeDeep(configuration, partialConfiguration);
  }

  const {
    hierarchicalFacets,
    ...partialWithoutHierarchcialFacets
  } = partialConfiguration;

  // The `mergeDeep` function uses a `uniq` function under the hood, but the
  // implementation does not support arrays of objects (we also had the issue
  // with the Lodash version). The `hierarchicalFacets` attribute is an array
  // of objects, which means that this attribute is never deduplicated. It
  // becomes problematic when widgets are frequently added/removed, since the
  // function `enhanceConfiguration` is called at each operation.
  // https://github.com/algolia/instantsearch.js/issues/3278
  const configurationWithHierarchicalFacets = {
    ...configuration,
    hierarchicalFacets: hierarchicalFacets.reduce((facets, facet) => {
      const index = findIndex(facets, _ => _.name === facet.name);

      if (index === -1) {
        return facets.concat(facet);
      }

      const nextFacets = facets.slice();
      nextFacets.splice(index, 1, facet);

      return nextFacets;
    }, configuration.hierarchicalFacets || []),
  };

  return mergeDeep(
    configurationWithHierarchicalFacets,
    partialWithoutHierarchcialFacets
  );
}

export default InstantSearch;
