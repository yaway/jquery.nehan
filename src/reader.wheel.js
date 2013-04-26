var Wheel = {
  makeHandler : function(dom, onUp, onDown){
    return function(event){
      var delta = 0;
      if (!event){ // IE
	event = window.event;
      }
      if (event.wheelDelta) { // IE/Opera
	delta = event.wheelDelta/120;
      } else if (event.detail) { // Mozilla case.
	delta = -event.detail/3;
      }
      if (delta){
	if(delta < 0 && onDown){
	  onDown(delta);
	} else if(delta > 0 && onUp){
	  onUp(delta);
	}
      }
      if(event.preventDefault){
	event.preventDefault();
      }
      event.returnValue = false;
    };
  },
  init : function(dom, onUp, onDown){
    var handler = this.makeHandler(dom, onUp, onDown);
    if(dom.addEventListener){
      dom.addEventListener("DOMMouseScroll", handler, false);
    }
    dom.onmousewheel = handler;
  }
};
