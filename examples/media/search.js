/* global instantsearch algoliasearch */

var search = instantsearch({
  indexName: 'movies',
  searchClient: algoliasearch('latency', '6be0576ff61c053d5f9a3225e2a90f76'),
  routing: {
    router: instantsearch.routers.pattern({
      // Notes:
      // has to start with /
      // stateMapping to a flat object is required for any key in the path
      // never put two optional values adjacent
      //   - ambiguous when first value is empty
      // value can not be empty string, but can be undefined
      //   - make sure you filter out empty strings in stateToRoute
      // unlisted parameters go to query string.
      pattern: '/genre/:genre*/rating/:rating?',
    }),
    stateMapping: {
      stateToRoute({ movies: indexUiState = {} } = {}) {
        const {
          query,
          refinementList: { genre } = {},
          ratingMenu: { rating } = {},
        } = indexUiState;
        return {
          query,
          genre,
          rating,
        };
      },
      routeToState({ query, genre, rating } = {}) {
        return {
          movies: {
            query,
            refinementList: {
              genre,
            },
            ratingMenu: {
              rating,
            },
          },
        };
      },
    },
  },
});

search.addWidgets([
  instantsearch.widgets.searchBox({
    container: '#searchbox',
    showReset: false,
    cssClasses: {
      root: 'root',
      form: 'form',
      input: 'input form-control',
      submit: 'btn btn-default',
      reset: 'btn btn-default',
    },
  }),

  instantsearch.widgets.stats({
    container: '#stats',
  }),
]);

var hitTemplate =
  '<div class="hit media">' +
  '<div class="media-left">' +
  '<div class="media-object" style="background-image: url(\'{{image}}\');"></div>' +
  '</div>' +
  '<div class="media-body">' +
  '<h4 class="media-heading">{{#helpers.highlight}}{ "attribute": "title" }{{/helpers.highlight}} {{#stars}}<svg class="starIcon ais-RatingMenu-starIcon ais-RatingMenu-starIcon{{#.}}--full{{/.}}{{^.}}--empty{{/.}}" aria-hidden="true" width="18" height="18"><use xlink:href="#ais-RatingMenu-{{#.}}starSymbol{{/.}}{{^.}}starEmptySymbol{{/.}}"></use></svg>{{/stars}}</h4>' +
  '<p class="year">{{year}}</p><p class="genre">{{#genre}}<span class="badge">{{.}}</span> {{/genre}}</p>' +
  '</div>' +
  '</div>';

var noResultsTemplate =
  '<div class="text-center">No results found matching <strong>{{query}}</strong>.</div>';

search.addWidgets([
  instantsearch.widgets.hits({
    container: '#hits',
    hitsPerPage: 10,
    templates: {
      empty: noResultsTemplate,
      item: hitTemplate,
    },
    transformItems: function(items) {
      return items.map(function(item) {
        item.stars = [];

        for (var i = 1; i <= 5; ++i) {
          item.stars.push(i <= item.rating);
        }

        return item;
      });
    },
    cssClasses: {
      list: 'list',
    },
  }),
]);

const genreList = instantsearch.widgets.panel({
  templates: {
    header: '<i class="fa fa-chevron-right"></i> Genres',
  },
  cssClasses: {
    header: 'panel-header',
  },
})(instantsearch.widgets.refinementList);

search.addWidgets([
  genreList({
    container: '#genres',
    attribute: 'genre',
    operator: 'and',
    limit: 10,
    cssClasses: {
      list: 'nav nav-list',
      count: 'badge pull-right',
      selectedItem: 'active',
      item: 'item',
    },
  }),
]);

const ratingList = instantsearch.widgets.panel({
  templates: {
    header: '<i class="fa fa-chevron-right"></i> Ratings',
  },
  cssClasses: {
    header: 'panel-header',
  },
})(instantsearch.widgets.ratingMenu);

search.addWidgets([
  ratingList({
    container: '#ratings',
    attribute: 'rating',
    cssClasses: {
      list: 'nav',
      link: 'link',
      item: 'item',
      selectedItem: 'selectedItem',
      starIcon: 'starIcon',
      count: 'badge pull-right',
    },
  }),

  instantsearch.widgets.pagination({
    container: '#pagination',
    cssClasses: {
      root: 'root',
      list: 'pagination',
      disabledItem: 'disabledItem',
      selectedItem: 'selectedItem',
    },
  }),
]);

search.start();
