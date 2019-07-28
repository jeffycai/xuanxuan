import React, {Component} from 'react';
import PropTypes from 'prop-types';
import SplitPane from 'react-split-pane';
import {classes} from '../../utils/html-helper';
import DateHelper from '../../utils/date-helper';
import Avatar from '../../components/avatar';
import Lang from '../../core/lang';
import App from '../../core';
import _ChatHeader from './chat-header';
import _ChatMessages from './chat-messages';
import _ChatSendbox from './chat-sendbox';
import _ChatSidebar from './chat-sidebar';
import Config from '../../config';
import withReplaceView from '../with-replace-view';

/**
 * ChatSidebar 可替换组件形式
 * @type {Class<ChatSidebar>}
 * @private
 */
const ChatSidebar = withReplaceView(_ChatSidebar);

/**
 * ChatSendbox 可替换组件形式
 * @type {Class<ChatSendbox>}
 * @private
 */
const ChatSendbox = withReplaceView(_ChatSendbox);

/**
 * ChatMessages 可替换组件形式
 * @type {Class<ChatMessages>}
 * @private
 */
const ChatMessages = withReplaceView(_ChatMessages);

/**
 * ChatHeader 可替换组件形式
 * @type {Class<ChatHeader>}
 * @private
 */
const ChatHeader = withReplaceView(_ChatHeader);

/**
 * ChatView 组件 ，显示聊天界面
 * @class ChatView
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatView from './chat-view';
 * <ChatView />
 */
export default class ChatView extends Component {
    /**
     * ChatView 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatView
     */
    static replaceViewPath = 'chats/ChatView';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatView
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        chatGid: PropTypes.string,
        children: PropTypes.any,
        hidden: PropTypes.bool,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatView
     * @static
     */
    static defaultProps = {
        className: null,
        chatGid: null,
        children: null,
        hidden: false,
    };

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ChatView
     * @return {void}
     */
    componentDidMount() {
        const {chatGid} = this.props;
        this.dataChangeHandler = App.events.onDataChange(data => {
            if (
                (data.chats && data.chats[chatGid]) ||
                (data.members)
            ) {
                this.forceUpdate();
            }
        });
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof ChatView
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.dataChangeHandler);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatView
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chatGid,
            hidden,
            className,
            children,
            ...other
        } = this.props;

        const chat = App.im.chats.get(chatGid);

        if (!chat || chat.delete) {
            return <div key={chatGid} className={classes('box muted', {hidden})}>{Lang.string('chats.chat.selectOneOnMenu')}</div>;
        }

        const hideSidebar = Config.ui['chat.hideAllSidebar'] || App.profile.userConfig.isChatSidebarHidden(chat.gid, App.ui.isSmallScreen() || chat.isOne2One);
        const isReadOnly = chat.isReadonly(App.profile.user);
        const {isRobot} = chat;

        let chatView = null;
        if (isReadOnly) {
            let blockTip = null;
            if (chat.isDeleteOne2One) {
                blockTip = Lang.string('chat.deletedOne2OneTip');
            } else if (chat.isDismissed) {
                blockTip = Lang.format('chat.group.dismissTip', DateHelper.formatDate(chat.visibleDate));
            } else {
                blockTip = Lang.string('chat.committers.blockedTip');
            }
            chatView = (<div className="column single dock">
                <ChatHeader chat={chat} className="flex-none" />
                <ChatMessages chat={chat} className="flex-auto relative" />
                {isRobot ? null : <div className="flex-none gray text-gray heading"><Avatar icon="lock-outline" /><div className="title">{blockTip}</div></div>}
            </div>);
        } else {
            chatView = (<SplitPane split="horizontal" primary="second" maxSize={500} minSize={80} defaultSize={Config.ui['chat.sendbox.height'] || 100} paneStyle={{userSelect: 'none'}}>
                <div className="column single dock">
                    <ChatHeader chat={chat} className="flex-none" />
                    <ChatMessages chat={chat} className="flex-auto relative" />
                </div>
                <ChatSendbox className="dock" chat={chat} />
            </SplitPane>);
        }

        return (
            <div
                {...other}
                className={classes('app-chat dock', className, {hidden, 'chat-readonly': isReadOnly})}
                id={`chat-view-${chat.gid.replace('&', '_')}`}
            >
                {isRobot ? chatView : <SplitPane className={hideSidebar ? 'soloPane1' : ''} split="vertical" primary="second" maxSize={360} minSize={150} defaultSize={200} paneStyle={{userSelect: 'none'}}>
                    {chatView}
                    <ChatSidebar chat={chat} />
                </SplitPane>}
                {children}
            </div>
        );
    }
}
