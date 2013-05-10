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
      }
      if(this.stream.hasNext()){
	var result = this._getNextResult();
	this._cacheResult(page_no + 1, result);
	this.writePage(page_no+1);
      }
    },
    writeAnchorPage : function(anchor_name){
      var page_no = this.stream.getAnchorPageNo(anchor_name);
      this.writePage(page_no);
    },
    getPageNo : function(){
      return this.status.getPageNo();
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
    getOutlineNode : function(list_type){
      var self = this;
      var _list_type = list_type || "ol";
      return this.stream.hasOutline("body")? this.stream.getOutlineNode("body", {
	createRoot: function(){
	  return document.createElement(_list_type);
	},
	onClickLink : function(page_no, link, toc){
	  var group_page_no = self.stream.getGroupPageNo(page_no);
	  self.writePage(group_page_no);
	  $(".nehan-header").removeClass("nehan-toc-clicked");
	  $("#nehan-header-" + toc.headerId).addClass("nehan-toc-clicked");
	  //$(".nehan-toc-link").removeClass("nehan-toc-clicked");
	  //$(link).addClass("nehan-toc-clicked");
	  return false;
	}
      }) : null;
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
      this.onPage = opt.onPage || function(){};
      this.engine = this._createEngine();
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
      var first_page = this._getNextResult();
      this._cacheResult(0, first_page);
      this.writePage(0);
      this.onReadyPage(this);
    },
    _startRandAccessStream : function(){
      var self = this;
      this.stream.asyncGet({
	onComplete : function(time){
	  self._onComplete(time);
	},
	onProgress : function(page_no, percent, seek_pos){
	  self._onProgress(page_no, percent, seek_pos);
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
    _getNextResult : function(){
      return this.stream.getNext();
    },
    _getResult : function(page_no){
      return this.stream.get(page_no);
    },
    _onComplete : function(time){
      this.onComplete(this);
    },
    _onProgress : function(page_no, percent, seek_pos){
      var result = this._getResult(page_no);
      this.status.setPageCount(page_no + 1);
      this._cacheResult(page_no, result);
      this.pager.updatePageCount();

      if(page_no === 0){
	this.writePage(0);
	this.onReadyPage(this);
      }
    },
    _cacheResult : function(page_no, result){
      var html = this._outputScreenHtml(page_no, result);
      this.status.addScreenCache({
	html:html,
	result:result
      });
    },
    _updateScreen : function(){
      var self = this;
      var page_no = this.status.getPageNo();
      var cache = this.status.getScreenCache(page_no);
      var percent = cache.result.percent;
      if(!this.stream.hasNext() && !this.stream.hasPage(page_no+1)){
	percent = 100;
      }
      this.status.setProgress(percent);
      this.screenNode.innerHTML = cache.html;
      this.pager.updatePageNo();
      this.pager.updateProgress();
      if(this.status.getPageCount() != this.stream.getPageCount()){
	this.status.setPageCount(this.stream.getPageCount());
	this.pager.updatePageCount();
      }
      $(".nehan-anchor-link").click(function(){
	var anchor_name = $(this).attr("href").substring(1); // cut "#"
	self.writeAnchorPage(anchor_name);
	return false;
      });
    },
    _outputScreenHtml : function(page_no, result){
      var cell_order = this.status.getCellOrder();
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

      for(var i = 0; i < result.getGroupCount(); i++){
	this.template.setValue(cell_order[i], result.getHtml(i));
      }

      return this.template.render();
    },
    _createEngine : function(){
      var engine = Nehan.setup({
	layout:{
	  direction:this.status.getDirection(),
	  hori:this.status.getHoriDocumentMode(),
	  vert:this.status.getVertDocumentMode(),
	  fontSize:this.status.getFontSize(),
	  width:this.status.getCellPageWidth(),
	  height:this.status.getCellPageHeight()
	}
      });
      this.onCreateEngine(engine);
      return engine;
    },
    _createStream : function(src){
      var group_count = this.status.getCellCount();
      return this.engine.createPageGroupStream(src, group_count);
    },
    _createTemplate : function(){
      var name = [this.status.getRowCount(), this.status.getColCount()].join("x");
      var source = Themes[name] || "";
      return new Template(source);
    },
    _createScreenNode : function(html){
      var page = document.createElement("div");
      page.className = "nehan-reader-screen";
      page.style.width = this.status.getScreenWidth() + "px";
      page.style.height = this.status.getScreenHeight() + "px";
      if(html){
	page.innerHTML = html;
      }
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
