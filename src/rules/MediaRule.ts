import {IMediaRule, RuleType} from "./RuleTypes"
import {Rule} from "./Rule"
import {GroupRule} from "./GroupRule"
import {MediaQuery} from "../styles/MediaTypes"
import {mediaQueryToCssString} from "../styles/MediaFuncs";



/**
 * The MediaRule type describes a CSS @media rule.
 */
export class MediaRule<T = any> extends GroupRule<T> implements IMediaRule<T>
{
	public constructor( query?: string | MediaQuery, definition?: T)
	{
		super( RuleType.MEDIA, definition);

		this.query = query;
	}



	// Creates a copy of the rule.
	public clone(): MediaRule<T>
	{
		let newRule = new MediaRule<T>();
		newRule.query = this.query;
		return newRule;
	}



	// Inserts this rule into the given parent rule or stylesheet.
	public insert( parent: CSSStyleSheet | CSSGroupingRule): void
	{
		let queryString = typeof this.query === "string" ? this.query : mediaQueryToCssString( this.query);

		this.cssRule = Rule.addRuleToDOM( `@media ${queryString} {}`, parent);

		// insert sub-rules
		this.insertRules( this.cssMediaRule);
	}



	/** SOM media rule */
	public get cssMediaRule(): CSSMediaRule { return this.cssRule as CSSMediaRule; }

	// media query for this rule.
	public query: string | MediaQuery;
}



