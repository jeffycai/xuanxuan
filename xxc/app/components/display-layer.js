import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import Spinner from './spinner';
import {classes} from '../utils/html-helper';
import timeSequence from '../utils/time-sequence';
import Status from '../utils/status';

/**
 * Display 状态
 * @type {Status}
 * @private
 */
const STAGE = new Status({
    init: 0,
    ready: 1,
    shown: 2,
    hidden: 3
}, 0);

/**
 * z-index 序号
 * @type {number}
 * @private
 */
let zIndexSeed = 1100;

/**
 * 获取一个递增的 z-index 序号
 * @return {number}
 * @private
 */
const newZIndex = () => {
    zIndexSeed += 1;
    return zIndexSeed;
};

/**
 * DisplayLayer 组件 ，显示一个弹出层
 * 所有可用的动画名称包括：
 * - scale-from-top
 * - scale-from-bottom
 * - scale-from-left
 * - scale-from-right
 * - scale-from-center
 * - enter-from-top
 * - enter-from-bottom
 * - enter-from-left
 * - enter-from-right
 * - enter-from-center
 *
 * @class DisplayLayer
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * <DisplayLayer />
 * @property {string} plugName 组件名称，会影响 CSS 类名
 * @property {string} animation 动画效果类型
 * @property {boolean} [modal=false] 是否以模态形式显示，如果设置为 true，点击背景层不会自动隐藏
 * @property {boolean} [show=true] 是否在初始化之后立即显示
 * @property {String|ReactNode|function} content 内容，可以为一个函数返回一个 Promise 来实现内容的懒加载
 */
export default class DisplayLayer extends PureComponent {
    /**
     * DisplayLayer 显示状态
     * 共 4 个状态
     * - init，需要初始化
     * - ready，准备好进行显示
     * - shown，已经显示
     * - hidden，已经隐藏
     * @static
     * @memberof DisplayLayer
     * @type {Status}
     */
    static STAGE = STAGE;

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof DisplayLayer
     * @type {Object}
     */
    static propTypes = {
        content: PropTypes.any,
        contentLoadFail: PropTypes.any,
        id: PropTypes.any,
        animation: PropTypes.any,
        onShown: PropTypes.func,
        onHidden: PropTypes.func,
        onLoad: PropTypes.func,
        listenUpdateStyle: PropTypes.bool,
        show: PropTypes.bool,
        hotkey: PropTypes.bool,
        cache: PropTypes.bool,
        loadingContent: PropTypes.bool,
        rootClassName: PropTypes.string,
        className: PropTypes.string,
        backdrop: PropTypes.bool,
        backdropClassName: PropTypes.string,
        contentClassName: PropTypes.string,
        footer: PropTypes.any,
        header: PropTypes.any,
        plugName: PropTypes.string,
        modal: PropTypes.bool,
        children: PropTypes.any,
        style: PropTypes.object,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof DisplayLayer
     * @static
     */
    static defaultProps = {
        listenUpdateStyle: false,
        plugName: null,
        animation: 'scale-from-top',
        modal: false,
        show: true,
        content: '',
        contentLoadFail: null,
        contentClassName: '',
        header: null,
        footer: null,
        onShown: null,
        onHidden: null,
        onLoad: null,
        hotkey: true,
        className: 'layer',
        rootClassName: '',
        backdrop: true,
        backdropClassName: '',
        loadingContent: true,
        cache: false,
        id: null,
        children: null,
        style: null,
    };

    /**
     * React 组件构造函数，创建一个 DisplayLayer 组件实例，会在装配之前被调用。
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
            stage: STAGE.init,
            loading: true,
            content: null,
            style: null,
            zIndex: newZIndex()
        };
        if (typeof props.content !== 'function') {
            this.state.content = props.content;
            this.state.loading = false;
        }

        /**
         * 控件 ID
         * @type {string}
         */
        this.id = props.id || `display-${timeSequence()}`;

        /**
         * 显示动画计时器任务 ID
         * @private
         * @type {number}
         */
        this.showTimerTask = null;

        /**
         * 上次显示的时间
         */
        this.lastShowTime = 0;
    }

    /**
    * React 组件生命周期函数：`componentDidMount`
    * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
    *
    * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
    * @private
    * @memberof DisplayLayer
    * @return {void}
    */
    componentDidMount() {
        const {show, hotkey} = this.props;
        if (show) {
            this.show();
            this.loadContent();
        }

        if (hotkey) {
            window.addEventListener('keyup', this.handleWindowKeyup);
        }
    }

    /**
    * React 组件生命周期函数：`componentWillUnmount`
    * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
    *
    * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
    * @private
    * @memberof DisplayLayer
    * @return {void}
    */
    componentWillUnmount() {
        const {hotkey} = this.props;
        if (hotkey) {
            window.removeEventListener('keyup', this.handleWindowKeyup);
        }
        clearTimeout(this.showTimerTask);
    }

    /**
     * 获取组件名称
     * @type {string}
     * @memberof DisplayLayer
     */
    get stageName() {
        const {stage} = this.state;
        return STAGE.getName(stage);
    }

    /**
     * 检查组件是否显示
     * @type {boolean}
     * @memberof DisplayLayer
     */
    get isShow() {
        return this.isStage(STAGE.shown);
    }

    /**
     * 检查组件是否隐藏
     * @type {boolean}
     * @memberof DisplayLayer
     */
    get isHide() {
        return this.isStage(STAGE.hidden);
    }

