import React, {Component} from 'react';
import Popover from '../../components/popover';
import Lang from '../../core/lang';
import profile from '../../core/profile';
import DelayAction from '../../utils/delay-action';

/**
 * 默认字体设置
 * @type {{size: number, lineHeight: number, title: number, titleLineHeight: number}}
 * @private
 */
const DEFAULT_CONFIG = {
    size: 13,
    lineHeight: 1.5384615385,
    title: 13,
    titleLineHeight: 1.53846153846
};

/**
 * 所有字体设置
 * @type {{size: number, lineHeight: number, title: number, titleLineHeight: number}[]}
 * @private
 */
const CONFIGS = [
    {
        size: 12,
        lineHeight: 1.5,
        title: 12,
        titleLineHeight: 1.5
    }, DEFAULT_CONFIG, {
        size: 14,
        lineHeight: 1.5,
        title: 14,
        titleLineHeight: 1.4285714286
    }, {
        size: 15,
        lineHeight: 1.5,
        title: 15,
        titleLineHeight: 1.6
    }, {
        size: 18,
        lineHeight: 1.5,
        title: 15,
        titleLineHeight: 1.6
    }, {
        size: 20,
        lineHeight: 1.5,
        title: 16,
        titleLineHeight: 1.75
    }, {
        size: 24,
        lineHeight: 1.5,
        title: 16,
        titleLineHeight: 1.75
    }, {
        size: 30,
        lineHeight: 1.5,
        title: 18,
        titleLineHeight: 1.666666667
    }, {
        size: 36,
        lineHeight: 1.5,
        title: 18,
        titleLineHeight: 1.666666667
    }
];

/**
 * ChatChangeFont-Popover 组件 ，显示一个聊天字体设置界面
 * @class ChatChangeFont-Popover
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example
 * import ChatChangeFont-Popover from './chat-change-font-popover';
 * <ChatChangeFont-Popover />
 */
export class ChangeFontView extends Component {
    /**
     * ChangeFontView 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof ChangeFontView
     */
    static replaceViewPath = 'chats/ChangeFontView';

    /**
     * React 组件构造函数，创建一个 ChatChangeFont-Popover 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);
        this.state = {select: 1};

        const userFontSize = profile.userConfig.chatFontSize;
        if (userFontSize) {
            const userIndex = CONFIGS.findIndex(x => x.size === userFontSize.size);
            if (userIndex > -1) {
                this.state.select = userIndex;
            }
        }

        this.changeFontSizeTask = new DelayAction(() => {
            const {select} = this.state;
            profile.userConfig.chatFontSize = CONFIGS[select];
        }, 200);
    }

    /**
     * React 组件生命周期函数：`componentWillUnmount`
     * 在组件被卸载和销毁之前立刻调用。可以在该方法里处理任何必要的清理工作，例如解绑定时器，取消网络请求，清理
    任何在componentDidMount环节创建的DOM元素。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentwillunmount
     * @private
     * @memberof ChatChangeFont-Popover
     * @return {void}
     */
    componentWillUnmount() {
        if (!this.changeFontSizeTask.isDone) {
            this.changeFontSizeTask.doIm();
        }
    }

    /**
     * 处理刻度条变更事件
     * @param {Event} e 事件对象
     * @memberof ChatChangeFont-Popover
     * @private
     * @return {void}
     */
    handleSliderChange = e => {
        const select = parseInt(e.target.value, 10);
        this.setState({select});
        this.changeFontSizeTask.do(select);
    }

    /**
     * 处理重置按钮点击事件
     * @param {Event} event 事件对象
     * @memberof ChatChangeFont-Popover
     * @private
     * @return {void}
     */
    handleResetBtnClick = (event) => {
        this.setState({select: 1});
        this.changeFontSizeTask.do(1);
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatChangeFont-Popover
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {select} = this.state;
        const currentConfig = CONFIGS[select];
        return (
            <div className="box">
                <div className="flex space space-between">
                    <strong>{Lang.string('chat.sendbox.toolbar.setFontSize')}</strong>
                    <small className="text-gray">{Lang.format('chat.fontSize.current.format', currentConfig.size)}px  {select !== 1 ? <a className="text-primary" onClick={this.handleResetBtnClick}>{Lang.string('chat.fontSize.resetDefault')}</a> : null}</small>
                </div>
                <input className="fluid" type="range" min="0" value={select} max={CONFIGS.length - 1} step="1" onChange={this.handleSliderChange} />
            </div>
        );
    }
}

/**
 * 显示聊天字体设置弹出面板
 * @param {{x: number, y: number}} position 显示位置
 * @param {function} callback 显示完成后的回调函数
 * @return {void}
 */
export const showChangeFontPopover = (position, callback) => {
    const popoverId = 'app-chat-change-font-popover';
    return Popover.show(
        position,
        <ChangeFontView />,
        {id: popoverId, width: 250, height: 80},
        callback
    );
};

export default {
    show: showChangeFontPopover
};
