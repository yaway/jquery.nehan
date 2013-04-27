# jquery.nehan

## Instroduction

jquery.nehan is jquery plugin for [nehan.js](https://github.com/tategakibunko/nehan.js), to create reader of paged-media easily.

## Build

jquery.nehan uses [Grunt](http://gruntjs.com) to build complete script.

to make jquery.nehan.js

    grunt concat:normal

to make jquery.nehan.min.js

    grunt uglify:normal
	grunt concat:min

## Quick Start

1. Include css, and js in the ``<head>``:

    ```html
	<link href="/path/to/nehan.css" type="text/css" rel="stylesheet">
	<link href="/path/to/jquery.nehan.css" type="text/css" rel="stylesheet">
	<script src="/path/to/nehan.js" type="text/javascript"></script>
	<script src="/path/to/jquery.nehan.js" type="text/javascript"></script>
	```

2. Call nehan function for each jquery object.

    ```html
	<script type="text/javascript">
	  $(function(){
	    $(".some-target").nehan({
		  direction:"hori", // or "vert"
		  hori:"lr-tb",
		  vert:"tb-rl", // or "tb-lr"
		  width:800,
		  height:600,
		  fontSize:16,
		  rowCount:1, // 1 or 2 available
		  colCount:1, // 1 or 2 available
		  spacingSize:16,
		  pagerElements:["left-prev", "indicator", "right-next"]
		});
	  });
	</script>
	```

## More Info

[jquery.nehan tutorial](http://tategakibunko.mydns.jp/docs/nehan/jquery.nehan).

## License

MIT license


	
	
	


