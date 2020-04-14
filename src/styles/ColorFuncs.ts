﻿import {INamedColors, CssColor, IColorProxy, Colors} from "./ColorTypes"
import {PercentMath, AngleMath, valueToString} from "./UtilFuncs"
import {Extended} from "./UtilTypes";



/**
 * Converts color value from the numeric representation to the CSS color string.
 */
function colorNumberToString( val: number): string
{
    /// #if DEBUG
        if (val < 0)
        {
            console.error( "A number representing color cannot be negative: " + val);
            return "#000";
        }
        else if (!Number.isInteger(val))
        {
            console.error( "A number representing color cannot be floating point: " + val);
            return "#000";
        }
    /// #endif

    // if we have a named color with the given value, return the color name
    let name = reversedColorMap.get( val);
    if (name)
        return name;
    else
    {
        // otherwise convert numeric value to # notation
        let s = val.toString(16);
        return "#" + (val <= 0xFFFFFF ? s.padStart( 6, "0") : s.padStart( 8, "0"));
    }
}



/**
 * Converts color style value to the CSS time string. If a string value is in the Colors object we
 * need to get its number and convert it to the rgb[a]() function because it might be a custom
 * color name added via INamedColors module augmentation. For numeric values, we check if this is
 * one of the predefined
 */
export function colorToString( val: Extended<CssColor>): string
{
    return valueToString( val, {
        fromString: v => Colors[v] ? colorNumberToString( Colors[v]) : v,
        fromNumber: colorNumberToString
    });
}



function colorSeparationToString( c: number | string): string
{
    return c == null ? "0" : typeof c === "string" ? c : Number.isInteger(c) ? c.toString() : PercentMath.convertFunc(c);
}



function rgbToString( r: number | string, g: number | string, b: number | string, a?: number | string): string
{
    r = colorSeparationToString( r);
    g = colorSeparationToString( g);
    b = colorSeparationToString( b);
    a = a == null ? null : PercentMath.styleToString( a);

    return !a ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
}



function hslToString( h: number | string, s: number | string, l: number | string, a?: number | string): string
{
    h = AngleMath.styleToString(h);
    s = s == null ? "100%" : PercentMath.styleToString( s);
    l = l == null ? "100%" : PercentMath.styleToString( l);
    a = a == null ? null : PercentMath.styleToString( a);

    return !a ? `hsl(${h},${s},${l})` : `hsla(${h},${s},${l},${a})`;
}



function alphaToString( c: number | keyof INamedColors, a: number | string): string
{
    let rgbVal = typeof c === "string" ? this[c] : c;
    return rgbToString( (rgbVal & 0xFF0000) >> 16, (rgbVal & 0x00FF00) >> 8, rgbVal & 0x0000FF, a);
}



/**
 * The ColorProxy class implements the IColorProxy and serves as a base for other color proxies.
 */
abstract class ColorProxy implements IColorProxy
{
    /** Flag indicating that this object implements the IImageProxy interface */
    public get isColorProxy(): boolean { return true; }

    /** Converts internally held value(s) to string */
    abstract valueToString(): string
}



/**
 * The RgbProxy class implements the IColorProxy interface by encapsulating parameters of the
 * `rgb()` or `rgba()` CSS functions.
 */
export class RgbProxy extends ColorProxy
{
    /** Flag indicating that this object implements the IImageProxy interface */
    public get isColorProxy(): boolean { return true; }

    constructor( private r: number | string, private g: number | string, private b: number | string,
        private a?: number | string)
    {
        super();
    }

    /** Converts internally held value(s) to string */
    public valueToString(): string
    {
        return rgbToString( this.r, this.g, this.b, this.a);
    }
}



/**
 * The HslProxy class implements the IColorProxy interface by encapsulating parameters of the
 * `hsl()` or `hsla()` CSS functions.
 */
export class HslProxy extends ColorProxy
{
    constructor( private h: number | string, private s: number | string, private l: number | string,
        private a?: number | string)
    {
        super();
    }

    /** Converts internally held value(s) to string */
    public valueToString(): string
    {
        return hslToString( this.h, this.s, this.l, this.a);
    }
}



/**
 * The AlphaProxy class implements the IColorProxy interface by applying the given alpha mask
 * to the color specified as either a number or a named color.
 */
export class AlphaProxy extends ColorProxy
{
    constructor( private c: number | keyof INamedColors, private a: number | string)
    {
        super();
    }

    /** Converts internally held value(s) to string */
    public valueToString(): string
    {
        return alphaToString( this.c, this.a);
    }
}



/**
 * Map of predefined color names by their numeric values
 */
let reversedColorMap = new Map<number,string>();

// build Reversed Color Map
Object.entries( Colors).forEach( ([name, value]) => reversedColorMap.set( value, name) );



