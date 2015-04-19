# Vert.x 3.x web-site

# The Vert.x 3.0 web-site repository

**Browse the (experimental, work in progress) [Vert.x 3.0 web-site](http://vert-x3.github.io/)**

This repository contains the Vert.x 3.x web site.

This includes both the static site and the documentation.

The documentation is generated, by pulling in the *-html.zip files created by sub projects (e.g. vertx-core, vertx-lang-js)
and unzipping them into the site.

## Building

You can build the site with `mvn site`. This will assemble and transform the various parts of the site and place
it in `target/site`.

## Building continuously during development

If you only change the site pages, you can activate the gulp watch mode (after having built the site once) with
`gulp watch`. This will scan for changes and rebuild the part of the site that needs to be refreshed.

The documentation pages will not be rebuilt continuously. If you change the header or footer templates and
want to update the documentation pages, you need to stop the watch mode with `Ctrl+C` and start it again
with `gulp watch`.

## Previewing during development

`gulp watch` starts a small embedded web server that lets you preview the website under
`http://localhost:4000`. The port can be changed in the `gulpfile.js` file.

## A word on URLs

All URLs and links in the website should be absolute. You can use the template
string `{{ site_url }}` to make a relative URL absolute. For example, if you
want to add a link to the documentation pages, use the following HTML tag:
`<a href="{{ site_url }}docs">...</a>`. The global `site_url` variable already
contains a trailing slash. You can configure it in the `gulpfile.js` file.

Heads up: keeping all URLs absolute allows us to quickly move the web-site to another
path on the web server by just changing the global `site_url` variable.

## Publishing

Run `mvn site-deploy` to publish the site to your GitHub account. Configure the
correct URL to your repository in the `pom.xml` file.
