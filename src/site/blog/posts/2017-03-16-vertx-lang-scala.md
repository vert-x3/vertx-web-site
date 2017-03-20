---
title: Scala is here
template: post.html
date: 2017-03-20
author: codepitbull
---

## TL;DR
- Scala support for Vert.x is here!
- It is based on Scala 2.12, no support for 2.11 planned
- all Vert.x-modules are available in a Scala flavor
- It's awesome
- Get started [here](https://github.com/vert-x3/vertx-sbt-starter)

## Intro
The rise of [Scala](http://scala-lang.org/) as one of the most important languages on the JVM caught many (me included) by surprise. This hybrid of functional and imperative paradigms struck a chord with many developers. Thanks to Scala a lot of people who'd never have touched a language like Haskell got exposed to functional programming. This exposure was one of the driving forces to get streams and lambda into the JVM.

With the release of Vert.x 3.4.0 we finally introduced Scala to the family of supported languages: [vertx-lang-scala](https://github.com/vert-x3/vertx-lang-scala).

In this post I will introduce the new stack and how the power of Scala can be used in your favorite reactive toolkit.

## Basics
vertx-lang-scala is based on Scala 2.12. There are no plans to support 2.11.

All modules available for Vert.x are supported (you can check  [here](https://github.com/vert-x3/vertx-lang-scala/tree/master/vertx-lang-scala-stack) ).

[NOTE Future and Promise both need a ExecutionContext | Modules use the following naming-scheme: *io.vertx:&lt;name-of-vertx-module&gt;-scala_2.12:&lt;vertx-major-version&gt;*. The Scala version of *io.vertx:vert-web:3.4.0* would be *io.vertx:vertx-web-scala_2.12:3.4.0*.]

There is an sbt-based [quickstart-project](https://github.com/vert-x3/vertx-sbt-starter) available that will be updated for each Vert.x-release.

Please note: Although [sbt](http://www.scala-sbt.org/) is used in this quickstart it is by no means required. There are no special plugins involved so vertx-lang-scala can easily be used with [Gradle](https://docs.gradle.org/current/userguide/scala_plugin.html) or [Maven](https://github.com/davidB/scala-maven-plugin).

I use sbt as it is the default build system used for Scala projects.

## Quickstart
Let's get started by cloning the quickstart:

```bash
git clone git@github.com:vert-x3/vertx-sbt-starter.git
```

You just got the following things:

* An sbt project containing dependencies to Vert.x-core and Vert.x-web
* The ability to create a fat-jat via `sbt assembly`
* The ability to create a docker container via `sbt docker`
* A few example verticles
* Unit test examples
* a pre-configured Scala-shell inside sbt

We will now run the application to get some quick satisfaction. Use `sbt assembly` to produce the fat-jar followed by `java -jar target/scala-2.12/vertx-scala-sbt-assembly-0.1-SNAPSHOT.jar`. Now point your browser to [http://localhost:8666/hello](http://localhost:8666/hello) for a classic welcome message.

## The details
Open your IDE so we can take a look at what's going on under the hood. We start with the _HttpVerticle_.

```
package io.vertx.scala.sbt

import io.vertx.lang.scala.ScalaVerticle
import io.vertx.scala.ext.web.Router

import scala.concurrent.Future

class HttpVerticle extends ScalaVerticle { // <1>


  override def startFuture(): Future[Unit] = { // <2>
    val router = Router.router(vertx) // <3>
    val route = router
      .get("/hello")
        .handler(_.response().end("world"))

    vertx //<4>
      .createHttpServer()
      .requestHandler(router.accept)
      .listenFuture(8666, "0.0.0.0")  // <5>
        .map(_ => ()) // <6>
  }
}
```

1. _ScalaVerticle_ is the base class for all Scala-Verticles. It provides all required methods to integrate with the Vert.x-runtime.
2. There are two ways to start a Verticle. Overriding _startFuture_, like in this example, tells Vert.x to only consider the Verticle fully started after the returned _Future[Unit]_ has been successfully completed. Alternatively one can override _start_ and by that signal to Vert.x the instant availability of the Verticle.
3. This block creates a _Router_ for incoming HTTP-requests. It registers a handler to answer with "world" if a request to the URL "/hello" arrives. The class is coming from the [Vert.x-web-module](http://vertx.io/docs/vertx-web/scala/).
4. Every Verticle has access to the Vert.x-instance. Here we use it to create a webserver and register our router to handle incoming requests.
5. We finally reached the reason why I use _startFuture_ in the first place. All operations in Vert.x are asynchronous. So starting the webserver most definitely means it takes some more time until it bound to the given port (8666 in this case). That's why _listenFuture_ is used, which returns a _Future_ which in turn contains the actual instance of the webserver that just got started. So our Verticle will be ready to receive requests *after* the returned _Future_ has been completed.
6. In most cases we can return the _Future_ directly. In this case the _Future_ returned by _listenFuture_ has the wrong type. We get a _Future[HttpServer]_ but we need a _Future[Unit]_ as you can see in the signature of _startFuture_. This call takes care of mapping the given _Future[HttpServer]_ to the required return type.

## Testing
I use [ScalaTest](http://www.scalatest.org/) for all my testing needs. It comes with stellar support for asynchronous operations and is a perfect fit for testing Vert.x-applications.

The following _HttpVerticleSpec_ shows how to test an HTTP-API using only Vert.x-classes. Personally I prefer [REST-assured](http://rest-assured.io/) with its rich DSL. For this post I wanted to stick with Vert.x-API, so here we go.

```scala
package io.vertx.scala.sbt

import org.scalatest.Matchers

import scala.concurrent.Promise

class HttpVerticleSpec extends VerticleTesting[HttpVerticle] with Matchers { // <1>

  "HttpVerticle" should "bind to 8666 and answer with 'world'" in { // <2>
    val promise = Promise[String] // <3>

    vertx.createHttpClient()  // <4>
      .getNow(8666, "127.0.0.1", "/hello",
        r => {
          r.exceptionHandler(promise.failure)
          r.bodyHandler(b => promise.success(b.toString))
        })

    promise.future.map(res => res should equal("world")) // <5>
  }

}
```

1. _VerticleTesting_ is a base class for your tests included with the quickstart-project. It's a small helper that takes care of deploying/un-deploying the Verticle to be tested and manages a Vert.x-instance. It additionally extends [AsyncFlatSpec](http://www.scalatest.org/user_guide/async_testing) so we can use Futures as test-return-types.
2. Isn't it nice and readable?
3. The promise is required as the whole test will run async
4. We use the vertx-instance provided by _VerticleTesting_ to create a Netty-based HttpClient. We instruct the client to call the specified URL and to succeed the _Promise_ with the returned body.
5. This creates the actual assertion. After getting the _Future_ from the _Promise_ an assertion is created: *The Result should be equal to the String "world"*. ScalaTest takes care of evaluating the returned _Future_.

That's all you need to get started!

## Futures in vertx-lang-scala
Now for a more in depth topic I think is worth mentioning. vertx-lang-scala treats async operations the Scala-way which is a little different from what you might be used from Vert.x. For async operations like subscribing to the eventbus or deploying a Verticle you would call a method like this:

```scala
vertx.deployVerticle("com.foo.OtherVerticle", res -> {
  if (res.succeeded()) {
    startFuture.complete();
  } else {
    startFuture.fail(res.cause());
  }
});
```

The _deployVerticle_ method takes the Verticle-name and a _Handler[AsyncResult]_ as its arguments. The _Handler[AsyncResult]_ is called after Vert.x tried deploying the Verticle. This style can also be used for Scala (which might ease the transition when coming from the Java-world) but their is a way more _scalaish_ way of doing this.

For every method taking a _Handler[AsyncResult]_ as its argument I create an alternative method using [Scala-Futures](http://docs.scala-lang.org/overviews/core/futures.html).

```scala
vertx.deployVerticleFuture("com.foo.OtherVerticle") // <1>
  .onComplete{  // <2>
    case Success(s) => println(s"Verticle id is: $s") // <3>
    case Failure(t) => t.printStackTrace()
  }
```

1. A method providing a _Future_ based alternative gets *Future* appended to its name and returns a _Future_ instead of taking a _Handler_ as its argument.
2. We are now free to use _Future_ the way we want. In this case onComplete is used to react on the completion.
3. Pattern matching on the result *&lt;3*

I strongly recommend using this approach over using _Handlers_ as you won't run into Callback-hell and you get all the goodies Scala provides for async operations.

[NOTE Future and Promise both need a ExecutionContext | The [VertxExecutionContext](https://github.com/vert-x3/vertx-lang-scala/blob/master/vertx-lang-scala/src/main/scala/io/vertx/lang/scala/VertxExecutionContext.scala) is made implicitly available inside the [ScalaVerticle](https://github.com/vert-x3/vertx-lang-scala/blob/master/vertx-lang-scala/src/main/scala/io/vertx/lang/scala/ScalaVerticle.scala). It makes sure all  operations are executed on the correct Event Loop. If you are using Vert.x without Verticles you have to provide it on your own.
]

## Using the console
A great feature of sbt is the embedded, configurable Scala-console. The console available in the quickstart-project is pre-configured to provide a fresh Vert.x-instance and all required imports so you can start playing around with Vert.x in an instant.

Execute the following commands in the project-folder to deploy the _HttpVerticle_:

```bash
sbt
> console
scala> vertx.deployVerticle(nameForVerticle[HttpVerticle])
scala> vertx.deploymentIDs
```

After  executing this sequence you can now point your browser [http://localhost:8666/hello](http://localhost:8666/hello) to see our message. The last command issued shows the Ids under which Verticles have been deployed.

To get rid of the deployment you can now type `vertx.undeploy(vertx.deploymentIDs.head)`.

## That's it!
This was a very quick introduction to our new Scala-stack. I hope to have given you a little taste of the Scala goodness now available with Vert.x. I recommend digging a little more through the quickstart to get a feeling for what's there.
In my next blog post I will explain some of the decisions I made and the obstacles I faced with the differences between Java and Scala /Hint: They are way bigger than I was aware of).

Enjoy!
