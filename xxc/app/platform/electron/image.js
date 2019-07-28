import {nativeImage, NativeImage} from 'electron';
import fs from 'fs-extra';
import Path from 'path';

/**
 * 将 Base64 字符串转换为 Buffer
 * @param {string} base64Str Base64 字符串
 * @return {Buffer} Buffer
 */
export const base64ToBuffer = base64Str => {
    const matches = base64Str.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (matches.length !== 3) {
        throw new Error('Invalid base64 image string.');
    }
    return Buffer.from(matches[2], 'base64');
};

/**
 * 从图片路径创建一个 NativeImage 实例
 * @param {string} path 图片路径
 * @return {NativeImage} NativeImage 实例
 */
export const createFromPath = path => {
    return nativeImage.createFromPath(path);
};

/**
 * 从 DataUrl 字符串创建一个 NativeImage 实例
 * @param {string} dataUrl DataUrl 字符串
 * @return {NativeImage} NativeImage 实例
 */
export const createFromDataURL = dataUrl => {
    return nativeImage.createFromDataURL(dataUrl);
};

/**
 * 保存图片
 * @param {NativeImage|string|Buffer} image 图片
 * @param {string} filePath 保存路径
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const saveImage = (image, filePath) => {
    const file = {
        path: filePath,
        name: Path.basename(filePath),
    };
    if (typeof image === 'string') {
        file.base64 = image;
        image = base64ToBuffer(image);
        file.size = image.length;
    } else if (image.toPNG) {
        image = image.toPNG();
        file.size = image.length;
    }
    if (image instanceof Buffer) {
        return fs.outputFile(filePath, image).then(() => {
            return Promise.resolve(file);
        });
    }
    return Promise.reject(new Error('Cannot convert image to a buffer.'));
};

export default {
    base64ToBuffer,
    saveImage,
    createFromPath,
    createFromDataURL
};
