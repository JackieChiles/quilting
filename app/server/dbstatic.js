'use strict';

//Static data that will rarely change, inserted into the database on a server restart via dbinit
module.exports = {
    QuiltSizes: [
        {
            id: 0,
            name: 'King',
            width: 98,
            height: 106,
            unit: 'in'
        },
        {
            id: 1,
            name: 'Queen',
            width: 84,
            height: 92,
            unit: 'in'
        }
    ]
};