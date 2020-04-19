import {IStyleDefinitionClass, StyleDefinition, IGroupRule} from "./RuleTypes"
import {RuleContainer, processStyleDefinitionClass, getContainerFromDefinition} from "./RuleContainer"
import {ITopLevelRuleContainer, Rule} from "./Rule"



/**
 * The GroupRule class serves as a base class for all grouping CSS rules.
 */
export abstract class GroupRule<T extends StyleDefinition> extends Rule implements IGroupRule<T>
{
	public constructor( definitionClass: IStyleDefinitionClass<T>)
	{
		super();
		this.definitionClass = definitionClass;
	}



	// Processes the given rule.
	public process( owner: ITopLevelRuleContainer, ruleName: string)
	{
		super.process( owner, ruleName);

		this.definition = processStyleDefinitionClass( this.definitionClass, owner.getDefinitionInstance());
		this.ruleContainer = getContainerFromDefinition( this.definition);
	}



	// Inserts this rule into the given parent rule or stylesheet.
	public insert( parent: CSSStyleSheet | CSSGroupingRule): void
	{
		let selector = this.getGroupSelectorText();
		if (!selector)
			return;

		this.cssRule = Rule.addRuleToDOM( `${selector} {}`, parent) as CSSSupportsRule;

		// insert sub-rules
		if (this.cssRule)
			this.ruleContainer.insertRules( this.cssRule);
	}



	// Returns the selector string of this grouping rule.
	protected abstract getGroupSelectorText(): string;



	// Clers the CSS rule object.
	public clear(): void
	{
		super.clear();

		// clear sub-rules
		this.ruleContainer.clearRules();
	}



	// Style definition class that defines rules under this grouping rule.
	protected definitionClass: IStyleDefinitionClass;

	// Style definition instance.
	protected definition: StyleDefinition;

	// Rule container for the definition instance.
	protected ruleContainer: RuleContainer;

	// Instance of the style definition class defining the rules under this grouping rule
	public get rules(): T { return this.definition as T; }

	/** SOM supports rule */
	public cssRule: CSSGroupingRule;
}



