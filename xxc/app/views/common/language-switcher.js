import React, {PureComponent} from 'react';
import Lang, {getAllLangList, loadLanguage, onLangChange} from '../../core/lang';
import Button from '../../components/button';
import {classes} from '../../utils/html-helper';
import events from '../../core/events';

/**
 * BuildInfo 组件 ，显示构建信息
 * @class BuildInfo
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import BuildInfo from './build-info';
 * <BuildInfo />
 */
export default class LanguageSwitcher extends PureComponent {
    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof LanguageSwitcher
     * @return {void}
     */
    componentDidMount() {
        this.onLangChangeHandler = onLangChange(() => {
            this.forceUpdate();
        });
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof LanguageSwitcher
     * @return {void}
     */
    componentWillUnmount() {
        events.off(this.onLangChangeHandler);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof BuildInfo
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const langList = getAllLangList();
        const currentLangName = Lang.name;
        return (
            <div className="app-lang-switcher">
                <header className="heading"><strong className="title">{Lang.string('comman.selectLanguage')}</strong></header>
                <div className="space-sm">
                    {
                        langList.map(lang => (
                            <Button
                                className={classes('has-margin-sm primary', {
                                    outline: currentLangName !== lang.name,
                                })}
                                key={lang.name}
                                onClick={loadLanguage.bind(null, lang.name)}
                            >
                                {lang.label}
                            </Button>
                        ))
                    }
                </div>
            </div>
        );
    }
}
