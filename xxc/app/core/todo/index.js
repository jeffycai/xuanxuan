import removeMarkdown from 'remove-markdown';
import {socket} from '../server';
import Markdown from '../../utils/markdown';

/**
 * 将待办存储对象提交到服务器进行存储
 * @param {Object} todo 待办存储对象
 * @returns {Promise} 使用 Promise 异步返回处理结果
 */
export const createTodo = todo => {
    if (!todo.type) {
        todo.type = 'custom';
    }
    if (todo.desc) {
        todo.desc = `${Markdown(todo.desc)}<div class="hidden xxc-todo-source" style="display: none">${todo.desc}</div>`;
    }

    return socket.sendAndListen({
        method: 'upserttodo',
        params: [todo]
    });
};

/**
 * 请求将聊天消息转换为待办
 * @param {ChatMessage} message 聊天消息
 * @return {Object} 待办存储对象
 */
export const createTodoFromMessage = message => {
    const {content} = message;
    const todo = {desc: content};
    const plainContent = removeMarkdown(content);
    const selectedText = document.getSelection().toString();
    let todoName = plainContent;
    if (selectedText && plainContent.includes(selectedText)) {
        todoName = selectedText;
    } else {
        const breakIndex = plainContent.indexOf('\n');
        if (breakIndex > 0) {
            todoName = plainContent.substr(0, breakIndex);
        }
    }
    if (todoName.length > 145) {
        todoName = todoName.sub(0, 144);
    }
    todo.name = todoName;
    return todo;
};
