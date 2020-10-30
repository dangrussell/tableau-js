//! tableau-2.0.0.js
//

(function() {


    // (function() {

    ////////////////////////////////////////////////////////////////////////////////
    // Utility methods (generated via Script.IsNull, etc.)
    ////////////////////////////////////////////////////////////////////////////////

    var ss = {
        version: '0.7.4.0',

        isUndefined: function(o) {
            return (o === undefined);
        },

        isNull: function(o) {
            return (o === null);
        },

        isNullOrUndefined: function(o) {
            return (o === null) || (o === undefined);
        },

        isValue: function(o) {
            return (o !== null) && (o !== undefined);
        }
    };

    // If the browser does not support Object.keys this alternative
    // function returns the same list without using the keys method.
    // This code was found in mscorlib.js (BUGZID:116352)
    if (!Object.keys) {
        Object.keys = function Object$keys(d) {
            var keys = [];
            for (var key in d) {
                keys.push(key);
            }
            return keys;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // Type System Implementation
    ////////////////////////////////////////////////////////////////////////////////


    var Type = Function;
    var originalRegistrationFunctions = {
        registerNamespace: { isPrototype: false, func: Type.registerNamespace },
        registerInterface: { isPrototype: true, func: Type.prototype.registerInterface },
        registerClass: { isPrototype: true, func: Type.prototype.registerClass },
        registerEnum: { isPrototype: true, func: Type.prototype.registerEnum }
    };

    var tab = {};
    var tabBootstrap = {};

    Type.registerNamespace = function(name) {
        if (name === "tableauSoftware") {
            window.tableauSoftware = window.tableau = window.tableauSoftware || {};
        }
    };

    Type.prototype.registerInterface = function(name) {};

    Type.prototype.registerEnum = function(name, flags) {
        for (var field in this.prototype) {
            this[field] = this.prototype[field];
        }
    };

    Type.prototype.registerClass = function(name, baseType, interfaceType) {
        var that = this;
        this.prototype.constructor = this;
        this.__baseType = baseType || Object;
        if (baseType) {
            this.__basePrototypePending = true;
            this.__setupBase = function() {
                Type$setupBase(that);
            };
            this.initializeBase = function(instance, args) {
                Type$initializeBase(that, instance, args);
            };
            this.callBaseMethod = function(instance, name, args) {
                Type$callBaseMethod(that, instance, name, args);
            };
        }
    };

    function Type$setupBase(that) {
        if (that.__basePrototypePending) {
            var baseType = that.__baseType;
            if (baseType.__basePrototypePending) {
                baseType.__setupBase();
            }

            for (var memberName in baseType.prototype) {
                var memberValue = baseType.prototype[memberName];
                if (!that.prototype[memberName]) {
                    that.prototype[memberName] = memberValue;
                }
            }

            delete that.__basePrototypePending;
            delete that.__setupBase;
        }
    }

    function Type$initializeBase(that, instance, args) {
        if (that.__basePrototypePending) {
            that.__setupBase();
        }

        if (!args) {
            that.__baseType.apply(instance);
        } else {
            that.__baseType.apply(instance, args);
        }
    }

    function Type$callBaseMethod(that, instance, name, args) {
        var baseMethod = that.__baseType.prototype[name];
        if (!args) {
            return baseMethod.apply(instance);
        } else {
            return baseMethod.apply(instance, args);
        }
    }

    // Restore the original functions on the Type (Function) object so that we
    // don't pollute the global namespace.
    function restoreTypeSystem() {
        for (var regFuncName in originalRegistrationFunctions) {
            if (!originalRegistrationFunctions.hasOwnProperty(regFuncName)) { continue; }

            var original = originalRegistrationFunctions[regFuncName];
            var typeOrPrototype = original.isPrototype ? Type.prototype : Type;
            if (original.func) {
                typeOrPrototype[regFuncName] = original.func;
            } else {
                delete typeOrPrototype[regFuncName];
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // Delegate
    ////////////////////////////////////////////////////////////////////////////////

    ss.Delegate = function Delegate$() {};

    ss.Delegate.registerClass('Delegate');

    ss.Delegate.empty = function() {};

    ss.Delegate._contains = function Delegate$_contains(targets, object, method) {
        for (var i = 0; i < targets.length; i += 2) {
            if (targets[i] === object && targets[i + 1] === method) {
                return true;
            }
        }
        return false;
    };

    ss.Delegate._create = function Delegate$_create(targets) {
        var delegate = function() {
            if (targets.length == 2) {
                return targets[1].apply(targets[0], arguments);
            } else {
                var clone = targets.concat();
                for (var i = 0; i < clone.length; i += 2) {
                    if (ss.Delegate._contains(targets, clone[i], clone[i + 1])) {
                        clone[i + 1].apply(clone[i], arguments);
                    }
                }
                return null;
            }
        };
        delegate._targets = targets;

        return delegate;
    };

    ss.Delegate.create = function Delegate$create(object, method) {
        if (!object) {
            return method;
        }
        return ss.Delegate._create([object, method]);
    };

    ss.Delegate.combine = function Delegate$combine(delegate1, delegate2) {
        if (!delegate1) {
            if (!delegate2._targets) {
                return ss.Delegate.create(null, delegate2);
            }
            return delegate2;
        }
        if (!delegate2) {
            if (!delegate1._targets) {
                return ss.Delegate.create(null, delegate1);
            }
            return delegate1;
        }

        var targets1 = delegate1._targets ? delegate1._targets : [null, delegate1];
        var targets2 = delegate2._targets ? delegate2._targets : [null, delegate2];

        return ss.Delegate._create(targets1.concat(targets2));
    };

    ss.Delegate.remove = function Delegate$remove(delegate1, delegate2) {
        if (!delegate1 || (delegate1 === delegate2)) {
            return null;
        }
        if (!delegate2) {
            return delegate1;
        }

        var targets = delegate1._targets;
        var object = null;
        var method;
        if (delegate2._targets) {
            object = delegate2._targets[0];
            method = delegate2._targets[1];
        } else {
            method = delegate2;
        }

        for (var i = 0; i < targets.length; i += 2) {
            if ((targets[i] === object) && (targets[i + 1] === method)) {
                if (targets.length == 2) {
                    return null;
                }
                targets.splice(i, 2);
                return ss.Delegate._create(targets);
            }
        }

        return delegate1;
    };


    ////////////////////////////////////////////////////////////////////////////////
    // IEnumerator

    ss.IEnumerator = function IEnumerator$() {};
    ss.IEnumerator.prototype = {
        get_current: null,
        moveNext: null,
        reset: null
    };

    ss.IEnumerator.getEnumerator = function ss_IEnumerator$getEnumerator(enumerable) {
        if (enumerable) {
            return enumerable.getEnumerator ? enumerable.getEnumerator() : new ss.ArrayEnumerator(enumerable);
        }
        return null;
    }

    // ss.IEnumerator.registerInterface('IEnumerator');

    ////////////////////////////////////////////////////////////////////////////////
    // IEnumerable

    ss.IEnumerable = function IEnumerable$() {};
    ss.IEnumerable.prototype = {
        getEnumerator: null
    };
    // ss.IEnumerable.registerInterface('IEnumerable');

    ////////////////////////////////////////////////////////////////////////////////
    // ArrayEnumerator

    ss.ArrayEnumerator = function ArrayEnumerator$(array) {
        this._array = array;
        this._index = -1;
        this.current = null;
    }
    ss.ArrayEnumerator.prototype = {
        moveNext: function ArrayEnumerator$moveNext() {
            this._index++;
            this.current = this._array[this._index];
            return (this._index < this._array.length);
        },
        reset: function ArrayEnumerator$reset() {
            this._index = -1;
            this.current = null;
        }
    };

    // ss.ArrayEnumerator.registerClass('ArrayEnumerator', null, ss.IEnumerator);

    ////////////////////////////////////////////////////////////////////////////////
    // IDisposable

    ss.IDisposable = function IDisposable$() {};
    ss.IDisposable.prototype = {
        dispose: null
    };
    // ss.IDisposable.registerInterface('IDisposable');

    ////////////////////////////////////////////////////////////////////////////////
    // StringBuilder

    ss.StringBuilder = function StringBuilder$(s) {
        this._parts = !ss.isNullOrUndefined(s) ? [s] : [];
        this.isEmpty = this._parts.length == 0;
    }
    ss.StringBuilder.prototype = {
        append: function StringBuilder$append(s) {
            if (!ss.isNullOrUndefined(s)) {
                //this._parts.add(s);
                this._parts.push(s);
                this.isEmpty = false;
            }
            return this;
        },

        appendLine: function StringBuilder$appendLine(s) {
            this.append(s);
            this.append('\r\n');
            this.isEmpty = false;
            return this;
        },

        clear: function StringBuilder$clear() {
            this._parts = [];
            this.isEmpty = true;
        },

        toString: function StringBuilder$toString(s) {
            return this._parts.join(s || '');
        }
    };

    ss.StringBuilder.registerClass('StringBuilder');

    ////////////////////////////////////////////////////////////////////////////////
    // EventArgs

    ss.EventArgs = function EventArgs$() {}
    ss.EventArgs.registerClass('EventArgs');

    ss.EventArgs.Empty = new ss.EventArgs();

    ////////////////////////////////////////////////////////////////////////////////
    // CancelEventArgs

    ss.CancelEventArgs = function CancelEventArgs$() {
        ss.CancelEventArgs.initializeBase(this);
        this.cancel = false;
    }
    ss.CancelEventArgs.registerClass('CancelEventArgs', ss.EventArgs);

    ////////////////////////////////////////////////////////////////////////////////
    // Tuple

    ss.Tuple = function(first, second, third) {
        this.first = first;
        this.second = second;
        if (arguments.length == 3) {
            this.third = third;
        }
    }
    ss.Tuple.registerClass('Tuple');


    //})();

    //! tabcoreslim.debug.js
    //

    // (function() {

    Type.registerNamespace('tab');

    ////////////////////////////////////////////////////////////////////////////////
    // tab.EscapingUtil

    tab.EscapingUtil = function tab_EscapingUtil() {}
    tab.EscapingUtil.escapeHtml = function tab_EscapingUtil$escapeHtml(html) {
        var escaped = (html || '');
        escaped = escaped.replace(new RegExp('&', 'g'), '&amp;');
        escaped = escaped.replace(new RegExp('<', 'g'), '&lt;');
        escaped = escaped.replace(new RegExp('>', 'g'), '&gt;');
        escaped = escaped.replace(new RegExp('"', 'g'), '&quot;');
        escaped = escaped.replace(new RegExp("'", 'g'), '&#39;');
        escaped = escaped.replace(new RegExp('/', 'g'), '&#47;');
        return escaped;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.WindowHelper

    tab.WindowHelper = function tab_WindowHelper(window) {
        this._window = window;
    }
    tab.WindowHelper.get_windowSelf = function tab_WindowHelper$get_windowSelf() {
        return window.self;
    }
    tab.WindowHelper.close = function tab_WindowHelper$close(window) {
        window.close();
    }
    tab.WindowHelper.getOpener = function tab_WindowHelper$getOpener(window) {
        return window.opener;
    }
    tab.WindowHelper.getLocation = function tab_WindowHelper$getLocation(window) {
        return window.location;
    }
    tab.WindowHelper.getPathAndSearch = function tab_WindowHelper$getPathAndSearch(window) {
        return window.location.pathname + window.location.search;
    }
    tab.WindowHelper.setLocationHref = function tab_WindowHelper$setLocationHref(window, href) {
        window.location.href = href;
    }
    tab.WindowHelper.locationReplace = function tab_WindowHelper$locationReplace(window, url) {
        window.location.replace(url);
    }
    tab.WindowHelper.open = function tab_WindowHelper$open(href, target, options) {
        return window.open(href, target, options);
    }
    tab.WindowHelper.reload = function tab_WindowHelper$reload(w, foreGet) {
        w.location.reload(foreGet);
    }
    tab.WindowHelper.requestAnimationFrame = function tab_WindowHelper$requestAnimationFrame(action) {
        return tab.WindowHelper._requestAnimationFrameFunc(action);
    }
    tab.WindowHelper.cancelAnimationFrame = function tab_WindowHelper$cancelAnimationFrame(animationId) {
        if (ss.isValue(animationId)) {
            tab.WindowHelper._cancelAnimationFrameFunc(animationId);
        }
    }
    tab.WindowHelper._setDefaultRequestAnimationFrameImpl = function tab_WindowHelper$_setDefaultRequestAnimationFrameImpl() {
        var lastTime = 0;
        tab.WindowHelper._requestAnimationFrameFunc = function(callback) {
            var curTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (curTime - lastTime));
            lastTime = curTime + timeToCall;
            var id = window.setTimeout(function() {
                callback();
            }, timeToCall);
            return id;
        };
    }
    tab.WindowHelper.prototype = {
        _window: null,

        get_pageXOffset: function tab_WindowHelper$get_pageXOffset() {
            return tab.WindowHelper._pageXOffsetFunc(this._window);
        },

        get_pageYOffset: function tab_WindowHelper$get_pageYOffset() {
            return tab.WindowHelper._pageYOffsetFunc(this._window);
        },

        get_clientWidth: function tab_WindowHelper$get_clientWidth() {
            return tab.WindowHelper._clientWidthFunc(this._window);
        },

        get_clientHeight: function tab_WindowHelper$get_clientHeight() {
            return tab.WindowHelper._clientHeightFunc(this._window);
        },

        get_innerWidth: function tab_WindowHelper$get_innerWidth() {
            return tab.WindowHelper._innerWidthFunc(this._window);
        },

        get_outerWidth: function tab_WindowHelper$get_outerWidth() {
            return tab.WindowHelper._outerWidthFunc(this._window);
        },

        get_innerHeight: function tab_WindowHelper$get_innerHeight() {
            return tab.WindowHelper._innerHeightFunc(this._window);
        },

        get_outerHeight: function tab_WindowHelper$get_outerHeight() {
            return tab.WindowHelper._outerHeightFunc(this._window);
        },

        get_screenLeft: function tab_WindowHelper$get_screenLeft() {
            return tab.WindowHelper._screenLeftFunc(this._window);
        },

        get_screenTop: function tab_WindowHelper$get_screenTop() {
            return tab.WindowHelper._screenTopFunc(this._window);
        }
    }


    tab.EscapingUtil.registerClass('tab.EscapingUtil');
    tab.WindowHelper.registerClass('tab.WindowHelper');
    tab.WindowHelper._innerWidthFunc = null;
    tab.WindowHelper._innerHeightFunc = null;
    tab.WindowHelper._clientWidthFunc = null;
    tab.WindowHelper._clientHeightFunc = null;
    tab.WindowHelper._pageXOffsetFunc = null;
    tab.WindowHelper._pageYOffsetFunc = null;
    tab.WindowHelper._screenLeftFunc = null;
    tab.WindowHelper._screenTopFunc = null;
    tab.WindowHelper._outerWidthFunc = null;
    tab.WindowHelper._outerHeightFunc = null;
    tab.WindowHelper._requestAnimationFrameFunc = null;
    tab.WindowHelper._cancelAnimationFrameFunc = null;
    (function() {
        if (('innerWidth' in window)) {
            tab.WindowHelper._innerWidthFunc = function(w) {
                return w.innerWidth;
            };
        } else {
            tab.WindowHelper._innerWidthFunc = function(w) {
                return w.document.documentElement.offsetWidth;
            };
        }
        if (('outerWidth' in window)) {
            tab.WindowHelper._outerWidthFunc = function(w) {
                return w.outerWidth;
            };
        } else {
            tab.WindowHelper._outerWidthFunc = tab.WindowHelper._innerWidthFunc;
        }
        if (('innerHeight' in window)) {
            tab.WindowHelper._innerHeightFunc = function(w) {
                return w.innerHeight;
            };
        } else {
            tab.WindowHelper._innerHeightFunc = function(w) {
                return w.document.documentElement.offsetHeight;
            };
        }
        if (('outerHeight' in window)) {
            tab.WindowHelper._outerHeightFunc = function(w) {
                return w.outerHeight;
            };
        } else {
            tab.WindowHelper._outerHeightFunc = tab.WindowHelper._innerHeightFunc;
        }
        if (('clientWidth' in window)) {
            tab.WindowHelper._clientWidthFunc = function(w) {
                return w.clientWidth;
            };
        } else {
            tab.WindowHelper._clientWidthFunc = function(w) {
                return w.document.documentElement.clientWidth;
            };
        }
        if (('clientHeight' in window)) {
            tab.WindowHelper._clientHeightFunc = function(w) {
                return w.clientHeight;
            };
        } else {
            tab.WindowHelper._clientHeightFunc = function(w) {
                return w.document.documentElement.clientHeight;
            };
        }
        if (ss.isValue(window.self.pageXOffset)) {
            tab.WindowHelper._pageXOffsetFunc = function(w) {
                return w.pageXOffset;
            };
        } else {
            tab.WindowHelper._pageXOffsetFunc = function(w) {
                return w.document.documentElement.scrollLeft;
            };
        }
        if (ss.isValue(window.self.pageYOffset)) {
            tab.WindowHelper._pageYOffsetFunc = function(w) {
                return w.pageYOffset;
            };
        } else {
            tab.WindowHelper._pageYOffsetFunc = function(w) {
                return w.document.documentElement.scrollTop;
            };
        }
        if (('screenLeft' in window)) {
            tab.WindowHelper._screenLeftFunc = function(w) {
                return w.screenLeft;
            };
        } else {
            tab.WindowHelper._screenLeftFunc = function(w) {
                return w.screenX;
            };
        }
        if (('screenTop' in window)) {
            tab.WindowHelper._screenTopFunc = function(w) {
                return w.screenTop;
            };
        } else {
            tab.WindowHelper._screenTopFunc = function(w) {
                return w.screenY;
            };
        }
        var DefaultRequestName = 'requestAnimationFrame';
        var DefaultCancelName = 'cancelAnimationFrame';
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        var requestFuncName = null;
        var cancelFuncName = null;
        if ((DefaultRequestName in window)) {
            requestFuncName = DefaultRequestName;
        }
        if ((DefaultCancelName in window)) {
            cancelFuncName = DefaultCancelName;
        }
        for (var ii = 0; ii < vendors.length && (requestFuncName == null || cancelFuncName == null); ++ii) {
            var vendor = vendors[ii];
            var funcName = vendor + 'RequestAnimationFrame';
            if (requestFuncName == null && (funcName in window)) {
                requestFuncName = funcName;
            }
            if (cancelFuncName == null) {
                funcName = vendor + 'CancelAnimationFrame';
                if ((funcName in window)) {
                    cancelFuncName = funcName;
                }
                funcName = vendor + 'CancelRequestAnimationFrame';
                if ((funcName in window)) {
                    cancelFuncName = funcName;
                }
            }
        }
        if (requestFuncName != null) {
            tab.WindowHelper._requestAnimationFrameFunc = function(callback) {
                return window[requestFuncName](callback);
            };
        } else {
            tab.WindowHelper._setDefaultRequestAnimationFrameImpl();
        }
        if (cancelFuncName != null) {
            tab.WindowHelper._cancelAnimationFrameFunc = function(animationId) {
                window[cancelFuncName](animationId);
            };
        } else {
            tab.WindowHelper._cancelAnimationFrameFunc = function(id) {
                window.clearTimeout(id);
            };
        }
    })();

    // }());



    Type.registerNamespace('tab');

    ////////////////////////////////////////////////////////////////////////////////
    // tab._SheetInfoImpl

    tab.$create__SheetInfoImpl = function tab__SheetInfoImpl(name, sheetType, index, size, workbook, url, isActive, isHidden, zoneId) {
        var $o = {};
        $o.name = name;
        $o.sheetType = sheetType;
        $o.index = index;
        $o.size = size;
        $o.workbook = workbook;
        $o.url = url;
        $o.isActive = isActive;
        $o.isHidden = isHidden;
        $o.zoneId = zoneId;
        return $o;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._dashboardZoneInfo

    tab.$create__dashboardZoneInfo = function tab__dashboardZoneInfo(name, objectType, position, size, zoneId) {
        var $o = {};
        $o._name = name;
        $o._objectType = objectType;
        $o._position = position;
        $o._size = size;
        $o._zoneId = zoneId;
        return $o;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._StoryPointInfoImpl

    tab.$create__StoryPointInfoImpl = function tab__StoryPointInfoImpl(caption, index, storyPointId, isActive, isUpdated, parentStoryImpl) {
        var $o = {};
        $o.caption = caption;
        $o.index = index;
        $o.storyPointId = storyPointId;
        $o.isActive = isActive;
        $o.isUpdated = isUpdated;
        $o.parentStoryImpl = parentStoryImpl;
        return $o;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._ApiCommand

    tab._ApiCommand = function tab__ApiCommand(name, sourceId, handlerId, parameters) {
        this._name = name;
        this._sourceId = sourceId;
        this._handlerId = handlerId;
        this._parameters = parameters;
    }
    tab._ApiCommand.parse = function tab__ApiCommand$parse(serialized) {
        var name;
        var index = serialized.indexOf(',');
        if (index < 0) {
            name = serialized;
            return new tab._ApiCommand(name, null, null, null);
        }
        name = serialized.substr(0, index);
        var sourceId;
        var secondPart = serialized.substr(index + 1);
        index = secondPart.indexOf(',');
        if (index < 0) {
            sourceId = secondPart;
            return new tab._ApiCommand(name, sourceId, null, null);
        }
        sourceId = secondPart.substr(0, index);
        var handlerId;
        var thirdPart = secondPart.substr(index + 1);
        index = thirdPart.indexOf(',');
        if (index < 0) {
            handlerId = thirdPart;
            return new tab._ApiCommand(name, sourceId, handlerId, null);
        }
        handlerId = thirdPart.substr(0, index);
        var parameters = thirdPart.substr(index + 1);
        tab._ApiCommand.lastResponseMessage = serialized;
        if (name === 'api.GetClientInfoCommand') {
            tab._ApiCommand.lastClientInfoResponseMessage = serialized;
        }
        return new tab._ApiCommand(name, sourceId, handlerId, parameters);
    }
    tab._ApiCommand.prototype = {
        _name: null,
        _handlerId: null,
        _sourceId: null,
        _parameters: null,

        get_name: function tab__ApiCommand$get_name() {
            return this._name;
        },

        get_handlerId: function tab__ApiCommand$get_handlerId() {
            return this._handlerId;
        },

        get_sourceId: function tab__ApiCommand$get_sourceId() {
            return this._sourceId;
        },

        get_parameters: function tab__ApiCommand$get_parameters() {
            return this._parameters;
        },

        get_isApiCommandName: function tab__ApiCommand$get_isApiCommandName() {
            return !this.get_rawName().indexOf('api.', 0);
        },

        get_rawName: function tab__ApiCommand$get_rawName() {
            return this._name;
        },

        serialize: function tab__ApiCommand$serialize() {
            var message = [];
            message.push(this._name);
            message.push(this._sourceId);
            message.push(this._handlerId);
            if (ss.isValue(this._parameters)) {
                message.push(this._parameters);
            }
            var serializedMessage = message.join(',');
            tab._ApiCommand.lastRequestMessage = serializedMessage;
            return serializedMessage;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._ApiServerResultParser

    tab._ApiServerResultParser = function tab__ApiServerResultParser(serverResult) {
        var param = JSON.parse(serverResult);
        this._commandResult = param['api.commandResult'];
        this._commandData = param['api.commandData'];
    }
    tab._ApiServerResultParser.prototype = {
        _commandResult: null,
        _commandData: null,

        get_result: function tab__ApiServerResultParser$get_result() {
            return this._commandResult;
        },

        get_data: function tab__ApiServerResultParser$get_data() {
            return this._commandData;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._ApiServerNotification

    tab._ApiServerNotification = function tab__ApiServerNotification(workbookName, worksheetName, data) {
        this._workbookName = workbookName;
        this._worksheetName = worksheetName;
        this._data = data;
    }
    tab._ApiServerNotification.deserialize = function tab__ApiServerNotification$deserialize(json) {
        var param = JSON.parse(json);
        var workbookName = param['api.workbookName'];
        var worksheetName = param['api.worksheetName'];
        var data = param['api.commandData'];
        return new tab._ApiServerNotification(workbookName, worksheetName, data);
    }
    tab._ApiServerNotification.prototype = {
        _workbookName: null,
        _worksheetName: null,
        _data: null,

        get_workbookName: function tab__ApiServerNotification$get_workbookName() {
            return this._workbookName;
        },

        get_worksheetName: function tab__ApiServerNotification$get_worksheetName() {
            return this._worksheetName;
        },

        get_data: function tab__ApiServerNotification$get_data() {
            return this._data;
        },

        serialize: function tab__ApiServerNotification$serialize() {
            var serialized = {};
            serialized['api.workbookName'] = this._workbookName;
            serialized['api.worksheetName'] = this._worksheetName;
            serialized['api.commandData'] = this._data;
            return JSON.stringify(serialized);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._CommandReturnHandler

    tab._CommandReturnHandler = function tab__CommandReturnHandler(commandName, successCallbackTiming, successCallback, errorCallback) {
        this._commandName = commandName;
        this._successCallback = successCallback;
        this._successCallbackTiming = successCallbackTiming;
        this._errorCallback = errorCallback;
    }
    tab._CommandReturnHandler.prototype = {
        _commandName: null,
        _successCallbackTiming: 0,
        _successCallback: null,
        _errorCallback: null,

        get_commandName: function tab__CommandReturnHandler$get_commandName() {
            return this._commandName;
        },

        get_successCallback: function tab__CommandReturnHandler$get_successCallback() {
            return this._successCallback;
        },

        get_successCallbackTiming: function tab__CommandReturnHandler$get_successCallbackTiming() {
            return this._successCallbackTiming;
        },

        get_errorCallback: function tab__CommandReturnHandler$get_errorCallback() {
            return this._errorCallback;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._crossDomainMessageRouter

    tab._crossDomainMessageRouter = function tab__crossDomainMessageRouter() {
        this._handlers = {};
        this._commandCallbacks = {};
        this._customViewLoadCallbacks = {};
        this._commandReturnAfterStateReadyQueues = {};
        if (tab._Utility.hasWindowAddEventListener()) {
            window.addEventListener('message', this._getHandleCrossDomainMessageDelegate(), false);
        } else if (tab._Utility.hasDocumentAttachEvent()) {
            document.attachEvent('onmessage', this._getHandleCrossDomainMessageDelegate());
            window.attachEvent('onmessage', this._getHandleCrossDomainMessageDelegate());
        } else {
            window.onmessage = this._getHandleCrossDomainMessageDelegate();
        }
        this._nextHandlerId = this._nextCommandId = 0;
    }
    tab._crossDomainMessageRouter.prototype = {
        _nextHandlerId: 0,
        _nextCommandId: 0,

        registerHandler: function tab__crossDomainMessageRouter$registerHandler(handler) {
            var uniqueId = 'handler' + this._nextHandlerId;
            if (ss.isValue(handler.get_handlerId()) || ss.isValue(this._handlers[handler.get_handlerId()])) {
                throw tab._TableauException.createInternalError("Handler '" + handler.get_handlerId() + "' is already registered.");
            }
            this._nextHandlerId++;
            handler.set_handlerId(uniqueId);
            this._handlers[uniqueId] = handler;
            handler.add_customViewsListLoad(ss.Delegate.create(this, this._handleCustomViewsListLoad));
            handler.add_stateReadyForQuery(ss.Delegate.create(this, this._handleStateReadyForQuery));
        },

        unregisterHandler: function tab__crossDomainMessageRouter$unregisterHandler(handler) {
            if (ss.isValue(handler.get_handlerId()) || ss.isValue(this._handlers[handler.get_handlerId()])) {
                delete this._handlers[handler.get_handlerId()];
                handler.remove_customViewsListLoad(ss.Delegate.create(this, this._handleCustomViewsListLoad));
                handler.remove_stateReadyForQuery(ss.Delegate.create(this, this._handleStateReadyForQuery));
            }
        },

        sendCommand: function tab__crossDomainMessageRouter$sendCommand(source, commandParameters, returnHandler) {
            var iframe = source.get_iframe();
            var handlerId = source.get_handlerId();
            if (!tab._Utility.hasWindowPostMessage() || ss.isNullOrUndefined(iframe) || ss.isNullOrUndefined(iframe.contentWindow)) {
                return;
            }
            var sourceId = 'cmd' + this._nextCommandId;
            this._nextCommandId++;
            var callbackMap = this._commandCallbacks[handlerId];
            if (ss.isNullOrUndefined(callbackMap)) {
                callbackMap = {};
                this._commandCallbacks[handlerId] = callbackMap;
            }
            callbackMap[sourceId] = returnHandler;
            var commandName = returnHandler.get_commandName();
            if (commandName === 'api.ShowCustomViewCommand') {
                var customViewCallbackMap = this._customViewLoadCallbacks[handlerId];
                if (ss.isNullOrUndefined(customViewCallbackMap)) {
                    customViewCallbackMap = {};
                    this._customViewLoadCallbacks[handlerId] = customViewCallbackMap;
                }
                customViewCallbackMap[sourceId] = returnHandler;
            }
            var serializedParams = null;
            if (ss.isValue(commandParameters)) {
                serializedParams = tab.JsonUtil.toJson(commandParameters, false, '');
            }
            var command = new tab._ApiCommand(commandName, sourceId, handlerId, serializedParams);
            var message = command.serialize();
            if (tab._Utility.isPostMessageSynchronous()) {
                window.setTimeout(function() {
                    iframe.contentWindow.postMessage(message, source.get_serverRoot());
                }, 0);
            } else {
                iframe.contentWindow.postMessage(message, source.get_serverRoot());
            }
        },

        _handleCustomViewsListLoad: function tab__crossDomainMessageRouter$_handleCustomViewsListLoad(source) {
            var handlerId = source.get_handlerId();
            var customViewCallbackMap = this._customViewLoadCallbacks[handlerId];
            if (ss.isNullOrUndefined(customViewCallbackMap)) {
                return;
            }
            var $dict1 = customViewCallbackMap;
            for (var $key2 in $dict1) {
                var customViewCallback = { key: $key2, value: $dict1[$key2] };
                var returnHandler = customViewCallback.value;
                if (ss.isValue(returnHandler.get_successCallback())) {
                    returnHandler.get_successCallback()(null);
                }
            }
            delete this._customViewLoadCallbacks[handlerId];
        },

        _handleStateReadyForQuery: function tab__crossDomainMessageRouter$_handleStateReadyForQuery(source) {
            var queue = this._commandReturnAfterStateReadyQueues[source.get_handlerId()];
            if (tab._Utility.isNullOrEmpty(queue)) {
                return;
            }
            while (queue.length > 0) {
                var successCallback = queue.pop();
                if (ss.isValue(successCallback)) {
                    successCallback();
                }
            }
        },

        _getHandleCrossDomainMessageDelegate: function tab__crossDomainMessageRouter$_getHandleCrossDomainMessageDelegate() {
            return ss.Delegate.create(this, function(e) {
                this._handleCrossDomainMessage(e);
            });
        },

        _handleCrossDomainMessage: function tab__crossDomainMessageRouter$_handleCrossDomainMessage(e) {
            if (ss.isNullOrUndefined(e.data)) {
                return;
            }
            var command = tab._ApiCommand.parse(e.data);
            var rawName = command.get_rawName();
            var handlerId = command.get_handlerId();
            var handler = this._handlers[handlerId];
            if (ss.isNullOrUndefined(handler) || handler.get_handlerId() !== command.get_handlerId()) {
                handler = new tab._doNothingCrossDomainHandler();
            }
            if (command.get_isApiCommandName()) {
                if (command.get_sourceId() === 'xdomainSourceId') {
                    handler.handleEventNotification(command.get_name(), command.get_parameters());
                    if (command.get_name() === 'api.FirstVizSizeKnownEvent') {
                        e.source.postMessage('tableau.bootstrap', '*');
                    }
                } else {
                    this._handleCrossDomainResponse(command);
                }
            } else {
                this._handleLegacyNotifications(rawName, e, handler);
            }
        },

        _handleCrossDomainResponse: function tab__crossDomainMessageRouter$_handleCrossDomainResponse(command) {
            var commandCallbackMap = this._commandCallbacks[command.get_handlerId()];
            var returnHandler = (ss.isValue(commandCallbackMap)) ? commandCallbackMap[command.get_sourceId()] : null;
            if (ss.isNullOrUndefined(returnHandler)) {
                return;
            }
            delete commandCallbackMap[command.get_sourceId()];
            if (command.get_name() !== returnHandler.get_commandName()) {
                return;
            }
            var crossDomainResult = new tab._ApiServerResultParser(command.get_parameters());
            var commandResult = crossDomainResult.get_data();
            if (crossDomainResult.get_result() === 'api.success') {
                switch (returnHandler.get_successCallbackTiming()) {
                    case 0:
                        if (ss.isValue(returnHandler.get_successCallback())) {
                            returnHandler.get_successCallback()(commandResult);
                        }
                        break;
                    case 1:
                        var postponedCallback = function() {
                            if (ss.isValue(returnHandler.get_successCallback())) {
                                returnHandler.get_successCallback()(commandResult);
                            }
                        };
                        var queue = this._commandReturnAfterStateReadyQueues[command.get_handlerId()];
                        if (ss.isNullOrUndefined(queue)) {
                            queue = [];
                            this._commandReturnAfterStateReadyQueues[command.get_handlerId()] = queue;
                        }
                        queue.push(postponedCallback);
                        break;
                    default:
                        throw tab._TableauException.createInternalError('Unknown timing value: ' + returnHandler.get_successCallbackTiming());
                }
            } else if (ss.isValue(returnHandler.get_errorCallback())) {
                var remoteError = crossDomainResult.get_result() === 'api.remotefailed';
                returnHandler.get_errorCallback()(remoteError, commandResult);
            }
        },

        _handleLegacyNotifications: function tab__crossDomainMessageRouter$_handleLegacyNotifications(messageName, e, handler) {
            if (messageName === 'layoutInfoReq') {
                tab._VizManagerImpl._sendVizOffsets();
                this._postLayoutInfo(e.source);
            } else if (messageName === 'tableau.completed' || messageName === 'completed') {
                handler.handleVizLoad();
            }
        },

        _postLayoutInfo: function tab__crossDomainMessageRouter$_postLayoutInfo(source) {
            if (!tab._Utility.hasWindowPostMessage()) {
                return;
            }
            var win = new tab.WindowHelper(window.self);
            var width = (ss.isValue(win.get_innerWidth())) ? win.get_innerWidth() : document.documentElement.offsetWidth;
            var height = (ss.isValue(win.get_innerHeight())) ? win.get_innerHeight() : document.documentElement.offsetHeight;
            var left = (ss.isValue(win.get_pageXOffset())) ? win.get_pageXOffset() : document.documentElement.scrollLeft;
            var top = (ss.isValue(win.get_pageYOffset())) ? win.get_pageYOffset() : document.documentElement.scrollTop;
            var msgArr = [];
            msgArr.push('layoutInfoResp');
            msgArr.push(left);
            msgArr.push(top);
            msgArr.push(width);
            msgArr.push(height);
            source.postMessage(msgArr.join(','), '*');
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._doNothingCrossDomainHandler

    tab._doNothingCrossDomainHandler = function tab__doNothingCrossDomainHandler() {}
    tab._doNothingCrossDomainHandler.prototype = {
        _handlerId: null,

        add_customViewsListLoad: function tab__doNothingCrossDomainHandler$add_customViewsListLoad(value) {
            this.__customViewsListLoad = ss.Delegate.combine(this.__customViewsListLoad, value);
        },
        remove_customViewsListLoad: function tab__doNothingCrossDomainHandler$remove_customViewsListLoad(value) {
            this.__customViewsListLoad = ss.Delegate.remove(this.__customViewsListLoad, value);
        },

        __customViewsListLoad: null,

        add_stateReadyForQuery: function tab__doNothingCrossDomainHandler$add_stateReadyForQuery(value) {
            this.__stateReadyForQuery = ss.Delegate.combine(this.__stateReadyForQuery, value);
        },
        remove_stateReadyForQuery: function tab__doNothingCrossDomainHandler$remove_stateReadyForQuery(value) {
            this.__stateReadyForQuery = ss.Delegate.remove(this.__stateReadyForQuery, value);
        },

        __stateReadyForQuery: null,

        get_iframe: function tab__doNothingCrossDomainHandler$get_iframe() {
            return null;
        },

        get_handlerId: function tab__doNothingCrossDomainHandler$get_handlerId() {
            return this._handlerId;
        },
        set_handlerId: function tab__doNothingCrossDomainHandler$set_handlerId(value) {
            this._handlerId = value;
            return value;
        },

        get_serverRoot: function tab__doNothingCrossDomainHandler$get_serverRoot() {
            return '*';
        },

        handleVizLoad: function tab__doNothingCrossDomainHandler$handleVizLoad() {},

        handleEventNotification: function tab__doNothingCrossDomainHandler$handleEventNotification(eventName, parameters) {},

        _silenceTheCompilerWarning: function tab__doNothingCrossDomainHandler$_silenceTheCompilerWarning() {
            this.__customViewsListLoad(null);
            this.__stateReadyForQuery(null);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.CrossDomainMessagingOptions

    tab.CrossDomainMessagingOptions = function tab_CrossDomainMessagingOptions(router, handler) {
        tab._Param.verifyValue(router, 'router');
        tab._Param.verifyValue(handler, 'handler');
        this._router = router;
        this._handler = handler;
    }
    tab.CrossDomainMessagingOptions.prototype = {
        _router: null,
        _handler: null,

        get_router: function tab_CrossDomainMessagingOptions$get_router() {
            return this._router;
        },

        get_handler: function tab_CrossDomainMessagingOptions$get_handler() {
            return this._handler;
        },

        sendCommand: function tab_CrossDomainMessagingOptions$sendCommand(commandParameters, returnHandler) {
            this._router.sendCommand(this._handler, commandParameters, returnHandler);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._enums

    tab._enums = function tab__enums() {}
    tab._enums._normalizePeriodType = function tab__enums$_normalizePeriodType(rawValue, paramName) {
        var rawString = (ss.isValue(rawValue)) ? rawValue : '';
        return tab._enums._normalizeEnum(rawString, paramName, tableauSoftware.PeriodType, true);
    }
    tab._enums._normalizeDateRangeType = function tab__enums$_normalizeDateRangeType(rawValue, paramName) {
        var rawString = (ss.isValue(rawValue)) ? rawValue : '';
        return tab._enums._normalizeEnum(rawString, paramName, tableauSoftware.DateRangeType, true);
    }
    tab._enums._normalizeFilterUpdateType = function tab__enums$_normalizeFilterUpdateType(rawValue, paramName) {
        var rawString = (ss.isValue(rawValue)) ? rawValue : '';
        return tab._enums._normalizeEnum(rawString, paramName, tableauSoftware.FilterUpdateType, true);
    }
    tab._enums._normalizeSelectionUpdateType = function tab__enums$_normalizeSelectionUpdateType(rawValue, paramName) {
        var rawString = (ss.isValue(rawValue)) ? rawValue : '';
        return tab._enums._normalizeEnum(rawString, paramName, tableauSoftware.SelectionUpdateType, true);
    }
    tab._enums._isSelectionUpdateType = function tab__enums$_isSelectionUpdateType(rawValue) {
        var rawString = (ss.isValue(rawValue)) ? rawValue.toString() : '';
        return tab._enums._normalizeEnum(rawString, '', tableauSoftware.SelectionUpdateType, false) != null;
    }
    tab._enums._normalizeNullOption = function tab__enums$_normalizeNullOption(rawValue, paramName) {
        var rawString = (ss.isValue(rawValue)) ? rawValue : '';
        return tab._enums._normalizeEnum(rawString, paramName, tableauSoftware.NullOption, true);
    }
    tab._enums._normalizeSheetSizeBehavior = function tab__enums$_normalizeSheetSizeBehavior(rawValue, paramName) {
        var rawString = (ss.isValue(rawValue)) ? rawValue : '';
        return tab._enums._normalizeEnum(rawString, paramName, tableauSoftware.SheetSizeBehavior, true);
    }
    tab._enums._normalizeTableauEventName = function tab__enums$_normalizeTableauEventName(rawValue) {
        var rawString = (ss.isValue(rawValue)) ? rawValue : '';
        return tab._enums._normalizeEnum(rawString, '', tableauSoftware.TableauEventName, false);
    }
    tab._enums._normalizeEnum = function tab__enums$_normalizeEnum(rawValue, paramName, enumObject, throwOnInvalid) {
        if (ss.isValue(rawValue)) {
            var lookup = rawValue.toString().toUpperCase();
            var $dict1 = enumObject;
            for (var $key2 in $dict1) {
                var entry = { key: $key2, value: $dict1[$key2] };
                var compareValue = entry.value.toString().toUpperCase();
                if (lookup === compareValue) {
                    return entry.value;
                }
            }
        }
        if (throwOnInvalid) {
            throw tab._TableauException.createInvalidParameter(paramName);
        }
        return null;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._ApiBootstrap

    tab._ApiBootstrap = function tab__ApiBootstrap() {}
    tab._ApiBootstrap.initialize = function tab__ApiBootstrap$initialize() {
        tab._ApiObjectRegistry.registerCrossDomainMessageRouter(function() {
            return new tab._crossDomainMessageRouter();
        });
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._ApiObjectRegistry

    tab._ApiObjectRegistry = function tab__ApiObjectRegistry() {}
    tab._ApiObjectRegistry.registerCrossDomainMessageRouter = function tab__ApiObjectRegistry$registerCrossDomainMessageRouter(objectCreationFunc) {
        return tab._ApiObjectRegistry._registerType('ICrossDomainMessageRouter', objectCreationFunc);
    }
    tab._ApiObjectRegistry.getCrossDomainMessageRouter = function tab__ApiObjectRegistry$getCrossDomainMessageRouter() {
        return tab._ApiObjectRegistry._getSingleton('ICrossDomainMessageRouter');
    }
    tab._ApiObjectRegistry.disposeCrossDomainMessageRouter = function tab__ApiObjectRegistry$disposeCrossDomainMessageRouter() {
        tab._ApiObjectRegistry._clearSingletonInstance('ICrossDomainMessageRouter');
    }
    tab._ApiObjectRegistry._registerType = function tab__ApiObjectRegistry$_registerType(interfaceTypeName, objectCreationFunc) {
        if (ss.isNullOrUndefined(tab._ApiObjectRegistry._creationRegistry)) {
            tab._ApiObjectRegistry._creationRegistry = {};
        }
        var previousType = tab._ApiObjectRegistry._creationRegistry[interfaceTypeName];
        tab._ApiObjectRegistry._creationRegistry[interfaceTypeName] = objectCreationFunc;
        return previousType;
    }
    tab._ApiObjectRegistry._createType = function tab__ApiObjectRegistry$_createType(interfaceTypeName) {
        if (ss.isNullOrUndefined(tab._ApiObjectRegistry._creationRegistry)) {
            throw tab._TableauException.createInternalError('No types registered');
        }
        var creationFunc = tab._ApiObjectRegistry._creationRegistry[interfaceTypeName];
        if (ss.isNullOrUndefined(creationFunc)) {
            throw tab._TableauException.createInternalError("No creation function has been registered for interface type '" + interfaceTypeName + "'.");
        }
        var instance = creationFunc();
        return instance;
    }
    tab._ApiObjectRegistry._getSingleton = function tab__ApiObjectRegistry$_getSingleton(interfaceTypeName) {
        if (ss.isNullOrUndefined(tab._ApiObjectRegistry._singletonInstanceRegistry)) {
            tab._ApiObjectRegistry._singletonInstanceRegistry = {};
        }
        var instance = tab._ApiObjectRegistry._singletonInstanceRegistry[interfaceTypeName];
        if (ss.isNullOrUndefined(instance)) {
            instance = tab._ApiObjectRegistry._createType(interfaceTypeName);
            tab._ApiObjectRegistry._singletonInstanceRegistry[interfaceTypeName] = instance;
        }
        return instance;
    }
    tab._ApiObjectRegistry._clearSingletonInstance = function tab__ApiObjectRegistry$_clearSingletonInstance(interfaceTypeName) {
        if (ss.isNullOrUndefined(tab._ApiObjectRegistry._singletonInstanceRegistry)) {
            return null;
        }
        var instance = tab._ApiObjectRegistry._singletonInstanceRegistry[interfaceTypeName];
        delete tab._ApiObjectRegistry._singletonInstanceRegistry[interfaceTypeName];
        return instance;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._CustomViewImpl

    tab._CustomViewImpl = function tab__CustomViewImpl(workbookImpl, name, messagingOptions) {
        this._workbookImpl = workbookImpl;
        this._name = name;
        this._messagingOptions = messagingOptions;
        this._isPublic = false;
        this._isDefault = false;
        this._isStale = false;
    }
    tab._CustomViewImpl._getAsync = function tab__CustomViewImpl$_getAsync(eventContext) {
        var deferred = new tab._Deferred();
        deferred.resolve(eventContext.get__customViewImpl().get__customView());
        return deferred.get_promise();
    }
    tab._CustomViewImpl._createNew = function tab__CustomViewImpl$_createNew(workbookImpl, messagingOptions, apiPresModel, defaultId) {
        var cv = new tab._CustomViewImpl(workbookImpl, apiPresModel.name, messagingOptions);
        cv._isPublic = apiPresModel.isPublic;
        cv._url = apiPresModel.url;
        cv._ownerName = apiPresModel.owner.friendlyName;
        cv._isDefault = ss.isValue(defaultId) && defaultId === apiPresModel.id;
        cv._presModel = apiPresModel;
        return cv;
    }
    tab._CustomViewImpl._saveNewAsync = function tab__CustomViewImpl$_saveNewAsync(workbookImpl, messagingOptions, name) {
        var deferred = new tab._Deferred();
        var param = {};
        param['api.customViewName'] = name;
        var returnHandler = tab._CustomViewImpl._createCustomViewCommandReturnHandler('api.SaveNewCustomViewCommand', deferred, function(result) {
            tab._CustomViewImpl._processCustomViewUpdate(workbookImpl, messagingOptions, result, true);
            var newView = null;
            if (ss.isValue(workbookImpl.get__updatedCustomViews())) {
                newView = workbookImpl.get__updatedCustomViews().get_item(0);
            }
            deferred.resolve(newView);
        });
        messagingOptions.sendCommand(param, returnHandler);
        return deferred.get_promise();
    }
    tab._CustomViewImpl._showCustomViewAsync = function tab__CustomViewImpl$_showCustomViewAsync(workbookImpl, messagingOptions, serverCustomizedView) {
        var deferred = new tab._Deferred();
        var param = {};
        if (ss.isValue(serverCustomizedView)) {
            param['api.customViewParam'] = serverCustomizedView;
        }
        var returnHandler = tab._CustomViewImpl._createCustomViewCommandReturnHandler('api.ShowCustomViewCommand', deferred, function(result) {
            var cv = workbookImpl.get_activeCustomView();
            deferred.resolve(cv);
        });
        messagingOptions.sendCommand(param, returnHandler);
        return deferred.get_promise();
    }
    tab._CustomViewImpl._makeCurrentCustomViewDefaultAsync = function tab__CustomViewImpl$_makeCurrentCustomViewDefaultAsync(workbookImpl, messagingOptions) {
        var deferred = new tab._Deferred();
        var param = {};
        var returnHandler = tab._CustomViewImpl._createCustomViewCommandReturnHandler('api.MakeCurrentCustomViewDefaultCommand', deferred, function(result) {
            var cv = workbookImpl.get_activeCustomView();
            deferred.resolve(cv);
        });
        messagingOptions.sendCommand(param, returnHandler);
        return deferred.get_promise();
    }
    tab._CustomViewImpl._getCustomViewsAsync = function tab__CustomViewImpl$_getCustomViewsAsync(workbookImpl, messagingOptions) {
        var deferred = new tab._Deferred();
        var returnHandler = new tab._CommandReturnHandler('api.FetchCustomViewsCommand', 0, function(result) {
            tab._CustomViewImpl._processCustomViews(workbookImpl, messagingOptions, result);
            deferred.resolve(workbookImpl.get__customViews()._toApiCollection());
        }, function(remoteError, message) {
            deferred.reject(tab._TableauException.create('serverError', message));
        });
        messagingOptions.sendCommand(null, returnHandler);
        return deferred.get_promise();
    }
    tab._CustomViewImpl._processCustomViews = function tab__CustomViewImpl$_processCustomViews(workbookImpl, messagingOptions, info) {
        tab._CustomViewImpl._processCustomViewUpdate(workbookImpl, messagingOptions, info, false);
    }
    tab._CustomViewImpl._processCustomViewUpdate = function tab__CustomViewImpl$_processCustomViewUpdate(workbookImpl, messagingOptions, info, doUpdateList) {
        if (doUpdateList) {
            workbookImpl.set__updatedCustomViews(new tab._Collection());
        }
        workbookImpl.set__currentCustomView(null);
        var currentViewName = null;
        if (ss.isValue(info.currentView)) {
            currentViewName = info.currentView.name;
        }
        var defaultId = info.defaultCustomViewId;
        if (doUpdateList && ss.isValue(info.newView)) {
            var newViewImpl = tab._CustomViewImpl._createNew(workbookImpl, messagingOptions, info.newView, defaultId);
            workbookImpl.get__updatedCustomViews()._add(newViewImpl.get__name(), newViewImpl.get__customView());
        }
        workbookImpl.set__removedCustomViews(workbookImpl.get__customViews());
        workbookImpl.set__customViews(new tab._Collection());
        if (ss.isValue(info.customViews)) {
            var list = info.customViews;
            if (list.length > 0) {
                for (var i = 0; i < list.length; i++) {
                    var customViewImpl = tab._CustomViewImpl._createNew(workbookImpl, messagingOptions, list[i], defaultId);
                    workbookImpl.get__customViews()._add(customViewImpl.get__name(), customViewImpl.get__customView());
                    if (workbookImpl.get__removedCustomViews()._has(customViewImpl.get__name())) {
                        workbookImpl.get__removedCustomViews()._remove(customViewImpl.get__name());
                    } else if (doUpdateList) {
                        if (!workbookImpl.get__updatedCustomViews()._has(customViewImpl.get__name())) {
                            workbookImpl.get__updatedCustomViews()._add(customViewImpl.get__name(), customViewImpl.get__customView());
                        }
                    }
                    if (ss.isValue(currentViewName) && customViewImpl.get__name() === currentViewName) {
                        workbookImpl.set__currentCustomView(customViewImpl.get__customView());
                    }
                }
            }
        }
    }
    tab._CustomViewImpl._createCustomViewCommandReturnHandler = function tab__CustomViewImpl$_createCustomViewCommandReturnHandler(commandName, deferred, successCallback) {
        var errorCallback = function(remoteError, message) {
            deferred.reject(tab._TableauException.create('serverError', message));
        };
        return new tab._CommandReturnHandler(commandName, 0, successCallback, errorCallback);
    }
    tab._CustomViewImpl.prototype = {
        _customView: null,
        _presModel: null,
        _workbookImpl: null,
        _messagingOptions: null,
        _name: null,
        _ownerName: null,
        _url: null,
        _isPublic: false,
        _isDefault: false,
        _isStale: false,

        get__customView: function tab__CustomViewImpl$get__customView() {
            if (this._customView == null) {
                this._customView = new tableauSoftware.CustomView(this);
            }
            return this._customView;
        },

        get__workbook: function tab__CustomViewImpl$get__workbook() {
            return this._workbookImpl.get_workbook();
        },

        get__url: function tab__CustomViewImpl$get__url() {
            return this._url;
        },

        get__name: function tab__CustomViewImpl$get__name() {
            return this._name;
        },
        set__name: function tab__CustomViewImpl$set__name(value) {
            if (this._isStale) {
                throw tab._TableauException.create('staleDataReference', 'Stale data');
            }
            this._name = value;
            return value;
        },

        get__ownerName: function tab__CustomViewImpl$get__ownerName() {
            return this._ownerName;
        },

        get__advertised: function tab__CustomViewImpl$get__advertised() {
            return this._isPublic;
        },
        set__advertised: function tab__CustomViewImpl$set__advertised(value) {
            if (this._isStale) {
                throw tab._TableauException.create('staleDataReference', 'Stale data');
            }
            this._isPublic = value;
            return value;
        },

        get__isDefault: function tab__CustomViewImpl$get__isDefault() {
            return this._isDefault;
        },

        saveAsync: function tab__CustomViewImpl$saveAsync() {
            if (this._isStale || ss.isNullOrUndefined(this._presModel)) {
                throw tab._TableauException.create('staleDataReference', 'Stale data');
            }
            this._presModel.isPublic = this._isPublic;
            this._presModel.name = this._name;
            var deferred = new tab._Deferred();
            var param = {};
            param['api.customViewParam'] = this._presModel;
            var returnHandler = tab._CustomViewImpl._createCustomViewCommandReturnHandler('api.UpdateCustomViewCommand', deferred, ss.Delegate.create(this, function(result) {
                tab._CustomViewImpl._processCustomViewUpdate(this._workbookImpl, this._messagingOptions, result, true);
                deferred.resolve(this.get__customView());
            }));
            this._messagingOptions.sendCommand(param, returnHandler);
            return deferred.get_promise();
        },

        _removeAsync: function tab__CustomViewImpl$_removeAsync() {
            var deferred = new tab._Deferred();
            var param = {};
            param['api.customViewParam'] = this._presModel;
            var returnHandler = tab._CustomViewImpl._createCustomViewCommandReturnHandler('api.RemoveCustomViewCommand', deferred, ss.Delegate.create(this, function(result) {
                this._isStale = true;
                tab._CustomViewImpl._processCustomViews(this._workbookImpl, this._messagingOptions, result);
                deferred.resolve(this.get__customView());
            }));
            this._messagingOptions.sendCommand(param, returnHandler);
            return deferred.get_promise();
        },

        _showAsync: function tab__CustomViewImpl$_showAsync() {
            if (this._isStale || ss.isNullOrUndefined(this._presModel)) {
                throw tab._TableauException.create('staleDataReference', 'Stale data');
            }
            return tab._CustomViewImpl._showCustomViewAsync(this._workbookImpl, this._messagingOptions, this._presModel);
        },

        _isDifferent: function tab__CustomViewImpl$_isDifferent(other) {
            return (this._ownerName !== other._ownerName || this._url !== other._url || this._isPublic !== other._isPublic || this._isDefault !== other._isDefault);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._DashboardImpl

    tab._DashboardImpl = function tab__DashboardImpl(sheetInfoImpl, workbookImpl, messagingOptions) {
        this._worksheets$1 = new tab._Collection();
        this._dashboardObjects$1 = new tab._Collection();
        tab._DashboardImpl.initializeBase(this, [sheetInfoImpl, workbookImpl, messagingOptions]);
    }
    tab._DashboardImpl.prototype = {
        _dashboard$1: null,

        get_sheet: function tab__DashboardImpl$get_sheet() {
            return this.get_dashboard();
        },

        get_dashboard: function tab__DashboardImpl$get_dashboard() {
            if (this._dashboard$1 == null) {
                this._dashboard$1 = new tableauSoftware.Dashboard(this);
            }
            return this._dashboard$1;
        },

        get_worksheets: function tab__DashboardImpl$get_worksheets() {
            return this._worksheets$1;
        },

        get_objects: function tab__DashboardImpl$get_objects() {
            return this._dashboardObjects$1;
        },

        _addObjects: function tab__DashboardImpl$_addObjects(zones, findSheetFunc) {
            this._dashboardObjects$1 = new tab._Collection();
            this._worksheets$1 = new tab._Collection();
            for (var i = 0; i < zones.length; i++) {
                var zone = zones[i];
                var worksheet = null;
                if (zones[i]._objectType === 'worksheet') {
                    var name = zone._name;
                    if (ss.isNullOrUndefined(name)) {
                        continue;
                    }
                    var index = this._worksheets$1.get__length();
                    var size = tab.SheetSizeFactory.createAutomatic();
                    var isActive = false;
                    var publishedSheetInfo = findSheetFunc(name);
                    var isHidden = ss.isNullOrUndefined(publishedSheetInfo);
                    var url = (isHidden) ? '' : publishedSheetInfo.getUrl();
                    var sheetInfoImpl = tab.$create__SheetInfoImpl(name, 'worksheet', index, size, this.get_workbook(), url, isActive, isHidden, zone._zoneId);
                    var worksheetImpl = new tab._WorksheetImpl(sheetInfoImpl, this.get_workbookImpl(), this.get_messagingOptions(), this);
                    worksheet = worksheetImpl.get_worksheet();
                    this._worksheets$1._add(name, worksheetImpl.get_worksheet());
                }
                var obj = new tableauSoftware.DashboardObject(zone, this.get_dashboard(), worksheet);
                this._dashboardObjects$1._add(i.toString(), obj);
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._DataSourceImpl

    tab._DataSourceImpl = function tab__DataSourceImpl(name, isPrimary) {
        this._fields = new tab._Collection();
        tab._Param.verifyString(name, 'name');
        this._name = name;
        this._isPrimary = isPrimary;
    }
    tab._DataSourceImpl.processDataSource = function tab__DataSourceImpl$processDataSource(dataSourcePm) {
        var dataSourceImpl = new tab._DataSourceImpl(dataSourcePm.name, dataSourcePm.isPrimary);
        var fields = (dataSourcePm.fields || new Array(0));
        var $enum1 = ss.IEnumerator.getEnumerator(fields);
        while ($enum1.moveNext()) {
            var fieldPm = $enum1.current;
            var field = new tableauSoftware.Field(dataSourceImpl.get_dataSource(), fieldPm.name, fieldPm.role, fieldPm.aggregation);
            dataSourceImpl.addField(field);
        }
        return dataSourceImpl;
    }
    tab._DataSourceImpl.processDataSourcesForWorksheet = function tab__DataSourceImpl$processDataSourcesForWorksheet(pm) {
        var dataSources = new tab._Collection();
        var primaryDataSourceImpl = null;
        var $enum1 = ss.IEnumerator.getEnumerator(pm.dataSources);
        while ($enum1.moveNext()) {
            var dataSourcePm = $enum1.current;
            var dataSourceImpl = tab._DataSourceImpl.processDataSource(dataSourcePm);
            if (dataSourcePm.isPrimary) {
                primaryDataSourceImpl = dataSourceImpl;
            } else {
                dataSources._add(dataSourcePm.name, dataSourceImpl.get_dataSource());
            }
        }
        if (ss.isValue(primaryDataSourceImpl)) {
            dataSources._addToFirst(primaryDataSourceImpl.get_name(), primaryDataSourceImpl.get_dataSource());
        }
        return dataSources;
    }
    tab._DataSourceImpl.prototype = {
        _name: null,
        _isPrimary: false,
        _dataSource: null,

        get_dataSource: function tab__DataSourceImpl$get_dataSource() {
            if (this._dataSource == null) {
                this._dataSource = new tableauSoftware.DataSource(this);
            }
            return this._dataSource;
        },

        get_name: function tab__DataSourceImpl$get_name() {
            return this._name;
        },

        get_fields: function tab__DataSourceImpl$get_fields() {
            return this._fields;
        },

        get_isPrimary: function tab__DataSourceImpl$get_isPrimary() {
            return this._isPrimary;
        },

        addField: function tab__DataSourceImpl$addField(field) {
            this._fields._add(field.getName(), field);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._deferredUtil

    tab._deferredUtil = function tab__deferredUtil() {}
    tab._deferredUtil.coerceToTrustedPromise = function tab__deferredUtil$coerceToTrustedPromise(promiseOrValue) {
        var promise;
        if (promiseOrValue instanceof tableauSoftware.Promise) {
            promise = promiseOrValue;
        } else {
            if (ss.isValue(promiseOrValue) && typeof(promiseOrValue.valueOf) === 'function') {
                promiseOrValue = promiseOrValue.valueOf();
            }
            if (tab._deferredUtil.isPromise(promiseOrValue)) {
                var deferred = new tab._DeferredImpl();
                (promiseOrValue).then(ss.Delegate.create(deferred, deferred.resolve), ss.Delegate.create(deferred, deferred.reject));
                promise = deferred.get_promise();
            } else {
                promise = tab._deferredUtil.resolved(promiseOrValue);
            }
        }
        return promise;
    }
    tab._deferredUtil.reject = function tab__deferredUtil$reject(promiseOrValue) {
        return tab._deferredUtil.coerceToTrustedPromise(promiseOrValue).then(function(value) {
            return tab._deferredUtil.rejected(value);
        }, null);
    }
    tab._deferredUtil.resolved = function tab__deferredUtil$resolved(value) {
        var p = new tab._PromiseImpl(function(callback, errback) {
            try {
                return tab._deferredUtil.coerceToTrustedPromise((ss.isValue(callback)) ? callback(value) : value);
            } catch (e) {
                return tab._deferredUtil.rejected(e);
            }
        });
        return p;
    }
    tab._deferredUtil.rejected = function tab__deferredUtil$rejected(reason) {
        var p = new tab._PromiseImpl(function(callback, errback) {
            try {
                return (ss.isValue(errback)) ? tab._deferredUtil.coerceToTrustedPromise(errback(reason)) : tab._deferredUtil.rejected(reason);
            } catch (e) {
                return tab._deferredUtil.rejected(e);
            }
        });
        return p;
    }
    tab._deferredUtil.isPromise = function tab__deferredUtil$isPromise(promiseOrValue) {
        return ss.isValue(promiseOrValue) && typeof(promiseOrValue.then) === 'function';
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._CollectionImpl

    tab._CollectionImpl = function tab__CollectionImpl() {
        this._items = [];
        this._itemMap = {};
    }
    tab._CollectionImpl.prototype = {

        get__length: function tab__CollectionImpl$get__length() {
            return this._items.length;
        },

        get__rawArray: function tab__CollectionImpl$get__rawArray() {
            return this._items;
        },

        _get: function tab__CollectionImpl$_get(key) {
            var validKey = this._ensureValidKey(key);
            if (ss.isValue(this._itemMap[validKey])) {
                return this._itemMap[validKey];
            }
            return undefined;
        },

        _has: function tab__CollectionImpl$_has(key) {
            return ss.isValue(this._get(key));
        },

        _add: function tab__CollectionImpl$_add(key, item) {
            this._verifyKeyAndItemParameters(key, item);
            var validKey = this._ensureValidKey(key);
            this._items.push(item);
            this._itemMap[validKey] = item;
        },

        _addToFirst: function tab__CollectionImpl$_addToFirst(key, item) {
            this._verifyKeyAndItemParameters(key, item);
            var validKey = this._ensureValidKey(key);
            this._items.unshift(item);
            this._itemMap[validKey] = item;
        },

        _remove: function tab__CollectionImpl$_remove(key) {
            var validKey = this._ensureValidKey(key);
            if (ss.isValue(this._itemMap[validKey])) {
                var item = this._itemMap[validKey];
                delete this._itemMap[validKey];
                for (var index = 0; index < this._items.length; index++) {
                    if (this._items[index] === item) {
                        this._items.splice(index, 1);
                        break;
                    }
                }
            }
        },

        _toApiCollection: function tab__CollectionImpl$_toApiCollection() {
            var clone = this._items.concat();
            clone.get = ss.Delegate.create(this, function(key) {
                return this._get(key);
            });
            clone.has = ss.Delegate.create(this, function(key) {
                return this._has(key);
            });
            return clone;
        },

        _verifyUniqueKeyParameter: function tab__CollectionImpl$_verifyUniqueKeyParameter(key) {
            if (tab._Utility.isNullOrEmpty(key)) {
                throw new Error('Null key');
            }
            if (this._has(key)) {
                throw new Error("Duplicate key '" + key + "'");
            }
        },

        _verifyKeyAndItemParameters: function tab__CollectionImpl$_verifyKeyAndItemParameters(key, item) {
            this._verifyUniqueKeyParameter(key);
            if (ss.isNullOrUndefined(item)) {
                throw new Error('Null item');
            }
        },

        _ensureValidKey: function tab__CollectionImpl$_ensureValidKey(key) {
            return '_' + key;
        },
        get_item: function tab__CollectionImpl$get_item(index) {
            return this._items[index];
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._DeferredImpl

    tab._DeferredImpl = function tab__DeferredImpl() {
        this._listeners = [];
        this._promise = new tab._PromiseImpl(ss.Delegate.create(this, this.then));
        this._thenFunc = ss.Delegate.create(this, this._preResolutionThen);
        this._resolveFunc = ss.Delegate.create(this, this._transitionToFulfilled);
    }
    tab._DeferredImpl.prototype = {
        _promise: null,
        _thenFunc: null,
        _resolveFunc: null,

        get_promise: function tab__DeferredImpl$get_promise() {
            return this._promise;
        },

        all: function tab__DeferredImpl$all(promisesOrValues) {
            var allDone = new tab._DeferredImpl();
            var length = promisesOrValues.length;
            var toResolve = length;
            var results = [];
            if (!length) {
                allDone.resolve(results);
                return allDone.get_promise();
            }
            var resolveOne = function(promiseOrValue, index) {
                var promise = tab._deferredUtil.coerceToTrustedPromise(promiseOrValue);
                promise.then(function(returnValue) {
                    results[index] = returnValue;
                    toResolve--;
                    if (!toResolve) {
                        allDone.resolve(results);
                    }
                    return null;
                }, function(e) {
                    allDone.reject(e);
                    return null;
                });
            };
            for (var i = 0; i < length; i++) {
                resolveOne(promisesOrValues[i], i);
            }
            return allDone.get_promise();
        },

        then: function tab__DeferredImpl$then(callback, errback) {
            return this._thenFunc(callback, errback);
        },

        resolve: function tab__DeferredImpl$resolve(promiseOrValue) {
            return this._resolveFunc(promiseOrValue);
        },

        reject: function tab__DeferredImpl$reject(e) {
            return this._resolveFunc(tab._deferredUtil.rejected(e));
        },

        _preResolutionThen: function tab__DeferredImpl$_preResolutionThen(callback, errback) {
            var deferred = new tab._DeferredImpl();
            this._listeners.push(function(promise) {
                promise.then(callback, errback).then(ss.Delegate.create(deferred, deferred.resolve), ss.Delegate.create(deferred, deferred.reject));
            });
            return deferred.get_promise();
        },

        _transitionToFulfilled: function tab__DeferredImpl$_transitionToFulfilled(completed) {
            var completedPromise = tab._deferredUtil.coerceToTrustedPromise(completed);
            this._thenFunc = completedPromise.then;
            this._resolveFunc = tab._deferredUtil.coerceToTrustedPromise;
            for (var i = 0; i < this._listeners.length; i++) {
                var listener = this._listeners[i];
                listener(completedPromise);
            }
            this._listeners = null;
            return completedPromise;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._PromiseImpl

    tab._PromiseImpl = function tab__PromiseImpl(thenFunc) {
        this.then = thenFunc;
    }
    tab._PromiseImpl.prototype = {
        then: null,

        always: function tab__PromiseImpl$always(callback) {
            return this.then(callback, callback);
        },

        otherwise: function tab__PromiseImpl$otherwise(errback) {
            return this.then(null, errback);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._markImpl

    tab._markImpl = function tab__markImpl(tupleIdOrPairs) {
        this._collection = new tab._Collection();
        if (tab._jQueryShim.isArray(tupleIdOrPairs)) {
            var pairArr = tupleIdOrPairs;
            for (var i = 0; i < pairArr.length; i++) {
                var pair = pairArr[i];
                if (!ss.isValue(pair.fieldName)) {
                    throw tab._TableauException.createInvalidParameter('pair.fieldName');
                }
                if (!ss.isValue(pair.value)) {
                    throw tab._TableauException.createInvalidParameter('pair.value');
                }
                var p = new tableauSoftware.Pair(pair.fieldName, pair.value);
                this._collection._add(p.fieldName, p);
            }
        } else {
            this._tupleId = tupleIdOrPairs;
        }
    }
    tab._markImpl._processSelectedMarks = function tab__markImpl$_processSelectedMarks(marksPresModel) {
        var marks = new tab._Collection();
        if (ss.isNullOrUndefined(marksPresModel) || tab._Utility.isNullOrEmpty(marksPresModel.marks)) {
            return marks;
        }
        var $enum1 = ss.IEnumerator.getEnumerator(marksPresModel.marks);
        while ($enum1.moveNext()) {
            var markPresModel = $enum1.current;
            var tupleId = markPresModel.tupleId;
            var mark = new tableauSoftware.Mark(tupleId);
            marks._add(tupleId.toString(), mark);
            var $enum2 = ss.IEnumerator.getEnumerator(markPresModel.pairs);
            while ($enum2.moveNext()) {
                var pairPresModel = $enum2.current;
                var value = tab._Utility.convertRawValue(pairPresModel.value, pairPresModel.valueDataType);
                var pair = new tableauSoftware.Pair(pairPresModel.fieldName, value);
                pair.formattedValue = pairPresModel.formattedValue;
                if (!mark._impl.get__pairs()._has(pair.fieldName)) {
                    mark._impl._addPair(pair);
                }
            }
        }
        return marks;
    }
    tab._markImpl.prototype = {
        _clonedPairs: null,
        _tupleId: 0,

        get__pairs: function tab__markImpl$get__pairs() {
            return this._collection;
        },

        get__tupleId: function tab__markImpl$get__tupleId() {
            return this._tupleId;
        },

        get__clonedPairs: function tab__markImpl$get__clonedPairs() {
            if (this._clonedPairs == null) {
                this._clonedPairs = this._collection._toApiCollection();
            }
            return this._clonedPairs;
        },

        _addPair: function tab__markImpl$_addPair(pair) {
            this._collection._add(pair.fieldName, pair);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._Param

    tab._Param = function tab__Param() {}
    tab._Param.verifyString = function tab__Param$verifyString(argumentValue, argumentName) {
        if (ss.isNullOrUndefined(argumentValue) || !argumentValue.length) {
            throw tab._TableauException.createInternalStringArgumentException(argumentName);
        }
    }
    tab._Param.verifyValue = function tab__Param$verifyValue(argumentValue, argumentName) {
        if (ss.isNullOrUndefined(argumentValue)) {
            throw tab._TableauException.createInternalNullArgumentException(argumentName);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._parameterImpl

    tab._parameterImpl = function tab__parameterImpl(pm) {
        this._name = pm.name;
        this._currentValue = tab._Utility.getDataValue(pm.currentValue);
        this._dataType = pm.dataType;
        this._allowableValuesType = pm.allowableValuesType;
        if (ss.isValue(pm.allowableValues) && this._allowableValuesType === 'list') {
            this._allowableValues = [];
            var $enum1 = ss.IEnumerator.getEnumerator(pm.allowableValues);
            while ($enum1.moveNext()) {
                var adv = $enum1.current;
                this._allowableValues.push(tab._Utility.getDataValue(adv));
            }
        }
        if (this._allowableValuesType === 'range') {
            this._minValue = tab._Utility.getDataValue(pm.minValue);
            this._maxValue = tab._Utility.getDataValue(pm.maxValue);
            this._stepSize = pm.stepSize;
            if ((this._dataType === 'date' || this._dataType === 'datetime') && ss.isValue(this._stepSize) && ss.isValue(pm.dateStepPeriod)) {
                this._dateStepPeriod = pm.dateStepPeriod;
            }
        }
    }
    tab._parameterImpl.prototype = {
        _parameter: null,
        _name: null,
        _currentValue: null,
        _dataType: null,
        _allowableValuesType: null,
        _allowableValues: null,
        _minValue: null,
        _maxValue: null,
        _stepSize: null,
        _dateStepPeriod: null,

        get__parameter: function tab__parameterImpl$get__parameter() {
            if (this._parameter == null) {
                this._parameter = new tableauSoftware.Parameter(this);
            }
            return this._parameter;
        },

        get__name: function tab__parameterImpl$get__name() {
            return this._name;
        },

        get__currentValue: function tab__parameterImpl$get__currentValue() {
            return this._currentValue;
        },

        get__dataType: function tab__parameterImpl$get__dataType() {
            return this._dataType;
        },

        get__allowableValuesType: function tab__parameterImpl$get__allowableValuesType() {
            return this._allowableValuesType;
        },

        get__allowableValues: function tab__parameterImpl$get__allowableValues() {
            return this._allowableValues;
        },

        get__minValue: function tab__parameterImpl$get__minValue() {
            return this._minValue;
        },

        get__maxValue: function tab__parameterImpl$get__maxValue() {
            return this._maxValue;
        },

        get__stepSize: function tab__parameterImpl$get__stepSize() {
            return this._stepSize;
        },

        get__dateStepPeriod: function tab__parameterImpl$get__dateStepPeriod() {
            return this._dateStepPeriod;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._SheetImpl

    tab._SheetImpl = function tab__SheetImpl(sheetInfoImpl, workbookImpl, messagingOptions) {
        tab._Param.verifyValue(sheetInfoImpl, 'sheetInfoImpl');
        tab._Param.verifyValue(workbookImpl, 'workbookImpl');
        tab._Param.verifyValue(messagingOptions, 'messagingOptions');
        this._name = sheetInfoImpl.name;
        this._index = sheetInfoImpl.index;
        this._isActive = sheetInfoImpl.isActive;
        this._isHidden = sheetInfoImpl.isHidden;
        this._sheetType = sheetInfoImpl.sheetType;
        this._size = sheetInfoImpl.size;
        this._url = sheetInfoImpl.url;
        this._workbookImpl = workbookImpl;
        this._messagingOptions = messagingOptions;
        this._zoneId = sheetInfoImpl.zoneId;
    }
    tab._SheetImpl._convertValueToIntIfValid = function tab__SheetImpl$_convertValueToIntIfValid(value) {
        if (ss.isValue(value)) {
            return tab._Utility.toInt(value);
        }
        return value;
    }
    tab._SheetImpl._normalizeSheetSize = function tab__SheetImpl$_normalizeSheetSize(size) {
        var behavior = tab._enums._normalizeSheetSizeBehavior(size.behavior, 'size.behavior');
        var minSize = size.minSize;
        if (ss.isValue(minSize)) {
            minSize = tab.$create_Size(tab._SheetImpl._convertValueToIntIfValid(size.minSize.width), tab._SheetImpl._convertValueToIntIfValid(size.minSize.height));
        }
        var maxSize = size.maxSize;
        if (ss.isValue(maxSize)) {
            maxSize = tab.$create_Size(tab._SheetImpl._convertValueToIntIfValid(size.maxSize.width), tab._SheetImpl._convertValueToIntIfValid(size.maxSize.height));
        }
        return tab.$create_SheetSize(behavior, minSize, maxSize);
    }
    tab._SheetImpl.prototype = {
        _name: null,
        _index: 0,
        _isActive: false,
        _isHidden: false,
        _sheetType: null,
        _size: null,
        _url: null,
        _workbookImpl: null,
        _messagingOptions: null,
        _parentStoryPointImpl: null,
        _zoneId: 0,

        get_name: function tab__SheetImpl$get_name() {
            return this._name;
        },

        get_index: function tab__SheetImpl$get_index() {
            return this._index;
        },

        get_workbookImpl: function tab__SheetImpl$get_workbookImpl() {
            return this._workbookImpl;
        },

        get_workbook: function tab__SheetImpl$get_workbook() {
            return this._workbookImpl.get_workbook();
        },

        get_url: function tab__SheetImpl$get_url() {
            if (this._isHidden) {
                throw tab._TableauException.createNoUrlForHiddenWorksheet();
            }
            return this._url;
        },

        get_size: function tab__SheetImpl$get_size() {
            return this._size;
        },

        get_isHidden: function tab__SheetImpl$get_isHidden() {
            return this._isHidden;
        },

        get_isActive: function tab__SheetImpl$get_isActive() {
            return this._isActive;
        },
        set_isActive: function tab__SheetImpl$set_isActive(value) {
            this._isActive = value;
            return value;
        },

        get_isDashboard: function tab__SheetImpl$get_isDashboard() {
            return this._sheetType === 'dashboard';
        },

        get_sheetType: function tab__SheetImpl$get_sheetType() {
            return this._sheetType;
        },

        get_parentStoryPoint: function tab__SheetImpl$get_parentStoryPoint() {
            if (ss.isValue(this._parentStoryPointImpl)) {
                return this._parentStoryPointImpl.get_storyPoint();
            }
            return null;
        },

        get_parentStoryPointImpl: function tab__SheetImpl$get_parentStoryPointImpl() {
            return this._parentStoryPointImpl;
        },
        set_parentStoryPointImpl: function tab__SheetImpl$set_parentStoryPointImpl(value) {
            if (this._sheetType === 'story') {
                throw tab._TableauException.createInternalError('A story cannot be a child of another story.');
            }
            this._parentStoryPointImpl = value;
            return value;
        },

        get_zoneId: function tab__SheetImpl$get_zoneId() {
            return this._zoneId;
        },

        get_messagingOptions: function tab__SheetImpl$get_messagingOptions() {
            return this._messagingOptions;
        },

        changeSizeAsync: function tab__SheetImpl$changeSizeAsync(newSize) {
            newSize = tab._SheetImpl._normalizeSheetSize(newSize);
            if (this._sheetType === 'worksheet' && newSize.behavior !== 'automatic') {
                throw tab._TableauException.createInvalidSizeBehaviorOnWorksheet();
            }
            var deferred = new tab._Deferred();
            if (this._size.behavior === newSize.behavior && newSize.behavior === 'automatic') {
                deferred.resolve(newSize);
                return deferred.get_promise();
            }
            var dict = this._processSheetSize(newSize);
            var param = {};
            param['api.setSheetSizeName'] = this._name;
            param['api.minWidth'] = dict['api.minWidth'];
            param['api.minHeight'] = dict['api.minHeight'];
            param['api.maxWidth'] = dict['api.maxWidth'];
            param['api.maxHeight'] = dict['api.maxHeight'];
            var returnHandler = new tab._CommandReturnHandler('api.SetSheetSizeCommand', 1, ss.Delegate.create(this, function(result) {
                this.get_workbookImpl()._update(ss.Delegate.create(this, function() {
                    var updatedSize = this.get_workbookImpl().get_publishedSheets()._get(this.get_name()).getSize();
                    deferred.resolve(updatedSize);
                }));
            }), function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this.sendCommand(param, returnHandler);
            return deferred.get_promise();
        },

        sendCommand: function tab__SheetImpl$sendCommand(commandParameters, returnHandler) {
            this._messagingOptions.sendCommand(commandParameters, returnHandler);
        },

        _processSheetSize: function tab__SheetImpl$_processSheetSize(newSize) {
            var fixedSheetSize = null;
            if (ss.isNullOrUndefined(newSize) || ss.isNullOrUndefined(newSize.behavior) || (newSize.behavior !== 'automatic' && ss.isNullOrUndefined(newSize.minSize) && ss.isNullOrUndefined(newSize.maxSize))) {
                throw tab._TableauException.createInvalidSheetSizeParam();
            }
            var minWidth = 0;
            var minHeight = 0;
            var maxWidth = 0;
            var maxHeight = 0;
            var dict = {};
            dict['api.minWidth'] = 0;
            dict['api.minHeight'] = 0;
            dict['api.maxWidth'] = 0;
            dict['api.maxHeight'] = 0;
            if (newSize.behavior === 'automatic') {
                fixedSheetSize = tab.$create_SheetSize('automatic', undefined, undefined);
            } else if (newSize.behavior === 'atmost') {
                if (ss.isNullOrUndefined(newSize.maxSize) || ss.isNullOrUndefined(newSize.maxSize.width) || ss.isNullOrUndefined(newSize.maxSize.height)) {
                    throw tab._TableauException.createMissingMaxSize();
                }
                if (newSize.maxSize.width < 0 || newSize.maxSize.height < 0) {
                    throw tab._TableauException.createInvalidSizeValue();
                }
                dict['api.maxWidth'] = newSize.maxSize.width;
                dict['api.maxHeight'] = newSize.maxSize.height;
                fixedSheetSize = tab.$create_SheetSize('atmost', undefined, newSize.maxSize);
            } else if (newSize.behavior === 'atleast') {
                if (ss.isNullOrUndefined(newSize.minSize) || ss.isNullOrUndefined(newSize.minSize.width) || ss.isNullOrUndefined(newSize.minSize.height)) {
                    throw tab._TableauException.createMissingMinSize();
                }
                if (newSize.minSize.width < 0 || newSize.minSize.height < 0) {
                    throw tab._TableauException.createInvalidSizeValue();
                }
                dict['api.minWidth'] = newSize.minSize.width;
                dict['api.minHeight'] = newSize.minSize.height;
                fixedSheetSize = tab.$create_SheetSize('atleast', newSize.minSize, undefined);
            } else if (newSize.behavior === 'range') {
                if (ss.isNullOrUndefined(newSize.minSize) || ss.isNullOrUndefined(newSize.maxSize) || ss.isNullOrUndefined(newSize.minSize.width) || ss.isNullOrUndefined(newSize.maxSize.width) || ss.isNullOrUndefined(newSize.minSize.height) || ss.isNullOrUndefined(newSize.maxSize.height)) {
                    throw tab._TableauException.createMissingMinMaxSize();
                }
                if (newSize.minSize.width < 0 || newSize.minSize.height < 0 || newSize.maxSize.width < 0 || newSize.maxSize.height < 0 || newSize.minSize.width > newSize.maxSize.width || newSize.minSize.height > newSize.maxSize.height) {
                    throw tab._TableauException.createInvalidRangeSize();
                }
                dict['api.minWidth'] = newSize.minSize.width;
                dict['api.minHeight'] = newSize.minSize.height;
                dict['api.maxWidth'] = newSize.maxSize.width;
                dict['api.maxHeight'] = newSize.maxSize.height;
                fixedSheetSize = tab.$create_SheetSize('range', newSize.minSize, newSize.maxSize);
            } else if (newSize.behavior === 'exactly') {
                if (ss.isValue(newSize.minSize) && ss.isValue(newSize.maxSize) && ss.isValue(newSize.minSize.width) && ss.isValue(newSize.maxSize.width) && ss.isValue(newSize.minSize.height) && ss.isValue(newSize.maxSize.height)) {
                    minWidth = newSize.minSize.width;
                    minHeight = newSize.minSize.height;
                    maxWidth = newSize.maxSize.width;
                    maxHeight = newSize.maxSize.height;
                    if (minWidth !== maxWidth || minHeight !== maxHeight) {
                        throw tab._TableauException.createSizeConflictForExactly();
                    }
                } else if (ss.isValue(newSize.minSize) && ss.isValue(newSize.minSize.width) && ss.isValue(newSize.minSize.height)) {
                    minWidth = newSize.minSize.width;
                    minHeight = newSize.minSize.height;
                    maxWidth = minWidth;
                    maxHeight = minHeight;
                } else if (ss.isValue(newSize.maxSize) && ss.isValue(newSize.maxSize.width) && ss.isValue(newSize.maxSize.height)) {
                    maxWidth = newSize.maxSize.width;
                    maxHeight = newSize.maxSize.height;
                    minWidth = maxWidth;
                    minHeight = maxHeight;
                }
                dict['api.minWidth'] = minWidth;
                dict['api.minHeight'] = minHeight;
                dict['api.maxWidth'] = maxWidth;
                dict['api.maxHeight'] = maxHeight;
                fixedSheetSize = tab.$create_SheetSize('exactly', tab.$create_Size(minWidth, minHeight), tab.$create_Size(maxWidth, maxHeight));
            }
            this._size = fixedSheetSize;
            return dict;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._StoryImpl

    tab._StoryImpl = function tab__StoryImpl(sheetInfoImpl, workbookImpl, messagingOptions, storyPm, findSheetFunc) {
        tab._StoryImpl.initializeBase(this, [sheetInfoImpl, workbookImpl, messagingOptions]);
        tab._Param.verifyValue(storyPm, 'storyPm');
        tab._Param.verifyValue(findSheetFunc, 'findSheetFunc');
        this._findSheetFunc$1 = findSheetFunc;
        this.update(storyPm);
    }
    tab._StoryImpl.prototype = {
        _activeStoryPointImpl$1: null,
        _findSheetFunc$1: null,
        _story$1: null,
        _storyPointsInfo$1: null,

        add_activeStoryPointChange: function tab__StoryImpl$add_activeStoryPointChange(value) {
            this.__activeStoryPointChange$1 = ss.Delegate.combine(this.__activeStoryPointChange$1, value);
        },
        remove_activeStoryPointChange: function tab__StoryImpl$remove_activeStoryPointChange(value) {
            this.__activeStoryPointChange$1 = ss.Delegate.remove(this.__activeStoryPointChange$1, value);
        },

        __activeStoryPointChange$1: null,

        get_activeStoryPointImpl: function tab__StoryImpl$get_activeStoryPointImpl() {
            return this._activeStoryPointImpl$1;
        },

        get_sheet: function tab__StoryImpl$get_sheet() {
            return this.get_story();
        },

        get_story: function tab__StoryImpl$get_story() {
            if (this._story$1 == null) {
                this._story$1 = new tableauSoftware.Story(this);
            }
            return this._story$1;
        },

        get_storyPointsInfo: function tab__StoryImpl$get_storyPointsInfo() {
            return this._storyPointsInfo$1;
        },

        update: function tab__StoryImpl$update(storyPm) {
            var activeStoryPointContainedSheetInfo = null;
            var newActiveStoryPointInfoImpl = null;
            this._storyPointsInfo$1 = (this._storyPointsInfo$1 || new Array(storyPm.storyPoints.length));
            for (var i = 0; i < storyPm.storyPoints.length; i++) {
                var storyPointPm = storyPm.storyPoints[i];
                var caption = storyPointPm.caption;
                var isActive = i === storyPm.activeStoryPointIndex;
                var storyPointInfoImpl = tab.$create__StoryPointInfoImpl(caption, i, storyPointPm.storyPointId, isActive, storyPointPm.isUpdated, this);
                if (ss.isNullOrUndefined(this._storyPointsInfo$1[i])) {
                    this._storyPointsInfo$1[i] = new tableauSoftware.StoryPointInfo(storyPointInfoImpl);
                } else if (this._storyPointsInfo$1[i]._impl.storyPointId === storyPointInfoImpl.storyPointId) {
                    var existing = this._storyPointsInfo$1[i]._impl;
                    existing.caption = storyPointInfoImpl.caption;
                    existing.index = storyPointInfoImpl.index;
                    existing.isActive = isActive;
                    existing.isUpdated = storyPointInfoImpl.isUpdated;
                } else {
                    this._storyPointsInfo$1[i] = new tableauSoftware.StoryPointInfo(storyPointInfoImpl);
                }
                if (isActive) {
                    activeStoryPointContainedSheetInfo = storyPointPm.containedSheetInfo;
                    newActiveStoryPointInfoImpl = storyPointInfoImpl;
                }
            }
            var deleteCount = this._storyPointsInfo$1.length - storyPm.storyPoints.length;
            this._storyPointsInfo$1.splice(storyPm.storyPoints.length, deleteCount);
            var activeStoryPointChanged = ss.isNullOrUndefined(this._activeStoryPointImpl$1) || this._activeStoryPointImpl$1.get_storyPointId() !== newActiveStoryPointInfoImpl.storyPointId;
            if (ss.isValue(this._activeStoryPointImpl$1) && activeStoryPointChanged) {
                this._activeStoryPointImpl$1.set_isActive(false);
            }
            var previouslyActiveStoryPoint = this._activeStoryPointImpl$1;
            if (activeStoryPointChanged) {
                var containedSheetImpl = tab._StoryPointImpl.createContainedSheet(activeStoryPointContainedSheetInfo, this.get_workbookImpl(), this.get_messagingOptions(), this._findSheetFunc$1);
                this._activeStoryPointImpl$1 = new tab._StoryPointImpl(newActiveStoryPointInfoImpl, containedSheetImpl);
            } else {
                this._activeStoryPointImpl$1.set_isActive(newActiveStoryPointInfoImpl.isActive);
                this._activeStoryPointImpl$1.set_isUpdated(newActiveStoryPointInfoImpl.isUpdated);
            }
            if (activeStoryPointChanged && ss.isValue(previouslyActiveStoryPoint)) {
                this._raiseActiveStoryPointChange$1(this._storyPointsInfo$1[previouslyActiveStoryPoint.get_index()], this._activeStoryPointImpl$1.get_storyPoint());
            }
        },

        activatePreviousStoryPointAsync: function tab__StoryImpl$activatePreviousStoryPointAsync() {
            return this._activatePreviousNextStoryPointAsync$1('api.ActivatePreviousStoryPoint');
        },

        activateNextStoryPointAsync: function tab__StoryImpl$activateNextStoryPointAsync() {
            return this._activatePreviousNextStoryPointAsync$1('api.ActivateNextStoryPoint');
        },

        activateStoryPointAsync: function tab__StoryImpl$activateStoryPointAsync(index) {
            var deferred = new tab._Deferred();
            if (index < 0 || index >= this._storyPointsInfo$1.length) {
                throw tab._TableauException.createIndexOutOfRange(index);
            }
            var previouslyActiveStoryPointImpl = this.get_activeStoryPointImpl();
            var commandParameters = {};
            commandParameters['api.storyPointIndex'] = index;
            var returnHandler = new tab._CommandReturnHandler('api.ActivateStoryPoint', 0, ss.Delegate.create(this, function(result) {
                var activeStoryPointPm = result;
                this._updateActiveState$1(previouslyActiveStoryPointImpl, activeStoryPointPm);
                deferred.resolve(this._activeStoryPointImpl$1.get_storyPoint());
            }), function(remoteError, errorMessage) {
                deferred.reject(tab._TableauException.createServerError(errorMessage));
            });
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        revertStoryPointAsync: function tab__StoryImpl$revertStoryPointAsync(index) {
            index = (index || this._activeStoryPointImpl$1.get_index());
            if (index < 0 || index >= this._storyPointsInfo$1.length) {
                throw tab._TableauException.createIndexOutOfRange(index);
            }
            var deferred = new tab._Deferred();
            var commandParameters = {};
            commandParameters['api.storyPointIndex'] = index;
            var returnHandler = new tab._CommandReturnHandler('api.RevertStoryPoint', 0, ss.Delegate.create(this, function(result) {
                var updatedStoryPointPm = result;
                this._updateStoryPointInfo$1(index, updatedStoryPointPm);
                deferred.resolve(this._storyPointsInfo$1[index]);
            }), function(remoteError, errorMessage) {
                deferred.reject(tab._TableauException.createServerError(errorMessage));
            });
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _activatePreviousNextStoryPointAsync$1: function tab__StoryImpl$_activatePreviousNextStoryPointAsync$1(commandName) {
            if (commandName !== 'api.ActivatePreviousStoryPoint' && commandName !== 'api.ActivateNextStoryPoint') {
                throw tab._TableauException.createInternalError("commandName '" + commandName + "' is invalid.");
            }
            var deferred = new tab._Deferred();
            var previouslyActiveStoryPointImpl = this.get_activeStoryPointImpl();
            var commandParameters = {};
            var returnHandler = new tab._CommandReturnHandler(commandName, 0, ss.Delegate.create(this, function(result) {
                var activeStoryPointPm = result;
                this._updateActiveState$1(previouslyActiveStoryPointImpl, activeStoryPointPm);
                deferred.resolve(this._activeStoryPointImpl$1.get_storyPoint());
            }), function(remoteError, errorMessage) {
                deferred.reject(tab._TableauException.createServerError(errorMessage));
            });
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _updateStoryPointInfo$1: function tab__StoryImpl$_updateStoryPointInfo$1(index, newStoryPointPm) {
            var existingImpl = this._storyPointsInfo$1[index]._impl;
            if (existingImpl.storyPointId !== newStoryPointPm.storyPointId) {
                throw tab._TableauException.createInternalError("We should not be updating a story point where the IDs don't match. Existing storyPointID=" + existingImpl.storyPointId + ', newStoryPointID=' + newStoryPointPm.storyPointId);
            }
            existingImpl.caption = newStoryPointPm.caption;
            existingImpl.isUpdated = newStoryPointPm.isUpdated;
            if (newStoryPointPm.storyPointId === this._activeStoryPointImpl$1.get_storyPointId()) {
                this._activeStoryPointImpl$1.set_isUpdated(newStoryPointPm.isUpdated);
            }
        },

        _updateActiveState$1: function tab__StoryImpl$_updateActiveState$1(previouslyActiveStoryPointImpl, newActiveStoryPointPm) {
            var newActiveIndex = newActiveStoryPointPm.index;
            if (previouslyActiveStoryPointImpl.get_index() === newActiveIndex) {
                return;
            }
            var oldStoryPointInfo = this._storyPointsInfo$1[previouslyActiveStoryPointImpl.get_index()];
            var newStoryPointInfoImpl = this._storyPointsInfo$1[newActiveIndex]._impl;
            var containedSheetImpl = tab._StoryPointImpl.createContainedSheet(newActiveStoryPointPm.containedSheetInfo, this.get_workbookImpl(), this.get_messagingOptions(), this._findSheetFunc$1);
            newStoryPointInfoImpl.isActive = true;
            this._activeStoryPointImpl$1 = new tab._StoryPointImpl(newStoryPointInfoImpl, containedSheetImpl);
            previouslyActiveStoryPointImpl.set_isActive(false);
            oldStoryPointInfo._impl.isActive = false;
            this._raiseActiveStoryPointChange$1(oldStoryPointInfo, this._activeStoryPointImpl$1.get_storyPoint());
        },

        _raiseActiveStoryPointChange$1: function tab__StoryImpl$_raiseActiveStoryPointChange$1(oldStoryPointInfo, newStoryPoint) {
            if (this.__activeStoryPointChange$1 != null) {
                this.__activeStoryPointChange$1(oldStoryPointInfo, newStoryPoint);
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._StoryPointImpl

    tab._StoryPointImpl = function tab__StoryPointImpl(storyPointInfoImpl, containedSheetImpl) {
        this._isActive = storyPointInfoImpl.isActive;
        this._isUpdated = storyPointInfoImpl.isUpdated;
        this._caption = storyPointInfoImpl.caption;
        this._index = storyPointInfoImpl.index;
        this._parentStoryImpl = storyPointInfoImpl.parentStoryImpl;
        this._storyPointId = storyPointInfoImpl.storyPointId;
        this._containedSheetImpl = containedSheetImpl;
        if (ss.isValue(containedSheetImpl)) {
            this._containedSheetImpl.set_parentStoryPointImpl(this);
            if (containedSheetImpl.get_sheetType() === 'dashboard') {
                var containedDashboardImpl = this._containedSheetImpl;
                for (var i = 0; i < containedDashboardImpl.get_worksheets().get__length(); i++) {
                    var worksheet = containedDashboardImpl.get_worksheets().get_item(i);
                    worksheet._impl.set_parentStoryPointImpl(this);
                }
            }
        }
    }
    tab._StoryPointImpl.createContainedSheet = function tab__StoryPointImpl$createContainedSheet(containedSheetInfo, workbookImpl, messagingOptions, findSheetFunc) {
        var containedSheetType = containedSheetInfo.sheetType;
        var index = -1;
        var size = tab.SheetSizeFactory.createAutomatic();
        var isActive = false;
        var publishedSheetInfo = findSheetFunc(containedSheetInfo.name);
        var isHidden = ss.isNullOrUndefined(publishedSheetInfo);
        var url = (isHidden) ? '' : publishedSheetInfo.getUrl();
        var sheetInfoImpl = tab.$create__SheetInfoImpl(containedSheetInfo.name, containedSheetType, index, size, workbookImpl.get_workbook(), url, isActive, isHidden, containedSheetInfo.zoneId);
        if (containedSheetInfo.sheetType === 'worksheet') {
            var parentDashboardImpl = null;
            var worksheetImpl = new tab._WorksheetImpl(sheetInfoImpl, workbookImpl, messagingOptions, parentDashboardImpl);
            return worksheetImpl;
        } else if (containedSheetInfo.sheetType === 'dashboard') {
            var dashboardImpl = new tab._DashboardImpl(sheetInfoImpl, workbookImpl, messagingOptions);
            var dashboardZones = tab._WorkbookImpl._createDashboardZones(containedSheetInfo.dashboardZones);
            dashboardImpl._addObjects(dashboardZones, findSheetFunc);
            return dashboardImpl;
        } else if (containedSheetInfo.sheetType === 'story') {
            throw tab._TableauException.createInternalError('Cannot have a story embedded within another story.');
        } else {
            throw tab._TableauException.createInternalError("Unknown sheet type '" + containedSheetInfo.sheetType + "'");
        }
    }
    tab._StoryPointImpl.prototype = {
        _caption: null,
        _index: 0,
        _isActive: false,
        _isUpdated: false,
        _containedSheetImpl: null,
        _parentStoryImpl: null,
        _storyPoint: null,
        _storyPointId: 0,

        get_caption: function tab__StoryPointImpl$get_caption() {
            return this._caption;
        },

        get_containedSheetImpl: function tab__StoryPointImpl$get_containedSheetImpl() {
            return this._containedSheetImpl;
        },

        get_index: function tab__StoryPointImpl$get_index() {
            return this._index;
        },

        get_isActive: function tab__StoryPointImpl$get_isActive() {
            return this._isActive;
        },
        set_isActive: function tab__StoryPointImpl$set_isActive(value) {
            this._isActive = value;
            return value;
        },

        get_isUpdated: function tab__StoryPointImpl$get_isUpdated() {
            return this._isUpdated;
        },
        set_isUpdated: function tab__StoryPointImpl$set_isUpdated(value) {
            this._isUpdated = value;
            return value;
        },

        get_parentStoryImpl: function tab__StoryPointImpl$get_parentStoryImpl() {
            return this._parentStoryImpl;
        },

        get_storyPoint: function tab__StoryPointImpl$get_storyPoint() {
            if (this._storyPoint == null) {
                this._storyPoint = new tableauSoftware.StoryPoint(this);
            }
            return this._storyPoint;
        },

        get_storyPointId: function tab__StoryPointImpl$get_storyPointId() {
            return this._storyPointId;
        },

        _toInfoImpl: function tab__StoryPointImpl$_toInfoImpl() {
            return tab.$create__StoryPointInfoImpl(this._caption, this._index, this._storyPointId, this._isActive, this._isUpdated, this._parentStoryImpl);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.StoryPointInfoImplUtil

    tab.StoryPointInfoImplUtil = function tab_StoryPointInfoImplUtil() {}
    tab.StoryPointInfoImplUtil.clone = function tab_StoryPointInfoImplUtil$clone(impl) {
        return tab.$create__StoryPointInfoImpl(impl.caption, impl.index, impl.storyPointId, impl.isActive, impl.isUpdated, impl.parentStoryImpl);
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._TableauException

    tab._TableauException = function tab__TableauException() {}
    tab._TableauException.create = function tab__TableauException$create(id, message) {
        var x = new Error(message);
        x.tableauSoftwareErrorCode = id;
        return x;
    }
    tab._TableauException.createInternalError = function tab__TableauException$createInternalError(details) {
        if (ss.isValue(details)) {
            return tab._TableauException.create('internalError', 'Internal error. Please contact Tableau support with the following information: ' + details);
        } else {
            return tab._TableauException.create('internalError', 'Internal error. Please contact Tableau support');
        }
    }
    tab._TableauException.createInternalNullArgumentException = function tab__TableauException$createInternalNullArgumentException(argumentName) {
        return tab._TableauException.createInternalError("Null/undefined argument '" + argumentName + "'.");
    }
    tab._TableauException.createInternalStringArgumentException = function tab__TableauException$createInternalStringArgumentException(argumentName) {
        return tab._TableauException.createInternalError("Invalid string argument '" + argumentName + "'.");
    }
    tab._TableauException.createServerError = function tab__TableauException$createServerError(message) {
        return tab._TableauException.create('serverError', message);
    }
    tab._TableauException.createNotActiveSheet = function tab__TableauException$createNotActiveSheet() {
        return tab._TableauException.create('notActiveSheet', 'Operation not allowed on non-active sheet');
    }
    tab._TableauException.createInvalidCustomViewName = function tab__TableauException$createInvalidCustomViewName(customViewName) {
        return tab._TableauException.create('invalidCustomViewName', 'Invalid custom view name: ' + customViewName);
    }
    tab._TableauException.createInvalidParameter = function tab__TableauException$createInvalidParameter(paramName) {
        return tab._TableauException.create('invalidParameter', 'Invalid parameter: ' + paramName);
    }
    tab._TableauException.createInvalidFilterFieldNameOrValue = function tab__TableauException$createInvalidFilterFieldNameOrValue(fieldName) {
        return tab._TableauException.create('invalidFilterFieldNameOrValue', 'Invalid filter field name or value: ' + fieldName);
    }
    tab._TableauException.createInvalidDateParameter = function tab__TableauException$createInvalidDateParameter(paramName) {
        return tab._TableauException.create('invalidDateParameter', 'Invalid date parameter: ' + paramName);
    }
    tab._TableauException.createNullOrEmptyParameter = function tab__TableauException$createNullOrEmptyParameter(paramName) {
        return tab._TableauException.create('nullOrEmptyParameter', 'Parameter cannot be null or empty: ' + paramName);
    }
    tab._TableauException.createMissingMaxSize = function tab__TableauException$createMissingMaxSize() {
        return tab._TableauException.create('missingMaxSize', 'Missing maxSize for SheetSizeBehavior.ATMOST');
    }
    tab._TableauException.createMissingMinSize = function tab__TableauException$createMissingMinSize() {
        return tab._TableauException.create('missingMinSize', 'Missing minSize for SheetSizeBehavior.ATLEAST');
    }
    tab._TableauException.createMissingMinMaxSize = function tab__TableauException$createMissingMinMaxSize() {
        return tab._TableauException.create('missingMinMaxSize', 'Missing minSize or maxSize for SheetSizeBehavior.RANGE');
    }
    tab._TableauException.createInvalidRangeSize = function tab__TableauException$createInvalidRangeSize() {
        return tab._TableauException.create('invalidSize', 'Missing minSize or maxSize for SheetSizeBehavior.RANGE');
    }
    tab._TableauException.createInvalidSizeValue = function tab__TableauException$createInvalidSizeValue() {
        return tab._TableauException.create('invalidSize', 'Size value cannot be less than zero');
    }
    tab._TableauException.createInvalidSheetSizeParam = function tab__TableauException$createInvalidSheetSizeParam() {
        return tab._TableauException.create('invalidSize', 'Invalid sheet size parameter');
    }
    tab._TableauException.createSizeConflictForExactly = function tab__TableauException$createSizeConflictForExactly() {
        return tab._TableauException.create('invalidSize', 'Conflicting size values for SheetSizeBehavior.EXACTLY');
    }
    tab._TableauException.createInvalidSizeBehaviorOnWorksheet = function tab__TableauException$createInvalidSizeBehaviorOnWorksheet() {
        return tab._TableauException.create('invalidSizeBehaviorOnWorksheet', 'Only SheetSizeBehavior.AUTOMATIC is allowed on Worksheets');
    }
    tab._TableauException.createNoUrlForHiddenWorksheet = function tab__TableauException$createNoUrlForHiddenWorksheet() {
        return tab._TableauException.create('noUrlForHiddenWorksheet', 'Hidden worksheets do not have a URL.');
    }
    tab._TableauException._createInvalidAggregationFieldName = function tab__TableauException$_createInvalidAggregationFieldName(fieldName) {
        return tab._TableauException.create('invalidAggregationFieldName', "Invalid aggregation type for field '" + fieldName + "'");
    }
    tab._TableauException.createIndexOutOfRange = function tab__TableauException$createIndexOutOfRange(index) {
        return tab._TableauException.create('indexOutOfRange', "Index '" + index + "' is out of range.");
    }
    tab._TableauException.createUnsupportedEventName = function tab__TableauException$createUnsupportedEventName(eventName) {
        return tab._TableauException.create('unsupportedEventName', "Unsupported event '" + eventName + "'.");
    }
    tab._TableauException.createBrowserNotCapable = function tab__TableauException$createBrowserNotCapable() {
        return tab._TableauException.create('browserNotCapable', 'This browser is incapable of supporting the Tableau JavaScript API.');
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._Utility

    tab._Utility = function tab__Utility() {}
    tab._Utility.hasOwnProperty = function tab__Utility$hasOwnProperty(value, field) {
        return value.hasOwnProperty(field);
    }
    tab._Utility.isNullOrEmpty = function tab__Utility$isNullOrEmpty(value) {
        return ss.isNullOrUndefined(value) || (value['length'] || 0) <= 0;
    }
    tab._Utility.isString = function tab__Utility$isString(value) {
        return typeof(value) === 'string';
    }
    tab._Utility.isNumber = function tab__Utility$isNumber(value) {
        return typeof(value) === 'number';
    }
    tab._Utility.isDate = function tab__Utility$isDate(value) {
        if (typeof(value) === 'object' && (value instanceof Date)) {
            return true;
        } else if (Object.prototype.toString.call(value) !== '[object Date]') {
            return false;
        }
        return !isNaN((value).getTime());
    }
    tab._Utility.isDateValid = function tab__Utility$isDateValid(dt) {
        return !isNaN(dt.getTime());
    }
    tab._Utility.indexOf = function tab__Utility$indexOf(array, searchElement, fromIndex) {
        if (ss.isValue((Array).prototype['indexOf'])) {
            return array.indexOf(searchElement, fromIndex);
        }
        fromIndex = (fromIndex || 0);
        var length = array.length;
        if (length > 0) {
            for (var index = fromIndex; index < length; index++) {
                if (array[index] === searchElement) {
                    return index;
                }
            }
        }
        return -1;
    }
    tab._Utility.contains = function tab__Utility$contains(array, searchElement, fromIndex) {
        var index = tab._Utility.indexOf(array, searchElement, fromIndex);
        return index >= 0;
    }
    tab._Utility.getTopmostWindow = function tab__Utility$getTopmostWindow() {
        var win = window.self;
        while (ss.isValue(win.parent) && win.parent !== win) {
            win = win.parent;
        }
        return win;
    }
    tab._Utility.toInt = function tab__Utility$toInt(value) {
        if (tab._Utility.isNumber(value)) {
            return value;
        }
        return parseInt(value.toString(), 10);
    }
    tab._Utility.hasClass = function tab__Utility$hasClass(element, className) {
        var regexClass = new RegExp('[\\n\\t\\r]', 'g');
        return ss.isValue(element) && (' ' + element.className + ' ').replace(regexClass, ' ').indexOf(' ' + className + ' ') > -1;
    }
    tab._Utility.findParentWithClassName = function tab__Utility$findParentWithClassName(element, className, stopAtElement) {
        var parent = (ss.isValue(element)) ? element.parentNode : null;
        stopAtElement = (stopAtElement || document.body);
        while (parent != null) {
            if (tab._Utility.hasClass(parent, className)) {
                return parent;
            }
            if (parent === stopAtElement) {
                parent = null;
            } else {
                parent = parent.parentNode;
            }
        }
        return parent;
    }
    tab._Utility.hasJsonParse = function tab__Utility$hasJsonParse() {
        return ss.isValue(window.JSON) && ss.isValue(window.JSON.parse);
    }
    tab._Utility.hasWindowPostMessage = function tab__Utility$hasWindowPostMessage() {
        return ss.isValue(window.postMessage);
    }
    tab._Utility.isPostMessageSynchronous = function tab__Utility$isPostMessageSynchronous() {
        if (tab._Utility.isIE()) {
            var msieRegEx = new RegExp('(msie) ([\\w.]+)');
            var matches = msieRegEx.exec(window.navigator.userAgent.toLowerCase());
            var versionStr = (matches[2] || '0');
            var version = parseInt(versionStr, 10);
            return version <= 8;
        }
        return false;
    }
    tab._Utility.hasDocumentAttachEvent = function tab__Utility$hasDocumentAttachEvent() {
        return ss.isValue(document.attachEvent);
    }
    tab._Utility.hasWindowAddEventListener = function tab__Utility$hasWindowAddEventListener() {
        return ss.isValue(window.addEventListener);
    }
    tab._Utility.isElementOfTag = function tab__Utility$isElementOfTag(element, tagName) {
        return ss.isValue(element) && element.nodeType === 1 && element.tagName.toLowerCase() === tagName.toLowerCase();
    }
    tab._Utility.elementToString = function tab__Utility$elementToString(element) {
        var str = new ss.StringBuilder();
        str.append(element.tagName.toLowerCase());
        if (!tab._Utility.isNullOrEmpty(element.id)) {
            str.append('#').append(element.id);
        }
        if (!tab._Utility.isNullOrEmpty(element.className)) {
            var classes = element.className.split(' ');
            str.append('.').append(classes.join('.'));
        }
        return str.toString();
    }
    tab._Utility.tableauGCS = function tab__Utility$tableauGCS(e) {
        if (ss.isValue(window.getComputedStyle)) {
            return window.getComputedStyle(e);
        } else {
            return e.currentStyle;
        }
    }
    tab._Utility.isIE = function tab__Utility$isIE() {
        return window.navigator.userAgent.indexOf('MSIE') > -1 && ss.isNullOrUndefined(window.opera);
    }
    tab._Utility.isSafari = function tab__Utility$isSafari() {
        var ua = window.navigator.userAgent;
        var isChrome = ua.indexOf('Chrome') >= 0;
        return ua.indexOf('Safari') >= 0 && !isChrome;
    }
    tab._Utility.mobileDetect = function tab__Utility$mobileDetect() {
        var ua = window.navigator.userAgent;
        if (ua.indexOf('iPad') !== -1) {
            return true;
        }
        if (ua.indexOf('Android') !== -1) {
            return true;
        }
        if ((ua.indexOf('AppleWebKit') !== -1) && (ua.indexOf('Mobile') !== -1)) {
            return true;
        }
        return false;
    }
    tab._Utility.elementOffset = function tab__Utility$elementOffset(element) {
        var rect = null;
        rect = element.getBoundingClientRect();
        var elementTop = rect.top;
        var elementLeft = rect.left;
        var win = new tab.WindowHelper(window.self);
        var docElement = window.document.documentElement;
        var x = elementLeft + win.get_pageXOffset() - docElement.clientLeft;
        var y = elementTop + win.get_pageYOffset() - docElement.clientTop;
        return tab.$create_Point(x, y);
    }
    tab._Utility.convertRawValue = function tab__Utility$convertRawValue(rawValue, dataType) {
        if (ss.isNullOrUndefined(rawValue)) {
            return null;
        }
        switch (dataType) {
            case 'bool':
                return rawValue;
            case 'date':
                return new Date(rawValue);
            case 'number':
                if (rawValue == null) {
                    return Number.NaN;
                }
                return rawValue;
            case 'string':
            default:
                return rawValue;
        }
    }
    tab._Utility.getDataValue = function tab__Utility$getDataValue(dv) {
        if (ss.isNullOrUndefined(dv)) {
            return tab.$create_DataValue(null, null, null);
        }
        return tab.$create_DataValue(tab._Utility.convertRawValue(dv.value, dv.type), dv.formattedValue, dv.aliasedValue);
    }
    tab._Utility.serializeDateForServer = function tab__Utility$serializeDateForServer(date) {
        var serializedDate = '';
        if (ss.isValue(date) && tab._Utility.isDate(date)) {
            var year = date.getUTCFullYear();
            var month = date.getUTCMonth() + 1;
            var day = date.getUTCDate();
            var hh = date.getUTCHours();
            var mm = date.getUTCMinutes();
            var sec = date.getUTCSeconds();
            serializedDate = year + '-' + month + '-' + day + ' ' + hh + ':' + mm + ':' + sec;
        }
        return serializedDate;
    }
    tab._Utility.computeContentSize = function tab__Utility$computeContentSize(element) {
        var style = tab._Utility._getComputedStyle(element);
        var paddingLeft = parseFloat(style.paddingLeft);
        var paddingTop = parseFloat(style.paddingTop);
        var paddingRight = parseFloat(style.paddingRight);
        var paddingBottom = parseFloat(style.paddingBottom);
        var width = element.clientWidth - Math.round(paddingLeft + paddingRight);
        var height = element.clientHeight - Math.round(paddingTop + paddingBottom);
        return tab.$create_Size(width, height);
    }
    tab._Utility._getComputedStyle = function tab__Utility$_getComputedStyle(element) {
        if (ss.isValue(window.getComputedStyle)) {
            if (ss.isValue(element.ownerDocument.defaultView.opener)) {
                return element.ownerDocument.defaultView.getComputedStyle(element, null);
            }
            return window.getComputedStyle(element, null);
        } else if (ss.isValue(element.currentStyle)) {
            return element.currentStyle;
        }
        return element.style;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.VizImpl

    tab.VizImpl = function tab_VizImpl(messageRouter, viz, parentElement, url, options) {
        if (!tab._Utility.hasWindowPostMessage() || !tab._Utility.hasJsonParse()) {
            throw tab._TableauException.createBrowserNotCapable();
        }
        this._messagingOptions = new tab.CrossDomainMessagingOptions(messageRouter, this);
        this._viz = viz;
        if (ss.isNullOrUndefined(parentElement) || parentElement.nodeType !== 1) {
            parentElement = document.body;
        }
        this._parameters = new tab._VizParameters(parentElement, url, options);
        if (ss.isValue(options)) {
            this._onFirstInteractiveCallback = options.onFirstInteractive;
            this._onFirstVizSizeKnownCallback = options.onFirstVizSizeKnown;
        }
    }
    tab.VizImpl.prototype = {
        _workbookTabSwitchHandler: null,
        _viz: null,
        _iframe: null,
        _parameters: null,
        _initialAvailableSize: null,
        _instanceId: null,
        _workbookImpl: null,
        _onFirstInteractiveCallback: null,
        _onFirstVizSizeKnownCallback: null,
        _onFirstInteractiveAlreadyCalled: false,
        _areTabsHidden: false,
        _isToolbarHidden: false,
        _areAutomaticUpdatesPaused: false,
        _messagingOptions: null,
        _vizSize: null,
        _windowResizeHandler: null,
        _initializingWorkbookImpl: false,

        add_customViewsListLoad: function tab_VizImpl$add_customViewsListLoad(value) {
            this.__customViewsListLoad = ss.Delegate.combine(this.__customViewsListLoad, value);
        },
        remove_customViewsListLoad: function tab_VizImpl$remove_customViewsListLoad(value) {
            this.__customViewsListLoad = ss.Delegate.remove(this.__customViewsListLoad, value);
        },

        __customViewsListLoad: null,

        add_stateReadyForQuery: function tab_VizImpl$add_stateReadyForQuery(value) {
            this.__stateReadyForQuery = ss.Delegate.combine(this.__stateReadyForQuery, value);
        },
        remove_stateReadyForQuery: function tab_VizImpl$remove_stateReadyForQuery(value) {
            this.__stateReadyForQuery = ss.Delegate.remove(this.__stateReadyForQuery, value);
        },

        __stateReadyForQuery: null,

        add__marksSelection: function tab_VizImpl$add__marksSelection(value) {
            this.__marksSelection = ss.Delegate.combine(this.__marksSelection, value);
        },
        remove__marksSelection: function tab_VizImpl$remove__marksSelection(value) {
            this.__marksSelection = ss.Delegate.remove(this.__marksSelection, value);
        },

        __marksSelection: null,

        add__filterChange: function tab_VizImpl$add__filterChange(value) {
            this.__filterChange = ss.Delegate.combine(this.__filterChange, value);
        },
        remove__filterChange: function tab_VizImpl$remove__filterChange(value) {
            this.__filterChange = ss.Delegate.remove(this.__filterChange, value);
        },

        __filterChange: null,

        add__parameterValueChange: function tab_VizImpl$add__parameterValueChange(value) {
            this.__parameterValueChange = ss.Delegate.combine(this.__parameterValueChange, value);
        },
        remove__parameterValueChange: function tab_VizImpl$remove__parameterValueChange(value) {
            this.__parameterValueChange = ss.Delegate.remove(this.__parameterValueChange, value);
        },

        __parameterValueChange: null,

        add__customViewLoad: function tab_VizImpl$add__customViewLoad(value) {
            this.__customViewLoad = ss.Delegate.combine(this.__customViewLoad, value);
        },
        remove__customViewLoad: function tab_VizImpl$remove__customViewLoad(value) {
            this.__customViewLoad = ss.Delegate.remove(this.__customViewLoad, value);
        },

        __customViewLoad: null,

        add__customViewSave: function tab_VizImpl$add__customViewSave(value) {
            this.__customViewSave = ss.Delegate.combine(this.__customViewSave, value);
        },
        remove__customViewSave: function tab_VizImpl$remove__customViewSave(value) {
            this.__customViewSave = ss.Delegate.remove(this.__customViewSave, value);
        },

        __customViewSave: null,

        add__customViewRemove: function tab_VizImpl$add__customViewRemove(value) {
            this.__customViewRemove = ss.Delegate.combine(this.__customViewRemove, value);
        },
        remove__customViewRemove: function tab_VizImpl$remove__customViewRemove(value) {
            this.__customViewRemove = ss.Delegate.remove(this.__customViewRemove, value);
        },

        __customViewRemove: null,

        add__customViewSetDefault: function tab_VizImpl$add__customViewSetDefault(value) {
            this.__customViewSetDefault = ss.Delegate.combine(this.__customViewSetDefault, value);
        },
        remove__customViewSetDefault: function tab_VizImpl$remove__customViewSetDefault(value) {
            this.__customViewSetDefault = ss.Delegate.remove(this.__customViewSetDefault, value);
        },

        __customViewSetDefault: null,

        add__tabSwitch: function tab_VizImpl$add__tabSwitch(value) {
            this.__tabSwitch = ss.Delegate.combine(this.__tabSwitch, value);
        },
        remove__tabSwitch: function tab_VizImpl$remove__tabSwitch(value) {
            this.__tabSwitch = ss.Delegate.remove(this.__tabSwitch, value);
        },

        __tabSwitch: null,

        add__storyPointSwitch: function tab_VizImpl$add__storyPointSwitch(value) {
            this.__storyPointSwitch = ss.Delegate.combine(this.__storyPointSwitch, value);
        },
        remove__storyPointSwitch: function tab_VizImpl$remove__storyPointSwitch(value) {
            this.__storyPointSwitch = ss.Delegate.remove(this.__storyPointSwitch, value);
        },

        __storyPointSwitch: null,

        add__vizResize: function tab_VizImpl$add__vizResize(value) {
            this.__vizResize = ss.Delegate.combine(this.__vizResize, value);
        },
        remove__vizResize: function tab_VizImpl$remove__vizResize(value) {
            this.__vizResize = ss.Delegate.remove(this.__vizResize, value);
        },

        __vizResize: null,

        get_handlerId: function tab_VizImpl$get_handlerId() {
            return this._parameters.handlerId;
        },
        set_handlerId: function tab_VizImpl$set_handlerId(value) {
            this._parameters.handlerId = value;
            return value;
        },

        get_iframe: function tab_VizImpl$get_iframe() {
            return this._iframe;
        },

        get_instanceId: function tab_VizImpl$get_instanceId() {
            return this._instanceId;
        },

        get_serverRoot: function tab_VizImpl$get_serverRoot() {
            return this._parameters.serverRoot;
        },

        get__viz: function tab_VizImpl$get__viz() {
            return this._viz;
        },

        get__areTabsHidden: function tab_VizImpl$get__areTabsHidden() {
            return this._areTabsHidden;
        },

        get__isToolbarHidden: function tab_VizImpl$get__isToolbarHidden() {
            return this._isToolbarHidden;
        },

        get__isHidden: function tab_VizImpl$get__isHidden() {
            return this._iframe.style.display === 'none';
        },

        get__parentElement: function tab_VizImpl$get__parentElement() {
            return this._parameters.parentElement;
        },

        get__url: function tab_VizImpl$get__url() {
            return this._parameters.get_baseUrl();
        },

        get__workbook: function tab_VizImpl$get__workbook() {
            return this._workbookImpl.get_workbook();
        },

        get__workbookImpl: function tab_VizImpl$get__workbookImpl() {
            return this._workbookImpl;
        },

        get__areAutomaticUpdatesPaused: function tab_VizImpl$get__areAutomaticUpdatesPaused() {
            return this._areAutomaticUpdatesPaused;
        },

        get__vizSize: function tab_VizImpl$get__vizSize() {
            return this._vizSize;
        },

        getCurrentUrlAsync: function tab_VizImpl$getCurrentUrlAsync() {
            var deferred = new tab._Deferred();
            var returnHandler = new tab._CommandReturnHandler('api.GetCurrentUrlCommand', 0, function(result) {
                deferred.resolve(result);
            }, function(remoteError, message) {
                deferred.reject(tab._TableauException.createInternalError(message));
            });
            this._sendCommand(null, returnHandler);
            return deferred.get_promise();
        },

        handleVizLoad: function tab_VizImpl$handleVizLoad() {
            this._sendVizOffset();
            if (ss.isNullOrUndefined(this._workbookImpl)) {
                this._workbookImpl = new tab._WorkbookImpl(this, this._messagingOptions, ss.Delegate.create(this, function() {
                    this._onWorkbookInteractive();
                }));
            } else if (!this._initializingWorkbookImpl) {
                this._workbookImpl._update(ss.Delegate.create(this, function() {
                    this._onWorkbookInteractive();
                }));
            }
        },

        _calculateFrameSize: function tab_VizImpl$_calculateFrameSize(availableSize) {
            var chromeHeight = this._vizSize.chromeHeight;
            var sheetSize = this._vizSize.sheetSize;
            var width = 0;
            var height = 0;
            if (sheetSize.behavior === 'exactly') {
                width = sheetSize.maxSize.width;
                height = sheetSize.maxSize.height + chromeHeight;
            } else {
                var minWidth;
                var maxWidth;
                var minHeight;
                var maxHeight;
                switch (sheetSize.behavior) {
                    case 'range':
                        minWidth = sheetSize.minSize.width;
                        maxWidth = sheetSize.maxSize.width;
                        minHeight = sheetSize.minSize.height + chromeHeight;
                        maxHeight = sheetSize.maxSize.height + chromeHeight;
                        width = Math.max(minWidth, Math.min(maxWidth, availableSize.width));
                        height = Math.max(minHeight, Math.min(maxHeight, availableSize.height));
                        break;
                    case 'atleast':
                        minWidth = sheetSize.minSize.width;
                        minHeight = sheetSize.minSize.height + chromeHeight;
                        width = Math.max(minWidth, availableSize.width);
                        height = Math.max(minHeight, availableSize.height);
                        break;
                    case 'atmost':
                        maxWidth = sheetSize.maxSize.width;
                        maxHeight = sheetSize.maxSize.height + chromeHeight;
                        width = Math.min(maxWidth, availableSize.width);
                        height = Math.min(maxHeight, availableSize.height);
                        break;
                    case 'automatic':
                        width = availableSize.width;
                        height = Math.max(availableSize.height, chromeHeight);
                        break;
                    default:
                        throw tab._TableauException.createInternalError('Unknown SheetSizeBehavior for viz: ' + sheetSize.behavior);
                }
            }
            return tab.$create_Size(width, height);
        },

        _getNewFrameSize: function tab_VizImpl$_getNewFrameSize() {
            var availableSize;
            if (ss.isValue(this._initialAvailableSize)) {
                availableSize = this._initialAvailableSize;
                this._initialAvailableSize = null;
            } else {
                availableSize = tab._Utility.computeContentSize(this.get__parentElement());
            }
            this._raiseVizResizeEvent(availableSize);
            return this._calculateFrameSize(availableSize);
        },

        _refreshSize: function tab_VizImpl$_refreshSize() {
            var frameSize = this._getNewFrameSize();
            this._setFrameSize(frameSize.width + 'px', frameSize.height + 'px');
            var resizeAttempts = 10;
            for (var i = 0; i < resizeAttempts; i++) {
                var newFrameSize = this._getNewFrameSize();
                if (JSON.stringify(frameSize) === JSON.stringify(newFrameSize)) {
                    return;
                }
                frameSize = newFrameSize;
                this._setFrameSize(frameSize.width + 'px', frameSize.height + 'px');
            }
            throw tab._TableauException.create('maxVizResizeAttempts', 'Viz resize limit hit. The calculated iframe size did not stabilize after ' + resizeAttempts + ' resizes.');
        },

        handleEventNotification: function tab_VizImpl$handleEventNotification(eventName, eventParameters) {
            var notif = tab._ApiServerNotification.deserialize(eventParameters);
            if (eventName === 'api.FirstVizSizeKnownEvent') {
                var size = JSON.parse(notif.get_data());
                this._handleInitialVizSize(size);
            } else if (eventName === 'api.VizInteractiveEvent') {
                this._instanceId = notif.get_data();
                if (ss.isValue(this._workbookImpl) && this._workbookImpl.get_name() === notif.get_workbookName()) {
                    this._onWorkbookInteractive();
                }
                this._raiseStateReadyForQuery();
            } else if (eventName === 'api.MarksSelectionChangedEvent') {
                if (this.__marksSelection != null) {
                    if (this._workbookImpl.get_name() === notif.get_workbookName()) {
                        var worksheetImpl = null;
                        var activeSheetImpl = this._workbookImpl.get_activeSheetImpl();
                        if (activeSheetImpl.get_name() === notif.get_worksheetName()) {
                            worksheetImpl = activeSheetImpl;
                        } else if (activeSheetImpl.get_isDashboard()) {
                            var db = activeSheetImpl;
                            worksheetImpl = db.get_worksheets()._get(notif.get_worksheetName())._impl;
                        }
                        if (ss.isValue(worksheetImpl)) {
                            worksheetImpl.set_selectedMarks(null);
                            this.__marksSelection(new tab.MarksEvent('marksselection', this._viz, worksheetImpl));
                        }
                    }
                }
            } else if (eventName === 'api.FilterChangedEvent') {
                if (this.__filterChange != null) {
                    if (this._workbookImpl.get_name() === notif.get_workbookName()) {
                        var worksheetImpl = null;
                        var activeSheetImpl = this._workbookImpl.get_activeSheetImpl();
                        if (activeSheetImpl.get_name() === notif.get_worksheetName()) {
                            worksheetImpl = activeSheetImpl;
                        } else if (activeSheetImpl.get_isDashboard()) {
                            var db = activeSheetImpl;
                            worksheetImpl = db.get_worksheets()._get(notif.get_worksheetName())._impl;
                        }
                        if (ss.isValue(worksheetImpl)) {
                            var results = JSON.parse(notif.get_data());
                            var filterFieldName = results[0];
                            var filterCaption = results[1];
                            this.__filterChange(new tab.FilterEvent('filterchange', this._viz, worksheetImpl, filterFieldName, filterCaption));
                        }
                    }
                }
            } else if (eventName === 'api.ParameterChangedEvent') {
                if (this.__parameterValueChange != null) {
                    if (this._workbookImpl.get_name() === notif.get_workbookName()) {
                        this._workbookImpl.set__lastChangedParameterImpl(null);
                        var parameterName = notif.get_data();
                        this._raiseParameterValueChange(parameterName);
                    }
                }
            } else if (eventName === 'api.CustomViewsListLoadedEvent') {
                var info = JSON.parse(notif.get_data());
                var process = ss.Delegate.create(this, function() {
                    tab._CustomViewImpl._processCustomViews(this._workbookImpl, this._messagingOptions, info);
                });
                var raiseEvents = ss.Delegate.create(this, function() {
                    this._raiseCustomViewsListLoad();
                    if (this.__customViewLoad != null && !info.customViewLoaded) {
                        this._raiseCustomViewLoad(this._workbookImpl.get_activeCustomView());
                    }
                });
                if (ss.isNullOrUndefined(this._workbookImpl)) {
                    this._initializingWorkbookImpl = true;
                    this._workbookImpl = new tab._WorkbookImpl(this, this._messagingOptions, ss.Delegate.create(this, function() {
                        process();
                        this._onWorkbookInteractive(raiseEvents);
                        this._initializingWorkbookImpl = false;
                    }));
                } else {
                    process();
                    this._ensureCalledAfterFirstInteractive(raiseEvents);
                }
            } else if (eventName === 'api.CustomViewUpdatedEvent') {
                var info = JSON.parse(notif.get_data());
                if (ss.isNullOrUndefined(this._workbookImpl)) {
                    this._workbookImpl = new tab._WorkbookImpl(this, this._messagingOptions, ss.Delegate.create(this, function() {
                        this._onWorkbookInteractive();
                    }));
                }
                if (ss.isValue(this._workbookImpl)) {
                    tab._CustomViewImpl._processCustomViewUpdate(this._workbookImpl, this._messagingOptions, info, true);
                }
                if (this.__customViewSave != null) {
                    var updated = this._workbookImpl.get__updatedCustomViews()._toApiCollection();
                    for (var i = 0, len = updated.length; i < len; i++) {
                        this._raiseCustomViewSave(updated[i]);
                    }
                }
            } else if (eventName === 'api.CustomViewRemovedEvent') {
                if (this.__customViewRemove != null) {
                    var removed = this._workbookImpl.get__removedCustomViews()._toApiCollection();
                    for (var i = 0, len = removed.length; i < len; i++) {
                        this._raiseCustomViewRemove(removed[i]);
                    }
                }
            } else if (eventName === 'api.CustomViewSetDefaultEvent') {
                var info = JSON.parse(notif.get_data());
                if (ss.isValue(this._workbookImpl)) {
                    tab._CustomViewImpl._processCustomViews(this._workbookImpl, this._messagingOptions, info);
                }
                if (this.__customViewSetDefault != null) {
                    var updated = this._workbookImpl.get__updatedCustomViews()._toApiCollection();
                    for (var i = 0, len = updated.length; i < len; i++) {
                        this._raiseCustomViewSetDefault(updated[i]);
                    }
                }
            } else if (eventName === 'api.TabSwitchEvent') {
                this._workbookImpl._update(ss.Delegate.create(this, function() {
                    if (ss.isValue(this._workbookTabSwitchHandler)) {
                        this._workbookTabSwitchHandler();
                    }
                    if (this._workbookImpl.get_name() === notif.get_workbookName()) {
                        var oldSheetName = notif.get_worksheetName();
                        var currSheetName = notif.get_data();
                        this._raiseTabSwitch(oldSheetName, currSheetName);
                    }
                    this._onWorkbookInteractive();
                }));
            } else if (eventName === 'api.StorytellingStateChangedEvent') {
                var storyImpl = this._workbookImpl.get_activeSheetImpl();
                if (storyImpl.get_sheetType() === 'story') {
                    storyImpl.update(JSON.parse(notif.get_data()));
                }
            }
        },

        addEventListener: function tab_VizImpl$addEventListener(eventName, handler) {
            var normalizedEventName = tab._enums._normalizeTableauEventName(eventName);
            if (normalizedEventName === 'marksselection') {
                this.add__marksSelection(handler);
            } else if (normalizedEventName === 'parametervaluechange') {
                this.add__parameterValueChange(handler);
            } else if (normalizedEventName === 'filterchange') {
                this.add__filterChange(handler);
            } else if (normalizedEventName === 'customviewload') {
                this.add__customViewLoad(handler);
            } else if (normalizedEventName === 'customviewsave') {
                this.add__customViewSave(handler);
            } else if (normalizedEventName === 'customviewremove') {
                this.add__customViewRemove(handler);
            } else if (normalizedEventName === 'customviewsetdefault') {
                this.add__customViewSetDefault(handler);
            } else if (normalizedEventName === 'tabswitch') {
                this.add__tabSwitch(handler);
            } else if (normalizedEventName === 'storypointswitch') {
                this.add__storyPointSwitch(handler);
            } else if (normalizedEventName === 'vizresize') {
                this.add__vizResize(handler);
            } else {
                throw tab._TableauException.createUnsupportedEventName(eventName);
            }
        },

        removeEventListener: function tab_VizImpl$removeEventListener(eventName, handler) {
            var normalizedEventName = tab._enums._normalizeTableauEventName(eventName);
            if (normalizedEventName === 'marksselection') {
                this.remove__marksSelection(handler);
            } else if (normalizedEventName === 'parametervaluechange') {
                this.remove__parameterValueChange(handler);
            } else if (normalizedEventName === 'filterchange') {
                this.remove__filterChange(handler);
            } else if (normalizedEventName === 'customviewload') {
                this.remove__customViewLoad(handler);
            } else if (normalizedEventName === 'customviewsave') {
                this.remove__customViewSave(handler);
            } else if (normalizedEventName === 'customviewremove') {
                this.remove__customViewRemove(handler);
            } else if (normalizedEventName === 'customviewsetdefault') {
                this.remove__customViewSetDefault(handler);
            } else if (normalizedEventName === 'tabswitch') {
                this.remove__tabSwitch(handler);
            } else if (normalizedEventName === 'storypointswitch') {
                this.remove__storyPointSwitch(handler);
            } else if (normalizedEventName === 'vizresize') {
                this.remove__vizResize(handler);
            } else {
                throw tab._TableauException.createUnsupportedEventName(eventName);
            }
        },

        _dispose: function tab_VizImpl$_dispose() {
            if (ss.isValue(this._iframe)) {
                this._iframe.parentNode.removeChild(this._iframe);
                this._iframe = null;
            }
            tab._VizManagerImpl._unregisterViz(this._viz);
            this._messagingOptions.get_router().unregisterHandler(this);
            this._removeWindowResizeHandler();
        },

        _show: function tab_VizImpl$_show() {
            this._iframe.style.display = 'block';
            this._iframe.style.visibility = 'visible';
        },

        _hide: function tab_VizImpl$_hide() {
            this._iframe.style.display = 'none';
        },

        _makeInvisible: function tab_VizImpl$_makeInvisible() {
            this._iframe.style.visibility = 'hidden';
        },

        _showExportImageDialog: function tab_VizImpl$_showExportImageDialog() {
            this._invokeCommand('showExportImageDialog');
        },

        _showExportDataDialog: function tab_VizImpl$_showExportDataDialog(sheetOrInfoOrName) {
            var sheetName = this._verifyOperationAllowedOnActiveSheetOrSheetWithinActiveDashboard(sheetOrInfoOrName);
            this._invokeCommand('showExportDataDialog', sheetName);
        },

        _showExportCrossTabDialog: function tab_VizImpl$_showExportCrossTabDialog(sheetOrInfoOrName) {
            var sheetName = this._verifyOperationAllowedOnActiveSheetOrSheetWithinActiveDashboard(sheetOrInfoOrName);
            this._invokeCommand('showExportCrosstabDialog', sheetName);
        },

        _showExportPDFDialog: function tab_VizImpl$_showExportPDFDialog() {
            this._invokeCommand('showExportPDFDialog');
        },

        _revertAllAsync: function tab_VizImpl$_revertAllAsync() {
            var deferred = new tab._Deferred();
            var returnHandler = new tab._CommandReturnHandler('api.RevertAllCommand', 1, function(result) {
                deferred.resolve();
            }, function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this._sendCommand(null, returnHandler);
            return deferred.get_promise();
        },

        _refreshDataAsync: function tab_VizImpl$_refreshDataAsync() {
            var deferred = new tab._Deferred();
            var returnHandler = new tab._CommandReturnHandler('api.RefreshDataCommand', 1, function(result) {
                deferred.resolve();
            }, function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this._sendCommand(null, returnHandler);
            return deferred.get_promise();
        },

        _showShareDialog: function tab_VizImpl$_showShareDialog() {
            this._invokeCommand('showShareDialog');
        },

        _showDownloadWorkbookDialog: function tab_VizImpl$_showDownloadWorkbookDialog() {
            if (this.get__workbookImpl().get_isDownloadAllowed()) {
                this._invokeCommand('showDownloadWorkbookDialog');
            } else {
                throw tab._TableauException.create('downloadWorkbookNotAllowed', 'Download workbook is not allowed');
            }
        },

        _pauseAutomaticUpdatesAsync: function tab_VizImpl$_pauseAutomaticUpdatesAsync() {
            return this._invokeAutomaticUpdatesCommandAsync('pauseAutomaticUpdates');
        },

        _resumeAutomaticUpdatesAsync: function tab_VizImpl$_resumeAutomaticUpdatesAsync() {
            return this._invokeAutomaticUpdatesCommandAsync('resumeAutomaticUpdates');
        },

        _toggleAutomaticUpdatesAsync: function tab_VizImpl$_toggleAutomaticUpdatesAsync() {
            return this._invokeAutomaticUpdatesCommandAsync('toggleAutomaticUpdates');
        },

        _setFrameSize: function tab_VizImpl$_setFrameSize(width, height) {
            this._parameters.width = width;
            this._parameters.height = height;
            this._iframe.style.width = this._parameters.width;
            this._iframe.style.height = this._parameters.height;
        },

        _setFrameSizeAndUpdate: function tab_VizImpl$_setFrameSizeAndUpdate(width, height) {
            this._raiseVizResizeEvent(tab.$create_Size(-1, -1));
            this._setFrameSize(width, height);
            this._workbookImpl._updateActiveSheetAsync();
        },

        _setAreAutomaticUpdatesPaused: function tab_VizImpl$_setAreAutomaticUpdatesPaused(value) {
            this._areAutomaticUpdatesPaused = value;
        },

        _contentRootElement: function tab_VizImpl$_contentRootElement() {
            return this._parameters.parentElement;
        },

        _create: function tab_VizImpl$_create() {
            try {
                tab._VizManagerImpl._registerViz(this._viz);
            } catch (e) {
                this._dispose();
                throw e;
            }
            if (!this._parameters.fixedSize) {
                this._initialAvailableSize = tab._Utility.computeContentSize(this.get__parentElement());
                if (!this._initialAvailableSize.width || !this._initialAvailableSize.height) {
                    this._initialAvailableSize = tab.$create_Size(800, 600);
                }
                this._iframe = this._createIframe();
                this._makeInvisible();
            } else {
                this._iframe = this._createIframe();
                this._show();
            }
            if (!tab._Utility.hasWindowPostMessage()) {
                if (tab._Utility.isIE()) {
                    this._iframe.onreadystatechange = this._getOnCheckForDoneDelegate();
                } else {
                    this._iframe.onload = this._getOnCheckForDoneDelegate();
                }
            }
            this._isToolbarHidden = !this._parameters.toolbar;
            this._areTabsHidden = !this._parameters.tabs;
            this._messagingOptions.get_router().registerHandler(this);
            this._iframe.src = this._parameters.get_url();
        },

        _sendVizOffset: function tab_VizImpl$_sendVizOffset() {
            if (!tab._Utility.hasWindowPostMessage() || ss.isNullOrUndefined(this._iframe) || !ss.isValue(this._iframe.contentWindow)) {
                return;
            }
            var offset = tab._Utility.elementOffset(this._iframe);
            var param = [];
            param.push('vizOffsetResp');
            param.push(offset.x);
            param.push(offset.y);
            this._iframe.contentWindow.postMessage(param.join(','), '*');
        },

        _sendCommand: function tab_VizImpl$_sendCommand(commandParameters, returnHandler) {
            this._messagingOptions.sendCommand(commandParameters, returnHandler);
        },

        _raiseParameterValueChange: function tab_VizImpl$_raiseParameterValueChange(parameterName) {
            if (this.__parameterValueChange != null) {
                this.__parameterValueChange(new tab.ParameterEvent('parametervaluechange', this._viz, parameterName));
            }
        },

        _raiseCustomViewLoad: function tab_VizImpl$_raiseCustomViewLoad(customView) {
            if (this.__customViewLoad != null) {
                this.__customViewLoad(new tab.CustomViewEvent('customviewload', this._viz, (ss.isValue(customView)) ? customView._impl : null));
            }
        },

        _raiseCustomViewSave: function tab_VizImpl$_raiseCustomViewSave(customView) {
            if (this.__customViewSave != null) {
                this.__customViewSave(new tab.CustomViewEvent('customviewsave', this._viz, customView._impl));
            }
        },

        _raiseCustomViewRemove: function tab_VizImpl$_raiseCustomViewRemove(customView) {
            if (this.__customViewRemove != null) {
                this.__customViewRemove(new tab.CustomViewEvent('customviewremove', this._viz, customView._impl));
            }
        },

        _raiseCustomViewSetDefault: function tab_VizImpl$_raiseCustomViewSetDefault(customView) {
            if (this.__customViewSetDefault != null) {
                this.__customViewSetDefault(new tab.CustomViewEvent('customviewsetdefault', this._viz, customView._impl));
            }
        },

        _raiseTabSwitch: function tab_VizImpl$_raiseTabSwitch(oldSheetName, newSheetName) {
            if (this.__tabSwitch != null) {
                this.__tabSwitch(new tab.TabSwitchEvent('tabswitch', this._viz, oldSheetName, newSheetName));
            }
        },

        raiseStoryPointSwitch: function tab_VizImpl$raiseStoryPointSwitch(oldStoryPointInfo, newStoryPoint) {
            if (this.__storyPointSwitch != null) {
                this.__storyPointSwitch(new tab.StoryPointSwitchEvent('storypointswitch', this._viz, oldStoryPointInfo, newStoryPoint));
            }
        },

        _raiseStateReadyForQuery: function tab_VizImpl$_raiseStateReadyForQuery() {
            if (this.__stateReadyForQuery != null) {
                this.__stateReadyForQuery(this);
            }
        },

        _raiseCustomViewsListLoad: function tab_VizImpl$_raiseCustomViewsListLoad() {
            if (this.__customViewsListLoad != null) {
                this.__customViewsListLoad(this);
            }
        },

        _raiseVizResizeEvent: function tab_VizImpl$_raiseVizResizeEvent(availableSize) {
            if (this.__vizResize != null) {
                this.__vizResize(new tab.VizResizeEvent('vizresize', this._viz, availableSize));
            }
        },

        _verifyOperationAllowedOnActiveSheetOrSheetWithinActiveDashboard: function tab_VizImpl$_verifyOperationAllowedOnActiveSheetOrSheetWithinActiveDashboard(sheetOrInfoOrName) {
            if (ss.isNullOrUndefined(sheetOrInfoOrName)) {
                return null;
            }
            var sheetImpl = this._workbookImpl._findActiveSheetOrSheetWithinActiveDashboard(sheetOrInfoOrName);
            if (ss.isNullOrUndefined(sheetImpl)) {
                throw tab._TableauException.createNotActiveSheet();
            }
            return sheetImpl.get_name();
        },

        _invokeAutomaticUpdatesCommandAsync: function tab_VizImpl$_invokeAutomaticUpdatesCommandAsync(command) {
            if (command !== 'pauseAutomaticUpdates' && command !== 'resumeAutomaticUpdates' && command !== 'toggleAutomaticUpdates') {
                throw tab._TableauException.createInternalError(null);
            }
            var param = {};
            param['api.invokeCommandName'] = command;
            var deferred = new tab._Deferred();
            var returnHandler = new tab._CommandReturnHandler('api.InvokeCommandCommand', 0, ss.Delegate.create(this, function(result) {
                var pm = result;
                if (ss.isValue(pm) && ss.isValue(pm.isAutoUpdate)) {
                    this._areAutomaticUpdatesPaused = !pm.isAutoUpdate;
                }
                deferred.resolve(this._areAutomaticUpdatesPaused);
            }), function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this._sendCommand(param, returnHandler);
            return deferred.get_promise();
        },

        _invokeCommand: function tab_VizImpl$_invokeCommand(command, sheetName) {
            if (command !== 'showExportImageDialog' && command !== 'showExportDataDialog' && command !== 'showExportCrosstabDialog' && command !== 'showExportPDFDialog' && command !== 'showShareDialog' && command !== 'showDownloadWorkbookDialog') {
                throw tab._TableauException.createInternalError(null);
            }
            var param = {};
            param['api.invokeCommandName'] = command;
            if (ss.isValue(sheetName)) {
                param['api.invokeCommandParam'] = sheetName;
            }
            var returnHandler = new tab._CommandReturnHandler('api.InvokeCommandCommand', 0, null, null);
            this._sendCommand(param, returnHandler);
        },

        _onWorkbookInteractive: function tab_VizImpl$_onWorkbookInteractive(actionAfterFirstInteractive) {
            if (!this._onFirstInteractiveAlreadyCalled) {
                var callback = this._onFirstInteractiveCallback;
                window.setTimeout(ss.Delegate.create(this, function() {
                    if (ss.isValue(callback)) {
                        callback(new tab.TableauEvent('firstinteractive', this._viz));
                    }
                    if (ss.isValue(actionAfterFirstInteractive)) {
                        actionAfterFirstInteractive();
                    }
                }), 0);
                this._onFirstInteractiveAlreadyCalled = true;
            }
            this._raiseStateReadyForQuery();
        },

        _ensureCalledAfterFirstInteractive: function tab_VizImpl$_ensureCalledAfterFirstInteractive(action) {
            var start = new Date();
            var poll = null;
            poll = ss.Delegate.create(this, function() {
                var now = new Date();
                if (this._onFirstInteractiveAlreadyCalled) {
                    action();
                } else if (now - start > 5 * 60 * 1000) {
                    throw tab._TableauException.createInternalError('Timed out while waiting for the viz to become interactive');
                } else {
                    window.setTimeout(poll, 10);
                }
            });
            poll();
        },

        _checkForDone: function tab_VizImpl$_checkForDone() {
            if (tab._Utility.isIE()) {
                if (this._iframe.readyState === 'complete') {
                    this.handleVizLoad();
                }
            } else {
                this.handleVizLoad();
            }
        },

        _onCheckForDone: function tab_VizImpl$_onCheckForDone() {
            window.setTimeout(ss.Delegate.create(this, this._checkForDone), 3000);
        },

        _createIframe: function tab_VizImpl$_createIframe() {
            if (ss.isNullOrUndefined(this._contentRootElement())) {
                return null;
            }
            var ifr = document.createElement('IFrame');
            ifr.frameBorder = '0';
            ifr.setAttribute('allowTransparency', 'true');
            ifr.marginHeight = '0';
            ifr.marginWidth = '0';
            ifr.style.display = 'block';
            if (this._parameters.fixedSize) {
                ifr.style.width = this._parameters.width;
                ifr.style.height = this._parameters.height;
            } else {
                ifr.style.width = '1px';
                ifr.style.height = '1px';
                ifr.setAttribute('scrolling', 'no');
            }
            if (tab._Utility.isSafari()) {
                ifr.addEventListener('mousewheel', ss.Delegate.create(this, this._onIframeMouseWheel), false);
            }
            this._contentRootElement().appendChild(ifr);
            return ifr;
        },

        _onIframeMouseWheel: function tab_VizImpl$_onIframeMouseWheel(e) {},

        _getOnCheckForDoneDelegate: function tab_VizImpl$_getOnCheckForDoneDelegate() {
            return ss.Delegate.create(this, function(e) {
                this._onCheckForDone();
            });
        },

        _handleInitialVizSize: function tab_VizImpl$_handleInitialVizSize(vizAndChromeSize) {
            var sheetSize = tab.SheetSizeFactory.fromSizeConstraints(vizAndChromeSize.sizeConstraints);
            this._vizSize = tab.$create_VizSize(sheetSize, vizAndChromeSize.chromeHeight);
            if (ss.isValue(this._onFirstVizSizeKnownCallback)) {
                this._onFirstVizSizeKnownCallback(new tab.FirstVizSizeKnownEvent('firstvizsizeknown', this._viz, this._vizSize));
            }
            if (this._parameters.fixedSize) {
                return;
            }
            this._refreshSize();
            this._addWindowResizeHandler();
            this._show();
        },

        _removeWindowResizeHandler: function tab_VizImpl$_removeWindowResizeHandler() {
            if (ss.isNullOrUndefined(this._windowResizeHandler)) {
                return;
            }
            if (tab._Utility.hasWindowAddEventListener()) {
                window.removeEventListener('resize', this._windowResizeHandler, false);
            } else {
                window.self.detachEvent('onresize', this._windowResizeHandler);
            }
            this._windowResizeHandler = null;
        },

        _addWindowResizeHandler: function tab_VizImpl$_addWindowResizeHandler() {
            if (ss.isValue(this._windowResizeHandler)) {
                return;
            }
            this._windowResizeHandler = ss.Delegate.create(this, function() {
                this._refreshSize();
            });
            if (tab._Utility.hasWindowAddEventListener()) {
                window.addEventListener('resize', this._windowResizeHandler, false);
            } else {
                window.self.attachEvent('onresize', this._windowResizeHandler);
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._VizManagerImpl

    tab._VizManagerImpl = function tab__VizManagerImpl() {}
    tab._VizManagerImpl.get__clonedVizs = function tab__VizManagerImpl$get__clonedVizs() {
        return tab._VizManagerImpl._vizs.concat();
    }
    tab._VizManagerImpl._registerViz = function tab__VizManagerImpl$_registerViz(viz) {
        tab._VizManagerImpl._verifyVizNotAlreadyParented(viz);
        tab._VizManagerImpl._vizs.push(viz);
    }
    tab._VizManagerImpl._unregisterViz = function tab__VizManagerImpl$_unregisterViz(viz) {
        for (var i = 0, len = tab._VizManagerImpl._vizs.length; i < len; i++) {
            if (tab._VizManagerImpl._vizs[i] === viz) {
                tab._VizManagerImpl._vizs.splice(i, 1);
                break;
            }
        }
    }
    tab._VizManagerImpl._sendVizOffsets = function tab__VizManagerImpl$_sendVizOffsets() {
        for (var i = 0, len = tab._VizManagerImpl._vizs.length; i < len; i++) {
            tab._VizManagerImpl._vizs[i]._impl._sendVizOffset();
        }
    }
    tab._VizManagerImpl._verifyVizNotAlreadyParented = function tab__VizManagerImpl$_verifyVizNotAlreadyParented(viz) {
        var parent = viz.getParentElement();
        for (var i = 0, len = tab._VizManagerImpl._vizs.length; i < len; i++) {
            if (tab._VizManagerImpl._vizs[i].getParentElement() === parent) {
                var message = "Another viz is already present in element '" + tab._Utility.elementToString(parent) + "'.";
                throw tab._TableauException.create('vizAlreadyInManager', message);
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._VizParameters

    tab._VizParameters = function tab__VizParameters(element, url, options) {
        if (ss.isNullOrUndefined(element) || ss.isNullOrUndefined(url)) {
            throw tab._TableauException.create('noUrlOrParentElementNotFound', 'URL is empty or Parent element not found');
        }
        if (ss.isNullOrUndefined(options)) {
            options = {};
            options.hideTabs = false;
            options.hideToolbar = false;
            options.onFirstInteractive = null;
        }
        if (ss.isValue(options.height) || ss.isValue(options.width)) {
            this.fixedSize = true;
            if (tab._Utility.isNumber(options.height)) {
                options.height = options.height.toString() + 'px';
            }
            if (tab._Utility.isNumber(options.width)) {
                options.width = options.width.toString() + 'px';
            }
            this.height = (ss.isValue(options.height)) ? options.height.toString() : null;
            this.width = (ss.isValue(options.width)) ? options.width.toString() : null;
        } else {
            this.fixedSize = false;
        }
        this.tabs = !(options.hideTabs || false);
        this.toolbar = !(options.hideToolbar || false);
        this.parentElement = element;
        this._createOptions = options;
        this.toolBarPosition = options.toolbarPosition;
        var urlParts = url.split('?');
        this._urlFromApi = urlParts[0];
        if (urlParts.length === 2) {
            this.userSuppliedParameters = urlParts[1];
        } else {
            this.userSuppliedParameters = '';
        }
        var r = new RegExp('.*?[^/:]/', '').exec(this._urlFromApi);
        if (ss.isNullOrUndefined(r) || (r[0].toLowerCase().indexOf('http://') === -1 && r[0].toLowerCase().indexOf('https://') === -1)) {
            throw tab._TableauException.create('invalidUrl', 'Invalid url');
        }
        this.host_url = r[0].toLowerCase();
        this.name = this._urlFromApi.replace(r[0], '');
        this.name = this.name.replace('views/', '');
        this.serverRoot = decodeURIComponent(this.host_url);
    }
    tab._VizParameters.prototype = {
        name: '',
        host_url: null,
        tabs: false,
        toolbar: false,
        toolBarPosition: null,
        handlerId: null,
        width: null,
        height: null,
        serverRoot: null,
        parentElement: null,
        userSuppliedParameters: null,
        fixedSize: false,
        _urlFromApi: null,
        _createOptions: null,

        get_url: function tab__VizParameters$get_url() {
            return this._constructUrl();
        },

        get_baseUrl: function tab__VizParameters$get_baseUrl() {
            return this._urlFromApi;
        },

        _constructUrl: function tab__VizParameters$_constructUrl() {
            var url = [];
            url.push(this.get_baseUrl());
            url.push('?');
            if (this.userSuppliedParameters.length > 0) {
                url.push(this.userSuppliedParameters);
                url.push('&');
            }
            url.push(':embed=y');
            url.push('&:showVizHome=n');
            url.push('&:jsdebug=y');
            if (!this.fixedSize) {
                url.push('&:bootstrapWhenNotified=y');
            }
            if (!this.tabs) {
                url.push('&:tabs=n');
            }
            if (!this.toolbar) {
                url.push('&:toolbar=n');
            } else if (!ss.isNullOrUndefined(this.toolBarPosition)) {
                url.push('&:toolbar=');
                url.push(this.toolBarPosition);
            }
            var userOptions = this._createOptions;
            var $dict1 = userOptions;
            for (var $key2 in $dict1) {
                var entry = { key: $key2, value: $dict1[$key2] };
                if (entry.key !== 'embed' && entry.key !== 'height' && entry.key !== 'width' && entry.key !== 'autoSize' && entry.key !== 'hideTabs' && entry.key !== 'hideToolbar' && entry.key !== 'onFirstInteractive' && entry.key !== 'onFirstVizSizeKnown' && entry.key !== 'toolbarPosition' && entry.key !== 'instanceIdToClone') {
                    url.push('&');
                    url.push(encodeURIComponent(entry.key));
                    url.push('=');
                    url.push(encodeURIComponent(entry.value.toString()));
                }
            }
            url.push('&:apiID=' + this.handlerId);
            if (ss.isValue(this._createOptions.instanceIdToClone)) {
                url.push('#' + this._createOptions.instanceIdToClone);
            }
            return url.join('');
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._WorkbookImpl

    tab._WorkbookImpl = function tab__WorkbookImpl(vizImpl, messagingOptions, callback) {
        this._publishedSheetsInfo = new tab._Collection();
        this._customViews = new tab._Collection();
        this._updatedCustomViews = new tab._Collection();
        this._removedCustomViews = new tab._Collection();
        this._vizImpl = vizImpl;
        this._messagingOptions = messagingOptions;
        this._getClientInfo(callback);
    }
    tab._WorkbookImpl._createDashboardZones = function tab__WorkbookImpl$_createDashboardZones(zones) {
        zones = (zones || []);
        var zonesInfo = [];
        for (var i = 0; i < zones.length; i++) {
            var zone = zones[i];
            var objectType = zone.zoneType;
            var size = tab.$create_Size(zone.width, zone.height);
            var position = tab.$create_Point(zone.x, zone.y);
            var name = zone.name;
            var zoneInfo = tab.$create__dashboardZoneInfo(name, objectType, position, size, zone.zoneId);
            zonesInfo.push(zoneInfo);
        }
        return zonesInfo;
    }
    tab._WorkbookImpl._extractSheetName = function tab__WorkbookImpl$_extractSheetName(sheetOrInfoOrName) {
        if (ss.isNullOrUndefined(sheetOrInfoOrName)) {
            return null;
        }
        if (tab._Utility.isString(sheetOrInfoOrName)) {
            return sheetOrInfoOrName;
        }
        var info = sheetOrInfoOrName;
        var getName = ss.Delegate.create(info, info.getName);
        if (ss.isValue(getName)) {
            return getName();
        }
        return null;
    }
    tab._WorkbookImpl._createSheetSize = function tab__WorkbookImpl$_createSheetSize(sheetInfo) {
        if (ss.isNullOrUndefined(sheetInfo)) {
            return tab.SheetSizeFactory.createAutomatic();
        }
        return tab.SheetSizeFactory.fromSizeConstraints(sheetInfo.sizeConstraints);
    }
    tab._WorkbookImpl._processParameters = function tab__WorkbookImpl$_processParameters(paramList) {
        var parameters = new tab._Collection();
        var $enum1 = ss.IEnumerator.getEnumerator(paramList.parameters);
        while ($enum1.moveNext()) {
            var model = $enum1.current;
            var paramImpl = new tab._parameterImpl(model);
            parameters._add(paramImpl.get__name(), paramImpl.get__parameter());
        }
        return parameters;
    }
    tab._WorkbookImpl._findAndCreateParameterImpl = function tab__WorkbookImpl$_findAndCreateParameterImpl(parameterName, paramList) {
        var $enum1 = ss.IEnumerator.getEnumerator(paramList.parameters);
        while ($enum1.moveNext()) {
            var model = $enum1.current;
            if (model.name === parameterName) {
                return new tab._parameterImpl(model);
            }
        }
        return null;
    }
    tab._WorkbookImpl.prototype = {
        _workbook: null,
        _vizImpl: null,
        _name: null,
        _activeSheetImpl: null,
        _activatingHiddenSheetImpl: null,
        _isDownloadAllowed: false,
        _messagingOptions: null,

        get_workbook: function tab__WorkbookImpl$get_workbook() {
            if (ss.isNullOrUndefined(this._workbook)) {
                this._workbook = new tableauSoftware.Workbook(this);
            }
            return this._workbook;
        },

        get_viz: function tab__WorkbookImpl$get_viz() {
            return this._vizImpl.get__viz();
        },

        get_publishedSheets: function tab__WorkbookImpl$get_publishedSheets() {
            return this._publishedSheetsInfo;
        },

        get_name: function tab__WorkbookImpl$get_name() {
            return this._name;
        },

        get_activeSheetImpl: function tab__WorkbookImpl$get_activeSheetImpl() {
            return this._activeSheetImpl;
        },

        get_activeCustomView: function tab__WorkbookImpl$get_activeCustomView() {
            return this._currentCustomView;
        },

        get_isDownloadAllowed: function tab__WorkbookImpl$get_isDownloadAllowed() {
            return this._isDownloadAllowed;
        },

        _findActiveSheetOrSheetWithinActiveDashboard: function tab__WorkbookImpl$_findActiveSheetOrSheetWithinActiveDashboard(sheetOrInfoOrName) {
            if (ss.isNullOrUndefined(this._activeSheetImpl)) {
                return null;
            }
            var sheetName = tab._WorkbookImpl._extractSheetName(sheetOrInfoOrName);
            if (ss.isNullOrUndefined(sheetName)) {
                return null;
            }
            if (sheetName === this._activeSheetImpl.get_name()) {
                return this._activeSheetImpl;
            }
            if (this._activeSheetImpl.get_isDashboard()) {
                var dashboardImpl = this._activeSheetImpl;
                var sheet = dashboardImpl.get_worksheets()._get(sheetName);
                if (ss.isValue(sheet)) {
                    return sheet._impl;
                }
            }
            return null;
        },

        _setActiveSheetAsync: function tab__WorkbookImpl$_setActiveSheetAsync(sheetNameOrInfoOrIndex) {
            if (tab._Utility.isNumber(sheetNameOrInfoOrIndex)) {
                var index = sheetNameOrInfoOrIndex;
                if (index < this._publishedSheetsInfo.get__length() && index >= 0) {
                    return this._activateSheetWithInfoAsync(this._publishedSheetsInfo.get_item(index)._impl);
                } else {
                    throw tab._TableauException.createIndexOutOfRange(index);
                }
            }
            var sheetName = tab._WorkbookImpl._extractSheetName(sheetNameOrInfoOrIndex);
            var sheetInfo = this._publishedSheetsInfo._get(sheetName);
            if (ss.isValue(sheetInfo)) {
                return this._activateSheetWithInfoAsync(sheetInfo._impl);
            } else if (this._activeSheetImpl.get_isDashboard()) {
                var d = this._activeSheetImpl;
                var sheet = d.get_worksheets()._get(sheetName);
                if (ss.isValue(sheet)) {
                    this._activatingHiddenSheetImpl = null;
                    var sheetUrl = '';
                    if (sheet.getIsHidden()) {
                        this._activatingHiddenSheetImpl = sheet._impl;
                    } else {
                        sheetUrl = sheet._impl.get_url();
                    }
                    return this._activateSheetInternalAsync(sheet._impl.get_name(), sheetUrl);
                }
            }
            throw tab._TableauException.create('sheetNotInWorkbook', 'Sheet is not found in Workbook');
        },

        _revertAllAsync: function tab__WorkbookImpl$_revertAllAsync() {
            var deferred = new tab._Deferred();
            var returnHandler = new tab._CommandReturnHandler('api.RevertAllCommand', 1, function(result) {
                deferred.resolve();
            }, function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this._sendCommand(null, returnHandler);
            return deferred.get_promise();
        },

        _update: function tab__WorkbookImpl$_update(callback) {
            this._getClientInfo(callback);
        },

        _activateSheetWithInfoAsync: function tab__WorkbookImpl$_activateSheetWithInfoAsync(sheetInfoImpl) {
            return this._activateSheetInternalAsync(sheetInfoImpl.name, sheetInfoImpl.url);
        },

        _activateSheetInternalAsync: function tab__WorkbookImpl$_activateSheetInternalAsync(sheetName, sheetUrl) {
            var deferred = new tab._Deferred();
            if (ss.isValue(this._activeSheetImpl) && sheetName === this._activeSheetImpl.get_name()) {
                deferred.resolve(this._activeSheetImpl.get_sheet());
                return deferred.get_promise();
            }
            var param = {};
            param['api.switchToSheetName'] = sheetName;
            param['api.switchToRepositoryUrl'] = sheetUrl;
            param['api.oldRepositoryUrl'] = this._activeSheetImpl.get_url();
            var returnHandler = new tab._CommandReturnHandler('api.SwitchActiveSheetCommand', 0, ss.Delegate.create(this, function(result) {
                this._vizImpl._workbookTabSwitchHandler = ss.Delegate.create(this, function() {
                    this._vizImpl._workbookTabSwitchHandler = null;
                    deferred.resolve(this._activeSheetImpl.get_sheet());
                });
            }), function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this._sendCommand(param, returnHandler);
            return deferred.get_promise();
        },

        _updateActiveSheetAsync: function tab__WorkbookImpl$_updateActiveSheetAsync() {
            var deferred = new tab._Deferred();
            var param = {};
            param['api.switchToSheetName'] = this._activeSheetImpl.get_name();
            param['api.switchToRepositoryUrl'] = this._activeSheetImpl.get_url();
            param['api.oldRepositoryUrl'] = this._activeSheetImpl.get_url();
            var returnHandler = new tab._CommandReturnHandler('api.UpdateActiveSheetCommand', 0, ss.Delegate.create(this, function(result) {
                deferred.resolve(this._activeSheetImpl.get_sheet());
            }), function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this._sendCommand(param, returnHandler);
            return deferred.get_promise();
        },

        _sendCommand: function tab__WorkbookImpl$_sendCommand(commandParameters, returnHandler) {
            this._messagingOptions.sendCommand(commandParameters, returnHandler);
        },

        _getClientInfo: function tab__WorkbookImpl$_getClientInfo(callback) {
            var returnHandler = new tab._CommandReturnHandler('api.GetClientInfoCommand', 0, ss.Delegate.create(this, function(result) {
                var clientInfo = result;
                this._processInfo(clientInfo);
                if (ss.isValue(callback)) {
                    callback();
                }
            }), null);
            this._sendCommand(null, returnHandler);
        },

        _processInfo: function tab__WorkbookImpl$_processInfo(clientInfo) {
            this._name = clientInfo.workbookName;
            this._isDownloadAllowed = clientInfo.isDownloadAllowed;
            this._vizImpl._setAreAutomaticUpdatesPaused(!clientInfo.isAutoUpdate);
            this._createSheetsInfo(clientInfo);
            this._initializeActiveSheet(clientInfo);
        },

        _initializeActiveSheet: function tab__WorkbookImpl$_initializeActiveSheet(clientInfo) {
            var currentSheetName = clientInfo.currentSheetName;
            var newActiveSheetInfo = this._publishedSheetsInfo._get(currentSheetName);
            if (ss.isNullOrUndefined(newActiveSheetInfo) && ss.isNullOrUndefined(this._activatingHiddenSheetImpl)) {
                throw tab._TableauException.createInternalError('The active sheet was not specified in baseSheets');
            }
            if (ss.isValue(this._activeSheetImpl) && this._activeSheetImpl.get_name() === currentSheetName) {
                return;
            }
            if (ss.isValue(this._activeSheetImpl)) {
                this._activeSheetImpl.set_isActive(false);
                var oldActiveSheetInfo = this._publishedSheetsInfo._get(this._activeSheetImpl.get_name());
                if (ss.isValue(oldActiveSheetInfo)) {
                    oldActiveSheetInfo._impl.isActive = false;
                }
                if (this._activeSheetImpl.get_sheetType() === 'story') {
                    var storyImpl = this._activeSheetImpl;
                    storyImpl.remove_activeStoryPointChange(ss.Delegate.create(this._vizImpl, this._vizImpl.raiseStoryPointSwitch));
                }
            }
            if (ss.isValue(this._activatingHiddenSheetImpl)) {
                var infoImpl = tab.$create__SheetInfoImpl(this._activatingHiddenSheetImpl.get_name(), 'worksheet', -1, this._activatingHiddenSheetImpl.get_size(), this.get_workbook(), '', true, true, 4294967295);
                this._activatingHiddenSheetImpl = null;
                this._activeSheetImpl = new tab._WorksheetImpl(infoImpl, this, this._messagingOptions, null);
            } else {
                var baseSheet = null;
                for (var i = 0, len = clientInfo.publishedSheets.length; i < len; i++) {
                    if (clientInfo.publishedSheets[i].name === currentSheetName) {
                        baseSheet = clientInfo.publishedSheets[i];
                        break;
                    }
                }
                if (ss.isNullOrUndefined(baseSheet)) {
                    throw tab._TableauException.createInternalError('No base sheet was found corresponding to the active sheet.');
                }
                var findSheetFunc = ss.Delegate.create(this, function(sheetName) {
                    return this._publishedSheetsInfo._get(sheetName);
                });
                if (baseSheet.sheetType === 'dashboard') {
                    var dashboardImpl = new tab._DashboardImpl(newActiveSheetInfo._impl, this, this._messagingOptions);
                    this._activeSheetImpl = dashboardImpl;
                    var dashboardFrames = tab._WorkbookImpl._createDashboardZones(clientInfo.dashboardZones);
                    dashboardImpl._addObjects(dashboardFrames, findSheetFunc);
                } else if (baseSheet.sheetType === 'story') {
                    var storyImpl = new tab._StoryImpl(newActiveSheetInfo._impl, this, this._messagingOptions, clientInfo.story, findSheetFunc);
                    this._activeSheetImpl = storyImpl;
                    storyImpl.add_activeStoryPointChange(ss.Delegate.create(this._vizImpl, this._vizImpl.raiseStoryPointSwitch));
                } else {
                    this._activeSheetImpl = new tab._WorksheetImpl(newActiveSheetInfo._impl, this, this._messagingOptions, null);
                }
                newActiveSheetInfo._impl.isActive = true;
            }
            this._activeSheetImpl.set_isActive(true);
        },

        _createSheetsInfo: function tab__WorkbookImpl$_createSheetsInfo(clientInfo) {
            var baseSheets = clientInfo.publishedSheets;
            if (ss.isNullOrUndefined(baseSheets)) {
                return;
            }
            for (var index = 0; index < baseSheets.length; index++) {
                var baseSheet = baseSheets[index];
                var sheetName = baseSheet.name;
                var sheetInfo = this._publishedSheetsInfo._get(sheetName);
                var size = tab._WorkbookImpl._createSheetSize(baseSheet);
                if (ss.isNullOrUndefined(sheetInfo)) {
                    var isActive = sheetName === clientInfo.currentSheetName;
                    var sheetType = baseSheet.sheetType;
                    var sheetInfoImpl = tab.$create__SheetInfoImpl(sheetName, sheetType, index, size, this.get_workbook(), baseSheet.repositoryUrl, isActive, false, 4294967295);
                    sheetInfo = new tableauSoftware.SheetInfo(sheetInfoImpl);
                    this._publishedSheetsInfo._add(sheetName, sheetInfo);
                } else {
                    sheetInfo._impl.size = size;
                }
            }
        },

        _currentCustomView: null,

        get__customViews: function tab__WorkbookImpl$get__customViews() {
            return this._customViews;
        },
        set__customViews: function tab__WorkbookImpl$set__customViews(value) {
            this._customViews = value;
            return value;
        },

        get__updatedCustomViews: function tab__WorkbookImpl$get__updatedCustomViews() {
            return this._updatedCustomViews;
        },
        set__updatedCustomViews: function tab__WorkbookImpl$set__updatedCustomViews(value) {
            this._updatedCustomViews = value;
            return value;
        },

        get__removedCustomViews: function tab__WorkbookImpl$get__removedCustomViews() {
            return this._removedCustomViews;
        },
        set__removedCustomViews: function tab__WorkbookImpl$set__removedCustomViews(value) {
            this._removedCustomViews = value;
            return value;
        },

        get__currentCustomView: function tab__WorkbookImpl$get__currentCustomView() {
            return this._currentCustomView;
        },
        set__currentCustomView: function tab__WorkbookImpl$set__currentCustomView(value) {
            this._currentCustomView = value;
            return value;
        },

        _getCustomViewsAsync: function tab__WorkbookImpl$_getCustomViewsAsync() {
            return tab._CustomViewImpl._getCustomViewsAsync(this, this._messagingOptions);
        },

        _showCustomViewAsync: function tab__WorkbookImpl$_showCustomViewAsync(customViewName) {
            if (ss.isNullOrUndefined(customViewName) || tab._Utility.isNullOrEmpty(customViewName)) {
                return tab._CustomViewImpl._showCustomViewAsync(this, this._messagingOptions, null);
            } else {
                var cv = this._customViews._get(customViewName);
                if (ss.isNullOrUndefined(cv)) {
                    var deferred = new tab._Deferred();
                    deferred.reject(tab._TableauException.createInvalidCustomViewName(customViewName));
                    return deferred.get_promise();
                }
                return cv._impl._showAsync();
            }
        },

        _removeCustomViewAsync: function tab__WorkbookImpl$_removeCustomViewAsync(customViewName) {
            if (tab._Utility.isNullOrEmpty(customViewName)) {
                throw tab._TableauException.createNullOrEmptyParameter('customViewName');
            }
            var cv = this._customViews._get(customViewName);
            if (ss.isNullOrUndefined(cv)) {
                var deferred = new tab._Deferred();
                deferred.reject(tab._TableauException.createInvalidCustomViewName(customViewName));
                return deferred.get_promise();
            }
            return cv._impl._removeAsync();
        },

        _rememberCustomViewAsync: function tab__WorkbookImpl$_rememberCustomViewAsync(customViewName) {
            if (tab._Utility.isNullOrEmpty(customViewName)) {
                throw tab._TableauException.createInvalidParameter('customViewName');
            }
            return tab._CustomViewImpl._saveNewAsync(this, this._messagingOptions, customViewName);
        },

        _setActiveCustomViewAsDefaultAsync: function tab__WorkbookImpl$_setActiveCustomViewAsDefaultAsync() {
            return tab._CustomViewImpl._makeCurrentCustomViewDefaultAsync(this, this._messagingOptions);
        },

        _parameters: null,
        _lastChangedParameterImpl: null,

        get__lastChangedParameterImpl: function tab__WorkbookImpl$get__lastChangedParameterImpl() {
            return this._lastChangedParameterImpl;
        },
        set__lastChangedParameterImpl: function tab__WorkbookImpl$set__lastChangedParameterImpl(value) {
            this._lastChangedParameterImpl = value;
            return value;
        },

        get__parameters: function tab__WorkbookImpl$get__parameters() {
            return this._parameters;
        },

        _getSingleParameterAsync: function tab__WorkbookImpl$_getSingleParameterAsync(parameterName) {
            var deferred = new tab._Deferred();
            if (ss.isValue(this._lastChangedParameterImpl)) {
                deferred.resolve(this._lastChangedParameterImpl.get__parameter());
                return deferred.get_promise();
            }
            var commandParameters = {};
            var returnHandler = new tab._CommandReturnHandler('api.FetchParametersCommand', 0, ss.Delegate.create(this, function(result) {
                var paramList = result;
                var parameterImpl = tab._WorkbookImpl._findAndCreateParameterImpl(parameterName, paramList);
                this._lastChangedParameterImpl = parameterImpl;
                deferred.resolve(parameterImpl.get__parameter());
            }), function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this._sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _getParametersAsync: function tab__WorkbookImpl$_getParametersAsync() {
            var deferred = new tab._Deferred();
            var commandParameters = {};
            var returnHandler = new tab._CommandReturnHandler('api.FetchParametersCommand', 0, ss.Delegate.create(this, function(result) {
                var paramList = result;
                this._parameters = tab._WorkbookImpl._processParameters(paramList);
                deferred.resolve(this.get__parameters()._toApiCollection());
            }), function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this._sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _changeParameterValueAsync: function tab__WorkbookImpl$_changeParameterValueAsync(parameterName, value) {
            var deferred = new tab._Deferred();
            var parameterImpl = null;
            if (ss.isValue(this._parameters)) {
                if (ss.isNullOrUndefined(this._parameters._get(parameterName))) {
                    deferred.reject(tab._TableauException.createInvalidParameter(parameterName));
                    return deferred.get_promise();
                }
                parameterImpl = this._parameters._get(parameterName)._impl;
                if (ss.isNullOrUndefined(parameterImpl)) {
                    deferred.reject(tab._TableauException.createInvalidParameter(parameterName));
                    return deferred.get_promise();
                }
            }
            var param = {};
            param['api.setParameterName'] = (ss.isValue(this._parameters)) ? parameterImpl.get__name() : parameterName;
            if (ss.isValue(value) && tab._Utility.isDate(value)) {
                var date = value;
                var dateStr = tab._Utility.serializeDateForServer(date);
                param['api.setParameterValue'] = dateStr;
            } else {
                param['api.setParameterValue'] = (ss.isValue(value)) ? value.toString() : null;
            }
            this._lastChangedParameterImpl = null;
            var returnHandler = new tab._CommandReturnHandler('api.SetParameterValueCommand', 0, ss.Delegate.create(this, function(result) {
                var pm = result;
                if (ss.isNullOrUndefined(pm)) {
                    deferred.reject(tab._TableauException.create('serverError', 'server error'));
                    return;
                }
                if (!pm.isValidPresModel) {
                    deferred.reject(tab._TableauException.createInvalidParameter(parameterName));
                    return;
                }
                var paramUpdated = new tab._parameterImpl(pm);
                this._lastChangedParameterImpl = paramUpdated;
                deferred.resolve(paramUpdated.get__parameter());
            }), function(remoteError, message) {
                deferred.reject(tab._TableauException.createInvalidParameter(parameterName));
            });
            this._sendCommand(param, returnHandler);
            return deferred.get_promise();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._WorksheetImpl

    tab._WorksheetImpl = function tab__WorksheetImpl(sheetInfoImpl, workbookImpl, messagingOptions, parentDashboardImpl) {
        this._filters$1 = new tab._Collection();
        this._selectedMarks$1 = new tab._Collection();
        tab._WorksheetImpl.initializeBase(this, [sheetInfoImpl, workbookImpl, messagingOptions]);
        this._parentDashboardImpl$1 = parentDashboardImpl;
    }
    tab._WorksheetImpl._filterCommandError = function tab__WorksheetImpl$_filterCommandError(rawPm) {
        var commandError = rawPm;
        if (ss.isValue(commandError) && ss.isValue(commandError.errorCode)) {
            var additionalInfo = commandError.additionalInformation;
            switch (commandError.errorCode) {
                case 'invalidFilterFieldName':
                case 'invalidFilterFieldValue':
                    return tab._TableauException.create(commandError.errorCode, additionalInfo);
                case 'invalidAggregationFieldName':
                    return tab._TableauException._createInvalidAggregationFieldName(additionalInfo);
                default:
                    return tab._TableauException.createServerError(additionalInfo);
            }
        }
        return null;
    }
    tab._WorksheetImpl._normalizeRangeFilterOption$1 = function tab__WorksheetImpl$_normalizeRangeFilterOption$1(filterOptions) {
        if (ss.isNullOrUndefined(filterOptions)) {
            throw tab._TableauException.createNullOrEmptyParameter('filterOptions');
        }
        if (ss.isNullOrUndefined(filterOptions.min) && ss.isNullOrUndefined(filterOptions.max)) {
            throw tab._TableauException.create('invalidParameter', 'At least one of filterOptions.min or filterOptions.max must be specified.');
        }
        var fixedUpFilterOptions = {};
        if (ss.isValue(filterOptions.min)) {
            fixedUpFilterOptions.min = filterOptions.min;
        }
        if (ss.isValue(filterOptions.max)) {
            fixedUpFilterOptions.max = filterOptions.max;
        }
        if (ss.isValue(filterOptions.nullOption)) {
            fixedUpFilterOptions.nullOption = tab._enums._normalizeNullOption(filterOptions.nullOption, 'filterOptions.nullOption');
        }
        return fixedUpFilterOptions;
    }
    tab._WorksheetImpl._normalizeRelativeDateFilterOptions$1 = function tab__WorksheetImpl$_normalizeRelativeDateFilterOptions$1(filterOptions) {
        if (ss.isNullOrUndefined(filterOptions)) {
            throw tab._TableauException.createNullOrEmptyParameter('filterOptions');
        }
        var fixedUpFilterOptions = {};
        fixedUpFilterOptions.rangeType = tab._enums._normalizeDateRangeType(filterOptions.rangeType, 'filterOptions.rangeType');
        fixedUpFilterOptions.periodType = tab._enums._normalizePeriodType(filterOptions.periodType, 'filterOptions.periodType');
        if (fixedUpFilterOptions.rangeType === 'lastn' || fixedUpFilterOptions.rangeType === 'nextn') {
            if (ss.isNullOrUndefined(filterOptions.rangeN)) {
                throw tab._TableauException.create('missingRangeNForRelativeDateFilters', 'Missing rangeN field for a relative date filter of LASTN or NEXTN.');
            }
            fixedUpFilterOptions.rangeN = tab._Utility.toInt(filterOptions.rangeN);
        }
        if (ss.isValue(filterOptions.anchorDate)) {
            if (!tab._Utility.isDate(filterOptions.anchorDate) || !tab._Utility.isDateValid(filterOptions.anchorDate)) {
                throw tab._TableauException.createInvalidDateParameter('filterOptions.anchorDate');
            }
            fixedUpFilterOptions.anchorDate = filterOptions.anchorDate;
        }
        return fixedUpFilterOptions;
    }
    tab._WorksheetImpl._createFilterCommandReturnHandler$1 = function tab__WorksheetImpl$_createFilterCommandReturnHandler$1(commandName, fieldName, deferred) {
        return new tab._CommandReturnHandler(commandName, 1, function(result) {
            var error = tab._WorksheetImpl._filterCommandError(result);
            if (error == null) {
                deferred.resolve(fieldName);
            } else {
                deferred.reject(error);
            }
        }, function(remoteError, message) {
            if (remoteError) {
                deferred.reject(tab._TableauException.createInvalidFilterFieldNameOrValue(fieldName));
            } else {
                var error = tab._TableauException.create('filterCannotBePerformed', message);
                deferred.reject(error);
            }
        });
    }
    tab._WorksheetImpl._createSelectionCommandError$1 = function tab__WorksheetImpl$_createSelectionCommandError$1(rawPm) {
        var commandError = rawPm;
        if (ss.isValue(commandError) && ss.isValue(commandError.errorCode)) {
            var additionalInfo = commandError.additionalInformation;
            switch (commandError.errorCode) {
                case 'invalidSelectionFieldName':
                case 'invalidSelectionValue':
                case 'invalidSelectionDate':
                    return tab._TableauException.create(commandError.errorCode, additionalInfo);
            }
        }
        return null;
    }
    tab._WorksheetImpl.prototype = {
        _worksheet$1: null,
        _parentDashboardImpl$1: null,

        get_sheet: function tab__WorksheetImpl$get_sheet() {
            return this.get_worksheet();
        },

        get_worksheet: function tab__WorksheetImpl$get_worksheet() {
            if (this._worksheet$1 == null) {
                this._worksheet$1 = new tableauSoftware.Worksheet(this);
            }
            return this._worksheet$1;
        },

        get_parentDashboardImpl: function tab__WorksheetImpl$get_parentDashboardImpl() {
            return this._parentDashboardImpl$1;
        },

        get_parentDashboard: function tab__WorksheetImpl$get_parentDashboard() {
            if (ss.isValue(this._parentDashboardImpl$1)) {
                return this._parentDashboardImpl$1.get_dashboard();
            }
            return null;
        },

        _getDataSourcesAsync: function tab__WorksheetImpl$_getDataSourcesAsync() {
            this._verifyActiveSheetOrEmbeddedInActiveDashboard$1();
            var deferred = new tab._Deferred();
            var commandParameters = {};
            commandParameters['api.worksheetName'] = this.get_name();
            var returnHandler = new tab._CommandReturnHandler('api.GetDataSourcesCommand', 0, function(result) {
                var dataSourcesPm = result;
                var dataSources = tab._DataSourceImpl.processDataSourcesForWorksheet(dataSourcesPm);
                deferred.resolve(dataSources._toApiCollection());
            }, function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _getDataSourceAsync: function tab__WorksheetImpl$_getDataSourceAsync(dataSourceName) {
            this._verifyActiveSheetOrEmbeddedInActiveDashboard$1();
            var deferred = new tab._Deferred();
            var commandParameters = {};
            commandParameters['api.dataSourceName'] = dataSourceName;
            commandParameters['api.worksheetName'] = this.get_name();
            var returnHandler = new tab._CommandReturnHandler('api.GetDataSourceCommand', 0, function(result) {
                var dataSourcePm = result;
                var dataSourceImpl = tab._DataSourceImpl.processDataSource(dataSourcePm);
                if (ss.isValue(dataSourceImpl)) {
                    deferred.resolve(dataSourceImpl.get_dataSource());
                } else {
                    deferred.reject(tab._TableauException.createServerError("Data source '" + dataSourceName + "' not found"));
                }
            }, function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _verifyActiveSheetOrEmbeddedInActiveDashboard$1: function tab__WorksheetImpl$_verifyActiveSheetOrEmbeddedInActiveDashboard$1() {
            var isRootAndActiveWorksheet = this.get_isActive();
            var isWithinActiveDashboard = ss.isValue(this._parentDashboardImpl$1) && this._parentDashboardImpl$1.get_isActive();
            var isWithinActiveStoryPoint = ss.isValue(this.get_parentStoryPointImpl()) && this.get_parentStoryPointImpl().get_parentStoryImpl().get_isActive();
            if (!isRootAndActiveWorksheet && !isWithinActiveDashboard && !isWithinActiveStoryPoint) {
                throw tab._TableauException.createNotActiveSheet();
            }
        },

        _addVisualIdToCommand$1: function tab__WorksheetImpl$_addVisualIdToCommand$1(commandParameters) {
            if (ss.isValue(this.get_parentStoryPointImpl())) {
                var visualId = {};
                visualId.worksheet = this.get_name();
                if (ss.isValue(this.get_parentDashboardImpl())) {
                    visualId.dashboard = this.get_parentDashboardImpl().get_name();
                }
                visualId.flipboardZoneId = this.get_parentStoryPointImpl().get_containedSheetImpl().get_zoneId();
                visualId.storyboard = this.get_parentStoryPointImpl().get_parentStoryImpl().get_name();
                visualId.storyPointId = this.get_parentStoryPointImpl().get_storyPointId();
                commandParameters['api.visualId'] = visualId;
            } else {
                commandParameters['api.worksheetName'] = this.get_name();
                if (ss.isValue(this.get_parentDashboardImpl())) {
                    commandParameters['api.dashboardName'] = this.get_parentDashboardImpl().get_name();
                }
            }
        },

        get__filters: function tab__WorksheetImpl$get__filters() {
            return this._filters$1;
        },
        set__filters: function tab__WorksheetImpl$set__filters(value) {
            this._filters$1 = value;
            return value;
        },

        _getFilterAsync: function tab__WorksheetImpl$_getFilterAsync(fieldName, fieldCaption, options) {
            if (!tab._Utility.isNullOrEmpty(fieldName) && !tab._Utility.isNullOrEmpty(fieldCaption)) {
                throw tab._TableauException.createInternalError('Only fieldName OR fieldCaption is allowed, not both.');
            }
            options = (options || {});
            var deferred = new tab._Deferred();
            var commandParameters = {};
            this._addVisualIdToCommand$1(commandParameters);
            if (!tab._Utility.isNullOrEmpty(fieldCaption) && tab._Utility.isNullOrEmpty(fieldName)) {
                commandParameters['api.fieldCaption'] = fieldCaption;
            }
            if (!tab._Utility.isNullOrEmpty(fieldName)) {
                commandParameters['api.fieldName'] = fieldName;
            }
            commandParameters['api.filterHierarchicalLevels'] = 0;
            commandParameters['api.ignoreDomain'] = (options.ignoreDomain || false);
            var returnHandler = new tab._CommandReturnHandler('api.GetOneFilterInfoCommand', 0, ss.Delegate.create(this, function(result) {
                var error = tab._WorksheetImpl._filterCommandError(result);
                if (error == null) {
                    var filterJson = result;
                    var filter = tableauSoftware.Filter._createFilter(this, filterJson);
                    deferred.resolve(filter);
                } else {
                    deferred.reject(error);
                }
            }), function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _getFiltersAsync: function tab__WorksheetImpl$_getFiltersAsync(options) {
            this._verifyActiveSheetOrEmbeddedInActiveDashboard$1();
            options = (options || {});
            var deferred = new tab._Deferred();
            var commandParameters = {};
            this._addVisualIdToCommand$1(commandParameters);
            commandParameters['api.ignoreDomain'] = (options.ignoreDomain || false);
            var returnHandler = new tab._CommandReturnHandler('api.GetFiltersListCommand', 0, ss.Delegate.create(this, function(result) {
                var filtersListJson = result;
                this.set__filters(tableauSoftware.Filter._processFiltersList(this, filtersListJson));
                deferred.resolve(this.get__filters()._toApiCollection());
            }), function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _applyFilterAsync: function tab__WorksheetImpl$_applyFilterAsync(fieldName, values, updateType, options) {
            return this._applyFilterWithValuesInternalAsync$1(fieldName, values, updateType, options);
        },

        _clearFilterAsync: function tab__WorksheetImpl$_clearFilterAsync(fieldName) {
            return this._clearFilterInternalAsync$1(fieldName);
        },

        _applyRangeFilterAsync: function tab__WorksheetImpl$_applyRangeFilterAsync(fieldName, options) {
            var fixedUpFilterOptions = tab._WorksheetImpl._normalizeRangeFilterOption$1(options);
            return this._applyRangeFilterInternalAsync$1(fieldName, fixedUpFilterOptions);
        },

        _applyRelativeDateFilterAsync: function tab__WorksheetImpl$_applyRelativeDateFilterAsync(fieldName, options) {
            var fixedUpFilterOptions = tab._WorksheetImpl._normalizeRelativeDateFilterOptions$1(options);
            return this._applyRelativeDateFilterInternalAsync$1(fieldName, fixedUpFilterOptions);
        },

        _applyHierarchicalFilterAsync: function tab__WorksheetImpl$_applyHierarchicalFilterAsync(fieldName, values, updateType, options) {
            if (ss.isNullOrUndefined(values) && updateType !== 'all') {
                throw tab._TableauException.createInvalidParameter('values');
            }
            return this._applyHierarchicalFilterInternalAsync$1(fieldName, values, updateType, options);
        },

        _clearFilterInternalAsync$1: function tab__WorksheetImpl$_clearFilterInternalAsync$1(fieldName) {
            this._verifyActiveSheetOrEmbeddedInActiveDashboard$1();
            if (tab._Utility.isNullOrEmpty(fieldName)) {
                throw tab._TableauException.createNullOrEmptyParameter('fieldName');
            }
            var deferred = new tab._Deferred();
            var commandParameters = {};
            commandParameters['api.fieldCaption'] = fieldName;
            this._addVisualIdToCommand$1(commandParameters);
            var returnHandler = tab._WorksheetImpl._createFilterCommandReturnHandler$1('api.ClearFilterCommand', fieldName, deferred);
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _applyFilterWithValuesInternalAsync$1: function tab__WorksheetImpl$_applyFilterWithValuesInternalAsync$1(fieldName, values, updateType, options) {
            this._verifyActiveSheetOrEmbeddedInActiveDashboard$1();
            if (tab._Utility.isNullOrEmpty(fieldName)) {
                throw tab._TableauException.createNullOrEmptyParameter('fieldName');
            }
            updateType = tab._enums._normalizeFilterUpdateType(updateType, 'updateType');
            var fieldValues = [];
            if (tab._jQueryShim.isArray(values)) {
                for (var i = 0; i < values.length; i++) {
                    fieldValues.push(values[i].toString());
                }
            } else if (ss.isValue(values)) {
                fieldValues.push(values.toString());
            }
            var deferred = new tab._Deferred();
            var commandParameters = {};
            commandParameters['api.fieldCaption'] = fieldName;
            commandParameters['api.filterUpdateType'] = updateType;
            commandParameters['api.exclude'] = (ss.isValue(options) && options.isExcludeMode) ? true : false;
            if (updateType !== 'all') {
                commandParameters['api.filterCategoricalValues'] = fieldValues;
            }
            this._addVisualIdToCommand$1(commandParameters);
            var returnHandler = tab._WorksheetImpl._createFilterCommandReturnHandler$1('api.ApplyCategoricalFilterCommand', fieldName, deferred);
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _applyRangeFilterInternalAsync$1: function tab__WorksheetImpl$_applyRangeFilterInternalAsync$1(fieldName, filterOptions) {
            this._verifyActiveSheetOrEmbeddedInActiveDashboard$1();
            if (tab._Utility.isNullOrEmpty(fieldName)) {
                throw tab._TableauException.createNullOrEmptyParameter('fieldName');
            }
            if (ss.isNullOrUndefined(filterOptions)) {
                throw tab._TableauException.createNullOrEmptyParameter('filterOptions');
            }
            var commandParameters = {};
            commandParameters['api.fieldCaption'] = fieldName;
            if (ss.isValue(filterOptions.min)) {
                if (tab._Utility.isDate(filterOptions.min)) {
                    var dt = filterOptions.min;
                    if (tab._Utility.isDateValid(dt)) {
                        commandParameters['api.filterRangeMin'] = tab._Utility.serializeDateForServer(dt);
                    } else {
                        throw tab._TableauException.createInvalidDateParameter('filterOptions.min');
                    }
                } else {
                    commandParameters['api.filterRangeMin'] = filterOptions.min;
                }
            }
            if (ss.isValue(filterOptions.max)) {
                if (tab._Utility.isDate(filterOptions.max)) {
                    var dt = filterOptions.max;
                    if (tab._Utility.isDateValid(dt)) {
                        commandParameters['api.filterRangeMax'] = tab._Utility.serializeDateForServer(dt);
                    } else {
                        throw tab._TableauException.createInvalidDateParameter('filterOptions.max');
                    }
                } else {
                    commandParameters['api.filterRangeMax'] = filterOptions.max;
                }
            }
            if (ss.isValue(filterOptions.nullOption)) {
                commandParameters['api.filterRangeNullOption'] = filterOptions.nullOption;
            }
            this._addVisualIdToCommand$1(commandParameters);
            var deferred = new tab._Deferred();
            var returnHandler = tab._WorksheetImpl._createFilterCommandReturnHandler$1('api.ApplyRangeFilterCommand', fieldName, deferred);
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _applyRelativeDateFilterInternalAsync$1: function tab__WorksheetImpl$_applyRelativeDateFilterInternalAsync$1(fieldName, filterOptions) {
            this._verifyActiveSheetOrEmbeddedInActiveDashboard$1();
            if (tab._Utility.isNullOrEmpty(fieldName)) {
                throw tab._TableauException.createInvalidParameter('fieldName');
            } else if (ss.isNullOrUndefined(filterOptions)) {
                throw tab._TableauException.createInvalidParameter('filterOptions');
            }
            var commandParameters = {};
            commandParameters['api.fieldCaption'] = fieldName;
            if (ss.isValue(filterOptions)) {
                commandParameters['api.filterPeriodType'] = filterOptions.periodType;
                commandParameters['api.filterDateRangeType'] = filterOptions.rangeType;
                if (filterOptions.rangeType === 'lastn' || filterOptions.rangeType === 'nextn') {
                    if (ss.isNullOrUndefined(filterOptions.rangeN)) {
                        throw tab._TableauException.create('missingRangeNForRelativeDateFilters', 'Missing rangeN field for a relative date filter of LASTN or NEXTN.');
                    }
                    commandParameters['api.filterDateRange'] = filterOptions.rangeN;
                }
                if (ss.isValue(filterOptions.anchorDate)) {
                    commandParameters['api.filterDateArchorValue'] = tab._Utility.serializeDateForServer(filterOptions.anchorDate);
                }
            }
            this._addVisualIdToCommand$1(commandParameters);
            var deferred = new tab._Deferred();
            var returnHandler = tab._WorksheetImpl._createFilterCommandReturnHandler$1('api.ApplyRelativeDateFilterCommand', fieldName, deferred);
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _applyHierarchicalFilterInternalAsync$1: function tab__WorksheetImpl$_applyHierarchicalFilterInternalAsync$1(fieldName, values, updateType, options) {
            this._verifyActiveSheetOrEmbeddedInActiveDashboard$1();
            if (tab._Utility.isNullOrEmpty(fieldName)) {
                throw tab._TableauException.createNullOrEmptyParameter('fieldName');
            }
            updateType = tab._enums._normalizeFilterUpdateType(updateType, 'updateType');
            var fieldValues = null;
            var levelValues = null;
            if (tab._jQueryShim.isArray(values)) {
                fieldValues = [];
                var arr = values;
                for (var i = 0; i < arr.length; i++) {
                    fieldValues.push(arr[i].toString());
                }
            } else if (tab._Utility.isString(values)) {
                fieldValues = [];
                fieldValues.push(values.toString());
            } else if (ss.isValue(values) && ss.isValue(values.levels)) {
                var levelValue = values.levels;
                levelValues = [];
                if (tab._jQueryShim.isArray(levelValue)) {
                    var levels = levelValue;
                    for (var i = 0; i < levels.length; i++) {
                        levelValues.push(levels[i].toString());
                    }
                } else {
                    levelValues.push(levelValue.toString());
                }
            } else if (ss.isValue(values)) {
                throw tab._TableauException.createInvalidParameter('values');
            }
            var commandParameters = {};
            commandParameters['api.fieldCaption'] = fieldName;
            commandParameters['api.filterUpdateType'] = updateType;
            commandParameters['api.exclude'] = (ss.isValue(options) && options.isExcludeMode) ? true : false;
            if (fieldValues != null) {
                commandParameters['api.filterHierarchicalValues'] = tab.JsonUtil.toJson(fieldValues, false, '');
            }
            if (levelValues != null) {
                commandParameters['api.filterHierarchicalLevels'] = tab.JsonUtil.toJson(levelValues, false, '');
            }
            this._addVisualIdToCommand$1(commandParameters);
            var deferred = new tab._Deferred();
            var returnHandler = tab._WorksheetImpl._createFilterCommandReturnHandler$1('api.ApplyHierarchicalFilterCommand', fieldName, deferred);
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        get_selectedMarks: function tab__WorksheetImpl$get_selectedMarks() {
            return this._selectedMarks$1;
        },
        set_selectedMarks: function tab__WorksheetImpl$set_selectedMarks(value) {
            this._selectedMarks$1 = value;
            return value;
        },

        _clearSelectedMarksAsync: function tab__WorksheetImpl$_clearSelectedMarksAsync() {
            this._verifyActiveSheetOrEmbeddedInActiveDashboard$1();
            var deferred = new tab._Deferred();
            var commandParameters = {};
            this._addVisualIdToCommand$1(commandParameters);
            commandParameters['api.filterUpdateType'] = 'replace';
            var returnHandler = new tab._CommandReturnHandler('api.SelectMarksCommand', 1, function(result) {
                deferred.resolve();
            }, function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _selectMarksAsync: function tab__WorksheetImpl$_selectMarksAsync(fieldNameOrFieldValuesMap, valueOrUpdateType, updateType) {
            this._verifyActiveSheetOrEmbeddedInActiveDashboard$1();
            if (fieldNameOrFieldValuesMap == null && valueOrUpdateType == null) {
                return this._clearSelectedMarksAsync();
            }
            if (tab._Utility.isString(fieldNameOrFieldValuesMap) && (tab._jQueryShim.isArray(valueOrUpdateType) || tab._Utility.isString(valueOrUpdateType) || !tab._enums._isSelectionUpdateType(valueOrUpdateType))) {
                return this._selectMarksWithFieldNameAndValueAsync$1(fieldNameOrFieldValuesMap, valueOrUpdateType, updateType);
            } else if (tab._jQueryShim.isArray(fieldNameOrFieldValuesMap)) {
                return this._selectMarksWithMarksArrayAsync$1(fieldNameOrFieldValuesMap, valueOrUpdateType);
            } else {
                return this._selectMarksWithMultiDimOptionAsync$1(fieldNameOrFieldValuesMap, valueOrUpdateType);
            }
        },

        _getSelectedMarksAsync: function tab__WorksheetImpl$_getSelectedMarksAsync() {
            this._verifyActiveSheetOrEmbeddedInActiveDashboard$1();
            var deferred = new tab._Deferred();
            var commandParameters = {};
            this._addVisualIdToCommand$1(commandParameters);
            var returnHandler = new tab._CommandReturnHandler('api.FetchSelectedMarksCommand', 0, ss.Delegate.create(this, function(result) {
                var pm = result;
                this._selectedMarks$1 = tab._markImpl._processSelectedMarks(pm);
                deferred.resolve(this._selectedMarks$1._toApiCollection());
            }), function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        },

        _selectMarksWithFieldNameAndValueAsync$1: function tab__WorksheetImpl$_selectMarksWithFieldNameAndValueAsync$1(fieldName, value, updateType) {
            var catNameList = [];
            var catValueList = [];
            var hierNameList = [];
            var hierValueList = [];
            var rangeNameList = [];
            var rangeValueList = [];
            this._parseMarksParam$1(catNameList, catValueList, hierNameList, hierValueList, rangeNameList, rangeValueList, fieldName, value);
            return this._selectMarksWithValuesAsync$1(null, catNameList, catValueList, hierNameList, hierValueList, rangeNameList, rangeValueList, updateType);
        },

        _selectMarksWithMultiDimOptionAsync$1: function tab__WorksheetImpl$_selectMarksWithMultiDimOptionAsync$1(fieldValuesMap, updateType) {
            var dict = fieldValuesMap;
            var catNameList = [];
            var catValueList = [];
            var hierNameList = [];
            var hierValueList = [];
            var rangeNameList = [];
            var rangeValueList = [];
            var $dict1 = dict;
            for (var $key2 in $dict1) {
                var ent = { key: $key2, value: $dict1[$key2] };
                if (fieldValuesMap.hasOwnProperty(ent.key)) {
                    if (!tab._jQueryShim.isFunction(dict[ent.key])) {
                        this._parseMarksParam$1(catNameList, catValueList, hierNameList, hierValueList, rangeNameList, rangeValueList, ent.key, ent.value);
                    }
                }
            }
            return this._selectMarksWithValuesAsync$1(null, catNameList, catValueList, hierNameList, hierValueList, rangeNameList, rangeValueList, updateType);
        },

        _selectMarksWithMarksArrayAsync$1: function tab__WorksheetImpl$_selectMarksWithMarksArrayAsync$1(marksArray, updateType) {
            var catNameList = [];
            var catValueList = [];
            var hierNameList = [];
            var hierValueList = [];
            var rangeNameList = [];
            var rangeValueList = [];
            var tupleIdList = [];
            for (var i = 0; i < marksArray.length; i++) {
                var mark = marksArray[i];
                if (ss.isValue(mark._impl.get__tupleId()) && mark._impl.get__tupleId() > 0) {
                    tupleIdList.push(mark._impl.get__tupleId());
                } else {
                    var pairs = mark._impl.get__pairs();
                    for (var j = 0; j < pairs.get__length(); j++) {
                        var pair = pairs.get_item(j);
                        if (pair.hasOwnProperty('fieldName') && pair.hasOwnProperty('value') && !tab._jQueryShim.isFunction(pair.fieldName) && !tab._jQueryShim.isFunction(pair.value)) {
                            this._parseMarksParam$1(catNameList, catValueList, hierNameList, hierValueList, rangeNameList, rangeValueList, pair.fieldName, pair.value);
                        }
                    }
                }
            }
            return this._selectMarksWithValuesAsync$1(tupleIdList, catNameList, catValueList, hierNameList, hierValueList, rangeNameList, rangeValueList, updateType);
        },

        _parseMarksParam$1: function tab__WorksheetImpl$_parseMarksParam$1(catNameList, catValueList, hierNameList, hierValueList, rangeNameList, rangeValueList, fieldName, value) {
            var sourceOptions = value;
            if (tab._WorksheetImpl._regexHierarchicalFieldName$1.test(fieldName)) {
                this._addToParamLists$1(hierNameList, hierValueList, fieldName, value);
            } else if (ss.isValue(sourceOptions.min) || ss.isValue(sourceOptions.max)) {
                var range = {};
                if (ss.isValue(sourceOptions.min)) {
                    if (tab._Utility.isDate(sourceOptions.min)) {
                        var dt = sourceOptions.min;
                        if (tab._Utility.isDateValid(dt)) {
                            range.min = tab._Utility.serializeDateForServer(dt);
                        } else {
                            throw tab._TableauException.createInvalidDateParameter('options.min');
                        }
                    } else {
                        range.min = sourceOptions.min;
                    }
                }
                if (ss.isValue(sourceOptions.max)) {
                    if (tab._Utility.isDate(sourceOptions.max)) {
                        var dt = sourceOptions.max;
                        if (tab._Utility.isDateValid(dt)) {
                            range.max = tab._Utility.serializeDateForServer(dt);
                        } else {
                            throw tab._TableauException.createInvalidDateParameter('options.max');
                        }
                    } else {
                        range.max = sourceOptions.max;
                    }
                }
                if (ss.isValue(sourceOptions.nullOption)) {
                    var nullOption = tab._enums._normalizeNullOption(sourceOptions.nullOption, 'options.nullOption');
                    range.nullOption = nullOption;
                } else {
                    range.nullOption = 'allValues';
                }
                var jsonValue = tab.JsonUtil.toJson(range, false, '');
                this._addToParamLists$1(rangeNameList, rangeValueList, fieldName, jsonValue);
            } else {
                this._addToParamLists$1(catNameList, catValueList, fieldName, value);
            }
        },

        _addToParamLists$1: function tab__WorksheetImpl$_addToParamLists$1(paramNameList, paramValueList, paramName, paramValue) {
            var markValues = [];
            if (tab._jQueryShim.isArray(paramValue)) {
                var values = paramValue;
                for (var i = 0; i < values.length; i++) {
                    markValues.push(values[i]);
                }
            } else {
                markValues.push(paramValue);
            }
            paramValueList.push(markValues);
            paramNameList.push(paramName);
        },

        _selectMarksWithValuesAsync$1: function tab__WorksheetImpl$_selectMarksWithValuesAsync$1(tupleIdList, catNameList, catValueList, hierNameList, hierValueList, rangeNameList, rangeValueList, updateType) {
            var commandParameters = {};
            this._addVisualIdToCommand$1(commandParameters);
            updateType = tab._enums._normalizeSelectionUpdateType(updateType, 'updateType');
            commandParameters['api.filterUpdateType'] = updateType;
            if (!tab._Utility.isNullOrEmpty(tupleIdList)) {
                commandParameters['api.tupleIds'] = tab.JsonUtil.toJson(tupleIdList, false, '');
            }
            if (!tab._Utility.isNullOrEmpty(catNameList) && !tab._Utility.isNullOrEmpty(catValueList)) {
                commandParameters['api.categoricalFieldCaption'] = tab.JsonUtil.toJson(catNameList, false, '');
                var markValues = [];
                for (var i = 0; i < catValueList.length; i++) {
                    var values = tab.JsonUtil.toJson(catValueList[i], false, '');
                    markValues.push(values);
                }
                commandParameters['api.categoricalMarkValues'] = tab.JsonUtil.toJson(markValues, false, '');
            }
            if (!tab._Utility.isNullOrEmpty(hierNameList) && !tab._Utility.isNullOrEmpty(hierValueList)) {
                commandParameters['api.hierarchicalFieldCaption'] = tab.JsonUtil.toJson(hierNameList, false, '');
                var markValues = [];
                for (var i = 0; i < hierValueList.length; i++) {
                    var values = tab.JsonUtil.toJson(hierValueList[i], false, '');
                    markValues.push(values);
                }
                commandParameters['api.hierarchicalMarkValues'] = tab.JsonUtil.toJson(markValues, false, '');
            }
            if (!tab._Utility.isNullOrEmpty(rangeNameList) && !tab._Utility.isNullOrEmpty(rangeValueList)) {
                commandParameters['api.rangeFieldCaption'] = tab.JsonUtil.toJson(rangeNameList, false, '');
                var markValues = [];
                for (var i = 0; i < rangeValueList.length; i++) {
                    var values = tab.JsonUtil.toJson(rangeValueList[i], false, '');
                    markValues.push(values);
                }
                commandParameters['api.rangeMarkValues'] = tab.JsonUtil.toJson(markValues, false, '');
            }
            if (tab._Utility.isNullOrEmpty(commandParameters['api.tupleIds']) && tab._Utility.isNullOrEmpty(commandParameters['api.categoricalFieldCaption']) && tab._Utility.isNullOrEmpty(commandParameters['api.hierarchicalFieldCaption']) && tab._Utility.isNullOrEmpty(commandParameters['api.rangeFieldCaption'])) {
                throw tab._TableauException.createInvalidParameter('fieldNameOrFieldValuesMap');
            }
            var deferred = new tab._Deferred();
            var returnHandler = new tab._CommandReturnHandler('api.SelectMarksCommand', 1, function(result) {
                var error = tab._WorksheetImpl._createSelectionCommandError$1(result);
                if (error == null) {
                    deferred.resolve();
                } else {
                    deferred.reject(error);
                }
            }, function(remoteError, message) {
                deferred.reject(tab._TableauException.createServerError(message));
            });
            this.sendCommand(commandParameters, returnHandler);
            return deferred.get_promise();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.JsonUtil

    tab.JsonUtil = function tab_JsonUtil() {}
    tab.JsonUtil.parseJson = function tab_JsonUtil$parseJson(jsonValue) {
        return tab._jQueryShim.parseJSON(jsonValue);
    }
    tab.JsonUtil.toJson = function tab_JsonUtil$toJson(it, pretty, indentStr) {
        pretty = (pretty || false);
        indentStr = (indentStr || '');
        var stack = [];
        return tab.JsonUtil._serialize(it, pretty, indentStr, stack);
    }
    tab.JsonUtil._indexOf = function tab_JsonUtil$_indexOf(array, searchElement, fromIndex) {
        if (ss.isValue((Array).prototype['indexOf'])) {
            return array.indexOf(searchElement, fromIndex);
        }
        fromIndex = (fromIndex || 0);
        var length = array.length;
        if (length > 0) {
            for (var index = fromIndex; index < length; index++) {
                if (array[index] === searchElement) {
                    return index;
                }
            }
        }
        return -1;
    }
    tab.JsonUtil._contains = function tab_JsonUtil$_contains(array, searchElement, fromIndex) {
        var index = tab.JsonUtil._indexOf(array, searchElement, fromIndex);
        return index >= 0;
    }
    tab.JsonUtil._serialize = function tab_JsonUtil$_serialize(it, pretty, indentStr, stack) {
        if (tab.JsonUtil._contains(stack, it)) {
            throw Error.createError('The object contains recursive reference of sub-objects', null);
        }
        if (ss.isUndefined(it)) {
            return 'undefined';
        }
        if (it == null) {
            return 'null';
        }
        var objtype = tab._jQueryShim.type(it);
        if (objtype === 'number' || objtype === 'boolean') {
            return it.toString();
        }
        if (objtype === 'string') {
            return tab.JsonUtil._escapeString(it);
        }
        stack.push(it);
        var newObj;
        indentStr = (indentStr || '');
        var nextIndent = (pretty) ? indentStr + '\t' : '';
        var tf = (it.__json__ || it.json);
        if (tab._jQueryShim.isFunction(tf)) {
            var jsonCallback = tf;
            newObj = jsonCallback(it);
            if (it !== newObj) {
                var res = tab.JsonUtil._serialize(newObj, pretty, nextIndent, stack);
                stack.pop();
                return res;
            }
        }
        if (ss.isValue(it.nodeType) && ss.isValue(it.cloneNode)) {
            throw Error.createError("Can't serialize DOM nodes", null);
        }
        var separator = (pretty) ? ' ' : '';
        var newLine = (pretty) ? '\n' : '';
        if (tab._jQueryShim.isArray(it)) {
            return tab.JsonUtil._serializeArray(it, pretty, indentStr, stack, nextIndent, newLine);
        }
        if (objtype === 'function') {
            stack.pop();
            return null;
        }
        return tab.JsonUtil._serializeGeneric(it, pretty, indentStr, stack, nextIndent, newLine, separator);
    }
    tab.JsonUtil._serializeGeneric = function tab_JsonUtil$_serializeGeneric(it, pretty, indentStr, stack, nextIndent, newLine, separator) {
        var d = it;
        var bdr = new ss.StringBuilder('{');
        var init = false;
        var $dict1 = d;
        for (var $key2 in $dict1) {
            var e = { key: $key2, value: $dict1[$key2] };
            var keyStr;
            var val;
            if (typeof(e.key) === 'number') {
                keyStr = '"' + e.key + '"';
            } else if (typeof(e.key) === 'string') {
                keyStr = tab.JsonUtil._escapeString(e.key);
            } else {
                continue;
            }
            val = tab.JsonUtil._serialize(e.value, pretty, nextIndent, stack);
            if (val == null) {
                continue;
            }
            if (init) {
                bdr.append(',');
            }
            bdr.append(newLine + nextIndent + keyStr + ':' + separator + val);
            init = true;
        }
        bdr.append(newLine + indentStr + '}');
        stack.pop();
        return bdr.toString();
    }
    tab.JsonUtil._serializeArray = function tab_JsonUtil$_serializeArray(it, pretty, indentStr, stack, nextIndent, newLine) {
        var initialized = false;
        var sb = new ss.StringBuilder('[');
        var a = it;
        for (var i = 0; i < a.length; i++) {
            var o = a[i];
            var s = tab.JsonUtil._serialize(o, pretty, nextIndent, stack);
            if (s == null) {
                s = 'undefined';
            }
            if (initialized) {
                sb.append(',');
            }
            sb.append(newLine + nextIndent + s);
            initialized = true;
        }
        sb.append(newLine + indentStr + ']');
        stack.pop();
        return sb.toString();
    }
    tab.JsonUtil._escapeString = function tab_JsonUtil$_escapeString(str) {
        str = ('"' + str.replace(/(["\\])/g, '\\$1') + '"');
        str = str.replace(new RegExp('[\u000c]', 'g'), '\\f');
        str = str.replace(new RegExp('[\u0008]', 'g'), '\\b');
        str = str.replace(new RegExp('[\n]', 'g'), '\\n');
        str = str.replace(new RegExp('[\t]', 'g'), '\\t');
        str = str.replace(new RegExp('[\r]', 'g'), '\\r');
        return str;
    }


    Type.registerNamespace('tableauSoftware');

    ////////////////////////////////////////////////////////////////////////////////
    // tab.DataValue

    tab.$create_DataValue = function tab_DataValue(value, formattedValue, aliasedValue) {
        var $o = {};
        $o.value = value;
        if (tab._Utility.isNullOrEmpty(aliasedValue)) {
            $o.formattedValue = formattedValue;
        } else {
            $o.formattedValue = aliasedValue;
        }
        return $o;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.VizSize

    tab.$create_VizSize = function tab_VizSize(sheetSize, chromeHeight) {
        var $o = {};
        $o.sheetSize = sheetSize;
        $o.chromeHeight = chromeHeight;
        return $o;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.Point

    tab.$create_Point = function tab_Point(x, y) {
        var $o = {};
        $o.x = x;
        $o.y = y;
        return $o;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.Size

    tab.$create_Size = function tab_Size(width, height) {
        var $o = {};
        $o.width = width;
        $o.height = height;
        return $o;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.SheetSize

    tab.$create_SheetSize = function tab_SheetSize(behavior, minSize, maxSize) {
        var $o = {};
        $o.behavior = (behavior || 'automatic');
        if (ss.isValue(minSize)) {
            $o.minSize = minSize;
        }
        if (ss.isValue(maxSize)) {
            $o.maxSize = maxSize;
        }
        return $o;
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.CustomView

    tableauSoftware.CustomView = function tableauSoftware_CustomView(customViewImpl) {
        this._impl = customViewImpl;
    }
    tableauSoftware.CustomView.prototype = {
        _impl: null,

        getWorkbook: function tableauSoftware_CustomView$getWorkbook() {
            return this._impl.get__workbook();
        },

        getUrl: function tableauSoftware_CustomView$getUrl() {
            return this._impl.get__url();
        },

        getName: function tableauSoftware_CustomView$getName() {
            return this._impl.get__name();
        },

        setName: function tableauSoftware_CustomView$setName(value) {
            this._impl.set__name(value);
        },

        getOwnerName: function tableauSoftware_CustomView$getOwnerName() {
            return this._impl.get__ownerName();
        },

        getAdvertised: function tableauSoftware_CustomView$getAdvertised() {
            return this._impl.get__advertised();
        },

        setAdvertised: function tableauSoftware_CustomView$setAdvertised(value) {
            this._impl.set__advertised(value);
        },

        getDefault: function tableauSoftware_CustomView$getDefault() {
            return this._impl.get__isDefault();
        },

        saveAsync: function tableauSoftware_CustomView$saveAsync() {
            return this._impl.saveAsync();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.CustomViewEvent

    tab.CustomViewEvent = function tab_CustomViewEvent(eventName, viz, customViewImpl) {
        tab.CustomViewEvent.initializeBase(this, [eventName, viz]);
        this._context$1 = new tab._customViewEventContext(viz._impl.get__workbookImpl(), customViewImpl);
    }
    tab.CustomViewEvent.prototype = {
        _context$1: null,

        getCustomViewAsync: function tab_CustomViewEvent$getCustomViewAsync() {
            var deferred = new tab._Deferred();
            var customView = null;
            if (ss.isValue(this._context$1.get__customViewImpl())) {
                customView = this._context$1.get__customViewImpl().get__customView();
            }
            deferred.resolve(customView);
            return deferred.get_promise();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._customViewEventContext

    tab._customViewEventContext = function tab__customViewEventContext(workbook, customViewImpl) {
        tab._customViewEventContext.initializeBase(this, [workbook, null]);
        this._customViewImpl$1 = customViewImpl;
    }
    tab._customViewEventContext.prototype = {
        _customViewImpl$1: null,

        get__customViewImpl: function tab__customViewEventContext$get__customViewImpl() {
            return this._customViewImpl$1;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.Dashboard

    tableauSoftware.Dashboard = function tableauSoftware_Dashboard(dashboardImpl) {
        tableauSoftware.Dashboard.initializeBase(this, [dashboardImpl]);
    }
    tableauSoftware.Dashboard.prototype = {
        _impl: null,

        getParentStoryPoint: function tableauSoftware_Dashboard$getParentStoryPoint() {
            return this._impl.get_parentStoryPoint();
        },

        getObjects: function tableauSoftware_Dashboard$getObjects() {
            return this._impl.get_objects()._toApiCollection();
        },

        getWorksheets: function tableauSoftware_Dashboard$getWorksheets() {
            return this._impl.get_worksheets()._toApiCollection();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.DashboardObject

    tableauSoftware.DashboardObject = function tableauSoftware_DashboardObject(frameInfo, dashboard, worksheet) {
        if (frameInfo._objectType === 'worksheet' && ss.isNullOrUndefined(worksheet)) {
            throw tab._TableauException.createInternalError('worksheet parameter is required for WORKSHEET objects');
        } else if (frameInfo._objectType !== 'worksheet' && ss.isValue(worksheet)) {
            throw tab._TableauException.createInternalError('worksheet parameter should be undefined for non-WORKSHEET objects');
        }
        this._zoneInfo = frameInfo;
        this._dashboard = dashboard;
        this._worksheet = worksheet;
    }
    tableauSoftware.DashboardObject.prototype = {
        _zoneInfo: null,
        _dashboard: null,
        _worksheet: null,

        getObjectType: function tableauSoftware_DashboardObject$getObjectType() {
            return this._zoneInfo._objectType;
        },

        getDashboard: function tableauSoftware_DashboardObject$getDashboard() {
            return this._dashboard;
        },

        getWorksheet: function tableauSoftware_DashboardObject$getWorksheet() {
            return this._worksheet;
        },

        getPosition: function tableauSoftware_DashboardObject$getPosition() {
            return this._zoneInfo._position;
        },

        getSize: function tableauSoftware_DashboardObject$getSize() {
            return this._zoneInfo._size;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.DataSource

    tableauSoftware.DataSource = function tableauSoftware_DataSource(impl) {
        this._impl = impl;
    }
    tableauSoftware.DataSource.prototype = {
        _impl: null,

        getName: function tableauSoftware_DataSource$getName() {
            return this._impl.get_name();
        },

        getFields: function tableauSoftware_DataSource$getFields() {
            return this._impl.get_fields()._toApiCollection();
        },

        getIsPrimary: function tableauSoftware_DataSource$getIsPrimary() {
            return this._impl.get_isPrimary();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.Field

    tableauSoftware.Field = function tableauSoftware_Field(dataSource, name, fieldRoleType, fieldAggrType) {
        this._dataSource = dataSource;
        this._name = name;
        this._fieldRoleType = fieldRoleType;
        this._fieldAggrType = fieldAggrType;
    }
    tableauSoftware.Field.prototype = {
        _dataSource: null,
        _name: null,
        _fieldRoleType: null,
        _fieldAggrType: null,

        getDataSource: function tableauSoftware_Field$getDataSource() {
            return this._dataSource;
        },

        getName: function tableauSoftware_Field$getName() {
            return this._name;
        },

        getRole: function tableauSoftware_Field$getRole() {
            return this._fieldRoleType;
        },

        getAggregation: function tableauSoftware_Field$getAggregation() {
            return this._fieldAggrType;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.CategoricalFilter

    tableauSoftware.CategoricalFilter = function tableauSoftware_CategoricalFilter(worksheetImpl, pm) {
        tableauSoftware.CategoricalFilter.initializeBase(this, [worksheetImpl, pm]);
        this._initializeFromJson$1(pm);
    }
    tableauSoftware.CategoricalFilter.prototype = {
        _isExclude$1: false,
        _appliedValues$1: null,

        getIsExcludeMode: function tableauSoftware_CategoricalFilter$getIsExcludeMode() {
            return this._isExclude$1;
        },

        getAppliedValues: function tableauSoftware_CategoricalFilter$getAppliedValues() {
            return this._appliedValues$1;
        },

        _updateFromJson: function tableauSoftware_CategoricalFilter$_updateFromJson(pm) {
            this._initializeFromJson$1(pm);
        },

        _initializeFromJson$1: function tableauSoftware_CategoricalFilter$_initializeFromJson$1(pm) {
            this._isExclude$1 = pm.isExclude;
            if (ss.isValue(pm.appliedValues)) {
                this._appliedValues$1 = [];
                var $enum1 = ss.IEnumerator.getEnumerator(pm.appliedValues);
                while ($enum1.moveNext()) {
                    var v = $enum1.current;
                    this._appliedValues$1.push(tab._Utility.getDataValue(v));
                }
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.Filter

    tableauSoftware.Filter = function tableauSoftware_Filter(worksheetImpl, pm) {
        this._worksheetImpl = worksheetImpl;
        this._initializeFromJson(pm);
    }
    tableauSoftware.Filter._createFilter = function tableauSoftware_Filter$_createFilter(worksheetImpl, pm) {
        switch (pm.filterType) {
            case 'categorical':
                return new tableauSoftware.CategoricalFilter(worksheetImpl, pm);
            case 'relativedate':
                return new tableauSoftware.RelativeDateFilter(worksheetImpl, pm);
            case 'hierarchical':
                return new tableauSoftware.HierarchicalFilter(worksheetImpl, pm);
            case 'quantitative':
                return new tableauSoftware.QuantitativeFilter(worksheetImpl, pm);
        }
        return null;
    }
    tableauSoftware.Filter._processFiltersList = function tableauSoftware_Filter$_processFiltersList(worksheetImpl, filtersListDict) {
        var filters = new tab._Collection();
        var $enum1 = ss.IEnumerator.getEnumerator(filtersListDict.filters);
        while ($enum1.moveNext()) {
            var filterPm = $enum1.current;
            var filter = tableauSoftware.Filter._createFilter(worksheetImpl, filterPm);
            filters._add(filterPm.caption, filter);
        }
        return filters;
    }
    tableauSoftware.Filter.prototype = {
        _worksheetImpl: null,
        _type: null,
        _caption: null,
        _field: null,
        _dataSourceName: null,
        _fieldRole: null,
        _fieldAggregation: null,

        getFilterType: function tableauSoftware_Filter$getFilterType() {
            return this._type;
        },

        getFieldName: function tableauSoftware_Filter$getFieldName() {
            return this._caption;
        },

        getWorksheet: function tableauSoftware_Filter$getWorksheet() {
            return this._worksheetImpl.get_worksheet();
        },

        getFieldAsync: function tableauSoftware_Filter$getFieldAsync() {
            var deferred = new tab._Deferred();
            if (this._field == null) {
                var rejected = function(e) {
                    deferred.reject(e);
                    return null;
                };
                var fulfilled = ss.Delegate.create(this, function(value) {
                    this._field = new tableauSoftware.Field(value, this._caption, this._fieldRole, this._fieldAggregation);
                    deferred.resolve(this._field);
                    return null;
                });
                this._worksheetImpl._getDataSourceAsync(this._dataSourceName).then(fulfilled, rejected);
            } else {
                window.setTimeout(ss.Delegate.create(this, function() {
                    deferred.resolve(this._field);
                }), 0);
            }
            return deferred.get_promise();
        },

        _update: function tableauSoftware_Filter$_update(pm) {
            this._initializeFromJson(pm);
            this._updateFromJson(pm);
        },

        _addFieldParams: function tableauSoftware_Filter$_addFieldParams(param) {},

        _initializeFromJson: function tableauSoftware_Filter$_initializeFromJson(pm) {
            this._caption = pm.caption;
            this._type = pm.filterType;
            this._field = null;
            this._dataSourceName = pm.dataSourceName;
            this._fieldRole = (pm.fieldRole || 0);
            this._fieldAggregation = (pm.fieldAggregation || 0);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.FilterEvent

    tab.FilterEvent = function tab_FilterEvent(eventName, viz, worksheetImpl, fieldName, filterCaption) {
        tab.FilterEvent.initializeBase(this, [eventName, viz, worksheetImpl]);
        this._filterCaption$2 = filterCaption;
        this._context$2 = new tab._filterEventContext(viz._impl.get__workbookImpl(), worksheetImpl, fieldName, filterCaption);
    }
    tab.FilterEvent.prototype = {
        _filterCaption$2: null,
        _context$2: null,

        getFieldName: function tab_FilterEvent$getFieldName() {
            return this._filterCaption$2;
        },

        getFilterAsync: function tab_FilterEvent$getFilterAsync() {
            return this._context$2.get__worksheetImpl()._getFilterAsync(this._context$2.get__filterFieldName(), null, null);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._filterEventContext

    tab._filterEventContext = function tab__filterEventContext(workbookImpl, worksheetImpl, fieldFieldName, filterCaption) {
        tab._filterEventContext.initializeBase(this, [workbookImpl, worksheetImpl]);
        this._fieldFieldName$1 = fieldFieldName;
        this._filterCaption$1 = filterCaption;
    }
    tab._filterEventContext.prototype = {
        _fieldFieldName$1: null,
        _filterCaption$1: null,

        get__filterFieldName: function tab__filterEventContext$get__filterFieldName() {
            return this._fieldFieldName$1;
        },

        get__filterCaption: function tab__filterEventContext$get__filterCaption() {
            return this._filterCaption$1;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.HierarchicalFilter

    tableauSoftware.HierarchicalFilter = function tableauSoftware_HierarchicalFilter(worksheetImpl, pm) {
        tableauSoftware.HierarchicalFilter.initializeBase(this, [worksheetImpl, pm]);
        this._initializeFromJson$1(pm);
    }
    tableauSoftware.HierarchicalFilter.prototype = {
        _levels$1: 0,

        _addFieldParams: function tableauSoftware_HierarchicalFilter$_addFieldParams(param) {
            param['api.filterHierarchicalLevels'] = this._levels$1;
        },

        _updateFromJson: function tableauSoftware_HierarchicalFilter$_updateFromJson(pm) {
            this._initializeFromJson$1(pm);
        },

        _initializeFromJson$1: function tableauSoftware_HierarchicalFilter$_initializeFromJson$1(pm) {
            this._levels$1 = pm.levels;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.QuantitativeFilter

    tableauSoftware.QuantitativeFilter = function tableauSoftware_QuantitativeFilter(worksheetImpl, pm) {
        tableauSoftware.QuantitativeFilter.initializeBase(this, [worksheetImpl, pm]);
        this._initializeFromJson$1(pm);
    }
    tableauSoftware.QuantitativeFilter.prototype = {
        _domainMin$1: null,
        _domainMax$1: null,
        _min$1: null,
        _max$1: null,
        _includeNullValues$1: false,

        getMin: function tableauSoftware_QuantitativeFilter$getMin() {
            return this._min$1;
        },

        getMax: function tableauSoftware_QuantitativeFilter$getMax() {
            return this._max$1;
        },

        getIncludeNullValues: function tableauSoftware_QuantitativeFilter$getIncludeNullValues() {
            return this._includeNullValues$1;
        },

        getDomainMin: function tableauSoftware_QuantitativeFilter$getDomainMin() {
            return this._domainMin$1;
        },

        getDomainMax: function tableauSoftware_QuantitativeFilter$getDomainMax() {
            return this._domainMax$1;
        },

        _updateFromJson: function tableauSoftware_QuantitativeFilter$_updateFromJson(pm) {
            this._initializeFromJson$1(pm);
        },

        _initializeFromJson$1: function tableauSoftware_QuantitativeFilter$_initializeFromJson$1(pm) {
            this._domainMin$1 = tab._Utility.getDataValue(pm.domainMinValue);
            this._domainMax$1 = tab._Utility.getDataValue(pm.domainMaxValue);
            this._min$1 = tab._Utility.getDataValue(pm.minValue);
            this._max$1 = tab._Utility.getDataValue(pm.maxValue);
            this._includeNullValues$1 = pm.includeNullValues;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.RelativeDateFilter

    tableauSoftware.RelativeDateFilter = function tableauSoftware_RelativeDateFilter(worksheetImpl, pm) {
        tableauSoftware.RelativeDateFilter.initializeBase(this, [worksheetImpl, pm]);
        this._initializeFromJson$1(pm);
    }
    tableauSoftware.RelativeDateFilter.prototype = {
        _periodType$1: null,
        _rangeType$1: null,
        _rangeN$1: 0,

        getPeriod: function tableauSoftware_RelativeDateFilter$getPeriod() {
            return this._periodType$1;
        },

        getRange: function tableauSoftware_RelativeDateFilter$getRange() {
            return this._rangeType$1;
        },

        getRangeN: function tableauSoftware_RelativeDateFilter$getRangeN() {
            return this._rangeN$1;
        },

        _updateFromJson: function tableauSoftware_RelativeDateFilter$_updateFromJson(pm) {
            this._initializeFromJson$1(pm);
        },

        _initializeFromJson$1: function tableauSoftware_RelativeDateFilter$_initializeFromJson$1(pm) {
            if (ss.isValue(pm.periodType)) {
                this._periodType$1 = tab._enums._normalizePeriodType(pm.periodType, 'periodType');
            }
            if (ss.isValue(pm.rangeType)) {
                this._rangeType$1 = tab._enums._normalizeDateRangeType(pm.rangeType, 'rangeType');
            }
            if (ss.isValue(pm.rangeN)) {
                this._rangeN$1 = pm.rangeN;
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.FirstVizSizeKnownEvent

    tab.FirstVizSizeKnownEvent = function tab_FirstVizSizeKnownEvent(eventName, viz, vizSize) {
        tab.FirstVizSizeKnownEvent.initializeBase(this, [eventName, viz]);
        this._vizSize$1 = vizSize;
    }
    tab.FirstVizSizeKnownEvent.prototype = {
        _vizSize$1: null,

        getVizSize: function tab_FirstVizSizeKnownEvent$getVizSize() {
            return this._vizSize$1;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.Version

    tableauSoftware.Version = function tableauSoftware_Version(major, minor, patch, metadata) {
        this._major = major;
        this._minor = minor;
        this._patch = patch;
        this._metadata = metadata || null;
    }
    tableauSoftware.Version.getCurrent = function tableauSoftware_Version$getCurrent() {
        return tableauSoftware.Version._currentVersion;
    }
    tableauSoftware.Version.prototype = {
        _major: 0,
        _minor: 0,
        _patch: 0,
        _metadata: null,

        getMajor: function tableauSoftware_Version$getMajor() {
            return this._major;
        },

        getMinor: function tableauSoftware_Version$getMinor() {
            return this._minor;
        },

        getPatch: function tableauSoftware_Version$getPatch() {
            return this._patch;
        },

        getMetadata: function tableauSoftware_Version$getMetadata() {
            return this._metadata;
        },

        toString: function tableauSoftware_Version$toString() {
            var version = this._major + '.' + this._minor + '.' + this._patch;
            if (ss.isValue(this._metadata) && this._metadata.length > 0) {
                version += '-' + this._metadata;
            }
            return version;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.VizResizeEvent

    tab.VizResizeEvent = function tab_VizResizeEvent(eventName, viz, availableSize) {
        tab.VizResizeEvent.initializeBase(this, [eventName, viz]);
        this._availableSize$1 = availableSize;
    }
    tab.VizResizeEvent.prototype = {
        _availableSize$1: null,

        getAvailableSize: function tab_VizResizeEvent$getAvailableSize() {
            return this._availableSize$1;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.Mark

    tableauSoftware.Mark = function tableauSoftware_Mark(tupleId) {
        this._impl = new tab._markImpl(tupleId);
    }
    tableauSoftware.Mark.prototype = {
        _impl: null,

        getPairs: function tableauSoftware_Mark$getPairs() {
            return this._impl.get__clonedPairs();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.MarksEvent

    tab.MarksEvent = function tab_MarksEvent(eventName, viz, worksheetImpl) {
        tab.MarksEvent.initializeBase(this, [eventName, viz, worksheetImpl]);
        this._context$2 = new tab._marksEventContext(viz._impl.get__workbookImpl(), worksheetImpl);
    }
    tab.MarksEvent.prototype = {
        _context$2: null,

        getMarksAsync: function tab_MarksEvent$getMarksAsync() {
            var worksheetImpl = this._context$2.get__worksheetImpl();
            if (ss.isValue(worksheetImpl.get_selectedMarks())) {
                var deferred = new tab._Deferred();
                return deferred.resolve(worksheetImpl.get_selectedMarks()._toApiCollection());
            }
            return worksheetImpl._getSelectedMarksAsync();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._marksEventContext

    tab._marksEventContext = function tab__marksEventContext(workbookImpl, worksheetImpl) {
        tab._marksEventContext.initializeBase(this, [workbookImpl, worksheetImpl]);
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.Pair

    tableauSoftware.Pair = function tableauSoftware_Pair(fieldName, value) {
        this.fieldName = fieldName;
        this.value = value;
        this.formattedValue = (ss.isValue(value)) ? value.toString() : '';
    }
    tableauSoftware.Pair.prototype = {
        fieldName: null,
        value: null,
        formattedValue: null
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.Parameter

    tableauSoftware.Parameter = function tableauSoftware_Parameter(impl) {
        this._impl = impl;
    }
    tableauSoftware.Parameter.prototype = {
        _impl: null,

        getName: function tableauSoftware_Parameter$getName() {
            return this._impl.get__name();
        },

        getCurrentValue: function tableauSoftware_Parameter$getCurrentValue() {
            return this._impl.get__currentValue();
        },

        getDataType: function tableauSoftware_Parameter$getDataType() {
            return this._impl.get__dataType();
        },

        getAllowableValuesType: function tableauSoftware_Parameter$getAllowableValuesType() {
            return this._impl.get__allowableValuesType();
        },

        getAllowableValues: function tableauSoftware_Parameter$getAllowableValues() {
            return this._impl.get__allowableValues();
        },

        getMinValue: function tableauSoftware_Parameter$getMinValue() {
            return this._impl.get__minValue();
        },

        getMaxValue: function tableauSoftware_Parameter$getMaxValue() {
            return this._impl.get__maxValue();
        },

        getStepSize: function tableauSoftware_Parameter$getStepSize() {
            return this._impl.get__stepSize();
        },

        getDateStepPeriod: function tableauSoftware_Parameter$getDateStepPeriod() {
            return this._impl.get__dateStepPeriod();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.ParameterEvent

    tab.ParameterEvent = function tab_ParameterEvent(eventName, viz, parameterName) {
        tab.ParameterEvent.initializeBase(this, [eventName, viz]);
        this._context$1 = new tab._parameterEventContext(viz._impl.get__workbookImpl(), parameterName);
    }
    tab.ParameterEvent.prototype = {
        _context$1: null,

        getParameterName: function tab_ParameterEvent$getParameterName() {
            return this._context$1.get__parameterName();
        },

        getParameterAsync: function tab_ParameterEvent$getParameterAsync() {
            return this._context$1.get__workbookImpl()._getSingleParameterAsync(this._context$1.get__parameterName());
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._parameterEventContext

    tab._parameterEventContext = function tab__parameterEventContext(workbookImpl, parameterName) {
        tab._parameterEventContext.initializeBase(this, [workbookImpl, null]);
        this._parameterName$1 = parameterName;
    }
    tab._parameterEventContext.prototype = {
        _parameterName$1: null,

        get__parameterName: function tab__parameterEventContext$get__parameterName() {
            return this._parameterName$1;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.Sheet

    tableauSoftware.Sheet = function tableauSoftware_Sheet(sheetImpl) {
        tab._Param.verifyValue(sheetImpl, 'sheetImpl');
        this._impl = sheetImpl;
    }
    tableauSoftware.Sheet.prototype = {
        _impl: null,

        getName: function tableauSoftware_Sheet$getName() {
            return this._impl.get_name();
        },

        getIndex: function tableauSoftware_Sheet$getIndex() {
            return this._impl.get_index();
        },

        getWorkbook: function tableauSoftware_Sheet$getWorkbook() {
            return this._impl.get_workbookImpl().get_workbook();
        },

        getSize: function tableauSoftware_Sheet$getSize() {
            return this._impl.get_size();
        },

        getIsHidden: function tableauSoftware_Sheet$getIsHidden() {
            return this._impl.get_isHidden();
        },

        getIsActive: function tableauSoftware_Sheet$getIsActive() {
            return this._impl.get_isActive();
        },

        getSheetType: function tableauSoftware_Sheet$getSheetType() {
            return this._impl.get_sheetType();
        },

        getUrl: function tableauSoftware_Sheet$getUrl() {
            return this._impl.get_url();
        },

        changeSizeAsync: function tableauSoftware_Sheet$changeSizeAsync(size) {
            return this._impl.changeSizeAsync(size);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.SheetInfo

    tableauSoftware.SheetInfo = function tableauSoftware_SheetInfo(impl) {
        this._impl = impl;
    }
    tableauSoftware.SheetInfo.prototype = {
        _impl: null,

        getName: function tableauSoftware_SheetInfo$getName() {
            return this._impl.name;
        },

        getSheetType: function tableauSoftware_SheetInfo$getSheetType() {
            return this._impl.sheetType;
        },

        getSize: function tableauSoftware_SheetInfo$getSize() {
            return this._impl.size;
        },

        getIndex: function tableauSoftware_SheetInfo$getIndex() {
            return this._impl.index;
        },

        getUrl: function tableauSoftware_SheetInfo$getUrl() {
            return this._impl.url;
        },

        getIsActive: function tableauSoftware_SheetInfo$getIsActive() {
            return this._impl.isActive;
        },

        getIsHidden: function tableauSoftware_SheetInfo$getIsHidden() {
            return this._impl.isHidden;
        },

        getWorkbook: function tableauSoftware_SheetInfo$getWorkbook() {
            return this._impl.workbook;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.SheetSizeFactory

    tab.SheetSizeFactory = function tab_SheetSizeFactory() {}
    tab.SheetSizeFactory.createAutomatic = function tab_SheetSizeFactory$createAutomatic() {
        var size = tab.$create_SheetSize('automatic', null, null);
        return size;
    }
    tab.SheetSizeFactory.fromSizeConstraints = function tab_SheetSizeFactory$fromSizeConstraints(vizSizePresModel) {
        var minHeight = vizSizePresModel.minHeight;
        var minWidth = vizSizePresModel.minWidth;
        var maxHeight = vizSizePresModel.maxHeight;
        var maxWidth = vizSizePresModel.maxWidth;
        var behavior = 'automatic';
        var minSize = null;
        var maxSize = null;
        if (!minHeight && !minWidth) {
            if (!maxHeight && !maxWidth) {} else {
                behavior = 'atmost';
                maxSize = tab.$create_Size(maxWidth, maxHeight);
            }
        } else if (!maxHeight && !maxWidth) {
            behavior = 'atleast';
            minSize = tab.$create_Size(minWidth, minHeight);
        } else if (maxHeight === minHeight && maxWidth === minWidth) {
            behavior = 'exactly';
            minSize = tab.$create_Size(minWidth, minHeight);
            maxSize = tab.$create_Size(minWidth, minHeight);
        } else {
            behavior = 'range';
            minSize = tab.$create_Size(minWidth, minHeight);
            maxSize = tab.$create_Size(maxWidth, maxHeight);
        }
        return tab.$create_SheetSize(behavior, minSize, maxSize);
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.Story

    tableauSoftware.Story = function tableauSoftware_Story(storyImpl) {
        tableauSoftware.Story.initializeBase(this, [storyImpl]);
    }
    tableauSoftware.Story.prototype = {
        _impl: null,

        getActiveStoryPoint: function tableauSoftware_Story$getActiveStoryPoint() {
            return this._impl.get_activeStoryPointImpl().get_storyPoint();
        },

        getStoryPointsInfo: function tableauSoftware_Story$getStoryPointsInfo() {
            return this._impl.get_storyPointsInfo();
        },

        activatePreviousStoryPointAsync: function tableauSoftware_Story$activatePreviousStoryPointAsync() {
            return this._impl.activatePreviousStoryPointAsync();
        },

        activateNextStoryPointAsync: function tableauSoftware_Story$activateNextStoryPointAsync() {
            return this._impl.activateNextStoryPointAsync();
        },

        activateStoryPointAsync: function tableauSoftware_Story$activateStoryPointAsync(index) {
            return this._impl.activateStoryPointAsync(index);
        },

        revertStoryPointAsync: function tableauSoftware_Story$revertStoryPointAsync(index) {
            return this._impl.revertStoryPointAsync(index);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.StoryPoint

    tableauSoftware.StoryPoint = function tableauSoftware_StoryPoint(impl) {
        this._impl = impl;
    }
    tableauSoftware.StoryPoint.prototype = {
        _impl: null,

        getCaption: function tableauSoftware_StoryPoint$getCaption() {
            return this._impl.get_caption();
        },

        getContainedSheet: function tableauSoftware_StoryPoint$getContainedSheet() {
            return (ss.isValue(this._impl.get_containedSheetImpl())) ? this._impl.get_containedSheetImpl().get_sheet() : null;
        },

        getIndex: function tableauSoftware_StoryPoint$getIndex() {
            return this._impl.get_index();
        },

        getIsActive: function tableauSoftware_StoryPoint$getIsActive() {
            return this._impl.get_isActive();
        },

        getIsUpdated: function tableauSoftware_StoryPoint$getIsUpdated() {
            return this._impl.get_isUpdated();
        },

        getParentStory: function tableauSoftware_StoryPoint$getParentStory() {
            return this._impl.get_parentStoryImpl().get_story();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.StoryPointInfo

    tableauSoftware.StoryPointInfo = function tableauSoftware_StoryPointInfo(impl) {
        this._impl = impl;
    }
    tableauSoftware.StoryPointInfo.prototype = {
        _impl: null,

        getCaption: function tableauSoftware_StoryPointInfo$getCaption() {
            return this._impl.caption;
        },

        getIndex: function tableauSoftware_StoryPointInfo$getIndex() {
            return this._impl.index;
        },

        getIsActive: function tableauSoftware_StoryPointInfo$getIsActive() {
            return this._impl.isActive;
        },

        getIsUpdated: function tableauSoftware_StoryPointInfo$getIsUpdated() {
            return this._impl.isUpdated;
        },

        getParentStory: function tableauSoftware_StoryPointInfo$getParentStory() {
            return this._impl.parentStoryImpl.get_story();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.StoryPointSwitchEvent

    tab.StoryPointSwitchEvent = function tab_StoryPointSwitchEvent(eventName, viz, oldStoryPointInfo, newStoryPoint) {
        tab.StoryPointSwitchEvent.initializeBase(this, [eventName, viz]);
        this._oldStoryPointInfo$1 = oldStoryPointInfo;
        this._newStoryPoint$1 = newStoryPoint;
    }
    tab.StoryPointSwitchEvent.prototype = {
        _oldStoryPointInfo$1: null,
        _newStoryPoint$1: null,

        getOldStoryPointInfo: function tab_StoryPointSwitchEvent$getOldStoryPointInfo() {
            return this._oldStoryPointInfo$1;
        },

        getNewStoryPoint: function tab_StoryPointSwitchEvent$getNewStoryPoint() {
            return this._newStoryPoint$1;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.TableauEvent

    tab.TableauEvent = function tab_TableauEvent(eventName, viz) {
        this._viz = viz;
        this._eventName = eventName;
    }
    tab.TableauEvent.prototype = {
        _viz: null,
        _eventName: null,

        getViz: function tab_TableauEvent$getViz() {
            return this._viz;
        },

        getEventName: function tab_TableauEvent$getEventName() {
            return this._eventName;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.EventContext

    tab.EventContext = function tab_EventContext(workbookImpl, worksheetImpl) {
        this._workbookImpl = workbookImpl;
        this._worksheetImpl = worksheetImpl;
    }
    tab.EventContext.prototype = {
        _workbookImpl: null,
        _worksheetImpl: null,

        get__workbookImpl: function tab_EventContext$get__workbookImpl() {
            return this._workbookImpl;
        },

        get__worksheetImpl: function tab_EventContext$get__worksheetImpl() {
            return this._worksheetImpl;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.TabSwitchEvent

    tab.TabSwitchEvent = function tab_TabSwitchEvent(eventName, viz, oldName, newName) {
        tab.TabSwitchEvent.initializeBase(this, [eventName, viz]);
        this._oldName$1 = oldName;
        this._newName$1 = newName;
    }
    tab.TabSwitchEvent.prototype = {
        _oldName$1: null,
        _newName$1: null,

        getOldSheetName: function tab_TabSwitchEvent$getOldSheetName() {
            return this._oldName$1;
        },

        getNewSheetName: function tab_TabSwitchEvent$getNewSheetName() {
            return this._newName$1;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.Viz

    tableauSoftware.Viz = function tableauSoftware_Viz(parentElement, url, options) {
        var messageRouter = tab._ApiObjectRegistry.getCrossDomainMessageRouter();
        this._impl = new tab.VizImpl(messageRouter, this, parentElement, url, options);
        this._impl._create();
    }
    tableauSoftware.Viz.getLastRequestMessage = function tableauSoftware_Viz$getLastRequestMessage() {
        return tab._ApiCommand.lastRequestMessage;
    }
    tableauSoftware.Viz.getLastResponseMessage = function tableauSoftware_Viz$getLastResponseMessage() {
        return tab._ApiCommand.lastResponseMessage;
    }
    tableauSoftware.Viz.getLastClientInfoResponseMessage = function tableauSoftware_Viz$getLastClientInfoResponseMessage() {
        return tab._ApiCommand.lastClientInfoResponseMessage;
    }
    tableauSoftware.Viz.prototype = {
        _impl: null,

        getAreTabsHidden: function tableauSoftware_Viz$getAreTabsHidden() {
            return this._impl.get__areTabsHidden();
        },

        getIsToolbarHidden: function tableauSoftware_Viz$getIsToolbarHidden() {
            return this._impl.get__isToolbarHidden();
        },

        getIsHidden: function tableauSoftware_Viz$getIsHidden() {
            return this._impl.get__isHidden();
        },

        getInstanceId: function tableauSoftware_Viz$getInstanceId() {
            return this._impl.get_instanceId();
        },

        getParentElement: function tableauSoftware_Viz$getParentElement() {
            return this._impl.get__parentElement();
        },

        getUrl: function tableauSoftware_Viz$getUrl() {
            return this._impl.get__url();
        },

        getVizSize: function tableauSoftware_Viz$getVizSize() {
            return this._impl.get__vizSize();
        },

        getWorkbook: function tableauSoftware_Viz$getWorkbook() {
            return this._impl.get__workbook();
        },

        getAreAutomaticUpdatesPaused: function tableauSoftware_Viz$getAreAutomaticUpdatesPaused() {
            return this._impl.get__areAutomaticUpdatesPaused();
        },

        getCurrentUrlAsync: function tableauSoftware_Viz$getCurrentUrlAsync() {
            return this._impl.getCurrentUrlAsync();
        },

        addEventListener: function tableauSoftware_Viz$addEventListener(eventName, handler) {
            this._impl.addEventListener(eventName, handler);
        },

        removeEventListener: function tableauSoftware_Viz$removeEventListener(eventName, handler) {
            this._impl.removeEventListener(eventName, handler);
        },

        dispose: function tableauSoftware_Viz$dispose() {
            this._impl._dispose();
        },

        show: function tableauSoftware_Viz$show() {
            this._impl._show();
        },

        hide: function tableauSoftware_Viz$hide() {
            this._impl._hide();
        },

        showExportDataDialog: function tableauSoftware_Viz$showExportDataDialog(worksheetWithinDashboard) {
            this._impl._showExportDataDialog(worksheetWithinDashboard);
        },

        showExportCrossTabDialog: function tableauSoftware_Viz$showExportCrossTabDialog(worksheetWithinDashboard) {
            this._impl._showExportCrossTabDialog(worksheetWithinDashboard);
        },

        showExportImageDialog: function tableauSoftware_Viz$showExportImageDialog() {
            this._impl._showExportImageDialog();
        },

        showExportPDFDialog: function tableauSoftware_Viz$showExportPDFDialog() {
            this._impl._showExportPDFDialog();
        },

        revertAllAsync: function tableauSoftware_Viz$revertAllAsync() {
            return this._impl._revertAllAsync();
        },

        refreshDataAsync: function tableauSoftware_Viz$refreshDataAsync() {
            return this._impl._refreshDataAsync();
        },

        showShareDialog: function tableauSoftware_Viz$showShareDialog() {
            this._impl._showShareDialog();
        },

        showDownloadWorkbookDialog: function tableauSoftware_Viz$showDownloadWorkbookDialog() {
            this._impl._showDownloadWorkbookDialog();
        },

        pauseAutomaticUpdatesAsync: function tableauSoftware_Viz$pauseAutomaticUpdatesAsync() {
            return this._impl._pauseAutomaticUpdatesAsync();
        },

        resumeAutomaticUpdatesAsync: function tableauSoftware_Viz$resumeAutomaticUpdatesAsync() {
            return this._impl._resumeAutomaticUpdatesAsync();
        },

        toggleAutomaticUpdatesAsync: function tableauSoftware_Viz$toggleAutomaticUpdatesAsync() {
            return this._impl._toggleAutomaticUpdatesAsync();
        },

        refreshSize: function tableauSoftware_Viz$refreshSize() {
            this._impl._refreshSize();
        },

        setFrameSize: function tableauSoftware_Viz$setFrameSize(width, height) {
            var widthString = width;
            var heightString = height;
            if (tab._Utility.isNumber(width)) {
                widthString = width + 'px';
            }
            if (tab._Utility.isNumber(height)) {
                heightString = height + 'px';
            }
            this._impl._setFrameSizeAndUpdate(widthString, heightString);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.VizManager

    tableauSoftware.VizManager = function tableauSoftware_VizManager() {}
    tableauSoftware.VizManager.getVizs = function tableauSoftware_VizManager$getVizs() {
        return tab._VizManagerImpl.get__clonedVizs();
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.Workbook

    tableauSoftware.Workbook = function tableauSoftware_Workbook(workbookImpl) {
        this._workbookImpl = workbookImpl;
    }
    tableauSoftware.Workbook.prototype = {
        _workbookImpl: null,

        getViz: function tableauSoftware_Workbook$getViz() {
            return this._workbookImpl.get_viz();
        },

        getPublishedSheetsInfo: function tableauSoftware_Workbook$getPublishedSheetsInfo() {
            return this._workbookImpl.get_publishedSheets()._toApiCollection();
        },

        getName: function tableauSoftware_Workbook$getName() {
            return this._workbookImpl.get_name();
        },

        getActiveSheet: function tableauSoftware_Workbook$getActiveSheet() {
            return this._workbookImpl.get_activeSheetImpl().get_sheet();
        },

        getActiveCustomView: function tableauSoftware_Workbook$getActiveCustomView() {
            return this._workbookImpl.get_activeCustomView();
        },

        activateSheetAsync: function tableauSoftware_Workbook$activateSheetAsync(sheetNameOrIndex) {
            return this._workbookImpl._setActiveSheetAsync(sheetNameOrIndex);
        },

        revertAllAsync: function tableauSoftware_Workbook$revertAllAsync() {
            return this._workbookImpl._revertAllAsync();
        },

        getCustomViewsAsync: function tableauSoftware_Workbook$getCustomViewsAsync() {
            return this._workbookImpl._getCustomViewsAsync();
        },

        showCustomViewAsync: function tableauSoftware_Workbook$showCustomViewAsync(customViewName) {
            return this._workbookImpl._showCustomViewAsync(customViewName);
        },

        removeCustomViewAsync: function tableauSoftware_Workbook$removeCustomViewAsync(customViewName) {
            return this._workbookImpl._removeCustomViewAsync(customViewName);
        },

        rememberCustomViewAsync: function tableauSoftware_Workbook$rememberCustomViewAsync(customViewName) {
            return this._workbookImpl._rememberCustomViewAsync(customViewName);
        },

        setActiveCustomViewAsDefaultAsync: function tableauSoftware_Workbook$setActiveCustomViewAsDefaultAsync() {
            return this._workbookImpl._setActiveCustomViewAsDefaultAsync();
        },

        getParametersAsync: function tableauSoftware_Workbook$getParametersAsync() {
            return this._workbookImpl._getParametersAsync();
        },

        changeParameterValueAsync: function tableauSoftware_Workbook$changeParameterValueAsync(parameterName, value) {
            return this._workbookImpl._changeParameterValueAsync(parameterName, value);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tableauSoftware.Worksheet

    tableauSoftware.Worksheet = function tableauSoftware_Worksheet(impl) {
        tableauSoftware.Worksheet.initializeBase(this, [impl]);
    }
    tableauSoftware.Worksheet.prototype = {
        _impl: null,

        getParentDashboard: function tableauSoftware_Worksheet$getParentDashboard() {
            return this._impl.get_parentDashboard();
        },

        getParentStoryPoint: function tableauSoftware_Worksheet$getParentStoryPoint() {
            return this._impl.get_parentStoryPoint();
        },

        getDataSourcesAsync: function tableauSoftware_Worksheet$getDataSourcesAsync() {
            return this._impl._getDataSourcesAsync();
        },

        getFilterAsync: function tableauSoftware_Worksheet$getFilterAsync(fieldName, options) {
            return this._impl._getFilterAsync(null, fieldName, options);
        },

        getFiltersAsync: function tableauSoftware_Worksheet$getFiltersAsync(options) {
            return this._impl._getFiltersAsync(options);
        },

        applyFilterAsync: function tableauSoftware_Worksheet$applyFilterAsync(fieldName, values, updateType, options) {
            return this._impl._applyFilterAsync(fieldName, values, updateType, options);
        },

        clearFilterAsync: function tableauSoftware_Worksheet$clearFilterAsync(fieldName) {
            return this._impl._clearFilterAsync(fieldName);
        },

        applyRangeFilterAsync: function tableauSoftware_Worksheet$applyRangeFilterAsync(fieldName, options) {
            return this._impl._applyRangeFilterAsync(fieldName, options);
        },

        applyRelativeDateFilterAsync: function tableauSoftware_Worksheet$applyRelativeDateFilterAsync(fieldName, options) {
            return this._impl._applyRelativeDateFilterAsync(fieldName, options);
        },

        applyHierarchicalFilterAsync: function tableauSoftware_Worksheet$applyHierarchicalFilterAsync(fieldName, values, updateType, options) {
            return this._impl._applyHierarchicalFilterAsync(fieldName, values, updateType, options);
        },

        clearSelectedMarksAsync: function tableauSoftware_Worksheet$clearSelectedMarksAsync() {
            return this._impl._clearSelectedMarksAsync();
        },

        selectMarksAsync: function tableauSoftware_Worksheet$selectMarksAsync(fieldNameOrFieldValuesMap, valueOrUpdateType, updateType) {
            return this._impl._selectMarksAsync(fieldNameOrFieldValuesMap, valueOrUpdateType, updateType);
        },

        getSelectedMarksAsync: function tableauSoftware_Worksheet$getSelectedMarksAsync() {
            return this._impl._getSelectedMarksAsync();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab.WorksheetEvent

    tab.WorksheetEvent = function tab_WorksheetEvent(eventName, viz, worksheetImpl) {
        tab.WorksheetEvent.initializeBase(this, [eventName, viz]);
        this._worksheetImpl$1 = worksheetImpl;
    }
    tab.WorksheetEvent.prototype = {
        _worksheetImpl$1: null,

        getWorksheet: function tab_WorksheetEvent$getWorksheet() {
            return this._worksheetImpl$1.get_worksheet();
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    // tab._jQueryShim

    tab._jQueryShim = function tab__jQueryShim() {}
    tab._jQueryShim.isFunction = function tab__jQueryShim$isFunction(obj) {
        return tab._jQueryShim.type(obj) === 'function';
    }
    tab._jQueryShim.isArray = function tab__jQueryShim$isArray(obj) {
        if (ss.isValue(Array.isArray)) {
            return Array.isArray(obj);
        }
        return tab._jQueryShim.type(obj) === 'array';
    }
    tab._jQueryShim.type = function tab__jQueryShim$type(obj) {
        return (obj == null) ? String(obj) : (tab._jQueryShim._class2type[tab._jQueryShim._toString.call(obj)] || 'object');
    }
    tab._jQueryShim.trim = function tab__jQueryShim$trim(text) {
        if (ss.isValue(tab._jQueryShim._trim)) {
            return (text == null) ? '' : tab._jQueryShim._trim.call(text);
        }
        return (text == null) ? '' : text.replace(tab._jQueryShim._trimLeft, '').replace(tab._jQueryShim._trimRight, '');
    }
    tab._jQueryShim.parseJSON = function tab__jQueryShim$parseJSON(data) {
        if (typeof(data) !== 'string' || ss.isNullOrUndefined(data)) {
            return null;
        }
        data = tab._jQueryShim.trim(data);
        if (window.JSON && window.JSON.parse) {
            return window.JSON.parse(data);
        }
        if (tab._jQueryShim._rvalidchars.test(data.replace(tab._jQueryShim._rvalidescape, '@').replace(tab._jQueryShim._rvalidtokens, ']').replace(tab._jQueryShim._rvalidbraces, ''))) {
            return (new Function("return " + data))();
        }
        throw new Error('Invalid JSON: ' + data);
    }


    tab._ApiCommand.registerClass('tab._ApiCommand');
    tab._ApiServerResultParser.registerClass('tab._ApiServerResultParser');
    tab._ApiServerNotification.registerClass('tab._ApiServerNotification');
    tab._CommandReturnHandler.registerClass('tab._CommandReturnHandler');
    tab._crossDomainMessageRouter.registerClass('tab._crossDomainMessageRouter', null, tab.ICrossDomainMessageRouter);
    tab._doNothingCrossDomainHandler.registerClass('tab._doNothingCrossDomainHandler', null, tab.ICrossDomainMessageHandler);
    tab.CrossDomainMessagingOptions.registerClass('tab.CrossDomainMessagingOptions');
    tab._enums.registerClass('tab._enums');
    tab._ApiBootstrap.registerClass('tab._ApiBootstrap');
    tab._ApiObjectRegistry.registerClass('tab._ApiObjectRegistry');
    tab._CustomViewImpl.registerClass('tab._CustomViewImpl');
    tab._SheetImpl.registerClass('tab._SheetImpl');
    tab._DashboardImpl.registerClass('tab._DashboardImpl', tab._SheetImpl);
    tab._DataSourceImpl.registerClass('tab._DataSourceImpl');
    tab._deferredUtil.registerClass('tab._deferredUtil');
    tab._CollectionImpl.registerClass('tab._CollectionImpl');
    tab._DeferredImpl.registerClass('tab._DeferredImpl');
    tab._PromiseImpl.registerClass('tab._PromiseImpl');
    tab._markImpl.registerClass('tab._markImpl');
    tab._Param.registerClass('tab._Param');
    tab._parameterImpl.registerClass('tab._parameterImpl');
    tab._StoryImpl.registerClass('tab._StoryImpl', tab._SheetImpl);
    tab._StoryPointImpl.registerClass('tab._StoryPointImpl');
    tab.StoryPointInfoImplUtil.registerClass('tab.StoryPointInfoImplUtil');
    tab._TableauException.registerClass('tab._TableauException');
    tab._Utility.registerClass('tab._Utility');
    tab.VizImpl.registerClass('tab.VizImpl', null, tab.ICrossDomainMessageHandler);
    tab._VizManagerImpl.registerClass('tab._VizManagerImpl');
    tab._VizParameters.registerClass('tab._VizParameters');
    tab._WorkbookImpl.registerClass('tab._WorkbookImpl');
    tab._WorksheetImpl.registerClass('tab._WorksheetImpl', tab._SheetImpl);
    tab.JsonUtil.registerClass('tab.JsonUtil');
    tableauSoftware.CustomView.registerClass('tableauSoftware.CustomView');
    tab.TableauEvent.registerClass('tab.TableauEvent');
    tab.CustomViewEvent.registerClass('tab.CustomViewEvent', tab.TableauEvent);
    tab.EventContext.registerClass('tab.EventContext');
    tab._customViewEventContext.registerClass('tab._customViewEventContext', tab.EventContext);
    tableauSoftware.Sheet.registerClass('tableauSoftware.Sheet');
    tableauSoftware.Dashboard.registerClass('tableauSoftware.Dashboard', tableauSoftware.Sheet);
    tableauSoftware.DashboardObject.registerClass('tableauSoftware.DashboardObject');
    tableauSoftware.DataSource.registerClass('tableauSoftware.DataSource');
    tableauSoftware.Field.registerClass('tableauSoftware.Field');
    tableauSoftware.Filter.registerClass('tableauSoftware.Filter');
    tableauSoftware.CategoricalFilter.registerClass('tableauSoftware.CategoricalFilter', tableauSoftware.Filter);
    tab.WorksheetEvent.registerClass('tab.WorksheetEvent', tab.TableauEvent);
    tab.FilterEvent.registerClass('tab.FilterEvent', tab.WorksheetEvent);
    tab._filterEventContext.registerClass('tab._filterEventContext', tab.EventContext);
    tableauSoftware.HierarchicalFilter.registerClass('tableauSoftware.HierarchicalFilter', tableauSoftware.Filter);
    tableauSoftware.QuantitativeFilter.registerClass('tableauSoftware.QuantitativeFilter', tableauSoftware.Filter);
    tableauSoftware.RelativeDateFilter.registerClass('tableauSoftware.RelativeDateFilter', tableauSoftware.Filter);
    tab.FirstVizSizeKnownEvent.registerClass('tab.FirstVizSizeKnownEvent', tab.TableauEvent);
    tableauSoftware.Version.registerClass('tableauSoftware.Version');
    tab.VizResizeEvent.registerClass('tab.VizResizeEvent', tab.TableauEvent);
    tableauSoftware.Mark.registerClass('tableauSoftware.Mark');
    tab.MarksEvent.registerClass('tab.MarksEvent', tab.WorksheetEvent);
    tab._marksEventContext.registerClass('tab._marksEventContext', tab.EventContext);
    tableauSoftware.Pair.registerClass('tableauSoftware.Pair');
    tableauSoftware.Parameter.registerClass('tableauSoftware.Parameter');
    tab.ParameterEvent.registerClass('tab.ParameterEvent', tab.TableauEvent);
    tab._parameterEventContext.registerClass('tab._parameterEventContext', tab.EventContext);
    tableauSoftware.SheetInfo.registerClass('tableauSoftware.SheetInfo');
    tab.SheetSizeFactory.registerClass('tab.SheetSizeFactory');
    tableauSoftware.Story.registerClass('tableauSoftware.Story', tableauSoftware.Sheet);
    tableauSoftware.StoryPoint.registerClass('tableauSoftware.StoryPoint');
    tableauSoftware.StoryPointInfo.registerClass('tableauSoftware.StoryPointInfo');
    tab.StoryPointSwitchEvent.registerClass('tab.StoryPointSwitchEvent', tab.TableauEvent);
    tab.TabSwitchEvent.registerClass('tab.TabSwitchEvent', tab.TableauEvent);
    tableauSoftware.Viz.registerClass('tableauSoftware.Viz');
    tableauSoftware.VizManager.registerClass('tableauSoftware.VizManager');
    tableauSoftware.Workbook.registerClass('tableauSoftware.Workbook');
    tableauSoftware.Worksheet.registerClass('tableauSoftware.Worksheet', tableauSoftware.Sheet);
    tab._jQueryShim.registerClass('tab._jQueryShim');
    tab._ApiCommand.crossDomainEventNotificationId = 'xdomainSourceId';
    tab._ApiCommand.lastRequestMessage = null;
    tab._ApiCommand.lastResponseMessage = null;
    tab._ApiCommand.lastClientInfoResponseMessage = null;
    tab._ApiObjectRegistry._creationRegistry = null;
    tab._ApiObjectRegistry._singletonInstanceRegistry = null;
    tab._SheetImpl.noZoneId = 4294967295;
    tab._VizManagerImpl._vizs = [];
    tab._WorksheetImpl._regexHierarchicalFieldName$1 = new RegExp('\\[[^\\]]+\\]\\.', 'g');
    tableauSoftware.Version._currentVersion = new tableauSoftware.Version(2, 0, 0, null);
    tab._jQueryShim._class2type = { '[object Boolean]': 'boolean', '[object Number]': 'number', '[object String]': 'string', '[object Function]': 'function', '[object Array]': 'array', '[object Date]': 'date', '[object RegExp]': 'regexp', '[object Object]': 'object' };
    tab._jQueryShim._trim = String.prototype.trim;
    tab._jQueryShim._toString = Object.prototype.toString;
    tab._jQueryShim._trimLeft = new RegExp('^[\\s\\xA0]+');
    tab._jQueryShim._trimRight = new RegExp('[\\s\\xA0]+$');
    tab._jQueryShim._rvalidchars = new RegExp('^[\\],:{}\\s]*$');
    tab._jQueryShim._rvalidescape = new RegExp('\\\\(?:["\\\\\\/bfnrt]|u[0-9a-fA-F]{4})', 'g');
    tab._jQueryShim._rvalidtokens = new RegExp('"[^"\\\\\\n\\r]*"|true|false|null|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?', 'g');
    tab._jQueryShim._rvalidbraces = new RegExp('(?:^|:|,)(?:\\s*\\[)+', 'g');

    tableauSoftware.Promise = tab._PromiseImpl;
    tab._Deferred = tab._DeferredImpl;
    tab._Collection = tab._CollectionImpl;

    ////////////////////////////////////////////////////////////////////////////////
    // Enums
    ////////////////////////////////////////////////////////////////////////////////

    tableauSoftware.DashboardObjectType = {
        BLANK: 'blank',
        WORKSHEET: 'worksheet',
        QUICK_FILTER: 'quickFilter',
        PARAMETER_CONTROL: 'parameterControl',
        PAGE_FILTER: 'pageFilter',
        LEGEND: 'legend',
        TITLE: 'title',
        TEXT: 'text',
        IMAGE: 'image',
        WEB_PAGE: 'webPage'
    };

    tableauSoftware.FilterType = {
        CATEGORICAL: 'categorical',
        QUANTITATIVE: 'quantitative',
        HIERARCHICAL: 'hierarchical',
        RELATIVEDATE: 'relativedate'
    };

    tableauSoftware.ParameterDataType = {
        FLOAT: 'float',
        INTEGER: 'integer',
        STRING: 'string',
        BOOLEAN: 'boolean',
        DATE: 'date',
        DATETIME: 'datetime'
    };

    tableauSoftware.ParameterAllowableValuesType = {
        ALL: 'all',
        LIST: 'list',
        RANGE: 'range'
    };

    tableauSoftware.PeriodType = {
        YEAR: 'year',
        QUARTER: 'quarter',
        MONTH: 'month',
        WEEK: 'week',
        DAY: 'day',
        HOUR: 'hour',
        MINUTE: 'minute',
        SECOND: 'second'
    };

    tableauSoftware.DateRangeType = {
        LAST: 'last',
        LASTN: 'lastn',
        NEXT: 'next',
        NEXTN: 'nextn',
        CURR: 'curr',
        TODATE: 'todate'
    };

    tableauSoftware.SheetSizeBehavior = {
        AUTOMATIC: 'automatic',
        EXACTLY: 'exactly',
        RANGE: 'range',
        ATLEAST: 'atleast',
        ATMOST: 'atmost'
    };

    tableauSoftware.SheetType = {
        WORKSHEET: 'worksheet',
        DASHBOARD: 'dashboard',
        STORY: 'story'
    };

    tableauSoftware.FilterUpdateType = {
        ALL: 'all',
        REPLACE: 'replace',
        ADD: 'add',
        REMOVE: 'remove'
    };

    tableauSoftware.SelectionUpdateType = {
        REPLACE: 'replace',
        ADD: 'add',
        REMOVE: 'remove'
    };

    tableauSoftware.NullOption = {
        NULL_VALUES: 'nullValues',
        NON_NULL_VALUES: 'nonNullValues',
        ALL_VALUES: 'allValues'
    };

    tableauSoftware.ErrorCode = {
        INTERNAL_ERROR: 'internalError',
        SERVER_ERROR: 'serverError',
        INVALID_AGGREGATION_FIELD_NAME: 'invalidAggregationFieldName',
        INVALID_PARAMETER: 'invalidParameter',
        INVALID_URL: 'invalidUrl',
        STALE_DATA_REFERENCE: 'staleDataReference',
        VIZ_ALREADY_IN_MANAGER: 'vizAlreadyInManager',
        NO_URL_OR_PARENT_ELEMENT_NOT_FOUND: 'noUrlOrParentElementNotFound',
        INVALID_FILTER_FIELDNAME: 'invalidFilterFieldName',
        INVALID_FILTER_FIELDVALUE: 'invalidFilterFieldValue',
        INVALID_FILTER_FIELDNAME_OR_VALUE: 'invalidFilterFieldNameOrValue',
        FILTER_CANNOT_BE_PERFORMED: 'filterCannotBePerformed',
        NOT_ACTIVE_SHEET: 'notActiveSheet',
        INVALID_CUSTOM_VIEW_NAME: 'invalidCustomViewName',
        MISSING_RANGEN_FOR_RELATIVE_DATE_FILTERS: 'missingRangeNForRelativeDateFilters',
        MISSING_MAX_SIZE: 'missingMaxSize',
        MISSING_MIN_SIZE: 'missingMinSize',
        MISSING_MINMAX_SIZE: 'missingMinMaxSize',
        INVALID_SIZE: 'invalidSize',
        INVALID_SIZE_BEHAVIOR_ON_WORKSHEET: 'invalidSizeBehaviorOnWorksheet',
        SHEET_NOT_IN_WORKBOOK: 'sheetNotInWorkbook',
        INDEX_OUT_OF_RANGE: 'indexOutOfRange',
        DOWNLOAD_WORKBOOK_NOT_ALLOWED: 'downloadWorkbookNotAllowed',
        NULL_OR_EMPTY_PARAMETER: 'nullOrEmptyParameter',
        BROWSER_NOT_CAPABLE: 'browserNotCapable',
        UNSUPPORTED_EVENT_NAME: 'unsupportedEventName',
        INVALID_DATE_PARAMETER: 'invalidDateParameter',
        INVALID_SELECTION_FIELDNAME: 'invalidSelectionFieldName',
        INVALID_SELECTION_VALUE: 'invalidSelectionValue',
        INVALID_SELECTION_DATE: 'invalidSelectionDate',
        NO_URL_FOR_HIDDEN_WORKSHEET: 'noUrlForHiddenWorksheet',
        MAX_VIZ_RESIZE_ATTEMPTS: 'maxVizResizeAttempts'
    };

    tableauSoftware.TableauEventName = {
        CUSTOM_VIEW_LOAD: 'customviewload',
        CUSTOM_VIEW_REMOVE: 'customviewremove',
        CUSTOM_VIEW_SAVE: 'customviewsave',
        CUSTOM_VIEW_SET_DEFAULT: 'customviewsetdefault',
        FILTER_CHANGE: 'filterchange',
        FIRST_INTERACTIVE: 'firstinteractive',
        FIRST_VIZ_SIZE_KNOWN: 'firstvizsizeknown',
        MARKS_SELECTION: 'marksselection',
        PARAMETER_VALUE_CHANGE: 'parametervaluechange',
        STORY_POINT_SWITCH: 'storypointswitch',
        TAB_SWITCH: 'tabswitch',
        VIZ_RESIZE: 'vizresize'
    };

    tableauSoftware.FieldRoleType = {
        DIMENSION: 'dimension',
        MEASURE: 'measure',
        UNKNOWN: 'unknown'
    };

    tableauSoftware.FieldAggregationType = {
        SUM: 'SUM',
        AVG: 'AVG',
        MIN: 'MIN',
        MAX: 'MAX',
        STDEV: 'STDEV',
        STDEVP: 'STDEVP',
        VAR: 'VAR',
        VARP: 'VARP',
        COUNT: 'COUNT',
        COUNTD: 'COUNTD',
        MEDIAN: 'MEDIAN',
        ATTR: 'ATTR',
        NONE: 'NONE',
        PERCENTILE: 'PERCENTILE',
        YEAR: 'YEAR',
        QTR: 'QTR',
        MONTH: 'MONTH',
        DAY: 'DAY',
        HOUR: 'HOUR',
        MINUTE: 'MINUTE',
        SECOND: 'SECOND',
        WEEK: 'WEEK',
        WEEKDAY: 'WEEKDAY',
        MONTHYEAR: 'MONTHYEAR',
        MDY: 'MDY',
        END: 'END',
        TRUNC_YEAR: 'TRUNC_YEAR',
        TRUNC_QTR: 'TRUNC_QTR',
        TRUNC_MONTH: 'TRUNC_MONTH',
        TRUNC_WEEK: 'TRUNC_WEEK',
        TRUNC_DAY: 'TRUNC_DAY',
        TRUNC_HOUR: 'TRUNC_HOUR',
        TRUNC_MINUTE: 'TRUNC_MINUTE',
        TRUNC_SECOND: 'TRUNC_SECOND',
        QUART1: 'QUART1',
        QUART3: 'QUART3',
        SKEWNESS: 'SKEWNESS',
        KURTOSIS: 'KURTOSIS',
        INOUT: 'INOUT',
        SUM_XSQR: 'SUM_XSQR',
        USER: 'USER'
    };

    tableauSoftware.ToolbarPosition = {
        TOP: 'top',
        BOTTOM: 'bottom'
    };

    ////////////////////////////////////////////////////////////////////////////////
    // API Initialization
    ////////////////////////////////////////////////////////////////////////////////

    // Clean up the mscorlib stuff.
    restoreTypeSystem();

    tab._ApiBootstrap.initialize();
})();