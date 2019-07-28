import React, {PureComponent} from 'react';

/**
 * Image 组件 ，显示一个图片元素
 * @class Image
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <Image src="test.png" alt="test.png">图片加载失败时显示的内容</Image>
 */
export default class Image extends PureComponent {
    /**
     * React 组件构造函数，创建一个 Image 组件实例，会在装配之前被调用。
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
            error: null
        };
    }

    /**
     * 处理图片加载失败事件
     *
     * @param {Event} e 事件对象
     * @memberof Image
     * @return {void}
     */
    _handleImgError = (e) => {
        if (DEBUG) {
            console.warn(`Cannot load image ${this.props.src}`, e);
        }
        const {src} = this.props;
        this.setState({error: src});
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof Image
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            alt,
            src,
            children,
            ...other
        } = this.props;

        const {error} = this.state;
        if (error && error === src) {
            return children;
        }
        return <img alt={alt || src} src={src} onError={this._handleImgError} {...other} />;
    }
}
