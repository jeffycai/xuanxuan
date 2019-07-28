import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import App from '../../core';
import Lang from '../../core/lang';
import {showContextMenu} from '../../core/context-menu';
import Icon from '../../components/icon';
import GroupList from '../../components/group-list';
import _ChatListItem from './chat-list-item';
import withReplaceView from '../with-replace-view';

/**
 * ChatListItem 可替换组件形式
 * @type {Class<ChatListItem>}
 * @private
 */
const ChatListItem = withReplaceView(_ChatListItem);

/**
 * MenuGroupList 组件 ，显示讨论组列表界面
 * @class MenuGroupList
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MenuGroupList from './menu-group-list';
 * <MenuGroupList />
 */
export default class MenuGroupList extends Component {
    /**
     * MenuGroupList 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MenuGroupList
     */
    static replaceViewPath = 'chats/MenuGroupList';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MenuGroupList
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
     * @memberof MenuGroupList
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
     * React 组件构造函数，创建一个 MenuGroupList 组件实例，会在装配之前被调用。
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
            dragging: false,
            dropTarget: null
        };
    }

    /**
     * 处理讨论组右键菜单事件
     * @param {Event} event 事件对象
     * @memberof MenuGroupList
     * @private
     * @return {void}
     */
    handleItemContextMenu(event) {
        const chat = App.im.chats.get(event.currentTarget.attributes['data-gid'].value);
        showContextMenu('chat.menu', {
            event,
            chat,
            menuType: 'groups',
            viewType: 'category'
        });
    }

    /**
     * 检查列表条目是否为分组
     *
     * @param {Object} item 列表条目
     * @memberof MenuGroupList
     * @returns {boolean} 如果返回 `true` 则为是分组，否则为不是分组
     * @private
     */
    checkIsGroup = item => {
        return item.list && item.entityType !== 'Chat';
    };

    /**
     * 渲染讨论组列表聊天条目
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
        showContextMenu('chat.group', {group, event, type: 'group'});
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
        if (!this.state.dropTarget || this.state.dropTarget.id !== group.id) {
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
            App.user.config.groupsCategories = categories;
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
        const {dragging, dropTarget} = this.state;
        const isDragging = dropTarget && dragging && dropTarget.id === group.id && dragging.id !== group.id;
        const dragClasses = {
            'is-dragging': isDragging,
            'drop-top': isDragging && dropTarget.order < dragging.order,
            'drop-bottom': isDragging && dropTarget.order > dragging.order,
        };
        return (<header
            onContextMenu={this.handleHeadingContextMenu.bind(this, group)}
            onClick={groupList.props.toggleWithHeading ? groupList.handleHeadingClick : null}
            className={classes('heading', dragClasses)}
            draggable
            onDragOver={this.handleDragOver.bind(this, group)}
            onDrop={this.handleDrop.bind(this, group)}
            onDragStart={this.handleDragStart.bind(this, group)}
            onDragEnd={this.handleDragEnd.bind(this, group)}
        >
            {iconView}
            <div className="title strong">{group.title || Lang.string('chats.menu.group.other')} ({group.list.length})</div>
        </header>);
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
        return group.list && !!group.list.find(item => {
            let isExpand = App.im.ui.isActiveChat(item.gid);
            if (!isExpand) {
                isExpand = App.profile.userConfig.getChatMenuGroupState('groups', this.groupType, group.id);
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
        App.profile.userConfig.setChatMenuGroupState('groups', this.groupType, group.id, expanded);
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MenuGroupList
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
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

        const chats = App.im.chats.getGroups(true, 'category');
        this.groupChats = chats;

        return (<div className={classes('app-chats-menu-list app-chat-group-list list scroll-y', className)} {...other}>
            {
                GroupList.render(chats, {
                    defaultExpand: this.defaultExpand,
                    itemCreator: this.itemCreator,
                    headingCreator: this.headingCreator,
                    hideEmptyGroup: true,
                    checkIsGroup: this.checkIsGroup,
                    onExpandChange: this.onExpandChange,
                    forceCollapse: !!this.state.dragging,
                    showMoreText: Lang.string('common.clickShowMoreFormat'),
                })
            }
            {children}
        </div>);
    }
}
