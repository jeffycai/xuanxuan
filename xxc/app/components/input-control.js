import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import hotkeys from 'hotkeys-js';
import {classes} from '../utils/html-helper';
import timeSequence from '../utils/time-sequence';

// 设置输入框快捷键事件
hotkeys.filter = event => {
    const target = (event.target || event.srcElement);
    const tagName = target.tagName;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tagName)) {
        const scopeAttr = target.attributes['data-hotkey-scope'];
        const scope = scopeAttr && scopeAttr.value;
        if (scope) {
            hotkeys.setScope(scope);
            return true;
        }
        return false;
    }
    return true;
};

/**
 * InputControl 组件 ，显示一个输入框控件
 * @class InputControl
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <InputControl />
 */
export default class InputControl extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof InputControl
     * @type {Object}
     */
    static propTypes = {
        value: PropTypes.string,
        defaultValue: PropTypes.string,
        label: PropTypes.any,
        className: PropTypes.string,
        placeholder: PropTypes.string,
        autoFocus: PropTypes.bool,
        style: PropTypes.object,
        labelStyle: PropTypes.object,
        inputType: PropTypes.string,
        inputStyle: PropTypes.object,
        inputProps: PropTypes.object,
        helpText: PropTypes.string,
        onChange: PropTypes.func,
        disabled: PropTypes.bool,
        inputClassName: PropTypes.string,
        children: PropTypes.any,
        name: PropTypes.string,
        hotkeyScope: PropTypes.string,
        hotKeys: PropTypes.object,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof InputControl
     * @static
     */
    static defaultProps = {
        label: ' ',
        className: '',
        placeholder: '',
        autoFocus: false,
        style: null,
        inputType: 'text',
        value: '',
        helpText: null,
        onChange: null,
        disabled: false,
        inputClassName: 'rounded',
        name: '',
        labelStyle: null,
        inputStyle: null,
        inputProps: null,
        children: null,
        defaultValue: undefined,
        hotkeyScope: null,
        hotKeys: null
    };

    /**
     * React 组件构造函数，创建一个 InputControl 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        const {
            defaultValue, name, hotkeyScope, hotKeys
        } = props;

        /**
         * 是否没有设置默认值，并由组件自身管理值
         * @type {boolean}
         */
        this.controled = defaultValue === undefined;

        /**
         * 控件名称
         * @type {string}
         */
        this.controlName = name || `inputControl-${timeSequence()}`;

        /**
         * 快捷键范围名称
         * @type {string}
         */
        this.hotkeyScope = (hotkeyScope || hotKeys) ? (hotkeyScope || this.controlName) : '';
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof InputControl
     * @return {void}
     */
    componentDidMount() {
        const {autoFocus, hotKeys} = this.props;

        if (autoFocus) {
            this.autoFocusTask = setTimeout(() => {
                this.focus();
                this.autoFocusTask = null;
            }, 100);
        }

        if (hotKeys) {
            Object.keys(hotkeys).forEach(key => {
                hotkeys(key, this.hotkeysScope, hotkeys[key]);
            });
        }
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof InputControl
     * @return {void}
     */
    componentWillUnmount() {
        if (this.autoFocusTask) {
            clearTimeout(this.autoFocusTask);
            this.autoFocusTask = null;
        }

        if (this.hotkeyScope) {
            hotkeys.deleteScope(this.hotkeysScope);
        }
    }

    /**
     * 处理文本输入事件
     * @param {Event} event 事件对象
     * @memberof InputControl
     * @private
     * @return {void}
     */
    handleChange = (event) => {
        const value = this.input.value;
        if (this.props.onChange) {
            this.props.onChange(value, event);
        }
    }

    /**
     * 获取文本框值
     * @type {string}
     * @memberof InputControl
     */
    get value() {
        return this.input.value;
    }

    /**
     * 激活输入框
     * @memberof InputControl
     * @return {void}
     */
    focus() {
        this.input.focus();
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof InputControl
     * @return {ReactNode}
     */
    render() {
        const {
            name,
            label,
            labelStyle,
            placeholder,
            autoFocus,
            inputType,
            inputStyle,
            inputProps,
            value,
            helpText,
            onChange,
            className,
            inputClassName,
            defaultValue,
            disabled,
            children,
            hotkeyScope,
            hotKeys,
            ...other
        } = this.props;

        return (
            <div className={classes('control', className, {disabled})} {...other}>
                {label !== false && <label htmlFor={this.controlName} style={labelStyle}>{label}</label>}
                <input
                    data-hotkey-scope={this.hotkeyScope}
                    disabled={!!disabled}
                    ref={e => {this.input = e;}}
                    value={this.controled ? value : undefined}
                    defaultValue={defaultValue}
                    id={this.controlName}
                    type={inputType}
                    className={classes('input', inputClassName)}
                    placeholder={placeholder}
                    onChange={this.handleChange}
                    style={inputStyle}
                    {...inputProps}
                />
                {helpText ? <p className="help-text">{helpText}</p> : null}
                {children}
            </div>
        );
    }
}
