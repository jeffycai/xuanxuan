import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Editor,
    EditorState,
    RichUtils,
    Entity,
    AtomicBlockUtils,
    convertToRaw,
    CompositeDecorator,
    Modifier
} from 'draft-js';
import Emojione from '../../components/emojione';
import App from '../../core';
import timeSequence from '../../utils/time-sequence';
import Lang from '../../core/lang';

/**
 * DraftJS Atomic 组件
 * @param {Object} props React 组件属性
 * @return {ReactNode|string|number|null|boolean} React 渲染内容
 * @private
 */
const AtomicComponent = props => {
    const key = props.block.getEntityAt(0);
    if (!key) {
        return null;
    }
    const entity = Entity.get(key);
    const type = entity.getType();
    if (type === 'image') {
        const data = entity.getData();
        return (<img
            className="draft-editor-image"
            src={data.src}
            alt={data.alt || ''}
        />);
    } else if (type === 'emoji') {
        const emoji = entity.getData().emoji;
        const emojionePngPath = Emojione.imagePathPNG + emoji.unicode + '.png' + Emojione.cacheBustParam;
        return <span><img className="emojione" style={{maxWidth: 20, maxHeight: 20}} contentEditable="false" data-offset-key={props.offsetKey} src={emojionePngPath} alt={Emojione.shortnameToUnicode(emoji.shortname)} title={emoji.name} />&nbsp;</span>;
    }
    return null;
};

/**
 * 使用正则表达式查找内容
 * @param {Regex} regex 正则表达式
 * @param {Object} contentBlock 内容块
 * @param {function} callback 回调函数
 * @return {void}
 * @private
 */
const findWithRegex = (regex, contentBlock, callback) => {
    const text = contentBlock.getText();
    let matchArr;
    let start;
    while ((matchArr = regex.exec(text)) !== null) {
        start = matchArr.index;
        callback(start, start + matchArr[0].length);
    }
};

/**
 * @所有人文本
 * @type {string}
 * @private
 */
const langAtAll = Lang.string('chat.message.atAll');

/**
 * DraftJS CompositeDecorator 对象
 * @type {CompositeDecorator}
 * @private
 */
const draftDecorator = new CompositeDecorator([{
    strategy: (contentBlock, callback, contentState) => {
        findWithRegex(Emojione.regUnicode, contentBlock, callback);
    },
    component: (props) => {
        const unicode = props.decoratedText.trim();
        const map = Emojione.mapUnicodeCharactersToShort();
        const emoji = Emojione.emojioneList[map[unicode]];
        if (emoji) {
            const emojionePngPath = Emojione.imagePathPNG + emoji.uc_base + '.' + Emojione.imageType;
            const backgroundImage = 'url(' + emojionePngPath + ') no-repeat left top';
            return <span title={unicode} data-offset-key={props.offsetKey} style={{width: 16, height: 16, display: 'inline-block', overflow: 'hidden', whiteSpace: 'nowrap', background: backgroundImage, backgroundSize: 'contain', textAlign: 'right', verticalAlign: 'bottom', position: 'relative', top: -2, fontSize: '16px', color: 'transparent'}}>{props.children}</span>;
        }
        return <span data-offset-key={props.offsetKey}>{props.children}</span>;
    }
}, {
    strategy: (contentBlock, callback, contentState) => {
        findWithRegex(/@[\u4e00-\u9fa5_\w]+[，。,\.\/\s:@\n]/g, contentBlock, callback);
    },
    component: (props) => {
        const guess = props.decoratedText.substr(1).trim().replace(/[，。,\.\/\s:@\n]/g, '');
        if (guess) {
            if (guess === 'all' || guess === langAtAll) {
                return <span title={langAtAll} className="at-all text-primary" data-offset-key={props.offsetKey}>{props.children}</span>;
            } else {
                const member = App.members.guess(guess);
                if (member && member.id) {
                    return <a className="app-link text-primary" href={'@Member/' + member.id} title={'@' + member.displayName} data-offset-key={props.offsetKey}>{props.children}</a>;
                }
            }
        }
        return <span data-offset-key={props.offsetKey}>{props.children}</span>;
    }
}, {
    strategy: (contentBlock, callback, contentState) => {
        findWithRegex(/(https?):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g, contentBlock, callback);
    },
    component: (props) => {
        const url = props.decoratedText;
        return <a className="text-primary" data-offset-key={props.offsetKey} href={url}>{props.children}</a>;
    }
}]);


/**
 * DraftEditor 组件 ，显示消息编辑器界面
 * @class DraftEditor
 * @see https://react.docschina.org/docs/components-and-props.html
 * @extends {Component}
 * @example @lang jsx
 * import DraftEditor from './draft-editor';
 * <DraftEditor />
 */
export default class DraftEditor extends PureComponent {
    /**
     * DraftEditor 对应的可替换类路径名称
     *
     * @type {String}
     * @static
     * @memberof DraftEditor
     */
    static replaceViewPath = 'common/DraftEditor';

