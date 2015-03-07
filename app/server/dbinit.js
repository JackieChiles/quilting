'use strict';

module.exports = {
    initialize: function () {
        var dbName = require('./config').dbName;
        var staticData = require('./dbstatic');
        var mongoClient = require('mongodb').MongoClient;

        var populateStaticCollection = function (db, name) {
            var collection = db.collection(name);
            
            //Clear the collection
            collection.remove({}, { w: 0 });

            //Insert the items
            collection.insert(staticData[name], { w: 1 }, function (err, result) {
                if (err) {
                    console.log('Error inserting data into ' + name + ': ' + err);
                };
            });
        };

        mongoClient.connect(dbName, function (err, db) {
            if (err) {
               console.log(err);
               return;
            }

            populateStaticCollection(db, 'QuiltSizes');
        });
    }
};