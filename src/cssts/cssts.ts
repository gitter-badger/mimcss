﻿/**
 * This module defines types and functions that allow building CSS style sheets using TypeScript.
 */


import {StylePropType, stylePropToCssString} from "../styles/styles";


/**
 * The StylePropBlock type defines a block of style properties and allows specifying the
 * "!important" modifier for individual properties.
 */
export type Ruleset = { [K in keyof StylePropType]?: StylePropType[K] };



/** Converts the given ruleset to its string representation */
export function rulesetToString( ruleset: Ruleset, important: Set<string>): string
{
    let s = "";
	for( let propName in ruleset)
	{
		// get property value and get its string representation
		let propVal = ruleset[propName];
		s += stylePropToCssString( propName, propVal);

		// check whether this property is important
		if (important.has( propName))
			s += (important.has( propName) ? " !important;" : ";");
	}

    return `{${s}}`;
}



/**
 * The IStyleSheetDefinition interface represent a style sheet definition. Developers never use
 * this interface directly; instead they derive their style sheet definitions from the base call
 * [[StyleSheetDefinition]].
 */
export interface IStyleSheetDefinition
{
	/**
	 * Processes the style sheet definition and creates a StyleSheet object, which is remembered
	 * in the styleSheet property. This method can be called many times but it only creates a
	 * single instance of the StyleSheet object.
	 */
	process(): IStyleSheet<IStyleSheetDefinition>;

	/** Reference to the StyleSheet after the definition has been processed */
	styleSheet?: IStyleSheet<IStyleSheetDefinition>;
}



/**
 * The IRule interface is a base interface that is implemented by all rules. Its only purpose is to
 * provide the reference to the style sheet definition that owns it.
 */
export interface IRule
{
	/**
	 * Processes the style sheet definition and creates a StyleSheet object, which is remembered
	 * in the styleSheet property. This method can be called many times but it only creates a
	 * single instance of the StyleSheet object.
	 */
	owner: IStyleSheetDefinition;
}



/**
 * The IStyleRule interface represents a styling rule in a style sheet. Style rules can be used
 * anywhere where style properties can be defined: class rules, ID rules, selector rules,
 * keyframes, etc. StyleRule defines a ruleset and can optionally point to one or more style rules
 * from which it inherits. A ruleset combines all the properties from its own property block as
 * well as from all of style rules it inherites from.
 * 
 * Note that although the meaning of style rules inheritance is always the same (application of all
 * style properties throughout the inheritance chain), the implementation is different for
 * different contexts. In particular, if it is a class rule and it only inherits from other class
 * rules, the resultant rule doesn't repeat the style properties from the parent rules; instead,
 * the class name becomes a combination of several class names.
 */
export interface IStyleRule extends IRule
{
	/**Ruleset that defines property names and values */
	ruleset: Ruleset;

	/** List of style rules from which this rule should inherit */
	parents: IStyleRule[];

	/** Set of property names from this ruleset that should be !important */
	important: Set<string>;
}



/**
 * The ExtendedRuleset ruleset type extends the Ruleset type with certain properties that provide
 * additional meaning to the ruleset:
 * - The `$inherits` property specifies one or more parent style rules. This allows specifying
 *   parent rules using a convenient style-property-like notation. Parents can also be specified
 *   without a ruleset.
 * - The `$important` property specifies one or more names of ruleset properties that shuld be
 *   considered "important". When the rule is inserted into DOM, the "!important" attribute is
 *   added to the property value.
 */
export type ExtendedRuleset =
	(Ruleset &
		{
			$inherits?: IStyleRule | IStyleRule[],
			$important?: string | string[],
		}
	) | IStyleRule | IStyleRule[];



/**
 * The ITagRule interface represents a style rule that applies to elements identified by a tag name.
 */
export interface ITagRule extends IStyleRule
{
	/** Only needed to distinguish from class and ID rules */
	readonly isTagRule: boolean;
}

