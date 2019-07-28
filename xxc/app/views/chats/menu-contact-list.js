import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import App from '../../core';
import Lang from '../../core/lang';
import {showContextMenu} from '../../core/context-menu';
import Icon from '../../components/icon';
import GroupList from '../../components/group-list';
import Button from '../../components/button';
import _ChatListItem from './chat-list-item';
import _MemberListItem from '../common/member-list-item';
import UserProfileDialog from '../common/user-profile-dialog';
import withReplaceView from '../with-replace-view';

/**
 * ChatListItem 可替换组件形式
 * @type {Class<ChatListItem>}
 * @private
 */
const ChatListItem = withReplaceView(_ChatListItem);

/**
 * MemberListItem 可替换组件形式
 * @type {Class<MemberListItem>}
 * @private
 */
const MemberListItem = withReplaceView(_MemberListItem);

/**
 * MenuContactList 组件 ，显示联系人列表界面
 * @class MenuContactList
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MenuContactList from './menu-contact-list';
 * <MenuContactList />
 */
export default class MenuContactList extends Component {
    /**
     * MenuContactList 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MenuContactList
     */
    static replaceViewPath = 'chats/MenuContactList';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MenuContactList
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        search: PropTypes.string,
        filter: PropTypes.string,
        children: PropTypes.any,
        activeChatId: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MenuContactList
     * @static
     */
    static defaultProps = {
        className: null,
        search: null,
        filter: null,
        children: null,
        activeChatId: null,
    };

    /**
     * React 组件构造函数，创建一个 MenuContactList 组件实例，会在装配之前被调用。
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
            groupType: user ? user.config.contactsGroupByType : 'normal',
            dragging: false,
            dropTarget: null
        };
    }

    /**
     * 获取讨论组类型
     * @memberof MenuContactList
     * @type {string}
     */
    get groupType() {
        // eslint-disable-next-line react/destructuring-assignment
        return this.state.groupType;
    }

    /**
     * 设置讨论组类型
     * @param {string} groupType 讨论组类型
     * @memberof MenuContactList
     */
    set groupType(groupType) {
        this.setState({groupType}, () => {
            const {user} = App;
            if (user) {
                user.config.contactsGroupByType = groupType;
            }
        });
    }

    /**
     * 处理点击个人资料条目事件
     * @memberof MenuContactList
     * @private
     * @return {void}
     */
    handleUserItemClick = () => {
        UserProfileDialog.show();
    };

    /**
     * 处理列表设置按钮点击事件
     * @param {Event} e 事件对象
     * @memberof MenuContactList
     * @private
     * @return {void}
     */
    handleSettingBtnClick = e => {
        /**
         * 讨论组聊天类型表
         * @type {{label: string, data: string}[]}
         * @private
         */
        const GROUP_TYPES = [
            {label: Lang.string('chats.menu.groupType.normal'), data: 'normal'},
            {label: Lang.string('chats.menu.groupType.category'), data: 'category'},
            {label: Lang.string('chats.menu.groupType.role'), data: 'role'},
            {label: Lang.string('chats.menu.groupType.dept'), data: 'dept'},
        ];

        const {groupType} = this;
        const menus = GROUP_TYPES.map(type => ({
            hidden: type.data === 'dept' && !App.members.hasDepts,
            label: type.label,
            data: type.data,
            icon: type.data === groupType ? 'check text-success' : false
        }));
        menus.splice(0, 0, {label: Lang.string('chats.menu.switchView'), disabled: true});
        App.ui.showContextMenu({x: e.clientX, y: e.clientY, target: e.target}, menus, {
            onItemClick: item => {
                if (item && item.data) {
                    this.groupType = item.data;
                }
            }
        });
        e.stopPropagation();
    };

