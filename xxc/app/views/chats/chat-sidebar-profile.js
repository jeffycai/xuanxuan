import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import App from '../../core';
import _MemberProfile from '../common/member-profile';
import withReplaceView from '../with-replace-view';
import {isJustLangSwitched} from '../../core/lang';

/**
 * MemberProfile 可替换组件形式
 * @type {Class<MemberProfile>}
 * @private
 */
const MemberProfile = withReplaceView(_MemberProfile);

/**
 * ChatSidebarProfile 组件 ，显示一个聊天侧边栏个人资料界面
 * @class ChatSidebarProfile
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatSidebarProfile from './chat-sidebar-profile';
 * <ChatSidebarProfile />
 */
export default class ChatSidebarProfile extends Component {
    /**
     * ChatSidebarProfile 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatSidebarProfile
     */
    static replaceViewPath = 'chats/ChatSidebarProfile';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatSidebarProfile
     * @type {Object}
     */
    static propTypes = {
        className: PropTypes.string,
        chat: PropTypes.object,
        children: PropTypes.any,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatSidebarProfile
     * @static
     */
    static defaultProps = {
        className: null,
        chat: null,
        children: null,
    };

    /**
     * React 组件构造函数，创建一个 ChatSidebarProfile 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        const {chat} = this.props;
        this.member = chat.getTheOtherOne(App);
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ChatSidebarProfile
     * @return {void}
     */
    componentDidMount() {
        this.dataChangeEventHandler = App.events.onDataChange(data => {
            if (this.member && data && data.members && data.members[this.member.id]) {
                this.forceUpdate();
            }
        });
    }

    /**
     * React 组件生命周期函数：`shouldComponentUpdate`
     * 让React知道当前状态或属性的改变是否不影响组件的输出。默认行为是在每一次状态的改变重渲，在大部分情况下你应该依赖于默认行为。
     *
     * @param {Object} nextProps 即将更新的属性值
     * @param {Object} nextState 即将更新的状态值
     * @returns {boolean} 如果返回 `true` 则继续渲染组件，否则为 `false` 而后的 `UNSAFE_componentWillUpdate()`，`render()`， 和 `componentDidUpdate()` 将不会被调用
     * @memberof ChatSidebarProfile
     */
    shouldComponentUpdate(nextProps) {
        return isJustLangSwitched() || nextProps.className !== this.props.className || nextProps.chat !== this.props.chat || nextProps.children !== this.props.children || nextProps.chat.getTheOtherOne(App).updateId !== this.lastMemberUpdateId;
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof ChatSidebarProfile
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.dataChangeEventHandler);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatSidebarProfile
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            chat,
            className,
            children,
            ...other
        } = this.props;

        const member = chat.getTheOtherOne(App);
        this.lastMemberUpdateId = member.updateId;

        return (<div
            {...other}
            className={HTML.classes('app-chat-sidebar-profile has-padding', className)}
        >
            <MemberProfile compact hideChatBtn className="rounded white" memberId={member.id} />
            {children}
        </div>);
    }
}
