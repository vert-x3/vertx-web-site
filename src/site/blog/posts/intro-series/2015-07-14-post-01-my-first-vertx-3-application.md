---
title: My first Vert.x 3 Application
template: post.html
date: 2015-07-14
author: cescoffier
---

Let's say, you heard someone saying that Vert.x is _awesome_. Ok great, but you may want to try it by yourself. Well, the next natural question is "where do I start ?". This post is a good starting point. It shows how is built a very simple vert.x application (nothing fancy), how it is tested and how it is packaged and executed. So, everything you need to know before building your own groundbreaking application.

The code developed in this post is available on [github](https://github.com/cescoffier/my-vertx-first-app). This post is part of the _Introduction to Vert.x series_. The code of this post in in the [post-1 branch](https://github.com/cescoffier/my-vertx-first-app/tree/post-1).

## Let's start !

First, let's create a project. In this post, we use Apache Maven, but you can use Gradle or the build process tool you prefer. You could use the Maven jar archetype to create the structure, but basically, you just need a directory with:

1. a `src/main/java` directory
2. a `src/test/java` directory
3. a `pom.xml` file

So, you would get something like:

```
.
├── pom.xml
├── src
│   ├── main
│   │   └── java
│   └── test
│       └── java
```

Let's create the `pom.xml` file with the following content:

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                      http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>io.vertx.blog</groupId>
  <artifactId>my-first-app</artifactId>
  <version>1.0-SNAPSHOT</version>

  <dependencies>
    <dependency>
      <groupId>io.vertx</groupId>
      <artifactId>vertx-core</artifactId>
      <version>3.0.0</version>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.3</version>
        <configuration>
          <source>1.8</source>
          <target>1.8</target>
        </configuration>
      </plugin>
    </plugins>
  </build>

</project>
```

This `pom.xml` file is pretty straightforward:

* it declares a dependency on `vertx-core`
* it configures the _maven-compiler-plugin_ to use Java 8.

This second point is important, Vert.x applications require Java 8.

## Let's code !

Ok, now we have made the `pom.xml` file. Let's do some real coding... Create the `src/main/java/io/vertx/blog/first/MyFirstVerticle.java` file with the following content:

```java
package io.vertx.blog.first;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;

public class MyFirstVerticle extends AbstractVerticle {

  @Override
  public void start(Future<Void> fut) {
    vertx
        .createHttpServer()
        .requestHandler(r -> {
          r.response().end("<h1>Hello from my first " +
              "Vert.x 3 application</h1>");
        })
        .listen(8080, result -> {
          if (result.succeeded()) {
            fut.complete();
          } else {
            fut.fail(result.cause());
          }
        });
  }
}
```

This is actually our not fancy application. The class extends `AbstractVerticle`. In the Vert.x world, a _verticle_ is a component. By extending `AbstractVerticle`, our class gets access to the `vertx` field.

The `start` method is called when the verticle is deployed. We could also implement a `stop` method, but in this case Vert.x takes care of the garbage for us. The `start` method receives a `Future` object that will let us inform Vert.x when our start sequence is completed or report an error. One of the particularity of Vert.x is its asynchronous / non-blocking aspect. When our verticle is going to be deployed it won't wait until the start method has been completed. So, the `Future` parameter is important to notify of the completion.

The `start` method creates a HTTP server and attaches a request handler to it. The request handler is a lambda, passed in the `requestHandler` method, called every time the server receives a request. Here, we just reply `Hello ...` (nothing fancy I told you). Finally, the server is bound to the 8080 port. As this may fails (because the port may already be used), we pass another lambda expression checking whether or not the connection has succeeded. As mentioned above it calls either `fut.complete` in case of success or `fut.fail` to report an error.

Let's try to compile the application using:

```bash
mvn clean compile
```

Fortunately, it should succeed.

That's all for the application.

## Let's test

Well, that's good to have developed an application, but we can never be too careful, so let's test it. The test uses JUnit and [vertx-unit](http://vertx.io/docs/vertx-unit/java/) - a framework delivered with vert.x to make the testing of vert.x application more natural.

Open the `pom.xml` file to add the two following dependencies:

```xml
<dependency>
  <groupId>junit</groupId>
  <artifactId>junit</artifactId>
  <version>4.12</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>io.vertx</groupId>
  <artifactId>vertx-unit</artifactId>
  <version>3.0.0</version>
  <scope>test</scope>
</dependency>
```

Now create the `src/test/java/io/vertx/blog/first/MyFirstVerticleTest.java` with the following content:

```java
package io.vertx.blog.first;

import io.vertx.core.Vertx;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(VertxUnitRunner.class)
public class MyFirstVerticleTest {

  private Vertx vertx;

  @Before
  public void setUp(TestContext context) {
    vertx = Vertx.vertx();
    vertx.deployVerticle(MyFirstVerticle.class.getName(),
        context.asyncAssertSuccess());
  }

  @After
  public void tearDown(TestContext context) {
    vertx.close(context.asyncAssertSuccess());
  }

  @Test
  public void testMyApplication(TestContext context) {
    final Async async = context.async();

    vertx.createHttpClient().getNow(8080, "localhost", "/",
     response -> {
      response.handler(body -> {
        context.assertTrue(body.toString().contains("Hello"));
        async.complete();
      });
    });
  }
}
```

This is a JUnit test for our verticle. The test uses vertx-unit, so we use a custom runner. vert.x-unit makes easy to test asynchronous interactions, which are the basis of vert.x applications.

In the `setUp` method, we creates an instance of `Vertx` and deploy our verticle. You may have noticed that unlike the traditional JUnit `@Before` method, it receives a `TestContext`. This object lets us control the asynchronous aspect of our test. For instance, when we deploy our verticle, it starts asynchronously, as most Vert.x interactions. We cannot check anything until it gets started correctly. So, as second argument of the `deployVerticle` method, we pass a result handler: `context.asyncAssertSuccess()`. It fails the test if the verticle does not start correctly. In addition it waits until the verticle has completed its start sequence. Remember, in our verticle, we call `fut.complete()`. So it waits until this method is called, and in the case of a failures, fails the test.

Well, the `tearDown` method is straightforward, and just terminates the `vertx` instance we created.

Let's now have a look to the test of our application: the `testMyApplication` method. The test emits a request to our application and checks the result.  Emitting the request and receiving the response is asynchronous. So we need a way to control this. As the `setUp` and `tearDown` methods, the test method receives a `TestContext`. From this object we creates an _async handle_ (`async`) that lets us notify the test framework when the test has completed (using `async.complete()`).

So, once the _async handle_ is created, we create a HTTP client and emits a HTTP request handled by our application with the `getNow()` method (`getNow` is just a shortcut for `get(...).end()`). The response is handled by a lambda. In this lambda we retrieves the response body by passing another lambda to the `handler` method. The `body` argument is the response body (as a `buffer` object). We check that the body contains the `"Hello"` String and declare the test complete.

Let's take a minute to mention the _assertions_. Unlike in traditional JUnit tests, it uses `context.assert...`. Indeed, if the assertion fails, it will interrupt the test immediately. So it's pretty important to always uses these assertion methods because of the asynchronous aspect of the Vert.x application and so tests.

Our test can be run from an IDE, or using Maven:

```bash
mvn clean test
```

## Packaging

So, let's sum up. We have an application and a test. Well, let's now package the application. In this post we package the application in a _fat jar_. A _fat jar_ is a standalone executable Jar file containing all the dependencies required to run the application. This is a very convenient way to package Vert.x applications as it's only one file. It also make them easy to execute.

To create a _fat jar_, edit the `pom.xml` file and add the following snippet just before `</plugins>`:

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-shade-plugin</artifactId>
  <version>2.3</version>
  <executions>
    <execution>
      <phase>package</phase>
      <goals>
        <goal>shade</goal>
      </goals>
      <configuration>
        <transformers>
          <transformer
            implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
            <manifestEntries>
              <Main-Class>io.vertx.core.Starter</Main-Class>
              <Main-Verticle>io.vertx.blog.first.MyFirstVerticle</Main-Verticle>
            </manifestEntries>
          </transformer>
        </transformers>
        <artifactSet/>
        <outputFile>${project.build.directory}/${project.artifactId}-${project.version}-fat.jar</outputFile>
      </configuration>
    </execution>
  </executions>
</plugin>
```

It uses the [maven-shade-plugin](https://maven.apache.org/plugins/maven-shade-plugin/) to create the `fat jar`. In the `manifestEntries` it indicates the name of our verticle. You may wonder from where comes the `Starter` class. It's actually a class from vert.x, that is going to create the `vertx` instance and deploy our verticle.

So, with this plugin configured, let's launch:

```bash
mvn clean package
```

This is going to create `target/my-first-app-1.0-SNAPSHOT-fat.jar` embedding our application along with all the dependencies (including vert.x itself).

## Executing our application

Well, it's nice to have a _fat jar_, but we want to see our application running! As said above, thanks to the _fat jar_ packaging, running Vert.x application is easy as:

```bash
java -jar target/my-first-app-1.0-SNAPSHOT-fat.jar
```

Then, open a browser to http://localhost:8080.

To stop the application, hit `CTRL+C`.

## Conclusion

This Vert.x 3 crash class has presented how you can develop a simple application using Vert.x 3, how to test it, package it and run it. So, you now know everything you need to build amazing system on top of Vert.x 3. Next time we will see how to [configure our application](/blog/vert-x-application-configuration/).

Happy coding &amp; Stay tuned !
