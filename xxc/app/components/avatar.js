import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {rem, classes} from '../utils/html-helper';
import Skin from '../utils/skin';
import Icon from './icon';
import Image from './image';

/**
 * Avatar 组件 ，显示一个头像
 * @class Avatar
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example <caption>使用图片创建头像</caption>
 * <Avatar image="http://example.com/user-avatar.png" />
 *
 * @example <caption>使用文本创建头像</caption>
 * <Avatar label="福" />
 *
 * @example <caption>应用 skin 外观</caption>
 * <Avatar label="福" skin="23" />
 *
 * @example <caption>应用尺寸</caption>
 * <Avatar label="福" size="48" />
 */
export default class Avatar extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof Avatar
     * @type {Object}
     */
    static propTypes = {
        auto: PropTypes.any,
        skin: PropTypes.any,
        image: PropTypes.any,
        icon: PropTypes.any,
        label: PropTypes.any,
        size: PropTypes.number,
        iconSize: PropTypes.number,
        className: PropTypes.string,
        foreColor: PropTypes.string,
        imageClassName: PropTypes.string,
        iconClassName: PropTypes.string,
        style: PropTypes.object,
        children: PropTypes.any
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof Avatar
     * @static
     */
    static defaultProps = {
        skin: null,
        image: null,
        icon: null,
        label: null,
        size: null,
        iconSize: null,
        foreColor: null,
        className: null,
        imageClassName: null,
        iconClassName: null,
        style: null,
        children: null,
        auto: null,
    }

    /**
     * 创建一个头像组件
     * @param {any} avatar 头像内容
     * @param {any} iconView 图标内容
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     * @memberof Avatar
     */
    static render(avatar, iconView) {
        let avatarView = null;
        if (avatar) {
            if (avatar === true && iconView) {
                avatarView = <Avatar icon={iconView} />;
            } else if (React.isValidElement(avatar)) {
                avatarView = avatar;
            } else if (typeof avatar === 'object') {
                avatarView = <Avatar {...avatar} />;
            } else if (avatar) {
                avatarView = <Avatar auto={avatar} />;
            }
        }
        return avatarView;
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof Avatar
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        let {
            auto,
            skin,
            image,
            icon,
            label,
            size,
            className,
            foreColor,
            imageClassName,
            iconClassName,
            children,
            style,
            iconSize,
            ...other
        } = this.props;

        style = Object.assign(skin ? Skin.style(skin) : {}, style);
        if (size) {
            style.width = rem(size);
            style.height = style.width;

            if (!iconSize) {
                iconSize = Math.floor(size * 0.5);
            }
        }

        if (foreColor) {
            style.color = foreColor;
        }

        if (auto) {
            if (typeof auto === 'string') {
                if (auto.startsWith('mdi-') || auto.startsWith('icon-')) {
                    icon = auto;
                } else if (auto.length === 1) {
                    label = auto;
                } else {
                    image = auto;
                }
            } else {
                icon = auto;
            }
        }

        let imageView = null;
        if (image) {
            if (React.isValidElement(image)) {
                imageView = image;
            } else {
                imageView = <Image alt={image} src={image} className={imageClassName}><Icon name="image-filter-hdr muted" /></Image>;
            }
        }
        let iconView = null;
        if (!image && icon) {
            if (React.isValidElement(icon)) {
                iconView = icon;
            } else {
                iconView = <Icon className={iconClassName} name={icon} size={iconSize} />;
            }
        }
        let labelView = null;
        if (!image && !icon && label) {
            if (React.isValidElement(label)) {
                labelView = label;
            } else {
                labelView = <span className="text">{label}</span>;
            }
        }

        return (
            <div className={classes('avatar', className)} {...other} style={style}>
                {imageView}
                {iconView}
                {labelView}
                {children}
            </div>
        );
    }
}
