;(function($){
  $.fn.nehan = function(options){
    var elements = this;

    // merge defaults
    var opt = $.extend({}, $.fn.nehan.defaults, options);
    var get_width = function(width_value){
      var int_width = parseInt(width_value, 10);
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

    var get_source_from_dom = function($dom){
      var tag_name = $dom.get(0).tagName.toLowerCase();
      return (tag_name === "textarea")? $dom.val() : $dom.html();
    };

    var show = function($dom, source){
      $dom.html("").css("display", "none");
      var $dst = $("<div />").attr("class", $dom.attr("class") || "").insertAfter($dom);
      if(opt.usePager){
	create_reader($dst, source);
      } else {
	output_pages($dst, source);
      }
    };

    elements.each(function(){
      var $dom = $(this);
      var source;
      var resource = $dom.data("resource");
      if(resource){
	$.get(resource, function(source){
	  source = opt.onCreateSource(source);
	  show($dom, source);
	});
      } else {
	source = opt.text? opt.text : get_source_from_dom($dom);
	source = opt.onCreateSource(source);
	show($dom, source);
      }
    });

    return this;
  };

  // notice : default width is dynamically decided by target width.
  $.fn.nehan.defaults = {
    // direct text property.
    // if direct text is set, this value is directly rendered.
    // default value is empty.
    text:"",

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

    // whether add nombre to each page element. default false.
    useNombre:false,

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

    // called before processing source text.
    // by default, do nothing.
    // usefull to edit original source text.
    onCreateSource : function(text){
      return text;
    },

    // called when layout engine is created and ready to use.
    // this is called before start parsing.
    // usefull to edit basic style of engine.
    onCreateEngine : function(engine){
      // example: you cant edit style like this.
      /*
      engine.setStyle("h1", {
	"border-width":"0 0 1px 0"
	"font-size":"30px"
      });
      */
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
      outline_dom.classList.add("nehan-outlines");
      if(outline_dom){
	reader.getRootNode().appendChild(outline_dom);
      }
    },
    onError : function(reader){
      alert("error at " + reader.getSeekPercent() + "%");
    }
  };
})(jQuery);

