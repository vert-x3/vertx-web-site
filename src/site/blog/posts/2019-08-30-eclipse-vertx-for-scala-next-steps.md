---
title: Eclipse Vert.x for Scala next steps
template: post.html
date: 2019-08-30
author: codepitbull
---

# Scala for Eclipse Vert.x: The next steps

## TL;DR

- No Scala 2.13 in Eclipse Vert.x 3.x due to increased support burden
- New value classes based approach for Vert.x 4

## Retrospective

It's been more than two years since the inception of `vert-lang-scala` to the Vert.x ecosystem. And almost as long since I wrote my first [blog post](https://vertx.io/blog/scala-is-here/) about it.

A lot has happened since March 2017:

- `vertx-lang-scala` kept up with new versions of Scala
- all Vert.x-modules are supported (35 so far)
- a Giter8 based [template](https://github.com/vert-x3/vertx-scala.g8) was added for easily bootstrapping a Vert.x-Scala-project
- Bugs were squashed

And most recently we received a great contribution by [Nikolaj Leischner](https://github.com/NikolajLeischner) who was kind enough to port the [techempowered](https://github.com/TechEmpower/FrameworkBenchmarks/tree/master/frameworks/Scala/vertx-web-scala) benchmark to vert-lang-scala. Which will be part of the next steps.

The numbers produced by this benchmark were very promising and and additional motivation to move to the next phase of Scala support for Vert.x.

## Old idea

Before getting to the new ideas I want to take a look at the "old" one.

The current version of vert-lang-scala is based around the idea of wrapping the Vert.x-API with a dedicated Scala-layer. That layer is created using a Freemarker-based code generator. I took this idea from the first try by Tim Fox for building that support.

Wrapping the existing Java-API was rather painful but gave me great flexibility to create an idiomatic Scala-API.

But an approach like that comes with a price:

- There are a lot of intermediate objects being created.
- Many unneccessary conversions between Java/Scala types

Both increased memory consumption and garbage collection activity quite a bit and has been bugging me from the beginning.

## New idea

With Vert.x 4 approaching I was finally able to invest time into the rework I had wanted to do for quite a while.

The core idea is to replace the current wrapping based approach with something more lightweight but native to the Scala-world.

And that's where [value classes](https://docs.scala-lang.org/overviews/core/value-classes.html) come in.

Value classes allow the extension of existing classes with additional methods. They make it easy to control **when** methods become visible and do that with a minimum of overhead. To be precise: A wrapping class is normally ever only instantiated **once**.

A good example is the addition of methods for wrapping the Vert.x approach of Promises with Scala-Futures. Each method returning a Vert.x-Promise needs to receive an alternative version which returns a Scala-Future.

In Vert.x 3 I achieved that by adding methods to the wrapper and giving them a distinct name. A method called **listen** returning a Promise would receive a companion called **listenFuture** in the Scala layer.

Let's look at how this looks in the new approach:

```scala
package io.vertx.scala
package object core{
   implicit class HttpServerScala(val asJava: io.vertx.core.http.HttpServer) extends AnyVal {
      def listenFuture(port: java.lang.Integer): scala.concurrent.Future[io.vertx.core.http.HttpServer] = {..}
      ..
}
```

The code above does the following things:

- It creates a package object for **io.vertx.scala.core**
- it adds an implict class **HttpServerScala** to wrpa **HttpServer**
- it adds a **listenFuture** method

Using this method in code looks like this:

```scala
package io.vertx.scala.demo

import io.vertx.lang.scala.VertxExecutionContext
import io.vertx.scala.core._

import scala.util.{Failure, Success}

object Main {
  def main(args: Array[String]): Unit = {
    val vertx = Vertx.vertx()
    implicit val ec = VertxExecutionContext(vertx.getOrCreateContext())
    vertx
      .createHttpServer()
      .requestHandler(r => {
        r.response().end("bye")
      })
      .listenFuture(6667)
      .onComplete {
        case Success(_) => println("Started")
        case Failure(exception) => println("Failure")
      }
  }
}
```

Importing the package object using **import io.vertx.scala.core._** brings the extension method into scope and makes them available on all instances of **HttpServer**. In the example above **createHttpServer()** return such an instance and we can now use the idiomatic Scala way of handling a Future.

### Even more

Extending classes with Future-methods is only one of the new things to come. On top of that the support for DataObjects will be considerably improved, both through extending them and by providing type aliases.

I also switched from doing all conversions for collections automatically to handing the control back to the user. Something which gets even more important for Scala 2.13 and the new collection API.

### The downside

The clear downside of this approach is that the Java-methods will stay visible since the java-classes won't be wrapped but extended. This might lead to some confusion but I am pretty sure the benefits outweight this downside.

The bigger change will be the removal of automatic vonversion between Scala types (Long/Int/String and  Collections) and their Java counterparts. I spent considerable time trying to tune that part in the current version bbut always ended up hitting some edgecase. For now I've decided to have the user pick the right time to convert.

I might still add this feature in a later version if user feedback points into that direction.

## When will I get it?

First for the good news: There is already a [branch](https://github.com/vert-x3/vertx-lang-scala/tree/4.0) with a full implementation.

The bad news: It will break until Vert.x 4.0 is finally released.

Vert.x 4 is in active development with most APIs already finalized but breaking changes still happen. So use at your own risk!

## What about Scala 2.13?

Scala 2.13 has been released recently which prompted questions from the community about when it will be supported by Vert.x.

I haven't done a good job providing the results of our internal discussions on that topic to the community. So here we go:

- Vert.x 3 will stay on 2.12 for the following reasons:
  - Both are still actively supported
  - Scala ecosystems takes some time to do the switch to 2.13
  - We simply don't have the capacity to support both versions **AND** the upcoming new version
- Vert.x 4 will receive 2.13 support
  - Scala ecosystem will have moved closer to 2.13 adoption when Vert.x 4 comes out

## For the adventure seaker

I actually did a port of vertx-lang-scala 3.8 to Scala 2.13 and you can grab the work in this [branch](https://github.com/vert-x3/vertx-lang-scala/tree/3.8_2.13).

Don't expect **ANY** support for this branch. This was only an experiment to see how much I had to change for initial 2.13 support.

## Summary

Vert.x 4 will be an evolutionary step for vertx-lang-scala. Value classes promise to reduce both complexity and allocation rate, two things which have been bugging me quite a bit with the current approach.

I am eager to hear from you all what you think about this new direction.
