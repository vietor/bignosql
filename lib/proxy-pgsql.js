"use strict";

var util = require('util');
var pg = require('pg');
var _ = require('underscore');

function Executor(table, rebuild, execute) {

    function parseWhere(query, index, parameters) {
        var wheres = [];
        var base = index;
        _.mapObject(query, function(value, key) {
            if (typeof value != 'object') {
                wheres.push(key + '=$' + (++index));
                parameters.push(value);
            } else {
                _.mapObject(value, function(v, k) {
                    if (k == '$eq') {
                        wheres.push(key + '=$' + (++index));
                        parameters.push(v);
                    } else if (k == '$ne') {
                        wheres.push(key + '!=$' + (++index));
                        parameters.push(v);
                    } else if (k == '$lte') {
                        wheres.push(key + '<=$' + (++index));
                        parameters.push(v);
                    } else if (k == '$lt') {
                        wheres.push(key + '<$' + (++index));
                        parameters.push(v);
                    } else if (k == '$gte') {
                        wheres.push(key + '>=$' + (++index));
                        parameters.push(v);
                    } else if (k == '$gt') {
                        wheres.push(key + '>$' + (++index));
                        parameters.push(v);
                    } else if (k == '$in' || k == '$nin') {
                        var idxs = [];
                        _.each(v, function(o) {
                            parameters.push(o);
                            idxs.push('$' + (++index));
                        });
                        wheres.push(key + (k == '$in' ? ' IN ' : ' NOT IN ') + '(' + idxs.join(',') + ')');
                    }
                });
            }
        });
        return {
            skip: index - base,
            subsql: wheres.length < 1 ? '' : ' WHERE ' + wheres.join(' AND ')
        };
    }

    this.find = function(query, fields, sort, offset, limit, callback) {
        var index = 0,
            parameters = [],
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
            var where = parseWhere(query, 0, parameters);
            if (where.subsql) {
                sql += where.subsql;
                index += where.skip;
            }
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
            sql += ' LIMIT $' + (++index);
            parameters.push(limit);
        }
        if (offset >= 0) {
            sql += ' OFFSET $' + (++index);
            parameters.push(offset);
        }
        execute(sql, parameters, function(err, result) {
            if (err)
                callback(err);
            else
                callback(null, _.map(result.rows, function(row) {
                    return rebuild(row);
                }));
        });
    };

    this.insert = function(fields, options, callback) {
        var index = 0,
            parameters = [],
            sql = 'INSERT INTO ' + table;
        var columns = [],
            indexs = [];
        _.mapObject(fields, function(value, key) {
            columns.push(key);
            indexs.push('$' + (++index));
            parameters.push(value);
        });
        sql += ' (' + columns.join(',') + ') VALUES(' + indexs.join(',') + ')';
        if (options.id)
            sql += ' RETURNING ' + options.id;
        execute(sql, parameters, function(err, result) {
            if (err)
                callback(err);
            else {
                var value = null;
                if (options.id)
                    value = rebuild(result.rows[0]);
                callback(null, value);
            }
        });
    };

    this.update = function(query, fields, options, callback) {
        var index = 0,
            parameters = [],
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
                sets.push(key + '=' + key + '+$' + (++index));
                parameters.push(value);
            });
        }
        if (fieldSet) {
            _.mapObject(fieldSet, function(value, key) {
                if (key.substring(0, 1) == '$')
                    return;
                sets.push(key + '=$' + (++index));
                parameters.push(value);
            });
        }
        sql += ' ' + sets.join(',');
        if (query) {
            var where = parseWhere(query, index, parameters);
            if (where.subsql)
                sql += where.subsql;
        }
        execute(sql, parameters, function(err, result) {
            if (err)
                callback(err);
            else {
                callback(null, result.rowCount);
            }
        });
    };

    this.remove = function(query, callback) {
        var parameters = [],
            sql = 'DELETE FROM ' + table;
        if (query) {
            var where = parseWhere(query, 0, parameters);
            if (where.subsql)
                sql += where.subsql;
        }
        execute(sql, parameters, function(err, result) {
            if (err)
                callback(err);
            else
                callback(null, result.rowCount);
        });
    };
}

function Connection(params) {

    function execute(sql, parameters, callback) {
        pg.connect(params, function(err, client, done) {
            if (err)
                callback(err);
            else
                client.query(sql, parameters, function(err, result) {
                    done();
                    callback(err, result);
                });
        });
    }

    this.table = function(table, rebuild) {
        return new Executor(table, rebuild, execute);
    };
}

module.exports = Connection;
