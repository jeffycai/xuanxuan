import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../utils/html-helper';
import timeSequence from '../utils/time-sequence';

/**
 * Radio 组件 ，显示一个单选控件
 * @class Radio
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * <Radio />
 */
export default class Radio extends Component {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof Radio
     * @type {Object}
     */
    static propTypes = {
        checked: PropTypes.bool,
        disabled: PropTypes.bool,
        label: PropTypes.any,
        className: PropTypes.string,
        inputProps: PropTypes.object,
        onChange: PropTypes.func,
        children: PropTypes.any,
        name: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        innerView: PropTypes.any,
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof Radio
     * @static
     */
    static defaultProps = {
        checked: false,
        label: null,
        className: null,
        inputProps: null,
        onChange: null,
        children: null,
        innerView: null,
        disabled: false,
    }

    /**
     * React 组件构造函数，创建一个 Radio 组件实例，会在装配之前被调用。
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
        this._controlId = `radio-${timeSequence()}`;
    }

    /**
     * 处理值变更事件
     * @param {Event} e 事件对象
     * @memberof Radio
     * @private
     * @return {void}
     */
    handleRadioChange = e => {
        const {onChange, name, value} = this.props;
        if (onChange) {
            onChange(name, value, e.target.checked, e);
        }
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof Radio
     * @return {ReactNode}
     */
    render() {
        const {
            name,
            value,
            checked,
            disabled,
            label,
            innerView,
            children,
            className,
            inputProps,
            onChange,
            ...other
        } = this.props;

        return (<div className={HTML.classes('radio', className, {checked, disabled})} {...other}>
            <input disabled={disabled} name={name} id={this._controlId} checked={checked} type="radio" onChange={this.handleRadioChange} value={value} {...inputProps} />
            {label && <label htmlFor={this.controlId}>{label}</label>}
            {innerView}
            {children}
        </div>);
    }
}
