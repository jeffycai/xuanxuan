import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import _UserAvatar from './user-avatar';
import _StatusDot from './status-dot';
import Member from '../../core/models/member';
import withReplaceView from '../with-replace-view';

/**
 * StatusDot 可替换组件形式
 * @type {Class<StatusDot>}
 * @private
 */
const StatusDot = withReplaceView(_StatusDot);

/**
 * UserAvatar 可替换组件形式
 * @type {Class<UserAvatar>}
 * @private
 */
const UserAvatar = withReplaceView(_UserAvatar);

/**
 * MemberListItem 组件 ，显示成员列表条目界面
 * @class MemberListItem
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MemberListItem from './member-list-item';
 * <MemberListItem />
 */
export default class MemberListItem extends Component {
    /**
     * MemberListItem 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MemberListItem
     */
    static replaceViewPath = 'common/MemberListItem';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MemberListItem
     * @type {Object}
     */
    static propTypes = {
        member: PropTypes.instanceOf(Member).isRequired,
        avatarSize: PropTypes.number,
        showStatusDot: PropTypes.bool,
        className: PropTypes.string,
        avatarClassName: PropTypes.string,
        title: PropTypes.any,
        children: PropTypes.any,
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MemberListItem
     * @static
     */
    static defaultProps = {
        avatarSize: 30,
        showStatusDot: true,
        className: 'flex-middle',
        avatarClassName: null,
        title: null,
        children: null,
    };

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof MemberListItem
     */
    shouldComponentUpdate(nextProps) {
        return nextProps.children !== this.props.children || nextProps.className !== this.props.className || nextProps.avatarSize !== this.props.avatarSize || nextProps.showStatusDot !== this.props.showStatusDot || nextProps.avatarClassName !== this.props.avatarClassName || nextProps.title !== this.props.title || nextProps.member !== this.props.member || nextProps.member.updateId !== this.lastMemberUpdateId;
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MemberListItem
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            member,
            avatarSize,
            avatarClassName,
            showStatusDot,
            className,
            children,
            title,
            ...other
        } = this.props;

        this.lastMemberUpdateId = member.updateId;

        let titleView = null;
        if (title) {
            if (React.isValidElement(title)) {
                titleView = title;
            } else {
                titleView = <div className="title">{title}</div>;
            }
        } else {
            titleView = <div className="title">{member.displayName}</div>;
        }

        return (
            <a
                {...other}
                className={classes('app-member-list-item item', className)}
            >
                <UserAvatar className={avatarClassName} size={avatarSize} user={member} />
                {showStatusDot && <StatusDot status={member.status} />}
                {titleView}
                {children}
            </a>
        );
    }
}
