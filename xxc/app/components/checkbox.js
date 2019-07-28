import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../utils/html-helper';
import timeSequence from '../utils/time-sequence';

/**
 * Checkbox 组件 ，显示一个复选框
 * @class Checkbox
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <Checkbox />
 */
export default class Checkbox extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof Checkbox
     * @type {object}
     */
    static propTypes = {
        checked: PropTypes.bool,
        label: PropTypes.string,
        className: PropTypes.string,
        inputProps: PropTypes.object,
        onChange: PropTypes.func,
        children: PropTypes.any,
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof Checkbox
     * @static
     */
    static defaultProps = {
        checked: false,
        label: null,
        className: null,
        inputProps: null,
        onChange: null,
        children: null,
    }

    /**
     * React 组件构造函数，创建一个 Checkbox 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        /**
         * 控件 ID
         * @private
         * @type {string}
         */
        this._controlId = `checkbox-${timeSequence()}`;
    }

    /**
     * 处理复选框选中变更事件
     * @param {Event} e 事件对象
     * @memberof Checkbox
     * @private
     * @return {void}
     */
    handleCheckboxChange = e => {
        const {onChange} = this.props;
        if (onChange) {
            onChange(e.target.checked, e);
        }
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof Checkbox
     * @return {ReactNode}
     */
    render() {
        const {
            checked,
            label,
            children,
            className,
            inputProps,
            onChange,
            ...other
        } = this.props;

        return (
            <div className={classes('checkbox', className, {checked})} {...other}>
                <input id={this._controlId} checked={checked} type="checkbox" onChange={this.handleCheckboxChange} {...inputProps} />
                {label && <label htmlFor={this._controlId}>{label}</label>}
            </div>
        );
    }
}
