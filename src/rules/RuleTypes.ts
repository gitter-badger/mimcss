﻿/**
 * This module defines types and interfaces that represent CSS rules.
 */


import {IVarProxy} from "../styles/UtilTypes";
import {IStyleset, Styleset, ICssStyleset, VarTemplateName, VarValueType} from "../styles/StyleTypes";
import {IAnimationNameProxy} from "../styles/StyleTypes";
import {PseudoClass, PseudoElement, CssSelector, PagePseudoClass} from "../styles/SelectorTypes";


/**
 * The ExtendedStyleset type extends the Styleset type with certain properties that provide
 * additional meaning to the styleset and allow building nested styles:
 * - The `+` property specifies one or more parent style rules. This allows specifying
 *   parent rules using a convenient style-property-like notation.
 * - Properties with pseudo class names (e.g. ":hover") or pseudo element names (e.g. "::after").
 *   These properties define a styleset that will be assigned to the selector obtained by using
 *   the original styleset's owner followed by the given pseudo class or pseudo element.
 * - The "&" property that contains array of two-element tuples each defining a selector and a
 *   style corresponding to this selector. Selectors can use the ampersand symbol ('&') to refer
 *   to the parent style selector.
 * 
 * Functions that return style rules (e.g. $class) accept the ExtendedStyleset as a parameter,
 * for example:
 * 
 * ```typescript
 * class MyStyles
 * {
 *     myClass = $class( {
 *         backgroundColor: "white",
 *         ":hover" : {
 *             backgroundColor: "gray"
 *         },
 *         "&": [
 *             [ "li > &", { backgroundColor: "yellow" } ]
 *         ]
 *     })
 * }
 * ```
 * 
 * This will translate to the following CSS (class name is auto-generated):
 * 
 * ```css
 * .m123 { backgroundColor: white; }
 * .m123:hover { backgroundColor: gray; }
 * li > .m123 { backgroundColor: yellow; }
 * ```
 */
export type ExtendedStyleset = Styleset & { [K in PseudoClass | PseudoElement]?: ExtendedStyleset } &
	{
		"+"?: IStyleRule | IStyleRule[],
		"&"?: [CssSelector, ExtendedStyleset][],
	};
	



/**
 * The IRule interface is a base interface that is implemented by all rules.
 */
export interface IRule
{
	/** SOM rule */
	readonly cssRule: CSSRule;
}



/**
 * The INamedRule interface is a base interface implemented by all rules that have a name; that is,
 * class, ID, keyframes and custom CSS property.
 */
export interface INamedEntity
{
	/**
	 * Rule's name - this is a unique name that is assigned by the Mimcss infrastucture. This name
	 * doesn't have the prefix that is used when referring to classes (.), IDs (#) and custom CSS
	 * properties (--).
	 */
	readonly name: string;
}



/**
 * The IStyleRule interface represents a styling rule in a style sheet. Style rules can be used
 * anywhere where style properties can be defined: class rules, ID rules, selector rules,
 * keyframes, etc. StyleRule defines a styleset and can optionally point to one or more style rules
 * from which it inherits. A styleset combines all the properties from its own property block as
 * well as from all of style rules it inherites from.
 */
export interface IStyleRule extends IRule
{
	/** SOM style rule */
	readonly cssRule: CSSStyleRule;

	/**
	 * Adds/replaces the value of the given CSS property in this rule.
	 * @param name Name of the CSS property.
	 * @param value New value of the CSS property.
	 * @param important Flag indicating whether to set the "!important" flag on the property value.
	 */
	setProp<K extends keyof IStyleset>( name: K, value: IStyleset[K], important?: boolean): void;

	/**
	 * Adds/replaces the value of the given custmom cSS property in this rule.
	 * @param customVar ICUstomVar object defining a custom CSS property.
	 * @param value New value of the custom CSS property.
	 * @param important Flag indicating whether to set the "!important" flag on the property value.
	 */
	setCustomProp<K extends VarTemplateName>( customVar: IVarRule<K>, value: VarValueType<K>, important?: boolean): void;
}



/**
 * The IAbstractRule interface represents a style rule that can only be used as a base for other
 * style rules. No CSSStyleRule objects are created for the abstract rules.
 */
export interface IAbstractRule extends IStyleRule
{
	/** Flag, which is always true, that is needed to distinguish abstract rules from other rules */
	readonly isAbstractRule: boolean;
}



/**
 * The ITagRule interface represents a style rule that applies to elements identified by a tag name.
 * Objects implementing this interface are returned from the [[$tag]] function.
 */
export interface ITagRule extends IStyleRule
{
	/** Name of the HTML tag */
	readonly tag: string;
}



/**
 * The IClassRule interface represents a style rule that applies to elements identified by a class.
 * Objects implementing this interface are returned from the [[$class]] function.
 */
export interface IClassRule extends IStyleRule, INamedEntity
{
	/** Flag, which is always true, that is needed to distinguish class rules from other rules */
	readonly isClassRule: boolean;
}



/**
 * The IIDRule interface representsa a style rule that applies to elements identified by an ID.
 * Objects implementing this interface are returned from the [[$id]] function.
 */
export interface IIDRule extends IStyleRule, INamedEntity
{
	/** Flag, which is always true, that is needed to distinguish ID rules from other rules */
	readonly isIDRule: boolean;
}



/**
 * The ISelectorRule interface representsa a styleset that applies to elements identifies by the
 * given selector.
 * Objects implementing this interface are returned from the [[$style]] function.
 */
export interface ISelectorRule extends IStyleRule
{
	/** CSS rule selector string */
	readonly selectorText: string;
}



/**
 * The IAnimationRule interface represents the @keyframes rule.
 * Objects implementing this interface are returned from the [[$keyframes]] function.
 */
