import {clipboard, nativeImage} from 'electron';

/**
 * 将指定的图片复制到剪切板
 * @param {string} url 图片地址
 * @param {string} [dataType='path'] 数据类型
 * @return {void}
 */
export const writeImageFromUrl = (url, dataType = 'path') => {
    if (url.startsWith('file://')) {
        url = url.substr(7);
    }
    const img = dataType === 'base64' ? nativeImage.createFromDataURL(url) : nativeImage.createFromPath(url);
    clipboard.writeImage(img);
};

/**
 * 获取 NativeImage 图片信息
 * @param {NativeImage} nativeImg NativeImage 图片对象
 * @return {{name: string, type: string, base64: string, width: number, height: number, size: number}} 图片信息对象
 * @private
 */
const getImageData = nativeImg => {
    if (nativeImg && !nativeImg.isEmpty()) {
        const size = nativeImg.getSize();
        const base64 = nativeImg.toDataURL();
        const base64Length = base64.length;
        return {
            name: `clipboard-image-${size.width}x${size.height}.png`,
            type: 'base64',
            base64,
            width: size.width,
            height: size.height,
            size: Math.ceil(((4 * (base64Length / 3))) + (base64Length % 3 !== 0 ? 4 : 0))
        };
    }
    return null;
};

/**
 * 上次剪切板中的图片信息
 * @type {{name: string, type: string, base64: string, width: number, height: number, size: number}}
 * @private
 */
let lastNewImage = getImageData(clipboard.readImage());

/**
 * 获取剪切板中的新的图片信息
 * @return {{name: string, type: string, base64: string, width: number, height: number, size: number}} 图片信息对象
 */
export const getNewImage = () => {
    const currentImage = getImageData(clipboard.readImage());
    if (!lastNewImage || !currentImage || currentImage.base64 !== lastNewImage.base64) {
        lastNewImage = currentImage;
        return currentImage;
    }
    return null;
};

/**
 * 获取剪切板中的文本内容
 * @param {?string} type 内容类型
 * @return {string} 剪贴板中的纯文本内容。
 */
export const readText = clipboard.readText;

/**
 * 将文本内容写入剪切板中
 * @param {string} text 文本内容
 * @param {?string} type 内容类型
 * @return {void}
 */
export const writeText = clipboard.writeText;

/**
 * 获取剪切板中的图片内容
 * @param {?string} type 内容类型
 * @return {NativeImage} 返回剪贴板中的图像内容
 */
export const readImage = clipboard.readImage;

/**
 * 将图片内容写入剪切板中
 * @param {NativeImage} image 图片内容
 * @param {?string} type 内容类型
 * @return {void}
 */
export const writeImage = clipboard.writeImage;

/**
 * 获取剪切板中的HTML内容
 * @param {?string} type 内容类型
 * @return {string} 返回剪贴板中的HTML内容
 */
export const readHTML = clipboard.readHTML;

/**
 * 将HTML内容写入剪切板中
 * @param {string} markup HTML内容
 * @param {?string} type 内容类型
 * @return {void}
 */
export const writeHTML = clipboard.writeHTML;

/**
 * 将内容写入剪切板中
 * @param {{text: string, html: string, image: NativeImage, rtf: string, bookmark: string}} data 内容
 * @param {?string} type 内容类型
 * @return {void}
 */
export const write = clipboard.write;

export default {
    readText,
    writeText,
    readImage,
    writeImage,
    readHTML,
    writeHTML,
    write,
    writeImageFromUrl,
    getNewImage,
};
