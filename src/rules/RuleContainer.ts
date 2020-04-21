import {StyleDefinition, IStyleDefinitionClass} from "./RuleTypes"
import {Rule, ITopLevelRuleContainer} from "./Rule"
import {VarRule} from "./VarRule"
import {ImportRule} from "./ImportRule"
import {NamespaceRule} from "./NamespaceRule"



// Define symbols that are used for keeping important information on the style definition
// instances that we don't want to be visible to developers.

/** Property on the style definition class pointing to the singlton instance. */
const symInstance = Symbol("definition");

/**
 * Property on the style definition instance pointing to the RuleContainer object that is
 * responsible for processing rules.
 */
const symRuleContainer = Symbol("ruleContainer");



/**
 * The RuleContainer class is a shadow structure that accompanies every processed style definition
 * object. Since StyleDefinition class is an exported class visible to developers, we don't want
 * to have a lot of functionality in it. The RuleContainer object is linked to the StyleDefinition
 * object via the [symRuleContainer] symbol. It contains all the functionality for parsing rule
 * definitions, name assignment and activation/deactivation.
 */
class RuleContainer implements ITopLevelRuleContainer
{
	constructor( instance: StyleDefinition, name: string)
	{
		this.instance = instance;
		this.name = name;
		this.definitionClass = instance.constructor as IStyleDefinitionClass;
		this.owner = instance.owner;

		this.activationRefCount = 0;
		this.domStyleElm = null;

		this.process();
	}



	// Processes the properties of the style definition instance. This creates names for classes,
	// IDs, animations and custom variables.
	private process(): void
	{
		// put reference to this container in the symbol property of the definition instance.
		this.instance[symRuleContainer] = this;

		// if the owner taken from the instance is null (that is this is a top-level definition),
		// change our owner property to point to the instance itself
		if (!this.owner)
		{
			this.owner = this.instance;
			this.topLevelContainer = this;
		}
		else
			this.topLevelContainer = this.owner[symRuleContainer];

		// if our container is not the top-level container, prefix our name with the upper one
		if (!this.isTopLevel)
			this.name = `${this.topLevelContainer.name}_${this.name}`;

		this.imports = [];
		this.namespaces = [];
		this.vars = [];
		this.refs = [];
		this.otherRules = [];

		// loop over the properties of the definition object and process them.
		for( let propName in this.instance)
			this.processProperty( propName, this.instance[propName]);
	}



	// Processes the properties of the style definition instance. This creates names for classes,
	// IDs, animations and custom variables.
	private processProperty( propName: string, propVal: any): void
	{
		if (propVal instanceof StyleDefinition)
			this.processReference( propVal)
		else if (propVal instanceof VarRule)
			this.processVarRule( propName, propVal)
		else if (propVal instanceof Rule)
			this.processRule( propName, propVal);
		else if (Array.isArray(propVal))
			this.processArray( propVal)
	}



	// Processes reference to another style definition created by the $use function.
	private processReference( ref: StyleDefinition): void
	{
		this.refs.push( ref);
	}



	// Processes custom CSS property.
	private processVarRule( propName: string, varObj: VarRule): void
	{
		// if the object is already assigned to a stylesheet, we create a clone of the
		// rule and assign it to our stylesheet.
		if (varObj.container)
			varObj = varObj.clone();

		varObj.process( this, this.topLevelContainer, propName);
		this.vars.push( varObj);
	}



	// Processes the given Rule-derived object.
	private processRule( propName: string, rule: Rule): void
	{
		// if the rule object is already processed as part of another instance, we create a clone
		// of the rule and set it to our instance.
		if (rule.owner)
			this.instance[propName] = rule = rule.clone();

		rule.process( this.topLevelContainer, propName);

		if (rule instanceof ImportRule)
			this.imports.push( rule);
		else if (rule instanceof NamespaceRule)
			this.namespaces.push( rule);
		else
			this.otherRules.push( rule);
	}



