'use strict';

var app = angular.module('QuiltingApp', ['mp.colorPicker']);

//If true, draws the quilt grid on the SVG element
app.directive('drawGrid', function (quiltSvg) {
    return {
        link: function (scope, element, attrs) {
            scope.snapSvg = Snap(element[0]);

            var drawGrid = function () {
                //Grid snap granularity of 1 will result in no grid snap lines drawn
                var gridSnapGranularity = scope.gridSnapGranularity && scope.gridSnapGranularity.value ? scope.gridSnapGranularity.value : 1;

                if (scope.quilt) {
                    quiltSvg.drawGrid(element, scope.quilt, gridSnapGranularity)
                }
            };

            scope.$watch('gridSnapGranularity', drawGrid);
            scope.$watch('quilt', drawGrid);

            //TODO: handle block removal here?
            //Watch the blocks collection, rendering blocks as they are placed
            scope.$watchCollection('quilt.blocks', function (newBlocks, oldBlocks) {
                if (newBlocks && oldBlocks) {
                    if (newBlocks.length > oldBlocks.length) {
                        //A new block was placed: render it
                        quiltSvg.placeBlock(scope.snapSvg, newBlocks[newBlocks.length - 1], scope.quilt, scope.gridSnapGranularity.value);
                    }
                }
            });
        },
        scope: {
            quilt: '=',
            snapSvg: '=',
            gridSnapGranularity: '='
        }
    };
});

//Draws a single block
//TODO: rename drawBlock and all related items to clearly distinquish between preview and place blocks
app.directive('drawBlock', function (quiltSvg) {
    return {
        link: function (scope, element, attrs) {
            var drawBlock = function () {
                if (scope.drawBlock) {
                    quiltSvg.drawBlock(element, scope.drawBlock, scope.blockColor);
                }
            };

            scope.$watch('drawBlock', drawBlock);
            scope.$watch('blockColor', drawBlock);
        },
        scope: {
            drawBlock: '=',
            blockColor: '='
        }
    };
});

//Prevents a bootstrap dropdown from closing if it clicked
app.directive('dropdownNoCloseOnClick', function () {
    return {
        link: function (scope, element, attrs) {
            $(element).click(function (e) {
                e.stopPropagation();
            });
        }
    };
});

app.controller('QuiltNewController', function ($scope, socket) {
    //Private functions  
    var loadQuilt = function (quilt) {
        if (quilt) {
            window.location.pathname = 'design/' + quilt._id;
        }
    };

    //Data
    $scope.quiltSizeOptions = [];
    $scope.selectedSize = null;
    $scope.newQuiltName = '';

    //Functions
    $scope.newQuilt = function () {
        socket.emit('newQuilt', { size: $scope.selectedSize, name: $scope.newQuiltName }, function (message) {
            console.log('Created new quilt: ', message);
            loadQuilt(message);
        });
    };

    //Initialization
    socket.emit('getQuiltSizeOptions', {}, function (message) {
        $scope.quiltSizeOptions = message;
        $scope.selectedSize = $scope.quiltSizeOptions.filter(function(size) { return size.isDefault; })[0];
    });
});

app.controller('QuiltDesignerController', function ($scope, socket, quiltSvg) {
    //Private functions
    var getQuiltId = function () {
        //Expecting /design/{id} or just /design
        return window.location.pathname.split('/')[2];
    };
    
    var loadQuilt = function (quilt) {
        if (quilt) {
            $scope.quilt = quilt;
        }
    };
    
    //Data
    $scope.snap = null;
    $scope.quilt = null;
    $scope.gridSnapGranularityOptions = [];
    $scope.gridSnapGranularity = null;
    $scope.blocksAvailable = [];
    $scope.selectedBlock = null;
    $scope.selectedBlockColor = '#364bdb'; //TODO: don't hardcode
    
    //Functions
    $scope.getQuilt = function (id) {
        socket.emit('getQuilt', { id: id }, function (message) {
            console.log('Retrieved existing quilt: ', message);
            loadQuilt(message);
        });
    };

    $scope.updateQuilt = function () {
        // $scope.quilt.svg = Snap(document.getElementById('grid')).toString();

        // console.log($scope.quilt.svg);

        // socket.emit('updateQuilt', $scope.quilt, function (message) {
        //     console.log('Updated quilt: ', message);
        // });
    };

    $scope.selectBlock = function (block) {
        $scope.selectedBlock = block;
    };
    
    $scope.placeBlock = function (block) {
        if ($scope.quilt) {
            //TODO: use PlacedBlock model client-side to construct instead of doing it manually
            $scope.quilt.blocks.push({
                x: 0,
                y: 0,
                z: 0,
                block: block
            });
        }
    };

    $scope.handleKeyboardShortcut = function (event) {
        quiltSvg.handleKeyboardShortcut($scope.snap, event);
    };
    
    //Initialization
    $scope.getQuilt(getQuiltId());
    
    socket.emit('getGridSnapGranularityOptions', {}, function (message) {
        $scope.gridSnapGranularityOptions = message;
        $scope.gridSnapGranularity = $scope.gridSnapGranularityOptions[0];
    });
    
    socket.emit('getPredefinedBlocks', {}, function (message) {
        $scope.blocksAvailable = message;
        $scope.selectBlock($scope.blocksAvailable[0]);
    });
});