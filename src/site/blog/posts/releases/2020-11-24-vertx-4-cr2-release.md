---
title: Eclipse Vert.x 4 CR2 released!
date: 2020-11-24
template: post.html
author: vietj
draft: false
---

We are extremely pleased to announce the first release candidate of Vert.x 4.0 .

We consider Vert.x 4.0 as feature complete and we will do a few release candidates to
allow the community to test it and report issues.

Vert.x 4 is the evolution of the Vert.x 3.x series that will bring key features to Vert.x.

Since this release candidate we have created a new [HomeBrew](http://brew.sh/) distribution
with a custom thirdparty repository ([TAP](https://docs.brew.sh/Taps)) and a vertx4 formula:

```
> brew tap vertx-distrib/tap
> brew install vertx4
```

This is the second relase candidate of Vert.x 4, you can of course expect more as we get feedback from the community and fix issues that we failed to catch before.

You can also read the previous announces to know more about the overral changes:

- https://vertx.io/blog/eclipse-vert-x-4-cr1-released
- https://vertx.io/blog/eclipse-vert-x-4-beta-3-released
- https://vertx.io/blog/eclipse-vert-x-4-beta-2-released
- https://vertx.io/blog/eclipse-vert-x-4-beta-1-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-5-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-5-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-4-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-3-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-2-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-1-released

The [deprecations and breaking changes](https://github.com/vert-x3/wiki/wiki/4.0.0-Deprecations-and-breaking-changes)
 can be found on the wiki.

For this release there are no Docker images.

The release artifacts have been deployed to [Maven Central](https://search.maven.org/search?q=g:io.vertx%20AND%20v:4.0.0.CR3) and you can get the distribution on [Maven Central](https://repo1.maven.org/maven2/io/vertx/vertx-stack-manager/4.0.0.CR2/).

You can bootstrap a Vert.x 4.0.0.CR2 project using https://start.vertx.io.

The documentation has been deployed on this preview web-site https://vertx-web-site.github.io/docs/

That's it! Happy coding and see you soon on our user or dev [channels](https://vertx.io/community).
