module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint:{
      normal:{
	src:[
	  "src/*.js"
	],
	filter:function(filepath){
	  return filepath.indexOf("closure") < 0;
	}
      },
      options:{
	"smarttabs":true
      }
	
    },
    concat:{
      normal:{
	files:{
	  "build/<%= pkg.name %>.js":[
	    "COPYING",
	    "src/closure-open.js",
	    "src/reader.template.js",
	    "src/reader.themes.js",
	    "src/reader.wheel.js",
	    "src/reader.status.js",
	    "src/reader.pager.js",
	    "src/reader.app.js",
	    "src/reader.main.js",
	    "src/closure-close.js",
	    "src/jquery.main.js"
	  ]
	}
      },
      min:{
	files:{
	  "build/<%= pkg.name %>.min.js":[
	    "COPYING",
	    "obj/<%= pkg.name %>.cjs"
	  ]
	}
      }
    },
    uglify: {
      normal: {
        src: 'build/<%= pkg.name %>.js',
        dest: 'obj/<%= pkg.name %>.cjs'
      }
    }
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['concat']);

};