export interface IAnimationRule extends IRule, INamedEntity, IAnimationNameProxy
{
	/** SOM keyframes rule */
	readonly cssRule: CSSKeyframesRule;
}

/**
 * The AnimationFrame type defines a single keyframe within a @keyframes rule.
 * The waypoint can be specified as "from" or "to" strings or as a number 0 to 100, which will be
 * used as a percent. Styleset for a keyframe allows custom properties (via "--") but do not
 * allow the !important flag ("!").
 */
export type AnimationFrame = ["from" | "to" | number, Omit<ExtendedStyleset,"!">];



/**
 * The IImportRule interface represents the CSS @import rule.
 * Objects implementing this interface are returned from the [[$import]] function.
 */
export interface IImportRule extends IRule
{
	/** SOM import rule */
	readonly cssRule: CSSImportRule;
}



/**
 * The IFontFaceRule interface represents the CSS @font-face rule.
 * Objects implementing this interface are returned from the [[$fontface]] function.
 */
export interface IFontFaceRule extends IRule
{
	/** SOM font-face rule */
	readonly cssRule: CSSFontFaceRule;
}



/**
 * The INamespaceRule interface represents the CSS @namespace rule.
 * Objects implementing this interface are returned from the [[$namespace]] function.
 */
export interface INamespaceRule extends IRule
{
	/** Namespace string for the rule */
	readonly namespace: string;

	/** Optional prefix for the rule */
	readonly prefix: string | undefined;

	/** SOM namespace rule */
	readonly cssRule: CSSNamespaceRule;
}



/**
 * The IPageRule interface represents the CSS @page rule.
 * Objects implementing this interface are returned from the [[$page]] function.
 */
export interface IPageRule extends IStyleRule
{
	/** Optional name of the page pseudo style (e.g. "":first") */
	readonly pseudoClass: PagePseudoClass | undefined;

	/** SOM namespace rule */
	readonly cssRule: CSSPageRule;
}



/**
 * The IVarRule interface represents a CSS custom property definition.
 * Objects implementing this interface are returned from the [[$var]] function.
 */
export interface IVarRule<K extends VarTemplateName = any> extends INamedEntity, IVarProxy<VarValueType<K>>
{
	/** Name of a non-custom CSS property whose type determines the type of the custom property value. */
	readonly template: K;
}



/**
 * Symbol that is used for the property in the StyleDefinition class that keeps reference to the
 * top-level style definition class. Developers can use this property to access rules in the
 * chain of nested grouping rules. We need to avoid enumerating this property when processing
 * the rules in the style definition object.
 */
export const symOwner = Symbol("owner");



/**
 * The StyleDefinition class is a base for all classes that contain defininitions of CSS rules.
 * Use it the following way:
 * 
 * ```typescript
 * class MyStyles extend StyleDefinition
 * {
 *     // 8px padding on regular devices
 *     defaultPadding = $var( "padding", 8)
 * 
 *     ifNarrowDevice = $media( {maxWidth: 600 },
 *         class extends StyleDefinition<MyStyles>
 *         {
 *             // 4px padding on narrow devices
 *             defaultPadding = $var( "padding", Len.calc( "{0} / 2", this.owner.defaultPadding))
 *         }
 *     )
 * }
 * ```
 * @typeparam O Top-level style definition class, which is the owner of this class.
 */
export abstract class StyleDefinition<O extends StyleDefinition = any>
{
	/**
	 * Style definition classes are never created directly - they are instantiated only when
	 * either the [[$use]] or [[$activate]] function is called.
	 * @param owner Reference to the top-level style definition class
	 */
	public constructor( owner: O)
	{
		this[symOwner] = owner;
	}

	/**
	 * Refers to the singleton instance of the style definition class which is the **owner** of
	 * this style definition object. The owner is the top-level class in the chain of style
	 * definition classes. Through this memeber, all rules and other memebers defined in the owner
	 * definition class can be accessed.
	 */
	public get owner(): O { return this[symOwner]; }
}



/**
 * "Constructor" interface defining how style definition classes can be created.
 */
export interface IStyleDefinitionClass<T extends StyleDefinition<O> = any, O extends StyleDefinition = any>
{
	/** All style definition classes should conform to this constructor */
	new( owner: O): T;

	/**
	 * Flag inidicating that multiple instances can be created for this style definition -
	 * each time with unique rule IDs. This is useful for styles created for a control - e.g. tree
	 * or accordeon - which can be used multiple times on the same page but with different styles.
	 * By default, style definitions are singular, that is a single instance of a style definition
	 * object is created for them and inserted into DOM.
	 */
	isMultiplex?: boolean;
}



/**
 * The ISupportRule interface represents the CSS @supports rule.
 * Objects implementing this interface are returned from the [[$supports]] function.
 */
export interface IGroupRule<T extends StyleDefinition = any> extends IRule
{
	// Instance of the style definition class defining the rules under this grouping rule
	readonly rules: T;

	/** SOM supports rule */
	readonly cssRule: CSSGroupingRule;
}



/**
 * The ISupportRule interface represents the CSS @supports rule.
 * Objects implementing this interface are returned from the [[$supports]] function.
 */
export interface ISupportsRule<T extends StyleDefinition = any> extends IGroupRule<T>
{
	/** SOM supports rule */
	readonly cssRule: CSSSupportsRule;
}



/**
 * The IMediaRule interface represents the CSS @media rule.
 * Objects implementing this interface are returned from the [[$media]] function.
 */
export interface IMediaRule<T extends StyleDefinition = any> extends IGroupRule<T>
{
	/** SOM media rule */
	readonly cssRule: CSSMediaRule;
}



