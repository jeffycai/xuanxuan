import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import Config from '../../config';
import {classes} from '../../utils/html-helper';
import App from '../../core';
import FileData from '../../core/models/file-data';
import ImageHolder from '../../components/image-holder';
import Button from '../../components/button';
import Lang from '../../core/lang';
import ClickOutsideWrapper from '../../components/click-outside-wrapper';

/**
 * ChatsSuggestPanel 组件 ，显示向聊天发送建议内容提示面板界面
 * @class ChatsSuggestPanel
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import ChatsSuggestPanel from './chats-suggest-panel';
 * <ChatsSuggestPanel />
 */
export default class ChatsSuggestPanel extends PureComponent {
    /**
     * ChatsSuggestPanel 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatsSuggestPanel
     */
    static replaceViewPath = 'chats/ChatsSuggestPanel';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatsSuggestPanel
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatsSuggestPanel
     * @static
     */
    static defaultProps = {
        className: null,
    };

    /**
     * React 组件构造函数，创建一个 ChatsSuggestPanel 组件实例，会在装配之前被调用。
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
        this.state = {image: null, show: false};
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ChatsSuggestPanel
     * @return {void}
     */
    componentDidMount() {
        this.suggestSendImageHandler = App.im.ui.onSuggestSendImage(image => {
            this.showSuggestPanel(image);
        });
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof ChatsSuggestPanel
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.suggestSendImageHandler);
        if (this.showSuggestPanelTimer) {
            clearTimeout(this.showSuggestPanelTimer);
            this.showSuggestPanelTimer = null;
        }
    }

    /**
     * 显示提示面板
     *
     * @param {FileData|Object} image 图片存储对象
     * @memberof ChatsSuggestPanel
     * @return {void}
     */
    showSuggestPanel(image) {
        this.setState({image: FileData.create(image), show: true}, () => {
            if (this.showSuggestPanelTimer) {
                clearTimeout(this.showSuggestPanelTimer);
            }
            this.showSuggestPanelTimer = setTimeout(() => {
                this.setState({show: false});
                this.showSuggestPanelTimer = null;
            }, Config.ui['chat.suggestPanelShowTime'] || 10000);
        });
    }

    /**
     * 处理关闭按钮点击事件
     * @memberof ChatsSuggestPanel
     * @private
     * @return {void}
     */
    handleCloseBtnClick = () => {
        if (this.state.show) {
            if (this.showSuggestPanelTimer) {
                clearTimeout(this.showSuggestPanelTimer);
                this.showSuggestPanelTimer = null;
            }
            this.setState({show: false});
        }
    };

    /**
     * 处理发送按钮点击事件
     * @memberof ChatsSuggestPanel
     * @private
     * @return {void}
     */
    handleSendBtnClick = () => {
        if (this.state.image) {
            App.im.server.sendImageMessage(this.state.image, App.im.ui.currentActiveChat);
        }
        this.handleCloseBtnClick();
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatsSuggestPanel
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {className} = this.props;
        const {image, show} = this.state;

        let imageView = null;
        if (image) {
            imageView = (<ImageHolder
                source={image.viewUrl}
                downloadFailMessage={Lang.string('file.downloadFailed')}
                uploadFailMessage={Lang.string('file.uploadFailed')}
            >
                <div className="toolbar dock dock-bottom has-padding text-center">
                    <Button icon="message-image" className="green rounded" label={Lang.string('chat.sendClipboardImage')} onClick={this.handleSendBtnClick} />&nbsp; &nbsp;
                    <Button icon="close" className="blue rounded" label={Lang.string('common.close')} onClick={this.handleCloseBtnClick} />
                </div>
            </ImageHolder>);
        }

        return (<ClickOutsideWrapper onClickOutside={this.handleCloseBtnClick} className={classes('dock dock-right dock-bottom layer app-chats-suggest-panel rounded has-pading scale-from-bottom shadow-3', className, {in: show})}>{imageView}</ClickOutsideWrapper>);
    }
}
