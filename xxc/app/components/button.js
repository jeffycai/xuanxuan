import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../utils/html-helper';
import Skin from '../utils/skin';
import Icon from './icon';

/**
 * Button 组件 ，显示一个按钮
 * @class Button
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <Button />
 */
export default class Button extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof Button
     * @type {Object}
     */
    static propTypes = {
        skin: PropTypes.any,
        icon: PropTypes.string,
        label: PropTypes.any,
        className: PropTypes.string,
        style: PropTypes.object,
        children: PropTypes.any,
        btnClass: PropTypes.string,
        type: PropTypes.string
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof Button
     * @static
     */
    static defaultProps = {
        skin: null,
        icon: null,
        label: null,
        className: null,
        style: null,
        children: null,
        btnClass: 'btn',
        type: 'button',
    }

    /**
    * React 组件生命周期函数：Render
    * @private
    * @see https://doc.react-china.org/docs/react-component.html#render
    * @see https://doc.react-china.org/docs/rendering-elements.html
    * @memberof Button
    * @return {ReactNode}
    */
    render() {
        const {
            skin,
            icon,
            label,
            className,
            children,
            style,
            type,
            btnClass,
            ...other
        } = this.props;

        let iconView = null;
        if (icon) {
            if (typeof icon === 'string') {
                iconView = <Icon name={icon} />;
            } else if (typeof icon === 'object' && React.isValidElement(icon)) {
                iconView = <Icon {...icon} />;
            } else {
                iconView = icon;
            }
        }

        let labelView = null;
        if (label) {
            labelView = typeof lable !== 'object' ? <span className="text">{label}</span> : label;
        }

        const buttonStyle = Object.assign(skin ? Skin.style(skin) : {}, style);

        if (type === 'a') {
            return <a {...other} className={classes(btnClass, className, {'btn-icon': !labelView && !children})} style={buttonStyle}>{iconView}{labelView}{children}</a>;
        }
        return <button {...other} type={type} className={classes('btn', className, {'btn-icon': !labelView && !children})} style={buttonStyle}>{iconView}{labelView}{children}</button>;
    }
}
