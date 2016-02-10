;

/*
 *
 * SAMPLE USAGE DETAILS :
 *
 * sliders structure :
 *
 * [
 *  {
 *     color: "COLOR",
 *     position: "POSITION" //0 to 100 without % symbol
 *  },
 *  {
 *     ....
 *     ....
 *  },
 *  ....
 * ]
 *
 */

'use strict';


// //make me jquery UI  independent
// if (typeof jQuery.fn.draggable === "undefined") {
//      var MIN_WIDTH = 26, // this.panel.offset().left;
//      MAX_WIDTH = 426, // this.panel.offset().left + this.panel.offset().width;
//      HEIGHT = 86;

//     (function($) {

//         $.fn.draggable = function() {
//             this.css('top', "121px");
//             Drag.init(this[0], null, MIN_WIDTH, MAX_WIDTH, HEIGHT, HEIGHT);
//             return this;
//         };

//     }(jQuery));

// }

var gradX = function(container, _options) {

    var options = {
        target: '', // jquery selector ->
        sliders: [],
        direction: 'left',
        //if linear left | top | right | bottom
        //if radial left | center | right , top | center | bottom
        type: 'linear', //linear | circle | ellipse
        code_shown: false, //false | true
        width: '455px',
        height: '130px',
        debug: false,
        change: function(sliders, styles) {
            //nothing to do here by default
        }
    };

    //make global
    gradx = {
        rand_RGB: [],
        rand_pos: [],
        id: null,
        container: null,
        slider_ids: [],
        slider_index: 0, //global index for sliders
        sliders: [], //contains styles of each slider
        direction: "left", //direction of gradient or position of centre in case of radial gradients
        type: "linear", //linear or radial
        shape: "cover", //radial gradient size
        slider_hovered: [],
        code_shown: false,
        load_jQ: function() {

            //handle any library conflicts here
            this.gx = jQuery;
        },
        //very lazy to replace this by jQuery
        add_event: function(el, evt, evt_func) {
            add_event(el, evt, evt_func);
        },
        get_random_position: function() {
            var pos;

            do {
                pos = parseInt(Math.random() * 100);
            }
            while (this.rand_pos.indexOf(pos) > -1);

            this.rand_pos.push(pos);
            return pos;

        },
        get_random_rgb: function() {
            var R, G, B, color;

            do {
                R = parseInt(Math.random() * 255);
                G = parseInt(Math.random() * 255);
                B = parseInt(Math.random() * 255);

                color = "rgb(" + R + ", " + G + ", " + B + ")";
            }
            while (this.rand_RGB.indexOf(color) > -1);

            this.rand_RGB.push(color);
            return color;
        },
        get_random_number: function() {
            return Math.round(Math.random() * 100000000);
        },
        //if target element is specified the target's style (background) is updated
        update_target: function(values) {
            console.log('update_target : ', values)
            var i, v_len = values.length;
            for (i = 0; i < v_len; i++) {
                this.$target.css("background-image", values[i]);
            }
        },
        //apply styles on fly
        apply_style: function(ele, value) {
            var type = 'linear';

            if (gradx.type != 'linear') {
                type = 'radial';
            }

            if (value.indexOf(this.direction) > -1) {
                //add cross-browser compatibility
                var values = [
                    "-webkit-" + type + "-gradient(" + value + ")",
                    "-moz-" + type + "-gradient(" + value + ")",
                    "-ms-" + type + "-gradient(" + value + ")",
                    "-o-" + type + "-gradient(" + value + ")",
                    type + "-gradient(" + value + ")"
                ];
            } else {
                //normal color
                values = [value];
            }

            var len = values.length, css = '';

            while (len > 0) {
                len--;
                ele.css("background", values[len]);
                css += "background: " + values[len] + ";\n";
            }

            //call the userdefined change function
            this.change(this.sliders, values);
            this.update_target(values);

            if(this.debug == true){
                console.log('gradient :', values);
            }
        },
        //on load
        apply_default_styles: function() {
            this.update_style_array();
            var value = this.get_style_value();
            this.apply_style(this.panel, value);
        },
        //update the slider_values[] while dragging
        update_style_array: function() {

            this.sliders = [];

            var len = gradx.slider_ids.length,
                    i, offset, position, id;

            for (i = 0; i < len; i++) {
                id = "." + gradx.slider_ids[i];
                offset = parseInt(gradx.gx(id).css("left"));
                position = parseInt((offset / gradx.container_width) * 100);
                position -= 6; //TODO: find why this is required
                gradx.sliders.push([this.$container.find(id).css("background-color"), position]);
            }

            this.sliders.sort(function(A, B) {
                if (A[1] > B[1])
                    return 1;
                else
                    return -1;
            });
        },
        //creates the complete css background value to later apply style
        get_style_value: function() {
            var len = gradx.slider_ids.length;

            if (len === 1) {
                //since only one slider , so simple background

                style_str = this.sliders[0][0];
                style_str = this.direction + " , " + (this.sliders[0][0] + " " + this.sliders[0][1] + "%") + " , " + (this.sliders[0][0] + " " + this.sliders[0][1] + "%"); //add direction for gradient
            } else {
                var style_str = "", suffix = "";
                for (var i = 0; i < len; i++) {
                    if (this.sliders[i][1] == "") {
                        style_str += suffix + (this.sliders[i][0]);

                    } else {
                        if (this.sliders[i][1] > 100) {
                            this.sliders[i][1] = 100;
                        }
                        style_str += suffix + (this.sliders[i][0] + " " + this.sliders[i][1] + "%");

                    }
                    suffix = " , "; //add , from next iteration
                }

                if (this.type == 'linear') {
                    //direction, [color stoppers]
                    style_str = this.direction + " , " + style_str; //add direction for gradient
                } else {
                    //position, type size, [color stoppers]
                    style_str = this.direction + " , " + this.type + " " + this.shape + " , " + style_str;
                }
            }

            return style_str;
        },
        //@input rgb string rgb(<red>,<green>,<blue>)
        //@output rgb object of form { r: <red> , g: <green> , b : <blue>}
        get_rgb_obj: function(rgb) {

            //rgb(r,g,b)
            rgb = rgb.split("(");
            //r,g,b)
            rgb = rgb[1];
            //r g b)
            rgb = rgb.split(",");

            return {
                r: parseInt(rgb[0]),
                g: parseInt(rgb[1]),
                b: parseInt(rgb[2])
            };

        },
        load_info: function(ele) {
            this.current_slider_id = "." + $(ele).data('slider-id');
            console.log(this.current_slider_id);
            //check if current clicked element is an slider
            if (this.slider_ids.indexOf($(ele).data('slider-id')) != -1) {
                var color = this.$container.css("backgroundColor");
                //but what happens if @color is not in RGB ? :(
                var rgb = this.get_rgb_obj(color);

                var left = $(ele).css("left");
                this.$container.find(".gradx_slider_info") //info element cached before
                .css("left", left)
                .show();

                this.set_colorpicker(rgb);
            }

        },
        //add slider
        add_slider: function(sliders) {

            var slider_id, slider, k, position, value, delta;

            if (sliders.length === 0) {
                sliders = [//default sliders
                    {
                        color: gradx.get_random_rgb(),
                        position: gradx.get_random_position() //x percent of gradient panel(400px)
                    },
                    {
                        color: gradx.get_random_rgb(),
                        position: gradx.get_random_position()
                    }
                ];
            }

            obj = sliders;

            for (k in obj) {

                if (typeof obj[k].position === "undefined")
                    break;

                //convert % to px based on containers width
                var delta = this.min_width; // range: this.min_width to this.max_width
                position = parseInt((obj[k].position * this.container_width) / 100) + delta + "px";

                slider_id = "gradx_slider_" + this.slider_index; //create an id for this slider
                this.sliders.push([
                    obj[k].color,
                    obj[k].position
                ]);

                this.slider_ids.push(slider_id); // for reference wrt to id

                var slider = "<div class='gradx_slider " + slider_id + "' data-slider-id='" + slider_id + "'></div>";
                this.$container.find(".gradx_start_sliders_" + this.id).append(slider);

                this.$container.find("."+slider_id).css("backgroundColor", obj[k].color).css("left", position);
                this.slider_index++;
            }

            for (var i = 0, len = this.slider_ids.length; i < len; i++) {
                gradx.$container.find('.' + this.slider_ids[i]).draggable({
                    containment: 'parent',
                    axis: 'x',
                    start: function() {
                        gradx.current_slider_id = "." + $(this).data('slider-id'); //got full jQuery power here !
                    },
                    drag: function() {
                        gradx.apply_default_styles();
                        var left = gradx.$container.find(gradx.current_slider_id).css("left");

                        // if (parseInt(left) > 120) {
                        //     left = "272px";
                        // } else {
                        //     left = "120px";
                        // }

                        gradx.$container.find(".gradx_slider_info") //info element cached before
                        .css("left", left)
                        .show();

                        var color = gradx.$container.find(gradx.current_slider_id).css("backgroundColor");
                        // TODO - handle non RGB colors
                        var rgb = gradx.get_rgb_obj(color);
                        gradx.cp.spectrum("set", rgb);
                    }
                }).click(function() {
                    gradx.load_info(this);
                    return false;
                });
            }


        },
        set_colorpicker: function(clr) {
            gradx.cp.spectrum({
                move: function(color) {
                    if (gradx.current_slider_id != false) {
                        var rgba = color.toRgbString();
                        gradx.$container.find(gradx.current_slider_id).css('background-color', rgba);
                        gradx.apply_default_styles();
                    }
                },
                change: function() {
                    gradx.$container.find(".gradx_slider_info").hide();
                },
                flat: true,
                showAlpha: true,
                color: clr,
                clickoutFiresChange: true,
                showInput: true,
                showButtons: false

            });
        },
        generate_options: function(options) {

            var len = options.length,
                    name, state,
                    str = '';

            for (var i = 0; i < len; i++) {

                name = options[i].split(" ");

                name = name[0];

                if (i < 2) {
                    state = name[1];
                } else {
                    state = '';
                }

                name = name.replace("-", " ");

                str += '<option value=' + options[i] + ' ' + state + '>' + name + '</option>';

            }

            return str;
        },
        generate_radial_options: function() {

            var options;
            options = ["horizontal-center disabled", "center selected", "left", "right"];
            this.$container.find('.gradx_gradient_subtype').html(gradx.generate_options(options));

            options = ["vertical-center disabled", "center selected", "top", "bottom"];
            this.$container.find('.gradx_gradient_subtype2').html(gradx.generate_options(options)).show();

        },
        generate_linear_options: function() {

            var options;
            options = ["horizontal-center disabled", "left selected", "right", "top", "bottom"];
            this.$container.find('.gradx_gradient_subtype').html(gradx.generate_options(options));

            this.$container.find('.gradx_gradient_subtype2').hide();

        },
        destroy: function() {
            var options = {
                target: '', //element selector -> string
                sliders: [],
                direction: 'left',
                //if linear left | top | right | bottom
                //if radial left | center | right , top | center | bottom
                type: 'linear', //linear | circle | ellipse
                code_shown: false, //false | true
                change: function(sliders, styles) {
                    //nothing to do here by default
                }
            };

            for (var k in options) {
                gradx[k] = options[k];
            }
        },
        load_gradx: function($container, sliders) {
            this.$container = $container;
            var id = this.id = gradx.get_random_number();

            this.current_slider_id = false;
            var html = "<div class='gradx'>\n\
                        <div class='row gradx_controls_row'>\n\
                            <div class='col-sm-2'>\n\
                                <div class='gradx_add_slider btn btn-sm btn-default' title='add stop'><i class='fa fa-plus'></i></div>\n\
                            </div>\n\
                            <div class='col-sm-3'>\n\
                                <div class='form-group'>\n\
                                    <select class='form-control input-sm gradx_gradient_type'>\n\
                                        <option value='linear'>Linear</option>\n\
                                        <option value='circle'>Radial - Circle</option>\n\
                                        <option value='ellipse'>Radial - Ellipse</option>\n\
                                    </select>\n\
                                </div>\n\
                            </div>\n\
                            <div class='col-sm-3'>\n\
                                <div class='form-group'>\n\
                                    <select class='form-control input-sm gradx_gradient_subtype'>\n\
                                        <option class='gradx_gradient_subtype_desc' value='gradient-direction' disabled>gradient direction</option>\n\
                                        <option value='left' selected>Left</option>\n\
                                        <option value='right'>Right</option>\n\
                                        <option value='top'>Top</option>\n\
                                        <option value='bottom'>Bottom</option>\n\
                                    </select>\n\
                                </div>\n\
                            </div>\n\
                            <div class='col-sm-3'>\n\
                                <div class='form-group'>\n\
                                    <select class='form-control input-sm gradx_gradient_subtype2 gradx_hide'>\n\
                                    </select>\n\
                                    <select class='form-control input-sm gradx_radial_gradient_size gradx_hide'>\n\
                                    </select>\n\
                                </div>\n\
                            </div>\n\
                        </div>\n\
                        <div class='gradx_container gradx_" + id + "'>\n\
                            <div class='gradx_stop_sliders_" + id + "'></div>\n\
                            <div class='gradx_panel gradx_panel_" + id + "'></div>\n\
                            <div class='gradx_start_sliders gradx_start_sliders_" + id + "'>\n\
                                <div class='cp-default gradx_slider_info'>\n\
                                    <div class='gradx_slider_controls'>\n\
                                        <div class='btn btn-default btn-xs gradx_delete_slider'><i class='fa fa-remove'></i></div>\n\
                                    </div>\n\
                                    <div class='gradx_slider_content'></div>\n\
                                </div> \n\
                            </div>\n\
                        </div>\n\
                    </div>";

            this.$container.html(html);
            this.$container.find('.gradx').css('width', gradx.width).css('height', gradx.height).data('gradx-id',id);


            //generates html to select the different gradient sizes
            // *only available for radial gradients
            var gradient_size_val = ["gradient-size disabled", "closest-side selected", "closest-corner", "farthest-side", "farthest-corner", "contain", "cover"],
                    option_str = '';


            option_str = gradx.generate_options(gradient_size_val);

            this.$container.find('.gradx_radial_gradient_size').html(option_str);


            //cache divs for fast reference

            // this.container = this.$container.find(".gradx_" + id);
            this.panel = this.$container.find(".gradx_panel_" + id);
            this.min_width = 26, // this.panel.offset().left;
            this.max_width = 426, // this.panel.offset().left + this.panel.offset().width;
            // this.height = 86;

            //.hide();
            //this.info.hide();
            this.container_width = 400 //HARDCODE;
            this.add_slider(sliders);

            gradx.add_event(document, 'click', function() {
                if (!gradx.slider_hovered[id]) {
                    gradx.$container.find(".gradx_slider_info").hide();
                    return false;
                }
            });

            this.$container.find('.gradx_add_slider').click(function() {
                gradx.add_slider([
                    {
                        color: gradx.get_random_rgb(),
                        position: gradx.get_random_position() //no % symbol
                    }
                ]);
                gradx.apply_default_styles();
            });

            //cache the element
            gradx.cp = this.$container.find('.gradx_slider_content');

            //call the colorpicker plugin
            gradx.set_colorpicker("blue");

            this.$container.find('.gradx_delete_slider').click(function() {
                if(gradx.slider_ids.length > 1){
                    gradx.$container.find(gradx.current_slider_id).remove();
                    gradx.$container.find(".gradx_slider_info").hide();
                    var id = gradx.current_slider_id.replace(".", "");

                    //remove all references from array for current deleted slider

                    for (var i = 0; i < gradx.slider_ids.length; i++) {
                        if (gradx.slider_ids[i] == id) {
                            gradx.slider_ids.splice(i, 1);
                        }
                    }

                    //apply modified style after removing the slider
                    gradx.apply_default_styles();

                    gradx.current_slider_id = false; //no slider is selected
                }else{
                    alert('Atleast one stop is required to generate a gradient');
                }
            });

            this.$container.find('.gradx_gradient_type').change(function() {

                var type = gradx.gx(this).val(), options, option_str = '';

                if (type !== "linear") {
                    //this.$container.find('.gradx_radial_gradient_size').show();

                    gradx.generate_radial_options();
                } else {

                    gradx.generate_linear_options();
                    gradx.$container.find('.gradx_gradient_subtype').val("left");
                }

                gradx.type = type;
                gradx.direction = gradx.$container.find('.gradx_gradient_subtype').val();


                gradx.apply_style(gradx.panel, gradx.get_style_value());//(where,style)
            });

            //change type onload userdefined
            if (this.type !== "linear") {
                this.$container.find('.gradx_gradient_type').val(this.type);
                gradx.generate_radial_options();

                var h, v;

                if (this.direction !== 'left') {
                    //user has passed his own direction
                    var center;
                    if (this.direction.indexOf(",") > -1) {
                        center = this.direction.split(",");
                    } else {
                        //tolerate user mistakes
                        center = this.direction.split(" ");
                    }

                    h = center[0];
                    v = center[1];

                    //update the center points in the corr. select boxes
                    this.$container.find('.gradx_gradient_subtype').val(h);
                    this.$container.find('.gradx_gradient_subtype2').val(v);
                } else {
                    var h = this.$container.find('.gradx_gradient_subtype').val();
                    var v = this.$container.find('.gradx_gradient_subtype2').val();
                }

                gradx.direction = h + " " + v;
                gradx.apply_style(gradx.panel, gradx.get_style_value());//(where,style)
            } else {

                //change direction if not left
                if (this.direction !== 'left') {
                    this.$container.find('.gradx_gradient_subtype').val(this.direction);
                }
            }

            this.$container.find('.gradx_gradient_subtype').change(function() {

                if (gradx.type === 'linear') {
                    gradx.direction = gradx.gx(this).val();
                } else {
                    var h = gradx.gx(this).val();
                    var v = gradx.$container.find('.gradx_gradient_subtype2').val();
                    gradx.direction = h + " " + v;
                }
                gradx.apply_style(gradx.panel, gradx.get_style_value());//(where,style)

            });

            this.$container.find('.gradx_gradient_subtype2').change(function() {

                var h = gradx.$container.find('.gradx_gradient_subtype').val();
                var v = gradx.gx(this).val();
                gradx.direction = h + " " + v;
                gradx.apply_style(gradx.panel, gradx.get_style_value());//(where,style)

            });

            //not visible
            this.$container.find('.gradx_radial_gradient_size').change(function() {

                gradx.shape = gradx.gx(this).val();
                gradx.apply_style(gradx.panel, gradx.get_style_value());//(where,style)

            });

            this.$container.on('mouseout', '.gradx_slider_info', function() {
                gradx.slider_hovered[id] = false;
            });

            this.$container.on('mouseover', '.gradx_slider_info', function() {
                gradx.slider_hovered[id] = true;
            });

        }

    };



    function  add_event(element, event, event_function)
    {
        if (element.attachEvent) //Internet Explorer
            element.attachEvent("on" + event, function() {
                event_function.call(element);
            });
        else if (element.addEventListener) //Firefox & company
            element.addEventListener(event, event_function, false); //don't need the 'call' trick because in FF everything already works in the right way
    };

    //load jQuery library into gradx.gx
    gradx.load_jQ();

    /* merge _options into options */
    gradx.gx.extend(options, _options);

    //apply options to gradx object

    // initialize $target
    if(typeof(options.target) == 'string'){
        options.$target = gradx.gx(options.target);
    }else if(options.target instanceof(jQuery)){
        options.$target = options.target;
    }

    if(options.$target == undefined || options.$target == null || options.$target.length == 0){
        throw 'target invalid';
    }

    // initialize $container

    if(typeof(container) == 'string'){
        options.$container = gradx.gx(container);
    }else if(container instanceof(jQuery)){
        options.$container = container;
    }

    if(options.$container == undefined || options.$container == null || options.$container.length == 0){
        throw 'container invalid';
    }

    for (var k in options) {
        //load the options into gradx object
        gradx[k] = options[k];
    }

    gradx.load_gradx(options.$container, gradx.sliders);
    gradx.apply_default_styles();
};
