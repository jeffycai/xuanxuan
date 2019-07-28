/**
 * 获取组件的可替换类，如果找不到可替换类，则返回原始类
 * @param {Class<Component>} OriginViewComponent 组件原始类
 * @param {String} path 组件路径
 * @return {Class<Component>} 组件的可替换类
 */
export default (OriginViewComponent) => {
    return (global.replaceViews && global.replaceViews[OriginViewComponent.replaceViewPath]) || OriginViewComponent;
};
