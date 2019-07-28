import {remote as Remote, nativeImage} from 'electron';
import Path from 'path';
import fs from 'fs-extra';
import env from './env';
import ui from './ui';
import {showOpenDialog} from '../common/open-file-button';
import {downloadFileWithRequest} from './net';

/**
 * 上次在文件保存对话框中选择的文件保存位置
 * @type {string}
 * @private
 */
let lastFileSavePath = '';

/**
 * 显示文件保存对话框
 * @param {{sourceFilePath: string}} options 选项
 * @param {function(result: boolean)} callback 保存完成后的回调函数，其中参数 `result` 为是否成功保存文件
 * @return {void}
 */
export const showSaveDialog = (options, callback) => {
    if (options.sourceFilePath) {
        const {sourceFilePath} = options;
        delete options.sourceFilePath;
        return showSaveDialog(options, filename => {
            if (filename) {
                if (sourceFilePath === filename) {
                    callback(filename);
                } else {
                    fs.copy(sourceFilePath, filename)
                        .then(() => {
                            if (callback) {
                                callback(filename);
                            }
                        }).catch(callback);
                }
            } else if (callback) {
                callback();
            }
        });
    }

    let filename = options.filename || '';
    delete options.filename;
    if (filename) {
        filename = Path.basename(filename);
    }

    options = Object.assign({
        defaultPath: Path.join(lastFileSavePath || env.desktopPath, filename)
    }, options);
    Remote.dialog.showSaveDialog(ui.browserWindow, options, filename => {
        if (filename) {
            lastFileSavePath = Path.dirname(filename);
        }
        if (callback) {
            callback(filename);
        }
    });
};

/**
 * 显示 Electron 内置的文件保存对话框
 * @param {{title: string, defaultPath: string, properties: string[]}} options 选项
 * @param {function(result: boolean)} callback 保存完成后的回调函数，其中参数 `result` 为是否成功保存文件
 * @return {void}
 */
export const showRemoteOpenDialog = (options, callback) => {
    options = Object.assign({
        defaultPath: env.desktopPath,
        properties: ['openFile']
    }, options);
    Remote.dialog.showOpenDialog(ui.browserWindow, options, callback);
};

/**
 * 根据图片地址和存储类型保存图片
 * @param {string} url 图片地址
 * @param {string} dataType 图片类型
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const saveAsImageFromUrl = (url, dataType) => new Promise((resolve, reject) => {
    const isBase64Image = url.startsWith('data:image/') || dataType === 'base64';
    const isBlob = url.startsWith('blob:');
    if (isBlob) {
        throw new Error('Cannot support save blob image in electron.');
    } else if (!isBase64Image && url.startsWith('file://')) {
        url = url.substr(7);
    }
    showSaveDialog({
        filename: (isBase64Image || isBlob) ? 'xuanxuan-image.png' : Path.basename(url),
        sourceFilePath: (isBase64Image || isBlob) ? null : url
    }, filename => {
        if (filename) {
            if (isBase64Image) {
                const image = nativeImage.createFromDataURL(url);
                fs.outputFileSync(filename, image.toPNG());
            } else if (isBlob) {
                return downloadFileWithRequest(url, filename).then(() => {
                    resolve(filename);
                }).catch(reject);
            }
            resolve(filename);
        } else {
            reject();
        }
    });
});

export default {
    // showRemoteOpenDialog,
    showSaveDialog,
    showOpenDialog,
    saveAsImageFromUrl
};
