"use strict";

var _ = require('underscore');

var NUMBER = 1,
    STRING = 2;

function Typer(fields) {
    var _fields = [];

    _.mapObject(fields, function(value, key) {
        if (typeof value == 'number')
            _fields.push({
                key: key,
                type: value,
                default: null
            });
        else
            _fields.push({
                key: key,
                type: value.type,
                default: value.default
            });
    });

    return function(obj) {
        var out = {};
        _.each(_fields, function(row) {
            var value = obj[row.key];
            if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value)) {
                if (row.default)
                    out[row.key] = row.default;
            } else {
                if (row.type == NUMBER)
                    out[row.key] = Number(value);
                else if (row.type == STRING)
                    out[row.key] = '' + value;
                else
                    out[row.key] = value;
            }
        });
        _.mapObject(obj, function(value, key) {
            if (!_.has(out, key))
                out[key] = value;
        });
        return out;
    };
}


module.exports.NUMBER = NUMBER;
module.exports.STRING = STRING;
module.exports.rebuild = Typer;
