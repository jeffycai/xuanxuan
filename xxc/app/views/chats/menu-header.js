import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import SearchControl from '../../components/search-control';
import Icon from '../../components/icon';
import Lang from '../../core/lang';
import ChatCreateDialog from './chat-create-dialog';

/**
 * MenuHeader 组件 ，显示聊天菜单头部界面
 * @class MenuHeader
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MenuHeader from './menu-header';
 * <MenuHeader />
 */
export default class MenuHeader extends Component {
    /**
     * MenuHeader 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MenuHeader
     */
    static replaceViewPath = 'chats/MenuHeader';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MenuHeader
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        onSearchChange: PropTypes.func,
        onSearchFocus: PropTypes.func,
        children: PropTypes.any,
        defaultSearch: PropTypes.string,
        filter: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MenuHeader
     * @static
     */
    static defaultProps = {
        className: null,
        onSearchChange: null,
        onSearchFocus: null,
        children: null,
        defaultSearch: '',
        filter: null
    };

    /**
     * 处理创建聊天按钮点击事件
     * @param {Event} event 事件对象
     * @memberof MenuHeader
     * @private
     * @return {void}
     */
    handleCreateBtnClick = () => {
        ChatCreateDialog.show();
    }

    /**
     * 清除聊天搜索关键字
     * @memberof MenuHeader
     * @return {void}
     */
    clearSearch() {
        this.searchControl.setValue('');
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MenuHeader
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            className,
            children,
            onSearchChange,
            onSearchFocus,
            defaultSearch,
            filter,
            ...other
        } = this.props;

        return (<div className={HTML.classes('app-chats-menu-header', className)} {...other}>
            <SearchControl
                ref={e => {this.searchControl = e;}}
                hotkeyScope="chatsMenuSearch"
                onFocusChange={onSearchFocus}
                defaultValue={defaultSearch}
                className="app-chats-search"
                onSearchChange={onSearchChange}
                placeholder={Lang.string('chats.search.recents')}
            />
            <div className="app-chats-create-btn hint--bottom" data-hint={Lang.string('chats.create.label')}>
                <button type="button" className="btn rounded iconbutton" onClick={this.handleCreateBtnClick}><Icon name="comment-plus-outline" className="icon-2x" /></button>
            </div>
            {children}
        </div>);
    }
}
