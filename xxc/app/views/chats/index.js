import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Route, Redirect} from 'react-router-dom';
import SplitPane from 'react-split-pane';
import {classes} from '../../utils/html-helper';
import App from '../../core';
import _Menu from './menu';
import _ChatsCache from './chats-cache';
import _ChatsDndContainer from './chats-dnd-container';
import _ChatsSuggestPanel from './chats-suggest-panel';
import withReplaceView from '../with-replace-view';

/**
 * Menu 可替换组件形式
 * @type {Class<Menu>}
 * @private
 */
const Menu = withReplaceView(_Menu);

/**
 * ChatsSuggestPanel 可替换组件形式
 * @type {Class<ChatsSuggestPanel>}
 * @private
 */
const ChatsSuggestPanel = withReplaceView(_ChatsSuggestPanel);

/**
 * ChatsDndContainer 可替换组件形式
 * @type {Class<ChatsDndContainer>}
 * @private
 */
const ChatsDndContainer = withReplaceView(_ChatsDndContainer);

/**
 * ChatsCache 可替换组件形式
 * @type {Class<ChatsCache>}
 * @private
 */
const ChatsCache = withReplaceView(_ChatsCache);

/**
 * ChatsIndex 组件 ，显示聊天主界面
 * @class ChatsIndex
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatsIndex from './index';
 * <ChatsIndex />
 */
export default class ChatsIndex extends Component {
    /**
     * ChatsIndex 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChatsIndex
     */
    static replaceViewPath = 'chats/ChatsIndex';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatsIndex
     * @type {Object}
     */
    static propTypes = {
        match: PropTypes.object.isRequired,
        hidden: PropTypes.bool,
        className: PropTypes.string,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof ChatsIndex
     * @static
     */
    static defaultProps = {
        hidden: false,
        className: null,
    };

    /**
     * 处理聊天缓存界面点击点击事件
     * @memberof ChatsIndex
     * @private
     * @return {void}
     */
    handChatsCacheClick = () => {
        App.ui.showMobileChatsMenu(false);
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatsIndex
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            hidden,
            className,
            match
        } = this.props;

        return (
            <div className={classes('dock app-chats', className, {hidden})}>
                <SplitPane split="vertical" maxSize={400} minSize={200} defaultSize={200} paneStyle={{userSelect: 'none'}}>
                    <Menu className="dock" filter={match.params.filterType} activeChatId={match.params.id} />
                    <ChatsCache onClick={this.handChatsCacheClick} className="dock" filterType={match.params.filterType} activeChatId={match.params.id}>
                        <ChatsDndContainer className="dock" />
                    </ChatsCache>
                </SplitPane>
                <Route
                    path="/chats/:filterType"
                    exact
                    render={props => {
                        const activeChatId = App.im.ui.currentActiveChatId;
                        if (activeChatId) {
                            return <Redirect to={`${props.match.url}/${activeChatId}`} />;
                        }
                        return null;
                    }}
                />
                <ChatsSuggestPanel />
            </div>
        );
    }
}
