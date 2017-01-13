/**
 * Display a nice easy to use multiselect list
 * @Version: 2.3.6
 * @Author: Patrick Springstubbe
 * @Contact: @JediNobleclem
 * @Website: springstubbe.us
 * @Source: https://github.com/nobleclem/jQuery-MultiSelect
 * @Notes: If select list is hidden on page load use the jquery.actual plugin
 *         to resolve issues with preselected items placeholder text
 *         https://github.com/dreamerslab/jquery.actual
 *
 * Usage:
 *     $('select[multiple]').multiselect();
 *     $('select[multiple]').multiselect({ texts: { placeholder: 'Select options' } });
 *     $('select[multiple]').multiselect('reload');
 *     $('select[multiple]').multiselect( 'loadOptions', [{
 *         name   : 'Option Name 1',
 *         value  : 'option-value-1',
 *         checked: false,
 *         attributes : {
 *             custom1: 'value1',
 *             custom2: 'value2'
 *         }
 *     },{
 *         name   : 'Option Name 2',
 *         value  : 'option-value-2',
 *         checked: false,
 *         attributes : {
 *             custom1: 'value1',
 *             custom2: 'value2'
 *         }
 *     }]);
 *
 **/
(function($){
    var defaults = {
        columns       : 1,                // how many columns should be use to show options
        search        : false,            // include option search box
        // search filter options
        searchOptions : {
            delay        : 250,                  // time (in ms) between keystrokes until search happens
            showOptGroups: false,                // show option group titles if no options remaining
            onSearch     : function( element ){} // fires on keyup before search on options happens
        },
        texts: {
            placeholder:     'Select options', // text to use in dummy input
            search:          'Search',         // search input placeholder text
            selectedOptions: ' selected',      // selected suffix text
            selectAll:       'Select all',     // select all text
            unselectAll:     'Unselect all',   // unselect all text
            noneSelected:    'None Selected'   // None selected text
        },
        selectAll     : false, // add select all option
        selectGroup   : false, // select entire optgroup
        minHeight     : 200,   // minimum height of option overlay
        maxHeight     : null,  // maximum height of option overlay
        showCheckbox  : true,  // display the checkbox to the user
        jqActualOpts  : {},    // options for jquery.actual
        optionAttributes: [],  // attributes to copy to the checkbox from the option element

        // Callbacks
        onLoad        : function( element ) {},  // fires at end of list initialization
        onOptionClick : function( element, option ){}, // fires when an option is clicked
        onControlClose: function( element ){}, // fires when the options list is closed

        // @NOTE: these are for future development
        maxWidth      : null,  // maximum width of option overlay (or selector)
        minSelect     : false, // minimum number of items that can be selected
        maxSelect     : false, // maximum number of items that can be selected
    };

    var msCounter = 1;

    // FOR LEGACY BROWSERS (talking to you IE8)
    if( typeof Array.prototype.map !== 'function' ) {
        Array.prototype.map = function( callback, thisArg ) {
            if( typeof thisArg === 'undefined' ) {
                thisArg = this;
            }

            return $.isArray( thisArg ) ? $.map( thisArg, callback ) : [];
        };
    }
    if( typeof String.prototype.trim !== 'function' ) {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '');
        }
    }

    function MultiSelect( element, options )
    {
        this.element = element;
        this.options = $.extend( true, {}, defaults, options );
        this.updatePlaceholder = true;

        /** BACKWARDS COMPATIBILITY **/
        if( 'placeholder' in this.options ) {
            this.options.texts.placeholder = this.options.placeholder;
            delete this.options.placeholder;
        }
        if( 'default' in this.options.searchOptions ) {
            this.options.texts.search = this.options.searchOptions['default'];
            delete this.options.searchOptions['default'];
        }
        /** END BACKWARDS COMPATIBILITY **/

        // load this instance
        this.load();
    }

    MultiSelect.prototype = {
        /* LOAD CUSTOM MULTISELECT DOM/ACTIONS */
        load: function() {
            var instance = this;

            // make sure this is a select list and not loaded
            if( (instance.element.nodeName != 'SELECT') || $(instance.element).hasClass('jqmsLoaded') ) {
                return true;
            }

            // sanity check so we don't double load on a select element
            $(instance.element).addClass('jqmsLoaded').data( 'plugin_multiselect-instance', instance );

            // add option container
            $(instance.element).after('<div class="ms-options-wrap"><button>None Selected</button><div class="ms-options"><ul></ul></div></div>');

            var placeholder = $(instance.element).next('.ms-options-wrap').find('> button:first-child');
            var optionsWrap = $(instance.element).next('.ms-options-wrap').find('> .ms-options');
            var optionsList = optionsWrap.find('> ul');
            var hasOptGroup = $(instance.element).find('optgroup').length ? true : false;

            // don't show checkbox (add class for css to hide checkboxes)
            if( !instance.options.showCheckbox ) {
                optionsWrap.addClass('hide-checkbox');
            }

            // determine maxWidth
            var maxWidth = null;
            if( typeof instance.options.width == 'number' ) {
                optionsWrap.parent().css( 'position', 'relative' );
                maxWidth = instance.options.width;
            }
            else if( typeof instance.options.width == 'string' ) {
                $( instance.options.width ).css( 'position', 'relative' );
                maxWidth = '100%';
            }
            else {
                optionsWrap.parent().css( 'position', 'relative' );
            }

            // cacl default maxHeight
            var maxHeight = ($(window).height() - optionsWrap.offset().top + $(window).scrollTop() - 20);

            // override with user defined maxHeight
            if( instance.options.maxHeight ) {
                maxHeight = instance.options.maxHeight;
            }

            // maxHeight cannot be less than options.minHeight
            maxHeight = maxHeight < instance.options.minHeight ? instance.options.minHeight : maxHeight;

            optionsWrap.css({
                maxWidth : maxWidth,
                minHeight: instance.options.minHeight,
                maxHeight: maxHeight,
                overflow : 'auto'
            }).hide();

            // isolate options scroll
            // @source: https://github.com/nobleclem/jQuery-IsolatedScroll
            optionsWrap.bind( 'touchmove mousewheel DOMMouseScroll', function ( e ) {
                if( ($(this).outerHeight() < $(this)[0].scrollHeight) ) {
                    var e0 = e.originalEvent,
                        delta = e0.wheelDelta || -e0.detail;

                    if( ($(this).outerHeight() + $(this)[0].scrollTop) > $(this)[0].scrollHeight ) {
                        e.preventDefault();
                        this.scrollTop += ( delta < 0 ? 1 : -1 );
                    }
                }
            });

            // hide options menus if click happens off of the list placeholder button
            $(document).off('click.ms-hideopts').on('click.ms-hideopts', function( event ){
                if( !$(event.target).closest('.ms-options-wrap').length ) {
                    if( $('.ms-options-wrap > .ms-options:visible').length ) {
                        $('.ms-options-wrap > .ms-options:visible').each(function(){
                            $(this).hide();

                            var thisInst = $(this).parent().prev('.jqmsLoaded').data('plugin_multiselect-instance');

                            // USER CALLBACK
                            if( typeof thisInst.options.onControlClose == 'function' ) {
                                thisInst.options.onControlClose( thisInst.element );
                            }
                        });
                    }
                }
            });

            // disable button action
            placeholder.bind('mousedown',function( event ){
                // ignore if its not a left click
                if( event.which != 1 ) {
                    return true;
                }

                // hide other menus before showing this one
                $('.ms-options-wrap > .ms-options:visible').each(function(){
                    if( $(this).parent().prev()[0] != optionsWrap.parent().prev()[0] ) {
                        $(this).hide();

                        var thisInst = $(this).parent().prev('.jqmsLoaded').data('plugin_multiselect-instance');

                        // USER CALLBACK
                        if( typeof thisInst.options.onControlClose == 'function' ) {
                            thisInst.options.onControlClose( thisInst.element );
                        }
                    }
                });

                // show/hide options
                optionsWrap.toggle();

                // recalculate height
                if( optionsWrap.is(':visible') ) {
                    optionsWrap.css( 'maxHeight', '' );

                    // cacl default maxHeight
                    var maxHeight = ($(window).height() - optionsWrap.offset().top + $(window).scrollTop() - 20);

                    // override with user defined maxHeight
                    if( instance.options.maxHeight ) {
                        maxHeight = instance.options.maxHeight;
                    }

                    // maxHeight cannot be less than options.minHeight
                    maxHeight = maxHeight < instance.options.minHeight ? instance.options.minHeight : maxHeight;

                    optionsWrap.css( 'maxHeight', maxHeight );
                }
                else if( typeof instance.options.onControlClose == 'function' ) {
                    instance.options.onControlClose( instance.element );
                }
            }).click(function( event ){ event.preventDefault(); });

            // add placeholder copy
            if( instance.options.texts.placeholder ) {
                placeholder.text( instance.options.texts.placeholder );
            }

            // add search box
            if( instance.options.search ) {
                optionsList.before('<div class="ms-search"><input type="text" value="" placeholder="'+ instance.options.texts.search +'" /></div>');

                var search = optionsWrap.find('.ms-search input');
                search.on('keyup', function(){
                    // ignore keystrokes that don't make a difference
                    if( $(this).data('lastsearch') == $(this).val() ) {
                        return true;
                    }

                    // pause timeout
                    if( $(this).data('searchTimeout') ) {
                        clearTimeout( $(this).data('searchTimeout') );
                    }

                    var thisSearchElem = $(this);

                    $(this).data('searchTimeout', setTimeout(function(){
                        thisSearchElem.data('lastsearch', thisSearchElem.val() );

                        // USER CALLBACK
                        if( typeof instance.options.searchOptions.onSearch == 'function' ) {
                            instance.options.searchOptions.onSearch( instance.element );
                        }

                        // search non optgroup li's
                        optionsList.find('li:not(.optgroup)').each(function(){
                            var optText = $(this).text();

                            // show option if string exists
                            if( optText.toLowerCase().indexOf( search.val().toLowerCase() ) > -1 ) {
                                $(this).show();
                            }
                            // don't hide selected items
                            else if( !$(this).hasClass('selected') ) {
                                $(this).hide();
                            }

                            // hide / show optgroups depending on if options within it are visible
                            var optGroup = $(this).closest('li.optgroup');
                            if( !instance.options.searchOptions.showOptGroups && optGroup ) {
                                optGroup.show();

                                if( optGroup.find('li:visible').length ) {
                                    optGroup.show();
                                }
                                else {
                                    optGroup.hide();
                                }
                            }
                        });

                        instance._updateSelectAllText();
                    }, instance.options.searchOptions.delay ));
                });
            }

            // add global select all options
            if( instance.options.selectAll ) {
                optionsList.before('<a href="#" class="ms-selectall global">' + instance.options.texts.selectAll + '</a>');
            }

            // handle select all option
            optionsWrap.on('click', '.ms-selectall', function( event ){
                event.preventDefault();

                instance.updatePlaceholder = false;

                if( $(this).hasClass('global') ) {
                    // check if any options are not selected if so then select them
                    if( optionsList.find('li:not(.optgroup)').filter(':not(.selected)').filter(':visible').length ) {
                        optionsList.find('li:not(.optgroup)').filter(':not(.selected)').filter(':visible').find('input[type="checkbox"]').trigger('click');
                    }
                    // deselect everything
                    else {
                        optionsList.find('li:not(.optgroup).selected:visible input[type="checkbox"]').trigger('click');
                    }
                }
                else if( $(this).closest('li').hasClass('optgroup') ) {
                    var optgroup = $(this).closest('li.optgroup');

                    // check if any selected if so then select them
                    if( optgroup.find('li:not(.selected)').filter(':visible').length ) {
                        optgroup.find('li:not(.selected):visible input[type="checkbox"]').trigger('click');
                    }
                    // deselect everything
                    else {
                        optgroup.find('li.selected:visible input[type="checkbox"]').trigger('click');
                    }
                }

                instance._updateSelectAllText();

                instance.updatePlaceholder = true;

                instance._updatePlaceholderText();
            });

            // add options to wrapper
            var options = [];
            $(instance.element).children().each(function(){
                if( this.nodeName == 'OPTGROUP' ) {
                    var groupOptions = [];

                    $(this).children('option').each(function(){
                        var thisOptionAtts = {};
                        for( var i = 0; i < instance.options.optionAttributes.length; i++ ) {
                            var thisOptAttr = instance.options.optionAttributes[ i ];

                            if( $(this).attr( thisOptAttr ) !== undefined ) {
                                thisOptionAtts[ thisOptAttr ] = $(this).attr( thisOptAttr );
                            }
                        }

                        groupOptions.push({
                            name   : $(this).text(),
                            value  : $(this).val(),
                            checked: $(this).prop( 'selected' ),
                            attributes: thisOptionAtts
                        });
                    });

                    options.push({
                        label  : $(this).attr('label'),
                        options: groupOptions
                    });
                }
                else if( this.nodeName == 'OPTION' ) {
                    var thisOptionAtts = {};
                    for( var i = 0; i < instance.options.optionAttributes.length; i++ ) {
                        var thisOptAttr = instance.options.optionAttributes[ i ];

                        if( $(this).attr( thisOptAttr ) !== undefined ) {
                            thisOptionAtts[ thisOptAttr ] = $(this).attr( thisOptAttr );
                        }
                    }

                    options.push({
                        name      : $(this).text(),
                        value     : $(this).val(),
                        checked   : $(this).prop( 'selected' ),
                        attributes: thisOptionAtts
                    });
                }
                else {
                    // bad option
                    return true;
                }
            });
            instance.loadOptions( options, true, false );

            // update un/select all logic
            instance._updateSelectAllText( false );

            // BIND SELECT ACTION
            optionsWrap.on( 'click', 'input[type="checkbox"]', function(){
                $(this).closest( 'li' ).toggleClass( 'selected' );

                var select = optionsWrap.parent().prev();

                // toggle clicked option
                select.find('option[value="'+ $(this).val() +'"]').prop(
                    'selected', $(this).is(':checked')
                ).closest('select').trigger('change');

                // USER CALLBACK
                if( typeof instance.options.onOptionClick == 'function' ) {
                    instance.options.onOptionClick(instance.element, this);
                }

                instance._updatePlaceholderText();
            });

            // BIND FOCUS EVENT
            optionsWrap.on('focusin', 'input[type="checkbox"]', function(){
                $(this).closest('label').addClass('focused');
            }).on('focusout', 'input[type="checkbox"]', function(){
                $(this).closest('label').removeClass('focused');
            });

            // USER CALLBACK
            if( typeof instance.options.onLoad === 'function' ) {
                instance.options.onLoad( instance.element );
            }

            // hide native select list
            $(instance.element).hide();
        },

        /* LOAD SELECT OPTIONS */
        loadOptions: function( options, overwrite, updateSelect ) {
            overwrite    = (typeof overwrite == 'boolean') ? overwrite : true;
            updateSelect = (typeof updateSelect == 'boolean') ? updateSelect : true;

            var instance    = this;
            var optionsList = $(instance.element).next('.ms-options-wrap').find('> .ms-options > ul');
            var optionsWrap = $(instance.element).next('.ms-options-wrap').find('> .ms-options');
            var select      = optionsWrap.parent().prev();

            if( overwrite ) {
                optionsList.find('> li').remove();

                if( updateSelect ) {
                    select.find('> *').remove();
                }
            }

            for( var key in options ) {
                // Prevent prototype methods injected into options from being iterated over.
                if( !options.hasOwnProperty( key ) ) {
                    continue;
                }

                var thisOption      = options[ key ];
                var container       = $('<li></li>');
                var appendContainer = true;

                // OPTGROUP
                if( thisOption.hasOwnProperty('options') ) {
                    optionsList.find('> li.optgroup > span.label').each(function(){
                        if( $(this).text() == thisOption.label ) {
                            container       = $(this).closest('.optgroup');
                            appendContainer = false;
                        }
                    });

                    // prepare to append optgroup to select element
                    if( updateSelect ) {
                        if( select.find('optgroup[label="'+ thisOption.label +'"]').length ) {
                            var optGroup = select.find('optgroup[label="'+ thisOption.label +'"]');
                        }
                        else {
                            var optGroup = $('<optgroup label="'+ thisOption.label +'"></optgroup>');
                                select.append( optGroup );
                        }
                    }

                    // setup container
                    if( appendContainer ) {
                        container.addClass('optgroup');
                        container.append('<span class="label">'+ thisOption.label +'</span>');
                        container.find('> .label').css({
                            clear: 'both'
                        });

                        // add select all link
                        if( instance.options.selectGroup ) {
                            container.append('<a href="#" class="ms-selectall">' + instance.options.texts.selectAll + '</a>')
                        }

                        container.append('<ul></ul>');
                    }

                    for( var gKey in thisOption.options ) {
                        // Prevent prototype methods injected into options from
                        // being iterated over.
                        if( !thisOption.options.hasOwnProperty( gKey ) ) {
                            continue;
                        }

                        var thisGOption = thisOption.options[ gKey ];
                        var gContainer  = $('<li></li>').addClass('ms-reflow');

                        instance._addOption( gContainer, thisGOption );

                        container.find('> ul').append( gContainer );

                        // add option to optgroup in select element
                        if( updateSelect ) {
                            var selOption = $('<option value="'+ thisGOption.value +'">'+ thisGOption.name +'</option>');

                            // add custom user attributes
                            if( thisGOption.hasOwnProperty('attributes') && Object.keys( thisGOption.attributes ).length ) {
                                //selOption.attr( thisGOption.attributes );
                            }

                            // mark option as selected
                            if( thisGOption.checked ) {
                                selOption.prop( 'selected', true );
                            }

                            optGroup.append( selOption );
                        }
                    }
                }
                // OPTION
                else if( thisOption.hasOwnProperty('value') ) {
                    container.addClass('ms-reflow')

                    // add option to ms dropdown
                    instance._addOption( container, thisOption );

                    if( updateSelect ) {
                        var selOption = $('<option value="'+ thisOption.value +'">'+ thisOption.name +'</option>');

                        // add custom user attributes
                        if( thisOption.hasOwnProperty('attributes') && Object.keys( thisOption.attributes ).length ) {
                            selOption.attr( thisOption.attributes );
                        }

                        // mark option as selected
                        if( thisOption.checked ) {
                            selOption.prop( 'selected', true );
                        }

                        select.append( selOption );
                    }
                }

                if( appendContainer ) {
                    optionsList.append( container );
                }
            }

            optionsList.find('.ms-reflow input[type="checkbox"]').each(function( idx ){
                if( $(this).css('display').match(/block$/) ) {
                    var checkboxWidth = $(this).outerWidth();
                        checkboxWidth = checkboxWidth ? checkboxWidth : 15;

                    $(this).closest('label').css(
                        'padding-left',
                        (parseInt( $(this).closest('label').css('padding-left') ) * 2) + checkboxWidth
                    );

                    $(this).closest('.ms-reflow').removeClass('ms-reflow');
                }
            });

            // update placeholder text
            instance._updatePlaceholderText();

            // RESET COLUMN STYLES
            optionsWrap.find('ul').css({
                'column-count'        : '',
                'column-gap'          : '',
                '-webkit-column-count': '',
                '-webkit-column-gap'  : '',
                '-moz-column-count'   : '',
                '-moz-column-gap'     : ''
            });

            // COLUMNIZE
            if( select.find('optgroup').length ) {
                // float non grouped options
                optionsList.find('> li:not(.optgroup)').css({
                    'float': 'left',
                    width: (100 / instance.options.columns) +'%'
                });

                // add CSS3 column styles
                optionsList.find('li.optgroup').css({
                    clear: 'both'
                }).find('> ul').css({
                    'column-count'        : instance.options.columns,
                    'column-gap'          : 0,
                    '-webkit-column-count': instance.options.columns,
                    '-webkit-column-gap'  : 0,
                    '-moz-column-count'   : instance.options.columns,
                    '-moz-column-gap'     : 0
                });

                // for crappy IE versions float grouped options
                if( this._ieVersion() && (this._ieVersion() < 10) ) {
                    optionsList.find('li.optgroup > ul > li').css({
                        'float': 'left',
                        width: (100 / instance.options.columns) +'%'
                    });
                }
            }
            else {
                // add CSS3 column styles
                optionsList.css({
                    'column-count'        : instance.options.columns,
                    'column-gap'          : 0,
                    '-webkit-column-count': instance.options.columns,
                    '-webkit-column-gap'  : 0,
                    '-moz-column-count'   : instance.options.columns,
                    '-moz-column-gap'     : 0
                });

                // for crappy IE versions float grouped options
                if( this._ieVersion() && (this._ieVersion() < 10) ) {
                    optionsList.find('> li').css({
                        'float': 'left',
                        width: (100 / instance.options.columns) +'%'
                    });
                }
            }
        },

        /* UPDATE MULTISELECT CONFIG OPTIONS */
        settings: function( options ) {
            this.options = $.extend( true, {}, this.options, options );
            this.reload();
        },

        /* RESET THE DOM */
        unload: function() {
            $(this.element).next('.ms-options-wrap').remove();
            $(this.element).show(function(){
                $(this).css('display','').removeClass('jqmsLoaded');
            });
        },

        /* RELOAD JQ MULTISELECT LIST */
        reload: function() {
            // remove existing options
            $(this.element).next('.ms-options-wrap').remove();
            $(this.element).removeClass('jqmsLoaded');

            // load element
            this.load();
        },

        // RESET BACK TO DEFAULT VALUES & RELOAD
        reset: function() {
            var defaultVals = [];
            $(this.element).find('option').each(function(){
                if( $(this).prop('defaultSelected') ) {
                    defaultVals.push( $(this).val() );
                }
            });

            $(this.element).val( defaultVals );

            this.reload();
        },

        /** PRIVATE FUNCTIONS **/
        // update the un/select all texts based on selected options and visibility
        _updateSelectAllText: function( visibleOnly ){
            if( typeof visibleOnly !== 'boolean' ) {
                visibleOnly = true;
            }

            var instance = this;

            // select all not used at all so just do nothing
            if( !instance.options.selectAll && !instance.options.selectGroup ) {
                return;
            }

            var optionsWrap = $(instance.element).next('.ms-options-wrap').find('> .ms-options');

            // update un/select all text
            optionsWrap.find('.ms-selectall').each(function(){
                var unselected = $(this).parent().find('li:not(.optgroup)').filter(':not(.selected)');

                // filter out visible options
                if( visibleOnly ) {
                    unselected = unselected.filter(':visible');
                }

                $(this).text(
                    unselected.length ? instance.options.texts.selectAll : instance.options.texts.unselectAll
                );
            });
        },

        // update selected placeholder text
        _updatePlaceholderText: function(){
            if( !this.updatePlaceholder ) {
                return;
            }

            var instance    = this;
            var placeholder = $(instance.element).next('.ms-options-wrap').find('> button:first-child');
            var optionsWrap = $(instance.element).next('.ms-options-wrap').find('> .ms-options');
            var select      = optionsWrap.parent().prev();

            // get selected options
            var selOpts = [];
            select.find('option:selected').each(function(){
                selOpts.push( $(this).text() );
            });

            // UPDATE PLACEHOLDER TEXT WITH OPTIONS SELECTED
            placeholder.text( selOpts.join( ', ' ) );
            var copy = placeholder.clone().css({
                display   : 'inline',
                width     : 'auto',
                visibility: 'hidden'
            }).appendTo( optionsWrap.parent() );

            // if the jquery.actual plugin is loaded use it to get the widths
            var copyWidth  = (typeof $.fn.actual !== 'undefined') ? copy.actual( 'width', instance.options.jqActualOpts ) : copy.width();
            var placeWidth = (typeof $.fn.actual !== 'undefined') ? placeholder.actual( 'width', instance.options.jqActualOpts ) : placeholder.width();

            // if copy is larger than button width use "# selected"
            if( copyWidth > placeWidth ) {
                placeholder.text( selOpts.length + instance.options.texts.selectedOptions );
            }
            // if options selected then use those
            else if( selOpts.length ) {
                // trim each element in case of extra spaces
                placeholder.text(
                    selOpts.map(function( element ){
                        return element.trim();
                    }).join(', ')
                );
            }
            // replace placeholder text
            else {
                placeholder.text( instance.options.texts.placeholder );
            }

            // remove dummy element
            copy.remove();
        },

        // Add option to the custom dom list
        _addOption: function( container, option ) {
            container.text( option.name );

            var thisCheckbox = $('<input type="checkbox" value="" title="" />')
                .val( option.value )
                .attr( 'title', option.name )
                .attr( 'id', 'ms-opt-'+ msCounter );

            // add user defined attributes
            if( option.hasOwnProperty('attributes') && Object.keys( option.attributes ).length ) {
                thisCheckbox.attr( option.attributes );
            }

            container.prepend( thisCheckbox );

            if( option.checked ) {
                container.addClass('default');
                container.addClass('selected');
                container.find( 'input[type="checkbox"]' ).prop( 'checked', true );
            }

            var label = $('<label></label>').attr( 'for', 'ms-opt-'+ msCounter );
            container.wrapInner( label );

            msCounter = msCounter + 1;
        },

        // check ie version
        _ieVersion: function() {
            var myNav = navigator.userAgent.toLowerCase();
            return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
        }
    };

    // ENABLE JQUERY PLUGIN FUNCTION
    $.fn.multiselect = function( options ){
        var args = arguments;
        var ret;

        // menuize each list
        if( (options === undefined) || (typeof options === 'object') ) {
            return this.each(function(){
                if( !$.data( this, 'plugin_multiselect' ) ) {
                    $.data( this, 'plugin_multiselect', new MultiSelect( this, options ) );
                }
            });
        } else if( (typeof options === 'string') && (options[0] !== '_') && (options !== 'init') ) {
            this.each(function(){
                var instance = $.data( this, 'plugin_multiselect' );

                if( instance instanceof MultiSelect && typeof instance[ options ] === 'function' ) {
                    ret = instance[ options ].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }

                // special destruct handler
                if( options === 'unload' ) {
                    $.data( this, 'plugin_multiselect', null );
                }
            });

            return ret;
        }
    };
}(jQuery));
