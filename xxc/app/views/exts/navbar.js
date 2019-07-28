import React, {PureComponent} from 'react';
import Exts from '../../exts';
import App from '../../core';
import Avatar from '../../components/avatar';
import ROUTES from '../common/routes';
import Config from '../../config';
import {classes} from '../../utils/html-helper';
import Lang from '../../core/lang';

/**
 * ExtsNavbarView 组件 ，显示扩展应用导航
 * @class ExtsNavbarView
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import ExtsNavbarView from './app-home';
 * <ExtsNavbarView />
 */
export default class ExtsNavbarView extends PureComponent {
    /**
     * Navbar 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof Navbar
     */
    static replaceViewPath = 'exts/ExtsNavbarView';

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof ExtsNavbarView
     * @return {void}
     */
    componentDidMount() {
        this.onExtChangeHandler = Exts.all.onExtensionChange((changedExtensions) => {
            if (changedExtensions.some(x => x.isApp && (x.pinnedOnMenu || x.canPinnedOnMenu))) {
                this.forceUpdate();
            }
        });
        window.addEventListener('hashchange', this.handleHashChange);
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof ExtsNavbarView
     * @return {void}
     */
    componentWillUnmount() {
        App.events.off(this.onExtChangeHandler);
        window.removeEventListener('hashchange', this.handleHashChange);
    }

    /**
     * 处理应用右键菜单事件
     * @param {Event} e 事件对象
     * @memberof ExtsNavbarView
     * @private
     * @return {void}
     */
    handleAppContextMenu = e => {
        const app = Exts.all.getExt(e.currentTarget.attributes['data-name'].value);
        App.ui.showContextMenu({x: e.clientX, y: e.clientY, target: e.target}, Exts.ui.createNavbarAppContextMenu(app, () => {
            this.forceUpdate();
        }));
        e.preventDefault();
    }

    handleHashChange = () => {
        const isExtsView = window.location.hash.startsWith('#/exts/');
        if (isExtsView || this._lastIsExtsView !== isExtsView) {
            this.forceUpdate();
            this._lastIsExtsView = isExtsView;
        }
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ExtsNavbarView
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const apps = Exts.all.apps.filter(x => (!x.isFixed && !x.hidden && !x.disabled && x.pinnedOnMenu));
        let hasAppActive = false;
        const isExtsView = window.location.hash.startsWith('#/exts/');
        const items = apps.map((app) => {
            const {menuIcon} = app;
            const openedApp = Exts.ui.getOpenedApp(app.name);
            const isCurrentApp = openedApp && isExtsView && Exts.ui.isCurrentOpenedApp(openedApp.id);
            if (isCurrentApp) {
                hasAppActive = true;
            }
            return {
                app,
                view: (
                    <div key={`app-${app.name}`} className="hint--right nav-item" data-hint={app.displayName}>
                        <a className={classes('block', {active: isCurrentApp, 'is-open': openedApp})} title={`【${app.displayName}】${app.description || ''}`} href={`#${ROUTES.exts.app.id(app.name)}`} onContextMenu={this.handleAppContextMenu} data-name={app.name}>
                            <Avatar size={Config.ui['navbar.width']} auto={menuIcon} className={classes('rounded flex-none', {'has-padding': !menuIcon.startsWith('mdi-')})} />
                        </a>
                    </div>
                )
            };
        });
        items.push({
            app: Exts.all.defaultApp,
            view: (
                <div key="app-home" className="hint--right nav-item" data-hint={Lang.string('navbar.exts.label')}>
                    <a className={classes('block', {active: isExtsView && !hasAppActive})} href={`#${hasAppActive ? ROUTES.exts.app.id('home') : ROUTES.exts._}`}>
                        <Avatar size={Config.ui['navbar.width']} icon="mdi-apps" className="rounded flex-none" />
                    </a>
                </div>
            ),
        });
        items.sort((x1, x2) => {
            const app1 = x1.app;
            const app2 = x2.app;
            let result = 0;
            if (typeof app1.pinnedOnMenuOrder === 'number' && typeof app2.pinnedOnMenuOrder === 'number') {
                result = app1.pinnedOnMenuOrder - app2.pinnedOnMenuOrder;
            }
            if (!result) {
                result = app1.installTime - app2.installTime;
            }
            return result;
        });
        return items.map(x => x.view);
    }
}
