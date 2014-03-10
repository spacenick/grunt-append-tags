/*
 * grunt-append-tags
 * https://github.com/spacenick/grunt-append-tags
 *
 * Copyright (c) 2014 Nicolas Kermarc
 * Licensed under the MIT license.
 */

'use strict';

var util = require('util'),
    _   = require('lodash'),
    cheerio = require('cheerio');

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('append_tags', 'Watch for new files and append them in your index.html in a smart way', function() {
    
    var options = this.options({
      fileTmpl: '<script src="%s"></script>',
      prespace: '\t\t',
      appRoot: 'app/',
      indexFile: './app/index.html',
      files: ['app/scripts/**/*.js']
    });

    /// This is basically a 'passive task' that run on grunt 'watch' events.

    grunt.event.on('watch', function(action, filepath){

      var test = grunt.file.match(options.files, filepath);
      if (test.length > 0) {
        var page = grunt.file.read(options.indexFile);
        var $ = cheerio.load(page);

        var noAppRootFilepath = filepath.replace(options.appRoot, '');
        var newTag = '\n' + options.prespace + util.format(options.fileTmpl, noAppRootFilepath);

        if ($('script[src="' + noAppRootFilepath +'"]').length > 0 && action !== "deleted") return;
        else if (action === "deleted") {
          $('script[src="' + noAppRootFilepath +'"]').remove();
          grunt.log.ok("Removed the file from the index.html");
        }

        if (action !== "deleted") {
          var scripts = [];
          $('script[src]').each(function(){
            var src = $(this).attr('src');
            if (src) scripts.push(src);
          });

          var max = 0;
          var counterMax = -1;
          var i = 0;

          /// Let's find matching patterns
          scripts.forEach(function(src){
            var srcSplitted = src.split('/');
            srcSplitted = srcSplitted.slice(0, srcSplitted.length - 1);
            var filepathSplitted = filepath.split('/');
            filepathSplitted = filepathSplitted.slice(0, filepathSplitted.length - 1);
            var intersect = _.intersection(srcSplitted, filepathSplitted);
            if (intersect.length >= max) {
              max = intersect.length;
              counterMax = i;
            }
            i++;
          });

          if (counterMax > -1) {
            var match = $('script[src]').eq(counterMax);
            match.after(newTag);
            grunt.log.ok('Added the script right after ' + match.attr('src'));
          }
          else {
            $('body').append(newTag);
            grunt.log.error("Didn't find any matching scripts... Will append at the end of the document.");
          }
        }

        var content = $.html();
        grunt.file.write(options.indexFile, content);
      }

    });
  });

};