	// Processes rules from the given array.
	private processArray( propVals: any[]): void
	{
		if (!propVals || propVals.length === 0)
			return;

		// loop over the properties of the definition object and process those that are rules.
		for( let propVal of propVals)
			this.processProperty( null, propVal);
	}



	/** Returns the instance of the stylesheet definition class */
	public getDefinitionInstance(): StyleDefinition
	{
		return this.instance;
	}



	// Sets the given value for the custom CSS roperty with the given name.
	public setCustomVarValue( name: string, value: string, important?: boolean): void
	{
		if (this.cssCustomVarStyleRule)
			this.cssCustomVarStyleRule.style.setProperty( name, value, important ? "!important" : null);
	}



	/**
	 * Generates a globally unique CSS name for the given rule name unless this rule name already
	 * exists either in a base class or in the chain of parent grouping rules.
	 */
	public getScopedRuleName( ruleName: string): string
	{
		// if rule name was not specified, generate it uniquely; otherwise, check whether we
		// already have this rule name: if yes, return the already assigned name. If we didn't
		// find the name, try to find it in the base classes); if not found there, generate it
		// using this container's name and the rule name (note that depending on the mode, both
		// can be generated uniquely).
		if (!ruleName)
			return generateUniqueName();
		else if (ruleName in this.instance && "name" in this.instance[ruleName])
			return this.instance[ruleName].name;
		else
		{
			// find out if there is a rule with this name defined in a stylesheet instance created for
			// a class from the prototype chain of the style definition class.
			let existingName = findNameForRuleInPrototypeChain( this.definitionClass, ruleName);
			return existingName ? existingName : generateName( this.name, ruleName);
		}
	}



	/** Inserts all rules defined in this container to either the style sheet or grouping rule. */
	public insertRules( parent: CSSStyleSheet | CSSGroupingRule): void
	{
		// activate referenced style definitions
		for( let ref of this.refs)
			ref[symRuleContainer].activate();

		// insert @import and @namespace rules as they must be before other rules. If the parent is a grouping
		// rule, don't insert @import and @namespace rules at all
		if (parent instanceof CSSStyleSheet)
		{
			this.imports && this.imports.forEach( rule => rule.insert( parent));
			this.namespaces && this.namespaces.forEach( rule => rule.insert( parent));
		}

		// isert our custom variables in a ":root" rule
		if (this.vars.length > 0)
		{
			this.cssCustomVarStyleRule = Rule.addRuleToDOM( `:root {${this.vars.map( varObj =>
				varObj.toCssString()).join(";")}}`, parent) as CSSStyleRule;
		}

		// insert all other rules
		this.otherRules.forEach( rule => rule.insert( parent));
	}



	/** Clears all CSS rule objects defined in this container. */
	public clearRules(): void
	{
		if (this.owner === this.instance)
		{
			this.imports && this.imports.forEach( rule => rule.clear());
			this.namespaces && this.namespaces.forEach( rule => rule.clear());
		}

		this.cssCustomVarStyleRule = null;

		this.otherRules.forEach( rule => rule.clear());

		// deactivate imported stylesheets
		for( let ref of this.refs)
			ref[symRuleContainer].deactivate();
	}



	/** Inserts this stylesheet into DOM. */
	public activate(): void
	{
		if (++this.activationRefCount === 1)
		{
			// only the top-level style defiition creates the `<style>` element
			if (this.isTopLevel)
			{
				this.domStyleElm = document.createElement( "style");
				this.domStyleElm.id = this.name;
				document.head.appendChild( this.domStyleElm);
			}
			else
				this.domStyleElm = this.topLevelContainer.domStyleElm;

			this.insertRules( this.domStyleElm.sheet as CSSStyleSheet);
		}
	}



	/** Removes this stylesheet from DOM. */
	public deactivate(): void
	{
		// guard from extra deactivate calls
		if (this.activationRefCount === 0)
			return;

		if (--this.activationRefCount === 0)
		{
			this.clearRules();

			// only the top-level style defiition creates the `<style>` element
			if (this.isTopLevel)
				this.domStyleElm.remove();

			this.domStyleElm = null;
		}
	}



