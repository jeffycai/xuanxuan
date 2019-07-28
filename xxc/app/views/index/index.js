import React, {PureComponent} from 'react';
import {HashRouter as Router, Route, Switch} from 'react-router-dom';
import ImageCutterApp from './app-image-cutter';
import _AppView from './app-view';
import withReplaceView from '../with-replace-view';

/**
 * AppView 可替换组件形式
 * @type {Class<AppView>}
 * @private
 */
const AppView = withReplaceView(_AppView);

/**
 * HomeIndex 组件 ，显示喧喧应用窗口界面
 * @class HomeIndex
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import HomeIndex from './index';
 * <HomeIndex />
 */
export default class HomeIndex extends PureComponent {
    /**
     * HomeIndex 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof HomeIndex
     */
    static replaceViewPath = 'index/HomeIndex';

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof HomeIndex
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        return (
            <Router>
                <Switch>
                    <Route path="/image-cutter/:file?" component={ImageCutterApp} />
                    <Route path="/:app?" component={AppView} />
                </Switch>
            </Router>
        );
    }
}
