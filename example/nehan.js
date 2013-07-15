/*
 nehan.js
 Copyright (C) 2010 Watanabe Masaki<lambda.watanabe[at]gmail.com>
 http://tategakibunko.mydns.jp/docs/nehan/

 licensed under MIT licence.

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/

;var Nehan;
if(!Nehan){
  Nehan = {};
}

// this function ends at the tail of this source.
Nehan.setup = function(_engine_args){
var __engine_args = _engine_args || {};

var Config = {
  lang:"ja-JP",
  kerning:true,
  justify:true,
  maxRollbackCount : 10,
  minBlockScaleDownRate : 65,
  useVerticalGlyphIfEnable: true,
  lexingBufferLen : 2000
};

var Layout = {
  root:"body",
  direction:"vert",
  hori:"lr-tb", // sorry, rl-tb is not supported yet.
  vert:"tb-rl", // or "tb-lr"
  width: 800,
  height: 580,
  fontSize:16,
  rubyRate:0.5, // used when Style.rt["font-size"] not defined.
  boldRate:0.2,
  fontColor:"000000",
  linkColor:"0000FF",
  fontImgRoot:"http://nehan.googlecode.com/hg/char-img",
  lineRate: 2.0,
  listMarkerSpacingRate:0.4,

  createBox : function(size, parent, type){
    var box = new Box(size, parent, type);
    box.flow = parent.flow;
    box.lineRate = parent.lineRate;
    box.textAlign = parent.textAlign;
    box.fontSize = parent.fontSize;
    box.color = parent.color;
    box.letterSpacing = parent.letterSpacing;
    return box;
  },
  createTextLine : function(size, parent){
    return this.createBox(size, parent, "text-line");
  },
  createRootBox : function(size, type){
    var box = new Box(size, null, type);
    box.flow = this.getStdBoxFlow();
    box.lineRate = this.lineRate;
    box.textAlign = "start";
    box.fontSize = this.fontSize;
    box.color = new Color(this.fontColor);
    box.letterSpacing = 0;
    return box;
  },
  getStdPageSize : function(){
    return new BoxSize(this.width, this.height);
  },
  getStdMeasure : function(){
    var flow = this.getStdBoxFlow();
    return this[flow.getPropMeasure()];
  },
  getStdBoxFlow : function(){
    var flow_name = this[this.direction];
    return BoxFlows.getByName(flow_name);
  },
  getStdVertFlow : function(){
    return BoxFlows.getByName(this.vert);
  },
  getStdHoriFlow : function(){
    return BoxFlows.getByName(this.hori);
  },
  getListMarkerSpacingSize : function(font_size){
    font_size = font_size || this.fontSize;
    return Math.floor(font_size * this.listMarkerSpacingRate);
  },
  getVertBlockDir : function(){
    return this.vert.split("-")[1];
  },
  getHoriIndir : function(){
    return this.hori.split("-")[0];
  },
  getRubyFontSize : function(base_font_size){
    var rt = Style.rt || null;
    var rt_font_size = rt? rt["font-size"] : null;
    if(rt === null || rt_font_size === null){
      return Math.floor(this.rubyRate * base_font_size);
    }
    return UnitSize.getUnitSize(rt_font_size, base_font_size);
  },
  getPaletteFontColor : function(color){
    if(color.getValue().toLowerCase() !== this.fontColor.toLowerCase()){
      return color.getPaletteValue();
    }
    return this.fontColor;
  }
};

var Env = (function(){
  var nav = navigator.appName;
  var ua = navigator.userAgent.toLowerCase();
  var matched = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/);
  var browser, version, is_transform_enable;
  if(matched){
    tmp_match = ua.match(/version\/([\.\d]+)/i);
    if(tmp_match){
      matched[2] = tmp_match[1];
    }
    browser = matched[1].toLowerCase();
    version = parseInt(matched[2], 10);
    if(browser === "msie"){
      is_transform_enable = this.version >= 9;
    } else {
      is_transform_enable = true;
    }
  } else {
    browser = nav.toLowerCase();
    version = parseInt(navigator.appVersion, 10);
    is_transform_enable = false;
  }

  var is_ie = browser === "msie";
  var is_win = ua.indexOf("windows") >= 0;
  var is_mac = ua.indexOf("macintosh") >= 0;
  var is_chrome = browser.indexOf("chrome") >= 0;
  var is_iphone = ua.indexOf("iphone") != -1;
  var is_ipod = ua.indexOf("ipod") != -1;
  var is_ipad = ua.indexOf("ipad") != -1;
  var is_iphone_family = (is_iphone || is_ipod || is_ipad);
  var is_android_family = ua.indexOf("android") != -1;
  var is_smart_phone = is_iphone_family || is_android_family;
  var is_webkit = ua.indexOf("webkit") != -1;
  var is_vertical_glyph_enable = is_chrome && (is_win || is_mac) && version >= 24;

  return {
    version : version,
    isIE : is_ie,
    isChrome : is_chrome,
    isWebkit : is_webkit,
    isIphone : is_iphone,
    isIpod : is_ipod,
    isIpad : is_ipad,
    isIphoneFamily : is_iphone_family,
    isAndroidFamily : is_android_family,
    isSmartPhone : is_smart_phone,
    isTransformEnable : is_transform_enable,
    isVerticalGlyphEnable : is_vertical_glyph_enable
  };
})();


/*
  About 'line-rate' property in nehan.

  In normal html, size of 'line-height:1.0em' is determined by
  font size of 'parent' block.

  In contrast, property line-rate is determined by max font size of
  'current line'.

  Assume that font-size of parent block is 16px, and max font size of
  current line is 32px, line-height:1.0em is 16px, but line-rate:1.0em is 32px.
 */
var Style = {
  //-------------------------------------------------------
  // tag / a
  //-------------------------------------------------------
  "a":{
    "display":"inline"
  },
  "abbr":{
    "display":"inline"
  },
  "address":{
    "display":"inline",
    "section":true
  },
  "area":{
  },
  "article":{
    "display":"block",
    "section":true
  },
  "aside":{
    "display":"block",
    "section":true
  },
  "audio":{
  },
  //-------------------------------------------------------
  // tag / b
  //-------------------------------------------------------
  "b":{
    "display":"inline",
    "font-weight":"bold"
  },
  "base":{
  },
  "bdi":{
    "display":"inline"
  },
  "bdo":{
    "display":"inline"
  },
  "blockquote":{
    "display":"block",
    "section-root":true,
    "padding":{
      "start":"1em",
      "end":"1em",
      "before":"0.5em",
      "after":"0.5em"
    },
    "margin":{
      "after":"1.5em"
    }
  },
  "body":{
    "display":"block",
    "section-root":true
  },
  "br":{
    "display":"inline",
    "single":true
  },
  "button":{
    "display":"inline",
    "interactive":true
  },
  //-------------------------------------------------------
  // tag / c
  //-------------------------------------------------------
  "canvas":{
    "display":"inline",
    "embeddable":true
  },
  "caption":{
    "display":"block",
    "text-align":"center",
    "margin":{
      "after":"0.5em"
    }
  },
  "cite":{
    "display":"inline"
  },
  "code":{
    "display":"inline"
  },
  "col":{
  },
  "colgroup":{
  },
  "command":{
  },
  //-------------------------------------------------------
  // tag / d
  //-------------------------------------------------------
  "datalist":{
  },
  "dd":{
    "display":"block",
    "margin":{
      "start":"1em",
      "end":"1em",
      "after":"1.6em"
    }
  },
  "del":{
    "display":"inline"
  },
  "details":{
    "display":"block",
    "section-root":true
  },
  "dfn":{
    "display":"inline"
  },
  "div":{
    "display":"block",

    // using div tag with static size, inline html can be embeded.
    //  <div width="100" height="100">embed html</div>
    "embeddable":true
  },
  "dl":{
    "display":"block"
  },
  "dt":{
    "display":"block",
    "margin":{
      "after":"0.2em"
    }
  },
  //-------------------------------------------------------
  // tag / e
  //-------------------------------------------------------
  "em":{
    "display":"inline"
  },
  "embed":{
  },
  // nehan original tag
  "end-page":{
    "display":"block",
    "single":true
  },
  //-------------------------------------------------------
  // tag / f
  //-------------------------------------------------------
  "fieldset":{
    "display":"block",
    "section-root":true,
    "padding":{
      "start":"1em",
      "end":"0.2em",
      "before":"0.2em",
      "after":"1em"
    },
    "margin":{
      "after":"1.5em"
    },
    "border-width":"1px"
  },
  "figure":{
    "display":"block",
    "section-root":true
  },
  "figcaption":{
    "display":"block",
    "text-align":"center",
    "font-size": "0.8em"
  },
  "footer":{
    "display":"block",
    "section":true
  },
  "form":{
    "display":"block"
  },
  //-------------------------------------------------------
  // tag / h
  //-------------------------------------------------------
  "h1":{
    "display":"block",
    "line-rate":1.4,
    "font-size":"2.4em",
    "font-weight":"bold",
    "margin":{
      "after":"0.5em"
    }
  },
  "h2":{
    "display":"block",
    "line-rate":1.4,
    "font-size":"2.0em",
    "font-weight":"bold",
    "margin":{
      "after":"0.75em"
    }
  },
  "h3":{
    "display":"block",
    "line-rate":1.4,
    "font-size":"1.6em",
    "font-weight":"bold",
    "margin":{
      "after":"1em"
    }
  },
  "h4":{
    "display":"block",
    "line-rate":1.4,
    "font-size":"1.4em",
    "font-weight":"bold",
    "margin":{
      "after":"1.25em"
    }
  },
  "h5":{
    "display":"block",
    "line-rate":1.4,
    "font-size":"1.0em",
    "font-weight":"bold",
    "margin":{
      "after":"1.5em"
    }
  },
  "h6":{
    "display":"block",
    "line-rate":1.4,
    "font-size":"1.0em",
    "font-weight":"bold"
  },
  "head":{
  },
  "header":{
    "display":"block",
    "section":true
  },
  "hr":{
    "display":"block",
    "box-sizing":"content-box",
    "single":true,
    "margin":{
      "after":"1em"
    },
    "border-width":{
      "after":"1px"
    }
  },
  "hr.nehan-space":{
    "border-width":"0px"
  },
  "html":{
    "display":"block"
  },
  //-------------------------------------------------------
  // tag / i
  //-------------------------------------------------------
  "i":{
    "display":"inline"
  },
  "iframe":{
    "display":"block",
    "embeddable":true
  },
  "ins":{
  },
  "img":{
    "display":"inline",
    "box-sizing":"content-box",
    "single":true
  },
  "input":{
    "display":"inline",
    "interactive":true,
    "single":true
  },
  //-------------------------------------------------------
  // tag / k
  //-------------------------------------------------------
  "kbd":{
    "display":"inline"
  },
  "keygen":{
  },
  //-------------------------------------------------------
  // tag / l
  //-------------------------------------------------------
  "label":{
    "display":"inline"
  },
  "legend":{
    "display":"block",
    "line-rate":1.5
  },
  "li":{
    "display":"block",
    "margin":{
      "after":"0.6em"
    }
  },
  "link":{
    "meta":true,
    "single":true
  },
  //-------------------------------------------------------
  // tag / m
  //-------------------------------------------------------
  "main":{
    "display":"block"
  },
  "map":{
  },
  "mark":{
    "display":"inline"
  },
  "menu":{
    "display":"block"
  },
  "meta":{
    "meta":true,
    "single":true
  },
  "meter":{
    "display":"inline"
  },
  //-------------------------------------------------------
  // tag / n
  //-------------------------------------------------------
  "nav":{
    "display":"block",
    "section":true
  },
  "noscript":{
  },
  //-------------------------------------------------------
  // tag / o
  //-------------------------------------------------------
  "object":{
    "display":"inline",
    "embeddable":true
  },
  "ol":{
    "display":"block",
    "list-style-image":"none",
    "list-style-position": "outside",
    "list-style-type": "decimal",
    "margin":{
      "before":"1em"
    }
  },
  "optgroup":{
  },
  "option":{
  },
  "output":{
  },
  //-------------------------------------------------------
  // tag / p
  //-------------------------------------------------------
  "p":{
    "display":"block",
    "margin":{
      "after":"1.5em"
    }
  },
  // this is nehan local syntax.
  // as we use <br> to break line,
  // we use <page-break> to break the page.
  "page-break":{
    "display":"block",
    "single":true
  },
  "param":{
  },
  "pre":{
    "display":"block"
  },
  "progress":{
    "display":"inline"
  },
  //-------------------------------------------------------
  // tag / q
  //-------------------------------------------------------
  "q":{
    "display":"block"
  },
  //-------------------------------------------------------
  // tag / r
  //-------------------------------------------------------
  "rb":{
    "display":"inline"
  },
  "rp":{
    "display":"inline"
  },
  "ruby":{
    "display":"inline"
  },
  "rt":{
    "font-size":"0.5em",
    "line-rate":1.0,
    "display":"inline"
  },
  //-------------------------------------------------------
  // tag / s
  //-------------------------------------------------------
  "s":{
    "display":"inline"
  },
  "samp":{
    "display":"inline"
  },
  "script":{
    "display":"inline",
    "meta":true
  },
  "section":{
    "display":"block",
    "section":true
  },
  "select":{
  },
  "small":{
    "display":"inline",
    "font-size":"0.8em"
  },
  "source":{
  },
  "span":{
    "display":"inline"
  },
  "strong":{
    "display":"inline",
    "font-weight":"bold"
  },
  "style":{
    "display":"inline",
    "meta":true
  },
  "sub":{
    "display":"inine"
  },
  "summary":{
    "display":"inline"
  },
  "sup":{
    "display":"inine"
  },
  //-------------------------------------------------------
  // tag / t
  //-------------------------------------------------------
  "table":{
    "display":"block",
    "embeddable":true,
    "table-layout":"fixed", // 'auto' not supported yet.
    "border-collapse":"collapse", // 'separate' not supported yet.
    //"border-spacing":"5px", // TODO: support batch style like "5px 10px".
    "border-width":"1px",
    "margin":{
      "start":"0.5em",
      "end":"0.5em",
      "after":"1.6em"
    }
  },
  "tbody":{
    "display":"block",
    "border-collapse":"inherit"
  },
  "td":{
    "display":"block",
    "border-collapse":"inherit",
    "section-root":true,
    "border-width":"1px",
    "padding":{
      "start":"0.8em",
      "end":"0.8em",
      "before":"0.5em",
      "after":"0.5em"
    }
  },
  "textarea":{
    "display":"inline",
    "embeddable":true,
    "interactive":true
  },
  "tfoot":{
    "display":"block",
    "border-collapse":"inherit"
  },
  "th":{
    "display":"block",
    "line-rate":1.4,
    "border-collapse":"inherit",
    "border-width":"1px",
    "padding":{
      "start":"0.8em",
      "end":"0.8em",
      "before":"0.5em",
      "after":"0.5em"
    }
  },
  "thead":{
    "display":"block",
    "border-collapse":"inherit"
  },
  "time":{
    "display":"inline"
  },
  "title":{
    "meta":true
  },
  "tr":{
    "display":"block"
  },
  "track":{
  },
  //-------------------------------------------------------
  // tag / u
  //-------------------------------------------------------
  "u":{
    "display":"inline"
  },
  "ul":{
    "display":"block",
    "list-style-image":"none",
    "list-style-type":"disc",
    "list-style-position":"outside",
    "margin":{
      "before":"1em"
    }
  },
  //-------------------------------------------------------
  // tag / v
  //-------------------------------------------------------
  "var":{
    "display":"inline"
  },
  "video":{
    "display":"inline",
    "embeddable":true
  },
  //-------------------------------------------------------
  // tag / w
  //-------------------------------------------------------
  "wbr":{
    "display":"inline",
    "single":true
  },
  //-------------------------------------------------------
  // rounded corner
  //-------------------------------------------------------
  ".nehan-rounded":{
    "padding":["1.6em", "1.0em", "1.6em", "1.0em"],
    "border-radius":"10px"
  },
  //-------------------------------------------------------
  // font-size classes
  //-------------------------------------------------------
  ".nehan-xx-large":{
    "font-size":"33px"
  },
  ".nehan-x-large":{
    "font-size":"24px"
  },
  ".nehan-large":{
    "font-size":"18px"
  },
  ".nehan-medium":{
    "font-size":"16px"
  },
  ".nehan-small":{
    "font-size":"13px"
  },
  ".nehan-x-small":{
    "font-size":"10px"
  },
  ".nehan-xx-small":{
    "font-size":"10px"
  },
  ".nehan-larger":{
    "font-size":"1.2em"
  },
  ".nehan-smaller":{
    "font-size":"0.8em"
  },
  //-------------------------------------------------------
  // display classes
  //-------------------------------------------------------
  ".nehan-disp-block":{
    "display":"block"
  },
  ".nehan-disp-inline":{
    "display":"inline"
  },
  ".nehan-disp-inline-block":{
    "display":"inline-block"
  },
  //-------------------------------------------------------
  // text-align classes
  //-------------------------------------------------------
  ".nehan-ta-start":{
    "text-align":"start"
  },
  ".nehan-ta-center":{
    "text-align":"center"
  },
  ".nehan-ta-end":{
    "text-align":"end"
  },
  //-------------------------------------------------------
  // float classes
  //-------------------------------------------------------
  ".nehan-float-start":{
    "float":"start"
  },
  ".nehan-float-end":{
    "float":"end"
  },
  //-------------------------------------------------------
  // flow classes
  //-------------------------------------------------------
  ".nehan-flow-lr-tb":{
    "flow":"lr-tb"
  },
  ".nehan-flow-tb-rl":{
    "flow":"tb-rl"
  },
  ".nehan-flow-tb-lr":{
    "flow":"tb-lr"
  },
  ".nehan-flow-rl-tb":{
    "flow":"rl-tb"
  },
  ".nehan-flow-flip":{
    "flow":"flip"
  },
  ".nehan-flow-inherit":{
    "float":"inherit"
  },
  //-------------------------------------------------------
  // list-style-position classes
  //-------------------------------------------------------
  ".nehan-lsp-inside":{
    "list-style-position":"inside"
  },
  ".nehan-lsp-outside":{
    "list-style-position":"outside"
  },
  //-------------------------------------------------------
  // list-style-type classes
  //-------------------------------------------------------
  ".nehan-lst-none":{
    "list-style-type":"none"
  },
  ".nehan-lst-decimal":{
    "list-style-type":"decimal"
  },
  ".nehan-lst-disc":{
    "list-style-type":"disc"
  },
  ".nehan-lst-circle":{
    "list-style-type":"circle"
  },
  ".nehan-lst-square":{
    "list-style-type":"square"
  },
  ".nehan-lst-decimal-leading-zero":{
    "list-style-type":"decimal-leading-zero"
  },
  ".nehan-lst-lower-alpha":{
    "list-style-type":"lower-alpha"
  },
  ".nehan-lst-upper-alpha":{
    "list-style-type":"upper-alpha"
  },
  ".nehan-lst-lower-latin":{
    "list-style-type":"lower-latin"
  },
  ".nehan-lst-upper-latin":{
    "list-style-type":"upper-latin"
  },
  ".nehan-lst-lower-roman":{
    "list-style-type":"lower-roman"
  },
  ".nehan-lst-upper-roman":{
    "list-style-type":"upper-roman"
  },
  ".nehan-lst-lower-greek":{
    "list-style-type":"lower-greek"
  },
  ".nehan-lst-upper-greek":{
    "list-style-type":"upper-greek"
  },
  ".nehan-lst-cjk-ideographic":{
    "list-style-type":"cjk-ideographic"
  },
  ".nehan-lst-hiragana":{
    "list-style-type":"hiragana"
  },
  ".nehan-lst-hiragana-iroha":{
    "list-style-type":"hiragana-iroha"
  },
  ".nehan-lst-katakana":{
    "list-style-type":"katakana"
  },
  ".nehan-lst-katakana-iroha":{
    "list-style-type":"katakana-iroha"
  },
  //-------------------------------------------------------
  // text-combine
  //-------------------------------------------------------
  ".nehan-tcy":{
    "text-combine":"horizontal"
  },
  ".nehan-text-combine":{
    "text-combine":"horizontal"
  },
  //-------------------------------------------------------
  // text emphasis
  //-------------------------------------------------------
  ".nehan-empha-dot-filled":{
    "text-emphasis-style":"&#x2022;"
  },
  ".nehan-empha-dot-open":{
    "text-emphasis-style":"&#x25e6;"
  },
  ".nehan-empha-circle-filled":{
    "text-emphasis-style":"&#x25cf;"
  },
  ".nehan-empha-circle-open":{
    "text-emphasis-style":"&#x25cb;"
  },
  ".nehan-empha-double-circle-filled":{
    "text-emphasis-style":"&#x25c9;"
  },
  ".nehan-empha-double-circle-open":{
    "text-emphasis-style":"&#x25ce;"
  },
  ".nehan-empha-triangle-filled":{
    "text-emphasis-style":"&#x25b2;"
  },
  ".nehan-empha-triangle-open":{
    "text-emphasis-style":"&#x25b3;"
  },
  ".nehan-empha-sesame-filled":{
    "text-emphasis-style":"&#xfe45;"
  },
  ".nehan-empha-sesame-open":{
    "text-emphasis-style":"&#xfe46;"
  },
  //-------------------------------------------------------
  // nehan tip area
  //-------------------------------------------------------
  ".nehan-tip":{
    "padding":{
      "before":"0.1em",
      "start":"0.8em",
      "end":"0.8em",
      "after":"0.8em"
    },
    "margin":{
      "after":"1em"
    },
    "border-width":"2px"
  },
  //-------------------------------------------------------
  // other utility classes
  //-------------------------------------------------------
  ".nehan-drop-caps::first-letter":{
    "display":"block",
    "width":"4em",
    "height":"4em",
    "float":"start",
    "line-rate":1.0,
    "font-size":"4em"
  },
  ".nehan-line-no-ruby":{
    "line-rate":1.0
  },
  ".nehan-gap-start":{
    "margin":{
      "start":"1em"
    }
  },
  ".nehan-gap-end":{
    "margin":{
      "end":"1em"
    }
  },
  ".nehan-gap-after":{
    "margin":{
      "after":"1em"
    }
  },
  ".nehan-gap-before":{
    "margin":{
      "before":"1em"
    }
  }
};

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
var Class = (function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  var _Class = function(){};
  _Class.extend = function(prop){
    var _super = this.prototype;
    initializing = true;
    var prototype = new this();
    initializing = false;
    for (var name in prop) {
      prototype[name] = typeof prop[name] == "function" && 
	typeof _super[name] == "function" && fnTest.test(prop[name]) ?
	(function(name, fn){
          return function() {
            var tmp = this._super;
            this._super = _super[name];
            var ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
          };
	})(name, prop[name]) :
      prop[name];
    }

    function Class() {
      if (!initializing && this.init)
	this.init.apply(this, arguments);
    }
    Class.prototype = prototype;
    Class.prototype.constructor = Class;
    Class.extend = arguments.callee;
    return Class;
  };

  return _Class;
})();

var List = {
  each : function(obj, fn){
    for(var prop in obj){
      fn(prop, obj[prop]);
    }
  },
  iter : function(lst, fn){
    for(var i = 0, len = lst.length; i < len; i++){
      fn(lst[i]);
    }
  },
  iteri : function(lst, fn){
    for(var i = 0, len = lst.length; i < len; i++){
      fn(i, lst[i]);
    }
  },
  reviter : function(lst, fn){
    for(var i = lst.length; i >= 0; i--){
      fn(lst[i]);
    }
  },
  reviteri : function(lst, fn){
    for(var i = lst.length; i >= 0; i--){
      fn(i, lst[i]);
    }
  },
  forall : function(lst, fn){
    for(var i = 0, len = lst.length; i < len; i++){
      if(!fn(lst[i])){
	return false;
      }
    }
    return true;
  },
  map : function(lst, fn){
    var ret = [];
    for(var i = 0, len = lst.length; i < len; i++){
      ret[i] = fn(lst[i]);
    }
    return ret;
  },
  mapi : function(lst, fn){
    var ret = [];
    for(var i = 0, len = lst.length; i < len; i++){
      ret[i] = fn(i, lst[i]);
    }
    return ret;
  },
  fold : function(lst, acm, fn){
    var ret = acm;
    for(var i = 0, len = lst.length; i < len; i++){
      ret = fn(ret, lst[i]);
    }
    return ret;
  },
  filter : function(lst, fn){
    var ret = [];
    for(var i = 0, len = lst.length; i < len; i++){
      if(fn(lst[i])){
	ret.push(lst[i]);
      }
    }
    return ret;
  },
  find : function(lst, fn){
    for(var i = 0, len = lst.length; i < len; i++){
      var obj = lst[i];
      if(fn(obj)){
	return obj;
      }
    }
    return null;
  },
  revfind : function(lst, fn){
    for(var i = lst.length - 1; i >= 0; i--){
      var obj = lst[i];
      if(fn(obj)){
	return obj;
      }
    }
    return null;
  },
  indexOf : function(lst, fn){
    for(var i = 0, len = lst.length; i < len; i++){
      var obj = lst[i];
      if(fn(obj)){
	return i;
      }
    }
    return -1;
  },
  exists : function(lst, fn){
    for(var i = 0, len = lst.length; i < len; i++){
      if(fn(lst[i])){
	return true;
      }
    }
    return false;
  },
  mem : function(lst, val){
    for(var i = 0, len = lst.length; i < len; i++){
      if(lst[i] == val){
	return true;
      }
    }
    return false;
  },
  sum : function(lst){
    return this.fold(lst, 0, function(ret, obj){
      return ret + obj;
    });
  },
  minobj : function(lst, fn){
    var min_obj = null, min_val = null;
    this.iter(lst, function(obj){
      var val = fn(obj);
      if(min_val === null || val < min_val){
	min_obj = obj;
	min_val = val;
      }
    });
    return min_obj;
  },
  maxobj : function(lst, fn){
    var max_obj = null, max_val = null;
    this.iter(lst, function(obj){
      var val = fn(obj);
      if(max_val === null || val > max_val){
	max_obj = obj;
	max_val = val;
      }
    });
    return max_obj;
  },
  refcopy : function(lst){
    var ret = [];
    for(var i = 0, len = lst.length; i < len; i++){
      ret[i] = lst[i];
    }
    return ret;
  },
  count : function(lst, fn){
    var ret = 0;
    for(var i = 0, len = lst.length; i < len; i++){
      if(fn(lst[i])){
	ret++;
      }
    }
    return ret;
  },
  create : function(count, init_val){
    var ret = new Array(count);
    if(typeof init_val != "undefined"){
      for(var i = 0; i < count; i++){
	ret[i] = init_val;
      }
    }
    return ret;
  },
  last : function(lst, def_val){
    if(lst.length === 0){
      return def_val;
    }
    return lst[lst.length - 1];
  },
  zip : function(lst1, lst2){
    var ret = [];
    for(var i = 0, len = Math.min(lst1.length, lst2.length); i < len; i++){
      ret[i] = [lst1[i], lst2[i]];
    }
    return ret;
  },
  reverse : function(lst){
    lst.reverse();
    return lst;
  }
};


var Obj = {
  isEmpty: function(obj){
    for(var name in obj){
      return false;
    }
    return true;
  },
  map : function(obj, fn){
    var ret = {};
    for(var prop in obj){
      ret[prop] = fn(obj[prop]);
    }
    return ret;
  },
  iter : function(obj, fn){
    for(var prop in obj){
      fn(obj, prop, obj[prop]);
    }
  }
};

var UnitSize = {
  getUnitSize : function(val, unit_size){
    var str = (typeof val === "string")? val : String(val);
    if(str.indexOf("rem") > 0){
      var rem_scale = parseFloat(str.replace("rem",""));
      return Math.floor(Layout.fontSize * rem_scale); // use root font-size
    }
    if(str.indexOf("em") > 0){
      var em_scale = parseFloat(str.replace("em",""));
      return Math.floor(unit_size * em_scale);
    }
    if(str.indexOf("pt") > 0){
      return Math.floor(parseInt(str, 10) * 4 / 3);
    }
    if(str.indexOf("%") > 0){
      return Math.floor(unit_size * parseInt(str, 10) / 100);
    }
    var px = parseInt(str, 10);
    return isNaN(px)? 0 : px;
  },
  getBoxSize : function(val, unit_size, max_size){
    var str = (typeof val === "string")? val : String(val);
    if(str.indexOf("%") > 0){
      var scaled_size = Math.floor(max_size * parseInt(str, 10) / 100);
      return Math.min(max_size, scaled_size); // restrict less than maxMeasure
    }
    return this.getUnitSize(val, unit_size);
  },
  getCornerSize : function(val, unit_size){
    var ret = {};
    for(var prop in val){
      ret[prop] = [0, 0];
      ret[prop][0] = this.getUnitSize(val[prop][0], unit_size);
      ret[prop][1] = this.getUnitSize(val[prop][1], unit_size);
    }
    return ret;
  },
  getEdgeSize : function(val, unit_size){
    var ret = {};
    for(var prop in val){
      ret[prop] = this.getUnitSize(val[prop], unit_size);
    }
    return ret;
  }
};

