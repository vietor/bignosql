"use strict";

var util = require('util');
var mysql = require('mysql');
var _ = require('underscore');

function Executor(table, rebuild, execute) {

    function parseWhere(query, parameters) {
        var wheres = [];
        _.mapObject(query, function(value, key) {
            if (typeof value != 'object') {
                wheres.push(key + '=?');
                parameters.push(value);
            } else {
                _.mapObject(value, function(v, k) {
                    if (k == '$eq') {
                        wheres.push(key + '=?');
                        parameters.push(v);
                    } else if (k == '$ne') {
                        wheres.push(key + '!=?');
                        parameters.push(v);
                    } else if (k == '$lte') {
                        wheres.push(key + '<=?');
                        parameters.push(v);
                    } else if (k == '$lt') {
                        wheres.push(key + '<?');
                        parameters.push(v);
                    } else if (k == '$gte') {
                        wheres.push(key + '>=?');
                        parameters.push(v);
                    } else if (k == '$gt') {
                        wheres.push(key + '>?');
                        parameters.push(v);
                    } else if (k == '$in' || k == '$nin') {
                        var idxs = [];
                        _.each(v, function(o) {
                            parameters.push(o);
                            idxs.push('?');
                        });
                        wheres.push(key + (k == '$in' ? ' IN ' : ' NOT IN ') + '(' + idxs.join(',') + ')');
                    }
                });
            }
        });
        return wheres.length < 1 ? '' : ' WHERE ' + wheres.join(' AND ');
    }

    this.find = function(query, fields, sort, offset, limit, callback) {
        var parameters = [],
            sql = 'SELECT';
        if (!fields)
            sql += ' *';
        else {
            if (util.isArray(fields))
                sql += ' ' + fields.join(',');
            else {
                var columns = [];
                _.mapObject(fields, function(value, key) {
                    if (value)
                        columns.push(key);
                });
                sql += ' ' + columns.join(',');
            }
        }
        sql += ' FROM ' + table;
        if (query) {
            var subsql = parseWhere(query, parameters);
            if (subsql)
                sql += subsql;
        }
        if (sort) {
            var sorts = [];
            _.mapObject(sort, function(value, key) {
                if (value == 1)
                    sorts.push(key + ' ASC');
                else if (value == -1)
                    sorts.push(key + ' DESC');
            });
            if (sorts.length > 0)
                sql += ' ORDER BY ' + sorts.join(',');
        }
        if (limit >= 0) {
            sql += ' LIMIT ?';
            parameters.push(limit);
        }
        if (offset >= 0) {
            sql += ' OFFSET ?';
            parameters.push(offset);
        }
        execute(sql, parameters, function(err, rows) {
            if (err)
                callback(err);
            else
                callback(null, _.map(rows, function(row) {
                    return rebuild(row);
                }));
        });
    };

    this.insert = function(fields, options, callback) {
        var parameters = [],
            sql = 'INSERT INTO ' + table;
        var columns = [],
            indexs = [];
        _.mapObject(fields, function(value, key) {
            columns.push(key);
            indexs.push('?');
            parameters.push(value);
        });
        sql += ' (' + columns.join(',') + ') VALUES(' + indexs.join(',') + ')';
        execute(sql, parameters, function(err, result) {
            if (err)
                callback(err);
            else {
                if (!options.id)
                    callback(null, null);
                else {
                    var value = {};
                    value[options.id] = result.insertId;
                    callback(null, rebuild(value));
                }
            }
        });
    };

    this.update = function(query, fields, options, callback) {
        var parameters = [],
            sql = 'UPDATE ' + table + ' SET';
        var fieldSet = null,
            fieldInc = null,
            sets = [];
        if (fields.$inc)
            fieldInc = fields.$inc;
        if (fields.$set)
            fieldSet = fields.$set;
        else
            fieldSet = fields;
        if (fieldInc) {
            _.mapObject(fieldInc, function(value, key) {
                sets.push(key + '=' + key + '+?');
                parameters.push(value);
            });
        }
        if (fieldSet) {
            _.mapObject(fieldSet, function(value, key) {
                if (key.substring(0, 1) == '$')
                    return;
                sets.push(key + '=?');
                parameters.push(value);
            });
        }
        sql += ' ' + sets.join(',');
        if (query) {
            var subsql = parseWhere(query, parameters);
            if (subsql)
                sql += subsql;
        }
        execute(sql, parameters, function(err, result) {
            if (err)
                callback(err);
            else
                callback(null, result.affectedRows);
        });
    };

    this.remove = function(query, callback) {
        var parameters = [],
            sql = 'DELETE FROM ' + table;
        if (query) {
            var subsql = parseWhere(query, parameters);
            if (subsql)
                sql += subsql;
        }
        execute(sql, parameters, function(err, result) {
            if (err)
                callback(err);
            else
                callback(null, result.affectedRows);
        });
    };
}

function Connection(params) {
    var pool = mysql.createPool(params);

    function execute(sql, parameters, callback) {
        pool.getConnection(function(err, connection) {
            if (err)
                callback(err);
            else
                connection.query(sql, parameters, function(err, result) {
                    connection.release();
                    callback(err, result);
                });
        });
    }

    this.table = function(table, rebuild) {
        return new Executor(table, rebuild, execute);
    };
}

module.exports = Connection;
