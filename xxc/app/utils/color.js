/**
 * 十六进制匹配正则表达式
 * @type {RegExp}
 * @private
 */
const hexReg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;

/**
 * 将指定数值大小修正为指定区间范围内
 * @param {number} n 要修正的值
 * @param {number} end 最大值
 * @param {number} start 最大=小值
 * @return {number}
 * @private
 */
const fit = (n, end, start) => (Math.min(Math.max(n, start !== undefined ? start : 0), end !== undefined ? end : 255));

/**
 * 将指定数值修正为不超过给定的最大值
 * @param {number} v 要修正的值
 * @param {number} max 最大值
 * @return {number}
 * @private
 */
const clamp = (v, max) => (fit(v, max));

/**
 * 将字符串转换为数值类型，如果已经是数值类型，则返回原值
 * @param {any} n 要转换的值
 * @return {number}
 * @private
 */
const number = n => (typeof n === 'number' ? n : parseFloat(n));

/**
 * 将指定数值修正为不超过给定的最大值，如果给定的数值是字符串则先转换为数值类型
 * @param {number} v 要修正的值
 * @param {number} max 最大值
 * @return {number}
 * @private
 */
const clampNumber = (x, max) => (clamp(number(x), max));

/**
 * 将指定数值修正 RGB 分量取值范围，即 `0 <= x <= 256`
 * @param {number} x 要修正的值
 * @return {number}
 * @private
 */
const convertToRgbInt = x => (Number.parseInt(clampNumber(x, 255), 10));

/**
 * 将 16 进制颜色值字符串转换为 RGB 对象
 * @param {string} hex 16 进制字符串
 * @return {{r: number, g: number, b: number, a: number}}
 * @private
 */
const hexToRgb = hex => {
    if (hex && hexReg.test(hex)) {
        hex = hex.toLowerCase();
        if (hex.length === 4) {
            let hexNew = '#';
            for (let i = 1; i < 4; i++) {
                hexNew += hex.slice(i, i + 1).concat(hex.slice(i, i + 1));
            }
            hex = hexNew;
        }

        const hexChange = [];
        for (let i = 1; i < 7; i += 2) {
            hexChange.push(Number.parseInt(`0x${hex.slice(i, i + 2)}`, 16));
        }
        return {
            r: hexChange[0],
            g: hexChange[1],
            b: hexChange[2],
            a: 1
        };
    }
    throw new Error(`Wrong hex string! (hex: ${hex})`);
};

/**
 * 判断一个字符串是否是颜色值的有效表示方式
 * @param {string} hex 要判断的字符串
 * @return {boolean}
 * @private
 */
const isColor = hex => (typeof hex === 'string' && (hex.toLowerCase() === 'transparent' || hexReg.test(hex.trim().toLowerCase())));

/**
 * 将一个 hsl 颜色表示对象转换为 rgb 表示对象
 * @param {{h: number, s: number, l: number, a: number}} hsl hsl 表示对象
 * @return {{r: number, g: number, b: number, a: number}}
 * @private
 */
const hslToRgb = hsl => {
    const hue = h => {
        h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
        if (h * 6 < 1) {
            return m1 + ((m2 - m1) * h * 6);
        }
        if (h * 2 < 1) {
            return m2;
        }
        if (h * 3 < 2) {
            return m1 + ((m2 - m1) * ((2 / 3) - h) * 6);
        }
        return m1;
    };

    let {
        h, s, l, a,
    } = hsl;

    h = (number(h) % 360) / 360;
    s = clampNumber(s);
    l = clampNumber(l);
    a = clampNumber(a);

    let m2 = l <= 0.5 ? l * (s + 1) : (l + s - (l * s));
    let m1 = l * 2 - m2;

    const r = {
        r: hue(h + 1 / 3) * 255,
        g: hue(h) * 255,
        b: hue(h - 1 / 3) * 255,
        a
    };

    return r;
};

/**
 * 将数值转换为 16 进制形式，如果不足 2 位，则在字符串前面补充 0
 * @param {number} x 要转换的数值
 * @return {string}
 * @private
 */
const toHexValue = x => {
    const xHex = x.toString(16);
    return xHex.length === 1 ? `0${xHex}` : xHex;
};

/**
 * 颜色类
 *
 * @class Color
 */
export default class Color {
    /**
     * 判断一个字符串是否是颜色值的有效表示方式
     * @param {string} hex 要判断的字符串
     * @return {boolean}
     * @static
     * @function
     * @memberof Color
     */
    static isColor = isColor;

