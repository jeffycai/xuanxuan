import React from 'react';
import Modal from '../../components/modal';
import _WebViewFrame from './webview-frame';
import timeSequence from '../../utils/time-sequence';
import withReplaceView from '../with-replace-view';

/**
 * WebViewFrame 可替换组件形式
 * @type {Class<WebViewFrame>}
 * @private
 */
const WebViewFrame = withReplaceView(_WebViewFrame);

/**
 * 在对话框中显示一个网页
 * @param {string} sourceUrl 网页源地址
 * @param {Object} options Webview 选项
 * @param {function} callback 对话框显示完成回调函数
 * @return {void}
 */
export const showWebviewDialog = (sourceUrl, options, callback) => {
    let width = (options && options.width);
    let height = (options && options.height);
    if (options && options.size) {
        if (options.size === 'lg') {
            width = width || (window.innerWidth - 40);
            height = height || (window.innerHeight - 40);
        } else if (options.size === 'full') {
            width = width || '100%';
            height = height || '100%';
        }
    }
    if (typeof height === 'number') {
        height = `${height}px`;
    }
    if (typeof width === 'number') {
        width = `${width}px`;
    }
    const displayId = `display-${timeSequence()}`;
    return Modal.show({
        id: displayId,
        style: {width: width || 860, height: height || 640},
        headingClassName: 'dock dock-right dock-top',
        actions: false,
        animation: 'enter-from-bottom fade',
        contentClassName: 'no-padding flex stretch',
        listenUpdateStyle: true,
        content: <WebViewFrame displayId={displayId} src={sourceUrl} options={options} />
    }, callback);
};

export default {
    show: showWebviewDialog,
};
