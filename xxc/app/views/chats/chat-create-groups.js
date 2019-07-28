import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes, rem} from '../../utils/html-helper';
import Lang from '../../core/lang';
import App from '../../core';
import Icon from '../../components/icon';
import Avatar from '../../components/avatar';
import SearchControl from '../../components/search-control';
import Messager from '../../components/messager';
import _MemberListItem from '../common/member-list-item';
import ROUTES from '../common/routes';
import _MemberList from '../common/member-list';
import withReplaceView from '../with-replace-view';

/**
 * MemberList 可替换组件形式
 * @type {Class<MemberList>}
 * @private
 */
const MemberList = withReplaceView(_MemberList);

/**
 * MemberListItem 可替换组件形式
 * @type {Class<MemberListItem>}
 * @private
 */
const MemberListItem = withReplaceView(_MemberListItem);
/**
 * ChatCreateGroups 组件 ，显示一个创建讨论组界面
 * @class ChatCreateGroups
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatCreateGroups from './chat-create-groups';
 * <ChatCreateGroups />
 */
export default class ChatCreateGroups extends Component {
    /**
     * ChatCreateGroups 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatCreateGroups
     */
    static replaceViewPath = 'chats/ChatCreateGroups';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatCreateGroups
     * @type {Object}
     */
    static propTypes = {
        onRequestClose: PropTypes.func,
        className: PropTypes.string,
        children: PropTypes.any,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatCreateGroups
     * @static
     */
    static defaultProps = {
        onRequestClose: null,
        className: null,
        children: null,
    };

    /**
     * React 组件构造函数，创建一个 ChatCreateGroups 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);

        const {user} = App;

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {
            choosed: {[user.id]: user},
            search: '',
        };

        /**
         * 全部可以用于创建讨论组的成员
         * @type {Member[]}
         */
        this.members = App.members.query(x => (!x.isDeleted), true);
    }

    /**
     * 处理搜索框变更事件
     * @param {string} search 搜索字符串
     * @memberof ChatCreateGroups
     * @private
     * @return {void}
     */
    handleSearchChange = search => {
        search = search && search.toLowerCase();
        this.setState({search});
    }

    /**
     * 处理选择全部按钮点击事件
     * @memberof ChatCreateGroups
     * @private
     * @return {void}
     */
    handleSelectAllClick = () => {
        const {choosed} = this.state;
        this.members.forEach(member => {
            choosed[member.id] = member;
        });
        this.setState({choosed});
    }

    /**
     * 处理反选按钮点击事件
     * @memberof ChatCreateGroups
     * @private
     * @return {void}
     */
    handleSelectInverseClick = () => {
        const {choosed} = this.state;
        const {userId} = App.profile;
        this.members.forEach(member => {
            if (member.id !== userId) {
                if (choosed[member.id]) {
                    delete choosed[member.id];
                } else {
                    choosed[member.id] = member;
                }
            }
        });
        this.setState({choosed});
    }

    /**
     * 处理创建聊天按钮点击事件
     * @memberof ChatCreateGroups
     * @private
     * @return {void}
     */
    handleCreateBtnClick = () => {
        const members = Object.keys(this.state.choosed);
        if (members.length <= 2) {
            window.location.hash = `#${ROUTES.chats.contacts.id(App.im.chats.getOne2OneChatGid(members))}`;
            if (this.props.onRequestClose) {
                this.props.onRequestClose();
            }
        } else {
            App.im.ui.createGroupChat(members).then(newChat => {
                if (newChat) {
                    window.location.hash = `#${ROUTES.chats.groups.id(newChat.gid)}`;
                }
                if (this.props.onRequestClose) {
                    this.props.onRequestClose();
                }
            }).catch(error => {
                if (error) {
                    Messager.show(Lang.error(error));
                }
            });
        }
    }

