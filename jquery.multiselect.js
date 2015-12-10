/**
 * Display a nice easy to use multiselect list
 * @Version: 1.4.1
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
 *     $('select[multiple]').multiselect({ placeholder: 'Select options' });
 *
 **/
(function($){
    var msCounter = 1;
    $.fn.multiselect = function( options ){
        var defaults = {
            placeholder   : 'Select options', // text to use in dummy input
            columns       : 1,                // how many columns should be use to show options
            search        : false,            // include option search box
            // search filter options
            searchOptions : {
                'default'    : 'Search', // search input placeholder text
                showOptGroups: false     // show option group titles if no options remaining
            },
            selectAll     : false, // add select all option
            selectGroup   : false, // select entire optgroup
            minHeight     : 200,   // minimum height of option overlay
            maxHeight     : null,  // maximum height of option overlay
            showCheckbox  : true,  // display the checkbox to the user
            jqActualOpts  : {},    // options for jquery.actual

            // @NOTE: these are for future development
            maxWidth      : null,  // maximum width of option overlay (or selector)
            minSelect     : false, // minimum number of items that can be selected
            maxSelect     : false, // maximum number of items that can be selected
        }
        options = $.extend( defaults, options );

        var func = {
            addOption: function( container, option )
            {
                container.text( $(option).text() );
                container.prepend(
                    $('<input type="checkbox" value="" title="" />')
                        .val( $(option).val() )
                        .attr( 'title', $(option).text() )
                        .attr( 'id', 'ms-opt-'+ msCounter )
                );

                if( $(option).prop( 'selected' ) ) {
                    container.addClass('default');
                    container.addClass('selected');
                    container.find( 'input[type="checkbox"]' ).prop( 'checked', true );
                }

                var label = $('<label></label>').attr( 'for', 'ms-opt-'+ msCounter );
                container.wrapInner( label );


                if( !options.showCheckbox ) {
                    container.find('input[id="ms-opt-'+ msCounter +'"]').hide();
                }

                msCounter = msCounter + 1;
            },

            ieVersion: function()
            {
                var myNav = navigator.userAgent.toLowerCase();
                return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
            }
        };

        // menuize each list
        return this.each(function(){
            // make sure this is a select list and not loaded
            if( this.nodeName != 'SELECT' || $(this).hasClass('jqmsLoaded') ) {
                return true;
            }

            // sanity check so we don't double load on a select element
            $(this).addClass('jqmsLoaded');

            // add option container
            $(this).after('<div class="ms-options-wrap"><button>None Selected</button><div class="ms-options"><ul></ul></div></div>');
            var placeholder = $(this).next('.ms-options-wrap').find('> button:first-child');
            var optionsWrap = $(this).next('.ms-options-wrap').find('> .ms-options');
            var optionsList = optionsWrap.find('> ul');
            var hasOptGroup = $(this).find('optgroup').length ? true : false;

            var maxWidth = null;
            if( typeof options.width == 'number' ) {
                optionsWrap.parent().css( 'position', 'relative' );
                maxWidth = options.width;
            }
            else if( typeof options.width == 'string' ) {
                $( options.width ).css( 'position', 'relative' );
                maxWidth = '100%';
            }
            else {
                optionsWrap.parent().css( 'position', 'relative' );
            }

            var maxHeight = ($(window).height() - optionsWrap.offset().top - 20);
            if( options.maxHeight ) {
                maxHeight = ($(window).height() - optionsWrap.offset().top - 20);
                maxHeight = maxHeight < options.minHeight ? options.minHeight : maxheight;
            }

            maxHeight = maxHeight < options.minHeight ? options.minHeight : maxHeight;

            optionsWrap.css({
                maxWidth : maxWidth,
                minHeight: options.minHeight,
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
                    $('.ms-options-wrap > .ms-options:visible').hide();
                }
            });

            // disable button action
            placeholder.bind('mousedown',function(){
                // hide other menus before showing this one
                $('.ms-options-wrap > .ms-options:visible').each(function(){
                    if( $(this).parent().prev()[0] != optionsWrap.parent().prev()[0] ) {
                        $(this).hide();
                    }
                });

                // show/hide options
                optionsWrap.toggle();

                // recalculate height
                if( optionsWrap.is(':visible') ) {
                    optionsWrap.css( 'maxHeight', '' );

                    var maxHeight = ($(window).height() - optionsWrap.offset().top - 20);
                    if( options.maxHeight ) {
                        maxHeight = ($(window).height() - optionsWrap.offset().top - 20);
                        maxHeight = maxHeight < options.minHeight ? options.minHeight : maxheight;
                    }
                    maxHeight = maxHeight < options.minHeight ? options.minHeight : maxHeight;

                    optionsWrap.css( 'maxHeight', maxHeight );
                }
            }).click(function( event ){ event.preventDefault(); });

            // add placeholder copy
            if( options.placeholder ) {
                placeholder.text( options.placeholder );
            }

            // add search box
            if( options.search ) {
                optionsList.before('<div class="ms-search"><input type="text" value="" placeholder="'+ options.searchOptions['default'] +'" /></div>');

                var search = optionsWrap.find('.ms-search input');
                search.on('keyup', function(){
                    optionsList.find('li:not(.optgroup)').each(function(){
                        var optText = $(this).text();

                        if( optText.toLowerCase().indexOf( search.val().toLowerCase() ) > -1 ) {
                            $(this).show();
                        }
                        // don't hide selected items
                        else if( !$(this).hasClass('selected') ) {
                            $(this).hide();
                        }

                        if( !options.searchOptions.showOptGroups && $(this).closest('li.optgroup') ) {
                            $(this).closest('li.optgroup').show();

                            if( $(this).closest('li.optgroup').find('li:visible').length ) {
                                $(this).closest('li.optgroup').show();
                            }
                            else {
                                $(this).closest('li.optgroup').hide();
                            }
                        }
                    });
                });
            }

            // add global select all options
            if( options.selectAll ) {
                optionsList.before('<a href="#" class="ms-selectall global">Select all</a>');

                var globalSelectAll = optionsWrap.find('.ms-selectall.global');
            }

            // handle select all option
            optionsWrap.on('click', '.ms-selectall', function( event ){
                event.preventDefault();

                if( $(this).hasClass('global') ) {
                    // check if any selected if so then select them
                    if( optionsList.find('li:not(.optgroup)').filter(':not(.selected)').length ) {
                        optionsList.find('li:not(.optgroup)').filter(':not(.selected)').find('input[type="checkbox"]').trigger('click');
                    }
                    // deselect everything
                    else {
                        optionsList.find('li:not(.optgroup).selected input[type="checkbox"]').trigger('click');
                    }
                }
                else if( $(this).closest('li').hasClass('optgroup') ) {
                    var optgroup = $(this).closest('li.optgroup');

                    // check if any selected if so then select them
                    if( optgroup.find('li:not(.selected)').length ) {
                        optgroup.find('li:not(.selected) input[type="checkbox"]').trigger('click');
                    }
                    // deselect everything
                    else {
                        optgroup.find('li.selected input[type="checkbox"]').trigger('click');
                    }
                }
            });

            // hide native select list
            $(this).hide();

            // add options to wrapper
            $(this).children().each(function(){
                var container = $('<li></li>');

                // add group of items
                if( this.nodeName == 'OPTGROUP' ) {
                    container.addClass('optgroup');
                    container.append('<span class="label">'+ $(this).attr('label') +'</span>');
                    container.find('> .label').css({
                        clear: 'both'
                    });

                    if( options.selectGroup ) {
                        container.append('<a href="#" class="ms-selectall">Select all</a>');
                    }

                    container.append('<ul></ul>');

                    $(this).children('option').each(function(){
                        var gContainer = $('<li></li>');
                        func.addOption( gContainer, this );

                        container.find('> ul').append( gContainer );
                    });
                }
                else if( this.nodeName == 'OPTION' ) {
                    func.addOption( container, this );
                }
                else {
                    // bad option
                    return true;
                }

                optionsList.append( container );
            });

            // COLUMNIZE
            if( hasOptGroup ) {
                // float non grouped options
                optionsList.find('> li:not(.optgroup)').css({
                    float: 'left',
                    width: (100 / options.columns) +'%'
                });

                // add CSS3 column styles
                optionsList.find('li.optgroup').css({
                    clear: 'both'
                }).find('> ul').css({
                    'column-count'        : options.columns,
                    'column-gap'          : 0,
                    '-webkit-column-count': options.columns,
                    '-webkit-column-gap'  : 0,
                    '-moz-column-count'   : options.columns,
                    '-moz-column-gap'     : 0
                });

                // for crappy IE versions float grouped options
                if( func.ieVersion() && func.ieVersion() < 10 ) {
                    optionsList.find('li.optgroup > ul > li').css({
                        float: 'left',
                        width: (100 / options.columns) +'%'
                    });
                }
            }
            else {
                // add CSS3 column styles
                optionsList.css({
                    'column-count'        : options.columns,
                    'column-gap'          : 0,
                    '-webkit-column-count': options.columns,
                    '-webkit-column-gap'  : 0,
                    '-moz-column-count'   : options.columns,
                    '-moz-column-gap'     : 0
                });

                // for crappy IE versions float grouped options
                if( func.ieVersion() && func.ieVersion() < 10 ) {
                    optionsList.find('> li').css({
                        float: 'left',
                        width: (100 / options.columns) +'%'
                    });
                }
            }

            // BIND SELECT ACTION
            optionsWrap.find('input[type="checkbox"]').click(function(){
                $(this).closest( 'li' ).toggleClass( 'selected' );

                var select = optionsWrap.parent().prev();

                // toggle clicked option
                select.find('option[value="'+ $(this).val() +'"]').prop(
                    'selected', $(this).is(':checked')
                ).closest('select').trigger('change');

                updatePlaceholderText();
            }).each(function( idx ){
                if( $(this).css('display').match(/block$/) ) {
                    var checkboxWidth = $(this).outerWidth();
                        checkboxWidth = checkboxWidth ? checkboxWidth : 15;

                    $(this).closest('label').css(
                        'padding-left',
                        (parseInt( $(this).closest('label').css('padding-left') ) * 2) + checkboxWidth
                    );
                }
            });

            // update selected placeholder text
            var updatePlaceholderText = function(){
                var select = optionsWrap.parent().prev();

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
                var copyWidth  = (typeof $.fn.actual !== 'undefined') ? copy.actual('width',options.jqActualOpts) : copy.width();
                var placeWidth = (typeof $.fn.actual !== 'undefined') ? placeholder.actual('width',options.jqActualOpts) : placeholder.width();

                // if copy is larger than button width use "# selected"
                if( copyWidth > placeWidth ) {
                    placeholder.text( selOpts.length +' selected' );
                }
                // if options selected then use those
                else if( selOpts.length ) {
                    placeholder.text( selOpts.join( ', ' ) );
                }
                // replace placeholder text
                else {
                    placeholder.text( options.placeholder );
                }

                // remove dummy element
                copy.remove();
            };

            updatePlaceholderText();
        });
    };
}(jQuery));
