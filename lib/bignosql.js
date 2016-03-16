"use strict";

var type = require('./type');

function Query(query, executor) {
    var _query = query;
    var _fields = null;
    var _sort = null;
    var _offset = -1;
    var _limit = -1;

    this.select = function(fields) {
        _fields = fields;
        return this;
    };
    this.sort = function(fields) {
        _sort = fields;
        return this;
    };
    this.skip = function(count) {
        _offset = count;
        return this;
    };
    this.limit = function(count) {
        _limit = count;
        return this;
    };

    this.exec = function(callback) {
        executor.find(_query, _fields, _sort, _offset, _limit, callback);
    };
}

function Model(executor) {
    this.find = function(query, fields, callback) {
        if (typeof fields == 'function') {
            callback = fields;
            fields = null;
        }
        var q = new Query(query, executor);
        if (fields)
            q.select(fields);
        if (callback)
            q.exec(callback);
        else
            return q;
    };
    this.insert = function(fields, options, callback) {
        if (typeof options == 'function') {
            callback = options;
            options = null;
        }
        executor.insert(fields, options || {}, callback);
    };
    this.update = function(query, fields, options, callback) {
        if (typeof options == 'function') {
            callback = options;
            options = null;
        }
        executor.update(query, fields, options || {}, callback);
    };
    this.remove = function(query, callback) {
        executor.remove(query, callback);
    };
}

function SQLProxy(driver, params) {
    var client = new driver(params);

    this.model = function(table, fields) {
        return new Model(client.table(table, type.rebuild(fields)));
    };
}

Object.keys(type).forEach(function(key) {
    if (key == key.toUpperCase())
        module.exports[key] = type[key];
});
module.exports.connect = function(type, params) {
    if (type == 'pgsql')
        return new SQLProxy(require('./proxy-pgsql'), params);
    else if (type == 'mysql')
        return new SQLProxy(require('./proxy-mysql'), params);
    else
        throw new TypeError('Unsupport database type: ' + type);
};
