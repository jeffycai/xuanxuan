/* eslint-disable react/sort-comp */
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../utils/html-helper';
import Icon from './icon';
import Heading from './heading';
import ListItem from './list-item';
import Config from '../config';
import {formatString} from '../utils/string-helper';

/**
 * GroupList 组件 ，显示一个分组列表
 * @class GroupList
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <GroupList />
 */
export default class GroupList extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof GroupList
     * @type {Object}
     */
    static propTypes = {
        headingCreator: PropTypes.func,
        checkIsGroup: PropTypes.func,
        itemCreator: PropTypes.func,
        onExpandChange: PropTypes.func,
        group: PropTypes.object,
        className: PropTypes.string,
        children: PropTypes.any,
        defaultExpand: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
        toggleWithHeading: PropTypes.bool,
        forceCollapse: PropTypes.bool,
        hideEmptyGroup: PropTypes.bool,
        collapseIcon: PropTypes.string,
        expandIcon: PropTypes.string,
        startPageSize: PropTypes.number,
        morePageSize: PropTypes.number,
        defaultPage: PropTypes.number,
        showMoreText: PropTypes.node,
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof GroupList
     * @static
     */
    static defaultProps = {
        headingCreator: null,
        itemCreator: null,
        group: null,
        className: null,
        children: null,
        defaultExpand: true,
        toggleWithHeading: true,
        collapseIcon: 'chevron-right',
        expandIcon: 'chevron-down',
        hideEmptyGroup: true,
        checkIsGroup: null,
        onExpandChange: null,
        forceCollapse: false,
        startPageSize: Config.ui['page.start.size'] || 20,
        morePageSize: Config.ui['page.more.size'] || 20,
        defaultPage: 1,
        showMoreText: ''
    }

    /**
     * 渲染一个分组列表
     * @param {Array.<Object>} list 列表项配置列表
     * @param {Object} props 组件属性
     * @param {number} page 页码
     * @param {Function?} onRequestMore 当点击更多时的回调函数
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     * @static
     * @memberof GroupList
     */
    static render(list, props, page = 0, onRequestMore = null) {
        const listViews = [];
        props = Object.assign({}, GroupList.defaultProps, props);
        const maxIndex = page ? Math.min(list.length, props.startPageSize + (page > 1 ? (page - 1) * props.morePageSize : 0)) : list.length;
        for (let i = 0; i < maxIndex; ++i) {
            const item = list[i];
            if ((props.checkIsGroup && props.checkIsGroup(item)) || (!props.checkIsGroup && (item.type === 'group' || item.list))) {
                if (props.hideEmptyGroup && (!item.list || !item.list.length)) {
                    continue;
                }
                listViews.push(<GroupList
                    key={item.key || `id-${item.id}` || `idx-${i}`}
                    group={(props && props.listConverter) ? props.listConverter(item) : item}
                    itemCreator={props && props.itemCreator}
                    className={props && props.className}
                    toggleWithHeading={props && props.toggleWithHeading}
                    headingCreator={props && props.headingCreator}
                    defaultExpand={props && props.defaultExpand}
                    expandIcon={props && props.expandIcon}
                    collapseIcon={props && props.collapseIcon}
                    hideEmptyGroup={props && props.hideEmptyGroup}
                    checkIsGroup={props && props.checkIsGroup}
                    forceCollapse={props && props.forceCollapse}
                    onExpandChange={props && props.onExpandChange}
                    startPageSize={props && props.startPageSize}
                    morePageSize={props && props.morePageSize}
                    defaultPage={props && props.defaultPage}
                    showMoreText={props && props.showMoreText}
                />);
            } else if (props && props.itemCreator) {
                listViews.push(props.itemCreator(item, i));
            } else {
                listViews.push(<ListItem key={item.key || item.id || i} {...item} />);
            }
        }
        const notShowCount = list.length - maxIndex;
        if (notShowCount) {
            const showMoreText = (props && props.showMoreText) ? formatString(props.showMoreText, notShowCount) : '...';
            listViews.push(<ListItem key="showMore" icon="chevron-double-down" className="flex-middle item muted" title={<span className="title small">{showMoreText}</span>} onClick={onRequestMore} />);
        }
        return listViews;
    }

    /**
     * React 组件构造函数，创建一个 GroupList 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        let {defaultExpand} = props;
        if (typeof defaultExpand === 'function') {
            defaultExpand = defaultExpand(props.group, this);
        }
        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {
            expand: defaultExpand,
            page: props.defaultPage
        };
    }

    /**
     * 切换展开或折叠分组
     * @param {?bool} expand 如果设置为 true，则展开分组，如果为 false，则折叠分组，否则自动切换
     * @param {?Function} callback 操作完成时的回调函数
     * @memberof GroupList
     * @return {void}
     */
    toggle(expand, callback) {
        if (expand === undefined) {
            expand = !this.state.expand;
        }
        this.setState({expand}, () => {
            const {onExpandChange, group} = this.props;
            if (onExpandChange) {
                onExpandChange(expand, group);
            }
            if (callback) {
                callback(expand, group);
            }
        });
    }

    /**
     * 展开分组
     * @param {?Function} callback 操作完成时的回调函数
     * @memberof GroupList
     * @return {void}
     */
    expand(callback) {
        this.toggle(true, callback);
    }

    /**
     * 折叠分组
     * @param {?Function} callback 操作完成时的回调函数
     * @memberof GroupList
     * @return {void}
     */
    collapse(callback) {
        this.toggle(false, callback);
    }

    /**
     * 处理分组标题点击事件
     * @param {Event} e 事件对象
     * @memberof GroupList
     * @private
     * @return {void}
     */
    handleHeadingClick = e => {
        this.toggle();
    }

    /**
     * 检查是否展开
     * @type {boolean}
     * @memberof GroupList
     */
    get isExpand() {
        return !this.props.forceCollapse && this.state.expand;
    }

    /**
     * 处理请求显示更多列表项事件
     * @memberof GroupList
     * @private
     * @return {void}
     */
    handleRequestMorePage = () => {
        this.setState({page: this.state.page + 1});
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof GroupList
     * @return {ReactNode}
     */
    render() {
        const {
            forceCollapse,
            headingCreator,
            hideEmptyGroup,
            checkIsGroup,
            itemCreator,
            group,
            toggleWithHeading,
            defaultExpand,
            expandIcon,
            collapseIcon,
            onExpandChange,
            className,
            children,
            startPageSize,
            morePageSize,
            defaultPage,
            showMoreText,
            ...other
        } = this.props;

        const {
            title,
            list,
            root,
        } = group;

        if (root) {
            return (
                <div className={classes('app-group-list-root group-list-root list', className)} {...other}>
                    {GroupList.render(list, this.props, this.state.page, this.handleRequestMorePage)}
                </div>
            );
        }

        const expand = this.isExpand;

        let headingView = null;
        if (headingCreator) {
            headingView = headingCreator(group, this);
        } else if (title) {
            if (React.isValidElement(title)) {
                headingView = title;
            } else if (typeof title === 'object') {
                headingView = <Heading {...title} />;
            } else if (title) {
                const icon = expand ? expandIcon : collapseIcon;
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
                headingView = (
                    <header onClick={toggleWithHeading ? this.handleHeadingClick : null} className="heading">
                        {iconView}
                        <div className="title">{title}</div>
                    </header>
                );
            }
        }

        return (
            <div
                className={classes('app-group-list group-list list', className, {'is-expand': expand, 'is-collapse': !expand})}
                {...other}
            >
                {headingView}
                {expand && list && GroupList.render(list, this.props, this.state.page, this.handleRequestMorePage)}
                {children}
            </div>
        );
    }
}
