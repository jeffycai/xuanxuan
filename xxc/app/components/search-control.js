import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import HTML from '../utils/html-helper';
import InputControl from './input-control';
import Icon from './icon';
import StringHelper from '../utils/string-helper';
import DelayAction from '../utils/delay-action';
import Lang, {onLangChange} from '../core/lang';
import events from '../core/events';

/**
 * SearchControl 组件 ，显示一个搜索框
 * @class SearchControl
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <SearchControl />
 */
export default class SearchControl extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof SearchControl
     * @type {Object}
     */
    static propTypes = {
        placeholder: PropTypes.any,
        changeDelay: PropTypes.number,
        onSearchChange: PropTypes.func,
        onBlur: PropTypes.func,
        onFocus: PropTypes.func,
        onFocusChange: PropTypes.func,
        defaultValue: PropTypes.any,
        children: PropTypes.any,
        className: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof SearchControl
     * @static
     */
    static defaultProps = {
        placeholder: null,
        changeDelay: 100,
        onSearchChange: null,
        onFocusChange: null,
        onBlur: null,
        onFocus: null,
        defaultValue: '',
        className: null,
        children: null,
    };

    /**
     * React 组件构造函数，创建一个 SearchControl 组件实例，会在装配之前被调用。
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
            value: props.defaultValue,
            focus: false,
            empty: StringHelper.isEmpty(props.defaultValue)
        };

        const {onSearchChange, changeDelay} = this.props;
        if (onSearchChange) {
            this.delaySearchChangeTask = new DelayAction((searchValue) => {
                onSearchChange(searchValue);
            }, changeDelay);
        }
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof SearchControl
     * @return {void}
     */
    componentDidMount() {
        this.onLangChangeHandler = onLangChange(() => {
            this.forceUpdate();
        });
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof SearchControl
     * @return {void}
     */
    componentWillUnmount() {
        if (this.delaySearchChangeTask) {
            this.delaySearchChangeTask.destroy();
        }

        events.off(this.onLangChangeHandler);
    }

    /**
     * 获取输入的值
     * @memberof SearchControl
     * @return {string}
     */
    getValue() {
        return this.state.value;
    }

    /**
     * 检查搜索框是否为空
     * @memberof SearchControl
     * @return {boolean}
     */
    isEmpty() {
        return this.state.empty;
    }

    /**
     * 处理搜索框获得焦点事件
     * @param {Event} e 事件对象
     * @memberof SearchControl
     * @private
     * @return {void}
     */
    handleOnInputFocus = e => {
        this.setState({focus: true});
        if (this.props.onFocus) {
            this.props.onFocus(e);
        }
        if (this.props.onFocusChange) {
            this.props.onFocusChange(true, e);
        }
    };

    /**
     * 处理搜索框失去焦点事件
     * @param {Event} e 事件对象
     * @memberof SearchControl
     * @private
     * @return {void}
     */
    handleOnInputBlur = e => {
        this.setState({focus: false});
        if (this.props.onBlur) {
            this.props.onBlur(e);
        }
        if (this.props.onFocusChange) {
            this.props.onFocusChange(false, e);
        }
    };

    /**
     * 设置搜索框值
     * @param {string} value 输入框值
     * @param {?Function} callback 操作完成时的回调函数
     * @memberof SearchControl
     * @return {void}
     */
    setValue(value, callback) {
        this.setState({empty: StringHelper.isEmpty(value), value}, () => {
            if (this.delaySearchChangeTask) {
                this.delaySearchChangeTask.do(value);
            }
            if (callback) {
                callback(value);
            }
        });
    }

    /**
     * 处理搜索框值变更事件
     * @param {string} value 搜索框内的文本值
     * @memberof SearchControl
     * @private
     * @return {void}
     */
    handleOnInputChange = value => {
        value = typeof value === 'string' ? value.trim() : '';
        this.setValue(value);
    }

    /**
     * 处理清除按钮点击事件
     * @param {Event} event 事件对象
     * @memberof SearchControl
     * @private
     * @return {void}
     */
    handleOnClearBtnClick = event => {
        this.setValue('', () => {
            this.inputControl.focus();
        });
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof SearchControl
     * @return {ReactNode}
     */
    render() {
        let {
            className,
            children,
            onSearchChange,
            changeDelay,
            onFocus,
            onFocusChange,
            onBlur,
            defaultValue,
            placeholder,
            ...other
        } = this.props;

        delete other.value;

        if (placeholder === null) {
            placeholder = Lang.string('common.search');
        }

        return (<InputControl
            className={HTML.classes('search', className, {
                focus: this.state.focus,
                empty: this.state.empty,
                normal: !this.state.focus
            })}
            value={this.state.value}
            label={<Icon name="magnify" />}
            onFocus={this.handleOnInputFocus}
            onBlur={this.handleOnInputBlur}
            onChange={this.handleOnInputChange}
            ref={e => {this.inputControl = e;}}
            placeholder={placeholder}
            {...other}
        >
            <Icon name="close" onClick={this.handleOnClearBtnClick} className="close state" />
            {children}
        </InputControl>);
    }
}
