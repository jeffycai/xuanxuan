import './style/app.less';
import './utils/debug';
import React from 'react';
import ReactDOM from 'react-dom';
import IndexView from './views/index';
import App from './core';

const appElement = document.getElementById('appContainer');
ReactDOM.render(<IndexView/>, appElement, () => {
    const loadingElement = document.getElementById('loading');
    loadingElement.parentNode.removeChild(loadingElement);
});

