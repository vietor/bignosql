# bignosql

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

Smart NoSQL wrapper for SQL.
===

This **isn't** a ORM, This a lightweight wrapper for **SQL**.  
This project **dong't** change the world, It just simplify the SQL usage.

## Installation

```sh
$ npm install --save bignosql

# And one of the following:
$ npm install --save pg
$ npm install --save mysql
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
The definiton for Schema **Undefined** type.  
Don't direct usage the variable, it is **local usage**.

#### Number
The definiton for Schema **Number** type.

#### String
The definiton for Schema **String** type.

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
The **type definition** may be a **virable** or Object(Shema Type).

###### Object(Schema Type)
|*Name*|*Type*|*Default*|*Description*|
|---|---|---|---|
|type|**virables**|Any|column data type|
|default|**object**|default value for column|

### Model

#### insert(fields, [options], callback)
#### find(query, [fields], [callback])
#### count(query, callback)
#### update(query, update, callback)
#### remove(query, callback)

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/bignosql.svg
[npm-url]: https://npmjs.org/package/bignosql
[downloads-image]: https://img.shields.io/npm/dm/bignosql.svg
[downloads-url]: https://npmjs.org/package/bignosql
