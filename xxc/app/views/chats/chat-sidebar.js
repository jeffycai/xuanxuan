import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import Icon from '../../components/icon';
import {Tabs, TabPane} from '../../components/tabs';
import Lang, {isJustLangSwitched} from '../../core/lang';
import App from '../../core';
import _ChatSidebarPeoples from './chat-sidebar-peoples';
import _ChatSidebarFiles from './chat-sidebar-files';
import _ChatSidebarProfile from './chat-sidebar-profile';
import withReplaceView from '../with-replace-view';

/**
 * ChatSidebarProfile 可替换组件形式
 * @type {Class<ChatSidebarProfile>}
 * @private
 */
const ChatSidebarProfile = withReplaceView(_ChatSidebarProfile);

/**
 * ChatSidebarPeoples 可替换组件形式
 * @type {Class<ChatSidebarPeoples>}
 * @private
 */
const ChatSidebarPeoples = withReplaceView(_ChatSidebarPeoples);

/**
 * ChatSidebarFiles 可替换组件形式
 * @type {Class<ChatSidebarFiles>}
 * @private
 */
const ChatSidebarFiles = withReplaceView(_ChatSidebarFiles);

/**
 * ChatSidebar 组件 ，显示一个聊天侧边栏界面
 * @class ChatSidebar
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatSidebar from './chat-sidebar';
 * <ChatSidebar />
 */
export default class ChatSidebar extends Component {
    /**
     * ChatSidebar 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatSidebar
     */
    static replaceViewPath = 'chats/ChatSidebar';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatSidebar
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        chat: PropTypes.object,
        children: PropTypes.any,
        closeButton: PropTypes.bool,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatSidebar
     * @static
     */
    static defaultProps = {
        className: null,
        chat: null,
        children: null,
        closeButton: true,
    };

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof ChatSidebar
     */
    shouldComponentUpdate(nextProps) {
        return isJustLangSwitched() || this.props.className !== nextProps.className || this.props.children !== nextProps.children || this.props.closeButton !== nextProps.closeButton || this.props.chat !== nextProps.chat || this.lastChatId !== nextProps.updateId || (nextProps.chat.isOne2One && nextProps.chat.getTheOtherOne(App).updateId !== this.lastOtherOneUpdateId);
    }

    /**
     * 处理侧边栏关闭按钮点击事件
     * @memberof ChatSidebar
     * @private
     * @return {void}
     */
    handleCloseBtnClick = () => {
        App.profile.userConfig.setChatSidebarHidden(this.props.chat.gid, true);
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatSidebar
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            closeButton,
            className,
            children,
            ...other
        } = this.props;

        this.lastChatId = chat.updateId;
        if (chat.isOne2One) {
            this.lastOtherOneUpdateId = chat.getTheOtherOne(App).updateId;
        }

        return (
            <div
                {...other}
                className={classes('app-chat-sidebar dock', className)}
            >
                {closeButton !== false && <div className="dock-right dock-top has-padding app-chat-sidebar-close hint--bottom-left dock" data-hint={Lang.string('chat.sidebar.close')}>
                    <button className="iconbutton btn rounded" type="button" onClick={this.handleCloseBtnClick}><Icon name="close" /></button>
                </div>}
                <Tabs className="dock column single" defaultActivePaneKey={chat.isOne2One ? 'profile' : 'peoples'} navClassName="shadow-divider flex-none" contentClassName="flex-auto scroll-y">
                    {chat.isOne2One ? <TabPane key="profile" label={Lang.string('chat.sidebar.tab.profile.label')}>
                        <ChatSidebarProfile chat={chat} />
                    </TabPane> : <TabPane key="peoples" label={`${Lang.string('chat.sidebar.tab.peoples.label')}`}>
                        <ChatSidebarPeoples chat={chat} />
                    </TabPane>}
                    <TabPane key="files" label={`${Lang.string('chat.sidebar.tab.files.label')}`}>
                        <ChatSidebarFiles chat={chat} />
                    </TabPane>
                </Tabs>
                {children}
            </div>
        );
    }
}
