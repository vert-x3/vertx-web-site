---
title: Eclipse Vert.x 4 CR1 released!
date: 2020-11-04
template: post.html
author: vietj
draft: false
---

We are extremely pleased to announce the first release candidate of Vert.x 4.0 .

We consider Vert.x 4.0 as feature complete and we will do a few release candidates to
allow the community to test it and report issues.

Vert.x 4 is the evolution of the Vert.x 3.x series that will bring key features to Vert.x.

#### SockJS JavaScript client

Sockjs eventbus clients are now just published to `NPM` on bugfixes or protocol changes. This means there is no need to constantly upgrade NPM packages for every single release. In order to ensure that the artifact can be used both with vert.x 3 and vert.x 4, a new name has been choosen for it: [@vertx/eventbus-bridge-client.js](https://www.npmjs.com/package/@vertx/eventbus-bridge-client.js)

#### Kafka tracing

#### Tracing policy

#### MQTT improvements

#### Web client auth

With this release you will be able to use `Basic`, `Digest` and `Bearer` authentication in a single and concise API: `client.authentication(new Credentials(...))`. This is a type safe alternative to compute the headers yourself.

#### Redis client

Redis clients are now guaranteed to call all handlers on the right event loop. This reduces the context switches and avoid synchronization problems in the code.

#### RabbitMQ TLS support

#### Finally

This is the Beta3 relase of Vert.x 4, you can of course expect another beta as we get feedback from the community and fix issues that we failed to catch before.

You can also read the milestone announces to know more about the overral changes:

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

The release artifacts have been deployed to [Maven Central](https://search.maven.org/search?q=g:io.vertx%20AND%20v:4.0.0.CR1) and you can get the distribution on [Maven Central](https://repo1.maven.org/maven2/io/vertx/vertx-stack-manager/4.0.0.CR1/).

You can bootstrap a Vert.x 4.0.0.CR1 project using https://start.vertx.io.

The documentation has been deployed on this preview web-site https://vertx-web-site.github.io/docs/

That's it! Happy coding and see you soon on our user or dev [channels](https://vertx.io/community).
