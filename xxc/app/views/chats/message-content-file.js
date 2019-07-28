import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import _FileListItem from '../common/file-list-item';
import withReplaceView from '../with-replace-view';
import {isJustLangSwitched} from '../../core/lang';

/**
 * FileListItem 可替换组件形式
 * @type {Class<FileListItem>}
 * @private
 */
const FileListItem = withReplaceView(_FileListItem);

/**
 * MessageContentFile 组件 ，显示聊天消息文件内容界面
 * @class MessageContentFile
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MessageContentFile from './message-content-file';
 * <MessageContentFile />
 */
export default class MessageContentFile extends Component {
    /**
     * MessageContentFile 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MessageContentFile
     */
    static replaceViewPath = 'chats/MessageContentFile';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MessageContentFile
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
     * @memberof MessageContentFile
     * @static
     */
    static defaultProps = {
        className: null,
    };

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof MessageContentFile
     */
    shouldComponentUpdate(nextProps) {
        return isJustLangSwitched() || nextProps.className !== this.props.className || nextProps.message !== this.props.message || nextProps.message.updateId !== this.lastMessageUpdateId;
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MessageContentFile
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            message,
            className,
            ...other
        } = this.props;

        const content = message.fileContent;
        this.lastMessageUpdateId = message.updateId;

        return <FileListItem className={classes('app-message-content-file layer rounded flex-inline shadow-2 list-item', className)} file={content} {...other} />;
    }
}
