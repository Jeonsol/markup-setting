const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const handlebars = require('gulp-compile-handlebars');
const gulpSort = require('gulp-sort');
const notify = require('gulp-notify');
const rename = require('gulp-rename');
const spritesmith = require('gulp.spritesmith');
const browserSync = require('browser-sync');
const sourcemaps = require('gulp-sourcemaps');

const paths = {
  cssDest: 'src/css/',
  cssSrc: 'src/scss',
  spriteSrc: 'src/sprite/',
  spriteDest: 'src/img/sprite/',
  imgDest: 'src/img/'
}

const config = {
  browserSync: true,
  notify: true,
  urlRebase: false,
  urlRebaseOption: {
    basePath: paths.imgDest,
    // defaultUrl: 'http://static.naver.com/',
    urlList: {
      // 'sprite/': 'http://static.naver.com/sp/'
    }
  },
  md5: false,
  sprite_ratio: {
    png: 2,
    svg: 2
  },
  autoprefixer: {
    browsers: ['Android > 0','iOS > 0','FirefoxAndroid > 0'] //모바일옵션
    // ['last 2 versions', "Edge > 0", "ie >= 8"] //PC옵션
  }
};

const globalOptions = {
  notify: !config.notify ? {} : {
    errorHandler: notify.onError({
      title: '<%= error.relativePath %>',
      message: '<%= error.line %> line - <%= error.messageOriginal %>',
      sound: 'Pop'
    })
  }
};

const getFolders = dir => {
  try {
    return fs.readdirSync(dir).filter(function (file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    })
  } catch (err) {
    throw err;
  }
}

gulp.task('sass',function(){
  return gulp.src('src/scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('src/css/'));
});

gulp.task('sprite',['makeSpriteMap']);

gulp.task('makeSprite',function() {
  let stream_arr = [];
  const folders = getFolders(paths.spriteSrc);
  const options = {
    spritesmith: folder => ({
      imgPath: path.posix.relative(paths.cssDest, path.posix.join(paths.spriteDest, 'sp_' + folder + '.png')),
      imgName: 'sp_' + folder + '.png',
      cssName: '_sp_' + folder + '.scss',
      cssFormat: 'scss',
      padding: 4,
      cssTemplate: './gulpconf/sprite_template.hbs',
      cssSpritesheetName: 'sp_' + folder,
      cssHandlebarsHelpers: {
        sprite_ratio: 2
      }
    })
  }

  if (folders) {
    let spriteData = {}
    folders.map(folder => {
      spriteData = gulp.src(path.join(paths.spriteSrc, folder, '*.png'))
        .pipe(plumber(globalOptions.notify))
        .pipe(gulpSort())
        .pipe(spritesmith(options.spritesmith(folder)));
      stream_arr.push(new Promise(function (resolve) {
        spriteData.img
          .pipe(gulp.dest(paths.spriteDest))
          .on('end',resolve);
      }));
      stream_arr.push(new Promise(function (resolve) {
        spriteData.css
          .pipe(gulp.dest(path.join(paths.cssSrc, 'sprite')))
          .on('end', resolve);
      }));
    })

  }

  return Promise.all(stream_arr);
});

gulp.task('makeSpriteMap', ['makeSprite'], function () {
  const folders = getFolders(paths.spriteSrc);
  if (!folders) return;

  const options = {
    maps: {
      handlebars: {
        prefix: 'sp_',
        path: path.posix.relative(path.posix.join(paths.cssSrc, 'import'),path.posix.join(paths.cssSrc, 'sprite')),
        import: folders
      }
    }
  };
  console.log(options.maps.handlebars.import)

  return gulp.src('gulpconf/sprite_maps_template.hbs')
    .pipe(plumber(globalOptions.notify))
    .pipe(handlebars(options.maps.handlebars))
    .pipe(rename('_sprite_maps.scss'))
    .pipe(gulp.dest(path.join(paths.cssSrc, 'import')));
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
