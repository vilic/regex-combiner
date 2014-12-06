/**
 * JavaScript RegExp Combiner
 * https://github.com/vilic/regex-combiner
 *
 * by VILIC VANE
 * MIT License
 */

module RegexCombiner { 
    var hop = Object.prototype.hasOwnProperty;

    interface ICombineResult { 
        string: string;
        literal: string;
        fnParams: string;
        tFnParams: string;
        arrayAlias: string;
    }

    var groupRegex = /\(\$(\w[\w\d]*(?:-[\w\d]+)*)(?:(:)(?!\?)|\))|(\(\?)|(\()|(\))|(\|)|(\[)|(\])|\\(\d)|\\.|./g;

    export function combine(regexStrs: string[], separator = '|'): ICombineResult { 
        var groupCount = 0;
        var partialRegexStrs: string[] = [];

        var groupNameToIndex: {
            [key: string]: number;
        } = {};

        regexStrs.forEach((regexStr, regexIndex) => {
            regexIndex += 1;

            // syntax test
            try {
                new RegExp(regexStr);
            } catch (e) {
                e.message = e.message.replace(/^.+:\s?/, '') + ' in regex #' + regexIndex;
                throw e;
            }

            // abc($name:) ($name)
            var partialGroupCount = 0;

            var sBraOpen = false;
            var bracketDepth = 0;
            var hasOrOutside = false;

            var partialRegexStr = regexStr.replace(
                groupRegex, 
                (
                    match,
                    groupName: string,
                    groupNameColon: string,
                    braWithQ: string,
                    bra: string,
                    ket: string,
                    or: string,
                    sBra: string,
                    sKet: string,
                    brNumber: string
                    ) => { 

                    if (groupName) { 
                        if (sBraOpen) { 
                            throw new Error('Group name can not be in a characer class in regex #' + regexIndex);
                        }

                        if (groupNameColon) {
                            bracketDepth++;
                            partialGroupCount++;
                            groupNameToIndex[groupName] = groupCount + partialGroupCount;
                            return '(';
                        } else if (hop.call(groupNameToIndex, groupName)) {
                            var index = groupNameToIndex[groupName];

                            if (index < 10) {
                                return '\\' + index;
                            } else {
                                throw new Error('Back reference index (' + groupName + ':' + index + ') in regex #' + regexIndex + ' exceeds limit');
                            }
                        } else { 
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
                        } else { 
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
        var literal = '/' + combined.replace(/\\.|(\/)/g, (m, g1) => g1 ? '\\/' : m) + '/';

        var groups: string[] = [];

        for (var i = 0; i < groupCount; i++) { 
            groups.push('g' + (i + 1));
        }

        var groupNames = Object.keys(groupNameToIndex);
        groupNames.forEach(name => groups[groupNameToIndex[name] - 1] = name.replace(/-([a-z])/ig, (m, g1: string) => g1.toUpperCase()));

        var fnParams = groups.length ? '(m, ' + groups.join(', ') + ')' : '(m)';
        var tFnParams = groups.length ? '(m, ' + groups.map(name => name + ': <b>string</b>').join(', ') + ')' : '(m)';

        var arrayAlias = groups
            .map((name, index) => '<b>var</b> ' + name + ' = groups[' + (index + 1) + '];')
            .join('\n');

        return {
            string: string,
            literal: literal,
            fnParams: fnParams,
            tFnParams: tFnParams,
            arrayAlias: arrayAlias
        };
    }

}