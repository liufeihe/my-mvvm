function MVVM(options) {
    //this指的是vm，即vm = new MVVM(....);
    this.$options = options || {};
    var data = this._data = this.$options.data;
    var me = this;

    //数据代理，可以在vm中直接访问data中的属性
    //实现vm.xxxx -> vm._data.xxxx
    Object.keys(data).forEach(function(key){
        me._proxyData(key);
    });

    this._initComputed();//可以在vm中直接访问computed属性
    observe(data, this);
    this.$compile = new Compile(options.el || document.body, this);

}

MVVM.prototype = {
    $watch: function(key, cb, options){
        new Watcher(this, key, cb);
    },
    _proxyData: function(key, setter, getter){
        var me = this;
        setter = setter || Object.defineProperty(me, key, {
            configurable: false,
            enumerable: true,
            get: function proxyGetter(){
                return me._data[key];
            },
            set: function proxySetter(newVal){
                me._data[key] = newVal;
            }
        });
    },
    _initComputed: function(){
        var me = this;
        var computed = me.$options.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(function(key){
                Object.defineProperty(me, key, {
                    get: typeof computed[key] === 'function'?computed[key]:computed[key].get,
                    set: function(){}
                });
            });
        }
    }
}