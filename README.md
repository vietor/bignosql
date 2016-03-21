# bignosql

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

Smart NoSQL wapper for SQL

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
        value: bignosql.Number
    });

model.insert({key: 'demo', value: 0}, {return: "id"}, function(err, result) {
});
model.find({id: 1}, {id: 1, key: 1, value: 1}, function(err, rows) {
});
model.update({id: 1}, {$inc: {value: 1}}, function(err, count) {
});
model.count({value: {$gt: 0}}, function(err, count) {
});
model.remove({id: 1}, function(err, count) {
});
```

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/bignosql.svg
[npm-url]: https://npmjs.org/package/bignosql
[downloads-image]: https://img.shields.io/npm/dm/bignosql.svg
[downloads-url]: https://npmjs.org/package/bignosql
