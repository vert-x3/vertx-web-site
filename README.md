# Vert.x 3.x web-site

[![Build Status](https://travis-ci.org/vert-x3/vertx-web-site.svg?branch=master)](https://travis-ci.org/vert-x3/vertx-web-site)

# The Vert.x 3.0 web-site repository

This repository is containing the Vert.x Web Site source. The web site is available on: http://vertx.io.

## Building

### Building the production version

    mvn clean site

This will assemble and transform the various parts of the site and place it in `target/site`.

Then open `target/site/index.html`. Notice that all links targets `http://vertx.io`.

### Building a dev version with gulp

If you have gulp install and want to work on the web site with "hot redeploy" of your change:

    mvn clean site; gulp watch

Then open `http://localhost:4000`.

The documentation pages will not be rebuilt continuously. If you change the header or footer templates and
want to update the documentation pages, you need to stop the watch mode with `Ctrl+C` and start it again
with `gulp watch`.

**WARNING: because all URLs point to `localhost` you must `mvn clean` before deploying the production version at `vertx.io`.**

### Building a dev version with docker

(No hot-redeploy)

If you don't have gulp, you can build a version of the web site running in a docker container:

To build:
* Linux: `mvn site -Pdocker -Dhost=localhost:4000`
* Mac: `mvn site -Pdocker -Dhost=192.168.99.100:4000`

To run:

    docker run -p 4000:80 vert-x3/vertx-web-site

Open your browser to:
* Linux: `http://localhost:4000`
* Mac: `http://192.168.99.100:4000`

### Checking for broken links

You can run a gulp task that will build the website and then check for broken links.

    gulp check-links

Make sure you have built the website with `mvn site` first if you haven't done so already.

## A word on URLs

All URLs and links in the website should be absolute. You can use the template
string `{{ site_url }}` to make a relative URL absolute. For example, if you
want to add a link to the documentation pages, use the following HTML tag:
`<a href="{{ site_url }}docs">...</a>`. The global `site_url` variable already
contains a trailing slash. You can configure it in the `gulpfile.js` file.

Heads up: keeping all URLs absolute allows us to quickly move the web-site to another
path on the web server by just changing the global `site_url` variable.

In order to obtain nice URLs, all pages should be put in their own directory and
called index.html. For example, the entry page of the blog is under
`blog/index.html`. Therefore it can be reached under `http://vertx.io/blog`. If
you link to such a page always use the nice URL (without `index.html`).

## The blog

Read [BLOG.md](BLOG.md)

## Publishing

Run `./deploy.sh` to publish the site.

## Update contributors

The file `src/main/community/contributors.js` contains a list of developers
working full time on Vert.x and other contributors. Change this file manually
to add new people.

To automatically generate a list of contributors who are not already defined
in `contributors.js` run `gulp update-contributors`. The script retrieves a list
of people who contributed to Vert.x projects (i.e. projects from the `vert-x3`
organisation on GitHub) and saves it to `src/generated/community/contributors-gen.js`.
Never edit this file directly. It will always be overwritten by the
`update-contributors` gulp task.

The task creates a lot of requests against the GitHub API. GitHub limits
the number of requests for anonymous clients. In order to increase the limit
you need a client ID and secret. Go to <https://github.com/settings/developers>
and register a new application. Then edit `github.json` and enter your client ID
and secret.

Do not commit your client ID and secret to the repository! In order to
avoid that you accidentally publish your credentials, run
`git update-index --assume-unchanged github.json`. Git will then ignore all
local changes to the `github.json` file.
