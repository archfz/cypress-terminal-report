// From https://github.com/Canop/JSON.prune/blob/master/JSON.prune.js

var DEFAULT_MAX_DEPTH = 6;
var DEFAULT_ARRAY_MAX_LENGTH = 50;
var DEFAULT_PRUNED_VALUE = '"[DepthPruned]"';
var DEFAULT_CIRCULAR_VALUE = '"[Circular]"';
var seen: any; // Same variable used for all stringifications
var iterator: any; // either forEachEnumerableOwnProperty, forEachEnumerableProperty or forEachProperty

// iterates on enumerable own properties (default behavior)
var forEachEnumerableOwnProperty = function (obj: any, callback: any) {
  for (var k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) callback(k);
  }
};
// iterates on enumerable properties
var forEachEnumerableProperty = function (obj: any, callback: any) {
  for (var k in obj) callback(k);
};
// iterates on properties, even non enumerable and inherited ones
// This is dangerous
var forEachProperty = function (obj: any, callback: any, excluded: any) {
  if (obj == null) return;
  excluded = excluded || {};
  Object.getOwnPropertyNames(obj).forEach(function (k) {
    if (!excluded[k]) {
      callback(k);
      excluded[k] = true;
    }
  });
  forEachProperty(Object.getPrototypeOf(obj), callback, excluded);
};

Object.defineProperty(Date.prototype, 'toPrunedJSON', {value: Date.prototype.toJSON});

var cx =
    /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
  escapable =
    /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
  meta = {
    // table of character substitutions
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
    '\\': '\\\\',
  };

function quote(string: any) {
  escapable.lastIndex = 0;
  return escapable.test(string)
    ? '"' +
        string.replace(escapable, function (a: any) {
          // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          var c = meta[a];
          return typeof c === 'string'
            ? c
            : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) +
        '"'
    : '"' + string + '"';
}

const jsonPrune = function (value: any, depthDecr: any, arrayMaxLength: any) {
  var prunedString = DEFAULT_PRUNED_VALUE;
  var replacer: any;
  if (typeof depthDecr == 'object') {
    var options = depthDecr;
    depthDecr = options.depthDecr;
    arrayMaxLength = options.arrayMaxLength;
    iterator = options.iterator || forEachEnumerableOwnProperty;
    if (options.allProperties) iterator = forEachProperty;
    else if (options.inheritedProperties) iterator = forEachEnumerableProperty;
    if ('prunedString' in options) {
      prunedString = options.prunedString;
    }
    if (options.replacer) {
      replacer = options.replacer;
    }
  } else {
    iterator = forEachEnumerableOwnProperty;
  }
  seen = [];
  depthDecr = depthDecr || DEFAULT_MAX_DEPTH;
  arrayMaxLength = arrayMaxLength || DEFAULT_ARRAY_MAX_LENGTH;
  function str(key: any, holder: any, depthDecr: any) {
    var i,
      k,
      v,
      length,
      partial: any,
      value = holder[key];

    if (value && typeof value === 'object' && typeof value.toPrunedJSON === 'function') {
      value = value.toPrunedJSON(key);
    }
    if (value && typeof value.toJSON === 'function') {
      value = value.toJSON();
    }

    switch (typeof value) {
      case 'string':
        return quote(value);
      case 'number':
        return isFinite(value) ? String(value) : 'null';
      case 'boolean':
      // @ts-expect-error TS(2678): Type '"null"' is not comparable to type '"string" ... Remove this comment to see the full error message
      case 'null':
        return String(value);
      case 'object':
        if (!value) {
          return 'null';
        }
        if (depthDecr <= 0 || seen.indexOf(value) !== -1) {
          if (replacer) {
            var replacement = replacer(value, prunedString, true);
            return replacement === undefined ? undefined : '' + replacement;
          }
          return depthDecr <= 0 ? prunedString : DEFAULT_CIRCULAR_VALUE;
        }
        seen.push(value);
        partial = [];
        if (Object.prototype.toString.apply(value) === '[object Array]') {
          length = Math.min(value.length, arrayMaxLength);
          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value, depthDecr - 1) || 'null';
          }
          v = '[' + partial.join(',') + ']';
          if (replacer && value.length > arrayMaxLength) return replacer(value, v, false);
          return v;
        }
        if (value instanceof RegExp) {
          return quote(value.toString());
        }
        iterator(value, function (k: any) {
          try {
            v = str(k, value, depthDecr - 1);
            if (v) partial.push(quote(k) + ':' + v);
          } catch (e) {
            // this try/catch due to forbidden accessors on some objects
          }
        });
        return '{' + partial.join(',') + '}';
      case 'function':
      case 'undefined':
        return replacer ? replacer(value, undefined, false) : undefined;
    }
  }
  return str('', {'': value}, depthDecr);
};

export default jsonPrune;
