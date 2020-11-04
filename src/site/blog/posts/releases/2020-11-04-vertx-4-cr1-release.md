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

#### Tracing control

When a component (i.e server or client) is involved in a Vert.x instance configured with tracing, a new
tracing policy controls the component participation in a trace:

- with _IGNORE_ the component will not be involved in the trace, e.g an HTTP client will not report
a span in an existing trace
- with _PROPAGATE_ the component will report a span and propagate when possible
- _ALWAYS_ the component will report a span or create a new trace

#### Kafka tracing

Our Kafka client is now able to propagate and report span in active traces.

#### Web

A new method has been added to `RoutingContext` to allow sending responses from asynchronous calls using
Vert.x futures.

For example, returning the content of a file in a single action:

```java
router.route()
  .respond(ctx ->
    vertx.fileSystem()
      .readFile("somefile.json"));
```

This method allows composition of `Future`s. The Future result will be processed by the `JSON` codec if no data has been written,
otherwise it will use the future success/failure to decide how to terminate the connection.

This method should improve the code readablility of current and future applications.

#### Web client auth

With this release you will be able to use `Basic`, `Digest` and `Bearer` authentication in a single and concise
API: `client.authentication(new Credentials(...))`. This is a type safe alternative to compute the headers yourself.

#### Redis client

Redis clients are now garanteed to call all handlers on the correct event loop. This reduces
context switches and remove possible races.

#### RabbitMQ client TLS support

RabbitMQ client can now connect using TLS.

#### SockJS JavaScript client versionning change

SockJS event bus JavaScript client is now versionned according to the EventBus bridge protocol
and is now independant on the Vert.x version.

That has always been the case and with Vert.x 4 we decided to make this change to simplify application
upgrade since upgrading Vert.x will not imply to upgrade event bus bridge clients.

In order to ensure that the artifact can be used both with Vert.x 3 and Vert.x 4, a new name has
 been choosen for it: [@vertx/eventbus-bridge-client.js](https://www.npmjs.com/package/@vertx/eventbus-bridge-client.js)

#### Finally

This is the first relase candidate of Vert.x 4, you can of course expect more as we get feedback from the community and fix issues that we failed to catch before.

You can also read the previous announces to know more about the overral changes:

- https://vertx.io/blog/eclipse-vert-x-4-beta-4-released
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
