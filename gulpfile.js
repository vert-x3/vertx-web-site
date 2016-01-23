var bower = require("gulp-bower");
var compress = require("compression");
var connect = require("connect");
var contributors = require("./src/main/community/contributors.js");
var contributorsGen = require("./src/generated/community/contributors-gen.js");
var Crawler = require("simplecrawler");
var decompress = require("gulp-decompress");
var del = require("del");
var flatten = require("gulp-flatten");
var fs = require("fs");
var generateDistributionInfo = require("./src/main/tasks/generate-distribution-info.js");
var githubConfig = require("./github.json");
var gulp = require("gulp");
var gutil = require("gulp-util");
var iconfilter = require("./src/main/filters/iconfilter.js");
var inject = require("gulp-inject-string");
var materials = require("./src/main/materials/materials.js");
var mkdirp = require("mkdirp");
var path = require("path");
var prettyHrtime = require("pretty-hrtime");
var projectData = require("./target/data/data.json");
var rename = require("gulp-rename");
var replace = require("gulp-replace");
var request = require("request");
var serveStatic = require("serve-static");
var source = require("vinyl-source-stream");
var streamify = require("gulp-streamify");
var swig = require("swig");
var updateContributors = require("./src/main/tasks/update-contributors.js");
var users = require("./src/main/whos_using/users.js");

var Metalsmith = require("metalsmith");
var archive = require("metalsmith-archive");
var assets = require("metalsmith-assets");
var autoprefixer = require("metalsmith-autoprefixer");
var cleanCSS = require("metalsmith-clean-css");
var define = require("metalsmith-define");
var htmlMinifier = require("metalsmith-html-minifier");
var ignore = require("metalsmith-ignore");
var less = require("metalsmith-less");
var templates = require("metalsmith-templates");
var branch = require('metalsmith-branch')
var markdown = require('metalsmith-markdown')
var metallic = require('metalsmith-metallic');
var collections = require('metalsmith-collections');
var drafts = require('metalsmith-drafts');
var permalinks = require('metalsmith-permalinks');
var paginate = require('metalsmith-paginate');
var moment = require('moment');
var excerpts = require('metalsmith-excerpts');
var swigHelpers = require('metalsmith-swig-helpers');

var admonitions = require("./src/main/admonition/admonition.js");


// path to website on the server in production mode (i.e. when running
// `gulp build`). MUST BE ABSOLUTE AND MUST END WITH A SLASH!
var contextPath = "/";

// path to website on the server in development mode (i.e. when running
// `gulp watch`). MUST BE ABSOLUTE AND MUST END WITH A SLASH!
var contextPathDev = "/";

// port to listen to in development mode (i.e. when running `gulp watch`)
var devPort = 4000;

// website url in production mode (must be absolute; protocol and host may be omitted)
var siteUrl = "http://" + projectData.host + contextPath;

// website url in development mode (must be absolute; protocol and host may be omitted)
var siteUrlDev = "http://localhost:" + devPort + contextPathDev;

// paths to source files
var paths = {
  bootstrap_js: "bower_components/bootstrap/dist/js/bootstrap.min.js",
  docs_generated: "target/docs-generated",
  entypo: "Entypo+",
  less_includes: [
    "src/site/stylesheets",
    "src/main/less",
    "bower_components/bootstrap/less"
  ],
  src: "src/site",
  src_gen: "src/generated",
  site: "target/site",
  vertx2: "src/main/vertx2",
  target_asciidoctor_bs_themes: "target/asciidoctor-bs-themes",
  target_distributioninfo: "target/distribution-info/distribution-info.json",
  target_docs: "target/site/docs",
  target_icons: "target/site/assets/icons",
  target_scripts: "target/site/javascripts",
  target_stylesheets: "target/site/stylesheets",
  target_vertx2: "vertx2",
  templates: "src/main/templates"
};

/**
 * Prepare the given array of contributors. Sort it according to the number
 * of contributions and the github_id
 * @param contributors the array to prepare
 * @param addGenerated true if all auto-generated contributors should be added
 * to the result
 * @return the prepared array of contributors
 */
function prepareContributors(contributors, addGenerated) {
  var contributors = contributors.slice(0);
  contributorsGen.contributors.forEach(function(gc) {
    var found = false;
    for (var i = 0; i < contributors.length; ++i) {
      var c = contributors[i];
      if (c.github_id === gc.github_id) {
        c.contributions = gc.contributions;
        found = true;
        break;
      }
    }
    if (!found && addGenerated) {
      contributors.push(gc);
    }
  });
  contributors.sort(function(a, b) {
    var r = (b.contributions || 0) - (a.contributions || 0);
    if (r == 0) {
      r = a.github_id.localeCompare(b.github_id);
    }
    return r;
  });
  return contributors;
}

/**
 * Remove full-time devs and component maintainers from the given array of
 * contributors
 */
