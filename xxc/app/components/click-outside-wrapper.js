import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

/**
 * ClickOutsideWrapper 组件 ，显示一个ClickOutsideWrapper（允许监听元素外点击事件的容器元素，可以很方便的使用此组件制作点击外部即关闭的弹出层）
 * @class ClickOutsideWrapper
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example <caption>制作一个点击外部即关闭的对话框</caption>
 * let isDialogOpen = true;
 * const renderDialog = props => {
 *     return isDialogOpen ? (<ClickOutsideWrapper
 *         onClickOutside={e => {
 *              isDialogOpen = false;
 *         }}
 *     >
 *          <h1>Dialog heading</h1>
 *          <div>dialog content...</div>
 *     </ClickOutsideWrapper>) : null;
 * };
 */
export default class ClickOutsideWrapper extends PureComponent {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ClickOutsideWrapper
     * @type {Object}
     */
    static propTypes = {
        onClickOutside: PropTypes.func,
        children: PropTypes.any
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ClickOutsideWrapper
     * @static
     */
    static defaultProps = {
        onClickOutside: null,
        children: null
    }

    /**
    * React 组件生命周期函数：`componentDidMount`
    * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
    *
    * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
    * @private
    * @memberof ClickOutsideWrapper
    * @return {void}
    */
    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    /**
    * React 组件生命周期函数：`componentWillUnmount`
    * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
    *
    * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
    * @private
    * @memberof ClickOutsideWrapper
    * @return {void}
    */
    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    /**
     * 处理鼠标点击外部区域事件
     * @param {Event} event 事件对象
     * @memberof ClickOutsideWrapper
     * @private
     * @return {void}
     */
    handleClickOutside = event => {
        const {onClickOutside} = this.props;
        if (onClickOutside && this._wrapper && !this._wrapper.contains(event.target)) {
            onClickOutside(event, this);
        }
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ClickOutsideWrapper
     * @return {ReactNode}
     */
    render() {
        const {
            onClickOutside,
            children,
            ...other
        } = this.props;

        return (
            <div ref={e => {this._wrapper = e;}} {...other}>
                {children}
            </div>
        );
    }
}