	// Flag indicating whether this container is for the top-level style definition.
	private get isTopLevel(): boolean { return this.owner === null || this.owner === this.instance }



	// Instance of the style definition class that this container processed.
	public instance: StyleDefinition;

	// Style definition class that this container creates an instance of.
	private definitionClass: IStyleDefinitionClass

	// Name of this container, which, depending on the mode, is either taken from the class
	// definition name or generated uniquely.
	private name: string

	// Instance of the top-level style definition class in the chain of grouping rules that
	// lead to this rule container. For top-level style definitions, this points to the same
	// singleton definition instance as the 'definition' property.
	private owner: StyleDefinition;

	// Rule container that belongs to the owner style defintion. If our container is top-level,
	// this property points to `this`.
	private topLevelContainer: RuleContainer;

	// List of references to other style definitions creaed via the $use function.
	private refs: StyleDefinition[];

	// List of @import rules
	private imports: ImportRule[];

	// List of @namespace rules
	private namespaces: NamespaceRule[];

	// List of custom variable rules.
	private vars: VarRule[];

	// List of rules that are not imports, namespaces, custom vars, references or grouping rules.
	private otherRules: Rule[];

	// ":root" rule where all custom CSS properties defined in this container are defined.
	private cssCustomVarStyleRule: CSSStyleRule;

	// Reference count of activation requests.
	private activationRefCount: number;

	// DOM style elemnt
	public domStyleElm: HTMLStyleElement;
}



///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Name generation
//
///////////////////////////////////////////////////////////////////////////////////////////////////

// Flag indicating whether to use optimaized names for style elements (class names, animation
// names, etc.)
let useUniqueStyleNames: boolean = false;

// Prefix to use when generating unique style names. If undefined, a standard prefix "n" will
// be used.
let uniqueStyleNamesPrefix: string = "n";

// Next number to use when generating unique identifiers.
let nextUniqueID: number = 1;



/**
 * Generates name to use for the given rule from the given style sheet.
 */
function generateName( sheetName: string, ruleName: string): string
{
	return useUniqueStyleNames
		? generateUniqueName( uniqueStyleNamesPrefix)
		: `${sheetName}_${ruleName}`;
}



/**
 * Generates a unique name, which can be used either for style element's ID or or class,
 * identifier or animation name. Names are generated using a simple incrementing number.
 */
function generateUniqueName( prefix?: string): string
{
	return (prefix ? prefix : uniqueStyleNamesPrefix) + nextUniqueID++;
}



// Looks up a property with the given name in the prototype chain of the given style definition
// class. If found and if the property is a rule, then returns the name assigned for it.
function findNameForRuleInPrototypeChain( definitionClass: IStyleDefinitionClass, ruleName: string)
{
	if (!definitionClass)
		return null;

	// loop over prototypes
	let baseClass = definitionClass;
	while( (baseClass = Object.getPrototypeOf( baseClass)) !== StyleDefinition)
	{
		// check if the base class already has an associated instance; if yes, check whether
		// it hase a property with the given rule name. If yes, then use this rule's already
		// generated name (if exists).
		if (baseClass.hasOwnProperty(symInstance))
		{
			let baseInst = baseClass[symInstance];
			if (baseInst && ruleName in baseInst && "name" in baseInst[ruleName])
				return baseInst[ruleName].name;
		}
	}

	return null;
}



///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Processing functions
//
///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Processes the given style definition class by creating its instance and associating a
 * rule container object with it. The class will be associated with the instance using the
 * Symbol property. The owner parameter is a reference to the top-level style defiition
 * object or null if the given class is itself a top-level class (that is, is not a class
 * that defines rules within nested grouping rules).
 * @param definitionClass 
 * @param owner 
 */
