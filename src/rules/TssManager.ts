import {StyleScope} from "./StyleScope"
import {Rule} from "./Rule"



/**
 * The TssManager class is responsible for inserting CSS rules into the DOM.
 */
export class TssManager
{
	// This class has static members only.
	private constructor() {}



	/**
	 * Sets the flag indicating whether to use optimized (unique) style names. If yes, the names
	 * will be created by appending a unique number to the given prefix. If the prefix is not
	 * specified, the standard prefix "n" will be used.
	 * @param optimize
	 * @param prefix
	 */
	public static useOptimizedStyleNames( optimize: boolean, prefix?: string): void
	{
		this.useUniqueStyleNames = optimize;
		this.uniqueStyleNamesPrefix = prefix;
	}



	/**
	 * Generates name to use for the given rule from the given style sheet.
	 * @param sheetName 
	 * @param ruleName 
	 */
	public static generateName( sheetName: string, ruleName: string): string
	{
		return this.useUniqueStyleNames
			? this.generateUniqueName( this.uniqueStyleNamesPrefix)
			: `${sheetName}_${ruleName}`;
	}



	/**
	 * Generates a unique name, which can be used either for style element's ID or or class,
	 * identifier or animation name. Names are generated using a simple incrementing number.
	 */
	public static generateUniqueName( prefix?: string): string
	{
		return (prefix ? prefix : "n") + this.nextUniqueID++;
	}



	/** Inserts rules from the given style scope into DOM */
	public static addStyleScope( styleScope: StyleScope): void
	{
		this.ensureDOM();

		styleScope.setDOMInfo( this.domSS);

		// go over the named rules, convert them to strings and insert them into the style sheet
		for( let ruleName in styleScope.namedRules)
		{
			let rule: Rule = styleScope.namedRules[ruleName];
			rule.index = this.domSS.insertRule( rule.toCssString());
		}

		// do the same for the unnamed rules
		for( let unnamedRule of styleScope.unnamedRules)
		{
			let rule = unnamedRule as Rule;
			rule.index = this.domSS.insertRule( rule.toCssString());
		}
	}



	/** Ensures that the <style> element is inserted into DOM */
	public static ensureDOM(): void
	{
		if (this.domSS)
			return;

		// create <style> element and insert it into <head>
		this.styleElm = document.createElement( "style");
		document.head.appendChild( this.styleElm);

		this.domSS = this.styleElm.sheet as CSSStyleSheet;
	}



	// Flag indicating whether to use optimaized names for style elements (class names, animation
	// names, etc.)
	private static useUniqueStyleNames: boolean = false;

	// Prefix to use when generating unique style names. If undefined, a standard prefix "n" will
	// be used.
	private static uniqueStyleNamesPrefix: string = undefined;

	// Next number to use when generating unique identifiers.
	private static nextUniqueID: number = 1;

	// Style element DOM object where all rules from all StyleScope objects are creaed.
	private static styleElm?: HTMLStyleElement;

	// DOM style sheet object inserted into the <head> element.
	private static domSS?: CSSStyleSheet;
}


