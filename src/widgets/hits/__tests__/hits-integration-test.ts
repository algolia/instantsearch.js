import { getByText, fireEvent } from '@testing-library/dom';

import instantsearch from '../../../index.es';
import { hits, configure } from '../../';
import { createInsightsMiddleware } from '../../../middlewares';
import { createSingleSearchResponse } from '../../../../test/mock/createAPIResponse';
import { runAllMicroTasks } from '../../../../test/utils/runAllMicroTasks';

const createInstantSearch = ({ hitsPerPage = 2 } = {}) => {
  const page = 0;

  const searchClient: any = {
    search: jest.fn(requests =>
      Promise.resolve({
        results: requests.map(() =>
          createSingleSearchResponse({
            hits: Array(hitsPerPage)
              .fill(undefined)
              .map((_, index) => ({
                title: `title ${page * hitsPerPage + index + 1}`,
                objectID: `object-id${index}`,
              })),
          })
        ),
      })
    ),
  };
  const search = instantsearch({
    indexName: 'instant_search',
    searchClient,
  });

  search.addWidgets([
    configure({
      hitsPerPage,
    }),
  ]);

  return {
    search,
  };
};

describe('hits', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  describe('sendEvent', () => {
    const createInsightsMiddlewareWithOnEvent = () => {
      const onEvent = jest.fn();
      const insights = createInsightsMiddleware({
        insightsClient: null,
        onEvent,
      });
      return {
        onEvent,
        insights,
      };
    };

    it('sends view event when hits are rendered', async () => {
      const { search } = createInstantSearch();
      const { insights, onEvent } = createInsightsMiddlewareWithOnEvent();
      search.EXPERIMENTAL_use(insights);

      search.addWidgets([
        hits({
          container,
        }),
      ]);
      search.start();
      await runAllMicroTasks();

      expect(onEvent).toHaveBeenCalledTimes(1);
      expect(onEvent).toHaveBeenCalledWith(
        {
          eventType: 'view',
          insightsMethod: 'viewedObjectIDs',
          payload: {
            eventName: 'Hits Viewed',
            index: 'instant_search',
            objectIDs: ['object-id0', 'object-id1'],
          },
          widgetType: 'ais.hits',
        },
        null
      );
    });

    it('sends click event', async () => {
      const { search } = createInstantSearch();
      const { insights, onEvent } = createInsightsMiddlewareWithOnEvent();
      search.EXPERIMENTAL_use(insights);

      search.addWidgets([
        hits({
          container,
          templates: {
            item: (item, bindEvent) => `
              <button type='button' ${bindEvent('click', item, 'Item Clicked')}>
                ${item.title}
              </button>
            `,
          },
        }),
      ]);
      search.start();
      await runAllMicroTasks();

      expect(onEvent).toHaveBeenCalledTimes(1); // view event by render
      fireEvent.click(getByText(container, 'title 1'));
      expect(onEvent).toHaveBeenCalledTimes(2);
      expect(onEvent.mock.calls[onEvent.mock.calls.length - 1][0]).toEqual({
        eventType: 'click',
        insightsMethod: 'clickedObjectIDsAfterSearch',
        payload: {
          eventName: 'Item Clicked',
          index: 'instant_search',
          objectIDs: ['object-id0'],
          positions: [1],
        },
        widgetType: 'ais.hits',
      });
    });

    it('sends conversion event', async () => {
      const { search } = createInstantSearch();
      const { insights, onEvent } = createInsightsMiddlewareWithOnEvent();
      search.EXPERIMENTAL_use(insights);

      search.addWidgets([
        hits({
          container,
          templates: {
            item: (item, bindEvent) => `
              <button type='button' ${bindEvent(
                'conversion',
                item,
                'Product Ordered'
              )}>
                ${item.title}
              </button>
            `,
          },
        }),
      ]);
      search.start();
      await runAllMicroTasks();

      expect(onEvent).toHaveBeenCalledTimes(1); // view event by render
      fireEvent.click(getByText(container, 'title 2'));
      expect(onEvent).toHaveBeenCalledTimes(2);
      expect(onEvent.mock.calls[onEvent.mock.calls.length - 1][0]).toEqual({
        eventType: 'conversion',
        insightsMethod: 'convertedObjectIDsAfterSearch',
        payload: {
          eventName: 'Product Ordered',
          index: 'instant_search',
          objectIDs: ['object-id1'],
        },
        widgetType: 'ais.hits',
      });
    });
  });
});
