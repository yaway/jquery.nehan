;(function($){
  $.fn.nehan = function(options){
    var elements = this;

    // merge defaults
    var opt = $.extend({}, $.fn.nehan.defaults, options);

    // create reader with pager
    var create_reader = function($target, html){
      (new Nehan.Reader(html, opt)).renderTo($target[0]);
    };

    // output pages straight forward
    var output_pages = function($target, html){
      var stream = Nehan.setup({
	layout:{
	  direction:opt.direction,

	  // to use width of $target by default, not use merged default value of opt.
	  width:(options.width || $target.width()),
	  height:opt.height,
	  fontSize:opt.fontSize
	}
      }).createPageStream(html);

      stream.asyncGet({
	onProgress:function(page_no, percent, seek_pos){
	  var page_node = document.createElement("div");
	  var result = stream.get(page_no);
	  page_node.innerHTML = result.html;
	  $target.append(page_node);
	}
      });
    };
    var init = opt.usePager? create_reader : output_pages;

    elements.each(function(){
      var $dom = $(this);
      var html = $dom.html();
      $dom.html("").css("display", "block");
      init($dom, html);
    });

    return this;
  };

  $.fn.nehan.defaults = {
    // whether use pager or not.
    // if true, content is shown by single screen and pager.
    // if false, pager is disabled and content is shown by multiple pages.
    usePager:true,
    
    // size of screen width but this size is exceeded by spacingSize
    width: 500,

    // size of screen height but this size is exceeded by spacingSize
    height: 380,

    // basic font size. if you use 2em, 32px is selected in this case.
    fontSize: 16,

    // set 'hori' if you want horizontal layout.
    direction: "vert",

    // document mode for direction "hori"
    hori:"lr-tb",

    // document mode for direction "vert"
    vert:"tb-rl", // or "tb-lr" is supported

    // row count of screen division. 1 or 2 available.
    rowCount:1,

    // col count of screen division. 1 or 2 available.
    colCount:1,

    // space size of each divided page in one screen.
    spacingSize:16,

    // whether paging by mouse wheel is enabled. default true.
    useWheel:true,

    // ui parts of reader app
    // --------------------------------------------------------
    // screen: main contents
    // pager: pager ui
    // --------------------------------------------------------
    //
    // examples:
    // readerElements:["screen", "pager"], // screen first, pager second(default)
    // readerElements:["pager", "screen"], // pager first, screen second
    readerElements:["screen", "pager"],

    // ui parts of pager
    // --------------------------------------------------------
    // left-next: NEXT button(left arrow)
    // right-next: NEXT button(right arrow)
    // left-prev: PREV button(left arrow)
    // right-prev: PREV button(right arrow)
    // indicator: ui set of page position(page_no / page_count).
    // progress: progress-bar
    // --------------------------------------------------------
    // notice about pagerElements
    // you can not mix "indicator" and "progress" together.
    // if both of them are assigned, "progress" is selected.
    //
    // examples:
    // pagerElements:["left-next", "indicator", "right-prev"], // vertical-rl, random access pager(default)
    // pagerElements:["left-prev", "indicator", "right-next"], // horizontal-lr, random access pager
    // pagerElements:["left-next", "right-prev", "progress"], // vertical-rl, sequencial access pager
    // pagerElements:["left-prev", "right-next", "progress"], // horizontal-lr, sequencial access pager
    // pagerElements:[], // no pager(append mode)
    pagerElements:["left-next", "indicator", "right-prev"],

    // called when layout engine is created and ready to use.
    // this is called before start parsing.
    // usefull to edit basic style of engine.
    onCreateEngine : function(engine){
      // var style = engine.Style;
      // style.h1["font-size"] = "30px";
      // style.h1.border = {after:"1px"};
    },

    // called when first page is set to screen.
    // usefull to setup keybord shortcut or enable variaous ui effects.
    onReadyPage : function(reader){
    },

    // called after screen for 'page_no' is updated.
    // this callback is not called if you disabled pager.
    onPage : function(reader){
      // you can do something unique here.
    },

    // called after all pages generated.
    // this callback is called when you select pager of "indicator".
    // by default, we append outline at the bottom of reader.
    onComplete : function(reader){
      reader.getRootNode().appendChild(reader.getOutlineNode("ol"));
    }
  };
})(jQuery);