function removeFullTimeDevsAndMaintainers(cs) {
  var toremove = contributors.full_time_developers.concat(contributors.maintainers);
  var result = [];
  cs.forEach(function(c) {
    var found = false;
    for (var i = 0; i < toremove.length; ++i) {
      if (toremove[i].github_id === c.github_id) {
        found = true;
        break;
      }
    }
    if (!found) {
      result.push(c);
    }
  });
  return result;
}

// build site
function build(done, dev) {
  var useTemplateCache = dev ? false : undefined;
  if (!useTemplateCache) {
    swig.setDefaults({ cache: false });
  }

  swig.setTag("icon", iconfilter.parse, iconfilter.compile, iconfilter.ends, iconfilter.block);

  var site_url = siteUrl;
  if (dev) {
    site_url = siteUrlDev;
  }

  // Extract the project version from the generated project data.
  var project_version = projectData.version;

  // prepare contributors
  var sorted_contributors = prepareContributors(contributors.contributors, true);
  var sorted_maintainers = prepareContributors(contributors.maintainers, false);
  sorted_contributors = removeFullTimeDevsAndMaintainers(sorted_contributors);

  // get distribution info
  var distribution_info = require("./" + paths.target_distributioninfo);
  distribution_info = distribution_info[project_version];

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

    // hide drafts - require to hide the _not yet ready_ posts
    .use(drafts())

    // Blog

    .use(swigHelpers({
      filters: {
        "xmldate": function(date) {
          return moment(date).format('ddd, DD MMM YYYY HH:mm:ss ZZ');
        },

        "date": function(date) {
          return moment(date).format('Do MMMM YYYY');
        },

        "day": function(date) {
          return moment(date).format('DD');
        },

        "link": function(url) {
          return site_url + url;
        },

        // Only for the blog page navigation.
        "page": function(num) {
          if (! num) {
            return site_url + "blog/";
          }
          return site_url + "blog/page-" + num + ".html";
        },

        "limit": function(collection, limit, start) {
          var out   = [], i, c;
          start = start || 0;
          for (i = c = 0; i < collection.length; i++) {
            if (i >= start && c < limit+1) {
              out.push(collection[i]);
              c++;
            }
          }
          return out;
        },

        "extractContent" : function(content) {
          if (! content) {
            return content;
          }
          if (typeof content.indexOf !== 'function'  || typeof content.substring !== 'function') {
            // Sometimes it's an object representing a char array.
            content = content.toString();
          }

          var begin = "<!--%%content%%-->";
          if (content.indexOf(begin) != -1) {
            content = content.substring(content.indexOf(begin) + begin.length);
          }

          if (content.indexOf("<!--%%end-of-content%%-->") != -1) {
            content = content.substring(0, content.indexOf("<!--%%end-of-content%%-->"));
          }

          return content;
        },

        "admonition" : function(content) {
          if (! content) {
            return content;
          }
          if (typeof content.indexOf !== 'function'  || typeof content.replace !== 'function') {
            // Sometimes it's an object representing a char array.
            content = content.toString();
          }
          return admonitions.all(content);
        }

      }
    }))

    // Posts are in site/blog/post as markdown files
    // We generate a collections
    .use(collections({
      blog: {
        pattern: '**/blog/posts/**/*.md',
        sortBy: 'date',
        reverse: true
      }
    }))
    .use(archive({
      collections: 'blog',
      locale: 'en'
    }))
    .use(paginate({
      perPage: 6,
      path: ':collection/page'
    }))

    // Declare a branch to compute the permalinks (for the posts)
    .use( branch()
      .pattern('**/blog/**/*.md')
      .use(metallic())
      .use(markdown(
        {
          gfm: true,
          tables: true,
          smartLists: true,
          smartypants: true
        }
      ))
      .use(permalinks({
        pattern: ':collection/:title'
      }))
      .use(excerpts()) // Must be after markdown (HTML content)
    )

    // End of blog


    // define global variables for templates
    .use(define({
      "site_url": site_url,
      "project_version" : project_version,
      "distribution_info": distribution_info,
      "full_time_developers": contributors.full_time_developers,
      "maintainers": sorted_maintainers,
      "contributors": sorted_contributors,
      "conferences": materials.conferences,
      "articles": materials.articles,
      "users_home_page": users.users_home_page,
      "users_all": users.users_all
    }))

    // apply template engine in-place
    .use(templates({
      engine: "swig",
      cache: useTemplateCache,
      pattern: "**/*.html",
      inPlace: true
    }))

    // apply templates (e.g. header, footer)
    .use(templates({
      engine: "swig",
      cache: useTemplateCache,
      pattern: "**/*.html", // Include html
      directory: paths.templates
    }))
    // apply templates (e.g. header, footer)
    .use(templates({
      engine: "swig",
      cache: useTemplateCache,
      pattern: "**/*.xml", // for the feed.xml
      directory: paths.templates
    }))

    // minify HTML
    .use(htmlMinifier())

    // copy old Vert.x 2 website
    .use(assets({
      source: paths.vertx2,
      destination: paths.target_vertx2
    }))

    // build site
    .build(done);
}

