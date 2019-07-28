/**
 * 根据排序依据属性对一个对象数组进行排序
 * @param {!any[]} list 要排序的列表
 * @param {!(string|string[])} orders 排序依据的属性或者多个属性组成的数组
 * @return {any[]}
 */
export const sortList = (list, orders) => {
    if (!orders) {
        if (DEBUG) {
            console.error('Param orders cannot be null on call Helper.sortList(list, orders)');
        }
        return list;
    }
    if (typeof orders === 'string') {
        orders = orders.split(' ');
    } else if (!Array.isArray(orders)) {
        orders = [orders];
    }
    let isFinalInverse = false;
    if (orders[0] === '-' || orders[0] === -1) {
        isFinalInverse = true;
        orders.shift();
    }
    return list.sort((y, x) => {
        let result = 0;
        for (let order of orders) {
            if (result !== 0) break;
            if (typeof order === 'function') {
                result = order(y, x);
            } else {
                const isInverse = order[0] === '-';
                if (isInverse) order = order.substr(1);
                let xValue = x[order];
                let yValue = y[order];
                if (xValue === undefined || xValue === null) xValue = 0;
                if (yValue === undefined || yValue === null) yValue = 0;
                result = xValue < yValue ? 1 : (xValue === yValue ? 0 : -1);
                result *= isInverse ? (-1) : 1;
            }
        }
        return result * (isFinalInverse ? (-1) : 1);
    });
};

export default {sortList};
