var Pager = (function(){
  function Pager(app_status, callbacks){
    this.status = app_status;

    // create basic nodes
    this.rootNode = this._createRootNode();

    // create dom tree
    var elements = this.status.getPagerElements();
    for(var i = 0; i < elements.length; i++){
      var element_name = elements[i];
      switch(element_name){
      case "left-next": case "right-next":
	this.nextNode = this._createNextNode(this._createNextLabel(element_name));
	this.rootNode.appendChild(this.nextNode);
	break;
      case "left-prev": case "right-prev":
	this.prevNode = this._createPrevNode(this._createPrevLabel(element_name));
	this.rootNode.appendChild(this.prevNode);
	break;
      case "indicator":
	this.pageNoInput = this._createPageNoNode();
	this.slashNode = this._createSlashNode();
	this.pageCountNode = this._createPageCountNode();
	this.rootNode.appendChild(this.pageNoInput);
	this.rootNode.appendChild(this.slashNode);
	this.rootNode.appendChild(this.pageCountNode);
	break;
      case "progress":
	this.progressNode = this._createProgressNode();
	this.rootNode.appendChild(this.progressNode);
	break;
      }
    }

    // setup event handlers
    if(this.nextNode){
      this.nextNode.onclick = callbacks.onNext;
    }
    if(this.prevNode){
      this.prevNode.onclick = callbacks.onPrev;
    }
    if(this.pageNoInput){
      this.pageNoInput.onkeydown = function(evt){
	var page_no = Math.max(0, parseInt(this.value, 10) - 1);
	var keycode;
	if(window.event){ // MSIE
	  keycode = window.event.keyCode;
	} else {
	  keycode = evt.which || evt.keyCode;
	}
	if(keycode == 13){ // ENTER
	  callbacks.onJump(page_no);
	}
      };
    }
  }

  Pager.prototype = {
    getRootNode : function(){
      return this.rootNode;
    },
    hide : function(){
      this.rootNode.style.display = "none";
    },
    show : function(){
      this.rootNode.style.display = "block";
    },
    updatePageNo : function(){
      if(this.pageNoInput){
	var page_no = this.status.getPageNo();
	this.pageNoInput.value = page_no + 1;
      }
    },
    updatePageCount : function(){
      if(this.pageCountNode){
	var page_count = this.status.getPageCount();
	this.pageCountNode.innerHTML = page_count;
      }
    },
    updateProgress : function(){
      if(this.progressNode){
	var progress = this.status.getProgress();
	this.progressNode.firstChild.firstChild.style.width = progress + "%";
      }
    },
    _createRootNode : function(){
      var node = document.createElement("div");
      var klass = ["nehan-reader-pager"];
      if(this.status.isSeqAccess()){
	klass.push("nehan-reader-pager-seq");
      }
      node.className = klass.join(" ");
      node.style.width = this.status.getPagerWidth() + "px";
      return node;
    },
    _createPageNoNode : function(){
      var node = document.createElement("input");
      node.className = "nehan-reader-page-no";
      node.type = "text";
      node.value = "0";
      return node;
    },
    _createSlashNode : function(){
      var node = document.createElement("span");
      node.className = "nehan-reader-slash";
      node.innerHTML = "/";
      return node;
    },
    _createPageCountNode : function(){
      var node = document.createElement("span");
      node.className = "nehan-reader-page-count";
      return node;
    },
    _createNextLabel : function(element_name){
      switch(element_name){
      case "left-next": return "&laquo; NEXT";
      case "right-next": return "NEXT &raquo;";
      default: return "NEXT";
      }
    },
    _createPrevLabel : function(element_name){
      switch(element_name){
      case "left-prev": return "&laquo; PREV";
      case "right-prev": return "PREV &raquo;";
      default: return "PREV";
      }
    },
    _createNextNode : function(text){
      var node = document.createElement("button");
      node.className = "nehan-reader-next nehan-reader-pager-button";
      node.innerHTML = text;
      return node;
    },
    _createPrevNode : function(text){
      var node = document.createElement("button");
      node.className = "nehan-reader-prev nehan-reader-pager-button";
      node.innerHTML = text;
      return node;
    },
    _createProgressNode : function(){
      var node = document.createElement("div");
      node.className = "nehan-reader-progress";
      node.style.width = this.status.getProgressWidth() + "px";
      node.appendChild(this._createProgressBox());
      return node;
    },
    _createProgressBox : function(){
      var node = document.createElement("div");
      node.className = "nehan-reader-progress-box";
      node.appendChild(this._createProgressBar());
      
      return node;
    },
    _createProgressBar : function(){
      var node = document.createElement("div");
      node.style["float"] = this.status.isLeftProgress()? "right" : "left";
      node.className = "nehan-reader-progress-bar";
      return node;
    }
  };

  return Pager;
})();