function processClass( definitionClass: IStyleDefinitionClass,
	owner: StyleDefinition): StyleDefinition
{
	// call the 'use' function for all the base classes so that rule names are generated. We
	// don't activate styles for these clases because derived classes will have all the
	// rules from all the base classes as their own and so these rules will be activated as
	// part of the derived class.
	let baseClass = definitionClass;
	while( (baseClass = Object.getPrototypeOf( baseClass)) !== StyleDefinition)
		processClass( baseClass, owner);

	try
	{
		// create the instance of the definition class
		let instance = new definitionClass( owner);

		// get the name for our container
		let name = useUniqueStyleNames || !definitionClass.name
			? generateUniqueName()
			: definitionClass.name;

		new RuleContainer( instance, name);
		definitionClass[symInstance] = instance;
		return instance;
	}
	catch( err)
	{
		console.error( `Error instantiating Style Definition Class '${definitionClass.name}'`, err);
		return;
	}
}



/**
 * Processes the given stylesheet definition class or instance and assigns names to its rules.
 * If the parameter is a style definition class we check whether there is an instance already
 * created for it as a class will have only a single associated instane no matter how many times
 * this function is called.
 * 
 * If the parameter is an object (an instance of the StyleDefinition class) then we check whether
 * it has already been processed. If yes we just return it back; if no, we assign new unique names
 * to its rules.
 */
export function processInstanceOrClass( instanceOrClass: StyleDefinition | IStyleDefinitionClass,
	owner: StyleDefinition): StyleDefinition
{
	if (!instanceOrClass)
		return null;

	if (instanceOrClass instanceof StyleDefinition)
	{
		// check whether this definition instance has already been processed
		let ruleContainer = instanceOrClass[symRuleContainer] as RuleContainer;
		if (!ruleContainer)
		{
			// get the name for our container
			let name = generateUniqueName();;
			if (!useUniqueStyleNames)
			{
				let definitionClass = instanceOrClass.constructor;
				if (definitionClass.name)
					name += "_" + definitionClass.name;
			}

			new RuleContainer( instanceOrClass, name);
		}

		return instanceOrClass;
	}
	else
	{
		return instanceOrClass.hasOwnProperty(symInstance)
			? instanceOrClass[symInstance]
			: processClass( instanceOrClass, owner);
	}
}



/**
 * Returns rule container object associated with the given style definition object.
 */
export function getContainerFromDefinition( definition: StyleDefinition): RuleContainer
{
	return definition ? definition[symRuleContainer] : null;
}



/**
 * Activates the given style definition and inserts all its rules into DOM. If the input object is
 * not a style definition but a style definition class, obtain style definition by calling the $use
 * function. Note that each style definition object maintains a reference counter of how many times
 * it was activated and deactivated. The rules are inserted to DOM only when this reference counter
 * goes up to 1.
 */
export function activate<T extends StyleDefinition>( instanceOrClass: T | IStyleDefinitionClass<T>): T
{
	let instance = processInstanceOrClass( instanceOrClass, null) as T;
	if (!instance)
		return null;

	let ruleContainer = instance[symRuleContainer] as RuleContainer;
	ruleContainer.activate();
	return instance;
}



/**
 * Deactivates the given style definition by removing its rules from DOM. Note that each style
 * definition object maintains a reference counter of how many times it was activated and
 * deactivated. The rules are removed from DOM only when this reference counter goes down to 0.
 */
export function deactivate( definition: StyleDefinition): void
{
	if (!definition)
		return;

	let ruleContainer = definition[symRuleContainer] as RuleContainer;
	if (ruleContainer)
		ruleContainer.deactivate();
}



/**
 * Sets the flag indicating whether to use optimized (short) rule names. If yes, the names
 * will be created by appending a unique number to the given prefix. If the prefix is not
 * specified, the standard prefix "n" will be used.
 * @param enable
 * @param prefix
 */
export function enableOptimizedStyleNames( enable: boolean, prefix?: string): void
{
	useUniqueStyleNames = enable;
	uniqueStyleNamesPrefix = prefix ? prefix : "n";
}



