import React from 'react';

// 使用 why-did-you-update 优化 react 性能
// see https://github.com/maicki/why-did-you-update

const wdyu = false;

if (wdyu && process.env.NODE_ENV !== 'production') {
    try {
        const {whyDidYouUpdate} = __non_webpack_require__('why-did-you-update'); // eslint-disable-line
        whyDidYouUpdate(React);
    } catch (error) {
        console.warn('Cannot find the debug module why-did-you-update.');
    }
}
