import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import Icon from '../../components/icon';
import Lang from '../../core/lang';
import App from '../../core';
import Member from '../../core/models/member';
import _MemberList from '../common/member-list';
import ChatInviteDialog from './chat-invite-dialog';
import {showContextMenu} from '../../core/context-menu';
import withReplaceView from '../with-replace-view';

/**
 * MemberList 可替换组件形式
 * @type {Class<MemberList>}
 * @private
 */
const MemberList = withReplaceView(_MemberList);

/**
 * 处理聊天成员点击事件
 * @param {Member} member 聊天成员
 * @return {void}
 * @private
 */
const handleMemberItemClick = member => {
    App.im.ui.sendContentToChat(`@${member.displayName} `);
};

/**
 * ChatSidebarPeoples 组件 ，显示聊天侧边栏成员列表界面
 * @class ChatSidebarPeoples
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatSidebarPeoples from './chat-sidebar-peoples';
 * <ChatSidebarPeoples />
 */
export default class ChatSidebarPeoples extends Component {
    /**
     * ChatSidebarPeoples 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatSidebarPeoples
     */
    static replaceViewPath = 'chats/ChatSidebarPeoples';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatSidebarPeoples
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        chat: PropTypes.object,
        children: PropTypes.any,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatSidebarPeoples
     * @static
     */
    static defaultProps = {
        className: null,
        chat: null,
        children: null,
    };

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ChatSidebarPeoples
     * @return {void}
     */
    componentDidMount() {
        this.dataChangeEventHandler = App.events.onDataChange(data => {
            if (data && data.members) {
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
     * @memberof ChatSidebarPeoples
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.dataChangeEventHandler);
    }

    /**
     * 渲染成员列表项
     *
     * @param {Member} member 聊天成员
     * @memberof ChatSidebarPeoples
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     * @private
     */
    handleItemRender = member => {
        const {chat} = this.props;
        let committerIcon = null;
        let adminIcon = null;
        if (!chat.isCommitter(member)) {
            committerIcon = <div data-hint={Lang.string('chat.committers.blocked')} className="hint--left side-icon text-gray inline-block"><Icon name="lock-outline" /></div>;
        }
        if (chat.isAdmin(member)) {
            adminIcon = <div data-hint={Lang.string('chat.role.admin')} className="hint--left side-icon text-gray inline-block"><Icon name="account-circle" /></div>;
        }
        if (committerIcon && adminIcon) {
            return <div>{committerIcon}{adminIcon}</div>;
        }
        return committerIcon || adminIcon;
    };

    /**
     * 处理聊天成员点击事件
     * @param {Member} member 聊天成员
     * @param {Event} event 事件对象
     * @memberof ChatSidebarPeoples
     * @private
     * @return {void}
     */
    handleItemContextMenu = (member, event) => {
        showContextMenu('chat.member', {
            member,
            event,
            chat: this.props.chat
        });
    };

    /**
     * 处理邀请按钮点击事件
     * @param {Event} e 事件对象
     * @memberof ChatSidebarPeoples
     * @private
     * @return {void}
     */
    handleInviteBtnClick = e => {
        ChatInviteDialog.show(this.props.chat);
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatSidebarPeoples
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            className,
            children,
            ...other
        } = this.props;

        const userAccount = App.profile.userAccount;
        const members = Member.sort(chat.getMembersSet(App.members), [(x, y) => {
            if (x.account === userAccount) return -1;
            if (y.account === userAccount) return 1;
            const xIsAdmin = chat.isAdmin(x);
            const yIsAdmin = chat.isAdmin(y);
            if (xIsAdmin && !yIsAdmin) return -1;
            if (yIsAdmin && !xIsAdmin) return 1;
            return 0;
        }, 'status', 'namePinyin', '-id']);

        let onlineCount = 0;
        members.forEach(member => {
            if (member.isOnline) {
                onlineCount += 1;
            }
        });

        return (<div
            {...other}
            className={HTML.classes('app-chat-sidebar-peoples has-padding', className)}
        >

            <MemberList
                onItemClick={handleMemberItemClick}
                onItemContextMenu={this.handleItemContextMenu}
                contentRender={this.handleItemRender}
                className="white rounded compact"
                members={members}
                listItemProps={{avatarSize: 20}}
                heading={<header className="heading divider">
                    <div className="title small text-gray">{onlineCount}/{members.length}</div>
                    <nav className="nav">{chat.canInvite(App.user) && <a onClick={this.handleInviteBtnClick}><Icon name="account-multiple-plus" /> &nbsp;{Lang.string('chat.invite')}</a>}</nav>
                </header>}
            />
            {children}
        </div>);
    }
}
