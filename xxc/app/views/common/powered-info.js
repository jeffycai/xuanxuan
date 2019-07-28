import React, {PureComponent} from 'react';
import lang from '../../core/lang';

/**
 * PoweredInfo 组件 ，显示构建信息
 * @class PoweredInfo
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {PureComponent}
 * @example
 * import PoweredInfo from './build-info';
 * <PoweredInfo />
 */
export default class PoweredInfo extends PureComponent {
    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof PoweredInfo
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        return <a href="http://xuan.im" target="_blank" {...this.props}>{lang.string('common.poweredBy')} {this.props.children}</a>;
    }
}
