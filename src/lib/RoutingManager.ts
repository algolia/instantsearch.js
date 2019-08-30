import { SearchParameters } from 'algoliasearch-helper';
import { isEqual } from './utils';
import {
  InstantSearch,
  UiState,
  IndexUiState,
  Router,
  StateMapping,
  Widget,
  HelperChangeEvent,
} from '../types';

type RoutingManagerProps = {
  instantSearchInstance: InstantSearch;
  router: Router<any>;
  stateMapping: StateMapping<any>;
};

class RoutingManager implements Widget {
  private readonly instantSearchInstance: InstantSearch;
  private readonly router: Router<any>;
  private readonly stateMapping: StateMapping<any>;

  private isFirstRender: boolean = true;
  private indexId: string;
  private currentUiState: UiState;
  private initState?: UiState;
  private renderURLFromState?: (event: HelperChangeEvent) => void;

  public constructor({
    router,
    stateMapping,
    instantSearchInstance,
  }: RoutingManagerProps) {
    this.router = router;
    this.stateMapping = stateMapping;
    this.instantSearchInstance = instantSearchInstance;
    this.indexId = this.instantSearchInstance.indexName;
    this.currentUiState = this.stateMapping.routeToState(this.router.read());
  }

  private getAllSearchParameters({
    currentSearchParameters,
    uiState,
  }: {
    currentSearchParameters: SearchParameters;
    uiState: UiState;
  }): SearchParameters {
    const widgets = this.instantSearchInstance.mainIndex.getWidgets();
    const indexUiState = uiState[this.indexId] || {};

    return widgets.reduce((parameters, widget) => {
      if (!widget.getWidgetSearchParameters) {
        return parameters;
      }

      return widget.getWidgetSearchParameters(parameters, {
        uiState: indexUiState,
      });
    }, currentSearchParameters);
  }

  private getAllUiStates({
    searchParameters,
  }: {
    searchParameters: SearchParameters;
  }): UiState {
    const widgets = this.instantSearchInstance.mainIndex.getWidgets();
    const helper = this.instantSearchInstance.mainIndex.getHelper()!;

    return {
      [this.indexId]: widgets.reduce<IndexUiState>((state, widget) => {
        if (!widget.getWidgetState) {
          return state;
        }

        return widget.getWidgetState(state, {
          helper,
          searchParameters,
        });
      }, {}),
    };
  }

  private setupRouting(state: SearchParameters): void {
    const helper = this.instantSearchInstance.mainIndex.getHelper()!;

    this.router.onUpdate(route => {
      const nextUiState = this.stateMapping.routeToState(route);
      const widgetsUiState = this.getAllUiStates({
        searchParameters: helper.state,
      });

      if (isEqual(nextUiState, widgetsUiState)) {
        return;
      }

      this.currentUiState = nextUiState;

      const searchParameters = this.getAllSearchParameters({
        currentSearchParameters: state,
        uiState: this.currentUiState,
      });

      helper
        .overrideStateWithoutTriggeringChangeEvent(searchParameters)
        .search();
    });

    this.renderURLFromState = event => {
      this.currentUiState = this.getAllUiStates({
        searchParameters: event.state,
      });

      const route = this.stateMapping.stateToRoute(this.currentUiState);

      this.router.write(route);
    };

    helper.on('change', this.renderURLFromState);

    // Compare initial state and first render state to see if the query has been
    // changed by the `searchFunction`. It's required because the helper of the
    // `searchFunction` does not trigger change event (not the same instance).
    const firstRenderState = this.getAllUiStates({
      searchParameters: state,
    });

    if (!isEqual(this.initState, firstRenderState)) {
      // Force update the URL, if the state has changed since the initial read.
      // We do this in order to make the URL update when there is `searchFunction`
      // that prevents the search of the initial rendering.
      // See: https://github.com/algolia/instantsearch.js/issues/2523#issuecomment-339356157
      this.currentUiState = firstRenderState;

      const route = this.stateMapping.stateToRoute(this.currentUiState);

      this.router.write(route);
    }
  }

  public getConfiguration(
    currentConfiguration: SearchParameters
  ): SearchParameters {
    return this.getAllSearchParameters({
      uiState: this.currentUiState,
      currentSearchParameters: currentConfiguration,
    });
  }

  public init({ state }: { state: SearchParameters }): void {
    // Store the initial state from the storage to compare it with the state on next renders
    // in case the `searchFunction` has modified it.
    this.initState = this.getAllUiStates({
      searchParameters: state,
    });
  }

  public render({ state }: { state: SearchParameters }): void {
    if (this.isFirstRender) {
      this.isFirstRender = false;
      this.setupRouting(state);
    }
  }

  public dispose({ helper, state }): void {
    if (this.renderURLFromState) {
      helper.removeListener('change', this.renderURLFromState);
    }

    if (this.router.dispose) {
      this.router.dispose({ helper, state });
    }
  }

  public createURL(state: SearchParameters): string {
    const uiState = this.getAllUiStates({
      searchParameters: state,
    });

    const route = this.stateMapping.stateToRoute(uiState);

    return this.router.createURL(route);
  }
}

export default RoutingManager;
