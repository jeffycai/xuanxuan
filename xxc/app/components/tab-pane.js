import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

/**
 * TabPane 组件 ，显示一个标签页内容控件
 * @class TabPane
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <TabPane />
 */
export default class TabPane extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof TabPane
     * @type {Object}
     */
    static propTypes = {
        label: PropTypes.any,
        children: PropTypes.any,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof TabPane
     * @static
     */
    static defaultProps = {
        label: 'tab',
        children: null,
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof TabPane
     * @return {ReactNode}
     */
    render() {
        const {
            label,
            children,
            ...other
        } = this.props;

        return <div {...other}>{children}</div>;
    }
}
