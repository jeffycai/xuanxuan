/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class AdvanceImageViewer extends Component {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof AdvanceImageViewer
     * @type {Object}
     */
    static propTypes = {
        src: PropTypes.string,
        onRequestClsoe: PropTypes.func,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof AdvanceImageViewer
     * @static
     */
    static defaultProps = {
        src: null,
        onRequestClsoe: null,
    };

    /**
     * React 组件构造函数，创建一个 ADvanceMageIewer 组件实例，会在装配之前被调用。
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
            x: 'auto',
            y: 'auto',
            zoom: 0,
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ADvanceMageIewer
     * @return {void}
     */
    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof ADvanceMageIewer
     * @return {void}
     */
    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        if (this.closeTimer) {
            clearTimeout(this.closeTimer);
        }
    }

    /**
     * 处理鼠标点击事件
     * @param {Event} event 事件对象
     * @memberof ADvanceMageIewer
     * @private
     * @return {void}
     */
    handleMouseDown = event => {
        this.isDragging = false;
        this.isMouseDown = true;
        event.preventDefault();
        this.disx = event.pageX - event.target.offsetLeft;
        this.disy = event.pageY - event.target.offsetTop;
    };

    /**
     * 处理鼠标移动事件
     * @param {Event} event 事件对象
     * @memberof ADvanceMageIewer
     * @private
     * @return {void}
     */
    handleMouseMove = event => {
        if (this.isMouseDown) {
            this.isDragging = true;
            this.setState({
                x: event.pageX - this.disx,
                y: event.pageY - this.disy,
            });
        }
    };

    /**
     * 处理鼠标点击弹起事件
     * @param {Event} event 事件对象
     * @memberof ADvanceMageIewer
     * @private
     * @return {void}
     */
    handleMouseUp = event => {
        this.isMouseDown = false;
        const now = new Date().getTime();
        if (this.isDragging) {
            this.setState({
                x: event.pageX - this.disx,
                y: event.pageY - this.disy,
            });
        } else if (this.lastMouseUpTime && (now - this.lastMouseUpTime) < 300) {
            if (this.closeTimer) {
                clearTimeout(this.closeTimer);
                this.closeTimer = null;
            }
            this.setState({
                scale: 1,
                zoom: 0,
                x: 'auto',
                y: 'auto'
            });
        } else {
            clearTimeout(this.closeTimer);
            this.closeTimer = setTimeout(() => {
                const {onRequestClsoe} = this.props;
                if (onRequestClsoe) {
                    onRequestClsoe();
                }
                this.closeTimer = null;
            }, 350);
        }
        this.isDragging = false;
        this.lastMouseUpTime = now;
    };

    /**
     * 处理键盘 ESC 事件，退出图片浏览
     * @param {event} e 键盘事件对象
     * @return {void}
     */
    handleKeyDown = (e) => {
        if (e.keyCode === 27) {
            const {onRequestClsoe} = this.props;
            if (onRequestClsoe) {
                onRequestClsoe();
            }
        }
    };

    /**
     * 鼠标滚轮放大图片
     * @param {event} e 鼠标滚轮事件对象
     * @return {void}
     */
    handleMouseonWheel = (e) => {
        const {wheelDelta} = e.nativeEvent;
        let {zoom: originalzoom} = this.state;
        let zoom = parseInt(originalzoom, 10) || 100;
        zoom += wheelDelta / 12;
        const scale = zoom / 100;
        if (zoom >= 40) {
            originalzoom = `${zoom}%`;
            this.setState({
                zoom: originalzoom,
                scale
            });
        }
    }

    /**
     * 处理点击事件
     * @param {Event} e 事件对象
     * @memberof ADvanceMageIewer
     * @private
     * @return {void}
     */
    handleClick = (e) => {
        e.stopPropagation();
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ADvanceMageIewer
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {scale, x, y} = this.state;
        const style = {
            transform: `scale(${scale})`,
            position: 'absolute',
            top: y,
            left: x
        };
        const {src} = this.props;
        return (
            <div className="dock darken center-content">
                <img
                    style={style}
                    src={src}
                    alt={src}
                    onWheel={this.handleMouseonWheel}
                    onMouseDown={this.handleMouseDown}
                    onClick={this.handleClick}
                />
            </div>
        );
    }
}
