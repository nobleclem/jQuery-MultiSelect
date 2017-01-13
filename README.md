jQuery MultiSelect
==================

Turn a multiselect list into a nice and easy to use list with checkboxes.

## Demo
http://springstubbe.us/projects/demos/jquery-multiselect/

## Usage
```
$('select[multiple]').multiselect();

$('select[multiple]').multiselect({
    columns: 4,
    texts: {
        placeholder: 'Select options'
    }
});

$('select[multiple]').multiselect('reload');

$('select[multiple]').multiselect( 'loadOptions', [{
    name   : 'Option Name 1',
    value  : 'option-value-1',
    checked: false,
    attributes : {
        custom1: 'value1',
        custom2: 'value2'
    }
},{
    name   : 'Option Name 2',
    value  : 'option-value-2',
    checked: false,
    attributes : {
        custom1: 'value1',
        custom2: 'value2'
    }
}]);
```
*If your list is not visible on page load, add the [jquery.actual](https://github.com/dreamerslab/jquery.actual) plugin to your project.  This will allow proper width calculations to happen.*


### Options
| Option            | Values   | Default        | Description                    |
| ----------------- | -------- | -------------- | ------------------------------ |
| columns           | int      | 1              | # of columns to show options   |
| search            | bool     | false          | enable option search/filering  |
| searchOptions     | object   |                |                                |
| - delay           | int      | 250            | time (in ms) between keystrokes until search happens |
| - showOptGroups   | bool     | false          | show option group titles if no options remaining |
| - onSearch        | function |                | fires before search on options happens |
| texts             | object   |                |                                |
| - placeholder     | string   | Select options | default text for dropdown      |
| - search          | string   | Search         | search input placeholder text  |
| - selectedOptions | string   |  selected      | selected suffix text           |
| - selectAll       | string   | Select all     | select all text                |
| - unselectAll     | string   | Unselect all   | unselect all text              |
| - noneSelected    | string   | None Selected  | None selected text             |
| selectAll         | bool     | false          | add select all option          |
| selectGroup       | bool     | false          | add select all optgroup option |
| minHeight         | number   | 200            | min height of option overlay   |
| maxHeight         | number   | null           | max height of option overlay   |
| showCheckbox      | bool     | true           | display the option checkbox    |
| onLoad            | function |                | fires at end of initial loading, hides native select list |
| onOptionClick     | function |                | fires after on option is clicked |
| onControlClose    | function |                | fires when the options list is closed |
| jqActualOpts      | object   | null           | options for [jquery.actual](https://github.com/dreamerslab/jquery.actual)      |
| optionAttributes  | array    |                | array of attribute keys to copy to the checkbox input |


### Methods
**loadOptions( options, overwrite, updateSelect )**

Update options of select list. Default state will replace existing list with this one.
- *Set the second parameter to `false` to append to the list. (default = true)*
- *Set the third parameter to `false` to leave the native select list as is. (default = true)*

*This will NOT modify the original select list element.*
```
$('select[multiple]').multiselect( 'loadOptions', [{
    name   : 'Option Name 1',
    value  : 'option-value-1',
    checked: false
},{
    name   : 'Option Name 2',
    value  : 'option-value-2',
    checked: false
}]);
```


**settings**

Update Multiselect list settings after it has been rendered.  It accepts the same [options](https://github.com/nobleclem/jQuery-MultiSelect#options) listed above.

*This will reload the plugin for the select list it references*

`$('select[multiple]').multiselect( 'settings', {
    columns: 2
});`

**unload**

Disable the jquery multiselect list and show the native select list.

*This is distructive. You will have to reinitialize with all options to enable the plugin for the list.*

`$('select[multiple]').multiselect( 'unload' );`


**reload**

This is a quick unload/load while maintaining options during plugin initialization.

`$('select[multiple]').multiselect( 'reload' );`


**reset**

Reset the element back to its default selected values.

`$('select[multiple]').multiselect( 'reset' );`


### Callbacks
**onLoad**

Fires after initial loading and hides native select list

`onLoad( element )`

element: select list element object


**onOptionClick**

*Fires after an option is clicked*

`onOptionClick( element, option )`

element: select list element object

option:  option element object


**onControlClose**

Fires when the options list is closed

`onControlClose( element )`

element: select list element object


**onSearch**

*Fires before search on options happens*

`searchOptions.onSearch( element )`

element: select list element object
