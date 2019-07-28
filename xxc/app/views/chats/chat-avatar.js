import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import Icon from '../../components/icon';
import App from '../../core';
import Chat from '../../core/models/chat';
import _UserAvatar from '../common/user-avatar';
import withReplaceView from '../with-replace-view';

/**
 * UserAvatar 可替换组件形式
 * @type {Class<UserAvatar>}
 * @private
 */
const UserAvatar = withReplaceView(_UserAvatar);

/**
 * 聊天图标定义
 * @type {Map<string, {name: string, colorClass: string}>}
 * @private
 */
const chatIcons = {
    robot: {name: 'robot', colorClass: 'text-accent'},
    group: {name: 'comment-multiple-outline', colorClass: 'text-info'},
    'public-group': {name: 'pound-box', colorClass: 'text-green'},
    'system-group': {name: 'comment-text', colorClass: 'text-primary'}
};

/**
 * ChatAvatar 组件 ，显示聊天图标界面
 * @class ChatAvatar
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatAvatar from './chat-avatar';
 * <ChatAvatar />
 */
export default class ChatAvatar extends Component {
    /**
     * ChatAvatar 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatAvatar
     */
    static replaceViewPath = 'chats/ChatAvatar';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatAvatar
     * @type {Object}
     */
    static propTypes = {
        chat: PropTypes.instanceOf(Chat),
        grayOffline: PropTypes.bool,
        className: PropTypes.string,
        avatarSize: PropTypes.number,
        iconSize: PropTypes.number,
        avatarClassName: PropTypes.string,
        iconClassName: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatAvatar
     * @static
     */
    static defaultProps = {
        chat: null,
        grayOffline: false,
        className: null,
        avatarSize: null,
        iconSize: null,
        avatarClassName: null,
        iconClassName: null,
    };

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof ChatAvatar
     */
    shouldComponentUpdate(nextProps) {
        const nextChat = nextProps.chat;
        const {chat} = this.props;
        if (chat !== nextChat || this.lastChatUpdateId !== nextChat.updateId) {
            return true;
        }
        if (nextProps.grayOffline && nextChat.isOne2One && nextChat.getTheOtherOne(App).updateId !== this.lastOtherOneUpdateId) {
            return true;
        }
        return false;
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatAvatar
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            grayOffline,
            className,
            avatarSize,
            iconSize,
            avatarClassName,
            iconClassName,
            ...other
        } = this.props;

        if (chat.isOne2One) {
            const theOtherOne = chat.getTheOtherOne(App);
            this.lastOtherOneUpdateId = theOtherOne.updateId;
            const grayscale = grayOffline && (theOtherOne.isOffline || !App.profile.isUserOnline);
            return <UserAvatar size={avatarSize} user={theOtherOne} className={classes(className, avatarClassName, {grayscale})} {...other} />;
        }
        let icon = null;
        if (chat.isSystem) {
            icon = chat.isRobot ? chatIcons.robot : chatIcons['system-group'];
        } else if (chat.public) {
            icon = chatIcons['public-group'];
        } else {
            icon = chatIcons.group;
        }
        this.lastChatUpdateId = chat.updateId;

        return <Icon size={iconSize} name={`${icon.name} icon-2x`} className={classes(className, iconClassName, icon.colorClass)} {...other} />;
    }
}
