import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import App from '../../core';
import _ChatListItem from './chat-list-item';
import {showContextMenu} from '../../core/context-menu';
import withReplaceView from '../with-replace-view';

/**
 * ChatListItem 可替换组件形式
 * @type {Class<ChatListItem>}
 * @private
 */
const ChatListItem = withReplaceView(_ChatListItem);

/**
 * MenuRecentList 组件 ，显示最近聊天列表界面
 * @class MenuRecentList
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MenuRecentList from './menu-recent-list';
 * <MenuRecentList />
 */
export default class MenuRecentList extends Component {
    /**
     * MenuRecentList 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MenuRecentList
     */
    static replaceViewPath = 'chats/MenuRecentList';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MenuRecentList
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        filter: PropTypes.string,
        children: PropTypes.any,
        activeChatId: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MenuRecentList
     * @static
     */
    static defaultProps = {
        className: null,
        filter: null,
        children: null,
        activeChatId: null,
    };

    /**
     * 处理聊天右键菜单事件
     * @param {Event} event 事件对象
     * @memberof MenuRecentList
     * @private
     * @return {void}
     */
    handleItemContextMenu = (event) => {
        const chat = App.im.chats.get(event.currentTarget.attributes['data-gid'].value);
        showContextMenu('chat.menu', {
            event,
            chat,
            menuType: this.props.filter,
            viewType: ''
        });
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MenuRecentList
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            filter,
            className,
            children,
            activeChatId,
            ...other
        } = this.props;

        const chats = App.im.chats.getRecents();
        let hasActiveChatItem = false;
        const activeChat = App.im.ui.currentActiveChat;
        const chatItemsView = chats.map(chat => {
            if (activeChat && activeChat.gid === chat.gid) {
                hasActiveChatItem = true;
            }
            return <ChatListItem onContextMenu={this.handleItemContextMenu} data-gid={chat.gid} key={chat.gid} filterType={filter} chat={chat} className={classes('item', {active: activeChatId === chat.gid})} />;
        });
        if (!hasActiveChatItem && activeChat) {
            chatItemsView.splice(0, 0, <ChatListItem onContextMenu={this.handleItemContextMenu} data-gid={activeChat.gid} key={activeChat.gid} filterType={filter} chat={activeChat} className="item" />);
        }

        return (<div className={classes('app-chats-menu-list list scroll-y', className)} {...other}>
            {chatItemsView}
            {children}
        </div>);
    }
}
