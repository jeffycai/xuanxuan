import PinYin from 'pinyin';

/** @module pinyin */

/**
 * 将文本字符串中的中文转换为拼音形式
 * @param  {string} str 要转换的字符串
 * @param  {string|string[]} [styles='default'] 样式类型，包括 'STYLE_NORMAL'，'STYLE_FIRST_LETTER'，'STYLE_INITIALS'
 * @param  {string} [separator=' '] 拼音分隔符
 * @return {string}
 * @function
 * @see https://github.com/hotoo/pinyin
 */
export default (str, styles = 'default', separator = ' ') => {
    if (!styles || styles === 'default') {
        styles = [PinYin.STYLE_NORMAL, PinYin.STYLE_FIRST_LETTER, PinYin.STYLE_INITIALS];
    }
    if (!Array.isArray(styles)) {
        styles = [styles];
    }
    const pinyins = styles.map(style => {
        if (typeof style === 'string') {
            switch (style) {
            case 'normal':
            case 'STYLE_NORMAL':
                style = PinYin.STYLE_NORMAL;
                break;
            case 'first-letter':
            case 'STYLE_FIRST_LETTER':
                style = PinYin.STYLE_FIRST_LETTER;
                break;
            case 'initials':
            case 'STYLE_INITIALS':
                style = PinYin.STYLE_INITIALS;
                break;
            }
        }
        return PinYin(str, {style}).map(x => x[0]).join('');
    });
    return separator === false ? pinyins : pinyins.join(separator);
};
