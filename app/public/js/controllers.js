'use strict';

var app = angular.module('QuiltingApp', ['mp.colorPicker']);

//If true, draws the quilt grid on the SVG element
app.directive('drawGrid', function (quiltSvg) {
    return {
        link: function (scope, element, attrs) {
            var drawGrid = function () {
                //Grid snap granularity of 1 will result in no grid snap lines drawn
                var gridSnapGranularity = scope.gridSnapGranularity && scope.gridSnapGranularity.value ? scope.gridSnapGranularity.value : 1;

                if (scope.quilt) {
                    quiltSvg.drawGrid(element, scope.quilt, gridSnapGranularity)
                }
            };

            scope.$watch('gridSnapGranularity', drawGrid);
            scope.$watch('quilt', drawGrid);
        },
        scope: {
            quilt: '=',
            gridSnapGranularity: '='
        }
    };
});

//Draws a single block
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
        var snap = Snap(document.getElementById("grid"));
        var pixelsPerInch = snap.getBBox().width / $scope.quilt.width;
        var blockElement = snap[block.element.name]();

        blockElement.attr(block.element.properties);
        
        //TODO don't hardcode 100
        var scale = pixelsPerInch / (100 / block.width);
        
        //Scale the block to the quilt SVG
        blockElement.transform('scale(' + scale + ')');
        
        //Add the quilt-block class
        blockElement.addClass('quilt-block');
        
        //Add block dragging and grid snapping
        //This method of grid snapping adapted from the default drag method in the snap.svg source
        var origTransform = {};

        //TODO move to a math service and inject
        var modWithTolerance = function(left, right, tolerance) {
            var mod = left % right;
            var isWithinRange = mod <= tolerance || right - mod <= tolerance;

            return isWithinRange ? 0 : mod;
        }

        blockElement.drag(
            function(dx, dy) {
                var xSnap = dx;
                var ySnap = dy;
                var granularity = $scope.gridSnapGranularity.value;

                if (granularity) {
                    var snapTo = pixelsPerInch * granularity;
                    var xDistanceFromGrid = 0;
                    var yDistanceFromGrid = 0;

                    //Adjust to ensure that there is no distance between the block and snap grid lines
                    //Could arise if block was previously moved to a point that is invalid under this snap setting
                    var origTransformValues = Snap.parseTransformString(origTransform);

                    if (origTransform && origTransformValues) {
                        //Will be array of form: ['t', xValue, yValue]
                        var translations = origTransformValues.filter(function (a) {
                            return a[0] === 't' || a[0] === 'T';
                        })[0];

                        //TODO move tolerance values to constants
                        if (translations) {
                            xDistanceFromGrid = modWithTolerance(translations[1] / pixelsPerInch, granularity, 0.0001) * pixelsPerInch;
                            yDistanceFromGrid = modWithTolerance(translations[2] / pixelsPerInch, granularity, 0.0001) * pixelsPerInch;
                        }
                    }

                    //Get the appropriate distance to move the blocks
                    xSnap = Snap.snapTo(snapTo, dx, 999999999) - xDistanceFromGrid;
                    ySnap = Snap.snapTo(snapTo, dy, 999999999) - yDistanceFromGrid;
                }

                this.attr({
                    transform: origTransform + (origTransform ? "T" : "t") + [xSnap, ySnap]
                });
            }, 
            function () {
                origTransform = this.transform().local;
            }
        );

        //Add click handler for placed shape selection
        blockElement.mousedown((function (snap) {
            return function () {
                $scope.deselectBlock();

                //TODO make stroke operation and move-to-front/back part of SVG service/module
                this.attr('stroke', 'black');
                this.attr('stroke-width', '1');
                this.attr('stroke-dasharray', '3, 3');
                this.addClass('selected');

                var allQuiltBlocks = snap.selectAll('.quilt-block');
                var lastQuiltBlock = allQuiltBlocks.length ? allQuiltBlocks[allQuiltBlocks.length - 1] : null;

                if (lastQuiltBlock) {
                    this.insertAfter(lastQuiltBlock);
                }
            };
        })(snap));
        
        //Add the block to the quilt at (0, 0)
        snap.add(blockElement);
    };

    $scope.deleteSelectedBlock = function () {
        //TODO put the call to initialize Snap in utility function or stick it on $scope
        var snap = Snap(document.getElementById("grid"));
        var selected = snap.select('.quilt-block.selected');

        if (selected) {
            selected.remove();
        }
    };

    $scope.deselectBlock = function () {
        var snap = Snap(document.getElementById("grid"));
        var selected = snap.select('.quilt-block.selected');

        if (selected) {
            selected.attr('stroke', '');
            selected.attr('stroke-width', '');
            selected.attr('stroke-dasharray', '');
            selected.removeClass('selected');
        }
    };

    $scope.handleKeyboardShortcut = function (event) {
        //TODO don't hardcode key codes
        if (event.altKey && event.keyCode === 46) {
            //Alt + Delete: delete selected block
            $scope.deleteSelectedBlock();
        }
        else if (event.keyCode === 27) {
            //Escape: de-select selected block
            $scope.deselectBlock();
        }
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