"use strict";

//******************************************************************************
//* DEPENDENCIES
//******************************************************************************
var gulp        = require('gulp'),
    fs          = require("fs"),
    browserify  = require('browserify'),
    source      = require('vinyl-source-stream'),
    buffer      = require('vinyl-buffer'),
    run         = require('gulp-run'),
    tslint      = require('gulp-tslint'),
    tsc         = require('gulp-typescript'),
    karma       = require('gulp-karma'),
    uglify      = require('gulp-uglify'),
    docco       = require("gulp-docco"),
    runSequence = require('run-sequence'),
    pkg         = require('./package.json'),
    header      = require('gulp-header');

//******************************************************************************
//* INSTALL
//******************************************************************************
gulp.task('install', function(cb) {
    run('tsd reinstall -so').exec("", function() {
        cb();
    });
});

//******************************************************************************
//* LINT
//******************************************************************************
gulp.task('lint', function() {
  return gulp.src(['./source/**/**.ts', './test/**/**.test.ts'])
             .pipe(tslint())
             .pipe(tslint.report('verbose'));
});

//******************************************************************************
//* BUILD
//******************************************************************************
var tsProject = tsc.createProject({
  removeComments : false,
  noImplicitAny : false,
  target : 'ES3',
  module : 'commonjs',
  declarationFiles : false
});

gulp.task('build-source', function() {
  return gulp.src('./source/**/**.ts')
             .pipe(tsc(tsProject))
             .js.pipe(gulp.dest('./build/source/'));
});

gulp.task('build-test', function() {
  return gulp.src('./test/*.test.ts')
             .pipe(tsc(tsProject))
             .js.pipe(gulp.dest('./build/test/'));
});

gulp.task('build', function(cb) {
  runSequence('install', 'lint', 'build-source', 'build-test', cb);
});

//******************************************************************************
//* DOCUMENT
//******************************************************************************
gulp.task('document', function () {
  return gulp.src("./build/source/*.js")
             .pipe(docco())
             .pipe(gulp.dest('./documentation'));
});

//******************************************************************************
//* BUNDLE
//******************************************************************************
gulp.task('bundle-source', function () {
  var b = browserify({
    entries: './build/source/inversify.js',
    debug: true
  });

  return b.bundle()
    .pipe(source('inversify.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./bundled/source/'));
});

gulp.task('bundle-test', function (cb) {

  var path = "./build/test/"
  fs.readdir(path, function (err, files) {
      if (err) {
          throw err;
      }
      files.forEach(function (file) {
        if(file.indexOf(".test.js") != -1) {

          var b = browserify({
            entries: path + file,
            debug: true
          });

          return b.bundle()
            .pipe(source(file))
            .pipe(buffer())
            .pipe(gulp.dest('./bundled/test/'));
        }
      });
      cb();
  });
});

gulp.task('bundle', function(cb) {
  runSequence('build', 'bundle-source', 'bundle-test', 'document', cb);
});

//******************************************************************************
//* TEST
//******************************************************************************
//var server = karma.server;

var testFiles = [
  './bundled/test/*.test.js'
];

gulp.task('karma', function() {
  return gulp.src(testFiles)
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }))
    .on('error', function(err) {
      throw err;
    });
});

gulp.task('test', function(cb) {
  runSequence('bundle', 'karma', cb);
});


//******************************************************************************
//* BAKE
//******************************************************************************
gulp.task('compress', function() {
  return gulp.src('./bundled/source/inversify.js')
             .pipe(uglify({ preserveComments : false }))
             .pipe(gulp.dest('./dist/'))
});

gulp.task('header', function() {

  var pkg = require('./package.json');

  var banner = ['/**',
    ' * <%= pkg.name %> v.<%= pkg.version %> - <%= pkg.description %>',
    ' * Copyright (c) 2015 <%= pkg.author %>',
    ' * <%= pkg.license %> inversify.io/LICENSE',
    ' * <%= pkg.homepage %>',
    ' */',
    ''].join('\n');

  return gulp.src('./dist/inversify.js')
             .pipe(header(banner, { pkg : pkg } ))
             .pipe(gulp.dest('./dist/'));
});

gulp.task('bake', function(cb) {
  runSequence('bundle', 'compress', 'header', cb);
});

//******************************************************************************
//* DEFAULT
//******************************************************************************
gulp.task('default', function (cb) {
  runSequence(
    'install',
    'lint',
    'build-source',
    'build-test',
    'document',
    'bundle-source',
    'bundle-test',
    'karma',
    'compress',
    'header',
    cb);
});
