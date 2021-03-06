﻿import {
    Extended, IGenericProxy, CssNumber, CssMultiNumber, INumberBaseMath,
    CssPosition, MultiCssPosition, NumberBase, MultiNumberBase,
    CssLength, CssMultiLength, CssAngle, CssMultiAngle, CssTime, CssMultiTime,
    CssResolution, CssMultiResolution, CssFrequency, CssMultiFrequency,
    CssPercent, CssMultiPercent, ICssLengthMath,
    ICssAngleMath, ICssPercentMath, ICssFrequencyMath, ICssResolutionMath, ICssTimeMath,
    NumberType, LengthType, PercentType, AngleType, TimeType, ResolutionType, FrequencyType
} from "./UtilTypes"



///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Basics.
//
///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Converts dashe-case to camelCase, e.g. font-size to fontSize.
 * @param dash
 */
export function dashToCamel( dash: string): string
{
	if (!dash)
		return dash;

	return dash.replace( /-([a-zA-Z])/g, (x, $1) => $1.toUpperCase());
}



/**
 * Converts camelCase to dash-case, e.g. fontSize to font-size.
 * @param camel
 */
export function camelToDash( camel: string): string
{
  return camel.replace( /([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}



/**
 * The IValueConvertOptions interface defines optional functions that convertvalues of differnt
 * types to strings.
 */
export interface IValueConvertOptions
{
    // Called if value is null or undefined
    fromNull?: ( val: null | undefined) => string;

    // Called if value is a string. This allows transforming one string to another.
    fromString?: ( val: string) => string;

    // Called if value is a boolean
    fromBool?: (val: boolean) => string;

    // Called if value is a number
    fromNumber?: (val: number) => string;

    // Called if value is an array
    fromArray?: (val: any[]) => string;

    // Called if value is an object
    fromObj?: (val: any) => string;

    // Called if type-specific function is not defined
    fromAny?: (val: any) => string;

    // Called to convert array items if fromArray is not defined
    arrFunc?: (v: any) => string;

    // Separator for array items - used only if fromArray is not defined
    arrSep?: string;

    // If value is a function, these are arguments to pass when invoking it
    funcArgs?: any[];
}



/**
 * Converts a value of an arbitrary type to a single string. The optional options parameter
 * can define how specific types are converted.
 */
export function val2str( val: any, options?: IValueConvertOptions): string
{
   if (!options)
    {
        // standard processing:
        // - null/undefined become empty string.
        // - call valueToString (proxy objects) if exist.
        // - function: call without parameters.
        // - everything else: call toString().
        if (val == null)
            return "";
        else if (typeof val === "string")
            return val;
        else if (Array.isArray(val))
            return arr2str( val);
        else if (typeof val === "function")
            return val();
        else if (typeof val.valueToString === "function")
            return val.valueToString();
        else
            return val.toString();
    }
    else
    {
        // processing with options. For all types except null and string, if the type-specific
        // function is not defined, call fromAny if defined.
        if (val == null)
            return options.fromNull ? options.fromNull( val) : "";
        else if (typeof val === "string")
            return options.fromString ? options.fromString( val) : val;
        else if (typeof val === "number")
            return options.fromNumber ? options.fromNumber( val) : options.fromAny ? options.fromAny( val) : val.toString();
        else if (typeof val === "function")
            return val2str( options.funcArgs ? val( ...options.funcArgs) : val());
        else if (Array.isArray(val))
        {
            if (options.fromArray)
                return options.fromArray( val);
            else
            {
                let separator = options.arrSep != null ? options.arrSep : " ";
                return arr2str( val, options.arrFunc || options.fromAny || undefined, separator);
            }
        }
        else if (typeof val === "object")
        {
            if (typeof val.valueToString === "function")
                return val.valueToString();
            else if (options.fromObj)
                return options.fromObj( val);
            else if (options.fromAny)
                return options.fromAny( val);
            else
                return val.toString();
        }
        else if (typeof val === "boolean")
            return options.fromBool ? options.fromBool( val) : options.fromAny ? options.fromAny( val) : val.toString();
        else if (options.fromAny)
            return options.fromAny( val);
        else
            return val.toString();
    }
}



/**
 * Converts an array of the given typeto a single string using the given separator.
 * Elements of the array are converted to strings using the given function.
 */
export function arr2str( val: any[], func?: (v) => string, separator: string = " "): string
{
    return !val || val.length === 0
        ? ""
        : val.filter( x => x != null).map( y => func ? func(y) : val2str( y)).join( separator);
}




/**
 * The templateStringToString is a tag function helper that converts the template string with
 * parameters to a string using the given function to convert parameters.
 */
export function templateStringToString( parts: TemplateStringsArray, params: any[],
    convertFunc?: ( v: any) => string): string
{
    // number of parameters is always 1 less than the number of string parts
    let paramsLen = params.length;
    if (paramsLen === 0)
        return parts[0];

    let s = "";
    for( let i = 0; i < paramsLen; i++)
        s += parts[i] + (convertFunc ? convertFunc( params[i]) : val2str( params[i]));

    // add the last part
    return s + parts[paramsLen];
}



///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Number
//
///////////////////////////////////////////////////////////////////////////////////////////////////

/** Type of functions that convert a number to a string */
type ConvertNumberFuncType = (n: number) => string;



/**
 * Converts a single numeric value to a CSS string optionally appending units that can be different
 * for integer and floating point numbers.
 * @param n Number to convert to string representation.
 * @param intUnit Units to append if the number is integer.
 * @param floatUnit Units to append if the number is floating point.
 */
function numberToString( n: number, intUnit: string = "", floatUint: string = ""): string
{
    return Number.isInteger(n) ?  n + intUnit : n + floatUint;
}

/**
 * Converts time style value to the CSS string.
 * @param val Number as a style property type.
 * @param convertFunc Function that converts a number to a string.
 */
function numberBaseToString<T extends string>( val: Extended<NumberBase<T>>,
    convertFunc?: ConvertNumberFuncType): string
{
    return val2str( val, { fromNumber: convertFunc});
}

/**
 * Converts single CssNumber or array of CssNumber objects to the CSS string.
 * @param val Single- or multi-number style value.
 * @param convertFunc Function that converts a number to a string.
 * @param separator String to use to separate multiple values.
 */
function multiStyleToString<T extends string>( val: Extended<MultiNumberBase<T>>,
                convertFunc?: ConvertNumberFuncType, separator: string = " "): string
{
    return val2str( val, {
        fromNumber: convertFunc,
        arrFunc: v => numberBaseToString( v, convertFunc),
        arrSep: separator
    });
}



/**
 * The mathFunc function returns one of the mathematic CSS function that accepts one or more
 * parameters whose type is derived from NumberBase<T>.
 */
function mathFunc<T extends string>( name: string, params: Extended<NumberBase<T>>[],
    convertFunc?: ConvertNumberFuncType): string
{
    return `${name}(${multiStyleToString( params, convertFunc, ",")})`;
}



/**
 * The calcFunc function returns the string representation of the calc() CSS function.
 */
function calcFunc<T extends string>( parts: TemplateStringsArray, params: Extended<NumberBase<T>>[],
    convertFunc?: ConvertNumberFuncType): string
{
    return `calc(${templateStringToString( parts, params, (v: any) => numberBaseToString( v, convertFunc))})`;
}



/**
 * The NummberBaseMath class contains methods that implement CSS mathematic functions on the
 * numeric CSS types. When arguments for these functions are of the number JavaScript type they
 * are converted to strings by calling a function specified in the constructor.
 */
class NumberBaseMath<T extends string> implements INumberBaseMath<T>
{
    constructor( protected convertFunc: ConvertNumberFuncType)
    {
    }

    public numberToString = (n: number): string =>
    {
        return this.convertFunc( n);
    }

    public styleToString = (val: Extended<NumberBase<T>>): string =>
    {
        return numberBaseToString( val, this.convertFunc);
    }

    public multiStyleToString = (val: Extended<MultiNumberBase<T>>, separator: string = " "): string =>
    {
        return multiStyleToString( val, this.convertFunc, separator);
    }

    public min( ...params: Extended<NumberBase<T>>[]): IGenericProxy<T>
    {
        return () => mathFunc( "min", params, this.convertFunc);
    }

    public max( ...params: Extended<NumberBase<T>>[]): IGenericProxy<T>
    {
        return () => mathFunc( "max", params, this.convertFunc);
    }

    public clamp( min: Extended<NumberBase<T>>, pref: Extended<NumberBase<T>>, max: Extended<NumberBase<T>>): IGenericProxy<T>
    {
        return () => mathFunc( "clamp", [min, pref, max], this.convertFunc);
    }

    public calc( formulaParts: TemplateStringsArray, ...params: Extended<NumberBase<T>>[]): IGenericProxy<T>
    {
        return () => calcFunc( formulaParts, params, this.convertFunc);
    }
}



/**
 * The INumberMathClass interface represents a "static" side of classes derived from the
 * NumberMath class.
 */
export interface INumberBaseMathClass<T extends string>
{
    convertFunc( n: number): string;

    styleToString( val: Extended<NumberBase<T>>): string;

    multiStyleToString( val: Extended<MultiNumberBase<T>>, separator: string): string;

    new(): INumberBaseMath<T>;
}




///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Unitless number
//
///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The CssNumberMath class contains methods that implement CSS mathematic functions on the
 * <number> CSS types.
 */
export class CssNumberMath extends NumberBaseMath<NumberType>
{
    public static convertFunc( n: number): string { return n.toString(); }

    public static styleToString( val: Extended<CssNumber>): string
        { return numberBaseToString( val, CssNumberMath.convertFunc); }

    public static multiStyleToString( val: Extended<CssMultiNumber>, separator: string): string
        { return multiStyleToString( val, CssNumberMath.convertFunc, separator); }

    constructor() { super( CssNumberMath.convertFunc) }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Percent
//
///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The CssPercentMath class contains methods that implement CSS mathematic functions on the
 * <percent> CSS types.
 */
export class CssPercentMath extends NumberBaseMath<PercentType> implements ICssPercentMath
{
    public static convertFunc( n: number): string
        { return (Number.isInteger(n) ? n : Math.round(n * 100)) + "%"; }

    public static styleToString( val: Extended<CssPercent>): string
        { return numberBaseToString( val, CssPercentMath.convertFunc); }

    public static multiStyleToString( val: Extended<CssMultiPercent>, separator: string): string
        { return multiStyleToString( val, CssPercentMath.convertFunc, separator); }

    constructor() { super( CssPercentMath.convertFunc) }
}

/**
 * Converts the given number to string using the following rules:
 * - if the number is between -1 and 1 (non inclusive), multiplies the number and appends "%"
 * - otherwise, converts the number to string without appending any utints.
 */
export function unitlessOrPercentToString( n: number): string
{
    return n >= 1 || n <= -1 ? n.toString() : Math.round(n * 100) + "%";
}


///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Length
//
///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The CssLengthMath class contains methods that implement CSS mathematic functions on the
 * <length> CSS types.
 */
export class CssLengthMath extends NumberBaseMath<LengthType> implements ICssLengthMath
{
    public static convertFunc( n: number): string { return numberToString( n, "px", "em"); }

    public static styleToString( val: Extended<CssLength>): string
        { return numberBaseToString( val, CssLengthMath.convertFunc); }

    public static multiStyleToString( val: Extended<CssMultiLength>, separator: string): string
        { return multiStyleToString( val, CssLengthMath.convertFunc, separator); }

    constructor() { super( CssLengthMath.convertFunc) }

    public minmax( min: Extended<CssLength>, max: Extended<CssLength>): IGenericProxy<LengthType>
    {
        return () => mathFunc( "minmax", [min, max], CssLengthMath.convertFunc);
    }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Angle
//
///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The CssAngleMath class contains methods that implement CSS mathematic functions on the
 * <angle> CSS types.
 */
export class CssAngleMath extends NumberBaseMath<AngleType> implements ICssAngleMath
{
    public static convertFunc( n: number): string { return numberToString( n, "deg", "turn"); }

    public static styleToString( val: Extended<CssAngle>): string
        { return numberBaseToString( val, CssAngleMath.convertFunc); }

    public static multiStyleToString( val: Extended<CssMultiAngle>, separator: string): string
        { return multiStyleToString( val, CssAngleMath.convertFunc, separator); }

    constructor() { super( CssAngleMath.convertFunc) }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Time
//
///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The CssTimeMath class contains methods that implement CSS mathematic functions on the
 * <time> CSS types.
 */
export class CssTimeMath extends NumberBaseMath<TimeType> implements ICssTimeMath
{
    public static convertFunc( n: number): string { return numberToString( n, "ms", "s"); }

    public static styleToString( val: Extended<CssTime>): string
        { return numberBaseToString( val, CssTimeMath.convertFunc); }

    public static multiStyleToString( val: Extended<CssMultiTime>, separator: string): string
        { return multiStyleToString( val, CssTimeMath.convertFunc, separator); }

    constructor() { super( CssTimeMath.convertFunc) }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Resolution
//
///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The CssResolutionMath class contains methods that implement CSS mathematic functions on the
 * <resolution> CSS types.
 */
export class CssResolutionMath extends NumberBaseMath<ResolutionType> implements ICssResolutionMath
{
    public static convertFunc( n: number): string { return numberToString( n, "dpi", "x"); }

    public static styleToString( val: Extended<CssResolution>): string
        { return numberBaseToString( val, CssResolutionMath.convertFunc); }

    public static multiStyleToString( val: Extended<CssMultiResolution>, separator: string): string
        { return multiStyleToString( val, CssResolutionMath.convertFunc, separator); }

    constructor() { super( CssResolutionMath.convertFunc) }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Frequency
//
///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The CssFrequencyMath class contains methods that implement CSS mathematic functions on the
 * <frequence> CSS types.
 */
export class CssFrequencyMath extends NumberBaseMath<FrequencyType> implements ICssFrequencyMath
{
    public static convertFunc( n: number): string { return numberToString( n, "Hz", "kHz"); }

    public static styleToString( val: Extended<CssFrequency>): string
        { return numberBaseToString( val, CssFrequencyMath.convertFunc); }

    public static multiStyleToString( val: Extended<CssMultiFrequency>, separator: string): string
        { return multiStyleToString( val, CssFrequencyMath.convertFunc, separator); }

    constructor() { super( CssFrequencyMath.convertFunc) }
}



///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Position
//
///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Converts single position style value to the CSS string.
 */
export function pos2str( val: Extended<CssPosition>): string
{
    return val2str( val, {
        fromNull: v => "",
        fromNumber: CssLengthMath.styleToString,
        fromArray: v => CssLengthMath.multiStyleToString( v, " ")
    });
}

/**
 * Converts multi-position style value to the CSS string.
 */
export function multiPos2str( val: Extended<MultiCssPosition>, separator: string): string
{
    return val2str( val, {
        arrFunc: pos2str,
        arrSep: separator
    });
}



