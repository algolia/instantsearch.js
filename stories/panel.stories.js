import { storiesOf } from '@storybook/html';
import { withHits } from '../.storybook/decorators';

storiesOf('Panel', module)
  .add(
    'default',
    withHits(({ search, container, instantsearch }) => {
      search.addWidget(
        instantsearch.widgets.panel({
          templates: {
            header: ({ results }) =>
              `Header ${results ? `| ${results.nbHits} results` : ''}`,
            footer: 'Footer',
          },
          hidden: ({ results }) => results.nbHits === 0,
        })(instantsearch.widgets.refinementList)({
          container,
          attribute: 'brand',
        })
      );
    })
  )
  .add(
    'with range input',
    withHits(({ search, container, instantsearch }) => {
      search.addWidget(
        instantsearch.widgets.panel({
          templates: {
            header: 'Price',
            footer: 'Footer',
          },
          hidden: ({ results }) => results.nbHits === 0,
        })(instantsearch.widgets.rangeInput)({
          container,
          attribute: 'price',
        })
      );
    })
  )
  .add(
    'with range slider',
    withHits(({ search, container, instantsearch }) => {
      search.addWidget(
        instantsearch.widgets.panel({
          templates: {
            header: 'Price',
            footer: 'Footer',
          },
          hidden: ({ results }) => results.nbHits === 0,
        })(instantsearch.widgets.rangeSlider)({
          container,
          attribute: 'price',
          tooltips: {
            format(rawValue) {
              return `$${Math.round(rawValue).toLocaleString()}`;
            },
          },
        })
      );
    })
  )
  .add(
    'with collapsed',
    withHits(({ search, container, instantsearch }) => {
      search.addWidget(
        instantsearch.widgets.panel({
          collapsed: options => {
            return options && options.state && options.state.query.length === 0;
          },
          templates: {
            header: 'Collapsible panel',
            footer: 'Footer',
          },
        })(instantsearch.widgets.refinementList)({
          container,
          attribute: 'brand',
        })
      );
    })
  )
  .add(
    'with collapsed and templates',
    withHits(({ search, container, instantsearch }) => {
      search.addWidget(
        instantsearch.widgets.panel({
          collapsed: options => {
            return options && options.state && options.state.query.length === 0;
          },
          templates: {
            header: 'Collapsible panel',
            footer: 'Footer',
            collapseButton: ({ collapsed }) => (collapsed ? 'More' : 'Less'),
          },
        })(instantsearch.widgets.refinementList)({
          container,
          attribute: 'brand',
        })
      );
    })
  );
