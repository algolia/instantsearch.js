/** @jsx h */

import { h, createRef, Component } from 'preact';
import cx from 'classnames';
import { isSpecialClick, isEqual } from '../../lib/utils';
import { PreparedTemplateProps } from '../../lib/utils/prepareTemplateProps';
import Template from '../Template/Template';
import RefinementListItem from './RefinementListItem';
import SearchBox, {
  SearchBoxComponentCSSClasses,
  SearchBoxComponentTemplates,
} from '../SearchBox/SearchBox';
import defaultSearchBoxTemplates from '../../widgets/search-box/defaultTemplates';
import { RefinementListItem as TRefinementListItem } from '../../connectors/refinement-list/connectRefinementList';
import { HierarchicalMenuItem } from '../../connectors/hierarchical-menu/connectHierarchicalMenu';
import {
  ComponentCSSClasses,
  ComponentTemplates,
  CreateURL,
  Templates,
} from '../../types';
import {
  RefinementListOwnCSSClasses,
  RefinementListOwnTemplates,
} from '../../widgets/refinement-list/refinement-list';
import { RatingMenuComponentCSSClasses } from '../../widgets/rating-menu/rating-menu';
import { HierarchicalMenuComponentCSSClasses } from '../../widgets/hierarchical-menu/hierarchical-menu';

// CSS types
type RefinementListOptionalClasses =
  | 'noResults'
  | 'checkbox'
  | 'labelText'
  | 'showMore'
  | 'disabledShowMore'
  | 'searchBox';

type RefinementListWidgetCSSClasses = ComponentCSSClasses<
  RefinementListOwnCSSClasses
>;

type RefinementListRequired = Omit<
  RefinementListWidgetCSSClasses,
  RefinementListOptionalClasses
> &
  Partial<Pick<RefinementListWidgetCSSClasses, RefinementListOptionalClasses>>;

export type RefinementListComponentCSSClasses = RefinementListRequired & {
  searchable?: SearchBoxComponentCSSClasses;
} & Partial<Pick<RatingMenuComponentCSSClasses, 'disabledItem'>> &
  Partial<
    Pick<HierarchicalMenuComponentCSSClasses, 'childList' | 'parentItem'>
  >;

// Templates types

export type RefinementListWidgetTemplates = ComponentTemplates<
  RefinementListOwnTemplates
>;

type FacetValue = TRefinementListItem | HierarchicalMenuItem;
type FacetValues = TRefinementListItem[] | HierarchicalMenuItem[];

export type RefinementListProps<TTemplates extends Templates> = {
  createURL: CreateURL<string>;
  cssClasses: RefinementListComponentCSSClasses;
  depth?: number;
  facetValues?: FacetValues;
  attribute?: string;
  templateProps: PreparedTemplateProps<TTemplates>;
  searchBoxTemplateProps?: PreparedTemplateProps<SearchBoxComponentTemplates>;
  toggleRefinement: (value: string) => void;
  searchFacetValues?: (query: string) => void;
  searchPlaceholder?: string;
  isFromSearch?: boolean;
  showMore?: boolean;
  toggleShowMore?: () => void;
  isShowingMore?: boolean;
  hasExhaustiveItems?: boolean;
  canToggleShowMore?: boolean;
  searchIsAlwaysActive?: boolean;
  className?: string;
  children?: h.JSX.Element;
};

const defaultProps = {
  cssClasses: {},
  depth: 0,
};

type RefinementListPropsWithDefaultProps<
  TTemplates extends Templates
> = RefinementListProps<TTemplates> & Readonly<typeof defaultProps>;

type RefinementListItemTemplateData<
  TTemplates extends Templates
> = FacetValue & {
  url: string;
} & Pick<
    RefinementListProps<TTemplates>,
    'attribute' | 'cssClasses' | 'isFromSearch'
  >;

function isHierarchicalMenuItem(
  facetValue: FacetValue
): facetValue is HierarchicalMenuItem {
  return (facetValue as HierarchicalMenuItem).data !== undefined;
}

