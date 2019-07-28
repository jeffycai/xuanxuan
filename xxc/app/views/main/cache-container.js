import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ExtsView from 'ExtsView';
import ROUTES from '../common/routes';
import _ChatsIndex from '../chats';
import withReplaceView from '../with-replace-view';

/**
 * ChatsIndex 可替换组件形式
 * @type {Class<ChatsIndex>}
 * @private
 */
const ChatsIndex = withReplaceView(_ChatsIndex);

/**
 * 主界面视图路由清单
 * @type {{path: string, view: Class<Component>}
 * @private
 */
const mainViews = [
    {path: ROUTES.chats._, view: ChatsIndex},
];

// 如果扩展视图可用，将扩展视图加入主界面视图清单
if (ExtsView) {
    mainViews.push({path: ROUTES.exts._, view: ExtsView});
}

/**
 * CacheContainer 组件 ，显示主界面视图缓存容器界面
 * @class CacheContainer
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import CacheContainer from './cache-container';
 * <CacheContainer />
 */
export default class CacheContainer extends Component {
    /**
     * CacheContainer 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof CacheContainer
     */
    static replaceViewPath = 'main/CacheContainer';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof CacheContainer
     * @type {Object}
     */
    static propTypes = {
        match: PropTypes.any,
        location: PropTypes.any,
        history: PropTypes.any,
        staticContext: PropTypes.any
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof CacheContainer
     * @static
     */
    static defaultProps = {
        match: null,
        location: null,
        history: PropTypes.any,
        staticContext: PropTypes.any
    };

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof CacheContainer
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            match,
            location,
            history,
            staticContext,
            ...other
        } = this.props;

        return (
            <div className="app-main-container dock" {...other}>
                {
                    mainViews.map(item => {
                        const isMatch = match.url.startsWith(item.path);
                        if (isMatch) {
                            item.active = true;
                            return <item.view key={item.path} match={match} />;
                        }
                        if (item.active) {
                            return <item.view key={item.path} match={match} hidden />;
                        }
                        return null;
                    })
                }
            </div>
        );
    }
}
