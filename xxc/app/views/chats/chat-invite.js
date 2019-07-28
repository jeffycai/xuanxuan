import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import StringHelper from '../../utils/string-helper';
import SearchControl from '../../components/search-control';
import Messager from '../../components/messager';
import Lang from '../../core/lang';
import App from '../../core';
import _MemberList from '../common/member-list';
import ROUTES from '../common/routes';
import withReplaceView from '../with-replace-view';

/**
 * MemberList 可替换组件形式
 * @type {Class<MemberList>}
 * @private
 */
const MemberList = withReplaceView(_MemberList);

/**
 * ChatInvite 组件 ，显示邀请其他成员加入聊天界面
 * @class ChatInvite
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatInvite from './chat-invite';
 * <ChatInvite />
 */
export default class ChatInvite extends Component {
    /**
     * ChatInvite 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatInvite
     */
    static replaceViewPath = 'chats/ChatInvite';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatInvite
     * @type {Object}
     */
    static propTypes = {
        chat: PropTypes.object,
        className: PropTypes.string,
        children: PropTypes.any,
        onRequestClose: PropTypes.func,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatInvite
     * @static
     */
    static defaultProps = {
        chat: null,
        className: null,
        children: null,
        onRequestClose: null,
    };

    /**
     * React 组件构造函数，创建一个 ChatInvite 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {
            choosed: {},
            search: '',
        };
    }

    /**
     * 处理搜索框变更事件
     *
     * @param {string} search 搜索字符串
     * @private
     * @memberof ChatInvite
     * @return {void}
     */
    handleSearchChange = search => {
        this.setState({search});
    };

    /**
     * 处理成员点击事件
     * @param {Member} member 成员
     * @memberof ChatInvite
     * @private
     * @return {void}
     */
    handleMemberItemClick(member) {
        const {choosed} = this.state;
        if (choosed[member.id]) {
            delete choosed[member.id];
        } else {
            choosed[member.id] = member;
        }
        this.setState({choosed});
    }

    /**
     * 处理请求关闭父级对话框
     * @private
     * @return {void}
     * @memberof ChatInvite
     */
    requestClose() {
        if (this.props.onRequestClose) {
            this.props.onRequestClose();
        }
    }

    /**
     * 处理邀请按钮点击事件
     * @param {Event} e 事件对象
     * @memberof ChatInvite
     * @private
     * @return {void}
     */
    handleInviteBtnClick = e => {
        const {chat} = this.props;
        const {choosed} = this.state;
        const members = Object.keys(choosed).map(memberId => choosed[memberId]);
        if (chat.isOne2One) {
            members.push(...chat.getMembersSet(App.members));
            App.im.ui.createGroupChat(members).then(newChat => {
                const groupUrl = `#${ROUTES.chats.groups.id(newChat.gid)}`;
                this.requestClose();
                App.im.server.sendBoardChatMessage(Lang.format('chat.inviteAndCreateNewChat.format', `@${App.profile.user.account}`, `[**[${newChat.getDisplayName(App)}](${groupUrl})**]`), chat);
                window.location.hash = groupUrl;
            }).catch(error => {
                if (error) {
                    Messager.show(Lang.error(error), {type: 'danger'});
                }
            });
        } else {
            App.im.server.inviteMembersToChat(chat, members).then(chat => {
                if (chat) {
                    const broadcast = App.im.server.createBoardChatMessage(Lang.format('chat.inviteMembersJoinChat.format', `@${App.profile.user.account}`, members.map(x => `@${x.account}`).join('、')), chat);
                    App.im.server.sendChatMessage(broadcast, chat);
                }
                this.requestClose();
            }).catch(error => {
                if (error) {
                    Messager.show(Lang.error(error), {type: 'danger'});
                }
            });
        }
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatInvite
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            className,
            children,
            onRequestClose,
            ...other
        } = this.props;

        const {choosed, search} = this.state;
        const choosedItems = [];
        const items = [];
        const keys = StringHelper.isEmpty(search) ? null : search.trim().toLowerCase().split(' ');
        App.members.forEach(member => {
            if (!chat.isMember(member)) {
                if (choosed[member.id]) {
                    choosedItems.push(member);
                } else if (!keys || member.getMatchScore(keys)) {
                    items.push(member);
                }
            }
        }, true);

        return (<div
            {...other}
            className={HTML.classes('app-chat-invite single row outline space', className)}
        >
            <div className="cell column single flex-none gray" style={{width: HTML.rem(150)}}>
                <div className="has-padding-sm flex-none darken">
                    <SearchControl onSearchChange={this.handleSearchChange} />
                </div>
                <MemberList className="flex-auto scroll-y compact" members={items} onItemClick={this.handleMemberItemClick} eventBindObject={this} listItemProps={{avatarSize: 24}} />
            </div>
            <div className="cell column single flex-auto divider-left">
                <div className="heading flex-none primary-pale">
                    <div className="title text-accent flex-auto">{Lang.string('chat.invite.choosed')} ({choosedItems.length})</div>
                    <div className="flex-none has-padding-h"><button type="button" disabled={!choosedItems.length} className="btn primary rounded btn-wide" onClick={this.handleInviteBtnClick}>{Lang.string('chat.invite')}</button></div>
                </div>
                <MemberList className="flex-auto scroll-y compact" members={choosedItems} onItemClick={this.handleMemberItemClick} eventBindObject={this} listItemProps={{avatarSize: 24}} />
            </div>
        </div>);
    }
}
