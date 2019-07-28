import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import Avatar from '../../components/avatar';
import App from '../../core';
import StringHelper from '../../utils/string-helper';
import Config from '../../config';

/**
 * MessageBroadcast 组件 ，显示广播聊天消息条目
 * @class MessageBroadcast
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MessageBroadcast from './message-broadcast';
 * <MessageBroadcast />
 */
export default class MessageBroadcast extends Component {
    /**
     * MessageBroadcast 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MessageBroadcast
     */
    static replaceViewPath = 'chats/MessageBroadcast';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MessageBroadcast
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        prefix: PropTypes.string,
        children: PropTypes.any,
        contentConverter: PropTypes.func,
        message: PropTypes.object.isRequired,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MessageBroadcast
     * @static
     */
    static defaultProps = {
        className: null,
        prefix: null,
        children: null,
        contentConverter: null,
    };

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof MessageBroadcast
     */
    shouldComponentUpdate(nextProps) {
        return nextProps.className !== this.props.className || nextProps.message !== this.props.message || nextProps.message.content !== this.props.message.content;
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MessageBroadcast
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            message,
            className,
            children,
            prefix,
            contentConverter,
            ...other
        } = this.props;

        let content = message.renderedTextContent(content => {
            return content.replace(/我/g, `@${message.getSender(App.members).account}${content.substr(1)}`);
        }, App.im.ui.renderChatMessageContent, Config.ui['chat.denyShowMemberProfile'] ? null : App.im.ui.linkMembersInText);

        if (StringHelper.isNotEmpty(prefix)) {
            content = prefix + content;
        }

        return (<div className={classes('app-message-broadcast has-padding-xs space-sm primary-pale flex-inline flex-middle row single', className)} {...other}>
            <Avatar className="avatar-sm flex-none" icon="bell text-secondary" />
            <div
                className="content markdown-content"
                dangerouslySetInnerHTML={{__html: contentConverter ? contentConverter(content) : content}}
            />
        </div>);
    }
}
