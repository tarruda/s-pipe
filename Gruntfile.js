// Browsers/platform to test with saucelabs
var browsers = [{
  browserName: "internet explorer",
  platform: "XP",
  version: "7"
}, {
  browserName: "internet explorer",
  platform: "WIN7",
  version: "8"
}, {
  browserName: "internet explorer",
  platform: "WIN7",
  version: "9"
}, {
  browserName: "internet explorer",
  platform: "WIN7",
  version: "10"
}, {
  browserName: "firefox",
  platform: "WIN7"
}, {
  browserName: "chrome",
  platform: "WIN7"
}, {
  browserName: "opera",
  platform: "WIN7"
}];


module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    exec_jshint: {
      all: ['lib/**/*.js', 'test/**/*.js']
    },

    powerbuild: {
      options: {
        sourceMap: true,
        npmSourceMaps: true,
        inlineSources: true
      },
      test: {
        files: [
          { src: 'test/**/*.js', dest: 'build/test.js' }
        ]
      },
      dist: {
        options: {
          compress: true
        },
        files: [
          { src: 'lib/index.js', dest: 'build/<%= pkg.name %>.min.js' }
        ]
      }
    },

    mocha_debug: {
      options: {
        reporter: 'dot',
        check: ['lib/**/*.js', 'test/**/*.js']
      },
      nodejs: {
        options: {
          src: ['lib/**/*.js', 'test/**/*.js']
        }
      },
      browser: {
        options: {
          listenAddress: '0.0.0.0',
          listenPort: 8000,
          phantomjs: true,
          src: ['build/test.js']
        }
      }
    },

    'saucelabs-mocha': {
      all: {
        options: {
          urls: ["http://127.0.0.1:8000"],
          tunnelTimeout: 5,
          build: process.env.TRAVIS_JOB_ID,
          concurrency: 3,
          browsers: browsers,
          testTimeout: 1200000,
          tags: ["master"]
        }
      }
    },

    watch: {
      options: {
        nospawn: true
      },
      all: {
        files: ['Gruntfile.coffee', 'lib/**/*.js', 'test/**/*.js'],
        tasks: ['test', 'livereload']
      }
    },

    clean: ['build']
  });

  grunt.event.on('watch', function(action, filepath) {
    grunt.regarde = { changed: ['test.js'] };
  });

  grunt.loadNpmTasks('powerbuild');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-livereload');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mocha-debug');
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('grunt-exec-jshint');
  grunt.loadNpmTasks('grunt-saucelabs');

  grunt.registerTask('test', [
    'newer:exec_jshint',
    'powerbuild:test',
    'mocha_debug'
  ]);

  grunt.registerTask('rebuild', [
    'clean',
    'newer:exec_jshint',
    'powerbuild',
    'mocha_debug'
  ]);
  
  grunt.registerTask('publish', ['rebuild', 'release']);
  grunt.registerTask('ci', ['test']);
  grunt.registerTask('default', ['test', 'livereload-start', 'watch']);
};
