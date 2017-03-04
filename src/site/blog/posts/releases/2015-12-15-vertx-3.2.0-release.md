---
title: Vert.x 3.2.0 is released !
date: 2015-12-15
template: post.html
author: cescoffier
---

We are pleased to announce the release of Vert.x 3.2.0!

Some of the highlights of this release include:

* [vertx-lang-ceylon](http://vertx.io/docs/vertx-core/ceylon): the support of the [Ceylon language](http://ceylon-lang.org/)!

*	[vertx-tcp-bridge](http://vertx.io/docs/vertx-tcp-eventbus-bridge/java/): an event bus bridge that lets any TCP-capable application to interact with vert.x applications using the event bus.

*	[vertx-hawkular-metric](http://vertx.io/docs/vertx-hawkular-metrics/java/): an implementation of the vert.x metrics for [Hawkular](http://www.hawkular.org/). In addition, it lets you report your own metrics to hawkular.

* A new [stack manager](http://vertx.io/docs/vertx-stack-manager/stack-manager/) to configure the vert.x distribution with the content you want.

* [vertx-shell](http://vertx.io/docs/vertx-shell/java/) is now an official component.

* [vertx-jgroups](http://vertx.io/docs/vertx-jgroups/java/): an alternative implementation of the vert.x cluster manager using [JGroups](http://jgroups.org/). This component is a technical preview.


The release also contains many bug fixes and a ton of improvements. Full release notes can be found here:

https://github.com/vert-x3/wiki/wiki/3.2.0---Release-Notes

Breaking changes are here:

https://github.com/vert-x3/wiki/wiki/3.2.0-Breaking-changes

The event bus client using the SockJS bridge are available from NPM, Bower and as a WebJar:

* https://www.npmjs.com/package/vertx3-eventbus-client
* https://github.com/vert-x3/vertx-bus-bower
* http://www.webjars.org/

Dockers images are also available on the [Docker Hub](https://hub.docker.com/u/vertx/)
The vert.x distribution is also available from [SDKMan](http://sdkman.io/index.html).

Many thanks to all the committers and community whose contributions made this possible.

Next stop is Vert.x 3.3.0 which we hope to have out in March 2016.

The artifacts have been deployed to [Maven Central](http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22io.vertx%22%20AND%20v%3A%223.2.0%22)
 and you can get the distribution on [Bintray](https://bintray.com/vertx/downloads/distribution/3.2.0/view).