    /**
     * 处理成员点击事件
     * @memberof ChatCreateGroups
     * @param {Member} member 成员
     * @private
     * @return {void}
     */
    handleMemberItemClick(member) {
        if (member.id === App.profile.userId) {
            Messager.show(Lang.string('chat.create.mustInclueYourself'), {type: 'warning', autoHide: true});
        } else {
            const {choosed} = this.state;
            if (choosed[member.id]) {
                delete choosed[member.id];
            } else {
                choosed[member.id] = member;
            }
            this.setState({choosed});
        }
    }

    /**
     * 判断成员是否匹配搜索关键字
     *
     * @param {Member} member 成员
     * @return {boolean} 如果返回 `true` 则表示给定的成员匹配搜索关键字
     * @memberof ChatCreateGroups
     * @private
     */
    isMatchSearch(member) {
        const {search} = this.state;
        if (!search.length) {
            return true;
        }
        const account = member.account && member.account.toLowerCase();
        const realname = member.realname && member.realname.toLowerCase();
        return account.includes(search) || realname.includes(search) || member.id === search;
    }

    /**
     * 判断成员是否选中
     *
     * @param {Member} member 成员
     * @return {boolean} 如果返回 `true` 则表示给定的成员已选中
     * @memberof ChatCreateGroups
     * @private
     */
    isChoosed(member) {
        // eslint-disable-next-line react/destructuring-assignment
        return member.id === App.profile.userId || !!this.state.choosed[member.id];
    }

    /**
     * 渲染成员条目界面
     *
     * @param {Member} member 成员
     * @return {ReactNode|null} React 组件渲染内容
     * @memberof ChatCreateGroups
     * @private
     */
    renderMemberItem = member => {
        if (this.isMatchSearch(member)) {
            const isChoosed = this.isChoosed(member);
            return <MemberListItem className={isChoosed ? 'primary-pale' : ''} onClick={this.handleMemberItemClick.bind(this, member)} key={member.id} member={member}>{isChoosed && <Icon name="check text-success" />}</MemberListItem>;
        }
        return null;
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatCreateGroups
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            children,
            onRequestClose,
            ...other
        } = this.props;

        const {choosed, search} = this.state;

        const choosedCount = Object.keys(choosed).length;
        let theOtherOne = null;
        if (choosedCount === 2) {
            const userId = `${App.profile.userId}`;
            const otherOneId = Object.keys(choosed).find(x => x !== userId);
            theOtherOne = choosed[otherOneId];
        }

        return (
            <div
                {...other}
                className={classes('app-chat-create-groups column single', className)}
            >
                <div className="list-item divider flex-none">
                    <Avatar icon="arrow-right" iconClassName="text-muted icon-2x" />
                    <div className="title">{Lang.string('chat.create.groupsTip')}</div>
                    <div className="flex-none">
                        <button type="button" onClick={this.handleCreateBtnClick} disabled={choosedCount < 2} className="btn primary rounded">{choosedCount < 2 ? Lang.string('chat.create.title') : choosedCount === 2 ? Lang.format('chat.create.chatWith.format', theOtherOne.displayName) : Lang.format('chat.create.group.format', choosedCount)}</button>
                    </div>
                </div>
                <div className="white cell">
                    <div className="column single">
                        <div className="cell heading flex-none has-padding">
                            <nav className="flex-auto">
                                <a className="btn text-primary rounded" onClick={this.handleSelectAllClick}>{Lang.string('common.selectAll')}</a>
                                <a className="btn text-primary rounded" onClick={this.handleSelectInverseClick}>{Lang.string('common.selectInverse')}</a>
                            </nav>
                            <SearchControl defaultValue={search} onSearchChange={this.handleSearchChange} className="flex-none" style={{width: rem(200)}} />
                        </div>
                        <div className="cell scroll-y has-padding-sm">
                            <MemberList className="fluid compact app-chat-create-groups-member-list" members={this.members} itemRender={this.renderMemberItem} />
                        </div>
                    </div>
                </div>
                {children}
            </div>
        );
    }
}
