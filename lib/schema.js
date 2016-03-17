"use strict";

var _ = require('underscore');

var ANY = 0,
    NUMBER = 1,
    STRING = 2;

function isBadValue(value) {
    return _.isUndefined(value) || _.isNull(value) || _.isNaN(value);
}

function Schema(fields) {
    var _fields = [];

    _.mapObject(fields, function(value, key) {
        if (typeof value == 'number')
            _fields.push({
                key: key,
                type: value,
                default: null
            });
        else if (isBadValue(value))
            _fields.push({
                key: key,
                type: ANY,
                default: null
            });
        else
            _fields.push({
                key: key,
                type: value.type,
                default: value.default
            });
    });

    this.rebuild = function(obj) {
        var out = {};
        _.each(_fields, function(row) {
            var value = obj[row.key];
            if (isBadValue(value)) {
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


module.exports.Types = {
    Any: ANY,
    Number: NUMBER,
    String: STRING
};
module.exports.Schema = Schema;
