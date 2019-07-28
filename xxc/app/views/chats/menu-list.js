import React, {Component} from 'react';
import PropTypes from 'prop-types';
import App from '../../core';
import {showContextMenu} from '../../core/context-menu';
import _MenuContactList from './menu-contact-list';
import _MenuGroupList from './menu-group-list';
import _MenuSearchList from './menu-search-list';
import _MenuRecentList from './menu-recent-list';
import withReplaceView from '../with-replace-view';

/**
 * MenuSearchList 可替换组件形式
 * @type {Class<MenuSearchList>}
 * @private
 */
const MenuSearchList = withReplaceView(_MenuSearchList);

/**
 * MenuRecentList 可替换组件形式
 * @type {Class<MenuRecentList>}
 * @private
 */
const MenuRecentList = withReplaceView(_MenuRecentList);

/**
 * MenuGroupList 可替换组件形式
 * @type {Class<MenuGroupList>}
 * @private
 */
const MenuGroupList = withReplaceView(_MenuGroupList);

/**
 * MenuContactList 可替换组件形式
 * @type {Class<MenuContactList>}
 * @private
 */
const MenuContactList = withReplaceView(_MenuContactList);

/**
 * MenuList 组件 ，显示聊天列表界面
 * @class MenuList
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MenuList from './menu-list';
 * <MenuList />
 */
export default class MenuList extends Component {
    /**
     * MenuList 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MenuList
     */
    static replaceViewPath = 'chats/MenuList';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MenuList
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        search: PropTypes.string,
        filter: PropTypes.string,
        children: PropTypes.any,
        onRequestClearSearch: PropTypes.func,
        activeChatId: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MenuList
     * @static
     */
    static defaultProps = {
        className: null,
        search: null,
        filter: null,
        children: null,
        onRequestClearSearch: null,
        activeChatId: null,
    };

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof MenuList
     * @return {void}
     */
    componentDidMount() {
        this.dataChangeHandler = App.events.onDataChange(data => {
            let needForceUpdate = false;
            if (this.props.search) {
                needForceUpdate = true;
            } else if (this.props.filter === 'groups' && data.chats && Object.keys(data.chats).some(x => data.chats[x].isGroupOrSystem)) {
                needForceUpdate = true;
            } else if (this.props.filter === 'contacts' && ((data.chats && Object.keys(data.chats).some(x => data.chats[x].isOne2One)) || data.members)) {
                needForceUpdate = true;
            } else {
                needForceUpdate = true;
            }
            if (needForceUpdate) {
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
     * @memberof MenuList
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.dataChangeHandler);
    }

    /**
     * 处理聊天右键菜单事件
     * @param {Chat} chat 聊天对象
     * @param {Event} event 事件对象
     * @memberof MenuList
     * @private
     * @return {void}
     */
    handleItemContextMenu = (chat, event) => {
        showContextMenu('chat.menu', {
            event,
            chat,
            menuType: this.props.filter,
            viewType: this.props.filter === 'groups' ? 'category' : ''
        });
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MenuList
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            search,
            filter,
            onRequestClearSearch,
            className,
            children,
            activeChatId,
            ...other
        } = this.props;

        if (search) {
            return <MenuSearchList className={className} search={search} activeChatId={activeChatId} onRequestClearSearch={onRequestClearSearch} {...other} />;
        } else if (filter === 'contacts') {
            return <MenuContactList className={className} filter={filter} activeChatId={activeChatId} {...other} />;
        } else if (filter === 'groups') {
            return <MenuGroupList className={className} filter={filter} activeChatId={activeChatId} {...other} />;
        }
        return <MenuRecentList className={className} filter="recents" activeChatId={activeChatId} {...other} />;
    }
}
