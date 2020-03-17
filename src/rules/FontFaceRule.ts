import {IFontFaceRule, RuleType} from "./RuleTypes";
import {Fontface} from "../styles/FontFaceTypes"
import {fontFaceToCssString} from "../styles/FontFaceFuncs"
import {Rule} from "./Rule";



/**
 * The FontFaceRule class is used as a base class for rules that have a single style rule.
 */
export class FontFaceRule extends Rule implements IFontFaceRule
{
	public constructor( fontface?: Fontface)
	{
		super( RuleType.FONTFACE);

		this.fontface = fontface;
	}

	// Creates a copy of the rule.
	public clone(): FontFaceRule
	{
		let newRule = new FontFaceRule();
		newRule.fontface = {};
		Object.assign( this.fontface, this.fontface);
		return newRule;
	}



	// Inserts this rule into the given parent rule or stylesheet.
	public insert( parent: CSSStyleSheet | CSSGroupingRule): void
	{
		let index = parent.insertRule(
			`@font-face ${fontFaceToCssString( this.fontface)}`,
			parent.cssRules.length);

		this.cssRule = parent.cssRules[index];
	}



	/** SOM font-face rule */
	public get cssFontFaceRule(): CSSFontFaceRule { return this.cssRule as CSSFontFaceRule; }

	// Object defining font-face properties.
	public fontface: Fontface;
}


