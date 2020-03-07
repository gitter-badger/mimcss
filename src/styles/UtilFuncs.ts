﻿import * as UtilTypes from "./UtilTypes"



/**
 * Converts names with dashes into names in camelCase, where every character after a dash is
 * capitalized and dashes are removed.
 * @param dash
 */
export function dashToCamel( dash: string): string
{
	if (!dash)
		return dash;

	return dash.replace( /-([a-zA-Z])/g, (x, $1) => $1.toUpperCase());
}



/**
 * Converts camelCase to dash-case.
 * @param camel
 */
export function camelToDash( camel: string): string
{
  return camel.replace( /([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
}



/**
 * Generic function that converts an array of the given typeto a single string using the given separator.
 * Elements of the array are converted to strings using the given function.
 * @param val Array of time values
 */
export function arrayToCssString<T>( val: T[], func: (v: T) => string, separator: string = ","): string
{
    let s = "";
    for( let v of val)
    {
        let item = func( v);
        if (item != null)
        {
            if (s.length > 0)
                s += separator;

            s += item;
        }
    }

    return s;
}



/**
 * Converts array of string values to a single string using the given separator.
 * @param val Array of string values
 */
export function stringArrayToCssString( val: (string | UtilTypes.Base_StyleType)[], separator: string = ","): string
{
    let s = "";
    for( let v of val)
    {
        if (v != null)
        {
            if (s.length > 0)
                s += separator;

            if (typeof v === "string")
                s += v;
            else if (val instanceof UtilTypes.StringProxy)
                s += v.toString();
        }
    }

    return s;
}



// /**
//  * Converts a value that can be either a string or an array of strings to a single string using
//  * the given separator.
//  * @param val String value or array of string values
//  */
// export function stringOrStringArrayToCssString( val: string[] | string, separator: string = ","): string
// {
//     if (typeof val === "string")
//         return val;
//     else
//         return stringArrayToCssString( val, separator);
// }



/**
 * Converts single number style value to the CSS string.
 * @param val Single number or string value
 */
export function singleNumberToCssString( val: UtilTypes.SingleNumber_StyleType): string
{
    if (typeof val === "string")
        return val;
    else if (val instanceof UtilTypes.StringProxy)
        return val.toString();
    else
        return val.toString();
}

/**
 * Converts multi-part number style value to the CSS string.
 * @param val Animation delay value
 */
export function multiNumberToCssString( val: UtilTypes.MultiNumber_StyleType): string
{
    if (typeof val === "string")
        return val;
    else if (typeof val === "number")
        return val.toString();
    else if (val instanceof UtilTypes.StringProxy)
        return val.toString();
    else
        return arrayToCssString( val, singleNumberToCssString);
}



/**
 * Converts the given number to a percent string. Numbers between -1 and 1 are multiplyed by 100.
 */
export function percentToCssString( n: number): string
{
    return (Number.isInteger(n) ? n : n > -1.0 && n < 1.0 ? Math.round( n * 100) : Math.round(n)) + "%";
}



/**
 * Converts length value from the numeric representation to the CSS string. Integer
 * values are treated as pixels while floating numbers are treated as percents from 0.0 to 1.0.
 * @param val Length as a number
 */
export function lengthToCssString( n: number, units?: string): string
{
    return n === 0 ? "0" : units ? n + units : Number.isInteger( n) ?  n + "px" : percentToCssString(n);
}

/**
 * Converts length style value to the CSS time string.
 * @param val Length as a style property type
 */
export function singleLengthToCssString( val: UtilTypes.SingleLength_StyleType): string
{
    if (typeof val === "string")
        return val;
    else if (val instanceof UtilTypes.StringProxy)
        return val.toString();
    else
	    return lengthToCssString( val);
}

/**
 * Converts multi-part length or percentage style property to the CSS string.
 * @param val Array of length style values
 */
export function multiLengthToCssString( val: UtilTypes.MultiLength_StyleType): string
{
    if (typeof val === "string")
        return val;
    else if (Array.isArray(val))
        return arrayToCssString( val, singleLengthToCssString);
    else
        return singleLengthToCssString( val);
}



/**
 * Converts size style value to the CSS string.
 * @param val Size as a style property type
 */
export function singleSizeToCssString( val: UtilTypes.SingleSize_StyleType): string
{
    if (typeof val === "string")
        return val;
    else if (val instanceof UtilTypes.StringProxy)
        return val.toString();
    else if (typeof val === "object")
        return objectToCssString( val, false, ["w", singleLengthToCssString], ["h", singleLengthToCssString]);
    // else if (Array.isArray( val))
    //     return lengthToCssString( val[0]) + " " + lengthToCssString( val[1]);
    else
	    return singleLengthToCssString( val);
}

/**
 * Converts multi-part size style property to the CSS string.
 * @param val Array of length style values
 */
export function multiSizeToCssString( val: UtilTypes.MultiSize_StyleType): string
{
    if (typeof val === "string")
        return val;
    else if (val instanceof UtilTypes.StringProxy)
        return val.toString();
    else if (Array.isArray(val))
        return arrayToCssString( val, singleSizeToCssString);
    else
        return singleSizeToCssString( val);
}



/**
 * Converts angle value from the numeric representation to the CSS string. Integer
 * values are treated as degrees while floating numbers are treated as radians.
 * @param val Angle as a number
 */
export function angleToCssString( n: number, units?: string): string
{
    return n === 0 ? "0" : units ? n + units : Number.isInteger(n) ?  n + "deg" : n + "rad";
}

/**
 * Converts length style value to the CSS time string.
 * @param val Length as a style property type
 */
export function singleAngleToCssString( val: UtilTypes.SingleAngle_StyleType): string
{
    if (typeof val === "string")
        return val;
    else if (val instanceof UtilTypes.StringProxy)
        return val.toString();
    else
	    return angleToCssString( val);
}



/**
 * Converts resolution value from the numeric representation to the CSS string. Integer
 * values are treated as DPI while floating numbers are treated as DPCM.
 * @param val Resolution as a number
 */
export function resolutionToCssString( n: number, units?: string): string
{
    return n === 0 ? "0" : units ? n + units : Number.isInteger(n) ?  n + "dpi" : n + "dpcm";
}



/**
 * Converts single position style value to the CSS time string.
 * @param val Size as a style property type
 */
export function singlePositionToCssString( val: UtilTypes.SinglePosition_StyleType): string
{
    if (typeof val === "string")
        return val;
    else if (val instanceof UtilTypes.StringProxy)
        return val.toString();
    else if (typeof val === "object")
    {
        if ("xedge" in val)
            return objectToCssString( val, false, "xedge", ["x", singleLengthToCssString], "yedge", ["y", singleLengthToCssString]);
        else
            return objectToCssString( val, false, ["x", singleLengthToCssString], ["y", singleLengthToCssString]);
    }
    else
	    return singleLengthToCssString( val);
}

/**
 * Converts multi-part position style values to the CSS string.
 * @param val Array of length style values
 */
export function multiPositionToCssString( val: UtilTypes.MultiPosition_StyleType): string
{
    if (Array.isArray(val))
        return arrayToCssString( val,  singlePositionToCssString);
    else
        return  singlePositionToCssString( val);
}



/**
 * Converts time value from the numeric representation to the CSS string. Integer
 * values are treated as milliseconds while floating numbers are treated as seconds.
 * @param val Time as a number
 */
export function timeToCssString( n: number, units?: string): string
{
    return n === 0 ? "0s" : units ? n + units : Number.isInteger(n) ?  n + "ms" : n + "s";
}

/**
 * Converts time style value to the CSS time string.
 * @param val Time as a style property type
 */
export function singleTimeToCssString( val: UtilTypes.SingleTime_StyleType): string
{
    if (typeof val === "string")
        return val;
    else if (val instanceof UtilTypes.StringProxy)
        return val.toString();
    else
	    return timeToCssString( val);
}

/**
 * Converts animation delay style value to the CSS time string.
 * @param val Animation delay value
 */
export function multiTimeToCssString( val: UtilTypes.MultiTime_StyleType): string
{
    if (typeof val === "string")
        return val;
    else if (typeof val === "number")
        return timeToCssString( val);
    else if (val instanceof UtilTypes.StringProxy)
        return val.toString();
    else
        return arrayToCssString( val, singleTimeToCssString);
}



/**
 * Converts the given object to a CSS string.
 * @param val Object to convert to string.
 * @param usePropNames Flag indicating whether the names of the object's proprties should be added to the string.
 * @param propsAndFuncs Array of property names and optionally functions. The order of the names determines in
 *     which oprder the properties should be added to the string. If a function is present for the property,
 *     it will be used to convert the property's value to the string. If a function is not present, then the
 *     property value should be converted to the string using the toString method.
 */
export function objectToCssString( val: any, usePropNames: boolean, ...propsAndFuncs: (string | [string, (val: any) => string])[] ): string
{
    if (val == null || propsAndFuncs.length === 0)
        return null;

	let s = "";

    for( let propAndFunc in propsAndFuncs)
    {
        let propName = typeof propAndFunc === "string" ? propAndFunc : propAndFunc[0];
        let func = typeof propAndFunc === "string" ? undefined : propAndFunc[1];

        let propVal = val[propName];
        if (propVal == null)
            continue;

        if (s.length > 0)
            s += " ";

        if (usePropNames)
            s += propName;

        if (func)
            s += " " + func( propVal);
        else if (propVal != null)
            s += " " + propVal;
    }

	return s;
}


