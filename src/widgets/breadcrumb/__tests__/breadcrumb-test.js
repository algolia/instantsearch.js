import { render } from 'preact-compat';
import breadcrumb from '../breadcrumb';

jest.mock('preact-compat', () => {
  const module = require.requireActual('preact-compat');

  module.render = jest.fn();

  return module;
});

describe('breadcrumb()', () => {
  let container;
  let attributes;

  beforeEach(() => {
    container = document.createElement('div');
    attributes = ['hierarchicalCategories.lvl0', 'hierarchicalCategories.lvl1'];

    render.mockClear();
  });

  describe('render', () => {
    let results;
    let helper;
    let state;

    beforeEach(() => {
      const data = [
        {
          name: 'Cameras & Camcorders',
          path: 'Cameras & Camcorders',
          count: 1369,
          isRefined: true,
          data: [
            {
              name: 'Digital Cameras',
              path: 'Cameras & Camcorders > Digital Cameras',
              count: 170,
              isRefined: true,
              data: null,
            },
          ],
        },
      ];

      results = {
        getFacetValues: jest.fn(() => ({ data })),
        hierarchicalFacets: [
          {
            name: 'hierarchicalCategories.lvl0',
            count: null,
            isRefined: true,
            path: null,
            data,
          },
        ],
      };

      helper = {
        search: jest.fn(),
        toggleRefinement: jest.fn().mockReturnThis(),
      };

      state = {
        toggleRefinement: jest.fn().mockReturnThis(),
        hierarchicalFacets: [
          {
            attributes: [
              'hierarchicalCategories.lvl0',
              'hierarchicalCategories.lvl1',
            ],
            name: 'hierarchicalCategories.lvl0',
            separator: ' > ',
            rootPath: null,
          },
        ],
      };
    });

    it('renders transformed items correctly', () => {
      const widget = breadcrumb({
        container,
        attributes,
        transformItems: items =>
          items.map(item => ({ ...item, transformed: true })),
      });
      widget.init({
        helper,
        instantSearchInstance: {},
      });
      widget.render({
        results,
        state,
        instantSearchInstance: {},
      });

      expect(render.mock.calls[0][0]).toMatchSnapshot();
    });
  });
});
