import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import _UserAvatar from './user-avatar';
import withReplaceView from '../with-replace-view';

/**
 * UserAvatar 可替换组件形式
 * @type {Class<UserAvatar>}
 * @private
 */
const UserAvatar = withReplaceView(_UserAvatar);

/**
 * UserListItem 组件 ，显示用户列表条目界面
 * @class UserListItem
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import UserListItem from './user-list-item';
 * <UserListItem />
 */
export default class UserListItem extends Component {
    /**
     * UserListItem 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof UserListItem
     */
    static replaceViewPath = 'common/UserListItem';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof UserListItem
     * @type {Object}
     */
    static propTypes = {
        user: PropTypes.object.isRequired,
        className: PropTypes.string,
        avatarSize: PropTypes.number,
        avatarClassName: PropTypes.string,
        children: PropTypes.any,
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof UserListItem
     * @static
     */
    static defaultProps = {
        avatarSize: 30,
        className: 'flex-middle',
        avatarClassName: null,
        children: null,
    };

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof UserListItem
     */
    shouldComponentUpdate(nextProps) {
        return nextProps.children !== this.props.children || nextProps.className !== this.props.className || nextProps.avatarSize !== this.props.avatarSize || nextProps.avatarClassName !== this.props.avatarClassName || nextProps.user !== this.props.user || nextProps.user.account !== this.props.user.account || nextProps.user.avatar !== this.props.user.avatar || nextProps.user.realname !== this.props.user.realname || nextProps.user.server !== this.props.user.server;
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof UserListItem
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            user,
            avatarSize,
            avatarClassName,
            className,
            children,
            ...other
        } = this.props;

        return (<a
            {...other}
            className={HTML.classes('app-user-list-item item', className)}
        >
            <UserAvatar className={avatarClassName} size={avatarSize} user={user} />
            <div className="content">
                <div className="title">{user.displayName} <small className="muted">@{user.account}</small></div>
                <div className="subtitle">{user.serverUrl}</div>
            </div>
            {children}
        </a>);
    }
}
