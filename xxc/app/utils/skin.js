import Color from './color';

/**
 * 默认皮肤选项
 * @type {Object.<string, any>}
 * @private
 */
const DEFAULT_OPTIONS = {
    outline: false,
    pale: false,
    dark: false,
    code: 'random',
    textTint: true,
    backTint: true,
    textColor: '',
    darkText: '#fff',
    lightText: '#333',
    hueSpace: 43,
    threshold: 0.43,
    darkLight: 0.4,
    paleLight: 0.92,
    saturation: 0.7,
    lightness: 0.6,
    longShadow: false,
    // name: '',
};

/**
 * 根据给定字符串获取一个对应的唯一的固定值
 * @param {string} str 要计算值的字符串
 * @return {number}
 */
export const getCodeFromString = (str) => {
    if (!str) {
        return 0;
    }
    return str.split('')
        .map(char => char.charCodeAt(0))
        .reduce((current, previous) => previous + current);
};

/**
 * 计算长阴影样式
 * @param {number} shadowSize 阴影大小
 * @param {string|number|Object} color 阴影颜色
 * @param {boolean} [returnShadow=false] 是否返回阴影值，如果为 `false` 则返回样式对象
 * @param {number} [darkenAmount=8] 阴影色彩加深百分比
 * @return {Object|string}
 * @private
 */
export const longShadow = (shadowSize, color, returnShadow = false, darkenAmount = 8) => {
    if (typeof shadowSize !== 'number') {
        shadowSize = 40;
    }
    const shadowColor = Color.create(color).darken(darkenAmount).css;
    const textShadowArr = [];
    for (let i = 1; i <= shadowSize; ++i) {
        textShadowArr.push(`${shadowColor} ${i}px ${i}px`);
    }
    const textShadow = textShadowArr.join(',');
    return returnShadow ? textShadow : {textShadow};
};

/**
 * 根据值或配置对象生成 CSS 样式对象
 * @param {number|Object<string, any>} skinCode 皮肤值
 * @param {Object<string, any>} options 皮肤配置对象
 * @return {Object<string, any>}
 */
export const skinStyle = (skinCode, options = {}) => {
    if (typeof skinCode === 'object') {
        options = skinCode;
    } else {
        options.code = skinCode;
    }
    options = Object.assign({}, DEFAULT_OPTIONS, options);

    let {
        outline,
        pale,
        dark,
        textTint,
        backTint,
        darkText,
        lightText,
        color,
        code,
        textColor,
        hueSpace,
        threshold,
        darkLight,
        paleLight,
        saturation,
        lightness,
        name,
        longShadow: thisLongShadow,
        ...other
    } = options;

    if (!color) {
        if (code === 'random') {
            code = Math.floor(Math.random() * 360);
        }
        if (typeof code === 'string') {
            if (!Color.isColor(code)) {
                code = getCodeFromString(code);
            }
        }
        if (typeof code === 'number') {
            code = {h: (code * hueSpace) % 360, s: saturation, l: lightness};
        }
        color = Color.create(code);
        if (code !== 'random') {
            options.color = color;
        }
    }

    let backColor = '';
    let borderColor = '';
    let fontColor = textColor;
    if (outline) {
        if (dark) {
            const darkColor = color.clone().setHsl({s: saturation, l: darkLight});
            borderColor = darkColor;
        } else if (pale) {
            const lightColor = color.clone().setHsl({s: saturation, l: paleLight});
            borderColor = lightColor;
        } else {
            borderColor = color;
        }
        if (!fontColor && textTint) {
            fontColor = borderColor;
        }
    } else if (backTint) {
        if (dark) {
            const darkColor = color.clone().setHsl({s: saturation, l: darkLight});
            backColor = darkColor;
        } else if (pale) {
            const lightColor = color.clone().setHsl({s: saturation, l: paleLight});
            backColor = lightColor;
        } else {
            backColor = color;
        }
        if (!fontColor) {
            if (backColor.isDark(threshold)) {
                fontColor = darkText;
            } else if (textTint) {
                const darkColor = color.clone().setHsl({s: saturation, l: darkLight});
                fontColor = darkColor;
            } else {
                fontColor = lightText;
            }
        }
    } else if (dark) {
        const darkColor = color.clone().setHsl({s: saturation, l: darkLight});
        fontColor = darkColor;
    } else if (pale) {
        const lightColor = color.clone().setHsl({s: saturation, l: paleLight});
        fontColor = lightColor;
    } else {
        fontColor = color;
    }

    const style = Object.assign({}, other);
    if (backColor) style.backgroundColor = backColor.css || backColor;
    if (borderColor) style.borderColor = borderColor.css || borderColor;
    if (fontColor) style.color = fontColor.css || fontColor;
    if (thisLongShadow) {
        style.textShadow = longShadow(thisLongShadow, backColor, true);
    }
    return style;
};

/**
 * 根据值或配置对象生成适合应用文本外观的 CSS 样式对象
 * @param {number} skinCode 皮肤值
 * @param {Object<string, any>} options 皮肤配置对象
 * @return {Object<string, any>}
 */
const textSkin = (skinCode, options) => {
    return skinStyle(skinCode, Object.assign({backTint: false}, options));
};

export default {
    style: skinStyle,
    text: textSkin,
    longShadow,
};
