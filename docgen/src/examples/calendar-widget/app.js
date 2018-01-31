const ONE_DAY_IN_MS = 3600 * 24 * 1000;

const search = instantsearch({
  appId: 'latency',
  apiKey: '059c79ddd276568e990286944276464a',
  indexName: 'concert_events_instantsearchjs',
});

search.addWidget(
  instantsearch.widgets.searchBox({
    container: '#search-box',
    placeholder: 'Search events',
  })
);

search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits',
    templates: {
      item: hit => `
        <li class="hit">
          <h3>
            ${hit._highlightResult.name.value}
            <small>in ${hit._highlightResult.location.value}</small>
          </h3>
          <small>on <strong>${moment(hit.date).format(
            'dddd MMMM Do YYYY'
          )}</strong></small>
        </li>
      `,
    },
  })
);

const makeRangeWidget = instantsearch.connectors.connectRange(
  (options, isFirstRendering) => {
    if (!isFirstRendering) return;

    const { refine } = options;

    new Calendar({
      element: $('#calendar'),
      same_day_range: true,
      callback: function() {
        const start = new Date(this.start_date).getTime();
        const end = new Date(this.end_date).getTime();
        const actualEnd = start === end ? end + ONE_DAY_IN_MS - 1 : end;

        refine([start, actualEnd]);
      },
      // Some good parameters based on our dataset:
      start_date: new Date(),
      end_date: new Date(`2020 00:00`),
      earliest_date: new Date('2008 00:00'),
      latest_date: new Date(`2020 00:00`),
    });
  }
);

const dateRangeWidget = makeRangeWidget({
  attributeName: 'date',
});

search.addWidget(dateRangeWidget);

search.start();
