import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import HTML from '../utils/html-helper';
import timeSequence from '../utils/time-sequence';
import Radio from './radio';

/**
 * RadioGroup 组件 ，显示一个单选组
 * @class RadioGroup
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <RadioGroup />
 */
export default class RadioGroup extends PureComponent {
    /**
     * 单选组件
     * @type {Radio}
     */
    static Radio = Radio;

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof RadioGroup
     * @type {Object}
     */
    static propTypes = {
        checked: PropTypes.bool,
        items: PropTypes.array,
        name: PropTypes.string,
        className: PropTypes.string,
        radioProps: PropTypes.object,
        onChange: PropTypes.func,
        children: PropTypes.any,
        label: PropTypes.any,
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof RadioGroup
     * @static
     */
    static defaultProps = {
        checked: false,
        label: null,
        className: null,
        radioProps: null,
        onChange: null,
        children: null,
        items: null,
        name: null,
    }

    /**
     * 处理值变更事件
     * @param {Event} e 事件对象
     * @memberof RadioGroup
     * @private
     * @return {void}
     */
    handeOnChange = e => {
        const {onChange} = this.props;
        if (onChange) {
            onChange(e.target.value, e);
        }
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof RadioGroup
     * @return {ReactNode}
     */
    render() {
        const {
            name,
            items,
            checked,
            children,
            className,
            radioProps,
            onChange,
            ...other
        } = this.props;

        const groupName = name || `radioGroup-${timeSequence()}`;

        return (<div className={HTML.classes('radio-group', className)} {...other} onChange={this.handeOnChange}>
            {
                items && items.map(item => {
                    const {
                        label,
                        value,
                        ...itemOther
                    } = item;
                    return <Radio name={groupName} label={label} {...itemOther} checked={checked === value} value={value} {...radioProps} />;
                })
            }
            {children}
        </div>);
    }
}
