import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import {formatBytes} from '../../utils/string-helper';
import Lang from '../../core/lang';
import App from '../../core';
import {checkUploadFileSize} from '../../core/network/api';
import Emojione from '../../components/emojione';

/**
 * ChatsDndContainer 组件 ，显示聊天拖放功能交互容器
 * @class ChatsDndContainer
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatsDndContainer from './chats-dnd-container';
 * <ChatsDndContainer />
 */
export default class ChatsDndContainer extends PureComponent {
    /**
     * ChatsDndContainer 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatsDndContainer
     */
    static replaceViewPath = 'chats/ChatsDndContainer';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatsDndContainer
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatsDndContainer
     * @static
     */
    static defaultProps = {
        className: null,
    };

    /**
     * 处理拖放进入事件
     * @param {Event} e 事件对象
     * @memberof ChatsDndContainer
     * @private
     * @return {void}
     */
    handleDndEnter = e => {
        e.target.classList.add('hover');
    }

    /**
     * 处理拖放离开事件
     * @param {Event} e 事件对象
     * @memberof ChatsDndContainer
     * @private
     * @return {void}
     */
    handleDndLeave = e => {
        e.target.classList.remove('hover');
    }

    /**
     * 处理拖放完成事件
     * @param {Event} e 事件对象
     * @memberof ChatsDndContainer
     * @private
     * @return {void}
     */
    handleDndDrop = e => {
        e.target.classList.remove('hover');
        if (e.dataTransfer.files && e.dataTransfer.files.length) {
            let hasError = false;
            for (let i = 0; i < e.dataTransfer.files.length; ++i) {
                const file = e.dataTransfer.files[i];
                if (checkUploadFileSize(App.user, file.size)) {
                    if (file.type.startsWith('image/')) {
                        App.im.ui.sendContentToChat(file, 'image');
                    } else {
                        App.im.ui.sendContentToChat(file, 'file');
                    }
                } else {
                    hasError = true;
                }
            }
            if (hasError) {
                App.ui.showMessger(Lang.error({code: 'UPLOAD_FILE_IS_TOO_LARGE', formats: formatBytes(App.user.uploadFileSize)}), {type: 'warning'});
            }
        }
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatsDndContainer
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            ...other
        } = this.props;

        return (<div
            className={classes('app-chats-dnd-container drag-n-drop-message center-content', className)}
            {...other}
            onDragEnter={this.handleDndEnter}
            onDrop={this.handleDndDrop}
            onDragLeave={this.handleDndLeave}
        >
            <div className="text-center">
                <div className="dnd-over" dangerouslySetInnerHTML={{__html: Emojione.toImage(':hatching_chick:')}} />
                <div className="dnd-hover" dangerouslySetInnerHTML={{__html: Emojione.toImage(':hatched_chick:')}} />
                <h1>{Lang.string('chats.drapNDropFileMessage')}</h1>
            </div>
        </div>);
    }
}
