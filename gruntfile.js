'use strict';

module.exports = function(grunt) {

  grunt.registerTask('default', ['jshint', 'jscs', 'mochaTest']);

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-jscs');

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: {
        src: ['gruntfile.js', 'lib/**/*.js', 'test/**/*.js']
      }
    },
    jscs: {
      src: ['gruntfile.js', 'lib/**/*.js', 'test/**/*.js'],
      options: {
        preset: 'grunt'
      }
    },
    watch: {
      unit: {
        files: ['lib/**/*.js', 'test/**/*.spec.js'],
        tasks: ['jshint', 'jscs', 'mochaTest']
      }
    },
    mochaTest: {
      options: {
        require: 'test/blanket'
      },
      all: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*.spec.js']
      },
      coverage: {
        options: {
          reporter: 'html-cov',
          quiet: true,
          captureFile: 'coverage.html'
        },
        src: ['test/**/*.spec.js']
      },
      // The travis-cov reporter will fail the tests if the
      // coverage falls below the threshold configured in package.json
      'travis-cov': {
        options: {
          reporter: 'travis-cov'
        },
        src: ['test/**/*.spec.js']
      }
    },
  });

};
