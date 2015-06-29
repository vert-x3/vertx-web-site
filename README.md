# Vert.x 3.x web-site

[![Build Status](https://vertx.ci.cloudbees.com/buildStatus/icon?job=vert.x3-website)](https://vertx.ci.cloudbees.com/view/vert.x-3/job/vert.x3-website/)

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

## The blog

The site also hosts a _blog_. To write a blog post create a markdown file in
`src/site/blog/posts`. The file must use the `.md` extension.

The post must starts with some metadata contained in a _header_ part:

```
---
title: A Catchy Title
template: post.html
date: 2015-06-26
---
## Hello
...
```

Ech line contained between the `---` lines are metadata. Are **required**:

* **title**: the post title
* **template**: must be `post.html`
* **date**: the publication date. The date must be provided using the `YYYY-MM-DD` format

After the second `---`, you can start the post. To avoid messing up the style,
the first header (your title) should use `##`. Sub-section would use `###`.
The post are written in markdown, so code snippets are delimited using ` ``` `.

You can add a special metadata to hide the post from the web site:

```
draft: true
```

Drafts are not processed, so won't be generated at all.

The blog generates an Atom feed available on `http://vertx.io/feed.xml`.

## Publishing

Run `mvn site-deploy` to publish the site to your GitHub account. Configure the
correct URL to your repository in the `pom.xml` file.

## Update contributors

The file `src/main/community/contributors.js` contains a list of developers
working full time on Vert.x and other contributors. Change this file manually
to add new people.

To automatically generate a list of contributors who are not already defined
in `contributors.js` run `gulp update-contributors`. The script retrieves a list
of people who contributed to Vert.x projects (i.e. projects from the `vert-x3`
organisation on GitHub) and saves it to `src-gen/main/community/contributors-gen.js`.
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
