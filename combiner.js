/**
 * JavaScript RegExp Combiner
 * https://github.com/vilic/regex-combiner
 *
 * by VILIC VANE
 * MIT License
 */
var RegexCombiner;
(function (RegexCombiner) {
    var hop = Object.prototype.hasOwnProperty;
    var groupRegex = /\(\$(\w[\w\d]*(?:-[\w\d]+)*)(?:(:)(?!\?)|\))|(\(\?)|(\()|(\))|(\|)|(\[)|(\])|\\(\d)|\\.|./g;
    function combine(regexStrs, separator) {
        if (separator === void 0) { separator = '|'; }
        var groupCount = 0;
        var partialRegexStrs = [];
        var groupNameToIndex = {};
        regexStrs.forEach(function (regexStr, regexIndex) {
            regexIndex += 1;
            try {
                new RegExp(regexStr);
            }
            catch (e) {
                e.message = e.message.replace(/^.+:\s?/, '') + ' in regex #' + regexIndex;
                throw e;
            }
            // abc($name:) ($name)
            var partialGroupCount = 0;
            var sBraOpen = false;
            var bracketDepth = 0;
            var hasOrOutside = false;
            var partialRegexStr = regexStr.replace(groupRegex, function (match, groupName, groupNameColon, braWithQ, bra, ket, or, sBra, sKet, brNumber) {
                if (groupName) {
                    if (sBraOpen) {
                        throw new Error('Group name can not be in a characer class in regex #' + regexIndex);
                    }
                    if (groupNameColon) {
                        bracketDepth++;
                        partialGroupCount++;
                        groupNameToIndex[groupName] = groupCount + partialGroupCount;
                        return '(';
                    }
                    else if (hop.call(groupNameToIndex, groupName)) {
                        var index = groupNameToIndex[groupName];
                        if (index < 10) {
                            return '\\' + index;
                        }
                        else {
                            throw new Error('Back reference index (' + groupName + ':' + index + ') in regex #' + regexIndex + ' exceeds limit');
                        }
                    }
                    else {
                        throw new Error('Undefined group name "' + groupName + '" in regex #' + regexIndex);
                    }
                }
                if (braWithQ) {
                    if (!sBraOpen) {
                        bracketDepth++;
                    }
                    return match;
                }
                if (bra) {
                    if (!sBraOpen) {
                        bracketDepth++;
                        partialGroupCount++;
                    }
                    return match;
                }
                if (ket) {
                    if (!sBraOpen) {
                        bracketDepth--;
                    }
                    return match;
                }
                if (or) {
                    if (!hasOrOutside && !sBraOpen && bracketDepth == 0) {
                        hasOrOutside = true;
                    }
                    return match;
                }
                if (sBra) {
                    if (!sBraOpen) {
                        sBraOpen = true;
                    }
                    return match;
                }
                if (sKet) {
                    if (sBraOpen) {
                        sBraOpen = false;
                    }
                    return match;
                }
                if (brNumber) {
                    var index = Number(brNumber);
                    index += groupCount;
                    if (index < 10) {
                        return '\\' + index;
                    }
                    else {
                        throw new Error('Back reference index (' + brNumber + '->' + index + ') in regex #' + regexIndex + ' exceeds limit');
                    }
                }
                return match;
            });
            groupCount += partialGroupCount;
            partialRegexStrs.push(hasOrOutside ? '(?:' + partialRegexStr + ')' : partialRegexStr);
        });
        var combined = partialRegexStrs.join(separator) || '(?:)';
        var string = JSON.stringify(combined);
        var literal = '/' + combined.replace(/\\.|(\/)/g, function (m, g1) { return g1 ? '\\/' : m; }) + '/';
        var groups = [];
        for (var i = 0; i < groupCount; i++) {
            groups.push('g' + (i + 1));
        }
        var groupNames = Object.keys(groupNameToIndex);
        groupNames.forEach(function (name) { return groups[groupNameToIndex[name] - 1] = name.replace(/-([a-z])/ig, function (m, g1) { return g1.toUpperCase(); }); });
        var fnParams = groups.length ? '(m, ' + groups.join(', ') + ')' : '(m)';
        var tFnParams = groups.length ? '(m, ' + groups.map(function (name) { return name + ': <b>string</b>'; }).join(', ') + ')' : '(m)';
        var arrayAlias = groups.map(function (name, index) { return '<b>var</b> ' + name + ' = groups[' + (index + 1) + '];'; }).join('\n');
        return {
            string: string,
            literal: literal,
            fnParams: fnParams,
            tFnParams: tFnParams,
            arrayAlias: arrayAlias
        };
    }
    RegexCombiner.combine = combine;
})(RegexCombiner || (RegexCombiner = {}));
