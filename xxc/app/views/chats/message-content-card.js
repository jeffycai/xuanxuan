import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import {openUrl} from '../../core/ui';
import Button from '../../components/button';
import Avatar from '../../components/avatar';
import StringHelper from '../../utils/string-helper';
import Lang from '../../core/lang';
import _WebView from '../common/webview';
import withReplaceView from '../with-replace-view';

/**
 * WebView 可替换组件形式
 * @type {Class<WebView>}
 * @private
 */
const WebView = withReplaceView(_WebView);

/**
 * 处理动作按钮点击事件
 * @param {{url: string}} action 动作对象
 * @param {Event} e 事件对象
 * @return {void}
 * @private
 */
const handleActionButtonClick = (action, e) => {
    if (action.url && openUrl(action.url, e.target)) {
        e.stopPropagation();
    } else if (action.click) {
        action.click(e);
        e.stopPropagation();
    }
};

/**
 * 处理菜单图标点击事件
 * @param {{click: function(event: Event)}} menuItem 动作对象
 * @param {Event} e 事件对象
 * @return {void}
 * @private
 */
const handleMenuIconClick = (menuItem, e) => {
    if (menuItem.click) {
        menuItem.click(e);
        e.stopPropagation();
    }
};

/**
 * MessageContentCard 组件 ，显示消息卡片界面
 * @class MessageContentCard
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import MessageContentCard from './message-content-card';
 * <MessageContentCard />
 */
export default class MessageContentCard extends Component {
    /**
     * MessageContentCard 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof MessageContentCard
     */
    static replaceViewPath = 'chats/MessageContentCard';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof MessageContentCard
     * @type {Object}
     */
    static propTypes = {
        baseClassName: PropTypes.string,
        card: PropTypes.object.isRequired,
        className: PropTypes.string,
        header: PropTypes.any,
        children: PropTypes.any,
        style: PropTypes.object,
        fluidWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof MessageContentCard
     * @static
     */
    static defaultProps = {
        baseClassName: 'layer rounded shadow-2',
        className: '',
        header: null,
        style: null,
        children: null,
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof MessageContentCard
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            card,
            className,
            baseClassName,
            header,
            children,
            fluidWidth,
            style,
            ...other
        } = this.props;

        const {
            image, title, subtitle, content, icon, actions, url, htmlContent, webviewContent, contentType, contentUrl, originContentType, menu, provider, clickable,
        } = card;
        let topView = null;
        if (contentUrl) {
            if (contentType === 'image') {
                topView = <img src={contentUrl} alt={contentUrl} />;
            } else if (contentType === 'video') {
                topView = (
                    <video controls>
                        <source src={contentUrl} type={originContentType} />
                    </video>
                );
            }
        }
        if (!topView && image) {
            topView = React.isValidElement(image) ? image : <div className="img" style={{backgroundImage: `url(${image})`}} />;
        }

        const titleView = title ? (React.isValidElement(title) ? title : <h4>{title}</h4>) : null;
        const subTitleView = subtitle ? (React.isValidElement(subtitle) ? subtitle : <h5>{subtitle}</h5>) : null;
        const avatarView = icon ? Avatar.render(icon) : null;

        let contentView = null;
        if (StringHelper.isNotEmpty(content)) {
            if (React.isValidElement(content)) {
                contentView = content;
            } else if (webviewContent) {
                contentView = <WebView fluidWidth={fluidWidth} className="relative" {...content} />;
            } else if (htmlContent) {
                contentView = <div className="content" dangerouslySetInnerHTML={{__html: content}} />; // eslint-disable-line
            } else {
                contentView = <div className="content">{content}</div>;
            }
        }

        const actionsButtons = [];
        if (actions) {
            actions.forEach((action) => {
                actionsButtons.push(<Button className={action.btnClass || 'rounded primary outline'} key={action.id || action.label} label={action.label} icon={action.icon} onClick={handleActionButtonClick.bind(this, action)} />);
            });
        }

        const cardsMenu = [];
        if (menu && menu.length) {
            menu.forEach((menuItem) => {
                cardsMenu.push(<div key={menuItem.id || menuItem.label} className="hint--top-left" data-hint={menuItem.label}><a className="btn rounded iconbutton" onClick={menuItem.click ? handleMenuIconClick.bind(this, menuItem) : null} href={menuItem.url}><Avatar auto={menuItem.icon} className="avatar-sm" /></a></div>);
            });
        }
        if (provider) {
            cardsMenu.push(<div key="provider" className="hint--top-left" data-hint={Lang.format('chat.message.provider.format', provider.label || provider.name)}><a className="btn rounded iconbutton" onClick={provider.click} href={provider.url}><Avatar auto={provider.icon} className="avatar-sm" /></a></div>);
        }

        const clickView = (clickable && clickable !== true) ? <a className="dock" href={url || contentUrl} title={titleView ? title : null} /> : null;
        return (
            <div
                className={classes('app-message-card', baseClassName, className, {
                    'app-link state': clickable === true,
                    'with-avatar': !!avatarView,
                    'only-title': !contentView && !subTitleView && !actionsButtons.length
                })}
                data-url={url}
                style={Object.assign({}, style, card.style)}
                {...other}
            >
                {topView}
                {(header || titleView || avatarView || subTitleView) ? (
                    <header>
                        {avatarView}
                        <hgroup>
                            {titleView}
                            {subTitleView}
                            {clickable === 'title' ? clickView : null}
                        </hgroup>
                        {header}
                        {clickable === 'header' ? clickView : null}
                    </header>
                ) : null}
                {contentView}
                {clickable === 'content' ? clickView : null}
                {actionsButtons && actionsButtons.length ? <nav className="nav actions gray">{actionsButtons}</nav> : null}
                {children}
                {cardsMenu && cardsMenu.length ? <div className="app-menu-card-menu">{cardsMenu}</div> : null}
            </div>
        );
    }
}
