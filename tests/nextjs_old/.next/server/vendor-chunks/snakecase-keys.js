"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/snakecase-keys";
exports.ids = ["vendor-chunks/snakecase-keys"];
exports.modules = {

/***/ "(rsc)/./node_modules/snakecase-keys/index.js":
/*!**********************************************!*\
  !*** ./node_modules/snakecase-keys/index.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nconst map = __webpack_require__(/*! map-obj */ \"(rsc)/./node_modules/map-obj/index.js\")\nconst { snakeCase } = __webpack_require__(/*! snake-case */ \"(rsc)/./node_modules/snake-case/dist.es2015/index.js\")\n\nconst PlainObjectConstructor = {}.constructor\n\nmodule.exports = function (obj, options) {\n  if (Array.isArray(obj)) {\n    if (obj.some(item => item.constructor !== PlainObjectConstructor)) {\n      throw new Error('obj must be array of plain objects')\n    }\n  } else {\n    if (obj.constructor !== PlainObjectConstructor) {\n      throw new Error('obj must be an plain object')\n    }\n  }\n\n  options = Object.assign({ deep: true, exclude: [], parsingOptions: {} }, options)\n\n  return map(obj, function (key, val) {\n    return [\n      matches(options.exclude, key) ? key : snakeCase(key, options.parsingOptions),\n      val,\n      mapperOptions(key, val, options)\n    ]\n  }, options)\n}\n\nfunction matches (patterns, value) {\n  return patterns.some(function (pattern) {\n    return typeof pattern === 'string'\n      ? pattern === value\n      : pattern.test(value)\n  })\n}\n\nfunction mapperOptions (key, val, options) {\n  return options.shouldRecurse\n    ? { shouldRecurse: options.shouldRecurse(key, val) }\n    : undefined\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvc25ha2VjYXNlLWtleXMvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQVk7O0FBRVosWUFBWSxtQkFBTyxDQUFDLHNEQUFTO0FBQzdCLFFBQVEsWUFBWSxFQUFFLG1CQUFPLENBQUMsd0VBQVk7O0FBRTFDLGlDQUFpQzs7QUFFakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTs7QUFFQSw0QkFBNEIsNkNBQTZDOztBQUV6RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0EiLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb2hueWVvY3gvQXV0dW1uL2F1dHVtbi1qcy90ZXN0cy9uZXh0anMvbm9kZV9tb2R1bGVzL3NuYWtlY2FzZS1rZXlzL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBtYXAgPSByZXF1aXJlKCdtYXAtb2JqJylcbmNvbnN0IHsgc25ha2VDYXNlIH0gPSByZXF1aXJlKCdzbmFrZS1jYXNlJylcblxuY29uc3QgUGxhaW5PYmplY3RDb25zdHJ1Y3RvciA9IHt9LmNvbnN0cnVjdG9yXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaiwgb3B0aW9ucykge1xuICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgaWYgKG9iai5zb21lKGl0ZW0gPT4gaXRlbS5jb25zdHJ1Y3RvciAhPT0gUGxhaW5PYmplY3RDb25zdHJ1Y3RvcikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignb2JqIG11c3QgYmUgYXJyYXkgb2YgcGxhaW4gb2JqZWN0cycpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChvYmouY29uc3RydWN0b3IgIT09IFBsYWluT2JqZWN0Q29uc3RydWN0b3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignb2JqIG11c3QgYmUgYW4gcGxhaW4gb2JqZWN0JylcbiAgICB9XG4gIH1cblxuICBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7IGRlZXA6IHRydWUsIGV4Y2x1ZGU6IFtdLCBwYXJzaW5nT3B0aW9uczoge30gfSwgb3B0aW9ucylcblxuICByZXR1cm4gbWFwKG9iaiwgZnVuY3Rpb24gKGtleSwgdmFsKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIG1hdGNoZXMob3B0aW9ucy5leGNsdWRlLCBrZXkpID8ga2V5IDogc25ha2VDYXNlKGtleSwgb3B0aW9ucy5wYXJzaW5nT3B0aW9ucyksXG4gICAgICB2YWwsXG4gICAgICBtYXBwZXJPcHRpb25zKGtleSwgdmFsLCBvcHRpb25zKVxuICAgIF1cbiAgfSwgb3B0aW9ucylcbn1cblxuZnVuY3Rpb24gbWF0Y2hlcyAocGF0dGVybnMsIHZhbHVlKSB7XG4gIHJldHVybiBwYXR0ZXJucy5zb21lKGZ1bmN0aW9uIChwYXR0ZXJuKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBwYXR0ZXJuID09PSAnc3RyaW5nJ1xuICAgICAgPyBwYXR0ZXJuID09PSB2YWx1ZVxuICAgICAgOiBwYXR0ZXJuLnRlc3QodmFsdWUpXG4gIH0pXG59XG5cbmZ1bmN0aW9uIG1hcHBlck9wdGlvbnMgKGtleSwgdmFsLCBvcHRpb25zKSB7XG4gIHJldHVybiBvcHRpb25zLnNob3VsZFJlY3Vyc2VcbiAgICA/IHsgc2hvdWxkUmVjdXJzZTogb3B0aW9ucy5zaG91bGRSZWN1cnNlKGtleSwgdmFsKSB9XG4gICAgOiB1bmRlZmluZWRcbn1cbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/snakecase-keys/index.js\n");

/***/ })

};
;