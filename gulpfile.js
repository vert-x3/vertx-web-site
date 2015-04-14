var compress = require("compression");
var connect = require("connect");
var del = require("del");
var gulp = require("gulp");
var gutil = require("gulp-util");
var prettyHrtime = require("pretty-hrtime");
var serveStatic = require("serve-static");
var swig = require("swig");

var Metalsmith = require("metalsmith");
var templates = require("metalsmith-templates");

var paths = {
  src: "src/site",
  site: "target/site",
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
    .clean(false) // do not remove files already in the target directory
    .use(templates({
      engine: "swig",
      cache: useTemplateCache,
      directory: paths.templates,
      pattern: "**/*.html"
    }))
    .build(done);
}

gulp.task("site", function(done) {
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
