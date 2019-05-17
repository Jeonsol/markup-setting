var gulp = require('gulp');
var sass = require('gulp-sass');
var spritesmith = require('gulp.spritesmith');
var imagemin = require('gulp-imagemin');
var buffer = require('vinyl-buffer');
var browserSync = require('browser-sync');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('sass',function(){
  return gulp.src('src/scss/fitness.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('src/css/'));
});

gulp.task('sprite',function() {
  var spriteData = gulp.src('src/img/sprites/*.png')
    .pipe(spritesmith({
      imgName : '../../src/img/sprite.png',
      padding : 4,
      cssName : '_sprite.scss'
    }));
  var imgStream  = new Promise(function(resolve){
    spriteData.img
      .pipe(buffer())
      .pipe(imagemin())
      .pipe(gulp.dest(''))
      .on('end',resolve);
  });
  var cssStream  = new Promise(function(resolve){
    spriteData.css
      .pipe(gulp.dest('src/scss/modules'))
      .on('end',resolve);
  });

  return Promise.all([imgStream,cssStream])
});

gulp.task('browser-sync',function(){
  browserSync.init({
    server:{
      baseDir:"./"
    }
  });
});

gulp.task('watch',['browser-sync'],function(){
  gulp.watch('src/scss/**/*.scss',['sass'])
  gulp.watch('*.html').on('change',browserSync.reload);
});

gulp.task('default',['watch']);
