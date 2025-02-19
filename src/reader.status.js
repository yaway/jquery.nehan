var ReaderStatus = (function(){
  function ReaderStatus(args){
    this.pageNo = 0;
    this.pageCount = 0;
    this.progress = 0;
    this.direction = args.direction || "vert";
    this.horiMode = args.hori || "lr-tb";
    this.vertMode = args.vert || "tb-rl";
    this.isVert = args.direction.indexOf("vert") >= 0;
    this.readerElements = args.readerElements || ["screen", "pager"];
    this.pagerElements = args.pagerElements || this.getDefaultPagerElements();
    this.initWidth = args.width || 640;
    this.initHeight = args.height || 480;
    this.fontSize = args.fontSize || 16;
    this.rowCount = Math.max(1, Math.min(2, args.rowCount));
    this.colCount = Math.max(1, Math.min(2, args.colCount));
    this.spacingSize = args.spacingSize || this.fontSize;
    this.useWheel = args.useWheel;
    this.useNombre = args.useNombre;
    this.vertFontFamily = args.vertFontFamily;
    this.horiFontFamily = args.horiFontFamily;
  }

  ReaderStatus.prototype = {
    isVertical : function(){
      return this.isVert;
    },
    isWheelEnable : function(){
      return this.useWheel;
    },
    isNombreEnable : function(){
      return this.useNombre;
    },
    isSeqAccess : function(){
      for(var i = 0; i < this.pagerElements.length; i++){
	if(this.pagerElements[i] == "progress"){
	  return true;
	}
      }
      return false;
    },
    isLeftProgress : function(){
      for(var i = 0; i < this.pagerElements.length; i++){
	if(this.pagerElements[i] == "left-next"){
	  return true;
	}
      }
      return false;
    },
    setPageCount : function(page_count){
      this.pageCount = page_count;
    },
    setPageNo : function(page_no){
      this.pageNo = page_no;
    },
    setProgress : function(percent){
      this.progress = percent;
    },
    getDefaultPagerElements : function(){
      if(this.vertMode === "tb-rl"){
	return ["progress", "left-next", "right-prev"];
      }
      return ["progress", "left-prev", "right-next"];
    },
    getPageNo : function(){
      return this.pageNo;
    },
    getProgress : function(){
      return this.progress;
    },
    getReaderElements : function(){
      return this.readerElements;
    },
    getPagerElements : function(){
      return this.pagerElements;
    },
    getNextPageNo : function(){
      return Math.min(this.pageNo + 1, this.pageCount - 1);
    },
    getPrevPageNo : function(){
      return Math.max(0, this.pageNo - 1);
    },
    getPageCount : function(){
      return this.pageCount;
    },
    getDirection : function(){
      return this.direction;
    },
    getHoriDocumentMode : function(){
      return this.horiMode;
    },
    getVertDocumentMode : function(){
      return this.vertMode;
    },
    getRowCount : function(){
      return this.rowCount;
    },
    getColCount : function(){
      return this.colCount;
    },
    getCellCount : function(){
      return this.rowCount * this.colCount;
    },
    getTemplateName : function(){
      var ret = [this.rowCount, this.colCount].join("x");
      return this.isNombreEnable()? [ret, "nombre"].join("-") : ret;
    },
    getFontSize : function(){
      return this.fontSize;
    },
    getSpacingSize : function(){
      return this.spacingSize;
    },
    getCellOrder : function(){
      if(this.rowCount == 1 && this.colCount == 1){
	return [0];
      } else if(this.rowCount == 2 && this.colCount == 1){
	return [0, 1];
      } else if(this.rowCount == 1 && this.colCount == 2){
	return this.isVert? [1, 0] : [0, 1];
      }
      return this.isVert? [0, 1, 2, 3] : [2, 3, 0, 1];
    },
    getFacingPageOrder : function(page_no){
      var first = 2 * (page_no + 1) - 1;
      var second = 2 * (page_no + 1);
      return this.isVert? {left:second, right:first} : {left:first, right:second};
    },
    getCellPageWidth : function(){
      return Math.floor(this.initWidth / this.colCount);
    },
    getCellPageHeight : function(){
      return Math.floor(this.initHeight / this.rowCount);
    },
    getHoriSpace : function(){
      return this.spacingSize * (this.colCount + 2);
    },
    getVertSpace : function(){
      return this.spacingSize * (this.rowCount + 2);
    },
    getHoriBorderSize : function(){
      return (this.colCount >= 2)? 1 : 0;
    },
    getVertBorderSize : function(){
      return (this.rowCount >= 2)? 1 : 0;
    },
    getFooterHeight : function(){
      return this.isNombreEnable()? this.fontSize * 2 : 0;
    },
    getScreenWidth : function(){
      return this.initWidth + this.getHoriSpace() + this.getHoriBorderSize();
    },
    getScreenHeight : function(){
      return this.initHeight + this.getVertSpace() + this.getVertBorderSize() + this.getFooterHeight();
    },
    getPagerWidth : function(){
      return this.getScreenWidth();
    },
    getProgressWidth : function(){
      return this.getPagerWidth() - 200;
    }
  };

  return ReaderStatus;
})();