/**
 * The IClassRule interface represents a style rule that applies to elements identified by a class.
 */
export interface IClassRule extends IStyleRule
{
	/** Only needed to distinguish from tag and ID rules */
	readonly isClassRule: boolean;
}

/**
 * The IIDRule interface representsa a style rule that applies to elements identified by an ID.
 */
export interface IIDRule extends IStyleRule
{
	/** Only needed to distinguish from tag and class rules */
	readonly isIDRule: boolean;
}

/**
 * The ISelectorRule interface representsa a ruleset that applies to elements identifies by the
 * given selector.
 */
export interface ISelectorRule extends IStyleRule
{
	readonly selector: ISelector;
}

/**
 * The IAnimationRule interface represents a @keyframe rule as a sequence of keyframes.
 */
export interface IAnimationRule extends IRule
{
	readonly keyframes: Keyframe[];
}

/**
 * The Keyframe type defines a single keyframe within a @keyframe rule.
 */
export type Keyframe = { waypoint: "from" | "to" | number, style: ExtendedRuleset }



// /**
//  * The StyleSheetDef type defines a style sheet (that becomes a <style> element in HTML). Style
//  * sheet definitions consist of rules that define classes, IDs, animations, selectors, media
//  * conditions etc.
//  */
// export type StyleSheetDef = { [K: string]: ClassRule | IDRule | AnimationRule; };



/**
 * Utility type that represents all properties of type T that are of type U
 */
type PropsOfType<T,U> = { [K in keyof T]: T[K] extends U ? K : never };

/**
 * Utility type that represents names of all properties of type T that are of type U
 */
type PropNamesOfType<T,U> = PropsOfType<T,U>[keyof T];

/**
 * Utility type that represents string values mapped to names of properties of type T that are
 * of type U.
 */
type NamesOfPropsOfType<T,U> = { [K in PropNamesOfType<T,U>]: string };

/**
 * Type that represents names of all properties of type T that are class rules
 */
export type ClassNames<T> = NamesOfPropsOfType<T,IClassRule>;

/**
 * Type that represents names of all properties of type T that are class rules
 */
export type IDNames<T> = NamesOfPropsOfType<T,IIDRule>;

/**
 * Type that represents names of all properties of type T that are keyframe rules
 */
export type AnimationNames<T> = NamesOfPropsOfType<T,IAnimationRule>;

/**
 * Type that represents all properties of type T that are rules
 */
export type AllRules<T> = { [K in PropNamesOfType<T,IRule>]: T[K] };



/**
 * The StyleSheet type defines the resultant style sheet after the style sheet definition has been
 * processed. The style sheet object contains names of IDs, classes and keyframes, which can be
 * used in the application code. The interface also provides methods that are used to manipulate
 * the style sheet and its rulesets.
 */
export interface IStyleSheet<T>
{
	/** Names of classes defined in the style sheet */
	readonly classNames: ClassNames<T>;

	/** Names of classes defined in the style sheet */
	readonly idNames: IDNames<T>;

	/** Names of keyframes defined in the style sheet */
	readonly animationNames: AnimationNames<T>;

	/**
	 * Map of names of properties of the style definition to the Rule objects. This is used when
	 * creating an actual style sheet.
	 */
	readonly rules: AllRules<T>;
}



/**
 * Represents a complete CSS selector that can be either used as is or can be combined with other selectors.
 */
export interface ISelector extends IAllowCompoundSelector
{
	readonly and: IEmptySelector;
	readonly child: IEmptySelector;
	readonly descendand: IEmptySelector;
	readonly sibling: IEmptySelector;
	readonly adjacent: IEmptySelector;

	/** Returns a list of all rules participating in the selector. */
	getRules(): (ITagRule | IClassRule | IIDRule)[];

	/** Returns the string representation of the selector */
	toSelectorString(): string;
}



/**
 * Represents a starting point in the selector building process. This selector cannot be used as
 * is because it doesn't contain any selection content yet.
 */
