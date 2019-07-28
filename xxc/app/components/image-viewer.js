import React from 'react';
import Modal from './modal';
import timeSequence from '../utils/time-sequence';
import AdvanceImageViewer from './advance-image-viewer';

/** @module image-viewer */

/**
 * 显示一个图片预览弹出层
 * @param {string} imageSrc 图片地址
 * @param {Object} props DisplayLayer 组件属性
 * @param {?Function} callback 操作完成时的回调函数
 * @return {DisplayLayer}
 * @function
 */

export const showImageViewer = (imageSrc, props, callback) => {
    const modalId = `layer-image-viewer-${timeSequence()}`;
    return Modal.show(Object.assign({
        closeButton: true,
        actions: false,
        className: 'layer-image-viewer dock clean',
        onClick: () => {
            Modal.hide(modalId);
        },
        content: <AdvanceImageViewer src={imageSrc} onRequestClsoe={() => Modal.hide(modalId)} />
    }, props, {
        id: modalId
    }), callback);
};

export default {
    show: showImageViewer,
};
