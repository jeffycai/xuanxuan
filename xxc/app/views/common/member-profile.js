import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HTML from '../../utils/html-helper';
import Icon from '../../components/icon';
import Avatar from '../../components/avatar';
import Lang, {isJustLangSwitched} from '../../core/lang';
import App from '../../core';
import ROUTES from './routes';
import _UserAvatar from './user-avatar';
import _StatusDot from './status-dot';
import Config from '../../config';
import withReplaceView from '../with-replace-view';

/**
 * StatusDot 可替换组件形式
 * @type {Class<StatusDot>}
 * @private
 */
const StatusDot = withReplaceView(_StatusDot);

/**
 * UserAvatar 可替换组件形式
 * @type {Class<UserAvatar>}
 * @private
 */
const UserAvatar = withReplaceView(_UserAvatar);

/**
 * MemberProfile 组件 ，显示成员个人资料界面
 * @class MemberProfile
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MemberProfile from './member-profile';
 * <MemberProfile />
 */
export default class MemberProfile extends Component {
    /**
     * MemberProfile 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MemberProfile
     */
    static replaceViewPath = 'common/MemberProfile';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MemberProfile
     * @type {Object}
     */
    static propTypes = {
        memberId: PropTypes.any.isRequired,
        className: PropTypes.string,
        compact: PropTypes.bool,
        hideChatBtn: PropTypes.bool,
        onRequestClose: PropTypes.func,
    }

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MemberProfile
     * @static
     */
    static defaultProps = {
        className: null,
        onRequestClose: null,
        compact: false,
        hideChatBtn: false,
    };

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof MemberProfile
     * @return {void}
     */
    componentDidMount() {
        this.dataChangeEventHandler = App.events.onDataChange(data => {
            if (data && data.members && data.members[this._memberId]) {
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
     * @memberof MemberProfile
     */
    shouldComponentUpdate(nextProps) {
        return isJustLangSwitched() || nextProps.compact !== this.props.compact || nextProps.className !== this.props.className || nextProps.hideChatBtn !== this.props.hideChatBtn || nextProps.onRequestClose !== this.props.onRequestClose || nextProps.memberId !== this._memberId;
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof MemberProfile
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
     * @memberof MemberProfile
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            memberId,
            className,
            onRequestClose,
            hideChatBtn,
            compact,
            ...other
        } = this.props;

        const member = App.members.get(memberId);
        this._memberId = member && member.id;
        const roleName = member.getRoleName(App);
        const deptName = member.getDeptName(App);

        return (<div
            {...other}
            className={HTML.classes('app-member-profile space user-selectable', className, {compact})}
        >
            <header className="list-item flex-middle space-sm">
                <UserAvatar className="avatar-xl flex-none" user={member} />
                <div className="content has-padding">
                    <h3 className="title strong">{member.displayName} <small className="muted">@{member.account}</small></h3>
                    <div className="flex flex-middle infos">
                        <StatusDot status={member.status} label />
                        {member.gender ? <div>{member.gender === 'f' ? <Icon name="human-female text-purple" /> : <Icon name="human-male text-blue" />}{Lang.string(`member.gender.${member.gender}`)}</div> : null}
                        {roleName ? <div><Icon name="account-card-details text-gray" />{roleName}</div> : null}
                        {(roleName && deptName) ? '·' : null}
                        {deptName ? <div>{(!roleName) ? <Icon name="account-card-details text-gray" /> : null}{deptName}</div> : null}
                    </div>
                </div>
                {!Config.ui['chat.denyChatFromMemberProfile'] && !hideChatBtn && !member.isDeleted && member.account !== App.profile.userAccount && <a href={`#${ROUTES.chats.contacts.id([member.id, App.profile.user.id].sort().join('&'))}`} onClick={onRequestClose} className="btn btn-lg rounded text-primary primary-pale"><Icon name="comment-text-outline" /> &nbsp;{Lang.string('member.profile.sendMessage')}</a>}
            </header>
            <div className="divider" />
            <div className="heading">
                <div className="title small text-gray">{Lang.string('member.profile.contactInfo')}</div>
            </div>
            {member.mobile && <div className="list-item contact-info-item">
                <Avatar icon="cellphone" className="flex-none circle blue" />
                <div className="content">
                    <div className="subtitle">{Lang.string('member.profile.mobile')}</div>
                    <input type="input" className="input clean" readOnly value={member.mobile} />
                </div>
            </div>}
            {member.email && <div className="list-item contact-info-item">
                <Avatar icon="email" className="flex-none circle red" />
                <div className="content">
                    <div className="subtitle">{Lang.string('member.profile.email')}</div>
                    <input type="input" className="input clean" readOnly value={member.email} />
                </div>
            </div>}
            {member.phone && <div className="list-item contact-info-item">
                <Avatar icon="phone" className="flex-none circle green" />
                <div className="content">
                    <div className="subtitle">{Lang.string('member.profile.phone')}</div>
                    <input type="input" className="input clean" readOnly value={member.phone} />
                </div>
            </div>}
        </div>);
    }
}
