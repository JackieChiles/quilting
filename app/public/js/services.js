'use strict';

app.factory('socket', function ($rootScope) {
    var socket = io.connect();
    
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});

//The quiltSvg service provides functions that manipulate an SVG object ('snap' parameter or 'element' from angular
//binding) using quilt data ('quilt' parameter) and other information. It is the bridge between the quilt/block models and
//the SVG elements in the UI.

//Depends on Snap.svg
//Also depends on jQuery, but TODO: use a controller instead of a link function to get access to $element
//http://jasonmore.net/angular-js-directives-difference-controller-link/
app.factory('quiltSvg', function () {
    //Private functions
    var deleteSelectedBlock = function (snap) {
        //TODO: must remove from quilt's block collection
        var selected = snap.select('.quilt-block.selected');

        if (selected) {
            selected.remove();
        }
    };

    var deselectBlock = function (snap) {
        var selected = snap.select('.quilt-block.selected');

        if (selected) {
            selected.attr('stroke', '');
            selected.attr('stroke-width', '');
            selected.attr('stroke-dasharray', '');
            selected.removeClass('selected');
        }
    };

    return {
        drawGrid: function (element, quilt, gridSnapGranularity) {
            var svg = element[0];
            var snap = Snap(svg);
            var quiltWidth = quilt.width;
            var quiltHeight = quilt.height;

            //In pixels, the quilt width should fill the entire SVG
            var pixelWidth = svg.offsetWidth;

            //Calculate a height that preserves the aspect ratio
            var pixelHeight = (quiltHeight / quiltWidth) * pixelWidth;

            element.css('height', pixelHeight);

            //If setting the height changed the width (added a scrollbar), re-calculate
            if ($(element).width() != pixelWidth) {
                pixelWidth = svg.offsetWidth;
                pixelHeight = (quiltHeight / quiltWidth) * pixelWidth;
            }

            //Scale the grid boxes proportionally
            var pixelBoxSize = pixelWidth / quiltWidth;
            var pixelSnapGridBoxSize = pixelBoxSize * gridSnapGranularity;
            
            //Remove the old grid, if any
            var oldRect = snap.select('.grid-rect');                    
            oldRect && oldRect.remove();

            //Build the rectangle and patterns
            var rect = snap.rect(0, 0, pixelWidth, pixelHeight);
            
            rect.attr({
                class: 'grid-rect'
            });
            
            var getGridPathString = function (boxSize) {
                return ['M', boxSize, '0', 'L', '0', '0', '0', boxSize, boxSize, boxSize, boxSize, '0'].join(' ');
            };
            
            //Grid snap granularity pattern 
            var gridSnapPath = snap.path(getGridPathString(pixelSnapGridBoxSize))
                .attr({
                    fill: 'none',
                    stroke: '#555555',
                    strokeWidth: 1
                });
            
            //Standard inch-per-box pattern
            var standardPath = snap.path(getGridPathString(pixelBoxSize))
                .attr({
                    fill: 'none',
                    stroke: '#CCCCCC',
                    strokeWidth: 1
                });
            
            rect.attr({
                stroke: '#000000',
                strokeWidth: 3
            });
            
            var gridSnapPattern = null;
            var standardPattern = null;
            var makeStandardPattern = function () {
                standardPattern = standardPath.pattern(0, 0, pixelBoxSize, pixelBoxSize);
            };
            
            var makeSnapPattern = function () {
                gridSnapPattern = gridSnapPath.pattern(0, 0, pixelSnapGridBoxSize, pixelSnapGridBoxSize);
            };
            
            //Set pattern fills depending on which pattern is of larger scale
            if (gridSnapGranularity > 1) {
                makeStandardPattern();
                
                //Grid snap is larger than the standard 1-inch grid
                gridSnapPath.attr({
                    fill: standardPattern
                });
            }
            else if (gridSnapGranularity < 1) {
                makeSnapPattern();
                
                //Grid snap is smaller than the standard 1-inch grid
                standardPath.attr({
                    fill: gridSnapPattern
                });
            }
            
            //Make patterns from the path definitions if they haven't already been created
            gridSnapPattern || makeSnapPattern();
            standardPattern || makeStandardPattern();
            
            //Fill the grid rectangle with the larger-scale pattern
            rect.attr({
                fill: gridSnapGranularity <= 1 ? standardPattern : gridSnapPattern
            });

            //Move the grid to the top of the SVG so that it's underneath all blocks
            var firstQuiltBlock = snap.select('.quilt-block')

            if (firstQuiltBlock) {
                rect.insertBefore(firstQuiltBlock);
            }
        },
        drawBlock: function(element, block, fillColor) {
            var svg = element[0];
            var snap = Snap(svg);
            var blockElement = snap[block.element.name]();

            blockElement.attr(block.element.properties);
            
            //Remove the old SVG contents
            snap.clear();

            //Add the fill color to the new elements
            if (fillColor) {
                blockElement.attr({ fill: fillColor });
            }

            //Add the elements to the SVG
            snap.add(blockElement);

            //Update the drawBlock binding with the added color
            if (fillColor) {
                block.element.properties.fill = fillColor;
            }
        },
        placeBlock: function (snap, placedBlock, quilt, gridSnapGranularity) {
            var block = placedBlock.block;
            var pixelsPerInch = snap.getBBox().width / quilt.width;
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
                    var granularity = gridSnapGranularity;

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
                    deselectBlock(snap);

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
        },
        handleKeyboardShortcut: function (snap, event) {
            //TODO don't hardcode key codes
            if (event.altKey && event.keyCode === 46) {
                //Alt + Delete: delete selected block
                deleteSelectedBlock(snap);
            }
            else if (event.keyCode === 27) {
                //Escape: de-select selected block
                deselectBlock(snap);
            }
        }
    };
});