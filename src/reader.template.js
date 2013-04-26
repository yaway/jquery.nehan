var Template = (function(){
  function Template(src, values){
    this.src = src;
    this.values = values || {};
  }

  Template.prototype = {
    clearValues : function(){
      for(var prop in this.values){
	this.values[prop] = "";
      }
    },
    setValue : function(name, value){
      this.values[name] = value;
    },
    render : function(){
      var ret = this.src;
      for(var prop in this.values){
	var val = this.values[prop];
	var regexp = new RegExp("\\{\\{" + prop + "\\}\\}", "g");
	ret = ret.replace(regexp, val);
      }
      return ret;
    }
  };

  return Template;
})();
