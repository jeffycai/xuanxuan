import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import App from '../../core';
import Button from '../../components/button';
import Lang, {isJustLangSwitched} from '../../core/lang';
import Config from '../../config';

/**
 * NotificationMessage 组件 ，显示通知消息界面
 * @class NotificationMessage
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import NotificationMessage from './notification-message';
 * <NotificationMessage />
 */
export default class NotificationMessage extends Component {
    /**
     * NotificationMessage 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof NotificationMessage
     */
    static replaceViewPath = 'chats/NotificationMessage';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof NotificationMessage
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        message: PropTypes.object.isRequired,
        contentConverter: PropTypes.func,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof NotificationMessage
     * @static
     */
    static defaultProps = {
        className: null,
        contentConverter: null,
    };

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof NotificationMessage
     */
    shouldComponentUpdate(nextProps) {
        return isJustLangSwitched() || nextProps.className !== this.props.className || nextProps.contentConverter !== this.props.contentConverter || nextProps.message !== this.props.message || nextProps.message.content !== this.props.message.content;
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof NotificationMessage
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        let {
            message,
            className,
            contentConverter,
            ...other
        } = this.props;

        const content = message.renderedTextContent(App.im.ui.renderChatMessageContent, Config.ui['chat.denyShowMemberProfile'] ? null : App.im.ui.linkMembersInText);
        const {notification, actions} = message;

        let actionsButtons = [];
        if (notification.url) {
            actionsButtons.push(<Button btnClass="" key="primaryUrl" label={Lang.string('common.viewDetail')} icon="arrow-right-bold-circle" type="a" href={notification.url} className="text-primary" />);
        }
        if (actions) {
            actions.forEach((action, idx) => {
                actionsButtons.push(<Button btnClass="" key={idx} label={action.label || action.lable} icon={action.icon} type="a" href={action.url} className={`text-${action.type}`} />);
            });
        }

        return (<div
            {...other}
            className={classes('app-message-notification layer rounded shadow-2', className)}
        >
            <div className="markdown-content" dangerouslySetInnerHTML={{__html: contentConverter ? contentConverter(content) : content}} />
            {actionsButtons && actionsButtons.length ? <nav className="actions nav gray">{actionsButtons}</nav> : null}
        </div>);
    }
}
