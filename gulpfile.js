var bower = require("gulp-bower");
var compress = require("compression");
var connect = require("connect");
var decompress = require("gulp-decompress");
var del = require("del");
var fs = require("fs");
var gulp = require("gulp");
var gutil = require("gulp-util");
var prettyHrtime = require("pretty-hrtime");
var request = require("request");
var serveStatic = require("serve-static");
var source = require("vinyl-source-stream");
var streamify = require("gulp-streamify");
var swig = require("swig");

var Metalsmith = require("metalsmith");
var autoprefixer = require("metalsmith-autoprefixer");
var cleanCSS = require("metalsmith-clean-css");
var ignore = require("metalsmith-ignore");
var less = require("metalsmith-less");
var templates = require("metalsmith-templates");

var paths = {
  bootstrap_js: "bower_components/bootstrap/dist/js/bootstrap.min.js",
  less_includes: [
    "src/site/stylesheets",
    "src/main/less",
    "bower_components/bootstrap/less"
  ],
  src: "src/site",
  site: "target/site",
  target_asciidoctor_bs_themes: "target/asciidoctor-bs-themes",
  target_scripts: "target/site/javascripts",
  target_stylesheets: "target/site/stylesheets",
  templates: "src/main/templates"
};

// build site
function build(done, dev) {
  var useTemplateCache = dev ? false : undefined;
  if (!useTemplateCache) {
    swig.setDefaults({ cache: false });
  }

  Metalsmith(__dirname)
    .source(paths.src)
    .destination(paths.site)

    // do not remove files already in the target directory
    .clean(false)

    // compile LESS sources to CSS
    .use(less({
      render: {
        paths: paths.less_includes
      }
    }))

    // remove LESS sources
    .use(ignore([
      "**/*.less"
    ]))

    // compress css
    .use(cleanCSS())

    // autoprefix css
    .use(autoprefixer())

    // apply templates
    .use(templates({
      engine: "swig",
      cache: useTemplateCache,
      directory: paths.templates,
      pattern: "**/*.html"
    }))

    // build site
    .build(done);
}

// install bower dependencies
gulp.task("bower", function() {
  return bower();
});

// download bootstrap themes for AsciiDoc
gulp.task("install-asciidoc-bs-themes", function(done) {
  if (fs.existsSync(paths.target_asciidoctor_bs_themes)) {
    done();
    return;
  }
  return request("https://github.com/nerk/asciidoctor-bs-themes/archive/92dd167181d3c4ea48061ad4cba40ebc99d7151a.tar.gz")
    .pipe(source("asciidoctor-bs-themes.tar.gz"))
    .pipe(streamify(decompress({ strip: 1 })))
    .pipe(gulp.dest(paths.target_asciidoctor_bs_themes));
});

// copy required javascripts
gulp.task("scripts", ["bower"], function() {
  return gulp.src(paths.bootstrap_js)
    .pipe(gulp.dest(paths.target_scripts));
});

// build site
gulp.task("site", ["scripts", "install-asciidoc-bs-themes"], function(done) {
  build(done);
});

// start a web server, watch source directory and rebuild if necessary
gulp.task("watch", ["site"], function() {
    // start web server
    var app = connect();
    app.use(compress());
    app.use(serveStatic(paths.site, {
        "index": ["index.html"]
    }));
    app.listen(4000, function() {
        gutil.log("Listening on port", gutil.colors.cyan("4000"), "...");
    });

    return gulp.watch([paths.src + "/**/*", paths.templates + "/**/*"], {}, function() {
        gutil.log("Rebuilding ...");
        var start = process.hrtime();
        build(function() {
            gutil.log("Finished", "'" + gutil.colors.cyan("rebuilding") + "'",
                "after", gutil.colors.magenta(prettyHrtime(process.hrtime(start))));
        }, true);
    });
});

// clean target directory
gulp.task("clean", function(cb) {
  del([paths.site], cb);
});

// default task
gulp.task("default", ["site"]);