    /**
     * 处理联系人右键菜单事件
     * @param {Event} event 事件对象
     * @memberof MenuContactList
     * @private
     * @return {void}
     */
    handleItemContextMenu = (event) => {
        const chat = App.im.chats.get(event.currentTarget.attributes['data-gid'].value);
        const {groupType} = this;
        showContextMenu('chat.menu', {
            event,
            chat,
            menuType: 'contacts',
            viewType: groupType
        });
    }

    /**
     * 渲染联系人聊天条目
     *
     * @param {Chat} chat 聊天对象
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     * @private
     * @memberof MenuContactList
     */
    itemCreator = chat => {
        const {activeChatId, filter} = this.props;
        return <ChatListItem onContextMenu={this.handleItemContextMenu} data-gid={chat.gid} key={chat.gid} filterType={filter} chat={chat} className={classes('item', {active: activeChatId === chat.gid})} />;
    };

    /**
     * 处理分组标题右键菜单事件
     * @param {Object} group 分组信息
     * @param {Event} event 事件对象
     * @memberof MenuContactList
     * @private
     * @return {void}
     */
    handleHeadingContextMenu(group, event) {
        showContextMenu('chat.group', {group, event});
    }

    /**
     * 处理分组拖放事件
     * @param {Object} group 分组信息
     * @param {Event} e 事件对象
     * @memberof MenuContactList
     * @private
     * @return {void}
     */
    handleDragOver(group, e) {
        const {dropTarget} = this.state;
        if (!dropTarget || dropTarget.id !== group.id) {
            this.setState({dropTarget: group});
        }
    }

    /**
     * 处理分组拖放完成事件
     * @param {Object} group 分组信息
     * @param {Event} e 事件对象
     * @memberof MenuContactList
     * @private
     * @return {void}
     */
    handleDrop(group, e) {
        const {dragging, dropTarget} = this.state;
        if (dragging && dropTarget && dragging.id !== dropTarget.id) {
            if (dropTarget.order < dragging.order) {
                dragging.order = dropTarget.order - 0.5;
            } else if (dropTarget.order > dragging.order) {
                dragging.order = dropTarget.order + 0.5;
            }
            const categories = {};
            this.sortedGroups.sort((x, y) => (x.order - y.order));
            this.sortedGroups.forEach((x, idx) => {
                x.order = idx + 1;
                categories[x.id] = {key: x.key, order: x.order};
            });
            App.user.config.contactsCategories = categories;
        }
        e.stopPropagation();
    }

    /**
     * 处理分组拖放开始事件
     * @param {Object} group 分组信息
     * @param {Event} e 事件对象
     * @memberof MenuContactList
     * @private
     * @return {void}
     */
    handleDragStart(group, e) {
        this.setState({dragging: group});
        this.sortedGroups = this.groupChats;
        e.stopPropagation();
        return true;
    }

    /**
     * 处理分组拖放结束事件
     * @param {Object} group 分组信息
     * @param {Event} e 事件对象
     * @memberof MenuContactList
     * @private
     * @return {void}
     */
    handleDragEnd(group, e) {
        this.setState({dragging: false});
        e.stopPropagation();
        return true;
    }

