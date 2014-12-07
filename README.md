This tool is created for managing long regular expression that can be separated to several parts.

## Usage

http://rawgit.com/vilic/regex-combiner/master/combiner.html

Write muliple regular expressions line by line. This tool will automatically handle back reference index. E.g.:

    (abc)
    (["'])...\1

\1 above will be changed to \2 and result in a combined regular expression /(abc)|(["'])...\2/.

You may also use named group, e.g.:

    ($quote:["'])...($quote)

will be converted to /(["'])...\1/.