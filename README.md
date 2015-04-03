# Vert.x 3.x web-site

# The Vert.x 3.0 web-site repository

**Browse the (experimental, work in progress) [Vert.x 3.0 web-site](http://vert-x3.github.io/)**

This repository contains the Vert.x 3.x web site.

This includes both the static site and the documentation.

The documentation is generated, by pulling in the *-html.zip files created by sub projects (e.g. vertx-core, vertx-lang-js)
and unzipping them into the site.

## Viewing the web-site during development

You can build the site with `mvn site`, this will assemble and transforms the various parts of the site and place
it in `target/site`.

If you only change the site pages, you can activate the jbake watch mode (after having build the site once) with
`mvn jbake:watch`, this will scan the changes and rebuild the part of the site that needs to be refreshed.

All CSS stylesheets are generated from SASS/SCSS sources. You can watch for changes on these files and have them recompiled automatically with `mvn sass:watch`.

You can preview the generated site with `mvn jetty:run`. Open your web browser and go to
<http://localhost:8080>.

## Publishing web-site

```
mvn site-deploy
```