    /**
     * 将 16 进制颜色值字符串转换为 RGB 对象
     * @param {string} hex 16 进制字符串
     * @return {{r: number, g: number, b: number, a: number}}
     * @static
     * @function
     * @memberof Color
     */
    static hexToRgb = hexToRgb;

    /**
     * 将一个 hsl 颜色表示对象转换为 rgb 表示对象
     * @param {{h: number, s: number, l: number, a: number}} hsl hsl 表示对象
     * @return {{r: number, g: number, b: number, a: number}}
     * @static
     * @function
     * @memberof Color
     */
    static hslToRgb = hslToRgb;

    /**
     * 创建一个颜色实例
     * @static
     * @param {Color|sting|object|number} r 可以为 Red 通道值或者 hsla 对象或者 rgba 对象或者表示颜色的字符串
     * @param {?number} g Green 通道值
     * @param {?number} b Blue 通道值
     * @param {?number} [a=1] Alpha 通道值
     * @return {color}
     * @memberof Color
     * @function
     */
    static create(r, g, b, a) {
        if (r instanceof Color) {
            return r;
        }
        return new Color(r, g, b, a);
    }

    /**
     * 创建一个颜色类实例
     *
     * @param {sting|object|number} r 可以为 Red 通道值或者 hsla 对象或者 rgba 对象或者表示颜色的字符串
     * @param {?number} g Green 通道值
     * @param {?number} b Blue 通道值
     * @param {?number} [a=1] Alpha 通道值
     * @constructor
     */
    constructor(r, g, b, a = 1) {
        this.init(r, g, b, a);
    }

    /**
     * 初始化颜色值
     *
     * @param {sting|object|number} r 可以为 Red 通道值或者 hsla 对象或者 rgba 对象或者表示颜色的字符串
     * @param {?number} g Green 通道值
     * @param {?number} b Blue 通道值
     * @param {?number} [a=1] Alpha 通道值
     * @memberof Color
     * @return {void}
     */
    init(r, g, b, a = 1) {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.A = a;

        const paramType = typeof r;
        if (paramType === 'string') {
            const hex = r.toLowerCase();
            if (hex === 'transparent') {
                this.A = 0;
            } else {
                this.rgb = hexToRgb(hex);
            }
        } else if (paramType === 'number') {
            this.R = r;
            this.G = g;
            this.B = b;
        } else if (paramType === 'object') {
            const obj = r;
            if (obj.h !== undefined) {
                const hsl = {
                    h: clampNumber(obj.h, 360),
                    s: 1,
                    l: 1,
                    a: this.A
                };
                if (obj.s !== undefined) hsl.s = clampNumber(obj.s, 1);
                if (obj.l !== undefined) hsl.l = clampNumber(obj.l, 1);
                if (obj.a !== undefined) hsl.a = clampNumber(obj.a, 1);
                this.rgb = hslToRgb(hsl);
            } else {
                this.rgb = obj;
            }
        }
    }

    /**
     * 获取颜色以 RGB 格式表示的 Red 通道值
     * @memberof Color
     * @type {number}
     */
    get R() {
        return this.r;
    }

    /**
     * 以 RGB 格式设置颜色 Red 通道值
     * @memberof Color
     * @param {number} r Red 通道值
     */
    set R(r) {
        this.r = convertToRgbInt(r);
    }

    /**
     * 获取颜色以 RGB 格式表示的 Green 通道值
     * @memberof Color
     * @type {number}
     */
    get G() {
        return this.g;
    }

    /**
     * 以 RGB 格式设置颜色 Green 通道值
     * @memberof Color
     * @param {number} r Green 通道值
     */
    set G(g) {
        this.g = convertToRgbInt(g);
    }

    /**
     * 获取颜色以 RGB 格式表示的 Blue 通道值
     * @memberof Color
     * @type {number}
     */
    get B() {
        return this.b;
    }

    /**
     * 以 RGB 格式设置颜色 Blue 通道值
     * @memberof Color
     * @param {number} r Blue 通道值
     */
    set B(b) {
        this.b = convertToRgbInt(b);
    }

    /**
     * 获取颜色以 RGB 格式表示的 Alpha 通道值
     * @memberof Color
     * @type {number}
     */
    get A() {
        return this.a;
    }

