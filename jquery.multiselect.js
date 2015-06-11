/**
 * Display a nice easy to use multiselect list
 * @Version: 1.0
 * @Author: Patrick Springstubbe
 * @Contact: @JediNobleclem
 * @Website: springstubbe.us
 * @Source: https://github.com/nobleclem/jQuery-MultiSelect
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
            placeholder   : '',    // text to use in dummy input
            columns       : 1,     // how many columns should be use to show options
            maxWidth      : null,  // maximum width of option overlay (or selector)
            minHeight     : 200,   // minimum height of option overlay
            maxHeight     : null,  // maximum height of option overlay
            showCheckbox  : true,  // display the checkbox to the user

            // @NOTE: these are for future development
            minSelect     : false, // minimum number of items that can be selected
            maxSelect     : false, // maximum number of items that can be selected
            groupSelect   : false, // select entire optgroup
            selectAllText : false, // add select all option
            searchOptions : false, // enable option search/filtering
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

                if( $(option).attr( 'selected' ) ) {
                    container.addClass('selected');
                    container.find( 'input[type="checkbox"]' ).attr( 'checked', 'checked' );
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
            // make sure this is a select list
            if( this.nodeName != 'SELECT' ) {
                return false;
            }

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
            $(window).off('click.ms-hideopts').on('click.ms-hideopts', function( event ){
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
                select.find('option[value="'+ $(this).val() +'"]').attr(
                    'selected', $(this).is(':checked')
                ).closest('select').trigger('change');

                // get selected options
                var selOpts = [];
                select.find('option[selected="selected"]').each(function(){
                    selOpts.push( $(this).text() );
                });

                // UPDATE PLACEHOLDER TEXT WITH OPTIONS SELECTED
                placeholder.text( selOpts.join( ', ' ) );
                var copy = placeholder.clone().css({
                    display   : 'inline',
                    width     : 'auto',
                    visibility: 'hidden'
                }).appendTo( optionsWrap.parent() );

                // if copy is larger than button width use "# selected"
                if( copy.width() > placeholder.width() ) {
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

            }).each(function( idx ){
                if( $(this).css('display').match(/block$/) ) {
                    var checkboxWidth = $(this).outerWidth();
                        checkboxWidth = checkboxWidth ? checkboxWidth : 15;

                    $(this).closest('label').css(
                        'padding-left',
                        (parseInt( $(this).closest('label').css('padding-left') ) * 2) + checkboxWidth
                    );
                }

                if( $(this).is(':checked') ) {
                    $(this).trigger('click');
                }
            });
        });
    };
}(jQuery));
