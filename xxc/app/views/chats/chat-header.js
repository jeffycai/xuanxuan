import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import Icon from '../../components/icon';
import App from '../../core';
import _ChatTitle from './chat-title';
import {getMenuItemsForContext} from '../../core/context-menu';
import Config from '../../config';
import withReplaceView from '../with-replace-view';
import {isJustLangSwitched} from '../../core/lang';

/**
 * ChatTitle 可替换组件形式
 * @type {Class<ChatTitle>}
 * @private
 */
const ChatTitle = withReplaceView(_ChatTitle);

/**
 * ChatHeader 组件 ，显示一个聊天头部界面
 * @class ChatHeader
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatHeader from './chat-header';
 * <ChatHeader />
 */
export default class ChatHeader extends Component {
    /**
     * ChatHeader 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatHeader
     */
    static replaceViewPath = 'chats/ChatHeader';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatHeader
     * @type {Object}
     */
    static propTypes = {
        chat: PropTypes.object,
        className: PropTypes.string,
        children: PropTypes.any,
        showSidebarIcon: PropTypes.any,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatHeader
     * @static
     */
    static defaultProps = {
        chat: null,
        className: null,
        children: null,
        showSidebarIcon: 'auto'
    };

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof ChatHeader
     */
    shouldComponentUpdate(nextProps) {
        const {chat} = nextProps;
        const {className, children, chat: currentChat} = this.props;
        return (isJustLangSwitched()
            || className !== nextProps.className
            || children !== nextProps.children
            || currentChat !== nextProps.chat || this.lastChatUpdateId !== nextProps.chat.updateId
            || (nextProps.chat.isOne2One && nextProps.chat.getTheOtherOne(App).updateId !== this.lastOtherOneUpdateId)
            || this.isSidebarHidden !== App.profile.userConfig.isChatSidebarHidden(chat.gid, chat.isOne2One)
        );
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatHeader
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            className,
            children,
            showSidebarIcon,
            ...other
        } = this.props;

        this.lastChatUpdateId = chat.updateId;
        if (chat.isOne2One) {
            this.lastOtherOneUpdateId = chat.getTheOtherOne(App).updateId;
        }
        this.isSidebarHidden = App.profile.userConfig.isChatSidebarHidden(chat.gid, chat.isOne2One);
        const simpleChatView = Config.ui['chat.simpleChatView'];

        return (
            <div
                {...other}
                className={classes('app-chat-header flex flex-wrap space-between shadow-divider', className)}
            >
                <ChatTitle chat={chat} className="flex flex-middle" />
                {simpleChatView ? null : (
                    <div className="toolbar flex flex-middle text-rigth rounded">
                        {
                            getMenuItemsForContext('chat.toolbar', {chat, showSidebarIcon}).map(item => <div key={item.id} className={`hint--${item.hintPosition || 'bottom'} has-padding-sm`} data-hint={item.label} onClick={item.click}><button className={`btn iconbutton rounded${item.className ? ` ${item.className}` : ''}`} type="button"><Icon className="icon-2x" name={item.icon} /></button></div>)
                        }
                    </div>
                )}
            </div>
        );
    }
}