    /**
     * 以 RGB 格式设置颜色 Alpha 通道值
     * @memberof Color
     * @param {number} r Alpha 通道值
     */
    set A(a) {
        this.a = clampNumber(a, 1);
    }

    /**
     * 获取颜色以 RGB 格式表示的对象
     * @memberof Color
     * @type {{r: number, g: number, b: number, a: number}}
     */
    get rbg() {
        return {
            r: this.r,
            g: this.g,
            b: this.b,
            a: this.a
        };
    }

    /**
     * 使用 RGB 格式更新颜色值
     * @memberof Color
     * @param {{r: ?number, g: ?number, b: ?number, a: ?number}} rgb
     */
    set rgb(rgb) {
        if (rgb.r !== undefined) this.R = rgb.r;
        if (rgb.g !== undefined) this.G = rgb.g;
        if (rgb.b !== undefined) this.B = rgb.b;
        if (rgb.a !== undefined) this.A = rgb.a;
    }

    /**
     * 使用 RGB 格式更新颜色值
     * @readonly
     * @memberof Color
     * @param {{r: ?number, g: ?number, b: ?number, a: ?number}} rgb
     * @return {Color}
     */
    setRgb(rgb) {
        this.rgb = rgb;
        return this;
    }

    /**
     * 获取颜色以 HSL 形式表示的对象
     * @memberof Color
     * @type {{h: number, s: number, l: number, a: number}}
     */
    get hsl() {
        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;
        // eslint-disable-next-line prefer-destructuring
        const a = this.a;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h;
        let s;
        const l = (max + min) / 2;
        const d = max - min;

        if (max === min) {
            h = s = 0;
        } else {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
            }
            h /= 6;
        }
        return {
            h: h * 360,
            s,
            l,
            a
        };
    }

    /**
     * 使用 HSL 形式更新颜色值
     * @memberof Color
     * @param {{h: number, s: number, l: number, a: number}} hsl
     */
    set hsl(hsl) {
        this.rgb = hslToRgb(hsl);
    }

    /**
     * 使用 HSL 形式更新颜色值
     * @memberof Color
     * @param {{h: number, s: number, l: number, a: number}} hsl
     * @return {Color}
     */
    setHsl(hsl) {
        this.hsl = Object.assign(this.hsl, hsl);
        return this;
    }

    /**
     * 获取颜色以 HSL 格式表示的 Hue 通道值
     * @memberof Color
     * @type {number}
     */
    get H() {
        return this.hsl.h;
    }

    /**
     * 以 HSL 格式设置颜色 Hue 通道值
     * @memberof Color
     * @param {number} r Hue 通道值
     */
    set H(hue) {
        const {hsl} = this;
        hsl.h = clampNumber(hue, 360);
        this.hsl = hsl;
    }

    /**
     * 获取颜色以 HSL 格式表示的 Saturate 通道值
     * @memberof Color
     * @type {number}
     */
    get S() {
        return this.hsl.s;
    }

    /**
     * 以 HSL 格式设置颜色 Saturate 通道值
     * @memberof Color
     * @param {number} r Saturate 通道值
     */
    set S(s) {
        const {hsl} = this;
        hsl.s = clampNumber(s, 1);
        this.hsl = hsl;
    }

    /**
     * 获取颜色以 HSL 格式表示的 Lightness 通道值
     * @memberof Color
     * @type {number}
     */
    get L() {
        return this.hsl.l;
    }

    /**
     * 以 HSL 格式设置颜色 Lightness 通道值
     * @memberof Color
     * @param {number} r Lightness 通道值
     */
    set L(l) {
        const {hsl} = this;
        hsl.l = clampNumber(l, 1);
        this.hsl = hsl;
    }

    /**
     * 获取颜色在视觉上的亮度
     * @memberof Color
     * @readonly
     * @type {number}
     */
    get luma() {
        let r = this.r / 255;
        let g = this.g / 255;
        let b = this.b / 255;

        r = (r <= 0.03928) ? r / 12.92 : (((r + 0.055) / 1.055) ** 2.4);
        g = (g <= 0.03928) ? g / 12.92 : (((g + 0.055) / 1.055) ** 2.4);
        b = (b <= 0.03928) ? b / 12.92 : (((b + 0.055) / 1.055) ** 2.4);

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * 获取颜色以 16 进制表示的字符串
     * @memberof Color
     * @readonly
     * @type {string}
     */
    get hex() {
        return `#${toHexValue(this.r)}${toHexValue(this.g)}${toHexValue(this.b)}`;
    }

    /**
     * 获取颜色以 CSS 允许的形式表示的字符串
     * @memberof Color
     * @readonly
     * @type {string}
     */
    get css() {
        if (this.a > 0) {
            if (this.a < 1) {
                return `rgba(${this.r},${this.g},${this.b},${this.a})`;
            }
            return this.hex;
        }
        return 'transparent';
    }

    /**
     * 调整颜色使其变得更暗（或者更亮）
     * @param {number} amount 0～100 表示的百分比，数值越大则越暗，如果设置为负数（-100~0）,则会使颜色变得更亮，数值越小则越亮
     * @returns {Color} 返回自身便于链式调用
     * @memberof Color
     */
    darken(amount) {
        const {hsl} = this;

        hsl.l -= amount / 100;
        hsl.l = clamp(hsl.l, 1);

        this.hsl = hsl;
        return this;
    }

    /**
     * 调整颜色使其变得更亮（或者更暗）
     * @param {number} amount 0～100 表示的百分比，数值越大则越亮，如果设置为负数（-100~0）,则会使颜色变得更暗，数值越小则越暗
     * @returns {Color} 返回自身便于链式调用
     * @memberof Color
     */
    lighten(amount) {
        return this.darken(-amount);
    }

    /**
     * 根据百分比设置透明度
     *
     * @param {number} amount 0~100 表示的透明度百分比，0 为完全透明，100 为完全不透明
     * @memberof Color
     * @returns {Color} 返回自身便于链式调用
     */
    fade(amount) {
        this.A = clamp(amount / 100, 1);
        return this;
    }

    /**
     * 在色环上进行旋转
     *
     * @param {number} amount 旋转的值
     * @return {Color} 返回自身便于链式调用
     * @memberof Color
     */
    spin(amount) {
        const {hsl} = this;
        const hue = (hsl.h + amount) % 360;

        hsl.h = hue < 0 ? 360 + hue : hue;
        this.hsl = hsl;
        return this;
    }

    /**
     * 根据百分比调整色相值
     *
     * @param {number} amount 色相值 -100~100
     * @return {Color} 返回自身便于链式调用
     * @memberof Color
     */
    saturate(amount) {
        const {hsl} = this;

        hsl.s += amount / 100;
        hsl.s = clamp(hsl.s);

        this.hsl = hsl;
        return this;
    }

    /**
     * 根据百分比调整亮度值
     *
     * @param {number} amount 亮度值 -100~100
     * @return {Color} 返回自身便于链式调用
     * @memberof Color
     */
    lightness(amount) {
        const {hsl} = this;

        hsl.l += amount / 100;
        hsl.l = clamp(hsl.l);

        this.hsl = hsl;
        return this;
    }

    /**
     * 根据当前颜色亮度明暗程度返回一个对比色
     *
     * @param {?String} dark 如果当前颜色为浅色，则返回此值指定的深色作为对比色，如果不指定则使用纯黑色
     * @param {?String} light 如果当前颜色为深色，则返回此值指定的浅色作为对比色，如果不指定则使用纯白色
     * @param {number} [threshold=0.43] 判断是否为深色的阈值，可选范围 0～1
     * @return {Color} 返回自身便于链式调用
     * @memberof Color
     */
    contrast(dark, light, threshold = 0.43) {
        if (light === undefined) {
            light = new Color(255, 255, 255, 1);
        } else {
            light = new Color(light);
        }
        if (dark === undefined) {
            dark = new Color(0, 0, 0, 1);
        } else {
            dark = new Color(dark);
        }

        if (dark.luma > light.luma) {
            const swapTmp = light;
            light = dark;
            dark = swapTmp;
        }

        if (this.a < 0.5) {
            return dark;
        }
        threshold = number(threshold);

        if (this.isDark(threshold)) {
            return light;
        }
        return dark;
    }

    /**
     * 判断当前颜色是否为深色
     *
     * @param {number} [threshold=0.43] 判断是否为深色的阈值，可选范围 0～1
     * @return {Color} 返回自身便于链式调用
     * @memberof Color
     */
    isDark(threshold = 0.43) {
        return this.luma < threshold;
    }

    /**
     * 创建一个当前颜色实例的副本
     *
     * @return {Color}
     * @memberof Color
     */
    clone() {
        return new Color(this.r, this.g, this.b, this.a);
    }
}
