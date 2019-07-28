import React, {Component} from 'react';
import SelectBox from '../../components/select-box';
import Lang from '../../core/lang';
import {rem, classes} from '../../utils/html-helper';
import Config from '../../config';
import {isNotEmptyString} from '../../utils/string-helper';

/**
 * ChatSendCode 组件 ，显示ChatSendCode界面
 * @class ChatSendCode
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example @lang jsx
 * import ChatSendCode from './chat-send-code';
 * <ChatSendCode />
 */
export default class ChatSendCode extends Component {
    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof ChatSendCode
     * @type {Object}
     */

    /**
     * React 组件构造函数，创建一个 ChatCode 组件实例，会在装配之前被调用。
     * @see https://react.docschina.org/docs/react-component.html#constructor
     * @param {Object?} props 组件属性对象
     * @constructor
     */
    constructor(props) {
        super(props);

        /**
         * React 组件状态对象
         * @see https://react.docschina.org/docs/state-and-lifecycle.html
         * @type {object}
         */
        this.state = {
            language: '',
            code: '',
            requireCodeWarning: false,
        };
    }

    /**
     * 处理代码变更事件
     * @param {Event} e 事件对象
     * @private
     * @memberof ChatSendCode
     * @return {void}
     */
    handleCodeChange = (e) => {
        const code = e.target.value;
        const newState = {code};
        const {requireCodeWarning} = this.state;
        if (requireCodeWarning && isNotEmptyString(code)) {
            newState.requireCodeWarning = false;
        }
        this.setState(newState);
    };

    /**
     * 处理语言变更事件
     * @param {String} language select 组件变更的值
     * @memberof ChatSendCode
     * @private
     * @return {void}
     */
    handleLangChange = language => {
        this.setState({language});
    };

    /**
     *  获取发送的语言和内容
     *  @private
     *  @return {Object} 发送的内容信息
     */
    getCode() {
        const {language, code} = this.state;
        return {language, code};
    }

    /**
     * 设置是否显示需要代码的提示
     * @param {boolean} [requireCodeWarning=true] 如果为 `true`，则显示需要代码的提示
     * @return {void}
     * @memberof ChatSendCode
     */
    setRequireCodeWarning(requireCodeWarning = true) {
        this.setState({requireCodeWarning});
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof ChatSendCode
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {language, requireCodeWarning} = this.state;
        const codeLanguage = [
            {label: Lang.string('chat.sendCode.defaultLanguage'), value: ''},
            ...Config.ui['chat.sendCode.langs'],
        ];
        return (
            <div className="relative">
                <SelectBox
                    style={{width: rem(140), right: rem(8), top: rem(8)}}
                    value={language}
                    options={codeLanguage}
                    className="dock dock-right dock-top"
                    selectClassName="rounded"
                    onChange={this.handleLangChange}
                />
                <div className={classes('control', {'has-error': requireCodeWarning})}>
                    <textarea
                        className="textarea rounded code"
                        rows="16"
                        placeholder={`${Lang.string('chat.sendCode.content.placeholder')}`}
                        onChange={this.handleCodeChange}
                    />
                </div>
            </div>
        );
    }
}
