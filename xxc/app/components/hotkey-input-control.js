import React, {Component} from 'react';
import PropTypes from 'prop-types';
import InputControl from './input-control';
import {classes} from '../utils/html-helper';
import {getKeyDecoration, formatKeyDecoration, isOnlyModifyKeys} from '../utils/shortcut';

/**
 * HotkeyInputControl 组件 ，显示一个快捷键输入框
 * @class HotkeyInputControl
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * <HotkeyInputControl />
 */
export default class HotkeyInputControl extends Component {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof HotkeyInputControl
     * @type {Object}
     */
    static propTypes = {
        defaultValue: PropTypes.string,
        className: PropTypes.string,
        onChange: PropTypes.func,
        inputProps: PropTypes.object,
        onlyMotifyKeysText: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof HotkeyInputControl
     * @static
     */
    static defaultProps = {
        defaultValue: '',
        onChange: null,
        inputProps: null,
        className: null,
        onlyMotifyKeysText: ''
    };

    /**
     * React 组件构造函数，创建一个 HotkeyInputControl 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {
            value: formatKeyDecoration(props.defaultValue),
            error: null
        };
    }

    /**
     * 更改输入框内的值
     * @param {string} value 输入框内的值
     * @param {String|ReactNode} error 设置错误提示
     * @memberof HotkeyInputControl
     * @return {void}
     */
    changeValue(value, error = null) {
        const {onChange} = this.props;
        if (onChange) {
            onChange(value);
        }
        this.setState({value, error});
    }

    /**
     * 处理键盘按键事件
     * @param {Event} e 事件对象
     * @memberof HotkeyInputControl
     * @private
     * @return {void}
     */
    handleKeyDownEvent = e => {
        if (e.keyCode === 8 || e.cod === 'Backspace') {
            this.changeValue('');
            return;
        }
        const shortcut = getKeyDecoration(e);
        if (isOnlyModifyKeys(shortcut)) {
            const {onlyMotifyKeysText} = this.props;
            this.changeValue(shortcut, onlyMotifyKeysText);
        } else {
            this.changeValue(shortcut);
        }
        e.preventDefault();
        e.stopPropagation();
    };

    /**
     * 处理失去焦点事件
     * @param {Event} e 事件对象
     * @memberof HotkeyInputControl
     * @private
     * @return {void}
     */
    handleBlurEvent = e => {
        const {value} = this.state;
        if (isOnlyModifyKeys(value)) {
            this.changeValue('', this.props.onlyMotifyKeysText); // eslint-disable-line
        }
    };

    /**
     * 获取输入框内的值
     * @memberof HotkeyInputControl
     * @return {string} 快捷键字符串
     */
    getValue() {
        return this.state.value; // eslint-disable-line
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof HotkeyInputControl
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            onChange,
            defaultValue,
            className,
            inputProps,
            onlyMotifyKeysText,
            ...other
        } = this.props;

        const {error, value} = this.state;

        return (
            <InputControl
                {...other}
                placeholder={defaultValue}
                className={classes(className, {'has-error': !!error})}
                helpText={error}
                ref={e => {this.inputControl = e;}}
                value={value}
                inputProps={Object.assign({onKeyDown: this.handleKeyDownEvent, onBlur: this.handleBlurEvent}, inputProps)}
            />
        );
    }
}
