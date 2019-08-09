function Watcher(vm, expOrFn, cb){
    this.cb = cb;
    this.vm = vm;
    this.expOrFn = expOrFn;
    this.depIds = {};

    if (typeof expOrFn === 'function') {
        this.getter = expOrFn;
    } else {
        this.getter = this.parseGetter(expOrFn.trim());
    }

    this.value = this.get();
}

Watcher.prototype = {
    update: function(){
        this.run();
    },
    run: function(){
        //数据有更新了，需要该watcher去更新
        var value = this.get();
        var oldValue = this.value;
        if (value !== oldValue) {
            this.value = value;
            this.cb.call(this.vm, value, oldValue);
        }
    },
    get: function(){
        // 获取expOrFn的值，若有涉及到某些数据属性，则将watcher加入数据属性的依赖中
        Dep.target = this;
        var value = this.getter.call(this.vm, this.vm);
        Dep.target = null;
        return value;
    },
    parseGetter: function(exp){
        if(/[^\w.$]/.test(exp)){//exp应该是单词、数字字符、.、$
            return;
        }
        var exps = exp.split('.');
        return function(obj){
            for (var i=0, len=exps.length; i<len; i++) {
                if(!obj){
                    return;
                }
                //获取子属性时，就会触发observer中的监控；
                //然后会调用到addDep，将本watcher加入到属性的依赖中，也就是订阅该数据属性
                obj = obj[exps[i]];
            }
            return obj;
        };
    },
    addDep: function(dep){
        if(!this.depIds.hasOwnProperty(dep.id)){//保证不重复添加
            dep.addSub(this);
            this.depIds[dep.id] = dep;
        }
    }
};