var Utils = {
  trimHeadCRLF : function(str){
    return str.replace(/^\n+/, "");
  },
  trimFootCRLF : function(str){
    return str.replace(/\n+$/, "");
  },
  trimCRLF : function(str){
    return this.trimFootCRLF(this.trimHeadCRLF(str));
  },
  trim : function(str){
    return str.replace(/^\s+/, "").replace(/\s+$/, "");
  },
  capitalize : function(str){
    if(str === ""){
      return "";
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  log : function(true_num, rad){
    var radix = rad || 10;
    return Math.log(true_num) / Math.log(radix);
  },
  filenameConcat : function(p1, p2){
    p1 = (p1==="")? "" : (p1.slice(-1) === "/")? p1 : p1 + "/";
    p2 = (p2==="")? "" : (p2[0] === "/")? p2.substring(1, p2.length) : p2;
    return p1 + p2;
  },
  getCamelName : function(hyp_name){
    var self = this;
    return List.mapi(hyp_name.split("-"), function(i, part){
      return (i === 0)? part : self.capitalize(part);
    }).join("");
  }
};

var MathUtils = {
  convBase : function(decimal, base){
   if(decimal === 0){
      return [0];
    }
    var ret = [];
    var work = decimal;
    while(work > 0){
      ret.unshift(work % base);
      work = Math.floor(work / base);
    }
    return ret;
  }
};


var reqAnimationFrame = (function(){
  var default_wait = 1000 / 60;
  return window.requestAnimationFrame  ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.msRequestAnimationFrame     ||
    function(callback, wait){
      var _wait = (typeof wait === "undefined")? default_wait : wait;
      window.setTimeout(callback, _wait);
    };
})();


var Const = {
  cssVenderPrefixes:[
    "-moz",
    "-webkit",
    "-o",
    "-ms"
  ],
  cssCorders:[
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right"
  ],
  cssBorderRadius:[
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-left-radius",
    "border-bottom-right-radius"
  ],
  cssBoxDirs:[
    "top",
    "right",
    "bottom",
    "left"
  ],
  cssBoxDirsLogical:[
    "before",
    "end",
    "after",
    "start"
  ],
  cssBoxCornersLogical:[
    "start-before",
    "end-before",
    "end-after",
    "start-after"
  ],
  css2dIndex:{
    1:[0, 0],
    2:[0, 1]
  },
  css4dIndex:{
    1:[0, 0, 0, 0],
    2:[0, 1, 0, 1],
    3:[0, 1, 2, 1],
    4:[0, 1, 2, 3]
  },
  space:"&nbsp;",
  clearFix:"<div style='clear:both'></div>"
};

var Css = {
  toString : function(args){
    var tmp = [];
    for(var prop in args){
      tmp.push(prop + ":" + Html.escape(args[prop] + ""));
    }
    return tmp.join(";");
  },
  addNehanPrefix : function(name){
    return "nehan-" + name;
  },
  addNehanHeaderPrefix : function(name){
    return "nehan-header-" + name;
  },
  addNehanTocLinkPrefix : function(name){
    return "nehan-toc-link-" + name;
  }
};

var Html = {
  escape : function(str){
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/'/g, "&#039;")
      .replace(/"/g, "&quot;");
  },
  attr : function(args){
    var tmp = [];
    for(var prop in args){
      if(args[prop]){
	tmp.push(prop + "='" + this.escape(args[prop] + "") + "'");
      }
    }
    return (tmp == [])? "" : tmp.join(" ");
  },
  tagWrap : function(name, content, args){
    return [this.tagStart(name, args || {}), content, this.tagEnd(name)].join("");
  },
  tagSingle : function(name, args){
    return "<" + name + " " + this.attr(args) + "/>";
  },
  tagStart : function(name, args){
    return "<" + name + " " + this.attr(args) + ">";
  },
  tagEnd : function(name){
    return "</" + name + ">";
  }
};

var Closure = {
  id : function(){
    return function(x){
      return x;
    };
  },
  eq : function(x){
    return function(y){
      return x == y;
    };
  },
  neq : function(x){
    return function(y){
      return x != y;
    };
  }
};

var Args = {
  copy : function(dst, args){
    for(var prop in args){
      dst[prop] = args[prop];
    }
    return dst;
  },
  merge : function(dst, defaults, args){
    for(var prop in defaults){
      dst[prop] = (typeof args[prop] == "undefined")? defaults[prop] : args[prop];
    }
    return dst;
  }
};

var Exceptions = {
  PAGE_BREAK:2,
  LINE_BREAK:3,
  BUFFER_END:4,
  OVER_FLOW:5,
  RETRY:6,
  SKIP:7,
  BREAK:8,
  toString : function(num){
    for(var prop in this){
      if(this[prop] === num){
	return prop;
      }
    }
    return "??";
  }
};


  
/*
  supported css properties
  ==============================

  background-color
  background-image
  background-repeat
  border
  border-color
  border-radius
  border-style
  border-width
  box-sizing
  color
  display
  font-family
  font-size
  font-style
  font-weight
  float
  flow(nehan sepcial property)
  line-rate(nehan special property)
  list-style
  list-style-image
  list-style-position
  list-style-type
  margin
  padding
  text-align
  text-combine(horizontal only)
  text-emphasis-style

 */
var CssParser = (function(){
  var normalize = function(value){
    return Utils.trim(String(value))
      .replace(/;/g, "")
      .replace(/\n/g, "");
  };

  var split_space = function(value){
    return (value.indexOf(" ") < 0)? [value] : value.split(/\s+/);
  };

  var split_slash = function(value){
    return (value.indexOf("/") < 0)? [value] : value.split("/");
  };

  // props: [a,b,c]
  // values:[1,2,3]
  // => {a:1, b:2, c:3}
  var zip_obj = function(props, values){
    var ret = {};
    if(props.length !== values.length){
      throw "invalid args:zip_obj";
    }
    List.iteri(props, function(i, prop){ ret[prop] = values[i]; });
    return ret;
  };

  var get_map_2d = function(len){
    return Const.css2dIndex[Math.min(len, 2)] || [];
  };

  var get_map_4d = function(len){
    return Const.css4dIndex[Math.min(len, 4)] || [];
  };

  // values:[a,b]
  // map: [0,1,0,1]
  // => [values[0], values[1], values[0], values[1]]
  // => [a, b, a, b]
  var make_values_by_map = function(values, map){
    return List.map(map, function(index){ return values[index]; });
  };

  // values:[0] => [0,0]
  // values:[0,1] => [0,1]
  var make_values_2d = function(values){
    var map = get_map_2d(values.length);
    return make_values_by_map(values, map);
  };

  // values:[0] => [0,0,0,0],
  // values:[0,1,2,3] => [0,1,2,3]
  var make_values_4d = function(values){
    var map = get_map_4d(values.length);
    return make_values_by_map(values, map);
  };

  var make_edge_4d = function(values){
    var props = Const.cssBoxDirsLogical; // len = 4
    var values_4d = make_values_4d(values); // len = 4
    return zip_obj(props, values_4d);
  };

  var make_corner_4d = function(values){
    var props = Const.cssBoxCornersLogical; // len = 4
    var values_4d = make_values_4d(values); // len = 4
    return zip_obj(props, values_4d);
  };

  var parse_edge_4d = function(value){
    return make_edge_4d(split_space(value));
  };

  var parse_corner_2d = function(value){
    return make_values_2d(split_space(value));
  };

  var parse_corner_4d = function(value){
    var values_2d = make_values_2d(split_slash(value));
    var values_4d_2d = List.map(values_2d, function(val){
      return make_values_4d(split_space(val));
    });
    var values = List.zip(values_4d_2d[0], values_4d_2d[1]);
    return make_corner_4d(values);
  };

  var parse_border_abbr = function(value){
    var ret = [];
    var values = split_space(value);
    var arg_len = values.length;
    if(arg_len >= 1){
      ret.push({"border-width":parse_edge_4d(values[0])});
    }
    if(arg_len >= 2){
      ret.push({"border-style":parse_edge_4d(values[1])});
    }
    if(arg_len >= 3){
      ret.push({"border-color":parse_edge_4d(values[2])});
    }
    return ret;
  };

  var parse_list_style_abbr = function(value){
    var ret = [];
    var values = split_space(value);
    var arg_len = values.length;
    if(arg_len >= 1){
      ret.push({"list-style-type":parse_edge_4d(values[0])});
    }
    if(arg_len >= 2){
      ret.push({"list-style-image":parse_edge_4d(values[1])});
    }
    if(arg_len >= 3){
      ret.push({"list-style-position":parse_edge_4d(values[2])});
    }
    return ret;
  };

  var parse_font_abbr = function(value){
    return {}; // TODO
  };

  var parse_background_abbr = function(value){
    return {}; // TODO
  };

  var format = function(prop, value){
    if(typeof value === "function" || typeof value === "object"){
      return value;
    }
    value = normalize(value);
    switch(prop){
    case "background":
      return parse_background_abbr(value);
    case "border":
      return parse_border_abbr(value);
    case "border-color":
      return parse_edge_4d(value);
    case "border-radius":
      return parse_corner_4d(value);
    case "border-style":
      return parse_edge_4d(value);
    case "border-width":
      return parse_edge_4d(value);
    case "font":
      return parse_font_abbr(value);
    case "list-style":
      return parse_list_style_abbr(value);
    case "margin":
      return parse_edge_4d(value);
    case "padding":
      return parse_edge_4d(value);
    default: return value;
    }
  };

  return {
    format : function(prop, value){
      try {
	return format(prop, value);
      } catch(e){
	//console.log(e);
	return {};
      }
    }
  };
})();


var Selector = (function(){
  function Selector(key, value){
    this.key = this._createKey(key);
    this.rex = this._createRegExp(this.key);
    this.value = this._formatValue(value);
  }

  var set_format_value = function(ret, prop, format_value){
    if(format_value instanceof Array){
      set_format_values(ret, format_value);
    } else {
      ret[prop] = format_value;
    }
  };

  var set_format_values = function(ret, format_values){
    List.iter(format_values, function(fmt_value){
      for(var prop in fmt_value){
	set_format_value(ret, prop, fmt_value[prop]);
      }
    });
  };

  Selector.prototype = {
    getKey : function(){
      return this.key;
    },
    getValue : function(){
      return this.value;
    },
    test : function(dst_key){
      dst_key = dst_key.toLowerCase();
      if(this.rex === null){
	return this.key === dst_key;
      }
      return this.rex.test(dst_key);
    },
    hasClass : function(){
      return (/\.[^\.\s]+/).test(this.key);
    },
    hasId : function(){
      return (/#[^#\s]+/).test(this.key);
    },
    hasContext : function(){
      return (/[\S]+\s+[\S]+/).test(this.key);
    },
    _formatValue : function(value){
      var ret = {};
      for(var prop in value){
	set_format_value(ret, prop, CssParser.format(prop, value[prop]));
      }
      return ret;
    },
    _createKey : function(key){
      return Utils.trim(key).toLowerCase()
	.replace(/\s+/g, " ") // shorten space
      ;
    },
    _createPattern : function(key){
      return key
	.replace(/([^\s#\^]*)#(\S+)/g, "$1#$2")
	.replace(/([^\s\.\^]*)\.(\S+)/g, "$1\\.$2")
	.replace(/\s/g, "(\\s|[a-z0-9-_=:\\[\\]])*") + "$";
    },
    _createRegExp : function(key){
      if(!this.hasId() && !this.hasClass() && !this.hasContext()){
	return null;
      }
      var pat = this._createPattern(key);
      return new RegExp(pat);
    }
  };

  return Selector;
})();


var Selectors = (function(){
  var selectors = [];

  // initialize default selectors
  for(var selector_key in Style){
    selectors.push(new Selector(selector_key, Style[selector_key]));
  }

  return {
    setValue : function(selector_key, value){
      if(Style[selector_key]){
	Args.copy(Style[selector_key], value);
      } else {
	Style[selector_key] = value;
	selectors.push(new Selector(selector_key, value));
      }
    },
    getValue : function(selector_key){
      return List.fold(selectors, {}, function(ret, selector){
	return selector.test(selector_key)? Args.copy(ret, selector.getValue()) : ret;
      });
    },
    getMergedValue : function(selector_keys){
      var self = this;
      return List.fold(selector_keys, {}, function(ret, selector_key){
	return Args.copy(ret, self.getValue(selector_key));
      });
    }
  };
})();

var TagAttrParser = (function(){
  var parse = function(src, attr){
    var peek = function(){
      return src.charAt(0);
    };

    var step = function(count){
      src = src.substring(count);
    };

    var get_symbol = function(delimiters){
      var delim_pos = -1;
      List.iter(delimiters, function(delim){
	var pos = src.indexOf(delim, 1);
	if(delim_pos < 0 || pos < delim_pos){
	  delim_pos = pos;
	}
      });
      return (delim_pos >= 0)? src.substring(0, delim_pos) : src;
    };

    var get_quoted_value = function(quote_str){
      var quote_pos = src.indexOf(quote_str, 1);
      return (quote_pos >= 1)? src.substring(1, quote_pos) : src;
    };

    var get_attr = function(left){
      if(src === ""){
	if(left){
	  attr[left] = true;
	}
	return;
      }
      var s1 = peek();
      var value;
      if(s1 === " "){
	step(1);
	arguments.callee(left);
      } else if(s1 === "="){
	step(1);
	if(src.length > 0){
	  var s2 = peek();
	  if(s2 === "\"" || s2 === "'"){
	    value = get_quoted_value(s2);
	    step(value.length + 2);
	  } else {
	    value = get_symbol([" "]);
	    step(value.length);
	  }
	  attr[left] = value;
	}
      } else if(left){
	attr[left] = true; // value empty attribute
      } else {
	left = get_symbol([" ", "="]);
	step(left.length);
	arguments.callee(left);
      }
    };

    while(src !== ""){
      get_attr();
    }
    return attr;
  };

  // <img src='/path/to/img' title='aaa' />
  // => "src='/path/to/img title='aaa'"
  var normalize = function(src){
    return src
      .replace(/<[\S]+/, "") // cut tag start
      .replace(/^\s+/, "") // cut head space
      .replace("/>", "") // cut tag tail(close tag)
      .replace(">", "") // cut tag tail(open tag)
      .replace(/\s+$/, "") // cut tail space
      .replace(/\n/g, "") // conv from multi line to single line
      .replace(/[　|\s]+/g, " ") // conv from multi space to single space
      .replace(/\s+=/g, "=") // cut multi space before '='
      .replace(/=\s+/g, "="); // cut multi space after '='
  };

  return {
    parse : function(src){
      src = normalize(src);
      return parse(src, {});
    }
  };
})();

var Tag = (function (){
  function Tag(src, content){
    this._type = "tag";
    this._inherited = false; // flag to avoid duplicate inheritance
    this.src = src;
    this.name = this._parseName(this.src);
    this.parent = null;
    this.contentRaw = content || "";
    this.dataset = {};
    this.tagAttr = {};
    this.cssAttrContext = {};
    this.cssAttrDynamic = {}; // updated by 'setCssAttr'.
    this.childs = []; // updated by inherit

    this.tagAttr = this._parseTagAttr(this.src);
    this.id = this._parseId();
    this.classes = this._parseClasses();
    this.selectors = this._parseSelectors(this.id, this.classes);
    this.cssAttrContext = this._parseCssAttr(this.selectors);
  }

  // name and value regexp
  var rex_first_letter = /(^(<[^>]+>|[\s\n])*)(\S)/mi;
  
  // utility functions
  var is_style_enable = function(name, prop){
    var element = Style[name] || null;
    return element? (element[prop] || false) : false;
  };
  var is_single_tag = function(name){
    return is_style_enable(name, "single");
  };
  var is_section_tag = function(name){
    return is_style_enable(name, "section");
  };
  var is_section_root_tag = function(name){
    return is_style_enable(name, "section-root");
  };
  var css_attr_cache = {};
  var add_css_attr_cache = function(key, value){
    css_attr_cache[key] = value;
  };
  var get_css_attr_cache = function(key){
    return css_attr_cache[key] || null;
  };

  Tag.prototype = {
    // copy parent settings in 'markup' level
    inherit : function(parent_tag){
      if(this._inherited){
	return; // avoid duplicate initialize
      }
      var self = this;
      this.parent = parent_tag;
      this.parent.addChild(this);
      if(parent_tag.getName() != "body"){
	var prev_selector_size = this.selectors.length;
	var parent_selectors = parent_tag.getSelectors();
	var ctx_selectors = this._parseContextSelectors(parent_selectors);
	this.selectors = this.selectors.concat(ctx_selectors);
	if(this.selectors.length > prev_selector_size){
	  this.cssAttrContext = this._parseCssAttr(this.selectors); // update style by new selector list
	}
      }
      // copy 'inherit' value from parent.
      for(var prop in this.cssAttrContext){
	if(this.cssAttrContext[prop] === "inherit"){
	  this.setCssAttr(prop, parent_tag.getAttr(prop));
	}
      }
      this.fullSelectorCacheKey = this._getCssCacheKey(this.selectors);
      this._inherited = true;
    },
    setContentRaw : function(content_raw){
      this.contentRaw = content_raw;
    },
    setTagAttr : function(name, value){
      this.tagAttr[name] = value;
    },
    setCssAttr : function(name, value){
      this.cssAttrDynamic[name] = value;
    },
    setCssAttrs : function(obj){
      for(var prop in obj){
	this.setCssAttr(prop, obj[prop]);
      }
    },
    setFirstChild : function(){
      var css = this.getPseudoClassCssAttr("first-child");
      this.setCssAttrs(css);
    },
    setFirstLetter : function(){
      var cache_key = this.getDataset("key");
      var cache = get_css_attr_cache(cache_key);
      if(cache){
	this.setCssAttrs(cache);
      }
    },
    addChild : function(tag){
      this.childs.push(tag);
    },
    addClass : function(klass){
      this.classes.push(klass);
    },
    removeClass : function(klass){
      this.classes = List.filter(this.classes, function(cls){
	return cls != klass;
      });
    },
    iterTagAttr : function(fn){
      List.each(this.tagAttr, fn);
    },
    iterCssAttrDynamic : function(fn){
      List.each(this.cssAttrDynamic, fn);
    },
    iterCssAttrContext : function(fn){
      List.each(this.cssAttrContext, fn);
    },
    iterCssAttr : function(fn){
      this.iterCssAttrContext(fn);
      this.iterCssAttrDynamic(fn); // dynamic attrs prior to static ones.
    },
    iterAttr : function(fn){
      this.iterCssAttr(fn);
      this.iterTagAttr(fn); // inline attrs prior to css attrs.
    },
    getName : function(){
      return this.name;
    },
    getAttr : function(name, def_value){
      return this.getTagAttr(name) || this.getCssAttr(name) || ((typeof def_value !== "undefined")? def_value : null);
    },
    getParent : function(){
      return this.parent || null;
    },
    getChilds : function(){
      return this.childs;
    },
    getParentChilds : function(){
      return this.parent? this.parent.getChilds() : [];
    },
    getParentTypeChilds : function(){
      var name = this.getName();
      return List.filter(this.getParentChilds(), function(tag){
	return tag.getName() === name;
      });
    },
    getOrder : function(){
      return this.order || -1;
    },
    getPseudoClassCssAttr : function(class_name){
      var selectors = this._parsePseudoClassSelectors(class_name);
      return this._parseCssAttr(selectors);
    },
    getPseudoElementCssAttr : function(element_name){
      var selectors = this._parsePseudoElementSelectors(element_name);
      return this._parseCssAttr(selectors);
    },
    getSelectors : function(){
      return this.selectors;
    },
    getCssClasses : function(){
      return this.classes.join(" ");
    },
    getTagAttr : function(name, def_value){
      return this.tagAttr[name] || ((typeof def_value !== "undefined")? def_value : null);
    },
    getCssAttr : function(name, def_value){
      return this.cssAttrDynamic[name] || this.cssAttrContext[name] || ((typeof def_value !== "undefined")? def_value : null);
    },
    // used for property that could be contructed with multiple values such as margin(start/end/before/after).
    // for example, when we get "margin" of some target,
    // we read style from default css, and context selector css, and inline style,
    // and we must 'merge' them to get strict style settings.
    getCssAttrs : function(name, def_value){
      return List.fold([this.cssAttrContext, this.cssAttrDynamic], [], function(ret, target){
	if(typeof target[name] !== "undefined"){
	  ret.push(target[name]);
	}
	return ret;
      });
    },
    getDataset : function(name, def_value){
      return this.dataset[name] || ((typeof def_value !== "undefined")? def_value : null);
    },
    getOpenTagName : function(){
      var name = this.getName();
      return this.isClose()? name.slice(1) : name;
    },
    getContentRaw : function(){
      return this.contentRaw;
    },
    getContent : function(){
      if(this.content){
	return this.content;
      }
      this.content = this._parseContent(this.contentRaw);
      return this.content;
    },
    getCloseTag : function(){
      return new Tag(this.getCloseSrc());
    },
    getCloseSrc : function(){
      if(this.isClose()){
	return this.src;
      }
      return "</" + this.getName() + ">";
    },
    getSrc : function(){
      return this.src;
    },
    getLogicalFloat : function(){
      return this.getCssAttr("float", "none");
    },
    getHeaderRank : function(){
      if(this.getName().match(/h([1-6])/)){
	return parseInt(RegExp.$1, 10);
      }
      return 0;
    },
    getStaticSize : function(font_size, max_size){
      var width = this.getAttr("width");
      var height = this.getAttr("height");
      if(width && height){
	width = UnitSize.getBoxSize(width, font_size, max_size);
	height = UnitSize.getBoxSize(height, font_size, max_size);
	return new BoxSize(width, height);
      }
      // if img tag size not defined, treat it as character size icon.
      // so, if basic font size is 16px, you can write <img src='/path/to/icon'>
      // instead of writing <img src='/path/to/icon' width='16' height='16'>
      if(this.name === "img"){
	var icon_size = Layout.fontSize;
	return new BoxSize(icon_size, icon_size);
      }
      return null;
    },
    getBoxEdge : function(flow, font_size, max_measure){
      var padding = this.getCssAttr("padding");
      var margin = this.getCssAttr("margin");
      var border_width = this.getCssAttr("border-width");
      var border_color = this.getCssAttr("border-color");
      var border_style = this.getCssAttr("border-style");
      var border_radius = this.getCssAttr("border-radius");
      if(padding === null &&
	 margin === null &&
	 border_width === null &&
	 border_radius === null){
	return null;
      }
      var edge = new BoxEdge();
      if(padding){
	var padding_size = UnitSize.getEdgeSize(padding, font_size);
	edge.setSize("padding", flow, padding_size);
      }
      if(margin){
	var margin_size = UnitSize.getEdgeSize(margin, font_size);
	edge.setSize("margin", flow, margin_size);
      }
      if(border_width){
	var border_width_size = UnitSize.getEdgeSize(border_width, font_size);
	edge.setSize("border", flow, border_width_size);
      }
      if(border_radius){
	var border_radius_size = UnitSize.getCornerSize(border_radius, font_size);
	edge.setBorderRadius(flow, border_radius_size);
      }
      if(border_color){
	edge.setBorderColor(flow, border_color);
      }
      if(border_style){
	edge.setBorderStyle(flow, border_style);
      }
      return edge;
    },
    hasStaticSize : function(){
      return (this.getAttr("width") !== null && this.getAttr("height") !== null);
    },
    hasFlow : function(){
      return this.getCssAttr("flow") !== null;
    },
    hasClass : function(klass){
      return List.exists(this.classes, Closure.eq(klass));
    },
    hasLayout : function(){
      var name = this.getName();
      return (name != "br" && name != "page-break" && name != "end-page");
    },
    isPseudoElement : function(){
      return this.name === "before" || this.name === "after" || this.name === "first-letter" || this.name === "first-line";
    },
    isClassAttrEnable : function(){
      return (typeof this.tagAttr["class"] != "undefined");
    },
    isFloated : function(){
      return this.getLogicalFloat() != "none";
    },
    isPush : function(){
      return (typeof this.tagAttr.push != "undefined");
    },
    isPull : function(){
      return (typeof this.tagAttr.pull != "undefined");
    },
    isOpen : function(){
      if(is_single_tag()){
	return false;
      }
      return this.name.substring(0,1) !== "/";
    },
    isClose : function(){
      return this.name.substring(0,1) === "/";
    },
    isAnchorTag : function(){
      return this.name === "a" && this.getTagAttr("name") !== null;
    },
    isAnchorLinkTag : function(){
      var href = this.getTagAttr("href");
      return this.name === "a" && href && href.indexOf("#") >= 0;
    },
    isEmbeddableTag : function(){
      return this.getCssAttr("embeddable") === true;
    },
    isBlock : function(){
      // floated block with static size is treated as block level floated box.
      if(this.hasStaticSize() && this.isFloated()){
	return true;
      }
      if(this.isPush() || this.isPull()){
	return true;
      }
      return this.getCssAttr("display", "inline") === "block";
    },
    isInline : function(){
      var display = this.getCssAttr("display", "inline");
      return (display === "inline" || display === "inline-block");
    },
    isInlineBlock : function(){
      return this.getCssAttr("display", "inline") === "inline-block";
    },
    isSingleTag : function(){
      return is_single_tag(this.getName());
    },
    isChildContentTag : function(){
      if(this.isSingleTag()){
	return false;
      }
      return true;
    },
    isTcyTag : function(){
      return this.getCssAttr("text-combine", "") === "horizontal";
    },
    isSectionRootTag : function(){
      return is_section_root_tag(this.getName());
    },
    isSectionTag : function(){
      return is_section_tag(this.getName());
    },
    isBoldTag : function(){
      var name = this.getName();
      return name === "b" || name === "strong";
    },
    isHeaderTag : function(){
      return this.getHeaderRank() > 0;
    },
    // check if 'single' page-break-tag
    // not see page-break-xxx:'always'
    isPageBreakTag : function(){
      var name = this.getName();
      return name === "end-page" || name === "page-break";
    },
    _getChildIndexFrom : function(childs){
      var self = this;
      return List.indexOf(childs, function(tag){
	return Token.isSame(self, tag);
      });
    },
    getChildNth : function(){
      return this._getChildIndexFrom(this.getParentChilds());
    },
    getLastChildNth : function(){
      return this._getChildIndexFrom(List.reverse(this.getParentChilds()));
    },
    getChildOfTypeNth : function(){
      return this._getChildIndexFrom(this.getParentTypeChilds());
    },
    getLastChildOfTypeNth : function(){
      return this._getChildIndexFrom(this.getParentTypeChilds());
    },
    isFirstChild : function(){
      return this.getChildNth() === 0;
    },
    isLastChild : function(){
      var childs = this.getParentChilds();
      return this.getChildNth() === (childs.length - 1);
    },
    isFirstOfType : function(){
      return this.getChildOfTypeNth() === 0;
    },
    isLastOfType : function(){
      var childs = this.getParentTypeChilds();
      return this.getChildOfTypeNth() === (childs.length - 1);
    },
    isOnlyChild : function(){
      return this.getParentChilds().length === 1;
    },
    isOnlyOfType : function(){
      var childs = this.getParentTypeChilds();
      return (childs.length === 1 && Token.isSame(childs[0], this));
    },
    isRoot : function(){
      return this.parent === null;
    },
    isEmpty : function(){
      return this.getContent() === "";
    },
    _getCssCacheKey : function(selectors){
      return selectors.join("*");
    },
    _getPseudoElementCssCacheKey : function(element_name){
      return [this.fullSelectorCacheKey, element_name].join("::");
    },
    _parseName : function(src){
      return src.replace(/</g, "").replace(/\/?>/g, "").split(/\s/)[0].toLowerCase();
    },
    _parseId : function(){
      return this.tagAttr.id || "";
    },
    // <p class='hi hey'>
    // => ["hi", "hey"]
    _parseClasses : function(){
      var str = this.tagAttr["class"] || "";
      if(str === ""){
	return [];
      }
      return str.split(/\s+/);
    },
    // <p class='hi hey'>
    // => [".hi", ".hey"]
    _parseCssClasses : function(classes){
      return List.map(classes, function(class_name){
	return "." + class_name;
      });
    },
    // <p id='foo' class='hi hey'>
    // => ["p", "p.hi", "p.hey", "p#foo"]
    _parseSelectors : function(id, classes){
      var tag_name = this.getName();
      var basic_selector = [tag_name];
      var class_selectors = List.map(classes, function(class_name){
	return tag_name + "." + class_name;
      });
      var id_selector = id? [tag_name + "#" + id] : [];
      return basic_selector.concat(class_selectors).concat(id_selector);
    },
    // parent_keys: ["div", "div.parent"]
    // child_keys: ["p", "p.child"]
    // =>["div p", "div p.child", "div.parent p", "div.parent p.child"]
    _parseContextSelectors : function(parent_selectors){
      var child_selectors = this.selectors;
      return List.fold(parent_selectors, [], function(ret1, parent_key){
	return ret1.concat(List.fold(child_selectors, [], function(ret2, child_key){
	  return ret2.concat([parent_key + " " + child_key]);
	}));
      });
    },
    // if class_name is "first-child",
    // and this.selectors is ["p", "p.hoge"]
    // => ["p:first-child", "p.hoge:first-child"]
    _parsePseudoClassSelectors : function(class_name){
      return List.map(this.selectors, function(key){
	return key + ":" + class_name;
      });
    },
    // if element_name is "before",
    // and this.selectors is ["p", "p.hoge"]
    // => ["p::before", "p.hoge::before"]
    _parsePseudoElementSelectors : function(element_name){
      return List.map(this.selectors, function(key){
	return key + "::" + element_name;
      });
    },
    _parseCssAttr : function(selectors){
      var cache_key = this._getCssCacheKey(selectors);
      var cache = get_css_attr_cache(cache_key);
      if(cache === null){
	cache = Selectors.getMergedValue(selectors);
	add_css_attr_cache(cache_key, cache);
      }
      return cache;
    },
    _parsePseudoElementContentSrc : function(element_name){
      var css_attr = this.getPseudoElementCssAttr(element_name);
      if(Obj.isEmpty(css_attr)){
	return "";
      }
      var cache_key = this._getPseudoElementCssCacheKey(element_name);
      add_css_attr_cache(css_attr);
      var content = css_attr.content || "";
      return Html.tagWrap(element_name, content, {"data-key":cache_key});
    },
    _appendFirstLetter : function(content){
      var css_attr = this.getPseudoElementCssAttr("first-letter");
      if(Obj.isEmpty(css_attr)){
	return content;
      }
      var cache_key = this._getPseudoElementCssCacheKey(this.selectors, "first-letter");
      add_css_attr_cache(cache_key, css_attr);
      return content.replace(rex_first_letter, function(match, p1, p2, p3){
	return p1 + Html.tagStart("first-letter", {"data-key":cache_key}) + p3 + "</first-letter>";
      });
    },
    _parseContent : function(content_raw){
      var before = this._parsePseudoElementContentSrc("before");
      var after = this._parsePseudoElementContentSrc("after");
      return this._appendFirstLetter([before, content_raw, after].join(""));
    },
    // <img src='/path/to/img' push>
    // => {src:'/path/to/img', push:true}
    _parseTagAttr : function(src){
      var self = this;
      var attr = TagAttrParser.parse(this.src);
      for(var name in attr){
	// inline style
	if(name === "style"){
	  // add to dynamic css
	  var inline_css = this._parseInlineStyle(attr[name]);
	  Args.copy(this.cssAttrDynamic, inline_css);
	} else if(name.indexOf("data-") === 0){
	  // <div data-name="john">
	  // => {name:"john"}
	  var dataset_name = this._parseDatasetName(name);
	  this.dataset[dataset_name] = attr[name];
	}
      }
      return attr;
    },
    // "border:0; margin:0"
    // => {border:0, margin:0}
    _parseInlineStyle : function(src){
      var attr = {};
      var stmts = (src.indexOf(";") >= 0)? src.split(";") : [src];
      List.iter(stmts, function(stmt){
	var nv = stmt.split(":");
	if(nv.length >= 2){
	  var prop = Utils.trim(nv[0]);
	  var val = Utils.trim(nv[1]);
	  attr[prop] = val;
	}
      });
      return attr;
    },
    // "data-name" => "name"
    // "data-family-name" => "familyName"
    _parseDatasetName : function(prop){
      var hyp_name = prop.slice(5); // 5 is "data-".length
      return Utils.getCamelName(hyp_name);
    }
  };

  return Tag;
})();


var Token = {
  isSame : function(token1, token2){
    return token1._gtid === token2._gtid;
  },
  isTag : function(token){
    return token._type === "tag";
  },
  isText : function(token){
    return token._type === "char" || token._type === "word" || token._type === "tcy";
  },
  isChar : function(token){
    return token._type === "char";
  },
  isWord : function(token){
    return token._type === "word";
  },
  isTcy : function(token){
    return token._type === "tcy";
  },
  isInline : function(token){
    if(this.isText(token)){
      return true;
    }
    if(token.isBlock()){
      return false;
    }
    return token.isInline() || token.isInlineBlock();
  }
};


var Char = (function(){
  function Char(c1, is_ref){
    this.data = c1;
    this._type = "char";
    this.isRef = is_ref || false;
    if(!this.isRef){
      this._setup(c1.charCodeAt(0));
    }
  }
  var kuten = ["\u3002","."];
  var touten = ["\u3001", ","];
  var kakko_start = ["\uff62","\u300c","\u300e","\u3010","\uff3b","\uff08","\u300a","\u3008","\u226a","\uff1c","\uff5b","\x7b","\x5b","\x28"];
  var kakko_end = ["\u300d","\uff63","\u300f","\u3011","\uff3d","\uff09","\u300b","\u3009","\u226b","\uff1e","\uff5d","\x7d","\x5d","\x29"];

  var small_kana = ["\u3041","\u3043","\u3045","\u3047","\u3049","\u3063","\u3083","\u3085","\u3087","\u308e","\u30a1","\u30a3","\u30a5","\u30a7","\u30a9","\u30f5","\u30f6","\u30c3","\u30e3","\u30e5","\u30e7","\u30ee"];

  var head_ng = ["\uff09","\x5c","\x29","\u300d","\u3011","\u3015","\uff3d","\x5c","\x5d","\u3002","\u300f","\uff1e","\u3009","\u300b","\u3001","\uff0e","\x5c","\x2e","\x2c","\u201d","\u301f"];

  var tail_ng = ["\uff08","\x5c","\x28","\u300c","\u3010","\uff3b","\u3014","\x5c","\x5b","\u300e","\uff1c","\u3008","\u300a","\u201c","\u301d"];

  Char.prototype = {
    getCssPadding : function(line){
      var padding = new Padding();
      if(this.paddingStart){
	padding.setStart(line.flow, this.paddingStart);
      }
      if(this.paddingEnd){
	padding.setEnd(line.flow, this.paddingEnd);
      }
      return padding.getCss();
    },
    getCssVertGlyph : function(line){
      var css = {};
      var padding_enable = this.isPaddingEnable();
      css["-webkit-writing-mode"] = "vertical-rl";
      css["margin-left"] = "auto";
      css["margin-right"] = "auto";
      if(this.isKakkoStart()){
	if(!padding_enable){
	  css["margin-top"] = "-0.5em";
	}
      } else {
	if(this.getVertScale() < 1){
	  css.height = "0.5em";
	}
	if(padding_enable){
	  css["margin-bottom"] = "0.5em";
	}
      }
      return css;
    },
    getCssVertImgChar : function(line){
      var css = {};
      css.display = "block";
      css.width = line.fontSize + "px";
      css.height = this.getVertHeight(line.fontSize) + "px";
      css["margin-left"] = "auto";
      css["margin-right"] = "auto";
      if(this.isPaddingEnable()){
	Args.copy(css, this.getCssPadding(line));
      }
      return css;
    },
    getCssVertEmphaSrc : function(line){
      var css = {};
      return css;
    },
    getCssVertEmphaText : function(line){
      var css = {};
      css.display = "inline-block";
      css.width = line.fontSize + "px";
      css.height = line.fontSize + "px";
      return css;
    },
    getCssHoriEmphaSrc : function(line){
      var css = {};
      return css;
    },
    getCssHoriEmphaText : function(line){
      var css = {};
      css["margin-bottom"] = "-0.5em";
      return css;
    },
    getCssVertLetterSpacing : function(line){
      var css = {};
      css["margin-bottom"] = line.letterSpacing + "px";
      return css;
    },
    getCssVertHalfSpaceChar : function(line){
      var css = {};
      var half = Math.floor(line.fontSize / 2);
      css.height = half + "px";
      css["line-height"] = half + "px";
      return css;
    },
    getCssVertSmallKana : function(){
      var css = {};
      css.position = "relative";
      css.top = "-0.1em";
      css.right = "-0.12em";
      css.height = this.bodySize + "px";
      css["line-height"] = this.bodySize + "px";
      return css;
    },
    getHoriScale : function(){
      return this.hscale? this.hscale : 1;
    },
    getVertScale : function(){
      return this.vscale? this.vscale : 1;
    },
    getVertHeight : function(font_size){
      var vscale = this.getVertScale();
      return (vscale === 1)? font_size : Math.floor(font_size * vscale);
    },
    hasMetrics : function(){
      return (typeof this.bodySize != "undefined");
    },
    getAdvance : function(flow, letter_spacing){
      return this.bodySize + this.getPaddingSize() + letter_spacing;
    },
    getPaddingSize : function(){
      return (this.paddingStart || 0) + (this.paddingEnd || 0);
    },
    getCharCount : function(){
      if(this.data === " " || this.data === "\t" || this.data === "\u3000"){
	return 0;
      }
      return 1;
    },
    setMetrics : function(flow, font_size, is_bold){
      var is_vert = flow.isTextVertical();
      var step_scale = is_vert? this.getVertScale() : this.getHoriScale();
      this.bodySize = (step_scale != 1)? Math.floor(font_size * step_scale) : font_size;
      if(this.spaceRateStart){
	this.paddingStart = Math.floor(this.spaceRateStart * font_size);
      }
      if(this.spaceRateEnd){
	this.paddingEnd = Math.floor(this.spaceRateEnd * font_size);
      }
      if(this.img && this.img === "tenten"){
	this.bodySize = font_size;
      }
      if(!is_vert && !this.isRef && this.isHankaku()){
	this.bodySize = Math.floor(font_size / 2);
      }
    },
    _setImg : function(img, vscale, hscale){
      this.img = img;
      this.vscale = vscale || 1;
      this.hscale = hscale || this.vscale;
    },
    _setCnv : function(cnv, vscale, hscale){
      this.cnv = cnv;
      this.vscale = vscale || 1;
      this.hscale = hscale || this.vscale;
    },
    _setup : function(code){
      switch(code){
      case 32: // half scape char
	this._setCnv("&nbsp;", 0.5, 0.5); break;
      case 12300:
	this._setImg("kakko1", 0.5); break;
      case 65378:
	this._setImg("kakko1", 0.5); break;
      case 12301:
	this._setImg("kakko2", 0.5); break;
      case 65379:
	this._setImg("kakko2", 0.5); break;
      case 12302:
	this._setImg("kakko3", 0.5); break;
      case 12303:
	this._setImg("kakko4", 0.5); break;
      case 65288:
	this._setImg("kakko5", 0.5); break;
      case 40:
	this._setImg("kakko5", 0.5); break;
      case 65371:
	this._setImg("kakko5", 0.5); break;
      case 123:
	this._setImg("kakko5", 0.5); break;
      case 65289:
	this._setImg("kakko6", 0.5); break;
      case 41:
	this._setImg("kakko6", 0.5); break;
      case 65373:
	this._setImg("kakko6", 0.5); break;
      case 125:
	this._setImg("kakko6", 0.5); break;
      case 65308:
	this._setImg("kakko7", 0.5); break;
      case 60:
	this._setImg("kakko7", 0.5); break;
      case 12296:
	this._setImg("kakko7", 0.5); break;
      case 65310:
	this._setImg("kakko8", 0.5); break;
      case 62:
	this._setImg("kakko8", 0.5); break;
      case 12297:
	this._setImg("kakko8", 0.5); break;
      case 12298:
	this._setImg("kakko9", 0.5); break;
      case 8810:
	this._setImg("kakko9", 0.5); break;
      case 12299:
	this._setImg("kakko10", 0.5); break;
      case 8811:
	this._setImg("kakko10", 0.5); break;
      case 65339:
	this._setImg("kakko11", 0.5); break;
      case 12308:
	this._setImg("kakko11", 0.5); break;
      case 91:
	this._setImg("kakko11", 0.5); break;
      case 65341:
	this._setImg("kakko12", 0.5); break;
      case 12309:
	this._setImg("kakko12", 0.5); break;
      case 93:
	this._setImg("kakko12", 0.5); break;
      case 12304:
	this._setImg("kakko17", 0.5); break;
      case 12305:
	this._setImg("kakko18", 0.5); break;
      case 65306:
	this._setImg("tenten", 0.5, 1); break;
      case 58:
	this._setImg("tenten", 0.5, 1); break;
      case 12290:
	this._setImg("kuten", 0.5); break;
      case 65377:
	this._setImg("kuten", 0.5); break;
      case 65294:
	this._setImg("period", 1); break;
      case 46:
	this._setImg("period", 1); break;
      case 12289:
	this._setImg("touten", 0.5); break;
      case 65380:
	this._setImg("touten", 0.5); break;
      case 44:
	this._setImg("touten", 0.5); break;
      case 65292:
	this._setImg("touten", 0.5); break;
      case 65374:
	this._setImg("kara", 1); break;
      case 12316:
	this._setImg("kara", 1); break;
      case 8230:
	this._setImg("mmm", 1); break;
      case 8229:
	this._setImg("mm", 1); break;
      case 12317:
	this._setImg("dmn1", 1); break;
      case 12319:
	this._setImg("dmn2", 1); break;
      case 65309:
	this._setImg("equal", 1); break;
      case 61:
	this._setImg("equal", 1); break;
      case 12540:
	this._setImg("onbiki", 1); break;
      case 45:
	this._setCnv("&#65372;"); break;
      case 8213:
	this._setCnv("&#65372;"); break;
      case 65293:
	this._setCnv("&#65372;"); break;
      case 9472:
	this._setCnv("&#65372;"); break;
      case 8593: // up
	this._setCnv("&#8594;"); break;
      case 8594: // right
	this._setCnv("&#8595;"); break;
      case 8658: // right2
	this._setCnv("&#8595;"); break;
      case 8595: // down
	this._setCnv("&#8592;"); break;
      case 8592: // left
	this._setCnv("&#8593;"); break;
      }
    },
    isNewLineChar : function(){
      return this.data === "\n";
    },
    isImgChar : function(){
      return (typeof this.img != "undefined");
    },
    isCnvChar : function(){
      return (typeof this.cnv != "undefined");
    },
    isCharRef : function(){
      return this.isRef;
    },
    isHalfSpaceChar : function(){
      return (this.isCnvChar() && this.cnv === "&nbsp;");
    },
    isKerningChar : function(){
      return this.isKutenTouten() || this.isKakko();
    },
    getImgSrc : function(color){
      return [Layout.fontImgRoot, this.img, color + ".png"].join("/");
    },
    isPaddingEnable : function(){
      return (typeof this.paddingStart != "undefined" || typeof this.paddingEnd != "undefined");
    },
    isVertGlyphEnable : function(){
      return !this.isTenten() && Config.useVerticalGlyphIfEnable && Env.isVerticalGlyphEnable;
    },
    isTenten : function(){
      return this.img && this.img === "tenten";
    },
    isHeadNg : function(){
      return List.mem(head_ng, this.data);
    },
    isTailNg : function(){
      return List.mem(tail_ng, this.data);
    },
    isSmallKana : function(){
      return List.mem(small_kana, this.data);
    },
    isKakkoStart : function(){
      return List.mem(kakko_start, this.data);
    },
    isKakkoEnd : function(){
      return List.mem(kakko_end, this.data);
    },
    isKakko : function(){
      return this.isKakkoStart() || this.isKakkoEnd();
    },
    isKuten : function(){
      return List.mem(kuten, this.data);
    },
    isTouten : function(){
      return List.mem(touten, this.data);
    },
    isKutenTouten : function(){
      return this.isKuten() || this.isTouten();
    },
    isZenkaku : function(){
      return escape(this.data).charAt(1) === "u";
    },
    isHankaku : function(){
      return !this.isZenkaku(this.data);
    }
  };

  return Char;
})();

var Word = (function(){
  function Word(word, devided){
    this.data = word;
    this._type = "word";
    this._devided = devided || false;
  }

  Word.prototype = {
    getCssVertTrans : function(line){
      var css = {};
      css["letter-spacing"] = line.letterSpacing + "px";
      css.width = line.fontSize + "px";
      css.height = this.bodySize + "px";
      css["margin-left"] = css["margin-right"] = "auto";
      return css;
    },
    getCssVertTransIE : function(line){
      var css = {};
      css["float"] = "left";
      css["writing-mode"] = "tb-rl";
      css["letter-spacing"] = line.letterSpacing + "px";
      css["line-height"] = line.fontSize + "px";
      return css;
    },
    getCharCount : function(){
      return 1; // word is count by 1 character.
    },
    getAdvance : function(flow, letter_spacing){
      return this.bodySize + letter_spacing * this.getLetterCount();
    },
    hasMetrics : function(){
      return (typeof this.bodySize !== "undefined");
    },
    setMetrics : function(flow, font_size, is_bold){
      this.bodySize = this.data.length * Math.floor(font_size / 2);
      if(is_bold){
	var bold_rate = Layout.boldRate;
	this.bodySize += Math.floor(bold_rate * this.bodySize);
      }
    },
    getLetterCount : function(){
      return this.data.length;
    },
    setDevided : function(enable){
      this._devided = enable;
    },
    isDevided : function(){
      return this._devided;
    },
    // devide word by measure size and return first half of word.
    cutMeasure : function(font_size, measure){
      var half_size = Math.floor(font_size / 2);
      var this_half_count = Math.floor(this.bodySize / half_size);
      var measure_half_count = Math.floor(measure / half_size);
      if(this_half_count <= measure_half_count){
	return this;
      }
      var str_part = this.data.substring(0, measure_half_count);
      var word_part = new Word(str_part, true);
      this.data = this.data.slice(measure_half_count);
      this.setDevided(true);
      return word_part;
    }
  };
  
  return Word;
})();


var Tcy = (function(){
  function Tcy(tcy){
    this.data = tcy;
    this._type = "tcy";
  }

  Tcy.prototype = {
    getCharCount : function(){
      return 1;
    },
    getAdvance : function(flow, letter_spacing){
      return this.bodySize + letter_spacing;
    },
    hasMetrics : function(){
      return (typeof this.bodySize != "undefined");
    },
    setMetrics : function(flow, font_size, is_bold){
      this.bodySize = font_size;
    }
  };

  return Tcy;
})();


var Ruby = (function(){
  function Ruby(rbs, rt){
    this._type = "ruby";
    this.rbs = rbs;
    this.rt = rt;
    this.padding = new Padding();
  }

  Ruby.prototype = {
    hasMetrics : function(){
      return (typeof this.advanceSize !== "undefined");
    },
    getAdvance : function(flow){
      return this.advanceSize;
    },
    getExtent : function(font_size){
      return 3 * this.rubyFontSize + font_size;
    },
    getRbs : function(){
      return this.rbs;
    },
    getRtString : function(){
      return this.rt? this.rt.getContent() : "";
    },
    getRtFontSize : function(){
      return this.rubyFontSize;
    },
    getCssVertRuby : function(line){
      var css = {};
      css["margin-left"] = Math.floor((line.maxExtent - line.fontSize) / 2) + "px";
      css[line.flow.getPropExtent()] = this.getExtent(line.fontSize) + "px";
      css[line.flow.getPropMeasure()] = this.getAdvance() + "px";
      return css;
    },
    getCssHoriRuby : function(line){
      var css = {};
      css.display = "inline-block";
      return css;
    },
    getCssVertRt : function(line){
      var css = {};
      css["float"] = "left";
      return css;
    },
    getCssHoriRt : function(line){
      var css = {};
      css["font-size"] = css["line-height"] = this.getRtFontSize() + "px";
      css["vertical-align"] = "bottom";
      return css;
    },
    getCssVertRb : function(line){
      var css = {};
      css["float"] = "left";
      Args.copy(css, this.padding.getCss());
      return css;
    },
    getCssHoriRb : function(line){
      var css = {};
      Args.copy(css, this.padding.getCss());
      css["text-align"] = "center";
      return css;
    },
    setMetrics : function(flow, font_size, letter_spacing){
      this.rubyFontSize = Layout.getRubyFontSize(font_size);
      var advance_rbs = List.fold(this.rbs, 0, function(ret, rb){
	rb.setMetrics(flow, font_size);
	return ret + rb.getAdvance(flow, letter_spacing);
      });
      var advance_rt = this.rubyFontSize * this.getRtString().length;
      this.advanceSize = advance_rbs;
      if(advance_rt > advance_rbs){
	var ctx_space = Math.ceil((advance_rt - advance_rbs) / 2);
	if(this.rbs.length > 0){
	  this.padding.setStart(flow, ctx_space);
	  this.padding.setEnd(flow, ctx_space);
	}
	this.advanceSize += ctx_space + ctx_space;
      }
    }
  };

  return Ruby;
})();


var Rgb = (function(){
  function Rgb(value){
    this.value = String(value);
    this.red = parseInt(this.value.substring(0,2), 16);
    this.green = parseInt(this.value.substring(2,4), 16);
    this.blue = parseInt(this.value.substring(4,6), 16);
  }
  
  Rgb.prototype = {
    getRed : function(){
      return this.red;
    },
    getGreen : function(){
      return this.green;
    },
    getBlue : function(){
      return this.blue;
    },
    getColorValue : function(){
      return this.value;
    }
  };

  return Rgb;
})();

var Color = (function(){
  function Color(value){
    this.setValue(value);
  }

  Color.prototype = {
    setValue : function(value){
      this.value = Colors.get(value);
    },
    getValue : function(){
      return this.value;
    },
    getCssValue : function(){
      return (this.value === "transparent")? this.value : "#" + this.value;
    },
    getRgb : function(){
      return new Rgb(this.value);
    },
    getCss : function(){
      var css = {};
      css.color = this.getCssValue();
      return css;
    }
  };

  return Color;
})();

var Colors = (function(){
  var color_names = {
    "aliceblue":"f0f8ff",
    "antiquewhite":"faebd7",
    "aqua":"00ffff",
    "aquamarine":"7fffd4",
    "azure":"f0ffff",
    "beige":"f5f5dc",
    "bisque":"ffe4c4",
    "black":"000000",
    "blanchedalmond":"ffebcd",
    "blue":"0000ff",
    "blueviolet":"8a2be2",
    "brown":"a52a2a",
    "burlywood":"deb887",
    "cadetblue":"5f9ea0",
    "chartreuse":"7fff00",
    "chocolate":"d2691e",
    "coral":"ff7f50",
    "cornflowerblue":"6495ed",
    "cornsilk":"fff8dc",
    "crimson":"dc143c",
    "cyan":"00ffff",
    "darkblue":"00008b",
    "darkcyan":"008b8b",
    "darkgoldenrod":"b8860b",
    "darkgray":"a9a9a9",
    "darkgreen":"006400",
    "darkkhaki":"bdb76b",
    "darkmagenta":"8b008b",
    "darkolivegreen":"556b2f",
    "darkorange":"ff8c00",
    "darkorchid":"9932cc",
    "darkred":"8b0000",
    "darksalmon":"e9967a",
    "darkseagreen":"8fbc8f",
    "darkslateblue":"483d8b",
    "darkslategray":"2f4f4f",
    "darkturquoise":"00ced1",
    "darkviolet":"9400d3",
    "deeppink":"ff1493",
    "deepskyblue":"00bfff",
    "dimgray":"696969",
    "dodgerblue":"1e90ff",
    "firebrick":"b22222",
    "floralwhite":"fffaf0",
    "forestgreen":"228b22",
    "fuchsia":"ff00ff",
    "gainsboro":"dcdcdc",
    "ghostwhite":"f8f8ff",
    "gold":"ffd700",
    "goldenrod":"daa520",
    "gray":"808080",
    "green":"008000",
    "greenyellow":"adff2f",
    "honeydew":"f0fff0",
    "hotpink":"ff69b4",
    "indianred ":"cd5c5c",
    "indigo ":"4b0082",
    "ivory":"fffff0","khaki":"f0e68c",
    "lavender":"e6e6fa",
    "lavenderblush":"fff0f5",
    "lawngreen":"7cfc00",
    "lemonchiffon":"fffacd",
    "lightblue":"add8e6",
    "lightcoral":"f08080",
    "lightcyan":"e0ffff",
    "lightgoldenrodyellow":"fafad2",
    "lightgrey":"d3d3d3",
    "lightgreen":"90ee90",
    "lightpink":"ffb6c1",
    "lightsalmon":"ffa07a",
    "lightseagreen":"20b2aa",
    "lightskyblue":"87cefa",
    "lightslategray":"778899",
    "lightsteelblue":"b0c4de",
    "lightyellow":"ffffe0",
    "lime":"00ff00",
    "limegreen":"32cd32",
    "linen":"faf0e6",
    "magenta":"ff00ff",
    "maroon":"800000",
    "mediumaquamarine":"66cdaa",
    "mediumblue":"0000cd",
    "mediumorchid":"ba55d3",
    "mediumpurple":"9370d8",
    "mediumseagreen":"3cb371",
    "mediumslateblue":"7b68ee",
    "mediumspringgreen":"00fa9a",
    "mediumturquoise":"48d1cc",
    "mediumvioletred":"c71585",
    "midnightblue":"191970",
    "mintcream":"f5fffa",
    "mistyrose":"ffe4e1",
    "moccasin":"ffe4b5",
    "navajowhite":"ffdead",
    "navy":"000080",
    "oldlace":"fdf5e6",
    "olive":"808000",
    "olivedrab":"6b8e23",
    "orange":"ffa500",
    "orangered":"ff4500",
    "orchid":"da70d6",
    "palegoldenrod":"eee8aa",
    "palegreen":"98fb98",
    "paleturquoise":"afeeee",
    "palevioletred":"d87093",
    "papayawhip":"ffefd5",
    "peachpuff":"ffdab9",
    "peru":"cd853f",
    "pink":"ffc0cb",
    "plum":"dda0dd",
    "powderblue":"b0e0e6",
    "purple":"800080",
    "red":"ff0000",
    "rosybrown":"bc8f8f",
    "royalblue":"4169e1",
    "saddlebrown":"8b4513",
    "salmon":"fa8072",
    "sandybrown":"f4a460",
    "seagreen":"2e8b57",
    "seashell":"fff5ee",
    "sienna":"a0522d",
    "silver":"c0c0c0",
    "skyblue":"87ceeb",
    "slateblue":"6a5acd",
    "slategray":"708090",
    "snow":"fffafa",
    "springgreen":"00ff7f",
    "steelblue":"4682b4",
    "tan":"d2b48c",
    "teal":"008080",
    "thistle":"d8bfd8",
    "tomato":"ff6347",
    "turquoise":"40e0d0",
    "violet":"ee82ee",
    "wheat":"f5deb3",
    "white":"ffffff",
    "whitesmoke":"f5f5f5",
    "yellow":"ffff00",
    "yellowgreen":"9acd32",
    "transparent":"transparent"
  };

  var rex_hex_color = /^(?:[0-9a-f]{3}){1,2}$/;

  return {
    get : function(value){
      value = value.replace(/#/g, "").toLowerCase();
      if(!rex_hex_color.test(value)){
	return color_names[value] || value;
      }
      if(value.length === 3){
	return value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
      }
      return value;
    }
  };
})();


var Palette = (function(){
  // 256(8 * 8 * 4) color palette scales.
  var RG_PALETTE = [0, 36, 73, 109, 146, 182, 219, 255];
  var B_PALETTE = [0, 85, 170, 255];

  var make_hex_str = function(ival){
    var str = ival.toString(16);
    if(str.length <= 1){
      return "0" + str;
    }
    return str;
  };

  var find_palette = function(ival, palette){
    if(List.exists(palette, Closure.eq(ival))){
      return ival;
    }
    return List.minobj(palette, function(pval){
      return Math.abs(pval - ival);
    });
  };

  return {
    // search and return color value defined in nehan palette.
    // we use this value for img characters.
    getColor : function(rgb){
      var palette_red = find_palette(rgb.getRed(), RG_PALETTE);
      var palette_green = find_palette(rgb.getGreen(), RG_PALETTE);
      var palette_blue = find_palette(rgb.getBlue(), B_PALETTE);

      return [
	make_hex_str(palette_red),
	make_hex_str(palette_green),
	make_hex_str(palette_blue)
      ].join("");
    }
  };
})();


var Cardinal = (function(){
  var table = {
    "lower-alpha":[
      "a","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"
    ],
    "upper-alpha":[
      "A","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"
    ],
    "lower-roman":[
      "i","i","ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii","xiii","xiv","xv","xvi","xvii","xviii","xix","xx"
    ],
    "upper-roman":[
      "I","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"
    ],
    "lower-greek":[
      "\u03b1","\u03b1","\u03b2","\u03b3","\u03b4","\u03b5","\u03b6","\u03b7","\u03b8","\u03b9","\u03ba","\u03bb","\u03bc","\u03bd","\u03be","\u03bf","\u03c0","\u03c1","\u03c3","\u03c4","\u03c5","\u03c6","\u03c7","\u03c8","\u03c9"
    ],
    "upper-greek":[
      "\u0391","\u0391","\u0392","\u0393","\u0394","\u0395","\u0396","\u0397","\u0398","\u0399","\u039a","\u039b","\u039c","\u039d","\u039e","\u039f","\u03a0","\u03a1","\u03a3","\u03a4","\u03a5","\u03a6","\u03a7","\u03a8","\u03a9"
    ],
    "cjk-ideographic":[
      "\u3007","\u4E00","\u4E8C","\u4E09","\u56DB","\u4E94","\u516D","\u4E03","\u516B","\u4E5D","\u5341"
    ],
    "hiragana":[
      "\u3042","\u3042","\u3044","\u3046","\u3048","\u304A","\u304B","\u304D","\u304F","\u3051","\u3053","\u3055","\u3057","\u3059","\u305B","\u305D","\u305F","\u3061","\u3064","\u3066","\u3068","\u306A","\u306B","\u306C","\u306D","\u306E","\u306F","\u3072","\u3075","\u3078","\u307B","\u307E","\u307F","\u3080","\u3081","\u3082","\u3084","\u3086","\u3088","\u3089","\u308A","\u308B","\u308C","\u308D","\u308F","\u3090","\u3091","\u3092","\u3093"
    ],
    "hiragana-iroha":[
      "\u3044","\u3044","\u308D","\u306F","\u306B","\u307B","\u3078","\u3068","\u3061","\u308A","\u306C","\u308B","\u3092","\u308F","\u304B","\u3088","\u305F","\u308C","\u305D","\u3064","\u306D","\u306A","\u3089","\u3080","\u3046","\u3090","\u306E","\u304A","\u304F","\u3084","\u307E","\u3051","\u3075","\u3053","\u3048","\u3066","\u3042","\u3055","\u304D","\u3086","\u3081","\u307F","\u3057","\u3091","\u3072","\u3082","\u305B","\u3059"
    ],
    "katakana":[
      "\u30A2","\u30A2","\u30A4","\u30A6","\u30A8","\u30AA","\u30AB","\u30AD","\u30AF","\u30B1","\u30B3","\u30B5","\u30B7","\u30B9","\u30BB","\u30BD","\u30BF","\u30C1","\u30C4","\u30C6","\u30C8","\u30CA","\u30CB","\u30CC","\u30CD","\u30CE","\u30CF","\u30D2","\u30D5","\u30D8","\u30DB","\u30DE","\u30DF","\u30E0","\u30E1","\u30E2","\u30E4","\u30E6","\u30E8","\u30E9","\u30EA","\u30EB","\u30EC","\u30ED","\u30EF","\u30F0","\u30F1","\u30F2","\u30F3"
    ],
    "katakana-iroha":[
      "\u30A4","\u30A4","\u30ED","\u30CF","\u30CB","\u30DB","\u30D8","\u30C8","\u30C1","\u30EA","\u30CC","\u30EB","\u30F2","\u30EF","\u30AB","\u30E8","\u30BF","\u30EC","\u30BD","\u30C4","\u30CD","\u30CA","\u30E9","\u30E0","\u30A6","\u30F0","\u30CE","\u30AA","\u30AF","\u30E4","\u30DE","\u30B1","\u30D5","\u30B3","\u30A8","\u30C6","\u30A2","\u30B5","\u30AD","\u30E6","\u30E1","\u30DF","\u30B7","\u30F1","\u30D2","\u30E2","\u30BB","\u30B9"
    ]
  };

  var aliases = {
    "upper-latin":"upper-alpha",
    "lower-latin":"lower-alpha"
  };

  return {
    getTableByName : function(name){
      return table[aliases[name] || name];
    },
    getBaseByName : function(name){
      var table = this.getTableByName(name);
      return table.length;
    },
    getStringByName : function(name, decimal){
      var table = this.getTableByName(name);
      var base = table.length;
      var digits = MathUtils.convBase(decimal, base);
      var ret = "";
      for(var i = 0; i < digits.length; i++){
	var digit = digits[i];
	var index = (i === 0)? digits[i] : Math.min(digit + 1, base - 1);
	ret += table[index] || "";
      }
      //console.log("get %d(%s) -> %s(base %d)", decimal, digits.join("-"), ret, base);
      return ret;
    }
  };
})();


var ListStyleType = (function(){
  function ListStyleType(type){
    this.type = type;
  }

  var marker_text = {
    "disc": "&#x2022;",
    "circle":"&#x25CB;",
    "square":"&#x25A0;"
  };

  ListStyleType.prototype = {
    isDecimalList : function(){
      return (this.type === "decimal" || this.type === "decimal-leading-zero");
    },
    isNoneList : function(){
      return this.type === "none";
    },
    isMarkList : function(){
      return (this.type === "disc" ||
	      this.type === "circle" ||
	      this.type === "square");
    },
    isCountableList : function(){
      return (!this.isNoneList() && !this.isMarkList());
    },
    isHankaku : function(){
      return (this.type === "lower-alpha" || this.type === "upper-alpha" ||
	      this.type === "lower-roman" || this.type === "upper-roman" ||
	      this.isDecimalList());
    },
    isZenkaku : function(){
      return !this.isHankaku();
    },
    _getMarkerDigitString : function(decimal){
      if(this.type === "decimal"){
	return decimal.toString(10);
      }
      if(this.type === "decimal-leading-zero"){
	if(decimal < 10){
	  return "0" + decimal.toString(10);
	}
	return decimal.toString(10);
      }
      return Cardinal.getStringByName(this.type, decimal);
    },
    getMarkerHtml : function(count){
      var text = this.getMarkerText(count);
      if(this.isZenkaku()){
	return Html.tagWrap("span", text, {
	  "class":"nehan-tcy"
	});
      }
      return text;
    },
    getMarkerText : function(count){
      if(this.isNoneList()){
	return Const.space;
      }
      if(this.isMarkList()){
	return marker_text[this.type] || "";
      }
      var digit = this._getMarkerDigitString(count);
      return digit + "."; // add period as postfix.
    },
    getMarkerAdvance : function(flow, font_size, item_count){
      var font_size_half = Math.floor(font_size / 2);
      var period_size = font_size_half;
      var marker_spacing_size = Layout.getListMarkerSpacingSize(font_size);
      var marker_font_size = this.isZenkaku()? font_size : font_size_half;
      var max_marker_text = this.getMarkerText(item_count);
      if(this.isNoneList()){
	return font_size;
      }
      if(this.isMarkList()){
	return font_size + marker_spacing_size;
      }
      // zenkaku order is displayed as tcy.
      // so advance is 'single' font-size plus spacing-size.
      if(this.isZenkaku() && flow.isTextVertical()){
	return font_size + marker_spacing_size;
      }
      return (max_marker_text.length - 1) * marker_font_size + period_size + marker_spacing_size;
    }
  };

  return ListStyleType;
})();


var ListStylePos = (function(){
  function ListStylePos(pos){
    this.pos = pos;
  }

  ListStylePos.prototype = {
    isOutside : function(){
      return this.pos === "outside";
    },
    isInside : function(){
      return this.pos === "inside";
    }
  };

  return ListStylePos;
})();


var ListStyleImage = (function(){
  function ListStyleImage(image){
    this.image = image;
  }

  ListStyleImage.prototype = {
    getMarkerAdvance : function(flow, font_size){
      var marker_size = this.image[flow.getPropMeasure()] || font_size;
      var spacing_size = Layout.getListMarkerSpacingSize(font_size);
      return marker_size + spacing_size;
    },
    getMarkerHtml : function(count){
      var url = this.image.url;
      var width = this.image.width || Layout.fontSize;
      var height = this.image.height || Layout.fontSize;
      return Html.tagSingle("img", {
	"src":url,
	"class":"nehan-list-image",
	"width":width,
	"height":height
      });
    }
  };

  return ListStyleImage;
})();


var ListStyle = (function(){
  function ListStyle(opt){
    this.type = new ListStyleType(opt.type || "none");
    this.position = new ListStylePos(opt.position || "outside");
    this.image = (opt.image !== "none")? new ListStyleImage(opt.image) : null;
    this.format = opt.format || null;
  }

  ListStyle.prototype = {
    isMultiCol : function(){
      return this.position.isOutside();
    },
    isInside : function(){
      return this.position.isInside();
    },
    isImageList : function(){
      return (this.image !== null);
    },
    getMarkerHtml : function(count){
      if(this.format !== null){
	return (typeof this.format === "function")? this.format(count) : this.format;
      }
      if(this.image !== null){
	return this.image.getMarkerHtml(count);
      }
      return this.type.getMarkerHtml(count);
    },
    getMarkerAdvance : function(flow, font_size, item_count){
      if(this.image){
	return this.image.getMarkerAdvance(flow, font_size);
      }
      return this.type.getMarkerAdvance(flow, font_size, item_count);
    }
  };

  return ListStyle;
})();

var Flow = Class.extend({
  init : function(dir){
    this.dir = dir;
  },
  isValid : function(){
    return (this.dir === "lr" || this.dir === "rl" || this.dir === "tb");
  },
  isHorizontal : function(){
    return (this.dir === "lr" || this.dir === "rl");
  },
  isVertical : function(){
    return (this.dir === "tb");
  },
  isLeftToRight : function(){
    return this.dir === "lr";
  },
  isRightToLeft : function(){
    return this.dir === "rl";
  },
  reverse : function(){
    switch(this.dir){
    case "lr": return "rl";
    case "rl": return "lr";
    case "tb": return "tb"; // bottom to top not exits(maybe).
    default: return "";
    }
  }
});

var BlockFlow = Flow.extend({
  init : function(dir, multicol){
    this._super(dir);
    this.multicol = multicol || false;
  },
  flip : function(){
    switch(this.dir){
    case "lr": case "rl": return "tb";
    case "tb": return Layout.getVertBlockdir();
    default: return "";
    }
  },
  getCss : function(){
    var css = {};
    if(this.isHorizontal()){
      css["float"] = (this.dir === "lr")? "left" : "right";
    } else if(this.isVertical() && this.multicol){
      css["float"] = (Layout.getHoriIndir() === "lr")? "left" : "right";
    }
    return css;
  },
  getPropBefore : function(){
    switch(this.dir){
    case "lr": return "left";
    case "rl": return "right";
    case "tb": return "top";
    default: return "";
    }
  },
  getPropAfter : function(){
    switch(this.dir){
    case "lr": return "right";
    case "rl": return "left";
    case "tb": return "bottom";
    default: return "";
    }
  }
});

var InlineFlow = Flow.extend({
  init : function(dir){
    this._super(dir);
  },
  getPropStart : function(){
    switch(this.dir){
    case "lr": return "left";
    case "rl": return "right";
    case "tb": return "top";
    default: return "";
    }
  },
  getPropEnd : function(){
    switch(this.dir){
    case "lr": return "right";
    case "rl": return "left";
    case "tb": return "bottom";
    default: return "";
    }
  }
});

var BoxFlow = (function(){
  function BoxFlow(indir, blockdir, multicol){
    this.inflow = new InlineFlow(indir);
    this.blockflow = new BlockFlow(blockdir, multicol);
  }

  BoxFlow.prototype = {
    getCss : function(){
      var css = {};
      Args.copy(css, this.blockflow.getCss());
      return css;
    },
    getName : function(){
      return [this.inflow.dir, this.blockflow.dir].join("-");
    },
    isValid : function(){
      return this.inflow.isValid() && this.blockflow.isValid();
    },
    isTextLineFirst : function(){
      if(this.isTextVertical() && this.blockflow.isLeftToRight()){
	return true;
      }
      return false;
    },
    isBlockflowVertical : function(){
      return this.blockflow.isVertical();
    },
    isTextVertical : function(){
      return this.inflow.isVertical();
    },
    isTextHorizontal : function(){
      return this.inflow.isHorizontal();
    },
    getTextHorizontalDir : function(){
      if(this.isTextHorizontal()){
	return this.inflow.dir;
      }
      return "";
    },
    getProp : function(prop){
      switch(prop){
      case "start":
	return this.getPropStart();
      case "end":
	return this.getPropEnd();
      case "before":
	return this.getPropBefore();
      case "after":
	return this.getPropAfter();
      }
    },
    getPropStart : function(){
      return this.inflow.getPropStart();
    },
    getPropEnd : function(){
      return this.inflow.getPropEnd();
    },
    getPropBefore : function(){
      return this.blockflow.getPropBefore();
    },
    getPropAfter : function(){
      return this.blockflow.getPropAfter();
    },
    getPropExtent : function(){
      return this.isTextVertical()? "width" : "height";
    },
    getPropMeasure : function(){
      return this.isTextVertical()? "height" : "width";
    },
    getPropWidth : function(){
      return this.isTextVertical()? "extent" : "measure";
    },
    getPropHeight : function(){
      return this.isTextVertical()? "measure" : "extent";
    },
    getParallelFlipFlow : function(){
      return BoxFlows.get(this.inflow.dir, this.blockflow.dir, false);
    },
    getParallelFlow : function(){
      return BoxFlows.get(this.inflow.dir, this.blockflow.dir, true);
    },
    getFlipFlow : function(){
      return this.isTextVertical()? Layout.getStdHoriFlow() : Layout.getStdVertFlow();
    },
    getFloatedWrapFlow : function(){
      if(this.isTextVertical()){
	return this;
      }
      return this.getParallelFlow();
    },
    getBoxSize : function(measure, extent){
      var size = new BoxSize(0,0);
      size[this.getPropMeasure()] = measure;
      size[this.getPropExtent()] = extent;
      return size;
    }
  };

  return BoxFlow;
})();


var BoxFlows = {
  "tb-rl":(new BoxFlow("tb", "rl")),
  "tb-lr":(new BoxFlow("tb", "lr")),
  "lr-tb":(new BoxFlow("lr", "tb")),
  "rl-tb":(new BoxFlow("rl", "tb")),

  "tb-rl-mc":(new BoxFlow("tb", "rl", true)),
  "tb-lr-mc":(new BoxFlow("tb", "lr", true)),
  "lr-tb-mc":(new BoxFlow("lr", "tb", true)),
  "rl-tb-mc":(new BoxFlow("rl", "tb", true)),

  NORMAL:(new BoxFlow("lr", "tb")),
  get: function(inflow, blockflow, multicol){
    var is_multicol = multicol || false;
    var name = inflow + "-" + blockflow + (is_multicol? "-mc" : "");
    return this.getByName(name);
  },
  getByName : function(name){
    return this[name];
  }
};

var BoxRect = {
  iter : function(obj, fn){
    List.iter(Const.cssBoxDirs, function(dir){
      if(obj[dir]){
	fn(dir, obj[dir]);
      }
    });
  },
  map : function(obj, fn){
    if(obj instanceof Array){
      return List.map(obj, fn);
    }
    if(typeof obj === "object"){
      return Obj.map(obj, fn);
    }
    return fn(obj);
  },
  setValue : function(dst, flow, value){
    if(typeof value.start != "undefined"){
      this.setStart(dst, flow, value.start);
    }
    if(typeof value.end != "undefined"){
      this.setEnd(dst, flow, value.end);
    }
    if(typeof value.before != "undefined"){
      this.setBefore(dst, flow, value.before);
    }
    if(typeof value.after != "undefined"){
      this.setAfter(dst, flow, value.after);
    }
    return dst;
  },
  setBefore : function(dst, flow, value){
    dst[flow.getPropBefore()] = value;
  },
  setAfter : function(dst, flow, value){
    dst[flow.getPropAfter()] = value;
  },
  setStart : function(dst, flow, value){
    dst[flow.getPropStart()] = value;
  },
  setEnd : function(dst, flow, value){
    dst[flow.getPropEnd()] = value;
  }
};


var BoxCorner = {
  sortCornerDirection : function(dir1, dir2){
    var order = {top:0, bottom:1, left:2, right:3};
    return [dir1, dir2].sort(function (c1, c2){
      return order[c1] - order[c2];
    });
  },
  getCornerName : function(dir1, dir2){
    var dirs = this.sortCornerDirection(dir1, dir2);
    return [dirs[0], Utils.capitalize(dirs[1])].join("");
  }
};

var BoxSizing = (function(){
  function BoxSizing(value){
    // 'margin-box' is original sizing scheme of nehan,
    // even if margin is included in box size.
    this.value = value || "margin-box";
  }

  BoxSizing.prototype = {
    isContentBox : function(){
      return this.value === "content-box";
    },
    isMarginBox : function(){
      return this.value === "margin-box";
    },
    isBorderBox : function(){
      return this.value === "border-box";
    },
    containPadding : function(){
      return this.isBorderBox();
    },
    containBorder : function(){
      return this.isBorderBox();
    },
    containMargin : function(){
      return this.isMarginBox();
    },
    getCss : function(){
      var css = {};
      css["box-sizing"] = "content-box";
      return css;
    }
  };

  return BoxSizing;
})();


var BoxSizings = {
  "content-box":(new BoxSizing("content-box")),
  "border-box":(new BoxSizing("border-box")),
  "margin-box":(new BoxSizing("margin-box")),
  getByName : function(name){
    return this[name] || this["margin-box"];
  }
};


var FontWeight = (function(){
  function FontWeight(value){
    this.value = value;
  }

  FontWeight.prototype = {
    isBold : function(){
      return this.value !== "normal" && this.value !== "lighter";
    },
    getCss : function(){
      var css = {};
      css["font-weight"] = this.value;
      return css;
    }
  };

  return FontWeight;
})();


var Edge = Class.extend({
  init : function(type){
    this._type = type;
    this.top = 0;
    this.right = 0;
    this.bottom = 0;
    this.left = 0;
  },
  clear : function(){
    this.top = 0;
    this.right = 0;
    this.bottom = 0;
    this.left = 0;
  },
  isEnable : function(){
    return this.top !== 0 || this.right !== 0 || this.bottom !== 0 || this.left !== 0;
  },
  getDirProp : function(dir){
    return [this._type, dir].join("-");
  },
  getCss : function(){
    var css = {};
    var self = this;
    List.iter(["top", "right", "bottom", "left"], function(dir){
      var value = self[dir];
      if(value > 0){
	css[self.getDirProp(dir)] = self[dir] + "px";
      }
    });
    return css;
  },
  getWidth : function(){
    return this.left + this.right;
  },
  getHeight : function(){
    return this.top + this.bottom;
  },
  getMeasureSize : function(flow){
    return flow.isTextVertical()? this.getHeight() : this.getWidth();
  },
  getExtentSize : function(flow){
    return flow.isBlockflowVertical()? this.getHeight() : this.getWidth();
  },
  setSize : function(flow, size){
    BoxRect.setValue(this, flow, size);
  },
  setStart : function(flow, value){
    this[flow.getPropStart()] = value;
  },
  setEnd : function(flow, value){
    this[flow.getPropEnd()] = value;
  },
  setBefore : function(flow, value){
    this[flow.getPropBefore()] = value;
  },
  setAfter : function(flow, value){
    this[flow.getPropAfter()] = value;
  },
  getStart : function(flow){
    return this[flow.getPropStart()];
  },
  getEnd : function(flow){
    return this[flow.getPropEnd()];
  },
  getBefore : function(flow){
    return this[flow.getPropBefore()];
  },
  getAfter : function(flow){
    return this[flow.getPropAfter()];
  },
  getLogicalSize : function(flow, dir){
    return this[flow.getProp(dir)];
  },
  setLogicalSize : function(flow, dir, val){
    this[flow.getProp(dir)] = val;
  }
});

var Radius2d = (function(){
  function Radius2d(){
    this.hori = 0;
    this.vert = 0;
  }

  Radius2d.prototype = {
    setSize : function(value){
      this.hori = value[0];
      this.vert = value[1];
    },
    getCssValueHori : function(){
      return this.hori + "px";
    },
    getCssValueVert : function(){
      return this.vert + "px";
    }
  };
  
  return Radius2d;
})();

var BorderRadius = (function(){
  function BorderRadius(){
    this.topLeft = new Radius2d();
    this.topRight = new Radius2d();
    this.bottomRight = new Radius2d();
    this.bottomLeft = new Radius2d();
  }

  BorderRadius.prototype = {
    getArray : function(){
      return [
	this.topLeft,
	this.topRight,
	this.bottomRight,
	this.bottomLeft
      ];
    },
    getCssValueHori : function(){
      return List.map(this.getArray(), function(radius){
	return radius.getCssValueHori();
      }).join(" ");
    },
    getCssValueVert : function(){
      return List.map(this.getArray(), function(radius){
	return radius.getCssValueVert();
      }).join(" ");
    },
    getCssValue : function(){
      return [this.getCssValueHori(), this.getCssValueVert()].join("/");
    },
    getCss : function(){
      var css = {};
      var css_value = this.getCssValue();
      css["border-radius"] = css_value; // without vender prefix
      List.iter(Const.cssVenderPrefixes, function(prefix){
	var prop = [prefix, "border-radius"].join("-"); // with vender prefix
	css[prop] = css_value;
      });
      return css;
    },
    getCorner : function(dir1, dir2){
      var name = BoxCorner.getCornerName(dir1, dir2);
      return this[name];
    },
    setSize : function(flow, size){
      if(typeof size["start-before"] != "undefined"){
	this.setStartBefore(flow, size["start-before"]);
      }
      if(typeof size["start-after"] != "undefined"){
	this.setStartAfter(flow, size["start-after"]);
      }
      if(typeof size["end-before"] != "undefined"){
	this.setEndBefore(flow, size["end-before"]);
      }
      if(typeof size["end-after"] != "undefined"){
	this.setEndAfter(flow, size["end-after"]);
      }
    },
    setStartBefore : function(flow, value){
      var radius = this.getCorner(flow.getPropStart(), flow.getPropBefore());
      radius.setSize(value);
    },
    setStartAfter : function(flow, value){
      var radius = this.getCorner(flow.getPropStart(), flow.getPropAfter());
      radius.setSize(value);
    },
    setEndBefore : function(flow, value){
      var radius = this.getCorner(flow.getPropEnd(), flow.getPropBefore());
      radius.setSize(value);
    },
    setEndAfter :  function(flow, value){
      var radius = this.getCorner(flow.getPropEnd(), flow.getPropAfter());
      radius.setSize(value);
    },
    clearBefore : function(flow){
      this.setStartBefore(flow, [0, 0]);
      this.setEndBefore(flow, [0, 0]);
    },
    clearAfter : function(flow){
      this.setStartAfter(flow, [0, 0]);
      this.setEndAfter(flow, [0, 0]);
    }
  };

  return BorderRadius;
})();

var BorderColor = (function(){
  function BorderColor(){
  }

  BorderColor.prototype = {
    setColor : function(flow, value){
      var self = this;

      // first, set as it is(obj, array, string).
      BoxRect.setValue(this, flow, value);

      // second, map as color class.
      BoxRect.iter(this, function(dir, val){
	self[dir] = new Color(val);
      });
    },
    getCss : function(){
      var css = {};
      BoxRect.iter(this, function(dir, color){
	var prop = ["border", dir, "color"].join("-");
	css[prop] = color.getCssValue();
      });
      return css;
    }
  };

  return BorderColor;
})();

var BorderStyle = (function(){
  function BorderStyle(){
  }

  BorderStyle.prototype = {
    setStyle : function(flow, value){
      BoxRect.setValue(this, flow, value);
    },
    getCss : function(){
      var css = {};
      BoxRect.iter(this, function(dir, style){
	var prop = ["border", dir, "style"].join("-");
	css[prop] = style;
      });
      return css;
    }
  };

  return BorderStyle;
})();

var Padding = Edge.extend({
  init : function(){
    this._super("padding");
  }
});

var Margin = Edge.extend({
  init : function(){
    this._super("margin");
  }
});

var Border = Edge.extend({
  init : function(){
    this._super("border");
  },
  clearBefore : function(flow){
    this.setBefore(flow, 0);
    if(this.radius){
      this.radius.clearBefore(flow);
    }
  },
  clearAfter : function(flow){
    this.setAfter(flow, 0);
    if(this.radius){
      this.radius.clearAfter(flow);
    }
  },
  getDirProp : function(dir){
    return ["border", dir, "width"].join("-");
  },
  setRadius : function(flow, radius){
    this.radius = new BorderRadius();
    this.radius.setSize(flow, radius);
  },
  setColor : function(flow, color){
    this.color = new BorderColor();
    this.color.setColor(flow, color);
  },
  setStyle : function(flow, style){
    this.style = new BorderStyle();
    this.style.setStyle(flow, style);
  },
  getCss : function(){
    var css = this._super();
    if(this.radius){
      Args.copy(css, this.radius.getCss());
    }
    if(this.color){
      Args.copy(css, this.color.getCss());
    }
    if(this.style){
      Args.copy(css, this.style.getCss());
    }
    return css;
  }
});

var BoxEdge = (function (){
  function BoxEdge(){
    this.padding = new Padding();
    this.margin = new Margin();
    this.border = new Border();
  }

  BoxEdge.prototype = {
    isEnable : function(){
      return this.padding.isEnable() || this.margin.isEnable() || this.border.isEnable();
    },
    clear : function(){
      this.padding.clear();
      this.margin.clear();
      this.border.clear();
    },
    getCss : function(){
      var css = {};
      Args.copy(css, this.padding.getCss());
      Args.copy(css, this.margin.getCss());
      Args.copy(css, this.border.getCss());
      return css;
    },
    getWidth : function(){
      var ret = 0;
      ret += this.padding.getWidth();
      ret += this.margin.getWidth();
      ret += this.border.getWidth();
      return ret;
    },
    getHeight : function(){
      var ret = 0;
      ret += this.padding.getHeight();
      ret += this.margin.getHeight();
      ret += this.border.getHeight();
      return ret;
    },
    getMeasureSize : function(flow){
      var ret = 0;
      ret += this.padding.getMeasureSize(flow);
      ret += this.margin.getMeasureSize(flow);
      ret += this.border.getMeasureSize(flow);
      return ret;
    },
    getExtentSize : function(flow){
      var ret = 0;
      ret += this.padding.getExtentSize(flow);
      ret += this.margin.getExtentSize(flow);
      ret += this.border.getExtentSize(flow);
      return ret;
    },
    setAll : function(prop, flow, value){
      this[prop].setAll(flow, value);
    },
    setSize : function(prop, flow, size){
      this[prop].setSize(flow, size);
    },
    setEdgeSize : function(flow, edge_size){
      for(var prop in edge_size){
	this.setSize(prop, flow, edge_size[prop]);
      }
    },
    setEdgeStart : function(prop, flow, value){
      this[prop].setStart(flow, value);
    },
    setEdgeEnd : function(prop, flow, value){
      this[prop].setEnd(flow, value);
    },
    setEdgeBefore : function(prop, flow, value){
      this[prop].setBefore(flow, value);
    },
    setEdgeAfter : function(prop, flow, value){
      this[prop].setAfter(flow, value);
    },
    setBorderRadius : function(flow, value){
      this.border.setRadius(flow, value);
    },
    setBorderColor : function(flow, value){
      this.border.setColor(flow, value);
    },
    setBorderStyle : function(flow, value){
      this.border.setStyle(flow, value);
    },
    clearBorderStart : function(flow){
      this.border.clearStart(flow);
    },
    clearBorderBefore : function(flow){
      this.border.clearBefore(flow);
    },
    clearBorderAfter : function(flow){
      this.border.clearAfter(flow);
    }
  };

  return BoxEdge;
})();

var Partition = (function(){
  function Partition(parts, max_size){
    switch(arguments.length){
    case 1:
      this.parts = parts;
      break;
    case 2:
      this.parts = this._mapSize(parts, max_size);
      break;
    }
  }

  Partition.prototype = {
    getLength : function(){
      return this.parts.length;
    },
    getSize : function(index){
      return this.parts[index] || null;
    },
    _mapSize : function(parts, max_size){
      var auto_parts = List.filter(parts, function(size){ return size === 0; });
      var auto_count = auto_parts.length;
      if(auto_count === 0){
	return parts;
      }
      var total_size = List.sum(parts);
      var rest_size = max_size - total_size;
      var auto_size = Math.floor(rest_size / auto_count);
      return List.map(parts, function(size){
	return size? size : auto_size;
      });
    }
  };

  return Partition;
})();

var TablePartition = (function(){
  function TablePartition(){
    this.entry = {};
  }

  TablePartition.prototype = {
    add : function(partition){
      var col_count = partition.getLength();
      this.entry[col_count] = partition;
    },
    getPartition : function(col_count){
      return (this.entry[col_count] || null);
    }
  };

  return TablePartition;
})();

var BoxSize = (function(){
  function BoxSize(width, height){
    this.width = width;
    this.height = height;
  }

  BoxSize.prototype = {
    isValid : function(){
      return this.width > 0 && this.height > 0;
    },
    canInclude : function(size){
      return (size.width <= this.width && size.height <= this.height);
    },
    getCss : function(){
      var css = {};
      css.width = this.width + "px";
      css.height = this.height + "px";
      return css;
    },
    getWhSlope : function(){
      return this.height / this.width;
    },
    getHwSlope : function(){
      return this.width / this.height;
    },
    getMeasure : function(flow){
      return this[flow.getPropMeasure()];
    },
    getExtent : function(flow){
      return this[flow.getPropExtent()];
    },
    setExtent : function(flow, extent){
      this[flow.getPropExtent()] = extent;
    },
    setMeasure : function(flow, measure){
      this[flow.getPropMeasure()] = measure;
    },
    subEdge : function(edge){
      var dw = edge.getWidth();
      var dh = edge.getHeight();
      this.width = Math.max(0, this.width - dw);
      this.height = Math.max(0, this.height - dh);
    },
    subMeasure : function(flow, measure){
      var prop = flow.getPropMeasure();
      this[prop] = Math.max(0, this[prop] - measure);
    },
    addMeasure : function(flow, measure){
      this[flow.getPropMeasure()] += measure;
    },
    addExtent : function(flow, extent){
      this[flow.getPropExtent()] += extent;
    },
    percentFrom : function(target_size){
      return Math.floor(100 * this.width / target_size.width);
    },
    resizeWithin : function(flow, rest_size){
      var rest_measure = rest_size.getMeasure(flow);
      var rest_extent = rest_size.getExtent(flow);
      var box_measure = this.getMeasure(flow);
      var box_extent = this.getExtent(flow);
      if(box_extent > rest_extent){
	// box_measure : box_extent = ? : rest_extent
	box_measure = box_measure * rest_extent / box_extent;
	box_extent = rest_extent;
      }
      if(box_measure > rest_measure){
	var slope = box_extent / box_measure; // extent per measure
	var m_over = box_measure - rest_measure;
	box_extent = Math.floor(box_extent - slope * m_over);
	box_measure = rest_measure;
      }
      return flow.getBoxSize(box_measure, box_extent);
    },
    toLogicalSize : function(flow){
      return new LogicalSize(this.getMeasure(flow), this.getExtent(flow));
    }
  };

  return BoxSize;
})();

var TextEmphaStyle = (function(){
  var empha_marks = {
    "dot filled":"&#x2022;",
    "dot open":"&#x25e6;",

    "circle filled":"&#x25cf;",
    "circle open":"&#x25cb;",

    "double-circle filled":"&#x25c9;",
    "double-circle open":"&#x25ce;",

    "triangle filled":"&#x25b2;",
    "triangle open":"&#x25b3;",

    "sesame filled":"&#xfe45;",
    "sesame open":"&#xfe46;"
  };

  function TextEmphaStyle(value){
    this.value = value || "dot filled";
  }

  TextEmphaStyle.prototype = {
    setValue : function(value){
      this.value = value;
    },
    getText : function(){
      return empha_marks[this.value] || this.value || empha_marks["dot filled"];
    },
    getCss : function(){
      var css = {};
      //return css["text-emphasis-style"] = this.value;
      return css;
    }
  };

  return TextEmphaStyle;
})();


var TextEmphaPos = (function(){
  function TextEmphaPos(value){
    this.value = value || "over";
  }

  TextEmphaPos.prototype = {
    isEmphaFirst : function(){
      return this.value === "over" || this.value === "left" || this.value === "before";
    },
    setValue : function(value){
      this.value = value;
    },
    getCss : function(line){
      var css = {};
      return css;
    }
  };

  return TextEmphaPos;
})();


var TextEmpha = (function(){
  function TextEmpha(){
    this.pos = new TextEmphaPos();
    this.style = new TextEmphaStyle();
    this.color = new Color(Layout.fontColor);
  }

  TextEmpha.prototype = {
    setPos : function(value){
      this.pos.setValue(value);
    },
    setStyle : function(value){
      this.style.setValue(value);
    },
    setColor : function(value){
      this.color.setValue(value);
    },
    getText : function(){
      return this.style.getText();
    },
    getExtent : function(font_size){
      return font_size * 3;
    },
    getCssVertEmphaWrap : function(line, chr){
      var css = {};
      css["padding-left"] = "0.5em";
      css.width = this.getExtent(line.fontSize) + "px";
      css.height = chr.getAdvance(line.fontSize, line.letterSpacing) + "px";
      return css;
    },
    getCssHoriEmphaWrap : function(line, chr){
      var css = {};
      css.display = "inline-block";
      css["padding-top"] = -line.fontSize + "px";
      css.width = chr.getAdvance(line.fontSize, line.letterSpacing) + "px";
      css.height = this.getExtent(line.fontSize) + "px";
      return css;
    }
  };

  return TextEmpha;
})();


var LogicalSize = (function(){
  function LogicalSize(measure, extent){
    this.measure = measure;
    this.extent = extent;
  }

  LogicalSize.prototype = {
    canInclude : function(size){
      return (size.measure <= this.measure && size.extent <= this.extent);
    },
    getWidth : function(flow){
      return this[flow.getPropWidth()];
    },
    getHeight : function(flow){
      return this[flow.getPropHeight()];
    },
    toBoxSize : function(flow){
      return new BoxSize(this.getWidth(flow), this.getHeight(flow));
    }
  };

  return LogicalSize;
})();

var BoxChild = (function(){
  function BoxChild(){
    this.forward = [];
    this.normal = [];
    this.backward = [];
  }

  BoxChild.prototype = {
    get : function(){
      return this.forward.concat(this.normal).concat(this.backward);
    },
    setNormal : function(elements){
      this.normal = elements;
    },
    getLength : function(){
      return this.forward.length + this.normal.length + this.backward.length;
    },
    getFirst : function(){
      if(this.forward.length > 0){
	return this.forward[0];
      }
      if(this.normal.length > 0){
	return this.normal[0];
      }
      if(this.backward.length > 0){
	return this.backward[this.backward.length - 1];
      }
      return null;
    },
    add : function(child){
      if(child.backward){
	this.backward.unshift(child);
      } else if(child.forward){
	this.forward.push(child);
      } else {
	this.normal.push(child);
      }
    }
  };

  return BoxChild;
})();

var Box = (function(){
  function Box(size, parent, type){
    this._type = type || "div";
    this.childExtent = 0;
    this.childMeasure = 0;
    this.size = size;
    this.childs = new BoxChild();
    this.css = {};
    this.parent = parent;
    this.charCount = 0;
  }

  Box.prototype = {
    getCssBlock : function(){
      var css = this.css;
      css["font-size"] = this.fontSize + "px";
      Args.copy(css, this.size.getCss());
      if(this.edge){
	Args.copy(css, this.edge.getCss());
      }
      if(this.parent){
	Args.copy(css, this.parent.flow.getCss());
      }
      if(this.color){
	Args.copy(css, this.color.getCss());
      }
      if(this.fontWeight){
	Args.copy(css, this.fontWeight.getCss());
      }
      if(this.letterSpacing && !this.isTextVertical()){
	css["letter-spacing"] = this.letterSpacing + "px";
      }
      css.display = this.display || "block";
      css.overflow = "hidden"; // to avoid margin collapsing
      return css;
    },
    getCssInline : function(){
      var css = this.css;
      css["font-size"] = this.fontSize + "px";
      if(this.color){
	Args.copy(css, this.color.getCss());
      }
      if(this.fontWeight){
	Args.copy(css, this.fontWeight.getCss());
      }
      // top level line need to follow parent blockflow.
      if(this.parent && this.parent.isBlock()){
	Args.copy(css, this.flow.getCss());
      }
      var start_offset = this.getStartOffset();
      if(start_offset > 0){
	this.edge = new Margin();
	this.edge.setStart(this.flow, start_offset);

	var cur_measure = this.getContentMeasure();
	this.size.setMeasure(this.flow, cur_measure - start_offset);
      }
      Args.copy(css, this.size.getCss());

      if(this.edge){
	Args.copy(css, this.edge.getCss());
      }
      if(this.isTextVertical()){
	if(Env.isIphoneFamily){
	  css["letter-spacing"] = "-0.001em";
	}
	if(typeof this.markup === "undefined" || !this.isRubyLine()){
	  css["margin-left"] = css["margin-right"] = "auto";
	  css["text-align"] = "center";
	}
      } else if(this.lineRate <= 1.0){
	css["line-height"] = "1em";
      }
      return css;
    },
    getCssVertInlineBox : function(){
      var css = this.getCssBlock();
      css["float"] = "none";
      css["margin-left"] = css["margin-right"] = "auto";
      return css;
    },
    getCharCount : function(){
      return this.charCount;
    },
    getClasses : function(){
      return this.isTextLine()? this._getClassesInline() : this._getClassesBlock();
    },
    _getClassesBlock : function(){
      var classes = ["nehan-box"];
      if(this._type != "box"){
	classes.push(Css.addNehanPrefix(this._type));
      }
      return classes.concat(this.extraClasses || []);
    },
    _getClassesInline : function(){
      var classes = ["nehan-text-line"];
      classes.push("nehan-text-line-" + (this.isTextVertical()? "vert" : "hori"));
      if(this.markup){
	classes.push("nehan-" + this.markup.getName());
      }
      return classes.concat(this.extraClasses || []);
    },
    getCssClasses : function(){
      return this.getClasses().join(" ");
    },
    getFirstChild : function(){
      return this.childs.getFirst();
    },
    getChilds : function(){
      return this.childs.get();
    },
    getChildExtent : function(){
      return this.childExtent;
    },
    getChildMeasure : function(){
      return this.childMeasure;
    },
    getFlowName : function(){
      return this.flow.getName();
    },
    getFlipFlow : function(){
      return this.flow.getFlipFlow();
    },
    getTextMeasure : function(){
      return this.childMeasure;
    },
    getTextRestMeasure : function(){
      return this.getContentMeasure() - this.childMeasure;
    },
    getRestContentExtent : function(){
      return this.getContentExtent() - this.childExtent;
    },
    getContentMeasure : function(flow){
      return this.size.getMeasure(flow || this.flow);
    },
    getContentExtent : function(flow){
      return this.size.getExtent(flow || this.flow);
    },
    getMaxChildMeasure : function(flow){
      var _flow = flow || this.flow;
      var max_measure = 0;
      List.iter(this.getChilds(), function(child){
	var measure = child.getTextMeasure? child.getTextMeasure() : child.getContentMeasure(_flow);
	if(measure > max_measure){
	  max_measure = measure;
	}
      });
      return max_measure;
    },
    getContentWidth : function(){
      return this.size.width;
    },
    getContentHeight : function(){
      return this.size.height;
    },
    getBoxMeasure : function(flow){
      var flow2 = flow || this.flow;
      var ret = this.getContentMeasure(flow2);
      if(this.edge){
	ret += this.edge.getMeasureSize(flow2);
      }
      return ret;
    },
    getBoxExtent : function(flow){
      var flow2 = flow || this.flow;
      var ret = this.getContentExtent(flow2);
      if(this.edge){
	ret += this.edge.getExtentSize(flow2);
      }
      return ret;
    },
    getBoxWidth : function(){
      var ret = this.size.width;
      if(this.edge){
	ret += this.edge.getWidth();
      }
      return ret;
    },
    getBoxHeight : function(){
      var ret = this.size.height;
      if(this.edge){
	ret += this.edge.getHeight();
      }
      return ret;
    },
    getBoxSize : function(){
      return new BoxSize(this.getBoxWidth(), this.getBoxHeight());
    },
    getBorder : function(){
      return this.edge? this.edge.border : null;
    },
    getStartOffset : function(){
      var indent = this.textIndent || 0;
      switch(this.textAlign){
      case "start": return indent;
      case "end": return indent + this.getTextRestMeasure();
      case "center": return indent + Math.floor(this.getTextRestMeasure() / 2);
      default: return indent;
      }
    },
    getRestSize : function(){
      var rest_measure = this.getContentMeasure();
      var rest_extent = this.getRestContentExtent();
      return this.flow.getBoxSize(rest_measure, rest_extent);
    },
    getFloatedWrapFlow : function(){
      return this.flow.getFloatedWrapFlow();
    },
    getParentFlow : function(){
      return this.parent? this.parent.flow : null;
    },
    getParallelFlow : function(){
      return this.flow.getParallelFlow();
    },
    getParallelFlipFlow : function(){
      return this.flow.getParallelFlipFlow();
    },
    getPropStart : function(){
      return this.flow.getPropStart();
    },
    getPropAfter : function(){
      return this.flow.getPropAfter();
    },
    getInflow : function(){
      return this.flow.inflow;
    },
    getBlockflow : function(){
      return this.flow.blockflow;
    },
    getBoxFlowBoxSize : function(measure, extent){
      return this.flow.getBoxSize(measure, extent);
    },
    getEdgeWidth : function(){
      return this.edge? this.edge.getWidth() : 0;
    },
    getEdgeHeight : function(){
      return this.edge? this.edge.getHeight() : 0;
    },
    getMarkupName : function(){
      return this.markup? this.markup.getName() : "";
    },
    addClass : function(klass){
      var classes = this.extraClasses || [];
      classes.push(klass);
      this.extraClasses = classes;
    },
    addChildBlock : function(child){
      this.childs.add(child);
      this.childExtent += child.getBoxExtent(this.flow);
      this.charCount += child.getCharCount();
    },
    addChildInline : function(child, measure){
      this.childs.add(child);
      this.childMeasure += measure;
    },
    addExtent : function(extent){
      this.size.addExtent(this.flow, extent);
    },
    addMeasure : function(measure){
      this.size.addMeasure(this.flow, measure);
    },
    setInlineElements : function(elements, measure){
      this.childs.setNormal(elements);
      this.childMeasure = measure;
    },
    setCss : function(prop, value){
      this.css[prop] = value;
    },
    setType : function(type){
      this._type = type;
    },
    setId : function(id){
      this.id = id;
    },
    setParent : function(parent, inherit){
      var is_inherit = (typeof inherit != "undefined")? inherit : true;
      this.parent = parent;
      if(is_inherit){
	this.setFlow(parent.flow);
      }
    },
    setFlow : function(flow){
      if(flow.isValid()){
	this.flow = flow;
      }
    },
    setContentExtent : function(flow, extent){
      this.size.setExtent(flow, extent);
    },
    setContentMeasure : function(flow, measure){
      this.size.setMeasure(flow, measure);
    },
    setEdge : function(edge){
      var sizing = this.sizing? this.sizing : BoxSizings.getByName("margin-box");
      if(sizing.isMarginBox()){
	this._setEdgeByMarginBox(edge);
      } else if(sizing.isBorderBox()){
	this._setEdgeByBorderBox(edge);
      } else if(sizing.isContentBox()){
	this.edge = edge;
      }
    },
    _setEdgeByMarginBox : function(edge){
      this.size.subEdge(edge);
      if(this.size.isValid()){
	this.edge = edge;
      }
    },
    _setEdgeByBorderBox : function(edge){
      var edge2 = new BoxEdge();
      edge2.border = edge.border;
      edge2.padding = edge.padding;
      this.size.subEdge(edge2);
      if(this.size.isValid()){
	this.edge = edge;
      }
    },
    setMaxFontSize : function(max_font_size){
      this.maxFontSize = max_font_size;
      List.iter(this.getChilds(), function(element){
	if(element instanceof Box && element._type === "text-line"){
	  element.setMaxFontSize(max_font_size);
	}
      });
    },
    setMaxExtent : function(extent){
      this.maxExtent = extent;
      List.iter(this.getChilds(), function(element){
	if(element instanceof Box && element._type === "text-line"){
	  element.setMaxExtent(extent);
	}
      });
    },
    subMeasure : function(measure){
      this.size.subMeasure(this.flow, measure);
    },
    splitMeasure : function(count){
      var measure = this.getContentMeasure();
      var div_size = Math.floor(measure / count);
      var ret = [];
      for(var i = 0; i < count; i++){
	ret.push(div_size);
      }
      return ret;
    },
    isEmptyChild : function(){
      return this.childs.getLength() === 0;
    },
    isFirstChildOf : function(parent){
      if(this.type === "text-line"){
	return false;
      }
      var name = this.getMarkupName();
      if(name === "li-marker" || name === "li-body"){
	return false;
      }
      return parent && parent.isEmptyChild();
    },
    isTextBold : function(){
      return (this.fontWeight && this.fontWeight.isBold());
    },
    isBlock : function(){
      return !this.isTextLine();
    },
    isTextLine : function(){
      return this._type === "text-line";
    },
    isTextLineRoot : function(){
      return this.parent && this.parent.isBlock();
    },
    isInlineOfInline : function(){
      // when <p>aaaa<span>bbbb</span></p>,
      // <span>bbbb</span> is inline of inline.
      return this.isTextLine() && this.markup && this.markup.isInline();
    },
    isRubyLine : function(){
      return this.isTextLine() && this.getMarkupName() === "ruby";
    },
    isRtLine : function(){
      return this.isTextLine() && this.getMarkupName() === "rt";
    },
    isLinkLine : function(){
      return this.isTextLine() && this.getMarkupName() === "a";
    },
    isFirstLetter : function(){
      return this.getMarkupName() === "first-letter";
    },
    isJustifyTarget : function(){
      var name = this.getMarkupName();
      return (name !== "first-letter" &&
	      name !== "rt" &&
	      name !== "li-marker");
    },
    isTextVertical : function(){
      return this.flow.isTextVertical();
    },
    isTextHorizontal : function(){
      return this.flow.isTextHorizontal();
    },
    isValidSize : function(){
      return this.size.isValid();
    },
    canInclude : function(size){
      return this.size.canInclude(size);
    },
    clearEdge : function(){
      if(this.edge){
	this.edge.clear();
      }
    },
    clearBorderBefore : function(){
      if(this.edge){
	this.edge.clearBorderBefore(this.flow);
      }
    },
    clearBorderAfter : function(){
      if(this.edge){
	this.edge.clearBorderAfter(this.flow);
      }
    },
    shortenBox : function(flow){
      var _flow = flow || this.flow;
      this.shortenMeasure(_flow);
      this.shortenExtent(_flow);
      return this;
    },
    shortenMeasure : function(flow){
      flow = flow || this.flow;
      this.size.setMeasure(flow, this.childMeasure);
      return this;
    },
    shortenExtent : function(flow){
      flow = flow || this.flow;
      this.setContentExtent(flow, this.childExtent);
      return this;
    }
  };

  return Box;
})();

// style setting from markup to box
var BoxStyle = {
  set : function(markup, box, parent){
    this._setFontSize(markup, box, parent);
    this._setFontColor(markup, box, parent);
    this._setFontFamily(markup, box, parent);
    this._setFontStyle(markup, box, parent);
    this._setFontWeight(markup, box, parent);
    this._setSizing(markup, box, parent);
    this._setEdge(markup, box, parent);
    this._setLineRate(markup, box, parent);
    this._setTextAlign(markup, box, parent);
    this._setTextIndent(markup, box, parent);
    this._setTextEmphasis(markup, box, parent);
    this._setFlowName(markup, box, parent);
    this._setFloat(markup, box, parent);
    this._setLetterSpacing(markup, box, parent);
    this._setBackground(markup, box, parent);
    this._setBackgroundColor(markup, box, parent);
    this._setBackgroundImage(markup, box, parent);
    this._setBackgroundPosition(markup, box, parent);
    this._setBackgroundRepeat(markup, box, parent);
    this._setClasses(markup, box, parent);
  },
  _setClasses : function(markup, box, parent){
    List.iter(markup.classes, function(klass){
      box.addClass(klass);
    });
  },
  _setFontSize : function(markup, box, parent){
    var base_font_size = parent? parent.fontSize : Layout.fontSize;
    var font_size = markup.getCssAttr("font-size", "inherit");
    if(font_size != "inherit"){
      box.fontSize = UnitSize.getUnitSize(font_size, base_font_size);
    }
  },
  _setFontColor : function(markup, box, parent){
    var font_color = markup.getCssAttr("color");
    if(font_color){
      box.color = new Color(font_color);
    }
  },
  _setFontFamily : function(markup, box, parent){
    var font_family = markup.getCssAttr("font-family");
    if(font_family){
      box.setCss("font-family", font_family);
    }
  },
  _setFontStyle : function(markup, box, parent){
    var font_style = markup.getCssAttr("font-style");
    if(font_style){
      box.setCss("font-style", font_style);
    }
  },
  _setFontWeight : function(markup, box, parent){
    var font_weight = markup.getCssAttr("font-weight");
    if(font_weight){
      box.fontWeight = new FontWeight(font_weight);
    }
  },
  _setSizing : function(markup, box, parent){
    var box_sizing = markup.getCssAttr("box-sizing");
    if(box_sizing){
      box.sizing = BoxSizings.getByName(box_sizing);
    }
  },
  _setEdge : function(markup, box, parent){
    var edge = markup.getBoxEdge(box.flow, box.fontSize, box.getContentMeasure());
    if(edge){
      box.setEdge(edge);
    }
  },
  _setLineRate : function(markup, box, parent){
    var line_rate = markup.getCssAttr("line-rate", "inherit");
    if(line_rate !== "inherit"){
      box.lineRate = line_rate;
    }
  },
  _setTextAlign : function(markup, box, parent){
    var text_align = markup.getCssAttr("text-align");
    if(text_align){
      box.textAlign = text_align;
    }
  },
  _setTextIndent : function(markup, box, parent){
    var text_indent = markup.getCssAttr("text-indent", "inherit");
    if(text_indent !== "inherit"){
      box.textIndent = UnixSize.getUnitSize(text_indent, box.fontSize);
    }
  },
  _setTextEmphasis : function(markup, box, parent){
    var empha_style = markup.getCssAttr("text-emphasis-style");
    if(empha_style){
      var empha_pos = markup.getCssAttr("text-emphasis-position", "over");
      var empha_color = markup.getCssAttr("text-emphasis-color", "black");
      var text_empha = new TextEmpha();
      text_empha.setStyle(empha_style);
      text_empha.setPos(empha_pos);
      text_empha.setColor(empha_color);
      box.textEmpha = text_empha;
    }
  },
  _setFlowName : function(markup, box, parent){
    var flow_name = markup.getCssAttr("flow", "inherit");
    if(flow_name === "flip"){
      box.setFlow(parent.getFlipFlow());
    } else if(flow_name !== "inherit"){
      box.setFlow(BoxFlows.getByName(flow_name));
    }
  },
  _setFloat : function(markup, box, parent){
    var logical_float = markup.getCssAttr("float", "none");
    if(logical_float != "none"){
      box.logicalFloat = logical_float;
    }
  },
  _setLetterSpacing : function(markup, box, parent){
    var letter_spacing = markup.getCssAttr("letter-spacing");
    if(letter_spacing){
      box.letterSpacing = UnitSize.getUnitSize(letter_spacing, box.fontSize);
    }
  },
  _setBackground : function(markup, box, parent){
    var background = markup.getCssAttr("background");
    if(background){
      box.setCss("background", background);
    }
  },
  _setBackgroundColor : function(markup, box, parent){
    var background_color = markup.getCssAttr("background-color");
    if(background_color){
      box.setCss("background-color", background_color);
    }
  },
  _setBackgroundImage : function(markup, box, parent){
    var background_image = markup.getCssAttr("background-image");
    if(background_image){
      box.setCss("background-image", background_image);
    }
  },
  _setBackgroundPosition : function(markup, box, parent){
    var background_pos = markup.getCssAttr("background-position");
    if(background_pos){
      box.setCss("background-position", background_pos);
    }
  },
  _setBackgroundRepeat : function(markup, box, parent){
    var background_repeat = markup.getCssAttr("background-repeat");
    if(background_repeat){
      box.setCss("background-repeat", background_pos);
    }
  }
};


var Lexer = (function (){

  var rexTcy = /\d\d|!\?|!!|\?!|\?\?/;
  var rexWord = /^([\w!\.\?\/\_:#;"',]+)/;
  var rexTag = /^(<[^>]+>)/;
  var rexCharRef = /^(&[^;\s]+;)/;
  var global_token_id = 0;

  function Lexer(src){
    this.pos = 0;
    this.buff = src;
    // TODO:
    // each time lexer is called 'get', this.buff is reduced.
    // but if we implement searching issue in this system,
    // we will need the buffer copy.
    //this.src = src;
    this.bufferLength = this.buff.length;
    this.empty = (this.buff === "");
  }

  Lexer.prototype = {
    isEmpty : function(){
      return this.empty;
    },
    get : function(){
      var token = this._getToken();
      if(token){
	token.spos = this.pos;
	token._gtid = global_token_id++;
      }
      return token;
    },
    getBufferLength : function(){
      return this.bufferLength;
    },
    getSeekPercent : function(seek_pos){
      return Math.floor(100 * seek_pos / this.bufferLength);
    },
    _stepBuff : function(count){
      this.pos += count;
      this.buff = this.buff.slice(count);
    },
    _getToken : function(){
      if(this.buff === ""){
	return null;
      } else if(this.buff.match(rexTag)){
	return this._parseTag(RegExp.$1);
      } else if(this.buff.match(rexWord)){
	var str = RegExp.$1;
	if(str.length === 1){
	  return this._parseChar(str);
	} else if(str.length === 2 && str.match(rexTcy)){
	  return this._parseTcy(str);
	}
	return this._parseWord(str);
      } else if(this.buff.match(rexCharRef)){
	return this._parseCharRef(RegExp.$1);
      } else {
	return this._parseChar(this._getChar());
      }
    },
    _getRb : function(){
      var rb = this.buffRb.substring(0, 1);
      this.buffRb = this.buffRb.slice(1);
      return rb;
    },
    _getChar : function(){
      return this.buff.substring(0,1);
    },
    _getTagContentAux : function(tag_name){
      var start_tag = "<" + tag_name;
      var end_tag = "</" + tag_name;
      var get_end_pos = function(buff, offset){
	var callee = arguments.callee;
	var start_pos = buff.indexOf(start_tag, offset);
	var end_pos = buff.indexOf(end_tag, offset);
	if(start_pos < 0 || end_pos < start_pos){
	  return end_pos;
	}
	var end_pos2 = callee(buff, start_pos + tag_name.length + 2);
	return callee(buff, end_pos2 + tag_name.length + 3);
      };
      var end_pos = get_end_pos(this.buff, 0);
      if(end_pos < 0){
	return this.buff; // tag not closed, so return whole rest buff.
      }
      return this.buff.substring(0, end_pos);
    },
    _getTagContent : function(tag_name){
      try {
	return this._getTagContentAux(tag_name);
      } catch (e){
	return "";
      }
    },
    _parseTag : function(tagstr){
      var tag = new Tag(tagstr);
      this._stepBuff(tagstr.length);

      if(tag.isTcyTag()){
	return this._parseTcyTag(tag);
      }
      if(tag.isChildContentTag()){
	return this._parseChildContentTag(tag);
      }
      return tag;
    },
    _parseTcyTag : function(tag){
      var content = this._getTagContent(tag.name);
      this._stepBuff(content.length + tag.name.length + 3); // 3 = "</>".length
      return new Tcy(content);
    },
    _parseChildContentTag : function(tag){
      var content = this._getTagContent(tag.name);
      tag.setContentRaw(Utils.trimCRLF(content));
      this._stepBuff(content.length + tag.name.length + 3); // 3 = "</>".length
      return tag;
    },
    _parseWord : function(str){
      this._stepBuff(str.length);
      return new Word(str);
    },
    _parseTcy : function(str){
      this._stepBuff(str.length);
      return new Tcy(str);
    },
    _parseChar : function(str){
      this._stepBuff(str.length);
      return new Char(str, false);
    },
    _parseCharRef : function(str){
      this._stepBuff(str.length);
      return new Char(str, true);
    }
  };

  return Lexer;
})();


var TagStack = (function (){
  function TagStack(opt){
    this.tags = [];
    this.head = null;
  }

  TagStack.prototype = {
    isEmpty : function(){
      return this.tags.length <= 0;
    },
    isTagNameEnable : function(name){
      return this.exists(function(tag){
	return tag.getName() == name;
      });
    },
    getDepth : function(){
      return this.tags.length;
    },
    getDepthByName : function(name){
      return List.count(this.tags, function(tag){
	return tag.getName() == name;
      });
    },
    getHead : function(){
      return this.head;
    },
    pop : function(){
      var ret = this.tags.pop();
      this.head = this._getCurHead();
      return ret;
    },
    push : function(tag){
      this.head = tag;
      this.tags.push(tag);
    },
    exists : function(fn){
      return List.exists(this.tags, fn);
    },
    find : function(fn){
      return List.find(this.tags, fn);
    },
    revfind : function(fn){
      return List.revfind(this.tags, fn);
    },
    iter : function(fn){
      List.iter(this.tags, fn);
    },
    reviter : function(fn){
      List.revIter(this.tags, fn);
    },
    filter : function(fn){
      return List.filter(this.tags, fn);
    },
    getByName : function(name){
      for(var i = this.tags.length - 1; i >= 0; i--){
	var tag = this.tags[i];
	if(tag.name == name){
	  return tag;
	}
      }
      return null;
    },
    popByName : function(name){
      for(var i = this.tags.length - 1; i >= 0; i--){
	var tag = this.tags[i];
	if(tag.name == name){
	  var ret = this.tags.splice(i,1)[0];
	  this.head = this._getCurHead();
	  return ret;
	}
      }
      return null;
    },
    _getCurHead : function(){
      if(this.tags.length === 0){
	return null;
      }
      return this.tags[this.tags.length - 1];
    }
  };

  return TagStack;
})();


var SectionHeader = (function(){
  function SectionHeader(rank, title, id){
    this.rank = rank;
    this.title = title;
    this._id = id || 0;
  }

  SectionHeader.prototype = {
    getId : function(){
      return this._id;
    }
  };

  return SectionHeader;
})();

var Section = (function(){
  function Section(type, parent, page_no){
    this._type = type;
    this._header = null;
    this._auto = false;
    this._next = null;
    this._child = null;
    this._parent = parent || null;
    this._pageNo = page_no || 0;
  }

  Section.prototype = {
    isRoot : function(){
      return this._parent === null;
    },
    isAuto : function(){
      return this._auto;
    },
    hasHeader : function(){
      return this._header !== null;
    },
    hasHeaderId : function(){
      return this.getHeaderId() > 0;
    },
    hasChild : function(){
      return this._child !== null;
    },
    hasNext : function(){
      return this._next !== null;
    },
    getNext : function(){
      return this._next;
    },
    getChild : function(){
      return this._child;
    },
    getParent : function(){
      return this._parent;
    },
    getHeader : function(){
      return this._header;
    },
    getHeaderId : function(){
      if(this._header){
	return this._header.getId();
      }
      return null;
    },
    setHeader : function(header){
      this._header = header;
    },
    setAuto : function(){
      this._auto = true;
    },
    getRank : function(){
      return this._header? this._header.rank : 0;
    },
    getTitle : function(){
      return this._header? this._header.title : ["untitled", this._type].join(" ");
    },
    getType : function(){
      return this._type;
    },
    getPageNo : function(){
      return this._pageNo;
    },
    updatePageNo : function(page_no){
      this._pageNo = page_no;
    },
    addChild : function(section){
      if(this._child === null){
	this._child = section;
      } else {
	this._child.addNext(section);
      }
    },
    addNext : function(section){
      if(this._next === null){
	this._next = section;
      } else {
	this._next.addNext(section);
      }
    }
  };

  return Section;
})();


var TocContext = (function(){
  function TocContext(){
    this.stack = [1];
  }

  TocContext.prototype = {
    getTocStack : function(){
      return this.stack;
    },
    getTocId : function(){
      return this.stack.join(".");
    },
    stepNext : function(){
      var len = this.stack.length;
      if(len > 0){
	this.stack[len-1]++;
      }
      return this;
    },
    startRoot : function(){
      this.stack.push(1);
      return this;
    },
    endRoot : function(){
      this.stack.pop();
      return this;
    }
  };

  return TocContext;
})();

var OutlineBuffer = (function(){
  function OutlineBuffer(root_name){
    this.rootName = root_name;
    this.logs = [];
  }

  OutlineBuffer.prototype = {
    isEmpty : function(){
      return this.logs.length === 0;
    },
    get : function(pos){
      return this.logs[pos] || null;
    },
    getSectionRootName : function(){
      return this.rootName;
    },
    addSectionLog : function(log){
      this.logs.push(log);
    },
    addHeaderLog : function(log){
      // if section tag can't be included in parent layout,
      // it's added twice by rollback yielding.
      // in such case, we have to update old one.
      var pos = this._findLog(log);
      if(pos >= 0){
	this.logs[pos] = log; // update log
	return;
      }
      this.logs.push(log);
    },
    // find same log without page no.
    _isSameLog : function(log1, log2){
      for(var prop in log1){
	if(prop == "pageNo" || prop == "headerId"){
	  continue;
	}
	if(log1[prop] != log2[prop]){
	  return false;
	}
      }
      return true;
    },
    _findLog : function(log){
      for(var i = this.logs.length - 1; i >= 0; i--){
	if(this._isSameLog(log, this.logs[i])){
	  return i;
	}
      }
      return -1;
    }
  };

  return OutlineBuffer;
})();

var OutlineContext = (function(){
  function OutlineContext(){
    this._buffers = {};
    this._stack = [];
    this._curSection = "body";
  }

  OutlineContext.prototype = {
    _addHeaderLog : function(log){
      var root_log = this.getOutlineBuffer(this._curSection);
      root_log.addHeaderLog(log);
    },
    _addSectionLog : function(log){
      var root_log = this.getOutlineBuffer(this._curSection);
      root_log.addSectionLog(log);
    },
    getOutlineBuffer : function(root_name){
      var buffer = this._buffers[root_name] || new OutlineBuffer(root_name);
      this._buffers[root_name] = buffer;
      return buffer;
    },
    startSectionRoot : function(root_name){
      this._stack.push(root_name);
      this._curSection = root_name;
    },
    endSectionRoot : function(root_name){
      this._curSection = this._stack.pop() || "body";
      return this._curSection;
    },
    logStartSection : function(type, page_no){
      this._addSectionLog({
	name:"start-section",
	type:type,
	pageNo:page_no
      });
    },
    logEndSection : function(type){
      this._addSectionLog({
	name:"end-section",
	type:type
      });
    },
    logSectionHeader : function(type, rank, title, page_no, header_id){
      this._addHeaderLog({
	name:"set-header",
	type:type,
	rank:rank,
	title:title,
	pageNo:page_no,
	headerId:header_id // header id is used to associate header box object with outline.
      });
    }
  };

  return OutlineContext;
})();

var OutlineParser = (function(){
  function OutlineParser(logs){
    this._ptr = 0;
    this._logs = logs;
    this._root = new Section("section", null, 0);
  }

  OutlineParser.prototype = {
    getTree : function(){
      this._parse(this._root, this);
      return this._root;
    },
    _getNext : function(){
      return this._logs.get(this._ptr++);
    },
    _rollback : function(){
      this._ptr = Math.max(0, this._ptr - 1);
    },
    _parse : function(parent, ctx){
      var log = ctx._getNext();
      if(log === null){
	return;
      }
      switch(log.name){
      case "start-section":
	var section = new Section(log.type, parent, log.pageNo);
	if(parent){
	  parent.addChild(section);
	}
	arguments.callee(section, ctx);
	break;

      case "end-section":
	arguments.callee(parent.getParent(), ctx);
	break;

      case "set-header":
	var header = new SectionHeader(log.rank, log.title, log.headerId);
	if(parent === null){
	  var auto_section = new Section("section", null, log.pageNo);
	  auto_section.setHeader(header);
	  arguments.callee(auto_section, ctx);
	} else if(!parent.hasHeader()){
	  parent.setHeader(header);
	  arguments.callee(parent, ctx);
	} else {
	  var rank = log.rank;
	  var parent_rank = parent.getRank();
	  if(rank < parent_rank){ // higher rank
	    ctx._rollback();
	    arguments.callee(parent.getParent(), ctx);
	  } else if(log.rank == parent_rank){ // same rank
	    var next_section = new Section("section", parent, log.pageNo);
	    next_section.setHeader(header);
	    parent.addNext(next_section);
	    arguments.callee(next_section, ctx);
	  } else { // lower rank
	    var child_section = new Section("section", parent, log.pageNo);
	    child_section.setHeader(header);
	    parent.addChild(child_section);
	    arguments.callee(child_section, ctx);
	  }
	}
	break;
      }
    }
  };

  return OutlineParser;
})();

/*
  outline mapping
  ===============

  <ol>
    <li> root.title
      <ol>
        <li> root.child.title  </li>
	<li> root.child.next.title </li>
      </ol>
    </li>

    <li> root.next.title
      <ol>
        <li> root.next.child.title </li>
	<li> root.next.child.next.title </li>
      </ol>
   </li>
  </ol>
*/
var OutlineConverter = (function(){
  function OutlineConverter(tree, opt){
    this.tree = tree;
    Args.copy(this, opt || {});
  }

  OutlineConverter.prototype = {
    outputNode : function(){
      var ctx = new TocContext();
      return this._parseTree(this, this.createRoot(), this.tree, ctx);
    },
    _createToc : function(tree, ctx){
      return {
	title:tree.getTitle(),
	pageNo:tree.getPageNo(),
	tocId:ctx.getTocId(),
	headerId:tree.getHeaderId()
      };
    },
    _parseTree : function(self, parent, tree, ctx){
      if(tree === null){
	return parent;
      }
      var toc = self._createToc(tree, ctx);
      var li = self.createChild(toc);
      var link = self.createLink(toc);
      if(link){
	link.onclick = function(){
	  return self.onClickLink(toc);
	};
	li.appendChild(link);
      }
      var page_no_item = self.createPageNoItem(toc);
      if(page_no_item){
	li.appendChild(page_no_item);
      }
      parent.appendChild(li);

      var child = tree.getChild();
      if(child){
	ctx = ctx.startRoot();
	var child_toc = self._createToc(child, ctx);
	var ol = self.createRoot(child_toc);
	arguments.callee(self, ol, child, ctx);
	li.appendChild(ol);
	ctx = ctx.endRoot();
      }
      var next = tree.getNext();
      if(next){
	arguments.callee(self, parent, next, ctx.stepNext());
      }
      return parent;
    },
    onClickLink : function(toc){
      return false;
    },
    createRoot: function(toc){
      var root = document.createElement("ol");
      root.className = "nehan-toc-root";
      return root;
    },
    createChild : function(toc){
      var li = document.createElement("li");
      li.className = "nehan-toc-item";
      return li;
    },
    createLink : function(toc){
      var link = document.createElement("a");
      var title = toc.title.replace(/<a[^>]+>/gi, "").replace(/<\/a>/gi, "");
      link.href = "#" + toc.pageNo;
      link.innerHTML = title;
      link.className = "nehan-toc-link";
      link.id = Css.addNehanTocLinkPrefix(toc.tocId);
      return link;
    },
    createPageNoItem : function(toc){
      return null;
    }
  };

  return OutlineConverter;
})();

var DocumentHeader = (function(){
  function DocumentHeader(){
    this.title = "";
    this.metas = [];
    this.links = [];
    this.scripts = [];
    this.styles = [];
  }

  DocumentHeader.prototype = {
    setTitle :function(title){
      this.title = title;
    },
    getTitle : function(){
      return this.title;
    },
    addLink : function(markup){
      this.links.push(markup);
    },
    getLinks : function(){
      return this.links;
    },
    addMeta : function(markup){
      this.metas.push(markup);
    },
    getMetas : function(){
      return this.metas;
    },
    getMetaByName : function(name){
      return List.find(this.metas, function(meta){
	return meta.getTagAttr("name") === name;
      });
    },
    getMetaContentByName : function(name){
      var meta = this.getMetaByName(name);
      return meta? meta.getTagAttr("content") : null;
    },
    addScript : function(markup){
      this.scripts.push(markup);
    },
    getScripts : function(){
      return this.scripts;
    },
    addStyle : function(markup){
      this.styles.push(markup);
    },
    getStyles : function(){
      return this.styles;
    }
  };

  return DocumentHeader;
})();


var BlockContext = (function(){
  function BlockContext(){
    this.tagStack = new TagStack();
  }

  BlockContext.prototype = {
    pushTag : function(tag){
      this.tagStack.push(tag);
    },
    popTag : function(){
      return this.tagStack.pop();
    },
    getHeadTag : function(){
      return this.tagStack.getHead();
    },
    getTagStack : function(){
      return this.tagStack;
    },
    getTagDepth : function(){
      return this.tagStack.getDepth();
    },
    getTagDepthByName : function(name){
      return this.tagStack.getDepthByName(name);
    },
    findTag : function(fn){
      return this.tagStack.find(fn);
    },
    isEmpty : function(){
      return this.tagStack.isEmpty();
    },
    isTagEnable : function(fn){
      return this.tagStack.exists(fn);
    },
    isTagNameEnable : function(tag_name){
      return this.tagStack.isTagNameEnable(tag_name);
    },
    isHeaderEnable : function(){
      return this.tagStack.exists(function(tag){
	return tag.isHeaderTag();
      });
    }
  };

  return BlockContext;
})();

var InlineContext = (function(){
  function InlineContext(){
    this.tagStack = new TagStack();
  }

  InlineContext.prototype = {
    pushTag : function(tag){
      this.tagStack.push(tag);
    },
    popTag : function(){
      return this.tagStack.pop();
    },
    getHeadTag : function(){
      return this.tagStack.getHead();
    },
    getTagStack : function(){
      return this.tagStack;
    },
    getTagDepth : function(){
      return this.tagStack.getDepth();
    },
    findTag : function(fn){
      return this.tagStack.find(fn);
    },
    isEmpty : function(){
      return this.tagStack.isEmpty();
    },
    isTagEnable : function(fn){
      return this.tagStack.exists(fn);
    },
    isTagNameEnable : function(tag_name){
      return this.tagStack.isTagNameEnable(tag_name);
    }
  };

  return InlineContext;
})();

var DocumentContext = (function(){

  // header id to associate each header with outline.
  var __global_header_id = 0;
  
  function DocumentContext(option){
    var opt = option || {};
    this.charPos = opt.charPos || 0;
    this.pageNo = opt.pageNo || 0;
    this.header = opt.header || new DocumentHeader();
    this.blockContext = opt.blockContext || new BlockContext();
    this.inlineContext = opt.inlineContext || new InlineContext();
    this.outlineContext = opt.outlineContext || new OutlineContext();
    this.anchors = opt.anchors || {};
  }

  DocumentContext.prototype = {
    getHeader : function(){
      return this.header;
    },
    addScript : function(markup){
      this.header.addScript(markup);
    },
    addStyle : function(markup){
      this.header.addStyle(markup);
    },
    getPageNo : function(){
      return this.pageNo;
    },
    getCharPos : function(){
      return this.charPos;
    },
    stepPageNo : function(){
      this.pageNo++;
    },
    addCharPos : function(char_count){
      this.charPos += char_count;
    },
    createInlineRoot : function(){
      return new DocumentContext({
	charPos:this.charPos,
	pageNo:this.pageNo,
	header:this.header,
	anchors:this.anchors,
	outlineContext:this.outlineContext,
	blockContext:this.blockContext
      });
    },
    inheritTag : function(tag){
      var parent_tag = this.getCurBlockTag();
      if(!tag.hasLayout()){
	return;
      }
      if(parent_tag){
	tag.inherit(parent_tag);
      }
      var onload = tag.getCssAttr("onload");
      if(onload){
	onload(this, tag);
      }
    },
    isEmptyMarkupContext : function(){
      return this.inlineContext.isEmpty();
    },
    // anchors
    setAnchor : function(anchor_name){
      this.anchors[anchor_name] = this.pageNo;
    },
    getAnchors : function(){
      return this.anchors;
    },
    getAnchorPageNo : function(anchor_name){
      return this.anchors[anchor_name] || -1;
    },
    // inline context
    getCurInlineTag : function(){
      return this.inlineContext.getHeadTag();
    },
    getInlineTagStack : function(){
      return this.inlineContext.getTagStack();
    },
    getInlineTagDepth : function(){
      return this.inlineContext.getTagDepth();
    },
    pushInlineTag : function(tag){
      this.inlineContext.pushTag(tag);
    },
    popInlineTag : function(){
      return this.inlineContext.popTag();
    },
    findInlineTag : function(fn){
      return this.inlineContext.findTag(fn);
    },
    isInlineTagEnable : function(fn){
      return this.inlineContext.isTagEnable(fn);
    },
    // block context
    isHeaderEnable : function(){
      return this.blockContext.isHeaderEnable();
    },
    pushBlockTag : function(tag){
      this.blockContext.pushTag(tag);
    },
    popBlockTag : function(){
      return this.blockContext.popTag();
    },
    getBlockTagStack : function(){
      return this.blockContext.getTagStack();
    },
    getCurBlockTag : function(){
      return this.blockContext.getHeadTag();
    },
    getBlockDepth : function(){
      return this.blockContext.getTagDepth();
    },
    getBlockDepthByName : function(name){
      return this.blockContext.getTagDepthByName(name);
    },
    getOutlineTitle : function(){
      return this.blockContext.getOutlineTitle();
    },
    findBlockTag : function(fn){
      return this.blockContext.findTag(fn);
    },
    isBlockTagEnable : function(fn){
      return this.blockContext.isTagEnable(fn);
    },
    // outline context
    getOutlineBuffer : function(root_name){
      return this.outlineContext.getOutlineBuffer(root_name);
    },
    startSectionRoot : function(tag){
      var type = tag.getName();
      this.outlineContext.startSectionRoot(type);
    },
    endSectionRoot : function(tag){
      var type = tag.getName();
      return this.outlineContext.endSectionRoot(type);
    },
    logStartSection : function(tag){
      var type = tag.getName();
      this.outlineContext.logStartSection(type, this.pageNo);
    },
    logEndSection : function(tag){
      var type = tag.getName();
      this.outlineContext.logEndSection(type);
    },
    logSectionHeader : function(tag){
      var type = tag.getName();
      var rank = tag.getHeaderRank();
      var title = tag.getContentRaw();
      var page_no = this.pageNo;
      var header_id = __global_header_id++;
      this.outlineContext.logSectionHeader(type, rank, title, page_no, header_id);
      return header_id;
    }
  };

  return DocumentContext;
})();


var BorderMap = (function(){
  function BorderMap(row_count, max_col){
    this.rowCount = row_count;
    this.maxCol = max_col;
    this.map = this._create(row_count, max_col);
  }

  BorderMap.prototype = {
    _create : function(row_count, max_col){
      var map = [];
      var make_row = function(max_col){
	var row = [];
	for(var i = 0; i < max_col; i++){
	  row.push({start:0, end:0, before:0, after:0});
	}
	return row;
      };
      for(var i = 0; i < row_count; i++){
	map.push(make_row(max_col));
      }
      return map;
    },
    get : function(row, col){
      return this.map[row][col];
    },
    getAsStyle : function(row, col){
      var border = this.get(row, col);
      var ret = {};
      for(var prop in border){
	ret[prop] = border[prop] + "px";
      }
      return ret;
    },
    set : function(row, col, border){
      for(var prop in border){
	this.setBorderProp(row, col, prop, border);
      }
    },
    collapse : function(){
      this._collapseCol();
      this._collapseRow();
    },
    _collapseCol : function(){
      for(var row = 0; row < this.rowCount; row++){
	for(var col = 0; col < this.maxCol - 1; col++){
	  var c1 = this.get(row, col);
	  var c2 = this.get(row, col+1);
	  if(c1.end && c2.start){
	    if(c1.end > c2.start){
	      c2.start = 0;
	    } else {
	      c1.end = 0;
	    }
	  }
	}
      }
    },
    _collapseRow : function(){
      for(var row = 0; row < this.rowCount - 1; row++){
	for(var col = 0; col < this.maxCol; col++){
	  var r1 = this.get(row, col);
	  var r2 = this.get(row+1, col);
	  if(r1.after && r2.before){
	    if(r1.after > r2.before){
	      r2.before = 0;
	    } else {
	      r1.after = 0;
	    }
	  }
	}
      }
    },
    setBorderProp : function(row, col, prop, border){
      var cur = this.get(row, col);
      if(border[prop] > cur[prop]){
	cur[prop] = border[prop];
      }
    },
    setRange : function(start_row, start_col, end_row, end_col, border){
      for(var row = start_row; row < end_row; row++){
	for(var col = start_col; col < end_col; col++){
	  if(row == start_row){
	    this.setBorderProp(row, col, "before", border);
	  }
	  if(row == end_row - 1){
	    this.setBorderProp(row, col, "after", border);
	  }
	  if(col == start_col){
	    this.setBorderProp(row, col, "start", border);
	  }
	  if(col == end_col - 1){
	    this.setBorderProp(row, col, "end", border);
	  }
	}
      }
    }
  };

  return BorderMap;
})();

var Collapse = (function(){
  var getBorder = function(box, markup){
    var border = markup.getCssAttr("border-width");
    if(border === null){
      return null;
    }
    var val = UnitSize.getEdgeSize(border, box.fontSize, box.getContentMeasure());
    if(typeof val == "number"){
      return {before:val, after:val, start:val, end:val};
    }
    return val;
  };

  var setBorderMap = function(map, box, markup){
    var border = getBorder(box, markup);
    if(border === null){
      return;
    }
    switch(markup.name){
    case "table":
      map.setRange(0, 0, map.rowCount, map.maxCol, border);
      break;
    case "thead": case "tbody": case "tfoot":
      var start_row = markup.row;
      var end_row = start_row + markup.tableChilds.length;
      map.setRange(start_row, 0, end_row, map.maxCol);
      break;
    case "tr":
      map.setRange(markup.row, 0, markup.row + 1, map.maxCol);
      break;
    case "td": case "th":
      map.set(markup.row, markup.col, border);
      break;
    }
  };

  var createBorderMap = function(map, box, markup){
    var callee = arguments.callee;
    setBorderMap(map, box, markup);
    List.iter(markup.tableChilds || [], function(child){
      callee(map, box, child);
    });
  };

  var updateBorder = function(map, markup){
    var callee = arguments.callee;
    switch(markup.name){
    case "table": case "thead": case "tbody": case "tfoot": case "tr":
      markup.setCssAttr("border-width", "0px");
      break;
    case "td": case "th":
      var border = map.getAsStyle(markup.row, markup.col);
      markup.setCssAttr("border-width", border);
      break;
    }
    List.iter(markup.tableChilds || [], function(child){
      callee(map, child);
    });
  };
  
  return {
    set : function(table_markup, box){
      var map = new BorderMap(table_markup.rowCount, table_markup.maxCol);
      createBorderMap(map, box, table_markup);
      map.collapse();
      updateBorder(map, table_markup);
    }
  };
})();


var TokenStream = Class.extend({
  init : function(src){
    this.lexer = new Lexer(src);
    this.tokens = [];
    this.pos = 0;
    this.backupPos = 0;
    this.eof = false;
    this._doBuffer();
  },
  hasNext : function(){
    return !this.isEnd();
  },
  isEmpty : function(){
    return this.lexer.isEmpty();
  },
  isEmptyTokens : function(){
    return this.tokens.length === 0;
  },
  isHead : function(){
    return this.pos === 0;
  },
  isEnd : function(){
    return (this.eof && this.pos >= this.tokens.length);
  },
  backup : function(){
    this.backupPos = this.pos;
  },
  rollback : function(){
    this.pos = this.backupPos;
  },
  next : function(cnt){
    var count = cnt || 1;
    this.pos = this.pos + count;
  },
  prev : function(){
    this.pos = Math.max(0, this.pos - 1);
  },
  setPos : function(pos){
    this.pos = pos;
  },
  skipIf : function(fn){
    var token = this.peek();
    if(token && fn(token)){
      this.next();
    }
  },
  skipUntil : function(fn){
    while(this.hasNext()){
      var token = this.get();
      if(token === null){
	break;
      }
      if(!fn(token)){
	this.prev();
	break;
      }
    }
  },
  rewind : function(){
    this.pos = 0;
  },
  peek : function(off){
    var offset = off || 0;
    var index = Math.max(0, this.pos + offset);
    if(index >= this.tokens.length){
      if(this.eof){
	return null;
      }
      this._doBuffer();
    }
    var token = this.tokens[index];
    token.pos = index;
    return token;
  },
  get : function(){
    var token = this.peek();
    this.pos++;
    return token;
  },
  getPos : function(){
    return this.pos;
  },
  getAll : function(){
    while(!this.eof){
      this._doBuffer();
    }
    return this.tokens;
  },
  getAllIf : function(fn){
    return List.filter(this.getAll(), function(token){
      return fn(token);
    });
  },
  getTokenCount : function(){
    return this.tokens.length;
  },
  getSeekPos : function(){
    var token = this.tokens[this.pos];
    return token? token.spos : 0;
  },
  getSeekPercent : function(){
    var seek_pos = this.getSeekPos();
    return this.lexer.getSeekPercent(seek_pos);
  },
  // iterate while fn(pos, token) returns true.
  // so loop is false break
  iterWhile : function(start_pos, fn){
    var ptr = (arguments.length == 1)? this.pos : start_pos;
    while(ptr >= 0){
      if(ptr >= this.tokens.length){
	if(this.eof){
	  break;
	}
	this._doBuffer();
	this.iterWhile(ptr, fn);
	break;
      }
      if(!fn(ptr, this.tokens[ptr])){
	break;
      }
      ptr++;
    }
  },
  // reverse iterate while fn(pos, token) returns true.
  // so loop is false break
  revIterWhile : function(start_pos, fn){
    var ptr = (arguments.length == 1)? this.pos : start_pos;
    while(ptr >= 0){
      if(!fn(ptr, this.tokens[ptr])){
	break;
      }
      ptr--;
    }
  },
  findTextPrev : function(start_p){
    var start_pos = (typeof start_pos != "undefined")? start_p : this.pos;
    var text = null;
    this.revIterWhile(start_pos - 1, function(pos, token){
      if(Token.isText(token)){
	text = token;
	return false; // break
      }
      return true; // continue
    });
    return text;
  },
  findTextNext : function(start_p){
    var start_pos = (typeof start_p != "undefined")? start_p : this.pos;
    var text = null;
    this.iterWhile(start_pos + 1, function(pos, token){
      if(Token.isText(token)){
	text = token;
	return false; // break
      }
      return true; // continue
    });
    return text;
  },
  _doBuffer : function(){
    var self = this;
    var buff_len = Config.lexingBufferLen;
    var push = function(token){
      self.tokens.push(token);
    };
    for(var i = 0; i < buff_len; i++){
      var token = this.lexer.get();
      if(token === null){
	this.eof = true;
	break;
      }
      push(token);
    }
  }
});

var FilteredTagStream = TokenStream.extend({
  init : function(src, fn){
    var order = 0;
    this._super(src);
    this.tokens = this.getAllIf(function(token){
      if(Token.isText(token)){
	return false;
      }
      if(fn(token)){
	token.order = order++;
	return true;
      }
    });
  }
});

var DirectTokenStream = TokenStream.extend({
  init : function(tokens){
    this._super("");
    this.tokens = tokens;
  },
  isEmpty : function(){
    return this.tokens.length === 0;
  }
});

var PhrasingTokenStream = TokenStream.extend({
  init : function(src){
    this._super(src);
    this.tokens = this.getAllIf(function(token){
      if(Token.isText(token)){
	return true;
      }
      return (token.isInline() || token.isInlineBlock());
    });
  }
});

var DocumentTagStream = FilteredTagStream.extend({
  init : function(src){
    this._super(src, function(tag){
      var name = tag.getName();
      return (name === "!doctype" || name === "html");
    });
    if(this.isEmptyTokens()){
      this.tokens = [new Tag("html", src)];
    }
  }
});


var HtmlTagStream = FilteredTagStream.extend({
  init : function(src){
    this._super(src, function(tag){
      var name = tag.getName();
      return (name === "head" || name === "body");
    });
    if(this.isEmptyTokens()){
      this.tokens = [new Tag("body", src)];
    }
  }
});


var HeadTagStream = FilteredTagStream.extend({
  init : function(src){
    this._super(src, function(tag){
      var name = tag.getName();
      return (name === "title" ||
	      name === "meta" ||
	      name === "link" ||
	      name === "style" ||
	      name === "script");
    });
  }
});


var TableTagStream = FilteredTagStream.extend({
  init : function(markup){
    // TODO: caption not supported yet.
    this._super(markup.getContent(), function(tag){
      var name = tag.getName();
      return (name === "thead" ||
	      name === "tbody" ||
	      name === "tfoot" ||
	      name === "tr");
    });
    this.markup = markup;
    this.markup.tableChilds = this.tokens = this._parseTokens(this.tokens);
  },
  getPartition : function(box){
    var self = this;
    var partition = new TablePartition();
    var measure = box.getContentMeasure();
    List.iter(this.tokens, function(row_group){
      var rows = row_group.tableChilds;
      List.iter(rows, function(row){
	var cols = row.tableChilds;
	var cols_count = cols.length;
	if(partition.getPartition(cols_count) === null){
	  var parts = self._parsePartition(cols, box);
	  partition.add(new Partition(parts, measure));
	}
      });
    });
    return partition;
  },
  _setChildTokens : function(target, childs){
    target.tableChilds = childs;
    var len = childs.length;
    if(len > 0){
      target.firstChild = childs[0];
      target.lastChild = childs[len - 1];
    }
    return target;
  },
  _parseTokens : function(tokens){
    var theads = [], tfoots = [], tbodies = [], self = this;
    var thead = null, tbody = null, tfoot = null;
    var ctx = {row:0, col:0, maxCol:0};
    List.iter(tokens, function(token){
      if(Token.isTag(token)){
	switch(token.name){
	case "tr":
	  token.row = ctx.row;
	  self._setChildTokens(token, self._parseCols(ctx, token.getContent()));
	  ctx.row++;
	  tbodies.push(token);
	  break;
	case "thead":
	  thead = token;
	  theads = theads.concat(self._parseRows(ctx, token.getContent()));
	  break;
	case "tbody":
	  tbody = token;
	  tbodies = tbodies.concat(self._parseRows(ctx, token.getContent()));
	  break;
	case "tfoot":
	  tfoot = token;
	  tfoots = tfoots.concat(self._parseRows(ctx, token.getContent()));
	  break;
	}
      }
    });

    var ret = [], nrow = 0;

    if(theads.length > 0){
      if(thead === null){
	thead = new Tag("<thead>");
      }
      this._setChildTokens(thead, theads);
      thead.row = nrow;
      nrow += thead.tableChilds.length;
      ret.push(thead);
    }

    if(tbodies.length > 0){
      if(tbody === null){
	tbody = new Tag("<tbody>");
      }
      this._setChildTokens(tbody, tbodies);
      tbody.row = nrow;
      nrow += tbody.tableChilds.length;
      ret.push(tbody);
    }

    if(tfoots.length > 0){
      if(tfoot === null){
	tfoot = new Tag("<tfoot>");
      }
      this._setChildTokens(tfoot, tfoots);
      tfoot.row = nrow;
      ret.push(tfoot);
    }

    this._setChildTokens(this.markup, ret);
    this.markup.maxCol = ctx.maxCol;
    this.markup.rowCount = ctx.row;

    return ret;
  },
  _parsePartition : function(childs, box){
    return List.map(childs, function(child){
      var size = child.getTagAttr("measure") || child.getTagAttr("width") || 0;
      if(size){
	return UnitSize.getBoxSize(size, box.fontSize, box.getContentMeasure());
      }
      return 0;
    });
  },
  _parseRows : function(ctx, content){
    var self = this;
    var rows = (new FilteredTagStream(content, function(tag){
      return tag.getName() === "tr";
    })).getAll();

    return List.map(rows, function(row){
      row.row = ctx.row;
      row = self._setChildTokens(row, self._parseCols(ctx, row.getContent()));
      ctx.row++;
      return row;
    });
  },
  _parseCols : function(ctx, content){
    var cols = (new FilteredTagStream(content, function(tag){
      var name = tag.getName();
      return (name === "td" || name === "th");
    })).getAll();

    List.iteri(cols, function(i, col){
      col.row = ctx.row;
      col.col = i;
    });

    if(cols.length > ctx.maxCol){
      ctx.maxCol = cols.length;
    }
    return cols;
  }
});



var ListTagStream = FilteredTagStream.extend({
  init : function(src){
    this._super(src, function(tag){
      return tag.getName() === "li";
    });
  }
});


var DefListTagStream = FilteredTagStream.extend({
  init : function(src, font_size, max_size){
    this._super(src, function(tag){
      var name = tag.getName();
      return (name === "dt" || name === "dd");
    });
  }
});


var RubyTagStream = TokenStream.extend({
  init : function(src){
    this._super(src);
    this.getAll();
    this.tokens = this._parse();
    this.rewind();
  },
  _parse : function(stream){
    var ret = [];
    while(this.hasNext()){
      ret.push(this._parseRuby());
    }
    return ret;
  },
  _parseRuby : function(stream){
    var rbs = [];
    var rt = null;
    while(true){
      var token = this.get();
      if(token === null){
	break;
      }
      if(Token.isTag(token) && token.getName() === "rt"){
	rt = token;
	break;
      }
      if(Token.isText(token)){
	rbs.push(token);
      }
    }
    return new Ruby(rbs, rt);
  }
});


var DocumentGenerator = (function(){
  function DocumentGenerator(src){
    this.context = new DocumentContext();
    this.stream = new DocumentTagStream(src);
    this.generator = this._createGenerator();
    if(this.generator === null){
      throw "DocumentGenerator::invalid document";
    }
  }

  DocumentGenerator.prototype = {
    yield : function(){
      return this.generator.yield();
    },
    hasNext : function(){
      return this.generator.hasNext();
    },
    getTitle : function(){
      return this.context.getTitle();
    },
    getMeta : function(name){
      return this.context.getMeta(name);
    },
    getOutline : function(root_name){
      return this.generator.getOutline(root_name);
    },
    getOutlineHtml : function(root_name){
      return this.generator.getOutlineHtml(root_name);
    },
    _parseDocType : function(tag){
    },
    _createGenerator : function(){
      var generator = null;
      while(true){
	var tag = this.stream.get();
	if(tag === null){
	  break;
	}
	switch(tag.getName()){
	case "!doctype":
	  this._parseDocType(tag);
	  break;
	case "html":
	  generator = new HtmlGenerator(tag, this.context);
	  break;
	}
      }
      return generator;
    }
  };

  return DocumentGenerator;
})();


var HtmlGenerator = (function(){
  function HtmlGenerator(markup, context){
    this.markup = markup;
    this.context = context || new DocumentContext();
    this.stream = this._createStream();
    this.generator = this._getGenerator();
    if(this.generator === null){
      throw "HtmlGenerator::invalid html";
    }
  }

  HtmlGenerator.prototype = {
    yield : function(){
      return this.generator.yield();
    },
    hasNext : function(){
      return this.generator.hasNext();
    },
    getOutline : function(root_name){
      return this.generator.getOutline(root_name);
    },
    getOutlineHtml : function(root_name){
      return this.generator.getOutlineHtml(root_name);
    },
    _createStream : function(){
      return new HtmlTagStream(this.markup.getContentRaw());
    },
    _getGenerator : function(){
      var generator = null;
      while(true){
	var tag = this.stream.get();
	if(tag === null){
	  break;
	}
	switch(tag.getName()){
	case "head":
	  this._parseHead(tag.getContentRaw());
	  break;
	case "body":
	  generator = new BodyBlockTreeGenerator(tag, this.context);
	  break;
	}
      }
      return generator;
    },
    _parseHead : function(content){
      var stream = new HeadTagStream(content);
      var header = this.context.getHeader();
      while(true){
	var tag = stream.get();
	if(tag === null){
	  break;
	}
	switch(tag.getName()){
	case "title":
	  this._parseTitle(header, tag);
	  break;
	case "meta":
	  this._parseMeta(header, tag);
	  break;
	case "link":
	  this._parseLink(header, tag);
	  break;
	case "style":
	  this._parseStyle(header, tag);
	  break;
	case "script":
	  this._parseScript(header, tag);
	  break;
	}
      }
    },
    _parseTitle : function(header, tag){
      header.setTitle(tag.getContentRaw());
    },
    _parseMeta : function(header, tag){
      header.addMeta(tag);
    },
    _parseLink : function(header, tag){
      header.addLink(tag);
    },
    _parseStyle : function(header, tag){
      header.addStyle(tag);
    },
    _parseScript : function(header, tag){
      header.addScript(tag);
    }
  };

  return HtmlGenerator;
})();


var ElementGenerator = Class.extend({
  init : function(markup, context){
    this.markup = markup;
    this.context = context;
  },
  hasNext : function(){
    return false;
  },
  backup : function(){
  },
  rollback : function(){
  },
  // called when box is created, but no style is not loaded.
  _onReadyBox : function(box, parent){
  },
  // called when box is created, and std style is already loaded.
  _onCreateBox : function(box, parent){
  },
  _getMarkupStaticSize : function(parent){
    var font_size = parent? parent.fontSize : Layout.fontSize;
    var measure = parent? parent.getContentMeasure(parent.flow) : Layout.getStdMeasure();
    return this.markup.getStaticSize(font_size, measure);
  },
  _yieldStaticElement : function(parent, tag){
    switch(tag.getName()){
    case "img":
      return (new ImageGenerator(tag, this.context)).yield(parent);
    case "ibox":
      return (new InlineBoxGenerator(tag, this.context)).yield(parent);
    case "div":
      if(tag.hasFlow()){
	return (new InlinePageGenerator(tag, this.context.createInlineRoot())).yield(parent);
      }
      return (new InlineBoxGenerator(tag, this.context)).yield(parent);
    default:
      return (new InlinePageGenerator(tag, this.context.createInlineRoot())).yield(parent);
    }
  },
  _getBoxType : function(){
    return this.markup.getName();
  },
  _setBoxFirstChild : function(box, parent){
    // if box is first child of parent,
    // copy style of <this.markup.name>:first-child.
    if(box.isFirstChildOf(parent)){
      this.markup.setFirstChild();
    }
  },
  _setBoxClasses : function(box, parent){
    List.iter(this.markup.classes, function(klass){
      box.addClass(klass);
    });
  },
  _setBoxStyle : function(box, parent){
    BoxStyle.set(this.markup, box, parent);
  },
  _createBox : function(size, parent){
    var box_type = this._getBoxType();
    var box = Layout.createBox(size, parent, box_type);
    box.markup = this.markup;
    this._onReadyBox(box, parent);
    this._setBoxFirstChild(box, parent);
    this._setBoxClasses(box, parent);
    this._setBoxStyle(box, parent);
    this._onCreateBox(box, parent);
    return box;
  }
});


var StaticBlockGenerator = ElementGenerator.extend({
  _getBoxSize : function(parent){
    return this._getMarkupStaticSize(parent);
  },
  _createBox : function(size, parent){
    var box = this._super(size, parent);
    box.sizing = BoxSizings.getByName("content-box"); // use normal box model
    return box;
  },
  yield : function(parent){
    var size = this._getBoxSize(parent);
    var box = this._createBox(size, parent);
    if(this.markup.isPush()){
      box.backward = true;
    }
    if(this.markup.isPull()){
      box.forward = true;
    }
    // get rest size without edge of box.
    var rest_size = parent.getRestSize();
    rest_size.width -= box.getEdgeWidth();
    rest_size.height -= box.getEdgeHeight();
    
    // even if edge can't be included, retry.
    if(!rest_size.isValid()){
      return Exceptions.RETRY;
    }
    // if rest size has prenty of space for this box, just return as it it.
    if(rest_size.canInclude(box.size)){
      return box;
    }
    var root_page_size = Layout.getStdPageSize();
    var reduced_size = box.size.resizeWithin(parent.flow, rest_size);

    // use reduced size if
    // 1. even root size of page can't include this box
    // 2. or reduced box size is within Config.minBlockScaleDownRate of original
    if(!root_page_size.canInclude(box.size) ||
       reduced_size.percentFrom(box.size) >= Config.minBlockScaleDownRate){
      box.size = reduced_size;
      return box;
    }
    return Exceptions.RETRY;
  }
});


var InlineBoxGenerator = StaticBlockGenerator.extend({
  _getBoxType : function(){
    return "ibox";
  },
  _onCreateBox : function(box, parent){
    box.content = this.markup.getContentRaw();
    box.css.overflow = "hidden";
  }
});

var ImageGenerator = StaticBlockGenerator.extend({
  _onCreateBox : function(box, parent){
    box.src = this.markup.getTagAttr("src");
  }
});

var HrGenerator = ElementGenerator.extend({
  _getBoxSize : function(parent){
    var measure = parent? parent.getContentMeasure() : Layout.getStdMeasure();
    return parent.flow.getBoxSize(measure, 1);
  },
  yield : function(parent){
    var size = this._getBoxSize(parent);
    var box = this._createBox(size, parent);
    return box;
  }
});

var InlineTreeContext = (function(){
  function InlineTreeContext(line, stream, context){
    this.line = line;
    this.stream = stream;
    this.context = context;
    this.markup = this.context.getCurInlineTag() || null;
    this.lineStartPos = this.stream.getPos();
    this.textIndent = stream.isHead()? (line.textIndent || 0) : 0;
    this.maxFontSize = 0;
    this.maxExtent = 0;
    this.maxMeasure = line.getContentMeasure() - this.textIndent;
    this.curMeasure = 0;
    this.lineMeasure = line.getContentMeasure() - this.textIndent;
    this.startTokens = [];
    this.lineTokens = [];
    this.endTokens = [];
    this.lineBreak = false;
    this.charCount = 0;
    this.lastToken = null;
    this.prevText = null;
    this.lastText = null;
  }

  InlineTreeContext.prototype = {
    getElementExtent : function(element){
      if(Token.isText(element)){
	if((Token.isChar(element) || Token.isTcy(element)) && this.line.textEmpha){
	  return this.line.textEmpha.getExtent(this.line.fontSize);
	}
	return this.line.fontSize;
      }
      if(element instanceof Ruby){
	return element.getExtent(this.line.fontSize);
      }
      return element.getBoxExtent(this.getLineFlow());
    },
    getElementFontSize : function(element){
      return (element instanceof Box)? element.fontSize : this.line.fontSize;
    },
    getElementAdvance : function(element){
      if(Token.isText(element)){
	return element.getAdvance(this.getLineFlow(), this.getLetterSpacing());
      }
      if(element instanceof Ruby){
	return element.getAdvance(this.getLineFlow());
      }
      return element.getBoxMeasure(this.getLineFlow());
    },
    getFontSize : function(){
      return this.line.fontSize;
    },
    getMaxFontSize : function(){
      return this.maxFontSize;
    },
    getMaxExtent : function(){
      return this.maxExtent;
    },
    getLineFlow : function(){
      return this.line.flow;
    },
    getLetterSpacing : function(){
      return this.line.letterSpacing || 0;
    },
    _isJustifyElement : function(element){
      if(element instanceof Char){
	return true;
      }
      if(element instanceof Ruby && this.curMeasure > 0){
	return true;
      }
      return false;
    },
    canContain : function(element, advance){
      // space for justify is required for justify target.
      if(this.line.isJustifyTarget()){
	return this.curMeasure + advance + this.line.fontSize <= this.maxMeasure;
      }
      return this.curMeasure + advance <= this.maxMeasure;
    },
    isPreLine : function(){
      return this.line._type === "pre";
    },
    isTextBold : function(){
      return this.line.isTextBold();
    },
    isEmptyText : function(){
      return this.lineTokens.length === 0;
    },
    isInlineTagEmpty : function(){
      return this.context.getInlineTagDepth() <= 0;
    },
    isOverWithoutLineBreak : function(){
      return !this.lineBreak && (this.lineTokens.length > 0);
    },
    isLineStart : function(){
      return this.stream.pos == this.lineStartPos;
    },
    pushBackToken : function(){
      this.stream.prev();
    },
    findFirstText : function(){
      return this.stream.findTextNext(this.lineStartPos);
    },
    skipToken : function(){
      this.stream.next();
    },
    getNextToken : function(){
      var token = this.stream.get();

      // skip head half space if 1 and 2.
      // 1. first token of line is a half space.
      // 2. next text token is a word.
      if(token){
	if(Token.isChar(token) && token.isHalfSpaceChar() && this.isLineStart()){
	  var next = this.findFirstText();
	  if(next && Token.isWord(next)){
	    token = this.stream.get();
	  }
	} else if(Token.isTag(token)){
	  this.context.inheritTag(token);
	}
      }
      this.lastToken = token;

      if(token && Token.isText(token)){
	this._setKerning(token);
      }

      return token;
    },
    getTextTokenLength : function(){
      return this.lineTokens.length;
    },
    getRestMeasure : function(){
      return this.line.getContentMeasure() - this.curMeasure;
    },
    getMaxMeasure : function(){
      return this.maxMeasure;
    },
    addStyle : function(tag){
      this.context.addStyle(tag);
    },
    addElement : function(element){
      var advance = this.getElementAdvance(element);
      if(!this.canContain(element, advance)){
	// even if one element can't be included, it's layout error and skip it.
	if(advance > 0 && this.curMeasure === 0){
	  throw "LayoutError";
	}
	this.pushBackToken();
	throw "OverflowInline";
      }
      var font_size = this.getElementFontSize(element);
      if(font_size > this.maxFontSize){
	this._setMaxFontSize(font_size);
      }
      var extent = this.getElementExtent(element);
      if(extent > this.maxExtent){
	this._setMaxExtent(extent);
      }
      if(Token.isTag(element)){
	this._addTag(element);
      } else if(element instanceof Ruby){
	this._addRuby(element);
      } else if (element instanceof Box){
	if(element.logicalFloat){
	  this._setLogicalFloat(element, element.logicalFloat);
	}
	if(element._type === "text-line"){
	  this._addTextLine(element);
	} else {
	  this._addInlineBlock(element);
	}
      } else {
	this._addText(element);
      }
      if(advance > 0){
	this._addAdvance(advance);
      }
      if(this.curMeasure === this.maxMeasure){
	throw "FinishInline";
      }
    },
    _setLogicalFloat : function(element, logical_float){
      switch(logical_float){
      case "start":
	element.forward = true;
	break;
      case "end":
	element.backward = true;
	break;
      }
    },
    setAnchor : function(anchor_name){
      this.context.setAnchor(anchor_name);
    },
    setLineBreak : function(){
      this.lastText = null;
      this.lineBreak = true;
    },
    createInlineRoot : function(){
      return this.context.createInlineRoot();
    },
    createLine : function(){
      if(this.curMeasure === 0){
	return this._createEmptyLine();
      }
      // if overflow measure without line-break, try to justify.
      if(this.isOverWithoutLineBreak()){
	this.justify(this.lastToken);
      }
      return this._createTextLine();
    },
    justify : function(last_token){
      var head_token = last_token;
      var tail_token = this.stream.findTextPrev();
      var backup_pos = this.stream.getPos();
      
      // head text of next line meets head-NG.
      if(head_token && Token.isChar(head_token) && head_token.isHeadNg()){
	this.lineTokens = this._justifyHead(head_token);
	if(this.stream.getPos() != backup_pos){ // some text is moved by head-NG.
	  tail_token = this.stream.findTextPrev(); // search tail_token from new stream position pointing to new head pos.
	  // if new head is single br, this must be included in current line, so skip it.
	  this.stream.skipIf(function(token){
	    return token && Token.isTag(token) && token.getName() === "br";
	  });
	}
      }
      // tail text of this line meets tail-NG.
      if(tail_token && Token.isChar(tail_token) && tail_token.isTailNg()){
	this.lineTokens = this._justifyTail(tail_token);
      }
    },
    _addAdvance : function(advance){
      this.curMeasure += advance;
    },
    _setMaxExtent : function(extent){
      this.maxExtent = extent;
    },
    _setMaxFontSize : function(max_font_size){
      this.maxFontSize = max_font_size;
    },
    _setKerning : function(token){
      this.prevText = this.lastText;
      this.lastText = token;
      if(Token.isChar(token)){
	if(token.isKakkoStart()){
	  this._setKerningStart(token, this.prevText);
	} else if(token.isKakkoEnd() || token.isKutenTouten()){
	  var next_text = this.stream.findTextNext(token.pos);
	  this._setKerningEnd(token, next_text);
	}
      }
    },
    _setKerningStart : function(cur_char, prev_text){
      var space_rate = this._getTextSpaceStart(cur_char, prev_text);
      if(space_rate > 0){
	cur_char.spaceRateStart = space_rate;
      }
    },
    _setKerningEnd : function(cur_char, next_text){
      var space_rate = this._getTextSpaceEnd(cur_char, next_text);
      if(space_rate > 0){
	cur_char.spaceRateEnd = space_rate;
      }
    },
    _getTextSpaceStart : function(cur_char, prev_text){
      if(prev_text === null){
	return 0.5;
      }
      if(Token.isChar(prev_text) && prev_text.isKakkoStart()){
	return 0;
      }
      return 0.5;
    },
    _getTextSpaceEnd : function(cur_char, next_text){
      if(next_text === null){
	return 0.5;
      }
      if(Token.isChar(next_text) && (next_text.isKakkoEnd() || next_text.isKutenTouten())){
	return 0;
      }
      return 0.5;
    },
    _pushElement : function(element){
      if(element.forward){
	this.startTokens.push(element);
      } else if(element.backward){
	this.endTokens.push(element);
      } else {
	this.lineTokens.push(element);
      }
    },
    _getLineTokens : function(){
      return this.startTokens.concat(this.lineTokens).concat(this.endTokens);
    },
    _addRuby : function(element){
      this._pushElement(element);
    },
    _addTag : function(element){
      this._pushElement(element);
    },
    _addInlineBlock : function(element){
      this._pushElement(element);
    },
    _addTextLine : function(element){
      this._pushElement(element);
      this.charCount += element.getCharCount();
    },
    _addText : function(element){
      // text element
      this._pushElement(element);

      // count up char count of line
      this.charCount += element.getCharCount();
    },
    // fix line that is started with wrong text.
    _justifyHead : function(head_token){
      var count = 0;
      this.stream.iterWhile(head_token.pos, function(pos, token){
	if(Token.isChar(token) && token.isHeadNg()){
	  count++;
	  return true; // continue
	}
	return false;
      });
      // no head NG, just return texts as they are.
      if(count <= 0){
	return this.lineTokens;
      }
      // if one head NG, push it into current line.
      if(count === 1){
	this._pushElement(head_token);
	this.stream.setPos(head_token.pos + 1);
	return this.lineTokens;
      }
      // if more than two head NG, find non NG text from tail, and cut the line at the pos.
      var normal_pos = -1;
      this.stream.revIterWhile(head_token.pos, function(pos, token){
	if(pos <= this.lineStartPos){
	  return false; // break (error)
	}
	if(Token.isChar(token) && !token.isHeadNg()){
	  normal_pos = pos; // non head NG text is found
	  return false; // break (success)
	}
	return true; // continue
      });
      // if no proper pos is found in current line, give up justifying.
      if(normal_pos < 0){
	return this.lineTokens;
      }
      // if normal pos is found, pop line until that pos.
      var ptr = head_token.pos;
      while(ptr > normal_pos){
	this.lineTokens.pop();
	ptr--;
      }
      // set stream position at the normal pos.
      this.stream.setPos(normal_pos);
      return this.lineTokens;
    },
    // fix line that is ended with wrong text.
    _justifyTail : function(tail_token){
      var count = 0;
      this.stream.revIterWhile(tail_token.pos, function(pos, token){
	if(Token.isChar(token) && token.isTailNg()){
	  count++;
	  return true;
	}
	return false;
      });
      // no tail NG, just return texts as they are.
      if(count <= 0){
	return this.lineTokens;
      }
      // if one tail NG, pop it(tail token is displayed in next line).
      if(count === 1){
	this.lineTokens.pop();
	this.stream.setPos(tail_token.pos);
	return this.lineTokens;
      }
      // if more than two tail NG, find non NG text from tail, and cut the line at the pos.
      var normal_pos = -1;
      this.stream.revIterWhile(tail_token.pos, function(pos, token){
	if(pos <= this.lineStartPos){
	  return false; // break (error)
	}
	if(Token.isChar(token) && !token.isTailNg()){
	  normal_pos = pos; // non tail NG text is found.
	  return false; // break (success)
	}
	return true; // continue
      });
      // if no proper pos is found in current line, give up justifying.
      if(normal_pos < 0){
	return this.lineTokens;
      }
      // if normal pos is found, pop line until that pos.
      var ptr = tail_token.pos;
      while(ptr > normal_pos){
	this.lineTokens.pop();
	ptr--;
      }
      // set stream postion at the 'next' of normal pos.
      this.stream.setPos(normal_pos + 1);
      return this.lineTokens;
    },
    _createEmptyLine : function(){
      this.line.size = this.line.flow.getBoxSize(this.lineMeasure, this.maxFontSize);
      this.line.setInlineElements([], this.lineMeasure);
      return this.line;
    },
    _createTextLine : function(){
      var ruby_extent = Math.floor(this.maxFontSize * (this.line.lineRate - 1));
      var max_text_extent = this.maxFontSize + ruby_extent;
      this.maxExtent = Math.max(this.maxExtent, max_text_extent);
      this.line.size = this.line.flow.getBoxSize(this.lineMeasure, this.maxExtent);
      this.line.charCount = this.charCount;
      this.line.setInlineElements(this._getLineTokens(), this.curMeasure);
      this.line.textIndent = this.textIndent;
      return this.line;
    }
  };

  return InlineTreeContext;
})();


// TODO: although it is quite rare situation, ruby disappears when
// 1. line overflow by tail ruby and
// 2. it is placed at the head of next line but
// 3. parent page can't contain the line because of block level overflow.
// then after rollback and 2nd-yielding by parent generator,
// ruby disappears because stream already steps to the next pos of ruby.
var InlineTreeGenerator = ElementGenerator.extend({
  init : function(markup, stream, context){
    this.markup = markup;
    this.stream = stream;
    this.context = context;
    this._terminate = false;
    this.lineNo = 0;
  },
  hasNext : function(){
    if(this._terminate){
      return false;
    }
    if(this.generator && this.generator.hasNext()){
      return true;
    }
    return this.stream.hasNext();
  },
  backup : function(){
    this.stream.backup();
  },
  // caution! : this rollback function is to be ALWAYS called from parent generator.
  // so do not call this from this generator.
  rollback : function(){
    this.stream.rollback();
    this.generator = null;
  },
  _getLineSize : function(parent){
    var measure = parent.getContentMeasure();
    var extent = parent.getContentExtent();
    return parent.flow.getBoxSize(measure, extent);
  },
  _setFirstLineStyle : function(line, parent){
    var css_attr = this.markup? this.markup.getPseudoElementCssAttr("first-line") : {};
    if(!Obj.isEmpty(css_attr)){
      var first_line_tag = new Tag("<first-line>");
      first_line_tag.setCssAttrs(css_attr);
      BoxStyle.set(first_line_tag, line, parent);
    }
  },
  _createLine  : function(parent){
    var size = this._getLineSize(parent);
    var line = Layout.createTextLine(size, parent);
    if(this.lineNo === 0){
      this._setFirstLineStyle(line, parent);
    }
    line.markup = this.markup;
    line.lineNo = this.lineNo;
    return line;
  },
  yield : function(parent){
    var line = this._createLine(parent);
    return this._yield(line);
  },
  _yield : function(line){
    var ctx = new InlineTreeContext(line, this.stream, this.context);

    this.backup();

    while(true){
      var element = this._yieldElement(ctx);
      if(element == Exceptions.BUFFER_END){
	ctx.setLineBreak();
	break;
      } else if(element == Exceptions.SKIP){
	return Exceptions.IGNORE;
      } else if(element == Exceptions.LINE_BREAK){
	ctx.setLineBreak();
	break;
      } else if(element == Exceptions.RETRY){
	ctx.setLineBreak();
	break;
      } else if(element == Exceptions.IGNORE){
	continue;
      } else if(element == Exceptions.BREAK){
	ctx.setLineBreak();
	break;
      }

      try {
	ctx.addElement(element);
      } catch(e){
	break;
      }

      // if devided word, line break and parse same token again.
      if(element instanceof Word && element.isDevided()){
	ctx.pushBackToken();
	break;
      }
    } // while(true)

    line = ctx.createLine();
    if(!this.hasNext()){
      this._onLastTree(ctx, line);
    }
    this._onCompleteTree(ctx, line);
    return line;
  },
  _onLastTree : function(ctx, line){
  },
  _onCompleteTree : function(ctx, line){
    line.setMaxExtent(ctx.getMaxExtent());
    line.setMaxFontSize(ctx.getMaxFontSize());
    this.lineNo++;
  },
  _yieldElement : function(ctx){
    if(this.generator && this.generator.hasNext()){
      return this.generator.yield(ctx.line);
    }
    this.generator = null;
    var token = ctx.getNextToken();
    return this._yieldToken(ctx, token);
  },
  _yieldToken : function(ctx, token){
    if(token === null){
      return Exceptions.BUFFER_END;
    }
    if(token instanceof Ruby){
      return token;
    }
    // CRLF
    if(Token.isChar(token) && token.isNewLineChar()){

      // if pre, treat CRLF as line break
      if(ctx.isPreLine()){
	return Exceptions.LINE_BREAK;
      }
      // others, just ignore
      return Exceptions.IGNORE;
    }
    if(Token.isText(token)){
      return this._yieldText(ctx, token);
    }
    if(Token.isTag(token) && token.getName() === "br"){
      return Exceptions.LINE_BREAK;
    }
    if(Token.isTag(token) && token.getName() === "first-letter"){
      token.setFirstLetter(); // load first-letter style
    }
    // if block element, break line and force terminate generator
    if(token.isBlock()){
      ctx.pushBackToken(); // push back this token(this block is handled by parent generator).
      this._terminate = true; // force terminate
      return Exceptions.LINE_BREAK;
    }
    // token is static size tag
    if(token.hasStaticSize()){
      return this._yieldStaticElement(ctx.line, token);
    }
    // token is inline-block tag
    if(token.isInlineBlock()){
      this.generator = new InlineBlockGenerator(token, ctx.createInlineRoot());
      return this.generator.yield(ctx.line);
    }
    // token is other inline tag
    return this._yieldInlineTag(ctx, token);
  },
  _yieldText : function(ctx, text){
    if(!text.hasMetrics()){
      text.setMetrics(ctx.getLineFlow(), ctx.getFontSize(), ctx.isTextBold());
    }
    switch(text._type){
    case "char":
    case "tcy":
      return text;
    case "word":
      return this._yieldWord(ctx, text);
    }
  },
  _yieldWord : function(ctx, word){
    var advance = word.getAdvance(ctx.getLineFlow(), ctx.getLetterSpacing());

    // if advance of this word is less than ctx.maxMeasure, just return.
    if(advance <= ctx.maxMeasure){
      word.setDevided(false);
      return word;
    }
    // if advance is lager than max_measure,
    // we must cut this word into some parts.
    var font_size = ctx.getFontSize();
    var max_measure = ctx.maxMeasure;
    var is_bold = ctx.isTextBold();
    var flow = ctx.getLineFlow();
    var part = word.cutMeasure(font_size, max_measure); // get sliced word
    part.setMetrics(flow, font_size, is_bold); // metrics for first half
    word.setMetrics(flow, font_size, is_bold); // metrics for second half
    return part;
  },
  _yieldInlineTag : function(ctx, tag){
    if(tag.isSingleTag()){
      return tag;
    }
    switch(tag.getName()){
    case "script":
      ctx.addScript(tag);
      return Exceptions.IGNORE;
    case "style":
      ctx.addStyle(tag);
      return Exceptions.IGNORE;
    default:
      this.generator = this._createChildInlineTreeGenerator(ctx, tag);
      return this.generator.yield(ctx.line);
    }
  },
  _createChildInlineTreeGenerator : function(ctx, tag){
    switch(tag.getName()){
    case "ruby":
      return new RubyGenerator(tag, this.context);
    case "a":
      return new LinkGenerator(tag, this.context);
    default:
      return new ChildInlineTreeGenerator(tag, this.context);
    }
  }
});


var ChildInlineTreeGenerator = InlineTreeGenerator.extend({
  init : function(markup, context){
    this.markup = markup;
    this.context = context;
    this.context.pushInlineTag(this.markup);
    this.stream = this._createStream();
    this.lineNo = 0;
  },
  _createStream : function(){
    return new TokenStream(this.markup.getContent());
  },
  _createLine : function(parent){
    var line = this._super(parent);
    this._setBoxStyle(line, parent);
    return line;
  },
  _getLineSize : function(parent){
    var measure = parent.getTextRestMeasure();
    var extent = parent.getContentExtent();
    return parent.flow.getBoxSize(measure, extent);
  },
  _onLastTree : function(){
    this.context.popInlineTag();
  },
  _onCompleteTree : function(ctx, line){
    line.shortenMeasure();
    this.lineNo++;
  }
});


var RubyGenerator = ChildInlineTreeGenerator.extend({
  _createStream : function(){
    return new RubyTagStream(this.markup.getContent());
  },
  _yieldElement : function(ctx){
    var ruby = this._super(ctx);
    if(typeof ruby === "number"){
      return ruby; // exception
    }
    // avoid overwriting metrics.
    if(!ruby.hasMetrics()){
      ruby.setMetrics(ctx.getLineFlow(), ctx.getFontSize(), ctx.getLetterSpacing());
    }
    return ruby;
  }
});


var RtGenerator = ChildInlineTreeGenerator.extend({
  _getLineSize : function(parent){
    var measure = parent.getContentMeasure();
    var extent = parent.getContentExtent();
    return parent.flow.getBoxSize(measure, extent);
  }
});


var LinkGenerator = ChildInlineTreeGenerator.extend({
  init : function(markup, context){
    this._super(markup, context);
    var anchor_name = markup.getTagAttr("name");
    if(anchor_name){
      context.setAnchor(anchor_name);
    }
  }
});

var BlockTreeContext = (function(){
  function BlockTreeContext(page, stream, context){
    this.page = page;
    this.stream = stream;
    this.context = context;
    this.curExtent = 0;
    this.maxExtent = page.getContentExtent();
    this.flow = page.flow;
  }

  BlockTreeContext.prototype = {
    addElement : function(element){
      var extent = element.getBoxExtent(this.flow);
      if(element instanceof Box && !element.isTextLine() && extent <= 0){
	throw "EmptyBlock";
      }
      if(this.curExtent + extent > this.maxExtent){
	throw "OverflowBlock";
      }
      this.page.addChildBlock(element);
      this.curExtent += extent;
      if(this.curExtent === this.maxExtent){
	throw "FinishBlock";
      }
    },
    pushBackToken : function(){
      this.stream.prev();
    },
    getNextToken : function(){
      var token = this.stream.get();
      if(token && Token.isTag(token)){
	this.context.inheritTag(token);
      }
      return token;
    }
  };
  
  return BlockTreeContext;
})();


var BlockTreeGenerator = ElementGenerator.extend({
  init : function(markup, context){
    this._super(markup, context);
    this.context.pushBlockTag(this.markup);
    this.generator = null;
    this.stream = this._createStream();
    this.localPageNo = 0;
  },
  hasNext : function(){
    if(this.generator && this.generator.hasNext()){
      return true;
    }
    return this.stream.hasNext();
  },
  backup : function(){
    this.getStreamSrc().backup();
  },
  rollback : function(){
    this.getStreamSrc().rollback();
  },
  getStreamSrc : function(){
    if(this.generator){
      return this.generator;
    }
    return this.stream;
  },
  getCurGenerator : function(){
    if(this.generator && this.generator.hasNext()){
      return this.generator;
    }
    return null;
  },
  // if size is not defined, rest size of parent is used.
  // if parent is null, root page is generated.
  yield : function(parent, size){
    var page_box, page_size;
    page_size = size || this._getBoxSize(parent);
    page_box = this._createBox(page_size, parent);
    var ret = this._yieldPageTo(page_box);
    return ret;
  },
  _getBoxSize : function(parent){
    return this._getMarkupStaticSize() || parent.getRestSize();
  },
  // fill page with child page elements.
  _yieldPageTo : function(page){
    var ctx = new BlockTreeContext(page, this.stream, this.context);

    while(true){
      this.backup();
      var element = this._yieldPageElement(ctx, page);
      if(element == Exceptions.PAGE_BREAK){
	break;
      } else if(element == Exceptions.BUFFER_END){
	break;
      } else if(element == Exceptions.SKIP){
	break;
      } else if(element == Exceptions.RETRY){
	this.rollback();
	break;
      } else if(element == Exceptions.BREAK){
	break;
      } else if(element == Exceptions.IGNORE){
	continue;
      }

      try {
	ctx.addElement(element);
      } catch(e){
	if(e === "OverflowBlock" || e === "EmptyBlock"){
	  this.rollback();
	}
	break;
      }
    }
    if(this.localPageNo > 0){
      page.clearBorderBefore();
    } else {
    }
    if(!this.hasNext()){
      this._onLastTree(page);
    } else {
      page.clearBorderAfter();
    }
    this._onCompleteTree(page);

    // if content is not empty, increment localPageNo.
    if(page.getBoxExtent() > 0){
      this.localPageNo++;
    }
    return page;
  },
  _isEmptyElement : function(flow, element){
    return (element instanceof Box) && !element.isTextLine() && (element.getContentExtent(flow) <= 0);
  },
  _createStream : function(){
    var source = this._createSource(this.markup.getContent());
    return new TokenStream(source);
  },
  // caution:
  // this is not first preprocess.
  // first conversion is in PageStream::_createSource, which discards comment, invalid tags .. etc.
  // so this time we convert other things according to this generator locally.
  _createSource : function(text){
    return text
      .replace(/^[ \n]+/, "") // shorten head space
      .replace(/\s+$/, "") // discard tail space
      .replace(/\r/g, ""); // discard CR
  },
  _onLastTree : function(page){
    this.context.popBlockTag();
  },
  // called when page box is fully filled by blocks.
  _onCompleteTree : function(page){
  },
  _yieldPageElement : function(ctx, parent){
    if(this.generator && this.generator.hasNext()){
      return this.generator.yield(parent);
    }
    //var token = this.stream.get();
    var token = ctx.getNextToken();
    if(token === null){
      return Exceptions.BUFFER_END;
    }
    // in block level, new-line character makes no sense, just ignored.
    if(Token.isChar(token) && token.isNewLineChar()){
      return Exceptions.IGNORE;
    }
    if(Token.isTag(token) && token.isPageBreakTag()){
      return Exceptions.PAGE_BREAK;
    }
    if(Token.isTag(token) && token.getName() === "first-letter"){
      token.setFirstLetter(); // load first-letter style
    }
    if(Token.isInline(token)){
      // this is not block level element, so we push back this token,
      // and delegate this stream to InlineTreeGenerator from the head of this inline element.
      ctx.pushBackToken();
      this.generator = new InlineTreeGenerator(this.markup, this.stream, this.context);
      return this.generator.yield(parent);
    }
    return this._yieldBlockElement(parent, token);
  },
  _yieldBlockElement : function(parent, tag){
    if(tag.hasStaticSize()){
      return this._yieldStaticTag(parent, tag);
    }

    // if different flow is defined in this block tag,
    // yield it as single inline page with rest size of current parent.
    if(tag.hasFlow() && tag.getCssAttr("flow") != parent.getFlowName()){
      var inline_size = parent.getRestSize();
      var generator = new InlinePageGenerator(tag, this.context.createInlineRoot());
      return generator.yield(parent, inline_size);
    }
    this.generator = this._createChildBlockTreeGenerator(parent, tag);
    return this.generator.yield(parent);
  },
  _yieldStaticTag : function(parent, tag){
    var box = this._yieldStaticElement(parent, tag);
    if(!(box instanceof Box)){
      return box; // exception
    }

    // pushed box is treated as a single block element.
    if(tag.isPush()){
      return box;
    }

    // floated box is treated as a single block element(with rest spaces filled by other elements).
    if(box instanceof Box && box.logicalFloat){
      return this._yieldFloatedBlock(parent, box, tag);
    }

    return box; // return as single block.
  },
  _yieldFloatedBlock : function(parent, aligned_box, tag){
    var generator = new FloatedBlockTreeGenerator(this.stream, this.context, aligned_box);
    var block = generator.yield(parent);
    this.generator = generator.getCurGenerator(); // inherit generator of aligned area
    return block;
  },
  _createChildBlockTreeGenerator : function(parent, tag){
    switch(tag.getName()){
    case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
      return this._getHeaderLineGenerator(parent, tag);
    case "section": case "article": case "nav": case "aside":
      return this._getSectionContentGenerator(parent, tag);
    case "details": case "blockquote": case "figure": case "fieldset":
      return this._getSectionRootGenerator(parent, tag);
    case "table":
      return this._getTableGenerator(parent, tag);
    case "tbody": case "thead": case "tfoot":
      return this._getTableRowGroupGenerator(parent, tag);
    case "tr":
      return this._getTableRowGenerator(parent, tag);
    case "dl":
      return this._getDefListGenerator(parent, tag);
    case "ul": case "ol":
      return this._getListGenerator(parent, tag);
    case "li":
      return this._getListItemGenerator(parent, tag);
    case "hr":
      return this._getHrGenerator(parent, tag);
    default:
      return new ChildBlockTreeGenerator(tag, this.context);
    }
  },
  _getSectionContentGenerator : function(parent, tag){
    return new SectionContentGenerator(tag, this.context);
  },
  _getSectionRootGenerator : function(parent, tag){
    return new SectionRootGenerator(tag, this.context);
  },
  _getHrGenerator : function(parent, tag){
    return new HrGenerator(tag, this.context);
  },
  _getHeaderLineGenerator : function(parent, tag){
    return new HeaderGenerator(tag, this.context);
  },
  _getListGenerator : function(parent, tag){
    return new ListGenerator(tag, this.context);
  },
  _getListItemGenerator : function(parent, tag){
    var list_style = parent.listStyle || null;
    if(list_style === null){
      return new ChildBlockTreeGenerator(tag, this.context);
    }
    if(list_style.isInside()){
      return new InsideListItemGenerator(tag, parent, this.context);
    }
    return new OutsideListItemGenerator(tag, parent, this.context);
  },
  _getDefListGenerator : function(parent, tag){
    return new DefListGenerator(tag, this.context);
  },
  _getTableGenerator : function(parent, tag){
    return new TableGenerator(tag, this.context);
  },
  _getTableRowGroupGenerator : function(parent, tag){
    return new TableRowGroupGenerator(tag, this.context);
  },
  _getTableRowGenerator : function(parent, tag){
    return new TableRowGenerator(tag, parent, this.context.createInlineRoot());
  }
});

var InlineBlockGenerator = BlockTreeGenerator.extend({
  _getBoxType : function(){
    return "inline-block";
  }
});

var ChildBlockTreeGenerator = BlockTreeGenerator.extend({
  // resize page to sum of total child size.
  _onCompleteTree : function(page){
    page.shortenExtent(page.getParentFlow());
  }
});

var SectionContentGenerator = ChildBlockTreeGenerator.extend({
  init : function(markup, context){
    this._super(markup, context);
    this.context.logStartSection(markup);
  },
  _onLastTree : function(page){
    this.context.logEndSection(this.markup);
  }
});

var SectionRootGenerator = ChildBlockTreeGenerator.extend({
  init : function(markup, context){
    this._super(markup, context);
    this.context.startSectionRoot(markup);
  },
  hasOutline : function(root_name){
    var buffer = this.getOutlineBuffer(root_name);
    return buffer.isEmpty() === false;
  },
  getOutlineBuffer : function(root_name){
    var name = root_name || this.markup.getName();
    return this.context.getOutlineBuffer(name);
  },
  getOutlineTree : function(root_name){
    var buffer = this.getOutlineBuffer(root_name);
    var tree = (new OutlineParser(buffer)).getTree();
    return tree;
  },
  getAnchors : function(){
    return this.context.getAnchors();
  },
  getAnchorPageNo : function(name){
    return this.context.getAnchorPageNo(name);
  },
  setAnchor : function(name, page_no){
    this.context.setAnchor(name, page_no);
  },
  _onLastTree : function(page){
    this.context.endSectionRoot(this.markup);
    this._super();
  }
});

var HeaderGenerator = ChildBlockTreeGenerator.extend({
  _onCompleteTree : function(page){
    this._super(page);
    page.id = Css.addNehanHeaderPrefix(this.context.logSectionHeader(this.markup));
  },
  _onCreateBox : function(box, parent){
    box.addClass("nehan-header");
  }
});

var BodyBlockTreeGenerator = SectionRootGenerator.extend({
  init : function(data, ctx){
    var context = ctx || new DocumentContext();
    var markup = data;
    if(typeof data === "string"){
      markup = new Tag("<body>", data);
    }
    this._super(markup, context);
  },
  _getBoxSize : function(){
    return Layout.getStdPageSize();
  },
  _createBox : function(size, parent){
    var box = Layout.createRootBox(size, "body");
    this._setBoxStyle(box, null);
    box.percent = this.stream.getSeekPercent();
    box.seekPos = this.stream.getSeekPos();
    box.pageNo = this.context.getPageNo();
    box.charPos = this.context.getCharPos();

    // caution:
    // box.lazy is a flag to see whether this box can be evaluated later.
    // when lazy is enabled, we can evaluate the box at any time, it always yields same html.
    // but this lazy flag at this time is not confirmed, it's temporary.
    // this flag is confirmed when _onCompleteTree.
    // if context is 'also' empty when page is completed, lazy flag is confirmed.
    box.lazy = this.context.isEmptyMarkupContext();
    box.css["font-size"] = Layout.fontSize + "px";
    return box;
  },
  _onCompleteTree : function(page){
    // lazy is confirmed when
    // 1. inline level of context is empty when _createBox.
    // 2. inline level of context is 'also' empty when _onCompleteTree.
    // in short, if both head and tail are context free, lazy evaluation is enabled.
    page.lazy = page.lazy && this.context.isEmptyMarkupContext();

    // step page no and character count inside this page
    this.context.stepPageNo();
    this.context.addCharPos(page.getCharCount());
  }
});

var FloatedBlockTreeGenerator = BlockTreeGenerator.extend({
  init : function(stream, context, floated_box){
    this.context = context;
    this.stream = stream;
    this.floatedBox = floated_box;
  },
  _onLastTree : function(){
    // do nothing
  },
  yield: function(parent){
    var backupPos2 = this.stream.backupPos; // backup the 'backup pos'
    var wrap_box = this._getFloatedWrapBox(parent, this.floatedBox);
    var rest_box = this._getFloatedRestBox(parent, wrap_box, this.floatedBox);
    this._yieldPageTo(rest_box);
    if(this.floatedBox.logicalFloat === "start"){
      wrap_box.addChildBlock(this.floatedBox);
      wrap_box.addChildBlock(rest_box);
    } else {
      wrap_box.addChildBlock(rest_box);
      wrap_box.addChildBlock(this.floatedBox);
    }
    this.stream.backupPos = backupPos2; // restore backup pos
    return wrap_box;
  },
  _getFloatedRestBox : function(parent, wrap_box, floated_box){
    var rest_measure = parent.getContentMeasure() - floated_box.getBoxMeasure(parent.flow);
    var rest_extent = floated_box.getBoxExtent(parent.flow);
    var rest_size = parent.flow.getBoxSize(rest_measure, rest_extent);
    var rest_box = Layout.createBox(rest_size, wrap_box, "box");
    rest_box.setFlow(parent.flow);
    return rest_box;
  },
  _getFloatedWrapBox : function(parent, floated_box){
    var wrap_measure = parent.getContentMeasure();
    var wrap_extent = floated_box.getBoxExtent(parent.flow);
    var wrap_box_size = parent.flow.getBoxSize(wrap_measure, wrap_extent);
    var wrap_box = Layout.createBox(wrap_box_size, parent, "box");
    var wrap_flow = parent.getFloatedWrapFlow();
    wrap_box.setParent(parent, false);
    wrap_box.setFlow(wrap_flow);
    floated_box.setParent(wrap_box, true);
    return wrap_box;
  }
});

// InlinePageGenerator yield the first page only,
// because size of first page can be defined, but continuous pages are not.
var InlinePageGenerator = BlockTreeGenerator.extend({
  hasNext : function(){
    return false;
  },
  yield : function(parent){
    var size = this._getBoxSize(parent);
    var wrap = Layout.createBox(size, parent, "div");
    var page = this._super(wrap); // yield page to wrap.
    if(typeof page === "number"){
      return page; // exception
    }
    wrap.addChildBlock(page);
    wrap.logicalFloat = page.logicalFloat;
    return wrap;
  }
});

var ParallelGenerator = ChildBlockTreeGenerator.extend({
  init : function(generators, markup, context, partition){
    this.generators = generators;
    this.markup = markup;
    this.context = context;
    this.partition = partition;
  },
  hasNext : function(){
    return List.exists(this.generators, function(generator){
      return generator.hasNext();
    });
  },
  backup : function(){
    List.iter(this.generators, function(generator){
      generator.backup();
    });
  },
  rollback : function(){
    List.iter(this.generators, function(generator){
      generator.rollback();
    });
  },
  yield : function(parent){
    this.backup();
    var wrap_size = parent.getRestSize();
    var wrap_page = this._createBox(wrap_size, parent);
    var wrap_flow = parent.getParallelFlow();
    wrap_page.setFlow(wrap_flow);
    return this._yieldChilds(wrap_page, parent);
  },
  _setBoxEdge : function(box, edge){
    // ignore edge
    // because each edge of child layout are set by child-generators.
  },
  _getChildMeasure : function(index){
    return this.partition.getSize(index);
  },
  _getChildExtent : function(parent){
    return parent.getRestContentExtent();
  },
  _yieldChilds : function(wrap_page, parent){
    var self = this, valid = false;
    var child_flow = parent.flow;
    var is_valid = function(page){
      return page && page.getContentExtent;
    };
    var child_pages = List.mapi(this.generators, function(index, generator){
      var child_measure = self._getChildMeasure(index);
      var child_extent = self._getChildExtent(parent);
      var child_size = child_flow.getBoxSize(child_measure, child_extent);
      return generator.yield(wrap_page, child_size);
    });

    if(!List.exists(child_pages, is_valid)){
      return Exceptions.RETRY;
    }
      
    var max_child = List.maxobj(child_pages, function(child_page){
      if(child_page && child_page.getContentExtent){
	return child_page.getContentExtent();
      }
      return 0;
    });
    var max_content_extent = max_child.getContentExtent();
    var max_box_extent = max_child.getBoxExtent();

    wrap_page.setContentExtent(parent.flow, max_box_extent);
    
    // resize each child by uniform extent size.
    List.iter(child_pages, function(child_page){
      if(child_page){
	child_page.setContentExtent(child_flow, max_content_extent);
	wrap_page.addChildBlock(child_page);
      }
    });
    return wrap_page;
  }
});

var ParaChildGenerator = ChildBlockTreeGenerator.extend({
  _onReadyBox : function(box, parent){
    // wrap box(parent) has parallel flow, so flip it to get original one.
    var flow = parent.getParallelFlipFlow();
    box.setFlow(flow);
  }
});

var TableGenerator = ChildBlockTreeGenerator.extend({
  _createStream : function(){
    return new TableTagStream(this.markup);
  },
  _onReadyBox : function(box, parent){
    if(this.markup.getCssAttr("border-collapse") === "collapse"){
      if(typeof this.collapse == "undefined"){
	Collapse.set(this.markup, box);
	this.collapse = true; // set collapse flag(means collapse already calcurated).
      }
    }
  },
  _onCreateBox : function(box, parent){
    box.partition = this.stream.getPartition(box);
  }
});

var TableRowGroupGenerator = ChildBlockTreeGenerator.extend({
  _onCreateBox : function(box, parent){
    box.partition = parent.partition;
  },
  _createStream : function(){
    return new DirectTokenStream(this.markup.tableChilds);
  }
});

var TableRowGenerator = ParallelGenerator.extend({
  init : function(markup, parent, context){
    var partition = parent.partition.getPartition(markup.tableChilds.length);
    var generators = List.map(markup.tableChilds, function(td){
      return new ParaChildGenerator(td, context.createInlineRoot());
    });
    this._super(generators, markup, context, partition);
  }
});

var ListGenerator = ChildBlockTreeGenerator.extend({
  _onCreateBox : function(box, parent){
    var item_count = this.stream.getTokenCount();
    var list_style_type = this.markup.getCssAttr("list-style-type", "none");
    var list_style_pos = this.markup.getCssAttr("list-style-position", "outside");
    var list_style_image = this.markup.getCssAttr("list-style-image", "none");
    var list_style_format = this.markup.getCssAttr("list-style-format");
    var list_style = new ListStyle({
      type:list_style_type,
      position:list_style_pos,
      image:list_style_image,
      format:list_style_format
    });
    var marker_advance = list_style.getMarkerAdvance(parent.flow, parent.fontSize, item_count);
    box.listStyle = list_style;
    box.partition = new Partition([marker_advance, box.getContentMeasure() - marker_advance]);
  },
  _createStream : function(){
    return new ListTagStream(this.markup.getContent());
  }
});

var InsideListItemGenerator = ChildBlockTreeGenerator.extend({
  init : function(markup, parent, context){
    var marker = parent.listStyle.getMarkerHtml(markup.order + 1);
    var marker_html = Html.tagWrap("span", marker, {
      "class":"nehan-li-marker"
    });
    markup.content = marker_html + Const.space + markup.getContent();
    this._super(markup, context);
  }
});

var OutsideListItemGenerator = ParallelGenerator.extend({
  init : function(markup, parent, context){
    var marker = parent.listStyle.getMarkerHtml(markup.order + 1);
    var markup_marker = new Tag("<li-marker>", marker);
    var markup_body = new Tag("<li-body>", markup.getContent());
    this._super([
      new ParaChildGenerator(markup_marker, context),
      new ParaChildGenerator(markup_body, context)
    ], markup, context, parent.partition);
  }
});

var DefListGenerator = ChildBlockTreeGenerator.extend({
  _createStream : function(){
    return new DefListTagStream(this.markup.getContent());
  }
});

var EvalResult = (function(){
  function EvalResult(opts){
    Args.merge(this, {
      html:"",
      groupLength:1,
      seekPos:0,
      pageNo:0,
      charPos:0,
      charCount:0,
      percent:0
    }, opts);
  }

  EvalResult.prototype = {
    isGroup : function(){
      return this.groupLength > 1;
    },
    getPercent : function(){
      return this.percent;
    },
    getPageNo : function(){
      return this.pageNo;
    },
    getGroupCount : function(){
      return this.groupLength;
    },
    getPageCount : function(){
      if(this.isGroup() && this.html instanceof Array){
	return this.html.length;
      }
      return 1;
    },
    getHtml : function(pos){
      if(this.isGroup()){
	return this.html[pos] || "";
      }
      return this.html;
    }
  };

  return EvalResult;
})();

var PageEvaluator = (function(){
  function PageEvaluator(){
    this.blockEvaluator = new BlockTreeEvaluator();
  }

  PageEvaluator.prototype = {
    evaluate : function(box){
      return new EvalResult({
	html:this.blockEvaluator.evaluate(box),
	percent:box.percent,
	seekPos:box.seekPos,
	pageNo:box.pageNo,
	charPos:box.charPos,
	charCount:box.charCount
      });
    }
  };

  return PageEvaluator;
})();


var BlockTreeEvaluator = (function(){
  function BlockTreeEvaluator(){
    this.inlineEvaluatorH = new HoriInlineTreeEvaluator(this);
    this.inlineEvaluatorV = new VertInlineTreeEvaluator(this);
  }

  BlockTreeEvaluator.prototype = {
    evaluate : function(box){
      switch(box._type){
      case "br":
	return this.evalBreak(box);
      case "hr":
	return this.evalHr(box);
      case "ibox":
	return this.evalInlineBox(box);
      case "ipage":
	return this.evalInlinePage(box);
      case "img":
	return this.evalImage(box);
      case "table":
	return this.evalTable(box);
      case "text-line":
	return this.evalTextLine(box);
      default:
	return this.evalBox(box);
      }
    },
    evalBox : function(box){
      var attr = {
	"style":Css.toString(box.getCssBlock()),
	"class":box.getCssClasses()
      };
      if(box.id){
	attr.id = box.id;
      }
      return Html.tagWrap("div", this.evalBoxChilds(box.getChilds()), attr);
    },
    evalBoxChilds : function(childs){
      var self = this;
      return List.fold(childs, "", function(ret, box){
	return [ret, self.evaluate(box)].join("\n");
      });
    },
    evalTextLine : function(box){
      if(box.isTextVertical()){
	return this.inlineEvaluatorV.evaluate(box);
      }
      return this.inlineEvaluatorH.evaluate(box);
    },
    evalInlineBox : function(box){
      return Html.tagWrap("div", box.content, {
	"style":Css.toString(box.getCssBlock()),
	"class":box.getCssClasses()
      });
    },
    evalHr : function(box){
      return this.evalInlineBox(box);
    },
    evalBreak : function(box){
      return this.evalInlineBox(box);
    },
    evalImage : function(box){
      var content = this.evalImageContent(box);
      return Html.tagWrap("div", content, {
	"style":Css.toString(box.getCssBlock()),
	"class":box.getCssClasses()
      });
    },
    evalImageContent : function(box){
      return Html.tagSingle("img", {
	"src": box.src,
	"width": box.getContentWidth(),
	"height": box.getContentHeight()
      });
    },
    evalInlinePage : function(box){
      return this.evalBox(box);
    },
    evalTable : function(box){
      return this.evalBox(box);
    }
  };

  return BlockTreeEvaluator;
})();


var InlineTreeEvaluator = Class.extend({
  init : function(parent_evaluator){
    this.parentEvaluator = parent_evaluator;
  },
  evaluate : function(line){
    throw "InlineTreeEvaluator::evaluate not implemented";
  },
  evalTextLineBody : function(line, tokens){
    var self = this;
    var body = List.fold(tokens, "", function(ret, element){
      return ret + self.evalInlineElement(line, element);
    });
    if(line.isLinkLine()){
      return this.evalLinkLine(line, body);
    }
    return body;
  },
  evalLinkLine : function(line, body){
    var attr = {}, markup = line.markup;
    attr.href = markup.getTagAttr("href", "#");
    var name = markup.getTagAttr("name");
    if(name){
      markup.addClass("nehan-anchor");
      attr.name = name;
    }
    var target = markup.getTagAttr("target");
    if(target){
      attr.target = target;
    }
    if(attr.href.indexOf("#") >= 0){
      markup.addClass("nehan-anchor-link");
    }
    attr["class"] = markup.getCssClasses();
    return Html.tagWrap("a", body, attr);
  },
  evalInlineElement : function(line, element){
    if(element._type === "text-line"){
      return this.evaluate(element);
    }
    if(element instanceof Ruby){
      return this.evalRuby(line, element);
    }
    if(Token.isText(element)){
      return this.evalText(line, element);
    }
    if(element instanceof Box){
      return this.evalInlineBox(line, element);
    }
    return "";
  },
  evalText : function(line, text){
    switch(text._type){
    case "word":
      return this.evalWord(line, text);
    case "tcy":
      var tcy = this.evalTcy(line, text);
      return line.textEmpha? this.evalEmpha(line, text, tcy) : tcy;
    case "char":
      var chr = this.evalChar(line, text);
      return line.textEmpha? this.evalEmpha(line, text, chr) : chr;
    default:
      return "";
    }
  },
  evalInlineBox : function(line, box){
    throw "not implemented: evalInlineBox";
  },
  evalWord : function(line, word){
    throw "not implemented: evalWord";
  },
  evalTcy : function(line, tcy){
    throw "not implemented: evalTcy";
  },
  evalChar : function(line, tcy){
    throw "not implemented: evalChar";
  }
});

var VertInlineTreeEvaluator = InlineTreeEvaluator.extend({
  evaluate : function(line){
    return Html.tagWrap("div", this.evalTextLineBody(line, line.getChilds()), {
      "style":Css.toString(line.getCssInline()),
      "class":line.getCssClasses()
    });
  },
  evalRuby : function(line, ruby){
    var body = this.evalRb(line, ruby) + this.evalRt(line, ruby);
    return Html.tagWrap("div", body, {
      "style":Css.toString(ruby.getCssVertRuby(line)),
      "class":"nehan-ruby-body"
    });
  },
  evalRb : function(line, ruby){
    var body = this.evalTextLineBody(line, ruby.getRbs());
    return Html.tagWrap("div", body, {
      "style":Css.toString(ruby.getCssVertRb(line)),
      "class":"nehan-rb"
    });
  },
  evalRt : function(line, ruby){
    var generator = new RtGenerator(ruby.rt, new DocumentContext());
    var rt_line = generator.yield(line);
    var css = ruby.getCssVertRt(line);
    for(var prop in css){
      rt_line.setCss(prop, css[prop]);
    }
    return this.evaluate(rt_line);
  },
  evalWord : function(line, word){
    if(Env.isTransformEnable){
      return this.evalWordTransform(line, word);
    } else if(Env.isIE){
      return this.evalWordIE(line, word);
    } else {
      return "";
    }
  },
  evalWordTransform : function(line, word){
    var body = Html.tagWrap("div", word.data, {
      "class": "nehan-vert-alpha"
    });
    return Html.tagWrap("div", body, {
      "style": Css.toString(word.getCssVertTrans(line))
    });
  },
  evalWordIE : function(line, word){
    return Html.tagWrap("div", word.data, {
      "class": "nehan-vert-alpha-ie",
      "style": Css.toString(word.getCssVertTransIE(line))
    });
  },
  evalTcy : function(line, tcy){
    return Html.tagWrap("div", tcy.data, {
      "class": "nehan-tcy"
    });
  },
  evalChar : function(line, chr){
    if(chr.isImgChar()){
      if(chr.isVertGlyphEnable()){
	return this.evalVerticalGlyph(line, chr);
      }
      return this.evalImgChar(line, chr);
    } else if(chr.isHalfSpaceChar(chr)){
      return this.evalHalfSpaceChar(line, chr);
    } else if(chr.isCnvChar()){
      return this.evalCnvChar(line, chr);
    } else if(chr.isSmallKana()){
      return this.evalSmallKana(line, chr);
    } else if(chr.isPaddingEnable()){
      return this.evalPaddingChar(line, chr);
    } else if(line.letterSpacing){
      return this.evalCharLetterSpacing(line, chr);
    }
    return chr.data + "<br />";
  },
  evalCharLetterSpacing : function(line, chr){
    return Html.tagWrap("div", chr.data, {
      "style":Css.toString(chr.getCssVertLetterSpacing(line))
    });
  },
  evalEmpha : function(line, chr, char_body){
    char_body = char_body.replace("<br />", "");
    var char_body2 = Html.tagWrap("span", char_body, {
      "class":"nehan-empha-src",
      "style":Css.toString(chr.getCssVertEmphaSrc(line))
    });
    var empha_body = Html.tagWrap("span", line.textEmpha.getText(), {
      "class":"nehan-empha-text",
      "style":Css.toString(chr.getCssVertEmphaText(line))
    });
    // TODO: check text-emphasis-position is over or under
    return Html.tagWrap("div", char_body2 + empha_body, {
      "class":"nehan-empha-wrap",
      "style":Css.toString(line.textEmpha.getCssVertEmphaWrap(line, chr))
    });
  },
  evalPaddingChar : function(line, chr){
    return Html.tagWrap("div", chr.data, {
      style:Css.toString(chr.getCssPadding(line))
    });
  },
  evalImgChar : function(line, chr){
    var font_rgb = line.color.getRgb();
    var palette_color = Palette.getColor(font_rgb).toUpperCase();
    return Html.tagSingle("img", {
      "class":"nehan-img-char",
      src:chr.getImgSrc(palette_color),
      style:Css.toString(chr.getCssVertImgChar(line))
    }) + Const.clearFix;
  },
  evalVerticalGlyph : function(line, chr){
    return Html.tagWrap("div", chr.data, {
      "class":"nehan-vert-rl",
      "style":Css.toString(chr.getCssVertGlyph(line))
    });
  },
  evalCnvChar: function(line, chr){
    return chr.cnv + "<br />";
  },
  evalSmallKana : function(line, chr){
    var tag_name = line.textEmpha? "span" : "div";
    return Html.tagWrap(tag_name, chr.data, {
      style:Css.toString(chr.getCssVertSmallKana())
    });
  },
  evalHalfSpaceChar : function(line, chr){
    var half = Math.floor(line.fontSize / 2);
    return Html.tagWrap("div", "&nbsp;", {
      style:Css.toString(chr.getCssVertHalfSpaceChar(line))
    });
  },
  evalInlineBox : function(line, box){
    var body = (box._type === "img")? this.parentEvaluator.evalImageContent(box) : box.content;
    return Html.tagWrap("div", body, {
      "style":Css.toString(box.getCssVertInlineBox())
    });
  }
});

var HoriInlineTreeEvaluator = InlineTreeEvaluator.extend({
  evaluate : function(line, ctx){
    var tag_name = line.isInlineOfInline()? "span" : "div";
    return Html.tagWrap(tag_name, this.evalTextLineBody(line, line.getChilds(), ctx), {
      "style":Css.toString(line.getCssInline()),
      "class":line.getCssClasses()
    });
  },
  evalRuby : function(line, ruby, ctx){
    var body = this.evalRt(line, ruby, ctx) + this.evalRb(line, ruby, ctx);
    return Html.tagWrap("span", body, {
      "style":Css.toString(ruby.getCssHoriRuby(line)),
      "class":"nehan-ruby"
    });
  },
  evalRb : function(line, ruby, ctx){
    var body = this.evalTextLineBody(line, ruby.getRbs(), ctx);
    return Html.tagWrap("div", body, {
      "style":Css.toString(ruby.getCssHoriRb(line)),
      "class":"nehan-rb"
    });
  },
  evalRt : function(line, ruby, ctx){
    return Html.tagWrap("div", ruby.getRtString(), {
      "style":Css.toString(ruby.getCssHoriRt(line)),
      "class":"nehan-rt"
    });
  },
  evalWord : function(line, word, ctx){
    return word.data;
  },
  evalTcy : function(line, tcy, ctx){
    return tcy.data;
  },
  evalChar : function(line, chr, ctx){
    if(chr.isHalfSpaceChar()){
      return chr.cnv;
    } else if(chr.isKerningChar()){
      return this.evalKerningChar(line, chr, ctx);
    }
    return chr.data;
  },
  evalEmpha : function(line, chr, char_body){
    var char_body2 = Html.tagWrap("div", char_body, {
      "style":Css.toString(chr.getCssHoriEmphaSrc(line))
    });
    var empha_body = Html.tagWrap("div", line.textEmpha.getText(), {
      "style":Css.toString(chr.getCssHoriEmphaText(line))
    });
    // TODO: check text-emphasis-position is over or under
    return Html.tagWrap("span", empha_body + char_body2, {
      "style":Css.toString(line.textEmpha.getCssHoriEmphaWrap(line, chr))
    });
  },
  evalKerningChar : function(line, chr, ctx){
    var css = chr.getCssPadding(line);
    if(chr.isKakkoStart()){
      return Html.tagWrap("span", chr.data, {
	"style": Css.toString(css),
	"class":"nehan-char-kakko-start"
      });
    }
    if(chr.isKakkoEnd()){
      return Html.tagWrap("span", chr.data, {
	"style": Css.toString(css),
	"class":"nehan-char-kakko-end"
      });
    }
    if(chr.isKutenTouten()){
      return Html.tagWrap("span", chr.data, {
	"style": Css.toString(css),
	"class":"nehan-char-kuto"
      });
    }
    return chr.data;
  },
  evalPaddingChar : function(line, chr, ctx){
    return Html.tagWrap("span", chr.data, {
      "style": Css.toString(chr.getCssPadding(line))
    });
  },
  evalInlineBox : function(line, box){
    box.display = "inline-block";
    return this.parentEvaluator.evaluate(box);
  }
});

var PageGroupEvaluator = (function(){
  function PageGroupEvaluator(){
    this.evaluator = new PageEvaluator();
  }

  PageGroupEvaluator.prototype = {
    evaluate : function(page_group){
      var self = this;
      var char_count = 0;
      var html = [];
      var lazy = true;
      var results = List.map(page_group.getPages(), function(page){
	var ret = self.evaluator.evaluate(page);
	if(!ret.lazy){
	  lazy = false;
	}
	char_count += ret.charCount;
	html.push(ret.html);
	return ret;
      });
      var first = results[0];
      return new EvalResult({
	html:html,
	groupLength:page_group.getSize(),
	percent:first.percent,
	seekPos:first.seekPos,
	pageNo:first.pageNo,
	charPos:first.charPos,
	charCount:char_count
      });
    }
  };

  return PageGroupEvaluator;
})();

var PageStream = Class.extend({
  init : function(text){
    this.text = this._createSource(text);
    this.generator = this._createGenerator(this.text);
    this.evaluator = this._createEvaluator();
    this.buffer = [];
    this._timeStart = null;
    this._timeElapsed = null;
    this._seekPageNo = 0;
    this._seekPercent = 0;
    this._seekPos = 0;
  },
  hasPage : function(page_no){
    return (typeof this.buffer[page_no] != "undefined");
  },
  hasNext : function(){
    return this.generator.hasNext();
  },
  hasOutline : function(root_name){
    return this.generator.hasOutline(root_name);
  },
  getNext : function(){
    if(!this.hasNext()){
      return null;
    }
    var cur_page_no = this._seekPageNo;
    if(!this.hasPage(cur_page_no)){
      var entry = this._yield();
      this._addBuffer(entry);
      this._seekPageNo++;
      this._seekPercent = entry.percent;
      this._seekPos = entry.seekPos;
    }
    return this.get(cur_page_no);
  },
  // int -> EvalResult
  get : function(page_no){
    var entry = this.buffer[page_no];
    if(entry instanceof EvalResult){ // already evaluated.
      return entry;
    }
    // if still not evaluated, eval and get EvalResult
    var result = this.evaluator.evaluate(entry);
    this.buffer[page_no] = result; // over write buffer entry by result.
    return result;
  },
  getPageCount : function(){
    return this.buffer.length;
  },
  getOutlineTree : function(root_name){
    return this.generator.getOutlineTree(root_name || "body");
  },
  getOutlineNode : function(root_name, opt){
    var tree = this.getOutlineTree(root_name);
    var converter = new OutlineConverter(tree, opt || {});
    return converter.outputNode();
  },
  getAnchors : function(){
    return this.generator.getAnchors();
  },
  getAnchorPageNo : function(anchor_name){
    return this.generator.getAnchorPageNo(anchor_name);
  },
  getSeekPageResult : function(){
    return this.get(this._seekPageNo);
  },
  getSeekPageNo : function(){
    return this._seekPageNo;
  },
  getSeekPercent : function(){
    return this._seekPercent;
  },
  getSeekPos : function(){
    return this._seekPos;
  },
  setAnchor : function(name, page_no){
    this.generator.setAnchor(name, page_no);
  },
  getTimeElapsed : function(){
    return this._timeElapsed;
  },
  syncGet : function(){
    this._setTimeStart();
    while(this.generator.hasNext()){
      this.getNext();
    }
    return this._setTimeElapsed();
  },
  asyncGet : function(opt){
    Args.merge(this, {
      onComplete : function(time){},
      onProgress : function(self){}
    }, opt || {});
    this._setTimeStart();
    this._asyncGet(opt.wait || 0);
  },
  _yield : function(){
    return this.generator.yield();
  },
  _setTimeStart : function(){
    this._timeStart = (new Date()).getTime();
    return this._timeStart;
  },
  _setTimeElapsed : function(){
    this._timeElapsed = (new Date()).getTime() - this._timeStart;
    return this._timeElapsed;
  },
  _asyncGet : function(wait){
    if(!this.generator.hasNext()){
      var time = this._setTimeElapsed();
      this.onComplete(time);
      return;
    }
    var self = this;
    var entry = this._yield();
    this._addBuffer(entry);
    this.onProgress(this);
    this._seekPageNo++;
    this._seekPercent = entry.percent;
    this._seekPos = entry.seekPos;
    reqAnimationFrame(function(){
      self._asyncGet(wait);
    });
  },
  _addBuffer : function(entry){
    // if entry can't be lazy, eval immediately.
    if(!entry.lazy){
      entry = this.evaluator.evaluate(entry);
    }
    this.buffer.push(entry);
  },
  // common preprocessor
  _createSource : function(text){
    return text
      .replace(/(\/[a-zA-Z0-9\-]+>)[\s\n]+(<[^\/])/g, "$1$2") // discard space between close tag and open tag.
      .replace(/\t/g, "") // discard TAB
      .replace(/<!--[\s\S]*?-->/g, "") // discard comment
      .replace(/<rp>[^<]*<\/rp>/gi, "") // discard rp
      .replace(/<rb>/gi, "") // discard rb
      .replace(/<\/rb>/gi, "") // discard /rb
      .replace(/<rt><\/rt>/gi, ""); // discard empty rt
  },
  _createGenerator : function(text){
    switch(Layout.root){
    case "body":
      return new BodyBlockTreeGenerator(text);
    case "html":
      return new HtmlGenerator(text);
    default:
      return new DocumentGenerator(text);
    }
  },
  _createEvaluator : function(){
    return new PageEvaluator();
  }
});

var PageGroup = (function(){
  function PageGroup(size){
    this.trees = [];
    this.size = size;
  }

  PageGroup.prototype = {
    add : function(tree){
      if(this.isComplete()){
	throw "overflow";
      }
      this.trees.push(tree);
    },
    commit : function(){
      var first = this.getFirst();
      var last = this.getLast();
      // page group of evaluation can be lazy when both head and tail are context free.
      this.lazy = first.lazy && last.lazy;
      this.percent = first.percent;
      this.seekPos = first.seekPos;
      this.pageNo = first.pageNo;
    },
    isEmpty : function(){
      return this.trees.length === 0;
    },
    isComplete : function(){
      return this.trees.length >= this.size;
    },
    getFirst : function(){
      return this.trees[0];
    },
    getLast : function(){
      return this.trees[this.trees.length - 1];
    },
    get : function(pos){
      return this.trees[pos];
    },
    getPages : function(){
      return this.trees;
    },
    getSize : function(){
      return this.size;
    },
    getLength : function(){
      return this.trees.length;
    }
  };

  return PageGroup;
})();

var PageGroupStream = PageStream.extend({
  init : function(text, group_size){
    this._super(text);
    this.groupSize = group_size;
  },
  getAnchorPageNo : function(anchor_name){
    var page_no = this._super(anchor_name);
    return this.getGroupPageNo(page_no);
  },
  // anchors and outline positions of nehan are returned as 'cell_page_pos'.
  // for example, first page group(size=4) consists of [0,1,2,3] cell pages.
  // so cell page nums '0..3' are equivalent to group page no '0'.
  getGroupPageNo : function(cell_page_no){
    return Math.floor(cell_page_no / this.groupSize);
  },
  _yield : function(){
    var group = new PageGroup(this.groupSize);
    var add = function(page){
      group.add(page);
    };
    for(var i = 0; i < this.groupSize; i++){
      if(!this.generator.hasNext()){
	break;
      }
      add(this.generator.yield());
    }
    group.commit();
    return group;
  },
  _createEvaluator : function(){
    return new PageGroupEvaluator();
  }
});

Nehan.version = "4.0.2";

Args.copy(Env, __engine_args.env || {});
Args.copy(Layout, __engine_args.layout || {});
Args.copy(Config, __engine_args.config || {});

var __exports = {};

// export only for test
if(__engine_args.test){

  // basics
  __exports.Class = Class;
  __exports.Utils = Utils;
  __exports.MathUtils = MathUtils;
  __exports.Obj = Obj;
  __exports.Css = Css;
  __exports.Html = Html;
  __exports.Closure = Closure;
  __exports.Args = Args;
  __exports.List = List;
  __exports.Color = Color;
  __exports.Colors = Colors;
  __exports.Flow = Flow;
  __exports.InlineFlow = InlineFlow;
  __exports.BlockFlow = BlockFlow;
  __exports.BoxFlow = BoxFlow;
  __exports.BoxFlows = BoxFlows;
  __exports.Edge = Edge;
  __exports.EdgeParser = EdgeParser;
  __exports.CornerParser = CornerParser;
  __exports.CssParser = CssParser;
  __exports.Padding = Padding;
  __exports.Margin = Margin;
  __exports.Border = Border;
  __exports.BorderColor = BorderColor;
  __exports.BorderRadius = BorderRadius;
  __exports.Radius2d = Radius2d;
  __exports.BoxEdge = BoxEdge;
  __exports.BoxSize = BoxSize;
  __exports.LogicalSize = LogicalSize;
  __exports.BoxSizing = BoxSizing;
  __exports.BoxSizings = BoxSizings;
  __exports.UnitSize = UnitSize;
  __exports.BoxChild = BoxChild;
  __exports.Box = Box;
  __exports.Selector = Selector;
  __exports.Tag = Tag;
  __exports.Char = Char;
  __exports.Word = Word;
  __exports.Tcy = Tcy;
  __exports.Ruby = Ruby;
  __exports.Lexer = Lexer;
  __exports.Token = Token;
  __exports.TagStack = TagStack;
  __exports.InlineContext = InlineContext;
  __exports.BlockContext = BlockContext;
  __exports.DocumentContext = DocumentContext;
  __exports.TocContext = TocContext;
  __exports.EvalResult = EvalResult;
  __exports.PageGroup = PageGroup;
  __exports.Partition = Partition;
  __exports.Cardinal = Cardinal;
  __exports.ListStyle = ListStyle;
  __exports.ListStyleType = ListStyleType;
  __exports.ListStylePos = ListStylePos;
  __exports.ListStyleImage = ListStyleImage;

  // outline
  __exports.OutlineBuffer = OutlineBuffer;
  __exports.OutlineContext = OutlineContext;
  __exports.OutlineParser = OutlineParser;
  __exports.OutlineConverter = OutlineConverter;

  // stream
  __exports.TokenStream = TokenStream;
  __exports.DocumentTagStream = DocumentTagStream;
  __exports.HtmlTagStream = HtmlTagStream;
  __exports.HeadTagStream = HeadTagStream;
  __exports.ListTagStream = ListTagStream;
  __exports.DefListTagStream = DefListTagStream;
  __exports.TableTagStream = TableTagStream;
  __exports.RubyTagStream = RubyTagStream;

  // generator
  __exports.ElementGenerator = ElementGenerator;
  __exports.InlineTreeGenerator = InlineTreeGenerator;
  __exports.BlockTreeGenerator = BlockTreeGenerator;
  __exports.BodyBlockTreeGenerator = BodyBlockTreeGenerator;
  __exports.ParallelGenerator = ParallelGenerator;
  __exports.ParaChildGenerator = ParaChildGenerator;
  __exports.HtmlGenerator = HtmlGenerator;
  __exports.DocumentGenerator = DocumentGenerator;

  // evaluator
  __exports.PageEvaluator = PageEvaluator;
  __exports.BlockTreeEvaluator = BlockTreeEvaluator;
  __exports.InlineTreeEvaluator = InlineTreeEvaluator;
  __exports.PageGroupEvaluator = PageGroupEvaluator;

  // page stream
  __exports.PageStream = PageStream;
  __exports.PageGroupStream = PageGroupStream;

  // core layouting components
  __exports.Env = Env;
  __exports.Config = Config;
  __exports.Layout = Layout;
  __exports.Style = Style;
  __exports.Selectors = Selectors;
}

__exports.createPageStream = function(text, group_size){
  group_size = Math.max(1, group_size || 1);
  return (group_size === 1)? (new PageStream(text)) : (new PageGroupStream(text, group_size));
};
__exports.getStyle = function(selector_key){
  return Selectors.getValue(selector_key);
};
__exports.setStyle = function(selector_key, value){
  Selectors.setValue(selector_key, value);
};
__exports.setStyles = function(values){
  for(var selector_key in values){
    Selectors.setValue(selector_key, values[selector_key]);
  }
};

return __exports;

}; // Nehan.setup
