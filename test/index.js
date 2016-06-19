"use strict";

var should = require('should');
var bignosql = require('../index');


function getTestModel(client) {
    return client.model("test", {
        id: bignosql.Number,
        key: bignosql.String,
        value: bignosql.Number
    });
}

function forInsert(context, TestModel) {
    return function(done) {
        TestModel.insert({
            key: 'demo1',
            value: 1
        }, {
            id: 'id'
        }, function(err, result) {
            should(err).be.equal(null);
            should(result.id > 0).be.ok();
            context.id = result.id;
            done();
        });
    };
}

function forUpdate(context, TestModel) {
    return function(done) {
        TestModel.update({
            id: context.id
        }, {
            $set: {
                key: "demo2"
            },
            $inc: {
                value: 2
            }
        }, function(err, rowCount) {
            should(err).be.equal(null);
            should(rowCount == 1).be.ok();
            done();
        });
    };
}

function forUpdateAndReturn(context, TestModel) {
    return function(done) {
        TestModel.update({
            id: context.id
        }, {
            $set: {
                key: "demo2"
            },
            $inc: {
                value: 2
            },
        }, {
            return: "value"
        }, function(err, rowCount, data) {
            should(err).be.equal(null);
            should(rowCount == 1).be.ok();
            should(data.value > 1).be.ok();
            done();
        });
    };
}

function forFind(context, TestModel) {
    return function(done) {
        TestModel.find({
            $or: [{
                id: context.id
            }, {
                key: 'dong usage 1',
                $or: [{
                    key: 'dong usage 2'
                }, {
                    key: 'dong usage 3'
                }]
            }]
        }, {
            id: 1,
            key: 1,
            value: 1
        }).sort({
            key: -1
        }).exec(function(err, rows) {
            should(err).be.equal(null);
            should(rows.length == 1).be.ok();
            should(rows[0].key).be.eql("demo2");
            should(rows[0].value).be.eql(3);
            done();
        });
    };
}

function forFindIn(context, TestModel) {
    return function(done) {
        TestModel.find({
            id: {
                $in: [context.id, -1]
            }
        }, function(err, rows) {
            should(err).be.equal(null);
            should(rows[0].value).be.eql(3);
            done();
        });
    };
}

function forFindInEq(context, TestModel) {
    return function(done) {
        TestModel.find({
            id: {
                $in: [context.id]
            }
        }, function(err, rows) {
            should(err).be.equal(null);
            should(rows[0].value).be.eql(3);
            done();
        });
    };
}

function forFindRegexp(context, TestModel) {
    return function(done) {
        TestModel.find({
            key: {
                $regex: "^de.*[0-9]*$"
            }
        }, {
            id: 1,
            key: 1,
            value: 1
        }).sort({
            id: -1
        }).limit(1).exec(function(err, rows) {
            should(err).be.equal(null);
            should(rows[0].id).be.eql(context.id);
            should(rows[0].value).be.eql(3);
            done();
        });
    };
}

function forCount(context, TestModel) {
    return function(done) {
        TestModel.count({
            id: context.id
        }, function(err, rowCount) {
            should(err).be.equal(null);
            should(rowCount == 1).be.ok();
            done();
        });
    };
}

function forRemove(context, TestModel) {
    return function(done) {
        TestModel.remove({
            id: context.id
        }, function(err, rowCount) {
            should(err).be.equal(null);
            should(rowCount == 1).be.ok();
            done();
        });
    };
}

function forFindEmpty(context, TestModel) {
    return function(done) {
        TestModel.find({
            id: context.id
        }, function(err, rows) {
            should(err).be.equal(null);
            should(rows.length === 0).be.ok();
            done();
        });
    };
}

function forCountEmpty(context, TestModel) {
    return function(done) {
        TestModel.count({
            id: context.id
        }, function(err, rowCount) {
            should(err).be.equal(null);
            should(rowCount === 0).be.ok();
            done();
        });
    };
}

describe('PostgreSQL', function() {

    var client = bignosql.connect("pgsql", {
        host: "127.0.0.1",
        port: 5432,
        database: "bignosql",
        user: "vietor",
        password: ""
    }, {
        debug: true
    });

    var context = {};
    var TestModel = getTestModel(client);

    it('insert', forInsert(context, TestModel));
    it('update', forUpdate(context, TestModel));
    it('find', forFind(context, TestModel));
    it('find in', forFindIn(context, TestModel));
    it('find in eq', forFindInEq(context, TestModel));
    it('find regexp', forFindRegexp(context, TestModel));
    it('count', forCount(context, TestModel));
    it('remove', forRemove(context, TestModel));
    it('find empty', forFindEmpty(context, TestModel));
    it('count empty', forCountEmpty(context, TestModel));

});



describe('MySQL', function() {

    var client = bignosql.connect("mysql", {
        host: "localhost",
        database: "bignosql",
        user: "root",
        password: ""
    }, {
        debug: true
    });

    var context = {};
    var TestModel = getTestModel(client);

    it('insert', forInsert(context, TestModel));
    it('update', forUpdate(context, TestModel));
    it('find', forFind(context, TestModel));
    it('find in', forFindIn(context, TestModel));
    it('find in eq', forFindInEq(context, TestModel));
    it('find regexp', forFindRegexp(context, TestModel));
    it('count', forCount(context, TestModel));
    it('remove', forRemove(context, TestModel));
    it('find empty', forFindEmpty(context, TestModel));
    it('count empty', forCountEmpty(context, TestModel));

});