// build docs
function buildDocs(done, dev) {
  var site_url = siteUrl;
  if (dev) {
    site_url = siteUrlDev;
  }

  Metalsmith(__dirname)
    .source(paths.docs_generated)
    .destination(paths.target_docs)

    // do not remove files already in the target directory
    .clean(false)

    // define global variables for templates
    .use(define({
      "site_url": site_url
    }))

    // apply templates
    .use(templates({
      engine: "swig",
      directory: paths.templates,
      pattern: "**/*.html"
    }))

    // limit concurrency to avoid "EMFILE: too many open files" error
    .concurrency(1000)

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

// copy svg icons
gulp.task("icons", function() {
  return gulp.src(path.join(paths.entypo, "**/*.svg"))
    .pipe(flatten())
    .pipe(rename(function(path) {
      // rename 'resize-100%.svg' because the maven-scm-publish-plugin has
      // problems with the percent sign which it considers an escape character
      if (path.basename === "resize-100%") {
        path.basename = "resize-100"
      }
    }))
    .pipe(replace(/id="[^"]+"/, 'id="icon"')) // set id of all icons to a fixed value so we can reference it easier
    .pipe(gulp.dest(path.join(paths.target_icons, "entypo")));
});

// copy required javascripts
gulp.task("scripts", ["bower"], function() {
  return gulp.src(paths.bootstrap_js)
    .pipe(gulp.dest(paths.target_scripts));
});

// build docs
gulp.task("site-docs", function(done) {
  buildDocs(done);
})

// build site
gulp.task("site", ["icons", "scripts", "site-docs", "install-asciidoc-bs-themes",
    "generate-distribution-info"], function(done) {
  build(done);
});

// build site in development mode
gulp.task("site-dev", ["site"], function(done) {
  buildDocs(function() {
    build(done, true);
  }, true);
});

function startDevServer(done) {
  // start web server
  var app = connect();
  app.use(compress());
  app.use(contextPathDev, serveStatic(paths.site, {
    "index": ["index.html"]
  }));
  return app.listen(devPort, function() {
    gutil.log("Listening on port", gutil.colors.cyan("4000"), "...");
    if (done) {
      done();
    }
  });
}

// start a web server, watch source directory and rebuild if necessary
gulp.task("watch", ["site-dev"], function() {
  startDevServer();
  return gulp.watch([paths.src + "/**/*", paths.templates + "/**/*"], {}, function() {
    gutil.log("Rebuilding ...");
    var start = process.hrtime();
    build(function() {
      gutil.log("Finished", "'" + gutil.colors.cyan("rebuilding") + "'",
        "after", gutil.colors.magenta(prettyHrtime(process.hrtime(start))));
    }, true);
  });
});

gulp.task("check-links", ["site-dev"], function(done) {
  var app = startDevServer(function() {
    gutil.log("Crawling site for broken links ...");
    var broken = 0;
    var crawler = Crawler.crawl(siteUrlDev)
    crawler.parseScriptTags = false;
    crawler.addFetchCondition(function(parsedURL) {
      return ["/vertx2/", "/feed.xml"].every(function(prefix) {
        return parsedURL.path.indexOf(prefix) != 0;
      });
    });
    crawler
      .on("fetch404", function(queueItem, response) {
        gutil.log("----");
        gutil.log("Resource not found:", queueItem.url);
        gutil.log("Location:", queueItem.referrer);
        broken++;
      })
      .on("complete", function(queueItem) {
        app.close();
        if (broken > 0) {
          gutil.log("----");
          gutil.log("Found " + broken + " broken links.");
        } else {
          gutil.log("No broken links found.");
        }
        done();
      });
  });
});

// generate info for the current distribution
gulp.task("generate-distribution-info", function(done) {
  mkdirp(path.dirname(paths.target_distributioninfo), function(err) {
    if (err) {
      done(err);
      return;
    }
    generateDistributionInfo(projectData.version, paths.target_distributioninfo, function(err, di) {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  })
});

// update the list of people who have contributed to vertx repositories
gulp.task("update-contributors", function() {
  return updateContributors(githubConfig.client_id, githubConfig.client_secret)
    .pipe(inject.wrap("// AUTO-GENERATED FILE. DO NOT EDIT! CALL `gulp update-contributors` INSTEAD.\n" +
      "// CREATED: " + Date() + "\nmodule.exports = { contributors: ", " };"))
    .pipe(gulp.dest(path.join(paths.src_gen, "main", "community")));
});

// clean target directory
gulp.task("clean", function(cb) {
  del([paths.site], cb);
});

// default task
gulp.task("default", ["site"]);
