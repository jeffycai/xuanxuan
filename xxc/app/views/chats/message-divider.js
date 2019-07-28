import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import {formatDate, isToday, isYestoday} from '../../utils/date-helper';
import Lang from '../../core/lang';

/**
 * MessageDivider 组件 ，显示聊天列表分隔线界面
 * @class MessageDivider
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import MessageDivider from './message-divider';
 * <MessageDivider />
 */
export default class MessageDivider extends PureComponent {
    /**
     * MessageDivider 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MessageDivider
     */
    static replaceViewPath = 'chats/MessageDivider';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MessageDivider
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        children: PropTypes.any,
        date: PropTypes.any,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MessageDivider
     * @static
     */
    static defaultProps = {
        className: null,
        date: null,
        children: null,
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MessageDivider
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            date,
            className,
            children,
            ...other
        } = this.props;

        let dateStr = null;
        if (date) {
            dateStr = formatDate(date, 'YYYY-M-d');
            if (isToday(date)) {
                dateStr = `${Lang.string('time.today')} ${dateStr}`;
            } else if (isYestoday(date)) {
                dateStr = `${Lang.string('time.yestoday')} ${dateStr}`;
            }
        }

        return (
            <div className={classes('app-message-divider', className)} {...other}>
                <div className="content">{dateStr}{children}</div>
            </div>
        );
    }
}
