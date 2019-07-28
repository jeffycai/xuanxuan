import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../utils/html-helper';
import Icon from './icon';

/**
 * Spinner 组件 ，显示一个用于“正在加载中”图标
 * @class Spinner
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <Spinner />
 */
export default class Spinner extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof Spinner
     * @type {Object}
     */
    static propTypes = {
        iconSize: PropTypes.number,
        iconClassName: PropTypes.string,
        iconName: PropTypes.string,
        label: PropTypes.any,
        className: PropTypes.string,
        children: PropTypes.any,
        labelClassName: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof Spinner
     * @static
     */
    static defaultProps = {
        iconSize: 24,
        iconClassName: 'spin text-gray inline-block',
        iconName: 'loading',
        label: '',
        className: '',
        children: null,
        labelClassName: '',
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof Spinner
     * @return {ReactNode}
     */
    render() {
        let {
            iconSize,
            iconName,
            iconClassName,
            labelClassName,
            label,
            children,
            className,
            ...other
        } = this.props;

        return (
            <div className={classes('spinner text-center', className)} {...other}>
                <Icon name={iconName} className={iconClassName} size={iconSize} />
                {label && <div className={classes('muted small title', labelClassName)}>{label}</div>}
                {children}
            </div>
        );
    }
}
