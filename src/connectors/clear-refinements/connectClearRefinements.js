import {
  checkRendering,
  clearRefinements,
  getAttributesToClear,
} from '../../lib/utils.js';

const usage = `Usage:
var customClearRefinements = connectClearRefinements(function render(params, isFirstRendering) {
  // params = {
  //   refine,
  //   hasRefinements,
  //   createURL,
  //   instantSearchInstance,
  //   widgetParams,
  // }
});
search.addWidget(
  customClearRefinements({
    [ includedAttributes = [] ],
    [ excludedAttributes = ['query'] ],
    [ transformItems ],
  })
);
Full documentation available at https://community.algolia.com/instantsearch.js/v2/connectors/connectClearRefinements.html
`;

/**
 * @typedef {Object} CustomClearRefinementsWidgetOptions
 * @property {string[]} [includedAttributes = []] The attributes to include in the refinements to clear (all by default). Cannot be used with `excludedAttributes`.
 * @property {string[]} [excludedAttributes = ['query']] The attributes to exclude from the refinements to clear. Cannot be used with `includedAttributes`.
 * @property {function(object[]):object[]} [transformItems] Function to transform the items passed to the templates.
 */

/**
 * @typedef {Object} ClearRefinementsRenderingOptions
 * @property {function} refine Triggers the clear of all the currently refined values.
 * @property {boolean} hasRefinements Indicates if search state is refined.
 * @property {function} createURL Creates a url for the next state when refinements are cleared.
 * @property {Object} widgetParams All original `CustomClearRefinementsWidgetOptions` forwarded to the `renderFn`.
 */

/**
 * **ClearRefinements** connector provides the logic to build a custom widget that will give the user
 * the ability to reset the search state.
 *
 * This connector provides a `refine` function to remove the current refined facets.
 *
 * The behaviour of this function can be changed with widget options. If `clearsQuery`
 * is set to `true`, `refine` will also clear the query and `excludedAttributes` can
 * prevent certain attributes from being cleared.
 *
 * @type {Connector}
 * @param {function(ClearRefinementsRenderingOptions, boolean)} renderFn Rendering function for the custom **ClearRefinements** widget.
 * @param {function} unmountFn Unmount function called when the widget is disposed.
 * @return {function(CustomClearRefinementsWidgetOptions)} Re-usable widget factory for a custom **ClearRefinements** widget.
 * @example
 * // custom `renderFn` to render the custom ClearRefinements widget
 * function renderFn(ClearRefinementsRenderingOptions, isFirstRendering) {
 *   var containerNode = ClearRefinementsRenderingOptions.widgetParams.containerNode;
 *   if (isFirstRendering) {
 *     var markup = $('<button id="custom-clear-all">Clear All</button>');
 *     containerNode.append(markup);
 *
 *     markup.on('click', function(event) {
 *       event.preventDefault();
 *       ClearRefinementsRenderingOptions.refine();
 *     })
 *   }
 *
 *   var clearRefinementsCTA = containerNode.find('#custom-clear-all');
 *   clearRefinementsCTA.attr('disabled', !ClearRefinementsRenderingOptions.hasRefinements)
 * };
 *
 * // connect `renderFn` to ClearRefinements logic
 * var customClearRefinementsWidget = instantsearch.connectors.connectClearRefinements(renderFn);
 *
 * // mount widget on the page
 * search.addWidget(
 *   customClearRefinementsWidget({
 *     containerNode: $('#custom-clear-all-container'),
 *   })
 * );
 */
export default function connectClearRefinements(renderFn, unmountFn) {
  checkRendering(renderFn, usage);

  return (widgetParams = {}) => {
    if (widgetParams.includedAttributes && widgetParams.excludedAttributes) {
      throw new Error(
        '`includedAttributes` and `excludedAttributes` cannot be used together.'
      );
    }

    const {
      includedAttributes = [],
      excludedAttributes = ['query'],
      transformItems = items => items,
    } = widgetParams;

    return {
      init({ helper, instantSearchInstance, createURL }) {
        const attributesToClear = transformItems(
          getAttributesToClear({
            helper,
            includedAttributes,
            excludedAttributes,
          })
        );
        const hasRefinements = attributesToClear.length > 0;
        const clearsQuery =
          includedAttributes.indexOf('query') !== -1 ||
          excludedAttributes.indexOf('query') === -1;

        this._refine = () => {
          helper
            .setState(
              clearRefinements({
                helper,
                includedAttributes,
                excludedAttributes,
                clearsQuery,
              })
            )
            .search();
        };

        this._createURL = () =>
          createURL(
            clearRefinements({
              helper,
              includedAttributes,
              excludedAttributes,
              clearsQuery,
            })
          );

        renderFn(
          {
            hasRefinements,
            refine: this._refine,
            createURL: this._createURL,
            instantSearchInstance,
            widgetParams,
          },
          true
        );
      },

      render({ helper, instantSearchInstance }) {
        const attributesToClear = transformItems(
          getAttributesToClear({
            helper,
            includedAttributes,
            excludedAttributes,
          })
        );
        const hasRefinements = attributesToClear.length > 0;

        renderFn(
          {
            hasRefinements,
            refine: this._refine,
            createURL: this._createURL,
            instantSearchInstance,
            widgetParams,
          },
          false
        );
      },

      dispose() {
        unmountFn();
      },
    };
  };
}
