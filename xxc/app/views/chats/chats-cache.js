import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import App from '../../core';
import _ChatView from './chat-view';
import withReplaceView from '../with-replace-view';

/**
 * ChatView 可替换组件形式
 * @type {Class<ChatView>}
 * @private
 */
const ChatView = withReplaceView(_ChatView);

/**
 * ChatsCache 组件 ，显示聊天缓存管理容器
 * @class ChatsCache
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatsCache from './chats-cache';
 * <ChatsCache />
 */
export default class ChatsCache extends Component {
    /**
     * ChatsCache 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatsCache
     */
    static replaceViewPath = 'chats/ChatsCache';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatsCache
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        children: PropTypes.any,
        filterType: PropTypes.any,
        activeChatId: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatsCache
     * @static
     */
    static defaultProps = {
        className: null,
        children: null,
        filterType: false,
        activeChatId: null,
    };

    /**
     * React 组件生命周期函数：`componentDidUpdate`
     * componentDidUpdate()会在更新发生后立即被调用。该方法并不会在初始化渲染时调用。
     *
     * @param {Object} prevProps 更新前的属性值
     * @param {Object} prevState 更新前的状态值
     * @see https://doc.react-china.org/docs/react-component.html#componentDidUpdate
     * @private
     * @memberof ChatsCache
     * @return {void}
     */
    componentDidUpdate() {
        const {activeChatId} = this.props;
        if (this.activeChatId !== activeChatId) {
            App.im.ui.setActiveChat(activeChatId);
        }
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatsCache
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            filterType,
            className,
            children,
            activeChatId,
            ...other
        } = this.props;

        return (
            <div
                {...other}
                className={classes('app-chats-cache', className)}
            >
                {
                    App.im.ui.getActivedCacheChatsGID(activeChatId).map(cgid => {
                        if (cgid) {
                            return <ChatView key={cgid} chatGid={cgid} hidden={activeChatId !== cgid} />;
                        }
                        if (DEBUG) {
                            console.warn('Cannot render undefined chat cache.');
                        }
                        return null;
                    })
                }
                {children}
            </div>
        );
    }
}
