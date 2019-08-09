function observe(value, vm) {
    if (!value || typeof value !== 'object') {
        return;
    }
    return new Observer(value);
}

function Observer(data){
    this.data = data;
    this.walk(data);
}
Observer.prototype = {
    walk: function(data){
        var me = this;
        Object.keys(data).forEach(function(key){
            me.convert(key, data[key]);
        });
    },
    convert: function(key, val){
        this.defineReactive(this.data, key, val);
    },
    defineReactive: function(data, key, val){
        var dep = new Dep();
        observe(val);//监控子属性

        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: function(){
                if (Dep.target) {//如果是watcher中获取该属性，则把该watcher加入属性的依赖中，相当于订阅了该属性
                    dep.depend();
                }
                return val;
            },
            set: function(newVal){
                if (newVal === val) {
                    return;
                }
                val = newVal
                observe(newVal);//监控新子属性
                dep.notify();// 向订阅了该属性的watcher通知
            }
        });
    }
}

var uid = 0;
function Dep(){
    this.id = uid++;
    this.subs = [];
}
Dep.target = null;
Dep.prototype = {
    depend: function(){
        // 将dep.target（是个watcher）加入到 dep中
        Dep.target.addDep(this);
    },
    addSub: function(sub){
        this.subs.push(sub);
    },
    removeSub: function(sub){
        var index = this.subs.indexOf(sub);
        if (index !== -1) {
            this.subs.splice(index, 1);
        }
    },
    notify: function(){
        this.subs.forEach(function(sub){
            sub.update();
        });
    }
};