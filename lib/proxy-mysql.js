"use strict";

var util = require('util');
var mysql = require('mysql');
var _ = require('underscore');

function Executor(table, rebuild, execute) {

    function wrapKey(key) {
        return '`' + key + '`';
    }

    function unwrapWhere(subsql) {
        return subsql[0] != '(' ? subsql : subsql.substring(1, subsql.length - 1);
    }

    function parseWhereAND(query, parameters) {
        var wheres = [];
        _.mapObject(query, function(value, key) {
            if (key == '$or') {
                var where = parseWhereOr(value, parameters);
                if (where.subsql) {
                    if (where.count < 2)
                        wheres.push(where.subsql);
                    else
                        wheres.push('(' + where.subsql + ')');
                }
            } else if (typeof value != 'object') {
                wheres.push(wrapKey(key) + '=?');
                parameters.push(value);
            } else {
                _.mapObject(value, function(v, k) {
                    if (k == '$eq') {
                        wheres.push(wrapKey(key) + '=?');
                        parameters.push(v);
                    } else if (k == '$ne') {
                        wheres.push(wrapKey(key) + '!=?');
                        parameters.push(v);
                    } else if (k == '$lte') {
                        wheres.push(wrapKey(key) + '<=?');
                        parameters.push(v);
                    } else if (k == '$lt') {
                        wheres.push(wrapKey(key) + '<?');
                        parameters.push(v);
                    } else if (k == '$gte') {
                        wheres.push(wrapKey(key) + '>=?');
                        parameters.push(v);
                    } else if (k == '$gt') {
                        wheres.push(wrapKey(key) + '>?');
                        parameters.push(v);
                    } else if (k == '$regex') {
                        wheres.push(wrapKey(key) + ' REGEXP \'' + v + '\'');
                    } else if (k == '$in' || k == '$nin') {
                        var idxs = [];
                        _.each(v, function(o) {
                            parameters.push(o);
                            idxs.push('?');
                        });
                        wheres.push(wrapKey(key) + (k == '$in' ? ' IN ' : ' NOT IN ') + '(' + idxs.join(',') + ')');
                    }
                });
            }
        });
        return {
            count: wheres.length,
            subsql: wheres.length < 1 ? '' : wheres.join(' AND ')
        };
    }

    function parseWhereOr(query, parameters) {
        var subsqls = [];
        _.each(query, function(row) {
            var where = parseWhereAND(row, parameters);
            if (where.subsql) {
                if (where.count < 2)
                    subsqls.push(where.subsql);
                else
                    subsqls.push('(' + where.subsql + ')');
            }
        });
        return {
            count: subsqls.length,
            subsql: subsqls.length < 1 ? '' : subsqls.join(' OR ')
        };
    }

    function parseWhere(query, parameters) {
        var where = parseWhereAND(query, parameters);
        return !where.subsql ? '' : ' WHERE ' + unwrapWhere(where.subsql);
    }

    this.find = function(query, fields, sort, offset, limit, callback) {
        var parameters = [],
            sql = 'SELECT';
        if (!fields)
            sql += ' *';
        else {
            if (util.isArray(fields))
                sql += ' ' + _.map(fields, function(key) {
                    return wrapKey(key);
                }).join(',');
            else {
                var columns = [];
                _.mapObject(fields, function(value, key) {
                    if (value)
                        columns.push(wrapKey(key));
                });
                sql += ' ' + columns.join(',');
            }
        }
        sql += ' FROM ' + wrapKey(table);
        if (query) {
            var subsql = parseWhere(query, parameters);
            if (subsql)
                sql += subsql;
        }
        if (sort) {
            var sorts = [];
            _.mapObject(sort, function(value, key) {
                if (value == 1)
                    sorts.push(wrapKey(key) + ' ASC');
                else if (value == -1)
                    sorts.push(wrapKey(key) + ' DESC');
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
            sql = 'INSERT INTO ' + wrapKey(table);
        var columns = [],
            indexs = [];
        _.mapObject(fields, function(value, key) {
            columns.push(wrapKey(key));
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

    this.update = function(query, update, options, callback) {
        var parameters = [],
            sql = 'UPDATE ' + wrapKey(table) + ' SET';
        var fieldSet = null,
            fieldInc = null,
            sets = [];
        if (update.$inc)
            fieldInc = update.$inc;
        if (update.$set)
            fieldSet = update.$set;
        else
            fieldSet = update;
        if (fieldInc) {
            _.mapObject(fieldInc, function(value, key) {
                sets.push(wrapKey(key) + '=' + wrapKey(key) + '+?');
                parameters.push(value);
            });
        }
        if (fieldSet) {
            _.mapObject(fieldSet, function(value, key) {
                if (key.substring(0, 1) == '$')
                    return;
                sets.push(wrapKey(key) + '=?');
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
            sql = 'DELETE FROM ' + wrapKey(table);
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

    this.count = function(query, callback) {
        var parameters = [],
            sql = 'SELECT COUNT(*) AS `count` FROM ' + wrapKey(table);
        if (query) {
            var subsql = parseWhere(query, parameters);
            if (subsql)
                sql += subsql;
        }
        execute(sql, parameters, function(err, result) {
            if (err)
                callback(err);
            else
                callback(null, Number(result[0].count));
        });
    };
}

function Connection(params, options) {
    var pool = mysql.createPool(params);

    function execute(sql, parameters, callback) {
        if (options.debug)
            console.log(sql);
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