    /**
     * 检查当前状态是否为指定的状态
     *
     * @param {String|Number} stage 要检查的状态序号或者名称
     * @return {boolean}
     * @memberof DisplayLayer
     */
    isStage(stage) {
        return STAGE.isSame(stage, this.state.stage);
    }

    /**
     * 变更状态
     *
     * @param {String|Number} stage 要变更的状态
     * @memberof DisplayLayer
     * @return {void}
     */
    changeStage(stage) {
        const newState = {stage: STAGE.getValue(stage)};
        if (STAGE.isSame(stage, STAGE.shown)) {
            newState.zIndex = newZIndex();
        }
        this.setState(newState);
    }

    /**
     * 设置界面元素上的样式
     *
     * @param {Object} style 要设置的样式对象
     * @param {?Function} callback 设置完成后的回调函数
     * @memberof DisplayLayer
     * @return {void}
     */
    setStyle(style, callback) {
        this.setState({style}, callback);
    }

    /**
     * 显示 DisplayLayer
     *
     * @param {?Function} callback 完成后的回调函数
     * @memberof DisplayLayer
     * @return {void}
     */
    show(callback) {
        if (this.state.stage === STAGE.init) {
            this.changeStage(STAGE.ready);
            this.showTimerTask = setTimeout(() => {
                this.show(callback);
            }, 50);
        } else {
            this.changeStage(STAGE.shown);
            const afterShow = () => {
                this.lastShowTime = new Date().getTime();
                if (this.props.onShown) {
                    this.props.onShown(this);
                }
                if (callback) {
                    callback(this);
                }
            };
            if (this.props.animation) {
                setTimeout(afterShow, 400);
            } else {
                afterShow();
            }
        }
    }

    /**
     * 隐藏 DisplayLayer
     *
     * @param {?Function} callback 完成后的回调函数
     * @memberof DisplayLayer
     * @return {void}
     */
    hide(callback) {
        this.changeStage(STAGE.hidden);
        const afterHidden = () => {
            const {cache, onHidden} = this.props;
            if (cache) {
                this.reset();
            }
            if (onHidden) {
                onHidden(this);
            }
            if (callback) {
                callback(this);
            }
        };
        const {animation} = this.props;
        if (animation) {
            setTimeout(afterHidden, 400);
        } else {
            afterHidden();
        }
    }

    /**
     * 在弹出层上加载新的内容
     * @param {String|ReactNode|Function} newContent 新的内容
     * @param {?Function} callback 完成后的回调函数
     * @memberof DisplayLayer
     * @return {void}
     */
    loadContent(newContent, callback) {
        let {content, contentLoadFail, onLoad} = this.props;
        if (newContent !== undefined) {
            content = newContent;
        }
        const contentResult = typeof content === 'function' ? content() : content;
        const afterLoad = () => {
            if (onLoad) {
                onLoad(true, this.state.content, this);
            }
            if (callback) {
                callback(true, this.state.content, this);
            }
        };
        if (contentResult instanceof Promise) {
            this.setState({loading: true, content: null});
            contentResult.then(result => {
                this.setState({content: result, loading: false}, afterLoad);
            }).catch(() => {
                this.setState({content: contentLoadFail, loading: false}, afterLoad);
            });
        } else {
            this.setState({content: contentResult, loading: false}, afterLoad);
        }
    }

    /**
     * 处理界面按键事件
     * @param {Event} e 事件对象
     * @memberof DisplayLayer
     * @private
     * @return {void}
     */
    handeWindowKeyup(e) {
        const {hotkey} = this.props;
        if (e.keyCode === 27 && !this.props.modal) { // ESC key code: 27
            this.hide();
        } else if (typeof hotkey === 'function') {
            hotkey(e, this);
        }
    }

    /**
     * 重置状态为 init（需要初始化）
     * @memberof DisplayLayer
     * @return {void}
     */
    reset() {
        this.setState({stage: STAGE.init});
    }

    /**
     * 处理背景遮罩层点击事件
     * @param {Event} event 事件对象
     * @memberof DisplayLayer
     * @private
     * @return {void}
     */
    handleBackdropClick = event => {
        if (!this.props.modal) {
            this.hide();
        }
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof DisplayLayer
     * @return {ReactNode}
     */
    render() {
        let {
            plugName,
            className,
            rootClassName,
            backdrop,
            backdropClassName,
            animation,
            modal,
            show,
            content,
            onShown,
            onHidden,
            header,
            footer,
            hotkey,
            cache,
            loadingContent,
            contentClassName,
            contentLoadFail,
            children,
            style,
            listenUpdateStyle,
            id,
            ...other
        } = this.props;

        if (loadingContent === true) {
            loadingContent = <Spinner />;
        }

        rootClassName = classes(
            'display-layer',
            rootClassName,
            `display-stage-${this.stageName}`,
            plugName ? `display-layer-${plugName}` : null,
            {'has-animation': animation}
        );

        return (
            <div onKeyUp={this.handeWindowKeyup.bind(this)} className={rootClassName} style={{zIndex: this.state.zIndex}}>
                {backdrop && <div onClick={this.handleBackdropClick} className={classes('display-backdrop', backdropClassName)} />}
                <div id={this.id} className={classes('display', animation, className, {in: this.isStage(STAGE.shown)})} {...other} style={Object.assign({}, style, this.state.style)} ref={e => {this.displayElement = e;}}>
                    {header}
                    <div className={classes('content', contentClassName)}>{this.state.loading ? loadingContent : this.state.content}</div>
                    {children}
                    {footer}
                </div>
            </div>
        );
    }
}
