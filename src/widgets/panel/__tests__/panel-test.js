import panel from '../panel';

describe('Usage', () => {
  test('without arguments does not throw', () => {
    expect(() => panel()).not.toThrow();
  });

  test('with templates does not throw', () => {
    expect(() =>
      panel({
        templates: { header: 'header' },
      })
    ).not.toThrow();
  });

  test('with `hidden` as function does not throw', () => {
    expect(() =>
      panel({
        hidden: () => true,
      })
    ).not.toThrow();
  });

  test('with `hidden` as boolean warns', () => {
    expect(() => {
      panel({
        hidden: true,
      });
    }).toWarnDev(
      '[InstantSearch.js]: The `hidden` option in the "panel" widget expects a function returning a boolean (received "boolean" type).'
    );
  });

  test('with a widget without `container` throws', () => {
    const fakeWidget = () => {};

    expect(() => panel()(fakeWidget)({})).toThrowErrorMatchingInlineSnapshot(`
"The \`container\` option is required in the widget within the panel.

See documentation: https://www.algolia.com/doc/api-reference/widgets/panel/js/"
`);
  });
});
