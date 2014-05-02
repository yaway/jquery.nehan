var Reader = (function(){
  function Reader(src, opt){
    this._initialize(src, opt);
  }

  Reader.prototype = {
    renderTo : function(target){
      this.target = target;
      this._layoutElements();
      this._startStream();
      if(this.status.isWheelEnable()){
	this._setupWheel(this.screenNode);
      }
      this._showReader();
    },
    reset : function(opt){
      this._initialize(this.src, opt);
      this.renderTo(this.target);
    },
    writePage : function(page_no){
      this.status.setPageNo(page_no);
      this._updateScreen();
      this.onPage(this);
    },
    writePrevPage : function(){
      var page_no = this.status.getPageNo();
      if(page_no > 0){
	this.writePage(page_no-1);
      }
    },
    writeNextPage : function(){
      var page_no = this.status.getPageNo();
      if(this.stream.hasPage(page_no+1)){
	this.writePage(page_no+1);
      } else if(this.stream.hasNext()){ // still not calclated and stream has next.
	var page_result = this._getNextPage();
	this.writePage(page_no+1);
      }
    },
    writeAnchorPage : function(anchor_name){
      var page_no = this.engine.documentContext.getAnchorPageNo(anchor_name);
      this.writePage(page_no);
    },
    getDirection : function(){
      return this.status.getDirection();
    },
    getPageNo : function(){
      return this.status.getPageNo();
    },
    getPageCount : function(){
      return this.status.getPageCount();
    },
    getRootNode : function(){
      return this.target;
    },
    getScreenNode : function(){
      return this.screenNode;
    },
    getPagerNode : function(){
      return this.pager.getRootNode();
    },
    getOutlineNode : function(list_type, onclick){
      var self = this;
      var _list_type = list_type || "ol";
      return this.engine.documentContext.createBodyOutlineElement({
	createRoot: function(){
	  return document.createElement(_list_type);
	},
	onClickLink : function(toc){
	  var group_page_no = self.stream.getGroupPageNo(toc.pageNo);
	  if(onclick){
	    onclick(group_page_no, toc.headerId);
	  } else {
	    self.writePage(group_page_no);
	    $(".nehan-header").removeClass("nehan-toc-clicked");
	    $("#nehan-header-" + toc.headerId).addClass("nehan-toc-clicked");
	  }
	  return false;
	}
      });
    },
    getEngine : function(){
      return this.engine;
    },
    _initialize : function(src, opt){
      this.src = src;
      this.status = new ReaderStatus(opt);
      this.onLayout = opt.onLayout || function(){};
      this.onCreateEngine = opt.onCreateEngine || function(){};
      this.onReadyPage = opt.onReadyPage || function(){};
      this.onComplete = opt.onComplete || function(){};
      this.onError = opt.onError || function(){};
      this.onPage = opt.onPage || function(){};
      this.engine = this._createEngine(opt.engineConfig);
      this.pager = this._createPager();
      this.stream = this._createStream(src);
      this.template = this._createTemplate();
      this.screenNode = this._createScreenNode();
    },
    _layoutElements : function(){
      var elements = this.status.getReaderElements();
      for(var i = 0; i < elements.length; i++){
	switch(elements[i]){
	case "screen":
	  this.target.appendChild(this.getScreenNode());
	  break;
	case "pager":
	  this.target.appendChild(this.getPagerNode());
	  break;
	}
      }
    },
    _showReader : function(){
      this.target.style.display = "block";
    },
    _startStream : function(){
      if(this.status.isSeqAccess()){
	this._startSeqAccessStream();
      } else {
	this._startRandAccessStream();
      }
    },
    _startSeqAccessStream : function(){
      var first_page = this._getNextPage();
      this.writePage(0);
      this.onReadyPage(this);
    },
    _startRandAccessStream : function(){
      var self = this;
      this.stream.asyncGet({
	onComplete : function(stream, time){
	  self._onComplete(time);
	},
	onProgress : function(stream, tree){
	  self._onProgress(tree);
	},
	onError : function(stream){
	  self._onError(caller);
	}
      });
    },
    _setupWheel : function(target){
      var self = this;
      Wheel.init(target, function(){
	self.writePrevPage();
      }, function(){
	self.writeNextPage();
      });
    },
    _getNextPage : function(){
      return this.stream.getNext();
    },
    _getResult : function(page_no){
      return this.stream.get(page_no);
    },
    _onComplete : function(time){
      this.onComplete(this);
    },
    _onProgress : function(page){
      var tree = (page instanceof Array)? page[0] : page;
      var page_no = Math.floor(tree.pageNo / this.status.getCellCount());
      this.status.setPageCount(page_no + 1);
      this.pager.updatePageCount();

      if(page_no === 0){
	this.writePage(0);
	this.onReadyPage(this);
      }
    },
    _onError : function(stream){
      this.onError(stream);
    },
    _updateScreen : function(){
      var self = this;
      var page_no = this.status.getPageNo();
      if(page_no < 0){
	return;
      }
      var page = this.stream.getPage(page_no);
      var percent = page.percent;
      if(!this.stream.hasNext() && !this.stream.hasPage(page_no+1)){
	percent = 100;
      }
      this.status.setProgress(percent);
      this.screenNode.innerHTML = this._outputScreenHtml(page);
      this.pager.updatePageNo();
      this.pager.updateProgress();
      if(this.status.getPageCount() != this.stream.getPageCount()){
	this.status.setPageCount(this.stream.getPageCount());
	this.pager.updatePageCount();
      }
      var cell_order = this.status.getCellOrder();
      var $screen = $(this.screenNode);
      for(var i = 0; i < page.getGroupSize(); i++){
	$screen.find("#cell-" + cell_order[i]).empty().append(page.getGroup(i));
      }
      $(".nehan-anchor-link").click(function(){
	var anchor_name = $(this).attr("href").substring(1); // cut "#"
	self.writeAnchorPage(anchor_name);
	return false;
      });
    },
    _outputScreenHtml : function(page){
      var page_no = page.pageNo;
      var facing_page_order = this.status.getFacingPageOrder(page_no);

      this.template.clearValues();
      this.template.setValue("cell_width", this.status.getCellPageWidth());
      this.template.setValue("cell_height", this.status.getCellPageHeight());
      this.template.setValue("space", this.status.getSpacingSize());
      this.template.setValue("font_size", this.status.getFontSize());
      this.template.setValue("page_pos", page_no);
      this.template.setValue("page_no", page_no + 1);
      this.template.setValue("right_page_no", facing_page_order.right);
      this.template.setValue("left_page_no", facing_page_order.left);

      return this.template.render();
    },
    _createEngine : function(config){
      var engine = Nehan.setup({
	config:config,
	layout:{
	  direction:this.status.getDirection(),
	  hori:this.status.getHoriDocumentMode(),
	  vert:this.status.getVertDocumentMode(),
	  fontSize:this.status.getFontSize(),
	  width:this.status.getCellPageWidth(),
	  height:this.status.getCellPageHeight(),
	  vertFontFamily:this.status.vertFontFamily,
	  horiFontFamily:this.status.horiFontFamily
	}
      });
      this.onCreateEngine(engine);
      return engine;
    },
    _createStream : function(src){
      var group_count = this.status.getCellCount();
      return this.engine.createPageStream(src, group_count);
    },
    _createTemplate : function(){
      var name = this.status.getTemplateName();
      var source = Themes[name] || "";
      return new Template(source);
    },
    _createScreenNode : function(){
      var page = document.createElement("div");
      page.className = "nehan-reader-screen";
      page.style.width = this.status.getScreenWidth() + "px";
      page.style.height = this.status.getScreenHeight() + "px";
      return page;
    },
    _createPager : function(){
      var self = this;
      return new Pager(this.status, {
	onNext: function(){
	  self.writeNextPage();
	  return false;
	},
	onPrev : function(){
	  self.writePrevPage();
	  return false;
	},
	onJump : function(page_no){
	  self.writePage(page_no);
	}
      });
    }
  };

  return Reader;
})();