export interface IEmptySelector extends IAllowCompoundSelector
{
	readonly all: ISelector;
	tag( tag: string | ITagRule): ISelector;
	id( id: string | IIDRule): ISelector;
}



/**
 * Represents a point in selector building, which allows class, attribute, pseudo-class and pseudo element selectors
 */
interface IAllowCompoundSelector
{
	class( cls: string | IClassRule): ISelector;
	attr( attrName: string, op?: AttrSelectorOperation, value?: string, caseInsensitive?: boolean): ISelector;

	// pseudo classes
	readonly hover: ISelector;
	nthChild( a: number | "odd" | "even", b?: number): ISelector;

	// pseudo elements
	readonly after: ISelector;
}



/**
 * Represents possible operations for attribute selector
 */
export enum AttrSelectorOperation
{
	Match = "=",
	Word = "~=",
	SubCode = "|=",
	StartsWith = "^=",
	EndsWith = "$=",
	Contains = "*=",
}



///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Implementation of StyleSheetDefinition and createStyleSheet
//
///////////////////////////////////////////////////////////////////////////////////////////////////
import {defineTagRule} from "./TagRule";
import {defineClassRule} from "./ClassRule";
import {defineIDRule} from "./IDRule";
import {defineSelectorRule} from "./SelectorRule";
import {defineAnimationRule} from "./AnimationRule";
import {createStyleSheetImpl} from "./StyleSheet";

/**
 * The SheetDefinition class is a base class from which all style sheet definition classes must
 * derive. It provides the methods for defining rules.
 */
export abstract class StyleSheetDefinition implements IStyleSheetDefinition
{
	protected defineTagRule( ruleset?: ExtendedRuleset): ITagRule
	{
		return defineTagRule( this, ruleset);
	}

	protected defineClassRule( ruleset?: ExtendedRuleset): IClassRule
	{
		return defineClassRule( this, ruleset);
	}

	protected defineIDRule( ruleset?: ExtendedRuleset): IIDRule
	{
		return defineIDRule( this, ruleset);
	}

	protected defineSelectorRule( selector: ISelector, ruleset?: ExtendedRuleset): ISelectorRule
	{
		return defineSelectorRule( this, selector, ruleset);
	}

	protected defineAnimationRule( ...keyframes: Keyframe[]): IAnimationRule
	{
		return defineAnimationRule( this, keyframes);
	}

	/**
	 * Processes the style sheet definition and creates a StyleSheet object, which is remembered
	 * in the styleSheet property. This method can be called many times but it only creates a
	 * single instance of the StyleSheet object.
	 */
	public process(): IStyleSheet<IStyleSheetDefinition>
	{
		if (!this.styleSheet)
			this.styleSheet = createStyleSheetImpl( this);

		return this.styleSheet;
	}

	/** Reference to the StyleSheet after the definition has been processed */
	public styleSheet?: IStyleSheet<IStyleSheetDefinition>;
}



/**
 * Processes the given style sheet definition and returns the StyleSheet object that contains
 * names of IDs, classes and keyframes and allows style manipulations.
 * @param sheetDef 
 */
export function createStyleSheet<T extends IStyleSheetDefinition>( sheetDef: T): IStyleSheet<T>
{
	return createStyleSheetImpl( sheetDef) as IStyleSheet<T>;
}



/**
 * Generates name to use for the given rule from the given style sheet.
 * @param sheetName 
 * @param ruleName 
 */
export function generateName( sheetName: string, ruleName: string): string
{
	return `${sheetName}_${ruleName}`;
}



///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Implementation of createStyleSheet
//
///////////////////////////////////////////////////////////////////////////////////////////////////
import {Selector} from "./Selector";

/**
 * Creates an empty selector from which selector building process starts.
 */
export function createSelector(): IEmptySelector { return new Selector(); }

/**
 * Creates a selector build a selector.
 */
export function createRawSelector( raw: string): ISelector { return new Selector( raw); }



