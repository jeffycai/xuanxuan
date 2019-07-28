import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import Icon from '../../components/icon';
import Lang from '../../core/lang';
import members from '../../core/members';
import Chat from '../../core/models/chat';
import SelectBox from '../../components/select-box';
import Checkbox from '../../components/checkbox';

/**
 * ChatCommittersSetting 组件 ，显示设置聊天白名单界面
 * @class ChatCommittersSetting
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import ChatCommittersSetting from './chat-committers-setting';
 * <ChatCommittersSetting />
 */
export default class ChatCommittersSetting extends PureComponent {
    /**
     * ChatCommittersSetting 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatCommittersSetting
     */
    static replaceViewPath = 'chats/ChatCommittersSetting';
    
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatCommittersSetting
     * @type {Object}
     */
    static propTypes = {
        chat: PropTypes.instanceOf(Chat),
        className: PropTypes.string,
        children: PropTypes.any,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatCommittersSetting
     * @static
     */
    static defaultProps = {
        chat: null,
        className: null,
        children: null,
    };

    /**
     * React 组件构造函数，创建一个 ChatCommittersSetting 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);

        const {chat} = props;
        const type = chat.committersType;
        const chatMembers = chat.getMembersSet(members);
        const whitelist = chat.whitelist || new Set();
        const isEmptyWhiteList = !whitelist.size;
        let adminsCount = 0;
        chatMembers.forEach(x => {
            if (chat.isAdmin(x)) {
                adminsCount += 1;
                if (isEmptyWhiteList) whitelist.add(x.id);
            }
        });

        /**
         * 聊天成员
         * @type {Member[]}
         * @private
         */
        this.chatMembers = chatMembers;

        /**
         * 管理员数目
         * @type {number}
         * @private
         */
        this.adminsCount = adminsCount;

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {
            type, whitelist
        };
    }

    /**
     * 获取白名单设置字符串
     *
     * @return {string} 白名单设置字符串
     * @memberof ChatCommittersSetting
     */
    getCommitters() {
        const {type} = this.state;
        if (type === 'whitelist') {
            // eslint-disable-next-line react/destructuring-assignment
            return this.state.whitelist;
        }
        if (type === 'admins') {
            return '$ADMINS';
        }
        return '';
    }

    /**
     * 处理白名单类型变更事件
     * @param {string} type 白名单类型
     * @memberof ChatCommittersSetting
     * @private
     * @return {void}
     */
    handleSelectChange = type => {
        this.setState({type});
    }

    /**
     * 处理成员复选框选中变更事件
     * @param {number} memberId 成员 ID
     * @param {boolean} isChecked 是否选中
     * @memberof ChatCommittersSetting
     * @private
     * @return {void}
     */
    handleCheckboxChange(memberId, isChecked) {
        const {whitelist} = this.state;
        if (isChecked) {
            whitelist.add(memberId);
        } else {
            whitelist.delete(memberId);
        }
        this.setState({whitelist});
        this.forceUpdate();
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatCommittersSetting
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            className,
            children,
            ...other
        } = this.props;

        const {
            whitelist, type
        } = this.state;

        const {
            chatMembers, adminsCount
        } = this;

        const options = [
            {value: Chat.COMMITTERS_TYPES.all, label: `${Lang.string('chat.committers.type.all')}(${chatMembers.length})`},
            {value: Chat.COMMITTERS_TYPES.admins, label: `${Lang.string('chat.committers.type.admins')}(${adminsCount})`},
            {value: Chat.COMMITTERS_TYPES.whitelist, label: `${Lang.string('chat.committers.type.whitelist')}(${whitelist.size})`},
        ];

        return (
            <div
                {...other}
                className={classes('app-chat-committers-setting', className)}
            >
                <div className="text-gray space-sm flex flex-middle"><Icon name="information-outline" />&nbsp; {Lang.string('chat.committers.committersSettingTip')}</div>
                <SelectBox className="space-sm" style={{width: '50%'}} value={type} options={options} onChange={this.handleSelectChange} />
                {
                    type === 'whitelist' && (
                        <div className="checkbox-list rounded box outline">
                            {
                                chatMembers.map(member => {
                                    return <Checkbox key={member.id} className="inline-block" onChange={this.handleCheckboxChange.bind(this, member.id)} checked={whitelist.has(member.id)} label={member.displayName} />;
                                })
                            }
                        </div>
                    )
                }
                {children}
            </div>
        );
    }
}
