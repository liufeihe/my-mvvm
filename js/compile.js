function Compile(el, vm){
    this.$vm = vm;
    this.$el = this.isElementNode(el)?el:document.querySelector(el);

    if (this.$el) {
        this.$fragment = this.node2Fragment(this.$el);
        this.init();
        this.$el.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    node2Fragment: function(el){
        var fragment = document.createDocumentFragment(), child;
        //将原生节点拷贝到fragment
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    },
    init: function(){
        this.compileElement(this.$fragment);
    },
    compileElement: function(el){
        var childNodes = el.childNodes, me = this;
        [].slice.call(childNodes).forEach(function(node){
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/;

            if (me.isElementNode(node)){
                me.compile(node);
            } else if(me.isTextNode(node) && reg.test(text)){
                me.compileText(node, RegExp.$1.trim());
            }

            //遍历子节点
            if(node.childNodes && node.childNodes.length){
                me.compileElement(node);
            }
        });
    },
    compile: function(node){
        var nodeAttrs = node.attributes, me = this;
        [].slice.call(nodeAttrs).forEach(function(attr){
            var attrName = attr.name;
            //是否是指令
            if (me.isDirective(attrName)) {
                var exp = attr.value;
                var dir = attrName.substring(2);
                if (me.isEventDirective(dir)) {
                    //事件指令
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                } else {
                    //普通指令
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }

                node.removeAttribute(attrName);
            }
        });
    },
    compileText: function(node, exp){
        compileUtil.text(node, this.$vm, exp);
    },
    isDirective: function(attr){
        return attr.indexOf('v-') === 0;
    },
    isEventDirective: function(dir){
        return dir.indexOf('on') === 0;
    },
    isElementNode: function(node){
        return node.nodeType === 1;
    },
    isTextNode: function(node){
        return node.nodeType === 3;
    }
};

var compileUtil = {
    text: function(node, vm, exp){
        this.bind(node, vm, exp, 'text');
    },
    html: function(node, vm, exp){
        this.bind(node, vm, exp, 'html');
    },
    model: function(node, vm, exp){
        this.bind(node, vm, exp, 'model');
        var me = this, val = this._getVMVal(vm, exp);
        node.addEventListener('input', function(e){
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },
    class: function(node, vm, exp){
        this.bind(node, vm, exp, 'class');
    },
    bind: function(node, vm, exp, dir){
        var updaterFn = updater[dir+'Updater'];
        //把初始的数据更新到view中
        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        //对用到的数据属性，订阅其更新
        new Watcher(vm, exp, function(value, oldValue){
            updaterFn && updaterFn(node, value, oldValue);
        });
    },
    eventHandler: function(node, vm, exp, dir){
        var eventType = dir.split(':')[1], fn;
        fn = vm.$options.methods && vm.$options.methods[exp];
        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },
    _getVMVal: function(vm, exp){
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function(k){
            val = val[k];
        });
        return val;
    },
    _setVMVal: function(vm, exp, value){
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function(k,i){
            if (i<exp.length-1){
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};

var updater = {
    textUpdater: function(node, value){
        node.textContent = typeof value === 'undefined'?'':value;
    },
    htmlUpdater: function(node, value){
        node.innerHTML = typeof value === 'undefined'?'':value;
    },
    classUpdater: function(node, value, oldValue){
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = className && String(value) ? ' ':'';
        node.className = className + space + value;
    },
    modelUpdater: function(node, value, oldValue){
        node.value = typeof value === 'undefined'?'':value;
    }
};