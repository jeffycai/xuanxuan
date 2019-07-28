import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes, rem} from '../utils/html-helper';

/**
 * Icon 组件 ，显示一个图标，目前支持 materialdesign 内的所有图标
 * 所有可用的图标参见 https://materialdesignicons.com/
 * @class Icon
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example <caption>创建一个星星图标</caption>
 * <MDIcon name="star" />
 */
export default class MDIcon extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof Icon
     * @type {Object}
     */
    static propTypes = {
        size: PropTypes.number,
        style: PropTypes.object,
        square: PropTypes.bool,
        className: PropTypes.string,
        color: PropTypes.string,
        name: PropTypes.string,
        children: PropTypes.any
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof Icon
     * @static
     */
    static defaultProps = {
        size: 0,
        name: '',
        color: '',
        className: '',
        square: true,
        style: null,
        children: null
    };

    /**
     * 创建一个图标组件
     * @param {String|ReactNode|Object} icon 图标名称或者图标组件属性配置
     * @param {Object?} props 图标组件属性配置
     * @return {ReactNode.<MDIcon>}
     * @static
     * @memberof Icon
     * @example <caption>创建一个星星图标</caption>
     * const icon = MDIcon.render('star');
     */
    static render(icon, props) {
        let iconView = null;
        if (icon) {
            if (React.isValidElement(icon)) {
                iconView = icon;
            } else if (typeof icon === 'object') {
                iconView = <MDIcon {...icon} {...props} />;
            } else if (icon) {
                iconView = <MDIcon name={icon} {...props} />;
            }
        }
        return iconView;
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof Icon
     * @return {ReactNode}
     */
    render() {
        let {
            square,
            size,
            color,
            name,
            style,
            children,
            className,
            ...other
        } = this.props;
        style = Object.assign({}, style);
        if (size) {
            if (size < 12) size *= 12;
            style.fontSize = rem(size);
        }
        if (color) {
            style.color = color;
        }
        if (square && size) {
            style.lineHeight = style.fontSize;
            style.height = style.fontSize;
            style.width = style.fontSize;
        }
        let iconName = '';
        if (name.startsWith('mdi-')) {
            iconName = `mdi ${name}`;
        } else if (name.startsWith('icon-')) {
            iconName = name;
        } else {
            iconName = `mdi mdi-${name}`;
        }
        return <i style={style} {...other} className={classes(`icon ${iconName}`, className)}>{children}</i>;
    }
}
