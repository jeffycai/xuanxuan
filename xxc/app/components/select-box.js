import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../utils/html-helper';
import StringHelper from '../utils/string-helper';

/**
 * SelectBox 组件 ，显示一个选择框
 * @class SelectBox
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * <SelectBox />
 */
export default class Selectbox extends Component {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof SelectBox
     * @type {Object}
     */
    static propTypes = {
        value: PropTypes.any,
        onChange: PropTypes.func,
        onFocus: PropTypes.func,
        onBlur: PropTypes.func,
        children: PropTypes.any,
        selectProps: PropTypes.object,
        className: PropTypes.string,
        selectClassName: PropTypes.string,
        options: PropTypes.array,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof SelectBox
     * @static
     */
    static defaultProps = {
        value: '',
        onChange: null,
        onFocus: null,
        onBlur: null,
        children: null,
        className: null,
        selectClassName: null,
        selectProps: null,
        options: null,
    };

    /**
     * React 组件构造函数，创建一个 SelectBox 组件实例，会在装配之前被调用。
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
            focus: false,
            empty: StringHelper.isEmpty(this.props.value)
        };
    }

    /**
     * 处理选择框值变更事件
     * @param {Event} e 事件对象
     * @memberof SelectBox
     * @private
     * @return {void}
     */
    handleSelectChange = e => {
        const value = e.target.value;
        this.setState({empty: StringHelper.isEmpty(value)});
        if (this.props.onChange) {
            this.props.onChange(value, e);
        }
    };

    /**
     * 处理获得焦点事件
     * @param {Event} e 事件对象
     * @memberof SelectBox
     * @private
     * @return {void}
     */
    handleOnSelectFocus = e => {
        this.setState({focus: true});
        if (this.props.onFocus) {
            this.props.onFocus(e);
        }
    }

    /**
     * 处理失去焦点事件
     * @param {Event} e 事件对象
     * @memberof SelectBox
     * @private
     * @return {void}
     */
    handleOnSelectBlur = e => {
        this.setState({focus: false});
        if (this.props.onBlur) {
            this.props.onBlur(e);
        }
    }

    /**
     * 使选择框获得焦点
     * @memberof SelectBox
     * @return {void}
     */
    focus() {
        this.selectBox.focus();
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof SelectBox
     * @return {ReactNode}
     */
    render() {
        const {
            value,
            children,
            className,
            selectProps,
            selectClassName,
            options,
            onChange,
            ...other
        } = this.props;

        return (
            <div
                className={classes('select', className, {
                    focus: this.state.focus,
                    empty: this.state.empty,
                    normal: !this.state.focus
                })}
                {...other}
            >
                <select
                    ref={e => {this.selectBox = e;}}
                    className={selectClassName}
                    value={value}
                    onChange={this.handleSelectChange}
                    {...selectProps}
                    onFocus={this.handleOnSelectFocus}
                    onBlur={this.handleOnSelectBlur}
                >
                    {
                        options && options.map(option => {
                            if (!option) {
                                return null;
                            }
                            if (typeof option !== 'object') {
                                option = {value: option, label: option};
                            }
                            return <option key={option.value} value={option.value}>{option.label}</option>;
                        })
                    }
                    {children}
                </select>
            </div>
        );
    }
}
