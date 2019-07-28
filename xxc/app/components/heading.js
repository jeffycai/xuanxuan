import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../utils/html-helper';
import Icon from './icon';
import Avatar from './avatar';

/**
 * Heading 组件 ，显示一个支持带头像或操作的标题
 * @class Heading
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <Heading />
 */
export default class Heading extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof Heading
     * @type {Object}
     */
    static propTypes = {
        avatar: PropTypes.any,
        icon: PropTypes.any,
        title: PropTypes.any,
        children: PropTypes.any,
        nav: PropTypes.any,
        className: PropTypes.string,
        type: PropTypes.string
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof Heading
     * @static
     */
    static defaultProps = {
        avatar: null,
        icon: null,
        title: null,
        children: null,
        nav: null,
        className: null,
        type: 'a',
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof Heading
     * @return {ReactNode}
     */
    render() {
        const {
            type,
            nav,
            avatar,
            icon,
            title,
            children,
            className,
            ...other
        } = this.props;

        let iconView = null;
        if (icon) {
            if (React.isValidElement(icon)) {
                iconView = icon;
            } else if (typeof icon === 'object') {
                iconView = <Icon {...icon} />;
            } else if (icon) {
                iconView = <Icon name={icon} />;
            }
        }

        let avatarView = null;
        if (avatar) {
            if (avatar === true && iconView) {
                avatarView = <Avatar icon={icon} />;
            } else if (React.isValidElement(avatar)) {
                avatarView = avatar;
            } else if (typeof avatar === 'object') {
                avatarView = <Avatar {...avatar} />;
            } else if (avatar) {
                avatarView = <Avatar auto={avatar} />;
            }
        }

        let titleView = null;
        if (title) {
            if (React.isValidElement(title)) {
                titleView = title;
            } else if (title) {
                titleView = <div className="title">{title}</div>;
            }
        }

        return React.createElement(type, {
            className: classes(
                'app-heading',
                className,
            ),
            ...other
        }, avatarView, iconView, titleView, nav, children);
    }
}
