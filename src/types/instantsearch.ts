export type InstantSearch = {
  templatesConfig?: object;
};

export type InstantSearchOptions = any;

export type Helper = any;

export type HelperState = any;

export type SearchParameters = any;

export type SearchResults = any;

type HitAttributeHighlightResult = {
  value: string;
  matchLevel: 'none' | 'partial' | 'full';
  matchedWords: string[];
  fullyHighlighted?: boolean;
};

type HitHighlightResult = {
  [attribute: string]:
    | HitAttributeHighlightResult
    | HitAttributeHighlightResult[]
    | HitHighlightResult;
};

type HitAttributeSnippetResult = Pick<
  HitAttributeHighlightResult,
  'value' | 'matchLevel'
>;

type HitSnippetResult = {
  [attribute: string]:
    | HitAttributeSnippetResult
    | HitAttributeSnippetResult[]
    | HitSnippetResult;
};

export type Hit = {
  [attribute: string]: any;
  objectID: string;
  _highlightResult?: HitHighlightResult;
  _snippetResult?: HitSnippetResult;
  _rankingInfo?: {
    promoted: boolean;
    nbTypos: number;
    firstMatchedWord: number;
    proximityDistance?: number;
    geoDistance: number;
    geoPrecision?: number;
    nbExactWords: number;
    words: number;
    filters: number;
    userScore: number;
    matchedGeoLocation?: {
      lat: number;
      lng: number;
      distance: number;
    };
  };
  _distinctSeqID?: number;
};

export type FacetHit = {
  value: string;
  highlighted: string;
  count: number;
  isRefined: boolean;
};

export type FacetRefinement = {
  value: string;
  type: 'conjunctive' | 'disjunctive' | 'exclude';
};

export type NumericRefinement = {
  value: number[];
  type: 'numeric';
  operator: string;
};

export type Refinement = FacetRefinement | NumericRefinement;
