import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import Member from '../../core/models/member';
import _MemberListItem from './member-list-item';
import ListItem from '../../components/list-item';
import Lang from '../../core/lang';
import App from '../../core';
import Config from '../../config';
import withReplaceView from '../with-replace-view';

/**
 * MemberListItem 可替换组件形式
 * @type {Class<MemberListItem>}
 * @private
 */
const MemberListItem = withReplaceView(_MemberListItem);

/**
 * MemberList 组件 ，显示成员列表界面
 * @class MemberList
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MemberList from './member-list';
 * <MemberList />
 */
export default class MemberList extends Component {
    /**
     * MemberList 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MemberList
     */
    static replaceViewPath = 'common/MemberList';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MemberList
     * @type {Object}
     */
    static propTypes = {
        members: PropTypes.arrayOf(PropTypes.instanceOf(Member)).isRequired,
        listItemProps: PropTypes.object,
        onItemClick: PropTypes.func,
        onItemContextMenu: PropTypes.func,
        itemRender: PropTypes.func,
        contentRender: PropTypes.func,
        className: PropTypes.string,
        avatarClassName: PropTypes.string,
        heading: PropTypes.any,
        startPageSize: PropTypes.number,
        morePageSize: PropTypes.number,
        defaultPage: PropTypes.number,
        eventBindObject: PropTypes.object,
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MemberList
     * @static
     */
    static defaultProps = {
        listItemProps: null,
        onItemClick: null,
        onItemContextMenu: null,
        className: null,
        avatarClassName: null,
        itemRender: null,
        contentRender: null,
        heading: null,
        startPageSize: Config.ui['page.start.size'] || 20,
        morePageSize: Config.ui['page.more.size'] || 20,
        defaultPage: 1,
        eventBindObject: null
    };

    /**
     * React 组件构造函数，创建一个 MemberList 组件实例，会在装配之前被调用。
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
        this.state = {page: props.defaultPage};
    }

    /**
     * 处理请求显示更多列表条目事件
     * @memberof MemberList
     * @private
     * @return {void}
     */
    handleRequestMorePage = () => {
        this.setState({page: this.state.page + 1});
    };

    /**
     * 处理列表条目点击事件
     * @param {Event} e 事件对象
     * @memberof MemberList
     * @private
     * @return {void}
     */
    handleOnItemClick = e => {
        const {onItemClick, eventBindObject} = this.props;
        if (onItemClick) {
            const member = App.members.get(e.currentTarget.attributes['data-id'].value);
            onItemClick.call(eventBindObject, member, e);
        }
    };

    /**
     * 处理显示条目右键菜单事件
     * @param {Event} e 事件对象
     * @memberof MemberList
     * @private
     * @return {void}
     */
    handleOnItemContextMenu = e => {
        const {onItemContextMenu, eventBindObject} = this.props;
        if (onItemContextMenu) {
            const member = App.members.get(e.currentTarget.attributes['data-id'].value);
            onItemContextMenu.call(eventBindObject, member, e);
        }
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MemberList
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            members,
            className,
            listItemProps,
            itemRender,
            onItemClick,
            onItemContextMenu,
            avatarClassName,
            heading,
            startPageSize,
            morePageSize,
            defaultPage,
            contentRender,
            eventBindObject,
            ...other
        } = this.props;

        const listViews = [];
        const {page} = this.state;
        const maxIndex = page ? Math.min(members.length, startPageSize + (page > 1 ? (page - 1) * morePageSize : 0)) : members.length;
        for (let i = 0; i < maxIndex; i += 1) {
            const member = members[i];
            if (itemRender) {
                listViews.push(itemRender(member));
            } else {
                let itemProps = null;
                if (typeof listItemProps === 'function') {
                    itemProps = listItemProps(member);
                } else {
                    itemProps = listItemProps;
                }
                listViews.push(<MemberListItem data-id={member.id} avatarClassName={avatarClassName} onContextMenu={this.handleOnItemContextMenu} onClick={this.handleOnItemClick} {...itemProps} key={member.account} member={member}>{contentRender && contentRender(member)}</MemberListItem>);
            }
        }
        const notShowCount = members.length - maxIndex;
        if (notShowCount) {
            listViews.push(<ListItem key="showMore" icon="chevron-double-down" className="flex-middle item muted" title={<span className="title small">{Lang.format('common.clickShowMoreFormat', notShowCount)}</span>} onClick={this.handleRequestMorePage} />);
        }

        return (<div
            {...other}
            className={HTML.classes('app-member-list list', className)}
        >
            {heading}
            {listViews}
        </div>);
    }
}
