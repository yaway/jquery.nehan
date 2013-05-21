;(function($){
  $.fn.nehan = function(options){
    var elements = this;

    // merge defaults
    var opt = $.extend({}, $.fn.nehan.defaults, options);
    var get_width = function(width_value){
      var int_width = parseInt(width_value);
      if(String(width_value).indexOf("%") > 0){
	return Math.floor(int_width * screen.width / 100);
      }
      return int_width;
    };

    // create reader with pager
    var create_reader = function($target, html){
      opt.width = get_width(options.width || $target.width());
      (new Nehan.Reader(html, opt)).renderTo($target[0]);
    };

    // output pages straight forward
    var output_pages = function($target, html){
      var width = get_width(options.width || $target.width());
      var engine = Nehan.setup({
	layout:{
	  direction:opt.direction,
	  width:width,
	  height:opt.height,
	  fontSize:opt.fontSize
	}
      });

      if(opt.onCreateEngine){
	opt.onCreateEngine(engine);
      }
      
      var stream = engine.createPageStream(html);

      stream.asyncGet({
	onProgress:function(caller){
	  var page_node = document.createElement("div");
	  var page_result = stream.getSeekPageResult();
	  page_node.innerHTML = page_result.getHtml();
	  $target.append(page_node);
	}
      });
    };

    var get_source = function($target){
      var tag_name = $target.get(0).tagName.toLowerCase();
      return (tag_name === "textarea")? $target.val() : $target.html();
    };

    var init = opt.usePager? create_reader : output_pages;

    elements.each(function(){
      var $dom = $(this);
      var html = get_source($dom);
      $dom.html("").css("display", "none");
      var $dst = $("<div />").attr("class", $dom.attr("class")).insertAfter($dom);
      init($dst, html);
    });

    return this;
  };

  // notice : default width is dynamically decided by target width.
  $.fn.nehan.defaults = {
    // whether use pager or not.
    // if true, content is shown by single screen and pager.
    // if false, pager is disabled and content is shown by multiple pages.
    usePager:true,
    
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
      engine.addRule("h1", "font-size", "30px");
      engine.addRule("h1", "border", {after:"1px"});
    },

    // called when first page is set to screen.
    // usefull to setup keybord shortcut or enable variaous ui effects.
    // this is not called if usePager is false.
    onReadyPage : function(reader){
    },

    // called after screen for 'page_no' is updated.
    // this callback is not called if you disabled pager.
    // this is not called if usePager is false.
    onPage : function(reader){
      // you can do something unique here.
    },

    // called after all pages generated.
    // this callback is called when you select pager of "indicator".
    // by default, we append outline at the bottom of reader.
    // this is not called if usePager is false.
    onComplete : function(reader){
      var outline_dom = reader.getOutlineNode("ol");
      if(outline_dom){
	reader.getRootNode().appendChild(outline_dom);
      }
    }
  };
})(jQuery);

