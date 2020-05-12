import {ICounterRule} from "./RuleTypes"
import {createNames, IRuleContainer, ITopLevelRuleContainer} from "./Rule";



/**
 * The CounterRule class describes a named counter definition. Use this rule to create
 * counter objects that can be used in counter-increment, counter-reset and counter-set style
 * properties. No CSS rule is created for counters - they are needed only to provide type-safe
 * counter definitions.
 */
export class CounterRule implements ICounterRule
{
	public constructor( nameOverride?: string | ICounterRule)
	{
		this.nameOverride = nameOverride;
	}



	// Processes the given rule.
	public process( container: IRuleContainer, owner: ITopLevelRuleContainer, ruleName: string | null): void
	{
		this.container = container;
		[this.name] = createNames( owner, ruleName, this.nameOverride);
	}



	// Creates a copy of the rule.
	public clone(): CounterRule
	{
		return new CounterRule( this.nameOverride);
	}



	// The valueToString function is used when the object is specified as a value of a style property.
	// We return the counter name.
    public valueToString(): string
    {
		return this.name;
    }



	/**
	 * Rule's name - this is a unique name that is assigned by the Mimcss infrastucture. This name
	 * doesn't have the prefix that is used when referring to classes (.), IDs (#) and custom CSS
	 * properties (--).
	 */
	public name: string;

	/** Name of the counter */
	public get counterName(): string { return this.name; }

	// Name or named object that should be used to create a name for this rule. If this property
	// is not defined, the name will be uniquely generated.
	private nameOverride?: string | ICounterRule;

	// Rule container to which this rule belongs and which hase the CSSStyleRule through which
	// the value of this custom variable can be changed.
	public container: IRuleContainer;
}



