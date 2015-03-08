'use strict';

var util = require('util');
var schema = require('./schema');

module.exports.initialize = function() {
    require('./dbinit').initialize();
};

module.exports.getQuiltSizeOptions = function (callback) {
    var mongoClient = require('mongodb').MongoClient;
    var dbName = require('./config').dbName;

    mongoClient.connect(dbName, function (err, db) {
        if (err) {
           console.log(err);
           return;
        }

        db.collection('QuiltSizes').find().toArray(function (err, items) {
            callback(items);
        });
    });
};

module.exports.getQuilt = function (id, callback) {
    var query = schema.Quilt.findOne({ '_id': id });

    query.exec(function (err, result) {
        if (err) {
            console.log('Error retrieving quilt: ' + err);
            return;
        }
        
        callback(result);
    });
};

module.exports.newQuilt = function (size, callback) {
    var m = new schema.Quilt();

    m.name = util.format('New %s-Sized Quilt', size.name);
    m.width = size.width;
    m.height = size.height;

    m.save(function (err, result) {
        if (err) {
            console.log('Error saving new quilt: ' + err);
            return;
        }

        module.exports.getQuilt(result._id, callback);
    });
};