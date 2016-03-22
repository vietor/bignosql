# bignosql

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

Smart NoSQL wrapper for SQL.
===

This **isn't** a ORM, it just simplify the **SQL usage**.

## Installation

```sh
$ npm install --save bignosql

# And one of the following:
$ npm install --save pg # for postgresql
$ npm install --save mysql # for mysql and like mysql
```

## Usage

``` javascript
var bignosql = require('bignosql');

var client = bignosql.connect("pgsql", {
        host: "127.0.0.1",
        port: 5432,
        database: "bignosql",
        user: "vietor",
        password: ""
    }, {
        debug: true
    });

var model = client.model("test", {
        id: bignosql.Number,
        key: bignosql.String,
        value: {
           type: bignosql.Number,
           default: 0
        }
    });

model.insert({key: 'demo', value: 0}, {return: "id"}, function(err, result) {
});
model.find({id: 1}, {id: 1, key: 1, value: 1}, function(err, rows) {
});
model.find({}).select({id: 1, key: 1, value: 1}).sort({id: -1}).skip(0).limit(1).exec(function(err, rows) {
});
model.update({id: 1}, {$inc: {value: 1}}, function(err, count) {
});
model.count({value: {$gt: 0}}, function(err, count) {
});
model.remove({id: 1}, function(err, count) {
});
```

## API

### bignosql

#### Any
The **variables** definition for Schema **Undefined** type.  
Don't direct usage the variable, it is **local usage**.

#### Number
The **variables** definiton for Schema **Number** type.

#### String
The **variables** definiton for Schema **String** type.

#### connect(type, parameters, [options])

Connect the sql database, return the **Client** object

|*Name*|*Type*|*Description*|
|---|---|---|---|
|type|string|target sql type|
|parameters|Object|the sql connect params|
|options|Object(options)|the options for bignosql|

##### type & parameters
> type: pgsql
>> use **pg.pools**, [parameters details](https://github.com/brianc/node-postgres/wiki/Client#parameters)

> type: mysql
>> use **mysql.createPool** [parameters details](https://github.com/felixge/node-mysql#pool-options)

##### Object(Options)
|*Name*|*Type*|*Default*|*Description*|
|---|---|---|---|
|debug|boolen|false|switch in debug message|

### Client

#### model(name, schema)

Create a model for **SQL Table**, return **Model** object.

|*Name*|*Type*|*Description*|
|---|---|---|---|
|name|string|the table name for sql|
|schema|Object(Schema)|the schema definition|

##### Object(Schema)

The **Schema** is a simple object, **Key** is the column name, **Value** is a **type definition**.  
The **type definition** may be a **variable** or Object(ShemaType).

###### Object(SchemaType)
|*Name*|*Type*|*Default*|*Description*|
|---|---|---|---|
|type|**variables**|Any|column data type|
|default|**object**|default value for column|

### Model

#### insert(doc, [options], callback)

Insert one record to table.

|*Name*|*Type*|*Description*|
|---|---|---|
|doc|Object|the columns and it values|
|options|Object(InsertOptions)|the options for insert|
|callback|function|the callback for result|

##### Object(InsertOptions)

|*Name*|*Type*|*Default*|*Description*|
|---|---|---|---|
|return|string|Undefined|for result the auto incriment name|

##### callback(err, result)

|*Name*|*Type*|*Description*|
|---|---|---|
|err|object|**Error** object|
|result|object|the result object|

#### find(query, [fields], [callback])

Finds some records from table.

|*Name*|*Type*|*Description*|
|---|---|---|
|query|Object|the columns and it conditions|
|fields|Object|required column names|
|callback|function|callback for result|

> when callback was null, it return **Query** object

##### Query

###### select(fields)

Set required column names. It's a K/V Object, key is column name, V 1 or true was required.

###### sort(fields)

Set column sort order. It's a K/V Object, key is column name, V 1 was ASC, -1 was DESC.

###### skip(n)

Set skip row count in table

###### limit(n)

Set limit row count in result

###### exec(callback)

callback for result

#### count(query, callback)

Get count from table.

|*Name*|*Type*|*Description*|
|---|---|---|
|query|Object|the columns and it conditions|
|callback|function|callback for result|

##### callback(err, count)

|*Name*|*Type*|*Description*|
|---|---|---|
|err|object|**Error**object|
|count|number|row count|

#### update(query, update, callback)

Update records from table.

|*Name*|*Type*|*Description*|
|---|---|---|
|query|Object|the columns and it conditions|
|update|Object(UpdateScript)|update script|
|callback|function|callback for result|

##### Object(UpdateScript)

It was a simple record object like **doc** in **insert**, or a complex object.

|*Key*|*Type*|*Description*|
|---|---|---|
|$set|**doc**|the record object|
|$in|Object|the K/V for number addition|

``` json
{
    $set: {
        key: "demo"
    },
    $inc: {
        value: -9
    }
}
```

##### callback(err, count)

|*Name*|*Type*|*Description*|
|---|---|---|
|err|object|**Error**object|
|count|number|affect row count|

#### remove(query, callback)

Remove records from table.

|*Name*|*Type*|*Description*|
|---|---|---|
|query|Object|the columns and it conditions|
|callback|function|callback for result|

##### callback(err, count)

|*Name*|*Type*|*Description*|
|---|---|---|
|err|object|**Error**object|
|count|number|affect row count|

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/bignosql.svg
[npm-url]: https://npmjs.org/package/bignosql
[downloads-image]: https://img.shields.io/npm/dm/bignosql.svg
[downloads-url]: https://npmjs.org/package/bignosql
