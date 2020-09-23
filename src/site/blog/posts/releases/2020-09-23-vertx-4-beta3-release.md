---
title: Eclipse Vert.x 4 beta 3 released!
date: 2020-09-23
template: post.html
author: vietj
draft: true
---

We are extremely pleased to announce the third 4.0 beta release of Eclipse Vert.x .

Vert.x 4 is the evolution of the Vert.x 3.x series that will bring key features to Vert.x.

#### HTTP API improvements

Vert.x core HTTP client has been subject to a few extra improvements since Beta1.






#### HTTP tunnel creation improvements

#### WebSocket upgrade improvements

#### Future optimizations

#### Row to JSON conversion

#### HttpServerResponse send method

#### OAuth2/OIDC PKCE

`OAuth2Handler` can now handle [PKCE](https://tools.ietf.org/html/rfc7636), which means another layer of security to your application.

#### Redis RESP3

The redis client can now speak `RESP3` with redis servers. This means it can handle all the new types and APIs available on redis from all versions (RESP2, redis < 6) and (RESP3, redis >= 6).


#### Finally

This is the Beta1 relase of Vert.x 4, you can of course expect more betas as we get feedback from the community and fix issues that we failed to catch before.

You can also read the milestone announces to know more about the overral changes:

- https://vertx.io/blog/eclipse-vert-x-4-milestone-5-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-4-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-3-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-2-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-1-released

The [deprecations and breaking changes](https://github.com/vert-x3/wiki/wiki/4.0.0-Deprecations-and-breaking-changes)
 can be found on the wiki.

For this release there are no Docker images.

The release artifacts have been deployed to [Maven Central](https://search.maven.org/search?q=g:io.vertx%20AND%20v:4.0.0.Beta1) and you can get the distribution on [Maven Central](https://repo1.maven.org/maven2/io/vertx/vertx-stack-manager/4.0.0.Beta1/).

You can bootstrap a Vert.x 4.0.0.Beta1 project using https://start.vertx.io.

The documentation has been deployed on this preview web-site https://vertx-web-site.github.io/docs/

That's it! Happy coding and see you soon on our user or dev [channels](https://vertx.io/community).
