'use strict';

//Static data that will rarely change
module.exports = {
    quiltSizeOptions: [
        {
            name: 'King',
            width: 98,
            height: 106,
            unit: 'in',
            isCustom: false
        },
        {
            name: 'Queen',
            width: 84,
            height: 92,
            unit: 'in',
            isCustom: false
        },
        {
            name: 'Custom',
            width: 0,
            height: 0,
            unit: 'in',
            isCustom: true
        }
    ]
};