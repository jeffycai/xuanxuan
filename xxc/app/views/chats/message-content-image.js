import React, {Component} from 'react';
import PropTypes from 'prop-types'; // eslint-disable-line
import {classes} from '../../utils/html-helper';
import App from '../../core';
import Lang, {isJustLangSwitched} from '../../core/lang';
import Emojione from '../../components/emojione';
import ImageViewer from '../../components/image-viewer';
import ImageHolder from '../../components/image-holder';
import FileData from '../../core/models/file-data';
import {showContextMenu} from '../../core/context-menu';
import platform from '../../platform';

/**
 * 当前是否为浏览器平台
 * @type {boolean}
 * @private
 */
const isBrowser = platform.isType('browser');

/**
 * MessageContentImage 组件 ，显示聊天消息图片内容界面
 * @class MessageContentImage
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MessageContentImage from './message-content-image';
 * <MessageContentImage />
 */
export default class MessageContentImage extends Component {
    /**
     * MessageContentImage 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MessageContentImage
     */
    static replaceViewPath = 'chats/MessageContentImage';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MessageContentImage
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        message: PropTypes.object.isRequired,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MessageContentImage
     * @static
     */
    static defaultProps = {
        className: null,
    };

    /**
     * React 组件构造函数，创建一个 MessageContentImage 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        const {message} = this.props;

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {
            download: null,
            url: message.attachFile ? message.attachFile.viewUrl : ''
        };
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof MessageContentImage
     * @return {void}
     */
    componentDidMount() {
        const {message} = this.props;
        const image = message.imageContent;
        if (!this.state.url && image.id && image.send === true) {
            this.downloadImage(image);
        }
    }

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof MessageContentImage
     */
    shouldComponentUpdate(nextProps, nextState) {
        return isJustLangSwitched() || nextProps.className !== this.props.className || nextProps.message !== this.props.message || nextProps.message.updateId !== this.lastMessageUpdateId || nextState.download !== this.state.download || nextState.url || this.state.url;
    }

    /**
     * React 组件生命周期函数：`componentDidUpdate`
     * componentDidUpdate()会在更新发生后立即被调用。该方法并不会在初始化渲染时调用。
     *
     * @param {Object} prevProps 更新前的属性值
     * @param {Object} prevState 更新前的状态值
     * @see https://doc.react-china.org/docs/react-component.html#componentDidUpdate
     * @private
     * @memberof MessageContentImage
     * @return {void}
     */
    componentDidUpdate() {
        this.componentDidMount();
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof MessageContentImage
     * @return {void}
     */
    componentWillUnmount() {
        this.unMounted = true;
    }

    /**
     * 下载图片
     *
     * @param {FileData|Object} image 图片对象
     * @memberof MessageContentImage
     */
    downloadImage(image) {
        if (this.state.download === null) {
            App.im.files.downloadFile(image, progress => {
                if (this.unMounted) return;
                this.setState({download: progress});
            }).then(file => {
                if (this.unMounted) return;
                this.setState({url: isBrowser ? file.url : `file://${file.localPath}`, download: true});
            }).catch(error => {
                if (this.unMounted) return;
                this.setState({download: false});
            });
        }
    }

    /**
     * 处理图片右键菜单事件
     * @param {Event} event 事件对象
     * @memberof MessageContentImage
     * @private
     * @return {void}
     */
    handleImageContextMenu = event => {
        if (isBrowser) return;
        showContextMenu('image', {
            event,
            url: this.state.url || this.imageUrl,
            dataType: this.imageType,
            file: this.props.message.attachFile,
            message: this.props.message
        });
    };

    /**
     * 处理表情右键菜单事件
     * @param {Event} event 事件对象
     * @memberof MessageContentImage
     * @private
     * @return {void}
     */
    handleEmojiContextMenu = event => {
        if (isBrowser) return;
        const image = this.props.message.imageContent;
        showContextMenu('emoji', {event, message: this.props.message, emoji: Emojione.shortnameToUnicode(image.content)});
    };

    /**
     * 处理双击图片事件
     * @param {Event} event 事件对象
     * @memberof MessageContentImage
     * @private
     * @return {void}
     */
    handleImageDoubleClick = () => {
        ImageViewer.show(this.state.url || this.imageUrl, null, null);
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MessageContentImage
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            message,
            className,
            ...other
        } = this.props;

        this.lastMessageUpdateId = message.updateId;
        let image = message.imageContent;

        if (image.type === 'emoji') {
            return (<div
                {...other}
                onContextMenu={this.handleEmojiContextMenu}
                className={classes(' emojione-hd', className)}
                dangerouslySetInnerHTML={{__html: Emojione.toImage(image.content)}}
            />);
        }
        if (image.type === 'base64') {
            this.imageUrl = image.content;
            this.imageType = image.type;
            return (<img
                onContextMenu={this.handleImageContextMenu}
                data-fail={Lang.string('file.downloadFailed')}
                onError={e => e.target.classList.add('broken')}
                onDoubleClick={this.handleImageDoubleClick}
                src={image.content}
                alt={image.type}
            />);
        }
        const holderProps = {
            width: image.width,
            height: image.height,
            alt: image.name,
            downloadFailMessage: Lang.string('file.downloadFailed'),
            uploadFailMessage: Lang.string('file.uploadFailed'),
        };
        image = FileData.create(image);

        if (image.isOK) {
            const imageUrl = this.state.url;
            if (imageUrl) {
                holderProps.status = 'ok';
                holderProps.onContextMenu = this.handleImageContextMenu;
                holderProps.source = imageUrl;
                holderProps.onDoubleClick = this.handleImageDoubleClick;
            } else {
                holderProps.status = 'loading';
                holderProps.progress = typeof this.state.download === 'number' ? this.state.download : 0;
                holderProps.loadingText = Lang.string('file.loading');
                if (!message.isSender(App.user.id)) {
                    holderProps.progress = 50 + (holderProps.progress / 2);
                }
            }
        } else if (typeof image.send === 'number') {
            holderProps.status = 'loading';
            holderProps.progress = image.send;
            holderProps.previewUrl = this.state.url;
            if (!message.isSender(App.user.id)) {
                holderProps.loadingText = Lang.string('file.loading');
                holderProps.progress /= 2;
            } else {
                holderProps.loadingText = Lang.string('file.sending');
            }
        } else {
            holderProps.status = 'broken';
        }

        return <ImageHolder {...holderProps} />;
    }
}
