const classes = (...args) => (
    args.map(arg => {
        if (Array.isArray(arg)) {
            return classes(arg);
        } else if (arg !== null && typeof arg === 'object') {
            return Object.keys(arg).filter(className => {
                const condition = arg[className];
                if (typeof condition === 'function') {
                    return !!condition();
                }
                return !!condition;
            }).join(' ');
        }
        return arg;
    }).filter(x => (typeof x === 'string') && x.length).join(' ')
);

const rem = (value, rootValue = 20) => (`${value / 20}rem`);

const getSearchParam = key => {
    const params = {};
    const search = window.location.search;
    if(search.length > 1) {
        const searchArr = search.substr(1).split('&');
        for(let pair of searchArr) {
            const pairValues = pair.split('=', 2);
            if(pairValues.length > 1) {
                params[pairValues[0]] = decodeURIComponent(pairValues[1]);
            } else {
                params[pairValues[0]] = '';
            }
        }
    }
    return key ? params[key] : params;
};

export default {
    classes,
    rem,
    getSearchParam
};
