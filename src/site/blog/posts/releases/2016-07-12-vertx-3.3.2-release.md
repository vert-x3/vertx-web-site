---
title: Vert.x 3.3.2 is released !
date: 2016-07-12
template: post.html
author: cescoffier
---

We have just released Vert.x 3.3.2, the first bug fix release of Vert.x 3.3.x.

We have first released 3.3.1 that fixed a few bugs, but a couple of new bugs were discovered after 3.3.1 was tagged but not announced, we decided to release a 3.3.2 to fix the discovered bugs, as these bugs were preventing usage of Vert.x.

Vert.x 3.3.1 release notes:

* https://github.com/vert-x3/wiki/wiki/3.3.1---Release-Notes

Vert.x 3.3.2 release notes:

* https://github.com/vert-x3/wiki/wiki/3.3.2-Release-Notes

These releases do not contain breaking changes.

The event bus client using the SockJS bridge are available from NPM, Bower and as a WebJar:

* https://www.npmjs.com/package/vertx3-eventbus-client
* https://github.com/vert-x3/vertx-bus-bower
* http://www.webjars.org/

Docker images are also available on the [Docker Hub](https://hub.docker.com/u/vertx/). The Vert.x distribution is also available from [SDKMan](http://sdkman.io/index.html) and [HomeBrew](http://brew.sh/).

The artifacts have been deployed to [Maven Central](http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22io.vertx%22%20AND%20v%3A%223.3.2%22) and you can get the distribution on [Bintray](https://bintray.com/vertx/downloads/distribution/3.3.2/view).

Happy coding !
