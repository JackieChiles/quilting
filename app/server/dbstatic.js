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
    ],
    gridSnapGranularityOptions: [
        {
            name: 'None',
            value: null,
            unit: 'in'
        },
        {
            name: '⅛ inch',
            value: 0.125,
            unit: 'in'
        },
        {
            name: '¼ inch',
            value: 0.25,
            unit: 'in'
        },
        {
            name: '½ inch',
            value: 0.5,
            unit: 'in'
        },
        {
            name: '1 inch',
            value: 1,
            unit: 'in'
        }
    ]
};

//Grid snap granularity options 2 through 12 inches
var i = 2;

for (i = 2; i <= 12; i++) {
    module.exports.gridSnapGranularityOptions.push({
        name: i + ' inches',
        value: i,
        unit: 'in'
    });
}