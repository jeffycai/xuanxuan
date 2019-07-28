import React, {Component} from 'react';
import PropTypes from 'prop-types';
import hotkeys from 'hotkeys-js';
import AreaSelector from './area-selector';
import Icon from './icon';
import Avatar from './avatar';
import timeSequence from '../utils/time-sequence';
import ImageHelper from '../utils/image';

/**
 * ImageCutter 组件 ，显示一个图片剪切控件
 * @class ImageCutter
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * <ImageCutter />
 */
export default class ImageCutter extends Component {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ImageCutter
     * @type {Object}
     */
    static propTypes = {
        sourceImage: PropTypes.string,
        style: PropTypes.object,
        onFinish: PropTypes.func,
        onCancel: PropTypes.func,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ImageCutter
     * @static
     */
    static defaultProps = {
        sourceImage: null,
        style: null,
        onFinish: null,
        onCancel: null,
    };

    /**
     * React 组件构造函数，创建一个 ImageCutter 组件实例，会在装配之前被调用。
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
            hover: true,
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ImageCutter
     * @return {void}
     */
    componentDidMount() {
        this.HotkeysScope = timeSequence();
        hotkeys.setScope(this.HotkeysScope);
        hotkeys('esc', this.HotkeysScope, () => {
            this.handleCloseButtonClick();
        });
        hotkeys('enter', this.HotkeysScope, () => {
            this.handleOkButtonClick();
        });
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof ImageCutter
     * @return {void}
     */
    componentWillUnmount() {
        hotkeys.deleteScope(this.HotkeysScope);
    }

    /**
     * 处理确认按钮点击事件
     * @param {Event} event 事件对象
     * @memberof ImageCutter
     * @private
     * @return {void}
     */
    handleOkButtonClick = event => {
        if (this.select) {
            ImageHelper.cutImage(this.props.sourceImage, this.select).then(image => {
                if (this.props.onFinish) {
                    this.props.onFinish(image);
                }
            }).catch(err => {
                if (DEBUG) {
                    console.warn('Cut image error', err);
                }
            });
        } else if (this.props.onFinish) {
            this.props.onFinish(null);
        }
    }

    /**
     * 处理确认按钮点击事件
     * @memberof ImageCutter
     * @private
     * @return {void}
     */
    handleCloseButtonClick = () => {
        if (this.props.onFinish) {
            this.props.onFinish(null);
        }
    }

    /**
     * 处理设置选择区域事件
     * @param {Object} select 新选择的区域
     * @memberof ImageCutter
     * @private
     * @return {void}
     */
    handleSelectArea = (select) => {
        this.select = select;
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ImageCutter
     * @return {ReactNode}
     */
    render() {
        let {
            sourceImage,
            style,
            onFinish,
            onCancel,
            ...other
        } = this.props;

        const imageUrl = `file://${sourceImage.replace(/\\/g, '/')}`;

        style = Object({
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url("${imageUrl}")`,
            backgroundPosition: 'center',
            backgroundSize: 'contain'
        }, style);

        const toolbar = (<nav
            className="layer nav primary-pale"
            style={{marginTop: 2, marginBottom: 2}}
        >
            <a onClick={this.handleCloseButtonClick}><Icon name="close icon-2x text-danger" /></a>
            <a onClick={this.handleOkButtonClick}><Icon name="check icon-2x text-success" /></a>
        </nav>);

        return (<div
            {...other}
            className="dock user-app-no-dragable"
            style={style}
            onMouseEnter={() => {this.setState({hover: true});}}
            onMouseLeave={() => {this.setState({hover: false});}}
        >
            <AreaSelector
                onSelectArea={this.handleSelectArea}
                style={{zIndex: 2, display: this.state.hover ? 'block' : 'block'}}
                className="dock"
                img={imageUrl}
                toolbarHeight={50}
                toolbar={toolbar}
            />
            <Avatar className="state darken dock dock-right dock-top" icon="close icon-2x" onClick={this.handleCloseButtonClick} />
        </div>);
    }
}
