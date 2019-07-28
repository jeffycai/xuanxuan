import clipboard from 'clipboard-polyfill'; // 考虑升级到 https://github.com/lgarron/clipboard-polyfill

/**
 * 将文本复制到剪切板
 * @param {string} text 要复制的文本
 * @return {void}
 */
export const writeText = clipboard.writeText; // eslint-disable-line

/**
 * 将 HTML 文本复制到剪切板
 * @param {string} html 要复制的 HTML 文本
 * @return {void}
 */
export const writeHTML = html => {
    const dt = new clipboard.DT();
    dt.setData('text/html', html);
    clipboard.write(dt);
};

/**
 * 将内容写入剪切板中
 * @param {{text: string, html: string}} data 内容
 * @return {void}
 */
export const write = data => {
    const dt = new clipboard.DT();
    if (data.html !== undefined) {
        dt.setData('text/html', data.html);
    }
    if (data.text !== undefined) {
        dt.setData('text/plain', data.text);
    }
    clipboard.write(dt);
};

export default {
    write,
    writeText,
    // readText: clipboard.readText,
    writeHTML,
    // readHTML: clipboard.readHTML,
    // readImage: clipboard.readImage,
    // saveImage,
};
