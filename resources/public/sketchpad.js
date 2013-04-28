var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__35786 = x == null ? null : x;
  if(p[goog.typeOf(x__35786)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__35787__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__35787 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__35787__delegate.call(this, array, i, idxs)
    };
    G__35787.cljs$lang$maxFixedArity = 2;
    G__35787.cljs$lang$applyTo = function(arglist__35788) {
      var array = cljs.core.first(arglist__35788);
      var i = cljs.core.first(cljs.core.next(arglist__35788));
      var idxs = cljs.core.rest(cljs.core.next(arglist__35788));
      return G__35787__delegate(array, i, idxs)
    };
    G__35787.cljs$lang$arity$variadic = G__35787__delegate;
    return G__35787
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____35873 = this$;
      if(and__3822__auto____35873) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____35873
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2418__auto____35874 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35875 = cljs.core._invoke[goog.typeOf(x__2418__auto____35874)];
        if(or__3824__auto____35875) {
          return or__3824__auto____35875
        }else {
          var or__3824__auto____35876 = cljs.core._invoke["_"];
          if(or__3824__auto____35876) {
            return or__3824__auto____35876
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____35877 = this$;
      if(and__3822__auto____35877) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____35877
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2418__auto____35878 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35879 = cljs.core._invoke[goog.typeOf(x__2418__auto____35878)];
        if(or__3824__auto____35879) {
          return or__3824__auto____35879
        }else {
          var or__3824__auto____35880 = cljs.core._invoke["_"];
          if(or__3824__auto____35880) {
            return or__3824__auto____35880
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____35881 = this$;
      if(and__3822__auto____35881) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____35881
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2418__auto____35882 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35883 = cljs.core._invoke[goog.typeOf(x__2418__auto____35882)];
        if(or__3824__auto____35883) {
          return or__3824__auto____35883
        }else {
          var or__3824__auto____35884 = cljs.core._invoke["_"];
          if(or__3824__auto____35884) {
            return or__3824__auto____35884
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____35885 = this$;
      if(and__3822__auto____35885) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____35885
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2418__auto____35886 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35887 = cljs.core._invoke[goog.typeOf(x__2418__auto____35886)];
        if(or__3824__auto____35887) {
          return or__3824__auto____35887
        }else {
          var or__3824__auto____35888 = cljs.core._invoke["_"];
          if(or__3824__auto____35888) {
            return or__3824__auto____35888
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____35889 = this$;
      if(and__3822__auto____35889) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____35889
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2418__auto____35890 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35891 = cljs.core._invoke[goog.typeOf(x__2418__auto____35890)];
        if(or__3824__auto____35891) {
          return or__3824__auto____35891
        }else {
          var or__3824__auto____35892 = cljs.core._invoke["_"];
          if(or__3824__auto____35892) {
            return or__3824__auto____35892
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____35893 = this$;
      if(and__3822__auto____35893) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____35893
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2418__auto____35894 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35895 = cljs.core._invoke[goog.typeOf(x__2418__auto____35894)];
        if(or__3824__auto____35895) {
          return or__3824__auto____35895
        }else {
          var or__3824__auto____35896 = cljs.core._invoke["_"];
          if(or__3824__auto____35896) {
            return or__3824__auto____35896
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____35897 = this$;
      if(and__3822__auto____35897) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____35897
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2418__auto____35898 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35899 = cljs.core._invoke[goog.typeOf(x__2418__auto____35898)];
        if(or__3824__auto____35899) {
          return or__3824__auto____35899
        }else {
          var or__3824__auto____35900 = cljs.core._invoke["_"];
          if(or__3824__auto____35900) {
            return or__3824__auto____35900
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____35901 = this$;
      if(and__3822__auto____35901) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____35901
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2418__auto____35902 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35903 = cljs.core._invoke[goog.typeOf(x__2418__auto____35902)];
        if(or__3824__auto____35903) {
          return or__3824__auto____35903
        }else {
          var or__3824__auto____35904 = cljs.core._invoke["_"];
          if(or__3824__auto____35904) {
            return or__3824__auto____35904
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____35905 = this$;
      if(and__3822__auto____35905) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____35905
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2418__auto____35906 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35907 = cljs.core._invoke[goog.typeOf(x__2418__auto____35906)];
        if(or__3824__auto____35907) {
          return or__3824__auto____35907
        }else {
          var or__3824__auto____35908 = cljs.core._invoke["_"];
          if(or__3824__auto____35908) {
            return or__3824__auto____35908
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____35909 = this$;
      if(and__3822__auto____35909) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____35909
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2418__auto____35910 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35911 = cljs.core._invoke[goog.typeOf(x__2418__auto____35910)];
        if(or__3824__auto____35911) {
          return or__3824__auto____35911
        }else {
          var or__3824__auto____35912 = cljs.core._invoke["_"];
          if(or__3824__auto____35912) {
            return or__3824__auto____35912
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____35913 = this$;
      if(and__3822__auto____35913) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____35913
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2418__auto____35914 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35915 = cljs.core._invoke[goog.typeOf(x__2418__auto____35914)];
        if(or__3824__auto____35915) {
          return or__3824__auto____35915
        }else {
          var or__3824__auto____35916 = cljs.core._invoke["_"];
          if(or__3824__auto____35916) {
            return or__3824__auto____35916
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____35917 = this$;
      if(and__3822__auto____35917) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____35917
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2418__auto____35918 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35919 = cljs.core._invoke[goog.typeOf(x__2418__auto____35918)];
        if(or__3824__auto____35919) {
          return or__3824__auto____35919
        }else {
          var or__3824__auto____35920 = cljs.core._invoke["_"];
          if(or__3824__auto____35920) {
            return or__3824__auto____35920
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____35921 = this$;
      if(and__3822__auto____35921) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____35921
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2418__auto____35922 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35923 = cljs.core._invoke[goog.typeOf(x__2418__auto____35922)];
        if(or__3824__auto____35923) {
          return or__3824__auto____35923
        }else {
          var or__3824__auto____35924 = cljs.core._invoke["_"];
          if(or__3824__auto____35924) {
            return or__3824__auto____35924
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____35925 = this$;
      if(and__3822__auto____35925) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____35925
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2418__auto____35926 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35927 = cljs.core._invoke[goog.typeOf(x__2418__auto____35926)];
        if(or__3824__auto____35927) {
          return or__3824__auto____35927
        }else {
          var or__3824__auto____35928 = cljs.core._invoke["_"];
          if(or__3824__auto____35928) {
            return or__3824__auto____35928
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____35929 = this$;
      if(and__3822__auto____35929) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____35929
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2418__auto____35930 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35931 = cljs.core._invoke[goog.typeOf(x__2418__auto____35930)];
        if(or__3824__auto____35931) {
          return or__3824__auto____35931
        }else {
          var or__3824__auto____35932 = cljs.core._invoke["_"];
          if(or__3824__auto____35932) {
            return or__3824__auto____35932
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____35933 = this$;
      if(and__3822__auto____35933) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____35933
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2418__auto____35934 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35935 = cljs.core._invoke[goog.typeOf(x__2418__auto____35934)];
        if(or__3824__auto____35935) {
          return or__3824__auto____35935
        }else {
          var or__3824__auto____35936 = cljs.core._invoke["_"];
          if(or__3824__auto____35936) {
            return or__3824__auto____35936
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____35937 = this$;
      if(and__3822__auto____35937) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____35937
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2418__auto____35938 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35939 = cljs.core._invoke[goog.typeOf(x__2418__auto____35938)];
        if(or__3824__auto____35939) {
          return or__3824__auto____35939
        }else {
          var or__3824__auto____35940 = cljs.core._invoke["_"];
          if(or__3824__auto____35940) {
            return or__3824__auto____35940
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____35941 = this$;
      if(and__3822__auto____35941) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____35941
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2418__auto____35942 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35943 = cljs.core._invoke[goog.typeOf(x__2418__auto____35942)];
        if(or__3824__auto____35943) {
          return or__3824__auto____35943
        }else {
          var or__3824__auto____35944 = cljs.core._invoke["_"];
          if(or__3824__auto____35944) {
            return or__3824__auto____35944
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____35945 = this$;
      if(and__3822__auto____35945) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____35945
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2418__auto____35946 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35947 = cljs.core._invoke[goog.typeOf(x__2418__auto____35946)];
        if(or__3824__auto____35947) {
          return or__3824__auto____35947
        }else {
          var or__3824__auto____35948 = cljs.core._invoke["_"];
          if(or__3824__auto____35948) {
            return or__3824__auto____35948
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____35949 = this$;
      if(and__3822__auto____35949) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____35949
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2418__auto____35950 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35951 = cljs.core._invoke[goog.typeOf(x__2418__auto____35950)];
        if(or__3824__auto____35951) {
          return or__3824__auto____35951
        }else {
          var or__3824__auto____35952 = cljs.core._invoke["_"];
          if(or__3824__auto____35952) {
            return or__3824__auto____35952
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____35953 = this$;
      if(and__3822__auto____35953) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____35953
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2418__auto____35954 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____35955 = cljs.core._invoke[goog.typeOf(x__2418__auto____35954)];
        if(or__3824__auto____35955) {
          return or__3824__auto____35955
        }else {
          var or__3824__auto____35956 = cljs.core._invoke["_"];
          if(or__3824__auto____35956) {
            return or__3824__auto____35956
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____35961 = coll;
    if(and__3822__auto____35961) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____35961
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2418__auto____35962 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____35963 = cljs.core._count[goog.typeOf(x__2418__auto____35962)];
      if(or__3824__auto____35963) {
        return or__3824__auto____35963
      }else {
        var or__3824__auto____35964 = cljs.core._count["_"];
        if(or__3824__auto____35964) {
          return or__3824__auto____35964
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____35969 = coll;
    if(and__3822__auto____35969) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____35969
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2418__auto____35970 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____35971 = cljs.core._empty[goog.typeOf(x__2418__auto____35970)];
      if(or__3824__auto____35971) {
        return or__3824__auto____35971
      }else {
        var or__3824__auto____35972 = cljs.core._empty["_"];
        if(or__3824__auto____35972) {
          return or__3824__auto____35972
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____35977 = coll;
    if(and__3822__auto____35977) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____35977
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2418__auto____35978 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____35979 = cljs.core._conj[goog.typeOf(x__2418__auto____35978)];
      if(or__3824__auto____35979) {
        return or__3824__auto____35979
      }else {
        var or__3824__auto____35980 = cljs.core._conj["_"];
        if(or__3824__auto____35980) {
          return or__3824__auto____35980
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____35989 = coll;
      if(and__3822__auto____35989) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____35989
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2418__auto____35990 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____35991 = cljs.core._nth[goog.typeOf(x__2418__auto____35990)];
        if(or__3824__auto____35991) {
          return or__3824__auto____35991
        }else {
          var or__3824__auto____35992 = cljs.core._nth["_"];
          if(or__3824__auto____35992) {
            return or__3824__auto____35992
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____35993 = coll;
      if(and__3822__auto____35993) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____35993
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2418__auto____35994 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____35995 = cljs.core._nth[goog.typeOf(x__2418__auto____35994)];
        if(or__3824__auto____35995) {
          return or__3824__auto____35995
        }else {
          var or__3824__auto____35996 = cljs.core._nth["_"];
          if(or__3824__auto____35996) {
            return or__3824__auto____35996
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____36001 = coll;
    if(and__3822__auto____36001) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____36001
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2418__auto____36002 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36003 = cljs.core._first[goog.typeOf(x__2418__auto____36002)];
      if(or__3824__auto____36003) {
        return or__3824__auto____36003
      }else {
        var or__3824__auto____36004 = cljs.core._first["_"];
        if(or__3824__auto____36004) {
          return or__3824__auto____36004
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____36009 = coll;
    if(and__3822__auto____36009) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____36009
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2418__auto____36010 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36011 = cljs.core._rest[goog.typeOf(x__2418__auto____36010)];
      if(or__3824__auto____36011) {
        return or__3824__auto____36011
      }else {
        var or__3824__auto____36012 = cljs.core._rest["_"];
        if(or__3824__auto____36012) {
          return or__3824__auto____36012
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____36017 = coll;
    if(and__3822__auto____36017) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____36017
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2418__auto____36018 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36019 = cljs.core._next[goog.typeOf(x__2418__auto____36018)];
      if(or__3824__auto____36019) {
        return or__3824__auto____36019
      }else {
        var or__3824__auto____36020 = cljs.core._next["_"];
        if(or__3824__auto____36020) {
          return or__3824__auto____36020
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____36029 = o;
      if(and__3822__auto____36029) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____36029
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2418__auto____36030 = o == null ? null : o;
      return function() {
        var or__3824__auto____36031 = cljs.core._lookup[goog.typeOf(x__2418__auto____36030)];
        if(or__3824__auto____36031) {
          return or__3824__auto____36031
        }else {
          var or__3824__auto____36032 = cljs.core._lookup["_"];
          if(or__3824__auto____36032) {
            return or__3824__auto____36032
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____36033 = o;
      if(and__3822__auto____36033) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____36033
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2418__auto____36034 = o == null ? null : o;
      return function() {
        var or__3824__auto____36035 = cljs.core._lookup[goog.typeOf(x__2418__auto____36034)];
        if(or__3824__auto____36035) {
          return or__3824__auto____36035
        }else {
          var or__3824__auto____36036 = cljs.core._lookup["_"];
          if(or__3824__auto____36036) {
            return or__3824__auto____36036
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____36041 = coll;
    if(and__3822__auto____36041) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____36041
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2418__auto____36042 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36043 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2418__auto____36042)];
      if(or__3824__auto____36043) {
        return or__3824__auto____36043
      }else {
        var or__3824__auto____36044 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____36044) {
          return or__3824__auto____36044
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____36049 = coll;
    if(and__3822__auto____36049) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____36049
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2418__auto____36050 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36051 = cljs.core._assoc[goog.typeOf(x__2418__auto____36050)];
      if(or__3824__auto____36051) {
        return or__3824__auto____36051
      }else {
        var or__3824__auto____36052 = cljs.core._assoc["_"];
        if(or__3824__auto____36052) {
          return or__3824__auto____36052
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____36057 = coll;
    if(and__3822__auto____36057) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____36057
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2418__auto____36058 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36059 = cljs.core._dissoc[goog.typeOf(x__2418__auto____36058)];
      if(or__3824__auto____36059) {
        return or__3824__auto____36059
      }else {
        var or__3824__auto____36060 = cljs.core._dissoc["_"];
        if(or__3824__auto____36060) {
          return or__3824__auto____36060
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____36065 = coll;
    if(and__3822__auto____36065) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____36065
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2418__auto____36066 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36067 = cljs.core._key[goog.typeOf(x__2418__auto____36066)];
      if(or__3824__auto____36067) {
        return or__3824__auto____36067
      }else {
        var or__3824__auto____36068 = cljs.core._key["_"];
        if(or__3824__auto____36068) {
          return or__3824__auto____36068
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____36073 = coll;
    if(and__3822__auto____36073) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____36073
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2418__auto____36074 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36075 = cljs.core._val[goog.typeOf(x__2418__auto____36074)];
      if(or__3824__auto____36075) {
        return or__3824__auto____36075
      }else {
        var or__3824__auto____36076 = cljs.core._val["_"];
        if(or__3824__auto____36076) {
          return or__3824__auto____36076
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____36081 = coll;
    if(and__3822__auto____36081) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____36081
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2418__auto____36082 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36083 = cljs.core._disjoin[goog.typeOf(x__2418__auto____36082)];
      if(or__3824__auto____36083) {
        return or__3824__auto____36083
      }else {
        var or__3824__auto____36084 = cljs.core._disjoin["_"];
        if(or__3824__auto____36084) {
          return or__3824__auto____36084
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____36089 = coll;
    if(and__3822__auto____36089) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____36089
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2418__auto____36090 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36091 = cljs.core._peek[goog.typeOf(x__2418__auto____36090)];
      if(or__3824__auto____36091) {
        return or__3824__auto____36091
      }else {
        var or__3824__auto____36092 = cljs.core._peek["_"];
        if(or__3824__auto____36092) {
          return or__3824__auto____36092
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____36097 = coll;
    if(and__3822__auto____36097) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____36097
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2418__auto____36098 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36099 = cljs.core._pop[goog.typeOf(x__2418__auto____36098)];
      if(or__3824__auto____36099) {
        return or__3824__auto____36099
      }else {
        var or__3824__auto____36100 = cljs.core._pop["_"];
        if(or__3824__auto____36100) {
          return or__3824__auto____36100
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____36105 = coll;
    if(and__3822__auto____36105) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____36105
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2418__auto____36106 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36107 = cljs.core._assoc_n[goog.typeOf(x__2418__auto____36106)];
      if(or__3824__auto____36107) {
        return or__3824__auto____36107
      }else {
        var or__3824__auto____36108 = cljs.core._assoc_n["_"];
        if(or__3824__auto____36108) {
          return or__3824__auto____36108
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____36113 = o;
    if(and__3822__auto____36113) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____36113
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2418__auto____36114 = o == null ? null : o;
    return function() {
      var or__3824__auto____36115 = cljs.core._deref[goog.typeOf(x__2418__auto____36114)];
      if(or__3824__auto____36115) {
        return or__3824__auto____36115
      }else {
        var or__3824__auto____36116 = cljs.core._deref["_"];
        if(or__3824__auto____36116) {
          return or__3824__auto____36116
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____36121 = o;
    if(and__3822__auto____36121) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____36121
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2418__auto____36122 = o == null ? null : o;
    return function() {
      var or__3824__auto____36123 = cljs.core._deref_with_timeout[goog.typeOf(x__2418__auto____36122)];
      if(or__3824__auto____36123) {
        return or__3824__auto____36123
      }else {
        var or__3824__auto____36124 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____36124) {
          return or__3824__auto____36124
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____36129 = o;
    if(and__3822__auto____36129) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____36129
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2418__auto____36130 = o == null ? null : o;
    return function() {
      var or__3824__auto____36131 = cljs.core._meta[goog.typeOf(x__2418__auto____36130)];
      if(or__3824__auto____36131) {
        return or__3824__auto____36131
      }else {
        var or__3824__auto____36132 = cljs.core._meta["_"];
        if(or__3824__auto____36132) {
          return or__3824__auto____36132
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____36137 = o;
    if(and__3822__auto____36137) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____36137
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2418__auto____36138 = o == null ? null : o;
    return function() {
      var or__3824__auto____36139 = cljs.core._with_meta[goog.typeOf(x__2418__auto____36138)];
      if(or__3824__auto____36139) {
        return or__3824__auto____36139
      }else {
        var or__3824__auto____36140 = cljs.core._with_meta["_"];
        if(or__3824__auto____36140) {
          return or__3824__auto____36140
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____36149 = coll;
      if(and__3822__auto____36149) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____36149
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2418__auto____36150 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____36151 = cljs.core._reduce[goog.typeOf(x__2418__auto____36150)];
        if(or__3824__auto____36151) {
          return or__3824__auto____36151
        }else {
          var or__3824__auto____36152 = cljs.core._reduce["_"];
          if(or__3824__auto____36152) {
            return or__3824__auto____36152
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____36153 = coll;
      if(and__3822__auto____36153) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____36153
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2418__auto____36154 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____36155 = cljs.core._reduce[goog.typeOf(x__2418__auto____36154)];
        if(or__3824__auto____36155) {
          return or__3824__auto____36155
        }else {
          var or__3824__auto____36156 = cljs.core._reduce["_"];
          if(or__3824__auto____36156) {
            return or__3824__auto____36156
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____36161 = coll;
    if(and__3822__auto____36161) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____36161
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2418__auto____36162 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36163 = cljs.core._kv_reduce[goog.typeOf(x__2418__auto____36162)];
      if(or__3824__auto____36163) {
        return or__3824__auto____36163
      }else {
        var or__3824__auto____36164 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____36164) {
          return or__3824__auto____36164
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____36169 = o;
    if(and__3822__auto____36169) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____36169
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2418__auto____36170 = o == null ? null : o;
    return function() {
      var or__3824__auto____36171 = cljs.core._equiv[goog.typeOf(x__2418__auto____36170)];
      if(or__3824__auto____36171) {
        return or__3824__auto____36171
      }else {
        var or__3824__auto____36172 = cljs.core._equiv["_"];
        if(or__3824__auto____36172) {
          return or__3824__auto____36172
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____36177 = o;
    if(and__3822__auto____36177) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____36177
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2418__auto____36178 = o == null ? null : o;
    return function() {
      var or__3824__auto____36179 = cljs.core._hash[goog.typeOf(x__2418__auto____36178)];
      if(or__3824__auto____36179) {
        return or__3824__auto____36179
      }else {
        var or__3824__auto____36180 = cljs.core._hash["_"];
        if(or__3824__auto____36180) {
          return or__3824__auto____36180
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____36185 = o;
    if(and__3822__auto____36185) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____36185
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2418__auto____36186 = o == null ? null : o;
    return function() {
      var or__3824__auto____36187 = cljs.core._seq[goog.typeOf(x__2418__auto____36186)];
      if(or__3824__auto____36187) {
        return or__3824__auto____36187
      }else {
        var or__3824__auto____36188 = cljs.core._seq["_"];
        if(or__3824__auto____36188) {
          return or__3824__auto____36188
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____36193 = coll;
    if(and__3822__auto____36193) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____36193
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2418__auto____36194 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36195 = cljs.core._rseq[goog.typeOf(x__2418__auto____36194)];
      if(or__3824__auto____36195) {
        return or__3824__auto____36195
      }else {
        var or__3824__auto____36196 = cljs.core._rseq["_"];
        if(or__3824__auto____36196) {
          return or__3824__auto____36196
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____36201 = coll;
    if(and__3822__auto____36201) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____36201
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2418__auto____36202 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36203 = cljs.core._sorted_seq[goog.typeOf(x__2418__auto____36202)];
      if(or__3824__auto____36203) {
        return or__3824__auto____36203
      }else {
        var or__3824__auto____36204 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____36204) {
          return or__3824__auto____36204
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____36209 = coll;
    if(and__3822__auto____36209) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____36209
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2418__auto____36210 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36211 = cljs.core._sorted_seq_from[goog.typeOf(x__2418__auto____36210)];
      if(or__3824__auto____36211) {
        return or__3824__auto____36211
      }else {
        var or__3824__auto____36212 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____36212) {
          return or__3824__auto____36212
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____36217 = coll;
    if(and__3822__auto____36217) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____36217
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2418__auto____36218 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36219 = cljs.core._entry_key[goog.typeOf(x__2418__auto____36218)];
      if(or__3824__auto____36219) {
        return or__3824__auto____36219
      }else {
        var or__3824__auto____36220 = cljs.core._entry_key["_"];
        if(or__3824__auto____36220) {
          return or__3824__auto____36220
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____36225 = coll;
    if(and__3822__auto____36225) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____36225
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2418__auto____36226 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36227 = cljs.core._comparator[goog.typeOf(x__2418__auto____36226)];
      if(or__3824__auto____36227) {
        return or__3824__auto____36227
      }else {
        var or__3824__auto____36228 = cljs.core._comparator["_"];
        if(or__3824__auto____36228) {
          return or__3824__auto____36228
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____36233 = o;
    if(and__3822__auto____36233) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____36233
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2418__auto____36234 = o == null ? null : o;
    return function() {
      var or__3824__auto____36235 = cljs.core._pr_seq[goog.typeOf(x__2418__auto____36234)];
      if(or__3824__auto____36235) {
        return or__3824__auto____36235
      }else {
        var or__3824__auto____36236 = cljs.core._pr_seq["_"];
        if(or__3824__auto____36236) {
          return or__3824__auto____36236
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____36241 = d;
    if(and__3822__auto____36241) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____36241
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2418__auto____36242 = d == null ? null : d;
    return function() {
      var or__3824__auto____36243 = cljs.core._realized_QMARK_[goog.typeOf(x__2418__auto____36242)];
      if(or__3824__auto____36243) {
        return or__3824__auto____36243
      }else {
        var or__3824__auto____36244 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____36244) {
          return or__3824__auto____36244
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____36249 = this$;
    if(and__3822__auto____36249) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____36249
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2418__auto____36250 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____36251 = cljs.core._notify_watches[goog.typeOf(x__2418__auto____36250)];
      if(or__3824__auto____36251) {
        return or__3824__auto____36251
      }else {
        var or__3824__auto____36252 = cljs.core._notify_watches["_"];
        if(or__3824__auto____36252) {
          return or__3824__auto____36252
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____36257 = this$;
    if(and__3822__auto____36257) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____36257
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2418__auto____36258 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____36259 = cljs.core._add_watch[goog.typeOf(x__2418__auto____36258)];
      if(or__3824__auto____36259) {
        return or__3824__auto____36259
      }else {
        var or__3824__auto____36260 = cljs.core._add_watch["_"];
        if(or__3824__auto____36260) {
          return or__3824__auto____36260
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____36265 = this$;
    if(and__3822__auto____36265) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____36265
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2418__auto____36266 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____36267 = cljs.core._remove_watch[goog.typeOf(x__2418__auto____36266)];
      if(or__3824__auto____36267) {
        return or__3824__auto____36267
      }else {
        var or__3824__auto____36268 = cljs.core._remove_watch["_"];
        if(or__3824__auto____36268) {
          return or__3824__auto____36268
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____36273 = coll;
    if(and__3822__auto____36273) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____36273
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2418__auto____36274 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36275 = cljs.core._as_transient[goog.typeOf(x__2418__auto____36274)];
      if(or__3824__auto____36275) {
        return or__3824__auto____36275
      }else {
        var or__3824__auto____36276 = cljs.core._as_transient["_"];
        if(or__3824__auto____36276) {
          return or__3824__auto____36276
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____36281 = tcoll;
    if(and__3822__auto____36281) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____36281
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2418__auto____36282 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____36283 = cljs.core._conj_BANG_[goog.typeOf(x__2418__auto____36282)];
      if(or__3824__auto____36283) {
        return or__3824__auto____36283
      }else {
        var or__3824__auto____36284 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____36284) {
          return or__3824__auto____36284
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____36289 = tcoll;
    if(and__3822__auto____36289) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____36289
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2418__auto____36290 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____36291 = cljs.core._persistent_BANG_[goog.typeOf(x__2418__auto____36290)];
      if(or__3824__auto____36291) {
        return or__3824__auto____36291
      }else {
        var or__3824__auto____36292 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____36292) {
          return or__3824__auto____36292
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____36297 = tcoll;
    if(and__3822__auto____36297) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____36297
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2418__auto____36298 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____36299 = cljs.core._assoc_BANG_[goog.typeOf(x__2418__auto____36298)];
      if(or__3824__auto____36299) {
        return or__3824__auto____36299
      }else {
        var or__3824__auto____36300 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____36300) {
          return or__3824__auto____36300
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____36305 = tcoll;
    if(and__3822__auto____36305) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____36305
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2418__auto____36306 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____36307 = cljs.core._dissoc_BANG_[goog.typeOf(x__2418__auto____36306)];
      if(or__3824__auto____36307) {
        return or__3824__auto____36307
      }else {
        var or__3824__auto____36308 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____36308) {
          return or__3824__auto____36308
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____36313 = tcoll;
    if(and__3822__auto____36313) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____36313
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2418__auto____36314 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____36315 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2418__auto____36314)];
      if(or__3824__auto____36315) {
        return or__3824__auto____36315
      }else {
        var or__3824__auto____36316 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____36316) {
          return or__3824__auto____36316
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____36321 = tcoll;
    if(and__3822__auto____36321) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____36321
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2418__auto____36322 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____36323 = cljs.core._pop_BANG_[goog.typeOf(x__2418__auto____36322)];
      if(or__3824__auto____36323) {
        return or__3824__auto____36323
      }else {
        var or__3824__auto____36324 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____36324) {
          return or__3824__auto____36324
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____36329 = tcoll;
    if(and__3822__auto____36329) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____36329
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2418__auto____36330 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____36331 = cljs.core._disjoin_BANG_[goog.typeOf(x__2418__auto____36330)];
      if(or__3824__auto____36331) {
        return or__3824__auto____36331
      }else {
        var or__3824__auto____36332 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____36332) {
          return or__3824__auto____36332
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____36337 = x;
    if(and__3822__auto____36337) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____36337
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2418__auto____36338 = x == null ? null : x;
    return function() {
      var or__3824__auto____36339 = cljs.core._compare[goog.typeOf(x__2418__auto____36338)];
      if(or__3824__auto____36339) {
        return or__3824__auto____36339
      }else {
        var or__3824__auto____36340 = cljs.core._compare["_"];
        if(or__3824__auto____36340) {
          return or__3824__auto____36340
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____36345 = coll;
    if(and__3822__auto____36345) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____36345
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2418__auto____36346 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36347 = cljs.core._drop_first[goog.typeOf(x__2418__auto____36346)];
      if(or__3824__auto____36347) {
        return or__3824__auto____36347
      }else {
        var or__3824__auto____36348 = cljs.core._drop_first["_"];
        if(or__3824__auto____36348) {
          return or__3824__auto____36348
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____36353 = coll;
    if(and__3822__auto____36353) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____36353
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2418__auto____36354 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36355 = cljs.core._chunked_first[goog.typeOf(x__2418__auto____36354)];
      if(or__3824__auto____36355) {
        return or__3824__auto____36355
      }else {
        var or__3824__auto____36356 = cljs.core._chunked_first["_"];
        if(or__3824__auto____36356) {
          return or__3824__auto____36356
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____36361 = coll;
    if(and__3822__auto____36361) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____36361
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2418__auto____36362 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36363 = cljs.core._chunked_rest[goog.typeOf(x__2418__auto____36362)];
      if(or__3824__auto____36363) {
        return or__3824__auto____36363
      }else {
        var or__3824__auto____36364 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____36364) {
          return or__3824__auto____36364
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____36369 = coll;
    if(and__3822__auto____36369) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____36369
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2418__auto____36370 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____36371 = cljs.core._chunked_next[goog.typeOf(x__2418__auto____36370)];
      if(or__3824__auto____36371) {
        return or__3824__auto____36371
      }else {
        var or__3824__auto____36372 = cljs.core._chunked_next["_"];
        if(or__3824__auto____36372) {
          return or__3824__auto____36372
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____36374 = x === y;
    if(or__3824__auto____36374) {
      return or__3824__auto____36374
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__36375__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__36376 = y;
            var G__36377 = cljs.core.first.call(null, more);
            var G__36378 = cljs.core.next.call(null, more);
            x = G__36376;
            y = G__36377;
            more = G__36378;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__36375 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36375__delegate.call(this, x, y, more)
    };
    G__36375.cljs$lang$maxFixedArity = 2;
    G__36375.cljs$lang$applyTo = function(arglist__36379) {
      var x = cljs.core.first(arglist__36379);
      var y = cljs.core.first(cljs.core.next(arglist__36379));
      var more = cljs.core.rest(cljs.core.next(arglist__36379));
      return G__36375__delegate(x, y, more)
    };
    G__36375.cljs$lang$arity$variadic = G__36375__delegate;
    return G__36375
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__36380 = null;
  var G__36380__2 = function(o, k) {
    return null
  };
  var G__36380__3 = function(o, k, not_found) {
    return not_found
  };
  G__36380 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__36380__2.call(this, o, k);
      case 3:
        return G__36380__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__36380
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__36381 = null;
  var G__36381__2 = function(_, f) {
    return f.call(null)
  };
  var G__36381__3 = function(_, f, start) {
    return start
  };
  G__36381 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__36381__2.call(this, _, f);
      case 3:
        return G__36381__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__36381
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__36382 = null;
  var G__36382__2 = function(_, n) {
    return null
  };
  var G__36382__3 = function(_, n, not_found) {
    return not_found
  };
  G__36382 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__36382__2.call(this, _, n);
      case 3:
        return G__36382__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__36382
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____36383 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____36383) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____36383
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__36396 = cljs.core._count.call(null, cicoll);
    if(cnt__36396 === 0) {
      return f.call(null)
    }else {
      var val__36397 = cljs.core._nth.call(null, cicoll, 0);
      var n__36398 = 1;
      while(true) {
        if(n__36398 < cnt__36396) {
          var nval__36399 = f.call(null, val__36397, cljs.core._nth.call(null, cicoll, n__36398));
          if(cljs.core.reduced_QMARK_.call(null, nval__36399)) {
            return cljs.core.deref.call(null, nval__36399)
          }else {
            var G__36408 = nval__36399;
            var G__36409 = n__36398 + 1;
            val__36397 = G__36408;
            n__36398 = G__36409;
            continue
          }
        }else {
          return val__36397
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__36400 = cljs.core._count.call(null, cicoll);
    var val__36401 = val;
    var n__36402 = 0;
    while(true) {
      if(n__36402 < cnt__36400) {
        var nval__36403 = f.call(null, val__36401, cljs.core._nth.call(null, cicoll, n__36402));
        if(cljs.core.reduced_QMARK_.call(null, nval__36403)) {
          return cljs.core.deref.call(null, nval__36403)
        }else {
          var G__36410 = nval__36403;
          var G__36411 = n__36402 + 1;
          val__36401 = G__36410;
          n__36402 = G__36411;
          continue
        }
      }else {
        return val__36401
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__36404 = cljs.core._count.call(null, cicoll);
    var val__36405 = val;
    var n__36406 = idx;
    while(true) {
      if(n__36406 < cnt__36404) {
        var nval__36407 = f.call(null, val__36405, cljs.core._nth.call(null, cicoll, n__36406));
        if(cljs.core.reduced_QMARK_.call(null, nval__36407)) {
          return cljs.core.deref.call(null, nval__36407)
        }else {
          var G__36412 = nval__36407;
          var G__36413 = n__36406 + 1;
          val__36405 = G__36412;
          n__36406 = G__36413;
          continue
        }
      }else {
        return val__36405
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__36426 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__36427 = arr[0];
      var n__36428 = 1;
      while(true) {
        if(n__36428 < cnt__36426) {
          var nval__36429 = f.call(null, val__36427, arr[n__36428]);
          if(cljs.core.reduced_QMARK_.call(null, nval__36429)) {
            return cljs.core.deref.call(null, nval__36429)
          }else {
            var G__36438 = nval__36429;
            var G__36439 = n__36428 + 1;
            val__36427 = G__36438;
            n__36428 = G__36439;
            continue
          }
        }else {
          return val__36427
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__36430 = arr.length;
    var val__36431 = val;
    var n__36432 = 0;
    while(true) {
      if(n__36432 < cnt__36430) {
        var nval__36433 = f.call(null, val__36431, arr[n__36432]);
        if(cljs.core.reduced_QMARK_.call(null, nval__36433)) {
          return cljs.core.deref.call(null, nval__36433)
        }else {
          var G__36440 = nval__36433;
          var G__36441 = n__36432 + 1;
          val__36431 = G__36440;
          n__36432 = G__36441;
          continue
        }
      }else {
        return val__36431
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__36434 = arr.length;
    var val__36435 = val;
    var n__36436 = idx;
    while(true) {
      if(n__36436 < cnt__36434) {
        var nval__36437 = f.call(null, val__36435, arr[n__36436]);
        if(cljs.core.reduced_QMARK_.call(null, nval__36437)) {
          return cljs.core.deref.call(null, nval__36437)
        }else {
          var G__36442 = nval__36437;
          var G__36443 = n__36436 + 1;
          val__36435 = G__36442;
          n__36436 = G__36443;
          continue
        }
      }else {
        return val__36435
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__36444 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__36445 = this;
  if(this__36445.i + 1 < this__36445.a.length) {
    return new cljs.core.IndexedSeq(this__36445.a, this__36445.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__36446 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__36447 = this;
  var c__36448 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__36448 > 0) {
    return new cljs.core.RSeq(coll, c__36448 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__36449 = this;
  var this__36450 = this;
  return cljs.core.pr_str.call(null, this__36450)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__36451 = this;
  if(cljs.core.counted_QMARK_.call(null, this__36451.a)) {
    return cljs.core.ci_reduce.call(null, this__36451.a, f, this__36451.a[this__36451.i], this__36451.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__36451.a[this__36451.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__36452 = this;
  if(cljs.core.counted_QMARK_.call(null, this__36452.a)) {
    return cljs.core.ci_reduce.call(null, this__36452.a, f, start, this__36452.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__36453 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__36454 = this;
  return this__36454.a.length - this__36454.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__36455 = this;
  return this__36455.a[this__36455.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__36456 = this;
  if(this__36456.i + 1 < this__36456.a.length) {
    return new cljs.core.IndexedSeq(this__36456.a, this__36456.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__36457 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__36458 = this;
  var i__36459 = n + this__36458.i;
  if(i__36459 < this__36458.a.length) {
    return this__36458.a[i__36459]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__36460 = this;
  var i__36461 = n + this__36460.i;
  if(i__36461 < this__36460.a.length) {
    return this__36460.a[i__36461]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__36462 = null;
  var G__36462__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__36462__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__36462 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__36462__2.call(this, array, f);
      case 3:
        return G__36462__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__36462
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__36463 = null;
  var G__36463__2 = function(array, k) {
    return array[k]
  };
  var G__36463__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__36463 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__36463__2.call(this, array, k);
      case 3:
        return G__36463__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__36463
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__36464 = null;
  var G__36464__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__36464__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__36464 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__36464__2.call(this, array, n);
      case 3:
        return G__36464__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__36464
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__36465 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__36466 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__36467 = this;
  var this__36468 = this;
  return cljs.core.pr_str.call(null, this__36468)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__36469 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__36470 = this;
  return this__36470.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__36471 = this;
  return cljs.core._nth.call(null, this__36471.ci, this__36471.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__36472 = this;
  if(this__36472.i > 0) {
    return new cljs.core.RSeq(this__36472.ci, this__36472.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__36473 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__36474 = this;
  return new cljs.core.RSeq(this__36474.ci, this__36474.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__36475 = this;
  return this__36475.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__36479__36480 = coll;
      if(G__36479__36480) {
        if(function() {
          var or__3824__auto____36481 = G__36479__36480.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____36481) {
            return or__3824__auto____36481
          }else {
            return G__36479__36480.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__36479__36480.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__36479__36480)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__36479__36480)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__36486__36487 = coll;
      if(G__36486__36487) {
        if(function() {
          var or__3824__auto____36488 = G__36486__36487.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____36488) {
            return or__3824__auto____36488
          }else {
            return G__36486__36487.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__36486__36487.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__36486__36487)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__36486__36487)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__36489 = cljs.core.seq.call(null, coll);
      if(s__36489 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__36489)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__36494__36495 = coll;
      if(G__36494__36495) {
        if(function() {
          var or__3824__auto____36496 = G__36494__36495.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____36496) {
            return or__3824__auto____36496
          }else {
            return G__36494__36495.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__36494__36495.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__36494__36495)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__36494__36495)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__36497 = cljs.core.seq.call(null, coll);
      if(!(s__36497 == null)) {
        return cljs.core._rest.call(null, s__36497)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__36501__36502 = coll;
      if(G__36501__36502) {
        if(function() {
          var or__3824__auto____36503 = G__36501__36502.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____36503) {
            return or__3824__auto____36503
          }else {
            return G__36501__36502.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__36501__36502.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__36501__36502)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__36501__36502)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__36505 = cljs.core.next.call(null, s);
    if(!(sn__36505 == null)) {
      var G__36506 = sn__36505;
      s = G__36506;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__36507__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__36508 = conj.call(null, coll, x);
          var G__36509 = cljs.core.first.call(null, xs);
          var G__36510 = cljs.core.next.call(null, xs);
          coll = G__36508;
          x = G__36509;
          xs = G__36510;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__36507 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36507__delegate.call(this, coll, x, xs)
    };
    G__36507.cljs$lang$maxFixedArity = 2;
    G__36507.cljs$lang$applyTo = function(arglist__36511) {
      var coll = cljs.core.first(arglist__36511);
      var x = cljs.core.first(cljs.core.next(arglist__36511));
      var xs = cljs.core.rest(cljs.core.next(arglist__36511));
      return G__36507__delegate(coll, x, xs)
    };
    G__36507.cljs$lang$arity$variadic = G__36507__delegate;
    return G__36507
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__36514 = cljs.core.seq.call(null, coll);
  var acc__36515 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__36514)) {
      return acc__36515 + cljs.core._count.call(null, s__36514)
    }else {
      var G__36516 = cljs.core.next.call(null, s__36514);
      var G__36517 = acc__36515 + 1;
      s__36514 = G__36516;
      acc__36515 = G__36517;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__36524__36525 = coll;
        if(G__36524__36525) {
          if(function() {
            var or__3824__auto____36526 = G__36524__36525.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____36526) {
              return or__3824__auto____36526
            }else {
              return G__36524__36525.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__36524__36525.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__36524__36525)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__36524__36525)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__36527__36528 = coll;
        if(G__36527__36528) {
          if(function() {
            var or__3824__auto____36529 = G__36527__36528.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____36529) {
              return or__3824__auto____36529
            }else {
              return G__36527__36528.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__36527__36528.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__36527__36528)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__36527__36528)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__36532__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__36531 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__36533 = ret__36531;
          var G__36534 = cljs.core.first.call(null, kvs);
          var G__36535 = cljs.core.second.call(null, kvs);
          var G__36536 = cljs.core.nnext.call(null, kvs);
          coll = G__36533;
          k = G__36534;
          v = G__36535;
          kvs = G__36536;
          continue
        }else {
          return ret__36531
        }
        break
      }
    };
    var G__36532 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__36532__delegate.call(this, coll, k, v, kvs)
    };
    G__36532.cljs$lang$maxFixedArity = 3;
    G__36532.cljs$lang$applyTo = function(arglist__36537) {
      var coll = cljs.core.first(arglist__36537);
      var k = cljs.core.first(cljs.core.next(arglist__36537));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__36537)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__36537)));
      return G__36532__delegate(coll, k, v, kvs)
    };
    G__36532.cljs$lang$arity$variadic = G__36532__delegate;
    return G__36532
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__36540__delegate = function(coll, k, ks) {
      while(true) {
        var ret__36539 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__36541 = ret__36539;
          var G__36542 = cljs.core.first.call(null, ks);
          var G__36543 = cljs.core.next.call(null, ks);
          coll = G__36541;
          k = G__36542;
          ks = G__36543;
          continue
        }else {
          return ret__36539
        }
        break
      }
    };
    var G__36540 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36540__delegate.call(this, coll, k, ks)
    };
    G__36540.cljs$lang$maxFixedArity = 2;
    G__36540.cljs$lang$applyTo = function(arglist__36544) {
      var coll = cljs.core.first(arglist__36544);
      var k = cljs.core.first(cljs.core.next(arglist__36544));
      var ks = cljs.core.rest(cljs.core.next(arglist__36544));
      return G__36540__delegate(coll, k, ks)
    };
    G__36540.cljs$lang$arity$variadic = G__36540__delegate;
    return G__36540
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__36548__36549 = o;
    if(G__36548__36549) {
      if(function() {
        var or__3824__auto____36550 = G__36548__36549.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____36550) {
          return or__3824__auto____36550
        }else {
          return G__36548__36549.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__36548__36549.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__36548__36549)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__36548__36549)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__36553__delegate = function(coll, k, ks) {
      while(true) {
        var ret__36552 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__36554 = ret__36552;
          var G__36555 = cljs.core.first.call(null, ks);
          var G__36556 = cljs.core.next.call(null, ks);
          coll = G__36554;
          k = G__36555;
          ks = G__36556;
          continue
        }else {
          return ret__36552
        }
        break
      }
    };
    var G__36553 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36553__delegate.call(this, coll, k, ks)
    };
    G__36553.cljs$lang$maxFixedArity = 2;
    G__36553.cljs$lang$applyTo = function(arglist__36557) {
      var coll = cljs.core.first(arglist__36557);
      var k = cljs.core.first(cljs.core.next(arglist__36557));
      var ks = cljs.core.rest(cljs.core.next(arglist__36557));
      return G__36553__delegate(coll, k, ks)
    };
    G__36553.cljs$lang$arity$variadic = G__36553__delegate;
    return G__36553
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__36559 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__36559;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__36559
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__36561 = cljs.core.string_hash_cache[k];
  if(!(h__36561 == null)) {
    return h__36561
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____36563 = goog.isString(o);
      if(and__3822__auto____36563) {
        return check_cache
      }else {
        return and__3822__auto____36563
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__36567__36568 = x;
    if(G__36567__36568) {
      if(function() {
        var or__3824__auto____36569 = G__36567__36568.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____36569) {
          return or__3824__auto____36569
        }else {
          return G__36567__36568.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__36567__36568.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__36567__36568)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__36567__36568)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__36573__36574 = x;
    if(G__36573__36574) {
      if(function() {
        var or__3824__auto____36575 = G__36573__36574.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____36575) {
          return or__3824__auto____36575
        }else {
          return G__36573__36574.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__36573__36574.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__36573__36574)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__36573__36574)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__36579__36580 = x;
  if(G__36579__36580) {
    if(function() {
      var or__3824__auto____36581 = G__36579__36580.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____36581) {
        return or__3824__auto____36581
      }else {
        return G__36579__36580.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__36579__36580.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__36579__36580)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__36579__36580)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__36585__36586 = x;
  if(G__36585__36586) {
    if(function() {
      var or__3824__auto____36587 = G__36585__36586.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____36587) {
        return or__3824__auto____36587
      }else {
        return G__36585__36586.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__36585__36586.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__36585__36586)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__36585__36586)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__36591__36592 = x;
  if(G__36591__36592) {
    if(function() {
      var or__3824__auto____36593 = G__36591__36592.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____36593) {
        return or__3824__auto____36593
      }else {
        return G__36591__36592.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__36591__36592.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__36591__36592)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__36591__36592)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__36597__36598 = x;
  if(G__36597__36598) {
    if(function() {
      var or__3824__auto____36599 = G__36597__36598.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____36599) {
        return or__3824__auto____36599
      }else {
        return G__36597__36598.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__36597__36598.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__36597__36598)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__36597__36598)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__36603__36604 = x;
  if(G__36603__36604) {
    if(function() {
      var or__3824__auto____36605 = G__36603__36604.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____36605) {
        return or__3824__auto____36605
      }else {
        return G__36603__36604.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__36603__36604.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__36603__36604)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__36603__36604)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__36609__36610 = x;
    if(G__36609__36610) {
      if(function() {
        var or__3824__auto____36611 = G__36609__36610.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____36611) {
          return or__3824__auto____36611
        }else {
          return G__36609__36610.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__36609__36610.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__36609__36610)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__36609__36610)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__36615__36616 = x;
  if(G__36615__36616) {
    if(function() {
      var or__3824__auto____36617 = G__36615__36616.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____36617) {
        return or__3824__auto____36617
      }else {
        return G__36615__36616.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__36615__36616.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__36615__36616)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__36615__36616)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__36621__36622 = x;
  if(G__36621__36622) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____36623 = null;
      if(cljs.core.truth_(or__3824__auto____36623)) {
        return or__3824__auto____36623
      }else {
        return G__36621__36622.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__36621__36622.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__36621__36622)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__36621__36622)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__36624__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__36624 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__36624__delegate.call(this, keyvals)
    };
    G__36624.cljs$lang$maxFixedArity = 0;
    G__36624.cljs$lang$applyTo = function(arglist__36625) {
      var keyvals = cljs.core.seq(arglist__36625);
      return G__36624__delegate(keyvals)
    };
    G__36624.cljs$lang$arity$variadic = G__36624__delegate;
    return G__36624
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__36627 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__36627.push(key)
  });
  return keys__36627
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__36631 = i;
  var j__36632 = j;
  var len__36633 = len;
  while(true) {
    if(len__36633 === 0) {
      return to
    }else {
      to[j__36632] = from[i__36631];
      var G__36634 = i__36631 + 1;
      var G__36635 = j__36632 + 1;
      var G__36636 = len__36633 - 1;
      i__36631 = G__36634;
      j__36632 = G__36635;
      len__36633 = G__36636;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__36640 = i + (len - 1);
  var j__36641 = j + (len - 1);
  var len__36642 = len;
  while(true) {
    if(len__36642 === 0) {
      return to
    }else {
      to[j__36641] = from[i__36640];
      var G__36643 = i__36640 - 1;
      var G__36644 = j__36641 - 1;
      var G__36645 = len__36642 - 1;
      i__36640 = G__36643;
      j__36641 = G__36644;
      len__36642 = G__36645;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__36649__36650 = s;
    if(G__36649__36650) {
      if(function() {
        var or__3824__auto____36651 = G__36649__36650.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____36651) {
          return or__3824__auto____36651
        }else {
          return G__36649__36650.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__36649__36650.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__36649__36650)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__36649__36650)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__36655__36656 = s;
  if(G__36655__36656) {
    if(function() {
      var or__3824__auto____36657 = G__36655__36656.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____36657) {
        return or__3824__auto____36657
      }else {
        return G__36655__36656.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__36655__36656.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__36655__36656)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__36655__36656)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____36660 = goog.isString(x);
  if(and__3822__auto____36660) {
    return!function() {
      var or__3824__auto____36661 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____36661) {
        return or__3824__auto____36661
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____36660
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____36663 = goog.isString(x);
  if(and__3822__auto____36663) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____36663
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____36665 = goog.isString(x);
  if(and__3822__auto____36665) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____36665
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____36670 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____36670) {
    return or__3824__auto____36670
  }else {
    var G__36671__36672 = f;
    if(G__36671__36672) {
      if(function() {
        var or__3824__auto____36673 = G__36671__36672.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____36673) {
          return or__3824__auto____36673
        }else {
          return G__36671__36672.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__36671__36672.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__36671__36672)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__36671__36672)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____36675 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____36675) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____36675
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____36678 = coll;
    if(cljs.core.truth_(and__3822__auto____36678)) {
      var and__3822__auto____36679 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____36679) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____36679
      }
    }else {
      return and__3822__auto____36678
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__36688__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__36684 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__36685 = more;
        while(true) {
          var x__36686 = cljs.core.first.call(null, xs__36685);
          var etc__36687 = cljs.core.next.call(null, xs__36685);
          if(cljs.core.truth_(xs__36685)) {
            if(cljs.core.contains_QMARK_.call(null, s__36684, x__36686)) {
              return false
            }else {
              var G__36689 = cljs.core.conj.call(null, s__36684, x__36686);
              var G__36690 = etc__36687;
              s__36684 = G__36689;
              xs__36685 = G__36690;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__36688 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36688__delegate.call(this, x, y, more)
    };
    G__36688.cljs$lang$maxFixedArity = 2;
    G__36688.cljs$lang$applyTo = function(arglist__36691) {
      var x = cljs.core.first(arglist__36691);
      var y = cljs.core.first(cljs.core.next(arglist__36691));
      var more = cljs.core.rest(cljs.core.next(arglist__36691));
      return G__36688__delegate(x, y, more)
    };
    G__36688.cljs$lang$arity$variadic = G__36688__delegate;
    return G__36688
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__36695__36696 = x;
            if(G__36695__36696) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____36697 = null;
                if(cljs.core.truth_(or__3824__auto____36697)) {
                  return or__3824__auto____36697
                }else {
                  return G__36695__36696.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__36695__36696.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__36695__36696)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__36695__36696)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__36702 = cljs.core.count.call(null, xs);
    var yl__36703 = cljs.core.count.call(null, ys);
    if(xl__36702 < yl__36703) {
      return-1
    }else {
      if(xl__36702 > yl__36703) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__36702, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__36704 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____36705 = d__36704 === 0;
        if(and__3822__auto____36705) {
          return n + 1 < len
        }else {
          return and__3822__auto____36705
        }
      }()) {
        var G__36706 = xs;
        var G__36707 = ys;
        var G__36708 = len;
        var G__36709 = n + 1;
        xs = G__36706;
        ys = G__36707;
        len = G__36708;
        n = G__36709;
        continue
      }else {
        return d__36704
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__36711 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__36711)) {
        return r__36711
      }else {
        if(cljs.core.truth_(r__36711)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__36713 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__36713, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__36713)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____36719 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____36719) {
      var s__36720 = temp__3971__auto____36719;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__36720), cljs.core.next.call(null, s__36720))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__36721 = val;
    var coll__36722 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__36722) {
        var nval__36723 = f.call(null, val__36721, cljs.core.first.call(null, coll__36722));
        if(cljs.core.reduced_QMARK_.call(null, nval__36723)) {
          return cljs.core.deref.call(null, nval__36723)
        }else {
          var G__36724 = nval__36723;
          var G__36725 = cljs.core.next.call(null, coll__36722);
          val__36721 = G__36724;
          coll__36722 = G__36725;
          continue
        }
      }else {
        return val__36721
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__36727 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__36727);
  return cljs.core.vec.call(null, a__36727)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__36734__36735 = coll;
      if(G__36734__36735) {
        if(function() {
          var or__3824__auto____36736 = G__36734__36735.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____36736) {
            return or__3824__auto____36736
          }else {
            return G__36734__36735.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__36734__36735.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__36734__36735)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__36734__36735)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__36737__36738 = coll;
      if(G__36737__36738) {
        if(function() {
          var or__3824__auto____36739 = G__36737__36738.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____36739) {
            return or__3824__auto____36739
          }else {
            return G__36737__36738.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__36737__36738.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__36737__36738)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__36737__36738)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__36740 = this;
  return this__36740.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__36741__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__36741 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36741__delegate.call(this, x, y, more)
    };
    G__36741.cljs$lang$maxFixedArity = 2;
    G__36741.cljs$lang$applyTo = function(arglist__36742) {
      var x = cljs.core.first(arglist__36742);
      var y = cljs.core.first(cljs.core.next(arglist__36742));
      var more = cljs.core.rest(cljs.core.next(arglist__36742));
      return G__36741__delegate(x, y, more)
    };
    G__36741.cljs$lang$arity$variadic = G__36741__delegate;
    return G__36741
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__36743__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__36743 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36743__delegate.call(this, x, y, more)
    };
    G__36743.cljs$lang$maxFixedArity = 2;
    G__36743.cljs$lang$applyTo = function(arglist__36744) {
      var x = cljs.core.first(arglist__36744);
      var y = cljs.core.first(cljs.core.next(arglist__36744));
      var more = cljs.core.rest(cljs.core.next(arglist__36744));
      return G__36743__delegate(x, y, more)
    };
    G__36743.cljs$lang$arity$variadic = G__36743__delegate;
    return G__36743
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__36745__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__36745 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36745__delegate.call(this, x, y, more)
    };
    G__36745.cljs$lang$maxFixedArity = 2;
    G__36745.cljs$lang$applyTo = function(arglist__36746) {
      var x = cljs.core.first(arglist__36746);
      var y = cljs.core.first(cljs.core.next(arglist__36746));
      var more = cljs.core.rest(cljs.core.next(arglist__36746));
      return G__36745__delegate(x, y, more)
    };
    G__36745.cljs$lang$arity$variadic = G__36745__delegate;
    return G__36745
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__36747__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__36747 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36747__delegate.call(this, x, y, more)
    };
    G__36747.cljs$lang$maxFixedArity = 2;
    G__36747.cljs$lang$applyTo = function(arglist__36748) {
      var x = cljs.core.first(arglist__36748);
      var y = cljs.core.first(cljs.core.next(arglist__36748));
      var more = cljs.core.rest(cljs.core.next(arglist__36748));
      return G__36747__delegate(x, y, more)
    };
    G__36747.cljs$lang$arity$variadic = G__36747__delegate;
    return G__36747
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__36749__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__36750 = y;
            var G__36751 = cljs.core.first.call(null, more);
            var G__36752 = cljs.core.next.call(null, more);
            x = G__36750;
            y = G__36751;
            more = G__36752;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__36749 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36749__delegate.call(this, x, y, more)
    };
    G__36749.cljs$lang$maxFixedArity = 2;
    G__36749.cljs$lang$applyTo = function(arglist__36753) {
      var x = cljs.core.first(arglist__36753);
      var y = cljs.core.first(cljs.core.next(arglist__36753));
      var more = cljs.core.rest(cljs.core.next(arglist__36753));
      return G__36749__delegate(x, y, more)
    };
    G__36749.cljs$lang$arity$variadic = G__36749__delegate;
    return G__36749
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__36754__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__36755 = y;
            var G__36756 = cljs.core.first.call(null, more);
            var G__36757 = cljs.core.next.call(null, more);
            x = G__36755;
            y = G__36756;
            more = G__36757;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__36754 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36754__delegate.call(this, x, y, more)
    };
    G__36754.cljs$lang$maxFixedArity = 2;
    G__36754.cljs$lang$applyTo = function(arglist__36758) {
      var x = cljs.core.first(arglist__36758);
      var y = cljs.core.first(cljs.core.next(arglist__36758));
      var more = cljs.core.rest(cljs.core.next(arglist__36758));
      return G__36754__delegate(x, y, more)
    };
    G__36754.cljs$lang$arity$variadic = G__36754__delegate;
    return G__36754
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__36759__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__36760 = y;
            var G__36761 = cljs.core.first.call(null, more);
            var G__36762 = cljs.core.next.call(null, more);
            x = G__36760;
            y = G__36761;
            more = G__36762;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__36759 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36759__delegate.call(this, x, y, more)
    };
    G__36759.cljs$lang$maxFixedArity = 2;
    G__36759.cljs$lang$applyTo = function(arglist__36763) {
      var x = cljs.core.first(arglist__36763);
      var y = cljs.core.first(cljs.core.next(arglist__36763));
      var more = cljs.core.rest(cljs.core.next(arglist__36763));
      return G__36759__delegate(x, y, more)
    };
    G__36759.cljs$lang$arity$variadic = G__36759__delegate;
    return G__36759
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__36764__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__36765 = y;
            var G__36766 = cljs.core.first.call(null, more);
            var G__36767 = cljs.core.next.call(null, more);
            x = G__36765;
            y = G__36766;
            more = G__36767;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__36764 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36764__delegate.call(this, x, y, more)
    };
    G__36764.cljs$lang$maxFixedArity = 2;
    G__36764.cljs$lang$applyTo = function(arglist__36768) {
      var x = cljs.core.first(arglist__36768);
      var y = cljs.core.first(cljs.core.next(arglist__36768));
      var more = cljs.core.rest(cljs.core.next(arglist__36768));
      return G__36764__delegate(x, y, more)
    };
    G__36764.cljs$lang$arity$variadic = G__36764__delegate;
    return G__36764
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__36769__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__36769 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36769__delegate.call(this, x, y, more)
    };
    G__36769.cljs$lang$maxFixedArity = 2;
    G__36769.cljs$lang$applyTo = function(arglist__36770) {
      var x = cljs.core.first(arglist__36770);
      var y = cljs.core.first(cljs.core.next(arglist__36770));
      var more = cljs.core.rest(cljs.core.next(arglist__36770));
      return G__36769__delegate(x, y, more)
    };
    G__36769.cljs$lang$arity$variadic = G__36769__delegate;
    return G__36769
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__36771__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__36771 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36771__delegate.call(this, x, y, more)
    };
    G__36771.cljs$lang$maxFixedArity = 2;
    G__36771.cljs$lang$applyTo = function(arglist__36772) {
      var x = cljs.core.first(arglist__36772);
      var y = cljs.core.first(cljs.core.next(arglist__36772));
      var more = cljs.core.rest(cljs.core.next(arglist__36772));
      return G__36771__delegate(x, y, more)
    };
    G__36771.cljs$lang$arity$variadic = G__36771__delegate;
    return G__36771
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__36774 = n % d;
  return cljs.core.fix.call(null, (n - rem__36774) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__36776 = cljs.core.quot.call(null, n, d);
  return n - d * q__36776
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__36779 = v - (v >> 1 & 1431655765);
  var v__36780 = (v__36779 & 858993459) + (v__36779 >> 2 & 858993459);
  return(v__36780 + (v__36780 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__36781__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__36782 = y;
            var G__36783 = cljs.core.first.call(null, more);
            var G__36784 = cljs.core.next.call(null, more);
            x = G__36782;
            y = G__36783;
            more = G__36784;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__36781 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__36781__delegate.call(this, x, y, more)
    };
    G__36781.cljs$lang$maxFixedArity = 2;
    G__36781.cljs$lang$applyTo = function(arglist__36785) {
      var x = cljs.core.first(arglist__36785);
      var y = cljs.core.first(cljs.core.next(arglist__36785));
      var more = cljs.core.rest(cljs.core.next(arglist__36785));
      return G__36781__delegate(x, y, more)
    };
    G__36781.cljs$lang$arity$variadic = G__36781__delegate;
    return G__36781
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__36789 = n;
  var xs__36790 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____36791 = xs__36790;
      if(and__3822__auto____36791) {
        return n__36789 > 0
      }else {
        return and__3822__auto____36791
      }
    }())) {
      var G__36792 = n__36789 - 1;
      var G__36793 = cljs.core.next.call(null, xs__36790);
      n__36789 = G__36792;
      xs__36790 = G__36793;
      continue
    }else {
      return xs__36790
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__36794__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__36795 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__36796 = cljs.core.next.call(null, more);
            sb = G__36795;
            more = G__36796;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__36794 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__36794__delegate.call(this, x, ys)
    };
    G__36794.cljs$lang$maxFixedArity = 1;
    G__36794.cljs$lang$applyTo = function(arglist__36797) {
      var x = cljs.core.first(arglist__36797);
      var ys = cljs.core.rest(arglist__36797);
      return G__36794__delegate(x, ys)
    };
    G__36794.cljs$lang$arity$variadic = G__36794__delegate;
    return G__36794
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__36798__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__36799 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__36800 = cljs.core.next.call(null, more);
            sb = G__36799;
            more = G__36800;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__36798 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__36798__delegate.call(this, x, ys)
    };
    G__36798.cljs$lang$maxFixedArity = 1;
    G__36798.cljs$lang$applyTo = function(arglist__36801) {
      var x = cljs.core.first(arglist__36801);
      var ys = cljs.core.rest(arglist__36801);
      return G__36798__delegate(x, ys)
    };
    G__36798.cljs$lang$arity$variadic = G__36798__delegate;
    return G__36798
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__36802) {
    var fmt = cljs.core.first(arglist__36802);
    var args = cljs.core.rest(arglist__36802);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__36805 = cljs.core.seq.call(null, x);
    var ys__36806 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__36805 == null) {
        return ys__36806 == null
      }else {
        if(ys__36806 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__36805), cljs.core.first.call(null, ys__36806))) {
            var G__36807 = cljs.core.next.call(null, xs__36805);
            var G__36808 = cljs.core.next.call(null, ys__36806);
            xs__36805 = G__36807;
            ys__36806 = G__36808;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__36809_SHARP_, p2__36810_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__36809_SHARP_, cljs.core.hash.call(null, p2__36810_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__36814 = 0;
  var s__36815 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__36815) {
      var e__36816 = cljs.core.first.call(null, s__36815);
      var G__36817 = (h__36814 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__36816)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__36816)))) % 4503599627370496;
      var G__36818 = cljs.core.next.call(null, s__36815);
      h__36814 = G__36817;
      s__36815 = G__36818;
      continue
    }else {
      return h__36814
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__36822 = 0;
  var s__36823 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__36823) {
      var e__36824 = cljs.core.first.call(null, s__36823);
      var G__36825 = (h__36822 + cljs.core.hash.call(null, e__36824)) % 4503599627370496;
      var G__36826 = cljs.core.next.call(null, s__36823);
      h__36822 = G__36825;
      s__36823 = G__36826;
      continue
    }else {
      return h__36822
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__36847__36848 = cljs.core.seq.call(null, fn_map);
  if(G__36847__36848) {
    var G__36850__36852 = cljs.core.first.call(null, G__36847__36848);
    var vec__36851__36853 = G__36850__36852;
    var key_name__36854 = cljs.core.nth.call(null, vec__36851__36853, 0, null);
    var f__36855 = cljs.core.nth.call(null, vec__36851__36853, 1, null);
    var G__36847__36856 = G__36847__36848;
    var G__36850__36857 = G__36850__36852;
    var G__36847__36858 = G__36847__36856;
    while(true) {
      var vec__36859__36860 = G__36850__36857;
      var key_name__36861 = cljs.core.nth.call(null, vec__36859__36860, 0, null);
      var f__36862 = cljs.core.nth.call(null, vec__36859__36860, 1, null);
      var G__36847__36863 = G__36847__36858;
      var str_name__36864 = cljs.core.name.call(null, key_name__36861);
      obj[str_name__36864] = f__36862;
      var temp__3974__auto____36865 = cljs.core.next.call(null, G__36847__36863);
      if(temp__3974__auto____36865) {
        var G__36847__36866 = temp__3974__auto____36865;
        var G__36867 = cljs.core.first.call(null, G__36847__36866);
        var G__36868 = G__36847__36866;
        G__36850__36857 = G__36867;
        G__36847__36858 = G__36868;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__36869 = this;
  var h__2247__auto____36870 = this__36869.__hash;
  if(!(h__2247__auto____36870 == null)) {
    return h__2247__auto____36870
  }else {
    var h__2247__auto____36871 = cljs.core.hash_coll.call(null, coll);
    this__36869.__hash = h__2247__auto____36871;
    return h__2247__auto____36871
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__36872 = this;
  if(this__36872.count === 1) {
    return null
  }else {
    return this__36872.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__36873 = this;
  return new cljs.core.List(this__36873.meta, o, coll, this__36873.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__36874 = this;
  var this__36875 = this;
  return cljs.core.pr_str.call(null, this__36875)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__36876 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__36877 = this;
  return this__36877.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__36878 = this;
  return this__36878.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__36879 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__36880 = this;
  return this__36880.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__36881 = this;
  if(this__36881.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__36881.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__36882 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__36883 = this;
  return new cljs.core.List(meta, this__36883.first, this__36883.rest, this__36883.count, this__36883.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__36884 = this;
  return this__36884.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__36885 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__36886 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__36887 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__36888 = this;
  return new cljs.core.List(this__36888.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__36889 = this;
  var this__36890 = this;
  return cljs.core.pr_str.call(null, this__36890)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__36891 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__36892 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__36893 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__36894 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__36895 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__36896 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__36897 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__36898 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__36899 = this;
  return this__36899.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__36900 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__36904__36905 = coll;
  if(G__36904__36905) {
    if(function() {
      var or__3824__auto____36906 = G__36904__36905.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____36906) {
        return or__3824__auto____36906
      }else {
        return G__36904__36905.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__36904__36905.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__36904__36905)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__36904__36905)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__36907__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__36907 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__36907__delegate.call(this, x, y, z, items)
    };
    G__36907.cljs$lang$maxFixedArity = 3;
    G__36907.cljs$lang$applyTo = function(arglist__36908) {
      var x = cljs.core.first(arglist__36908);
      var y = cljs.core.first(cljs.core.next(arglist__36908));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__36908)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__36908)));
      return G__36907__delegate(x, y, z, items)
    };
    G__36907.cljs$lang$arity$variadic = G__36907__delegate;
    return G__36907
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__36909 = this;
  var h__2247__auto____36910 = this__36909.__hash;
  if(!(h__2247__auto____36910 == null)) {
    return h__2247__auto____36910
  }else {
    var h__2247__auto____36911 = cljs.core.hash_coll.call(null, coll);
    this__36909.__hash = h__2247__auto____36911;
    return h__2247__auto____36911
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__36912 = this;
  if(this__36912.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__36912.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__36913 = this;
  return new cljs.core.Cons(null, o, coll, this__36913.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__36914 = this;
  var this__36915 = this;
  return cljs.core.pr_str.call(null, this__36915)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__36916 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__36917 = this;
  return this__36917.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__36918 = this;
  if(this__36918.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__36918.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__36919 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__36920 = this;
  return new cljs.core.Cons(meta, this__36920.first, this__36920.rest, this__36920.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__36921 = this;
  return this__36921.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__36922 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__36922.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____36927 = coll == null;
    if(or__3824__auto____36927) {
      return or__3824__auto____36927
    }else {
      var G__36928__36929 = coll;
      if(G__36928__36929) {
        if(function() {
          var or__3824__auto____36930 = G__36928__36929.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____36930) {
            return or__3824__auto____36930
          }else {
            return G__36928__36929.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__36928__36929.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__36928__36929)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__36928__36929)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__36934__36935 = x;
  if(G__36934__36935) {
    if(function() {
      var or__3824__auto____36936 = G__36934__36935.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____36936) {
        return or__3824__auto____36936
      }else {
        return G__36934__36935.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__36934__36935.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__36934__36935)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__36934__36935)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__36937 = null;
  var G__36937__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__36937__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__36937 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__36937__2.call(this, string, f);
      case 3:
        return G__36937__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__36937
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__36938 = null;
  var G__36938__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__36938__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__36938 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__36938__2.call(this, string, k);
      case 3:
        return G__36938__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__36938
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__36939 = null;
  var G__36939__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__36939__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__36939 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__36939__2.call(this, string, n);
      case 3:
        return G__36939__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__36939
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__36951 = null;
  var G__36951__2 = function(this_sym36942, coll) {
    var this__36944 = this;
    var this_sym36942__36945 = this;
    var ___36946 = this_sym36942__36945;
    if(coll == null) {
      return null
    }else {
      var strobj__36947 = coll.strobj;
      if(strobj__36947 == null) {
        return cljs.core._lookup.call(null, coll, this__36944.k, null)
      }else {
        return strobj__36947[this__36944.k]
      }
    }
  };
  var G__36951__3 = function(this_sym36943, coll, not_found) {
    var this__36944 = this;
    var this_sym36943__36948 = this;
    var ___36949 = this_sym36943__36948;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__36944.k, not_found)
    }
  };
  G__36951 = function(this_sym36943, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__36951__2.call(this, this_sym36943, coll);
      case 3:
        return G__36951__3.call(this, this_sym36943, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__36951
}();
cljs.core.Keyword.prototype.apply = function(this_sym36940, args36941) {
  var this__36950 = this;
  return this_sym36940.call.apply(this_sym36940, [this_sym36940].concat(args36941.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__36960 = null;
  var G__36960__2 = function(this_sym36954, coll) {
    var this_sym36954__36956 = this;
    var this__36957 = this_sym36954__36956;
    return cljs.core._lookup.call(null, coll, this__36957.toString(), null)
  };
  var G__36960__3 = function(this_sym36955, coll, not_found) {
    var this_sym36955__36958 = this;
    var this__36959 = this_sym36955__36958;
    return cljs.core._lookup.call(null, coll, this__36959.toString(), not_found)
  };
  G__36960 = function(this_sym36955, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__36960__2.call(this, this_sym36955, coll);
      case 3:
        return G__36960__3.call(this, this_sym36955, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__36960
}();
String.prototype.apply = function(this_sym36952, args36953) {
  return this_sym36952.call.apply(this_sym36952, [this_sym36952].concat(args36953.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__36962 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__36962
  }else {
    lazy_seq.x = x__36962.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__36963 = this;
  var h__2247__auto____36964 = this__36963.__hash;
  if(!(h__2247__auto____36964 == null)) {
    return h__2247__auto____36964
  }else {
    var h__2247__auto____36965 = cljs.core.hash_coll.call(null, coll);
    this__36963.__hash = h__2247__auto____36965;
    return h__2247__auto____36965
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__36966 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__36967 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__36968 = this;
  var this__36969 = this;
  return cljs.core.pr_str.call(null, this__36969)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__36970 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__36971 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__36972 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__36973 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__36974 = this;
  return new cljs.core.LazySeq(meta, this__36974.realized, this__36974.x, this__36974.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__36975 = this;
  return this__36975.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__36976 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__36976.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__36977 = this;
  return this__36977.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__36978 = this;
  var ___36979 = this;
  this__36978.buf[this__36978.end] = o;
  return this__36978.end = this__36978.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__36980 = this;
  var ___36981 = this;
  var ret__36982 = new cljs.core.ArrayChunk(this__36980.buf, 0, this__36980.end);
  this__36980.buf = null;
  return ret__36982
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__36983 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__36983.arr[this__36983.off], this__36983.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__36984 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__36984.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__36985 = this;
  if(this__36985.off === this__36985.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__36985.arr, this__36985.off + 1, this__36985.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__36986 = this;
  return this__36986.arr[this__36986.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__36987 = this;
  if(function() {
    var and__3822__auto____36988 = i >= 0;
    if(and__3822__auto____36988) {
      return i < this__36987.end - this__36987.off
    }else {
      return and__3822__auto____36988
    }
  }()) {
    return this__36987.arr[this__36987.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__36989 = this;
  return this__36989.end - this__36989.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__36990 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__36991 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__36992 = this;
  return cljs.core._nth.call(null, this__36992.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__36993 = this;
  if(cljs.core._count.call(null, this__36993.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__36993.chunk), this__36993.more, this__36993.meta)
  }else {
    if(this__36993.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__36993.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__36994 = this;
  if(this__36994.more == null) {
    return null
  }else {
    return this__36994.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__36995 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__36996 = this;
  return new cljs.core.ChunkedCons(this__36996.chunk, this__36996.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__36997 = this;
  return this__36997.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__36998 = this;
  return this__36998.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__36999 = this;
  if(this__36999.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__36999.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__37003__37004 = s;
    if(G__37003__37004) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____37005 = null;
        if(cljs.core.truth_(or__3824__auto____37005)) {
          return or__3824__auto____37005
        }else {
          return G__37003__37004.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__37003__37004.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__37003__37004)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__37003__37004)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__37008 = [];
  var s__37009 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__37009)) {
      ary__37008.push(cljs.core.first.call(null, s__37009));
      var G__37010 = cljs.core.next.call(null, s__37009);
      s__37009 = G__37010;
      continue
    }else {
      return ary__37008
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__37014 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__37015 = 0;
  var xs__37016 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__37016) {
      ret__37014[i__37015] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__37016));
      var G__37017 = i__37015 + 1;
      var G__37018 = cljs.core.next.call(null, xs__37016);
      i__37015 = G__37017;
      xs__37016 = G__37018;
      continue
    }else {
    }
    break
  }
  return ret__37014
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__37026 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__37027 = cljs.core.seq.call(null, init_val_or_seq);
      var i__37028 = 0;
      var s__37029 = s__37027;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____37030 = s__37029;
          if(and__3822__auto____37030) {
            return i__37028 < size
          }else {
            return and__3822__auto____37030
          }
        }())) {
          a__37026[i__37028] = cljs.core.first.call(null, s__37029);
          var G__37033 = i__37028 + 1;
          var G__37034 = cljs.core.next.call(null, s__37029);
          i__37028 = G__37033;
          s__37029 = G__37034;
          continue
        }else {
          return a__37026
        }
        break
      }
    }else {
      var n__2582__auto____37031 = size;
      var i__37032 = 0;
      while(true) {
        if(i__37032 < n__2582__auto____37031) {
          a__37026[i__37032] = init_val_or_seq;
          var G__37035 = i__37032 + 1;
          i__37032 = G__37035;
          continue
        }else {
        }
        break
      }
      return a__37026
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__37043 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__37044 = cljs.core.seq.call(null, init_val_or_seq);
      var i__37045 = 0;
      var s__37046 = s__37044;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____37047 = s__37046;
          if(and__3822__auto____37047) {
            return i__37045 < size
          }else {
            return and__3822__auto____37047
          }
        }())) {
          a__37043[i__37045] = cljs.core.first.call(null, s__37046);
          var G__37050 = i__37045 + 1;
          var G__37051 = cljs.core.next.call(null, s__37046);
          i__37045 = G__37050;
          s__37046 = G__37051;
          continue
        }else {
          return a__37043
        }
        break
      }
    }else {
      var n__2582__auto____37048 = size;
      var i__37049 = 0;
      while(true) {
        if(i__37049 < n__2582__auto____37048) {
          a__37043[i__37049] = init_val_or_seq;
          var G__37052 = i__37049 + 1;
          i__37049 = G__37052;
          continue
        }else {
        }
        break
      }
      return a__37043
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__37060 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__37061 = cljs.core.seq.call(null, init_val_or_seq);
      var i__37062 = 0;
      var s__37063 = s__37061;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____37064 = s__37063;
          if(and__3822__auto____37064) {
            return i__37062 < size
          }else {
            return and__3822__auto____37064
          }
        }())) {
          a__37060[i__37062] = cljs.core.first.call(null, s__37063);
          var G__37067 = i__37062 + 1;
          var G__37068 = cljs.core.next.call(null, s__37063);
          i__37062 = G__37067;
          s__37063 = G__37068;
          continue
        }else {
          return a__37060
        }
        break
      }
    }else {
      var n__2582__auto____37065 = size;
      var i__37066 = 0;
      while(true) {
        if(i__37066 < n__2582__auto____37065) {
          a__37060[i__37066] = init_val_or_seq;
          var G__37069 = i__37066 + 1;
          i__37066 = G__37069;
          continue
        }else {
        }
        break
      }
      return a__37060
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__37074 = s;
    var i__37075 = n;
    var sum__37076 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____37077 = i__37075 > 0;
        if(and__3822__auto____37077) {
          return cljs.core.seq.call(null, s__37074)
        }else {
          return and__3822__auto____37077
        }
      }())) {
        var G__37078 = cljs.core.next.call(null, s__37074);
        var G__37079 = i__37075 - 1;
        var G__37080 = sum__37076 + 1;
        s__37074 = G__37078;
        i__37075 = G__37079;
        sum__37076 = G__37080;
        continue
      }else {
        return sum__37076
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__37085 = cljs.core.seq.call(null, x);
      if(s__37085) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__37085)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__37085), concat.call(null, cljs.core.chunk_rest.call(null, s__37085), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__37085), concat.call(null, cljs.core.rest.call(null, s__37085), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__37089__delegate = function(x, y, zs) {
      var cat__37088 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__37087 = cljs.core.seq.call(null, xys);
          if(xys__37087) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__37087)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__37087), cat.call(null, cljs.core.chunk_rest.call(null, xys__37087), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__37087), cat.call(null, cljs.core.rest.call(null, xys__37087), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__37088.call(null, concat.call(null, x, y), zs)
    };
    var G__37089 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__37089__delegate.call(this, x, y, zs)
    };
    G__37089.cljs$lang$maxFixedArity = 2;
    G__37089.cljs$lang$applyTo = function(arglist__37090) {
      var x = cljs.core.first(arglist__37090);
      var y = cljs.core.first(cljs.core.next(arglist__37090));
      var zs = cljs.core.rest(cljs.core.next(arglist__37090));
      return G__37089__delegate(x, y, zs)
    };
    G__37089.cljs$lang$arity$variadic = G__37089__delegate;
    return G__37089
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__37091__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__37091 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__37091__delegate.call(this, a, b, c, d, more)
    };
    G__37091.cljs$lang$maxFixedArity = 4;
    G__37091.cljs$lang$applyTo = function(arglist__37092) {
      var a = cljs.core.first(arglist__37092);
      var b = cljs.core.first(cljs.core.next(arglist__37092));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37092)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__37092))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__37092))));
      return G__37091__delegate(a, b, c, d, more)
    };
    G__37091.cljs$lang$arity$variadic = G__37091__delegate;
    return G__37091
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__37134 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__37135 = cljs.core._first.call(null, args__37134);
    var args__37136 = cljs.core._rest.call(null, args__37134);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__37135)
      }else {
        return f.call(null, a__37135)
      }
    }else {
      var b__37137 = cljs.core._first.call(null, args__37136);
      var args__37138 = cljs.core._rest.call(null, args__37136);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__37135, b__37137)
        }else {
          return f.call(null, a__37135, b__37137)
        }
      }else {
        var c__37139 = cljs.core._first.call(null, args__37138);
        var args__37140 = cljs.core._rest.call(null, args__37138);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__37135, b__37137, c__37139)
          }else {
            return f.call(null, a__37135, b__37137, c__37139)
          }
        }else {
          var d__37141 = cljs.core._first.call(null, args__37140);
          var args__37142 = cljs.core._rest.call(null, args__37140);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__37135, b__37137, c__37139, d__37141)
            }else {
              return f.call(null, a__37135, b__37137, c__37139, d__37141)
            }
          }else {
            var e__37143 = cljs.core._first.call(null, args__37142);
            var args__37144 = cljs.core._rest.call(null, args__37142);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__37135, b__37137, c__37139, d__37141, e__37143)
              }else {
                return f.call(null, a__37135, b__37137, c__37139, d__37141, e__37143)
              }
            }else {
              var f__37145 = cljs.core._first.call(null, args__37144);
              var args__37146 = cljs.core._rest.call(null, args__37144);
              if(argc === 6) {
                if(f__37145.cljs$lang$arity$6) {
                  return f__37145.cljs$lang$arity$6(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145)
                }else {
                  return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145)
                }
              }else {
                var g__37147 = cljs.core._first.call(null, args__37146);
                var args__37148 = cljs.core._rest.call(null, args__37146);
                if(argc === 7) {
                  if(f__37145.cljs$lang$arity$7) {
                    return f__37145.cljs$lang$arity$7(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147)
                  }else {
                    return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147)
                  }
                }else {
                  var h__37149 = cljs.core._first.call(null, args__37148);
                  var args__37150 = cljs.core._rest.call(null, args__37148);
                  if(argc === 8) {
                    if(f__37145.cljs$lang$arity$8) {
                      return f__37145.cljs$lang$arity$8(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149)
                    }else {
                      return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149)
                    }
                  }else {
                    var i__37151 = cljs.core._first.call(null, args__37150);
                    var args__37152 = cljs.core._rest.call(null, args__37150);
                    if(argc === 9) {
                      if(f__37145.cljs$lang$arity$9) {
                        return f__37145.cljs$lang$arity$9(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151)
                      }else {
                        return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151)
                      }
                    }else {
                      var j__37153 = cljs.core._first.call(null, args__37152);
                      var args__37154 = cljs.core._rest.call(null, args__37152);
                      if(argc === 10) {
                        if(f__37145.cljs$lang$arity$10) {
                          return f__37145.cljs$lang$arity$10(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153)
                        }else {
                          return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153)
                        }
                      }else {
                        var k__37155 = cljs.core._first.call(null, args__37154);
                        var args__37156 = cljs.core._rest.call(null, args__37154);
                        if(argc === 11) {
                          if(f__37145.cljs$lang$arity$11) {
                            return f__37145.cljs$lang$arity$11(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155)
                          }else {
                            return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155)
                          }
                        }else {
                          var l__37157 = cljs.core._first.call(null, args__37156);
                          var args__37158 = cljs.core._rest.call(null, args__37156);
                          if(argc === 12) {
                            if(f__37145.cljs$lang$arity$12) {
                              return f__37145.cljs$lang$arity$12(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157)
                            }else {
                              return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157)
                            }
                          }else {
                            var m__37159 = cljs.core._first.call(null, args__37158);
                            var args__37160 = cljs.core._rest.call(null, args__37158);
                            if(argc === 13) {
                              if(f__37145.cljs$lang$arity$13) {
                                return f__37145.cljs$lang$arity$13(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159)
                              }else {
                                return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159)
                              }
                            }else {
                              var n__37161 = cljs.core._first.call(null, args__37160);
                              var args__37162 = cljs.core._rest.call(null, args__37160);
                              if(argc === 14) {
                                if(f__37145.cljs$lang$arity$14) {
                                  return f__37145.cljs$lang$arity$14(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161)
                                }else {
                                  return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161)
                                }
                              }else {
                                var o__37163 = cljs.core._first.call(null, args__37162);
                                var args__37164 = cljs.core._rest.call(null, args__37162);
                                if(argc === 15) {
                                  if(f__37145.cljs$lang$arity$15) {
                                    return f__37145.cljs$lang$arity$15(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161, o__37163)
                                  }else {
                                    return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161, o__37163)
                                  }
                                }else {
                                  var p__37165 = cljs.core._first.call(null, args__37164);
                                  var args__37166 = cljs.core._rest.call(null, args__37164);
                                  if(argc === 16) {
                                    if(f__37145.cljs$lang$arity$16) {
                                      return f__37145.cljs$lang$arity$16(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161, o__37163, p__37165)
                                    }else {
                                      return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161, o__37163, p__37165)
                                    }
                                  }else {
                                    var q__37167 = cljs.core._first.call(null, args__37166);
                                    var args__37168 = cljs.core._rest.call(null, args__37166);
                                    if(argc === 17) {
                                      if(f__37145.cljs$lang$arity$17) {
                                        return f__37145.cljs$lang$arity$17(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161, o__37163, p__37165, q__37167)
                                      }else {
                                        return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161, o__37163, p__37165, q__37167)
                                      }
                                    }else {
                                      var r__37169 = cljs.core._first.call(null, args__37168);
                                      var args__37170 = cljs.core._rest.call(null, args__37168);
                                      if(argc === 18) {
                                        if(f__37145.cljs$lang$arity$18) {
                                          return f__37145.cljs$lang$arity$18(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161, o__37163, p__37165, q__37167, r__37169)
                                        }else {
                                          return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161, o__37163, p__37165, q__37167, r__37169)
                                        }
                                      }else {
                                        var s__37171 = cljs.core._first.call(null, args__37170);
                                        var args__37172 = cljs.core._rest.call(null, args__37170);
                                        if(argc === 19) {
                                          if(f__37145.cljs$lang$arity$19) {
                                            return f__37145.cljs$lang$arity$19(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161, o__37163, p__37165, q__37167, r__37169, s__37171)
                                          }else {
                                            return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161, o__37163, p__37165, q__37167, r__37169, s__37171)
                                          }
                                        }else {
                                          var t__37173 = cljs.core._first.call(null, args__37172);
                                          var args__37174 = cljs.core._rest.call(null, args__37172);
                                          if(argc === 20) {
                                            if(f__37145.cljs$lang$arity$20) {
                                              return f__37145.cljs$lang$arity$20(a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161, o__37163, p__37165, q__37167, r__37169, s__37171, t__37173)
                                            }else {
                                              return f__37145.call(null, a__37135, b__37137, c__37139, d__37141, e__37143, f__37145, g__37147, h__37149, i__37151, j__37153, k__37155, l__37157, m__37159, n__37161, o__37163, p__37165, q__37167, r__37169, s__37171, t__37173)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__37189 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__37190 = cljs.core.bounded_count.call(null, args, fixed_arity__37189 + 1);
      if(bc__37190 <= fixed_arity__37189) {
        return cljs.core.apply_to.call(null, f, bc__37190, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__37191 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__37192 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__37193 = cljs.core.bounded_count.call(null, arglist__37191, fixed_arity__37192 + 1);
      if(bc__37193 <= fixed_arity__37192) {
        return cljs.core.apply_to.call(null, f, bc__37193, arglist__37191)
      }else {
        return f.cljs$lang$applyTo(arglist__37191)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__37191))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__37194 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__37195 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__37196 = cljs.core.bounded_count.call(null, arglist__37194, fixed_arity__37195 + 1);
      if(bc__37196 <= fixed_arity__37195) {
        return cljs.core.apply_to.call(null, f, bc__37196, arglist__37194)
      }else {
        return f.cljs$lang$applyTo(arglist__37194)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__37194))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__37197 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__37198 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__37199 = cljs.core.bounded_count.call(null, arglist__37197, fixed_arity__37198 + 1);
      if(bc__37199 <= fixed_arity__37198) {
        return cljs.core.apply_to.call(null, f, bc__37199, arglist__37197)
      }else {
        return f.cljs$lang$applyTo(arglist__37197)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__37197))
    }
  };
  var apply__6 = function() {
    var G__37203__delegate = function(f, a, b, c, d, args) {
      var arglist__37200 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__37201 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__37202 = cljs.core.bounded_count.call(null, arglist__37200, fixed_arity__37201 + 1);
        if(bc__37202 <= fixed_arity__37201) {
          return cljs.core.apply_to.call(null, f, bc__37202, arglist__37200)
        }else {
          return f.cljs$lang$applyTo(arglist__37200)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__37200))
      }
    };
    var G__37203 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__37203__delegate.call(this, f, a, b, c, d, args)
    };
    G__37203.cljs$lang$maxFixedArity = 5;
    G__37203.cljs$lang$applyTo = function(arglist__37204) {
      var f = cljs.core.first(arglist__37204);
      var a = cljs.core.first(cljs.core.next(arglist__37204));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37204)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__37204))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__37204)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__37204)))));
      return G__37203__delegate(f, a, b, c, d, args)
    };
    G__37203.cljs$lang$arity$variadic = G__37203__delegate;
    return G__37203
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__37205) {
    var obj = cljs.core.first(arglist__37205);
    var f = cljs.core.first(cljs.core.next(arglist__37205));
    var args = cljs.core.rest(cljs.core.next(arglist__37205));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__37206__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__37206 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__37206__delegate.call(this, x, y, more)
    };
    G__37206.cljs$lang$maxFixedArity = 2;
    G__37206.cljs$lang$applyTo = function(arglist__37207) {
      var x = cljs.core.first(arglist__37207);
      var y = cljs.core.first(cljs.core.next(arglist__37207));
      var more = cljs.core.rest(cljs.core.next(arglist__37207));
      return G__37206__delegate(x, y, more)
    };
    G__37206.cljs$lang$arity$variadic = G__37206__delegate;
    return G__37206
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__37208 = pred;
        var G__37209 = cljs.core.next.call(null, coll);
        pred = G__37208;
        coll = G__37209;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____37211 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____37211)) {
        return or__3824__auto____37211
      }else {
        var G__37212 = pred;
        var G__37213 = cljs.core.next.call(null, coll);
        pred = G__37212;
        coll = G__37213;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__37214 = null;
    var G__37214__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__37214__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__37214__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__37214__3 = function() {
      var G__37215__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__37215 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__37215__delegate.call(this, x, y, zs)
      };
      G__37215.cljs$lang$maxFixedArity = 2;
      G__37215.cljs$lang$applyTo = function(arglist__37216) {
        var x = cljs.core.first(arglist__37216);
        var y = cljs.core.first(cljs.core.next(arglist__37216));
        var zs = cljs.core.rest(cljs.core.next(arglist__37216));
        return G__37215__delegate(x, y, zs)
      };
      G__37215.cljs$lang$arity$variadic = G__37215__delegate;
      return G__37215
    }();
    G__37214 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__37214__0.call(this);
        case 1:
          return G__37214__1.call(this, x);
        case 2:
          return G__37214__2.call(this, x, y);
        default:
          return G__37214__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__37214.cljs$lang$maxFixedArity = 2;
    G__37214.cljs$lang$applyTo = G__37214__3.cljs$lang$applyTo;
    return G__37214
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__37217__delegate = function(args) {
      return x
    };
    var G__37217 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__37217__delegate.call(this, args)
    };
    G__37217.cljs$lang$maxFixedArity = 0;
    G__37217.cljs$lang$applyTo = function(arglist__37218) {
      var args = cljs.core.seq(arglist__37218);
      return G__37217__delegate(args)
    };
    G__37217.cljs$lang$arity$variadic = G__37217__delegate;
    return G__37217
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__37225 = null;
      var G__37225__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__37225__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__37225__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__37225__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__37225__4 = function() {
        var G__37226__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__37226 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__37226__delegate.call(this, x, y, z, args)
        };
        G__37226.cljs$lang$maxFixedArity = 3;
        G__37226.cljs$lang$applyTo = function(arglist__37227) {
          var x = cljs.core.first(arglist__37227);
          var y = cljs.core.first(cljs.core.next(arglist__37227));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37227)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37227)));
          return G__37226__delegate(x, y, z, args)
        };
        G__37226.cljs$lang$arity$variadic = G__37226__delegate;
        return G__37226
      }();
      G__37225 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__37225__0.call(this);
          case 1:
            return G__37225__1.call(this, x);
          case 2:
            return G__37225__2.call(this, x, y);
          case 3:
            return G__37225__3.call(this, x, y, z);
          default:
            return G__37225__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__37225.cljs$lang$maxFixedArity = 3;
      G__37225.cljs$lang$applyTo = G__37225__4.cljs$lang$applyTo;
      return G__37225
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__37228 = null;
      var G__37228__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__37228__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__37228__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__37228__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__37228__4 = function() {
        var G__37229__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__37229 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__37229__delegate.call(this, x, y, z, args)
        };
        G__37229.cljs$lang$maxFixedArity = 3;
        G__37229.cljs$lang$applyTo = function(arglist__37230) {
          var x = cljs.core.first(arglist__37230);
          var y = cljs.core.first(cljs.core.next(arglist__37230));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37230)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37230)));
          return G__37229__delegate(x, y, z, args)
        };
        G__37229.cljs$lang$arity$variadic = G__37229__delegate;
        return G__37229
      }();
      G__37228 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__37228__0.call(this);
          case 1:
            return G__37228__1.call(this, x);
          case 2:
            return G__37228__2.call(this, x, y);
          case 3:
            return G__37228__3.call(this, x, y, z);
          default:
            return G__37228__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__37228.cljs$lang$maxFixedArity = 3;
      G__37228.cljs$lang$applyTo = G__37228__4.cljs$lang$applyTo;
      return G__37228
    }()
  };
  var comp__4 = function() {
    var G__37231__delegate = function(f1, f2, f3, fs) {
      var fs__37222 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__37232__delegate = function(args) {
          var ret__37223 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__37222), args);
          var fs__37224 = cljs.core.next.call(null, fs__37222);
          while(true) {
            if(fs__37224) {
              var G__37233 = cljs.core.first.call(null, fs__37224).call(null, ret__37223);
              var G__37234 = cljs.core.next.call(null, fs__37224);
              ret__37223 = G__37233;
              fs__37224 = G__37234;
              continue
            }else {
              return ret__37223
            }
            break
          }
        };
        var G__37232 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__37232__delegate.call(this, args)
        };
        G__37232.cljs$lang$maxFixedArity = 0;
        G__37232.cljs$lang$applyTo = function(arglist__37235) {
          var args = cljs.core.seq(arglist__37235);
          return G__37232__delegate(args)
        };
        G__37232.cljs$lang$arity$variadic = G__37232__delegate;
        return G__37232
      }()
    };
    var G__37231 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__37231__delegate.call(this, f1, f2, f3, fs)
    };
    G__37231.cljs$lang$maxFixedArity = 3;
    G__37231.cljs$lang$applyTo = function(arglist__37236) {
      var f1 = cljs.core.first(arglist__37236);
      var f2 = cljs.core.first(cljs.core.next(arglist__37236));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37236)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37236)));
      return G__37231__delegate(f1, f2, f3, fs)
    };
    G__37231.cljs$lang$arity$variadic = G__37231__delegate;
    return G__37231
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__37237__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__37237 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__37237__delegate.call(this, args)
      };
      G__37237.cljs$lang$maxFixedArity = 0;
      G__37237.cljs$lang$applyTo = function(arglist__37238) {
        var args = cljs.core.seq(arglist__37238);
        return G__37237__delegate(args)
      };
      G__37237.cljs$lang$arity$variadic = G__37237__delegate;
      return G__37237
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__37239__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__37239 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__37239__delegate.call(this, args)
      };
      G__37239.cljs$lang$maxFixedArity = 0;
      G__37239.cljs$lang$applyTo = function(arglist__37240) {
        var args = cljs.core.seq(arglist__37240);
        return G__37239__delegate(args)
      };
      G__37239.cljs$lang$arity$variadic = G__37239__delegate;
      return G__37239
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__37241__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__37241 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__37241__delegate.call(this, args)
      };
      G__37241.cljs$lang$maxFixedArity = 0;
      G__37241.cljs$lang$applyTo = function(arglist__37242) {
        var args = cljs.core.seq(arglist__37242);
        return G__37241__delegate(args)
      };
      G__37241.cljs$lang$arity$variadic = G__37241__delegate;
      return G__37241
    }()
  };
  var partial__5 = function() {
    var G__37243__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__37244__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__37244 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__37244__delegate.call(this, args)
        };
        G__37244.cljs$lang$maxFixedArity = 0;
        G__37244.cljs$lang$applyTo = function(arglist__37245) {
          var args = cljs.core.seq(arglist__37245);
          return G__37244__delegate(args)
        };
        G__37244.cljs$lang$arity$variadic = G__37244__delegate;
        return G__37244
      }()
    };
    var G__37243 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__37243__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__37243.cljs$lang$maxFixedArity = 4;
    G__37243.cljs$lang$applyTo = function(arglist__37246) {
      var f = cljs.core.first(arglist__37246);
      var arg1 = cljs.core.first(cljs.core.next(arglist__37246));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37246)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__37246))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__37246))));
      return G__37243__delegate(f, arg1, arg2, arg3, more)
    };
    G__37243.cljs$lang$arity$variadic = G__37243__delegate;
    return G__37243
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__37247 = null;
      var G__37247__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__37247__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__37247__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__37247__4 = function() {
        var G__37248__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__37248 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__37248__delegate.call(this, a, b, c, ds)
        };
        G__37248.cljs$lang$maxFixedArity = 3;
        G__37248.cljs$lang$applyTo = function(arglist__37249) {
          var a = cljs.core.first(arglist__37249);
          var b = cljs.core.first(cljs.core.next(arglist__37249));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37249)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37249)));
          return G__37248__delegate(a, b, c, ds)
        };
        G__37248.cljs$lang$arity$variadic = G__37248__delegate;
        return G__37248
      }();
      G__37247 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__37247__1.call(this, a);
          case 2:
            return G__37247__2.call(this, a, b);
          case 3:
            return G__37247__3.call(this, a, b, c);
          default:
            return G__37247__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__37247.cljs$lang$maxFixedArity = 3;
      G__37247.cljs$lang$applyTo = G__37247__4.cljs$lang$applyTo;
      return G__37247
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__37250 = null;
      var G__37250__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__37250__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__37250__4 = function() {
        var G__37251__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__37251 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__37251__delegate.call(this, a, b, c, ds)
        };
        G__37251.cljs$lang$maxFixedArity = 3;
        G__37251.cljs$lang$applyTo = function(arglist__37252) {
          var a = cljs.core.first(arglist__37252);
          var b = cljs.core.first(cljs.core.next(arglist__37252));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37252)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37252)));
          return G__37251__delegate(a, b, c, ds)
        };
        G__37251.cljs$lang$arity$variadic = G__37251__delegate;
        return G__37251
      }();
      G__37250 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__37250__2.call(this, a, b);
          case 3:
            return G__37250__3.call(this, a, b, c);
          default:
            return G__37250__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__37250.cljs$lang$maxFixedArity = 3;
      G__37250.cljs$lang$applyTo = G__37250__4.cljs$lang$applyTo;
      return G__37250
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__37253 = null;
      var G__37253__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__37253__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__37253__4 = function() {
        var G__37254__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__37254 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__37254__delegate.call(this, a, b, c, ds)
        };
        G__37254.cljs$lang$maxFixedArity = 3;
        G__37254.cljs$lang$applyTo = function(arglist__37255) {
          var a = cljs.core.first(arglist__37255);
          var b = cljs.core.first(cljs.core.next(arglist__37255));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37255)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37255)));
          return G__37254__delegate(a, b, c, ds)
        };
        G__37254.cljs$lang$arity$variadic = G__37254__delegate;
        return G__37254
      }();
      G__37253 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__37253__2.call(this, a, b);
          case 3:
            return G__37253__3.call(this, a, b, c);
          default:
            return G__37253__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__37253.cljs$lang$maxFixedArity = 3;
      G__37253.cljs$lang$applyTo = G__37253__4.cljs$lang$applyTo;
      return G__37253
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__37271 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____37279 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____37279) {
        var s__37280 = temp__3974__auto____37279;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__37280)) {
          var c__37281 = cljs.core.chunk_first.call(null, s__37280);
          var size__37282 = cljs.core.count.call(null, c__37281);
          var b__37283 = cljs.core.chunk_buffer.call(null, size__37282);
          var n__2582__auto____37284 = size__37282;
          var i__37285 = 0;
          while(true) {
            if(i__37285 < n__2582__auto____37284) {
              cljs.core.chunk_append.call(null, b__37283, f.call(null, idx + i__37285, cljs.core._nth.call(null, c__37281, i__37285)));
              var G__37286 = i__37285 + 1;
              i__37285 = G__37286;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__37283), mapi.call(null, idx + size__37282, cljs.core.chunk_rest.call(null, s__37280)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__37280)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__37280)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__37271.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____37296 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____37296) {
      var s__37297 = temp__3974__auto____37296;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__37297)) {
        var c__37298 = cljs.core.chunk_first.call(null, s__37297);
        var size__37299 = cljs.core.count.call(null, c__37298);
        var b__37300 = cljs.core.chunk_buffer.call(null, size__37299);
        var n__2582__auto____37301 = size__37299;
        var i__37302 = 0;
        while(true) {
          if(i__37302 < n__2582__auto____37301) {
            var x__37303 = f.call(null, cljs.core._nth.call(null, c__37298, i__37302));
            if(x__37303 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__37300, x__37303)
            }
            var G__37305 = i__37302 + 1;
            i__37302 = G__37305;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__37300), keep.call(null, f, cljs.core.chunk_rest.call(null, s__37297)))
      }else {
        var x__37304 = f.call(null, cljs.core.first.call(null, s__37297));
        if(x__37304 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__37297))
        }else {
          return cljs.core.cons.call(null, x__37304, keep.call(null, f, cljs.core.rest.call(null, s__37297)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__37331 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____37341 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____37341) {
        var s__37342 = temp__3974__auto____37341;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__37342)) {
          var c__37343 = cljs.core.chunk_first.call(null, s__37342);
          var size__37344 = cljs.core.count.call(null, c__37343);
          var b__37345 = cljs.core.chunk_buffer.call(null, size__37344);
          var n__2582__auto____37346 = size__37344;
          var i__37347 = 0;
          while(true) {
            if(i__37347 < n__2582__auto____37346) {
              var x__37348 = f.call(null, idx + i__37347, cljs.core._nth.call(null, c__37343, i__37347));
              if(x__37348 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__37345, x__37348)
              }
              var G__37350 = i__37347 + 1;
              i__37347 = G__37350;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__37345), keepi.call(null, idx + size__37344, cljs.core.chunk_rest.call(null, s__37342)))
        }else {
          var x__37349 = f.call(null, idx, cljs.core.first.call(null, s__37342));
          if(x__37349 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__37342))
          }else {
            return cljs.core.cons.call(null, x__37349, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__37342)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__37331.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____37436 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____37436)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____37436
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____37437 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____37437)) {
            var and__3822__auto____37438 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____37438)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____37438
            }
          }else {
            return and__3822__auto____37437
          }
        }())
      };
      var ep1__4 = function() {
        var G__37507__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____37439 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____37439)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____37439
            }
          }())
        };
        var G__37507 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__37507__delegate.call(this, x, y, z, args)
        };
        G__37507.cljs$lang$maxFixedArity = 3;
        G__37507.cljs$lang$applyTo = function(arglist__37508) {
          var x = cljs.core.first(arglist__37508);
          var y = cljs.core.first(cljs.core.next(arglist__37508));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37508)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37508)));
          return G__37507__delegate(x, y, z, args)
        };
        G__37507.cljs$lang$arity$variadic = G__37507__delegate;
        return G__37507
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____37451 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____37451)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____37451
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____37452 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____37452)) {
            var and__3822__auto____37453 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____37453)) {
              var and__3822__auto____37454 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____37454)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____37454
              }
            }else {
              return and__3822__auto____37453
            }
          }else {
            return and__3822__auto____37452
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____37455 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____37455)) {
            var and__3822__auto____37456 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____37456)) {
              var and__3822__auto____37457 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____37457)) {
                var and__3822__auto____37458 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____37458)) {
                  var and__3822__auto____37459 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____37459)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____37459
                  }
                }else {
                  return and__3822__auto____37458
                }
              }else {
                return and__3822__auto____37457
              }
            }else {
              return and__3822__auto____37456
            }
          }else {
            return and__3822__auto____37455
          }
        }())
      };
      var ep2__4 = function() {
        var G__37509__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____37460 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____37460)) {
              return cljs.core.every_QMARK_.call(null, function(p1__37306_SHARP_) {
                var and__3822__auto____37461 = p1.call(null, p1__37306_SHARP_);
                if(cljs.core.truth_(and__3822__auto____37461)) {
                  return p2.call(null, p1__37306_SHARP_)
                }else {
                  return and__3822__auto____37461
                }
              }, args)
            }else {
              return and__3822__auto____37460
            }
          }())
        };
        var G__37509 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__37509__delegate.call(this, x, y, z, args)
        };
        G__37509.cljs$lang$maxFixedArity = 3;
        G__37509.cljs$lang$applyTo = function(arglist__37510) {
          var x = cljs.core.first(arglist__37510);
          var y = cljs.core.first(cljs.core.next(arglist__37510));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37510)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37510)));
          return G__37509__delegate(x, y, z, args)
        };
        G__37509.cljs$lang$arity$variadic = G__37509__delegate;
        return G__37509
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____37480 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____37480)) {
            var and__3822__auto____37481 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____37481)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____37481
            }
          }else {
            return and__3822__auto____37480
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____37482 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____37482)) {
            var and__3822__auto____37483 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____37483)) {
              var and__3822__auto____37484 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____37484)) {
                var and__3822__auto____37485 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____37485)) {
                  var and__3822__auto____37486 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____37486)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____37486
                  }
                }else {
                  return and__3822__auto____37485
                }
              }else {
                return and__3822__auto____37484
              }
            }else {
              return and__3822__auto____37483
            }
          }else {
            return and__3822__auto____37482
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____37487 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____37487)) {
            var and__3822__auto____37488 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____37488)) {
              var and__3822__auto____37489 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____37489)) {
                var and__3822__auto____37490 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____37490)) {
                  var and__3822__auto____37491 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____37491)) {
                    var and__3822__auto____37492 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____37492)) {
                      var and__3822__auto____37493 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____37493)) {
                        var and__3822__auto____37494 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____37494)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____37494
                        }
                      }else {
                        return and__3822__auto____37493
                      }
                    }else {
                      return and__3822__auto____37492
                    }
                  }else {
                    return and__3822__auto____37491
                  }
                }else {
                  return and__3822__auto____37490
                }
              }else {
                return and__3822__auto____37489
              }
            }else {
              return and__3822__auto____37488
            }
          }else {
            return and__3822__auto____37487
          }
        }())
      };
      var ep3__4 = function() {
        var G__37511__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____37495 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____37495)) {
              return cljs.core.every_QMARK_.call(null, function(p1__37307_SHARP_) {
                var and__3822__auto____37496 = p1.call(null, p1__37307_SHARP_);
                if(cljs.core.truth_(and__3822__auto____37496)) {
                  var and__3822__auto____37497 = p2.call(null, p1__37307_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____37497)) {
                    return p3.call(null, p1__37307_SHARP_)
                  }else {
                    return and__3822__auto____37497
                  }
                }else {
                  return and__3822__auto____37496
                }
              }, args)
            }else {
              return and__3822__auto____37495
            }
          }())
        };
        var G__37511 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__37511__delegate.call(this, x, y, z, args)
        };
        G__37511.cljs$lang$maxFixedArity = 3;
        G__37511.cljs$lang$applyTo = function(arglist__37512) {
          var x = cljs.core.first(arglist__37512);
          var y = cljs.core.first(cljs.core.next(arglist__37512));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37512)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37512)));
          return G__37511__delegate(x, y, z, args)
        };
        G__37511.cljs$lang$arity$variadic = G__37511__delegate;
        return G__37511
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__37513__delegate = function(p1, p2, p3, ps) {
      var ps__37498 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__37308_SHARP_) {
            return p1__37308_SHARP_.call(null, x)
          }, ps__37498)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__37309_SHARP_) {
            var and__3822__auto____37503 = p1__37309_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____37503)) {
              return p1__37309_SHARP_.call(null, y)
            }else {
              return and__3822__auto____37503
            }
          }, ps__37498)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__37310_SHARP_) {
            var and__3822__auto____37504 = p1__37310_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____37504)) {
              var and__3822__auto____37505 = p1__37310_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____37505)) {
                return p1__37310_SHARP_.call(null, z)
              }else {
                return and__3822__auto____37505
              }
            }else {
              return and__3822__auto____37504
            }
          }, ps__37498)
        };
        var epn__4 = function() {
          var G__37514__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____37506 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____37506)) {
                return cljs.core.every_QMARK_.call(null, function(p1__37311_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__37311_SHARP_, args)
                }, ps__37498)
              }else {
                return and__3822__auto____37506
              }
            }())
          };
          var G__37514 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__37514__delegate.call(this, x, y, z, args)
          };
          G__37514.cljs$lang$maxFixedArity = 3;
          G__37514.cljs$lang$applyTo = function(arglist__37515) {
            var x = cljs.core.first(arglist__37515);
            var y = cljs.core.first(cljs.core.next(arglist__37515));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37515)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37515)));
            return G__37514__delegate(x, y, z, args)
          };
          G__37514.cljs$lang$arity$variadic = G__37514__delegate;
          return G__37514
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__37513 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__37513__delegate.call(this, p1, p2, p3, ps)
    };
    G__37513.cljs$lang$maxFixedArity = 3;
    G__37513.cljs$lang$applyTo = function(arglist__37516) {
      var p1 = cljs.core.first(arglist__37516);
      var p2 = cljs.core.first(cljs.core.next(arglist__37516));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37516)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37516)));
      return G__37513__delegate(p1, p2, p3, ps)
    };
    G__37513.cljs$lang$arity$variadic = G__37513__delegate;
    return G__37513
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____37597 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____37597)) {
          return or__3824__auto____37597
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____37598 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____37598)) {
          return or__3824__auto____37598
        }else {
          var or__3824__auto____37599 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____37599)) {
            return or__3824__auto____37599
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__37668__delegate = function(x, y, z, args) {
          var or__3824__auto____37600 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____37600)) {
            return or__3824__auto____37600
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__37668 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__37668__delegate.call(this, x, y, z, args)
        };
        G__37668.cljs$lang$maxFixedArity = 3;
        G__37668.cljs$lang$applyTo = function(arglist__37669) {
          var x = cljs.core.first(arglist__37669);
          var y = cljs.core.first(cljs.core.next(arglist__37669));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37669)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37669)));
          return G__37668__delegate(x, y, z, args)
        };
        G__37668.cljs$lang$arity$variadic = G__37668__delegate;
        return G__37668
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____37612 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____37612)) {
          return or__3824__auto____37612
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____37613 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____37613)) {
          return or__3824__auto____37613
        }else {
          var or__3824__auto____37614 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____37614)) {
            return or__3824__auto____37614
          }else {
            var or__3824__auto____37615 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____37615)) {
              return or__3824__auto____37615
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____37616 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____37616)) {
          return or__3824__auto____37616
        }else {
          var or__3824__auto____37617 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____37617)) {
            return or__3824__auto____37617
          }else {
            var or__3824__auto____37618 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____37618)) {
              return or__3824__auto____37618
            }else {
              var or__3824__auto____37619 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____37619)) {
                return or__3824__auto____37619
              }else {
                var or__3824__auto____37620 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____37620)) {
                  return or__3824__auto____37620
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__37670__delegate = function(x, y, z, args) {
          var or__3824__auto____37621 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____37621)) {
            return or__3824__auto____37621
          }else {
            return cljs.core.some.call(null, function(p1__37351_SHARP_) {
              var or__3824__auto____37622 = p1.call(null, p1__37351_SHARP_);
              if(cljs.core.truth_(or__3824__auto____37622)) {
                return or__3824__auto____37622
              }else {
                return p2.call(null, p1__37351_SHARP_)
              }
            }, args)
          }
        };
        var G__37670 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__37670__delegate.call(this, x, y, z, args)
        };
        G__37670.cljs$lang$maxFixedArity = 3;
        G__37670.cljs$lang$applyTo = function(arglist__37671) {
          var x = cljs.core.first(arglist__37671);
          var y = cljs.core.first(cljs.core.next(arglist__37671));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37671)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37671)));
          return G__37670__delegate(x, y, z, args)
        };
        G__37670.cljs$lang$arity$variadic = G__37670__delegate;
        return G__37670
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____37641 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____37641)) {
          return or__3824__auto____37641
        }else {
          var or__3824__auto____37642 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____37642)) {
            return or__3824__auto____37642
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____37643 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____37643)) {
          return or__3824__auto____37643
        }else {
          var or__3824__auto____37644 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____37644)) {
            return or__3824__auto____37644
          }else {
            var or__3824__auto____37645 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____37645)) {
              return or__3824__auto____37645
            }else {
              var or__3824__auto____37646 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____37646)) {
                return or__3824__auto____37646
              }else {
                var or__3824__auto____37647 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____37647)) {
                  return or__3824__auto____37647
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____37648 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____37648)) {
          return or__3824__auto____37648
        }else {
          var or__3824__auto____37649 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____37649)) {
            return or__3824__auto____37649
          }else {
            var or__3824__auto____37650 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____37650)) {
              return or__3824__auto____37650
            }else {
              var or__3824__auto____37651 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____37651)) {
                return or__3824__auto____37651
              }else {
                var or__3824__auto____37652 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____37652)) {
                  return or__3824__auto____37652
                }else {
                  var or__3824__auto____37653 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____37653)) {
                    return or__3824__auto____37653
                  }else {
                    var or__3824__auto____37654 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____37654)) {
                      return or__3824__auto____37654
                    }else {
                      var or__3824__auto____37655 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____37655)) {
                        return or__3824__auto____37655
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__37672__delegate = function(x, y, z, args) {
          var or__3824__auto____37656 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____37656)) {
            return or__3824__auto____37656
          }else {
            return cljs.core.some.call(null, function(p1__37352_SHARP_) {
              var or__3824__auto____37657 = p1.call(null, p1__37352_SHARP_);
              if(cljs.core.truth_(or__3824__auto____37657)) {
                return or__3824__auto____37657
              }else {
                var or__3824__auto____37658 = p2.call(null, p1__37352_SHARP_);
                if(cljs.core.truth_(or__3824__auto____37658)) {
                  return or__3824__auto____37658
                }else {
                  return p3.call(null, p1__37352_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__37672 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__37672__delegate.call(this, x, y, z, args)
        };
        G__37672.cljs$lang$maxFixedArity = 3;
        G__37672.cljs$lang$applyTo = function(arglist__37673) {
          var x = cljs.core.first(arglist__37673);
          var y = cljs.core.first(cljs.core.next(arglist__37673));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37673)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37673)));
          return G__37672__delegate(x, y, z, args)
        };
        G__37672.cljs$lang$arity$variadic = G__37672__delegate;
        return G__37672
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__37674__delegate = function(p1, p2, p3, ps) {
      var ps__37659 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__37353_SHARP_) {
            return p1__37353_SHARP_.call(null, x)
          }, ps__37659)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__37354_SHARP_) {
            var or__3824__auto____37664 = p1__37354_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____37664)) {
              return or__3824__auto____37664
            }else {
              return p1__37354_SHARP_.call(null, y)
            }
          }, ps__37659)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__37355_SHARP_) {
            var or__3824__auto____37665 = p1__37355_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____37665)) {
              return or__3824__auto____37665
            }else {
              var or__3824__auto____37666 = p1__37355_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____37666)) {
                return or__3824__auto____37666
              }else {
                return p1__37355_SHARP_.call(null, z)
              }
            }
          }, ps__37659)
        };
        var spn__4 = function() {
          var G__37675__delegate = function(x, y, z, args) {
            var or__3824__auto____37667 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____37667)) {
              return or__3824__auto____37667
            }else {
              return cljs.core.some.call(null, function(p1__37356_SHARP_) {
                return cljs.core.some.call(null, p1__37356_SHARP_, args)
              }, ps__37659)
            }
          };
          var G__37675 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__37675__delegate.call(this, x, y, z, args)
          };
          G__37675.cljs$lang$maxFixedArity = 3;
          G__37675.cljs$lang$applyTo = function(arglist__37676) {
            var x = cljs.core.first(arglist__37676);
            var y = cljs.core.first(cljs.core.next(arglist__37676));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37676)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37676)));
            return G__37675__delegate(x, y, z, args)
          };
          G__37675.cljs$lang$arity$variadic = G__37675__delegate;
          return G__37675
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__37674 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__37674__delegate.call(this, p1, p2, p3, ps)
    };
    G__37674.cljs$lang$maxFixedArity = 3;
    G__37674.cljs$lang$applyTo = function(arglist__37677) {
      var p1 = cljs.core.first(arglist__37677);
      var p2 = cljs.core.first(cljs.core.next(arglist__37677));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37677)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37677)));
      return G__37674__delegate(p1, p2, p3, ps)
    };
    G__37674.cljs$lang$arity$variadic = G__37674__delegate;
    return G__37674
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____37696 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____37696) {
        var s__37697 = temp__3974__auto____37696;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__37697)) {
          var c__37698 = cljs.core.chunk_first.call(null, s__37697);
          var size__37699 = cljs.core.count.call(null, c__37698);
          var b__37700 = cljs.core.chunk_buffer.call(null, size__37699);
          var n__2582__auto____37701 = size__37699;
          var i__37702 = 0;
          while(true) {
            if(i__37702 < n__2582__auto____37701) {
              cljs.core.chunk_append.call(null, b__37700, f.call(null, cljs.core._nth.call(null, c__37698, i__37702)));
              var G__37714 = i__37702 + 1;
              i__37702 = G__37714;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__37700), map.call(null, f, cljs.core.chunk_rest.call(null, s__37697)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__37697)), map.call(null, f, cljs.core.rest.call(null, s__37697)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__37703 = cljs.core.seq.call(null, c1);
      var s2__37704 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____37705 = s1__37703;
        if(and__3822__auto____37705) {
          return s2__37704
        }else {
          return and__3822__auto____37705
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__37703), cljs.core.first.call(null, s2__37704)), map.call(null, f, cljs.core.rest.call(null, s1__37703), cljs.core.rest.call(null, s2__37704)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__37706 = cljs.core.seq.call(null, c1);
      var s2__37707 = cljs.core.seq.call(null, c2);
      var s3__37708 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____37709 = s1__37706;
        if(and__3822__auto____37709) {
          var and__3822__auto____37710 = s2__37707;
          if(and__3822__auto____37710) {
            return s3__37708
          }else {
            return and__3822__auto____37710
          }
        }else {
          return and__3822__auto____37709
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__37706), cljs.core.first.call(null, s2__37707), cljs.core.first.call(null, s3__37708)), map.call(null, f, cljs.core.rest.call(null, s1__37706), cljs.core.rest.call(null, s2__37707), cljs.core.rest.call(null, s3__37708)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__37715__delegate = function(f, c1, c2, c3, colls) {
      var step__37713 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__37712 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__37712)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__37712), step.call(null, map.call(null, cljs.core.rest, ss__37712)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__37517_SHARP_) {
        return cljs.core.apply.call(null, f, p1__37517_SHARP_)
      }, step__37713.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__37715 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__37715__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__37715.cljs$lang$maxFixedArity = 4;
    G__37715.cljs$lang$applyTo = function(arglist__37716) {
      var f = cljs.core.first(arglist__37716);
      var c1 = cljs.core.first(cljs.core.next(arglist__37716));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37716)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__37716))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__37716))));
      return G__37715__delegate(f, c1, c2, c3, colls)
    };
    G__37715.cljs$lang$arity$variadic = G__37715__delegate;
    return G__37715
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____37719 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____37719) {
        var s__37720 = temp__3974__auto____37719;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__37720), take.call(null, n - 1, cljs.core.rest.call(null, s__37720)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__37726 = function(n, coll) {
    while(true) {
      var s__37724 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____37725 = n > 0;
        if(and__3822__auto____37725) {
          return s__37724
        }else {
          return and__3822__auto____37725
        }
      }())) {
        var G__37727 = n - 1;
        var G__37728 = cljs.core.rest.call(null, s__37724);
        n = G__37727;
        coll = G__37728;
        continue
      }else {
        return s__37724
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__37726.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__37731 = cljs.core.seq.call(null, coll);
  var lead__37732 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__37732) {
      var G__37733 = cljs.core.next.call(null, s__37731);
      var G__37734 = cljs.core.next.call(null, lead__37732);
      s__37731 = G__37733;
      lead__37732 = G__37734;
      continue
    }else {
      return s__37731
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__37740 = function(pred, coll) {
    while(true) {
      var s__37738 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____37739 = s__37738;
        if(and__3822__auto____37739) {
          return pred.call(null, cljs.core.first.call(null, s__37738))
        }else {
          return and__3822__auto____37739
        }
      }())) {
        var G__37741 = pred;
        var G__37742 = cljs.core.rest.call(null, s__37738);
        pred = G__37741;
        coll = G__37742;
        continue
      }else {
        return s__37738
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__37740.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____37745 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____37745) {
      var s__37746 = temp__3974__auto____37745;
      return cljs.core.concat.call(null, s__37746, cycle.call(null, s__37746))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__37751 = cljs.core.seq.call(null, c1);
      var s2__37752 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____37753 = s1__37751;
        if(and__3822__auto____37753) {
          return s2__37752
        }else {
          return and__3822__auto____37753
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__37751), cljs.core.cons.call(null, cljs.core.first.call(null, s2__37752), interleave.call(null, cljs.core.rest.call(null, s1__37751), cljs.core.rest.call(null, s2__37752))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__37755__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__37754 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__37754)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__37754), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__37754)))
        }else {
          return null
        }
      }, null)
    };
    var G__37755 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__37755__delegate.call(this, c1, c2, colls)
    };
    G__37755.cljs$lang$maxFixedArity = 2;
    G__37755.cljs$lang$applyTo = function(arglist__37756) {
      var c1 = cljs.core.first(arglist__37756);
      var c2 = cljs.core.first(cljs.core.next(arglist__37756));
      var colls = cljs.core.rest(cljs.core.next(arglist__37756));
      return G__37755__delegate(c1, c2, colls)
    };
    G__37755.cljs$lang$arity$variadic = G__37755__delegate;
    return G__37755
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__37766 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____37764 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____37764) {
        var coll__37765 = temp__3971__auto____37764;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__37765), cat.call(null, cljs.core.rest.call(null, coll__37765), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__37766.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__37767__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__37767 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__37767__delegate.call(this, f, coll, colls)
    };
    G__37767.cljs$lang$maxFixedArity = 2;
    G__37767.cljs$lang$applyTo = function(arglist__37768) {
      var f = cljs.core.first(arglist__37768);
      var coll = cljs.core.first(cljs.core.next(arglist__37768));
      var colls = cljs.core.rest(cljs.core.next(arglist__37768));
      return G__37767__delegate(f, coll, colls)
    };
    G__37767.cljs$lang$arity$variadic = G__37767__delegate;
    return G__37767
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____37778 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____37778) {
      var s__37779 = temp__3974__auto____37778;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__37779)) {
        var c__37780 = cljs.core.chunk_first.call(null, s__37779);
        var size__37781 = cljs.core.count.call(null, c__37780);
        var b__37782 = cljs.core.chunk_buffer.call(null, size__37781);
        var n__2582__auto____37783 = size__37781;
        var i__37784 = 0;
        while(true) {
          if(i__37784 < n__2582__auto____37783) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__37780, i__37784)))) {
              cljs.core.chunk_append.call(null, b__37782, cljs.core._nth.call(null, c__37780, i__37784))
            }else {
            }
            var G__37787 = i__37784 + 1;
            i__37784 = G__37787;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__37782), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__37779)))
      }else {
        var f__37785 = cljs.core.first.call(null, s__37779);
        var r__37786 = cljs.core.rest.call(null, s__37779);
        if(cljs.core.truth_(pred.call(null, f__37785))) {
          return cljs.core.cons.call(null, f__37785, filter.call(null, pred, r__37786))
        }else {
          return filter.call(null, pred, r__37786)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__37790 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__37790.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__37788_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__37788_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__37794__37795 = to;
    if(G__37794__37795) {
      if(function() {
        var or__3824__auto____37796 = G__37794__37795.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____37796) {
          return or__3824__auto____37796
        }else {
          return G__37794__37795.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__37794__37795.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__37794__37795)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__37794__37795)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__37797__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__37797 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__37797__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__37797.cljs$lang$maxFixedArity = 4;
    G__37797.cljs$lang$applyTo = function(arglist__37798) {
      var f = cljs.core.first(arglist__37798);
      var c1 = cljs.core.first(cljs.core.next(arglist__37798));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37798)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__37798))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__37798))));
      return G__37797__delegate(f, c1, c2, c3, colls)
    };
    G__37797.cljs$lang$arity$variadic = G__37797__delegate;
    return G__37797
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____37805 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____37805) {
        var s__37806 = temp__3974__auto____37805;
        var p__37807 = cljs.core.take.call(null, n, s__37806);
        if(n === cljs.core.count.call(null, p__37807)) {
          return cljs.core.cons.call(null, p__37807, partition.call(null, n, step, cljs.core.drop.call(null, step, s__37806)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____37808 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____37808) {
        var s__37809 = temp__3974__auto____37808;
        var p__37810 = cljs.core.take.call(null, n, s__37809);
        if(n === cljs.core.count.call(null, p__37810)) {
          return cljs.core.cons.call(null, p__37810, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__37809)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__37810, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__37815 = cljs.core.lookup_sentinel;
    var m__37816 = m;
    var ks__37817 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__37817) {
        var m__37818 = cljs.core._lookup.call(null, m__37816, cljs.core.first.call(null, ks__37817), sentinel__37815);
        if(sentinel__37815 === m__37818) {
          return not_found
        }else {
          var G__37819 = sentinel__37815;
          var G__37820 = m__37818;
          var G__37821 = cljs.core.next.call(null, ks__37817);
          sentinel__37815 = G__37819;
          m__37816 = G__37820;
          ks__37817 = G__37821;
          continue
        }
      }else {
        return m__37816
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__37822, v) {
  var vec__37827__37828 = p__37822;
  var k__37829 = cljs.core.nth.call(null, vec__37827__37828, 0, null);
  var ks__37830 = cljs.core.nthnext.call(null, vec__37827__37828, 1);
  if(cljs.core.truth_(ks__37830)) {
    return cljs.core.assoc.call(null, m, k__37829, assoc_in.call(null, cljs.core._lookup.call(null, m, k__37829, null), ks__37830, v))
  }else {
    return cljs.core.assoc.call(null, m, k__37829, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__37831, f, args) {
    var vec__37836__37837 = p__37831;
    var k__37838 = cljs.core.nth.call(null, vec__37836__37837, 0, null);
    var ks__37839 = cljs.core.nthnext.call(null, vec__37836__37837, 1);
    if(cljs.core.truth_(ks__37839)) {
      return cljs.core.assoc.call(null, m, k__37838, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__37838, null), ks__37839, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__37838, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__37838, null), args))
    }
  };
  var update_in = function(m, p__37831, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__37831, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__37840) {
    var m = cljs.core.first(arglist__37840);
    var p__37831 = cljs.core.first(cljs.core.next(arglist__37840));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__37840)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__37840)));
    return update_in__delegate(m, p__37831, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__37843 = this;
  var h__2247__auto____37844 = this__37843.__hash;
  if(!(h__2247__auto____37844 == null)) {
    return h__2247__auto____37844
  }else {
    var h__2247__auto____37845 = cljs.core.hash_coll.call(null, coll);
    this__37843.__hash = h__2247__auto____37845;
    return h__2247__auto____37845
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__37846 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__37847 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__37848 = this;
  var new_array__37849 = this__37848.array.slice();
  new_array__37849[k] = v;
  return new cljs.core.Vector(this__37848.meta, new_array__37849, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__37880 = null;
  var G__37880__2 = function(this_sym37850, k) {
    var this__37852 = this;
    var this_sym37850__37853 = this;
    var coll__37854 = this_sym37850__37853;
    return coll__37854.cljs$core$ILookup$_lookup$arity$2(coll__37854, k)
  };
  var G__37880__3 = function(this_sym37851, k, not_found) {
    var this__37852 = this;
    var this_sym37851__37855 = this;
    var coll__37856 = this_sym37851__37855;
    return coll__37856.cljs$core$ILookup$_lookup$arity$3(coll__37856, k, not_found)
  };
  G__37880 = function(this_sym37851, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__37880__2.call(this, this_sym37851, k);
      case 3:
        return G__37880__3.call(this, this_sym37851, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__37880
}();
cljs.core.Vector.prototype.apply = function(this_sym37841, args37842) {
  var this__37857 = this;
  return this_sym37841.call.apply(this_sym37841, [this_sym37841].concat(args37842.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__37858 = this;
  var new_array__37859 = this__37858.array.slice();
  new_array__37859.push(o);
  return new cljs.core.Vector(this__37858.meta, new_array__37859, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__37860 = this;
  var this__37861 = this;
  return cljs.core.pr_str.call(null, this__37861)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__37862 = this;
  return cljs.core.ci_reduce.call(null, this__37862.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__37863 = this;
  return cljs.core.ci_reduce.call(null, this__37863.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__37864 = this;
  if(this__37864.array.length > 0) {
    var vector_seq__37865 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__37864.array.length) {
          return cljs.core.cons.call(null, this__37864.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__37865.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__37866 = this;
  return this__37866.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__37867 = this;
  var count__37868 = this__37867.array.length;
  if(count__37868 > 0) {
    return this__37867.array[count__37868 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__37869 = this;
  if(this__37869.array.length > 0) {
    var new_array__37870 = this__37869.array.slice();
    new_array__37870.pop();
    return new cljs.core.Vector(this__37869.meta, new_array__37870, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__37871 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__37872 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__37873 = this;
  return new cljs.core.Vector(meta, this__37873.array, this__37873.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__37874 = this;
  return this__37874.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__37875 = this;
  if(function() {
    var and__3822__auto____37876 = 0 <= n;
    if(and__3822__auto____37876) {
      return n < this__37875.array.length
    }else {
      return and__3822__auto____37876
    }
  }()) {
    return this__37875.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__37877 = this;
  if(function() {
    var and__3822__auto____37878 = 0 <= n;
    if(and__3822__auto____37878) {
      return n < this__37877.array.length
    }else {
      return and__3822__auto____37878
    }
  }()) {
    return this__37877.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__37879 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__37879.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2365__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__37882 = pv.cnt;
  if(cnt__37882 < 32) {
    return 0
  }else {
    return cnt__37882 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__37888 = level;
  var ret__37889 = node;
  while(true) {
    if(ll__37888 === 0) {
      return ret__37889
    }else {
      var embed__37890 = ret__37889;
      var r__37891 = cljs.core.pv_fresh_node.call(null, edit);
      var ___37892 = cljs.core.pv_aset.call(null, r__37891, 0, embed__37890);
      var G__37893 = ll__37888 - 5;
      var G__37894 = r__37891;
      ll__37888 = G__37893;
      ret__37889 = G__37894;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__37900 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__37901 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__37900, subidx__37901, tailnode);
    return ret__37900
  }else {
    var child__37902 = cljs.core.pv_aget.call(null, parent, subidx__37901);
    if(!(child__37902 == null)) {
      var node_to_insert__37903 = push_tail.call(null, pv, level - 5, child__37902, tailnode);
      cljs.core.pv_aset.call(null, ret__37900, subidx__37901, node_to_insert__37903);
      return ret__37900
    }else {
      var node_to_insert__37904 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__37900, subidx__37901, node_to_insert__37904);
      return ret__37900
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____37908 = 0 <= i;
    if(and__3822__auto____37908) {
      return i < pv.cnt
    }else {
      return and__3822__auto____37908
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__37909 = pv.root;
      var level__37910 = pv.shift;
      while(true) {
        if(level__37910 > 0) {
          var G__37911 = cljs.core.pv_aget.call(null, node__37909, i >>> level__37910 & 31);
          var G__37912 = level__37910 - 5;
          node__37909 = G__37911;
          level__37910 = G__37912;
          continue
        }else {
          return node__37909.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__37915 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__37915, i & 31, val);
    return ret__37915
  }else {
    var subidx__37916 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__37915, subidx__37916, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__37916), i, val));
    return ret__37915
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__37922 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__37923 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__37922));
    if(function() {
      var and__3822__auto____37924 = new_child__37923 == null;
      if(and__3822__auto____37924) {
        return subidx__37922 === 0
      }else {
        return and__3822__auto____37924
      }
    }()) {
      return null
    }else {
      var ret__37925 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__37925, subidx__37922, new_child__37923);
      return ret__37925
    }
  }else {
    if(subidx__37922 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__37926 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__37926, subidx__37922, null);
        return ret__37926
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__37929 = this;
  return new cljs.core.TransientVector(this__37929.cnt, this__37929.shift, cljs.core.tv_editable_root.call(null, this__37929.root), cljs.core.tv_editable_tail.call(null, this__37929.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__37930 = this;
  var h__2247__auto____37931 = this__37930.__hash;
  if(!(h__2247__auto____37931 == null)) {
    return h__2247__auto____37931
  }else {
    var h__2247__auto____37932 = cljs.core.hash_coll.call(null, coll);
    this__37930.__hash = h__2247__auto____37932;
    return h__2247__auto____37932
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__37933 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__37934 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__37935 = this;
  if(function() {
    var and__3822__auto____37936 = 0 <= k;
    if(and__3822__auto____37936) {
      return k < this__37935.cnt
    }else {
      return and__3822__auto____37936
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__37937 = this__37935.tail.slice();
      new_tail__37937[k & 31] = v;
      return new cljs.core.PersistentVector(this__37935.meta, this__37935.cnt, this__37935.shift, this__37935.root, new_tail__37937, null)
    }else {
      return new cljs.core.PersistentVector(this__37935.meta, this__37935.cnt, this__37935.shift, cljs.core.do_assoc.call(null, coll, this__37935.shift, this__37935.root, k, v), this__37935.tail, null)
    }
  }else {
    if(k === this__37935.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__37935.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__37985 = null;
  var G__37985__2 = function(this_sym37938, k) {
    var this__37940 = this;
    var this_sym37938__37941 = this;
    var coll__37942 = this_sym37938__37941;
    return coll__37942.cljs$core$ILookup$_lookup$arity$2(coll__37942, k)
  };
  var G__37985__3 = function(this_sym37939, k, not_found) {
    var this__37940 = this;
    var this_sym37939__37943 = this;
    var coll__37944 = this_sym37939__37943;
    return coll__37944.cljs$core$ILookup$_lookup$arity$3(coll__37944, k, not_found)
  };
  G__37985 = function(this_sym37939, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__37985__2.call(this, this_sym37939, k);
      case 3:
        return G__37985__3.call(this, this_sym37939, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__37985
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym37927, args37928) {
  var this__37945 = this;
  return this_sym37927.call.apply(this_sym37927, [this_sym37927].concat(args37928.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__37946 = this;
  var step_init__37947 = [0, init];
  var i__37948 = 0;
  while(true) {
    if(i__37948 < this__37946.cnt) {
      var arr__37949 = cljs.core.array_for.call(null, v, i__37948);
      var len__37950 = arr__37949.length;
      var init__37954 = function() {
        var j__37951 = 0;
        var init__37952 = step_init__37947[1];
        while(true) {
          if(j__37951 < len__37950) {
            var init__37953 = f.call(null, init__37952, j__37951 + i__37948, arr__37949[j__37951]);
            if(cljs.core.reduced_QMARK_.call(null, init__37953)) {
              return init__37953
            }else {
              var G__37986 = j__37951 + 1;
              var G__37987 = init__37953;
              j__37951 = G__37986;
              init__37952 = G__37987;
              continue
            }
          }else {
            step_init__37947[0] = len__37950;
            step_init__37947[1] = init__37952;
            return init__37952
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__37954)) {
        return cljs.core.deref.call(null, init__37954)
      }else {
        var G__37988 = i__37948 + step_init__37947[0];
        i__37948 = G__37988;
        continue
      }
    }else {
      return step_init__37947[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__37955 = this;
  if(this__37955.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__37956 = this__37955.tail.slice();
    new_tail__37956.push(o);
    return new cljs.core.PersistentVector(this__37955.meta, this__37955.cnt + 1, this__37955.shift, this__37955.root, new_tail__37956, null)
  }else {
    var root_overflow_QMARK___37957 = this__37955.cnt >>> 5 > 1 << this__37955.shift;
    var new_shift__37958 = root_overflow_QMARK___37957 ? this__37955.shift + 5 : this__37955.shift;
    var new_root__37960 = root_overflow_QMARK___37957 ? function() {
      var n_r__37959 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__37959, 0, this__37955.root);
      cljs.core.pv_aset.call(null, n_r__37959, 1, cljs.core.new_path.call(null, null, this__37955.shift, new cljs.core.VectorNode(null, this__37955.tail)));
      return n_r__37959
    }() : cljs.core.push_tail.call(null, coll, this__37955.shift, this__37955.root, new cljs.core.VectorNode(null, this__37955.tail));
    return new cljs.core.PersistentVector(this__37955.meta, this__37955.cnt + 1, new_shift__37958, new_root__37960, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__37961 = this;
  if(this__37961.cnt > 0) {
    return new cljs.core.RSeq(coll, this__37961.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__37962 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__37963 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__37964 = this;
  var this__37965 = this;
  return cljs.core.pr_str.call(null, this__37965)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__37966 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__37967 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__37968 = this;
  if(this__37968.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__37969 = this;
  return this__37969.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__37970 = this;
  if(this__37970.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__37970.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__37971 = this;
  if(this__37971.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__37971.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__37971.meta)
    }else {
      if(1 < this__37971.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__37971.meta, this__37971.cnt - 1, this__37971.shift, this__37971.root, this__37971.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__37972 = cljs.core.array_for.call(null, coll, this__37971.cnt - 2);
          var nr__37973 = cljs.core.pop_tail.call(null, coll, this__37971.shift, this__37971.root);
          var new_root__37974 = nr__37973 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__37973;
          var cnt_1__37975 = this__37971.cnt - 1;
          if(function() {
            var and__3822__auto____37976 = 5 < this__37971.shift;
            if(and__3822__auto____37976) {
              return cljs.core.pv_aget.call(null, new_root__37974, 1) == null
            }else {
              return and__3822__auto____37976
            }
          }()) {
            return new cljs.core.PersistentVector(this__37971.meta, cnt_1__37975, this__37971.shift - 5, cljs.core.pv_aget.call(null, new_root__37974, 0), new_tail__37972, null)
          }else {
            return new cljs.core.PersistentVector(this__37971.meta, cnt_1__37975, this__37971.shift, new_root__37974, new_tail__37972, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__37977 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__37978 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__37979 = this;
  return new cljs.core.PersistentVector(meta, this__37979.cnt, this__37979.shift, this__37979.root, this__37979.tail, this__37979.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__37980 = this;
  return this__37980.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__37981 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__37982 = this;
  if(function() {
    var and__3822__auto____37983 = 0 <= n;
    if(and__3822__auto____37983) {
      return n < this__37982.cnt
    }else {
      return and__3822__auto____37983
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__37984 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__37984.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__37989 = xs.length;
  var xs__37990 = no_clone === true ? xs : xs.slice();
  if(l__37989 < 32) {
    return new cljs.core.PersistentVector(null, l__37989, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__37990, null)
  }else {
    var node__37991 = xs__37990.slice(0, 32);
    var v__37992 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__37991, null);
    var i__37993 = 32;
    var out__37994 = cljs.core._as_transient.call(null, v__37992);
    while(true) {
      if(i__37993 < l__37989) {
        var G__37995 = i__37993 + 1;
        var G__37996 = cljs.core.conj_BANG_.call(null, out__37994, xs__37990[i__37993]);
        i__37993 = G__37995;
        out__37994 = G__37996;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__37994)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__37997) {
    var args = cljs.core.seq(arglist__37997);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__37998 = this;
  if(this__37998.off + 1 < this__37998.node.length) {
    var s__37999 = cljs.core.chunked_seq.call(null, this__37998.vec, this__37998.node, this__37998.i, this__37998.off + 1);
    if(s__37999 == null) {
      return null
    }else {
      return s__37999
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__38000 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__38001 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__38002 = this;
  return this__38002.node[this__38002.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__38003 = this;
  if(this__38003.off + 1 < this__38003.node.length) {
    var s__38004 = cljs.core.chunked_seq.call(null, this__38003.vec, this__38003.node, this__38003.i, this__38003.off + 1);
    if(s__38004 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__38004
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__38005 = this;
  var l__38006 = this__38005.node.length;
  var s__38007 = this__38005.i + l__38006 < cljs.core._count.call(null, this__38005.vec) ? cljs.core.chunked_seq.call(null, this__38005.vec, this__38005.i + l__38006, 0) : null;
  if(s__38007 == null) {
    return null
  }else {
    return s__38007
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38008 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__38009 = this;
  return cljs.core.chunked_seq.call(null, this__38009.vec, this__38009.node, this__38009.i, this__38009.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__38010 = this;
  return this__38010.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__38011 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__38011.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__38012 = this;
  return cljs.core.array_chunk.call(null, this__38012.node, this__38012.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__38013 = this;
  var l__38014 = this__38013.node.length;
  var s__38015 = this__38013.i + l__38014 < cljs.core._count.call(null, this__38013.vec) ? cljs.core.chunked_seq.call(null, this__38013.vec, this__38013.i + l__38014, 0) : null;
  if(s__38015 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__38015
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38018 = this;
  var h__2247__auto____38019 = this__38018.__hash;
  if(!(h__2247__auto____38019 == null)) {
    return h__2247__auto____38019
  }else {
    var h__2247__auto____38020 = cljs.core.hash_coll.call(null, coll);
    this__38018.__hash = h__2247__auto____38020;
    return h__2247__auto____38020
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__38021 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__38022 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__38023 = this;
  var v_pos__38024 = this__38023.start + key;
  return new cljs.core.Subvec(this__38023.meta, cljs.core._assoc.call(null, this__38023.v, v_pos__38024, val), this__38023.start, this__38023.end > v_pos__38024 + 1 ? this__38023.end : v_pos__38024 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__38050 = null;
  var G__38050__2 = function(this_sym38025, k) {
    var this__38027 = this;
    var this_sym38025__38028 = this;
    var coll__38029 = this_sym38025__38028;
    return coll__38029.cljs$core$ILookup$_lookup$arity$2(coll__38029, k)
  };
  var G__38050__3 = function(this_sym38026, k, not_found) {
    var this__38027 = this;
    var this_sym38026__38030 = this;
    var coll__38031 = this_sym38026__38030;
    return coll__38031.cljs$core$ILookup$_lookup$arity$3(coll__38031, k, not_found)
  };
  G__38050 = function(this_sym38026, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__38050__2.call(this, this_sym38026, k);
      case 3:
        return G__38050__3.call(this, this_sym38026, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__38050
}();
cljs.core.Subvec.prototype.apply = function(this_sym38016, args38017) {
  var this__38032 = this;
  return this_sym38016.call.apply(this_sym38016, [this_sym38016].concat(args38017.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__38033 = this;
  return new cljs.core.Subvec(this__38033.meta, cljs.core._assoc_n.call(null, this__38033.v, this__38033.end, o), this__38033.start, this__38033.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__38034 = this;
  var this__38035 = this;
  return cljs.core.pr_str.call(null, this__38035)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__38036 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__38037 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__38038 = this;
  var subvec_seq__38039 = function subvec_seq(i) {
    if(i === this__38038.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__38038.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__38039.call(null, this__38038.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__38040 = this;
  return this__38040.end - this__38040.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__38041 = this;
  return cljs.core._nth.call(null, this__38041.v, this__38041.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__38042 = this;
  if(this__38042.start === this__38042.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__38042.meta, this__38042.v, this__38042.start, this__38042.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__38043 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38044 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__38045 = this;
  return new cljs.core.Subvec(meta, this__38045.v, this__38045.start, this__38045.end, this__38045.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__38046 = this;
  return this__38046.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__38047 = this;
  return cljs.core._nth.call(null, this__38047.v, this__38047.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__38048 = this;
  return cljs.core._nth.call(null, this__38048.v, this__38048.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__38049 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__38049.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__38052 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__38052, 0, tl.length);
  return ret__38052
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__38056 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__38057 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__38056, subidx__38057, level === 5 ? tail_node : function() {
    var child__38058 = cljs.core.pv_aget.call(null, ret__38056, subidx__38057);
    if(!(child__38058 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__38058, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__38056
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__38063 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__38064 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__38065 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__38063, subidx__38064));
    if(function() {
      var and__3822__auto____38066 = new_child__38065 == null;
      if(and__3822__auto____38066) {
        return subidx__38064 === 0
      }else {
        return and__3822__auto____38066
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__38063, subidx__38064, new_child__38065);
      return node__38063
    }
  }else {
    if(subidx__38064 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__38063, subidx__38064, null);
        return node__38063
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____38071 = 0 <= i;
    if(and__3822__auto____38071) {
      return i < tv.cnt
    }else {
      return and__3822__auto____38071
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__38072 = tv.root;
      var node__38073 = root__38072;
      var level__38074 = tv.shift;
      while(true) {
        if(level__38074 > 0) {
          var G__38075 = cljs.core.tv_ensure_editable.call(null, root__38072.edit, cljs.core.pv_aget.call(null, node__38073, i >>> level__38074 & 31));
          var G__38076 = level__38074 - 5;
          node__38073 = G__38075;
          level__38074 = G__38076;
          continue
        }else {
          return node__38073.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__38116 = null;
  var G__38116__2 = function(this_sym38079, k) {
    var this__38081 = this;
    var this_sym38079__38082 = this;
    var coll__38083 = this_sym38079__38082;
    return coll__38083.cljs$core$ILookup$_lookup$arity$2(coll__38083, k)
  };
  var G__38116__3 = function(this_sym38080, k, not_found) {
    var this__38081 = this;
    var this_sym38080__38084 = this;
    var coll__38085 = this_sym38080__38084;
    return coll__38085.cljs$core$ILookup$_lookup$arity$3(coll__38085, k, not_found)
  };
  G__38116 = function(this_sym38080, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__38116__2.call(this, this_sym38080, k);
      case 3:
        return G__38116__3.call(this, this_sym38080, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__38116
}();
cljs.core.TransientVector.prototype.apply = function(this_sym38077, args38078) {
  var this__38086 = this;
  return this_sym38077.call.apply(this_sym38077, [this_sym38077].concat(args38078.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__38087 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__38088 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__38089 = this;
  if(this__38089.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__38090 = this;
  if(function() {
    var and__3822__auto____38091 = 0 <= n;
    if(and__3822__auto____38091) {
      return n < this__38090.cnt
    }else {
      return and__3822__auto____38091
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__38092 = this;
  if(this__38092.root.edit) {
    return this__38092.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__38093 = this;
  if(this__38093.root.edit) {
    if(function() {
      var and__3822__auto____38094 = 0 <= n;
      if(and__3822__auto____38094) {
        return n < this__38093.cnt
      }else {
        return and__3822__auto____38094
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__38093.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__38099 = function go(level, node) {
          var node__38097 = cljs.core.tv_ensure_editable.call(null, this__38093.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__38097, n & 31, val);
            return node__38097
          }else {
            var subidx__38098 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__38097, subidx__38098, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__38097, subidx__38098)));
            return node__38097
          }
        }.call(null, this__38093.shift, this__38093.root);
        this__38093.root = new_root__38099;
        return tcoll
      }
    }else {
      if(n === this__38093.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__38093.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__38100 = this;
  if(this__38100.root.edit) {
    if(this__38100.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__38100.cnt) {
        this__38100.cnt = 0;
        return tcoll
      }else {
        if((this__38100.cnt - 1 & 31) > 0) {
          this__38100.cnt = this__38100.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__38101 = cljs.core.editable_array_for.call(null, tcoll, this__38100.cnt - 2);
            var new_root__38103 = function() {
              var nr__38102 = cljs.core.tv_pop_tail.call(null, tcoll, this__38100.shift, this__38100.root);
              if(!(nr__38102 == null)) {
                return nr__38102
              }else {
                return new cljs.core.VectorNode(this__38100.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____38104 = 5 < this__38100.shift;
              if(and__3822__auto____38104) {
                return cljs.core.pv_aget.call(null, new_root__38103, 1) == null
              }else {
                return and__3822__auto____38104
              }
            }()) {
              var new_root__38105 = cljs.core.tv_ensure_editable.call(null, this__38100.root.edit, cljs.core.pv_aget.call(null, new_root__38103, 0));
              this__38100.root = new_root__38105;
              this__38100.shift = this__38100.shift - 5;
              this__38100.cnt = this__38100.cnt - 1;
              this__38100.tail = new_tail__38101;
              return tcoll
            }else {
              this__38100.root = new_root__38103;
              this__38100.cnt = this__38100.cnt - 1;
              this__38100.tail = new_tail__38101;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__38106 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__38107 = this;
  if(this__38107.root.edit) {
    if(this__38107.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__38107.tail[this__38107.cnt & 31] = o;
      this__38107.cnt = this__38107.cnt + 1;
      return tcoll
    }else {
      var tail_node__38108 = new cljs.core.VectorNode(this__38107.root.edit, this__38107.tail);
      var new_tail__38109 = cljs.core.make_array.call(null, 32);
      new_tail__38109[0] = o;
      this__38107.tail = new_tail__38109;
      if(this__38107.cnt >>> 5 > 1 << this__38107.shift) {
        var new_root_array__38110 = cljs.core.make_array.call(null, 32);
        var new_shift__38111 = this__38107.shift + 5;
        new_root_array__38110[0] = this__38107.root;
        new_root_array__38110[1] = cljs.core.new_path.call(null, this__38107.root.edit, this__38107.shift, tail_node__38108);
        this__38107.root = new cljs.core.VectorNode(this__38107.root.edit, new_root_array__38110);
        this__38107.shift = new_shift__38111;
        this__38107.cnt = this__38107.cnt + 1;
        return tcoll
      }else {
        var new_root__38112 = cljs.core.tv_push_tail.call(null, tcoll, this__38107.shift, this__38107.root, tail_node__38108);
        this__38107.root = new_root__38112;
        this__38107.cnt = this__38107.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__38113 = this;
  if(this__38113.root.edit) {
    this__38113.root.edit = null;
    var len__38114 = this__38113.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__38115 = cljs.core.make_array.call(null, len__38114);
    cljs.core.array_copy.call(null, this__38113.tail, 0, trimmed_tail__38115, 0, len__38114);
    return new cljs.core.PersistentVector(null, this__38113.cnt, this__38113.shift, this__38113.root, trimmed_tail__38115, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38117 = this;
  var h__2247__auto____38118 = this__38117.__hash;
  if(!(h__2247__auto____38118 == null)) {
    return h__2247__auto____38118
  }else {
    var h__2247__auto____38119 = cljs.core.hash_coll.call(null, coll);
    this__38117.__hash = h__2247__auto____38119;
    return h__2247__auto____38119
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__38120 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__38121 = this;
  var this__38122 = this;
  return cljs.core.pr_str.call(null, this__38122)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__38123 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__38124 = this;
  return cljs.core._first.call(null, this__38124.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__38125 = this;
  var temp__3971__auto____38126 = cljs.core.next.call(null, this__38125.front);
  if(temp__3971__auto____38126) {
    var f1__38127 = temp__3971__auto____38126;
    return new cljs.core.PersistentQueueSeq(this__38125.meta, f1__38127, this__38125.rear, null)
  }else {
    if(this__38125.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__38125.meta, this__38125.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38128 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__38129 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__38129.front, this__38129.rear, this__38129.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__38130 = this;
  return this__38130.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__38131 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__38131.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38132 = this;
  var h__2247__auto____38133 = this__38132.__hash;
  if(!(h__2247__auto____38133 == null)) {
    return h__2247__auto____38133
  }else {
    var h__2247__auto____38134 = cljs.core.hash_coll.call(null, coll);
    this__38132.__hash = h__2247__auto____38134;
    return h__2247__auto____38134
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__38135 = this;
  if(cljs.core.truth_(this__38135.front)) {
    return new cljs.core.PersistentQueue(this__38135.meta, this__38135.count + 1, this__38135.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____38136 = this__38135.rear;
      if(cljs.core.truth_(or__3824__auto____38136)) {
        return or__3824__auto____38136
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__38135.meta, this__38135.count + 1, cljs.core.conj.call(null, this__38135.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__38137 = this;
  var this__38138 = this;
  return cljs.core.pr_str.call(null, this__38138)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__38139 = this;
  var rear__38140 = cljs.core.seq.call(null, this__38139.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____38141 = this__38139.front;
    if(cljs.core.truth_(or__3824__auto____38141)) {
      return or__3824__auto____38141
    }else {
      return rear__38140
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__38139.front, cljs.core.seq.call(null, rear__38140), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__38142 = this;
  return this__38142.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__38143 = this;
  return cljs.core._first.call(null, this__38143.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__38144 = this;
  if(cljs.core.truth_(this__38144.front)) {
    var temp__3971__auto____38145 = cljs.core.next.call(null, this__38144.front);
    if(temp__3971__auto____38145) {
      var f1__38146 = temp__3971__auto____38145;
      return new cljs.core.PersistentQueue(this__38144.meta, this__38144.count - 1, f1__38146, this__38144.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__38144.meta, this__38144.count - 1, cljs.core.seq.call(null, this__38144.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__38147 = this;
  return cljs.core.first.call(null, this__38147.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__38148 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38149 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__38150 = this;
  return new cljs.core.PersistentQueue(meta, this__38150.count, this__38150.front, this__38150.rear, this__38150.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__38151 = this;
  return this__38151.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__38152 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__38153 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__38156 = array.length;
  var i__38157 = 0;
  while(true) {
    if(i__38157 < len__38156) {
      if(k === array[i__38157]) {
        return i__38157
      }else {
        var G__38158 = i__38157 + incr;
        i__38157 = G__38158;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__38161 = cljs.core.hash.call(null, a);
  var b__38162 = cljs.core.hash.call(null, b);
  if(a__38161 < b__38162) {
    return-1
  }else {
    if(a__38161 > b__38162) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__38170 = m.keys;
  var len__38171 = ks__38170.length;
  var so__38172 = m.strobj;
  var out__38173 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__38174 = 0;
  var out__38175 = cljs.core.transient$.call(null, out__38173);
  while(true) {
    if(i__38174 < len__38171) {
      var k__38176 = ks__38170[i__38174];
      var G__38177 = i__38174 + 1;
      var G__38178 = cljs.core.assoc_BANG_.call(null, out__38175, k__38176, so__38172[k__38176]);
      i__38174 = G__38177;
      out__38175 = G__38178;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__38175, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__38184 = {};
  var l__38185 = ks.length;
  var i__38186 = 0;
  while(true) {
    if(i__38186 < l__38185) {
      var k__38187 = ks[i__38186];
      new_obj__38184[k__38187] = obj[k__38187];
      var G__38188 = i__38186 + 1;
      i__38186 = G__38188;
      continue
    }else {
    }
    break
  }
  return new_obj__38184
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__38191 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38192 = this;
  var h__2247__auto____38193 = this__38192.__hash;
  if(!(h__2247__auto____38193 == null)) {
    return h__2247__auto____38193
  }else {
    var h__2247__auto____38194 = cljs.core.hash_imap.call(null, coll);
    this__38192.__hash = h__2247__auto____38194;
    return h__2247__auto____38194
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__38195 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__38196 = this;
  if(function() {
    var and__3822__auto____38197 = goog.isString(k);
    if(and__3822__auto____38197) {
      return!(cljs.core.scan_array.call(null, 1, k, this__38196.keys) == null)
    }else {
      return and__3822__auto____38197
    }
  }()) {
    return this__38196.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__38198 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____38199 = this__38198.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____38199) {
        return or__3824__auto____38199
      }else {
        return this__38198.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__38198.keys) == null)) {
        var new_strobj__38200 = cljs.core.obj_clone.call(null, this__38198.strobj, this__38198.keys);
        new_strobj__38200[k] = v;
        return new cljs.core.ObjMap(this__38198.meta, this__38198.keys, new_strobj__38200, this__38198.update_count + 1, null)
      }else {
        var new_strobj__38201 = cljs.core.obj_clone.call(null, this__38198.strobj, this__38198.keys);
        var new_keys__38202 = this__38198.keys.slice();
        new_strobj__38201[k] = v;
        new_keys__38202.push(k);
        return new cljs.core.ObjMap(this__38198.meta, new_keys__38202, new_strobj__38201, this__38198.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__38203 = this;
  if(function() {
    var and__3822__auto____38204 = goog.isString(k);
    if(and__3822__auto____38204) {
      return!(cljs.core.scan_array.call(null, 1, k, this__38203.keys) == null)
    }else {
      return and__3822__auto____38204
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__38226 = null;
  var G__38226__2 = function(this_sym38205, k) {
    var this__38207 = this;
    var this_sym38205__38208 = this;
    var coll__38209 = this_sym38205__38208;
    return coll__38209.cljs$core$ILookup$_lookup$arity$2(coll__38209, k)
  };
  var G__38226__3 = function(this_sym38206, k, not_found) {
    var this__38207 = this;
    var this_sym38206__38210 = this;
    var coll__38211 = this_sym38206__38210;
    return coll__38211.cljs$core$ILookup$_lookup$arity$3(coll__38211, k, not_found)
  };
  G__38226 = function(this_sym38206, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__38226__2.call(this, this_sym38206, k);
      case 3:
        return G__38226__3.call(this, this_sym38206, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__38226
}();
cljs.core.ObjMap.prototype.apply = function(this_sym38189, args38190) {
  var this__38212 = this;
  return this_sym38189.call.apply(this_sym38189, [this_sym38189].concat(args38190.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__38213 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__38214 = this;
  var this__38215 = this;
  return cljs.core.pr_str.call(null, this__38215)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__38216 = this;
  if(this__38216.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__38179_SHARP_) {
      return cljs.core.vector.call(null, p1__38179_SHARP_, this__38216.strobj[p1__38179_SHARP_])
    }, this__38216.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__38217 = this;
  return this__38217.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38218 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__38219 = this;
  return new cljs.core.ObjMap(meta, this__38219.keys, this__38219.strobj, this__38219.update_count, this__38219.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__38220 = this;
  return this__38220.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__38221 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__38221.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__38222 = this;
  if(function() {
    var and__3822__auto____38223 = goog.isString(k);
    if(and__3822__auto____38223) {
      return!(cljs.core.scan_array.call(null, 1, k, this__38222.keys) == null)
    }else {
      return and__3822__auto____38223
    }
  }()) {
    var new_keys__38224 = this__38222.keys.slice();
    var new_strobj__38225 = cljs.core.obj_clone.call(null, this__38222.strobj, this__38222.keys);
    new_keys__38224.splice(cljs.core.scan_array.call(null, 1, k, new_keys__38224), 1);
    cljs.core.js_delete.call(null, new_strobj__38225, k);
    return new cljs.core.ObjMap(this__38222.meta, new_keys__38224, new_strobj__38225, this__38222.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38230 = this;
  var h__2247__auto____38231 = this__38230.__hash;
  if(!(h__2247__auto____38231 == null)) {
    return h__2247__auto____38231
  }else {
    var h__2247__auto____38232 = cljs.core.hash_imap.call(null, coll);
    this__38230.__hash = h__2247__auto____38232;
    return h__2247__auto____38232
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__38233 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__38234 = this;
  var bucket__38235 = this__38234.hashobj[cljs.core.hash.call(null, k)];
  var i__38236 = cljs.core.truth_(bucket__38235) ? cljs.core.scan_array.call(null, 2, k, bucket__38235) : null;
  if(cljs.core.truth_(i__38236)) {
    return bucket__38235[i__38236 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__38237 = this;
  var h__38238 = cljs.core.hash.call(null, k);
  var bucket__38239 = this__38237.hashobj[h__38238];
  if(cljs.core.truth_(bucket__38239)) {
    var new_bucket__38240 = bucket__38239.slice();
    var new_hashobj__38241 = goog.object.clone(this__38237.hashobj);
    new_hashobj__38241[h__38238] = new_bucket__38240;
    var temp__3971__auto____38242 = cljs.core.scan_array.call(null, 2, k, new_bucket__38240);
    if(cljs.core.truth_(temp__3971__auto____38242)) {
      var i__38243 = temp__3971__auto____38242;
      new_bucket__38240[i__38243 + 1] = v;
      return new cljs.core.HashMap(this__38237.meta, this__38237.count, new_hashobj__38241, null)
    }else {
      new_bucket__38240.push(k, v);
      return new cljs.core.HashMap(this__38237.meta, this__38237.count + 1, new_hashobj__38241, null)
    }
  }else {
    var new_hashobj__38244 = goog.object.clone(this__38237.hashobj);
    new_hashobj__38244[h__38238] = [k, v];
    return new cljs.core.HashMap(this__38237.meta, this__38237.count + 1, new_hashobj__38244, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__38245 = this;
  var bucket__38246 = this__38245.hashobj[cljs.core.hash.call(null, k)];
  var i__38247 = cljs.core.truth_(bucket__38246) ? cljs.core.scan_array.call(null, 2, k, bucket__38246) : null;
  if(cljs.core.truth_(i__38247)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__38272 = null;
  var G__38272__2 = function(this_sym38248, k) {
    var this__38250 = this;
    var this_sym38248__38251 = this;
    var coll__38252 = this_sym38248__38251;
    return coll__38252.cljs$core$ILookup$_lookup$arity$2(coll__38252, k)
  };
  var G__38272__3 = function(this_sym38249, k, not_found) {
    var this__38250 = this;
    var this_sym38249__38253 = this;
    var coll__38254 = this_sym38249__38253;
    return coll__38254.cljs$core$ILookup$_lookup$arity$3(coll__38254, k, not_found)
  };
  G__38272 = function(this_sym38249, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__38272__2.call(this, this_sym38249, k);
      case 3:
        return G__38272__3.call(this, this_sym38249, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__38272
}();
cljs.core.HashMap.prototype.apply = function(this_sym38228, args38229) {
  var this__38255 = this;
  return this_sym38228.call.apply(this_sym38228, [this_sym38228].concat(args38229.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__38256 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__38257 = this;
  var this__38258 = this;
  return cljs.core.pr_str.call(null, this__38258)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__38259 = this;
  if(this__38259.count > 0) {
    var hashes__38260 = cljs.core.js_keys.call(null, this__38259.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__38227_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__38259.hashobj[p1__38227_SHARP_]))
    }, hashes__38260)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__38261 = this;
  return this__38261.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38262 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__38263 = this;
  return new cljs.core.HashMap(meta, this__38263.count, this__38263.hashobj, this__38263.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__38264 = this;
  return this__38264.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__38265 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__38265.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__38266 = this;
  var h__38267 = cljs.core.hash.call(null, k);
  var bucket__38268 = this__38266.hashobj[h__38267];
  var i__38269 = cljs.core.truth_(bucket__38268) ? cljs.core.scan_array.call(null, 2, k, bucket__38268) : null;
  if(cljs.core.not.call(null, i__38269)) {
    return coll
  }else {
    var new_hashobj__38270 = goog.object.clone(this__38266.hashobj);
    if(3 > bucket__38268.length) {
      cljs.core.js_delete.call(null, new_hashobj__38270, h__38267)
    }else {
      var new_bucket__38271 = bucket__38268.slice();
      new_bucket__38271.splice(i__38269, 2);
      new_hashobj__38270[h__38267] = new_bucket__38271
    }
    return new cljs.core.HashMap(this__38266.meta, this__38266.count - 1, new_hashobj__38270, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__38273 = ks.length;
  var i__38274 = 0;
  var out__38275 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__38274 < len__38273) {
      var G__38276 = i__38274 + 1;
      var G__38277 = cljs.core.assoc.call(null, out__38275, ks[i__38274], vs[i__38274]);
      i__38274 = G__38276;
      out__38275 = G__38277;
      continue
    }else {
      return out__38275
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__38281 = m.arr;
  var len__38282 = arr__38281.length;
  var i__38283 = 0;
  while(true) {
    if(len__38282 <= i__38283) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__38281[i__38283], k)) {
        return i__38283
      }else {
        if("\ufdd0'else") {
          var G__38284 = i__38283 + 2;
          i__38283 = G__38284;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__38287 = this;
  return new cljs.core.TransientArrayMap({}, this__38287.arr.length, this__38287.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38288 = this;
  var h__2247__auto____38289 = this__38288.__hash;
  if(!(h__2247__auto____38289 == null)) {
    return h__2247__auto____38289
  }else {
    var h__2247__auto____38290 = cljs.core.hash_imap.call(null, coll);
    this__38288.__hash = h__2247__auto____38290;
    return h__2247__auto____38290
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__38291 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__38292 = this;
  var idx__38293 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__38293 === -1) {
    return not_found
  }else {
    return this__38292.arr[idx__38293 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__38294 = this;
  var idx__38295 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__38295 === -1) {
    if(this__38294.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__38294.meta, this__38294.cnt + 1, function() {
        var G__38296__38297 = this__38294.arr.slice();
        G__38296__38297.push(k);
        G__38296__38297.push(v);
        return G__38296__38297
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__38294.arr[idx__38295 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__38294.meta, this__38294.cnt, function() {
          var G__38298__38299 = this__38294.arr.slice();
          G__38298__38299[idx__38295 + 1] = v;
          return G__38298__38299
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__38300 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__38332 = null;
  var G__38332__2 = function(this_sym38301, k) {
    var this__38303 = this;
    var this_sym38301__38304 = this;
    var coll__38305 = this_sym38301__38304;
    return coll__38305.cljs$core$ILookup$_lookup$arity$2(coll__38305, k)
  };
  var G__38332__3 = function(this_sym38302, k, not_found) {
    var this__38303 = this;
    var this_sym38302__38306 = this;
    var coll__38307 = this_sym38302__38306;
    return coll__38307.cljs$core$ILookup$_lookup$arity$3(coll__38307, k, not_found)
  };
  G__38332 = function(this_sym38302, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__38332__2.call(this, this_sym38302, k);
      case 3:
        return G__38332__3.call(this, this_sym38302, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__38332
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym38285, args38286) {
  var this__38308 = this;
  return this_sym38285.call.apply(this_sym38285, [this_sym38285].concat(args38286.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__38309 = this;
  var len__38310 = this__38309.arr.length;
  var i__38311 = 0;
  var init__38312 = init;
  while(true) {
    if(i__38311 < len__38310) {
      var init__38313 = f.call(null, init__38312, this__38309.arr[i__38311], this__38309.arr[i__38311 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__38313)) {
        return cljs.core.deref.call(null, init__38313)
      }else {
        var G__38333 = i__38311 + 2;
        var G__38334 = init__38313;
        i__38311 = G__38333;
        init__38312 = G__38334;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__38314 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__38315 = this;
  var this__38316 = this;
  return cljs.core.pr_str.call(null, this__38316)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__38317 = this;
  if(this__38317.cnt > 0) {
    var len__38318 = this__38317.arr.length;
    var array_map_seq__38319 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__38318) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__38317.arr[i], this__38317.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__38319.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__38320 = this;
  return this__38320.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38321 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__38322 = this;
  return new cljs.core.PersistentArrayMap(meta, this__38322.cnt, this__38322.arr, this__38322.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__38323 = this;
  return this__38323.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__38324 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__38324.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__38325 = this;
  var idx__38326 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__38326 >= 0) {
    var len__38327 = this__38325.arr.length;
    var new_len__38328 = len__38327 - 2;
    if(new_len__38328 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__38329 = cljs.core.make_array.call(null, new_len__38328);
      var s__38330 = 0;
      var d__38331 = 0;
      while(true) {
        if(s__38330 >= len__38327) {
          return new cljs.core.PersistentArrayMap(this__38325.meta, this__38325.cnt - 1, new_arr__38329, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__38325.arr[s__38330])) {
            var G__38335 = s__38330 + 2;
            var G__38336 = d__38331;
            s__38330 = G__38335;
            d__38331 = G__38336;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__38329[d__38331] = this__38325.arr[s__38330];
              new_arr__38329[d__38331 + 1] = this__38325.arr[s__38330 + 1];
              var G__38337 = s__38330 + 2;
              var G__38338 = d__38331 + 2;
              s__38330 = G__38337;
              d__38331 = G__38338;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__38339 = cljs.core.count.call(null, ks);
  var i__38340 = 0;
  var out__38341 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__38340 < len__38339) {
      var G__38342 = i__38340 + 1;
      var G__38343 = cljs.core.assoc_BANG_.call(null, out__38341, ks[i__38340], vs[i__38340]);
      i__38340 = G__38342;
      out__38341 = G__38343;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__38341)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__38344 = this;
  if(cljs.core.truth_(this__38344.editable_QMARK_)) {
    var idx__38345 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__38345 >= 0) {
      this__38344.arr[idx__38345] = this__38344.arr[this__38344.len - 2];
      this__38344.arr[idx__38345 + 1] = this__38344.arr[this__38344.len - 1];
      var G__38346__38347 = this__38344.arr;
      G__38346__38347.pop();
      G__38346__38347.pop();
      G__38346__38347;
      this__38344.len = this__38344.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__38348 = this;
  if(cljs.core.truth_(this__38348.editable_QMARK_)) {
    var idx__38349 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__38349 === -1) {
      if(this__38348.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__38348.len = this__38348.len + 2;
        this__38348.arr.push(key);
        this__38348.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__38348.len, this__38348.arr), key, val)
      }
    }else {
      if(val === this__38348.arr[idx__38349 + 1]) {
        return tcoll
      }else {
        this__38348.arr[idx__38349 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__38350 = this;
  if(cljs.core.truth_(this__38350.editable_QMARK_)) {
    if(function() {
      var G__38351__38352 = o;
      if(G__38351__38352) {
        if(function() {
          var or__3824__auto____38353 = G__38351__38352.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____38353) {
            return or__3824__auto____38353
          }else {
            return G__38351__38352.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__38351__38352.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__38351__38352)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__38351__38352)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__38354 = cljs.core.seq.call(null, o);
      var tcoll__38355 = tcoll;
      while(true) {
        var temp__3971__auto____38356 = cljs.core.first.call(null, es__38354);
        if(cljs.core.truth_(temp__3971__auto____38356)) {
          var e__38357 = temp__3971__auto____38356;
          var G__38363 = cljs.core.next.call(null, es__38354);
          var G__38364 = tcoll__38355.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__38355, cljs.core.key.call(null, e__38357), cljs.core.val.call(null, e__38357));
          es__38354 = G__38363;
          tcoll__38355 = G__38364;
          continue
        }else {
          return tcoll__38355
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__38358 = this;
  if(cljs.core.truth_(this__38358.editable_QMARK_)) {
    this__38358.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__38358.len, 2), this__38358.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__38359 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__38360 = this;
  if(cljs.core.truth_(this__38360.editable_QMARK_)) {
    var idx__38361 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__38361 === -1) {
      return not_found
    }else {
      return this__38360.arr[idx__38361 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__38362 = this;
  if(cljs.core.truth_(this__38362.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__38362.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__38367 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__38368 = 0;
  while(true) {
    if(i__38368 < len) {
      var G__38369 = cljs.core.assoc_BANG_.call(null, out__38367, arr[i__38368], arr[i__38368 + 1]);
      var G__38370 = i__38368 + 2;
      out__38367 = G__38369;
      i__38368 = G__38370;
      continue
    }else {
      return out__38367
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2365__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__38375__38376 = arr.slice();
    G__38375__38376[i] = a;
    return G__38375__38376
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__38377__38378 = arr.slice();
    G__38377__38378[i] = a;
    G__38377__38378[j] = b;
    return G__38377__38378
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__38380 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__38380, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__38380, 2 * i, new_arr__38380.length - 2 * i);
  return new_arr__38380
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__38383 = inode.ensure_editable(edit);
    editable__38383.arr[i] = a;
    return editable__38383
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__38384 = inode.ensure_editable(edit);
    editable__38384.arr[i] = a;
    editable__38384.arr[j] = b;
    return editable__38384
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__38391 = arr.length;
  var i__38392 = 0;
  var init__38393 = init;
  while(true) {
    if(i__38392 < len__38391) {
      var init__38396 = function() {
        var k__38394 = arr[i__38392];
        if(!(k__38394 == null)) {
          return f.call(null, init__38393, k__38394, arr[i__38392 + 1])
        }else {
          var node__38395 = arr[i__38392 + 1];
          if(!(node__38395 == null)) {
            return node__38395.kv_reduce(f, init__38393)
          }else {
            return init__38393
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__38396)) {
        return cljs.core.deref.call(null, init__38396)
      }else {
        var G__38397 = i__38392 + 2;
        var G__38398 = init__38396;
        i__38392 = G__38397;
        init__38393 = G__38398;
        continue
      }
    }else {
      return init__38393
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__38399 = this;
  var inode__38400 = this;
  if(this__38399.bitmap === bit) {
    return null
  }else {
    var editable__38401 = inode__38400.ensure_editable(e);
    var earr__38402 = editable__38401.arr;
    var len__38403 = earr__38402.length;
    editable__38401.bitmap = bit ^ editable__38401.bitmap;
    cljs.core.array_copy.call(null, earr__38402, 2 * (i + 1), earr__38402, 2 * i, len__38403 - 2 * (i + 1));
    earr__38402[len__38403 - 2] = null;
    earr__38402[len__38403 - 1] = null;
    return editable__38401
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__38404 = this;
  var inode__38405 = this;
  var bit__38406 = 1 << (hash >>> shift & 31);
  var idx__38407 = cljs.core.bitmap_indexed_node_index.call(null, this__38404.bitmap, bit__38406);
  if((this__38404.bitmap & bit__38406) === 0) {
    var n__38408 = cljs.core.bit_count.call(null, this__38404.bitmap);
    if(2 * n__38408 < this__38404.arr.length) {
      var editable__38409 = inode__38405.ensure_editable(edit);
      var earr__38410 = editable__38409.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__38410, 2 * idx__38407, earr__38410, 2 * (idx__38407 + 1), 2 * (n__38408 - idx__38407));
      earr__38410[2 * idx__38407] = key;
      earr__38410[2 * idx__38407 + 1] = val;
      editable__38409.bitmap = editable__38409.bitmap | bit__38406;
      return editable__38409
    }else {
      if(n__38408 >= 16) {
        var nodes__38411 = cljs.core.make_array.call(null, 32);
        var jdx__38412 = hash >>> shift & 31;
        nodes__38411[jdx__38412] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__38413 = 0;
        var j__38414 = 0;
        while(true) {
          if(i__38413 < 32) {
            if((this__38404.bitmap >>> i__38413 & 1) === 0) {
              var G__38467 = i__38413 + 1;
              var G__38468 = j__38414;
              i__38413 = G__38467;
              j__38414 = G__38468;
              continue
            }else {
              nodes__38411[i__38413] = !(this__38404.arr[j__38414] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__38404.arr[j__38414]), this__38404.arr[j__38414], this__38404.arr[j__38414 + 1], added_leaf_QMARK_) : this__38404.arr[j__38414 + 1];
              var G__38469 = i__38413 + 1;
              var G__38470 = j__38414 + 2;
              i__38413 = G__38469;
              j__38414 = G__38470;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__38408 + 1, nodes__38411)
      }else {
        if("\ufdd0'else") {
          var new_arr__38415 = cljs.core.make_array.call(null, 2 * (n__38408 + 4));
          cljs.core.array_copy.call(null, this__38404.arr, 0, new_arr__38415, 0, 2 * idx__38407);
          new_arr__38415[2 * idx__38407] = key;
          new_arr__38415[2 * idx__38407 + 1] = val;
          cljs.core.array_copy.call(null, this__38404.arr, 2 * idx__38407, new_arr__38415, 2 * (idx__38407 + 1), 2 * (n__38408 - idx__38407));
          added_leaf_QMARK_.val = true;
          var editable__38416 = inode__38405.ensure_editable(edit);
          editable__38416.arr = new_arr__38415;
          editable__38416.bitmap = editable__38416.bitmap | bit__38406;
          return editable__38416
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__38417 = this__38404.arr[2 * idx__38407];
    var val_or_node__38418 = this__38404.arr[2 * idx__38407 + 1];
    if(key_or_nil__38417 == null) {
      var n__38419 = val_or_node__38418.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__38419 === val_or_node__38418) {
        return inode__38405
      }else {
        return cljs.core.edit_and_set.call(null, inode__38405, edit, 2 * idx__38407 + 1, n__38419)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__38417)) {
        if(val === val_or_node__38418) {
          return inode__38405
        }else {
          return cljs.core.edit_and_set.call(null, inode__38405, edit, 2 * idx__38407 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__38405, edit, 2 * idx__38407, null, 2 * idx__38407 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__38417, val_or_node__38418, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__38420 = this;
  var inode__38421 = this;
  return cljs.core.create_inode_seq.call(null, this__38420.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__38422 = this;
  var inode__38423 = this;
  var bit__38424 = 1 << (hash >>> shift & 31);
  if((this__38422.bitmap & bit__38424) === 0) {
    return inode__38423
  }else {
    var idx__38425 = cljs.core.bitmap_indexed_node_index.call(null, this__38422.bitmap, bit__38424);
    var key_or_nil__38426 = this__38422.arr[2 * idx__38425];
    var val_or_node__38427 = this__38422.arr[2 * idx__38425 + 1];
    if(key_or_nil__38426 == null) {
      var n__38428 = val_or_node__38427.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__38428 === val_or_node__38427) {
        return inode__38423
      }else {
        if(!(n__38428 == null)) {
          return cljs.core.edit_and_set.call(null, inode__38423, edit, 2 * idx__38425 + 1, n__38428)
        }else {
          if(this__38422.bitmap === bit__38424) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__38423.edit_and_remove_pair(edit, bit__38424, idx__38425)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__38426)) {
        removed_leaf_QMARK_[0] = true;
        return inode__38423.edit_and_remove_pair(edit, bit__38424, idx__38425)
      }else {
        if("\ufdd0'else") {
          return inode__38423
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__38429 = this;
  var inode__38430 = this;
  if(e === this__38429.edit) {
    return inode__38430
  }else {
    var n__38431 = cljs.core.bit_count.call(null, this__38429.bitmap);
    var new_arr__38432 = cljs.core.make_array.call(null, n__38431 < 0 ? 4 : 2 * (n__38431 + 1));
    cljs.core.array_copy.call(null, this__38429.arr, 0, new_arr__38432, 0, 2 * n__38431);
    return new cljs.core.BitmapIndexedNode(e, this__38429.bitmap, new_arr__38432)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__38433 = this;
  var inode__38434 = this;
  return cljs.core.inode_kv_reduce.call(null, this__38433.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__38435 = this;
  var inode__38436 = this;
  var bit__38437 = 1 << (hash >>> shift & 31);
  if((this__38435.bitmap & bit__38437) === 0) {
    return not_found
  }else {
    var idx__38438 = cljs.core.bitmap_indexed_node_index.call(null, this__38435.bitmap, bit__38437);
    var key_or_nil__38439 = this__38435.arr[2 * idx__38438];
    var val_or_node__38440 = this__38435.arr[2 * idx__38438 + 1];
    if(key_or_nil__38439 == null) {
      return val_or_node__38440.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__38439)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__38439, val_or_node__38440], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__38441 = this;
  var inode__38442 = this;
  var bit__38443 = 1 << (hash >>> shift & 31);
  if((this__38441.bitmap & bit__38443) === 0) {
    return inode__38442
  }else {
    var idx__38444 = cljs.core.bitmap_indexed_node_index.call(null, this__38441.bitmap, bit__38443);
    var key_or_nil__38445 = this__38441.arr[2 * idx__38444];
    var val_or_node__38446 = this__38441.arr[2 * idx__38444 + 1];
    if(key_or_nil__38445 == null) {
      var n__38447 = val_or_node__38446.inode_without(shift + 5, hash, key);
      if(n__38447 === val_or_node__38446) {
        return inode__38442
      }else {
        if(!(n__38447 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__38441.bitmap, cljs.core.clone_and_set.call(null, this__38441.arr, 2 * idx__38444 + 1, n__38447))
        }else {
          if(this__38441.bitmap === bit__38443) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__38441.bitmap ^ bit__38443, cljs.core.remove_pair.call(null, this__38441.arr, idx__38444))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__38445)) {
        return new cljs.core.BitmapIndexedNode(null, this__38441.bitmap ^ bit__38443, cljs.core.remove_pair.call(null, this__38441.arr, idx__38444))
      }else {
        if("\ufdd0'else") {
          return inode__38442
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__38448 = this;
  var inode__38449 = this;
  var bit__38450 = 1 << (hash >>> shift & 31);
  var idx__38451 = cljs.core.bitmap_indexed_node_index.call(null, this__38448.bitmap, bit__38450);
  if((this__38448.bitmap & bit__38450) === 0) {
    var n__38452 = cljs.core.bit_count.call(null, this__38448.bitmap);
    if(n__38452 >= 16) {
      var nodes__38453 = cljs.core.make_array.call(null, 32);
      var jdx__38454 = hash >>> shift & 31;
      nodes__38453[jdx__38454] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__38455 = 0;
      var j__38456 = 0;
      while(true) {
        if(i__38455 < 32) {
          if((this__38448.bitmap >>> i__38455 & 1) === 0) {
            var G__38471 = i__38455 + 1;
            var G__38472 = j__38456;
            i__38455 = G__38471;
            j__38456 = G__38472;
            continue
          }else {
            nodes__38453[i__38455] = !(this__38448.arr[j__38456] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__38448.arr[j__38456]), this__38448.arr[j__38456], this__38448.arr[j__38456 + 1], added_leaf_QMARK_) : this__38448.arr[j__38456 + 1];
            var G__38473 = i__38455 + 1;
            var G__38474 = j__38456 + 2;
            i__38455 = G__38473;
            j__38456 = G__38474;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__38452 + 1, nodes__38453)
    }else {
      var new_arr__38457 = cljs.core.make_array.call(null, 2 * (n__38452 + 1));
      cljs.core.array_copy.call(null, this__38448.arr, 0, new_arr__38457, 0, 2 * idx__38451);
      new_arr__38457[2 * idx__38451] = key;
      new_arr__38457[2 * idx__38451 + 1] = val;
      cljs.core.array_copy.call(null, this__38448.arr, 2 * idx__38451, new_arr__38457, 2 * (idx__38451 + 1), 2 * (n__38452 - idx__38451));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__38448.bitmap | bit__38450, new_arr__38457)
    }
  }else {
    var key_or_nil__38458 = this__38448.arr[2 * idx__38451];
    var val_or_node__38459 = this__38448.arr[2 * idx__38451 + 1];
    if(key_or_nil__38458 == null) {
      var n__38460 = val_or_node__38459.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__38460 === val_or_node__38459) {
        return inode__38449
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__38448.bitmap, cljs.core.clone_and_set.call(null, this__38448.arr, 2 * idx__38451 + 1, n__38460))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__38458)) {
        if(val === val_or_node__38459) {
          return inode__38449
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__38448.bitmap, cljs.core.clone_and_set.call(null, this__38448.arr, 2 * idx__38451 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__38448.bitmap, cljs.core.clone_and_set.call(null, this__38448.arr, 2 * idx__38451, null, 2 * idx__38451 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__38458, val_or_node__38459, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__38461 = this;
  var inode__38462 = this;
  var bit__38463 = 1 << (hash >>> shift & 31);
  if((this__38461.bitmap & bit__38463) === 0) {
    return not_found
  }else {
    var idx__38464 = cljs.core.bitmap_indexed_node_index.call(null, this__38461.bitmap, bit__38463);
    var key_or_nil__38465 = this__38461.arr[2 * idx__38464];
    var val_or_node__38466 = this__38461.arr[2 * idx__38464 + 1];
    if(key_or_nil__38465 == null) {
      return val_or_node__38466.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__38465)) {
        return val_or_node__38466
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__38482 = array_node.arr;
  var len__38483 = 2 * (array_node.cnt - 1);
  var new_arr__38484 = cljs.core.make_array.call(null, len__38483);
  var i__38485 = 0;
  var j__38486 = 1;
  var bitmap__38487 = 0;
  while(true) {
    if(i__38485 < len__38483) {
      if(function() {
        var and__3822__auto____38488 = !(i__38485 === idx);
        if(and__3822__auto____38488) {
          return!(arr__38482[i__38485] == null)
        }else {
          return and__3822__auto____38488
        }
      }()) {
        new_arr__38484[j__38486] = arr__38482[i__38485];
        var G__38489 = i__38485 + 1;
        var G__38490 = j__38486 + 2;
        var G__38491 = bitmap__38487 | 1 << i__38485;
        i__38485 = G__38489;
        j__38486 = G__38490;
        bitmap__38487 = G__38491;
        continue
      }else {
        var G__38492 = i__38485 + 1;
        var G__38493 = j__38486;
        var G__38494 = bitmap__38487;
        i__38485 = G__38492;
        j__38486 = G__38493;
        bitmap__38487 = G__38494;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__38487, new_arr__38484)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__38495 = this;
  var inode__38496 = this;
  var idx__38497 = hash >>> shift & 31;
  var node__38498 = this__38495.arr[idx__38497];
  if(node__38498 == null) {
    var editable__38499 = cljs.core.edit_and_set.call(null, inode__38496, edit, idx__38497, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__38499.cnt = editable__38499.cnt + 1;
    return editable__38499
  }else {
    var n__38500 = node__38498.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__38500 === node__38498) {
      return inode__38496
    }else {
      return cljs.core.edit_and_set.call(null, inode__38496, edit, idx__38497, n__38500)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__38501 = this;
  var inode__38502 = this;
  return cljs.core.create_array_node_seq.call(null, this__38501.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__38503 = this;
  var inode__38504 = this;
  var idx__38505 = hash >>> shift & 31;
  var node__38506 = this__38503.arr[idx__38505];
  if(node__38506 == null) {
    return inode__38504
  }else {
    var n__38507 = node__38506.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__38507 === node__38506) {
      return inode__38504
    }else {
      if(n__38507 == null) {
        if(this__38503.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__38504, edit, idx__38505)
        }else {
          var editable__38508 = cljs.core.edit_and_set.call(null, inode__38504, edit, idx__38505, n__38507);
          editable__38508.cnt = editable__38508.cnt - 1;
          return editable__38508
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__38504, edit, idx__38505, n__38507)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__38509 = this;
  var inode__38510 = this;
  if(e === this__38509.edit) {
    return inode__38510
  }else {
    return new cljs.core.ArrayNode(e, this__38509.cnt, this__38509.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__38511 = this;
  var inode__38512 = this;
  var len__38513 = this__38511.arr.length;
  var i__38514 = 0;
  var init__38515 = init;
  while(true) {
    if(i__38514 < len__38513) {
      var node__38516 = this__38511.arr[i__38514];
      if(!(node__38516 == null)) {
        var init__38517 = node__38516.kv_reduce(f, init__38515);
        if(cljs.core.reduced_QMARK_.call(null, init__38517)) {
          return cljs.core.deref.call(null, init__38517)
        }else {
          var G__38536 = i__38514 + 1;
          var G__38537 = init__38517;
          i__38514 = G__38536;
          init__38515 = G__38537;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__38515
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__38518 = this;
  var inode__38519 = this;
  var idx__38520 = hash >>> shift & 31;
  var node__38521 = this__38518.arr[idx__38520];
  if(!(node__38521 == null)) {
    return node__38521.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__38522 = this;
  var inode__38523 = this;
  var idx__38524 = hash >>> shift & 31;
  var node__38525 = this__38522.arr[idx__38524];
  if(!(node__38525 == null)) {
    var n__38526 = node__38525.inode_without(shift + 5, hash, key);
    if(n__38526 === node__38525) {
      return inode__38523
    }else {
      if(n__38526 == null) {
        if(this__38522.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__38523, null, idx__38524)
        }else {
          return new cljs.core.ArrayNode(null, this__38522.cnt - 1, cljs.core.clone_and_set.call(null, this__38522.arr, idx__38524, n__38526))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__38522.cnt, cljs.core.clone_and_set.call(null, this__38522.arr, idx__38524, n__38526))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__38523
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__38527 = this;
  var inode__38528 = this;
  var idx__38529 = hash >>> shift & 31;
  var node__38530 = this__38527.arr[idx__38529];
  if(node__38530 == null) {
    return new cljs.core.ArrayNode(null, this__38527.cnt + 1, cljs.core.clone_and_set.call(null, this__38527.arr, idx__38529, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__38531 = node__38530.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__38531 === node__38530) {
      return inode__38528
    }else {
      return new cljs.core.ArrayNode(null, this__38527.cnt, cljs.core.clone_and_set.call(null, this__38527.arr, idx__38529, n__38531))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__38532 = this;
  var inode__38533 = this;
  var idx__38534 = hash >>> shift & 31;
  var node__38535 = this__38532.arr[idx__38534];
  if(!(node__38535 == null)) {
    return node__38535.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__38540 = 2 * cnt;
  var i__38541 = 0;
  while(true) {
    if(i__38541 < lim__38540) {
      if(cljs.core.key_test.call(null, key, arr[i__38541])) {
        return i__38541
      }else {
        var G__38542 = i__38541 + 2;
        i__38541 = G__38542;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__38543 = this;
  var inode__38544 = this;
  if(hash === this__38543.collision_hash) {
    var idx__38545 = cljs.core.hash_collision_node_find_index.call(null, this__38543.arr, this__38543.cnt, key);
    if(idx__38545 === -1) {
      if(this__38543.arr.length > 2 * this__38543.cnt) {
        var editable__38546 = cljs.core.edit_and_set.call(null, inode__38544, edit, 2 * this__38543.cnt, key, 2 * this__38543.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__38546.cnt = editable__38546.cnt + 1;
        return editable__38546
      }else {
        var len__38547 = this__38543.arr.length;
        var new_arr__38548 = cljs.core.make_array.call(null, len__38547 + 2);
        cljs.core.array_copy.call(null, this__38543.arr, 0, new_arr__38548, 0, len__38547);
        new_arr__38548[len__38547] = key;
        new_arr__38548[len__38547 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__38544.ensure_editable_array(edit, this__38543.cnt + 1, new_arr__38548)
      }
    }else {
      if(this__38543.arr[idx__38545 + 1] === val) {
        return inode__38544
      }else {
        return cljs.core.edit_and_set.call(null, inode__38544, edit, idx__38545 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__38543.collision_hash >>> shift & 31), [null, inode__38544, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__38549 = this;
  var inode__38550 = this;
  return cljs.core.create_inode_seq.call(null, this__38549.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__38551 = this;
  var inode__38552 = this;
  var idx__38553 = cljs.core.hash_collision_node_find_index.call(null, this__38551.arr, this__38551.cnt, key);
  if(idx__38553 === -1) {
    return inode__38552
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__38551.cnt === 1) {
      return null
    }else {
      var editable__38554 = inode__38552.ensure_editable(edit);
      var earr__38555 = editable__38554.arr;
      earr__38555[idx__38553] = earr__38555[2 * this__38551.cnt - 2];
      earr__38555[idx__38553 + 1] = earr__38555[2 * this__38551.cnt - 1];
      earr__38555[2 * this__38551.cnt - 1] = null;
      earr__38555[2 * this__38551.cnt - 2] = null;
      editable__38554.cnt = editable__38554.cnt - 1;
      return editable__38554
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__38556 = this;
  var inode__38557 = this;
  if(e === this__38556.edit) {
    return inode__38557
  }else {
    var new_arr__38558 = cljs.core.make_array.call(null, 2 * (this__38556.cnt + 1));
    cljs.core.array_copy.call(null, this__38556.arr, 0, new_arr__38558, 0, 2 * this__38556.cnt);
    return new cljs.core.HashCollisionNode(e, this__38556.collision_hash, this__38556.cnt, new_arr__38558)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__38559 = this;
  var inode__38560 = this;
  return cljs.core.inode_kv_reduce.call(null, this__38559.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__38561 = this;
  var inode__38562 = this;
  var idx__38563 = cljs.core.hash_collision_node_find_index.call(null, this__38561.arr, this__38561.cnt, key);
  if(idx__38563 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__38561.arr[idx__38563])) {
      return cljs.core.PersistentVector.fromArray([this__38561.arr[idx__38563], this__38561.arr[idx__38563 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__38564 = this;
  var inode__38565 = this;
  var idx__38566 = cljs.core.hash_collision_node_find_index.call(null, this__38564.arr, this__38564.cnt, key);
  if(idx__38566 === -1) {
    return inode__38565
  }else {
    if(this__38564.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__38564.collision_hash, this__38564.cnt - 1, cljs.core.remove_pair.call(null, this__38564.arr, cljs.core.quot.call(null, idx__38566, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__38567 = this;
  var inode__38568 = this;
  if(hash === this__38567.collision_hash) {
    var idx__38569 = cljs.core.hash_collision_node_find_index.call(null, this__38567.arr, this__38567.cnt, key);
    if(idx__38569 === -1) {
      var len__38570 = this__38567.arr.length;
      var new_arr__38571 = cljs.core.make_array.call(null, len__38570 + 2);
      cljs.core.array_copy.call(null, this__38567.arr, 0, new_arr__38571, 0, len__38570);
      new_arr__38571[len__38570] = key;
      new_arr__38571[len__38570 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__38567.collision_hash, this__38567.cnt + 1, new_arr__38571)
    }else {
      if(cljs.core._EQ_.call(null, this__38567.arr[idx__38569], val)) {
        return inode__38568
      }else {
        return new cljs.core.HashCollisionNode(null, this__38567.collision_hash, this__38567.cnt, cljs.core.clone_and_set.call(null, this__38567.arr, idx__38569 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__38567.collision_hash >>> shift & 31), [null, inode__38568])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__38572 = this;
  var inode__38573 = this;
  var idx__38574 = cljs.core.hash_collision_node_find_index.call(null, this__38572.arr, this__38572.cnt, key);
  if(idx__38574 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__38572.arr[idx__38574])) {
      return this__38572.arr[idx__38574 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__38575 = this;
  var inode__38576 = this;
  if(e === this__38575.edit) {
    this__38575.arr = array;
    this__38575.cnt = count;
    return inode__38576
  }else {
    return new cljs.core.HashCollisionNode(this__38575.edit, this__38575.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__38581 = cljs.core.hash.call(null, key1);
    if(key1hash__38581 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__38581, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___38582 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__38581, key1, val1, added_leaf_QMARK___38582).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___38582)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__38583 = cljs.core.hash.call(null, key1);
    if(key1hash__38583 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__38583, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___38584 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__38583, key1, val1, added_leaf_QMARK___38584).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___38584)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38585 = this;
  var h__2247__auto____38586 = this__38585.__hash;
  if(!(h__2247__auto____38586 == null)) {
    return h__2247__auto____38586
  }else {
    var h__2247__auto____38587 = cljs.core.hash_coll.call(null, coll);
    this__38585.__hash = h__2247__auto____38587;
    return h__2247__auto____38587
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__38588 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__38589 = this;
  var this__38590 = this;
  return cljs.core.pr_str.call(null, this__38590)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__38591 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__38592 = this;
  if(this__38592.s == null) {
    return cljs.core.PersistentVector.fromArray([this__38592.nodes[this__38592.i], this__38592.nodes[this__38592.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__38592.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__38593 = this;
  if(this__38593.s == null) {
    return cljs.core.create_inode_seq.call(null, this__38593.nodes, this__38593.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__38593.nodes, this__38593.i, cljs.core.next.call(null, this__38593.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38594 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__38595 = this;
  return new cljs.core.NodeSeq(meta, this__38595.nodes, this__38595.i, this__38595.s, this__38595.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__38596 = this;
  return this__38596.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__38597 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__38597.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__38604 = nodes.length;
      var j__38605 = i;
      while(true) {
        if(j__38605 < len__38604) {
          if(!(nodes[j__38605] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__38605, null, null)
          }else {
            var temp__3971__auto____38606 = nodes[j__38605 + 1];
            if(cljs.core.truth_(temp__3971__auto____38606)) {
              var node__38607 = temp__3971__auto____38606;
              var temp__3971__auto____38608 = node__38607.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____38608)) {
                var node_seq__38609 = temp__3971__auto____38608;
                return new cljs.core.NodeSeq(null, nodes, j__38605 + 2, node_seq__38609, null)
              }else {
                var G__38610 = j__38605 + 2;
                j__38605 = G__38610;
                continue
              }
            }else {
              var G__38611 = j__38605 + 2;
              j__38605 = G__38611;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38612 = this;
  var h__2247__auto____38613 = this__38612.__hash;
  if(!(h__2247__auto____38613 == null)) {
    return h__2247__auto____38613
  }else {
    var h__2247__auto____38614 = cljs.core.hash_coll.call(null, coll);
    this__38612.__hash = h__2247__auto____38614;
    return h__2247__auto____38614
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__38615 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__38616 = this;
  var this__38617 = this;
  return cljs.core.pr_str.call(null, this__38617)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__38618 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__38619 = this;
  return cljs.core.first.call(null, this__38619.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__38620 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__38620.nodes, this__38620.i, cljs.core.next.call(null, this__38620.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38621 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__38622 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__38622.nodes, this__38622.i, this__38622.s, this__38622.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__38623 = this;
  return this__38623.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__38624 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__38624.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__38631 = nodes.length;
      var j__38632 = i;
      while(true) {
        if(j__38632 < len__38631) {
          var temp__3971__auto____38633 = nodes[j__38632];
          if(cljs.core.truth_(temp__3971__auto____38633)) {
            var nj__38634 = temp__3971__auto____38633;
            var temp__3971__auto____38635 = nj__38634.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____38635)) {
              var ns__38636 = temp__3971__auto____38635;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__38632 + 1, ns__38636, null)
            }else {
              var G__38637 = j__38632 + 1;
              j__38632 = G__38637;
              continue
            }
          }else {
            var G__38638 = j__38632 + 1;
            j__38632 = G__38638;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__38641 = this;
  return new cljs.core.TransientHashMap({}, this__38641.root, this__38641.cnt, this__38641.has_nil_QMARK_, this__38641.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38642 = this;
  var h__2247__auto____38643 = this__38642.__hash;
  if(!(h__2247__auto____38643 == null)) {
    return h__2247__auto____38643
  }else {
    var h__2247__auto____38644 = cljs.core.hash_imap.call(null, coll);
    this__38642.__hash = h__2247__auto____38644;
    return h__2247__auto____38644
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__38645 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__38646 = this;
  if(k == null) {
    if(this__38646.has_nil_QMARK_) {
      return this__38646.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__38646.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__38646.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__38647 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____38648 = this__38647.has_nil_QMARK_;
      if(and__3822__auto____38648) {
        return v === this__38647.nil_val
      }else {
        return and__3822__auto____38648
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__38647.meta, this__38647.has_nil_QMARK_ ? this__38647.cnt : this__38647.cnt + 1, this__38647.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___38649 = new cljs.core.Box(false);
    var new_root__38650 = (this__38647.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__38647.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___38649);
    if(new_root__38650 === this__38647.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__38647.meta, added_leaf_QMARK___38649.val ? this__38647.cnt + 1 : this__38647.cnt, new_root__38650, this__38647.has_nil_QMARK_, this__38647.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__38651 = this;
  if(k == null) {
    return this__38651.has_nil_QMARK_
  }else {
    if(this__38651.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__38651.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__38674 = null;
  var G__38674__2 = function(this_sym38652, k) {
    var this__38654 = this;
    var this_sym38652__38655 = this;
    var coll__38656 = this_sym38652__38655;
    return coll__38656.cljs$core$ILookup$_lookup$arity$2(coll__38656, k)
  };
  var G__38674__3 = function(this_sym38653, k, not_found) {
    var this__38654 = this;
    var this_sym38653__38657 = this;
    var coll__38658 = this_sym38653__38657;
    return coll__38658.cljs$core$ILookup$_lookup$arity$3(coll__38658, k, not_found)
  };
  G__38674 = function(this_sym38653, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__38674__2.call(this, this_sym38653, k);
      case 3:
        return G__38674__3.call(this, this_sym38653, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__38674
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym38639, args38640) {
  var this__38659 = this;
  return this_sym38639.call.apply(this_sym38639, [this_sym38639].concat(args38640.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__38660 = this;
  var init__38661 = this__38660.has_nil_QMARK_ ? f.call(null, init, null, this__38660.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__38661)) {
    return cljs.core.deref.call(null, init__38661)
  }else {
    if(!(this__38660.root == null)) {
      return this__38660.root.kv_reduce(f, init__38661)
    }else {
      if("\ufdd0'else") {
        return init__38661
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__38662 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__38663 = this;
  var this__38664 = this;
  return cljs.core.pr_str.call(null, this__38664)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__38665 = this;
  if(this__38665.cnt > 0) {
    var s__38666 = !(this__38665.root == null) ? this__38665.root.inode_seq() : null;
    if(this__38665.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__38665.nil_val], true), s__38666)
    }else {
      return s__38666
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__38667 = this;
  return this__38667.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38668 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__38669 = this;
  return new cljs.core.PersistentHashMap(meta, this__38669.cnt, this__38669.root, this__38669.has_nil_QMARK_, this__38669.nil_val, this__38669.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__38670 = this;
  return this__38670.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__38671 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__38671.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__38672 = this;
  if(k == null) {
    if(this__38672.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__38672.meta, this__38672.cnt - 1, this__38672.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__38672.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__38673 = this__38672.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__38673 === this__38672.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__38672.meta, this__38672.cnt - 1, new_root__38673, this__38672.has_nil_QMARK_, this__38672.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__38675 = ks.length;
  var i__38676 = 0;
  var out__38677 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__38676 < len__38675) {
      var G__38678 = i__38676 + 1;
      var G__38679 = cljs.core.assoc_BANG_.call(null, out__38677, ks[i__38676], vs[i__38676]);
      i__38676 = G__38678;
      out__38677 = G__38679;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__38677)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__38680 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__38681 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__38682 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__38683 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__38684 = this;
  if(k == null) {
    if(this__38684.has_nil_QMARK_) {
      return this__38684.nil_val
    }else {
      return null
    }
  }else {
    if(this__38684.root == null) {
      return null
    }else {
      return this__38684.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__38685 = this;
  if(k == null) {
    if(this__38685.has_nil_QMARK_) {
      return this__38685.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__38685.root == null) {
      return not_found
    }else {
      return this__38685.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__38686 = this;
  if(this__38686.edit) {
    return this__38686.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__38687 = this;
  var tcoll__38688 = this;
  if(this__38687.edit) {
    if(function() {
      var G__38689__38690 = o;
      if(G__38689__38690) {
        if(function() {
          var or__3824__auto____38691 = G__38689__38690.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____38691) {
            return or__3824__auto____38691
          }else {
            return G__38689__38690.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__38689__38690.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__38689__38690)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__38689__38690)
      }
    }()) {
      return tcoll__38688.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__38692 = cljs.core.seq.call(null, o);
      var tcoll__38693 = tcoll__38688;
      while(true) {
        var temp__3971__auto____38694 = cljs.core.first.call(null, es__38692);
        if(cljs.core.truth_(temp__3971__auto____38694)) {
          var e__38695 = temp__3971__auto____38694;
          var G__38706 = cljs.core.next.call(null, es__38692);
          var G__38707 = tcoll__38693.assoc_BANG_(cljs.core.key.call(null, e__38695), cljs.core.val.call(null, e__38695));
          es__38692 = G__38706;
          tcoll__38693 = G__38707;
          continue
        }else {
          return tcoll__38693
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__38696 = this;
  var tcoll__38697 = this;
  if(this__38696.edit) {
    if(k == null) {
      if(this__38696.nil_val === v) {
      }else {
        this__38696.nil_val = v
      }
      if(this__38696.has_nil_QMARK_) {
      }else {
        this__38696.count = this__38696.count + 1;
        this__38696.has_nil_QMARK_ = true
      }
      return tcoll__38697
    }else {
      var added_leaf_QMARK___38698 = new cljs.core.Box(false);
      var node__38699 = (this__38696.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__38696.root).inode_assoc_BANG_(this__38696.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___38698);
      if(node__38699 === this__38696.root) {
      }else {
        this__38696.root = node__38699
      }
      if(added_leaf_QMARK___38698.val) {
        this__38696.count = this__38696.count + 1
      }else {
      }
      return tcoll__38697
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__38700 = this;
  var tcoll__38701 = this;
  if(this__38700.edit) {
    if(k == null) {
      if(this__38700.has_nil_QMARK_) {
        this__38700.has_nil_QMARK_ = false;
        this__38700.nil_val = null;
        this__38700.count = this__38700.count - 1;
        return tcoll__38701
      }else {
        return tcoll__38701
      }
    }else {
      if(this__38700.root == null) {
        return tcoll__38701
      }else {
        var removed_leaf_QMARK___38702 = new cljs.core.Box(false);
        var node__38703 = this__38700.root.inode_without_BANG_(this__38700.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___38702);
        if(node__38703 === this__38700.root) {
        }else {
          this__38700.root = node__38703
        }
        if(cljs.core.truth_(removed_leaf_QMARK___38702[0])) {
          this__38700.count = this__38700.count - 1
        }else {
        }
        return tcoll__38701
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__38704 = this;
  var tcoll__38705 = this;
  if(this__38704.edit) {
    this__38704.edit = null;
    return new cljs.core.PersistentHashMap(null, this__38704.count, this__38704.root, this__38704.has_nil_QMARK_, this__38704.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__38710 = node;
  var stack__38711 = stack;
  while(true) {
    if(!(t__38710 == null)) {
      var G__38712 = ascending_QMARK_ ? t__38710.left : t__38710.right;
      var G__38713 = cljs.core.conj.call(null, stack__38711, t__38710);
      t__38710 = G__38712;
      stack__38711 = G__38713;
      continue
    }else {
      return stack__38711
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38714 = this;
  var h__2247__auto____38715 = this__38714.__hash;
  if(!(h__2247__auto____38715 == null)) {
    return h__2247__auto____38715
  }else {
    var h__2247__auto____38716 = cljs.core.hash_coll.call(null, coll);
    this__38714.__hash = h__2247__auto____38716;
    return h__2247__auto____38716
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__38717 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__38718 = this;
  var this__38719 = this;
  return cljs.core.pr_str.call(null, this__38719)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__38720 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__38721 = this;
  if(this__38721.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__38721.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__38722 = this;
  return cljs.core.peek.call(null, this__38722.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__38723 = this;
  var t__38724 = cljs.core.first.call(null, this__38723.stack);
  var next_stack__38725 = cljs.core.tree_map_seq_push.call(null, this__38723.ascending_QMARK_ ? t__38724.right : t__38724.left, cljs.core.next.call(null, this__38723.stack), this__38723.ascending_QMARK_);
  if(!(next_stack__38725 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__38725, this__38723.ascending_QMARK_, this__38723.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38726 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__38727 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__38727.stack, this__38727.ascending_QMARK_, this__38727.cnt, this__38727.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__38728 = this;
  return this__38728.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____38730 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____38730) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____38730
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____38732 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____38732) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____38732
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__38736 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__38736)) {
    return cljs.core.deref.call(null, init__38736)
  }else {
    var init__38737 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__38736) : init__38736;
    if(cljs.core.reduced_QMARK_.call(null, init__38737)) {
      return cljs.core.deref.call(null, init__38737)
    }else {
      var init__38738 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__38737) : init__38737;
      if(cljs.core.reduced_QMARK_.call(null, init__38738)) {
        return cljs.core.deref.call(null, init__38738)
      }else {
        return init__38738
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38741 = this;
  var h__2247__auto____38742 = this__38741.__hash;
  if(!(h__2247__auto____38742 == null)) {
    return h__2247__auto____38742
  }else {
    var h__2247__auto____38743 = cljs.core.hash_coll.call(null, coll);
    this__38741.__hash = h__2247__auto____38743;
    return h__2247__auto____38743
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__38744 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__38745 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__38746 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__38746.key, this__38746.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__38794 = null;
  var G__38794__2 = function(this_sym38747, k) {
    var this__38749 = this;
    var this_sym38747__38750 = this;
    var node__38751 = this_sym38747__38750;
    return node__38751.cljs$core$ILookup$_lookup$arity$2(node__38751, k)
  };
  var G__38794__3 = function(this_sym38748, k, not_found) {
    var this__38749 = this;
    var this_sym38748__38752 = this;
    var node__38753 = this_sym38748__38752;
    return node__38753.cljs$core$ILookup$_lookup$arity$3(node__38753, k, not_found)
  };
  G__38794 = function(this_sym38748, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__38794__2.call(this, this_sym38748, k);
      case 3:
        return G__38794__3.call(this, this_sym38748, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__38794
}();
cljs.core.BlackNode.prototype.apply = function(this_sym38739, args38740) {
  var this__38754 = this;
  return this_sym38739.call.apply(this_sym38739, [this_sym38739].concat(args38740.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__38755 = this;
  return cljs.core.PersistentVector.fromArray([this__38755.key, this__38755.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__38756 = this;
  return this__38756.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__38757 = this;
  return this__38757.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__38758 = this;
  var node__38759 = this;
  return ins.balance_right(node__38759)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__38760 = this;
  var node__38761 = this;
  return new cljs.core.RedNode(this__38760.key, this__38760.val, this__38760.left, this__38760.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__38762 = this;
  var node__38763 = this;
  return cljs.core.balance_right_del.call(null, this__38762.key, this__38762.val, this__38762.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__38764 = this;
  var node__38765 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__38766 = this;
  var node__38767 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__38767, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__38768 = this;
  var node__38769 = this;
  return cljs.core.balance_left_del.call(null, this__38768.key, this__38768.val, del, this__38768.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__38770 = this;
  var node__38771 = this;
  return ins.balance_left(node__38771)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__38772 = this;
  var node__38773 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__38773, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__38795 = null;
  var G__38795__0 = function() {
    var this__38774 = this;
    var this__38776 = this;
    return cljs.core.pr_str.call(null, this__38776)
  };
  G__38795 = function() {
    switch(arguments.length) {
      case 0:
        return G__38795__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__38795
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__38777 = this;
  var node__38778 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__38778, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__38779 = this;
  var node__38780 = this;
  return node__38780
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__38781 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__38782 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__38783 = this;
  return cljs.core.list.call(null, this__38783.key, this__38783.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__38784 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__38785 = this;
  return this__38785.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__38786 = this;
  return cljs.core.PersistentVector.fromArray([this__38786.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__38787 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__38787.key, this__38787.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38788 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__38789 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__38789.key, this__38789.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__38790 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__38791 = this;
  if(n === 0) {
    return this__38791.key
  }else {
    if(n === 1) {
      return this__38791.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__38792 = this;
  if(n === 0) {
    return this__38792.key
  }else {
    if(n === 1) {
      return this__38792.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__38793 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38798 = this;
  var h__2247__auto____38799 = this__38798.__hash;
  if(!(h__2247__auto____38799 == null)) {
    return h__2247__auto____38799
  }else {
    var h__2247__auto____38800 = cljs.core.hash_coll.call(null, coll);
    this__38798.__hash = h__2247__auto____38800;
    return h__2247__auto____38800
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__38801 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__38802 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__38803 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__38803.key, this__38803.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__38851 = null;
  var G__38851__2 = function(this_sym38804, k) {
    var this__38806 = this;
    var this_sym38804__38807 = this;
    var node__38808 = this_sym38804__38807;
    return node__38808.cljs$core$ILookup$_lookup$arity$2(node__38808, k)
  };
  var G__38851__3 = function(this_sym38805, k, not_found) {
    var this__38806 = this;
    var this_sym38805__38809 = this;
    var node__38810 = this_sym38805__38809;
    return node__38810.cljs$core$ILookup$_lookup$arity$3(node__38810, k, not_found)
  };
  G__38851 = function(this_sym38805, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__38851__2.call(this, this_sym38805, k);
      case 3:
        return G__38851__3.call(this, this_sym38805, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__38851
}();
cljs.core.RedNode.prototype.apply = function(this_sym38796, args38797) {
  var this__38811 = this;
  return this_sym38796.call.apply(this_sym38796, [this_sym38796].concat(args38797.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__38812 = this;
  return cljs.core.PersistentVector.fromArray([this__38812.key, this__38812.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__38813 = this;
  return this__38813.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__38814 = this;
  return this__38814.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__38815 = this;
  var node__38816 = this;
  return new cljs.core.RedNode(this__38815.key, this__38815.val, this__38815.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__38817 = this;
  var node__38818 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__38819 = this;
  var node__38820 = this;
  return new cljs.core.RedNode(this__38819.key, this__38819.val, this__38819.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__38821 = this;
  var node__38822 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__38823 = this;
  var node__38824 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__38824, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__38825 = this;
  var node__38826 = this;
  return new cljs.core.RedNode(this__38825.key, this__38825.val, del, this__38825.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__38827 = this;
  var node__38828 = this;
  return new cljs.core.RedNode(this__38827.key, this__38827.val, ins, this__38827.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__38829 = this;
  var node__38830 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__38829.left)) {
    return new cljs.core.RedNode(this__38829.key, this__38829.val, this__38829.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__38829.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__38829.right)) {
      return new cljs.core.RedNode(this__38829.right.key, this__38829.right.val, new cljs.core.BlackNode(this__38829.key, this__38829.val, this__38829.left, this__38829.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__38829.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__38830, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__38852 = null;
  var G__38852__0 = function() {
    var this__38831 = this;
    var this__38833 = this;
    return cljs.core.pr_str.call(null, this__38833)
  };
  G__38852 = function() {
    switch(arguments.length) {
      case 0:
        return G__38852__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__38852
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__38834 = this;
  var node__38835 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__38834.right)) {
    return new cljs.core.RedNode(this__38834.key, this__38834.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__38834.left, null), this__38834.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__38834.left)) {
      return new cljs.core.RedNode(this__38834.left.key, this__38834.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__38834.left.left, null), new cljs.core.BlackNode(this__38834.key, this__38834.val, this__38834.left.right, this__38834.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__38835, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__38836 = this;
  var node__38837 = this;
  return new cljs.core.BlackNode(this__38836.key, this__38836.val, this__38836.left, this__38836.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__38838 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__38839 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__38840 = this;
  return cljs.core.list.call(null, this__38840.key, this__38840.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__38841 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__38842 = this;
  return this__38842.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__38843 = this;
  return cljs.core.PersistentVector.fromArray([this__38843.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__38844 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__38844.key, this__38844.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38845 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__38846 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__38846.key, this__38846.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__38847 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__38848 = this;
  if(n === 0) {
    return this__38848.key
  }else {
    if(n === 1) {
      return this__38848.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__38849 = this;
  if(n === 0) {
    return this__38849.key
  }else {
    if(n === 1) {
      return this__38849.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__38850 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__38856 = comp.call(null, k, tree.key);
    if(c__38856 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__38856 < 0) {
        var ins__38857 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__38857 == null)) {
          return tree.add_left(ins__38857)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__38858 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__38858 == null)) {
            return tree.add_right(ins__38858)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__38861 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__38861)) {
            return new cljs.core.RedNode(app__38861.key, app__38861.val, new cljs.core.RedNode(left.key, left.val, left.left, app__38861.left, null), new cljs.core.RedNode(right.key, right.val, app__38861.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__38861, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__38862 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__38862)) {
              return new cljs.core.RedNode(app__38862.key, app__38862.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__38862.left, null), new cljs.core.BlackNode(right.key, right.val, app__38862.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__38862, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__38868 = comp.call(null, k, tree.key);
    if(c__38868 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__38868 < 0) {
        var del__38869 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____38870 = !(del__38869 == null);
          if(or__3824__auto____38870) {
            return or__3824__auto____38870
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__38869, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__38869, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__38871 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____38872 = !(del__38871 == null);
            if(or__3824__auto____38872) {
              return or__3824__auto____38872
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__38871)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__38871, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__38875 = tree.key;
  var c__38876 = comp.call(null, k, tk__38875);
  if(c__38876 === 0) {
    return tree.replace(tk__38875, v, tree.left, tree.right)
  }else {
    if(c__38876 < 0) {
      return tree.replace(tk__38875, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__38875, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38879 = this;
  var h__2247__auto____38880 = this__38879.__hash;
  if(!(h__2247__auto____38880 == null)) {
    return h__2247__auto____38880
  }else {
    var h__2247__auto____38881 = cljs.core.hash_imap.call(null, coll);
    this__38879.__hash = h__2247__auto____38881;
    return h__2247__auto____38881
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__38882 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__38883 = this;
  var n__38884 = coll.entry_at(k);
  if(!(n__38884 == null)) {
    return n__38884.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__38885 = this;
  var found__38886 = [null];
  var t__38887 = cljs.core.tree_map_add.call(null, this__38885.comp, this__38885.tree, k, v, found__38886);
  if(t__38887 == null) {
    var found_node__38888 = cljs.core.nth.call(null, found__38886, 0);
    if(cljs.core._EQ_.call(null, v, found_node__38888.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__38885.comp, cljs.core.tree_map_replace.call(null, this__38885.comp, this__38885.tree, k, v), this__38885.cnt, this__38885.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__38885.comp, t__38887.blacken(), this__38885.cnt + 1, this__38885.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__38889 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__38923 = null;
  var G__38923__2 = function(this_sym38890, k) {
    var this__38892 = this;
    var this_sym38890__38893 = this;
    var coll__38894 = this_sym38890__38893;
    return coll__38894.cljs$core$ILookup$_lookup$arity$2(coll__38894, k)
  };
  var G__38923__3 = function(this_sym38891, k, not_found) {
    var this__38892 = this;
    var this_sym38891__38895 = this;
    var coll__38896 = this_sym38891__38895;
    return coll__38896.cljs$core$ILookup$_lookup$arity$3(coll__38896, k, not_found)
  };
  G__38923 = function(this_sym38891, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__38923__2.call(this, this_sym38891, k);
      case 3:
        return G__38923__3.call(this, this_sym38891, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__38923
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym38877, args38878) {
  var this__38897 = this;
  return this_sym38877.call.apply(this_sym38877, [this_sym38877].concat(args38878.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__38898 = this;
  if(!(this__38898.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__38898.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__38899 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__38900 = this;
  if(this__38900.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__38900.tree, false, this__38900.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__38901 = this;
  var this__38902 = this;
  return cljs.core.pr_str.call(null, this__38902)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__38903 = this;
  var coll__38904 = this;
  var t__38905 = this__38903.tree;
  while(true) {
    if(!(t__38905 == null)) {
      var c__38906 = this__38903.comp.call(null, k, t__38905.key);
      if(c__38906 === 0) {
        return t__38905
      }else {
        if(c__38906 < 0) {
          var G__38924 = t__38905.left;
          t__38905 = G__38924;
          continue
        }else {
          if("\ufdd0'else") {
            var G__38925 = t__38905.right;
            t__38905 = G__38925;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__38907 = this;
  if(this__38907.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__38907.tree, ascending_QMARK_, this__38907.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__38908 = this;
  if(this__38908.cnt > 0) {
    var stack__38909 = null;
    var t__38910 = this__38908.tree;
    while(true) {
      if(!(t__38910 == null)) {
        var c__38911 = this__38908.comp.call(null, k, t__38910.key);
        if(c__38911 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__38909, t__38910), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__38911 < 0) {
              var G__38926 = cljs.core.conj.call(null, stack__38909, t__38910);
              var G__38927 = t__38910.left;
              stack__38909 = G__38926;
              t__38910 = G__38927;
              continue
            }else {
              var G__38928 = stack__38909;
              var G__38929 = t__38910.right;
              stack__38909 = G__38928;
              t__38910 = G__38929;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__38911 > 0) {
                var G__38930 = cljs.core.conj.call(null, stack__38909, t__38910);
                var G__38931 = t__38910.right;
                stack__38909 = G__38930;
                t__38910 = G__38931;
                continue
              }else {
                var G__38932 = stack__38909;
                var G__38933 = t__38910.left;
                stack__38909 = G__38932;
                t__38910 = G__38933;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__38909 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__38909, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__38912 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__38913 = this;
  return this__38913.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__38914 = this;
  if(this__38914.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__38914.tree, true, this__38914.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__38915 = this;
  return this__38915.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__38916 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__38917 = this;
  return new cljs.core.PersistentTreeMap(this__38917.comp, this__38917.tree, this__38917.cnt, meta, this__38917.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__38918 = this;
  return this__38918.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__38919 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__38919.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__38920 = this;
  var found__38921 = [null];
  var t__38922 = cljs.core.tree_map_remove.call(null, this__38920.comp, this__38920.tree, k, found__38921);
  if(t__38922 == null) {
    if(cljs.core.nth.call(null, found__38921, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__38920.comp, null, 0, this__38920.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__38920.comp, t__38922.blacken(), this__38920.cnt - 1, this__38920.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__38936 = cljs.core.seq.call(null, keyvals);
    var out__38937 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__38936) {
        var G__38938 = cljs.core.nnext.call(null, in__38936);
        var G__38939 = cljs.core.assoc_BANG_.call(null, out__38937, cljs.core.first.call(null, in__38936), cljs.core.second.call(null, in__38936));
        in__38936 = G__38938;
        out__38937 = G__38939;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__38937)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__38940) {
    var keyvals = cljs.core.seq(arglist__38940);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__38941) {
    var keyvals = cljs.core.seq(arglist__38941);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__38945 = [];
    var obj__38946 = {};
    var kvs__38947 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__38947) {
        ks__38945.push(cljs.core.first.call(null, kvs__38947));
        obj__38946[cljs.core.first.call(null, kvs__38947)] = cljs.core.second.call(null, kvs__38947);
        var G__38948 = cljs.core.nnext.call(null, kvs__38947);
        kvs__38947 = G__38948;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__38945, obj__38946)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__38949) {
    var keyvals = cljs.core.seq(arglist__38949);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__38952 = cljs.core.seq.call(null, keyvals);
    var out__38953 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__38952) {
        var G__38954 = cljs.core.nnext.call(null, in__38952);
        var G__38955 = cljs.core.assoc.call(null, out__38953, cljs.core.first.call(null, in__38952), cljs.core.second.call(null, in__38952));
        in__38952 = G__38954;
        out__38953 = G__38955;
        continue
      }else {
        return out__38953
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__38956) {
    var keyvals = cljs.core.seq(arglist__38956);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__38959 = cljs.core.seq.call(null, keyvals);
    var out__38960 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__38959) {
        var G__38961 = cljs.core.nnext.call(null, in__38959);
        var G__38962 = cljs.core.assoc.call(null, out__38960, cljs.core.first.call(null, in__38959), cljs.core.second.call(null, in__38959));
        in__38959 = G__38961;
        out__38960 = G__38962;
        continue
      }else {
        return out__38960
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__38963) {
    var comparator = cljs.core.first(arglist__38963);
    var keyvals = cljs.core.rest(arglist__38963);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__38964_SHARP_, p2__38965_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____38967 = p1__38964_SHARP_;
          if(cljs.core.truth_(or__3824__auto____38967)) {
            return or__3824__auto____38967
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__38965_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__38968) {
    var maps = cljs.core.seq(arglist__38968);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__38976 = function(m, e) {
        var k__38974 = cljs.core.first.call(null, e);
        var v__38975 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__38974)) {
          return cljs.core.assoc.call(null, m, k__38974, f.call(null, cljs.core._lookup.call(null, m, k__38974, null), v__38975))
        }else {
          return cljs.core.assoc.call(null, m, k__38974, v__38975)
        }
      };
      var merge2__38978 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__38976, function() {
          var or__3824__auto____38977 = m1;
          if(cljs.core.truth_(or__3824__auto____38977)) {
            return or__3824__auto____38977
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__38978, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__38979) {
    var f = cljs.core.first(arglist__38979);
    var maps = cljs.core.rest(arglist__38979);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__38984 = cljs.core.ObjMap.EMPTY;
  var keys__38985 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__38985) {
      var key__38986 = cljs.core.first.call(null, keys__38985);
      var entry__38987 = cljs.core._lookup.call(null, map, key__38986, "\ufdd0'cljs.core/not-found");
      var G__38988 = cljs.core.not_EQ_.call(null, entry__38987, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__38984, key__38986, entry__38987) : ret__38984;
      var G__38989 = cljs.core.next.call(null, keys__38985);
      ret__38984 = G__38988;
      keys__38985 = G__38989;
      continue
    }else {
      return ret__38984
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__38993 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__38993.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__38994 = this;
  var h__2247__auto____38995 = this__38994.__hash;
  if(!(h__2247__auto____38995 == null)) {
    return h__2247__auto____38995
  }else {
    var h__2247__auto____38996 = cljs.core.hash_iset.call(null, coll);
    this__38994.__hash = h__2247__auto____38996;
    return h__2247__auto____38996
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__38997 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__38998 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__38998.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__39019 = null;
  var G__39019__2 = function(this_sym38999, k) {
    var this__39001 = this;
    var this_sym38999__39002 = this;
    var coll__39003 = this_sym38999__39002;
    return coll__39003.cljs$core$ILookup$_lookup$arity$2(coll__39003, k)
  };
  var G__39019__3 = function(this_sym39000, k, not_found) {
    var this__39001 = this;
    var this_sym39000__39004 = this;
    var coll__39005 = this_sym39000__39004;
    return coll__39005.cljs$core$ILookup$_lookup$arity$3(coll__39005, k, not_found)
  };
  G__39019 = function(this_sym39000, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__39019__2.call(this, this_sym39000, k);
      case 3:
        return G__39019__3.call(this, this_sym39000, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__39019
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym38991, args38992) {
  var this__39006 = this;
  return this_sym38991.call.apply(this_sym38991, [this_sym38991].concat(args38992.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__39007 = this;
  return new cljs.core.PersistentHashSet(this__39007.meta, cljs.core.assoc.call(null, this__39007.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__39008 = this;
  var this__39009 = this;
  return cljs.core.pr_str.call(null, this__39009)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__39010 = this;
  return cljs.core.keys.call(null, this__39010.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__39011 = this;
  return new cljs.core.PersistentHashSet(this__39011.meta, cljs.core.dissoc.call(null, this__39011.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__39012 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__39013 = this;
  var and__3822__auto____39014 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____39014) {
    var and__3822__auto____39015 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____39015) {
      return cljs.core.every_QMARK_.call(null, function(p1__38990_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__38990_SHARP_)
      }, other)
    }else {
      return and__3822__auto____39015
    }
  }else {
    return and__3822__auto____39014
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__39016 = this;
  return new cljs.core.PersistentHashSet(meta, this__39016.hash_map, this__39016.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__39017 = this;
  return this__39017.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__39018 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__39018.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__39020 = cljs.core.count.call(null, items);
  var i__39021 = 0;
  var out__39022 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__39021 < len__39020) {
      var G__39023 = i__39021 + 1;
      var G__39024 = cljs.core.conj_BANG_.call(null, out__39022, items[i__39021]);
      i__39021 = G__39023;
      out__39022 = G__39024;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__39022)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__39042 = null;
  var G__39042__2 = function(this_sym39028, k) {
    var this__39030 = this;
    var this_sym39028__39031 = this;
    var tcoll__39032 = this_sym39028__39031;
    if(cljs.core._lookup.call(null, this__39030.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__39042__3 = function(this_sym39029, k, not_found) {
    var this__39030 = this;
    var this_sym39029__39033 = this;
    var tcoll__39034 = this_sym39029__39033;
    if(cljs.core._lookup.call(null, this__39030.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__39042 = function(this_sym39029, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__39042__2.call(this, this_sym39029, k);
      case 3:
        return G__39042__3.call(this, this_sym39029, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__39042
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym39026, args39027) {
  var this__39035 = this;
  return this_sym39026.call.apply(this_sym39026, [this_sym39026].concat(args39027.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__39036 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__39037 = this;
  if(cljs.core._lookup.call(null, this__39037.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__39038 = this;
  return cljs.core.count.call(null, this__39038.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__39039 = this;
  this__39039.transient_map = cljs.core.dissoc_BANG_.call(null, this__39039.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__39040 = this;
  this__39040.transient_map = cljs.core.assoc_BANG_.call(null, this__39040.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__39041 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__39041.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__39045 = this;
  var h__2247__auto____39046 = this__39045.__hash;
  if(!(h__2247__auto____39046 == null)) {
    return h__2247__auto____39046
  }else {
    var h__2247__auto____39047 = cljs.core.hash_iset.call(null, coll);
    this__39045.__hash = h__2247__auto____39047;
    return h__2247__auto____39047
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__39048 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__39049 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__39049.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__39075 = null;
  var G__39075__2 = function(this_sym39050, k) {
    var this__39052 = this;
    var this_sym39050__39053 = this;
    var coll__39054 = this_sym39050__39053;
    return coll__39054.cljs$core$ILookup$_lookup$arity$2(coll__39054, k)
  };
  var G__39075__3 = function(this_sym39051, k, not_found) {
    var this__39052 = this;
    var this_sym39051__39055 = this;
    var coll__39056 = this_sym39051__39055;
    return coll__39056.cljs$core$ILookup$_lookup$arity$3(coll__39056, k, not_found)
  };
  G__39075 = function(this_sym39051, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__39075__2.call(this, this_sym39051, k);
      case 3:
        return G__39075__3.call(this, this_sym39051, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__39075
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym39043, args39044) {
  var this__39057 = this;
  return this_sym39043.call.apply(this_sym39043, [this_sym39043].concat(args39044.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__39058 = this;
  return new cljs.core.PersistentTreeSet(this__39058.meta, cljs.core.assoc.call(null, this__39058.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__39059 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__39059.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__39060 = this;
  var this__39061 = this;
  return cljs.core.pr_str.call(null, this__39061)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__39062 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__39062.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__39063 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__39063.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__39064 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__39065 = this;
  return cljs.core._comparator.call(null, this__39065.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__39066 = this;
  return cljs.core.keys.call(null, this__39066.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__39067 = this;
  return new cljs.core.PersistentTreeSet(this__39067.meta, cljs.core.dissoc.call(null, this__39067.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__39068 = this;
  return cljs.core.count.call(null, this__39068.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__39069 = this;
  var and__3822__auto____39070 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____39070) {
    var and__3822__auto____39071 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____39071) {
      return cljs.core.every_QMARK_.call(null, function(p1__39025_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__39025_SHARP_)
      }, other)
    }else {
      return and__3822__auto____39071
    }
  }else {
    return and__3822__auto____39070
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__39072 = this;
  return new cljs.core.PersistentTreeSet(meta, this__39072.tree_map, this__39072.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__39073 = this;
  return this__39073.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__39074 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__39074.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__39080__delegate = function(keys) {
      var in__39078 = cljs.core.seq.call(null, keys);
      var out__39079 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__39078)) {
          var G__39081 = cljs.core.next.call(null, in__39078);
          var G__39082 = cljs.core.conj_BANG_.call(null, out__39079, cljs.core.first.call(null, in__39078));
          in__39078 = G__39081;
          out__39079 = G__39082;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__39079)
        }
        break
      }
    };
    var G__39080 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__39080__delegate.call(this, keys)
    };
    G__39080.cljs$lang$maxFixedArity = 0;
    G__39080.cljs$lang$applyTo = function(arglist__39083) {
      var keys = cljs.core.seq(arglist__39083);
      return G__39080__delegate(keys)
    };
    G__39080.cljs$lang$arity$variadic = G__39080__delegate;
    return G__39080
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__39084) {
    var keys = cljs.core.seq(arglist__39084);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__39086) {
    var comparator = cljs.core.first(arglist__39086);
    var keys = cljs.core.rest(arglist__39086);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__39092 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____39093 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____39093)) {
        var e__39094 = temp__3971__auto____39093;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__39094))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__39092, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__39085_SHARP_) {
      var temp__3971__auto____39095 = cljs.core.find.call(null, smap, p1__39085_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____39095)) {
        var e__39096 = temp__3971__auto____39095;
        return cljs.core.second.call(null, e__39096)
      }else {
        return p1__39085_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__39126 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__39119, seen) {
        while(true) {
          var vec__39120__39121 = p__39119;
          var f__39122 = cljs.core.nth.call(null, vec__39120__39121, 0, null);
          var xs__39123 = vec__39120__39121;
          var temp__3974__auto____39124 = cljs.core.seq.call(null, xs__39123);
          if(temp__3974__auto____39124) {
            var s__39125 = temp__3974__auto____39124;
            if(cljs.core.contains_QMARK_.call(null, seen, f__39122)) {
              var G__39127 = cljs.core.rest.call(null, s__39125);
              var G__39128 = seen;
              p__39119 = G__39127;
              seen = G__39128;
              continue
            }else {
              return cljs.core.cons.call(null, f__39122, step.call(null, cljs.core.rest.call(null, s__39125), cljs.core.conj.call(null, seen, f__39122)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__39126.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__39131 = cljs.core.PersistentVector.EMPTY;
  var s__39132 = s;
  while(true) {
    if(cljs.core.next.call(null, s__39132)) {
      var G__39133 = cljs.core.conj.call(null, ret__39131, cljs.core.first.call(null, s__39132));
      var G__39134 = cljs.core.next.call(null, s__39132);
      ret__39131 = G__39133;
      s__39132 = G__39134;
      continue
    }else {
      return cljs.core.seq.call(null, ret__39131)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____39137 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____39137) {
        return or__3824__auto____39137
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__39138 = x.lastIndexOf("/");
      if(i__39138 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__39138 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____39141 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____39141) {
      return or__3824__auto____39141
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__39142 = x.lastIndexOf("/");
    if(i__39142 > -1) {
      return cljs.core.subs.call(null, x, 2, i__39142)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__39149 = cljs.core.ObjMap.EMPTY;
  var ks__39150 = cljs.core.seq.call(null, keys);
  var vs__39151 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____39152 = ks__39150;
      if(and__3822__auto____39152) {
        return vs__39151
      }else {
        return and__3822__auto____39152
      }
    }()) {
      var G__39153 = cljs.core.assoc.call(null, map__39149, cljs.core.first.call(null, ks__39150), cljs.core.first.call(null, vs__39151));
      var G__39154 = cljs.core.next.call(null, ks__39150);
      var G__39155 = cljs.core.next.call(null, vs__39151);
      map__39149 = G__39153;
      ks__39150 = G__39154;
      vs__39151 = G__39155;
      continue
    }else {
      return map__39149
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__39158__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__39143_SHARP_, p2__39144_SHARP_) {
        return max_key.call(null, k, p1__39143_SHARP_, p2__39144_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__39158 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__39158__delegate.call(this, k, x, y, more)
    };
    G__39158.cljs$lang$maxFixedArity = 3;
    G__39158.cljs$lang$applyTo = function(arglist__39159) {
      var k = cljs.core.first(arglist__39159);
      var x = cljs.core.first(cljs.core.next(arglist__39159));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__39159)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__39159)));
      return G__39158__delegate(k, x, y, more)
    };
    G__39158.cljs$lang$arity$variadic = G__39158__delegate;
    return G__39158
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__39160__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__39156_SHARP_, p2__39157_SHARP_) {
        return min_key.call(null, k, p1__39156_SHARP_, p2__39157_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__39160 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__39160__delegate.call(this, k, x, y, more)
    };
    G__39160.cljs$lang$maxFixedArity = 3;
    G__39160.cljs$lang$applyTo = function(arglist__39161) {
      var k = cljs.core.first(arglist__39161);
      var x = cljs.core.first(cljs.core.next(arglist__39161));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__39161)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__39161)));
      return G__39160__delegate(k, x, y, more)
    };
    G__39160.cljs$lang$arity$variadic = G__39160__delegate;
    return G__39160
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____39164 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____39164) {
        var s__39165 = temp__3974__auto____39164;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__39165), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__39165)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____39168 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____39168) {
      var s__39169 = temp__3974__auto____39168;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__39169)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__39169), take_while.call(null, pred, cljs.core.rest.call(null, s__39169)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__39171 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__39171.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__39183 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____39184 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____39184)) {
        var vec__39185__39186 = temp__3974__auto____39184;
        var e__39187 = cljs.core.nth.call(null, vec__39185__39186, 0, null);
        var s__39188 = vec__39185__39186;
        if(cljs.core.truth_(include__39183.call(null, e__39187))) {
          return s__39188
        }else {
          return cljs.core.next.call(null, s__39188)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__39183, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____39189 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____39189)) {
      var vec__39190__39191 = temp__3974__auto____39189;
      var e__39192 = cljs.core.nth.call(null, vec__39190__39191, 0, null);
      var s__39193 = vec__39190__39191;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__39192)) ? s__39193 : cljs.core.next.call(null, s__39193))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__39205 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____39206 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____39206)) {
        var vec__39207__39208 = temp__3974__auto____39206;
        var e__39209 = cljs.core.nth.call(null, vec__39207__39208, 0, null);
        var s__39210 = vec__39207__39208;
        if(cljs.core.truth_(include__39205.call(null, e__39209))) {
          return s__39210
        }else {
          return cljs.core.next.call(null, s__39210)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__39205, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____39211 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____39211)) {
      var vec__39212__39213 = temp__3974__auto____39211;
      var e__39214 = cljs.core.nth.call(null, vec__39212__39213, 0, null);
      var s__39215 = vec__39212__39213;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__39214)) ? s__39215 : cljs.core.next.call(null, s__39215))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__39216 = this;
  var h__2247__auto____39217 = this__39216.__hash;
  if(!(h__2247__auto____39217 == null)) {
    return h__2247__auto____39217
  }else {
    var h__2247__auto____39218 = cljs.core.hash_coll.call(null, rng);
    this__39216.__hash = h__2247__auto____39218;
    return h__2247__auto____39218
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__39219 = this;
  if(this__39219.step > 0) {
    if(this__39219.start + this__39219.step < this__39219.end) {
      return new cljs.core.Range(this__39219.meta, this__39219.start + this__39219.step, this__39219.end, this__39219.step, null)
    }else {
      return null
    }
  }else {
    if(this__39219.start + this__39219.step > this__39219.end) {
      return new cljs.core.Range(this__39219.meta, this__39219.start + this__39219.step, this__39219.end, this__39219.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__39220 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__39221 = this;
  var this__39222 = this;
  return cljs.core.pr_str.call(null, this__39222)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__39223 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__39224 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__39225 = this;
  if(this__39225.step > 0) {
    if(this__39225.start < this__39225.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__39225.start > this__39225.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__39226 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__39226.end - this__39226.start) / this__39226.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__39227 = this;
  return this__39227.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__39228 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__39228.meta, this__39228.start + this__39228.step, this__39228.end, this__39228.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__39229 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__39230 = this;
  return new cljs.core.Range(meta, this__39230.start, this__39230.end, this__39230.step, this__39230.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__39231 = this;
  return this__39231.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__39232 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__39232.start + n * this__39232.step
  }else {
    if(function() {
      var and__3822__auto____39233 = this__39232.start > this__39232.end;
      if(and__3822__auto____39233) {
        return this__39232.step === 0
      }else {
        return and__3822__auto____39233
      }
    }()) {
      return this__39232.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__39234 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__39234.start + n * this__39234.step
  }else {
    if(function() {
      var and__3822__auto____39235 = this__39234.start > this__39234.end;
      if(and__3822__auto____39235) {
        return this__39234.step === 0
      }else {
        return and__3822__auto____39235
      }
    }()) {
      return this__39234.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__39236 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__39236.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____39239 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____39239) {
      var s__39240 = temp__3974__auto____39239;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__39240), take_nth.call(null, n, cljs.core.drop.call(null, n, s__39240)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____39247 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____39247) {
      var s__39248 = temp__3974__auto____39247;
      var fst__39249 = cljs.core.first.call(null, s__39248);
      var fv__39250 = f.call(null, fst__39249);
      var run__39251 = cljs.core.cons.call(null, fst__39249, cljs.core.take_while.call(null, function(p1__39241_SHARP_) {
        return cljs.core._EQ_.call(null, fv__39250, f.call(null, p1__39241_SHARP_))
      }, cljs.core.next.call(null, s__39248)));
      return cljs.core.cons.call(null, run__39251, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__39251), s__39248))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____39266 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____39266) {
        var s__39267 = temp__3971__auto____39266;
        return reductions.call(null, f, cljs.core.first.call(null, s__39267), cljs.core.rest.call(null, s__39267))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____39268 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____39268) {
        var s__39269 = temp__3974__auto____39268;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__39269)), cljs.core.rest.call(null, s__39269))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__39272 = null;
      var G__39272__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__39272__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__39272__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__39272__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__39272__4 = function() {
        var G__39273__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__39273 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__39273__delegate.call(this, x, y, z, args)
        };
        G__39273.cljs$lang$maxFixedArity = 3;
        G__39273.cljs$lang$applyTo = function(arglist__39274) {
          var x = cljs.core.first(arglist__39274);
          var y = cljs.core.first(cljs.core.next(arglist__39274));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__39274)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__39274)));
          return G__39273__delegate(x, y, z, args)
        };
        G__39273.cljs$lang$arity$variadic = G__39273__delegate;
        return G__39273
      }();
      G__39272 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__39272__0.call(this);
          case 1:
            return G__39272__1.call(this, x);
          case 2:
            return G__39272__2.call(this, x, y);
          case 3:
            return G__39272__3.call(this, x, y, z);
          default:
            return G__39272__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__39272.cljs$lang$maxFixedArity = 3;
      G__39272.cljs$lang$applyTo = G__39272__4.cljs$lang$applyTo;
      return G__39272
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__39275 = null;
      var G__39275__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__39275__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__39275__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__39275__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__39275__4 = function() {
        var G__39276__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__39276 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__39276__delegate.call(this, x, y, z, args)
        };
        G__39276.cljs$lang$maxFixedArity = 3;
        G__39276.cljs$lang$applyTo = function(arglist__39277) {
          var x = cljs.core.first(arglist__39277);
          var y = cljs.core.first(cljs.core.next(arglist__39277));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__39277)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__39277)));
          return G__39276__delegate(x, y, z, args)
        };
        G__39276.cljs$lang$arity$variadic = G__39276__delegate;
        return G__39276
      }();
      G__39275 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__39275__0.call(this);
          case 1:
            return G__39275__1.call(this, x);
          case 2:
            return G__39275__2.call(this, x, y);
          case 3:
            return G__39275__3.call(this, x, y, z);
          default:
            return G__39275__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__39275.cljs$lang$maxFixedArity = 3;
      G__39275.cljs$lang$applyTo = G__39275__4.cljs$lang$applyTo;
      return G__39275
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__39278 = null;
      var G__39278__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__39278__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__39278__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__39278__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__39278__4 = function() {
        var G__39279__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__39279 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__39279__delegate.call(this, x, y, z, args)
        };
        G__39279.cljs$lang$maxFixedArity = 3;
        G__39279.cljs$lang$applyTo = function(arglist__39280) {
          var x = cljs.core.first(arglist__39280);
          var y = cljs.core.first(cljs.core.next(arglist__39280));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__39280)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__39280)));
          return G__39279__delegate(x, y, z, args)
        };
        G__39279.cljs$lang$arity$variadic = G__39279__delegate;
        return G__39279
      }();
      G__39278 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__39278__0.call(this);
          case 1:
            return G__39278__1.call(this, x);
          case 2:
            return G__39278__2.call(this, x, y);
          case 3:
            return G__39278__3.call(this, x, y, z);
          default:
            return G__39278__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__39278.cljs$lang$maxFixedArity = 3;
      G__39278.cljs$lang$applyTo = G__39278__4.cljs$lang$applyTo;
      return G__39278
    }()
  };
  var juxt__4 = function() {
    var G__39281__delegate = function(f, g, h, fs) {
      var fs__39271 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__39282 = null;
        var G__39282__0 = function() {
          return cljs.core.reduce.call(null, function(p1__39252_SHARP_, p2__39253_SHARP_) {
            return cljs.core.conj.call(null, p1__39252_SHARP_, p2__39253_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__39271)
        };
        var G__39282__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__39254_SHARP_, p2__39255_SHARP_) {
            return cljs.core.conj.call(null, p1__39254_SHARP_, p2__39255_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__39271)
        };
        var G__39282__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__39256_SHARP_, p2__39257_SHARP_) {
            return cljs.core.conj.call(null, p1__39256_SHARP_, p2__39257_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__39271)
        };
        var G__39282__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__39258_SHARP_, p2__39259_SHARP_) {
            return cljs.core.conj.call(null, p1__39258_SHARP_, p2__39259_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__39271)
        };
        var G__39282__4 = function() {
          var G__39283__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__39260_SHARP_, p2__39261_SHARP_) {
              return cljs.core.conj.call(null, p1__39260_SHARP_, cljs.core.apply.call(null, p2__39261_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__39271)
          };
          var G__39283 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__39283__delegate.call(this, x, y, z, args)
          };
          G__39283.cljs$lang$maxFixedArity = 3;
          G__39283.cljs$lang$applyTo = function(arglist__39284) {
            var x = cljs.core.first(arglist__39284);
            var y = cljs.core.first(cljs.core.next(arglist__39284));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__39284)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__39284)));
            return G__39283__delegate(x, y, z, args)
          };
          G__39283.cljs$lang$arity$variadic = G__39283__delegate;
          return G__39283
        }();
        G__39282 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__39282__0.call(this);
            case 1:
              return G__39282__1.call(this, x);
            case 2:
              return G__39282__2.call(this, x, y);
            case 3:
              return G__39282__3.call(this, x, y, z);
            default:
              return G__39282__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__39282.cljs$lang$maxFixedArity = 3;
        G__39282.cljs$lang$applyTo = G__39282__4.cljs$lang$applyTo;
        return G__39282
      }()
    };
    var G__39281 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__39281__delegate.call(this, f, g, h, fs)
    };
    G__39281.cljs$lang$maxFixedArity = 3;
    G__39281.cljs$lang$applyTo = function(arglist__39285) {
      var f = cljs.core.first(arglist__39285);
      var g = cljs.core.first(cljs.core.next(arglist__39285));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__39285)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__39285)));
      return G__39281__delegate(f, g, h, fs)
    };
    G__39281.cljs$lang$arity$variadic = G__39281__delegate;
    return G__39281
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__39288 = cljs.core.next.call(null, coll);
        coll = G__39288;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____39287 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____39287) {
          return n > 0
        }else {
          return and__3822__auto____39287
        }
      }())) {
        var G__39289 = n - 1;
        var G__39290 = cljs.core.next.call(null, coll);
        n = G__39289;
        coll = G__39290;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__39292 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__39292), s)) {
    if(cljs.core.count.call(null, matches__39292) === 1) {
      return cljs.core.first.call(null, matches__39292)
    }else {
      return cljs.core.vec.call(null, matches__39292)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__39294 = re.exec(s);
  if(matches__39294 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__39294) === 1) {
      return cljs.core.first.call(null, matches__39294)
    }else {
      return cljs.core.vec.call(null, matches__39294)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__39299 = cljs.core.re_find.call(null, re, s);
  var match_idx__39300 = s.search(re);
  var match_str__39301 = cljs.core.coll_QMARK_.call(null, match_data__39299) ? cljs.core.first.call(null, match_data__39299) : match_data__39299;
  var post_match__39302 = cljs.core.subs.call(null, s, match_idx__39300 + cljs.core.count.call(null, match_str__39301));
  if(cljs.core.truth_(match_data__39299)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__39299, re_seq.call(null, re, post_match__39302))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__39309__39310 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___39311 = cljs.core.nth.call(null, vec__39309__39310, 0, null);
  var flags__39312 = cljs.core.nth.call(null, vec__39309__39310, 1, null);
  var pattern__39313 = cljs.core.nth.call(null, vec__39309__39310, 2, null);
  return new RegExp(pattern__39313, flags__39312)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__39303_SHARP_) {
    return print_one.call(null, p1__39303_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____39323 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____39323)) {
            var and__3822__auto____39327 = function() {
              var G__39324__39325 = obj;
              if(G__39324__39325) {
                if(function() {
                  var or__3824__auto____39326 = G__39324__39325.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____39326) {
                    return or__3824__auto____39326
                  }else {
                    return G__39324__39325.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__39324__39325.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__39324__39325)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__39324__39325)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____39327)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____39327
            }
          }else {
            return and__3822__auto____39323
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____39328 = !(obj == null);
          if(and__3822__auto____39328) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____39328
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__39329__39330 = obj;
          if(G__39329__39330) {
            if(function() {
              var or__3824__auto____39331 = G__39329__39330.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____39331) {
                return or__3824__auto____39331
              }else {
                return G__39329__39330.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__39329__39330.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__39329__39330)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__39329__39330)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__39351 = new goog.string.StringBuffer;
  var G__39352__39353 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__39352__39353) {
    var string__39354 = cljs.core.first.call(null, G__39352__39353);
    var G__39352__39355 = G__39352__39353;
    while(true) {
      sb__39351.append(string__39354);
      var temp__3974__auto____39356 = cljs.core.next.call(null, G__39352__39355);
      if(temp__3974__auto____39356) {
        var G__39352__39357 = temp__3974__auto____39356;
        var G__39370 = cljs.core.first.call(null, G__39352__39357);
        var G__39371 = G__39352__39357;
        string__39354 = G__39370;
        G__39352__39355 = G__39371;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__39358__39359 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__39358__39359) {
    var obj__39360 = cljs.core.first.call(null, G__39358__39359);
    var G__39358__39361 = G__39358__39359;
    while(true) {
      sb__39351.append(" ");
      var G__39362__39363 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__39360, opts));
      if(G__39362__39363) {
        var string__39364 = cljs.core.first.call(null, G__39362__39363);
        var G__39362__39365 = G__39362__39363;
        while(true) {
          sb__39351.append(string__39364);
          var temp__3974__auto____39366 = cljs.core.next.call(null, G__39362__39365);
          if(temp__3974__auto____39366) {
            var G__39362__39367 = temp__3974__auto____39366;
            var G__39372 = cljs.core.first.call(null, G__39362__39367);
            var G__39373 = G__39362__39367;
            string__39364 = G__39372;
            G__39362__39365 = G__39373;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____39368 = cljs.core.next.call(null, G__39358__39361);
      if(temp__3974__auto____39368) {
        var G__39358__39369 = temp__3974__auto____39368;
        var G__39374 = cljs.core.first.call(null, G__39358__39369);
        var G__39375 = G__39358__39369;
        obj__39360 = G__39374;
        G__39358__39361 = G__39375;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__39351
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__39377 = cljs.core.pr_sb.call(null, objs, opts);
  sb__39377.append("\n");
  return[cljs.core.str(sb__39377)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__39396__39397 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__39396__39397) {
    var string__39398 = cljs.core.first.call(null, G__39396__39397);
    var G__39396__39399 = G__39396__39397;
    while(true) {
      cljs.core.string_print.call(null, string__39398);
      var temp__3974__auto____39400 = cljs.core.next.call(null, G__39396__39399);
      if(temp__3974__auto____39400) {
        var G__39396__39401 = temp__3974__auto____39400;
        var G__39414 = cljs.core.first.call(null, G__39396__39401);
        var G__39415 = G__39396__39401;
        string__39398 = G__39414;
        G__39396__39399 = G__39415;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__39402__39403 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__39402__39403) {
    var obj__39404 = cljs.core.first.call(null, G__39402__39403);
    var G__39402__39405 = G__39402__39403;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__39406__39407 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__39404, opts));
      if(G__39406__39407) {
        var string__39408 = cljs.core.first.call(null, G__39406__39407);
        var G__39406__39409 = G__39406__39407;
        while(true) {
          cljs.core.string_print.call(null, string__39408);
          var temp__3974__auto____39410 = cljs.core.next.call(null, G__39406__39409);
          if(temp__3974__auto____39410) {
            var G__39406__39411 = temp__3974__auto____39410;
            var G__39416 = cljs.core.first.call(null, G__39406__39411);
            var G__39417 = G__39406__39411;
            string__39408 = G__39416;
            G__39406__39409 = G__39417;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____39412 = cljs.core.next.call(null, G__39402__39405);
      if(temp__3974__auto____39412) {
        var G__39402__39413 = temp__3974__auto____39412;
        var G__39418 = cljs.core.first.call(null, G__39402__39413);
        var G__39419 = G__39402__39413;
        obj__39404 = G__39418;
        G__39402__39405 = G__39419;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__39420) {
    var objs = cljs.core.seq(arglist__39420);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__39421) {
    var objs = cljs.core.seq(arglist__39421);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__39422) {
    var objs = cljs.core.seq(arglist__39422);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__39423) {
    var objs = cljs.core.seq(arglist__39423);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__39424) {
    var objs = cljs.core.seq(arglist__39424);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__39425) {
    var objs = cljs.core.seq(arglist__39425);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__39426) {
    var objs = cljs.core.seq(arglist__39426);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__39427) {
    var objs = cljs.core.seq(arglist__39427);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__39428) {
    var fmt = cljs.core.first(arglist__39428);
    var args = cljs.core.rest(arglist__39428);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__39429 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__39429, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__39430 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__39430, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__39431 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__39431, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____39432 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____39432)) {
        var nspc__39433 = temp__3974__auto____39432;
        return[cljs.core.str(nspc__39433), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____39434 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____39434)) {
          var nspc__39435 = temp__3974__auto____39434;
          return[cljs.core.str(nspc__39435), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__39436 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__39436, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__39438 = function(n, len) {
    var ns__39437 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__39437) < len) {
        var G__39440 = [cljs.core.str("0"), cljs.core.str(ns__39437)].join("");
        ns__39437 = G__39440;
        continue
      }else {
        return ns__39437
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__39438.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__39438.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__39438.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__39438.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__39438.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__39438.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__39439 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__39439, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__39441 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__39442 = this;
  var G__39443__39444 = cljs.core.seq.call(null, this__39442.watches);
  if(G__39443__39444) {
    var G__39446__39448 = cljs.core.first.call(null, G__39443__39444);
    var vec__39447__39449 = G__39446__39448;
    var key__39450 = cljs.core.nth.call(null, vec__39447__39449, 0, null);
    var f__39451 = cljs.core.nth.call(null, vec__39447__39449, 1, null);
    var G__39443__39452 = G__39443__39444;
    var G__39446__39453 = G__39446__39448;
    var G__39443__39454 = G__39443__39452;
    while(true) {
      var vec__39455__39456 = G__39446__39453;
      var key__39457 = cljs.core.nth.call(null, vec__39455__39456, 0, null);
      var f__39458 = cljs.core.nth.call(null, vec__39455__39456, 1, null);
      var G__39443__39459 = G__39443__39454;
      f__39458.call(null, key__39457, this$, oldval, newval);
      var temp__3974__auto____39460 = cljs.core.next.call(null, G__39443__39459);
      if(temp__3974__auto____39460) {
        var G__39443__39461 = temp__3974__auto____39460;
        var G__39468 = cljs.core.first.call(null, G__39443__39461);
        var G__39469 = G__39443__39461;
        G__39446__39453 = G__39468;
        G__39443__39454 = G__39469;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__39462 = this;
  return this$.watches = cljs.core.assoc.call(null, this__39462.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__39463 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__39463.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__39464 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__39464.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__39465 = this;
  return this__39465.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__39466 = this;
  return this__39466.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__39467 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__39481__delegate = function(x, p__39470) {
      var map__39476__39477 = p__39470;
      var map__39476__39478 = cljs.core.seq_QMARK_.call(null, map__39476__39477) ? cljs.core.apply.call(null, cljs.core.hash_map, map__39476__39477) : map__39476__39477;
      var validator__39479 = cljs.core._lookup.call(null, map__39476__39478, "\ufdd0'validator", null);
      var meta__39480 = cljs.core._lookup.call(null, map__39476__39478, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__39480, validator__39479, null)
    };
    var G__39481 = function(x, var_args) {
      var p__39470 = null;
      if(goog.isDef(var_args)) {
        p__39470 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__39481__delegate.call(this, x, p__39470)
    };
    G__39481.cljs$lang$maxFixedArity = 1;
    G__39481.cljs$lang$applyTo = function(arglist__39482) {
      var x = cljs.core.first(arglist__39482);
      var p__39470 = cljs.core.rest(arglist__39482);
      return G__39481__delegate(x, p__39470)
    };
    G__39481.cljs$lang$arity$variadic = G__39481__delegate;
    return G__39481
  }();
  atom = function(x, var_args) {
    var p__39470 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____39486 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____39486)) {
    var validate__39487 = temp__3974__auto____39486;
    if(cljs.core.truth_(validate__39487.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__39488 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__39488, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__39489__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__39489 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__39489__delegate.call(this, a, f, x, y, z, more)
    };
    G__39489.cljs$lang$maxFixedArity = 5;
    G__39489.cljs$lang$applyTo = function(arglist__39490) {
      var a = cljs.core.first(arglist__39490);
      var f = cljs.core.first(cljs.core.next(arglist__39490));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__39490)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__39490))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__39490)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__39490)))));
      return G__39489__delegate(a, f, x, y, z, more)
    };
    G__39489.cljs$lang$arity$variadic = G__39489__delegate;
    return G__39489
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__39491) {
    var iref = cljs.core.first(arglist__39491);
    var f = cljs.core.first(cljs.core.next(arglist__39491));
    var args = cljs.core.rest(cljs.core.next(arglist__39491));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__39492 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__39492.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__39493 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__39493.state, function(p__39494) {
    var map__39495__39496 = p__39494;
    var map__39495__39497 = cljs.core.seq_QMARK_.call(null, map__39495__39496) ? cljs.core.apply.call(null, cljs.core.hash_map, map__39495__39496) : map__39495__39496;
    var curr_state__39498 = map__39495__39497;
    var done__39499 = cljs.core._lookup.call(null, map__39495__39497, "\ufdd0'done", null);
    if(cljs.core.truth_(done__39499)) {
      return curr_state__39498
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__39493.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__39520__39521 = options;
    var map__39520__39522 = cljs.core.seq_QMARK_.call(null, map__39520__39521) ? cljs.core.apply.call(null, cljs.core.hash_map, map__39520__39521) : map__39520__39521;
    var keywordize_keys__39523 = cljs.core._lookup.call(null, map__39520__39522, "\ufdd0'keywordize-keys", null);
    var keyfn__39524 = cljs.core.truth_(keywordize_keys__39523) ? cljs.core.keyword : cljs.core.str;
    var f__39539 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2517__auto____39538 = function iter__39532(s__39533) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__39533__39536 = s__39533;
                    while(true) {
                      if(cljs.core.seq.call(null, s__39533__39536)) {
                        var k__39537 = cljs.core.first.call(null, s__39533__39536);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__39524.call(null, k__39537), thisfn.call(null, x[k__39537])], true), iter__39532.call(null, cljs.core.rest.call(null, s__39533__39536)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2517__auto____39538.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__39539.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__39540) {
    var x = cljs.core.first(arglist__39540);
    var options = cljs.core.rest(arglist__39540);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__39545 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__39549__delegate = function(args) {
      var temp__3971__auto____39546 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__39545), args, null);
      if(cljs.core.truth_(temp__3971__auto____39546)) {
        var v__39547 = temp__3971__auto____39546;
        return v__39547
      }else {
        var ret__39548 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__39545, cljs.core.assoc, args, ret__39548);
        return ret__39548
      }
    };
    var G__39549 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__39549__delegate.call(this, args)
    };
    G__39549.cljs$lang$maxFixedArity = 0;
    G__39549.cljs$lang$applyTo = function(arglist__39550) {
      var args = cljs.core.seq(arglist__39550);
      return G__39549__delegate(args)
    };
    G__39549.cljs$lang$arity$variadic = G__39549__delegate;
    return G__39549
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__39552 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__39552)) {
        var G__39553 = ret__39552;
        f = G__39553;
        continue
      }else {
        return ret__39552
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__39554__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__39554 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__39554__delegate.call(this, f, args)
    };
    G__39554.cljs$lang$maxFixedArity = 1;
    G__39554.cljs$lang$applyTo = function(arglist__39555) {
      var f = cljs.core.first(arglist__39555);
      var args = cljs.core.rest(arglist__39555);
      return G__39554__delegate(f, args)
    };
    G__39554.cljs$lang$arity$variadic = G__39554__delegate;
    return G__39554
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__39557 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__39557, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__39557, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____39566 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____39566) {
      return or__3824__auto____39566
    }else {
      var or__3824__auto____39567 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____39567) {
        return or__3824__auto____39567
      }else {
        var and__3822__auto____39568 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____39568) {
          var and__3822__auto____39569 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____39569) {
            var and__3822__auto____39570 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____39570) {
              var ret__39571 = true;
              var i__39572 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____39573 = cljs.core.not.call(null, ret__39571);
                  if(or__3824__auto____39573) {
                    return or__3824__auto____39573
                  }else {
                    return i__39572 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__39571
                }else {
                  var G__39574 = isa_QMARK_.call(null, h, child.call(null, i__39572), parent.call(null, i__39572));
                  var G__39575 = i__39572 + 1;
                  ret__39571 = G__39574;
                  i__39572 = G__39575;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____39570
            }
          }else {
            return and__3822__auto____39569
          }
        }else {
          return and__3822__auto____39568
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__39584 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__39585 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__39586 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__39587 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____39588 = cljs.core.contains_QMARK_.call(null, tp__39584.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__39586.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__39586.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__39584, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__39587.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__39585, parent, ta__39586), "\ufdd0'descendants":tf__39587.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__39586, tag, td__39585)})
    }();
    if(cljs.core.truth_(or__3824__auto____39588)) {
      return or__3824__auto____39588
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__39593 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__39594 = cljs.core.truth_(parentMap__39593.call(null, tag)) ? cljs.core.disj.call(null, parentMap__39593.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__39595 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__39594)) ? cljs.core.assoc.call(null, parentMap__39593, tag, childsParents__39594) : cljs.core.dissoc.call(null, parentMap__39593, tag);
    var deriv_seq__39596 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__39576_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__39576_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__39576_SHARP_), cljs.core.second.call(null, p1__39576_SHARP_)))
    }, cljs.core.seq.call(null, newParents__39595)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__39593.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__39577_SHARP_, p2__39578_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__39577_SHARP_, p2__39578_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__39596))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__39604 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____39606 = cljs.core.truth_(function() {
    var and__3822__auto____39605 = xprefs__39604;
    if(cljs.core.truth_(and__3822__auto____39605)) {
      return xprefs__39604.call(null, y)
    }else {
      return and__3822__auto____39605
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____39606)) {
    return or__3824__auto____39606
  }else {
    var or__3824__auto____39608 = function() {
      var ps__39607 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__39607) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__39607), prefer_table))) {
          }else {
          }
          var G__39611 = cljs.core.rest.call(null, ps__39607);
          ps__39607 = G__39611;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____39608)) {
      return or__3824__auto____39608
    }else {
      var or__3824__auto____39610 = function() {
        var ps__39609 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__39609) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__39609), y, prefer_table))) {
            }else {
            }
            var G__39612 = cljs.core.rest.call(null, ps__39609);
            ps__39609 = G__39612;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____39610)) {
        return or__3824__auto____39610
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____39614 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____39614)) {
    return or__3824__auto____39614
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__39632 = cljs.core.reduce.call(null, function(be, p__39624) {
    var vec__39625__39626 = p__39624;
    var k__39627 = cljs.core.nth.call(null, vec__39625__39626, 0, null);
    var ___39628 = cljs.core.nth.call(null, vec__39625__39626, 1, null);
    var e__39629 = vec__39625__39626;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__39627)) {
      var be2__39631 = cljs.core.truth_(function() {
        var or__3824__auto____39630 = be == null;
        if(or__3824__auto____39630) {
          return or__3824__auto____39630
        }else {
          return cljs.core.dominates.call(null, k__39627, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__39629 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__39631), k__39627, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__39627), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__39631)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__39631
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__39632)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__39632));
      return cljs.core.second.call(null, best_entry__39632)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____39637 = mf;
    if(and__3822__auto____39637) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____39637
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2418__auto____39638 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____39639 = cljs.core._reset[goog.typeOf(x__2418__auto____39638)];
      if(or__3824__auto____39639) {
        return or__3824__auto____39639
      }else {
        var or__3824__auto____39640 = cljs.core._reset["_"];
        if(or__3824__auto____39640) {
          return or__3824__auto____39640
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____39645 = mf;
    if(and__3822__auto____39645) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____39645
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2418__auto____39646 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____39647 = cljs.core._add_method[goog.typeOf(x__2418__auto____39646)];
      if(or__3824__auto____39647) {
        return or__3824__auto____39647
      }else {
        var or__3824__auto____39648 = cljs.core._add_method["_"];
        if(or__3824__auto____39648) {
          return or__3824__auto____39648
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____39653 = mf;
    if(and__3822__auto____39653) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____39653
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2418__auto____39654 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____39655 = cljs.core._remove_method[goog.typeOf(x__2418__auto____39654)];
      if(or__3824__auto____39655) {
        return or__3824__auto____39655
      }else {
        var or__3824__auto____39656 = cljs.core._remove_method["_"];
        if(or__3824__auto____39656) {
          return or__3824__auto____39656
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____39661 = mf;
    if(and__3822__auto____39661) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____39661
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2418__auto____39662 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____39663 = cljs.core._prefer_method[goog.typeOf(x__2418__auto____39662)];
      if(or__3824__auto____39663) {
        return or__3824__auto____39663
      }else {
        var or__3824__auto____39664 = cljs.core._prefer_method["_"];
        if(or__3824__auto____39664) {
          return or__3824__auto____39664
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____39669 = mf;
    if(and__3822__auto____39669) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____39669
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2418__auto____39670 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____39671 = cljs.core._get_method[goog.typeOf(x__2418__auto____39670)];
      if(or__3824__auto____39671) {
        return or__3824__auto____39671
      }else {
        var or__3824__auto____39672 = cljs.core._get_method["_"];
        if(or__3824__auto____39672) {
          return or__3824__auto____39672
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____39677 = mf;
    if(and__3822__auto____39677) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____39677
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2418__auto____39678 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____39679 = cljs.core._methods[goog.typeOf(x__2418__auto____39678)];
      if(or__3824__auto____39679) {
        return or__3824__auto____39679
      }else {
        var or__3824__auto____39680 = cljs.core._methods["_"];
        if(or__3824__auto____39680) {
          return or__3824__auto____39680
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____39685 = mf;
    if(and__3822__auto____39685) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____39685
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2418__auto____39686 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____39687 = cljs.core._prefers[goog.typeOf(x__2418__auto____39686)];
      if(or__3824__auto____39687) {
        return or__3824__auto____39687
      }else {
        var or__3824__auto____39688 = cljs.core._prefers["_"];
        if(or__3824__auto____39688) {
          return or__3824__auto____39688
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____39693 = mf;
    if(and__3822__auto____39693) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____39693
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2418__auto____39694 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____39695 = cljs.core._dispatch[goog.typeOf(x__2418__auto____39694)];
      if(or__3824__auto____39695) {
        return or__3824__auto____39695
      }else {
        var or__3824__auto____39696 = cljs.core._dispatch["_"];
        if(or__3824__auto____39696) {
          return or__3824__auto____39696
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__39699 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__39700 = cljs.core._get_method.call(null, mf, dispatch_val__39699);
  if(cljs.core.truth_(target_fn__39700)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__39699)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__39700, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__39701 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__39702 = this;
  cljs.core.swap_BANG_.call(null, this__39702.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__39702.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__39702.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__39702.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__39703 = this;
  cljs.core.swap_BANG_.call(null, this__39703.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__39703.method_cache, this__39703.method_table, this__39703.cached_hierarchy, this__39703.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__39704 = this;
  cljs.core.swap_BANG_.call(null, this__39704.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__39704.method_cache, this__39704.method_table, this__39704.cached_hierarchy, this__39704.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__39705 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__39705.cached_hierarchy), cljs.core.deref.call(null, this__39705.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__39705.method_cache, this__39705.method_table, this__39705.cached_hierarchy, this__39705.hierarchy)
  }
  var temp__3971__auto____39706 = cljs.core.deref.call(null, this__39705.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____39706)) {
    var target_fn__39707 = temp__3971__auto____39706;
    return target_fn__39707
  }else {
    var temp__3971__auto____39708 = cljs.core.find_and_cache_best_method.call(null, this__39705.name, dispatch_val, this__39705.hierarchy, this__39705.method_table, this__39705.prefer_table, this__39705.method_cache, this__39705.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____39708)) {
      var target_fn__39709 = temp__3971__auto____39708;
      return target_fn__39709
    }else {
      return cljs.core.deref.call(null, this__39705.method_table).call(null, this__39705.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__39710 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__39710.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__39710.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__39710.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__39710.method_cache, this__39710.method_table, this__39710.cached_hierarchy, this__39710.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__39711 = this;
  return cljs.core.deref.call(null, this__39711.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__39712 = this;
  return cljs.core.deref.call(null, this__39712.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__39713 = this;
  return cljs.core.do_dispatch.call(null, mf, this__39713.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__39715__delegate = function(_, args) {
    var self__39714 = this;
    return cljs.core._dispatch.call(null, self__39714, args)
  };
  var G__39715 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__39715__delegate.call(this, _, args)
  };
  G__39715.cljs$lang$maxFixedArity = 1;
  G__39715.cljs$lang$applyTo = function(arglist__39716) {
    var _ = cljs.core.first(arglist__39716);
    var args = cljs.core.rest(arglist__39716);
    return G__39715__delegate(_, args)
  };
  G__39715.cljs$lang$arity$variadic = G__39715__delegate;
  return G__39715
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__39717 = this;
  return cljs.core._dispatch.call(null, self__39717, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2364__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__39718 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_39720, _) {
  var this__39719 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__39719.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__39721 = this;
  var and__3822__auto____39722 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____39722) {
    return this__39721.uuid === other.uuid
  }else {
    return and__3822__auto____39722
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__39723 = this;
  var this__39724 = this;
  return cljs.core.pr_str.call(null, this__39724)
};
cljs.core.UUID;
goog.provide("sketchpad.canvas");
goog.require("cljs.core");
sketchpad.canvas.drawLine = function drawLine(context, p__242188) {
  var map__242198__242199 = p__242188;
  var map__242198__242200 = cljs.core.seq_QMARK_.call(null, map__242198__242199) ? cljs.core.apply.call(null, cljs.core.hash_map, map__242198__242199) : map__242198__242199;
  var w__242201 = cljs.core._lookup.call(null, map__242198__242200, "\ufdd0'w", null);
  var y2__242202 = cljs.core._lookup.call(null, map__242198__242200, "\ufdd0'y2", null);
  var x2__242203 = cljs.core._lookup.call(null, map__242198__242200, "\ufdd0'x2", null);
  var y1__242204 = cljs.core._lookup.call(null, map__242198__242200, "\ufdd0'y1", null);
  var x1__242205 = cljs.core._lookup.call(null, map__242198__242200, "\ufdd0'x1", null);
  context.beginPath();
  context.lineWidth = function() {
    var or__3824__auto____242206 = w__242201;
    if(cljs.core.truth_(or__3824__auto____242206)) {
      return or__3824__auto____242206
    }else {
      return 1
    }
  }();
  context.strokeStyle = "#999";
  context.moveTo(x1__242205, y1__242204);
  context.lineTo(x2__242203, y2__242202);
  return context.stroke()
};
sketchpad.canvas.drawCircle = function drawCircle(context, p__242207) {
  var map__242219__242220 = p__242207;
  var map__242219__242221 = cljs.core.seq_QMARK_.call(null, map__242219__242220) ? cljs.core.apply.call(null, cljs.core.hash_map, map__242219__242220) : map__242219__242220;
  var strokeWidth__242222 = cljs.core._lookup.call(null, map__242219__242221, "\ufdd0'strokeWidth", null);
  var stroke__242223 = cljs.core._lookup.call(null, map__242219__242221, "\ufdd0'stroke", null);
  var fill__242224 = cljs.core._lookup.call(null, map__242219__242221, "\ufdd0'fill", null);
  var r__242225 = cljs.core._lookup.call(null, map__242219__242221, "\ufdd0'r", null);
  var y__242226 = cljs.core._lookup.call(null, map__242219__242221, "\ufdd0'y", null);
  var x__242227 = cljs.core._lookup.call(null, map__242219__242221, "\ufdd0'x", null);
  context.beginPath();
  context.arc(x__242227, y__242226, r__242225, 0, 2 * Math.PI, false);
  context.fillStyle = function() {
    var or__3824__auto____242228 = fill__242224;
    if(cljs.core.truth_(or__3824__auto____242228)) {
      return or__3824__auto____242228
    }else {
      return"transparent"
    }
  }();
  context.fill();
  context.lineWidth = function() {
    var or__3824__auto____242229 = strokeWidth__242222;
    if(cljs.core.truth_(or__3824__auto____242229)) {
      return or__3824__auto____242229
    }else {
      return 1
    }
  }();
  context.strokeStyle = stroke__242223;
  return context.stroke()
};
goog.provide("sketchpad.shapes");
goog.require("cljs.core");
goog.require("sketchpad.canvas");
goog.require("sketchpad.canvas");
sketchpad.shapes.distance = function distance(a, b) {
  return Math.sqrt.call(null, cljs.core.reduce.call(null, cljs.core._PLUS_, cljs.core.map.call(null, function(p1__59726_SHARP_) {
    return Math.pow.call(null, p1__59726_SHARP_, 2)
  }, cljs.core.map.call(null, cljs.core._, a, b))))
};
sketchpad.shapes.Selectable = {};
sketchpad.shapes.cursor_distance = function cursor_distance(item, x, y, universe) {
  if(function() {
    var and__3822__auto____59773 = item;
    if(and__3822__auto____59773) {
      return item.sketchpad$shapes$Selectable$cursor_distance$arity$4
    }else {
      return and__3822__auto____59773
    }
  }()) {
    return item.sketchpad$shapes$Selectable$cursor_distance$arity$4(item, x, y, universe)
  }else {
    var x__2418__auto____59774 = item == null ? null : item;
    return function() {
      var or__3824__auto____59775 = sketchpad.shapes.cursor_distance[goog.typeOf(x__2418__auto____59774)];
      if(or__3824__auto____59775) {
        return or__3824__auto____59775
      }else {
        var or__3824__auto____59776 = sketchpad.shapes.cursor_distance["_"];
        if(or__3824__auto____59776) {
          return or__3824__auto____59776
        }else {
          throw cljs.core.missing_protocol.call(null, "Selectable.cursor-distance", item);
        }
      }
    }().call(null, item, x, y, universe)
  }
};
sketchpad.shapes.Drawable = {};
sketchpad.shapes.draw = function draw(item, ctx, universe) {
  if(function() {
    var and__3822__auto____59781 = item;
    if(and__3822__auto____59781) {
      return item.sketchpad$shapes$Drawable$draw$arity$3
    }else {
      return and__3822__auto____59781
    }
  }()) {
    return item.sketchpad$shapes$Drawable$draw$arity$3(item, ctx, universe)
  }else {
    var x__2418__auto____59782 = item == null ? null : item;
    return function() {
      var or__3824__auto____59783 = sketchpad.shapes.draw[goog.typeOf(x__2418__auto____59782)];
      if(or__3824__auto____59783) {
        return or__3824__auto____59783
      }else {
        var or__3824__auto____59784 = sketchpad.shapes.draw["_"];
        if(or__3824__auto____59784) {
          return or__3824__auto____59784
        }else {
          throw cljs.core.missing_protocol.call(null, "Drawable.draw", item);
        }
      }
    }().call(null, item, ctx, universe)
  }
};
sketchpad.shapes.Moveable = {};
sketchpad.shapes.move_BANG_ = function move_BANG_(item, name, dx, dy, universe) {
  if(function() {
    var and__3822__auto____59789 = item;
    if(and__3822__auto____59789) {
      return item.sketchpad$shapes$Moveable$move_BANG_$arity$5
    }else {
      return and__3822__auto____59789
    }
  }()) {
    return item.sketchpad$shapes$Moveable$move_BANG_$arity$5(item, name, dx, dy, universe)
  }else {
    var x__2418__auto____59790 = item == null ? null : item;
    return function() {
      var or__3824__auto____59791 = sketchpad.shapes.move_BANG_[goog.typeOf(x__2418__auto____59790)];
      if(or__3824__auto____59791) {
        return or__3824__auto____59791
      }else {
        var or__3824__auto____59792 = sketchpad.shapes.move_BANG_["_"];
        if(or__3824__auto____59792) {
          return or__3824__auto____59792
        }else {
          throw cljs.core.missing_protocol.call(null, "Moveable.move!", item);
        }
      }
    }().call(null, item, name, dx, dy, universe)
  }
};
sketchpad.shapes.Point = function(x, y, __meta, __extmap) {
  this.x = x;
  this.y = y;
  this.__meta = __meta;
  this.__extmap = __extmap;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 619054858;
  if(arguments.length > 2) {
    this.__meta = __meta;
    this.__extmap = __extmap
  }else {
    this.__meta = null;
    this.__extmap = null
  }
};
sketchpad.shapes.Point.prototype.sketchpad$shapes$Selectable$ = true;
sketchpad.shapes.Point.prototype.sketchpad$shapes$Selectable$cursor_distance$arity$4 = function(point, cx, cy, universe) {
  var this__59796 = this;
  return sketchpad.shapes.distance.call(null, cljs.core.PersistentVector.fromArray([this__59796.x, this__59796.y], true), cljs.core.PersistentVector.fromArray([cx, cy], true))
};
sketchpad.shapes.Point.prototype.sketchpad$shapes$Moveable$ = true;
sketchpad.shapes.Point.prototype.sketchpad$shapes$Moveable$move_BANG_$arity$5 = function(point, name, dx, dy, universe) {
  var this__59797 = this;
  return cljs.core.PersistentArrayMap.fromArrays([name], [cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":this__59797.x + dx, "\ufdd0'y":this__59797.y + dy})])
};
sketchpad.shapes.Point.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2373__auto__) {
  var this__59798 = this;
  var h__2247__auto____59799 = this__59798.__hash;
  if(!(h__2247__auto____59799 == null)) {
    return h__2247__auto____59799
  }else {
    var h__2247__auto____59800 = cljs.core.hash_imap.call(null, this__2373__auto__);
    this__59798.__hash = h__2247__auto____59800;
    return h__2247__auto____59800
  }
};
sketchpad.shapes.Point.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2378__auto__, k__2379__auto__) {
  var this__59801 = this;
  return this__2378__auto__.cljs$core$ILookup$_lookup$arity$3(this__2378__auto__, k__2379__auto__, null)
};
sketchpad.shapes.Point.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2380__auto__, k59794, else__2381__auto__) {
  var this__59802 = this;
  if(k59794 === "\ufdd0'x") {
    return this__59802.x
  }else {
    if(k59794 === "\ufdd0'y") {
      return this__59802.y
    }else {
      if("\ufdd0'else") {
        return cljs.core._lookup.call(null, this__59802.__extmap, k59794, else__2381__auto__)
      }else {
        return null
      }
    }
  }
};
sketchpad.shapes.Point.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2385__auto__, k__2386__auto__, G__59793) {
  var this__59803 = this;
  var pred__59804__59807 = cljs.core.identical_QMARK_;
  var expr__59805__59808 = k__2386__auto__;
  if(pred__59804__59807.call(null, "\ufdd0'x", expr__59805__59808)) {
    return new sketchpad.shapes.Point(G__59793, this__59803.y, this__59803.__meta, this__59803.__extmap, null)
  }else {
    if(pred__59804__59807.call(null, "\ufdd0'y", expr__59805__59808)) {
      return new sketchpad.shapes.Point(this__59803.x, G__59793, this__59803.__meta, this__59803.__extmap, null)
    }else {
      return new sketchpad.shapes.Point(this__59803.x, this__59803.y, this__59803.__meta, cljs.core.assoc.call(null, this__59803.__extmap, k__2386__auto__, G__59793), null)
    }
  }
};
sketchpad.shapes.Point.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2383__auto__, entry__2384__auto__) {
  var this__59809 = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2384__auto__)) {
    return this__2383__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2383__auto__, cljs.core._nth.call(null, entry__2384__auto__, 0), cljs.core._nth.call(null, entry__2384__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2383__auto__, entry__2384__auto__)
  }
};
sketchpad.shapes.Point.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2390__auto__) {
  var this__59810 = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'x", this__59810.x), cljs.core.vector.call(null, "\ufdd0'y", this__59810.y)], true), this__59810.__extmap))
};
sketchpad.shapes.Point.prototype.sketchpad$shapes$Drawable$ = true;
sketchpad.shapes.Point.prototype.sketchpad$shapes$Drawable$draw$arity$3 = function(point, ctx, universe) {
  var this__59811 = this;
  return sketchpad.canvas.drawCircle.call(null, ctx, cljs.core.ObjMap.fromObject(["\ufdd0'stroke", "\ufdd0'fill", "\ufdd0'x", "\ufdd0'y", "\ufdd0'r"], {"\ufdd0'stroke":"#888", "\ufdd0'fill":"#999", "\ufdd0'x":this__59811.x, "\ufdd0'y":this__59811.y, "\ufdd0'r":cljs.core._EQ_.call(null, point, cljs.core._lookup.call(null, universe, (new cljs.core.Keyword("\ufdd0'selected")).call(null, universe), null)) ? 6 : cljs.core._EQ_.call(null, point, cljs.core._lookup.call(null, universe, (new cljs.core.Keyword("\ufdd0'highlighted")).call(null, 
  universe), null)) ? 4 : 2}))
};
sketchpad.shapes.Point.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(this__2392__auto__, opts__2393__auto__) {
  var this__59812 = this;
  var pr_pair__2394__auto____59813 = function(keyval__2395__auto__) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts__2393__auto__, keyval__2395__auto__)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__2394__auto____59813, [cljs.core.str("#"), cljs.core.str("Point"), cljs.core.str("{")].join(""), ", ", "}", opts__2393__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'x", this__59812.x), cljs.core.vector.call(null, "\ufdd0'y", this__59812.y)], true), this__59812.__extmap))
};
sketchpad.shapes.Point.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2382__auto__) {
  var this__59814 = this;
  return 2 + cljs.core.count.call(null, this__59814.__extmap)
};
sketchpad.shapes.Point.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2374__auto__, other__2375__auto__) {
  var this__59815 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____59816 = other__2375__auto__;
    if(cljs.core.truth_(and__3822__auto____59816)) {
      var and__3822__auto____59817 = this__2374__auto__.constructor === other__2375__auto__.constructor;
      if(and__3822__auto____59817) {
        return cljs.core.equiv_map.call(null, this__2374__auto__, other__2375__auto__)
      }else {
        return and__3822__auto____59817
      }
    }else {
      return and__3822__auto____59816
    }
  }())) {
    return true
  }else {
    return false
  }
};
sketchpad.shapes.Point.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2377__auto__, G__59793) {
  var this__59818 = this;
  return new sketchpad.shapes.Point(this__59818.x, this__59818.y, G__59793, this__59818.__extmap, this__59818.__hash)
};
sketchpad.shapes.Point.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2376__auto__) {
  var this__59819 = this;
  return this__59819.__meta
};
sketchpad.shapes.Point.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2387__auto__, k__2388__auto__) {
  var this__59820 = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'y", "\ufdd0'x"]), k__2388__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2387__auto__), this__59820.__meta), k__2388__auto__)
  }else {
    return new sketchpad.shapes.Point(this__59820.x, this__59820.y, this__59820.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, this__59820.__extmap, k__2388__auto__)), null)
  }
};
sketchpad.shapes.Point.cljs$lang$type = true;
sketchpad.shapes.Point.cljs$lang$ctorPrSeq = function(this__2412__auto__) {
  return cljs.core.list.call(null, "sketchpad.shapes/Point")
};
sketchpad.shapes.__GT_Point = function __GT_Point(x, y) {
  return new sketchpad.shapes.Point(x, y)
};
sketchpad.shapes.map__GT_Point = function map__GT_Point(G__59795) {
  return new sketchpad.shapes.Point((new cljs.core.Keyword("\ufdd0'x")).call(null, G__59795), (new cljs.core.Keyword("\ufdd0'y")).call(null, G__59795), null, cljs.core.dissoc.call(null, G__59795, "\ufdd0'x", "\ufdd0'y"))
};
sketchpad.shapes.Point;
sketchpad.shapes.Line = function(p1, p2, __meta, __extmap) {
  this.p1 = p1;
  this.p2 = p2;
  this.__meta = __meta;
  this.__extmap = __extmap;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 619054858;
  if(arguments.length > 2) {
    this.__meta = __meta;
    this.__extmap = __extmap
  }else {
    this.__meta = null;
    this.__extmap = null
  }
};
sketchpad.shapes.Line.prototype.sketchpad$shapes$Selectable$ = true;
sketchpad.shapes.Line.prototype.sketchpad$shapes$Selectable$cursor_distance$arity$4 = function(line, cx, cy, universe) {
  var this__59824 = this;
  var map__59825__59827 = universe.call(null, this__59824.p1);
  var map__59825__59828 = cljs.core.seq_QMARK_.call(null, map__59825__59827) ? cljs.core.apply.call(null, cljs.core.hash_map, map__59825__59827) : map__59825__59827;
  var x1__59829 = cljs.core._lookup.call(null, map__59825__59828, "\ufdd0'x", null);
  var y1__59830 = cljs.core._lookup.call(null, map__59825__59828, "\ufdd0'y", null);
  var map__59826__59831 = universe.call(null, this__59824.p2);
  var map__59826__59832 = cljs.core.seq_QMARK_.call(null, map__59826__59831) ? cljs.core.apply.call(null, cljs.core.hash_map, map__59826__59831) : map__59826__59831;
  var x2__59833 = cljs.core._lookup.call(null, map__59826__59832, "\ufdd0'x", null);
  var y2__59834 = cljs.core._lookup.call(null, map__59826__59832, "\ufdd0'y", null);
  var a__59835 = y1__59830 - y2__59834;
  var b__59836 = x2__59833 - x1__59829;
  var c__59837 = x1__59829 * y2__59834 - x2__59833 * y1__59830;
  var d__59838 = Math.abs.call(null, a__59835 * cx + b__59836 * cy + c__59837) / Math.sqrt.call(null, Math.pow.call(null, a__59835, 2) + Math.pow.call(null, b__59836, 2));
  return d__59838 + 5
};
sketchpad.shapes.Line.prototype.sketchpad$shapes$Moveable$ = true;
sketchpad.shapes.Line.prototype.sketchpad$shapes$Moveable$move_BANG_$arity$5 = function(line, name, dx, dy, universe) {
  var this__59839 = this;
  return cljs.core.merge.call(null, sketchpad.shapes.move_BANG_.call(null, this__59839.p1.call(null, universe), this__59839.p1, dx, dy, universe), sketchpad.shapes.move_BANG_.call(null, this__59839.p2.call(null, universe), this__59839.p2, dx, dy, universe))
};
sketchpad.shapes.Line.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2373__auto__) {
  var this__59840 = this;
  var h__2247__auto____59841 = this__59840.__hash;
  if(!(h__2247__auto____59841 == null)) {
    return h__2247__auto____59841
  }else {
    var h__2247__auto____59842 = cljs.core.hash_imap.call(null, this__2373__auto__);
    this__59840.__hash = h__2247__auto____59842;
    return h__2247__auto____59842
  }
};
sketchpad.shapes.Line.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2378__auto__, k__2379__auto__) {
  var this__59843 = this;
  return this__2378__auto__.cljs$core$ILookup$_lookup$arity$3(this__2378__auto__, k__2379__auto__, null)
};
sketchpad.shapes.Line.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2380__auto__, k59822, else__2381__auto__) {
  var this__59844 = this;
  if(k59822 === "\ufdd0'p1") {
    return this__59844.p1
  }else {
    if(k59822 === "\ufdd0'p2") {
      return this__59844.p2
    }else {
      if("\ufdd0'else") {
        return cljs.core._lookup.call(null, this__59844.__extmap, k59822, else__2381__auto__)
      }else {
        return null
      }
    }
  }
};
sketchpad.shapes.Line.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2385__auto__, k__2386__auto__, G__59821) {
  var this__59845 = this;
  var pred__59846__59849 = cljs.core.identical_QMARK_;
  var expr__59847__59850 = k__2386__auto__;
  if(pred__59846__59849.call(null, "\ufdd0'p1", expr__59847__59850)) {
    return new sketchpad.shapes.Line(G__59821, this__59845.p2, this__59845.__meta, this__59845.__extmap, null)
  }else {
    if(pred__59846__59849.call(null, "\ufdd0'p2", expr__59847__59850)) {
      return new sketchpad.shapes.Line(this__59845.p1, G__59821, this__59845.__meta, this__59845.__extmap, null)
    }else {
      return new sketchpad.shapes.Line(this__59845.p1, this__59845.p2, this__59845.__meta, cljs.core.assoc.call(null, this__59845.__extmap, k__2386__auto__, G__59821), null)
    }
  }
};
sketchpad.shapes.Line.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2383__auto__, entry__2384__auto__) {
  var this__59851 = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2384__auto__)) {
    return this__2383__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2383__auto__, cljs.core._nth.call(null, entry__2384__auto__, 0), cljs.core._nth.call(null, entry__2384__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2383__auto__, entry__2384__auto__)
  }
};
sketchpad.shapes.Line.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2390__auto__) {
  var this__59852 = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'p1", this__59852.p1), cljs.core.vector.call(null, "\ufdd0'p2", this__59852.p2)], true), this__59852.__extmap))
};
sketchpad.shapes.Line.prototype.sketchpad$shapes$Drawable$ = true;
sketchpad.shapes.Line.prototype.sketchpad$shapes$Drawable$draw$arity$3 = function(line, ctx, universe) {
  var this__59853 = this;
  var map__59854__59856 = universe.call(null, this__59853.p1);
  var map__59854__59857 = cljs.core.seq_QMARK_.call(null, map__59854__59856) ? cljs.core.apply.call(null, cljs.core.hash_map, map__59854__59856) : map__59854__59856;
  var x1__59858 = cljs.core._lookup.call(null, map__59854__59857, "\ufdd0'x", null);
  var y1__59859 = cljs.core._lookup.call(null, map__59854__59857, "\ufdd0'y", null);
  var map__59855__59860 = universe.call(null, this__59853.p2);
  var map__59855__59861 = cljs.core.seq_QMARK_.call(null, map__59855__59860) ? cljs.core.apply.call(null, cljs.core.hash_map, map__59855__59860) : map__59855__59860;
  var x2__59862 = cljs.core._lookup.call(null, map__59855__59861, "\ufdd0'x", null);
  var y2__59863 = cljs.core._lookup.call(null, map__59855__59861, "\ufdd0'y", null);
  var width__59864 = cljs.core._EQ_.call(null, line, cljs.core._lookup.call(null, universe, (new cljs.core.Keyword("\ufdd0'highlighted")).call(null, universe), null)) ? 2 : 1;
  return sketchpad.canvas.drawLine.call(null, ctx, cljs.core.ObjMap.fromObject(["\ufdd0'x1", "\ufdd0'x2", "\ufdd0'y1", "\ufdd0'y2", "\ufdd0'w"], {"\ufdd0'x1":x1__59858, "\ufdd0'x2":x2__59862, "\ufdd0'y1":y1__59859, "\ufdd0'y2":y2__59863, "\ufdd0'w":width__59864}))
};
sketchpad.shapes.Line.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(this__2392__auto__, opts__2393__auto__) {
  var this__59865 = this;
  var pr_pair__2394__auto____59866 = function(keyval__2395__auto__) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts__2393__auto__, keyval__2395__auto__)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__2394__auto____59866, [cljs.core.str("#"), cljs.core.str("Line"), cljs.core.str("{")].join(""), ", ", "}", opts__2393__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'p1", this__59865.p1), cljs.core.vector.call(null, "\ufdd0'p2", this__59865.p2)], true), this__59865.__extmap))
};
sketchpad.shapes.Line.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2382__auto__) {
  var this__59867 = this;
  return 2 + cljs.core.count.call(null, this__59867.__extmap)
};
sketchpad.shapes.Line.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2374__auto__, other__2375__auto__) {
  var this__59868 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____59869 = other__2375__auto__;
    if(cljs.core.truth_(and__3822__auto____59869)) {
      var and__3822__auto____59870 = this__2374__auto__.constructor === other__2375__auto__.constructor;
      if(and__3822__auto____59870) {
        return cljs.core.equiv_map.call(null, this__2374__auto__, other__2375__auto__)
      }else {
        return and__3822__auto____59870
      }
    }else {
      return and__3822__auto____59869
    }
  }())) {
    return true
  }else {
    return false
  }
};
sketchpad.shapes.Line.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2377__auto__, G__59821) {
  var this__59871 = this;
  return new sketchpad.shapes.Line(this__59871.p1, this__59871.p2, G__59821, this__59871.__extmap, this__59871.__hash)
};
sketchpad.shapes.Line.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2376__auto__) {
  var this__59872 = this;
  return this__59872.__meta
};
sketchpad.shapes.Line.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2387__auto__, k__2388__auto__) {
  var this__59873 = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'p1", "\ufdd0'p2"]), k__2388__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2387__auto__), this__59873.__meta), k__2388__auto__)
  }else {
    return new sketchpad.shapes.Line(this__59873.p1, this__59873.p2, this__59873.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, this__59873.__extmap, k__2388__auto__)), null)
  }
};
sketchpad.shapes.Line.cljs$lang$type = true;
sketchpad.shapes.Line.cljs$lang$ctorPrSeq = function(this__2412__auto__) {
  return cljs.core.list.call(null, "sketchpad.shapes/Line")
};
sketchpad.shapes.__GT_Line = function __GT_Line(p1, p2) {
  return new sketchpad.shapes.Line(p1, p2)
};
sketchpad.shapes.map__GT_Line = function map__GT_Line(G__59823) {
  return new sketchpad.shapes.Line((new cljs.core.Keyword("\ufdd0'p1")).call(null, G__59823), (new cljs.core.Keyword("\ufdd0'p2")).call(null, G__59823), null, cljs.core.dissoc.call(null, G__59823, "\ufdd0'p1", "\ufdd0'p2"))
};
sketchpad.shapes.Line;
sketchpad.shapes.Circle = function(center, start, end, __meta, __extmap) {
  this.center = center;
  this.start = start;
  this.end = end;
  this.__meta = __meta;
  this.__extmap = __extmap;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 619054858;
  if(arguments.length > 3) {
    this.__meta = __meta;
    this.__extmap = __extmap
  }else {
    this.__meta = null;
    this.__extmap = null
  }
};
sketchpad.shapes.Circle.prototype.sketchpad$shapes$Selectable$ = true;
sketchpad.shapes.Circle.prototype.sketchpad$shapes$Selectable$cursor_distance$arity$4 = function(circle, x, y, universe) {
  var this__59877 = this;
  var map__59878__59880 = universe.call(null, this__59877.center);
  var map__59878__59881 = cljs.core.seq_QMARK_.call(null, map__59878__59880) ? cljs.core.apply.call(null, cljs.core.hash_map, map__59878__59880) : map__59878__59880;
  var cx__59882 = cljs.core._lookup.call(null, map__59878__59881, "\ufdd0'x", null);
  var cy__59883 = cljs.core._lookup.call(null, map__59878__59881, "\ufdd0'y", null);
  var map__59879__59884 = universe.call(null, this__59877.start);
  var map__59879__59885 = cljs.core.seq_QMARK_.call(null, map__59879__59884) ? cljs.core.apply.call(null, cljs.core.hash_map, map__59879__59884) : map__59879__59884;
  var sx__59886 = cljs.core._lookup.call(null, map__59879__59885, "\ufdd0'x", null);
  var sy__59887 = cljs.core._lookup.call(null, map__59879__59885, "\ufdd0'y", null);
  var r__59888 = sketchpad.shapes.distance.call(null, cljs.core.PersistentVector.fromArray([cx__59882, cy__59883], true), cljs.core.PersistentVector.fromArray([sx__59886, sy__59887], true));
  var d__59889 = sketchpad.shapes.distance.call(null, cljs.core.PersistentVector.fromArray([cx__59882, cy__59883], true), cljs.core.PersistentVector.fromArray([x, y], true));
  return 5 + Math.abs.call(null, d__59889 - r__59888)
};
sketchpad.shapes.Circle.prototype.sketchpad$shapes$Moveable$ = true;
sketchpad.shapes.Circle.prototype.sketchpad$shapes$Moveable$move_BANG_$arity$5 = function(circle, name, dx, dy, universe) {
  var this__59890 = this;
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(name) {
    var map__59891__59892 = universe.call(null, name);
    var map__59891__59893 = cljs.core.seq_QMARK_.call(null, map__59891__59892) ? cljs.core.apply.call(null, cljs.core.hash_map, map__59891__59892) : map__59891__59892;
    var x__59894 = cljs.core._lookup.call(null, map__59891__59893, "\ufdd0'x", null);
    var y__59895 = cljs.core._lookup.call(null, map__59891__59893, "\ufdd0'y", null);
    return cljs.core.PersistentVector.fromArray([name, cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":x__59894 + dx, "\ufdd0'y":y__59895 + dy})], true)
  }, cljs.core.PersistentVector.fromArray([this__59890.center, this__59890.start, this__59890.end], true)))
};
sketchpad.shapes.Circle.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2373__auto__) {
  var this__59896 = this;
  var h__2247__auto____59897 = this__59896.__hash;
  if(!(h__2247__auto____59897 == null)) {
    return h__2247__auto____59897
  }else {
    var h__2247__auto____59898 = cljs.core.hash_imap.call(null, this__2373__auto__);
    this__59896.__hash = h__2247__auto____59898;
    return h__2247__auto____59898
  }
};
sketchpad.shapes.Circle.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2378__auto__, k__2379__auto__) {
  var this__59899 = this;
  return this__2378__auto__.cljs$core$ILookup$_lookup$arity$3(this__2378__auto__, k__2379__auto__, null)
};
sketchpad.shapes.Circle.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2380__auto__, k59875, else__2381__auto__) {
  var this__59900 = this;
  if(k59875 === "\ufdd0'center") {
    return this__59900.center
  }else {
    if(k59875 === "\ufdd0'start") {
      return this__59900.start
    }else {
      if(k59875 === "\ufdd0'end") {
        return this__59900.end
      }else {
        if("\ufdd0'else") {
          return cljs.core._lookup.call(null, this__59900.__extmap, k59875, else__2381__auto__)
        }else {
          return null
        }
      }
    }
  }
};
sketchpad.shapes.Circle.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2385__auto__, k__2386__auto__, G__59874) {
  var this__59901 = this;
  var pred__59902__59905 = cljs.core.identical_QMARK_;
  var expr__59903__59906 = k__2386__auto__;
  if(pred__59902__59905.call(null, "\ufdd0'center", expr__59903__59906)) {
    return new sketchpad.shapes.Circle(G__59874, this__59901.start, this__59901.end, this__59901.__meta, this__59901.__extmap, null)
  }else {
    if(pred__59902__59905.call(null, "\ufdd0'start", expr__59903__59906)) {
      return new sketchpad.shapes.Circle(this__59901.center, G__59874, this__59901.end, this__59901.__meta, this__59901.__extmap, null)
    }else {
      if(pred__59902__59905.call(null, "\ufdd0'end", expr__59903__59906)) {
        return new sketchpad.shapes.Circle(this__59901.center, this__59901.start, G__59874, this__59901.__meta, this__59901.__extmap, null)
      }else {
        return new sketchpad.shapes.Circle(this__59901.center, this__59901.start, this__59901.end, this__59901.__meta, cljs.core.assoc.call(null, this__59901.__extmap, k__2386__auto__, G__59874), null)
      }
    }
  }
};
sketchpad.shapes.Circle.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2383__auto__, entry__2384__auto__) {
  var this__59907 = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2384__auto__)) {
    return this__2383__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2383__auto__, cljs.core._nth.call(null, entry__2384__auto__, 0), cljs.core._nth.call(null, entry__2384__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2383__auto__, entry__2384__auto__)
  }
};
sketchpad.shapes.Circle.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2390__auto__) {
  var this__59908 = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'center", this__59908.center), cljs.core.vector.call(null, "\ufdd0'start", this__59908.start), cljs.core.vector.call(null, "\ufdd0'end", this__59908.end)], true), this__59908.__extmap))
};
sketchpad.shapes.Circle.prototype.sketchpad$shapes$Drawable$ = true;
sketchpad.shapes.Circle.prototype.sketchpad$shapes$Drawable$draw$arity$3 = function(circle, ctx, universe) {
  var this__59909 = this;
  var map__59910__59912 = universe.call(null, this__59909.center);
  var map__59910__59913 = cljs.core.seq_QMARK_.call(null, map__59910__59912) ? cljs.core.apply.call(null, cljs.core.hash_map, map__59910__59912) : map__59910__59912;
  var cx__59914 = cljs.core._lookup.call(null, map__59910__59913, "\ufdd0'x", null);
  var cy__59915 = cljs.core._lookup.call(null, map__59910__59913, "\ufdd0'y", null);
  var map__59911__59916 = universe.call(null, this__59909.start);
  var map__59911__59917 = cljs.core.seq_QMARK_.call(null, map__59911__59916) ? cljs.core.apply.call(null, cljs.core.hash_map, map__59911__59916) : map__59911__59916;
  var sx__59918 = cljs.core._lookup.call(null, map__59911__59917, "\ufdd0'x", null);
  var sy__59919 = cljs.core._lookup.call(null, map__59911__59917, "\ufdd0'y", null);
  var r__59920 = sketchpad.shapes.distance.call(null, cljs.core.PersistentVector.fromArray([cx__59914, cy__59915], true), cljs.core.PersistentVector.fromArray([sx__59918, sy__59919], true));
  var selected__59921 = cljs.core._EQ_.call(null, circle, universe.call(null, universe.call(null, "\ufdd0'highlighted")));
  return sketchpad.canvas.drawCircle.call(null, ctx, cljs.core.ObjMap.fromObject(["\ufdd0'fill", "\ufdd0'stroke", "\ufdd0'strokeWidth", "\ufdd0'x", "\ufdd0'y", "\ufdd0'r"], {"\ufdd0'fill":"transparent", "\ufdd0'stroke":"#999", "\ufdd0'strokeWidth":selected__59921 ? 3 : 1, "\ufdd0'x":cx__59914, "\ufdd0'y":cy__59915, "\ufdd0'r":r__59920}))
};
sketchpad.shapes.Circle.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(this__2392__auto__, opts__2393__auto__) {
  var this__59922 = this;
  var pr_pair__2394__auto____59923 = function(keyval__2395__auto__) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts__2393__auto__, keyval__2395__auto__)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__2394__auto____59923, [cljs.core.str("#"), cljs.core.str("Circle"), cljs.core.str("{")].join(""), ", ", "}", opts__2393__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'center", this__59922.center), cljs.core.vector.call(null, "\ufdd0'start", this__59922.start), cljs.core.vector.call(null, "\ufdd0'end", this__59922.end)], true), this__59922.__extmap))
};
sketchpad.shapes.Circle.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2382__auto__) {
  var this__59924 = this;
  return 3 + cljs.core.count.call(null, this__59924.__extmap)
};
sketchpad.shapes.Circle.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2374__auto__, other__2375__auto__) {
  var this__59925 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____59926 = other__2375__auto__;
    if(cljs.core.truth_(and__3822__auto____59926)) {
      var and__3822__auto____59927 = this__2374__auto__.constructor === other__2375__auto__.constructor;
      if(and__3822__auto____59927) {
        return cljs.core.equiv_map.call(null, this__2374__auto__, other__2375__auto__)
      }else {
        return and__3822__auto____59927
      }
    }else {
      return and__3822__auto____59926
    }
  }())) {
    return true
  }else {
    return false
  }
};
sketchpad.shapes.Circle.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2377__auto__, G__59874) {
  var this__59928 = this;
  return new sketchpad.shapes.Circle(this__59928.center, this__59928.start, this__59928.end, G__59874, this__59928.__extmap, this__59928.__hash)
};
sketchpad.shapes.Circle.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2376__auto__) {
  var this__59929 = this;
  return this__59929.__meta
};
sketchpad.shapes.Circle.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2387__auto__, k__2388__auto__) {
  var this__59930 = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'start", "\ufdd0'end", "\ufdd0'center"]), k__2388__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2387__auto__), this__59930.__meta), k__2388__auto__)
  }else {
    return new sketchpad.shapes.Circle(this__59930.center, this__59930.start, this__59930.end, this__59930.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, this__59930.__extmap, k__2388__auto__)), null)
  }
};
sketchpad.shapes.Circle.cljs$lang$type = true;
sketchpad.shapes.Circle.cljs$lang$ctorPrSeq = function(this__2412__auto__) {
  return cljs.core.list.call(null, "sketchpad.shapes/Circle")
};
sketchpad.shapes.__GT_Circle = function __GT_Circle(center, start, end) {
  return new sketchpad.shapes.Circle(center, start, end)
};
sketchpad.shapes.map__GT_Circle = function map__GT_Circle(G__59876) {
  return new sketchpad.shapes.Circle((new cljs.core.Keyword("\ufdd0'center")).call(null, G__59876), (new cljs.core.Keyword("\ufdd0'start")).call(null, G__59876), (new cljs.core.Keyword("\ufdd0'end")).call(null, G__59876), null, cljs.core.dissoc.call(null, G__59876, "\ufdd0'center", "\ufdd0'start", "\ufdd0'end"))
};
sketchpad.shapes.Circle;
goog.provide("clojure.set");
goog.require("cljs.core");
clojure.set.bubble_max_key = function bubble_max_key(k, coll) {
  var max__6573 = cljs.core.apply.call(null, cljs.core.max_key, k, coll);
  return cljs.core.cons.call(null, max__6573, cljs.core.remove.call(null, function(p1__6571_SHARP_) {
    return max__6573 === p1__6571_SHARP_
  }, coll))
};
clojure.set.union = function() {
  var union = null;
  var union__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var union__1 = function(s1) {
    return s1
  };
  var union__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, cljs.core.conj, s2, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.conj, s1, s2)
    }
  };
  var union__3 = function() {
    var G__6577__delegate = function(s1, s2, sets) {
      var bubbled_sets__6576 = clojure.set.bubble_max_key.call(null, cljs.core.count, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, cljs.core.into, cljs.core.first.call(null, bubbled_sets__6576), cljs.core.rest.call(null, bubbled_sets__6576))
    };
    var G__6577 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6577__delegate.call(this, s1, s2, sets)
    };
    G__6577.cljs$lang$maxFixedArity = 2;
    G__6577.cljs$lang$applyTo = function(arglist__6578) {
      var s1 = cljs.core.first(arglist__6578);
      var s2 = cljs.core.first(cljs.core.next(arglist__6578));
      var sets = cljs.core.rest(cljs.core.next(arglist__6578));
      return G__6577__delegate(s1, s2, sets)
    };
    G__6577.cljs$lang$arity$variadic = G__6577__delegate;
    return G__6577
  }();
  union = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 0:
        return union__0.call(this);
      case 1:
        return union__1.call(this, s1);
      case 2:
        return union__2.call(this, s1, s2);
      default:
        return union__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  union.cljs$lang$maxFixedArity = 2;
  union.cljs$lang$applyTo = union__3.cljs$lang$applyTo;
  union.cljs$lang$arity$0 = union__0;
  union.cljs$lang$arity$1 = union__1;
  union.cljs$lang$arity$2 = union__2;
  union.cljs$lang$arity$variadic = union__3.cljs$lang$arity$variadic;
  return union
}();
clojure.set.intersection = function() {
  var intersection = null;
  var intersection__1 = function(s1) {
    return s1
  };
  var intersection__2 = function(s1, s2) {
    while(true) {
      if(cljs.core.count.call(null, s2) < cljs.core.count.call(null, s1)) {
        var G__6581 = s2;
        var G__6582 = s1;
        s1 = G__6581;
        s2 = G__6582;
        continue
      }else {
        return cljs.core.reduce.call(null, function(s1, s2) {
          return function(result, item) {
            if(cljs.core.contains_QMARK_.call(null, s2, item)) {
              return result
            }else {
              return cljs.core.disj.call(null, result, item)
            }
          }
        }(s1, s2), s1, s1)
      }
      break
    }
  };
  var intersection__3 = function() {
    var G__6583__delegate = function(s1, s2, sets) {
      var bubbled_sets__6580 = clojure.set.bubble_max_key.call(null, function(p1__6574_SHARP_) {
        return-cljs.core.count.call(null, p1__6574_SHARP_)
      }, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, intersection, cljs.core.first.call(null, bubbled_sets__6580), cljs.core.rest.call(null, bubbled_sets__6580))
    };
    var G__6583 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6583__delegate.call(this, s1, s2, sets)
    };
    G__6583.cljs$lang$maxFixedArity = 2;
    G__6583.cljs$lang$applyTo = function(arglist__6584) {
      var s1 = cljs.core.first(arglist__6584);
      var s2 = cljs.core.first(cljs.core.next(arglist__6584));
      var sets = cljs.core.rest(cljs.core.next(arglist__6584));
      return G__6583__delegate(s1, s2, sets)
    };
    G__6583.cljs$lang$arity$variadic = G__6583__delegate;
    return G__6583
  }();
  intersection = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return intersection__1.call(this, s1);
      case 2:
        return intersection__2.call(this, s1, s2);
      default:
        return intersection__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  intersection.cljs$lang$maxFixedArity = 2;
  intersection.cljs$lang$applyTo = intersection__3.cljs$lang$applyTo;
  intersection.cljs$lang$arity$1 = intersection__1;
  intersection.cljs$lang$arity$2 = intersection__2;
  intersection.cljs$lang$arity$variadic = intersection__3.cljs$lang$arity$variadic;
  return intersection
}();
clojure.set.difference = function() {
  var difference = null;
  var difference__1 = function(s1) {
    return s1
  };
  var difference__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, function(result, item) {
        if(cljs.core.contains_QMARK_.call(null, s2, item)) {
          return cljs.core.disj.call(null, result, item)
        }else {
          return result
        }
      }, s1, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.disj, s1, s2)
    }
  };
  var difference__3 = function() {
    var G__6585__delegate = function(s1, s2, sets) {
      return cljs.core.reduce.call(null, difference, s1, cljs.core.conj.call(null, sets, s2))
    };
    var G__6585 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6585__delegate.call(this, s1, s2, sets)
    };
    G__6585.cljs$lang$maxFixedArity = 2;
    G__6585.cljs$lang$applyTo = function(arglist__6586) {
      var s1 = cljs.core.first(arglist__6586);
      var s2 = cljs.core.first(cljs.core.next(arglist__6586));
      var sets = cljs.core.rest(cljs.core.next(arglist__6586));
      return G__6585__delegate(s1, s2, sets)
    };
    G__6585.cljs$lang$arity$variadic = G__6585__delegate;
    return G__6585
  }();
  difference = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return difference__1.call(this, s1);
      case 2:
        return difference__2.call(this, s1, s2);
      default:
        return difference__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  difference.cljs$lang$maxFixedArity = 2;
  difference.cljs$lang$applyTo = difference__3.cljs$lang$applyTo;
  difference.cljs$lang$arity$1 = difference__1;
  difference.cljs$lang$arity$2 = difference__2;
  difference.cljs$lang$arity$variadic = difference__3.cljs$lang$arity$variadic;
  return difference
}();
clojure.set.select = function select(pred, xset) {
  return cljs.core.reduce.call(null, function(s, k) {
    if(cljs.core.truth_(pred.call(null, k))) {
      return s
    }else {
      return cljs.core.disj.call(null, s, k)
    }
  }, xset, xset)
};
clojure.set.project = function project(xrel, ks) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__6587_SHARP_) {
    return cljs.core.select_keys.call(null, p1__6587_SHARP_, ks)
  }, xrel))
};
clojure.set.rename_keys = function rename_keys(map, kmap) {
  return cljs.core.reduce.call(null, function(m, p__6595) {
    var vec__6596__6597 = p__6595;
    var old__6598 = cljs.core.nth.call(null, vec__6596__6597, 0, null);
    var new__6599 = cljs.core.nth.call(null, vec__6596__6597, 1, null);
    if(function() {
      var and__3822__auto____6600 = cljs.core.not_EQ_.call(null, old__6598, new__6599);
      if(and__3822__auto____6600) {
        return cljs.core.contains_QMARK_.call(null, m, old__6598)
      }else {
        return and__3822__auto____6600
      }
    }()) {
      return cljs.core.dissoc.call(null, cljs.core.assoc.call(null, m, new__6599, cljs.core._lookup.call(null, m, old__6598, null)), old__6598)
    }else {
      return m
    }
  }, map, kmap)
};
clojure.set.rename = function rename(xrel, kmap) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__6588_SHARP_) {
    return clojure.set.rename_keys.call(null, p1__6588_SHARP_, kmap)
  }, xrel))
};
clojure.set.index = function index(xrel, ks) {
  return cljs.core.reduce.call(null, function(m, x) {
    var ik__6602 = cljs.core.select_keys.call(null, x, ks);
    return cljs.core.assoc.call(null, m, ik__6602, cljs.core.conj.call(null, cljs.core._lookup.call(null, m, ik__6602, cljs.core.PersistentHashSet.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, xrel)
};
clojure.set.map_invert = function map_invert(m) {
  return cljs.core.reduce.call(null, function(m, p__6612) {
    var vec__6613__6614 = p__6612;
    var k__6615 = cljs.core.nth.call(null, vec__6613__6614, 0, null);
    var v__6616 = cljs.core.nth.call(null, vec__6613__6614, 1, null);
    return cljs.core.assoc.call(null, m, v__6616, k__6615)
  }, cljs.core.ObjMap.EMPTY, m)
};
clojure.set.join = function() {
  var join = null;
  var join__2 = function(xrel, yrel) {
    if(function() {
      var and__3822__auto____6633 = cljs.core.seq.call(null, xrel);
      if(and__3822__auto____6633) {
        return cljs.core.seq.call(null, yrel)
      }else {
        return and__3822__auto____6633
      }
    }()) {
      var ks__6635 = clojure.set.intersection.call(null, cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, xrel))), cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, yrel))));
      var vec__6634__6636 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel], true) : cljs.core.PersistentVector.fromArray([yrel, xrel], true);
      var r__6637 = cljs.core.nth.call(null, vec__6634__6636, 0, null);
      var s__6638 = cljs.core.nth.call(null, vec__6634__6636, 1, null);
      var idx__6639 = clojure.set.index.call(null, r__6637, ks__6635);
      return cljs.core.reduce.call(null, function(ret, x) {
        var found__6640 = idx__6639.call(null, cljs.core.select_keys.call(null, x, ks__6635));
        if(cljs.core.truth_(found__6640)) {
          return cljs.core.reduce.call(null, function(p1__6603_SHARP_, p2__6604_SHARP_) {
            return cljs.core.conj.call(null, p1__6603_SHARP_, cljs.core.merge.call(null, p2__6604_SHARP_, x))
          }, ret, found__6640)
        }else {
          return ret
        }
      }, cljs.core.PersistentHashSet.EMPTY, s__6638)
    }else {
      return cljs.core.PersistentHashSet.EMPTY
    }
  };
  var join__3 = function(xrel, yrel, km) {
    var vec__6641__6642 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel, clojure.set.map_invert.call(null, km)], true) : cljs.core.PersistentVector.fromArray([yrel, xrel, km], true);
    var r__6643 = cljs.core.nth.call(null, vec__6641__6642, 0, null);
    var s__6644 = cljs.core.nth.call(null, vec__6641__6642, 1, null);
    var k__6645 = cljs.core.nth.call(null, vec__6641__6642, 2, null);
    var idx__6646 = clojure.set.index.call(null, r__6643, cljs.core.vals.call(null, k__6645));
    return cljs.core.reduce.call(null, function(ret, x) {
      var found__6647 = idx__6646.call(null, clojure.set.rename_keys.call(null, cljs.core.select_keys.call(null, x, cljs.core.keys.call(null, k__6645)), k__6645));
      if(cljs.core.truth_(found__6647)) {
        return cljs.core.reduce.call(null, function(p1__6605_SHARP_, p2__6606_SHARP_) {
          return cljs.core.conj.call(null, p1__6605_SHARP_, cljs.core.merge.call(null, p2__6606_SHARP_, x))
        }, ret, found__6647)
      }else {
        return ret
      }
    }, cljs.core.PersistentHashSet.EMPTY, s__6644)
  };
  join = function(xrel, yrel, km) {
    switch(arguments.length) {
      case 2:
        return join__2.call(this, xrel, yrel);
      case 3:
        return join__3.call(this, xrel, yrel, km)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$2 = join__2;
  join.cljs$lang$arity$3 = join__3;
  return join
}();
clojure.set.subset_QMARK_ = function subset_QMARK_(set1, set2) {
  var and__3822__auto____6650 = cljs.core.count.call(null, set1) <= cljs.core.count.call(null, set2);
  if(and__3822__auto____6650) {
    return cljs.core.every_QMARK_.call(null, function(p1__6617_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set2, p1__6617_SHARP_)
    }, set1)
  }else {
    return and__3822__auto____6650
  }
};
clojure.set.superset_QMARK_ = function superset_QMARK_(set1, set2) {
  var and__3822__auto____6652 = cljs.core.count.call(null, set1) >= cljs.core.count.call(null, set2);
  if(and__3822__auto____6652) {
    return cljs.core.every_QMARK_.call(null, function(p1__6648_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set1, p1__6648_SHARP_)
    }, set2)
  }else {
    return and__3822__auto____6652
  }
};
goog.provide("sketchpad.state_patches");
goog.require("cljs.core");
goog.require("clojure.set");
goog.require("clojure.set");
sketchpad.state_patches.patch = function patch(state, diff) {
  if(cljs.core.truth_(diff)) {
    return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
      var iter__2517__auto____186791 = function iter__186777(s__186778) {
        return new cljs.core.LazySeq(null, false, function() {
          var s__186778__186785 = s__186778;
          while(true) {
            if(cljs.core.seq.call(null, s__186778__186785)) {
              var key__186786 = cljs.core.first.call(null, s__186778__186785);
              return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([key__186786, function() {
                var val1__186787 = key__186786.call(null, state);
                var val2__186788 = key__186786.call(null, diff);
                if(cljs.core.truth_(function() {
                  var and__3822__auto____186789 = val1__186787;
                  if(cljs.core.truth_(and__3822__auto____186789)) {
                    return val2__186788
                  }else {
                    return and__3822__auto____186789
                  }
                }())) {
                  return cljs.core.merge.call(null, val1__186787, val2__186788)
                }else {
                  var or__3824__auto____186790 = val2__186788;
                  if(cljs.core.truth_(or__3824__auto____186790)) {
                    return or__3824__auto____186790
                  }else {
                    return val1__186787
                  }
                }
              }()], true), iter__186777.call(null, cljs.core.rest.call(null, s__186778__186785)))
            }else {
              return null
            }
            break
          }
        }, null)
      };
      return iter__2517__auto____186791.call(null, clojure.set.union.call(null, cljs.core.set.call(null, cljs.core.keys.call(null, state)), cljs.core.set.call(null, cljs.core.keys.call(null, diff))))
    }())
  }else {
    return state
  }
};
goog.provide("Cl");
goog.scope(function() {
  Cl = function() {
  };
  Cl.version = "0.0.1";
  Cl.approx = function(a, b) {
    var epsilon;
    if(a.value != null) {
      a = a.value()
    }
    if(b.value != null) {
      b = b.value()
    }
    epsilon = 1.0E-8;
    if(a === 0) {
      return Math.abs(b) < epsilon
    }else {
      if(b === 0) {
        return Math.abs(a) < epsilon
      }else {
        return Math.abs(a - b) < Math.abs(a) * epsilon
      }
    }
  };
  goog.exportSymbol("Cl", Cl)
});
goog.provide("Cl.AbstractVariable");
goog.provide("Cl.DummyVariable");
goog.provide("Cl.ObjectiveVariable");
goog.provide("Cl.SlackVariable");
goog.provide("Cl.Variable");
goog.require("Cl");
goog.scope(function() {
  Cl.AbstractVariable = function(a1, a2) {
    var prefix, varnumber;
    this.hash_code = Cl.AbstractVariable.iVariableNumber++;
    if(typeof a1 === "string" || !(a1 != null)) {
      this._name = a1 || "v" + this.hash_code
    }else {
      varnumber = a1;
      prefix = a2;
      this._name = prefix + varnumber
    }
  };
  Cl.AbstractVariable.prototype.hashCode = function() {
    return this.hash_code
  };
  Cl.AbstractVariable.prototype.name = function() {
    return this._name
  };
  Cl.AbstractVariable.prototype.setName = function(_name) {
    this._name = _name
  };
  Cl.AbstractVariable.prototype.isDummy = function() {
    return false
  };
  Cl.AbstractVariable.prototype.isExternal = function() {
    throw"abstract isExternal";
  };
  Cl.AbstractVariable.prototype.isPivotable = function() {
    throw"abstract isPivotable";
  };
  Cl.AbstractVariable.prototype.isRestricted = function() {
    throw"abstract isRestricted";
  };
  Cl.AbstractVariable.prototype.toString = function() {
    return"ABSTRACT[" + this._name + "]"
  };
  Cl.AbstractVariable.iVariableNumber = 1;
  Cl.Variable = function(name_or_val, value) {
    this._name = "";
    this._value = 0;
    if(typeof name_or_val === "string") {
      Cl.AbstractVariable.call(this, name_or_val);
      this._value = value || 0
    }else {
      if(typeof name_or_val === "number") {
        Cl.AbstractVariable.call(this);
        this._value = name_or_val
      }else {
        Cl.AbstractVariable.call(this)
      }
    }
    if(Cl.Variable._ourVarMap) {
      Cl.Variable._ourVarMap[this._name] = this
    }
  };
  goog.inherits(Cl.Variable, Cl.AbstractVariable);
  Cl.Variable.prototype.isDummy = function() {
    return false
  };
  Cl.Variable.prototype.isExternal = function() {
    return true
  };
  Cl.Variable.prototype.isPivotable = function() {
    return false
  };
  Cl.Variable.prototype.isRestricted = function() {
    return false
  };
  Cl.Variable.prototype.toString = function() {
    return"[" + this.name() + ":" + this._value + "]"
  };
  Cl.Variable.prototype.value = function() {
    return this._value
  };
  Cl.Variable.prototype.set_value = function(_value) {
    this._value = _value
  };
  Cl.Variable.prototype.change_value = function(_value) {
    this._value = _value
  };
  Cl.Variable.prototype.setAttachedObject = function(_attachedObject) {
    this._attachedObject = _attachedObject
  };
  Cl.Variable.prototype.getAttachedObject = function() {
    return this._attachedObject
  };
  Cl.DummyVariable = function(name_or_val, prefix) {
    Cl.AbstractVariable.call(this, name_or_val, prefix)
  };
  goog.inherits(Cl.DummyVariable, Cl.AbstractVariable);
  Cl.DummyVariable.prototype.isDummy = function() {
    return true
  };
  Cl.DummyVariable.prototype.isExternal = function() {
    return false
  };
  Cl.DummyVariable.prototype.isPivotable = function() {
    return false
  };
  Cl.DummyVariable.prototype.isRestricted = function() {
    return true
  };
  Cl.DummyVariable.prototype.toString = function() {
    return"[" + this.name() + ":dummy]"
  };
  Cl.ObjectiveVariable = function(name_or_val, prefix) {
    Cl.AbstractVariable.call(this, name_or_val, prefix)
  };
  goog.inherits(Cl.ObjectiveVariable, Cl.AbstractVariable);
  Cl.ObjectiveVariable.prototype.isExternal = function() {
    return false
  };
  Cl.ObjectiveVariable.prototype.isPivotable = function() {
    return false
  };
  Cl.ObjectiveVariable.prototype.isRestricted = function() {
    return false
  };
  Cl.ObjectiveVariable.prototype.toString = function() {
    return"[" + this.name() + ":obj]"
  };
  Cl.SlackVariable = function(name_or_val, prefix) {
    Cl.AbstractVariable.call(this, name_or_val, prefix)
  };
  goog.inherits(Cl.SlackVariable, Cl.AbstractVariable);
  Cl.SlackVariable.prototype.isExternal = function() {
    return false
  };
  Cl.SlackVariable.prototype.isPivotable = function() {
    return true
  };
  Cl.SlackVariable.prototype.isRestricted = function() {
    return true
  };
  Cl.SlackVariable.prototype.toString = function() {
    return"[" + this.name() + ":slack]"
  }
});
goog.provide("Cl.HashTable");
goog.require("Cl");
goog.scope(function() {
  Cl.HashTable = function() {
    this._size = 0;
    this._store = {};
    this._keyStrMap = {};
    this._keyList = []
  };
  Cl.HashTable.prototype.put = function(key, value) {
    var hash, old;
    hash = this._keyCode(key);
    old = this._store.hasOwnProperty(hash) ? this._store[hash] : this._size++;
    this._store[hash] = value;
    this._keyStrMap[hash] = key;
    if(this._keyList.indexOf(hash) === -1) {
      this._keyList.push(hash)
    }
    return old
  };
  Cl.HashTable.prototype.get = function(key) {
    if(!(this._size > 0)) {
      return null
    }
    key = this._keyCode(key);
    if(this._store.hasOwnProperty(key)) {
      return this._store[key]
    }
    return null
  };
  Cl.HashTable.prototype.clear = function() {
    this._size = 0;
    this._store = {};
    this._keyStrMap = {};
    return this._keyList = []
  };
  Cl.HashTable.prototype.remove = function(key) {
    var old;
    key = this._keyCode(key);
    if(!this._store.hasOwnProperty(key)) {
      return null
    }
    old = this._store[key];
    delete this._store[key];
    if(this._size > 0) {
      this._size--
    }
    return old
  };
  Cl.HashTable.prototype.size = function() {
    return this._size
  };
  Cl.HashTable.prototype.keys = function() {
    return this._keyList.map(goog.bind(function(x) {
      return this._keyStrMap[x]
    }, this))
  };
  Cl.HashTable.prototype.each = function(callback, scope) {
    if(!this._size) {
      return
    }
    return this._keyList.forEach(function(k) {
      if(this._store.hasOwnProperty(k)) {
        return callback.call(scope || null, this._keyStrMap[k], this._store[k])
      }
    }, this)
  };
  Cl.HashTable.prototype._escapingEachCallback = function(callback, scope, key, value) {
    var hash;
    hash = this._keyCode(key);
    if(this._store.hasOwnProperty(hash)) {
      return callback.call(scope || null, hash, value)
    }
  };
  Cl.HashTable.prototype.escapingEach = function(callback, scope) {
    var context, kl, x, _results;
    if(!(this._size > 0)) {
      return
    }
    context = {};
    kl = this._keyList.slice();
    x = 0;
    _results = [];
    while(x < kl.length) {
      goog.bind(function(v) {
        if(this._store.hasOwnProperty(v)) {
          return context = callback.call(scope || null, this._keyStrMap[v], this._store[v])
        }
      }, this)(kl[x]);
      if(context) {
        if(context.retval !== undefined) {
          return context
        }
        if(context.brk) {
          break
        }
      }
      _results.push(x++)
    }
    return _results
  };
  Cl.HashTable.prototype.clone = function() {
    var n;
    n = new Cl.HashTable;
    if(this._size > 0) {
      n._size = this._size;
      n._keyList = this._keyList.slice();
      this._copyOwn(this._store, n._store);
      this._copyOwn(this._keyStrMap, n._keyStrMap)
    }
    return n
  };
  Cl.HashTable.prototype._keyCode = function(key) {
    if(typeof key.hashCode === "function") {
      return key.hashCode()
    }else {
      return key.toString()
    }
  };
  Cl.HashTable.prototype._copyOwn = function(src, dest) {
    var x, _results;
    _results = [];
    for(x in src) {
      _results.push(src.hasOwnProperty(x) ? dest[x] = src[x] : void 0)
    }
    return _results
  }
});
goog.provide("Cl.LinearExpression");
goog.require("Cl");
goog.require("Cl.AbstractVariable");
goog.require("Cl.HashTable");
goog.scope(function() {
  var AbstractVariable = Cl.AbstractVariable;
  var HashTable = Cl.HashTable;
  Cl.LinearExpression = function(clv, value, constant) {
    this._constant = constant || 0;
    this._terms = new HashTable;
    if(clv instanceof AbstractVariable) {
      this._terms.put(clv, value || 1)
    }else {
      if(typeof clv === "number") {
        this._constant = clv
      }
    }
  };
  Cl.LinearExpression.prototype.initializeFromHash = function(_constant, terms) {
    this._constant = _constant;
    this._terms = terms.clone();
    return this
  };
  Cl.LinearExpression.prototype.clone = function() {
    return(new Cl.LinearExpression).initializeFromHash(this._constant, this._terms)
  };
  Cl.LinearExpression.prototype.multiplyMe = function(x) {
    this._constant *= x;
    this._terms.each(goog.bind(function(clv, coeff) {
      return this._terms.put(clv, coeff * x)
    }, this));
    return this
  };
  Cl.LinearExpression.prototype.times = function(x) {
    var expr;
    if(typeof x === "number") {
      return this.clone().multiplyMe(x)
    }else {
      expr = x;
      if(this.isConstant()) {
        return expr.times(this._constant)
      }else {
        if(expr.isConstant()) {
          return this.times(expr._constant)
        }else {
          throw new Cl.errors.NonlinearExpression;
        }
      }
    }
  };
  Cl.LinearExpression.prototype.plus = function(expr) {
    if(expr instanceof Cl.LinearExpression) {
      return this.clone().addExpression(expr, 1)
    }else {
      if(expr instanceof Cl.Variable) {
        return this.clone().addVariable(expr, 1)
      }
    }
  };
  Cl.LinearExpression.prototype.minus = function(expr) {
    if(expr instanceof Cl.LinearExpression) {
      return this.clone().addExpression(expr, -1)
    }else {
      if(expr instanceof Cl.Variable) {
        return this.clone().addVariable(expr, -1)
      }
    }
  };
  Cl.LinearExpression.prototype.divide = function(x) {
    if(typeof x === "number") {
      if(Cl.approx(x, 0)) {
        throw new Cl.errors.NonlinearExpression;
      }
      return this.times(1 / x)
    }else {
      if(x instanceof Cl.LinearExpression) {
        if(!x.isConstant()) {
          throw new Cl.errors.NonlinearExpression;
        }
        return this.times(1 / x._constant)
      }
    }
  };
  Cl.LinearExpression.prototype.divFrom = function(expr) {
    if(!this.isConstant() || Cl.approx(this._constant, 0)) {
      throw new Cl.errors.NonlinearExpression;
    }
    return expr.divide(this._constant)
  };
  Cl.LinearExpression.prototype.subtractFrom = function(expr) {
    return expr.minus(this)
  };
  Cl.LinearExpression.prototype.addExpression = function(expr, n, subject, solver) {
    if(expr instanceof AbstractVariable) {
      expr = new Cl.LinearExpression(expr)
    }
    this.incrementConstant(n * expr.constant());
    n = n || 1;
    expr.terms().each(goog.bind(function(clv, coeff) {
      return this.addVariable(clv, coeff * n, subject, solver)
    }, this));
    return this
  };
  Cl.LinearExpression.prototype.addVariable = function(v, c, subject, solver) {
    var coeff, new_coefficient;
    c = c || 1;
    coeff = this._terms.get(v);
    if(coeff) {
      new_coefficient = coeff + c;
      if(Cl.approx(new_coefficient, 0)) {
        if(solver) {
          solver.noteRemovedVariable(v, subject)
        }
        this._terms.remove(v)
      }else {
        this._terms.put(v, new_coefficient)
      }
    }else {
      if(!Cl.approx(c, 0)) {
        this._terms.put(v, c);
        if(solver) {
          solver.noteAddedVariable(v, subject)
        }
      }
    }
    return this
  };
  Cl.LinearExpression.prototype.setVariable = function(v, c) {
    this._terms.put(v, c);
    return this
  };
  Cl.LinearExpression.prototype.anyPivotableVariable = function() {
    if(this.isConstant()) {
      throw new Cl.errors.InternalError("anyPivotableVariable called on a constant");
    }
    this._terms.each(function(clv, c) {
      if(clv.isPivotable()) {
        return clv
      }
    });
    return null
  };
  Cl.LinearExpression.prototype.substituteOut = function(outvar, expr, subject, solver) {
    var multiplier;
    multiplier = this._terms.remove(outvar);
    this.incrementConstant(multiplier * expr.constant());
    return expr.terms().each(goog.bind(function(clv, coeff) {
      var new_coeff, old_coeff;
      old_coeff = this._terms.get(clv);
      if(old_coeff) {
        new_coeff = old_coeff + multiplier * coeff;
        if(Cl.approx(new_coeff, 0)) {
          solver.noteRemovedVariable(clv, subject);
          return this._terms.remove(clv)
        }else {
          return this._terms.put(clv, new_coeff)
        }
      }else {
        this._terms.put(clv, multiplier * coeff);
        return solver.noteAddedVariable(clv, subject)
      }
    }, this))
  };
  Cl.LinearExpression.prototype.changeSubject = function(old_subject, new_subject) {
    return this._terms.put(old_subject, this.newSubject(new_subject))
  };
  Cl.LinearExpression.prototype.newSubject = function(subject) {
    var reciprocal;
    reciprocal = 1 / this._terms.remove(subject);
    this.multiplyMe(-reciprocal);
    return reciprocal
  };
  Cl.LinearExpression.prototype.coefficientFor = function(clv) {
    return this._terms.get(clv) || 0
  };
  Cl.LinearExpression.prototype.constant = function() {
    return this._constant
  };
  Cl.LinearExpression.prototype.set_constant = function(_constant) {
    this._constant = _constant
  };
  Cl.LinearExpression.prototype.terms = function() {
    return this._terms
  };
  Cl.LinearExpression.prototype.incrementConstant = function(c) {
    return this._constant += c
  };
  Cl.LinearExpression.prototype.isConstant = function() {
    return this._terms.size() === 0
  };
  Cl.LinearExpression.prototype.toString = function() {
    var bstr, needsplus;
    bstr = "";
    needsplus = false;
    if(!Cl.approx(this._constant, 0) || this.isConstant()) {
      bstr += this._constant;
      if(this.isConstant()) {
        return bstr
      }else {
        needsplus = true
      }
    }
    this._terms.each(function(clv, coeff) {
      if(needsplus) {
        bstr += " + "
      }
      bstr += coeff + "*" + clv;
      return needsplus = true
    });
    return bstr
  }
});
goog.provide("Cl.SymbolicWeight");
goog.require("Cl");
goog.scope(function() {
  Cl.SymbolicWeight = function(w1, w2, w3) {
    this._values = new Array(w1, w2, w3)
  };
  Cl.SymbolicWeight.prototype.times = function(n) {
    return new Cl.SymbolicWeight(this._values[0] * n, this._values[1] * n, this._values[2] * n)
  };
  Cl.SymbolicWeight.prototype.divideBy = function(n) {
    return new Cl.SymbolicWeight(this._values[0] / n, this._values[1] / n, this._values[2] / n)
  };
  Cl.SymbolicWeight.prototype.add = function(c) {
    return new Cl.SymbolicWeight(this._values[0] + c._values[0], this._values[1] + c._values[1], this._values[2] + c._values[2])
  };
  Cl.SymbolicWeight.prototype.subtract = function(c) {
    return new Cl.SymbolicWeight(this._values[0] - c._values[0], this._values[1] - c._values[1], this._values[2] - c._values[2])
  };
  Cl.SymbolicWeight.prototype.lessThan = function(c) {
    var i;
    i = 0;
    while(i < this._values.length) {
      if(this._values[i] < c._values[i]) {
        return true
      }else {
        if(this._values[i] > c._values[i]) {
          return false
        }
      }
      ++i
    }
    return false
  };
  Cl.SymbolicWeight.prototype.lessThanOrEqual = function(c) {
    var i;
    i = 0;
    while(i < this._values.length) {
      if(this._values[i] < c._values[i]) {
        return true
      }else {
        if(this._values[i] > c._values[i]) {
          return false
        }
      }
      ++i
    }
    return true
  };
  Cl.SymbolicWeight.prototype.equal = function(c) {
    var i;
    i = 0;
    while(i < this._values.length) {
      if(this._values[i] !== c._values[i]) {
        return false
      }
      ++i
    }
    return true
  };
  Cl.SymbolicWeight.prototype.greaterThan = function(c) {
    return!this.lessThanOrEqual(c)
  };
  Cl.SymbolicWeight.prototype.greaterThanOrEqual = function(c) {
    return!this.lessThan(c)
  };
  Cl.SymbolicWeight.prototype.isNegative = function() {
    return this.lessThan(Cl.SymbolicWeight.clsZero)
  };
  Cl.SymbolicWeight.prototype.toDouble = function() {
    var factor, i, multiplier, sum;
    sum = 0;
    factor = 1;
    multiplier = 1E3;
    i = this._values.length - 1;
    while(i >= 0) {
      sum += this._values[i] * factor;
      factor *= multiplier;
      --i
    }
    return sum
  };
  Cl.SymbolicWeight.prototype.toString = function() {
    return"[" + this._values[0] + "," + this._values[1] + "," + this._values[2] + "]"
  };
  Cl.SymbolicWeight.prototype.cLevels = function() {
    return 3
  };
  Cl.SymbolicWeight.clsZero = new Cl.SymbolicWeight(0, 0, 0)
});
goog.provide("Cl.Strength");
goog.require("Cl");
goog.require("Cl.SymbolicWeight");
goog.scope(function() {
  Cl.Strength = function(_name, symbolicWeight, w2, w3) {
    this._name = _name;
    if(symbolicWeight instanceof Cl.SymbolicWeight) {
      this._symbolicWeight = symbolicWeight
    }else {
      this._symbolicWeight = new Cl.SymbolicWeight(symbolicWeight, w2, w3)
    }
  };
  Cl.Strength.prototype.isRequired = function() {
    return this === Cl.Strength.required
  };
  Cl.Strength.prototype.toString = function() {
    return this._name + (!this.isRequired() ? ":" + this.symbolicWeight() : "")
  };
  Cl.Strength.prototype.symbolicWeight = function() {
    return this._symbolicWeight
  };
  Cl.Strength.prototype.name = function() {
    return this._name
  };
  Cl.Strength.prototype.set_name = function(_name) {
    this._name = _name
  };
  Cl.Strength.prototype.set_symbolicWeight = function(_symbolicWeight) {
    this._symbolicWeight = _symbolicWeight
  };
  Cl.Strength.required = new Cl.Strength("<Required>", 1E3, 1E3, 1E3);
  Cl.Strength.strong = new Cl.Strength("strong", 1, 0, 0);
  Cl.Strength.medium = new Cl.Strength("medium", 0, 1, 0);
  Cl.Strength.weak = new Cl.Strength("weak", 0, 0, 1)
});
goog.provide("Cl.Constraint");
goog.provide("Cl.EditConstraint");
goog.provide("Cl.EditOrStayConstraint");
goog.provide("Cl.StayConstraint");
goog.require("Cl");
goog.require("Cl.LinearExpression");
goog.require("Cl.Strength");
goog.scope(function() {
  Cl.Constraint = function(strength, weight) {
    this.hash_code = Cl.Constraint.iConstraintNumber++;
    this._strength = strength || Cl.Strength.required;
    this._weight = weight || 1;
    this._times_added = 0
  };
  Cl.Constraint.prototype.hashCode = function() {
    return this.hash_code
  };
  Cl.Constraint.prototype.isEditConstraint = function() {
    return false
  };
  Cl.Constraint.prototype.isInequality = function() {
    return false
  };
  Cl.Constraint.prototype.isRequired = function() {
    return this._strength.isRequired()
  };
  Cl.Constraint.prototype.isStayConstraint = function() {
    return false
  };
  Cl.Constraint.prototype.strength = function() {
    return this._strength
  };
  Cl.Constraint.prototype.weight = function() {
    return this._weight
  };
  Cl.Constraint.prototype.toString = function() {
    return this._strength + " {" + this._weight + "} (" + this.expression() + ")"
  };
  Cl.Constraint.prototype.setAttachedObject = function(_attachedObject) {
    this._attachedObject = _attachedObject
  };
  Cl.Constraint.prototype.getAttachedObject = function() {
    return this._attachedObject
  };
  Cl.Constraint.prototype.changeStrength = function(strength) {
    if(this._times_added === 0) {
      return this.setStrength(strength)
    }else {
      throw new Cl.errors.TooDifficult;
    }
  };
  Cl.Constraint.prototype.addedTo = function(solver) {
    return++this._times_added
  };
  Cl.Constraint.prototype.removedFrom = function(solver) {
    return--this._times_added
  };
  Cl.Constraint.prototype.setStrength = function(_strength) {
    this._strength = _strength
  };
  Cl.Constraint.prototype.setWeight = function(_weight) {
    this._weight = _weight
  };
  Cl.EditOrStayConstraint = function(clv, strength, weight) {
    Cl.Constraint.call(this, strength, weight);
    this._variable = clv;
    this._expression = new Cl.LinearExpression(this._variable, -1, this._variable.value())
  };
  goog.inherits(Cl.EditOrStayConstraint, Cl.Constraint);
  Cl.EditOrStayConstraint.prototype.variable = function() {
    return this._variable
  };
  Cl.EditOrStayConstraint.prototype.expression = function() {
    return this._expression
  };
  Cl.EditOrStayConstraint.prototype.setVariable = function(_variable) {
    this._variable = _variable
  };
  Cl.EditConstraint = function() {
  };
  goog.inherits(Cl.EditConstraint, Cl.EditOrStayConstraint);
  Cl.EditConstraint.prototype.isEditConstraint = function() {
    return true
  };
  Cl.EditConstraint.prototype.toString = function() {
    return"edit" + Cl.EditConstraint.superClass_.toString.call(this)
  };
  Cl.StayConstraint = function(clv, strength, weight) {
    Cl.EditOrStayConstraint.call(this, clv, strength || Cl.Strength.weak, weight)
  };
  goog.inherits(Cl.StayConstraint, Cl.EditOrStayConstraint);
  Cl.StayConstraint.prototype.isStayConstraint = function() {
    return true
  };
  Cl.StayConstraint.prototype.toString = function() {
    return"stay " + Cl.StayConstraint.superClass_.toString.call(this)
  };
  Cl.Constraint.iConstraintNumber = 1
});
goog.provide("Cl.HashSet");
goog.require("Cl");
goog.scope(function() {
  Cl.HashSet = function() {
    this.storage = []
  };
  Cl.HashSet.prototype.add = function(item) {
    var io, s;
    s = this.storage;
    io = s.indexOf(item);
    if(s.indexOf(item) === -1) {
      return s.push(item)
    }
  };
  Cl.HashSet.prototype.remove = function(item) {
    var io;
    io = this.storage.indexOf(item);
    if(io === -1) {
      return null
    }
    return this.storage.splice(io, 1)[0]
  };
  Cl.HashSet.prototype.values = function() {
    return this.storage
  };
  Cl.HashSet.prototype.clear = function() {
    return this.storage.length = 0
  };
  Cl.HashSet.prototype.size = function() {
    return this.storage.length
  };
  Cl.HashSet.prototype.each = function(func) {
    return this.storage.forEach(func)
  }
});
goog.provide("Cl.CL");
goog.require("Cl");
goog.require("Cl.HashSet");
goog.require("Cl.HashTable");
goog.require("Cl.LinearExpression");
goog.require("Cl.Variable");
goog.scope(function() {
  var HashSet = Cl.HashSet;
  var HashTable = Cl.HashTable;
  var LinearExpression = Cl.LinearExpression;
  var Variable = Cl.Variable;
  Cl.CL = function() {
  };
  Cl.CL.GEQ = 1;
  Cl.CL.LEQ = 2;
  Cl.CL.Assert = function(bool) {
    if(!bool) {
      throw"Nope.";
    }
  };
  Cl.CL.hashToString = function(h) {
    var answer;
    answer = "";
    h.each(function(k, v) {
      answer += k + " => ";
      return answer += v instanceof HashTable ? Cl.CL.hashToString(v) : v instanceof HashSet ? Cl.CL.setToString(v) : v + "\n"
    });
    return answer
  };
  Cl.CL.setToString = function(s) {
    var answer, first;
    answer = s.size() + " {";
    first = true;
    s.each(function(e) {
      if(!first) {
        answer += ", "
      }else {
        first = false
      }
      return answer += e
    });
    answer += "}\n";
    return answer
  };
  Cl.CL.Times = function(e1, e2) {
    if(e1 instanceof LinearExpression && e2 instanceof LinearExpression) {
      return e1.times(e2)
    }else {
      if(e1 instanceof LinearExpression && e2 instanceof Variable) {
        return e1.times(new LinearExpression(e2))
      }else {
        if(e1 instanceof Variable && e2 instanceof LinearExpression) {
          return(new LinearExpression(e1)).times(e2)
        }else {
          if(e1 instanceof LinearExpression && typeof e2 === "number") {
            return e1.times(new LinearExpression(e2))
          }else {
            if(typeof e1 === "number" && e2 instanceof LinearExpression) {
              return(new LinearExpression(e1)).times(e2)
            }else {
              if(typeof e1 === "number" && e2 instanceof Variable) {
                return new LinearExpression(e2, e1)
              }else {
                if(e1 instanceof Variable && typeof e2 === "number") {
                  return new LinearExpression(e1, e2)
                }else {
                  if(e1 instanceof Variable && e2 instanceof LinearExpression) {
                    return new LinearExpression(e2, n)
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  Cl.CL.Linify = function(x) {
    if(x instanceof LinearExpression) {
      return x
    }else {
      return new LinearExpression(x)
    }
  };
  Cl.CL.Plus = function() {
    if(arguments.length === 0) {
      return new LinearExpression(0)
    }else {
      return[].slice.apply(arguments).map(Cl.CL.Linify).reduce(function(sum, v) {
        return sum.plus(v)
      })
    }
  };
  Cl.CL.Minus = function() {
    switch(arguments.length) {
      case 0:
        return new LinearExpression(0);
      case 1:
        return Cl.CL.Linify(arguments[0]).times(-1);
      default:
        return Cl.CL.Linify(arguments[0]).minus(Cl.CL.Plus.apply(null, [].slice.call(arguments, 1)))
    }
  }
});
goog.provide("Cl.LinearConstraint");
goog.provide("Cl.LinearEquation");
goog.provide("Cl.LinearInequality");
goog.require("Cl");
goog.require("Cl.CL");
goog.require("Cl.Constraint");
goog.require("Cl.Constraint");
goog.require("Cl.Strength");
goog.scope(function() {
  var CL = Cl.CL;
  Cl.LinearConstraint = function(cle, strength, weight) {
    Cl.Constraint.call(this, strength, weight);
    this._expression = cle
  };
  goog.inherits(Cl.LinearConstraint, Cl.Constraint);
  Cl.LinearConstraint.prototype.expression = function() {
    return this._expression
  };
  Cl.LinearConstraint.prototype.setExpression = function(_expression) {
    this._expression = _expression
  };
  Cl.LinearInequality = function(a1, a2, a3, a4, a5) {
    var cle, clv, op, strength, weight;
    if(a1 instanceof Cl.LinearExpression && a3 instanceof Cl.AbstractVariable) {
      cle = a1;
      op = a2;
      clv = a3;
      strength = a4;
      weight = a5;
      Cl.LinearConstraint.call(this, cle.clone(), strength, weight);
      if(op === CL.LEQ) {
        this._expression.multiplyMe(-1);
        this._expression.addVariable(clv)
      }else {
        if(op === CL.GEQ) {
          this._expression.addVariable(clv, -1)
        }else {
          throw new Cl.errors.InternalError("Invalid operator in ClLinearInequality constructor");
        }
      }
    }else {
      if(a1 instanceof Cl.LinearExpression) {
        Cl.LinearConstraint.call(this, a1, a2, a3)
      }else {
        if(a2 === CL.GEQ) {
          Cl.LinearConstraint.call(this, new Cl.LinearExpression(a3), a4, a5);
          this._expression.multiplyMe(-1);
          this._expression.addVariable(a1)
        }else {
          if(a2 === CL.LEQ) {
            Cl.LinearConstraint.call(this, new Cl.LinearExpression(a3), a4, a5);
            this._expression.addVariable(a1, -1)
          }else {
            throw new Cl.errors.InternalError("Invalid operator in ClLinearInequality constructor");
          }
        }
      }
    }
  };
  goog.inherits(Cl.LinearInequality, Cl.LinearConstraint);
  Cl.LinearInequality.prototype.isInequality = function() {
    return true
  };
  Cl.LinearInequality.prototype.toString = function() {
    return Cl.LinearInequality.superClass_.toString.call(this) + " >= 0 )"
  };
  Cl.LinearEquation = function(a1, a2, a3, a4) {
    var cle, clv, strength, val, weight;
    if(a1 instanceof Cl.LinearExpression && !a2 || a2 instanceof Cl.Strength) {
      Cl.LinearConstraint.call(this, a1, a2, a3)
    }else {
      if(a1 instanceof Cl.AbstractVariable && a2 instanceof Cl.LinearExpression) {
        clv = a1;
        cle = a2;
        strength = a3;
        weight = a4;
        Cl.LinearConstraint.call(this, cle, strength, weight);
        this._expression.addVariable(clv, -1)
      }else {
        if(a1 instanceof Cl.AbstractVariable && typeof a2 === "number") {
          clv = a1;
          val = a2;
          strength = a3;
          weight = a4;
          Cl.LinearConstraint.call(this, new Cl.LinearExpression(val), strength, weight);
          this._expression.addVariable(clv, -1)
        }else {
          if(a1 instanceof Cl.LinearExpression && a2 instanceof Cl.AbstractVariable) {
            cle = a1;
            clv = a2;
            strength = a3;
            weight = a4;
            Cl.LinearConstraint.call(this, cle.clone(), strength, weight);
            this._expression.addVariable(clv, -1)
          }else {
            if(a1 instanceof Cl.LinearExpression || a1 instanceof Cl.AbstractVariable || typeof a1 === "number" && a2 instanceof Cl.LinearExpression || a2 instanceof Cl.AbstractVariable || typeof a2 === "number") {
              if(a1 instanceof Cl.LinearExpression) {
                a1 = a1.clone()
              }else {
                a1 = new Cl.LinearExpression(a1)
              }
              if(a2 instanceof Cl.LinearExpression) {
                a2 = a2.clone()
              }else {
                a2 = new Cl.LinearExpression(a2)
              }
              Cl.LinearConstraint.call(this, a1, a3, a4);
              this._expression.addExpression(a2, -1)
            }else {
              throw"Bad initializer to ClLinearEquation";
            }
          }
        }
      }
    }
  };
  goog.inherits(Cl.LinearEquation, Cl.LinearConstraint);
  Cl.LinearEquation.prototype.toString = function() {
    return Cl.LinearEquation.superClass_.toString.call(this) + " = 0 )"
  }
});
goog.provide("Cl.Tableau");
goog.require("Cl");
goog.require("Cl.CL");
goog.require("Cl.HashSet");
goog.require("Cl.HashTable");
goog.scope(function() {
  var CL = Cl.CL;
  var HashSet = Cl.HashSet;
  var HashTable = Cl.HashTable;
  Cl.Tableau = function() {
    this._columns = new HashTable;
    this._rows = new HashTable;
    this._infeasibleRows = new HashSet;
    this._externalRows = new HashSet;
    this._externalParametricVars = new HashSet
  };
  Cl.Tableau.prototype.columns = function() {
    return this._columns
  };
  Cl.Tableau.prototype.rows = function() {
    return this._rows
  };
  Cl.Tableau.prototype.columnsHasKey = function(subject) {
    return this._columns.get(subject) != null
  };
  Cl.Tableau.prototype.rowExpression = function(v) {
    return this._rows.get(v)
  };
  Cl.Tableau.prototype.noteRemovedVariable = function(v, subject) {
    if(subject != null) {
      return this._columns.get(v).remove(subject)
    }
  };
  Cl.Tableau.prototype.noteAddedVariable = function(v, subject) {
    if(subject) {
      return this.insertColVar(v, subject)
    }
  };
  Cl.Tableau.prototype.getInternalInfo = function() {
    var retstr;
    retstr = "Tableau Information:\n";
    retstr += "Rows: " + this._rows.size();
    retstr += " (= " + (this._rows.size() - 1) + " constraints)";
    retstr += "\nColumns: " + this._columns.size();
    retstr += "\nInfeasible Rows: " + this._infeasibleRows.size();
    retstr += "\nExternal basic variables: " + this._externalRows.size();
    retstr += "\nExternal parametric variables: ";
    retstr += this._externalParametricVars.size();
    retstr += "\n";
    return retstr
  };
  Cl.Tableau.prototype.toString = function() {
    var bstr;
    bstr = "Tableau:\n";
    this._rows.each(function(clv, expr) {
      bstr += clv;
      bstr += " <==> ";
      bstr += expr;
      return bstr += "\n"
    });
    bstr += "\nColumns:\n";
    bstr += CL.hashToString(this._columns);
    bstr += "\nInfeasible rows: ";
    bstr += CL.setToString(this._infeasibleRows);
    bstr += "External basic variables: ";
    bstr += CL.setToString(this._externalRows);
    bstr += "External parametric variables: ";
    bstr += CL.setToString(this._externalParametricVars);
    return bstr
  };
  Cl.Tableau.prototype.insertColVar = function(param_var, rowvar) {
    var rowset;
    rowset = this._columns.get(param_var);
    if(!rowset) {
      this._columns.put(param_var, rowset = new HashSet)
    }
    return rowset.add(rowvar)
  };
  Cl.Tableau.prototype.addRow = function(aVar, expr) {
    this._rows.put(aVar, expr);
    expr.terms().each(goog.bind(function(clv, coeff) {
      this.insertColVar(clv, aVar);
      if(clv.isExternal()) {
        return this._externalParametricVars.add(clv)
      }
    }, this));
    if(aVar.isExternal()) {
      return this._externalRows.add(aVar)
    }
  };
  Cl.Tableau.prototype.removeColumn = function(aVar) {
    var rows;
    rows = this._columns.remove(aVar);
    if(rows != null) {
      rows.each(goog.bind(function(clv) {
        var expr;
        expr = this._rows.get(clv);
        return expr.terms().remove(aVar)
      }, this))
    }
    if(aVar.isExternal()) {
      this._externalRows.remove(aVar);
      return this._externalParametricVars.remove(aVar)
    }
  };
  Cl.Tableau.prototype.removeRow = function(aVar) {
    var expr;
    expr = this._rows.get(aVar);
    CL.Assert(expr != null);
    expr.terms().each(goog.bind(function(clv, coeff) {
      var varset;
      varset = this._columns.get(clv);
      if(varset != null) {
        return varset.remove(aVar)
      }
    }, this));
    this._infeasibleRows.remove(aVar);
    if(aVar.isExternal()) {
      this._externalRows.remove(aVar)
    }
    this._rows.remove(aVar);
    return expr
  };
  Cl.Tableau.prototype.substituteOut = function(oldVar, expr) {
    var varset;
    varset = this._columns.get(oldVar);
    varset.each(goog.bind(function(v) {
      var row;
      row = this._rows.get(v);
      row.substituteOut(oldVar, expr, v, this);
      if(v.isRestricted() && row.constant() < 0) {
        return this._infeasibleRows.add(v)
      }
    }, this));
    if(oldVar.isExternal()) {
      this._externalRows.add(oldVar);
      this._externalParametricVars.remove(oldVar)
    }
    return this._columns.remove(oldVar)
  }
});
goog.provide("Cl.errors");
goog.provide("Cl.errors.ConstraintNotFound");
goog.provide("Cl.errors.Error");
goog.provide("Cl.errors.NonlinearExpression");
goog.provide("Cl.errors.NotEnoughStays");
goog.provide("Cl.errors.RequiredFailure");
goog.provide("Cl.errors.TooDifficult");
goog.require("Cl");
goog.scope(function() {
  Cl.errors = function() {
  };
  Cl.errors.Error = function() {
  };
  Cl.errors.Error.prototype = new Error;
  Cl.errors.Error.prototype.description = function() {
    return"An error has occurred in Cassowary Coffee"
  };
  Cl.errors.Error.prototype.toString = function() {
    return this.description
  };
  Cl.errors.ConstraintNotFound = function() {
  };
  goog.inherits(Cl.errors.ConstraintNotFound, Cl.errors.Error);
  Cl.errors.ConstraintNotFound.prototype.description = "Tried to remove a constraint never added to the tableau";
  Cl.errors.NonlinearExpression = function() {
  };
  goog.inherits(Cl.errors.NonlinearExpression, Cl.errors.Error);
  Cl.errors.NonlinearExpression.prototype.description = "The resulting expression would be nonlinear";
  Cl.errors.NotEnoughStays = function() {
  };
  goog.inherits(Cl.errors.NotEnoughStays, Cl.errors.Error);
  Cl.errors.NotEnoughStays.prototype.description = "There are not enough stays to give specific values to every variable";
  Cl.errors.RequiredFailure = function() {
  };
  goog.inherits(Cl.errors.RequiredFailure, Cl.errors.Error);
  Cl.errors.RequiredFailure.prototype.description = "A required constraint cannot be satisfied";
  Cl.errors.TooDifficult = function() {
  };
  goog.inherits(Cl.errors.TooDifficult, Cl.errors.Error);
  Cl.errors.TooDifficult.prototype.description = "The constraints are too difficult to solve"
});
goog.provide("Cl.SimplexSolver");
goog.require("Cl");
goog.require("Cl.CL");
goog.require("Cl.DummyVariable");
goog.require("Cl.HashSet");
goog.require("Cl.HashTable");
goog.require("Cl.LinearExpression");
goog.require("Cl.ObjectiveVariable");
goog.require("Cl.SlackVariable");
goog.require("Cl.StayConstraint");
goog.require("Cl.Tableau");
goog.require("Cl.Tableau");
goog.require("Cl.errors");
goog.scope(function() {
  var CL = Cl.CL;
  var HashSet = Cl.HashSet;
  var HashTable = Cl.HashTable;
  Cl.SimplexSolver = function() {
    Cl.Tableau.call(this);
    this._stayMinusErrorVars = new Array;
    this._stayPlusErrorVars = new Array;
    this._errorVars = new HashTable;
    this._markerVars = new HashTable;
    this._resolve_pair = new Array(0, 0);
    this._objective = new Cl.ObjectiveVariable("Z");
    this._editVarMap = new HashTable;
    this._slackCounter = 0;
    this._artificialCounter = 0;
    this._dummyCounter = 0;
    this._epsilon = 1.0E-8;
    this._fOptimizeAutomatically = true;
    this._fNeedsSolving = false;
    this._rows = new HashTable;
    this._rows.put(this._objective, new Cl.LinearExpression);
    this._stkCedcns = new Array;
    this._stkCedcns.push(0)
  };
  goog.inherits(Cl.SimplexSolver, Cl.Tableau);
  Cl.SimplexSolver.prototype.addLowerBound = function(v, lower) {
    var cn;
    cn = new Cl.LinearInequality(v, CL.GEQ, new Cl.LinearExpression(lower));
    return this.addConstraint(cn)
  };
  Cl.SimplexSolver.prototype.addUpperBound = function(v, upper) {
    var cn;
    cn = new Cl.LinearInequality(v, CL.LEQ, new Cl.LinearExpression(upper));
    return this.addConstraint(cn)
  };
  Cl.SimplexSolver.prototype.addBounds = function(v, lower, upper) {
    this.addLowerBound(v, lower);
    this.addUpperBound(v, upper);
    return this
  };
  Cl.SimplexSolver.prototype.addConstraint = function(cn) {
    var clvEminus, clvEplus, eplus_eminus, expr, i, prevEConstant;
    eplus_eminus = new Array(2);
    prevEConstant = new Array(1);
    expr = this.newExpression(cn, eplus_eminus, prevEConstant);
    prevEConstant = prevEConstant[0];
    if(!this.tryAddingDirectly(expr)) {
      this.addWithArtificialVariable(expr)
    }
    this._fNeedsSolving = true;
    if(cn.isEditConstraint()) {
      i = this._editVarMap.size();
      clvEplus = eplus_eminus[0], clvEminus = eplus_eminus[1];
      this._editVarMap.put(cn.variable(), new Cl.EditInfo(cn, clvEplus, clvEminus, prevEConstant, i))
    }
    if(this._fOptimizeAutomatically) {
      this.optimize(this._objective);
      this.setExternalVariables()
    }
    cn.addedTo(this);
    return this
  };
  Cl.SimplexSolver.prototype.addConstraintNoException = function(cn) {
    try {
      this.addConstraint(cn);
      return true
    }catch(e) {
      return false
    }
  };
  Cl.SimplexSolver.prototype.addEditVar = function(v, strength) {
    var cnEdit;
    strength = strength || Cl.Strength.strong;
    cnEdit = new Cl.EditConstraint(v, strength);
    this.addConstraint(cnEdit);
    return this
  };
  Cl.SimplexSolver.prototype.removeEditVar = function(v) {
    var cei, cn;
    cei = this._editVarMap.get(v);
    cn = cei.Constraint();
    this.removeConstraint(cn);
    return this
  };
  Cl.SimplexSolver.prototype.beginEdit = function() {
    CL.Assert(this._editVarMap.size() > 0, "_editVarMap.size() > 0");
    this._infeasibleRows.clear();
    this.resetStayConstants();
    this._stkCedcns.push(this._editVarMap.size());
    return this
  };
  Cl.SimplexSolver.prototype.endEdit = function() {
    var n;
    CL.Assert(this._editVarMap.size() > 0, "_editVarMap.size() > 0");
    this.resolve();
    this._stkCedcns.pop();
    n = this._stkCedcns[this._stkCedcns.length - 1];
    this.removeEditVarsTo(n);
    return this
  };
  Cl.SimplexSolver.prototype.removeAllEditVars = function() {
    return this.removeEditVarsTo(0)
  };
  Cl.SimplexSolver.prototype.removeEditVarsTo = function(n) {
    try {
      this._editVarMap.each(goog.bind(function(v, cei) {
        if(cei.Index() >= n) {
          return this.removeEditVar(v)
        }
      }, this));
      CL.Assert(this._editVarMap.size() === n, "_editVarMap.size() == n");
      return this
    }catch(e) {
      throw new Cl.errors.InternalError("Constraint not found in removeEditVarsTo");
    }
  };
  Cl.SimplexSolver.prototype.addPointStays = function(listOfPoints) {
    var i, multiplier, weight;
    weight = 1;
    multiplier = 2;
    i = 0;
    while(i < listOfPoints.length) {
      this.addPointStay(listOfPoints[i], weight);
      weight *= multiplier;
      i++
    }
    return this
  };
  Cl.SimplexSolver.prototype.addPointStay = function(a1, a2, a3) {
    var clp, vx, vy, weight;
    if(a1 instanceof Cl.Point) {
      clp = a1;
      weight = a2;
      this.addStay(clp.X(), Cl.Strength.weak, weight || 1);
      this.addStay(clp.Y(), Cl.Strength.weak, weight || 1)
    }else {
      vx = a1;
      vy = a2;
      weight = a3;
      this.addStay(vx, Cl.Strength.weak, weight || 1);
      this.addStay(vy, Cl.Strength.weak, weight || 1)
    }
    return this
  };
  Cl.SimplexSolver.prototype.addStay = function(v, strength, weight) {
    var cn;
    cn = new Cl.StayConstraint(v, strength || Cl.Strength.weak, weight || 1);
    return this.addConstraint(cn)
  };
  Cl.SimplexSolver.prototype.removeConstraint = function(cn) {
    this.removeConstraintInternal(cn);
    cn.removedFrom(this);
    return this
  };
  Cl.SimplexSolver.prototype.removeConstraintInternal = function(cn) {
    var cei, clv, clvEditMinus, cnEdit, col, eVars, exitVar, expr, i, marker, minRatio, zRow;
    this._fNeedsSolving = true;
    this.resetStayConstants();
    zRow = this.rowExpression(this._objective);
    eVars = this._errorVars.get(cn);
    if(eVars != null) {
      eVars.each(goog.bind(function(clv) {
        var expr;
        expr = this.rowExpression(clv);
        if(expr == null) {
          return zRow.addVariable(clv, -cn.weight() * cn.strength().symbolicWeight().toDouble(), this._objective, this)
        }else {
          return zRow.addExpression(expr, -cn.weight() * cn.strength().symbolicWeight().toDouble(), this._objective, this)
        }
      }, this))
    }
    marker = this._markerVars.remove(cn);
    if(marker == null) {
      throw new Cl.errors.ConstraintNotFound;
    }
    if(this.rowExpression(marker) == null) {
      col = this._columns.get(marker);
      exitVar = null;
      minRatio = 0;
      col.each(goog.bind(function(v) {
        var coeff, expr, r;
        if(v.isRestricted()) {
          expr = this.rowExpression(v);
          coeff = expr.coefficientFor(marker);
          if(this.fTraceOn) {
            this.traceprint("Marker " + marker + "'s coefficient in " + expr + " is " + coeff)
          }
          if(coeff < 0) {
            r = -expr.constant() / coeff;
            if(!(exitVar != null) || r < minRatio || Cl.approx(r, minRatio) && v.hashCode() < exitVar.hashCode()) {
              minRatio = r;
              return exitVar = v
            }
          }
        }
      }, this));
      if(exitVar == null) {
        if(CL.fTraceOn) {
          CL.traceprint("exitVar is still null")
        }
        col.each(goog.bind(function(v) {
          var coeff, expr, r;
          if(v.isRestricted()) {
            expr = this.rowExpression(v);
            coeff = expr.coefficientFor(marker);
            r = expr.constant() / coeff;
            if(!(exitVar != null) || r < minRatio) {
              minRatio = r;
              return exitVar = v
            }
          }
        }, this))
      }
      if(exitVar == null) {
        if(col.size() === 0) {
          this.removeColumn(marker)
        }else {
          col.each(goog.bind(function(v) {
            if(v !== this._objective) {
              return exitVar = v
            }
          }, this))
        }
      }
      if(exitVar != null) {
        this.pivot(marker, exitVar)
      }
    }
    if(this.rowExpression(marker) != null) {
      expr = this.removeRow(marker);
      expr = null
    }
    if(eVars != null) {
      eVars.each(goog.bind(function(v) {
        if(v !== marker) {
          return this.removeColumn(v)
        }
      }, this))
    }
    if(cn.isStayConstraint()) {
      if(eVars != null) {
        i = 0;
        while(i < this._stayPlusErrorVars.length) {
          eVars.remove(this._stayPlusErrorVars[i]);
          eVars.remove(this._stayMinusErrorVars[i]);
          i++
        }
      }
    }else {
      if(cn.isEditConstraint()) {
        CL.Assert(eVars != null, "eVars != null");
        cnEdit = cn;
        clv = cnEdit.variable();
        cei = this._editVarMap.get(clv);
        clvEditMinus = cei.ClvEditMinus();
        this.removeColumn(clvEditMinus);
        this._editVarMap.remove(clv)
      }
    }
    if(eVars != null) {
      this._errorVars.remove(eVars)
    }
    if(this._fOptimizeAutomatically) {
      this.optimize(this._objective);
      this.setExternalVariables()
    }
    return this
  };
  Cl.SimplexSolver.prototype.reset = function() {
    throw new Cl.errors.InternalError("reset not implemented");
  };
  Cl.SimplexSolver.prototype.resolveArray = function(newEditConstants) {
    this._editVarMap.each(goog.bind(function(v, cei) {
      var i;
      i = cei.Index();
      if(i < newEditConstants.length) {
        return this.suggestValue(v, newEditConstants[i])
      }
    }, this));
    return this.resolve()
  };
  Cl.SimplexSolver.prototype.resolvePair = function(x, y) {
    this._resolve_pair[0] = x;
    this._resolve_pair[1] = y;
    return this.resolveArray(this._resolve_pair)
  };
  Cl.SimplexSolver.prototype.resolve = function() {
    this.dualOptimize();
    this.setExternalVariables();
    this._infeasibleRows.clear();
    this.resetStayConstants();
    return this
  };
  Cl.SimplexSolver.prototype.suggestValue = function(v, x) {
    var cei, clvEditMinus, clvEditPlus, delta, i;
    cei = this._editVarMap.get(v);
    if(cei == null) {
      throw new Error("suggestValue for variable " + v + ", but var is not an edit variable\n");throw new Cl.errors.Error;
    }
    i = cei.Index();
    clvEditPlus = cei.ClvEditPlus();
    clvEditMinus = cei.ClvEditMinus();
    delta = x - cei.PrevEditConstant();
    cei.SetPrevEditConstant(x);
    this.deltaEditConstant(delta, clvEditPlus, clvEditMinus);
    return this
  };
  Cl.SimplexSolver.prototype.setAutosolve = function(f) {
    this._fOptimizeAutomatically = f;
    return this
  };
  Cl.SimplexSolver.prototype.FIsAutosolving = function() {
    return this._fOptimizeAutomatically
  };
  Cl.SimplexSolver.prototype.solve = function() {
    if(this._fNeedsSolving) {
      this.optimize(this._objective);
      this.setExternalVariables()
    }
    return this
  };
  Cl.SimplexSolver.prototype.setEditedValue = function(v, n) {
    if(!this.FContainsVariable(v)) {
      v.change_value(n);
      return this
    }
    if(!Cl.approx(n, v.value())) {
      this.addEditVar(v);
      this.beginEdit();
      try {
        this.suggestValue(v, n)
      }catch(e) {
        throw new Cl.errors.InternalError("Error in setEditedValue");
      }
      this.endEdit()
    }
    return this
  };
  Cl.SimplexSolver.prototype.FContainsVariable = function(v) {
    return this.columnsHasKey(v) || this.rowExpression(v) != null
  };
  Cl.SimplexSolver.prototype.addVar = function(v) {
    if(!this.FContainsVariable(v)) {
      try {
        this.addStay(v)
      }catch(e) {
        throw new Cl.errorsInternalError("Error in addVar -- required failure is impossible");
      }
    }
    return this
  };
  Cl.SimplexSolver.prototype.getInternalInfo = function() {
    retstr += "\nSolver info:\n";
    retstr += "Stay Error Variables: ";
    retstr += this._stayPlusErrorVars.length + this._stayMinusErrorVars.length;
    retstr += " (" + this._stayPlusErrorVars.length + " +, ";
    retstr += this._stayMinusErrorVars.length + " -)\n";
    retstr += "Edit Variables: " + this._editVarMap.size();
    retstr += "\n";
    return retstr
  };
  Cl.SimplexSolver.prototype.getDebugInfo = function() {
    var bstr;
    bstr = this.toString();
    bstr += this.getInternalInfo();
    bstr += "\n";
    return bstr
  };
  Cl.SimplexSolver.prototype.toString = function() {
    var bstr;
    bstr = Cl.SimplexSolver.superClass_.toString.call(this);
    bstr += "\n_stayPlusErrorVars: ";
    bstr += "[" + this._stayPlusErrorVars + "]";
    bstr += "\n_stayMinusErrorVars: ";
    bstr += "[" + this._stayMinusErrorVars + "]";
    bstr += "\n";
    bstr += "_editVarMap:\n" + CL.hashToString(this._editVarMap);
    bstr += "\n";
    return bstr
  };
  Cl.SimplexSolver.prototype.getConstraintMap = function() {
    return this._markerVars
  };
  Cl.SimplexSolver.prototype.addWithArtificialVariable = function(expr) {
    var av, az, azRow, azTableauRow, e, entryVar;
    av = new Cl.SlackVariable(++this._artificialCounter, "a");
    az = new Cl.ObjectiveVariable("az");
    azRow = expr.clone();
    this.addRow(az, azRow);
    this.addRow(av, expr);
    this.optimize(az);
    azTableauRow = this.rowExpression(az);
    if(!Cl.approx(azTableauRow.constant(), 0)) {
      this.removeRow(az);
      this.removeColumn(av);
      throw new Cl.errors.RequiredFailure;
    }
    e = this.rowExpression(av);
    if(e != null) {
      if(e.isConstant()) {
        this.removeRow(av);
        this.removeRow(az);
        return
      }
      entryVar = e.anyPivotableVariable();
      this.pivot(entryVar, av)
    }
    CL.Assert(!(this.rowExpression(av) != null), "rowExpression(av) == null");
    this.removeColumn(av);
    return this.removeRow(az)
  };
  Cl.SimplexSolver.prototype.tryAddingDirectly = function(expr) {
    var subject;
    subject = this.chooseSubject(expr);
    if(subject == null) {
      return false
    }
    expr.newSubject(subject);
    if(this.columnsHasKey(subject)) {
      this.substituteOut(subject, expr)
    }
    this.addRow(subject, expr);
    return true
  };
  Cl.SimplexSolver.prototype.chooseSubject = function(expr) {
    var coeff, foundNewRestricted, foundUnrestricted, retval, subject, terms;
    subject = null;
    foundUnrestricted = false;
    foundNewRestricted = false;
    terms = expr.terms();
    retval = null;
    terms.each(goog.bind(function(v, c) {
      var col;
      if(foundUnrestricted) {
        if(!v.isRestricted() && !this.columnsHasKey(v)) {
          retval = v
        }
      }else {
        if(v.isRestricted()) {
          if(!foundNewRestricted && !v.isDummy() && c < 0) {
            col = this._columns.get(v);
            if(!(col != null) || col.size() === 1 && this.columnsHasKey(this._objective)) {
              subject = v;
              return foundNewRestricted = true
            }
          }
        }else {
          subject = v;
          return foundUnrestricted = true
        }
      }
    }, this));
    if(retval != null) {
      return retval
    }
    if(subject != null) {
      return subject
    }
    coeff = 0;
    if(terms.keys().some(function(v) {
      return!v.isDummy()
    })) {
      return null
    }
    terms.each(goog.bind(function(v, c) {
      if(!this.columnsHasKey(v)) {
        subject = v;
        return coeff = c
      }
    }, this));
    if(!Cl.approx(expr.constant(), 0)) {
      throw new Cl.errors.RequiredFailure;
    }
    if(coeff > 0) {
      expr.multiplyMe(-1)
    }
    return subject
  };
  Cl.SimplexSolver.prototype.deltaEditConstant = function(delta, plusErrorVar, minusErrorVar) {
    var columnVars, exprMinus, exprPlus;
    if(CL.fTraceOn) {
      CL.fnenterprint("deltaEditConstant :" + delta + ", " + plusErrorVar + ", " + minusErrorVar)
    }
    exprPlus = this.rowExpression(plusErrorVar);
    if(exprPlus != null) {
      exprPlus.incrementConstant(delta);
      if(exprPlus.constant() < 0) {
        this._infeasibleRows.add(plusErrorVar)
      }
      return
    }
    exprMinus = this.rowExpression(minusErrorVar);
    if(exprMinus != null) {
      exprMinus.incrementConstant(-delta);
      if(exprMinus.constant() < 0) {
        this._infeasibleRows.add(minusErrorVar)
      }
      return
    }
    columnVars = this._columns.get(minusErrorVar);
    if(!columnVars) {
      throw new Error("columnVars is null -- tableau is:\n" + this);
    }
    return columnVars.each(goog.bind(function(basicVar) {
      var c, expr;
      expr = this.rowExpression(basicVar);
      c = expr.coefficientFor(minusErrorVar);
      expr.incrementConstant(c * delta);
      if(basicVar.isRestricted() && expr.constant() < 0) {
        return this._infeasibleRows.add(basicVar)
      }
    }, this))
  };
  Cl.SimplexSolver.prototype.dualOptimize = function() {
    var entryVar, exitVar, expr, ratio, terms, zRow, _results;
    if(CL.fTraceOn) {
      CL.fnenterprint("dualOptimize:")
    }
    zRow = this.rowExpression(this._objective);
    _results = [];
    while(!this._infeasibleRows.isEmpty()) {
      exitVar = this._infeasibleRows.values()[0];
      this._infeasibleRows.remove(exitVar);
      entryVar = null;
      expr = this.rowExpression(exitVar);
      _results.push(function() {
        if(expr != null) {
          if(expr.constant() < 0) {
            ratio = Number.MAX_VALUE;
            terms = expr.terms();
            terms.each(function(v, c) {
              var r, zc;
              if(c > 0 && v.isPivotable()) {
                zc = zRow.coefficientFor(v);
                r = zc / c;
                if(r < ratio || Cl.approx(r, ratio) && v.hashCode() < entryVar.hashCode()) {
                  entryVar = v;
                  return ratio = r
                }
              }
            });
            if(ratio === Number.MAX_VALUE) {
              throw new Cl.errors.InternalError("ratio == nil (MAX_VALUE) in dualOptimize");
            }
            return this.pivot(entryVar, exitVar)
          }
        }
      }.call(this))
    }
    return _results
  };
  Cl.SimplexSolver.prototype.newExpression = function(cn, eplus_eminus, prevEConstant) {
    var cnExpr, cnTerms, dummyVar, eminus, eplus, expr, slackVar, sw, swCoeff, zRow;
    cnExpr = cn.expression();
    expr = new Cl.LinearExpression(cnExpr.constant());
    slackVar = new Cl.SlackVariable;
    dummyVar = new Cl.DummyVariable;
    eminus = new Cl.SlackVariable;
    eplus = new Cl.SlackVariable;
    cnTerms = cnExpr.terms();
    cnTerms.each(goog.bind(function(v, c) {
      var e;
      e = this.rowExpression(v);
      if(e == null) {
        return expr.addVariable(v, c)
      }else {
        return expr.addExpression(e, c)
      }
    }, this));
    if(cn.isInequality()) {
      ++this._slackCounter;
      slackVar = new Cl.SlackVariable(this._slackCounter, "s");
      expr.setVariable(slackVar, -1);
      this._markerVars.put(cn, slackVar);
      if(!cn.isRequired()) {
        ++this._slackCounter;
        eminus = new Cl.SlackVariable(this._slackCounter, "em");
        expr.setVariable(eminus, 1);
        zRow = this.rowExpression(this._objective);
        sw = cn.strength().symbolicWeight().times(cn.weight());
        zRow.setVariable(eminus, sw.toDouble());
        this.insertErrorVar(cn, eminus);
        this.noteAddedVariable(eminus, this._objective)
      }
    }else {
      if(cn.isRequired()) {
        ++this._dummyCounter;
        dummyVar = new Cl.DummyVariable(this._dummyCounter, "d");
        expr.setVariable(dummyVar, 1);
        this._markerVars.put(cn, dummyVar)
      }else {
        ++this._slackCounter;
        eplus = new Cl.SlackVariable(this._slackCounter, "ep");
        eminus = new Cl.SlackVariable(this._slackCounter, "em");
        expr.setVariable(eplus, -1);
        expr.setVariable(eminus, 1);
        this._markerVars.put(cn, eplus);
        zRow = this.rowExpression(this._objective);
        sw = cn.strength().symbolicWeight().times(cn.weight());
        swCoeff = sw.toDouble();
        zRow.setVariable(eplus, swCoeff);
        this.noteAddedVariable(eplus, this._objective);
        zRow.setVariable(eminus, swCoeff);
        this.noteAddedVariable(eminus, this._objective);
        this.insertErrorVar(cn, eminus);
        this.insertErrorVar(cn, eplus);
        if(cn.isStayConstraint()) {
          this._stayPlusErrorVars.push(eplus);
          this._stayMinusErrorVars.push(eminus)
        }else {
          if(cn.isEditConstraint()) {
            eplus_eminus[0] = eplus;
            eplus_eminus[1] = eminus;
            prevEConstant[0] = cnExpr.constant()
          }
        }
      }
    }
    if(expr.constant() < 0) {
      expr.multiplyMe(-1)
    }
    return expr
  };
  Cl.SimplexSolver.prototype.optimize = function(zVar) {
    var columnVars, entryVar, exitVar, minRatio, objectiveCoeff, r, terms, zRow, _results;
    zRow = this.rowExpression(zVar);
    CL.Assert(zRow != null, "zRow != null");
    entryVar = null;
    exitVar = null;
    _results = [];
    while(true) {
      objectiveCoeff = 0;
      terms = zRow.terms();
      terms.escapingEach(function(v, c) {
        if(v.isPivotable() && c < objectiveCoeff) {
          objectiveCoeff = c;
          entryVar = v;
          return{brk:true}
        }
      });
      if(objectiveCoeff >= -this._epsilon) {
        return
      }
      minRatio = Number.MAX_VALUE;
      columnVars = this._columns.get(entryVar);
      r = 0;
      columnVars.each(goog.bind(function(v) {
        var coeff, expr;
        if(this.fTraceOn) {
          this.traceprint("Checking " + v)
        }
        if(v.isPivotable()) {
          expr = this.rowExpression(v);
          coeff = expr.coefficientFor(entryVar);
          if(coeff < 0) {
            r = -expr.constant() / coeff;
            if(r < minRatio || Cl.approx(r, minRatio) && v.hashCode() < exitVar.hashCode()) {
              minRatio = r;
              return exitVar = v
            }
          }
        }
      }, this));
      if(minRatio === Number.MAX_VALUE) {
        throw new Cl.errors.InternalError("Objective function is unbounded in optimize");
      }
      _results.push(this.pivot(entryVar, exitVar))
    }
    return _results
  };
  Cl.SimplexSolver.prototype.pivot = function(entryVar, exitVar) {
    var pexpr;
    pexpr = this.removeRow(exitVar);
    pexpr.changeSubject(exitVar, entryVar);
    this.substituteOut(entryVar, pexpr);
    return this.addRow(entryVar, pexpr)
  };
  Cl.SimplexSolver.prototype.resetStayConstants = function() {
    var expr, i, _results;
    i = 0;
    _results = [];
    while(i < this._stayPlusErrorVars.length) {
      expr = this.rowExpression(this._stayPlusErrorVars[i]);
      if(expr == null) {
        expr = this.rowExpression(this._stayMinusErrorVars[i])
      }
      if(expr != null) {
        expr.set_constant(0)
      }
      _results.push(i++)
    }
    return _results
  };
  Cl.SimplexSolver.prototype.setExternalVariables = function() {
    this._externalParametricVars.each(goog.bind(function(v) {
      if(this.rowExpression(v) != null) {
        throw new Error("Error: variable" + v + " in _externalParametricVars is basic");
      }else {
        return v.change_value(0)
      }
    }, this));
    this._externalRows.each(goog.bind(function(v) {
      var expr;
      expr = this.rowExpression(v);
      return v.change_value(expr.constant())
    }, this));
    return this._fNeedsSolving = false
  };
  Cl.SimplexSolver.prototype.insertErrorVar = function(cn, aVar) {
    var cnset;
    cnset = this._errorVars.get(aVar);
    if(cnset == null) {
      this._errorVars.put(cn, cnset = new HashSet)
    }
    return cnset.add(aVar)
  }
});
goog.provide("cassowary.core");
goog.require("cljs.core");
goog.require("Cl.LinearEquation");
goog.require("Cl.SimplexSolver");
goog.require("Cl.Constraint");
goog.require("Cl.Variable");
goog.require("Cl.CL");
goog.require("Cl");
cassowary.core.cvar = function() {
  var cvar = null;
  var cvar__0 = function() {
    return cvar.call(null, 0)
  };
  var cvar__1 = function(val) {
    return new Cl.Variable(parseFloat(val))
  };
  cvar = function(val) {
    switch(arguments.length) {
      case 0:
        return cvar__0.call(this);
      case 1:
        return cvar__1.call(this, val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  cvar.cljs$lang$arity$0 = cvar__0;
  cvar.cljs$lang$arity$1 = cvar__1;
  return cvar
}();
cassowary.core.value = function value(cvar) {
  return cvar.value()
};
cassowary.core.simplex_solver = function simplex_solver() {
  return new Cl.SimplexSolver
};
cassowary.core.constrain_BANG_ = function constrain_BANG_(solver, constraint) {
  if(cljs.core.instance_QMARK_.call(null, Cl.Constraint, constraint)) {
    return solver.addConstraint(constraint)
  }else {
    throw new Error("Called constrain! with something not derived from Cl.Constraint; perhaps you forgot (:refer-clojure :exclude [+ - =]) ?");
  }
};
cassowary.core.unconstrain_BANG_ = function unconstrain_BANG_(solver, constraint) {
  if(cljs.core.instance_QMARK_.call(null, Cl.Constraint, constraint)) {
    return solver.removeConstraint(constraint)
  }else {
    throw new Error("Called unconstrain! with something not derived from Cl.Constraint; perhaps you forgot (:refer-clojure :exclude [+ - =]) ?");
  }
};
cassowary.core.stay_BANG_ = function stay_BANG_(solver, cvar) {
  return solver.addStay(cvar)
};
cassowary.core.contains_cassowary_QMARK_ = function() {
  var contains_cassowary_QMARK___delegate = function(args) {
    if(cljs.core.truth_(cljs.core.some.call(null, function(p1__6241_SHARP_) {
      var or__3824__auto____6243 = cljs.core.instance_QMARK_.call(null, Cl.Variable, p1__6241_SHARP_);
      if(or__3824__auto____6243) {
        return or__3824__auto____6243
      }else {
        return cljs.core.instance_QMARK_.call(null, Cl.LinearExpression, p1__6241_SHARP_)
      }
    }, args))) {
      return"\ufdd0'cassowary-var"
    }else {
      return"\ufdd0'number"
    }
  };
  var contains_cassowary_QMARK_ = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return contains_cassowary_QMARK___delegate.call(this, args)
  };
  contains_cassowary_QMARK_.cljs$lang$maxFixedArity = 0;
  contains_cassowary_QMARK_.cljs$lang$applyTo = function(arglist__6244) {
    var args = cljs.core.seq(arglist__6244);
    return contains_cassowary_QMARK___delegate(args)
  };
  contains_cassowary_QMARK_.cljs$lang$arity$variadic = contains_cassowary_QMARK___delegate;
  return contains_cassowary_QMARK_
}();
cassowary.core._PLUS_ = function() {
  var method_table__2592__auto____6245 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var prefer_table__2593__auto____6246 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var method_cache__2594__auto____6247 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var cached_hierarchy__2595__auto____6248 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var hierarchy__2596__auto____6249 = cljs.core._lookup.call(null, cljs.core.ObjMap.EMPTY, "\ufdd0'hierarchy", cljs.core.global_hierarchy);
  return new cljs.core.MultiFn("+", cassowary.core.contains_cassowary_QMARK_, "\ufdd0'default", hierarchy__2596__auto____6249, method_table__2592__auto____6245, prefer_table__2593__auto____6246, method_cache__2594__auto____6247, cached_hierarchy__2595__auto____6248)
}();
cassowary.core._ = function() {
  var method_table__2592__auto____6250 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var prefer_table__2593__auto____6251 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var method_cache__2594__auto____6252 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var cached_hierarchy__2595__auto____6253 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var hierarchy__2596__auto____6254 = cljs.core._lookup.call(null, cljs.core.ObjMap.EMPTY, "\ufdd0'hierarchy", cljs.core.global_hierarchy);
  return new cljs.core.MultiFn("-", cassowary.core.contains_cassowary_QMARK_, "\ufdd0'default", hierarchy__2596__auto____6254, method_table__2592__auto____6250, prefer_table__2593__auto____6251, method_cache__2594__auto____6252, cached_hierarchy__2595__auto____6253)
}();
cassowary.core._STAR_ = function() {
  var method_table__2592__auto____6255 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var prefer_table__2593__auto____6256 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var method_cache__2594__auto____6257 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var cached_hierarchy__2595__auto____6258 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var hierarchy__2596__auto____6259 = cljs.core._lookup.call(null, cljs.core.ObjMap.EMPTY, "\ufdd0'hierarchy", cljs.core.global_hierarchy);
  return new cljs.core.MultiFn("*", cassowary.core.contains_cassowary_QMARK_, "\ufdd0'default", hierarchy__2596__auto____6259, method_table__2592__auto____6255, prefer_table__2593__auto____6256, method_cache__2594__auto____6257, cached_hierarchy__2595__auto____6258)
}();
cassowary.core._EQ_ = function() {
  var method_table__2592__auto____6260 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var prefer_table__2593__auto____6261 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var method_cache__2594__auto____6262 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var cached_hierarchy__2595__auto____6263 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  var hierarchy__2596__auto____6264 = cljs.core._lookup.call(null, cljs.core.ObjMap.EMPTY, "\ufdd0'hierarchy", cljs.core.global_hierarchy);
  return new cljs.core.MultiFn("=", cassowary.core.contains_cassowary_QMARK_, "\ufdd0'default", hierarchy__2596__auto____6264, method_table__2592__auto____6260, prefer_table__2593__auto____6261, method_cache__2594__auto____6262, cached_hierarchy__2595__auto____6263)
}();
cljs.core._add_method.call(null, cassowary.core._PLUS_, "\ufdd0'number", function() {
  var G__6265__delegate = function(args) {
    return cljs.core.apply.call(null, cljs.core._PLUS_, args)
  };
  var G__6265 = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return G__6265__delegate.call(this, args)
  };
  G__6265.cljs$lang$maxFixedArity = 0;
  G__6265.cljs$lang$applyTo = function(arglist__6266) {
    var args = cljs.core.seq(arglist__6266);
    return G__6265__delegate(args)
  };
  G__6265.cljs$lang$arity$variadic = G__6265__delegate;
  return G__6265
}());
cljs.core._add_method.call(null, cassowary.core._EQ_, "\ufdd0'number", function() {
  var G__6267__delegate = function(args) {
    return cljs.core.apply.call(null, cljs.core._EQ_, args)
  };
  var G__6267 = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return G__6267__delegate.call(this, args)
  };
  G__6267.cljs$lang$maxFixedArity = 0;
  G__6267.cljs$lang$applyTo = function(arglist__6268) {
    var args = cljs.core.seq(arglist__6268);
    return G__6267__delegate(args)
  };
  G__6267.cljs$lang$arity$variadic = G__6267__delegate;
  return G__6267
}());
cljs.core._add_method.call(null, cassowary.core._STAR_, "\ufdd0'number", function() {
  var G__6269__delegate = function(args) {
    return cljs.core.apply.call(null, cljs.core._STAR_, args)
  };
  var G__6269 = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return G__6269__delegate.call(this, args)
  };
  G__6269.cljs$lang$maxFixedArity = 0;
  G__6269.cljs$lang$applyTo = function(arglist__6270) {
    var args = cljs.core.seq(arglist__6270);
    return G__6269__delegate(args)
  };
  G__6269.cljs$lang$arity$variadic = G__6269__delegate;
  return G__6269
}());
cljs.core._add_method.call(null, cassowary.core._, "\ufdd0'number", function() {
  var G__6271__delegate = function(args) {
    return cljs.core.apply.call(null, cljs.core._, args)
  };
  var G__6271 = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return G__6271__delegate.call(this, args)
  };
  G__6271.cljs$lang$maxFixedArity = 0;
  G__6271.cljs$lang$applyTo = function(arglist__6272) {
    var args = cljs.core.seq(arglist__6272);
    return G__6271__delegate(args)
  };
  G__6271.cljs$lang$arity$variadic = G__6271__delegate;
  return G__6271
}());
cljs.core._add_method.call(null, cassowary.core._PLUS_, "\ufdd0'cassowary-var", function() {
  var G__6273__delegate = function(args) {
    return cljs.core.apply.call(null, Cl.CL.Plus, args)
  };
  var G__6273 = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return G__6273__delegate.call(this, args)
  };
  G__6273.cljs$lang$maxFixedArity = 0;
  G__6273.cljs$lang$applyTo = function(arglist__6274) {
    var args = cljs.core.seq(arglist__6274);
    return G__6273__delegate(args)
  };
  G__6273.cljs$lang$arity$variadic = G__6273__delegate;
  return G__6273
}());
cljs.core._add_method.call(null, cassowary.core._, "\ufdd0'cassowary-var", function() {
  var G__6275__delegate = function(args) {
    return cljs.core.apply.call(null, Cl.CL.Minus, args)
  };
  var G__6275 = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return G__6275__delegate.call(this, args)
  };
  G__6275.cljs$lang$maxFixedArity = 0;
  G__6275.cljs$lang$applyTo = function(arglist__6276) {
    var args = cljs.core.seq(arglist__6276);
    return G__6275__delegate(args)
  };
  G__6275.cljs$lang$arity$variadic = G__6275__delegate;
  return G__6275
}());
cljs.core._add_method.call(null, cassowary.core._STAR_, "\ufdd0'cassowary-var", function(a, b) {
  return Cl.CL.Times.call(null, a, b)
});
cljs.core._add_method.call(null, cassowary.core._EQ_, "\ufdd0'cassowary-var", function(a, b) {
  return new Cl.LinearEquation(a, b)
});
goog.provide("sketchpad.core");
goog.require("cljs.core");
goog.require("cassowary.core");
goog.require("sketchpad.state_patches");
goog.require("sketchpad.shapes");
goog.require("cassowary.core");
goog.require("sketchpad.state_patches");
goog.require("sketchpad.shapes");
sketchpad.core.current_universe = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
sketchpad.core.start_x = cljs.core.atom.call(null, null);
sketchpad.core.start_y = cljs.core.atom.call(null, null);
sketchpad.core.drawables = function drawables(universe) {
  return cljs.core.filter.call(null, function(p__66465) {
    var vec__66466__66467 = p__66465;
    var name__66468 = cljs.core.nth.call(null, vec__66466__66467, 0, null);
    var item__66469 = cljs.core.nth.call(null, vec__66466__66467, 1, null);
    var G__66470__66471 = item__66469;
    if(G__66470__66471) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____66472 = null;
        if(cljs.core.truth_(or__3824__auto____66472)) {
          return or__3824__auto____66472
        }else {
          return G__66470__66471.sketchpad$shapes$Drawable$
        }
      }())) {
        return true
      }else {
        if(!G__66470__66471.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, sketchpad.shapes.Drawable, G__66470__66471)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, sketchpad.shapes.Drawable, G__66470__66471)
    }
  }, universe)
};
sketchpad.core.selectables = function selectables(universe) {
  return cljs.core.filter.call(null, function(p__66482) {
    var vec__66483__66484 = p__66482;
    var name__66485 = cljs.core.nth.call(null, vec__66483__66484, 0, null);
    var item__66486 = cljs.core.nth.call(null, vec__66483__66484, 1, null);
    var and__3822__auto____66487 = cljs.core.not.call(null, cassowary.core._EQ_.call(null, name__66485, universe.call(null, "\ufdd0'selected")));
    if(and__3822__auto____66487) {
      var G__66488__66489 = item__66486;
      if(G__66488__66489) {
        if(cljs.core.truth_(function() {
          var or__3824__auto____66490 = null;
          if(cljs.core.truth_(or__3824__auto____66490)) {
            return or__3824__auto____66490
          }else {
            return G__66488__66489.sketchpad$shapes$Selectable$
          }
        }())) {
          return true
        }else {
          if(!G__66488__66489.cljs$lang$protocol_mask$partition$) {
            return cljs.core.type_satisfies_.call(null, sketchpad.shapes.Selectable, G__66488__66489)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, sketchpad.shapes.Selectable, G__66488__66489)
      }
    }else {
      return and__3822__auto____66487
    }
  }, universe)
};
sketchpad.core.draw_universe = function draw_universe(universe, ctx) {
  ctx.clearRect(0, 0, 800, 600);
  var G__66510__66511 = cljs.core.seq.call(null, sketchpad.core.drawables.call(null, universe));
  if(G__66510__66511) {
    var G__66513__66515 = cljs.core.first.call(null, G__66510__66511);
    var vec__66514__66516 = G__66513__66515;
    var name__66517 = cljs.core.nth.call(null, vec__66514__66516, 0, null);
    var item__66518 = cljs.core.nth.call(null, vec__66514__66516, 1, null);
    var G__66510__66519 = G__66510__66511;
    var G__66513__66520 = G__66513__66515;
    var G__66510__66521 = G__66510__66519;
    while(true) {
      var vec__66522__66523 = G__66513__66520;
      var name__66524 = cljs.core.nth.call(null, vec__66522__66523, 0, null);
      var item__66525 = cljs.core.nth.call(null, vec__66522__66523, 1, null);
      var G__66510__66526 = G__66510__66521;
      sketchpad.shapes.draw.call(null, item__66525, ctx, universe);
      var temp__3974__auto____66527 = cljs.core.next.call(null, G__66510__66526);
      if(temp__3974__auto____66527) {
        var G__66510__66528 = temp__3974__auto____66527;
        var G__66529 = cljs.core.first.call(null, G__66510__66528);
        var G__66530 = G__66510__66528;
        G__66513__66520 = G__66529;
        G__66510__66521 = G__66530;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
sketchpad.core.closest = function closest(u, cx, cy) {
  var selectable__66543 = sketchpad.core.selectables.call(null, u);
  var distances__66549 = cljs.core.map.call(null, function(p__66544) {
    var vec__66545__66546 = p__66544;
    var name__66547 = cljs.core.nth.call(null, vec__66545__66546, 0, null);
    var item__66548 = cljs.core.nth.call(null, vec__66545__66546, 1, null);
    return cljs.core.PersistentVector.fromArray([name__66547, sketchpad.shapes.cursor_distance.call(null, item__66548, cx, cy, u)], true)
  }, selectable__66543);
  var vec__66542__66550 = cljs.core.apply.call(null, cljs.core.min_key, cljs.core.second, distances__66549);
  var item__66551 = cljs.core.nth.call(null, vec__66542__66550, 0, null);
  var distance__66552 = cljs.core.nth.call(null, vec__66542__66550, 1, null);
  if(distance__66552 < 10) {
    return item__66551
  }else {
    return null
  }
};
sketchpad.core.event_location = function event_location(e) {
  return cljs.core.PersistentVector.fromArray([e.layerX, e.layerY], true)
};
sketchpad.core.highlight_closest = function highlight_closest(e) {
  var u__66561 = cljs.core.deref.call(null, sketchpad.core.current_universe);
  var vec__66560__66562 = sketchpad.core.event_location.call(null, e);
  var cx__66563 = cljs.core.nth.call(null, vec__66560__66562, 0, null);
  var cy__66564 = cljs.core.nth.call(null, vec__66560__66562, 1, null);
  var item__66565 = sketchpad.core.closest.call(null, u__66561, cx__66563, cy__66564);
  return cljs.core.swap_BANG_.call(null, sketchpad.core.current_universe, cljs.core.assoc, "\ufdd0'highlighted", item__66565)
};
sketchpad.core.move_selected = function move_selected(e) {
  var u__66580 = cljs.core.deref.call(null, sketchpad.core.current_universe);
  var selected__66581 = (new cljs.core.Keyword("\ufdd0'selected")).call(null, u__66580);
  if(cljs.core.truth_(selected__66581)) {
    var vec__66582__66584 = cljs.core.PersistentVector.fromArray([cljs.core.deref.call(null, sketchpad.core.start_x), cljs.core.deref.call(null, sketchpad.core.start_y)], true);
    var x1__66585 = cljs.core.nth.call(null, vec__66582__66584, 0, null);
    var y1__66586 = cljs.core.nth.call(null, vec__66582__66584, 1, null);
    var vec__66583__66587 = sketchpad.core.event_location.call(null, e);
    var x2__66588 = cljs.core.nth.call(null, vec__66583__66587, 0, null);
    var y2__66589 = cljs.core.nth.call(null, vec__66583__66587, 1, null);
    var dx__66590 = cassowary.core._.call(null, x2__66588, x1__66585);
    var dy__66591 = cassowary.core._.call(null, y1__66586, y1__66586);
    var item__66592 = selected__66581.call(null, u__66580);
    var new_u__66593 = sketchpad.state_patches.patch.call(null, u__66580, sketchpad.shapes.move_BANG_.call(null, item__66592, selected__66581, dx__66590, dy__66591, u__66580));
    cljs.core.swap_BANG_.call(null, sketchpad.core.start_x, cljs.core.constantly.call(null, x2__66588));
    cljs.core.swap_BANG_.call(null, sketchpad.core.start_y, cljs.core.constantly.call(null, y2__66589));
    return cljs.core.swap_BANG_.call(null, sketchpad.core.current_universe, function(p1__66553_SHARP_) {
      return sketchpad.state_patches.patch.call(null, p1__66553_SHARP_, sketchpad.shapes.move_BANG_.call(null, selected__66581.call(null, u__66580), selected__66581, cassowary.core._.call(null, x2__66588, x1__66585), cassowary.core._.call(null, y2__66589, y1__66586), p1__66553_SHARP_))
    })
  }else {
    return null
  }
};
sketchpad.core.select_closest = function select_closest(e) {
  var vec__66598__66599 = sketchpad.core.event_location.call(null, e);
  var x__66600 = cljs.core.nth.call(null, vec__66598__66599, 0, null);
  var y__66601 = cljs.core.nth.call(null, vec__66598__66599, 1, null);
  cljs.core.swap_BANG_.call(null, sketchpad.core.start_x, cljs.core.constantly.call(null, x__66600));
  cljs.core.swap_BANG_.call(null, sketchpad.core.start_y, cljs.core.constantly.call(null, y__66601));
  return cljs.core.swap_BANG_.call(null, sketchpad.core.current_universe, function(u) {
    return cljs.core.assoc.call(null, u, "\ufdd0'selected", (new cljs.core.Keyword("\ufdd0'highlighted")).call(null, u))
  })
};
sketchpad.core.deselect_selected = function deselect_selected(e) {
  var u__66650 = cljs.core.deref.call(null, sketchpad.core.current_universe);
  var selected__66651 = u__66650.call(null, "\ufdd0'selected");
  var highlighted__66652 = u__66650.call(null, "\ufdd0'highlighted");
  var both_points__66654 = function() {
    var and__3822__auto____66653 = cljs.core.instance_QMARK_.call(null, sketchpad.shapes.Point, u__66650.call(null, selected__66651));
    if(and__3822__auto____66653) {
      return cljs.core.instance_QMARK_.call(null, sketchpad.shapes.Point, u__66650.call(null, highlighted__66652))
    }else {
      return and__3822__auto____66653
    }
  }();
  if(cljs.core.truth_(both_points__66654)) {
    console.log("merging", selected__66651, "and", highlighted__66652);
    cljs.core.swap_BANG_.call(null, sketchpad.core.current_universe, cljs.core.assoc, "\ufdd0'highlighted", null);
    cljs.core.swap_BANG_.call(null, sketchpad.core.current_universe, cljs.core.dissoc, highlighted__66652);
    var G__66655__66657 = cljs.core.seq.call(null, u__66650);
    if(G__66655__66657) {
      var G__66659__66661 = cljs.core.first.call(null, G__66655__66657);
      var vec__66660__66662 = G__66659__66661;
      var name__66663 = cljs.core.nth.call(null, vec__66660__66662, 0, null);
      var item__66664 = cljs.core.nth.call(null, vec__66660__66662, 1, null);
      var G__66655__66665 = G__66655__66657;
      var G__66659__66666 = G__66659__66661;
      var G__66655__66667 = G__66655__66665;
      while(true) {
        var vec__66668__66669 = G__66659__66666;
        var name__66670 = cljs.core.nth.call(null, vec__66668__66669, 0, null);
        var item__66671 = cljs.core.nth.call(null, vec__66668__66669, 1, null);
        var G__66655__66672 = G__66655__66667;
        var G__66656__66673 = cljs.core.seq.call(null, item__66671);
        if(G__66656__66673) {
          var G__66675__66677 = cljs.core.first.call(null, G__66656__66673);
          var vec__66676__66678 = G__66675__66677;
          var key__66679 = cljs.core.nth.call(null, vec__66676__66678, 0, null);
          var val__66680 = cljs.core.nth.call(null, vec__66676__66678, 1, null);
          var G__66656__66681 = G__66656__66673;
          var G__66675__66682 = G__66675__66677;
          var G__66656__66683 = G__66656__66681;
          while(true) {
            var vec__66684__66685 = G__66675__66682;
            var key__66686 = cljs.core.nth.call(null, vec__66684__66685, 0, null);
            var val__66687 = cljs.core.nth.call(null, vec__66684__66685, 1, null);
            var G__66656__66688 = G__66656__66683;
            if(cljs.core.truth_(cassowary.core._EQ_.call(null, val__66687, highlighted__66652))) {
              console.log("setting", name__66670, key__66686, "from", cljs.core.get_in.call(null, cljs.core.deref.call(null, sketchpad.core.current_universe), cljs.core.PersistentVector.fromArray([name__66670, key__66686], true)), "to", selected__66651);
              cljs.core.swap_BANG_.call(null, sketchpad.core.current_universe, cljs.core.assoc_in, cljs.core.PersistentVector.fromArray([name__66670, key__66686], true), selected__66651);
              if(1 < cljs.core.count.call(null, cljs.core.filter.call(null, function(G__66675__66682, G__66656__66683, G__66659__66666, G__66655__66667, vec__66684__66685, key__66686, val__66687, G__66656__66688, G__66675__66677, vec__66676__66678, key__66679, val__66680, G__66656__66681, G__66656__66673, vec__66668__66669, name__66670, item__66671, G__66655__66672) {
                return function(p__66689) {
                  var vec__66690__66691 = p__66689;
                  var key__66692 = cljs.core.nth.call(null, vec__66690__66691, 0, null);
                  var val__66693 = cljs.core.nth.call(null, vec__66690__66691, 1, null);
                  return cassowary.core._EQ_.call(null, val__66693, selected__66651)
                }
              }(G__66675__66682, G__66656__66683, G__66659__66666, G__66655__66667, vec__66684__66685, key__66686, val__66687, G__66656__66688, G__66675__66677, vec__66676__66678, key__66679, val__66680, G__66656__66681, G__66656__66673, vec__66668__66669, name__66670, item__66671, G__66655__66672), item__66671))) {
                cljs.core.swap_BANG_.call(null, sketchpad.core.current_universe, cljs.core.dissoc, name__66670)
              }else {
              }
              console.log(cljs.core.get_in.call(null, cljs.core.deref.call(null, sketchpad.core.current_universe), cljs.core.PersistentVector.fromArray([name__66670, key__66686], true)))
            }else {
            }
            var temp__3974__auto____66694 = cljs.core.next.call(null, G__66656__66688);
            if(temp__3974__auto____66694) {
              var G__66656__66695 = temp__3974__auto____66694;
              var G__66698 = cljs.core.first.call(null, G__66656__66695);
              var G__66699 = G__66656__66695;
              G__66675__66682 = G__66698;
              G__66656__66683 = G__66699;
              continue
            }else {
            }
            break
          }
        }else {
        }
        var temp__3974__auto____66696 = cljs.core.next.call(null, G__66655__66672);
        if(temp__3974__auto____66696) {
          var G__66655__66697 = temp__3974__auto____66696;
          var G__66700 = cljs.core.first.call(null, G__66655__66697);
          var G__66701 = G__66655__66697;
          G__66659__66666 = G__66700;
          G__66655__66667 = G__66701;
          continue
        }else {
        }
        break
      }
    }else {
    }
  }else {
  }
  cljs.core.swap_BANG_.call(null, sketchpad.core.current_universe, cljs.core.assoc, "\ufdd0'selected", null);
  return console.log(cljs.core.deref.call(null, sketchpad.core.current_universe))
};
sketchpad.core.applying_constraints = false;
sketchpad.core.apply_constraints = function apply_constraints(_66711, _66712, _, u) {
  if(cljs.core.not.call(null, sketchpad.core.applying_constraints)) {
    var applying_constraints66713__66714 = sketchpad.core.applying_constraints;
    try {
      sketchpad.core.applying_constraints = true;
      var p1__66716 = u.call(null, "\ufdd0'p1");
      var solver__66717 = cassowary.core.simplex_solver.call(null);
      var p1x__66718 = cassowary.core.cvar.call(null, (new cljs.core.Keyword("\ufdd0'x")).call(null, p1__66716));
      var p1y__66719 = cassowary.core.cvar.call(null, (new cljs.core.Keyword("\ufdd0'y")).call(null, p1__66716));
      cassowary.core.stay_BANG_.call(null, solver__66717, p1x__66718);
      cassowary.core.stay_BANG_.call(null, solver__66717, p1y__66719);
      cassowary.core.constrain_BANG_.call(null, solver__66717, cassowary.core._EQ_.call(null, p1y__66719, cassowary.core._STAR_.call(null, p1x__66718, 0.4)));
      console.log("applying constraints", cassowary.core.value.call(null, p1x__66718), cassowary.core.value.call(null, p1y__66719));
      cljs.core.swap_BANG_.call(null, sketchpad.core.current_universe, cljs.core.assoc_in, cljs.core.PersistentVector.fromArray(["\ufdd0'p1", "\ufdd0'x"], true), cassowary.core.value.call(null, p1x__66718));
      cljs.core.swap_BANG_.call(null, sketchpad.core.current_universe, cljs.core.assoc_in, cljs.core.PersistentVector.fromArray(["\ufdd0'p1", "\ufdd0'y"], true), cassowary.core.value.call(null, p1y__66719));
      return console.log("applied constraints", cljs.core.get_in.call(null, cljs.core.deref.call(null, sketchpad.core.current_universe), cljs.core.PersistentVector.fromArray(["\ufdd0'p1", "\ufdd0'x"], true)))
    }finally {
      sketchpad.core.applying_constraints = applying_constraints66713__66714
    }
  }else {
    return null
  }
};
cljs.core.add_watch.call(null, sketchpad.core.current_universe, "\ufdd0'constrain", sketchpad.core.apply_constraints);
sketchpad.core.main = function main() {
  var canvas__66722 = document.getElementById("canvas");
  var ctx__66723 = canvas__66722.getContext("2d");
  cljs.core.swap_BANG_.call(null, sketchpad.core.current_universe, cljs.core.conj, cljs.core.ObjMap.fromObject(["\ufdd0'p1", "\ufdd0'p3", "\ufdd0'c1", "\ufdd0'p2", "\ufdd0'l2", "\ufdd0'l3", "\ufdd0'p4", "\ufdd0'l1", "\ufdd0'p5", "\ufdd0'l5", "\ufdd0'l4"], {"\ufdd0'p1":new sketchpad.shapes.Point(50, 20), "\ufdd0'p3":new sketchpad.shapes.Point(210, 210), "\ufdd0'c1":new sketchpad.shapes.Circle("\ufdd0'p3", "\ufdd0'p4", "\ufdd0'p5"), "\ufdd0'p2":new sketchpad.shapes.Point(300, 300), "\ufdd0'l2":new sketchpad.shapes.Line("\ufdd0'p2", 
  "\ufdd0'p3"), "\ufdd0'l3":new sketchpad.shapes.Line("\ufdd0'p1", "\ufdd0'p4"), "\ufdd0'p4":new sketchpad.shapes.Point(340, 210), "\ufdd0'l1":new sketchpad.shapes.Line("\ufdd0'p1", "\ufdd0'p2"), "\ufdd0'p5":new sketchpad.shapes.Point(210, 340), "\ufdd0'l5":new sketchpad.shapes.Line("\ufdd0'p3", "\ufdd0'p5"), "\ufdd0'l4":new sketchpad.shapes.Line("\ufdd0'p1", "\ufdd0'p5")}));
  setInterval(function() {
    return sketchpad.core.draw_universe.call(null, cljs.core.deref.call(null, sketchpad.core.current_universe), ctx__66723)
  }, 16);
  canvas__66722.addEventListener("mousemove", sketchpad.core.highlight_closest);
  canvas__66722.addEventListener("mousemove", sketchpad.core.move_selected);
  canvas__66722.addEventListener("mousedown", sketchpad.core.select_closest);
  return canvas__66722.addEventListener("mouseup", sketchpad.core.deselect_selected)
};
goog.exportSymbol("sketchpad.core.main", sketchpad.core.main);
