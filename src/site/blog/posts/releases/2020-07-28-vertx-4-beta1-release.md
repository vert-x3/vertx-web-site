---
title: Eclipse Vert.x 4 beta 1 released!
date: 2020-07-28
template: post.html
author: vietj
draft: true
---

We are extremely pleased to announce the first 4.0 beta release of Eclipse Vert.x .

Vert.x 4 is the evolution of the Vert.x 3.x series that will bring key features to Vert.x.

#### SQL client metrics

Vert.x 4 supports metrics for clients which are critical for monitoring application performance.

While the capabilities are generic and can apply to any client, each client needs a specific integration.
Obviously the SQL client was the perfect candidate in mind for this new feature.

Micrometer metrics will report these metrics as

* vertx_sql_queue_pending: number of requests scheduled but not yet executed
* vertx_sql_queue_time: time spent in queue before processing
* vertx_sql_processing_pending: number of request being processed
* vertx_sql_processing_time: requests latencies

#### A better API for JDBC Client

Our JDBC client will not go away in Vert.x 4, we do recknognize that JDBC is important because it supports
the most important number of databases in the ecosystem.

When we designed the SQL client API we strived a lot to come with the simplest and most powerful API
for asynchonous SQL client.

This release brings an implementation of the SQL client API for JDBC.

The 3.x API series will continue to be supported for the lifetime of Vert.x 4.

#### Event loop affinity

Using Vert.x from a non Vert.x thread is a very common use case we have been supporting since Vert.x 3.

When you use a Vert.x resource (like a client) from a non Vert.x thread, Vert.x 3 obtains a new event-loop
everytime it happens.

In Vert.x 4 we decided to pin the first event loop to the non Vert.x thread. The goal is to prevent
some data races and also makes reasonning about this easier.

```
Vertx vertx = Vertx.vertx();

for (int i = 0;i < 4;i++) {
  String msg = "Message " + i;
  vertx.runOnContext(v -> {
    System.out.println(i);
  });
}
```

Running this with Vert.x 3 will print the 4 lines but they are likely to not be reordered, this code could
also be running in parallel (that is two different threads running at the same time on a different CPU core).

Running this with Vert.x 4 will print the 4 lines in the correct order and always with the same thread. This
eliminates some potential data races and also allows to reason about what will happen at runtime.

#### Vert.x Json Schema supports Draft2019-09

The new [vertx-json-schema](https://github.com/eclipse-vertx/vertx-json-schema) module now supports the latest Json Schema [Draft2019-09 spec](http://json-schema.org/specification.html). You can finally play with the new `$recursiveRef` to build extensible recursive schemas and with `unevaluatedProperties`/`unevaluatedItems` to define strict schemas. Look at the module [documentation](https://vertx-web-site.github.io/docs/vertx-json-schema/java/) to start using it.

#### Clustering configuration simplified

In Vert.x 3, cluster host was set to `localhost` by default in `EventBusOptions`.
Consequently, a lot of new users were confused about why event bus consumers and producers were not able to communicate even if the underlying cluster manager was configured correctly.

Also, when using the CLI tool or the `Launcher` class, Vert.x tried to find a host among available network interfaces if none was provided with the `-cluster-host` argument.
Sometimes, the host chosen by the cluster manager and Vert.x were not the same.

Starting with Vert.x 4 beta 1, the cluster host default has been removed and, if users don't provide any, Vert.x will ask the cluster manager which one it picked before trying to find one itself.
This applies whether Vert.x is embedded in any Java program or started with the CLI tool or with the `Launcher` class.

So far, only `vertx-hazelcast` and `vertx-infinispan` cluster managers can provide Vert.x with a cluster host.
When other cluster managers are used, Vert.x will choose one itself.

#### Cluster manager upgrades

`vertx-hazelcast` has been upgraded to Hazelcast 4.0.2 and `vertx-infinispan` to Infinispan 11.0.1.Final.

#### Ramping up to Vert.x 4

Instead of developing all new features exclusively in Vert.x 4, we introduce some of these features in the 3.x branch
so the community can benefit from them. The Vert.x 4 development focus on more fundamental changes that cannot be done
in the 3.x series.

<img src="{{ site_url }}assets/blog/vertx-4-milestone4-release/vertx-4-timeline.png" alt="Screenshot" class="img-responsive">

This is the first beta relase of Vert.x 4, you can of course expect more betas as we get feedback from the community and fix issues that we failed to catch before.

You can also read the previous milestone announces:

- https://vertx.io/blog/eclipse-vert-x-4-milestone-4-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-3-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-2-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-1-released

#### Finally

The [deprecations and breaking changes](https://github.com/vert-x3/wiki/wiki/4.0.0-Deprecations-and-breaking-changes)
 can be found on the wiki.

For this release there are no Docker images.

The release artifacts have been deployed to [Maven Central](https://search.maven.org/search?q=g:io.vertx%20AND%20v:4.0.0.Beta1) and you can get the distribution on [Maven Central](https://repo1.maven.org/maven2/io/vertx/vertx-stack-manager/4.0.0.Beta1/).

You can bootstrap a Vert.x 4.0.0 beta 1 project using https://start.vertx.io.

The documentation has been deployed on this preview web-site https://vertx-ci.github.io/vertx-4-preview/docs/

That's it! Happy coding and see you soon on our user or dev [channels](https://vertx.io/community).