class RefinementList<TTemplates extends Templates> extends Component<
  RefinementListPropsWithDefaultProps<TTemplates>
> {
  public static defaultProps = defaultProps;

  private searchBox = createRef<SearchBox>();

  public constructor(props: RefinementListPropsWithDefaultProps<TTemplates>) {
    super(props);
    this.handleItemClick = this.handleItemClick.bind(this);
  }

  public shouldComponentUpdate(
    nextProps: RefinementListPropsWithDefaultProps<TTemplates>
  ) {
    const areFacetValuesDifferent = !isEqual(
      this.props.facetValues,
      nextProps.facetValues
    );

    return areFacetValuesDifferent;
  }

  private refine(facetValueToRefine: string) {
    this.props.toggleRefinement(facetValueToRefine);
  }

  private _generateFacetItem(facetValue: FacetValue) {
    let subItems;
    if (
      isHierarchicalMenuItem(facetValue) &&
      Array.isArray(facetValue.data) &&
      facetValue.data.length > 0
    ) {
      const { root, ...cssClasses } = this.props.cssClasses;

      subItems = (
        <RefinementList
          {...this.props}
          // We want to keep `root` required for external usage but not for the
          // sub items.
          cssClasses={cssClasses as RefinementListComponentCSSClasses}
          depth={this.props.depth + 1}
          facetValues={facetValue.data}
          showMore={false}
          className={this.props.cssClasses.childList}
        />
      );
    }

    const url = this.props.createURL(facetValue.value);
    const templateData: RefinementListItemTemplateData<TTemplates> = {
      ...facetValue,
      url,
      attribute: this.props.attribute,
      cssClasses: this.props.cssClasses,
      isFromSearch: this.props.isFromSearch,
    };

    let { value: key } = facetValue;
    if (facetValue.isRefined !== undefined) {
      key += `/${facetValue.isRefined}`;
    }

    if (facetValue.count !== undefined) {
      key += `/${facetValue.count}`;
    }

    const refinementListItemClassName = cx(this.props.cssClasses.item, {
      [this.props.cssClasses.selectedItem]: facetValue.isRefined,
      // cx allows `undefined` as a key but typescript doesn't
      [this.props.cssClasses.disabledItem!]: !facetValue.count,
      [this.props.cssClasses.parentItem!]:
        isHierarchicalMenuItem(facetValue) &&
        Array.isArray(facetValue.data) &&
        facetValue.data.length > 0,
    });

    return (
      <RefinementListItem
        templateKey="item"
        key={key}
        facetValueToRefine={facetValue.value}
        handleClick={this.handleItemClick}
        isRefined={facetValue.isRefined}
        className={refinementListItemClassName}
        subItems={subItems}
        templateData={templateData}
        templateProps={this.props.templateProps}
      />
    );
  }

  // Click events on DOM tree like LABEL > INPUT will result in two click events
  // instead of one.
  // No matter the framework, see https://www.google.com/search?q=click+label+twice
  //
  // Thus making it hard to distinguish activation from deactivation because both click events
  // are very close. Debounce is a solution but hacky.
  //
  // So the code here checks if the click was done on or in a LABEL. If this LABEL
  // has a checkbox inside, we ignore the first click event because we will get another one.
  //
  // We also check if the click was done inside a link and then e.preventDefault() because we already
  // handle the url
  //
  // Finally, we always stop propagation of the event to avoid multiple levels RefinementLists to fail: click
  // on child would click on parent also
  private handleItemClick({
    facetValueToRefine,
    isRefined,
    originalEvent,
  }: {
    facetValueToRefine: string;
    isRefined: boolean;
    originalEvent: MouseEvent;
  }) {
    if (isSpecialClick(originalEvent)) {
      // do not alter the default browser behavior
      // if one special key is down
      return;
    }

    if (
      !(originalEvent.target instanceof HTMLElement) ||
      !(originalEvent.target.parentNode instanceof HTMLElement)
    ) {
      return;
    }

    if (
      isRefined &&
      originalEvent.target.parentNode.querySelector(
        'input[type="radio"]:checked'
      )
    ) {
      // Prevent refinement for being reset if the user clicks on an already checked radio button
      return;
    }

    if (originalEvent.target.tagName === 'INPUT') {
      this.refine(facetValueToRefine);
      return;
    }

    let parent = originalEvent.target;

    while (parent !== originalEvent.currentTarget) {
      if (
        parent.tagName === 'LABEL' &&
        (parent.querySelector('input[type="checkbox"]') ||
          parent.querySelector('input[type="radio"]'))
      ) {
        return;
      }

      if (parent.tagName === 'A' && (parent as HTMLAnchorElement).href) {
        originalEvent.preventDefault();
      }

      parent = parent.parentNode as HTMLElement;
    }

    originalEvent.stopPropagation();

    this.refine(facetValueToRefine);
  }

  public componentWillReceiveProps(
    nextProps: RefinementListPropsWithDefaultProps<TTemplates>
  ) {
    if (this.searchBox.current && !nextProps.isFromSearch) {
      this.searchBox.current.resetInput();
    }
  }

  private refineFirstValue() {
    const firstValue = this.props.facetValues && this.props.facetValues[0];
    if (firstValue) {
      const actualValue = firstValue.value;
      this.props.toggleRefinement(actualValue);
    }
  }

  public render() {
    const showMoreButtonClassName = cx(this.props.cssClasses.showMore, {
      [this.props.cssClasses.disabledShowMore!]: !(
        this.props.showMore === true && this.props.canToggleShowMore
      ),
    });

    const showMoreButton = this.props.showMore === true && (
      <Template
        {...this.props.templateProps}
        templateKey="showMoreText"
        rootTagName="button"
        rootProps={{
          className: showMoreButtonClassName,
          disabled: !this.props.canToggleShowMore,
          onClick: this.props.toggleShowMore,
        }}
        data={{
          isShowingMore: this.props.isShowingMore,
        }}
      />
    );

    const shouldDisableSearchBox =
      this.props.searchIsAlwaysActive !== true &&
      !(this.props.isFromSearch || !this.props.hasExhaustiveItems);

    const { templates } = this.props.searchBoxTemplateProps || {};

    const searchBox = this.props.searchFacetValues && (
      <div className={this.props.cssClasses.searchBox}>
        <SearchBox
          ref={this.searchBox}
          placeholder={this.props.searchPlaceholder}
          disabled={shouldDisableSearchBox}
          cssClasses={this.props.cssClasses.searchable!}
          templates={{ ...defaultSearchBoxTemplates, ...templates }}
          onChange={(event: Event) =>
            this.props.searchFacetValues!(
              (event.target as HTMLInputElement).value
            )
          }
          onReset={() => this.props.searchFacetValues!('')}
          onSubmit={() => this.refineFirstValue()}
          // This sets the search box to a controlled state because
          // we don't rely on the `refine` prop but on `onChange`.
          searchAsYouType={false}
        />
      </div>
    );

    const facetValues = this.props.facetValues &&
      this.props.facetValues.length > 0 && (
        <ul className={this.props.cssClasses.list}>
          {this.props.facetValues.map(this._generateFacetItem, this)}
        </ul>
      );

    const noResults = this.props.searchFacetValues &&
      this.props.isFromSearch &&
      (!this.props.facetValues || this.props.facetValues.length === 0) && (
        <Template
          {...this.props.templateProps}
          templateKey="searchableNoResults"
          rootProps={{ className: this.props.cssClasses.noResults }}
        />
      );

    const rootClassName = cx(
      this.props.cssClasses.root,
      {
        [this.props.cssClasses.noRefinementRoot]:
          !this.props.facetValues || this.props.facetValues.length === 0,
      },
      this.props.className
    );

    return (
      <div className={rootClassName}>
        {this.props.children}
        {searchBox}
        {facetValues}
        {noResults}
        {showMoreButton}
      </div>
    );
  }
}

export default RefinementList;
