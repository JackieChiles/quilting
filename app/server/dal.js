'use strict';

var util = require('util');
var schema = require('./schema');
var staticData = require('./dbstatic');

module.exports.getQuiltSizeOptions = function (callback) {
    callback(staticData.quiltSizeOptions);
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

module.exports.newQuilt = function (size, name, callback) {
    var m = new schema.Quilt();

    m.name = name;
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