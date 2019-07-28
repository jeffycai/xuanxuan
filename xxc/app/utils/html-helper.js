/** @module html-helper */

/**
 * 拼接元素类
 * @param {...any} 参数
 * @return {string}
 * @function
 * @example
 * const isActive = false;
 * const isHidden = true;
 * const divClass = classes('btn', ['lg', 'flex-none'], {active: isActive, 'is-hidden': isHidden});
 * // 以上 divClass 最终值为 'btn lg flex-none is-hidden'
 */
export const classes = (...args) => (
    args.map(arg => {
        if (Array.isArray(arg)) {
            return classes(arg);
        }
        if (arg !== null && typeof arg === 'object') {
            return Object.keys(arg).filter(className => {
                const condition = arg[className];
                if (typeof condition === 'function') {
                    return !!condition();
                }
                return !!condition;
            }).join(' ');
        }
        return arg;
    }).filter(x => (typeof x === 'string') && x.length).join(' ')
);

/**
 * 将像素单位转换为 rem 单位
 * @param {number} value 像素单位值
 * @param {number} [rootValue=20] `1rem` 单位对应对像素值
 * @return {string}
 * @function
 * @example
 * const width = rem(100);
 */
export const rem = (value, rootValue = 20) => (`${value / rootValue}rem`);

/**
 * 获取浏览器查询字符串键值
 * @param {?string} [key=null] 要获取值的键名，如果留空则以 `Object` 返回所有键值对
 * @param {?string} [search=null] 查询字符串，如果留空则使用当前浏览器地址上的查询字符串
 * @return {string|Object.<string, string>}
 * @function
 */
export const getSearchParam = (key = null, search = null) => {
    const params = {};
    search = search === null ? window.location.search : search;
    if (search.length > 1) {
        if (search[0] === '?') {
            search = search.substr(1);
        }
        const searchArr = search.split('&');
        for (const pair of searchArr) {
            const pairValues = pair.split('=', 2);
            if (pairValues.length > 1) {
                try {
                    params[pairValues[0]] = decodeURIComponent(pairValues[1]);
                } catch (_) {
                    if (DEBUG) {
                        console.error(_, {key, search});
                    }
                    params[pairValues[0]] = '';
                }
            } else {
                params[pairValues[0]] = '';
            }
        }
    }
    return key ? params[key] : params;
};

/**
 * 过滤掉 HTML 标签
 * @param {string} html HTML 源码
 * @return {string}
 * @function
 */
export const strip = html => {
    return html.replace(/<(?:.|\n)*?>/gm, '');
};

/**
 * 转换 HTML 标签
 * @param {string} html HTML 源码
 * @return {string}
 * @function
 */
export const escape = html => {
    const tmp = document.createElement('DIV');
    tmp.innerText = html;
    return tmp.innerHTML || '';
};

/**
 * 判定给定对字符串是否是网址
 * @param {string} url 字符串
 * @return {boolean}
 * @function
 */
export const isWebUrl = url => {
    if (typeof url !== 'string') {
        return false;
    }
    return (/^(https?):\/\/[-A-Za-z0-9\u4e00-\u9fa5+&@#/%?=~_|!:,.;]+[-A-Za-z0-9\u4e00-\u9fa5+&@#/%=~_|]$/ig).test(url);
};

/**
 * 将字符串内的链接转换为 HTML 链接形式
 * @param {string} text 字符串
 * @return {string}
 * @function
 */
export const linkify = (text) => {
    return (text || '').replace(
        /([^\S]|^)(((https?:\/\/)|(www\.))(\S+))/gi,
        (match, space, url) => {
            let hyperlink = url;
            if (!hyperlink.match('^https?://')) {
                hyperlink = `http://${hyperlink}`;
            }
            return `${space}<a href="${hyperlink}">${url}</a>`;
        }
    );
};

export default {
    classes,
    rem,
    getSearchParam,
    strip,
    isWebUrl,
};
