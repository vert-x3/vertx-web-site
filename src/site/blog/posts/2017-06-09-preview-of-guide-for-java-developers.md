---
title: Preview of a guide for Java developers
template: post.html
date: 2017-06-09
author: jponge
---

I could not attend the last Eclipse Vert.x community face-to-face meeting last fall, but one item that was discussed is the need for guides aimed at certain types of developers.
One of my missions as part of joining the team was to work on this and I'm very happy to share it with you today!

## A gentle guide to asynchronous programming with Eclipse Vert.x for enterprise application developers

The guide is called **"A gentle guide to asynchronous programming with Eclipse Vert.x for enterprise application developers"** and it is an introduction to asynchronous programming with Vert.x, primarily aimed at developers familiar with mainstream non-asynchronous web development frameworks and libraries (e.g., Java EE, Spring).

Quoting the introduction:

_We will start from a wiki web application backed by a relational database and server-side rendering of pages; then we will evolve the application through several steps until it becomes a modern single-page application with "real-time" web features. Along the way you will learn to:_

1. _Design a web application with server-side rendering of pages through templates, and using a relational database for persisting data._
2. _Cleanly isolate each technical component as a reusable event processing unit called a verticle._
3. _Extract Vert.x services for facilitating the design of verticles that communicate with each other seamlessly both within the same JVM process or among distributed nodes in a cluster._
4. _Testing code with asynchronous operations._
5. _Integrating with third-party services exposing a HTTP/JSON web API._
6. _Exposing a HTTP/JSON web API._
7. _Securing and controlling access using HTTPS, user authentication for web browser sessions and JWT tokens for third-party client applications._
8. _Refactoring some code to use reactive programming with the popular RxJava library and its Vert.x integration._
9. _Client-side programming of a single-page application with AngularJS._
10. _Real-time web programming using the unified Vert.x event bus integration over SockJS._

The guide takes a gradual approach by starting with a "quick and dirty" solution, then refactoring it properly, exposing the core Vert.x concepts, adding features, and moving from callbacks to RxJava.

## We need your feedback!

The code is available at [https://github.com/vert-x3/vertx-guide-for-java-devs](https://github.com/vert-x3/vertx-guide-for-java-devs).
You can report feedback as Github issues to that repository and even offer pull-requests.

You can check it out from GitHub (the AsciiDoc is being rendered fine from the repository interface) or you can check out pre-rendered HTML and PDF versions that I am temporarily sharing and keeping up-to-date from my Dropbox: [https://www.dropbox.com/sh/ni9znfkzlkl3q12/AABn-OCi1CZfgbTzOU0jYQpJa?dl=0](https://www.dropbox.com/sh/ni9znfkzlkl3q12/AABn-OCi1CZfgbTzOU0jYQpJa?dl=0)

Many thanks to Thomas Segismont and Julien Viet who contributed some parts, and also to the people who reviewed it privately.

As usual, we welcome your feedback!