    /**
     * 创建分组标题条目
     *
     * @param {Object} group 分组信息
     * @param {Object} groupList 分组列表
     * @memberof MenuContactList
     * @private
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    headingCreator = (group, groupList) => {
        const icon = groupList.isExpand ? groupList.props.expandIcon : groupList.props.collapseIcon;
        let iconView = null;
        if (icon) {
            if (React.isValidElement(icon)) {
                iconView = icon;
            } else if (typeof icon === 'object') {
                iconView = <Icon {...icon} />;
            } else {
                iconView = <Icon name={icon} />;
            }
        }
        let countView = null;
        if (!group.list.length) {
            countView = '(0)';
        } else if (!group.onlySubGroup) {
            countView = `(${group.onlineCount || 0}/${group.list.length - (group.dept && group.dept.children ? group.dept.children.length : 0)})`;
        }

        const {dragging, dropTarget} = this.state;
        const isDragging = dropTarget && dragging && dropTarget.id === group.id && dragging.id !== group.id;
        const dragClasses = {
            'is-dragging': isDragging,
            'drop-top': isDragging && dropTarget.order < dragging.order,
            'drop-bottom': isDragging && dropTarget.order > dragging.order,
        };
        return (
            <header
                onContextMenu={this.handleHeadingContextMenu.bind(this, group)}
                draggable={this.groupType === 'category'}
                onDragOver={this.handleDragOver.bind(this, group)}
                onDrop={this.handleDrop.bind(this, group)}
                onDragStart={this.handleDragStart.bind(this, group)}
                onDragEnd={this.handleDragEnd.bind(this, group)}
                onClick={groupList.props.toggleWithHeading ? groupList.handleHeadingClick : null}
                className={classes('heading', dragClasses)}
            >
                {iconView}
                <div className="title"><strong>{group.title || Lang.string('chats.menu.group.other')}</strong> {countView}</div>
            </header>
        );
    };

    /**
     * 判断分组是否默认为展开状态
     *
     * @param {Object} group 分组信息
     * @memberof MenuContactList
     * @returns {boolean} 如果返回 `true` 则为是展开状态，否则为不是展开状态
     * @private
     */
    defaultExpand = (group) => {
        return !!group.list.find(item => {
            if (item.type === 'group') {
                return this.defaultExpand(item);
            }
            let isExpand = App.im.ui.isActiveChat(item.gid);
            if (!isExpand) {
                isExpand = App.profile.userConfig.getChatMenuGroupState('contacts', this.groupType, group.id);
            }
            return isExpand;
        });
    };

    /**
     * 处理分组展开折叠变更事件
     * @param {boolean} expanded 是否展开
     * @param {Object} group 分组信息
     * @memberof MenuContactList
     * @private
     * @return {void}
     */
    onExpandChange = (expanded, group) => {
        App.profile.userConfig.setChatMenuGroupState('contacts', this.groupType, group.id, expanded);
    };

    /**
     * MenuContactList 组件 ，显示MenuContactList界面
     * @class MenuContactList
     * @see https://react.docschina.org/docs/components-and-props.html
     * @extends {Component}
     * @example
     * import MenuContactList from './menu-contact-list';
     * <MenuContactList />
     */
    render() {
        const {
            search,
            filter,
            className,
            children,
            activeChatId,
            ...other
        } = this.props;

        const {dragging} = this.state;
        const {groupType} = this;
        const chats = App.im.chats.getContactsChats('onlineFirst', groupType);
        const {user} = App;
        this.groupChats = chats;

        return (
            <div className={classes('app-chats-menu-list app-contact-list app-chat-group-list list scroll-y', className)} {...other}>
                {user ? (
                    <MemberListItem
                        className="flex-middle app-member-me"
                        member={user}
                        avatarSize={24}
                        showStatusDot={false}
                        onClick={this.handleUserItemClick}
                        title={<div className="title">{user.displayName} &nbsp;{user.role ? <div className="label rounded primary-pale text-gray small member-role-label">{user.getRoleName(App)}</div> : null}</div>}
                    >
                        <div className="btn-wrapper hint--left" data-hint={Lang.string('common.setting')}><Button onClick={this.handleSettingBtnClick} className="iconbutton rounded" icon="format-list-bulleted" /></div>
                    </MemberListItem>
                ) : null}
                <GroupList
                    group={{list: chats, root: true}}
                    defaultExpand={this.defaultExpand}
                    itemCreator={this.itemCreator}
                    headingCreator={this.headingCreator}
                    onExpandChange={this.onExpandChange}
                    hideEmptyGroup={groupType !== 'category'}
                    forceCollapse={!!dragging}
                    showMoreText={Lang.string('common.clickShowMoreFormat')}
                />
                {children}
            </div>
        );
    }
}
