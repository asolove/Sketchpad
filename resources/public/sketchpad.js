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
  var x__9685 = x == null ? null : x;
  if(p[goog.typeOf(x__9685)]) {
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
    var G__9686__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__9686 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9686__delegate.call(this, array, i, idxs)
    };
    G__9686.cljs$lang$maxFixedArity = 2;
    G__9686.cljs$lang$applyTo = function(arglist__9687) {
      var array = cljs.core.first(arglist__9687);
      var i = cljs.core.first(cljs.core.next(arglist__9687));
      var idxs = cljs.core.rest(cljs.core.next(arglist__9687));
      return G__9686__delegate(array, i, idxs)
    };
    G__9686.cljs$lang$arity$variadic = G__9686__delegate;
    return G__9686
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
      var and__3822__auto____9772 = this$;
      if(and__3822__auto____9772) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____9772
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2418__auto____9773 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9774 = cljs.core._invoke[goog.typeOf(x__2418__auto____9773)];
        if(or__3824__auto____9774) {
          return or__3824__auto____9774
        }else {
          var or__3824__auto____9775 = cljs.core._invoke["_"];
          if(or__3824__auto____9775) {
            return or__3824__auto____9775
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____9776 = this$;
      if(and__3822__auto____9776) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____9776
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2418__auto____9777 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9778 = cljs.core._invoke[goog.typeOf(x__2418__auto____9777)];
        if(or__3824__auto____9778) {
          return or__3824__auto____9778
        }else {
          var or__3824__auto____9779 = cljs.core._invoke["_"];
          if(or__3824__auto____9779) {
            return or__3824__auto____9779
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____9780 = this$;
      if(and__3822__auto____9780) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____9780
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2418__auto____9781 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9782 = cljs.core._invoke[goog.typeOf(x__2418__auto____9781)];
        if(or__3824__auto____9782) {
          return or__3824__auto____9782
        }else {
          var or__3824__auto____9783 = cljs.core._invoke["_"];
          if(or__3824__auto____9783) {
            return or__3824__auto____9783
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____9784 = this$;
      if(and__3822__auto____9784) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____9784
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2418__auto____9785 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9786 = cljs.core._invoke[goog.typeOf(x__2418__auto____9785)];
        if(or__3824__auto____9786) {
          return or__3824__auto____9786
        }else {
          var or__3824__auto____9787 = cljs.core._invoke["_"];
          if(or__3824__auto____9787) {
            return or__3824__auto____9787
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____9788 = this$;
      if(and__3822__auto____9788) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____9788
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2418__auto____9789 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9790 = cljs.core._invoke[goog.typeOf(x__2418__auto____9789)];
        if(or__3824__auto____9790) {
          return or__3824__auto____9790
        }else {
          var or__3824__auto____9791 = cljs.core._invoke["_"];
          if(or__3824__auto____9791) {
            return or__3824__auto____9791
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____9792 = this$;
      if(and__3822__auto____9792) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____9792
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2418__auto____9793 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9794 = cljs.core._invoke[goog.typeOf(x__2418__auto____9793)];
        if(or__3824__auto____9794) {
          return or__3824__auto____9794
        }else {
          var or__3824__auto____9795 = cljs.core._invoke["_"];
          if(or__3824__auto____9795) {
            return or__3824__auto____9795
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____9796 = this$;
      if(and__3822__auto____9796) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____9796
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2418__auto____9797 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9798 = cljs.core._invoke[goog.typeOf(x__2418__auto____9797)];
        if(or__3824__auto____9798) {
          return or__3824__auto____9798
        }else {
          var or__3824__auto____9799 = cljs.core._invoke["_"];
          if(or__3824__auto____9799) {
            return or__3824__auto____9799
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____9800 = this$;
      if(and__3822__auto____9800) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____9800
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2418__auto____9801 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9802 = cljs.core._invoke[goog.typeOf(x__2418__auto____9801)];
        if(or__3824__auto____9802) {
          return or__3824__auto____9802
        }else {
          var or__3824__auto____9803 = cljs.core._invoke["_"];
          if(or__3824__auto____9803) {
            return or__3824__auto____9803
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____9804 = this$;
      if(and__3822__auto____9804) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____9804
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2418__auto____9805 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9806 = cljs.core._invoke[goog.typeOf(x__2418__auto____9805)];
        if(or__3824__auto____9806) {
          return or__3824__auto____9806
        }else {
          var or__3824__auto____9807 = cljs.core._invoke["_"];
          if(or__3824__auto____9807) {
            return or__3824__auto____9807
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____9808 = this$;
      if(and__3822__auto____9808) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____9808
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2418__auto____9809 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9810 = cljs.core._invoke[goog.typeOf(x__2418__auto____9809)];
        if(or__3824__auto____9810) {
          return or__3824__auto____9810
        }else {
          var or__3824__auto____9811 = cljs.core._invoke["_"];
          if(or__3824__auto____9811) {
            return or__3824__auto____9811
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____9812 = this$;
      if(and__3822__auto____9812) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____9812
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2418__auto____9813 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9814 = cljs.core._invoke[goog.typeOf(x__2418__auto____9813)];
        if(or__3824__auto____9814) {
          return or__3824__auto____9814
        }else {
          var or__3824__auto____9815 = cljs.core._invoke["_"];
          if(or__3824__auto____9815) {
            return or__3824__auto____9815
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____9816 = this$;
      if(and__3822__auto____9816) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____9816
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2418__auto____9817 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9818 = cljs.core._invoke[goog.typeOf(x__2418__auto____9817)];
        if(or__3824__auto____9818) {
          return or__3824__auto____9818
        }else {
          var or__3824__auto____9819 = cljs.core._invoke["_"];
          if(or__3824__auto____9819) {
            return or__3824__auto____9819
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____9820 = this$;
      if(and__3822__auto____9820) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____9820
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2418__auto____9821 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9822 = cljs.core._invoke[goog.typeOf(x__2418__auto____9821)];
        if(or__3824__auto____9822) {
          return or__3824__auto____9822
        }else {
          var or__3824__auto____9823 = cljs.core._invoke["_"];
          if(or__3824__auto____9823) {
            return or__3824__auto____9823
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____9824 = this$;
      if(and__3822__auto____9824) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____9824
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2418__auto____9825 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9826 = cljs.core._invoke[goog.typeOf(x__2418__auto____9825)];
        if(or__3824__auto____9826) {
          return or__3824__auto____9826
        }else {
          var or__3824__auto____9827 = cljs.core._invoke["_"];
          if(or__3824__auto____9827) {
            return or__3824__auto____9827
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____9828 = this$;
      if(and__3822__auto____9828) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____9828
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2418__auto____9829 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9830 = cljs.core._invoke[goog.typeOf(x__2418__auto____9829)];
        if(or__3824__auto____9830) {
          return or__3824__auto____9830
        }else {
          var or__3824__auto____9831 = cljs.core._invoke["_"];
          if(or__3824__auto____9831) {
            return or__3824__auto____9831
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____9832 = this$;
      if(and__3822__auto____9832) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____9832
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2418__auto____9833 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9834 = cljs.core._invoke[goog.typeOf(x__2418__auto____9833)];
        if(or__3824__auto____9834) {
          return or__3824__auto____9834
        }else {
          var or__3824__auto____9835 = cljs.core._invoke["_"];
          if(or__3824__auto____9835) {
            return or__3824__auto____9835
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____9836 = this$;
      if(and__3822__auto____9836) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____9836
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2418__auto____9837 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9838 = cljs.core._invoke[goog.typeOf(x__2418__auto____9837)];
        if(or__3824__auto____9838) {
          return or__3824__auto____9838
        }else {
          var or__3824__auto____9839 = cljs.core._invoke["_"];
          if(or__3824__auto____9839) {
            return or__3824__auto____9839
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____9840 = this$;
      if(and__3822__auto____9840) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____9840
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2418__auto____9841 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9842 = cljs.core._invoke[goog.typeOf(x__2418__auto____9841)];
        if(or__3824__auto____9842) {
          return or__3824__auto____9842
        }else {
          var or__3824__auto____9843 = cljs.core._invoke["_"];
          if(or__3824__auto____9843) {
            return or__3824__auto____9843
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____9844 = this$;
      if(and__3822__auto____9844) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____9844
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2418__auto____9845 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9846 = cljs.core._invoke[goog.typeOf(x__2418__auto____9845)];
        if(or__3824__auto____9846) {
          return or__3824__auto____9846
        }else {
          var or__3824__auto____9847 = cljs.core._invoke["_"];
          if(or__3824__auto____9847) {
            return or__3824__auto____9847
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____9848 = this$;
      if(and__3822__auto____9848) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____9848
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2418__auto____9849 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9850 = cljs.core._invoke[goog.typeOf(x__2418__auto____9849)];
        if(or__3824__auto____9850) {
          return or__3824__auto____9850
        }else {
          var or__3824__auto____9851 = cljs.core._invoke["_"];
          if(or__3824__auto____9851) {
            return or__3824__auto____9851
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____9852 = this$;
      if(and__3822__auto____9852) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____9852
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2418__auto____9853 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____9854 = cljs.core._invoke[goog.typeOf(x__2418__auto____9853)];
        if(or__3824__auto____9854) {
          return or__3824__auto____9854
        }else {
          var or__3824__auto____9855 = cljs.core._invoke["_"];
          if(or__3824__auto____9855) {
            return or__3824__auto____9855
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
    var and__3822__auto____9860 = coll;
    if(and__3822__auto____9860) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____9860
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2418__auto____9861 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9862 = cljs.core._count[goog.typeOf(x__2418__auto____9861)];
      if(or__3824__auto____9862) {
        return or__3824__auto____9862
      }else {
        var or__3824__auto____9863 = cljs.core._count["_"];
        if(or__3824__auto____9863) {
          return or__3824__auto____9863
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
    var and__3822__auto____9868 = coll;
    if(and__3822__auto____9868) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____9868
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2418__auto____9869 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9870 = cljs.core._empty[goog.typeOf(x__2418__auto____9869)];
      if(or__3824__auto____9870) {
        return or__3824__auto____9870
      }else {
        var or__3824__auto____9871 = cljs.core._empty["_"];
        if(or__3824__auto____9871) {
          return or__3824__auto____9871
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
    var and__3822__auto____9876 = coll;
    if(and__3822__auto____9876) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____9876
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2418__auto____9877 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9878 = cljs.core._conj[goog.typeOf(x__2418__auto____9877)];
      if(or__3824__auto____9878) {
        return or__3824__auto____9878
      }else {
        var or__3824__auto____9879 = cljs.core._conj["_"];
        if(or__3824__auto____9879) {
          return or__3824__auto____9879
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
      var and__3822__auto____9888 = coll;
      if(and__3822__auto____9888) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____9888
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2418__auto____9889 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____9890 = cljs.core._nth[goog.typeOf(x__2418__auto____9889)];
        if(or__3824__auto____9890) {
          return or__3824__auto____9890
        }else {
          var or__3824__auto____9891 = cljs.core._nth["_"];
          if(or__3824__auto____9891) {
            return or__3824__auto____9891
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____9892 = coll;
      if(and__3822__auto____9892) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____9892
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2418__auto____9893 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____9894 = cljs.core._nth[goog.typeOf(x__2418__auto____9893)];
        if(or__3824__auto____9894) {
          return or__3824__auto____9894
        }else {
          var or__3824__auto____9895 = cljs.core._nth["_"];
          if(or__3824__auto____9895) {
            return or__3824__auto____9895
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
    var and__3822__auto____9900 = coll;
    if(and__3822__auto____9900) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____9900
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2418__auto____9901 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9902 = cljs.core._first[goog.typeOf(x__2418__auto____9901)];
      if(or__3824__auto____9902) {
        return or__3824__auto____9902
      }else {
        var or__3824__auto____9903 = cljs.core._first["_"];
        if(or__3824__auto____9903) {
          return or__3824__auto____9903
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____9908 = coll;
    if(and__3822__auto____9908) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____9908
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2418__auto____9909 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9910 = cljs.core._rest[goog.typeOf(x__2418__auto____9909)];
      if(or__3824__auto____9910) {
        return or__3824__auto____9910
      }else {
        var or__3824__auto____9911 = cljs.core._rest["_"];
        if(or__3824__auto____9911) {
          return or__3824__auto____9911
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
    var and__3822__auto____9916 = coll;
    if(and__3822__auto____9916) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____9916
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2418__auto____9917 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9918 = cljs.core._next[goog.typeOf(x__2418__auto____9917)];
      if(or__3824__auto____9918) {
        return or__3824__auto____9918
      }else {
        var or__3824__auto____9919 = cljs.core._next["_"];
        if(or__3824__auto____9919) {
          return or__3824__auto____9919
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
      var and__3822__auto____9928 = o;
      if(and__3822__auto____9928) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____9928
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2418__auto____9929 = o == null ? null : o;
      return function() {
        var or__3824__auto____9930 = cljs.core._lookup[goog.typeOf(x__2418__auto____9929)];
        if(or__3824__auto____9930) {
          return or__3824__auto____9930
        }else {
          var or__3824__auto____9931 = cljs.core._lookup["_"];
          if(or__3824__auto____9931) {
            return or__3824__auto____9931
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____9932 = o;
      if(and__3822__auto____9932) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____9932
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2418__auto____9933 = o == null ? null : o;
      return function() {
        var or__3824__auto____9934 = cljs.core._lookup[goog.typeOf(x__2418__auto____9933)];
        if(or__3824__auto____9934) {
          return or__3824__auto____9934
        }else {
          var or__3824__auto____9935 = cljs.core._lookup["_"];
          if(or__3824__auto____9935) {
            return or__3824__auto____9935
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
    var and__3822__auto____9940 = coll;
    if(and__3822__auto____9940) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____9940
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2418__auto____9941 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9942 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2418__auto____9941)];
      if(or__3824__auto____9942) {
        return or__3824__auto____9942
      }else {
        var or__3824__auto____9943 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____9943) {
          return or__3824__auto____9943
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____9948 = coll;
    if(and__3822__auto____9948) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____9948
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2418__auto____9949 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9950 = cljs.core._assoc[goog.typeOf(x__2418__auto____9949)];
      if(or__3824__auto____9950) {
        return or__3824__auto____9950
      }else {
        var or__3824__auto____9951 = cljs.core._assoc["_"];
        if(or__3824__auto____9951) {
          return or__3824__auto____9951
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
    var and__3822__auto____9956 = coll;
    if(and__3822__auto____9956) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____9956
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2418__auto____9957 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9958 = cljs.core._dissoc[goog.typeOf(x__2418__auto____9957)];
      if(or__3824__auto____9958) {
        return or__3824__auto____9958
      }else {
        var or__3824__auto____9959 = cljs.core._dissoc["_"];
        if(or__3824__auto____9959) {
          return or__3824__auto____9959
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
    var and__3822__auto____9964 = coll;
    if(and__3822__auto____9964) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____9964
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2418__auto____9965 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9966 = cljs.core._key[goog.typeOf(x__2418__auto____9965)];
      if(or__3824__auto____9966) {
        return or__3824__auto____9966
      }else {
        var or__3824__auto____9967 = cljs.core._key["_"];
        if(or__3824__auto____9967) {
          return or__3824__auto____9967
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____9972 = coll;
    if(and__3822__auto____9972) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____9972
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2418__auto____9973 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9974 = cljs.core._val[goog.typeOf(x__2418__auto____9973)];
      if(or__3824__auto____9974) {
        return or__3824__auto____9974
      }else {
        var or__3824__auto____9975 = cljs.core._val["_"];
        if(or__3824__auto____9975) {
          return or__3824__auto____9975
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
    var and__3822__auto____9980 = coll;
    if(and__3822__auto____9980) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____9980
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2418__auto____9981 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9982 = cljs.core._disjoin[goog.typeOf(x__2418__auto____9981)];
      if(or__3824__auto____9982) {
        return or__3824__auto____9982
      }else {
        var or__3824__auto____9983 = cljs.core._disjoin["_"];
        if(or__3824__auto____9983) {
          return or__3824__auto____9983
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
    var and__3822__auto____9988 = coll;
    if(and__3822__auto____9988) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____9988
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2418__auto____9989 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9990 = cljs.core._peek[goog.typeOf(x__2418__auto____9989)];
      if(or__3824__auto____9990) {
        return or__3824__auto____9990
      }else {
        var or__3824__auto____9991 = cljs.core._peek["_"];
        if(or__3824__auto____9991) {
          return or__3824__auto____9991
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____9996 = coll;
    if(and__3822__auto____9996) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____9996
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2418__auto____9997 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____9998 = cljs.core._pop[goog.typeOf(x__2418__auto____9997)];
      if(or__3824__auto____9998) {
        return or__3824__auto____9998
      }else {
        var or__3824__auto____9999 = cljs.core._pop["_"];
        if(or__3824__auto____9999) {
          return or__3824__auto____9999
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
    var and__3822__auto____10004 = coll;
    if(and__3822__auto____10004) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____10004
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2418__auto____10005 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____10006 = cljs.core._assoc_n[goog.typeOf(x__2418__auto____10005)];
      if(or__3824__auto____10006) {
        return or__3824__auto____10006
      }else {
        var or__3824__auto____10007 = cljs.core._assoc_n["_"];
        if(or__3824__auto____10007) {
          return or__3824__auto____10007
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
    var and__3822__auto____10012 = o;
    if(and__3822__auto____10012) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____10012
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2418__auto____10013 = o == null ? null : o;
    return function() {
      var or__3824__auto____10014 = cljs.core._deref[goog.typeOf(x__2418__auto____10013)];
      if(or__3824__auto____10014) {
        return or__3824__auto____10014
      }else {
        var or__3824__auto____10015 = cljs.core._deref["_"];
        if(or__3824__auto____10015) {
          return or__3824__auto____10015
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
    var and__3822__auto____10020 = o;
    if(and__3822__auto____10020) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____10020
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2418__auto____10021 = o == null ? null : o;
    return function() {
      var or__3824__auto____10022 = cljs.core._deref_with_timeout[goog.typeOf(x__2418__auto____10021)];
      if(or__3824__auto____10022) {
        return or__3824__auto____10022
      }else {
        var or__3824__auto____10023 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____10023) {
          return or__3824__auto____10023
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
    var and__3822__auto____10028 = o;
    if(and__3822__auto____10028) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____10028
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2418__auto____10029 = o == null ? null : o;
    return function() {
      var or__3824__auto____10030 = cljs.core._meta[goog.typeOf(x__2418__auto____10029)];
      if(or__3824__auto____10030) {
        return or__3824__auto____10030
      }else {
        var or__3824__auto____10031 = cljs.core._meta["_"];
        if(or__3824__auto____10031) {
          return or__3824__auto____10031
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
    var and__3822__auto____10036 = o;
    if(and__3822__auto____10036) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____10036
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2418__auto____10037 = o == null ? null : o;
    return function() {
      var or__3824__auto____10038 = cljs.core._with_meta[goog.typeOf(x__2418__auto____10037)];
      if(or__3824__auto____10038) {
        return or__3824__auto____10038
      }else {
        var or__3824__auto____10039 = cljs.core._with_meta["_"];
        if(or__3824__auto____10039) {
          return or__3824__auto____10039
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
      var and__3822__auto____10048 = coll;
      if(and__3822__auto____10048) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____10048
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2418__auto____10049 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____10050 = cljs.core._reduce[goog.typeOf(x__2418__auto____10049)];
        if(or__3824__auto____10050) {
          return or__3824__auto____10050
        }else {
          var or__3824__auto____10051 = cljs.core._reduce["_"];
          if(or__3824__auto____10051) {
            return or__3824__auto____10051
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____10052 = coll;
      if(and__3822__auto____10052) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____10052
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2418__auto____10053 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____10054 = cljs.core._reduce[goog.typeOf(x__2418__auto____10053)];
        if(or__3824__auto____10054) {
          return or__3824__auto____10054
        }else {
          var or__3824__auto____10055 = cljs.core._reduce["_"];
          if(or__3824__auto____10055) {
            return or__3824__auto____10055
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
    var and__3822__auto____10060 = coll;
    if(and__3822__auto____10060) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____10060
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2418__auto____10061 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____10062 = cljs.core._kv_reduce[goog.typeOf(x__2418__auto____10061)];
      if(or__3824__auto____10062) {
        return or__3824__auto____10062
      }else {
        var or__3824__auto____10063 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____10063) {
          return or__3824__auto____10063
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
    var and__3822__auto____10068 = o;
    if(and__3822__auto____10068) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____10068
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2418__auto____10069 = o == null ? null : o;
    return function() {
      var or__3824__auto____10070 = cljs.core._equiv[goog.typeOf(x__2418__auto____10069)];
      if(or__3824__auto____10070) {
        return or__3824__auto____10070
      }else {
        var or__3824__auto____10071 = cljs.core._equiv["_"];
        if(or__3824__auto____10071) {
          return or__3824__auto____10071
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
    var and__3822__auto____10076 = o;
    if(and__3822__auto____10076) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____10076
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2418__auto____10077 = o == null ? null : o;
    return function() {
      var or__3824__auto____10078 = cljs.core._hash[goog.typeOf(x__2418__auto____10077)];
      if(or__3824__auto____10078) {
        return or__3824__auto____10078
      }else {
        var or__3824__auto____10079 = cljs.core._hash["_"];
        if(or__3824__auto____10079) {
          return or__3824__auto____10079
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
    var and__3822__auto____10084 = o;
    if(and__3822__auto____10084) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____10084
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2418__auto____10085 = o == null ? null : o;
    return function() {
      var or__3824__auto____10086 = cljs.core._seq[goog.typeOf(x__2418__auto____10085)];
      if(or__3824__auto____10086) {
        return or__3824__auto____10086
      }else {
        var or__3824__auto____10087 = cljs.core._seq["_"];
        if(or__3824__auto____10087) {
          return or__3824__auto____10087
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
    var and__3822__auto____10092 = coll;
    if(and__3822__auto____10092) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____10092
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2418__auto____10093 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____10094 = cljs.core._rseq[goog.typeOf(x__2418__auto____10093)];
      if(or__3824__auto____10094) {
        return or__3824__auto____10094
      }else {
        var or__3824__auto____10095 = cljs.core._rseq["_"];
        if(or__3824__auto____10095) {
          return or__3824__auto____10095
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
    var and__3822__auto____10100 = coll;
    if(and__3822__auto____10100) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____10100
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2418__auto____10101 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____10102 = cljs.core._sorted_seq[goog.typeOf(x__2418__auto____10101)];
      if(or__3824__auto____10102) {
        return or__3824__auto____10102
      }else {
        var or__3824__auto____10103 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____10103) {
          return or__3824__auto____10103
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____10108 = coll;
    if(and__3822__auto____10108) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____10108
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2418__auto____10109 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____10110 = cljs.core._sorted_seq_from[goog.typeOf(x__2418__auto____10109)];
      if(or__3824__auto____10110) {
        return or__3824__auto____10110
      }else {
        var or__3824__auto____10111 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____10111) {
          return or__3824__auto____10111
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____10116 = coll;
    if(and__3822__auto____10116) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____10116
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2418__auto____10117 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____10118 = cljs.core._entry_key[goog.typeOf(x__2418__auto____10117)];
      if(or__3824__auto____10118) {
        return or__3824__auto____10118
      }else {
        var or__3824__auto____10119 = cljs.core._entry_key["_"];
        if(or__3824__auto____10119) {
          return or__3824__auto____10119
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____10124 = coll;
    if(and__3822__auto____10124) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____10124
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2418__auto____10125 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____10126 = cljs.core._comparator[goog.typeOf(x__2418__auto____10125)];
      if(or__3824__auto____10126) {
        return or__3824__auto____10126
      }else {
        var or__3824__auto____10127 = cljs.core._comparator["_"];
        if(or__3824__auto____10127) {
          return or__3824__auto____10127
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
    var and__3822__auto____10132 = o;
    if(and__3822__auto____10132) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____10132
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2418__auto____10133 = o == null ? null : o;
    return function() {
      var or__3824__auto____10134 = cljs.core._pr_seq[goog.typeOf(x__2418__auto____10133)];
      if(or__3824__auto____10134) {
        return or__3824__auto____10134
      }else {
        var or__3824__auto____10135 = cljs.core._pr_seq["_"];
        if(or__3824__auto____10135) {
          return or__3824__auto____10135
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
    var and__3822__auto____10140 = d;
    if(and__3822__auto____10140) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____10140
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2418__auto____10141 = d == null ? null : d;
    return function() {
      var or__3824__auto____10142 = cljs.core._realized_QMARK_[goog.typeOf(x__2418__auto____10141)];
      if(or__3824__auto____10142) {
        return or__3824__auto____10142
      }else {
        var or__3824__auto____10143 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____10143) {
          return or__3824__auto____10143
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
    var and__3822__auto____10148 = this$;
    if(and__3822__auto____10148) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____10148
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2418__auto____10149 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____10150 = cljs.core._notify_watches[goog.typeOf(x__2418__auto____10149)];
      if(or__3824__auto____10150) {
        return or__3824__auto____10150
      }else {
        var or__3824__auto____10151 = cljs.core._notify_watches["_"];
        if(or__3824__auto____10151) {
          return or__3824__auto____10151
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____10156 = this$;
    if(and__3822__auto____10156) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____10156
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2418__auto____10157 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____10158 = cljs.core._add_watch[goog.typeOf(x__2418__auto____10157)];
      if(or__3824__auto____10158) {
        return or__3824__auto____10158
      }else {
        var or__3824__auto____10159 = cljs.core._add_watch["_"];
        if(or__3824__auto____10159) {
          return or__3824__auto____10159
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____10164 = this$;
    if(and__3822__auto____10164) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____10164
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2418__auto____10165 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____10166 = cljs.core._remove_watch[goog.typeOf(x__2418__auto____10165)];
      if(or__3824__auto____10166) {
        return or__3824__auto____10166
      }else {
        var or__3824__auto____10167 = cljs.core._remove_watch["_"];
        if(or__3824__auto____10167) {
          return or__3824__auto____10167
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
    var and__3822__auto____10172 = coll;
    if(and__3822__auto____10172) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____10172
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2418__auto____10173 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____10174 = cljs.core._as_transient[goog.typeOf(x__2418__auto____10173)];
      if(or__3824__auto____10174) {
        return or__3824__auto____10174
      }else {
        var or__3824__auto____10175 = cljs.core._as_transient["_"];
        if(or__3824__auto____10175) {
          return or__3824__auto____10175
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
    var and__3822__auto____10180 = tcoll;
    if(and__3822__auto____10180) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____10180
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2418__auto____10181 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____10182 = cljs.core._conj_BANG_[goog.typeOf(x__2418__auto____10181)];
      if(or__3824__auto____10182) {
        return or__3824__auto____10182
      }else {
        var or__3824__auto____10183 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____10183) {
          return or__3824__auto____10183
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____10188 = tcoll;
    if(and__3822__auto____10188) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____10188
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2418__auto____10189 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____10190 = cljs.core._persistent_BANG_[goog.typeOf(x__2418__auto____10189)];
      if(or__3824__auto____10190) {
        return or__3824__auto____10190
      }else {
        var or__3824__auto____10191 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____10191) {
          return or__3824__auto____10191
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
    var and__3822__auto____10196 = tcoll;
    if(and__3822__auto____10196) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____10196
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2418__auto____10197 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____10198 = cljs.core._assoc_BANG_[goog.typeOf(x__2418__auto____10197)];
      if(or__3824__auto____10198) {
        return or__3824__auto____10198
      }else {
        var or__3824__auto____10199 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____10199) {
          return or__3824__auto____10199
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
    var and__3822__auto____10204 = tcoll;
    if(and__3822__auto____10204) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____10204
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2418__auto____10205 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____10206 = cljs.core._dissoc_BANG_[goog.typeOf(x__2418__auto____10205)];
      if(or__3824__auto____10206) {
        return or__3824__auto____10206
      }else {
        var or__3824__auto____10207 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____10207) {
          return or__3824__auto____10207
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
    var and__3822__auto____10212 = tcoll;
    if(and__3822__auto____10212) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____10212
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2418__auto____10213 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____10214 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2418__auto____10213)];
      if(or__3824__auto____10214) {
        return or__3824__auto____10214
      }else {
        var or__3824__auto____10215 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____10215) {
          return or__3824__auto____10215
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____10220 = tcoll;
    if(and__3822__auto____10220) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____10220
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2418__auto____10221 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____10222 = cljs.core._pop_BANG_[goog.typeOf(x__2418__auto____10221)];
      if(or__3824__auto____10222) {
        return or__3824__auto____10222
      }else {
        var or__3824__auto____10223 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____10223) {
          return or__3824__auto____10223
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
    var and__3822__auto____10228 = tcoll;
    if(and__3822__auto____10228) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____10228
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2418__auto____10229 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____10230 = cljs.core._disjoin_BANG_[goog.typeOf(x__2418__auto____10229)];
      if(or__3824__auto____10230) {
        return or__3824__auto____10230
      }else {
        var or__3824__auto____10231 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____10231) {
          return or__3824__auto____10231
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
    var and__3822__auto____10236 = x;
    if(and__3822__auto____10236) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____10236
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2418__auto____10237 = x == null ? null : x;
    return function() {
      var or__3824__auto____10238 = cljs.core._compare[goog.typeOf(x__2418__auto____10237)];
      if(or__3824__auto____10238) {
        return or__3824__auto____10238
      }else {
        var or__3824__auto____10239 = cljs.core._compare["_"];
        if(or__3824__auto____10239) {
          return or__3824__auto____10239
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
    var and__3822__auto____10244 = coll;
    if(and__3822__auto____10244) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____10244
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2418__auto____10245 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____10246 = cljs.core._drop_first[goog.typeOf(x__2418__auto____10245)];
      if(or__3824__auto____10246) {
        return or__3824__auto____10246
      }else {
        var or__3824__auto____10247 = cljs.core._drop_first["_"];
        if(or__3824__auto____10247) {
          return or__3824__auto____10247
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
    var and__3822__auto____10252 = coll;
    if(and__3822__auto____10252) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____10252
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2418__auto____10253 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____10254 = cljs.core._chunked_first[goog.typeOf(x__2418__auto____10253)];
      if(or__3824__auto____10254) {
        return or__3824__auto____10254
      }else {
        var or__3824__auto____10255 = cljs.core._chunked_first["_"];
        if(or__3824__auto____10255) {
          return or__3824__auto____10255
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____10260 = coll;
    if(and__3822__auto____10260) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____10260
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2418__auto____10261 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____10262 = cljs.core._chunked_rest[goog.typeOf(x__2418__auto____10261)];
      if(or__3824__auto____10262) {
        return or__3824__auto____10262
      }else {
        var or__3824__auto____10263 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____10263) {
          return or__3824__auto____10263
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
    var and__3822__auto____10268 = coll;
    if(and__3822__auto____10268) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____10268
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2418__auto____10269 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____10270 = cljs.core._chunked_next[goog.typeOf(x__2418__auto____10269)];
      if(or__3824__auto____10270) {
        return or__3824__auto____10270
      }else {
        var or__3824__auto____10271 = cljs.core._chunked_next["_"];
        if(or__3824__auto____10271) {
          return or__3824__auto____10271
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
    var or__3824__auto____10273 = x === y;
    if(or__3824__auto____10273) {
      return or__3824__auto____10273
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__10274__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__10275 = y;
            var G__10276 = cljs.core.first.call(null, more);
            var G__10277 = cljs.core.next.call(null, more);
            x = G__10275;
            y = G__10276;
            more = G__10277;
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
    var G__10274 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10274__delegate.call(this, x, y, more)
    };
    G__10274.cljs$lang$maxFixedArity = 2;
    G__10274.cljs$lang$applyTo = function(arglist__10278) {
      var x = cljs.core.first(arglist__10278);
      var y = cljs.core.first(cljs.core.next(arglist__10278));
      var more = cljs.core.rest(cljs.core.next(arglist__10278));
      return G__10274__delegate(x, y, more)
    };
    G__10274.cljs$lang$arity$variadic = G__10274__delegate;
    return G__10274
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
  var G__10279 = null;
  var G__10279__2 = function(o, k) {
    return null
  };
  var G__10279__3 = function(o, k, not_found) {
    return not_found
  };
  G__10279 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10279__2.call(this, o, k);
      case 3:
        return G__10279__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10279
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
  var G__10280 = null;
  var G__10280__2 = function(_, f) {
    return f.call(null)
  };
  var G__10280__3 = function(_, f, start) {
    return start
  };
  G__10280 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10280__2.call(this, _, f);
      case 3:
        return G__10280__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10280
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
  var G__10281 = null;
  var G__10281__2 = function(_, n) {
    return null
  };
  var G__10281__3 = function(_, n, not_found) {
    return not_found
  };
  G__10281 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10281__2.call(this, _, n);
      case 3:
        return G__10281__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10281
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
  var and__3822__auto____10282 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____10282) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____10282
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
    var cnt__10295 = cljs.core._count.call(null, cicoll);
    if(cnt__10295 === 0) {
      return f.call(null)
    }else {
      var val__10296 = cljs.core._nth.call(null, cicoll, 0);
      var n__10297 = 1;
      while(true) {
        if(n__10297 < cnt__10295) {
          var nval__10298 = f.call(null, val__10296, cljs.core._nth.call(null, cicoll, n__10297));
          if(cljs.core.reduced_QMARK_.call(null, nval__10298)) {
            return cljs.core.deref.call(null, nval__10298)
          }else {
            var G__10307 = nval__10298;
            var G__10308 = n__10297 + 1;
            val__10296 = G__10307;
            n__10297 = G__10308;
            continue
          }
        }else {
          return val__10296
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__10299 = cljs.core._count.call(null, cicoll);
    var val__10300 = val;
    var n__10301 = 0;
    while(true) {
      if(n__10301 < cnt__10299) {
        var nval__10302 = f.call(null, val__10300, cljs.core._nth.call(null, cicoll, n__10301));
        if(cljs.core.reduced_QMARK_.call(null, nval__10302)) {
          return cljs.core.deref.call(null, nval__10302)
        }else {
          var G__10309 = nval__10302;
          var G__10310 = n__10301 + 1;
          val__10300 = G__10309;
          n__10301 = G__10310;
          continue
        }
      }else {
        return val__10300
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__10303 = cljs.core._count.call(null, cicoll);
    var val__10304 = val;
    var n__10305 = idx;
    while(true) {
      if(n__10305 < cnt__10303) {
        var nval__10306 = f.call(null, val__10304, cljs.core._nth.call(null, cicoll, n__10305));
        if(cljs.core.reduced_QMARK_.call(null, nval__10306)) {
          return cljs.core.deref.call(null, nval__10306)
        }else {
          var G__10311 = nval__10306;
          var G__10312 = n__10305 + 1;
          val__10304 = G__10311;
          n__10305 = G__10312;
          continue
        }
      }else {
        return val__10304
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
    var cnt__10325 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__10326 = arr[0];
      var n__10327 = 1;
      while(true) {
        if(n__10327 < cnt__10325) {
          var nval__10328 = f.call(null, val__10326, arr[n__10327]);
          if(cljs.core.reduced_QMARK_.call(null, nval__10328)) {
            return cljs.core.deref.call(null, nval__10328)
          }else {
            var G__10337 = nval__10328;
            var G__10338 = n__10327 + 1;
            val__10326 = G__10337;
            n__10327 = G__10338;
            continue
          }
        }else {
          return val__10326
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__10329 = arr.length;
    var val__10330 = val;
    var n__10331 = 0;
    while(true) {
      if(n__10331 < cnt__10329) {
        var nval__10332 = f.call(null, val__10330, arr[n__10331]);
        if(cljs.core.reduced_QMARK_.call(null, nval__10332)) {
          return cljs.core.deref.call(null, nval__10332)
        }else {
          var G__10339 = nval__10332;
          var G__10340 = n__10331 + 1;
          val__10330 = G__10339;
          n__10331 = G__10340;
          continue
        }
      }else {
        return val__10330
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__10333 = arr.length;
    var val__10334 = val;
    var n__10335 = idx;
    while(true) {
      if(n__10335 < cnt__10333) {
        var nval__10336 = f.call(null, val__10334, arr[n__10335]);
        if(cljs.core.reduced_QMARK_.call(null, nval__10336)) {
          return cljs.core.deref.call(null, nval__10336)
        }else {
          var G__10341 = nval__10336;
          var G__10342 = n__10335 + 1;
          val__10334 = G__10341;
          n__10335 = G__10342;
          continue
        }
      }else {
        return val__10334
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
  var this__10343 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__10344 = this;
  if(this__10344.i + 1 < this__10344.a.length) {
    return new cljs.core.IndexedSeq(this__10344.a, this__10344.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10345 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10346 = this;
  var c__10347 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__10347 > 0) {
    return new cljs.core.RSeq(coll, c__10347 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__10348 = this;
  var this__10349 = this;
  return cljs.core.pr_str.call(null, this__10349)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__10350 = this;
  if(cljs.core.counted_QMARK_.call(null, this__10350.a)) {
    return cljs.core.ci_reduce.call(null, this__10350.a, f, this__10350.a[this__10350.i], this__10350.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__10350.a[this__10350.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__10351 = this;
  if(cljs.core.counted_QMARK_.call(null, this__10351.a)) {
    return cljs.core.ci_reduce.call(null, this__10351.a, f, start, this__10351.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10352 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__10353 = this;
  return this__10353.a.length - this__10353.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__10354 = this;
  return this__10354.a[this__10354.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__10355 = this;
  if(this__10355.i + 1 < this__10355.a.length) {
    return new cljs.core.IndexedSeq(this__10355.a, this__10355.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10356 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__10357 = this;
  var i__10358 = n + this__10357.i;
  if(i__10358 < this__10357.a.length) {
    return this__10357.a[i__10358]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__10359 = this;
  var i__10360 = n + this__10359.i;
  if(i__10360 < this__10359.a.length) {
    return this__10359.a[i__10360]
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
  var G__10361 = null;
  var G__10361__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__10361__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__10361 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10361__2.call(this, array, f);
      case 3:
        return G__10361__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10361
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__10362 = null;
  var G__10362__2 = function(array, k) {
    return array[k]
  };
  var G__10362__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__10362 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10362__2.call(this, array, k);
      case 3:
        return G__10362__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10362
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__10363 = null;
  var G__10363__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__10363__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__10363 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10363__2.call(this, array, n);
      case 3:
        return G__10363__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10363
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
  var this__10364 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10365 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__10366 = this;
  var this__10367 = this;
  return cljs.core.pr_str.call(null, this__10367)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10368 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10369 = this;
  return this__10369.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10370 = this;
  return cljs.core._nth.call(null, this__10370.ci, this__10370.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10371 = this;
  if(this__10371.i > 0) {
    return new cljs.core.RSeq(this__10371.ci, this__10371.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10372 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__10373 = this;
  return new cljs.core.RSeq(this__10373.ci, this__10373.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10374 = this;
  return this__10374.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__10378__10379 = coll;
      if(G__10378__10379) {
        if(function() {
          var or__3824__auto____10380 = G__10378__10379.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____10380) {
            return or__3824__auto____10380
          }else {
            return G__10378__10379.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__10378__10379.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__10378__10379)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__10378__10379)
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
      var G__10385__10386 = coll;
      if(G__10385__10386) {
        if(function() {
          var or__3824__auto____10387 = G__10385__10386.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____10387) {
            return or__3824__auto____10387
          }else {
            return G__10385__10386.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__10385__10386.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10385__10386)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10385__10386)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__10388 = cljs.core.seq.call(null, coll);
      if(s__10388 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__10388)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__10393__10394 = coll;
      if(G__10393__10394) {
        if(function() {
          var or__3824__auto____10395 = G__10393__10394.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____10395) {
            return or__3824__auto____10395
          }else {
            return G__10393__10394.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__10393__10394.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10393__10394)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10393__10394)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__10396 = cljs.core.seq.call(null, coll);
      if(!(s__10396 == null)) {
        return cljs.core._rest.call(null, s__10396)
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
      var G__10400__10401 = coll;
      if(G__10400__10401) {
        if(function() {
          var or__3824__auto____10402 = G__10400__10401.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____10402) {
            return or__3824__auto____10402
          }else {
            return G__10400__10401.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__10400__10401.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__10400__10401)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__10400__10401)
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
    var sn__10404 = cljs.core.next.call(null, s);
    if(!(sn__10404 == null)) {
      var G__10405 = sn__10404;
      s = G__10405;
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
    var G__10406__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__10407 = conj.call(null, coll, x);
          var G__10408 = cljs.core.first.call(null, xs);
          var G__10409 = cljs.core.next.call(null, xs);
          coll = G__10407;
          x = G__10408;
          xs = G__10409;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__10406 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10406__delegate.call(this, coll, x, xs)
    };
    G__10406.cljs$lang$maxFixedArity = 2;
    G__10406.cljs$lang$applyTo = function(arglist__10410) {
      var coll = cljs.core.first(arglist__10410);
      var x = cljs.core.first(cljs.core.next(arglist__10410));
      var xs = cljs.core.rest(cljs.core.next(arglist__10410));
      return G__10406__delegate(coll, x, xs)
    };
    G__10406.cljs$lang$arity$variadic = G__10406__delegate;
    return G__10406
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
  var s__10413 = cljs.core.seq.call(null, coll);
  var acc__10414 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__10413)) {
      return acc__10414 + cljs.core._count.call(null, s__10413)
    }else {
      var G__10415 = cljs.core.next.call(null, s__10413);
      var G__10416 = acc__10414 + 1;
      s__10413 = G__10415;
      acc__10414 = G__10416;
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
        var G__10423__10424 = coll;
        if(G__10423__10424) {
          if(function() {
            var or__3824__auto____10425 = G__10423__10424.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____10425) {
              return or__3824__auto____10425
            }else {
              return G__10423__10424.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__10423__10424.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__10423__10424)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__10423__10424)
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
        var G__10426__10427 = coll;
        if(G__10426__10427) {
          if(function() {
            var or__3824__auto____10428 = G__10426__10427.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____10428) {
              return or__3824__auto____10428
            }else {
              return G__10426__10427.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__10426__10427.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__10426__10427)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__10426__10427)
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
    var G__10431__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__10430 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__10432 = ret__10430;
          var G__10433 = cljs.core.first.call(null, kvs);
          var G__10434 = cljs.core.second.call(null, kvs);
          var G__10435 = cljs.core.nnext.call(null, kvs);
          coll = G__10432;
          k = G__10433;
          v = G__10434;
          kvs = G__10435;
          continue
        }else {
          return ret__10430
        }
        break
      }
    };
    var G__10431 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10431__delegate.call(this, coll, k, v, kvs)
    };
    G__10431.cljs$lang$maxFixedArity = 3;
    G__10431.cljs$lang$applyTo = function(arglist__10436) {
      var coll = cljs.core.first(arglist__10436);
      var k = cljs.core.first(cljs.core.next(arglist__10436));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10436)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10436)));
      return G__10431__delegate(coll, k, v, kvs)
    };
    G__10431.cljs$lang$arity$variadic = G__10431__delegate;
    return G__10431
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
    var G__10439__delegate = function(coll, k, ks) {
      while(true) {
        var ret__10438 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__10440 = ret__10438;
          var G__10441 = cljs.core.first.call(null, ks);
          var G__10442 = cljs.core.next.call(null, ks);
          coll = G__10440;
          k = G__10441;
          ks = G__10442;
          continue
        }else {
          return ret__10438
        }
        break
      }
    };
    var G__10439 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10439__delegate.call(this, coll, k, ks)
    };
    G__10439.cljs$lang$maxFixedArity = 2;
    G__10439.cljs$lang$applyTo = function(arglist__10443) {
      var coll = cljs.core.first(arglist__10443);
      var k = cljs.core.first(cljs.core.next(arglist__10443));
      var ks = cljs.core.rest(cljs.core.next(arglist__10443));
      return G__10439__delegate(coll, k, ks)
    };
    G__10439.cljs$lang$arity$variadic = G__10439__delegate;
    return G__10439
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
    var G__10447__10448 = o;
    if(G__10447__10448) {
      if(function() {
        var or__3824__auto____10449 = G__10447__10448.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____10449) {
          return or__3824__auto____10449
        }else {
          return G__10447__10448.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__10447__10448.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10447__10448)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10447__10448)
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
    var G__10452__delegate = function(coll, k, ks) {
      while(true) {
        var ret__10451 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__10453 = ret__10451;
          var G__10454 = cljs.core.first.call(null, ks);
          var G__10455 = cljs.core.next.call(null, ks);
          coll = G__10453;
          k = G__10454;
          ks = G__10455;
          continue
        }else {
          return ret__10451
        }
        break
      }
    };
    var G__10452 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10452__delegate.call(this, coll, k, ks)
    };
    G__10452.cljs$lang$maxFixedArity = 2;
    G__10452.cljs$lang$applyTo = function(arglist__10456) {
      var coll = cljs.core.first(arglist__10456);
      var k = cljs.core.first(cljs.core.next(arglist__10456));
      var ks = cljs.core.rest(cljs.core.next(arglist__10456));
      return G__10452__delegate(coll, k, ks)
    };
    G__10452.cljs$lang$arity$variadic = G__10452__delegate;
    return G__10452
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
  var h__10458 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__10458;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__10458
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__10460 = cljs.core.string_hash_cache[k];
  if(!(h__10460 == null)) {
    return h__10460
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
      var and__3822__auto____10462 = goog.isString(o);
      if(and__3822__auto____10462) {
        return check_cache
      }else {
        return and__3822__auto____10462
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
    var G__10466__10467 = x;
    if(G__10466__10467) {
      if(function() {
        var or__3824__auto____10468 = G__10466__10467.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____10468) {
          return or__3824__auto____10468
        }else {
          return G__10466__10467.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__10466__10467.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__10466__10467)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__10466__10467)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__10472__10473 = x;
    if(G__10472__10473) {
      if(function() {
        var or__3824__auto____10474 = G__10472__10473.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____10474) {
          return or__3824__auto____10474
        }else {
          return G__10472__10473.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__10472__10473.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__10472__10473)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__10472__10473)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__10478__10479 = x;
  if(G__10478__10479) {
    if(function() {
      var or__3824__auto____10480 = G__10478__10479.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____10480) {
        return or__3824__auto____10480
      }else {
        return G__10478__10479.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__10478__10479.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__10478__10479)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__10478__10479)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__10484__10485 = x;
  if(G__10484__10485) {
    if(function() {
      var or__3824__auto____10486 = G__10484__10485.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____10486) {
        return or__3824__auto____10486
      }else {
        return G__10484__10485.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__10484__10485.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__10484__10485)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__10484__10485)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__10490__10491 = x;
  if(G__10490__10491) {
    if(function() {
      var or__3824__auto____10492 = G__10490__10491.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____10492) {
        return or__3824__auto____10492
      }else {
        return G__10490__10491.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__10490__10491.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__10490__10491)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__10490__10491)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__10496__10497 = x;
  if(G__10496__10497) {
    if(function() {
      var or__3824__auto____10498 = G__10496__10497.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____10498) {
        return or__3824__auto____10498
      }else {
        return G__10496__10497.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__10496__10497.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__10496__10497)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__10496__10497)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__10502__10503 = x;
  if(G__10502__10503) {
    if(function() {
      var or__3824__auto____10504 = G__10502__10503.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____10504) {
        return or__3824__auto____10504
      }else {
        return G__10502__10503.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__10502__10503.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__10502__10503)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__10502__10503)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__10508__10509 = x;
    if(G__10508__10509) {
      if(function() {
        var or__3824__auto____10510 = G__10508__10509.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____10510) {
          return or__3824__auto____10510
        }else {
          return G__10508__10509.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__10508__10509.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__10508__10509)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__10508__10509)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__10514__10515 = x;
  if(G__10514__10515) {
    if(function() {
      var or__3824__auto____10516 = G__10514__10515.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____10516) {
        return or__3824__auto____10516
      }else {
        return G__10514__10515.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__10514__10515.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__10514__10515)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__10514__10515)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__10520__10521 = x;
  if(G__10520__10521) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____10522 = null;
      if(cljs.core.truth_(or__3824__auto____10522)) {
        return or__3824__auto____10522
      }else {
        return G__10520__10521.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__10520__10521.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__10520__10521)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__10520__10521)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__10523__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__10523 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10523__delegate.call(this, keyvals)
    };
    G__10523.cljs$lang$maxFixedArity = 0;
    G__10523.cljs$lang$applyTo = function(arglist__10524) {
      var keyvals = cljs.core.seq(arglist__10524);
      return G__10523__delegate(keyvals)
    };
    G__10523.cljs$lang$arity$variadic = G__10523__delegate;
    return G__10523
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
  var keys__10526 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__10526.push(key)
  });
  return keys__10526
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__10530 = i;
  var j__10531 = j;
  var len__10532 = len;
  while(true) {
    if(len__10532 === 0) {
      return to
    }else {
      to[j__10531] = from[i__10530];
      var G__10533 = i__10530 + 1;
      var G__10534 = j__10531 + 1;
      var G__10535 = len__10532 - 1;
      i__10530 = G__10533;
      j__10531 = G__10534;
      len__10532 = G__10535;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__10539 = i + (len - 1);
  var j__10540 = j + (len - 1);
  var len__10541 = len;
  while(true) {
    if(len__10541 === 0) {
      return to
    }else {
      to[j__10540] = from[i__10539];
      var G__10542 = i__10539 - 1;
      var G__10543 = j__10540 - 1;
      var G__10544 = len__10541 - 1;
      i__10539 = G__10542;
      j__10540 = G__10543;
      len__10541 = G__10544;
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
    var G__10548__10549 = s;
    if(G__10548__10549) {
      if(function() {
        var or__3824__auto____10550 = G__10548__10549.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____10550) {
          return or__3824__auto____10550
        }else {
          return G__10548__10549.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__10548__10549.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10548__10549)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10548__10549)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__10554__10555 = s;
  if(G__10554__10555) {
    if(function() {
      var or__3824__auto____10556 = G__10554__10555.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____10556) {
        return or__3824__auto____10556
      }else {
        return G__10554__10555.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__10554__10555.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10554__10555)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10554__10555)
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
  var and__3822__auto____10559 = goog.isString(x);
  if(and__3822__auto____10559) {
    return!function() {
      var or__3824__auto____10560 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____10560) {
        return or__3824__auto____10560
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____10559
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____10562 = goog.isString(x);
  if(and__3822__auto____10562) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____10562
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____10564 = goog.isString(x);
  if(and__3822__auto____10564) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____10564
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____10569 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____10569) {
    return or__3824__auto____10569
  }else {
    var G__10570__10571 = f;
    if(G__10570__10571) {
      if(function() {
        var or__3824__auto____10572 = G__10570__10571.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____10572) {
          return or__3824__auto____10572
        }else {
          return G__10570__10571.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__10570__10571.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__10570__10571)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__10570__10571)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____10574 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____10574) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____10574
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
    var and__3822__auto____10577 = coll;
    if(cljs.core.truth_(and__3822__auto____10577)) {
      var and__3822__auto____10578 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____10578) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____10578
      }
    }else {
      return and__3822__auto____10577
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
    var G__10587__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__10583 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__10584 = more;
        while(true) {
          var x__10585 = cljs.core.first.call(null, xs__10584);
          var etc__10586 = cljs.core.next.call(null, xs__10584);
          if(cljs.core.truth_(xs__10584)) {
            if(cljs.core.contains_QMARK_.call(null, s__10583, x__10585)) {
              return false
            }else {
              var G__10588 = cljs.core.conj.call(null, s__10583, x__10585);
              var G__10589 = etc__10586;
              s__10583 = G__10588;
              xs__10584 = G__10589;
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
    var G__10587 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10587__delegate.call(this, x, y, more)
    };
    G__10587.cljs$lang$maxFixedArity = 2;
    G__10587.cljs$lang$applyTo = function(arglist__10590) {
      var x = cljs.core.first(arglist__10590);
      var y = cljs.core.first(cljs.core.next(arglist__10590));
      var more = cljs.core.rest(cljs.core.next(arglist__10590));
      return G__10587__delegate(x, y, more)
    };
    G__10587.cljs$lang$arity$variadic = G__10587__delegate;
    return G__10587
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
            var G__10594__10595 = x;
            if(G__10594__10595) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____10596 = null;
                if(cljs.core.truth_(or__3824__auto____10596)) {
                  return or__3824__auto____10596
                }else {
                  return G__10594__10595.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__10594__10595.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__10594__10595)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__10594__10595)
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
    var xl__10601 = cljs.core.count.call(null, xs);
    var yl__10602 = cljs.core.count.call(null, ys);
    if(xl__10601 < yl__10602) {
      return-1
    }else {
      if(xl__10601 > yl__10602) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__10601, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__10603 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____10604 = d__10603 === 0;
        if(and__3822__auto____10604) {
          return n + 1 < len
        }else {
          return and__3822__auto____10604
        }
      }()) {
        var G__10605 = xs;
        var G__10606 = ys;
        var G__10607 = len;
        var G__10608 = n + 1;
        xs = G__10605;
        ys = G__10606;
        len = G__10607;
        n = G__10608;
        continue
      }else {
        return d__10603
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
      var r__10610 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__10610)) {
        return r__10610
      }else {
        if(cljs.core.truth_(r__10610)) {
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
      var a__10612 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__10612, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__10612)
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
    var temp__3971__auto____10618 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____10618) {
      var s__10619 = temp__3971__auto____10618;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__10619), cljs.core.next.call(null, s__10619))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__10620 = val;
    var coll__10621 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__10621) {
        var nval__10622 = f.call(null, val__10620, cljs.core.first.call(null, coll__10621));
        if(cljs.core.reduced_QMARK_.call(null, nval__10622)) {
          return cljs.core.deref.call(null, nval__10622)
        }else {
          var G__10623 = nval__10622;
          var G__10624 = cljs.core.next.call(null, coll__10621);
          val__10620 = G__10623;
          coll__10621 = G__10624;
          continue
        }
      }else {
        return val__10620
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
  var a__10626 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__10626);
  return cljs.core.vec.call(null, a__10626)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__10633__10634 = coll;
      if(G__10633__10634) {
        if(function() {
          var or__3824__auto____10635 = G__10633__10634.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____10635) {
            return or__3824__auto____10635
          }else {
            return G__10633__10634.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__10633__10634.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__10633__10634)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__10633__10634)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__10636__10637 = coll;
      if(G__10636__10637) {
        if(function() {
          var or__3824__auto____10638 = G__10636__10637.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____10638) {
            return or__3824__auto____10638
          }else {
            return G__10636__10637.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__10636__10637.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__10636__10637)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__10636__10637)
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
  var this__10639 = this;
  return this__10639.val
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
    var G__10640__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__10640 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10640__delegate.call(this, x, y, more)
    };
    G__10640.cljs$lang$maxFixedArity = 2;
    G__10640.cljs$lang$applyTo = function(arglist__10641) {
      var x = cljs.core.first(arglist__10641);
      var y = cljs.core.first(cljs.core.next(arglist__10641));
      var more = cljs.core.rest(cljs.core.next(arglist__10641));
      return G__10640__delegate(x, y, more)
    };
    G__10640.cljs$lang$arity$variadic = G__10640__delegate;
    return G__10640
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
    var G__10642__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__10642 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10642__delegate.call(this, x, y, more)
    };
    G__10642.cljs$lang$maxFixedArity = 2;
    G__10642.cljs$lang$applyTo = function(arglist__10643) {
      var x = cljs.core.first(arglist__10643);
      var y = cljs.core.first(cljs.core.next(arglist__10643));
      var more = cljs.core.rest(cljs.core.next(arglist__10643));
      return G__10642__delegate(x, y, more)
    };
    G__10642.cljs$lang$arity$variadic = G__10642__delegate;
    return G__10642
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
    var G__10644__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__10644 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10644__delegate.call(this, x, y, more)
    };
    G__10644.cljs$lang$maxFixedArity = 2;
    G__10644.cljs$lang$applyTo = function(arglist__10645) {
      var x = cljs.core.first(arglist__10645);
      var y = cljs.core.first(cljs.core.next(arglist__10645));
      var more = cljs.core.rest(cljs.core.next(arglist__10645));
      return G__10644__delegate(x, y, more)
    };
    G__10644.cljs$lang$arity$variadic = G__10644__delegate;
    return G__10644
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
    var G__10646__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__10646 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10646__delegate.call(this, x, y, more)
    };
    G__10646.cljs$lang$maxFixedArity = 2;
    G__10646.cljs$lang$applyTo = function(arglist__10647) {
      var x = cljs.core.first(arglist__10647);
      var y = cljs.core.first(cljs.core.next(arglist__10647));
      var more = cljs.core.rest(cljs.core.next(arglist__10647));
      return G__10646__delegate(x, y, more)
    };
    G__10646.cljs$lang$arity$variadic = G__10646__delegate;
    return G__10646
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
    var G__10648__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__10649 = y;
            var G__10650 = cljs.core.first.call(null, more);
            var G__10651 = cljs.core.next.call(null, more);
            x = G__10649;
            y = G__10650;
            more = G__10651;
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
    var G__10648 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10648__delegate.call(this, x, y, more)
    };
    G__10648.cljs$lang$maxFixedArity = 2;
    G__10648.cljs$lang$applyTo = function(arglist__10652) {
      var x = cljs.core.first(arglist__10652);
      var y = cljs.core.first(cljs.core.next(arglist__10652));
      var more = cljs.core.rest(cljs.core.next(arglist__10652));
      return G__10648__delegate(x, y, more)
    };
    G__10648.cljs$lang$arity$variadic = G__10648__delegate;
    return G__10648
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
    var G__10653__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__10654 = y;
            var G__10655 = cljs.core.first.call(null, more);
            var G__10656 = cljs.core.next.call(null, more);
            x = G__10654;
            y = G__10655;
            more = G__10656;
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
    var G__10653 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10653__delegate.call(this, x, y, more)
    };
    G__10653.cljs$lang$maxFixedArity = 2;
    G__10653.cljs$lang$applyTo = function(arglist__10657) {
      var x = cljs.core.first(arglist__10657);
      var y = cljs.core.first(cljs.core.next(arglist__10657));
      var more = cljs.core.rest(cljs.core.next(arglist__10657));
      return G__10653__delegate(x, y, more)
    };
    G__10653.cljs$lang$arity$variadic = G__10653__delegate;
    return G__10653
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
    var G__10658__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__10659 = y;
            var G__10660 = cljs.core.first.call(null, more);
            var G__10661 = cljs.core.next.call(null, more);
            x = G__10659;
            y = G__10660;
            more = G__10661;
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
    var G__10658 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10658__delegate.call(this, x, y, more)
    };
    G__10658.cljs$lang$maxFixedArity = 2;
    G__10658.cljs$lang$applyTo = function(arglist__10662) {
      var x = cljs.core.first(arglist__10662);
      var y = cljs.core.first(cljs.core.next(arglist__10662));
      var more = cljs.core.rest(cljs.core.next(arglist__10662));
      return G__10658__delegate(x, y, more)
    };
    G__10658.cljs$lang$arity$variadic = G__10658__delegate;
    return G__10658
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
    var G__10663__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__10664 = y;
            var G__10665 = cljs.core.first.call(null, more);
            var G__10666 = cljs.core.next.call(null, more);
            x = G__10664;
            y = G__10665;
            more = G__10666;
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
    var G__10663 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10663__delegate.call(this, x, y, more)
    };
    G__10663.cljs$lang$maxFixedArity = 2;
    G__10663.cljs$lang$applyTo = function(arglist__10667) {
      var x = cljs.core.first(arglist__10667);
      var y = cljs.core.first(cljs.core.next(arglist__10667));
      var more = cljs.core.rest(cljs.core.next(arglist__10667));
      return G__10663__delegate(x, y, more)
    };
    G__10663.cljs$lang$arity$variadic = G__10663__delegate;
    return G__10663
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
    var G__10668__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__10668 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10668__delegate.call(this, x, y, more)
    };
    G__10668.cljs$lang$maxFixedArity = 2;
    G__10668.cljs$lang$applyTo = function(arglist__10669) {
      var x = cljs.core.first(arglist__10669);
      var y = cljs.core.first(cljs.core.next(arglist__10669));
      var more = cljs.core.rest(cljs.core.next(arglist__10669));
      return G__10668__delegate(x, y, more)
    };
    G__10668.cljs$lang$arity$variadic = G__10668__delegate;
    return G__10668
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
    var G__10670__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__10670 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10670__delegate.call(this, x, y, more)
    };
    G__10670.cljs$lang$maxFixedArity = 2;
    G__10670.cljs$lang$applyTo = function(arglist__10671) {
      var x = cljs.core.first(arglist__10671);
      var y = cljs.core.first(cljs.core.next(arglist__10671));
      var more = cljs.core.rest(cljs.core.next(arglist__10671));
      return G__10670__delegate(x, y, more)
    };
    G__10670.cljs$lang$arity$variadic = G__10670__delegate;
    return G__10670
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
  var rem__10673 = n % d;
  return cljs.core.fix.call(null, (n - rem__10673) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__10675 = cljs.core.quot.call(null, n, d);
  return n - d * q__10675
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
  var v__10678 = v - (v >> 1 & 1431655765);
  var v__10679 = (v__10678 & 858993459) + (v__10678 >> 2 & 858993459);
  return(v__10679 + (v__10679 >> 4) & 252645135) * 16843009 >> 24
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
    var G__10680__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__10681 = y;
            var G__10682 = cljs.core.first.call(null, more);
            var G__10683 = cljs.core.next.call(null, more);
            x = G__10681;
            y = G__10682;
            more = G__10683;
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
    var G__10680 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10680__delegate.call(this, x, y, more)
    };
    G__10680.cljs$lang$maxFixedArity = 2;
    G__10680.cljs$lang$applyTo = function(arglist__10684) {
      var x = cljs.core.first(arglist__10684);
      var y = cljs.core.first(cljs.core.next(arglist__10684));
      var more = cljs.core.rest(cljs.core.next(arglist__10684));
      return G__10680__delegate(x, y, more)
    };
    G__10680.cljs$lang$arity$variadic = G__10680__delegate;
    return G__10680
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
  var n__10688 = n;
  var xs__10689 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____10690 = xs__10689;
      if(and__3822__auto____10690) {
        return n__10688 > 0
      }else {
        return and__3822__auto____10690
      }
    }())) {
      var G__10691 = n__10688 - 1;
      var G__10692 = cljs.core.next.call(null, xs__10689);
      n__10688 = G__10691;
      xs__10689 = G__10692;
      continue
    }else {
      return xs__10689
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
    var G__10693__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__10694 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__10695 = cljs.core.next.call(null, more);
            sb = G__10694;
            more = G__10695;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__10693 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10693__delegate.call(this, x, ys)
    };
    G__10693.cljs$lang$maxFixedArity = 1;
    G__10693.cljs$lang$applyTo = function(arglist__10696) {
      var x = cljs.core.first(arglist__10696);
      var ys = cljs.core.rest(arglist__10696);
      return G__10693__delegate(x, ys)
    };
    G__10693.cljs$lang$arity$variadic = G__10693__delegate;
    return G__10693
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
    var G__10697__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__10698 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__10699 = cljs.core.next.call(null, more);
            sb = G__10698;
            more = G__10699;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__10697 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10697__delegate.call(this, x, ys)
    };
    G__10697.cljs$lang$maxFixedArity = 1;
    G__10697.cljs$lang$applyTo = function(arglist__10700) {
      var x = cljs.core.first(arglist__10700);
      var ys = cljs.core.rest(arglist__10700);
      return G__10697__delegate(x, ys)
    };
    G__10697.cljs$lang$arity$variadic = G__10697__delegate;
    return G__10697
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
  format.cljs$lang$applyTo = function(arglist__10701) {
    var fmt = cljs.core.first(arglist__10701);
    var args = cljs.core.rest(arglist__10701);
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
    var xs__10704 = cljs.core.seq.call(null, x);
    var ys__10705 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__10704 == null) {
        return ys__10705 == null
      }else {
        if(ys__10705 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__10704), cljs.core.first.call(null, ys__10705))) {
            var G__10706 = cljs.core.next.call(null, xs__10704);
            var G__10707 = cljs.core.next.call(null, ys__10705);
            xs__10704 = G__10706;
            ys__10705 = G__10707;
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
  return cljs.core.reduce.call(null, function(p1__10708_SHARP_, p2__10709_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__10708_SHARP_, cljs.core.hash.call(null, p2__10709_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__10713 = 0;
  var s__10714 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__10714) {
      var e__10715 = cljs.core.first.call(null, s__10714);
      var G__10716 = (h__10713 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__10715)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__10715)))) % 4503599627370496;
      var G__10717 = cljs.core.next.call(null, s__10714);
      h__10713 = G__10716;
      s__10714 = G__10717;
      continue
    }else {
      return h__10713
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__10721 = 0;
  var s__10722 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__10722) {
      var e__10723 = cljs.core.first.call(null, s__10722);
      var G__10724 = (h__10721 + cljs.core.hash.call(null, e__10723)) % 4503599627370496;
      var G__10725 = cljs.core.next.call(null, s__10722);
      h__10721 = G__10724;
      s__10722 = G__10725;
      continue
    }else {
      return h__10721
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__10746__10747 = cljs.core.seq.call(null, fn_map);
  if(G__10746__10747) {
    var G__10749__10751 = cljs.core.first.call(null, G__10746__10747);
    var vec__10750__10752 = G__10749__10751;
    var key_name__10753 = cljs.core.nth.call(null, vec__10750__10752, 0, null);
    var f__10754 = cljs.core.nth.call(null, vec__10750__10752, 1, null);
    var G__10746__10755 = G__10746__10747;
    var G__10749__10756 = G__10749__10751;
    var G__10746__10757 = G__10746__10755;
    while(true) {
      var vec__10758__10759 = G__10749__10756;
      var key_name__10760 = cljs.core.nth.call(null, vec__10758__10759, 0, null);
      var f__10761 = cljs.core.nth.call(null, vec__10758__10759, 1, null);
      var G__10746__10762 = G__10746__10757;
      var str_name__10763 = cljs.core.name.call(null, key_name__10760);
      obj[str_name__10763] = f__10761;
      var temp__3974__auto____10764 = cljs.core.next.call(null, G__10746__10762);
      if(temp__3974__auto____10764) {
        var G__10746__10765 = temp__3974__auto____10764;
        var G__10766 = cljs.core.first.call(null, G__10746__10765);
        var G__10767 = G__10746__10765;
        G__10749__10756 = G__10766;
        G__10746__10757 = G__10767;
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
  var this__10768 = this;
  var h__2247__auto____10769 = this__10768.__hash;
  if(!(h__2247__auto____10769 == null)) {
    return h__2247__auto____10769
  }else {
    var h__2247__auto____10770 = cljs.core.hash_coll.call(null, coll);
    this__10768.__hash = h__2247__auto____10770;
    return h__2247__auto____10770
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__10771 = this;
  if(this__10771.count === 1) {
    return null
  }else {
    return this__10771.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10772 = this;
  return new cljs.core.List(this__10772.meta, o, coll, this__10772.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__10773 = this;
  var this__10774 = this;
  return cljs.core.pr_str.call(null, this__10774)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10775 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10776 = this;
  return this__10776.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10777 = this;
  return this__10777.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10778 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10779 = this;
  return this__10779.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10780 = this;
  if(this__10780.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__10780.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10781 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10782 = this;
  return new cljs.core.List(meta, this__10782.first, this__10782.rest, this__10782.count, this__10782.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10783 = this;
  return this__10783.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10784 = this;
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
  var this__10785 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__10786 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10787 = this;
  return new cljs.core.List(this__10787.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__10788 = this;
  var this__10789 = this;
  return cljs.core.pr_str.call(null, this__10789)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10790 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10791 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__10792 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__10793 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10794 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10795 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10796 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10797 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10798 = this;
  return this__10798.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10799 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__10803__10804 = coll;
  if(G__10803__10804) {
    if(function() {
      var or__3824__auto____10805 = G__10803__10804.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____10805) {
        return or__3824__auto____10805
      }else {
        return G__10803__10804.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__10803__10804.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__10803__10804)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__10803__10804)
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
    var G__10806__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__10806 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10806__delegate.call(this, x, y, z, items)
    };
    G__10806.cljs$lang$maxFixedArity = 3;
    G__10806.cljs$lang$applyTo = function(arglist__10807) {
      var x = cljs.core.first(arglist__10807);
      var y = cljs.core.first(cljs.core.next(arglist__10807));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10807)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10807)));
      return G__10806__delegate(x, y, z, items)
    };
    G__10806.cljs$lang$arity$variadic = G__10806__delegate;
    return G__10806
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
  var this__10808 = this;
  var h__2247__auto____10809 = this__10808.__hash;
  if(!(h__2247__auto____10809 == null)) {
    return h__2247__auto____10809
  }else {
    var h__2247__auto____10810 = cljs.core.hash_coll.call(null, coll);
    this__10808.__hash = h__2247__auto____10810;
    return h__2247__auto____10810
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__10811 = this;
  if(this__10811.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__10811.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10812 = this;
  return new cljs.core.Cons(null, o, coll, this__10812.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__10813 = this;
  var this__10814 = this;
  return cljs.core.pr_str.call(null, this__10814)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10815 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10816 = this;
  return this__10816.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10817 = this;
  if(this__10817.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__10817.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10818 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10819 = this;
  return new cljs.core.Cons(meta, this__10819.first, this__10819.rest, this__10819.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10820 = this;
  return this__10820.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10821 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10821.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____10826 = coll == null;
    if(or__3824__auto____10826) {
      return or__3824__auto____10826
    }else {
      var G__10827__10828 = coll;
      if(G__10827__10828) {
        if(function() {
          var or__3824__auto____10829 = G__10827__10828.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____10829) {
            return or__3824__auto____10829
          }else {
            return G__10827__10828.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__10827__10828.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10827__10828)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__10827__10828)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__10833__10834 = x;
  if(G__10833__10834) {
    if(function() {
      var or__3824__auto____10835 = G__10833__10834.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____10835) {
        return or__3824__auto____10835
      }else {
        return G__10833__10834.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__10833__10834.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__10833__10834)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__10833__10834)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__10836 = null;
  var G__10836__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__10836__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__10836 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10836__2.call(this, string, f);
      case 3:
        return G__10836__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10836
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__10837 = null;
  var G__10837__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__10837__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__10837 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10837__2.call(this, string, k);
      case 3:
        return G__10837__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10837
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__10838 = null;
  var G__10838__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__10838__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__10838 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10838__2.call(this, string, n);
      case 3:
        return G__10838__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10838
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
  var G__10850 = null;
  var G__10850__2 = function(this_sym10841, coll) {
    var this__10843 = this;
    var this_sym10841__10844 = this;
    var ___10845 = this_sym10841__10844;
    if(coll == null) {
      return null
    }else {
      var strobj__10846 = coll.strobj;
      if(strobj__10846 == null) {
        return cljs.core._lookup.call(null, coll, this__10843.k, null)
      }else {
        return strobj__10846[this__10843.k]
      }
    }
  };
  var G__10850__3 = function(this_sym10842, coll, not_found) {
    var this__10843 = this;
    var this_sym10842__10847 = this;
    var ___10848 = this_sym10842__10847;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__10843.k, not_found)
    }
  };
  G__10850 = function(this_sym10842, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10850__2.call(this, this_sym10842, coll);
      case 3:
        return G__10850__3.call(this, this_sym10842, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10850
}();
cljs.core.Keyword.prototype.apply = function(this_sym10839, args10840) {
  var this__10849 = this;
  return this_sym10839.call.apply(this_sym10839, [this_sym10839].concat(args10840.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__10859 = null;
  var G__10859__2 = function(this_sym10853, coll) {
    var this_sym10853__10855 = this;
    var this__10856 = this_sym10853__10855;
    return cljs.core._lookup.call(null, coll, this__10856.toString(), null)
  };
  var G__10859__3 = function(this_sym10854, coll, not_found) {
    var this_sym10854__10857 = this;
    var this__10858 = this_sym10854__10857;
    return cljs.core._lookup.call(null, coll, this__10858.toString(), not_found)
  };
  G__10859 = function(this_sym10854, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10859__2.call(this, this_sym10854, coll);
      case 3:
        return G__10859__3.call(this, this_sym10854, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10859
}();
String.prototype.apply = function(this_sym10851, args10852) {
  return this_sym10851.call.apply(this_sym10851, [this_sym10851].concat(args10852.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__10861 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__10861
  }else {
    lazy_seq.x = x__10861.call(null);
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
  var this__10862 = this;
  var h__2247__auto____10863 = this__10862.__hash;
  if(!(h__2247__auto____10863 == null)) {
    return h__2247__auto____10863
  }else {
    var h__2247__auto____10864 = cljs.core.hash_coll.call(null, coll);
    this__10862.__hash = h__2247__auto____10864;
    return h__2247__auto____10864
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__10865 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10866 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__10867 = this;
  var this__10868 = this;
  return cljs.core.pr_str.call(null, this__10868)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10869 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10870 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10871 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10872 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10873 = this;
  return new cljs.core.LazySeq(meta, this__10873.realized, this__10873.x, this__10873.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10874 = this;
  return this__10874.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10875 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10875.meta)
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
  var this__10876 = this;
  return this__10876.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__10877 = this;
  var ___10878 = this;
  this__10877.buf[this__10877.end] = o;
  return this__10877.end = this__10877.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__10879 = this;
  var ___10880 = this;
  var ret__10881 = new cljs.core.ArrayChunk(this__10879.buf, 0, this__10879.end);
  this__10879.buf = null;
  return ret__10881
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
  var this__10882 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__10882.arr[this__10882.off], this__10882.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__10883 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__10883.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__10884 = this;
  if(this__10884.off === this__10884.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__10884.arr, this__10884.off + 1, this__10884.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__10885 = this;
  return this__10885.arr[this__10885.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__10886 = this;
  if(function() {
    var and__3822__auto____10887 = i >= 0;
    if(and__3822__auto____10887) {
      return i < this__10886.end - this__10886.off
    }else {
      return and__3822__auto____10887
    }
  }()) {
    return this__10886.arr[this__10886.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__10888 = this;
  return this__10888.end - this__10888.off
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
  var this__10889 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10890 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10891 = this;
  return cljs.core._nth.call(null, this__10891.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10892 = this;
  if(cljs.core._count.call(null, this__10892.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__10892.chunk), this__10892.more, this__10892.meta)
  }else {
    if(this__10892.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__10892.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__10893 = this;
  if(this__10893.more == null) {
    return null
  }else {
    return this__10893.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10894 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__10895 = this;
  return new cljs.core.ChunkedCons(this__10895.chunk, this__10895.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10896 = this;
  return this__10896.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__10897 = this;
  return this__10897.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__10898 = this;
  if(this__10898.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__10898.more
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
    var G__10902__10903 = s;
    if(G__10902__10903) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____10904 = null;
        if(cljs.core.truth_(or__3824__auto____10904)) {
          return or__3824__auto____10904
        }else {
          return G__10902__10903.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__10902__10903.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__10902__10903)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__10902__10903)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__10907 = [];
  var s__10908 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__10908)) {
      ary__10907.push(cljs.core.first.call(null, s__10908));
      var G__10909 = cljs.core.next.call(null, s__10908);
      s__10908 = G__10909;
      continue
    }else {
      return ary__10907
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__10913 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__10914 = 0;
  var xs__10915 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__10915) {
      ret__10913[i__10914] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__10915));
      var G__10916 = i__10914 + 1;
      var G__10917 = cljs.core.next.call(null, xs__10915);
      i__10914 = G__10916;
      xs__10915 = G__10917;
      continue
    }else {
    }
    break
  }
  return ret__10913
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
    var a__10925 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__10926 = cljs.core.seq.call(null, init_val_or_seq);
      var i__10927 = 0;
      var s__10928 = s__10926;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____10929 = s__10928;
          if(and__3822__auto____10929) {
            return i__10927 < size
          }else {
            return and__3822__auto____10929
          }
        }())) {
          a__10925[i__10927] = cljs.core.first.call(null, s__10928);
          var G__10932 = i__10927 + 1;
          var G__10933 = cljs.core.next.call(null, s__10928);
          i__10927 = G__10932;
          s__10928 = G__10933;
          continue
        }else {
          return a__10925
        }
        break
      }
    }else {
      var n__2582__auto____10930 = size;
      var i__10931 = 0;
      while(true) {
        if(i__10931 < n__2582__auto____10930) {
          a__10925[i__10931] = init_val_or_seq;
          var G__10934 = i__10931 + 1;
          i__10931 = G__10934;
          continue
        }else {
        }
        break
      }
      return a__10925
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
    var a__10942 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__10943 = cljs.core.seq.call(null, init_val_or_seq);
      var i__10944 = 0;
      var s__10945 = s__10943;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____10946 = s__10945;
          if(and__3822__auto____10946) {
            return i__10944 < size
          }else {
            return and__3822__auto____10946
          }
        }())) {
          a__10942[i__10944] = cljs.core.first.call(null, s__10945);
          var G__10949 = i__10944 + 1;
          var G__10950 = cljs.core.next.call(null, s__10945);
          i__10944 = G__10949;
          s__10945 = G__10950;
          continue
        }else {
          return a__10942
        }
        break
      }
    }else {
      var n__2582__auto____10947 = size;
      var i__10948 = 0;
      while(true) {
        if(i__10948 < n__2582__auto____10947) {
          a__10942[i__10948] = init_val_or_seq;
          var G__10951 = i__10948 + 1;
          i__10948 = G__10951;
          continue
        }else {
        }
        break
      }
      return a__10942
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
    var a__10959 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__10960 = cljs.core.seq.call(null, init_val_or_seq);
      var i__10961 = 0;
      var s__10962 = s__10960;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____10963 = s__10962;
          if(and__3822__auto____10963) {
            return i__10961 < size
          }else {
            return and__3822__auto____10963
          }
        }())) {
          a__10959[i__10961] = cljs.core.first.call(null, s__10962);
          var G__10966 = i__10961 + 1;
          var G__10967 = cljs.core.next.call(null, s__10962);
          i__10961 = G__10966;
          s__10962 = G__10967;
          continue
        }else {
          return a__10959
        }
        break
      }
    }else {
      var n__2582__auto____10964 = size;
      var i__10965 = 0;
      while(true) {
        if(i__10965 < n__2582__auto____10964) {
          a__10959[i__10965] = init_val_or_seq;
          var G__10968 = i__10965 + 1;
          i__10965 = G__10968;
          continue
        }else {
        }
        break
      }
      return a__10959
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
    var s__10973 = s;
    var i__10974 = n;
    var sum__10975 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____10976 = i__10974 > 0;
        if(and__3822__auto____10976) {
          return cljs.core.seq.call(null, s__10973)
        }else {
          return and__3822__auto____10976
        }
      }())) {
        var G__10977 = cljs.core.next.call(null, s__10973);
        var G__10978 = i__10974 - 1;
        var G__10979 = sum__10975 + 1;
        s__10973 = G__10977;
        i__10974 = G__10978;
        sum__10975 = G__10979;
        continue
      }else {
        return sum__10975
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
      var s__10984 = cljs.core.seq.call(null, x);
      if(s__10984) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__10984)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__10984), concat.call(null, cljs.core.chunk_rest.call(null, s__10984), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__10984), concat.call(null, cljs.core.rest.call(null, s__10984), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__10988__delegate = function(x, y, zs) {
      var cat__10987 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__10986 = cljs.core.seq.call(null, xys);
          if(xys__10986) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__10986)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__10986), cat.call(null, cljs.core.chunk_rest.call(null, xys__10986), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__10986), cat.call(null, cljs.core.rest.call(null, xys__10986), zs))
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
      return cat__10987.call(null, concat.call(null, x, y), zs)
    };
    var G__10988 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10988__delegate.call(this, x, y, zs)
    };
    G__10988.cljs$lang$maxFixedArity = 2;
    G__10988.cljs$lang$applyTo = function(arglist__10989) {
      var x = cljs.core.first(arglist__10989);
      var y = cljs.core.first(cljs.core.next(arglist__10989));
      var zs = cljs.core.rest(cljs.core.next(arglist__10989));
      return G__10988__delegate(x, y, zs)
    };
    G__10988.cljs$lang$arity$variadic = G__10988__delegate;
    return G__10988
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
    var G__10990__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__10990 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__10990__delegate.call(this, a, b, c, d, more)
    };
    G__10990.cljs$lang$maxFixedArity = 4;
    G__10990.cljs$lang$applyTo = function(arglist__10991) {
      var a = cljs.core.first(arglist__10991);
      var b = cljs.core.first(cljs.core.next(arglist__10991));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10991)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10991))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10991))));
      return G__10990__delegate(a, b, c, d, more)
    };
    G__10990.cljs$lang$arity$variadic = G__10990__delegate;
    return G__10990
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
  var args__11033 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__11034 = cljs.core._first.call(null, args__11033);
    var args__11035 = cljs.core._rest.call(null, args__11033);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__11034)
      }else {
        return f.call(null, a__11034)
      }
    }else {
      var b__11036 = cljs.core._first.call(null, args__11035);
      var args__11037 = cljs.core._rest.call(null, args__11035);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__11034, b__11036)
        }else {
          return f.call(null, a__11034, b__11036)
        }
      }else {
        var c__11038 = cljs.core._first.call(null, args__11037);
        var args__11039 = cljs.core._rest.call(null, args__11037);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__11034, b__11036, c__11038)
          }else {
            return f.call(null, a__11034, b__11036, c__11038)
          }
        }else {
          var d__11040 = cljs.core._first.call(null, args__11039);
          var args__11041 = cljs.core._rest.call(null, args__11039);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__11034, b__11036, c__11038, d__11040)
            }else {
              return f.call(null, a__11034, b__11036, c__11038, d__11040)
            }
          }else {
            var e__11042 = cljs.core._first.call(null, args__11041);
            var args__11043 = cljs.core._rest.call(null, args__11041);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__11034, b__11036, c__11038, d__11040, e__11042)
              }else {
                return f.call(null, a__11034, b__11036, c__11038, d__11040, e__11042)
              }
            }else {
              var f__11044 = cljs.core._first.call(null, args__11043);
              var args__11045 = cljs.core._rest.call(null, args__11043);
              if(argc === 6) {
                if(f__11044.cljs$lang$arity$6) {
                  return f__11044.cljs$lang$arity$6(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044)
                }else {
                  return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044)
                }
              }else {
                var g__11046 = cljs.core._first.call(null, args__11045);
                var args__11047 = cljs.core._rest.call(null, args__11045);
                if(argc === 7) {
                  if(f__11044.cljs$lang$arity$7) {
                    return f__11044.cljs$lang$arity$7(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046)
                  }else {
                    return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046)
                  }
                }else {
                  var h__11048 = cljs.core._first.call(null, args__11047);
                  var args__11049 = cljs.core._rest.call(null, args__11047);
                  if(argc === 8) {
                    if(f__11044.cljs$lang$arity$8) {
                      return f__11044.cljs$lang$arity$8(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048)
                    }else {
                      return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048)
                    }
                  }else {
                    var i__11050 = cljs.core._first.call(null, args__11049);
                    var args__11051 = cljs.core._rest.call(null, args__11049);
                    if(argc === 9) {
                      if(f__11044.cljs$lang$arity$9) {
                        return f__11044.cljs$lang$arity$9(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050)
                      }else {
                        return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050)
                      }
                    }else {
                      var j__11052 = cljs.core._first.call(null, args__11051);
                      var args__11053 = cljs.core._rest.call(null, args__11051);
                      if(argc === 10) {
                        if(f__11044.cljs$lang$arity$10) {
                          return f__11044.cljs$lang$arity$10(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052)
                        }else {
                          return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052)
                        }
                      }else {
                        var k__11054 = cljs.core._first.call(null, args__11053);
                        var args__11055 = cljs.core._rest.call(null, args__11053);
                        if(argc === 11) {
                          if(f__11044.cljs$lang$arity$11) {
                            return f__11044.cljs$lang$arity$11(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054)
                          }else {
                            return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054)
                          }
                        }else {
                          var l__11056 = cljs.core._first.call(null, args__11055);
                          var args__11057 = cljs.core._rest.call(null, args__11055);
                          if(argc === 12) {
                            if(f__11044.cljs$lang$arity$12) {
                              return f__11044.cljs$lang$arity$12(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056)
                            }else {
                              return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056)
                            }
                          }else {
                            var m__11058 = cljs.core._first.call(null, args__11057);
                            var args__11059 = cljs.core._rest.call(null, args__11057);
                            if(argc === 13) {
                              if(f__11044.cljs$lang$arity$13) {
                                return f__11044.cljs$lang$arity$13(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058)
                              }else {
                                return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058)
                              }
                            }else {
                              var n__11060 = cljs.core._first.call(null, args__11059);
                              var args__11061 = cljs.core._rest.call(null, args__11059);
                              if(argc === 14) {
                                if(f__11044.cljs$lang$arity$14) {
                                  return f__11044.cljs$lang$arity$14(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060)
                                }else {
                                  return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060)
                                }
                              }else {
                                var o__11062 = cljs.core._first.call(null, args__11061);
                                var args__11063 = cljs.core._rest.call(null, args__11061);
                                if(argc === 15) {
                                  if(f__11044.cljs$lang$arity$15) {
                                    return f__11044.cljs$lang$arity$15(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060, o__11062)
                                  }else {
                                    return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060, o__11062)
                                  }
                                }else {
                                  var p__11064 = cljs.core._first.call(null, args__11063);
                                  var args__11065 = cljs.core._rest.call(null, args__11063);
                                  if(argc === 16) {
                                    if(f__11044.cljs$lang$arity$16) {
                                      return f__11044.cljs$lang$arity$16(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060, o__11062, p__11064)
                                    }else {
                                      return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060, o__11062, p__11064)
                                    }
                                  }else {
                                    var q__11066 = cljs.core._first.call(null, args__11065);
                                    var args__11067 = cljs.core._rest.call(null, args__11065);
                                    if(argc === 17) {
                                      if(f__11044.cljs$lang$arity$17) {
                                        return f__11044.cljs$lang$arity$17(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060, o__11062, p__11064, q__11066)
                                      }else {
                                        return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060, o__11062, p__11064, q__11066)
                                      }
                                    }else {
                                      var r__11068 = cljs.core._first.call(null, args__11067);
                                      var args__11069 = cljs.core._rest.call(null, args__11067);
                                      if(argc === 18) {
                                        if(f__11044.cljs$lang$arity$18) {
                                          return f__11044.cljs$lang$arity$18(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060, o__11062, p__11064, q__11066, r__11068)
                                        }else {
                                          return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060, o__11062, p__11064, q__11066, r__11068)
                                        }
                                      }else {
                                        var s__11070 = cljs.core._first.call(null, args__11069);
                                        var args__11071 = cljs.core._rest.call(null, args__11069);
                                        if(argc === 19) {
                                          if(f__11044.cljs$lang$arity$19) {
                                            return f__11044.cljs$lang$arity$19(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060, o__11062, p__11064, q__11066, r__11068, s__11070)
                                          }else {
                                            return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060, o__11062, p__11064, q__11066, r__11068, s__11070)
                                          }
                                        }else {
                                          var t__11072 = cljs.core._first.call(null, args__11071);
                                          var args__11073 = cljs.core._rest.call(null, args__11071);
                                          if(argc === 20) {
                                            if(f__11044.cljs$lang$arity$20) {
                                              return f__11044.cljs$lang$arity$20(a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060, o__11062, p__11064, q__11066, r__11068, s__11070, t__11072)
                                            }else {
                                              return f__11044.call(null, a__11034, b__11036, c__11038, d__11040, e__11042, f__11044, g__11046, h__11048, i__11050, j__11052, k__11054, l__11056, m__11058, n__11060, o__11062, p__11064, q__11066, r__11068, s__11070, t__11072)
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
    var fixed_arity__11088 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__11089 = cljs.core.bounded_count.call(null, args, fixed_arity__11088 + 1);
      if(bc__11089 <= fixed_arity__11088) {
        return cljs.core.apply_to.call(null, f, bc__11089, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__11090 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__11091 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__11092 = cljs.core.bounded_count.call(null, arglist__11090, fixed_arity__11091 + 1);
      if(bc__11092 <= fixed_arity__11091) {
        return cljs.core.apply_to.call(null, f, bc__11092, arglist__11090)
      }else {
        return f.cljs$lang$applyTo(arglist__11090)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__11090))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__11093 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__11094 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__11095 = cljs.core.bounded_count.call(null, arglist__11093, fixed_arity__11094 + 1);
      if(bc__11095 <= fixed_arity__11094) {
        return cljs.core.apply_to.call(null, f, bc__11095, arglist__11093)
      }else {
        return f.cljs$lang$applyTo(arglist__11093)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__11093))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__11096 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__11097 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__11098 = cljs.core.bounded_count.call(null, arglist__11096, fixed_arity__11097 + 1);
      if(bc__11098 <= fixed_arity__11097) {
        return cljs.core.apply_to.call(null, f, bc__11098, arglist__11096)
      }else {
        return f.cljs$lang$applyTo(arglist__11096)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__11096))
    }
  };
  var apply__6 = function() {
    var G__11102__delegate = function(f, a, b, c, d, args) {
      var arglist__11099 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__11100 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__11101 = cljs.core.bounded_count.call(null, arglist__11099, fixed_arity__11100 + 1);
        if(bc__11101 <= fixed_arity__11100) {
          return cljs.core.apply_to.call(null, f, bc__11101, arglist__11099)
        }else {
          return f.cljs$lang$applyTo(arglist__11099)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__11099))
      }
    };
    var G__11102 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__11102__delegate.call(this, f, a, b, c, d, args)
    };
    G__11102.cljs$lang$maxFixedArity = 5;
    G__11102.cljs$lang$applyTo = function(arglist__11103) {
      var f = cljs.core.first(arglist__11103);
      var a = cljs.core.first(cljs.core.next(arglist__11103));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11103)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11103))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11103)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11103)))));
      return G__11102__delegate(f, a, b, c, d, args)
    };
    G__11102.cljs$lang$arity$variadic = G__11102__delegate;
    return G__11102
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
  vary_meta.cljs$lang$applyTo = function(arglist__11104) {
    var obj = cljs.core.first(arglist__11104);
    var f = cljs.core.first(cljs.core.next(arglist__11104));
    var args = cljs.core.rest(cljs.core.next(arglist__11104));
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
    var G__11105__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__11105 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11105__delegate.call(this, x, y, more)
    };
    G__11105.cljs$lang$maxFixedArity = 2;
    G__11105.cljs$lang$applyTo = function(arglist__11106) {
      var x = cljs.core.first(arglist__11106);
      var y = cljs.core.first(cljs.core.next(arglist__11106));
      var more = cljs.core.rest(cljs.core.next(arglist__11106));
      return G__11105__delegate(x, y, more)
    };
    G__11105.cljs$lang$arity$variadic = G__11105__delegate;
    return G__11105
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
        var G__11107 = pred;
        var G__11108 = cljs.core.next.call(null, coll);
        pred = G__11107;
        coll = G__11108;
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
      var or__3824__auto____11110 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____11110)) {
        return or__3824__auto____11110
      }else {
        var G__11111 = pred;
        var G__11112 = cljs.core.next.call(null, coll);
        pred = G__11111;
        coll = G__11112;
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
    var G__11113 = null;
    var G__11113__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__11113__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__11113__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__11113__3 = function() {
      var G__11114__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__11114 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__11114__delegate.call(this, x, y, zs)
      };
      G__11114.cljs$lang$maxFixedArity = 2;
      G__11114.cljs$lang$applyTo = function(arglist__11115) {
        var x = cljs.core.first(arglist__11115);
        var y = cljs.core.first(cljs.core.next(arglist__11115));
        var zs = cljs.core.rest(cljs.core.next(arglist__11115));
        return G__11114__delegate(x, y, zs)
      };
      G__11114.cljs$lang$arity$variadic = G__11114__delegate;
      return G__11114
    }();
    G__11113 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__11113__0.call(this);
        case 1:
          return G__11113__1.call(this, x);
        case 2:
          return G__11113__2.call(this, x, y);
        default:
          return G__11113__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__11113.cljs$lang$maxFixedArity = 2;
    G__11113.cljs$lang$applyTo = G__11113__3.cljs$lang$applyTo;
    return G__11113
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__11116__delegate = function(args) {
      return x
    };
    var G__11116 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11116__delegate.call(this, args)
    };
    G__11116.cljs$lang$maxFixedArity = 0;
    G__11116.cljs$lang$applyTo = function(arglist__11117) {
      var args = cljs.core.seq(arglist__11117);
      return G__11116__delegate(args)
    };
    G__11116.cljs$lang$arity$variadic = G__11116__delegate;
    return G__11116
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
      var G__11124 = null;
      var G__11124__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__11124__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__11124__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__11124__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__11124__4 = function() {
        var G__11125__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__11125 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11125__delegate.call(this, x, y, z, args)
        };
        G__11125.cljs$lang$maxFixedArity = 3;
        G__11125.cljs$lang$applyTo = function(arglist__11126) {
          var x = cljs.core.first(arglist__11126);
          var y = cljs.core.first(cljs.core.next(arglist__11126));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11126)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11126)));
          return G__11125__delegate(x, y, z, args)
        };
        G__11125.cljs$lang$arity$variadic = G__11125__delegate;
        return G__11125
      }();
      G__11124 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11124__0.call(this);
          case 1:
            return G__11124__1.call(this, x);
          case 2:
            return G__11124__2.call(this, x, y);
          case 3:
            return G__11124__3.call(this, x, y, z);
          default:
            return G__11124__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11124.cljs$lang$maxFixedArity = 3;
      G__11124.cljs$lang$applyTo = G__11124__4.cljs$lang$applyTo;
      return G__11124
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__11127 = null;
      var G__11127__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__11127__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__11127__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__11127__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__11127__4 = function() {
        var G__11128__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__11128 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11128__delegate.call(this, x, y, z, args)
        };
        G__11128.cljs$lang$maxFixedArity = 3;
        G__11128.cljs$lang$applyTo = function(arglist__11129) {
          var x = cljs.core.first(arglist__11129);
          var y = cljs.core.first(cljs.core.next(arglist__11129));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11129)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11129)));
          return G__11128__delegate(x, y, z, args)
        };
        G__11128.cljs$lang$arity$variadic = G__11128__delegate;
        return G__11128
      }();
      G__11127 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11127__0.call(this);
          case 1:
            return G__11127__1.call(this, x);
          case 2:
            return G__11127__2.call(this, x, y);
          case 3:
            return G__11127__3.call(this, x, y, z);
          default:
            return G__11127__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11127.cljs$lang$maxFixedArity = 3;
      G__11127.cljs$lang$applyTo = G__11127__4.cljs$lang$applyTo;
      return G__11127
    }()
  };
  var comp__4 = function() {
    var G__11130__delegate = function(f1, f2, f3, fs) {
      var fs__11121 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__11131__delegate = function(args) {
          var ret__11122 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__11121), args);
          var fs__11123 = cljs.core.next.call(null, fs__11121);
          while(true) {
            if(fs__11123) {
              var G__11132 = cljs.core.first.call(null, fs__11123).call(null, ret__11122);
              var G__11133 = cljs.core.next.call(null, fs__11123);
              ret__11122 = G__11132;
              fs__11123 = G__11133;
              continue
            }else {
              return ret__11122
            }
            break
          }
        };
        var G__11131 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__11131__delegate.call(this, args)
        };
        G__11131.cljs$lang$maxFixedArity = 0;
        G__11131.cljs$lang$applyTo = function(arglist__11134) {
          var args = cljs.core.seq(arglist__11134);
          return G__11131__delegate(args)
        };
        G__11131.cljs$lang$arity$variadic = G__11131__delegate;
        return G__11131
      }()
    };
    var G__11130 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11130__delegate.call(this, f1, f2, f3, fs)
    };
    G__11130.cljs$lang$maxFixedArity = 3;
    G__11130.cljs$lang$applyTo = function(arglist__11135) {
      var f1 = cljs.core.first(arglist__11135);
      var f2 = cljs.core.first(cljs.core.next(arglist__11135));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11135)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11135)));
      return G__11130__delegate(f1, f2, f3, fs)
    };
    G__11130.cljs$lang$arity$variadic = G__11130__delegate;
    return G__11130
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
      var G__11136__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__11136 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__11136__delegate.call(this, args)
      };
      G__11136.cljs$lang$maxFixedArity = 0;
      G__11136.cljs$lang$applyTo = function(arglist__11137) {
        var args = cljs.core.seq(arglist__11137);
        return G__11136__delegate(args)
      };
      G__11136.cljs$lang$arity$variadic = G__11136__delegate;
      return G__11136
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__11138__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__11138 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__11138__delegate.call(this, args)
      };
      G__11138.cljs$lang$maxFixedArity = 0;
      G__11138.cljs$lang$applyTo = function(arglist__11139) {
        var args = cljs.core.seq(arglist__11139);
        return G__11138__delegate(args)
      };
      G__11138.cljs$lang$arity$variadic = G__11138__delegate;
      return G__11138
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__11140__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__11140 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__11140__delegate.call(this, args)
      };
      G__11140.cljs$lang$maxFixedArity = 0;
      G__11140.cljs$lang$applyTo = function(arglist__11141) {
        var args = cljs.core.seq(arglist__11141);
        return G__11140__delegate(args)
      };
      G__11140.cljs$lang$arity$variadic = G__11140__delegate;
      return G__11140
    }()
  };
  var partial__5 = function() {
    var G__11142__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__11143__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__11143 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__11143__delegate.call(this, args)
        };
        G__11143.cljs$lang$maxFixedArity = 0;
        G__11143.cljs$lang$applyTo = function(arglist__11144) {
          var args = cljs.core.seq(arglist__11144);
          return G__11143__delegate(args)
        };
        G__11143.cljs$lang$arity$variadic = G__11143__delegate;
        return G__11143
      }()
    };
    var G__11142 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__11142__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__11142.cljs$lang$maxFixedArity = 4;
    G__11142.cljs$lang$applyTo = function(arglist__11145) {
      var f = cljs.core.first(arglist__11145);
      var arg1 = cljs.core.first(cljs.core.next(arglist__11145));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11145)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11145))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11145))));
      return G__11142__delegate(f, arg1, arg2, arg3, more)
    };
    G__11142.cljs$lang$arity$variadic = G__11142__delegate;
    return G__11142
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
      var G__11146 = null;
      var G__11146__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__11146__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__11146__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__11146__4 = function() {
        var G__11147__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__11147 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11147__delegate.call(this, a, b, c, ds)
        };
        G__11147.cljs$lang$maxFixedArity = 3;
        G__11147.cljs$lang$applyTo = function(arglist__11148) {
          var a = cljs.core.first(arglist__11148);
          var b = cljs.core.first(cljs.core.next(arglist__11148));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11148)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11148)));
          return G__11147__delegate(a, b, c, ds)
        };
        G__11147.cljs$lang$arity$variadic = G__11147__delegate;
        return G__11147
      }();
      G__11146 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__11146__1.call(this, a);
          case 2:
            return G__11146__2.call(this, a, b);
          case 3:
            return G__11146__3.call(this, a, b, c);
          default:
            return G__11146__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11146.cljs$lang$maxFixedArity = 3;
      G__11146.cljs$lang$applyTo = G__11146__4.cljs$lang$applyTo;
      return G__11146
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__11149 = null;
      var G__11149__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__11149__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__11149__4 = function() {
        var G__11150__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__11150 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11150__delegate.call(this, a, b, c, ds)
        };
        G__11150.cljs$lang$maxFixedArity = 3;
        G__11150.cljs$lang$applyTo = function(arglist__11151) {
          var a = cljs.core.first(arglist__11151);
          var b = cljs.core.first(cljs.core.next(arglist__11151));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11151)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11151)));
          return G__11150__delegate(a, b, c, ds)
        };
        G__11150.cljs$lang$arity$variadic = G__11150__delegate;
        return G__11150
      }();
      G__11149 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__11149__2.call(this, a, b);
          case 3:
            return G__11149__3.call(this, a, b, c);
          default:
            return G__11149__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11149.cljs$lang$maxFixedArity = 3;
      G__11149.cljs$lang$applyTo = G__11149__4.cljs$lang$applyTo;
      return G__11149
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__11152 = null;
      var G__11152__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__11152__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__11152__4 = function() {
        var G__11153__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__11153 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11153__delegate.call(this, a, b, c, ds)
        };
        G__11153.cljs$lang$maxFixedArity = 3;
        G__11153.cljs$lang$applyTo = function(arglist__11154) {
          var a = cljs.core.first(arglist__11154);
          var b = cljs.core.first(cljs.core.next(arglist__11154));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11154)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11154)));
          return G__11153__delegate(a, b, c, ds)
        };
        G__11153.cljs$lang$arity$variadic = G__11153__delegate;
        return G__11153
      }();
      G__11152 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__11152__2.call(this, a, b);
          case 3:
            return G__11152__3.call(this, a, b, c);
          default:
            return G__11152__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11152.cljs$lang$maxFixedArity = 3;
      G__11152.cljs$lang$applyTo = G__11152__4.cljs$lang$applyTo;
      return G__11152
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
  var mapi__11170 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11178 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____11178) {
        var s__11179 = temp__3974__auto____11178;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__11179)) {
          var c__11180 = cljs.core.chunk_first.call(null, s__11179);
          var size__11181 = cljs.core.count.call(null, c__11180);
          var b__11182 = cljs.core.chunk_buffer.call(null, size__11181);
          var n__2582__auto____11183 = size__11181;
          var i__11184 = 0;
          while(true) {
            if(i__11184 < n__2582__auto____11183) {
              cljs.core.chunk_append.call(null, b__11182, f.call(null, idx + i__11184, cljs.core._nth.call(null, c__11180, i__11184)));
              var G__11185 = i__11184 + 1;
              i__11184 = G__11185;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__11182), mapi.call(null, idx + size__11181, cljs.core.chunk_rest.call(null, s__11179)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__11179)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__11179)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__11170.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____11195 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____11195) {
      var s__11196 = temp__3974__auto____11195;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__11196)) {
        var c__11197 = cljs.core.chunk_first.call(null, s__11196);
        var size__11198 = cljs.core.count.call(null, c__11197);
        var b__11199 = cljs.core.chunk_buffer.call(null, size__11198);
        var n__2582__auto____11200 = size__11198;
        var i__11201 = 0;
        while(true) {
          if(i__11201 < n__2582__auto____11200) {
            var x__11202 = f.call(null, cljs.core._nth.call(null, c__11197, i__11201));
            if(x__11202 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__11199, x__11202)
            }
            var G__11204 = i__11201 + 1;
            i__11201 = G__11204;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__11199), keep.call(null, f, cljs.core.chunk_rest.call(null, s__11196)))
      }else {
        var x__11203 = f.call(null, cljs.core.first.call(null, s__11196));
        if(x__11203 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__11196))
        }else {
          return cljs.core.cons.call(null, x__11203, keep.call(null, f, cljs.core.rest.call(null, s__11196)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__11230 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____11240 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____11240) {
        var s__11241 = temp__3974__auto____11240;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__11241)) {
          var c__11242 = cljs.core.chunk_first.call(null, s__11241);
          var size__11243 = cljs.core.count.call(null, c__11242);
          var b__11244 = cljs.core.chunk_buffer.call(null, size__11243);
          var n__2582__auto____11245 = size__11243;
          var i__11246 = 0;
          while(true) {
            if(i__11246 < n__2582__auto____11245) {
              var x__11247 = f.call(null, idx + i__11246, cljs.core._nth.call(null, c__11242, i__11246));
              if(x__11247 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__11244, x__11247)
              }
              var G__11249 = i__11246 + 1;
              i__11246 = G__11249;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__11244), keepi.call(null, idx + size__11243, cljs.core.chunk_rest.call(null, s__11241)))
        }else {
          var x__11248 = f.call(null, idx, cljs.core.first.call(null, s__11241));
          if(x__11248 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__11241))
          }else {
            return cljs.core.cons.call(null, x__11248, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__11241)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__11230.call(null, 0, coll)
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
          var and__3822__auto____11335 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11335)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____11335
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11336 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11336)) {
            var and__3822__auto____11337 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____11337)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____11337
            }
          }else {
            return and__3822__auto____11336
          }
        }())
      };
      var ep1__4 = function() {
        var G__11406__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____11338 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____11338)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____11338
            }
          }())
        };
        var G__11406 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11406__delegate.call(this, x, y, z, args)
        };
        G__11406.cljs$lang$maxFixedArity = 3;
        G__11406.cljs$lang$applyTo = function(arglist__11407) {
          var x = cljs.core.first(arglist__11407);
          var y = cljs.core.first(cljs.core.next(arglist__11407));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11407)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11407)));
          return G__11406__delegate(x, y, z, args)
        };
        G__11406.cljs$lang$arity$variadic = G__11406__delegate;
        return G__11406
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
          var and__3822__auto____11350 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11350)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____11350
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11351 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11351)) {
            var and__3822__auto____11352 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____11352)) {
              var and__3822__auto____11353 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____11353)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____11353
              }
            }else {
              return and__3822__auto____11352
            }
          }else {
            return and__3822__auto____11351
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11354 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11354)) {
            var and__3822__auto____11355 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____11355)) {
              var and__3822__auto____11356 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____11356)) {
                var and__3822__auto____11357 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____11357)) {
                  var and__3822__auto____11358 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____11358)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____11358
                  }
                }else {
                  return and__3822__auto____11357
                }
              }else {
                return and__3822__auto____11356
              }
            }else {
              return and__3822__auto____11355
            }
          }else {
            return and__3822__auto____11354
          }
        }())
      };
      var ep2__4 = function() {
        var G__11408__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____11359 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____11359)) {
              return cljs.core.every_QMARK_.call(null, function(p1__11205_SHARP_) {
                var and__3822__auto____11360 = p1.call(null, p1__11205_SHARP_);
                if(cljs.core.truth_(and__3822__auto____11360)) {
                  return p2.call(null, p1__11205_SHARP_)
                }else {
                  return and__3822__auto____11360
                }
              }, args)
            }else {
              return and__3822__auto____11359
            }
          }())
        };
        var G__11408 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11408__delegate.call(this, x, y, z, args)
        };
        G__11408.cljs$lang$maxFixedArity = 3;
        G__11408.cljs$lang$applyTo = function(arglist__11409) {
          var x = cljs.core.first(arglist__11409);
          var y = cljs.core.first(cljs.core.next(arglist__11409));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11409)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11409)));
          return G__11408__delegate(x, y, z, args)
        };
        G__11408.cljs$lang$arity$variadic = G__11408__delegate;
        return G__11408
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
          var and__3822__auto____11379 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11379)) {
            var and__3822__auto____11380 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____11380)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____11380
            }
          }else {
            return and__3822__auto____11379
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11381 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11381)) {
            var and__3822__auto____11382 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____11382)) {
              var and__3822__auto____11383 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____11383)) {
                var and__3822__auto____11384 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____11384)) {
                  var and__3822__auto____11385 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____11385)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____11385
                  }
                }else {
                  return and__3822__auto____11384
                }
              }else {
                return and__3822__auto____11383
              }
            }else {
              return and__3822__auto____11382
            }
          }else {
            return and__3822__auto____11381
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____11386 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____11386)) {
            var and__3822__auto____11387 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____11387)) {
              var and__3822__auto____11388 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____11388)) {
                var and__3822__auto____11389 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____11389)) {
                  var and__3822__auto____11390 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____11390)) {
                    var and__3822__auto____11391 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____11391)) {
                      var and__3822__auto____11392 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____11392)) {
                        var and__3822__auto____11393 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____11393)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____11393
                        }
                      }else {
                        return and__3822__auto____11392
                      }
                    }else {
                      return and__3822__auto____11391
                    }
                  }else {
                    return and__3822__auto____11390
                  }
                }else {
                  return and__3822__auto____11389
                }
              }else {
                return and__3822__auto____11388
              }
            }else {
              return and__3822__auto____11387
            }
          }else {
            return and__3822__auto____11386
          }
        }())
      };
      var ep3__4 = function() {
        var G__11410__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____11394 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____11394)) {
              return cljs.core.every_QMARK_.call(null, function(p1__11206_SHARP_) {
                var and__3822__auto____11395 = p1.call(null, p1__11206_SHARP_);
                if(cljs.core.truth_(and__3822__auto____11395)) {
                  var and__3822__auto____11396 = p2.call(null, p1__11206_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____11396)) {
                    return p3.call(null, p1__11206_SHARP_)
                  }else {
                    return and__3822__auto____11396
                  }
                }else {
                  return and__3822__auto____11395
                }
              }, args)
            }else {
              return and__3822__auto____11394
            }
          }())
        };
        var G__11410 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11410__delegate.call(this, x, y, z, args)
        };
        G__11410.cljs$lang$maxFixedArity = 3;
        G__11410.cljs$lang$applyTo = function(arglist__11411) {
          var x = cljs.core.first(arglist__11411);
          var y = cljs.core.first(cljs.core.next(arglist__11411));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11411)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11411)));
          return G__11410__delegate(x, y, z, args)
        };
        G__11410.cljs$lang$arity$variadic = G__11410__delegate;
        return G__11410
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
    var G__11412__delegate = function(p1, p2, p3, ps) {
      var ps__11397 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__11207_SHARP_) {
            return p1__11207_SHARP_.call(null, x)
          }, ps__11397)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__11208_SHARP_) {
            var and__3822__auto____11402 = p1__11208_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____11402)) {
              return p1__11208_SHARP_.call(null, y)
            }else {
              return and__3822__auto____11402
            }
          }, ps__11397)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__11209_SHARP_) {
            var and__3822__auto____11403 = p1__11209_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____11403)) {
              var and__3822__auto____11404 = p1__11209_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____11404)) {
                return p1__11209_SHARP_.call(null, z)
              }else {
                return and__3822__auto____11404
              }
            }else {
              return and__3822__auto____11403
            }
          }, ps__11397)
        };
        var epn__4 = function() {
          var G__11413__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____11405 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____11405)) {
                return cljs.core.every_QMARK_.call(null, function(p1__11210_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__11210_SHARP_, args)
                }, ps__11397)
              }else {
                return and__3822__auto____11405
              }
            }())
          };
          var G__11413 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__11413__delegate.call(this, x, y, z, args)
          };
          G__11413.cljs$lang$maxFixedArity = 3;
          G__11413.cljs$lang$applyTo = function(arglist__11414) {
            var x = cljs.core.first(arglist__11414);
            var y = cljs.core.first(cljs.core.next(arglist__11414));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11414)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11414)));
            return G__11413__delegate(x, y, z, args)
          };
          G__11413.cljs$lang$arity$variadic = G__11413__delegate;
          return G__11413
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
    var G__11412 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11412__delegate.call(this, p1, p2, p3, ps)
    };
    G__11412.cljs$lang$maxFixedArity = 3;
    G__11412.cljs$lang$applyTo = function(arglist__11415) {
      var p1 = cljs.core.first(arglist__11415);
      var p2 = cljs.core.first(cljs.core.next(arglist__11415));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11415)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11415)));
      return G__11412__delegate(p1, p2, p3, ps)
    };
    G__11412.cljs$lang$arity$variadic = G__11412__delegate;
    return G__11412
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
        var or__3824__auto____11496 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11496)) {
          return or__3824__auto____11496
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____11497 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11497)) {
          return or__3824__auto____11497
        }else {
          var or__3824__auto____11498 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____11498)) {
            return or__3824__auto____11498
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__11567__delegate = function(x, y, z, args) {
          var or__3824__auto____11499 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____11499)) {
            return or__3824__auto____11499
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__11567 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11567__delegate.call(this, x, y, z, args)
        };
        G__11567.cljs$lang$maxFixedArity = 3;
        G__11567.cljs$lang$applyTo = function(arglist__11568) {
          var x = cljs.core.first(arglist__11568);
          var y = cljs.core.first(cljs.core.next(arglist__11568));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11568)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11568)));
          return G__11567__delegate(x, y, z, args)
        };
        G__11567.cljs$lang$arity$variadic = G__11567__delegate;
        return G__11567
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
        var or__3824__auto____11511 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11511)) {
          return or__3824__auto____11511
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____11512 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11512)) {
          return or__3824__auto____11512
        }else {
          var or__3824__auto____11513 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____11513)) {
            return or__3824__auto____11513
          }else {
            var or__3824__auto____11514 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____11514)) {
              return or__3824__auto____11514
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____11515 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11515)) {
          return or__3824__auto____11515
        }else {
          var or__3824__auto____11516 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____11516)) {
            return or__3824__auto____11516
          }else {
            var or__3824__auto____11517 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____11517)) {
              return or__3824__auto____11517
            }else {
              var or__3824__auto____11518 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____11518)) {
                return or__3824__auto____11518
              }else {
                var or__3824__auto____11519 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____11519)) {
                  return or__3824__auto____11519
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__11569__delegate = function(x, y, z, args) {
          var or__3824__auto____11520 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____11520)) {
            return or__3824__auto____11520
          }else {
            return cljs.core.some.call(null, function(p1__11250_SHARP_) {
              var or__3824__auto____11521 = p1.call(null, p1__11250_SHARP_);
              if(cljs.core.truth_(or__3824__auto____11521)) {
                return or__3824__auto____11521
              }else {
                return p2.call(null, p1__11250_SHARP_)
              }
            }, args)
          }
        };
        var G__11569 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11569__delegate.call(this, x, y, z, args)
        };
        G__11569.cljs$lang$maxFixedArity = 3;
        G__11569.cljs$lang$applyTo = function(arglist__11570) {
          var x = cljs.core.first(arglist__11570);
          var y = cljs.core.first(cljs.core.next(arglist__11570));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11570)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11570)));
          return G__11569__delegate(x, y, z, args)
        };
        G__11569.cljs$lang$arity$variadic = G__11569__delegate;
        return G__11569
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
        var or__3824__auto____11540 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11540)) {
          return or__3824__auto____11540
        }else {
          var or__3824__auto____11541 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____11541)) {
            return or__3824__auto____11541
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____11542 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11542)) {
          return or__3824__auto____11542
        }else {
          var or__3824__auto____11543 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____11543)) {
            return or__3824__auto____11543
          }else {
            var or__3824__auto____11544 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____11544)) {
              return or__3824__auto____11544
            }else {
              var or__3824__auto____11545 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____11545)) {
                return or__3824__auto____11545
              }else {
                var or__3824__auto____11546 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____11546)) {
                  return or__3824__auto____11546
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____11547 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____11547)) {
          return or__3824__auto____11547
        }else {
          var or__3824__auto____11548 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____11548)) {
            return or__3824__auto____11548
          }else {
            var or__3824__auto____11549 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____11549)) {
              return or__3824__auto____11549
            }else {
              var or__3824__auto____11550 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____11550)) {
                return or__3824__auto____11550
              }else {
                var or__3824__auto____11551 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____11551)) {
                  return or__3824__auto____11551
                }else {
                  var or__3824__auto____11552 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____11552)) {
                    return or__3824__auto____11552
                  }else {
                    var or__3824__auto____11553 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____11553)) {
                      return or__3824__auto____11553
                    }else {
                      var or__3824__auto____11554 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____11554)) {
                        return or__3824__auto____11554
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
        var G__11571__delegate = function(x, y, z, args) {
          var or__3824__auto____11555 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____11555)) {
            return or__3824__auto____11555
          }else {
            return cljs.core.some.call(null, function(p1__11251_SHARP_) {
              var or__3824__auto____11556 = p1.call(null, p1__11251_SHARP_);
              if(cljs.core.truth_(or__3824__auto____11556)) {
                return or__3824__auto____11556
              }else {
                var or__3824__auto____11557 = p2.call(null, p1__11251_SHARP_);
                if(cljs.core.truth_(or__3824__auto____11557)) {
                  return or__3824__auto____11557
                }else {
                  return p3.call(null, p1__11251_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__11571 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11571__delegate.call(this, x, y, z, args)
        };
        G__11571.cljs$lang$maxFixedArity = 3;
        G__11571.cljs$lang$applyTo = function(arglist__11572) {
          var x = cljs.core.first(arglist__11572);
          var y = cljs.core.first(cljs.core.next(arglist__11572));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11572)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11572)));
          return G__11571__delegate(x, y, z, args)
        };
        G__11571.cljs$lang$arity$variadic = G__11571__delegate;
        return G__11571
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
    var G__11573__delegate = function(p1, p2, p3, ps) {
      var ps__11558 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__11252_SHARP_) {
            return p1__11252_SHARP_.call(null, x)
          }, ps__11558)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__11253_SHARP_) {
            var or__3824__auto____11563 = p1__11253_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____11563)) {
              return or__3824__auto____11563
            }else {
              return p1__11253_SHARP_.call(null, y)
            }
          }, ps__11558)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__11254_SHARP_) {
            var or__3824__auto____11564 = p1__11254_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____11564)) {
              return or__3824__auto____11564
            }else {
              var or__3824__auto____11565 = p1__11254_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____11565)) {
                return or__3824__auto____11565
              }else {
                return p1__11254_SHARP_.call(null, z)
              }
            }
          }, ps__11558)
        };
        var spn__4 = function() {
          var G__11574__delegate = function(x, y, z, args) {
            var or__3824__auto____11566 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____11566)) {
              return or__3824__auto____11566
            }else {
              return cljs.core.some.call(null, function(p1__11255_SHARP_) {
                return cljs.core.some.call(null, p1__11255_SHARP_, args)
              }, ps__11558)
            }
          };
          var G__11574 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__11574__delegate.call(this, x, y, z, args)
          };
          G__11574.cljs$lang$maxFixedArity = 3;
          G__11574.cljs$lang$applyTo = function(arglist__11575) {
            var x = cljs.core.first(arglist__11575);
            var y = cljs.core.first(cljs.core.next(arglist__11575));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11575)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11575)));
            return G__11574__delegate(x, y, z, args)
          };
          G__11574.cljs$lang$arity$variadic = G__11574__delegate;
          return G__11574
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
    var G__11573 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11573__delegate.call(this, p1, p2, p3, ps)
    };
    G__11573.cljs$lang$maxFixedArity = 3;
    G__11573.cljs$lang$applyTo = function(arglist__11576) {
      var p1 = cljs.core.first(arglist__11576);
      var p2 = cljs.core.first(cljs.core.next(arglist__11576));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11576)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11576)));
      return G__11573__delegate(p1, p2, p3, ps)
    };
    G__11573.cljs$lang$arity$variadic = G__11573__delegate;
    return G__11573
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
      var temp__3974__auto____11595 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____11595) {
        var s__11596 = temp__3974__auto____11595;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__11596)) {
          var c__11597 = cljs.core.chunk_first.call(null, s__11596);
          var size__11598 = cljs.core.count.call(null, c__11597);
          var b__11599 = cljs.core.chunk_buffer.call(null, size__11598);
          var n__2582__auto____11600 = size__11598;
          var i__11601 = 0;
          while(true) {
            if(i__11601 < n__2582__auto____11600) {
              cljs.core.chunk_append.call(null, b__11599, f.call(null, cljs.core._nth.call(null, c__11597, i__11601)));
              var G__11613 = i__11601 + 1;
              i__11601 = G__11613;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__11599), map.call(null, f, cljs.core.chunk_rest.call(null, s__11596)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__11596)), map.call(null, f, cljs.core.rest.call(null, s__11596)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__11602 = cljs.core.seq.call(null, c1);
      var s2__11603 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____11604 = s1__11602;
        if(and__3822__auto____11604) {
          return s2__11603
        }else {
          return and__3822__auto____11604
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__11602), cljs.core.first.call(null, s2__11603)), map.call(null, f, cljs.core.rest.call(null, s1__11602), cljs.core.rest.call(null, s2__11603)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__11605 = cljs.core.seq.call(null, c1);
      var s2__11606 = cljs.core.seq.call(null, c2);
      var s3__11607 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____11608 = s1__11605;
        if(and__3822__auto____11608) {
          var and__3822__auto____11609 = s2__11606;
          if(and__3822__auto____11609) {
            return s3__11607
          }else {
            return and__3822__auto____11609
          }
        }else {
          return and__3822__auto____11608
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__11605), cljs.core.first.call(null, s2__11606), cljs.core.first.call(null, s3__11607)), map.call(null, f, cljs.core.rest.call(null, s1__11605), cljs.core.rest.call(null, s2__11606), cljs.core.rest.call(null, s3__11607)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__11614__delegate = function(f, c1, c2, c3, colls) {
      var step__11612 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__11611 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__11611)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__11611), step.call(null, map.call(null, cljs.core.rest, ss__11611)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__11416_SHARP_) {
        return cljs.core.apply.call(null, f, p1__11416_SHARP_)
      }, step__11612.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__11614 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__11614__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__11614.cljs$lang$maxFixedArity = 4;
    G__11614.cljs$lang$applyTo = function(arglist__11615) {
      var f = cljs.core.first(arglist__11615);
      var c1 = cljs.core.first(cljs.core.next(arglist__11615));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11615)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11615))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11615))));
      return G__11614__delegate(f, c1, c2, c3, colls)
    };
    G__11614.cljs$lang$arity$variadic = G__11614__delegate;
    return G__11614
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
      var temp__3974__auto____11618 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____11618) {
        var s__11619 = temp__3974__auto____11618;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__11619), take.call(null, n - 1, cljs.core.rest.call(null, s__11619)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__11625 = function(n, coll) {
    while(true) {
      var s__11623 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____11624 = n > 0;
        if(and__3822__auto____11624) {
          return s__11623
        }else {
          return and__3822__auto____11624
        }
      }())) {
        var G__11626 = n - 1;
        var G__11627 = cljs.core.rest.call(null, s__11623);
        n = G__11626;
        coll = G__11627;
        continue
      }else {
        return s__11623
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__11625.call(null, n, coll)
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
  var s__11630 = cljs.core.seq.call(null, coll);
  var lead__11631 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__11631) {
      var G__11632 = cljs.core.next.call(null, s__11630);
      var G__11633 = cljs.core.next.call(null, lead__11631);
      s__11630 = G__11632;
      lead__11631 = G__11633;
      continue
    }else {
      return s__11630
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__11639 = function(pred, coll) {
    while(true) {
      var s__11637 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____11638 = s__11637;
        if(and__3822__auto____11638) {
          return pred.call(null, cljs.core.first.call(null, s__11637))
        }else {
          return and__3822__auto____11638
        }
      }())) {
        var G__11640 = pred;
        var G__11641 = cljs.core.rest.call(null, s__11637);
        pred = G__11640;
        coll = G__11641;
        continue
      }else {
        return s__11637
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__11639.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____11644 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____11644) {
      var s__11645 = temp__3974__auto____11644;
      return cljs.core.concat.call(null, s__11645, cycle.call(null, s__11645))
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
      var s1__11650 = cljs.core.seq.call(null, c1);
      var s2__11651 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____11652 = s1__11650;
        if(and__3822__auto____11652) {
          return s2__11651
        }else {
          return and__3822__auto____11652
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__11650), cljs.core.cons.call(null, cljs.core.first.call(null, s2__11651), interleave.call(null, cljs.core.rest.call(null, s1__11650), cljs.core.rest.call(null, s2__11651))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__11654__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__11653 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__11653)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__11653), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__11653)))
        }else {
          return null
        }
      }, null)
    };
    var G__11654 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11654__delegate.call(this, c1, c2, colls)
    };
    G__11654.cljs$lang$maxFixedArity = 2;
    G__11654.cljs$lang$applyTo = function(arglist__11655) {
      var c1 = cljs.core.first(arglist__11655);
      var c2 = cljs.core.first(cljs.core.next(arglist__11655));
      var colls = cljs.core.rest(cljs.core.next(arglist__11655));
      return G__11654__delegate(c1, c2, colls)
    };
    G__11654.cljs$lang$arity$variadic = G__11654__delegate;
    return G__11654
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
  var cat__11665 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____11663 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____11663) {
        var coll__11664 = temp__3971__auto____11663;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__11664), cat.call(null, cljs.core.rest.call(null, coll__11664), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__11665.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__11666__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__11666 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__11666__delegate.call(this, f, coll, colls)
    };
    G__11666.cljs$lang$maxFixedArity = 2;
    G__11666.cljs$lang$applyTo = function(arglist__11667) {
      var f = cljs.core.first(arglist__11667);
      var coll = cljs.core.first(cljs.core.next(arglist__11667));
      var colls = cljs.core.rest(cljs.core.next(arglist__11667));
      return G__11666__delegate(f, coll, colls)
    };
    G__11666.cljs$lang$arity$variadic = G__11666__delegate;
    return G__11666
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
    var temp__3974__auto____11677 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____11677) {
      var s__11678 = temp__3974__auto____11677;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__11678)) {
        var c__11679 = cljs.core.chunk_first.call(null, s__11678);
        var size__11680 = cljs.core.count.call(null, c__11679);
        var b__11681 = cljs.core.chunk_buffer.call(null, size__11680);
        var n__2582__auto____11682 = size__11680;
        var i__11683 = 0;
        while(true) {
          if(i__11683 < n__2582__auto____11682) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__11679, i__11683)))) {
              cljs.core.chunk_append.call(null, b__11681, cljs.core._nth.call(null, c__11679, i__11683))
            }else {
            }
            var G__11686 = i__11683 + 1;
            i__11683 = G__11686;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__11681), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__11678)))
      }else {
        var f__11684 = cljs.core.first.call(null, s__11678);
        var r__11685 = cljs.core.rest.call(null, s__11678);
        if(cljs.core.truth_(pred.call(null, f__11684))) {
          return cljs.core.cons.call(null, f__11684, filter.call(null, pred, r__11685))
        }else {
          return filter.call(null, pred, r__11685)
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
  var walk__11689 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__11689.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__11687_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__11687_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__11693__11694 = to;
    if(G__11693__11694) {
      if(function() {
        var or__3824__auto____11695 = G__11693__11694.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____11695) {
          return or__3824__auto____11695
        }else {
          return G__11693__11694.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__11693__11694.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__11693__11694)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__11693__11694)
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
    var G__11696__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__11696 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__11696__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__11696.cljs$lang$maxFixedArity = 4;
    G__11696.cljs$lang$applyTo = function(arglist__11697) {
      var f = cljs.core.first(arglist__11697);
      var c1 = cljs.core.first(cljs.core.next(arglist__11697));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11697)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11697))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11697))));
      return G__11696__delegate(f, c1, c2, c3, colls)
    };
    G__11696.cljs$lang$arity$variadic = G__11696__delegate;
    return G__11696
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
      var temp__3974__auto____11704 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____11704) {
        var s__11705 = temp__3974__auto____11704;
        var p__11706 = cljs.core.take.call(null, n, s__11705);
        if(n === cljs.core.count.call(null, p__11706)) {
          return cljs.core.cons.call(null, p__11706, partition.call(null, n, step, cljs.core.drop.call(null, step, s__11705)))
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
      var temp__3974__auto____11707 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____11707) {
        var s__11708 = temp__3974__auto____11707;
        var p__11709 = cljs.core.take.call(null, n, s__11708);
        if(n === cljs.core.count.call(null, p__11709)) {
          return cljs.core.cons.call(null, p__11709, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__11708)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__11709, pad)))
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
    var sentinel__11714 = cljs.core.lookup_sentinel;
    var m__11715 = m;
    var ks__11716 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__11716) {
        var m__11717 = cljs.core._lookup.call(null, m__11715, cljs.core.first.call(null, ks__11716), sentinel__11714);
        if(sentinel__11714 === m__11717) {
          return not_found
        }else {
          var G__11718 = sentinel__11714;
          var G__11719 = m__11717;
          var G__11720 = cljs.core.next.call(null, ks__11716);
          sentinel__11714 = G__11718;
          m__11715 = G__11719;
          ks__11716 = G__11720;
          continue
        }
      }else {
        return m__11715
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
cljs.core.assoc_in = function assoc_in(m, p__11721, v) {
  var vec__11726__11727 = p__11721;
  var k__11728 = cljs.core.nth.call(null, vec__11726__11727, 0, null);
  var ks__11729 = cljs.core.nthnext.call(null, vec__11726__11727, 1);
  if(cljs.core.truth_(ks__11729)) {
    return cljs.core.assoc.call(null, m, k__11728, assoc_in.call(null, cljs.core._lookup.call(null, m, k__11728, null), ks__11729, v))
  }else {
    return cljs.core.assoc.call(null, m, k__11728, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__11730, f, args) {
    var vec__11735__11736 = p__11730;
    var k__11737 = cljs.core.nth.call(null, vec__11735__11736, 0, null);
    var ks__11738 = cljs.core.nthnext.call(null, vec__11735__11736, 1);
    if(cljs.core.truth_(ks__11738)) {
      return cljs.core.assoc.call(null, m, k__11737, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__11737, null), ks__11738, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__11737, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__11737, null), args))
    }
  };
  var update_in = function(m, p__11730, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__11730, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__11739) {
    var m = cljs.core.first(arglist__11739);
    var p__11730 = cljs.core.first(cljs.core.next(arglist__11739));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11739)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11739)));
    return update_in__delegate(m, p__11730, f, args)
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
  var this__11742 = this;
  var h__2247__auto____11743 = this__11742.__hash;
  if(!(h__2247__auto____11743 == null)) {
    return h__2247__auto____11743
  }else {
    var h__2247__auto____11744 = cljs.core.hash_coll.call(null, coll);
    this__11742.__hash = h__2247__auto____11744;
    return h__2247__auto____11744
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__11745 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__11746 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__11747 = this;
  var new_array__11748 = this__11747.array.slice();
  new_array__11748[k] = v;
  return new cljs.core.Vector(this__11747.meta, new_array__11748, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__11779 = null;
  var G__11779__2 = function(this_sym11749, k) {
    var this__11751 = this;
    var this_sym11749__11752 = this;
    var coll__11753 = this_sym11749__11752;
    return coll__11753.cljs$core$ILookup$_lookup$arity$2(coll__11753, k)
  };
  var G__11779__3 = function(this_sym11750, k, not_found) {
    var this__11751 = this;
    var this_sym11750__11754 = this;
    var coll__11755 = this_sym11750__11754;
    return coll__11755.cljs$core$ILookup$_lookup$arity$3(coll__11755, k, not_found)
  };
  G__11779 = function(this_sym11750, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11779__2.call(this, this_sym11750, k);
      case 3:
        return G__11779__3.call(this, this_sym11750, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11779
}();
cljs.core.Vector.prototype.apply = function(this_sym11740, args11741) {
  var this__11756 = this;
  return this_sym11740.call.apply(this_sym11740, [this_sym11740].concat(args11741.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11757 = this;
  var new_array__11758 = this__11757.array.slice();
  new_array__11758.push(o);
  return new cljs.core.Vector(this__11757.meta, new_array__11758, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__11759 = this;
  var this__11760 = this;
  return cljs.core.pr_str.call(null, this__11760)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__11761 = this;
  return cljs.core.ci_reduce.call(null, this__11761.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__11762 = this;
  return cljs.core.ci_reduce.call(null, this__11762.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11763 = this;
  if(this__11763.array.length > 0) {
    var vector_seq__11764 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__11763.array.length) {
          return cljs.core.cons.call(null, this__11763.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__11764.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11765 = this;
  return this__11765.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__11766 = this;
  var count__11767 = this__11766.array.length;
  if(count__11767 > 0) {
    return this__11766.array[count__11767 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__11768 = this;
  if(this__11768.array.length > 0) {
    var new_array__11769 = this__11768.array.slice();
    new_array__11769.pop();
    return new cljs.core.Vector(this__11768.meta, new_array__11769, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__11770 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11771 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11772 = this;
  return new cljs.core.Vector(meta, this__11772.array, this__11772.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11773 = this;
  return this__11773.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__11774 = this;
  if(function() {
    var and__3822__auto____11775 = 0 <= n;
    if(and__3822__auto____11775) {
      return n < this__11774.array.length
    }else {
      return and__3822__auto____11775
    }
  }()) {
    return this__11774.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__11776 = this;
  if(function() {
    var and__3822__auto____11777 = 0 <= n;
    if(and__3822__auto____11777) {
      return n < this__11776.array.length
    }else {
      return and__3822__auto____11777
    }
  }()) {
    return this__11776.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11778 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__11778.meta)
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
  var cnt__11781 = pv.cnt;
  if(cnt__11781 < 32) {
    return 0
  }else {
    return cnt__11781 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__11787 = level;
  var ret__11788 = node;
  while(true) {
    if(ll__11787 === 0) {
      return ret__11788
    }else {
      var embed__11789 = ret__11788;
      var r__11790 = cljs.core.pv_fresh_node.call(null, edit);
      var ___11791 = cljs.core.pv_aset.call(null, r__11790, 0, embed__11789);
      var G__11792 = ll__11787 - 5;
      var G__11793 = r__11790;
      ll__11787 = G__11792;
      ret__11788 = G__11793;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__11799 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__11800 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__11799, subidx__11800, tailnode);
    return ret__11799
  }else {
    var child__11801 = cljs.core.pv_aget.call(null, parent, subidx__11800);
    if(!(child__11801 == null)) {
      var node_to_insert__11802 = push_tail.call(null, pv, level - 5, child__11801, tailnode);
      cljs.core.pv_aset.call(null, ret__11799, subidx__11800, node_to_insert__11802);
      return ret__11799
    }else {
      var node_to_insert__11803 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__11799, subidx__11800, node_to_insert__11803);
      return ret__11799
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____11807 = 0 <= i;
    if(and__3822__auto____11807) {
      return i < pv.cnt
    }else {
      return and__3822__auto____11807
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__11808 = pv.root;
      var level__11809 = pv.shift;
      while(true) {
        if(level__11809 > 0) {
          var G__11810 = cljs.core.pv_aget.call(null, node__11808, i >>> level__11809 & 31);
          var G__11811 = level__11809 - 5;
          node__11808 = G__11810;
          level__11809 = G__11811;
          continue
        }else {
          return node__11808.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__11814 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__11814, i & 31, val);
    return ret__11814
  }else {
    var subidx__11815 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__11814, subidx__11815, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__11815), i, val));
    return ret__11814
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__11821 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__11822 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__11821));
    if(function() {
      var and__3822__auto____11823 = new_child__11822 == null;
      if(and__3822__auto____11823) {
        return subidx__11821 === 0
      }else {
        return and__3822__auto____11823
      }
    }()) {
      return null
    }else {
      var ret__11824 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__11824, subidx__11821, new_child__11822);
      return ret__11824
    }
  }else {
    if(subidx__11821 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__11825 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__11825, subidx__11821, null);
        return ret__11825
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
  var this__11828 = this;
  return new cljs.core.TransientVector(this__11828.cnt, this__11828.shift, cljs.core.tv_editable_root.call(null, this__11828.root), cljs.core.tv_editable_tail.call(null, this__11828.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__11829 = this;
  var h__2247__auto____11830 = this__11829.__hash;
  if(!(h__2247__auto____11830 == null)) {
    return h__2247__auto____11830
  }else {
    var h__2247__auto____11831 = cljs.core.hash_coll.call(null, coll);
    this__11829.__hash = h__2247__auto____11831;
    return h__2247__auto____11831
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__11832 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__11833 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__11834 = this;
  if(function() {
    var and__3822__auto____11835 = 0 <= k;
    if(and__3822__auto____11835) {
      return k < this__11834.cnt
    }else {
      return and__3822__auto____11835
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__11836 = this__11834.tail.slice();
      new_tail__11836[k & 31] = v;
      return new cljs.core.PersistentVector(this__11834.meta, this__11834.cnt, this__11834.shift, this__11834.root, new_tail__11836, null)
    }else {
      return new cljs.core.PersistentVector(this__11834.meta, this__11834.cnt, this__11834.shift, cljs.core.do_assoc.call(null, coll, this__11834.shift, this__11834.root, k, v), this__11834.tail, null)
    }
  }else {
    if(k === this__11834.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__11834.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__11884 = null;
  var G__11884__2 = function(this_sym11837, k) {
    var this__11839 = this;
    var this_sym11837__11840 = this;
    var coll__11841 = this_sym11837__11840;
    return coll__11841.cljs$core$ILookup$_lookup$arity$2(coll__11841, k)
  };
  var G__11884__3 = function(this_sym11838, k, not_found) {
    var this__11839 = this;
    var this_sym11838__11842 = this;
    var coll__11843 = this_sym11838__11842;
    return coll__11843.cljs$core$ILookup$_lookup$arity$3(coll__11843, k, not_found)
  };
  G__11884 = function(this_sym11838, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11884__2.call(this, this_sym11838, k);
      case 3:
        return G__11884__3.call(this, this_sym11838, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11884
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym11826, args11827) {
  var this__11844 = this;
  return this_sym11826.call.apply(this_sym11826, [this_sym11826].concat(args11827.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__11845 = this;
  var step_init__11846 = [0, init];
  var i__11847 = 0;
  while(true) {
    if(i__11847 < this__11845.cnt) {
      var arr__11848 = cljs.core.array_for.call(null, v, i__11847);
      var len__11849 = arr__11848.length;
      var init__11853 = function() {
        var j__11850 = 0;
        var init__11851 = step_init__11846[1];
        while(true) {
          if(j__11850 < len__11849) {
            var init__11852 = f.call(null, init__11851, j__11850 + i__11847, arr__11848[j__11850]);
            if(cljs.core.reduced_QMARK_.call(null, init__11852)) {
              return init__11852
            }else {
              var G__11885 = j__11850 + 1;
              var G__11886 = init__11852;
              j__11850 = G__11885;
              init__11851 = G__11886;
              continue
            }
          }else {
            step_init__11846[0] = len__11849;
            step_init__11846[1] = init__11851;
            return init__11851
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__11853)) {
        return cljs.core.deref.call(null, init__11853)
      }else {
        var G__11887 = i__11847 + step_init__11846[0];
        i__11847 = G__11887;
        continue
      }
    }else {
      return step_init__11846[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11854 = this;
  if(this__11854.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__11855 = this__11854.tail.slice();
    new_tail__11855.push(o);
    return new cljs.core.PersistentVector(this__11854.meta, this__11854.cnt + 1, this__11854.shift, this__11854.root, new_tail__11855, null)
  }else {
    var root_overflow_QMARK___11856 = this__11854.cnt >>> 5 > 1 << this__11854.shift;
    var new_shift__11857 = root_overflow_QMARK___11856 ? this__11854.shift + 5 : this__11854.shift;
    var new_root__11859 = root_overflow_QMARK___11856 ? function() {
      var n_r__11858 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__11858, 0, this__11854.root);
      cljs.core.pv_aset.call(null, n_r__11858, 1, cljs.core.new_path.call(null, null, this__11854.shift, new cljs.core.VectorNode(null, this__11854.tail)));
      return n_r__11858
    }() : cljs.core.push_tail.call(null, coll, this__11854.shift, this__11854.root, new cljs.core.VectorNode(null, this__11854.tail));
    return new cljs.core.PersistentVector(this__11854.meta, this__11854.cnt + 1, new_shift__11857, new_root__11859, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__11860 = this;
  if(this__11860.cnt > 0) {
    return new cljs.core.RSeq(coll, this__11860.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__11861 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__11862 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__11863 = this;
  var this__11864 = this;
  return cljs.core.pr_str.call(null, this__11864)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__11865 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__11866 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11867 = this;
  if(this__11867.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11868 = this;
  return this__11868.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__11869 = this;
  if(this__11869.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__11869.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__11870 = this;
  if(this__11870.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__11870.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__11870.meta)
    }else {
      if(1 < this__11870.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__11870.meta, this__11870.cnt - 1, this__11870.shift, this__11870.root, this__11870.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__11871 = cljs.core.array_for.call(null, coll, this__11870.cnt - 2);
          var nr__11872 = cljs.core.pop_tail.call(null, coll, this__11870.shift, this__11870.root);
          var new_root__11873 = nr__11872 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__11872;
          var cnt_1__11874 = this__11870.cnt - 1;
          if(function() {
            var and__3822__auto____11875 = 5 < this__11870.shift;
            if(and__3822__auto____11875) {
              return cljs.core.pv_aget.call(null, new_root__11873, 1) == null
            }else {
              return and__3822__auto____11875
            }
          }()) {
            return new cljs.core.PersistentVector(this__11870.meta, cnt_1__11874, this__11870.shift - 5, cljs.core.pv_aget.call(null, new_root__11873, 0), new_tail__11871, null)
          }else {
            return new cljs.core.PersistentVector(this__11870.meta, cnt_1__11874, this__11870.shift, new_root__11873, new_tail__11871, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__11876 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11877 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11878 = this;
  return new cljs.core.PersistentVector(meta, this__11878.cnt, this__11878.shift, this__11878.root, this__11878.tail, this__11878.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11879 = this;
  return this__11879.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__11880 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__11881 = this;
  if(function() {
    var and__3822__auto____11882 = 0 <= n;
    if(and__3822__auto____11882) {
      return n < this__11881.cnt
    }else {
      return and__3822__auto____11882
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11883 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__11883.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__11888 = xs.length;
  var xs__11889 = no_clone === true ? xs : xs.slice();
  if(l__11888 < 32) {
    return new cljs.core.PersistentVector(null, l__11888, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__11889, null)
  }else {
    var node__11890 = xs__11889.slice(0, 32);
    var v__11891 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__11890, null);
    var i__11892 = 32;
    var out__11893 = cljs.core._as_transient.call(null, v__11891);
    while(true) {
      if(i__11892 < l__11888) {
        var G__11894 = i__11892 + 1;
        var G__11895 = cljs.core.conj_BANG_.call(null, out__11893, xs__11889[i__11892]);
        i__11892 = G__11894;
        out__11893 = G__11895;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__11893)
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
  vector.cljs$lang$applyTo = function(arglist__11896) {
    var args = cljs.core.seq(arglist__11896);
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
  var this__11897 = this;
  if(this__11897.off + 1 < this__11897.node.length) {
    var s__11898 = cljs.core.chunked_seq.call(null, this__11897.vec, this__11897.node, this__11897.i, this__11897.off + 1);
    if(s__11898 == null) {
      return null
    }else {
      return s__11898
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11899 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11900 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__11901 = this;
  return this__11901.node[this__11901.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__11902 = this;
  if(this__11902.off + 1 < this__11902.node.length) {
    var s__11903 = cljs.core.chunked_seq.call(null, this__11902.vec, this__11902.node, this__11902.i, this__11902.off + 1);
    if(s__11903 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__11903
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__11904 = this;
  var l__11905 = this__11904.node.length;
  var s__11906 = this__11904.i + l__11905 < cljs.core._count.call(null, this__11904.vec) ? cljs.core.chunked_seq.call(null, this__11904.vec, this__11904.i + l__11905, 0) : null;
  if(s__11906 == null) {
    return null
  }else {
    return s__11906
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11907 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__11908 = this;
  return cljs.core.chunked_seq.call(null, this__11908.vec, this__11908.node, this__11908.i, this__11908.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__11909 = this;
  return this__11909.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11910 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__11910.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__11911 = this;
  return cljs.core.array_chunk.call(null, this__11911.node, this__11911.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__11912 = this;
  var l__11913 = this__11912.node.length;
  var s__11914 = this__11912.i + l__11913 < cljs.core._count.call(null, this__11912.vec) ? cljs.core.chunked_seq.call(null, this__11912.vec, this__11912.i + l__11913, 0) : null;
  if(s__11914 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__11914
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
  var this__11917 = this;
  var h__2247__auto____11918 = this__11917.__hash;
  if(!(h__2247__auto____11918 == null)) {
    return h__2247__auto____11918
  }else {
    var h__2247__auto____11919 = cljs.core.hash_coll.call(null, coll);
    this__11917.__hash = h__2247__auto____11919;
    return h__2247__auto____11919
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__11920 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__11921 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__11922 = this;
  var v_pos__11923 = this__11922.start + key;
  return new cljs.core.Subvec(this__11922.meta, cljs.core._assoc.call(null, this__11922.v, v_pos__11923, val), this__11922.start, this__11922.end > v_pos__11923 + 1 ? this__11922.end : v_pos__11923 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__11949 = null;
  var G__11949__2 = function(this_sym11924, k) {
    var this__11926 = this;
    var this_sym11924__11927 = this;
    var coll__11928 = this_sym11924__11927;
    return coll__11928.cljs$core$ILookup$_lookup$arity$2(coll__11928, k)
  };
  var G__11949__3 = function(this_sym11925, k, not_found) {
    var this__11926 = this;
    var this_sym11925__11929 = this;
    var coll__11930 = this_sym11925__11929;
    return coll__11930.cljs$core$ILookup$_lookup$arity$3(coll__11930, k, not_found)
  };
  G__11949 = function(this_sym11925, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11949__2.call(this, this_sym11925, k);
      case 3:
        return G__11949__3.call(this, this_sym11925, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11949
}();
cljs.core.Subvec.prototype.apply = function(this_sym11915, args11916) {
  var this__11931 = this;
  return this_sym11915.call.apply(this_sym11915, [this_sym11915].concat(args11916.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__11932 = this;
  return new cljs.core.Subvec(this__11932.meta, cljs.core._assoc_n.call(null, this__11932.v, this__11932.end, o), this__11932.start, this__11932.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__11933 = this;
  var this__11934 = this;
  return cljs.core.pr_str.call(null, this__11934)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__11935 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__11936 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__11937 = this;
  var subvec_seq__11938 = function subvec_seq(i) {
    if(i === this__11937.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__11937.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__11938.call(null, this__11937.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11939 = this;
  return this__11939.end - this__11939.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__11940 = this;
  return cljs.core._nth.call(null, this__11940.v, this__11940.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__11941 = this;
  if(this__11941.start === this__11941.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__11941.meta, this__11941.v, this__11941.start, this__11941.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__11942 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__11943 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__11944 = this;
  return new cljs.core.Subvec(meta, this__11944.v, this__11944.start, this__11944.end, this__11944.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__11945 = this;
  return this__11945.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__11946 = this;
  return cljs.core._nth.call(null, this__11946.v, this__11946.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__11947 = this;
  return cljs.core._nth.call(null, this__11947.v, this__11947.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__11948 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__11948.meta)
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
  var ret__11951 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__11951, 0, tl.length);
  return ret__11951
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__11955 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__11956 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__11955, subidx__11956, level === 5 ? tail_node : function() {
    var child__11957 = cljs.core.pv_aget.call(null, ret__11955, subidx__11956);
    if(!(child__11957 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__11957, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__11955
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__11962 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__11963 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__11964 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__11962, subidx__11963));
    if(function() {
      var and__3822__auto____11965 = new_child__11964 == null;
      if(and__3822__auto____11965) {
        return subidx__11963 === 0
      }else {
        return and__3822__auto____11965
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__11962, subidx__11963, new_child__11964);
      return node__11962
    }
  }else {
    if(subidx__11963 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__11962, subidx__11963, null);
        return node__11962
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____11970 = 0 <= i;
    if(and__3822__auto____11970) {
      return i < tv.cnt
    }else {
      return and__3822__auto____11970
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__11971 = tv.root;
      var node__11972 = root__11971;
      var level__11973 = tv.shift;
      while(true) {
        if(level__11973 > 0) {
          var G__11974 = cljs.core.tv_ensure_editable.call(null, root__11971.edit, cljs.core.pv_aget.call(null, node__11972, i >>> level__11973 & 31));
          var G__11975 = level__11973 - 5;
          node__11972 = G__11974;
          level__11973 = G__11975;
          continue
        }else {
          return node__11972.arr
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
  var G__12015 = null;
  var G__12015__2 = function(this_sym11978, k) {
    var this__11980 = this;
    var this_sym11978__11981 = this;
    var coll__11982 = this_sym11978__11981;
    return coll__11982.cljs$core$ILookup$_lookup$arity$2(coll__11982, k)
  };
  var G__12015__3 = function(this_sym11979, k, not_found) {
    var this__11980 = this;
    var this_sym11979__11983 = this;
    var coll__11984 = this_sym11979__11983;
    return coll__11984.cljs$core$ILookup$_lookup$arity$3(coll__11984, k, not_found)
  };
  G__12015 = function(this_sym11979, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12015__2.call(this, this_sym11979, k);
      case 3:
        return G__12015__3.call(this, this_sym11979, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12015
}();
cljs.core.TransientVector.prototype.apply = function(this_sym11976, args11977) {
  var this__11985 = this;
  return this_sym11976.call.apply(this_sym11976, [this_sym11976].concat(args11977.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__11986 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__11987 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__11988 = this;
  if(this__11988.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__11989 = this;
  if(function() {
    var and__3822__auto____11990 = 0 <= n;
    if(and__3822__auto____11990) {
      return n < this__11989.cnt
    }else {
      return and__3822__auto____11990
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__11991 = this;
  if(this__11991.root.edit) {
    return this__11991.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__11992 = this;
  if(this__11992.root.edit) {
    if(function() {
      var and__3822__auto____11993 = 0 <= n;
      if(and__3822__auto____11993) {
        return n < this__11992.cnt
      }else {
        return and__3822__auto____11993
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__11992.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__11998 = function go(level, node) {
          var node__11996 = cljs.core.tv_ensure_editable.call(null, this__11992.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__11996, n & 31, val);
            return node__11996
          }else {
            var subidx__11997 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__11996, subidx__11997, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__11996, subidx__11997)));
            return node__11996
          }
        }.call(null, this__11992.shift, this__11992.root);
        this__11992.root = new_root__11998;
        return tcoll
      }
    }else {
      if(n === this__11992.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__11992.cnt)].join(""));
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
  var this__11999 = this;
  if(this__11999.root.edit) {
    if(this__11999.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__11999.cnt) {
        this__11999.cnt = 0;
        return tcoll
      }else {
        if((this__11999.cnt - 1 & 31) > 0) {
          this__11999.cnt = this__11999.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__12000 = cljs.core.editable_array_for.call(null, tcoll, this__11999.cnt - 2);
            var new_root__12002 = function() {
              var nr__12001 = cljs.core.tv_pop_tail.call(null, tcoll, this__11999.shift, this__11999.root);
              if(!(nr__12001 == null)) {
                return nr__12001
              }else {
                return new cljs.core.VectorNode(this__11999.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____12003 = 5 < this__11999.shift;
              if(and__3822__auto____12003) {
                return cljs.core.pv_aget.call(null, new_root__12002, 1) == null
              }else {
                return and__3822__auto____12003
              }
            }()) {
              var new_root__12004 = cljs.core.tv_ensure_editable.call(null, this__11999.root.edit, cljs.core.pv_aget.call(null, new_root__12002, 0));
              this__11999.root = new_root__12004;
              this__11999.shift = this__11999.shift - 5;
              this__11999.cnt = this__11999.cnt - 1;
              this__11999.tail = new_tail__12000;
              return tcoll
            }else {
              this__11999.root = new_root__12002;
              this__11999.cnt = this__11999.cnt - 1;
              this__11999.tail = new_tail__12000;
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
  var this__12005 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__12006 = this;
  if(this__12006.root.edit) {
    if(this__12006.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__12006.tail[this__12006.cnt & 31] = o;
      this__12006.cnt = this__12006.cnt + 1;
      return tcoll
    }else {
      var tail_node__12007 = new cljs.core.VectorNode(this__12006.root.edit, this__12006.tail);
      var new_tail__12008 = cljs.core.make_array.call(null, 32);
      new_tail__12008[0] = o;
      this__12006.tail = new_tail__12008;
      if(this__12006.cnt >>> 5 > 1 << this__12006.shift) {
        var new_root_array__12009 = cljs.core.make_array.call(null, 32);
        var new_shift__12010 = this__12006.shift + 5;
        new_root_array__12009[0] = this__12006.root;
        new_root_array__12009[1] = cljs.core.new_path.call(null, this__12006.root.edit, this__12006.shift, tail_node__12007);
        this__12006.root = new cljs.core.VectorNode(this__12006.root.edit, new_root_array__12009);
        this__12006.shift = new_shift__12010;
        this__12006.cnt = this__12006.cnt + 1;
        return tcoll
      }else {
        var new_root__12011 = cljs.core.tv_push_tail.call(null, tcoll, this__12006.shift, this__12006.root, tail_node__12007);
        this__12006.root = new_root__12011;
        this__12006.cnt = this__12006.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__12012 = this;
  if(this__12012.root.edit) {
    this__12012.root.edit = null;
    var len__12013 = this__12012.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__12014 = cljs.core.make_array.call(null, len__12013);
    cljs.core.array_copy.call(null, this__12012.tail, 0, trimmed_tail__12014, 0, len__12013);
    return new cljs.core.PersistentVector(null, this__12012.cnt, this__12012.shift, this__12012.root, trimmed_tail__12014, null)
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
  var this__12016 = this;
  var h__2247__auto____12017 = this__12016.__hash;
  if(!(h__2247__auto____12017 == null)) {
    return h__2247__auto____12017
  }else {
    var h__2247__auto____12018 = cljs.core.hash_coll.call(null, coll);
    this__12016.__hash = h__2247__auto____12018;
    return h__2247__auto____12018
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12019 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__12020 = this;
  var this__12021 = this;
  return cljs.core.pr_str.call(null, this__12021)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12022 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__12023 = this;
  return cljs.core._first.call(null, this__12023.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__12024 = this;
  var temp__3971__auto____12025 = cljs.core.next.call(null, this__12024.front);
  if(temp__3971__auto____12025) {
    var f1__12026 = temp__3971__auto____12025;
    return new cljs.core.PersistentQueueSeq(this__12024.meta, f1__12026, this__12024.rear, null)
  }else {
    if(this__12024.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__12024.meta, this__12024.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12027 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12028 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__12028.front, this__12028.rear, this__12028.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12029 = this;
  return this__12029.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12030 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__12030.meta)
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
  var this__12031 = this;
  var h__2247__auto____12032 = this__12031.__hash;
  if(!(h__2247__auto____12032 == null)) {
    return h__2247__auto____12032
  }else {
    var h__2247__auto____12033 = cljs.core.hash_coll.call(null, coll);
    this__12031.__hash = h__2247__auto____12033;
    return h__2247__auto____12033
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12034 = this;
  if(cljs.core.truth_(this__12034.front)) {
    return new cljs.core.PersistentQueue(this__12034.meta, this__12034.count + 1, this__12034.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____12035 = this__12034.rear;
      if(cljs.core.truth_(or__3824__auto____12035)) {
        return or__3824__auto____12035
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__12034.meta, this__12034.count + 1, cljs.core.conj.call(null, this__12034.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__12036 = this;
  var this__12037 = this;
  return cljs.core.pr_str.call(null, this__12037)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12038 = this;
  var rear__12039 = cljs.core.seq.call(null, this__12038.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____12040 = this__12038.front;
    if(cljs.core.truth_(or__3824__auto____12040)) {
      return or__3824__auto____12040
    }else {
      return rear__12039
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__12038.front, cljs.core.seq.call(null, rear__12039), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12041 = this;
  return this__12041.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__12042 = this;
  return cljs.core._first.call(null, this__12042.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__12043 = this;
  if(cljs.core.truth_(this__12043.front)) {
    var temp__3971__auto____12044 = cljs.core.next.call(null, this__12043.front);
    if(temp__3971__auto____12044) {
      var f1__12045 = temp__3971__auto____12044;
      return new cljs.core.PersistentQueue(this__12043.meta, this__12043.count - 1, f1__12045, this__12043.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__12043.meta, this__12043.count - 1, cljs.core.seq.call(null, this__12043.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__12046 = this;
  return cljs.core.first.call(null, this__12046.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__12047 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12048 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12049 = this;
  return new cljs.core.PersistentQueue(meta, this__12049.count, this__12049.front, this__12049.rear, this__12049.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12050 = this;
  return this__12050.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12051 = this;
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
  var this__12052 = this;
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
  var len__12055 = array.length;
  var i__12056 = 0;
  while(true) {
    if(i__12056 < len__12055) {
      if(k === array[i__12056]) {
        return i__12056
      }else {
        var G__12057 = i__12056 + incr;
        i__12056 = G__12057;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__12060 = cljs.core.hash.call(null, a);
  var b__12061 = cljs.core.hash.call(null, b);
  if(a__12060 < b__12061) {
    return-1
  }else {
    if(a__12060 > b__12061) {
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
  var ks__12069 = m.keys;
  var len__12070 = ks__12069.length;
  var so__12071 = m.strobj;
  var out__12072 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__12073 = 0;
  var out__12074 = cljs.core.transient$.call(null, out__12072);
  while(true) {
    if(i__12073 < len__12070) {
      var k__12075 = ks__12069[i__12073];
      var G__12076 = i__12073 + 1;
      var G__12077 = cljs.core.assoc_BANG_.call(null, out__12074, k__12075, so__12071[k__12075]);
      i__12073 = G__12076;
      out__12074 = G__12077;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__12074, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__12083 = {};
  var l__12084 = ks.length;
  var i__12085 = 0;
  while(true) {
    if(i__12085 < l__12084) {
      var k__12086 = ks[i__12085];
      new_obj__12083[k__12086] = obj[k__12086];
      var G__12087 = i__12085 + 1;
      i__12085 = G__12087;
      continue
    }else {
    }
    break
  }
  return new_obj__12083
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
  var this__12090 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__12091 = this;
  var h__2247__auto____12092 = this__12091.__hash;
  if(!(h__2247__auto____12092 == null)) {
    return h__2247__auto____12092
  }else {
    var h__2247__auto____12093 = cljs.core.hash_imap.call(null, coll);
    this__12091.__hash = h__2247__auto____12093;
    return h__2247__auto____12093
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__12094 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__12095 = this;
  if(function() {
    var and__3822__auto____12096 = goog.isString(k);
    if(and__3822__auto____12096) {
      return!(cljs.core.scan_array.call(null, 1, k, this__12095.keys) == null)
    }else {
      return and__3822__auto____12096
    }
  }()) {
    return this__12095.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__12097 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____12098 = this__12097.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____12098) {
        return or__3824__auto____12098
      }else {
        return this__12097.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__12097.keys) == null)) {
        var new_strobj__12099 = cljs.core.obj_clone.call(null, this__12097.strobj, this__12097.keys);
        new_strobj__12099[k] = v;
        return new cljs.core.ObjMap(this__12097.meta, this__12097.keys, new_strobj__12099, this__12097.update_count + 1, null)
      }else {
        var new_strobj__12100 = cljs.core.obj_clone.call(null, this__12097.strobj, this__12097.keys);
        var new_keys__12101 = this__12097.keys.slice();
        new_strobj__12100[k] = v;
        new_keys__12101.push(k);
        return new cljs.core.ObjMap(this__12097.meta, new_keys__12101, new_strobj__12100, this__12097.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__12102 = this;
  if(function() {
    var and__3822__auto____12103 = goog.isString(k);
    if(and__3822__auto____12103) {
      return!(cljs.core.scan_array.call(null, 1, k, this__12102.keys) == null)
    }else {
      return and__3822__auto____12103
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__12125 = null;
  var G__12125__2 = function(this_sym12104, k) {
    var this__12106 = this;
    var this_sym12104__12107 = this;
    var coll__12108 = this_sym12104__12107;
    return coll__12108.cljs$core$ILookup$_lookup$arity$2(coll__12108, k)
  };
  var G__12125__3 = function(this_sym12105, k, not_found) {
    var this__12106 = this;
    var this_sym12105__12109 = this;
    var coll__12110 = this_sym12105__12109;
    return coll__12110.cljs$core$ILookup$_lookup$arity$3(coll__12110, k, not_found)
  };
  G__12125 = function(this_sym12105, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12125__2.call(this, this_sym12105, k);
      case 3:
        return G__12125__3.call(this, this_sym12105, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12125
}();
cljs.core.ObjMap.prototype.apply = function(this_sym12088, args12089) {
  var this__12111 = this;
  return this_sym12088.call.apply(this_sym12088, [this_sym12088].concat(args12089.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__12112 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__12113 = this;
  var this__12114 = this;
  return cljs.core.pr_str.call(null, this__12114)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12115 = this;
  if(this__12115.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__12078_SHARP_) {
      return cljs.core.vector.call(null, p1__12078_SHARP_, this__12115.strobj[p1__12078_SHARP_])
    }, this__12115.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12116 = this;
  return this__12116.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12117 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12118 = this;
  return new cljs.core.ObjMap(meta, this__12118.keys, this__12118.strobj, this__12118.update_count, this__12118.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12119 = this;
  return this__12119.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12120 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__12120.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__12121 = this;
  if(function() {
    var and__3822__auto____12122 = goog.isString(k);
    if(and__3822__auto____12122) {
      return!(cljs.core.scan_array.call(null, 1, k, this__12121.keys) == null)
    }else {
      return and__3822__auto____12122
    }
  }()) {
    var new_keys__12123 = this__12121.keys.slice();
    var new_strobj__12124 = cljs.core.obj_clone.call(null, this__12121.strobj, this__12121.keys);
    new_keys__12123.splice(cljs.core.scan_array.call(null, 1, k, new_keys__12123), 1);
    cljs.core.js_delete.call(null, new_strobj__12124, k);
    return new cljs.core.ObjMap(this__12121.meta, new_keys__12123, new_strobj__12124, this__12121.update_count + 1, null)
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
  var this__12129 = this;
  var h__2247__auto____12130 = this__12129.__hash;
  if(!(h__2247__auto____12130 == null)) {
    return h__2247__auto____12130
  }else {
    var h__2247__auto____12131 = cljs.core.hash_imap.call(null, coll);
    this__12129.__hash = h__2247__auto____12131;
    return h__2247__auto____12131
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__12132 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__12133 = this;
  var bucket__12134 = this__12133.hashobj[cljs.core.hash.call(null, k)];
  var i__12135 = cljs.core.truth_(bucket__12134) ? cljs.core.scan_array.call(null, 2, k, bucket__12134) : null;
  if(cljs.core.truth_(i__12135)) {
    return bucket__12134[i__12135 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__12136 = this;
  var h__12137 = cljs.core.hash.call(null, k);
  var bucket__12138 = this__12136.hashobj[h__12137];
  if(cljs.core.truth_(bucket__12138)) {
    var new_bucket__12139 = bucket__12138.slice();
    var new_hashobj__12140 = goog.object.clone(this__12136.hashobj);
    new_hashobj__12140[h__12137] = new_bucket__12139;
    var temp__3971__auto____12141 = cljs.core.scan_array.call(null, 2, k, new_bucket__12139);
    if(cljs.core.truth_(temp__3971__auto____12141)) {
      var i__12142 = temp__3971__auto____12141;
      new_bucket__12139[i__12142 + 1] = v;
      return new cljs.core.HashMap(this__12136.meta, this__12136.count, new_hashobj__12140, null)
    }else {
      new_bucket__12139.push(k, v);
      return new cljs.core.HashMap(this__12136.meta, this__12136.count + 1, new_hashobj__12140, null)
    }
  }else {
    var new_hashobj__12143 = goog.object.clone(this__12136.hashobj);
    new_hashobj__12143[h__12137] = [k, v];
    return new cljs.core.HashMap(this__12136.meta, this__12136.count + 1, new_hashobj__12143, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__12144 = this;
  var bucket__12145 = this__12144.hashobj[cljs.core.hash.call(null, k)];
  var i__12146 = cljs.core.truth_(bucket__12145) ? cljs.core.scan_array.call(null, 2, k, bucket__12145) : null;
  if(cljs.core.truth_(i__12146)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__12171 = null;
  var G__12171__2 = function(this_sym12147, k) {
    var this__12149 = this;
    var this_sym12147__12150 = this;
    var coll__12151 = this_sym12147__12150;
    return coll__12151.cljs$core$ILookup$_lookup$arity$2(coll__12151, k)
  };
  var G__12171__3 = function(this_sym12148, k, not_found) {
    var this__12149 = this;
    var this_sym12148__12152 = this;
    var coll__12153 = this_sym12148__12152;
    return coll__12153.cljs$core$ILookup$_lookup$arity$3(coll__12153, k, not_found)
  };
  G__12171 = function(this_sym12148, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12171__2.call(this, this_sym12148, k);
      case 3:
        return G__12171__3.call(this, this_sym12148, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12171
}();
cljs.core.HashMap.prototype.apply = function(this_sym12127, args12128) {
  var this__12154 = this;
  return this_sym12127.call.apply(this_sym12127, [this_sym12127].concat(args12128.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__12155 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__12156 = this;
  var this__12157 = this;
  return cljs.core.pr_str.call(null, this__12157)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12158 = this;
  if(this__12158.count > 0) {
    var hashes__12159 = cljs.core.js_keys.call(null, this__12158.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__12126_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__12158.hashobj[p1__12126_SHARP_]))
    }, hashes__12159)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12160 = this;
  return this__12160.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12161 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12162 = this;
  return new cljs.core.HashMap(meta, this__12162.count, this__12162.hashobj, this__12162.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12163 = this;
  return this__12163.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12164 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__12164.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__12165 = this;
  var h__12166 = cljs.core.hash.call(null, k);
  var bucket__12167 = this__12165.hashobj[h__12166];
  var i__12168 = cljs.core.truth_(bucket__12167) ? cljs.core.scan_array.call(null, 2, k, bucket__12167) : null;
  if(cljs.core.not.call(null, i__12168)) {
    return coll
  }else {
    var new_hashobj__12169 = goog.object.clone(this__12165.hashobj);
    if(3 > bucket__12167.length) {
      cljs.core.js_delete.call(null, new_hashobj__12169, h__12166)
    }else {
      var new_bucket__12170 = bucket__12167.slice();
      new_bucket__12170.splice(i__12168, 2);
      new_hashobj__12169[h__12166] = new_bucket__12170
    }
    return new cljs.core.HashMap(this__12165.meta, this__12165.count - 1, new_hashobj__12169, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__12172 = ks.length;
  var i__12173 = 0;
  var out__12174 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__12173 < len__12172) {
      var G__12175 = i__12173 + 1;
      var G__12176 = cljs.core.assoc.call(null, out__12174, ks[i__12173], vs[i__12173]);
      i__12173 = G__12175;
      out__12174 = G__12176;
      continue
    }else {
      return out__12174
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__12180 = m.arr;
  var len__12181 = arr__12180.length;
  var i__12182 = 0;
  while(true) {
    if(len__12181 <= i__12182) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__12180[i__12182], k)) {
        return i__12182
      }else {
        if("\ufdd0'else") {
          var G__12183 = i__12182 + 2;
          i__12182 = G__12183;
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
  var this__12186 = this;
  return new cljs.core.TransientArrayMap({}, this__12186.arr.length, this__12186.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__12187 = this;
  var h__2247__auto____12188 = this__12187.__hash;
  if(!(h__2247__auto____12188 == null)) {
    return h__2247__auto____12188
  }else {
    var h__2247__auto____12189 = cljs.core.hash_imap.call(null, coll);
    this__12187.__hash = h__2247__auto____12189;
    return h__2247__auto____12189
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__12190 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__12191 = this;
  var idx__12192 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__12192 === -1) {
    return not_found
  }else {
    return this__12191.arr[idx__12192 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__12193 = this;
  var idx__12194 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__12194 === -1) {
    if(this__12193.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__12193.meta, this__12193.cnt + 1, function() {
        var G__12195__12196 = this__12193.arr.slice();
        G__12195__12196.push(k);
        G__12195__12196.push(v);
        return G__12195__12196
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__12193.arr[idx__12194 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__12193.meta, this__12193.cnt, function() {
          var G__12197__12198 = this__12193.arr.slice();
          G__12197__12198[idx__12194 + 1] = v;
          return G__12197__12198
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__12199 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__12231 = null;
  var G__12231__2 = function(this_sym12200, k) {
    var this__12202 = this;
    var this_sym12200__12203 = this;
    var coll__12204 = this_sym12200__12203;
    return coll__12204.cljs$core$ILookup$_lookup$arity$2(coll__12204, k)
  };
  var G__12231__3 = function(this_sym12201, k, not_found) {
    var this__12202 = this;
    var this_sym12201__12205 = this;
    var coll__12206 = this_sym12201__12205;
    return coll__12206.cljs$core$ILookup$_lookup$arity$3(coll__12206, k, not_found)
  };
  G__12231 = function(this_sym12201, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12231__2.call(this, this_sym12201, k);
      case 3:
        return G__12231__3.call(this, this_sym12201, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12231
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym12184, args12185) {
  var this__12207 = this;
  return this_sym12184.call.apply(this_sym12184, [this_sym12184].concat(args12185.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__12208 = this;
  var len__12209 = this__12208.arr.length;
  var i__12210 = 0;
  var init__12211 = init;
  while(true) {
    if(i__12210 < len__12209) {
      var init__12212 = f.call(null, init__12211, this__12208.arr[i__12210], this__12208.arr[i__12210 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__12212)) {
        return cljs.core.deref.call(null, init__12212)
      }else {
        var G__12232 = i__12210 + 2;
        var G__12233 = init__12212;
        i__12210 = G__12232;
        init__12211 = G__12233;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__12213 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__12214 = this;
  var this__12215 = this;
  return cljs.core.pr_str.call(null, this__12215)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12216 = this;
  if(this__12216.cnt > 0) {
    var len__12217 = this__12216.arr.length;
    var array_map_seq__12218 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__12217) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__12216.arr[i], this__12216.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__12218.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12219 = this;
  return this__12219.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12220 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12221 = this;
  return new cljs.core.PersistentArrayMap(meta, this__12221.cnt, this__12221.arr, this__12221.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12222 = this;
  return this__12222.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12223 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__12223.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__12224 = this;
  var idx__12225 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__12225 >= 0) {
    var len__12226 = this__12224.arr.length;
    var new_len__12227 = len__12226 - 2;
    if(new_len__12227 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__12228 = cljs.core.make_array.call(null, new_len__12227);
      var s__12229 = 0;
      var d__12230 = 0;
      while(true) {
        if(s__12229 >= len__12226) {
          return new cljs.core.PersistentArrayMap(this__12224.meta, this__12224.cnt - 1, new_arr__12228, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__12224.arr[s__12229])) {
            var G__12234 = s__12229 + 2;
            var G__12235 = d__12230;
            s__12229 = G__12234;
            d__12230 = G__12235;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__12228[d__12230] = this__12224.arr[s__12229];
              new_arr__12228[d__12230 + 1] = this__12224.arr[s__12229 + 1];
              var G__12236 = s__12229 + 2;
              var G__12237 = d__12230 + 2;
              s__12229 = G__12236;
              d__12230 = G__12237;
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
  var len__12238 = cljs.core.count.call(null, ks);
  var i__12239 = 0;
  var out__12240 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__12239 < len__12238) {
      var G__12241 = i__12239 + 1;
      var G__12242 = cljs.core.assoc_BANG_.call(null, out__12240, ks[i__12239], vs[i__12239]);
      i__12239 = G__12241;
      out__12240 = G__12242;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__12240)
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
  var this__12243 = this;
  if(cljs.core.truth_(this__12243.editable_QMARK_)) {
    var idx__12244 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__12244 >= 0) {
      this__12243.arr[idx__12244] = this__12243.arr[this__12243.len - 2];
      this__12243.arr[idx__12244 + 1] = this__12243.arr[this__12243.len - 1];
      var G__12245__12246 = this__12243.arr;
      G__12245__12246.pop();
      G__12245__12246.pop();
      G__12245__12246;
      this__12243.len = this__12243.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__12247 = this;
  if(cljs.core.truth_(this__12247.editable_QMARK_)) {
    var idx__12248 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__12248 === -1) {
      if(this__12247.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__12247.len = this__12247.len + 2;
        this__12247.arr.push(key);
        this__12247.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__12247.len, this__12247.arr), key, val)
      }
    }else {
      if(val === this__12247.arr[idx__12248 + 1]) {
        return tcoll
      }else {
        this__12247.arr[idx__12248 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__12249 = this;
  if(cljs.core.truth_(this__12249.editable_QMARK_)) {
    if(function() {
      var G__12250__12251 = o;
      if(G__12250__12251) {
        if(function() {
          var or__3824__auto____12252 = G__12250__12251.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____12252) {
            return or__3824__auto____12252
          }else {
            return G__12250__12251.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__12250__12251.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__12250__12251)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__12250__12251)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__12253 = cljs.core.seq.call(null, o);
      var tcoll__12254 = tcoll;
      while(true) {
        var temp__3971__auto____12255 = cljs.core.first.call(null, es__12253);
        if(cljs.core.truth_(temp__3971__auto____12255)) {
          var e__12256 = temp__3971__auto____12255;
          var G__12262 = cljs.core.next.call(null, es__12253);
          var G__12263 = tcoll__12254.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__12254, cljs.core.key.call(null, e__12256), cljs.core.val.call(null, e__12256));
          es__12253 = G__12262;
          tcoll__12254 = G__12263;
          continue
        }else {
          return tcoll__12254
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__12257 = this;
  if(cljs.core.truth_(this__12257.editable_QMARK_)) {
    this__12257.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__12257.len, 2), this__12257.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__12258 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__12259 = this;
  if(cljs.core.truth_(this__12259.editable_QMARK_)) {
    var idx__12260 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__12260 === -1) {
      return not_found
    }else {
      return this__12259.arr[idx__12260 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__12261 = this;
  if(cljs.core.truth_(this__12261.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__12261.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__12266 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__12267 = 0;
  while(true) {
    if(i__12267 < len) {
      var G__12268 = cljs.core.assoc_BANG_.call(null, out__12266, arr[i__12267], arr[i__12267 + 1]);
      var G__12269 = i__12267 + 2;
      out__12266 = G__12268;
      i__12267 = G__12269;
      continue
    }else {
      return out__12266
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
    var G__12274__12275 = arr.slice();
    G__12274__12275[i] = a;
    return G__12274__12275
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__12276__12277 = arr.slice();
    G__12276__12277[i] = a;
    G__12276__12277[j] = b;
    return G__12276__12277
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
  var new_arr__12279 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__12279, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__12279, 2 * i, new_arr__12279.length - 2 * i);
  return new_arr__12279
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
    var editable__12282 = inode.ensure_editable(edit);
    editable__12282.arr[i] = a;
    return editable__12282
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__12283 = inode.ensure_editable(edit);
    editable__12283.arr[i] = a;
    editable__12283.arr[j] = b;
    return editable__12283
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
  var len__12290 = arr.length;
  var i__12291 = 0;
  var init__12292 = init;
  while(true) {
    if(i__12291 < len__12290) {
      var init__12295 = function() {
        var k__12293 = arr[i__12291];
        if(!(k__12293 == null)) {
          return f.call(null, init__12292, k__12293, arr[i__12291 + 1])
        }else {
          var node__12294 = arr[i__12291 + 1];
          if(!(node__12294 == null)) {
            return node__12294.kv_reduce(f, init__12292)
          }else {
            return init__12292
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__12295)) {
        return cljs.core.deref.call(null, init__12295)
      }else {
        var G__12296 = i__12291 + 2;
        var G__12297 = init__12295;
        i__12291 = G__12296;
        init__12292 = G__12297;
        continue
      }
    }else {
      return init__12292
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
  var this__12298 = this;
  var inode__12299 = this;
  if(this__12298.bitmap === bit) {
    return null
  }else {
    var editable__12300 = inode__12299.ensure_editable(e);
    var earr__12301 = editable__12300.arr;
    var len__12302 = earr__12301.length;
    editable__12300.bitmap = bit ^ editable__12300.bitmap;
    cljs.core.array_copy.call(null, earr__12301, 2 * (i + 1), earr__12301, 2 * i, len__12302 - 2 * (i + 1));
    earr__12301[len__12302 - 2] = null;
    earr__12301[len__12302 - 1] = null;
    return editable__12300
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__12303 = this;
  var inode__12304 = this;
  var bit__12305 = 1 << (hash >>> shift & 31);
  var idx__12306 = cljs.core.bitmap_indexed_node_index.call(null, this__12303.bitmap, bit__12305);
  if((this__12303.bitmap & bit__12305) === 0) {
    var n__12307 = cljs.core.bit_count.call(null, this__12303.bitmap);
    if(2 * n__12307 < this__12303.arr.length) {
      var editable__12308 = inode__12304.ensure_editable(edit);
      var earr__12309 = editable__12308.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__12309, 2 * idx__12306, earr__12309, 2 * (idx__12306 + 1), 2 * (n__12307 - idx__12306));
      earr__12309[2 * idx__12306] = key;
      earr__12309[2 * idx__12306 + 1] = val;
      editable__12308.bitmap = editable__12308.bitmap | bit__12305;
      return editable__12308
    }else {
      if(n__12307 >= 16) {
        var nodes__12310 = cljs.core.make_array.call(null, 32);
        var jdx__12311 = hash >>> shift & 31;
        nodes__12310[jdx__12311] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__12312 = 0;
        var j__12313 = 0;
        while(true) {
          if(i__12312 < 32) {
            if((this__12303.bitmap >>> i__12312 & 1) === 0) {
              var G__12366 = i__12312 + 1;
              var G__12367 = j__12313;
              i__12312 = G__12366;
              j__12313 = G__12367;
              continue
            }else {
              nodes__12310[i__12312] = !(this__12303.arr[j__12313] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__12303.arr[j__12313]), this__12303.arr[j__12313], this__12303.arr[j__12313 + 1], added_leaf_QMARK_) : this__12303.arr[j__12313 + 1];
              var G__12368 = i__12312 + 1;
              var G__12369 = j__12313 + 2;
              i__12312 = G__12368;
              j__12313 = G__12369;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__12307 + 1, nodes__12310)
      }else {
        if("\ufdd0'else") {
          var new_arr__12314 = cljs.core.make_array.call(null, 2 * (n__12307 + 4));
          cljs.core.array_copy.call(null, this__12303.arr, 0, new_arr__12314, 0, 2 * idx__12306);
          new_arr__12314[2 * idx__12306] = key;
          new_arr__12314[2 * idx__12306 + 1] = val;
          cljs.core.array_copy.call(null, this__12303.arr, 2 * idx__12306, new_arr__12314, 2 * (idx__12306 + 1), 2 * (n__12307 - idx__12306));
          added_leaf_QMARK_.val = true;
          var editable__12315 = inode__12304.ensure_editable(edit);
          editable__12315.arr = new_arr__12314;
          editable__12315.bitmap = editable__12315.bitmap | bit__12305;
          return editable__12315
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__12316 = this__12303.arr[2 * idx__12306];
    var val_or_node__12317 = this__12303.arr[2 * idx__12306 + 1];
    if(key_or_nil__12316 == null) {
      var n__12318 = val_or_node__12317.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__12318 === val_or_node__12317) {
        return inode__12304
      }else {
        return cljs.core.edit_and_set.call(null, inode__12304, edit, 2 * idx__12306 + 1, n__12318)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__12316)) {
        if(val === val_or_node__12317) {
          return inode__12304
        }else {
          return cljs.core.edit_and_set.call(null, inode__12304, edit, 2 * idx__12306 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__12304, edit, 2 * idx__12306, null, 2 * idx__12306 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__12316, val_or_node__12317, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__12319 = this;
  var inode__12320 = this;
  return cljs.core.create_inode_seq.call(null, this__12319.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__12321 = this;
  var inode__12322 = this;
  var bit__12323 = 1 << (hash >>> shift & 31);
  if((this__12321.bitmap & bit__12323) === 0) {
    return inode__12322
  }else {
    var idx__12324 = cljs.core.bitmap_indexed_node_index.call(null, this__12321.bitmap, bit__12323);
    var key_or_nil__12325 = this__12321.arr[2 * idx__12324];
    var val_or_node__12326 = this__12321.arr[2 * idx__12324 + 1];
    if(key_or_nil__12325 == null) {
      var n__12327 = val_or_node__12326.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__12327 === val_or_node__12326) {
        return inode__12322
      }else {
        if(!(n__12327 == null)) {
          return cljs.core.edit_and_set.call(null, inode__12322, edit, 2 * idx__12324 + 1, n__12327)
        }else {
          if(this__12321.bitmap === bit__12323) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__12322.edit_and_remove_pair(edit, bit__12323, idx__12324)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__12325)) {
        removed_leaf_QMARK_[0] = true;
        return inode__12322.edit_and_remove_pair(edit, bit__12323, idx__12324)
      }else {
        if("\ufdd0'else") {
          return inode__12322
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__12328 = this;
  var inode__12329 = this;
  if(e === this__12328.edit) {
    return inode__12329
  }else {
    var n__12330 = cljs.core.bit_count.call(null, this__12328.bitmap);
    var new_arr__12331 = cljs.core.make_array.call(null, n__12330 < 0 ? 4 : 2 * (n__12330 + 1));
    cljs.core.array_copy.call(null, this__12328.arr, 0, new_arr__12331, 0, 2 * n__12330);
    return new cljs.core.BitmapIndexedNode(e, this__12328.bitmap, new_arr__12331)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__12332 = this;
  var inode__12333 = this;
  return cljs.core.inode_kv_reduce.call(null, this__12332.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__12334 = this;
  var inode__12335 = this;
  var bit__12336 = 1 << (hash >>> shift & 31);
  if((this__12334.bitmap & bit__12336) === 0) {
    return not_found
  }else {
    var idx__12337 = cljs.core.bitmap_indexed_node_index.call(null, this__12334.bitmap, bit__12336);
    var key_or_nil__12338 = this__12334.arr[2 * idx__12337];
    var val_or_node__12339 = this__12334.arr[2 * idx__12337 + 1];
    if(key_or_nil__12338 == null) {
      return val_or_node__12339.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__12338)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__12338, val_or_node__12339], true)
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
  var this__12340 = this;
  var inode__12341 = this;
  var bit__12342 = 1 << (hash >>> shift & 31);
  if((this__12340.bitmap & bit__12342) === 0) {
    return inode__12341
  }else {
    var idx__12343 = cljs.core.bitmap_indexed_node_index.call(null, this__12340.bitmap, bit__12342);
    var key_or_nil__12344 = this__12340.arr[2 * idx__12343];
    var val_or_node__12345 = this__12340.arr[2 * idx__12343 + 1];
    if(key_or_nil__12344 == null) {
      var n__12346 = val_or_node__12345.inode_without(shift + 5, hash, key);
      if(n__12346 === val_or_node__12345) {
        return inode__12341
      }else {
        if(!(n__12346 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__12340.bitmap, cljs.core.clone_and_set.call(null, this__12340.arr, 2 * idx__12343 + 1, n__12346))
        }else {
          if(this__12340.bitmap === bit__12342) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__12340.bitmap ^ bit__12342, cljs.core.remove_pair.call(null, this__12340.arr, idx__12343))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__12344)) {
        return new cljs.core.BitmapIndexedNode(null, this__12340.bitmap ^ bit__12342, cljs.core.remove_pair.call(null, this__12340.arr, idx__12343))
      }else {
        if("\ufdd0'else") {
          return inode__12341
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__12347 = this;
  var inode__12348 = this;
  var bit__12349 = 1 << (hash >>> shift & 31);
  var idx__12350 = cljs.core.bitmap_indexed_node_index.call(null, this__12347.bitmap, bit__12349);
  if((this__12347.bitmap & bit__12349) === 0) {
    var n__12351 = cljs.core.bit_count.call(null, this__12347.bitmap);
    if(n__12351 >= 16) {
      var nodes__12352 = cljs.core.make_array.call(null, 32);
      var jdx__12353 = hash >>> shift & 31;
      nodes__12352[jdx__12353] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__12354 = 0;
      var j__12355 = 0;
      while(true) {
        if(i__12354 < 32) {
          if((this__12347.bitmap >>> i__12354 & 1) === 0) {
            var G__12370 = i__12354 + 1;
            var G__12371 = j__12355;
            i__12354 = G__12370;
            j__12355 = G__12371;
            continue
          }else {
            nodes__12352[i__12354] = !(this__12347.arr[j__12355] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__12347.arr[j__12355]), this__12347.arr[j__12355], this__12347.arr[j__12355 + 1], added_leaf_QMARK_) : this__12347.arr[j__12355 + 1];
            var G__12372 = i__12354 + 1;
            var G__12373 = j__12355 + 2;
            i__12354 = G__12372;
            j__12355 = G__12373;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__12351 + 1, nodes__12352)
    }else {
      var new_arr__12356 = cljs.core.make_array.call(null, 2 * (n__12351 + 1));
      cljs.core.array_copy.call(null, this__12347.arr, 0, new_arr__12356, 0, 2 * idx__12350);
      new_arr__12356[2 * idx__12350] = key;
      new_arr__12356[2 * idx__12350 + 1] = val;
      cljs.core.array_copy.call(null, this__12347.arr, 2 * idx__12350, new_arr__12356, 2 * (idx__12350 + 1), 2 * (n__12351 - idx__12350));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__12347.bitmap | bit__12349, new_arr__12356)
    }
  }else {
    var key_or_nil__12357 = this__12347.arr[2 * idx__12350];
    var val_or_node__12358 = this__12347.arr[2 * idx__12350 + 1];
    if(key_or_nil__12357 == null) {
      var n__12359 = val_or_node__12358.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__12359 === val_or_node__12358) {
        return inode__12348
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__12347.bitmap, cljs.core.clone_and_set.call(null, this__12347.arr, 2 * idx__12350 + 1, n__12359))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__12357)) {
        if(val === val_or_node__12358) {
          return inode__12348
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__12347.bitmap, cljs.core.clone_and_set.call(null, this__12347.arr, 2 * idx__12350 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__12347.bitmap, cljs.core.clone_and_set.call(null, this__12347.arr, 2 * idx__12350, null, 2 * idx__12350 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__12357, val_or_node__12358, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__12360 = this;
  var inode__12361 = this;
  var bit__12362 = 1 << (hash >>> shift & 31);
  if((this__12360.bitmap & bit__12362) === 0) {
    return not_found
  }else {
    var idx__12363 = cljs.core.bitmap_indexed_node_index.call(null, this__12360.bitmap, bit__12362);
    var key_or_nil__12364 = this__12360.arr[2 * idx__12363];
    var val_or_node__12365 = this__12360.arr[2 * idx__12363 + 1];
    if(key_or_nil__12364 == null) {
      return val_or_node__12365.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__12364)) {
        return val_or_node__12365
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
  var arr__12381 = array_node.arr;
  var len__12382 = 2 * (array_node.cnt - 1);
  var new_arr__12383 = cljs.core.make_array.call(null, len__12382);
  var i__12384 = 0;
  var j__12385 = 1;
  var bitmap__12386 = 0;
  while(true) {
    if(i__12384 < len__12382) {
      if(function() {
        var and__3822__auto____12387 = !(i__12384 === idx);
        if(and__3822__auto____12387) {
          return!(arr__12381[i__12384] == null)
        }else {
          return and__3822__auto____12387
        }
      }()) {
        new_arr__12383[j__12385] = arr__12381[i__12384];
        var G__12388 = i__12384 + 1;
        var G__12389 = j__12385 + 2;
        var G__12390 = bitmap__12386 | 1 << i__12384;
        i__12384 = G__12388;
        j__12385 = G__12389;
        bitmap__12386 = G__12390;
        continue
      }else {
        var G__12391 = i__12384 + 1;
        var G__12392 = j__12385;
        var G__12393 = bitmap__12386;
        i__12384 = G__12391;
        j__12385 = G__12392;
        bitmap__12386 = G__12393;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__12386, new_arr__12383)
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
  var this__12394 = this;
  var inode__12395 = this;
  var idx__12396 = hash >>> shift & 31;
  var node__12397 = this__12394.arr[idx__12396];
  if(node__12397 == null) {
    var editable__12398 = cljs.core.edit_and_set.call(null, inode__12395, edit, idx__12396, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__12398.cnt = editable__12398.cnt + 1;
    return editable__12398
  }else {
    var n__12399 = node__12397.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__12399 === node__12397) {
      return inode__12395
    }else {
      return cljs.core.edit_and_set.call(null, inode__12395, edit, idx__12396, n__12399)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__12400 = this;
  var inode__12401 = this;
  return cljs.core.create_array_node_seq.call(null, this__12400.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__12402 = this;
  var inode__12403 = this;
  var idx__12404 = hash >>> shift & 31;
  var node__12405 = this__12402.arr[idx__12404];
  if(node__12405 == null) {
    return inode__12403
  }else {
    var n__12406 = node__12405.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__12406 === node__12405) {
      return inode__12403
    }else {
      if(n__12406 == null) {
        if(this__12402.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__12403, edit, idx__12404)
        }else {
          var editable__12407 = cljs.core.edit_and_set.call(null, inode__12403, edit, idx__12404, n__12406);
          editable__12407.cnt = editable__12407.cnt - 1;
          return editable__12407
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__12403, edit, idx__12404, n__12406)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__12408 = this;
  var inode__12409 = this;
  if(e === this__12408.edit) {
    return inode__12409
  }else {
    return new cljs.core.ArrayNode(e, this__12408.cnt, this__12408.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__12410 = this;
  var inode__12411 = this;
  var len__12412 = this__12410.arr.length;
  var i__12413 = 0;
  var init__12414 = init;
  while(true) {
    if(i__12413 < len__12412) {
      var node__12415 = this__12410.arr[i__12413];
      if(!(node__12415 == null)) {
        var init__12416 = node__12415.kv_reduce(f, init__12414);
        if(cljs.core.reduced_QMARK_.call(null, init__12416)) {
          return cljs.core.deref.call(null, init__12416)
        }else {
          var G__12435 = i__12413 + 1;
          var G__12436 = init__12416;
          i__12413 = G__12435;
          init__12414 = G__12436;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__12414
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__12417 = this;
  var inode__12418 = this;
  var idx__12419 = hash >>> shift & 31;
  var node__12420 = this__12417.arr[idx__12419];
  if(!(node__12420 == null)) {
    return node__12420.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__12421 = this;
  var inode__12422 = this;
  var idx__12423 = hash >>> shift & 31;
  var node__12424 = this__12421.arr[idx__12423];
  if(!(node__12424 == null)) {
    var n__12425 = node__12424.inode_without(shift + 5, hash, key);
    if(n__12425 === node__12424) {
      return inode__12422
    }else {
      if(n__12425 == null) {
        if(this__12421.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__12422, null, idx__12423)
        }else {
          return new cljs.core.ArrayNode(null, this__12421.cnt - 1, cljs.core.clone_and_set.call(null, this__12421.arr, idx__12423, n__12425))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__12421.cnt, cljs.core.clone_and_set.call(null, this__12421.arr, idx__12423, n__12425))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__12422
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__12426 = this;
  var inode__12427 = this;
  var idx__12428 = hash >>> shift & 31;
  var node__12429 = this__12426.arr[idx__12428];
  if(node__12429 == null) {
    return new cljs.core.ArrayNode(null, this__12426.cnt + 1, cljs.core.clone_and_set.call(null, this__12426.arr, idx__12428, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__12430 = node__12429.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__12430 === node__12429) {
      return inode__12427
    }else {
      return new cljs.core.ArrayNode(null, this__12426.cnt, cljs.core.clone_and_set.call(null, this__12426.arr, idx__12428, n__12430))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__12431 = this;
  var inode__12432 = this;
  var idx__12433 = hash >>> shift & 31;
  var node__12434 = this__12431.arr[idx__12433];
  if(!(node__12434 == null)) {
    return node__12434.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__12439 = 2 * cnt;
  var i__12440 = 0;
  while(true) {
    if(i__12440 < lim__12439) {
      if(cljs.core.key_test.call(null, key, arr[i__12440])) {
        return i__12440
      }else {
        var G__12441 = i__12440 + 2;
        i__12440 = G__12441;
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
  var this__12442 = this;
  var inode__12443 = this;
  if(hash === this__12442.collision_hash) {
    var idx__12444 = cljs.core.hash_collision_node_find_index.call(null, this__12442.arr, this__12442.cnt, key);
    if(idx__12444 === -1) {
      if(this__12442.arr.length > 2 * this__12442.cnt) {
        var editable__12445 = cljs.core.edit_and_set.call(null, inode__12443, edit, 2 * this__12442.cnt, key, 2 * this__12442.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__12445.cnt = editable__12445.cnt + 1;
        return editable__12445
      }else {
        var len__12446 = this__12442.arr.length;
        var new_arr__12447 = cljs.core.make_array.call(null, len__12446 + 2);
        cljs.core.array_copy.call(null, this__12442.arr, 0, new_arr__12447, 0, len__12446);
        new_arr__12447[len__12446] = key;
        new_arr__12447[len__12446 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__12443.ensure_editable_array(edit, this__12442.cnt + 1, new_arr__12447)
      }
    }else {
      if(this__12442.arr[idx__12444 + 1] === val) {
        return inode__12443
      }else {
        return cljs.core.edit_and_set.call(null, inode__12443, edit, idx__12444 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__12442.collision_hash >>> shift & 31), [null, inode__12443, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__12448 = this;
  var inode__12449 = this;
  return cljs.core.create_inode_seq.call(null, this__12448.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__12450 = this;
  var inode__12451 = this;
  var idx__12452 = cljs.core.hash_collision_node_find_index.call(null, this__12450.arr, this__12450.cnt, key);
  if(idx__12452 === -1) {
    return inode__12451
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__12450.cnt === 1) {
      return null
    }else {
      var editable__12453 = inode__12451.ensure_editable(edit);
      var earr__12454 = editable__12453.arr;
      earr__12454[idx__12452] = earr__12454[2 * this__12450.cnt - 2];
      earr__12454[idx__12452 + 1] = earr__12454[2 * this__12450.cnt - 1];
      earr__12454[2 * this__12450.cnt - 1] = null;
      earr__12454[2 * this__12450.cnt - 2] = null;
      editable__12453.cnt = editable__12453.cnt - 1;
      return editable__12453
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__12455 = this;
  var inode__12456 = this;
  if(e === this__12455.edit) {
    return inode__12456
  }else {
    var new_arr__12457 = cljs.core.make_array.call(null, 2 * (this__12455.cnt + 1));
    cljs.core.array_copy.call(null, this__12455.arr, 0, new_arr__12457, 0, 2 * this__12455.cnt);
    return new cljs.core.HashCollisionNode(e, this__12455.collision_hash, this__12455.cnt, new_arr__12457)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__12458 = this;
  var inode__12459 = this;
  return cljs.core.inode_kv_reduce.call(null, this__12458.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__12460 = this;
  var inode__12461 = this;
  var idx__12462 = cljs.core.hash_collision_node_find_index.call(null, this__12460.arr, this__12460.cnt, key);
  if(idx__12462 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__12460.arr[idx__12462])) {
      return cljs.core.PersistentVector.fromArray([this__12460.arr[idx__12462], this__12460.arr[idx__12462 + 1]], true)
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
  var this__12463 = this;
  var inode__12464 = this;
  var idx__12465 = cljs.core.hash_collision_node_find_index.call(null, this__12463.arr, this__12463.cnt, key);
  if(idx__12465 === -1) {
    return inode__12464
  }else {
    if(this__12463.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__12463.collision_hash, this__12463.cnt - 1, cljs.core.remove_pair.call(null, this__12463.arr, cljs.core.quot.call(null, idx__12465, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__12466 = this;
  var inode__12467 = this;
  if(hash === this__12466.collision_hash) {
    var idx__12468 = cljs.core.hash_collision_node_find_index.call(null, this__12466.arr, this__12466.cnt, key);
    if(idx__12468 === -1) {
      var len__12469 = this__12466.arr.length;
      var new_arr__12470 = cljs.core.make_array.call(null, len__12469 + 2);
      cljs.core.array_copy.call(null, this__12466.arr, 0, new_arr__12470, 0, len__12469);
      new_arr__12470[len__12469] = key;
      new_arr__12470[len__12469 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__12466.collision_hash, this__12466.cnt + 1, new_arr__12470)
    }else {
      if(cljs.core._EQ_.call(null, this__12466.arr[idx__12468], val)) {
        return inode__12467
      }else {
        return new cljs.core.HashCollisionNode(null, this__12466.collision_hash, this__12466.cnt, cljs.core.clone_and_set.call(null, this__12466.arr, idx__12468 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__12466.collision_hash >>> shift & 31), [null, inode__12467])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__12471 = this;
  var inode__12472 = this;
  var idx__12473 = cljs.core.hash_collision_node_find_index.call(null, this__12471.arr, this__12471.cnt, key);
  if(idx__12473 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__12471.arr[idx__12473])) {
      return this__12471.arr[idx__12473 + 1]
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
  var this__12474 = this;
  var inode__12475 = this;
  if(e === this__12474.edit) {
    this__12474.arr = array;
    this__12474.cnt = count;
    return inode__12475
  }else {
    return new cljs.core.HashCollisionNode(this__12474.edit, this__12474.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__12480 = cljs.core.hash.call(null, key1);
    if(key1hash__12480 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__12480, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___12481 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__12480, key1, val1, added_leaf_QMARK___12481).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___12481)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__12482 = cljs.core.hash.call(null, key1);
    if(key1hash__12482 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__12482, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___12483 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__12482, key1, val1, added_leaf_QMARK___12483).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___12483)
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
  var this__12484 = this;
  var h__2247__auto____12485 = this__12484.__hash;
  if(!(h__2247__auto____12485 == null)) {
    return h__2247__auto____12485
  }else {
    var h__2247__auto____12486 = cljs.core.hash_coll.call(null, coll);
    this__12484.__hash = h__2247__auto____12486;
    return h__2247__auto____12486
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12487 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__12488 = this;
  var this__12489 = this;
  return cljs.core.pr_str.call(null, this__12489)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__12490 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__12491 = this;
  if(this__12491.s == null) {
    return cljs.core.PersistentVector.fromArray([this__12491.nodes[this__12491.i], this__12491.nodes[this__12491.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__12491.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__12492 = this;
  if(this__12492.s == null) {
    return cljs.core.create_inode_seq.call(null, this__12492.nodes, this__12492.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__12492.nodes, this__12492.i, cljs.core.next.call(null, this__12492.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12493 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12494 = this;
  return new cljs.core.NodeSeq(meta, this__12494.nodes, this__12494.i, this__12494.s, this__12494.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12495 = this;
  return this__12495.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12496 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__12496.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__12503 = nodes.length;
      var j__12504 = i;
      while(true) {
        if(j__12504 < len__12503) {
          if(!(nodes[j__12504] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__12504, null, null)
          }else {
            var temp__3971__auto____12505 = nodes[j__12504 + 1];
            if(cljs.core.truth_(temp__3971__auto____12505)) {
              var node__12506 = temp__3971__auto____12505;
              var temp__3971__auto____12507 = node__12506.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____12507)) {
                var node_seq__12508 = temp__3971__auto____12507;
                return new cljs.core.NodeSeq(null, nodes, j__12504 + 2, node_seq__12508, null)
              }else {
                var G__12509 = j__12504 + 2;
                j__12504 = G__12509;
                continue
              }
            }else {
              var G__12510 = j__12504 + 2;
              j__12504 = G__12510;
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
  var this__12511 = this;
  var h__2247__auto____12512 = this__12511.__hash;
  if(!(h__2247__auto____12512 == null)) {
    return h__2247__auto____12512
  }else {
    var h__2247__auto____12513 = cljs.core.hash_coll.call(null, coll);
    this__12511.__hash = h__2247__auto____12513;
    return h__2247__auto____12513
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12514 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__12515 = this;
  var this__12516 = this;
  return cljs.core.pr_str.call(null, this__12516)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__12517 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__12518 = this;
  return cljs.core.first.call(null, this__12518.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__12519 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__12519.nodes, this__12519.i, cljs.core.next.call(null, this__12519.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12520 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12521 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__12521.nodes, this__12521.i, this__12521.s, this__12521.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12522 = this;
  return this__12522.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12523 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__12523.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__12530 = nodes.length;
      var j__12531 = i;
      while(true) {
        if(j__12531 < len__12530) {
          var temp__3971__auto____12532 = nodes[j__12531];
          if(cljs.core.truth_(temp__3971__auto____12532)) {
            var nj__12533 = temp__3971__auto____12532;
            var temp__3971__auto____12534 = nj__12533.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____12534)) {
              var ns__12535 = temp__3971__auto____12534;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__12531 + 1, ns__12535, null)
            }else {
              var G__12536 = j__12531 + 1;
              j__12531 = G__12536;
              continue
            }
          }else {
            var G__12537 = j__12531 + 1;
            j__12531 = G__12537;
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
  var this__12540 = this;
  return new cljs.core.TransientHashMap({}, this__12540.root, this__12540.cnt, this__12540.has_nil_QMARK_, this__12540.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__12541 = this;
  var h__2247__auto____12542 = this__12541.__hash;
  if(!(h__2247__auto____12542 == null)) {
    return h__2247__auto____12542
  }else {
    var h__2247__auto____12543 = cljs.core.hash_imap.call(null, coll);
    this__12541.__hash = h__2247__auto____12543;
    return h__2247__auto____12543
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__12544 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__12545 = this;
  if(k == null) {
    if(this__12545.has_nil_QMARK_) {
      return this__12545.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__12545.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__12545.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__12546 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____12547 = this__12546.has_nil_QMARK_;
      if(and__3822__auto____12547) {
        return v === this__12546.nil_val
      }else {
        return and__3822__auto____12547
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__12546.meta, this__12546.has_nil_QMARK_ ? this__12546.cnt : this__12546.cnt + 1, this__12546.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___12548 = new cljs.core.Box(false);
    var new_root__12549 = (this__12546.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__12546.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___12548);
    if(new_root__12549 === this__12546.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__12546.meta, added_leaf_QMARK___12548.val ? this__12546.cnt + 1 : this__12546.cnt, new_root__12549, this__12546.has_nil_QMARK_, this__12546.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__12550 = this;
  if(k == null) {
    return this__12550.has_nil_QMARK_
  }else {
    if(this__12550.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__12550.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__12573 = null;
  var G__12573__2 = function(this_sym12551, k) {
    var this__12553 = this;
    var this_sym12551__12554 = this;
    var coll__12555 = this_sym12551__12554;
    return coll__12555.cljs$core$ILookup$_lookup$arity$2(coll__12555, k)
  };
  var G__12573__3 = function(this_sym12552, k, not_found) {
    var this__12553 = this;
    var this_sym12552__12556 = this;
    var coll__12557 = this_sym12552__12556;
    return coll__12557.cljs$core$ILookup$_lookup$arity$3(coll__12557, k, not_found)
  };
  G__12573 = function(this_sym12552, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12573__2.call(this, this_sym12552, k);
      case 3:
        return G__12573__3.call(this, this_sym12552, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12573
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym12538, args12539) {
  var this__12558 = this;
  return this_sym12538.call.apply(this_sym12538, [this_sym12538].concat(args12539.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__12559 = this;
  var init__12560 = this__12559.has_nil_QMARK_ ? f.call(null, init, null, this__12559.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__12560)) {
    return cljs.core.deref.call(null, init__12560)
  }else {
    if(!(this__12559.root == null)) {
      return this__12559.root.kv_reduce(f, init__12560)
    }else {
      if("\ufdd0'else") {
        return init__12560
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__12561 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__12562 = this;
  var this__12563 = this;
  return cljs.core.pr_str.call(null, this__12563)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12564 = this;
  if(this__12564.cnt > 0) {
    var s__12565 = !(this__12564.root == null) ? this__12564.root.inode_seq() : null;
    if(this__12564.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__12564.nil_val], true), s__12565)
    }else {
      return s__12565
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12566 = this;
  return this__12566.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12567 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12568 = this;
  return new cljs.core.PersistentHashMap(meta, this__12568.cnt, this__12568.root, this__12568.has_nil_QMARK_, this__12568.nil_val, this__12568.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12569 = this;
  return this__12569.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12570 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__12570.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__12571 = this;
  if(k == null) {
    if(this__12571.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__12571.meta, this__12571.cnt - 1, this__12571.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__12571.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__12572 = this__12571.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__12572 === this__12571.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__12571.meta, this__12571.cnt - 1, new_root__12572, this__12571.has_nil_QMARK_, this__12571.nil_val, null)
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
  var len__12574 = ks.length;
  var i__12575 = 0;
  var out__12576 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__12575 < len__12574) {
      var G__12577 = i__12575 + 1;
      var G__12578 = cljs.core.assoc_BANG_.call(null, out__12576, ks[i__12575], vs[i__12575]);
      i__12575 = G__12577;
      out__12576 = G__12578;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__12576)
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
  var this__12579 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__12580 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__12581 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__12582 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__12583 = this;
  if(k == null) {
    if(this__12583.has_nil_QMARK_) {
      return this__12583.nil_val
    }else {
      return null
    }
  }else {
    if(this__12583.root == null) {
      return null
    }else {
      return this__12583.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__12584 = this;
  if(k == null) {
    if(this__12584.has_nil_QMARK_) {
      return this__12584.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__12584.root == null) {
      return not_found
    }else {
      return this__12584.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12585 = this;
  if(this__12585.edit) {
    return this__12585.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__12586 = this;
  var tcoll__12587 = this;
  if(this__12586.edit) {
    if(function() {
      var G__12588__12589 = o;
      if(G__12588__12589) {
        if(function() {
          var or__3824__auto____12590 = G__12588__12589.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____12590) {
            return or__3824__auto____12590
          }else {
            return G__12588__12589.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__12588__12589.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__12588__12589)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__12588__12589)
      }
    }()) {
      return tcoll__12587.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__12591 = cljs.core.seq.call(null, o);
      var tcoll__12592 = tcoll__12587;
      while(true) {
        var temp__3971__auto____12593 = cljs.core.first.call(null, es__12591);
        if(cljs.core.truth_(temp__3971__auto____12593)) {
          var e__12594 = temp__3971__auto____12593;
          var G__12605 = cljs.core.next.call(null, es__12591);
          var G__12606 = tcoll__12592.assoc_BANG_(cljs.core.key.call(null, e__12594), cljs.core.val.call(null, e__12594));
          es__12591 = G__12605;
          tcoll__12592 = G__12606;
          continue
        }else {
          return tcoll__12592
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__12595 = this;
  var tcoll__12596 = this;
  if(this__12595.edit) {
    if(k == null) {
      if(this__12595.nil_val === v) {
      }else {
        this__12595.nil_val = v
      }
      if(this__12595.has_nil_QMARK_) {
      }else {
        this__12595.count = this__12595.count + 1;
        this__12595.has_nil_QMARK_ = true
      }
      return tcoll__12596
    }else {
      var added_leaf_QMARK___12597 = new cljs.core.Box(false);
      var node__12598 = (this__12595.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__12595.root).inode_assoc_BANG_(this__12595.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___12597);
      if(node__12598 === this__12595.root) {
      }else {
        this__12595.root = node__12598
      }
      if(added_leaf_QMARK___12597.val) {
        this__12595.count = this__12595.count + 1
      }else {
      }
      return tcoll__12596
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__12599 = this;
  var tcoll__12600 = this;
  if(this__12599.edit) {
    if(k == null) {
      if(this__12599.has_nil_QMARK_) {
        this__12599.has_nil_QMARK_ = false;
        this__12599.nil_val = null;
        this__12599.count = this__12599.count - 1;
        return tcoll__12600
      }else {
        return tcoll__12600
      }
    }else {
      if(this__12599.root == null) {
        return tcoll__12600
      }else {
        var removed_leaf_QMARK___12601 = new cljs.core.Box(false);
        var node__12602 = this__12599.root.inode_without_BANG_(this__12599.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___12601);
        if(node__12602 === this__12599.root) {
        }else {
          this__12599.root = node__12602
        }
        if(cljs.core.truth_(removed_leaf_QMARK___12601[0])) {
          this__12599.count = this__12599.count - 1
        }else {
        }
        return tcoll__12600
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__12603 = this;
  var tcoll__12604 = this;
  if(this__12603.edit) {
    this__12603.edit = null;
    return new cljs.core.PersistentHashMap(null, this__12603.count, this__12603.root, this__12603.has_nil_QMARK_, this__12603.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__12609 = node;
  var stack__12610 = stack;
  while(true) {
    if(!(t__12609 == null)) {
      var G__12611 = ascending_QMARK_ ? t__12609.left : t__12609.right;
      var G__12612 = cljs.core.conj.call(null, stack__12610, t__12609);
      t__12609 = G__12611;
      stack__12610 = G__12612;
      continue
    }else {
      return stack__12610
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
  var this__12613 = this;
  var h__2247__auto____12614 = this__12613.__hash;
  if(!(h__2247__auto____12614 == null)) {
    return h__2247__auto____12614
  }else {
    var h__2247__auto____12615 = cljs.core.hash_coll.call(null, coll);
    this__12613.__hash = h__2247__auto____12615;
    return h__2247__auto____12615
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12616 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__12617 = this;
  var this__12618 = this;
  return cljs.core.pr_str.call(null, this__12618)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__12619 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12620 = this;
  if(this__12620.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__12620.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__12621 = this;
  return cljs.core.peek.call(null, this__12621.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__12622 = this;
  var t__12623 = cljs.core.first.call(null, this__12622.stack);
  var next_stack__12624 = cljs.core.tree_map_seq_push.call(null, this__12622.ascending_QMARK_ ? t__12623.right : t__12623.left, cljs.core.next.call(null, this__12622.stack), this__12622.ascending_QMARK_);
  if(!(next_stack__12624 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__12624, this__12622.ascending_QMARK_, this__12622.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12625 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12626 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__12626.stack, this__12626.ascending_QMARK_, this__12626.cnt, this__12626.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12627 = this;
  return this__12627.meta
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
        var and__3822__auto____12629 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____12629) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____12629
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
        var and__3822__auto____12631 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____12631) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____12631
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
  var init__12635 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__12635)) {
    return cljs.core.deref.call(null, init__12635)
  }else {
    var init__12636 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__12635) : init__12635;
    if(cljs.core.reduced_QMARK_.call(null, init__12636)) {
      return cljs.core.deref.call(null, init__12636)
    }else {
      var init__12637 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__12636) : init__12636;
      if(cljs.core.reduced_QMARK_.call(null, init__12637)) {
        return cljs.core.deref.call(null, init__12637)
      }else {
        return init__12637
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
  var this__12640 = this;
  var h__2247__auto____12641 = this__12640.__hash;
  if(!(h__2247__auto____12641 == null)) {
    return h__2247__auto____12641
  }else {
    var h__2247__auto____12642 = cljs.core.hash_coll.call(null, coll);
    this__12640.__hash = h__2247__auto____12642;
    return h__2247__auto____12642
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__12643 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__12644 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__12645 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__12645.key, this__12645.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__12693 = null;
  var G__12693__2 = function(this_sym12646, k) {
    var this__12648 = this;
    var this_sym12646__12649 = this;
    var node__12650 = this_sym12646__12649;
    return node__12650.cljs$core$ILookup$_lookup$arity$2(node__12650, k)
  };
  var G__12693__3 = function(this_sym12647, k, not_found) {
    var this__12648 = this;
    var this_sym12647__12651 = this;
    var node__12652 = this_sym12647__12651;
    return node__12652.cljs$core$ILookup$_lookup$arity$3(node__12652, k, not_found)
  };
  G__12693 = function(this_sym12647, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12693__2.call(this, this_sym12647, k);
      case 3:
        return G__12693__3.call(this, this_sym12647, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12693
}();
cljs.core.BlackNode.prototype.apply = function(this_sym12638, args12639) {
  var this__12653 = this;
  return this_sym12638.call.apply(this_sym12638, [this_sym12638].concat(args12639.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__12654 = this;
  return cljs.core.PersistentVector.fromArray([this__12654.key, this__12654.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__12655 = this;
  return this__12655.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__12656 = this;
  return this__12656.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__12657 = this;
  var node__12658 = this;
  return ins.balance_right(node__12658)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__12659 = this;
  var node__12660 = this;
  return new cljs.core.RedNode(this__12659.key, this__12659.val, this__12659.left, this__12659.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__12661 = this;
  var node__12662 = this;
  return cljs.core.balance_right_del.call(null, this__12661.key, this__12661.val, this__12661.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__12663 = this;
  var node__12664 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__12665 = this;
  var node__12666 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__12666, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__12667 = this;
  var node__12668 = this;
  return cljs.core.balance_left_del.call(null, this__12667.key, this__12667.val, del, this__12667.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__12669 = this;
  var node__12670 = this;
  return ins.balance_left(node__12670)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__12671 = this;
  var node__12672 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__12672, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__12694 = null;
  var G__12694__0 = function() {
    var this__12673 = this;
    var this__12675 = this;
    return cljs.core.pr_str.call(null, this__12675)
  };
  G__12694 = function() {
    switch(arguments.length) {
      case 0:
        return G__12694__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12694
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__12676 = this;
  var node__12677 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__12677, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__12678 = this;
  var node__12679 = this;
  return node__12679
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__12680 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__12681 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__12682 = this;
  return cljs.core.list.call(null, this__12682.key, this__12682.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__12683 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__12684 = this;
  return this__12684.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__12685 = this;
  return cljs.core.PersistentVector.fromArray([this__12685.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__12686 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__12686.key, this__12686.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12687 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__12688 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__12688.key, this__12688.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__12689 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__12690 = this;
  if(n === 0) {
    return this__12690.key
  }else {
    if(n === 1) {
      return this__12690.val
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
  var this__12691 = this;
  if(n === 0) {
    return this__12691.key
  }else {
    if(n === 1) {
      return this__12691.val
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
  var this__12692 = this;
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
  var this__12697 = this;
  var h__2247__auto____12698 = this__12697.__hash;
  if(!(h__2247__auto____12698 == null)) {
    return h__2247__auto____12698
  }else {
    var h__2247__auto____12699 = cljs.core.hash_coll.call(null, coll);
    this__12697.__hash = h__2247__auto____12699;
    return h__2247__auto____12699
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__12700 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__12701 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__12702 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__12702.key, this__12702.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__12750 = null;
  var G__12750__2 = function(this_sym12703, k) {
    var this__12705 = this;
    var this_sym12703__12706 = this;
    var node__12707 = this_sym12703__12706;
    return node__12707.cljs$core$ILookup$_lookup$arity$2(node__12707, k)
  };
  var G__12750__3 = function(this_sym12704, k, not_found) {
    var this__12705 = this;
    var this_sym12704__12708 = this;
    var node__12709 = this_sym12704__12708;
    return node__12709.cljs$core$ILookup$_lookup$arity$3(node__12709, k, not_found)
  };
  G__12750 = function(this_sym12704, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12750__2.call(this, this_sym12704, k);
      case 3:
        return G__12750__3.call(this, this_sym12704, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12750
}();
cljs.core.RedNode.prototype.apply = function(this_sym12695, args12696) {
  var this__12710 = this;
  return this_sym12695.call.apply(this_sym12695, [this_sym12695].concat(args12696.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__12711 = this;
  return cljs.core.PersistentVector.fromArray([this__12711.key, this__12711.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__12712 = this;
  return this__12712.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__12713 = this;
  return this__12713.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__12714 = this;
  var node__12715 = this;
  return new cljs.core.RedNode(this__12714.key, this__12714.val, this__12714.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__12716 = this;
  var node__12717 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__12718 = this;
  var node__12719 = this;
  return new cljs.core.RedNode(this__12718.key, this__12718.val, this__12718.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__12720 = this;
  var node__12721 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__12722 = this;
  var node__12723 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__12723, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__12724 = this;
  var node__12725 = this;
  return new cljs.core.RedNode(this__12724.key, this__12724.val, del, this__12724.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__12726 = this;
  var node__12727 = this;
  return new cljs.core.RedNode(this__12726.key, this__12726.val, ins, this__12726.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__12728 = this;
  var node__12729 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__12728.left)) {
    return new cljs.core.RedNode(this__12728.key, this__12728.val, this__12728.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__12728.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__12728.right)) {
      return new cljs.core.RedNode(this__12728.right.key, this__12728.right.val, new cljs.core.BlackNode(this__12728.key, this__12728.val, this__12728.left, this__12728.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__12728.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__12729, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__12751 = null;
  var G__12751__0 = function() {
    var this__12730 = this;
    var this__12732 = this;
    return cljs.core.pr_str.call(null, this__12732)
  };
  G__12751 = function() {
    switch(arguments.length) {
      case 0:
        return G__12751__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12751
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__12733 = this;
  var node__12734 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__12733.right)) {
    return new cljs.core.RedNode(this__12733.key, this__12733.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__12733.left, null), this__12733.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__12733.left)) {
      return new cljs.core.RedNode(this__12733.left.key, this__12733.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__12733.left.left, null), new cljs.core.BlackNode(this__12733.key, this__12733.val, this__12733.left.right, this__12733.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__12734, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__12735 = this;
  var node__12736 = this;
  return new cljs.core.BlackNode(this__12735.key, this__12735.val, this__12735.left, this__12735.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__12737 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__12738 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__12739 = this;
  return cljs.core.list.call(null, this__12739.key, this__12739.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__12740 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__12741 = this;
  return this__12741.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__12742 = this;
  return cljs.core.PersistentVector.fromArray([this__12742.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__12743 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__12743.key, this__12743.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12744 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__12745 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__12745.key, this__12745.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__12746 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__12747 = this;
  if(n === 0) {
    return this__12747.key
  }else {
    if(n === 1) {
      return this__12747.val
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
  var this__12748 = this;
  if(n === 0) {
    return this__12748.key
  }else {
    if(n === 1) {
      return this__12748.val
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
  var this__12749 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__12755 = comp.call(null, k, tree.key);
    if(c__12755 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__12755 < 0) {
        var ins__12756 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__12756 == null)) {
          return tree.add_left(ins__12756)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__12757 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__12757 == null)) {
            return tree.add_right(ins__12757)
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
          var app__12760 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__12760)) {
            return new cljs.core.RedNode(app__12760.key, app__12760.val, new cljs.core.RedNode(left.key, left.val, left.left, app__12760.left, null), new cljs.core.RedNode(right.key, right.val, app__12760.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__12760, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__12761 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__12761)) {
              return new cljs.core.RedNode(app__12761.key, app__12761.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__12761.left, null), new cljs.core.BlackNode(right.key, right.val, app__12761.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__12761, right.right, null))
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
    var c__12767 = comp.call(null, k, tree.key);
    if(c__12767 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__12767 < 0) {
        var del__12768 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____12769 = !(del__12768 == null);
          if(or__3824__auto____12769) {
            return or__3824__auto____12769
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__12768, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__12768, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__12770 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____12771 = !(del__12770 == null);
            if(or__3824__auto____12771) {
              return or__3824__auto____12771
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__12770)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__12770, null)
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
  var tk__12774 = tree.key;
  var c__12775 = comp.call(null, k, tk__12774);
  if(c__12775 === 0) {
    return tree.replace(tk__12774, v, tree.left, tree.right)
  }else {
    if(c__12775 < 0) {
      return tree.replace(tk__12774, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__12774, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__12778 = this;
  var h__2247__auto____12779 = this__12778.__hash;
  if(!(h__2247__auto____12779 == null)) {
    return h__2247__auto____12779
  }else {
    var h__2247__auto____12780 = cljs.core.hash_imap.call(null, coll);
    this__12778.__hash = h__2247__auto____12780;
    return h__2247__auto____12780
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__12781 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__12782 = this;
  var n__12783 = coll.entry_at(k);
  if(!(n__12783 == null)) {
    return n__12783.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__12784 = this;
  var found__12785 = [null];
  var t__12786 = cljs.core.tree_map_add.call(null, this__12784.comp, this__12784.tree, k, v, found__12785);
  if(t__12786 == null) {
    var found_node__12787 = cljs.core.nth.call(null, found__12785, 0);
    if(cljs.core._EQ_.call(null, v, found_node__12787.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__12784.comp, cljs.core.tree_map_replace.call(null, this__12784.comp, this__12784.tree, k, v), this__12784.cnt, this__12784.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__12784.comp, t__12786.blacken(), this__12784.cnt + 1, this__12784.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__12788 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__12822 = null;
  var G__12822__2 = function(this_sym12789, k) {
    var this__12791 = this;
    var this_sym12789__12792 = this;
    var coll__12793 = this_sym12789__12792;
    return coll__12793.cljs$core$ILookup$_lookup$arity$2(coll__12793, k)
  };
  var G__12822__3 = function(this_sym12790, k, not_found) {
    var this__12791 = this;
    var this_sym12790__12794 = this;
    var coll__12795 = this_sym12790__12794;
    return coll__12795.cljs$core$ILookup$_lookup$arity$3(coll__12795, k, not_found)
  };
  G__12822 = function(this_sym12790, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12822__2.call(this, this_sym12790, k);
      case 3:
        return G__12822__3.call(this, this_sym12790, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12822
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym12776, args12777) {
  var this__12796 = this;
  return this_sym12776.call.apply(this_sym12776, [this_sym12776].concat(args12777.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__12797 = this;
  if(!(this__12797.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__12797.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__12798 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__12799 = this;
  if(this__12799.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__12799.tree, false, this__12799.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__12800 = this;
  var this__12801 = this;
  return cljs.core.pr_str.call(null, this__12801)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__12802 = this;
  var coll__12803 = this;
  var t__12804 = this__12802.tree;
  while(true) {
    if(!(t__12804 == null)) {
      var c__12805 = this__12802.comp.call(null, k, t__12804.key);
      if(c__12805 === 0) {
        return t__12804
      }else {
        if(c__12805 < 0) {
          var G__12823 = t__12804.left;
          t__12804 = G__12823;
          continue
        }else {
          if("\ufdd0'else") {
            var G__12824 = t__12804.right;
            t__12804 = G__12824;
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
  var this__12806 = this;
  if(this__12806.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__12806.tree, ascending_QMARK_, this__12806.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__12807 = this;
  if(this__12807.cnt > 0) {
    var stack__12808 = null;
    var t__12809 = this__12807.tree;
    while(true) {
      if(!(t__12809 == null)) {
        var c__12810 = this__12807.comp.call(null, k, t__12809.key);
        if(c__12810 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__12808, t__12809), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__12810 < 0) {
              var G__12825 = cljs.core.conj.call(null, stack__12808, t__12809);
              var G__12826 = t__12809.left;
              stack__12808 = G__12825;
              t__12809 = G__12826;
              continue
            }else {
              var G__12827 = stack__12808;
              var G__12828 = t__12809.right;
              stack__12808 = G__12827;
              t__12809 = G__12828;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__12810 > 0) {
                var G__12829 = cljs.core.conj.call(null, stack__12808, t__12809);
                var G__12830 = t__12809.right;
                stack__12808 = G__12829;
                t__12809 = G__12830;
                continue
              }else {
                var G__12831 = stack__12808;
                var G__12832 = t__12809.left;
                stack__12808 = G__12831;
                t__12809 = G__12832;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__12808 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__12808, ascending_QMARK_, -1, null)
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
  var this__12811 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__12812 = this;
  return this__12812.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12813 = this;
  if(this__12813.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__12813.tree, true, this__12813.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12814 = this;
  return this__12814.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12815 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12816 = this;
  return new cljs.core.PersistentTreeMap(this__12816.comp, this__12816.tree, this__12816.cnt, meta, this__12816.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12817 = this;
  return this__12817.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12818 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__12818.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__12819 = this;
  var found__12820 = [null];
  var t__12821 = cljs.core.tree_map_remove.call(null, this__12819.comp, this__12819.tree, k, found__12820);
  if(t__12821 == null) {
    if(cljs.core.nth.call(null, found__12820, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__12819.comp, null, 0, this__12819.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__12819.comp, t__12821.blacken(), this__12819.cnt - 1, this__12819.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__12835 = cljs.core.seq.call(null, keyvals);
    var out__12836 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__12835) {
        var G__12837 = cljs.core.nnext.call(null, in__12835);
        var G__12838 = cljs.core.assoc_BANG_.call(null, out__12836, cljs.core.first.call(null, in__12835), cljs.core.second.call(null, in__12835));
        in__12835 = G__12837;
        out__12836 = G__12838;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__12836)
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
  hash_map.cljs$lang$applyTo = function(arglist__12839) {
    var keyvals = cljs.core.seq(arglist__12839);
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
  array_map.cljs$lang$applyTo = function(arglist__12840) {
    var keyvals = cljs.core.seq(arglist__12840);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__12844 = [];
    var obj__12845 = {};
    var kvs__12846 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__12846) {
        ks__12844.push(cljs.core.first.call(null, kvs__12846));
        obj__12845[cljs.core.first.call(null, kvs__12846)] = cljs.core.second.call(null, kvs__12846);
        var G__12847 = cljs.core.nnext.call(null, kvs__12846);
        kvs__12846 = G__12847;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__12844, obj__12845)
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
  obj_map.cljs$lang$applyTo = function(arglist__12848) {
    var keyvals = cljs.core.seq(arglist__12848);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__12851 = cljs.core.seq.call(null, keyvals);
    var out__12852 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__12851) {
        var G__12853 = cljs.core.nnext.call(null, in__12851);
        var G__12854 = cljs.core.assoc.call(null, out__12852, cljs.core.first.call(null, in__12851), cljs.core.second.call(null, in__12851));
        in__12851 = G__12853;
        out__12852 = G__12854;
        continue
      }else {
        return out__12852
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
  sorted_map.cljs$lang$applyTo = function(arglist__12855) {
    var keyvals = cljs.core.seq(arglist__12855);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__12858 = cljs.core.seq.call(null, keyvals);
    var out__12859 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__12858) {
        var G__12860 = cljs.core.nnext.call(null, in__12858);
        var G__12861 = cljs.core.assoc.call(null, out__12859, cljs.core.first.call(null, in__12858), cljs.core.second.call(null, in__12858));
        in__12858 = G__12860;
        out__12859 = G__12861;
        continue
      }else {
        return out__12859
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__12862) {
    var comparator = cljs.core.first(arglist__12862);
    var keyvals = cljs.core.rest(arglist__12862);
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
      return cljs.core.reduce.call(null, function(p1__12863_SHARP_, p2__12864_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____12866 = p1__12863_SHARP_;
          if(cljs.core.truth_(or__3824__auto____12866)) {
            return or__3824__auto____12866
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__12864_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__12867) {
    var maps = cljs.core.seq(arglist__12867);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__12875 = function(m, e) {
        var k__12873 = cljs.core.first.call(null, e);
        var v__12874 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__12873)) {
          return cljs.core.assoc.call(null, m, k__12873, f.call(null, cljs.core._lookup.call(null, m, k__12873, null), v__12874))
        }else {
          return cljs.core.assoc.call(null, m, k__12873, v__12874)
        }
      };
      var merge2__12877 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__12875, function() {
          var or__3824__auto____12876 = m1;
          if(cljs.core.truth_(or__3824__auto____12876)) {
            return or__3824__auto____12876
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__12877, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__12878) {
    var f = cljs.core.first(arglist__12878);
    var maps = cljs.core.rest(arglist__12878);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__12883 = cljs.core.ObjMap.EMPTY;
  var keys__12884 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__12884) {
      var key__12885 = cljs.core.first.call(null, keys__12884);
      var entry__12886 = cljs.core._lookup.call(null, map, key__12885, "\ufdd0'cljs.core/not-found");
      var G__12887 = cljs.core.not_EQ_.call(null, entry__12886, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__12883, key__12885, entry__12886) : ret__12883;
      var G__12888 = cljs.core.next.call(null, keys__12884);
      ret__12883 = G__12887;
      keys__12884 = G__12888;
      continue
    }else {
      return ret__12883
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
  var this__12892 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__12892.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__12893 = this;
  var h__2247__auto____12894 = this__12893.__hash;
  if(!(h__2247__auto____12894 == null)) {
    return h__2247__auto____12894
  }else {
    var h__2247__auto____12895 = cljs.core.hash_iset.call(null, coll);
    this__12893.__hash = h__2247__auto____12895;
    return h__2247__auto____12895
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__12896 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__12897 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__12897.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__12918 = null;
  var G__12918__2 = function(this_sym12898, k) {
    var this__12900 = this;
    var this_sym12898__12901 = this;
    var coll__12902 = this_sym12898__12901;
    return coll__12902.cljs$core$ILookup$_lookup$arity$2(coll__12902, k)
  };
  var G__12918__3 = function(this_sym12899, k, not_found) {
    var this__12900 = this;
    var this_sym12899__12903 = this;
    var coll__12904 = this_sym12899__12903;
    return coll__12904.cljs$core$ILookup$_lookup$arity$3(coll__12904, k, not_found)
  };
  G__12918 = function(this_sym12899, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12918__2.call(this, this_sym12899, k);
      case 3:
        return G__12918__3.call(this, this_sym12899, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12918
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym12890, args12891) {
  var this__12905 = this;
  return this_sym12890.call.apply(this_sym12890, [this_sym12890].concat(args12891.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12906 = this;
  return new cljs.core.PersistentHashSet(this__12906.meta, cljs.core.assoc.call(null, this__12906.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__12907 = this;
  var this__12908 = this;
  return cljs.core.pr_str.call(null, this__12908)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12909 = this;
  return cljs.core.keys.call(null, this__12909.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__12910 = this;
  return new cljs.core.PersistentHashSet(this__12910.meta, cljs.core.dissoc.call(null, this__12910.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12911 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12912 = this;
  var and__3822__auto____12913 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____12913) {
    var and__3822__auto____12914 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____12914) {
      return cljs.core.every_QMARK_.call(null, function(p1__12889_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__12889_SHARP_)
      }, other)
    }else {
      return and__3822__auto____12914
    }
  }else {
    return and__3822__auto____12913
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12915 = this;
  return new cljs.core.PersistentHashSet(meta, this__12915.hash_map, this__12915.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12916 = this;
  return this__12916.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12917 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__12917.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__12919 = cljs.core.count.call(null, items);
  var i__12920 = 0;
  var out__12921 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__12920 < len__12919) {
      var G__12922 = i__12920 + 1;
      var G__12923 = cljs.core.conj_BANG_.call(null, out__12921, items[i__12920]);
      i__12920 = G__12922;
      out__12921 = G__12923;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__12921)
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
  var G__12941 = null;
  var G__12941__2 = function(this_sym12927, k) {
    var this__12929 = this;
    var this_sym12927__12930 = this;
    var tcoll__12931 = this_sym12927__12930;
    if(cljs.core._lookup.call(null, this__12929.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__12941__3 = function(this_sym12928, k, not_found) {
    var this__12929 = this;
    var this_sym12928__12932 = this;
    var tcoll__12933 = this_sym12928__12932;
    if(cljs.core._lookup.call(null, this__12929.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__12941 = function(this_sym12928, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12941__2.call(this, this_sym12928, k);
      case 3:
        return G__12941__3.call(this, this_sym12928, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12941
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym12925, args12926) {
  var this__12934 = this;
  return this_sym12925.call.apply(this_sym12925, [this_sym12925].concat(args12926.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__12935 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__12936 = this;
  if(cljs.core._lookup.call(null, this__12936.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__12937 = this;
  return cljs.core.count.call(null, this__12937.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__12938 = this;
  this__12938.transient_map = cljs.core.dissoc_BANG_.call(null, this__12938.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__12939 = this;
  this__12939.transient_map = cljs.core.assoc_BANG_.call(null, this__12939.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__12940 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__12940.transient_map), null)
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
  var this__12944 = this;
  var h__2247__auto____12945 = this__12944.__hash;
  if(!(h__2247__auto____12945 == null)) {
    return h__2247__auto____12945
  }else {
    var h__2247__auto____12946 = cljs.core.hash_iset.call(null, coll);
    this__12944.__hash = h__2247__auto____12946;
    return h__2247__auto____12946
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__12947 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__12948 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__12948.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__12974 = null;
  var G__12974__2 = function(this_sym12949, k) {
    var this__12951 = this;
    var this_sym12949__12952 = this;
    var coll__12953 = this_sym12949__12952;
    return coll__12953.cljs$core$ILookup$_lookup$arity$2(coll__12953, k)
  };
  var G__12974__3 = function(this_sym12950, k, not_found) {
    var this__12951 = this;
    var this_sym12950__12954 = this;
    var coll__12955 = this_sym12950__12954;
    return coll__12955.cljs$core$ILookup$_lookup$arity$3(coll__12955, k, not_found)
  };
  G__12974 = function(this_sym12950, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__12974__2.call(this, this_sym12950, k);
      case 3:
        return G__12974__3.call(this, this_sym12950, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__12974
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym12942, args12943) {
  var this__12956 = this;
  return this_sym12942.call.apply(this_sym12942, [this_sym12942].concat(args12943.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__12957 = this;
  return new cljs.core.PersistentTreeSet(this__12957.meta, cljs.core.assoc.call(null, this__12957.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__12958 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__12958.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__12959 = this;
  var this__12960 = this;
  return cljs.core.pr_str.call(null, this__12960)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__12961 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__12961.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__12962 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__12962.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__12963 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__12964 = this;
  return cljs.core._comparator.call(null, this__12964.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__12965 = this;
  return cljs.core.keys.call(null, this__12965.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__12966 = this;
  return new cljs.core.PersistentTreeSet(this__12966.meta, cljs.core.dissoc.call(null, this__12966.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__12967 = this;
  return cljs.core.count.call(null, this__12967.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__12968 = this;
  var and__3822__auto____12969 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____12969) {
    var and__3822__auto____12970 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____12970) {
      return cljs.core.every_QMARK_.call(null, function(p1__12924_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__12924_SHARP_)
      }, other)
    }else {
      return and__3822__auto____12970
    }
  }else {
    return and__3822__auto____12969
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__12971 = this;
  return new cljs.core.PersistentTreeSet(meta, this__12971.tree_map, this__12971.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__12972 = this;
  return this__12972.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__12973 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__12973.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__12979__delegate = function(keys) {
      var in__12977 = cljs.core.seq.call(null, keys);
      var out__12978 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__12977)) {
          var G__12980 = cljs.core.next.call(null, in__12977);
          var G__12981 = cljs.core.conj_BANG_.call(null, out__12978, cljs.core.first.call(null, in__12977));
          in__12977 = G__12980;
          out__12978 = G__12981;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__12978)
        }
        break
      }
    };
    var G__12979 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__12979__delegate.call(this, keys)
    };
    G__12979.cljs$lang$maxFixedArity = 0;
    G__12979.cljs$lang$applyTo = function(arglist__12982) {
      var keys = cljs.core.seq(arglist__12982);
      return G__12979__delegate(keys)
    };
    G__12979.cljs$lang$arity$variadic = G__12979__delegate;
    return G__12979
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
  sorted_set.cljs$lang$applyTo = function(arglist__12983) {
    var keys = cljs.core.seq(arglist__12983);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__12985) {
    var comparator = cljs.core.first(arglist__12985);
    var keys = cljs.core.rest(arglist__12985);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__12991 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____12992 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____12992)) {
        var e__12993 = temp__3971__auto____12992;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__12993))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__12991, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__12984_SHARP_) {
      var temp__3971__auto____12994 = cljs.core.find.call(null, smap, p1__12984_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____12994)) {
        var e__12995 = temp__3971__auto____12994;
        return cljs.core.second.call(null, e__12995)
      }else {
        return p1__12984_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__13025 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__13018, seen) {
        while(true) {
          var vec__13019__13020 = p__13018;
          var f__13021 = cljs.core.nth.call(null, vec__13019__13020, 0, null);
          var xs__13022 = vec__13019__13020;
          var temp__3974__auto____13023 = cljs.core.seq.call(null, xs__13022);
          if(temp__3974__auto____13023) {
            var s__13024 = temp__3974__auto____13023;
            if(cljs.core.contains_QMARK_.call(null, seen, f__13021)) {
              var G__13026 = cljs.core.rest.call(null, s__13024);
              var G__13027 = seen;
              p__13018 = G__13026;
              seen = G__13027;
              continue
            }else {
              return cljs.core.cons.call(null, f__13021, step.call(null, cljs.core.rest.call(null, s__13024), cljs.core.conj.call(null, seen, f__13021)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__13025.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__13030 = cljs.core.PersistentVector.EMPTY;
  var s__13031 = s;
  while(true) {
    if(cljs.core.next.call(null, s__13031)) {
      var G__13032 = cljs.core.conj.call(null, ret__13030, cljs.core.first.call(null, s__13031));
      var G__13033 = cljs.core.next.call(null, s__13031);
      ret__13030 = G__13032;
      s__13031 = G__13033;
      continue
    }else {
      return cljs.core.seq.call(null, ret__13030)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____13036 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____13036) {
        return or__3824__auto____13036
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__13037 = x.lastIndexOf("/");
      if(i__13037 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__13037 + 1)
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
    var or__3824__auto____13040 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____13040) {
      return or__3824__auto____13040
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__13041 = x.lastIndexOf("/");
    if(i__13041 > -1) {
      return cljs.core.subs.call(null, x, 2, i__13041)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__13048 = cljs.core.ObjMap.EMPTY;
  var ks__13049 = cljs.core.seq.call(null, keys);
  var vs__13050 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____13051 = ks__13049;
      if(and__3822__auto____13051) {
        return vs__13050
      }else {
        return and__3822__auto____13051
      }
    }()) {
      var G__13052 = cljs.core.assoc.call(null, map__13048, cljs.core.first.call(null, ks__13049), cljs.core.first.call(null, vs__13050));
      var G__13053 = cljs.core.next.call(null, ks__13049);
      var G__13054 = cljs.core.next.call(null, vs__13050);
      map__13048 = G__13052;
      ks__13049 = G__13053;
      vs__13050 = G__13054;
      continue
    }else {
      return map__13048
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
    var G__13057__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__13042_SHARP_, p2__13043_SHARP_) {
        return max_key.call(null, k, p1__13042_SHARP_, p2__13043_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__13057 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__13057__delegate.call(this, k, x, y, more)
    };
    G__13057.cljs$lang$maxFixedArity = 3;
    G__13057.cljs$lang$applyTo = function(arglist__13058) {
      var k = cljs.core.first(arglist__13058);
      var x = cljs.core.first(cljs.core.next(arglist__13058));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13058)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13058)));
      return G__13057__delegate(k, x, y, more)
    };
    G__13057.cljs$lang$arity$variadic = G__13057__delegate;
    return G__13057
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
    var G__13059__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__13055_SHARP_, p2__13056_SHARP_) {
        return min_key.call(null, k, p1__13055_SHARP_, p2__13056_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__13059 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__13059__delegate.call(this, k, x, y, more)
    };
    G__13059.cljs$lang$maxFixedArity = 3;
    G__13059.cljs$lang$applyTo = function(arglist__13060) {
      var k = cljs.core.first(arglist__13060);
      var x = cljs.core.first(cljs.core.next(arglist__13060));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13060)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13060)));
      return G__13059__delegate(k, x, y, more)
    };
    G__13059.cljs$lang$arity$variadic = G__13059__delegate;
    return G__13059
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
      var temp__3974__auto____13063 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____13063) {
        var s__13064 = temp__3974__auto____13063;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__13064), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__13064)))
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
    var temp__3974__auto____13067 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____13067) {
      var s__13068 = temp__3974__auto____13067;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__13068)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__13068), take_while.call(null, pred, cljs.core.rest.call(null, s__13068)))
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
    var comp__13070 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__13070.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__13082 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____13083 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____13083)) {
        var vec__13084__13085 = temp__3974__auto____13083;
        var e__13086 = cljs.core.nth.call(null, vec__13084__13085, 0, null);
        var s__13087 = vec__13084__13085;
        if(cljs.core.truth_(include__13082.call(null, e__13086))) {
          return s__13087
        }else {
          return cljs.core.next.call(null, s__13087)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__13082, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____13088 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____13088)) {
      var vec__13089__13090 = temp__3974__auto____13088;
      var e__13091 = cljs.core.nth.call(null, vec__13089__13090, 0, null);
      var s__13092 = vec__13089__13090;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__13091)) ? s__13092 : cljs.core.next.call(null, s__13092))
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
    var include__13104 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____13105 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____13105)) {
        var vec__13106__13107 = temp__3974__auto____13105;
        var e__13108 = cljs.core.nth.call(null, vec__13106__13107, 0, null);
        var s__13109 = vec__13106__13107;
        if(cljs.core.truth_(include__13104.call(null, e__13108))) {
          return s__13109
        }else {
          return cljs.core.next.call(null, s__13109)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__13104, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____13110 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____13110)) {
      var vec__13111__13112 = temp__3974__auto____13110;
      var e__13113 = cljs.core.nth.call(null, vec__13111__13112, 0, null);
      var s__13114 = vec__13111__13112;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__13113)) ? s__13114 : cljs.core.next.call(null, s__13114))
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
  var this__13115 = this;
  var h__2247__auto____13116 = this__13115.__hash;
  if(!(h__2247__auto____13116 == null)) {
    return h__2247__auto____13116
  }else {
    var h__2247__auto____13117 = cljs.core.hash_coll.call(null, rng);
    this__13115.__hash = h__2247__auto____13117;
    return h__2247__auto____13117
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__13118 = this;
  if(this__13118.step > 0) {
    if(this__13118.start + this__13118.step < this__13118.end) {
      return new cljs.core.Range(this__13118.meta, this__13118.start + this__13118.step, this__13118.end, this__13118.step, null)
    }else {
      return null
    }
  }else {
    if(this__13118.start + this__13118.step > this__13118.end) {
      return new cljs.core.Range(this__13118.meta, this__13118.start + this__13118.step, this__13118.end, this__13118.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__13119 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__13120 = this;
  var this__13121 = this;
  return cljs.core.pr_str.call(null, this__13121)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__13122 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__13123 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__13124 = this;
  if(this__13124.step > 0) {
    if(this__13124.start < this__13124.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__13124.start > this__13124.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__13125 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__13125.end - this__13125.start) / this__13125.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__13126 = this;
  return this__13126.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__13127 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__13127.meta, this__13127.start + this__13127.step, this__13127.end, this__13127.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__13128 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__13129 = this;
  return new cljs.core.Range(meta, this__13129.start, this__13129.end, this__13129.step, this__13129.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__13130 = this;
  return this__13130.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__13131 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__13131.start + n * this__13131.step
  }else {
    if(function() {
      var and__3822__auto____13132 = this__13131.start > this__13131.end;
      if(and__3822__auto____13132) {
        return this__13131.step === 0
      }else {
        return and__3822__auto____13132
      }
    }()) {
      return this__13131.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__13133 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__13133.start + n * this__13133.step
  }else {
    if(function() {
      var and__3822__auto____13134 = this__13133.start > this__13133.end;
      if(and__3822__auto____13134) {
        return this__13133.step === 0
      }else {
        return and__3822__auto____13134
      }
    }()) {
      return this__13133.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__13135 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__13135.meta)
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
    var temp__3974__auto____13138 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____13138) {
      var s__13139 = temp__3974__auto____13138;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__13139), take_nth.call(null, n, cljs.core.drop.call(null, n, s__13139)))
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
    var temp__3974__auto____13146 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____13146) {
      var s__13147 = temp__3974__auto____13146;
      var fst__13148 = cljs.core.first.call(null, s__13147);
      var fv__13149 = f.call(null, fst__13148);
      var run__13150 = cljs.core.cons.call(null, fst__13148, cljs.core.take_while.call(null, function(p1__13140_SHARP_) {
        return cljs.core._EQ_.call(null, fv__13149, f.call(null, p1__13140_SHARP_))
      }, cljs.core.next.call(null, s__13147)));
      return cljs.core.cons.call(null, run__13150, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__13150), s__13147))))
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
      var temp__3971__auto____13165 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____13165) {
        var s__13166 = temp__3971__auto____13165;
        return reductions.call(null, f, cljs.core.first.call(null, s__13166), cljs.core.rest.call(null, s__13166))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____13167 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____13167) {
        var s__13168 = temp__3974__auto____13167;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__13168)), cljs.core.rest.call(null, s__13168))
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
      var G__13171 = null;
      var G__13171__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__13171__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__13171__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__13171__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__13171__4 = function() {
        var G__13172__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__13172 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13172__delegate.call(this, x, y, z, args)
        };
        G__13172.cljs$lang$maxFixedArity = 3;
        G__13172.cljs$lang$applyTo = function(arglist__13173) {
          var x = cljs.core.first(arglist__13173);
          var y = cljs.core.first(cljs.core.next(arglist__13173));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13173)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13173)));
          return G__13172__delegate(x, y, z, args)
        };
        G__13172.cljs$lang$arity$variadic = G__13172__delegate;
        return G__13172
      }();
      G__13171 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__13171__0.call(this);
          case 1:
            return G__13171__1.call(this, x);
          case 2:
            return G__13171__2.call(this, x, y);
          case 3:
            return G__13171__3.call(this, x, y, z);
          default:
            return G__13171__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13171.cljs$lang$maxFixedArity = 3;
      G__13171.cljs$lang$applyTo = G__13171__4.cljs$lang$applyTo;
      return G__13171
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__13174 = null;
      var G__13174__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__13174__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__13174__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__13174__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__13174__4 = function() {
        var G__13175__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__13175 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13175__delegate.call(this, x, y, z, args)
        };
        G__13175.cljs$lang$maxFixedArity = 3;
        G__13175.cljs$lang$applyTo = function(arglist__13176) {
          var x = cljs.core.first(arglist__13176);
          var y = cljs.core.first(cljs.core.next(arglist__13176));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13176)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13176)));
          return G__13175__delegate(x, y, z, args)
        };
        G__13175.cljs$lang$arity$variadic = G__13175__delegate;
        return G__13175
      }();
      G__13174 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__13174__0.call(this);
          case 1:
            return G__13174__1.call(this, x);
          case 2:
            return G__13174__2.call(this, x, y);
          case 3:
            return G__13174__3.call(this, x, y, z);
          default:
            return G__13174__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13174.cljs$lang$maxFixedArity = 3;
      G__13174.cljs$lang$applyTo = G__13174__4.cljs$lang$applyTo;
      return G__13174
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__13177 = null;
      var G__13177__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__13177__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__13177__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__13177__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__13177__4 = function() {
        var G__13178__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__13178 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__13178__delegate.call(this, x, y, z, args)
        };
        G__13178.cljs$lang$maxFixedArity = 3;
        G__13178.cljs$lang$applyTo = function(arglist__13179) {
          var x = cljs.core.first(arglist__13179);
          var y = cljs.core.first(cljs.core.next(arglist__13179));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13179)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13179)));
          return G__13178__delegate(x, y, z, args)
        };
        G__13178.cljs$lang$arity$variadic = G__13178__delegate;
        return G__13178
      }();
      G__13177 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__13177__0.call(this);
          case 1:
            return G__13177__1.call(this, x);
          case 2:
            return G__13177__2.call(this, x, y);
          case 3:
            return G__13177__3.call(this, x, y, z);
          default:
            return G__13177__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__13177.cljs$lang$maxFixedArity = 3;
      G__13177.cljs$lang$applyTo = G__13177__4.cljs$lang$applyTo;
      return G__13177
    }()
  };
  var juxt__4 = function() {
    var G__13180__delegate = function(f, g, h, fs) {
      var fs__13170 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__13181 = null;
        var G__13181__0 = function() {
          return cljs.core.reduce.call(null, function(p1__13151_SHARP_, p2__13152_SHARP_) {
            return cljs.core.conj.call(null, p1__13151_SHARP_, p2__13152_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__13170)
        };
        var G__13181__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__13153_SHARP_, p2__13154_SHARP_) {
            return cljs.core.conj.call(null, p1__13153_SHARP_, p2__13154_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__13170)
        };
        var G__13181__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__13155_SHARP_, p2__13156_SHARP_) {
            return cljs.core.conj.call(null, p1__13155_SHARP_, p2__13156_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__13170)
        };
        var G__13181__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__13157_SHARP_, p2__13158_SHARP_) {
            return cljs.core.conj.call(null, p1__13157_SHARP_, p2__13158_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__13170)
        };
        var G__13181__4 = function() {
          var G__13182__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__13159_SHARP_, p2__13160_SHARP_) {
              return cljs.core.conj.call(null, p1__13159_SHARP_, cljs.core.apply.call(null, p2__13160_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__13170)
          };
          var G__13182 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__13182__delegate.call(this, x, y, z, args)
          };
          G__13182.cljs$lang$maxFixedArity = 3;
          G__13182.cljs$lang$applyTo = function(arglist__13183) {
            var x = cljs.core.first(arglist__13183);
            var y = cljs.core.first(cljs.core.next(arglist__13183));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13183)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13183)));
            return G__13182__delegate(x, y, z, args)
          };
          G__13182.cljs$lang$arity$variadic = G__13182__delegate;
          return G__13182
        }();
        G__13181 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__13181__0.call(this);
            case 1:
              return G__13181__1.call(this, x);
            case 2:
              return G__13181__2.call(this, x, y);
            case 3:
              return G__13181__3.call(this, x, y, z);
            default:
              return G__13181__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__13181.cljs$lang$maxFixedArity = 3;
        G__13181.cljs$lang$applyTo = G__13181__4.cljs$lang$applyTo;
        return G__13181
      }()
    };
    var G__13180 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__13180__delegate.call(this, f, g, h, fs)
    };
    G__13180.cljs$lang$maxFixedArity = 3;
    G__13180.cljs$lang$applyTo = function(arglist__13184) {
      var f = cljs.core.first(arglist__13184);
      var g = cljs.core.first(cljs.core.next(arglist__13184));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13184)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__13184)));
      return G__13180__delegate(f, g, h, fs)
    };
    G__13180.cljs$lang$arity$variadic = G__13180__delegate;
    return G__13180
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
        var G__13187 = cljs.core.next.call(null, coll);
        coll = G__13187;
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
        var and__3822__auto____13186 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____13186) {
          return n > 0
        }else {
          return and__3822__auto____13186
        }
      }())) {
        var G__13188 = n - 1;
        var G__13189 = cljs.core.next.call(null, coll);
        n = G__13188;
        coll = G__13189;
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
  var matches__13191 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__13191), s)) {
    if(cljs.core.count.call(null, matches__13191) === 1) {
      return cljs.core.first.call(null, matches__13191)
    }else {
      return cljs.core.vec.call(null, matches__13191)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__13193 = re.exec(s);
  if(matches__13193 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__13193) === 1) {
      return cljs.core.first.call(null, matches__13193)
    }else {
      return cljs.core.vec.call(null, matches__13193)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__13198 = cljs.core.re_find.call(null, re, s);
  var match_idx__13199 = s.search(re);
  var match_str__13200 = cljs.core.coll_QMARK_.call(null, match_data__13198) ? cljs.core.first.call(null, match_data__13198) : match_data__13198;
  var post_match__13201 = cljs.core.subs.call(null, s, match_idx__13199 + cljs.core.count.call(null, match_str__13200));
  if(cljs.core.truth_(match_data__13198)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__13198, re_seq.call(null, re, post_match__13201))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__13208__13209 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___13210 = cljs.core.nth.call(null, vec__13208__13209, 0, null);
  var flags__13211 = cljs.core.nth.call(null, vec__13208__13209, 1, null);
  var pattern__13212 = cljs.core.nth.call(null, vec__13208__13209, 2, null);
  return new RegExp(pattern__13212, flags__13211)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__13202_SHARP_) {
    return print_one.call(null, p1__13202_SHARP_, opts)
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
          var and__3822__auto____13222 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____13222)) {
            var and__3822__auto____13226 = function() {
              var G__13223__13224 = obj;
              if(G__13223__13224) {
                if(function() {
                  var or__3824__auto____13225 = G__13223__13224.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____13225) {
                    return or__3824__auto____13225
                  }else {
                    return G__13223__13224.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__13223__13224.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__13223__13224)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__13223__13224)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____13226)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____13226
            }
          }else {
            return and__3822__auto____13222
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____13227 = !(obj == null);
          if(and__3822__auto____13227) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____13227
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__13228__13229 = obj;
          if(G__13228__13229) {
            if(function() {
              var or__3824__auto____13230 = G__13228__13229.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____13230) {
                return or__3824__auto____13230
              }else {
                return G__13228__13229.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__13228__13229.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__13228__13229)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__13228__13229)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__13250 = new goog.string.StringBuffer;
  var G__13251__13252 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__13251__13252) {
    var string__13253 = cljs.core.first.call(null, G__13251__13252);
    var G__13251__13254 = G__13251__13252;
    while(true) {
      sb__13250.append(string__13253);
      var temp__3974__auto____13255 = cljs.core.next.call(null, G__13251__13254);
      if(temp__3974__auto____13255) {
        var G__13251__13256 = temp__3974__auto____13255;
        var G__13269 = cljs.core.first.call(null, G__13251__13256);
        var G__13270 = G__13251__13256;
        string__13253 = G__13269;
        G__13251__13254 = G__13270;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__13257__13258 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__13257__13258) {
    var obj__13259 = cljs.core.first.call(null, G__13257__13258);
    var G__13257__13260 = G__13257__13258;
    while(true) {
      sb__13250.append(" ");
      var G__13261__13262 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__13259, opts));
      if(G__13261__13262) {
        var string__13263 = cljs.core.first.call(null, G__13261__13262);
        var G__13261__13264 = G__13261__13262;
        while(true) {
          sb__13250.append(string__13263);
          var temp__3974__auto____13265 = cljs.core.next.call(null, G__13261__13264);
          if(temp__3974__auto____13265) {
            var G__13261__13266 = temp__3974__auto____13265;
            var G__13271 = cljs.core.first.call(null, G__13261__13266);
            var G__13272 = G__13261__13266;
            string__13263 = G__13271;
            G__13261__13264 = G__13272;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____13267 = cljs.core.next.call(null, G__13257__13260);
      if(temp__3974__auto____13267) {
        var G__13257__13268 = temp__3974__auto____13267;
        var G__13273 = cljs.core.first.call(null, G__13257__13268);
        var G__13274 = G__13257__13268;
        obj__13259 = G__13273;
        G__13257__13260 = G__13274;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__13250
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__13276 = cljs.core.pr_sb.call(null, objs, opts);
  sb__13276.append("\n");
  return[cljs.core.str(sb__13276)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__13295__13296 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__13295__13296) {
    var string__13297 = cljs.core.first.call(null, G__13295__13296);
    var G__13295__13298 = G__13295__13296;
    while(true) {
      cljs.core.string_print.call(null, string__13297);
      var temp__3974__auto____13299 = cljs.core.next.call(null, G__13295__13298);
      if(temp__3974__auto____13299) {
        var G__13295__13300 = temp__3974__auto____13299;
        var G__13313 = cljs.core.first.call(null, G__13295__13300);
        var G__13314 = G__13295__13300;
        string__13297 = G__13313;
        G__13295__13298 = G__13314;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__13301__13302 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__13301__13302) {
    var obj__13303 = cljs.core.first.call(null, G__13301__13302);
    var G__13301__13304 = G__13301__13302;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__13305__13306 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__13303, opts));
      if(G__13305__13306) {
        var string__13307 = cljs.core.first.call(null, G__13305__13306);
        var G__13305__13308 = G__13305__13306;
        while(true) {
          cljs.core.string_print.call(null, string__13307);
          var temp__3974__auto____13309 = cljs.core.next.call(null, G__13305__13308);
          if(temp__3974__auto____13309) {
            var G__13305__13310 = temp__3974__auto____13309;
            var G__13315 = cljs.core.first.call(null, G__13305__13310);
            var G__13316 = G__13305__13310;
            string__13307 = G__13315;
            G__13305__13308 = G__13316;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____13311 = cljs.core.next.call(null, G__13301__13304);
      if(temp__3974__auto____13311) {
        var G__13301__13312 = temp__3974__auto____13311;
        var G__13317 = cljs.core.first.call(null, G__13301__13312);
        var G__13318 = G__13301__13312;
        obj__13303 = G__13317;
        G__13301__13304 = G__13318;
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
  pr_str.cljs$lang$applyTo = function(arglist__13319) {
    var objs = cljs.core.seq(arglist__13319);
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
  prn_str.cljs$lang$applyTo = function(arglist__13320) {
    var objs = cljs.core.seq(arglist__13320);
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
  pr.cljs$lang$applyTo = function(arglist__13321) {
    var objs = cljs.core.seq(arglist__13321);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__13322) {
    var objs = cljs.core.seq(arglist__13322);
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
  print_str.cljs$lang$applyTo = function(arglist__13323) {
    var objs = cljs.core.seq(arglist__13323);
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
  println.cljs$lang$applyTo = function(arglist__13324) {
    var objs = cljs.core.seq(arglist__13324);
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
  println_str.cljs$lang$applyTo = function(arglist__13325) {
    var objs = cljs.core.seq(arglist__13325);
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
  prn.cljs$lang$applyTo = function(arglist__13326) {
    var objs = cljs.core.seq(arglist__13326);
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
  printf.cljs$lang$applyTo = function(arglist__13327) {
    var fmt = cljs.core.first(arglist__13327);
    var args = cljs.core.rest(arglist__13327);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__13328 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__13328, "{", ", ", "}", opts, coll)
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
  var pr_pair__13329 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__13329, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__13330 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__13330, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____13331 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____13331)) {
        var nspc__13332 = temp__3974__auto____13331;
        return[cljs.core.str(nspc__13332), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____13333 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____13333)) {
          var nspc__13334 = temp__3974__auto____13333;
          return[cljs.core.str(nspc__13334), cljs.core.str("/")].join("")
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
  var pr_pair__13335 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__13335, "{", ", ", "}", opts, coll)
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
  var normalize__13337 = function(n, len) {
    var ns__13336 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__13336) < len) {
        var G__13339 = [cljs.core.str("0"), cljs.core.str(ns__13336)].join("");
        ns__13336 = G__13339;
        continue
      }else {
        return ns__13336
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__13337.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__13337.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__13337.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__13337.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__13337.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__13337.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__13338 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__13338, "{", ", ", "}", opts, coll)
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
  var this__13340 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__13341 = this;
  var G__13342__13343 = cljs.core.seq.call(null, this__13341.watches);
  if(G__13342__13343) {
    var G__13345__13347 = cljs.core.first.call(null, G__13342__13343);
    var vec__13346__13348 = G__13345__13347;
    var key__13349 = cljs.core.nth.call(null, vec__13346__13348, 0, null);
    var f__13350 = cljs.core.nth.call(null, vec__13346__13348, 1, null);
    var G__13342__13351 = G__13342__13343;
    var G__13345__13352 = G__13345__13347;
    var G__13342__13353 = G__13342__13351;
    while(true) {
      var vec__13354__13355 = G__13345__13352;
      var key__13356 = cljs.core.nth.call(null, vec__13354__13355, 0, null);
      var f__13357 = cljs.core.nth.call(null, vec__13354__13355, 1, null);
      var G__13342__13358 = G__13342__13353;
      f__13357.call(null, key__13356, this$, oldval, newval);
      var temp__3974__auto____13359 = cljs.core.next.call(null, G__13342__13358);
      if(temp__3974__auto____13359) {
        var G__13342__13360 = temp__3974__auto____13359;
        var G__13367 = cljs.core.first.call(null, G__13342__13360);
        var G__13368 = G__13342__13360;
        G__13345__13352 = G__13367;
        G__13342__13353 = G__13368;
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
  var this__13361 = this;
  return this$.watches = cljs.core.assoc.call(null, this__13361.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__13362 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__13362.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__13363 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__13363.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__13364 = this;
  return this__13364.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__13365 = this;
  return this__13365.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__13366 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__13380__delegate = function(x, p__13369) {
      var map__13375__13376 = p__13369;
      var map__13375__13377 = cljs.core.seq_QMARK_.call(null, map__13375__13376) ? cljs.core.apply.call(null, cljs.core.hash_map, map__13375__13376) : map__13375__13376;
      var validator__13378 = cljs.core._lookup.call(null, map__13375__13377, "\ufdd0'validator", null);
      var meta__13379 = cljs.core._lookup.call(null, map__13375__13377, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__13379, validator__13378, null)
    };
    var G__13380 = function(x, var_args) {
      var p__13369 = null;
      if(goog.isDef(var_args)) {
        p__13369 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__13380__delegate.call(this, x, p__13369)
    };
    G__13380.cljs$lang$maxFixedArity = 1;
    G__13380.cljs$lang$applyTo = function(arglist__13381) {
      var x = cljs.core.first(arglist__13381);
      var p__13369 = cljs.core.rest(arglist__13381);
      return G__13380__delegate(x, p__13369)
    };
    G__13380.cljs$lang$arity$variadic = G__13380__delegate;
    return G__13380
  }();
  atom = function(x, var_args) {
    var p__13369 = var_args;
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
  var temp__3974__auto____13385 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____13385)) {
    var validate__13386 = temp__3974__auto____13385;
    if(cljs.core.truth_(validate__13386.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__13387 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__13387, new_value);
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
    var G__13388__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__13388 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__13388__delegate.call(this, a, f, x, y, z, more)
    };
    G__13388.cljs$lang$maxFixedArity = 5;
    G__13388.cljs$lang$applyTo = function(arglist__13389) {
      var a = cljs.core.first(arglist__13389);
      var f = cljs.core.first(cljs.core.next(arglist__13389));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__13389)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13389))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13389)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__13389)))));
      return G__13388__delegate(a, f, x, y, z, more)
    };
    G__13388.cljs$lang$arity$variadic = G__13388__delegate;
    return G__13388
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__13390) {
    var iref = cljs.core.first(arglist__13390);
    var f = cljs.core.first(cljs.core.next(arglist__13390));
    var args = cljs.core.rest(cljs.core.next(arglist__13390));
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
  var this__13391 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__13391.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__13392 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__13392.state, function(p__13393) {
    var map__13394__13395 = p__13393;
    var map__13394__13396 = cljs.core.seq_QMARK_.call(null, map__13394__13395) ? cljs.core.apply.call(null, cljs.core.hash_map, map__13394__13395) : map__13394__13395;
    var curr_state__13397 = map__13394__13396;
    var done__13398 = cljs.core._lookup.call(null, map__13394__13396, "\ufdd0'done", null);
    if(cljs.core.truth_(done__13398)) {
      return curr_state__13397
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__13392.f.call(null)})
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
    var map__13419__13420 = options;
    var map__13419__13421 = cljs.core.seq_QMARK_.call(null, map__13419__13420) ? cljs.core.apply.call(null, cljs.core.hash_map, map__13419__13420) : map__13419__13420;
    var keywordize_keys__13422 = cljs.core._lookup.call(null, map__13419__13421, "\ufdd0'keywordize-keys", null);
    var keyfn__13423 = cljs.core.truth_(keywordize_keys__13422) ? cljs.core.keyword : cljs.core.str;
    var f__13438 = function thisfn(x) {
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
                var iter__2517__auto____13437 = function iter__13431(s__13432) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__13432__13435 = s__13432;
                    while(true) {
                      if(cljs.core.seq.call(null, s__13432__13435)) {
                        var k__13436 = cljs.core.first.call(null, s__13432__13435);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__13423.call(null, k__13436), thisfn.call(null, x[k__13436])], true), iter__13431.call(null, cljs.core.rest.call(null, s__13432__13435)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2517__auto____13437.call(null, cljs.core.js_keys.call(null, x))
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
    return f__13438.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__13439) {
    var x = cljs.core.first(arglist__13439);
    var options = cljs.core.rest(arglist__13439);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__13444 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__13448__delegate = function(args) {
      var temp__3971__auto____13445 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__13444), args, null);
      if(cljs.core.truth_(temp__3971__auto____13445)) {
        var v__13446 = temp__3971__auto____13445;
        return v__13446
      }else {
        var ret__13447 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__13444, cljs.core.assoc, args, ret__13447);
        return ret__13447
      }
    };
    var G__13448 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__13448__delegate.call(this, args)
    };
    G__13448.cljs$lang$maxFixedArity = 0;
    G__13448.cljs$lang$applyTo = function(arglist__13449) {
      var args = cljs.core.seq(arglist__13449);
      return G__13448__delegate(args)
    };
    G__13448.cljs$lang$arity$variadic = G__13448__delegate;
    return G__13448
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__13451 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__13451)) {
        var G__13452 = ret__13451;
        f = G__13452;
        continue
      }else {
        return ret__13451
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__13453__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__13453 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__13453__delegate.call(this, f, args)
    };
    G__13453.cljs$lang$maxFixedArity = 1;
    G__13453.cljs$lang$applyTo = function(arglist__13454) {
      var f = cljs.core.first(arglist__13454);
      var args = cljs.core.rest(arglist__13454);
      return G__13453__delegate(f, args)
    };
    G__13453.cljs$lang$arity$variadic = G__13453__delegate;
    return G__13453
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
    var k__13456 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__13456, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__13456, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____13465 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____13465) {
      return or__3824__auto____13465
    }else {
      var or__3824__auto____13466 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____13466) {
        return or__3824__auto____13466
      }else {
        var and__3822__auto____13467 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____13467) {
          var and__3822__auto____13468 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____13468) {
            var and__3822__auto____13469 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____13469) {
              var ret__13470 = true;
              var i__13471 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____13472 = cljs.core.not.call(null, ret__13470);
                  if(or__3824__auto____13472) {
                    return or__3824__auto____13472
                  }else {
                    return i__13471 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__13470
                }else {
                  var G__13473 = isa_QMARK_.call(null, h, child.call(null, i__13471), parent.call(null, i__13471));
                  var G__13474 = i__13471 + 1;
                  ret__13470 = G__13473;
                  i__13471 = G__13474;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____13469
            }
          }else {
            return and__3822__auto____13468
          }
        }else {
          return and__3822__auto____13467
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
    var tp__13483 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__13484 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__13485 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__13486 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____13487 = cljs.core.contains_QMARK_.call(null, tp__13483.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__13485.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__13485.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__13483, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__13486.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__13484, parent, ta__13485), "\ufdd0'descendants":tf__13486.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__13485, tag, td__13484)})
    }();
    if(cljs.core.truth_(or__3824__auto____13487)) {
      return or__3824__auto____13487
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
    var parentMap__13492 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__13493 = cljs.core.truth_(parentMap__13492.call(null, tag)) ? cljs.core.disj.call(null, parentMap__13492.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__13494 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__13493)) ? cljs.core.assoc.call(null, parentMap__13492, tag, childsParents__13493) : cljs.core.dissoc.call(null, parentMap__13492, tag);
    var deriv_seq__13495 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__13475_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__13475_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__13475_SHARP_), cljs.core.second.call(null, p1__13475_SHARP_)))
    }, cljs.core.seq.call(null, newParents__13494)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__13492.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__13476_SHARP_, p2__13477_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__13476_SHARP_, p2__13477_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__13495))
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
  var xprefs__13503 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____13505 = cljs.core.truth_(function() {
    var and__3822__auto____13504 = xprefs__13503;
    if(cljs.core.truth_(and__3822__auto____13504)) {
      return xprefs__13503.call(null, y)
    }else {
      return and__3822__auto____13504
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____13505)) {
    return or__3824__auto____13505
  }else {
    var or__3824__auto____13507 = function() {
      var ps__13506 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__13506) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__13506), prefer_table))) {
          }else {
          }
          var G__13510 = cljs.core.rest.call(null, ps__13506);
          ps__13506 = G__13510;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____13507)) {
      return or__3824__auto____13507
    }else {
      var or__3824__auto____13509 = function() {
        var ps__13508 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__13508) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__13508), y, prefer_table))) {
            }else {
            }
            var G__13511 = cljs.core.rest.call(null, ps__13508);
            ps__13508 = G__13511;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____13509)) {
        return or__3824__auto____13509
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____13513 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____13513)) {
    return or__3824__auto____13513
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__13531 = cljs.core.reduce.call(null, function(be, p__13523) {
    var vec__13524__13525 = p__13523;
    var k__13526 = cljs.core.nth.call(null, vec__13524__13525, 0, null);
    var ___13527 = cljs.core.nth.call(null, vec__13524__13525, 1, null);
    var e__13528 = vec__13524__13525;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__13526)) {
      var be2__13530 = cljs.core.truth_(function() {
        var or__3824__auto____13529 = be == null;
        if(or__3824__auto____13529) {
          return or__3824__auto____13529
        }else {
          return cljs.core.dominates.call(null, k__13526, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__13528 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__13530), k__13526, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__13526), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__13530)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__13530
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__13531)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__13531));
      return cljs.core.second.call(null, best_entry__13531)
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
    var and__3822__auto____13536 = mf;
    if(and__3822__auto____13536) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____13536
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2418__auto____13537 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____13538 = cljs.core._reset[goog.typeOf(x__2418__auto____13537)];
      if(or__3824__auto____13538) {
        return or__3824__auto____13538
      }else {
        var or__3824__auto____13539 = cljs.core._reset["_"];
        if(or__3824__auto____13539) {
          return or__3824__auto____13539
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____13544 = mf;
    if(and__3822__auto____13544) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____13544
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2418__auto____13545 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____13546 = cljs.core._add_method[goog.typeOf(x__2418__auto____13545)];
      if(or__3824__auto____13546) {
        return or__3824__auto____13546
      }else {
        var or__3824__auto____13547 = cljs.core._add_method["_"];
        if(or__3824__auto____13547) {
          return or__3824__auto____13547
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____13552 = mf;
    if(and__3822__auto____13552) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____13552
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2418__auto____13553 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____13554 = cljs.core._remove_method[goog.typeOf(x__2418__auto____13553)];
      if(or__3824__auto____13554) {
        return or__3824__auto____13554
      }else {
        var or__3824__auto____13555 = cljs.core._remove_method["_"];
        if(or__3824__auto____13555) {
          return or__3824__auto____13555
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____13560 = mf;
    if(and__3822__auto____13560) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____13560
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2418__auto____13561 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____13562 = cljs.core._prefer_method[goog.typeOf(x__2418__auto____13561)];
      if(or__3824__auto____13562) {
        return or__3824__auto____13562
      }else {
        var or__3824__auto____13563 = cljs.core._prefer_method["_"];
        if(or__3824__auto____13563) {
          return or__3824__auto____13563
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____13568 = mf;
    if(and__3822__auto____13568) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____13568
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2418__auto____13569 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____13570 = cljs.core._get_method[goog.typeOf(x__2418__auto____13569)];
      if(or__3824__auto____13570) {
        return or__3824__auto____13570
      }else {
        var or__3824__auto____13571 = cljs.core._get_method["_"];
        if(or__3824__auto____13571) {
          return or__3824__auto____13571
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____13576 = mf;
    if(and__3822__auto____13576) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____13576
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2418__auto____13577 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____13578 = cljs.core._methods[goog.typeOf(x__2418__auto____13577)];
      if(or__3824__auto____13578) {
        return or__3824__auto____13578
      }else {
        var or__3824__auto____13579 = cljs.core._methods["_"];
        if(or__3824__auto____13579) {
          return or__3824__auto____13579
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____13584 = mf;
    if(and__3822__auto____13584) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____13584
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2418__auto____13585 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____13586 = cljs.core._prefers[goog.typeOf(x__2418__auto____13585)];
      if(or__3824__auto____13586) {
        return or__3824__auto____13586
      }else {
        var or__3824__auto____13587 = cljs.core._prefers["_"];
        if(or__3824__auto____13587) {
          return or__3824__auto____13587
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____13592 = mf;
    if(and__3822__auto____13592) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____13592
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2418__auto____13593 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____13594 = cljs.core._dispatch[goog.typeOf(x__2418__auto____13593)];
      if(or__3824__auto____13594) {
        return or__3824__auto____13594
      }else {
        var or__3824__auto____13595 = cljs.core._dispatch["_"];
        if(or__3824__auto____13595) {
          return or__3824__auto____13595
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__13598 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__13599 = cljs.core._get_method.call(null, mf, dispatch_val__13598);
  if(cljs.core.truth_(target_fn__13599)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__13598)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__13599, args)
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
  var this__13600 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__13601 = this;
  cljs.core.swap_BANG_.call(null, this__13601.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__13601.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__13601.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__13601.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__13602 = this;
  cljs.core.swap_BANG_.call(null, this__13602.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__13602.method_cache, this__13602.method_table, this__13602.cached_hierarchy, this__13602.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__13603 = this;
  cljs.core.swap_BANG_.call(null, this__13603.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__13603.method_cache, this__13603.method_table, this__13603.cached_hierarchy, this__13603.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__13604 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__13604.cached_hierarchy), cljs.core.deref.call(null, this__13604.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__13604.method_cache, this__13604.method_table, this__13604.cached_hierarchy, this__13604.hierarchy)
  }
  var temp__3971__auto____13605 = cljs.core.deref.call(null, this__13604.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____13605)) {
    var target_fn__13606 = temp__3971__auto____13605;
    return target_fn__13606
  }else {
    var temp__3971__auto____13607 = cljs.core.find_and_cache_best_method.call(null, this__13604.name, dispatch_val, this__13604.hierarchy, this__13604.method_table, this__13604.prefer_table, this__13604.method_cache, this__13604.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____13607)) {
      var target_fn__13608 = temp__3971__auto____13607;
      return target_fn__13608
    }else {
      return cljs.core.deref.call(null, this__13604.method_table).call(null, this__13604.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__13609 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__13609.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__13609.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__13609.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__13609.method_cache, this__13609.method_table, this__13609.cached_hierarchy, this__13609.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__13610 = this;
  return cljs.core.deref.call(null, this__13610.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__13611 = this;
  return cljs.core.deref.call(null, this__13611.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__13612 = this;
  return cljs.core.do_dispatch.call(null, mf, this__13612.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__13614__delegate = function(_, args) {
    var self__13613 = this;
    return cljs.core._dispatch.call(null, self__13613, args)
  };
  var G__13614 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__13614__delegate.call(this, _, args)
  };
  G__13614.cljs$lang$maxFixedArity = 1;
  G__13614.cljs$lang$applyTo = function(arglist__13615) {
    var _ = cljs.core.first(arglist__13615);
    var args = cljs.core.rest(arglist__13615);
    return G__13614__delegate(_, args)
  };
  G__13614.cljs$lang$arity$variadic = G__13614__delegate;
  return G__13614
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__13616 = this;
  return cljs.core._dispatch.call(null, self__13616, args)
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
  var this__13617 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_13619, _) {
  var this__13618 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__13618.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__13620 = this;
  var and__3822__auto____13621 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____13621) {
    return this__13620.uuid === other.uuid
  }else {
    return and__3822__auto____13621
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__13622 = this;
  var this__13623 = this;
  return cljs.core.pr_str.call(null, this__13623)
};
cljs.core.UUID;
goog.provide("sketchpad.core");
goog.require("cljs.core");
sketchpad.core.universe = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
sketchpad.core.Drawable = {};
sketchpad.core.draw = function draw(item, ctx) {
  if(function() {
    var and__3822__auto____78682 = item;
    if(and__3822__auto____78682) {
      return item.sketchpad$core$Drawable$draw$arity$2
    }else {
      return and__3822__auto____78682
    }
  }()) {
    return item.sketchpad$core$Drawable$draw$arity$2(item, ctx)
  }else {
    var x__2418__auto____78683 = item == null ? null : item;
    return function() {
      var or__3824__auto____78684 = sketchpad.core.draw[goog.typeOf(x__2418__auto____78683)];
      if(or__3824__auto____78684) {
        return or__3824__auto____78684
      }else {
        var or__3824__auto____78685 = sketchpad.core.draw["_"];
        if(or__3824__auto____78685) {
          return or__3824__auto____78685
        }else {
          throw cljs.core.missing_protocol.call(null, "Drawable.draw", item);
        }
      }
    }().call(null, item, ctx)
  }
};
sketchpad.core.Point = function(x, y, __meta, __extmap) {
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
sketchpad.core.Point.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2373__auto__) {
  var this__78689 = this;
  var h__2247__auto____78690 = this__78689.__hash;
  if(!(h__2247__auto____78690 == null)) {
    return h__2247__auto____78690
  }else {
    var h__2247__auto____78691 = cljs.core.hash_imap.call(null, this__2373__auto__);
    this__78689.__hash = h__2247__auto____78691;
    return h__2247__auto____78691
  }
};
sketchpad.core.Point.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2378__auto__, k__2379__auto__) {
  var this__78692 = this;
  return this__2378__auto__.cljs$core$ILookup$_lookup$arity$3(this__2378__auto__, k__2379__auto__, null)
};
sketchpad.core.Point.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2380__auto__, k78687, else__2381__auto__) {
  var this__78693 = this;
  if(k78687 === "\ufdd0'x") {
    return this__78693.x
  }else {
    if(k78687 === "\ufdd0'y") {
      return this__78693.y
    }else {
      if("\ufdd0'else") {
        return cljs.core._lookup.call(null, this__78693.__extmap, k78687, else__2381__auto__)
      }else {
        return null
      }
    }
  }
};
sketchpad.core.Point.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2385__auto__, k__2386__auto__, G__78686) {
  var this__78694 = this;
  var pred__78695__78698 = cljs.core.identical_QMARK_;
  var expr__78696__78699 = k__2386__auto__;
  if(pred__78695__78698.call(null, "\ufdd0'x", expr__78696__78699)) {
    return new sketchpad.core.Point(G__78686, this__78694.y, this__78694.__meta, this__78694.__extmap, null)
  }else {
    if(pred__78695__78698.call(null, "\ufdd0'y", expr__78696__78699)) {
      return new sketchpad.core.Point(this__78694.x, G__78686, this__78694.__meta, this__78694.__extmap, null)
    }else {
      return new sketchpad.core.Point(this__78694.x, this__78694.y, this__78694.__meta, cljs.core.assoc.call(null, this__78694.__extmap, k__2386__auto__, G__78686), null)
    }
  }
};
sketchpad.core.Point.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2383__auto__, entry__2384__auto__) {
  var this__78700 = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2384__auto__)) {
    return this__2383__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2383__auto__, cljs.core._nth.call(null, entry__2384__auto__, 0), cljs.core._nth.call(null, entry__2384__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2383__auto__, entry__2384__auto__)
  }
};
sketchpad.core.Point.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2390__auto__) {
  var this__78701 = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'x", this__78701.x), cljs.core.vector.call(null, "\ufdd0'y", this__78701.y)], true), this__78701.__extmap))
};
sketchpad.core.Point.prototype.sketchpad$core$Drawable$ = true;
sketchpad.core.Point.prototype.sketchpad$core$Drawable$draw$arity$2 = function(point, ctx) {
  var this__78702 = this;
  return sketchpad.core.drawCircle.call(null, ctx, cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y", "\ufdd0'r"], {"\ufdd0'x":this__78702.x, "\ufdd0'y":this__78702.y, "\ufdd0'r":2}))
};
sketchpad.core.Point.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(this__2392__auto__, opts__2393__auto__) {
  var this__78703 = this;
  var pr_pair__2394__auto____78704 = function(keyval__2395__auto__) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts__2393__auto__, keyval__2395__auto__)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__2394__auto____78704, [cljs.core.str("#"), cljs.core.str("Point"), cljs.core.str("{")].join(""), ", ", "}", opts__2393__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'x", this__78703.x), cljs.core.vector.call(null, "\ufdd0'y", this__78703.y)], true), this__78703.__extmap))
};
sketchpad.core.Point.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2382__auto__) {
  var this__78705 = this;
  return 2 + cljs.core.count.call(null, this__78705.__extmap)
};
sketchpad.core.Point.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2374__auto__, other__2375__auto__) {
  var this__78706 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____78707 = other__2375__auto__;
    if(cljs.core.truth_(and__3822__auto____78707)) {
      var and__3822__auto____78708 = this__2374__auto__.constructor === other__2375__auto__.constructor;
      if(and__3822__auto____78708) {
        return cljs.core.equiv_map.call(null, this__2374__auto__, other__2375__auto__)
      }else {
        return and__3822__auto____78708
      }
    }else {
      return and__3822__auto____78707
    }
  }())) {
    return true
  }else {
    return false
  }
};
sketchpad.core.Point.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2377__auto__, G__78686) {
  var this__78709 = this;
  return new sketchpad.core.Point(this__78709.x, this__78709.y, G__78686, this__78709.__extmap, this__78709.__hash)
};
sketchpad.core.Point.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2376__auto__) {
  var this__78710 = this;
  return this__78710.__meta
};
sketchpad.core.Point.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2387__auto__, k__2388__auto__) {
  var this__78711 = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'y", "\ufdd0'x"]), k__2388__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2387__auto__), this__78711.__meta), k__2388__auto__)
  }else {
    return new sketchpad.core.Point(this__78711.x, this__78711.y, this__78711.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, this__78711.__extmap, k__2388__auto__)), null)
  }
};
sketchpad.core.Point.cljs$lang$type = true;
sketchpad.core.Point.cljs$lang$ctorPrSeq = function(this__2412__auto__) {
  return cljs.core.list.call(null, "sketchpad.core/Point")
};
sketchpad.core.__GT_Point = function __GT_Point(x, y) {
  return new sketchpad.core.Point(x, y)
};
sketchpad.core.map__GT_Point = function map__GT_Point(G__78688) {
  return new sketchpad.core.Point((new cljs.core.Keyword("\ufdd0'x")).call(null, G__78688), (new cljs.core.Keyword("\ufdd0'y")).call(null, G__78688), null, cljs.core.dissoc.call(null, G__78688, "\ufdd0'x", "\ufdd0'y"))
};
sketchpad.core.Point;
sketchpad.core.Line = function(p1, p2, __meta, __extmap) {
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
sketchpad.core.Line.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2373__auto__) {
  var this__78715 = this;
  var h__2247__auto____78716 = this__78715.__hash;
  if(!(h__2247__auto____78716 == null)) {
    return h__2247__auto____78716
  }else {
    var h__2247__auto____78717 = cljs.core.hash_imap.call(null, this__2373__auto__);
    this__78715.__hash = h__2247__auto____78717;
    return h__2247__auto____78717
  }
};
sketchpad.core.Line.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2378__auto__, k__2379__auto__) {
  var this__78718 = this;
  return this__2378__auto__.cljs$core$ILookup$_lookup$arity$3(this__2378__auto__, k__2379__auto__, null)
};
sketchpad.core.Line.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2380__auto__, k78713, else__2381__auto__) {
  var this__78719 = this;
  if(k78713 === "\ufdd0'p1") {
    return this__78719.p1
  }else {
    if(k78713 === "\ufdd0'p2") {
      return this__78719.p2
    }else {
      if("\ufdd0'else") {
        return cljs.core._lookup.call(null, this__78719.__extmap, k78713, else__2381__auto__)
      }else {
        return null
      }
    }
  }
};
sketchpad.core.Line.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2385__auto__, k__2386__auto__, G__78712) {
  var this__78720 = this;
  var pred__78721__78724 = cljs.core.identical_QMARK_;
  var expr__78722__78725 = k__2386__auto__;
  if(pred__78721__78724.call(null, "\ufdd0'p1", expr__78722__78725)) {
    return new sketchpad.core.Line(G__78712, this__78720.p2, this__78720.__meta, this__78720.__extmap, null)
  }else {
    if(pred__78721__78724.call(null, "\ufdd0'p2", expr__78722__78725)) {
      return new sketchpad.core.Line(this__78720.p1, G__78712, this__78720.__meta, this__78720.__extmap, null)
    }else {
      return new sketchpad.core.Line(this__78720.p1, this__78720.p2, this__78720.__meta, cljs.core.assoc.call(null, this__78720.__extmap, k__2386__auto__, G__78712), null)
    }
  }
};
sketchpad.core.Line.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2383__auto__, entry__2384__auto__) {
  var this__78726 = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2384__auto__)) {
    return this__2383__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2383__auto__, cljs.core._nth.call(null, entry__2384__auto__, 0), cljs.core._nth.call(null, entry__2384__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2383__auto__, entry__2384__auto__)
  }
};
sketchpad.core.Line.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2390__auto__) {
  var this__78727 = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'p1", this__78727.p1), cljs.core.vector.call(null, "\ufdd0'p2", this__78727.p2)], true), this__78727.__extmap))
};
sketchpad.core.Line.prototype.sketchpad$core$Drawable$ = true;
sketchpad.core.Line.prototype.sketchpad$core$Drawable$draw$arity$2 = function(line, ctx) {
  var this__78728 = this;
  var map__78729__78731 = cljs.core.deref.call(null, sketchpad.core.universe).call(null, this__78728.p1);
  var map__78729__78732 = cljs.core.seq_QMARK_.call(null, map__78729__78731) ? cljs.core.apply.call(null, cljs.core.hash_map, map__78729__78731) : map__78729__78731;
  var x1__78733 = cljs.core._lookup.call(null, map__78729__78732, "\ufdd0'x", null);
  var y1__78734 = cljs.core._lookup.call(null, map__78729__78732, "\ufdd0'y", null);
  var map__78730__78735 = cljs.core.deref.call(null, sketchpad.core.universe).call(null, this__78728.p2);
  var map__78730__78736 = cljs.core.seq_QMARK_.call(null, map__78730__78735) ? cljs.core.apply.call(null, cljs.core.hash_map, map__78730__78735) : map__78730__78735;
  var x2__78737 = cljs.core._lookup.call(null, map__78730__78736, "\ufdd0'x", null);
  var y2__78738 = cljs.core._lookup.call(null, map__78730__78736, "\ufdd0'y", null);
  return sketchpad.core.drawLine.call(null, ctx, cljs.core.ObjMap.fromObject(["\ufdd0'x1", "\ufdd0'x2", "\ufdd0'y1", "\ufdd0'y2"], {"\ufdd0'x1":x1__78733, "\ufdd0'x2":x2__78737, "\ufdd0'y1":y1__78734, "\ufdd0'y2":y2__78738}))
};
sketchpad.core.Line.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(this__2392__auto__, opts__2393__auto__) {
  var this__78739 = this;
  var pr_pair__2394__auto____78740 = function(keyval__2395__auto__) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts__2393__auto__, keyval__2395__auto__)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__2394__auto____78740, [cljs.core.str("#"), cljs.core.str("Line"), cljs.core.str("{")].join(""), ", ", "}", opts__2393__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'p1", this__78739.p1), cljs.core.vector.call(null, "\ufdd0'p2", this__78739.p2)], true), this__78739.__extmap))
};
sketchpad.core.Line.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2382__auto__) {
  var this__78741 = this;
  return 2 + cljs.core.count.call(null, this__78741.__extmap)
};
sketchpad.core.Line.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2374__auto__, other__2375__auto__) {
  var this__78742 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____78743 = other__2375__auto__;
    if(cljs.core.truth_(and__3822__auto____78743)) {
      var and__3822__auto____78744 = this__2374__auto__.constructor === other__2375__auto__.constructor;
      if(and__3822__auto____78744) {
        return cljs.core.equiv_map.call(null, this__2374__auto__, other__2375__auto__)
      }else {
        return and__3822__auto____78744
      }
    }else {
      return and__3822__auto____78743
    }
  }())) {
    return true
  }else {
    return false
  }
};
sketchpad.core.Line.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2377__auto__, G__78712) {
  var this__78745 = this;
  return new sketchpad.core.Line(this__78745.p1, this__78745.p2, G__78712, this__78745.__extmap, this__78745.__hash)
};
sketchpad.core.Line.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2376__auto__) {
  var this__78746 = this;
  return this__78746.__meta
};
sketchpad.core.Line.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2387__auto__, k__2388__auto__) {
  var this__78747 = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'p1", "\ufdd0'p2"]), k__2388__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2387__auto__), this__78747.__meta), k__2388__auto__)
  }else {
    return new sketchpad.core.Line(this__78747.p1, this__78747.p2, this__78747.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, this__78747.__extmap, k__2388__auto__)), null)
  }
};
sketchpad.core.Line.cljs$lang$type = true;
sketchpad.core.Line.cljs$lang$ctorPrSeq = function(this__2412__auto__) {
  return cljs.core.list.call(null, "sketchpad.core/Line")
};
sketchpad.core.__GT_Line = function __GT_Line(p1, p2) {
  return new sketchpad.core.Line(p1, p2)
};
sketchpad.core.map__GT_Line = function map__GT_Line(G__78714) {
  return new sketchpad.core.Line((new cljs.core.Keyword("\ufdd0'p1")).call(null, G__78714), (new cljs.core.Keyword("\ufdd0'p2")).call(null, G__78714), null, cljs.core.dissoc.call(null, G__78714, "\ufdd0'p1", "\ufdd0'p2"))
};
sketchpad.core.Line;
sketchpad.core.drawLine = function drawLine(context, p__78748) {
  var map__78756__78757 = p__78748;
  var map__78756__78758 = cljs.core.seq_QMARK_.call(null, map__78756__78757) ? cljs.core.apply.call(null, cljs.core.hash_map, map__78756__78757) : map__78756__78757;
  var x1__78759 = cljs.core._lookup.call(null, map__78756__78758, "\ufdd0'x1", null);
  var y1__78760 = cljs.core._lookup.call(null, map__78756__78758, "\ufdd0'y1", null);
  var x2__78761 = cljs.core._lookup.call(null, map__78756__78758, "\ufdd0'x2", null);
  var y2__78762 = cljs.core._lookup.call(null, map__78756__78758, "\ufdd0'y2", null);
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = "#999";
  context.moveTo(x1__78759, y1__78760);
  context.lineTo(x2__78761, y2__78762);
  return context.stroke()
};
sketchpad.core.drawCircle = function drawCircle(context, p__78763) {
  var map__78770__78771 = p__78763;
  var map__78770__78772 = cljs.core.seq_QMARK_.call(null, map__78770__78771) ? cljs.core.apply.call(null, cljs.core.hash_map, map__78770__78771) : map__78770__78771;
  var x__78773 = cljs.core._lookup.call(null, map__78770__78772, "\ufdd0'x", null);
  var y__78774 = cljs.core._lookup.call(null, map__78770__78772, "\ufdd0'y", null);
  var r__78775 = cljs.core._lookup.call(null, map__78770__78772, "\ufdd0'r", null);
  context.beginPath();
  context.arc(x__78773, y__78774, r__78775, 0, 2 * Math.PI, false);
  context.fillStyle = "green";
  context.fill();
  context.lineWidth = 1;
  context.strokeStyle = "black";
  return context.stroke()
};
sketchpad.core.main = function main() {
  var canvas__78781 = document.getElementById("canvas");
  var context__78782 = canvas__78781.getContext("2d");
  var p1__78783 = new sketchpad.core.Point(10, 20);
  var p2__78784 = new sketchpad.core.Point(30, 30);
  var l1__78785 = new sketchpad.core.Line("\ufdd0'p1", "\ufdd0'p2");
  cljs.core.swap_BANG_.call(null, sketchpad.core.universe, cljs.core.conj, cljs.core.ObjMap.fromObject(["\ufdd0'p1", "\ufdd0'p2", "\ufdd0'l1"], {"\ufdd0'p1":p1__78783, "\ufdd0'p2":p2__78784, "\ufdd0'l1":l1__78785}));
  sketchpad.core.draw.call(null, p1__78783, context__78782);
  sketchpad.core.draw.call(null, p2__78784, context__78782);
  return sketchpad.core.draw.call(null, l1__78785, context__78782)
};
goog.exportSymbol("sketchpad.core.main", sketchpad.core.main);
