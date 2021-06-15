/** @jsx h */

import { h } from 'preact';
import { ComponentCSSClasses } from '../../types';
import {
  QueryRuleCustomDataCSSClasses,
  QueryRuleCustomDataTemplates,
} from '../../widgets/query-rule-custom-data/query-rule-custom-data';
import Template from '../Template/Template';

export type QueryRuleCustomDataComponentCSSClasses = ComponentCSSClasses<
  QueryRuleCustomDataCSSClasses
>;

export type QueryRuleCustomDataProps = {
  cssClasses: QueryRuleCustomDataComponentCSSClasses;
  templates: QueryRuleCustomDataTemplates;
  items: any[];
};

const QueryRuleCustomData = ({
  cssClasses,
  templates,
  items,
}: QueryRuleCustomDataProps) => (
  <Template
    templateKey="default"
    templates={templates}
    rootProps={{ className: cssClasses.root }}
    data={{ items }}
  />
);

export default QueryRuleCustomData;