    /**
     * React 组件属性类型检查
     * @see https://react.docschina.org/docs/typechecking-with-proptypes.html
     * @static
     * @memberof DraftEditor
     * @type {Object}
     */
    static propTypes = {
        placeholder: PropTypes.string,
        onChange: PropTypes.func,
        handleKey: PropTypes.bool,
        onReturnKeyDown: PropTypes.func,
        onPastedText: PropTypes.func,
        onPastedFiles: PropTypes.func,
    };

    /**
     * React 组件默认属性
     * @see https://react.docschina.org/docs/react-component.html#defaultprops
     * @type {object}
     * @memberof DraftEditor
     * @static
     */
    static defaultProps = {
        placeholder: null,
        onChange: null,
        onReturnKeyDown: null,
        onPastedText: null,
        onPastedFiles: null,
        handleKey: false,
    };

    /**
     * React 组件构造函数，创建一个 DraftEditor 组件实例，会在装配之前被调用。
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
        this.state = {editorState: EditorState.createEmpty(draftDecorator)};

        this.onChange = this.onChange.bind(this);
        this.handleKeyCommand = this.handleKeyCommand.bind(this);
        this.handleReturn = this.handleReturn.bind(this);
        this.blockRendererFn = this.blockRendererFn.bind(this);
        this.handlePastedText = this.handlePastedText.bind(this);
        this.handlePastedFiles = this.handlePastedFiles.bind(this);
    }

    /**
     * React 组件生命周期函数：`componentDidMount`
     * 在组件被装配后立即调用。初始化使得DOM节点应该进行到这里。若你需要从远端加载数据，这是一个适合实现网络请
    求的地方。在该方法里设置状态将会触发重渲。
     *
     * @see https://doc.react-china.org/docs/react-component.html#componentDidMount
     * @private
     * @memberof DraftEditor
     * @return {void}
     */
    componentDidMount() {
        if (this.lastFocusTimer) {
            clearTimeout(this.lastFocusTimer);
            this.lastFocusTimer = null;
        }
    }

    /**
     * 获取输入框文本内容
     *
     * @return {string} 输入框文本内容
     * @memberof DraftEditor
     */
    getContent() {
        const {editorState} = this.state;
        return editorState.getCurrentContent().getPlainText();
    }

    /**
     * 清空输入框文本内容
     *
     * @return {void}
     * @memberof DraftEditor
     */
    clearContent() {
        this.onChange(EditorState.createEmpty(draftDecorator));
    }

    /**
     * 向输入框添加文本内容
     *
     * @param {string} content 文本内容
     * @param {boolean} asNewLine 是否添加到新的一行
     * @param {function} callback 回调函数
     * @memberof DraftEditor
     * @return {void}
     */
    appendContent(content, asNewLine, callback) {
        if (content !== null && content !== undefined) {
            const {editorState} = this.state;
            const selection = editorState.getSelection();
            const contentState = editorState.getCurrentContent();
            const ncs = Modifier.insertText(contentState, selection, content);
            const newEditorState = EditorState.push(editorState, ncs, 'insert-fragment');
            this.onChange(newEditorState, callback);
        }
    }

    /**
     * 向输入框添加 Emoji 表情
     *
     * @param {Object|{shortname: string}} emoji Emojione 表情对象
     * @param {function} callback 回调函数
     * @memberof DraftEditor
     * @return {void}
     */
    appendEmojione(emoji, callback) {
        this.appendContent(Emojione.shortnameToUnicode(emoji.shortname), callback);
    }

