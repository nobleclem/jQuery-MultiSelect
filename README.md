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
    placeholder: 'Select options'
});
```

### Options
| Option       | Values | Default        | Description                    |
| ------------ | ------ | -------------- | ------------------------------ |
| placeholder  | string | Select options | default text for dropdown      |
| columns      | int    | 1              | # of columns to show options   |
| search       | bool   | false          | enable option search/filering  |
| selectAll    | bool   | false          | add select all option          |
| selectGroup  | bool   | false          | add select all optgroup option |
| minHeight    | number | 200            | min height of option overlay   |
| maxHeight    | number | null           | max height of option overlay   |
| showCheckbox | bool   | true           | display the option checkbox    |
| jqActualOpts | object | null           | options for [jquery.actual](https://github.com/dreamerslab/jquery.actual)      |
