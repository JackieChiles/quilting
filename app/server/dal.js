'use strict';

module.exports = {
    getQuiltSizes: function (callback) {
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
    }
};