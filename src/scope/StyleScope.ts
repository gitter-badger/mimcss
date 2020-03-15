import {IStyleScopeDefinitionClass, IStyleScope} from "./ScopeTypes"
import {RuleType} from "../rules/RuleTypes"
import {Rule} from "../rules/Rule"
import {TssManager} from "./TssManager"
import {RuleContainer, IRuleContainerOwner} from "../rules/RuleContainer"



/**
 * The StyleScope class represents a parsed form of a IStyleScopeDefinition-derived class.
 */
export class StyleScope<T = any> extends RuleContainer implements IStyleScope<T>, IRuleContainerOwner
{
	public constructor( defClass: IStyleScopeDefinitionClass<T>)
	{
		super( RuleType.SCOPE, defClass)

		this.definitionClass = defClass;

		this.activationRefCount = 0;
		this.importedScopes = [];

		this.processScope();
	}



	// Determines whether this rule is a real CSS rule that should be inserted under the <style>
	// element. For the majority of Rule-derived classes this is true; however, for some classes,
	// e.g. for the CustomVar class, this is not so.
	public get isRealCssRule(): boolean { return false; }



	// Creates a copy of the rule.
	public clone(): Rule { return null; }



	// Inserts this rule into the given parent rule or stylesheet.
	public insert( parent: CSSStyleSheet | CSSGroupingRule): void
	{
		super.insertRules( this.cssStyleSheet);
	}



	// Creates the style scope definition instance, parses its properties and creates names for
	// classes, IDs, animations.
	private processScope(): void
	{
		// check if the scope definition has already been processed
		if (this.isProcessed)
			return;

		// the container and the owner properties of the Rule base class point to the StyleScope
		// object itself
		super.process( this, this, null);

		this.isMultiplex = !!this.definitionClass.isMultiplex;

		// in DEBUG, each class has a name unless it was created as an anonymous class. In RELEASE,
		// (as well as in the anonymous cases), the name is undefined and we generate a unique
		// name for the style scope.
		this.name = this.definitionClass.name;
		if (!this.name)
			this.name = TssManager.generateUniqueName( "s");

		// process sub-rules rules.
		this.processRules();
	}



	/** Adds a style scope this style scope */
	public addImportedScope( scope: IStyleScope): void
	{
		this.importedScopes.push( scope);
	}



	/** Generates a name, which will be unique in this style scope */
	public getScopedRuleNamed( ruleName: string): string
	{
		// check whether we already have this rule name: if yes, return the already assigned
		// unique scoped name
		if (ruleName in this._allNames)
			return this._allNames[ruleName];
		else
			return this.generateScopedName( ruleName);
	}



	// Generates a name, which will be unique in this style scope
	public generateScopedName( ruleName: string): string
	{
		if (this.isMultiplex)
			return TssManager.generateUniqueName();
		else
			return TssManager.generateName( this.name, ruleName);
	}



	/** Inserts this style scope into DOM. */
	public activate(): void
	{
		// activate imported scopes
		for( let scope of this.importedScopes)
			scope.activate();

		if (++this.activationRefCount === 1 && !this.isActivated)
			TssManager.activate( this);
	}



	/** Removes this style scope from DOM - only works for multiplex style scopes. */
	public deactivate(): void
	{
		// guard from extra deactivate calls
		if (this.activationRefCount === 0)
			return;

		// deactivate imported scopes
		for( let scope of this.importedScopes)
			scope.deactivate();

		if (--this.activationRefCount === 0 && this.isActivated)
			TssManager.deactivate( this);
	}



	public setDOMInfo( styleSheet: CSSStyleSheet)
	{
		this.cssStyleSheet = styleSheet;
	}



	public clearDOMInfo()
	{
		this.cssStyleSheet = undefined;
	}



	// Helper properties
	private get isActivated(): boolean { return !!this.cssStyleSheet; }



	// Class that defined this style scope. This member is used for style scope derivation
	protected readonly definitionClass: IStyleScopeDefinitionClass<T>;

	// Name of the style sheet - used to create scoped names of style rules
	public name: string;

	// Flag indicating whether this style scope object owns the <style> element. This is true only
	// for multiplex styles scopes - those that can be creaed multiple times.
	public isMultiplex: boolean;

	// CSS style sheet
	public cssStyleSheet: CSSStyleSheet;

	// Reference count of activation requests.
	private activationRefCount: number;

	// List of imported style scope objects that will be activated when our scope is activated.
	private importedScopes: IStyleScope[];
}