    /**
     * 向输入框添加图片
     *
     * @param {FileData|Blob|File|{path: string}|{url:string}} image 图片
     * @param {function} callback 回调函数
     * @memberof DraftEditor
     * @return {void}
     */
    appendImage(image, callback) {
        const {editorState} = this.state;
        const contentState = editorState.getCurrentContent();
        let imageSrc = image.path || image.url;
        if (!imageSrc) {
            if (image.blob) {
                imageSrc = URL.createObjectURL(image.blob);
            } else if (image instanceof Blob || image instanceof File) {
                imageSrc = URL.createObjectURL(image);
            }
        } else if (!imageSrc.startsWith('http://') && !imageSrc.startsWith('https://')) {
            imageSrc = `file://${imageSrc}`;
        }
        const contentStateWithEntity = contentState.createEntity(
            'image',
            'IMMUTABLE',
            {src: imageSrc, alt: image.name || '', image}
        );
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        const newEditorState = EditorState.set(
            editorState,
            {currentContent: contentStateWithEntity}
        );
        this.onChange(AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' '), callback);
    }

    /**
     * 获取输入框内容列表
     * @memberof DraftEditor
     * @return {{type: string, content: string, image: Object}[]} 内容列表
     */
    getContentList() {
        const contents = [];
        const {editorState} = this.state;
        const contentState = editorState.getCurrentContent();
        const raw = convertToRaw(contentState);
        let thisTextContent = '';
        raw.blocks.forEach(block => {
            if (block.type === 'atomic') {
                if (thisTextContent.length && thisTextContent.trim().length) {
                    contents.push({type: 'text', content: thisTextContent});
                    thisTextContent = '';
                }
                if (block.entityRanges && block.entityRanges.length) {
                    contents.push({type: 'image', image: raw.entityMap[block.entityRanges[0].key].data.image});
                }
            } else {
                if (thisTextContent.length) {
                    thisTextContent += '\n';
                }
                thisTextContent += block.text;
            }
        });
        if (thisTextContent.length && thisTextContent.trim().length) {
            contents.push({type: 'text', content: thisTextContent});
            thisTextContent = '';
        }
        return contents;
    }

    /**
     * 激活输入框
     * @param {number} [delay=100] 延迟事件，单位毫秒
     * @return {void}
     */
    focus(delay = 100) {
        if (this.lastFocusTimer) {
            clearTimeout(this.lastFocusTimer);
            this.lastFocusTimer = null;
        }
        this.lastFocusTimer = setTimeout(() => {
            this.editor.focus();
            this.lastFocusTimer = null;
        }, delay);
    }

    /**
     * 处理输入框值变更事件
     * @param {EditorState} editorState DraftJS EditorState 对象
     * @param {function} callback 回调函数
     * @memberof DraftEditor
     * @private
     * @return {void}
     */
    onChange(editorState, callback) {
        const contentState = editorState.getCurrentContent();
        this.setState({editorState}, () => {
            if (callback) {
                callback(contentState);
            }
            const {onChange} = this.props;
            if (onChange) {
                onChange(contentState);
            }
        });
    }

    /**
     * 处理键盘命令事件
     * @param {string} command 命令名称
     * @memberof DraftEditor
     * @private
     * @return {void}
     */
    handleKeyCommand(command) {
        const {handleKey} = this.props;
        if (!handleKey) {
            return;
        }
        const {editorState} = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            this.onChange(newState);
            return 'handled';
        }
        return 'not-handled';
    }

    /**
     * 处理回车键按下事件
     * @param {Event} e 事件对象
     * @memberof DraftEditor
     * @private
     * @return {void}
     */
    handleReturn(e) {
        const {onReturnKeyDown} = this.props;
        if (onReturnKeyDown) {
            return onReturnKeyDown(e);
        }
        return 'not-handled';
    }

    /**
     * 处理粘贴文本事件
     * @param {string} text 要粘贴的纯文本
     * @param {string} html 要粘贴的 HTML 文本
     * @memberof DraftEditor
     * @private
     * @return {void}
     */
    handlePastedText(text, html) {
        const {onPastedText} = this.props;
        if (onPastedText) {
            onPastedText(text, html);
        } else {
            this.appendContent(text || html);
        }
        return 'handled';
    }

    /**
     * 处理粘贴文件事件
     * @param {Blob[]} files 文件列表
     * @memberof DraftEditor
     * @private
     * @return {void}
     */
    handlePastedFiles(files) {
        const {onPastedFiles} = this.props;
        if (onPastedFiles) {
            onPastedFiles(files);
        } else {
            const date = new Date();
            files.forEach(blob => {
                if (blob.type.startsWith('image/')) {
                    this.appendImage({
                        lastModified: date.getTime(),
                        lastModifiedDate: date,
                        name: `clipboard-image-${timeSequence()}.png`,
                        size: blob.size,
                        blob,
                        type: blob.type
                    });
                }
            });
        }
        return 'handled';
    }

    /**
     * DrafJS blockRendererFn 回调函数
     * @param {Object} contentBlock 内容块对象
     * @memberof DraftEditor
     * @private
     * @return {Object} 内容对象
     */
    blockRendererFn(contentBlock) {
        const type = contentBlock.getType();
        let result = null;

        if (type === 'atomic') {
            result = {
                component: AtomicComponent,
                editable: true,
            };
        }

        return result;
    }

    /**
     * React 组件生命周期函数：Render
     * @private
     * @see https://doc.react-china.org/docs/react-component.html#render
     * @see https://doc.react-china.org/docs/rendering-elements.html
     * @memberof DraftEditor
     * @return {ReactNode|string|number|null|boolean} React 渲染内容
     */
    render() {
        const {
            placeholder,
            onReturnKeyDown,
            onPastedFiles,
            onPastedText,
            handleKey,
            ...other
        } = this.props;

        return (<div {...other} onClick={() => {this.focus(0);}}>
            <Editor
                ref={e => {this.editor = e;}}
                placeholder={placeholder}
                editorState={this.state.editorState}
                onChange={this.onChange}
                handleKeyCommand={this.handleKeyCommand}
                handleReturn={this.handleReturn}
                blockRendererFn={this.blockRendererFn}
                handlePastedText={this.handlePastedText}
                handlePastedFiles={this.handlePastedFiles}
            />
        </div>);
    }
}
