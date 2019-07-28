import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../utils/html-helper';
import Avatar from './avatar';

/**
* AppAvatar 组件 ，显示一个应用图标
* @class AppAvatar
* @see https://react.docschina.org/docs/components-and-props.html
* @extends {PureComponent}
* @example <caption>导入组件</caption>
* import AppAvatar from './components/app-avatar';
* @example
* <AppAvatar />
* @reactProps {string|Object|ReactNode} avatar 头像或者用于创建头像的值
* @reactProps {string|ReactNode} label 应用名称
* @reactProps {string} className CSS 类名
* @reactProps {string} children 子组件
*/
export default class AppAvatar extends PureComponent {
    /**
    * React 组件属性类型检查
    * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
    * @static
    * @memberof AppAvatar
    * @return {Object}
    */
    static propTypes = {
        avatar: PropTypes.any,
        label: PropTypes.any,
        className: PropTypes.string,
        children: PropTypes.any
    }

    /**
    * React 组件默认属性
    * @see https://react.docschina.org/docs/react-component.html#defaultprops
    * @type {object}
    * @memberof AppAvatar
    * @static
    */
    static defaultProps = {
        avatar: null,
        label: null,
        className: null,
        children: null,
    }

    /**
    * React 组件生命周期函数：Render
    * @private
    * @see https://doc.react-china.org/docs/react-component.html#render
    * @see https://doc.react-china.org/docs/rendering-elements.html
    * @memberof AppAvatar
    * @return {ReactNode|string|number|null|boolean} React 渲染内容
    */
    render() {
        const {
            avatar,
            label,
            className,
            children,
            ...other
        } = this.props;

        let avatarView = null;
        if (React.isValidElement(avatar)) {
            avatarView = avatar;
        } else if (typeof avatar === 'object') {
            avatarView = <Avatar {...avatar} />;
        } else {
            avatarView = <Avatar auto={avatar} />;
        }

        let labelView = null;
        if (React.isValidElement(label)) {
            labelView = label;
        } else {
            labelView = <div className="text">{label}</div>;
        }

        return (
            <a
                className={classes('app-avatar', className)}
                {...other}
            >
                {avatarView}
                {labelView}
                {children}
            </a>
        );
    }
}
