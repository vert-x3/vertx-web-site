---
title: Vert.x Application Configuration
template: post.html
date: 2015-07-20
author: cescoffier
---

## Previously in 'Introduction to Vert.x'

In [this post]({{ site_url }}blog/my-first-vert-x-3-application/), we developed a very simple Vert.x 3 application, and saw how this application can be tested, packaged and executed. That was nice, isn't it ? Well, ok, that was only the beginning. In this post, we are going to enhance our application to support _external_ configuration.

So just to remind you, we have an application starting a HTTP server on the port 8080 and replying a polite "Hello" message to all HTTP requests. The previous code is available [here](https://github.com/cescoffier/my-vertx-first-app/tree/post-1). The code developed in this post is in the [post-2 branch](https://github.com/cescoffier/my-vertx-first-app/tree/post-2).

## So, why do we need configuration?

That's a good question. The application works right now, but well, let's say you want to deploy it on a machine where the port 8080 is already taken. We would need to change the port in the application code and in the test, just for this machine. That would be sad. Fortunately, Vert.x applications are configurable.

Vert.x configurations are using the JSON format, so don't expect anything complicated. They can be passed to verticle either from the command line, or using an API. Let's have a look.

## No '8080' anymore

The first step is to modify the `io.vertx.blog.first.MyFirstVerticle` class to not bind to the port 8080, but to read it from the configuration:

```java
public void start(Future<Void> fut) {
  vertx
      .createHttpServer()
      .requestHandler(r -> {
        r.response().end("<h1>Hello from my first " +
            "Vert.x 3 application</h1>");
      })
      .listen(
          // Retrieve the port from the configuration,
          // default to 8080.
          config().getInteger("http.port", 8080),
          result -> {
            if (result.succeeded()) {
              fut.complete();
            } else {
              fut.fail(result.cause());
            }
          }
      );
}
```

So, the only difference with the previous version is `config().getInteger("http.port", 8080)`. Here, our code is now requesting the configuration and check whether the _http.port_ property is set. If not, the port 8080 is used as fall-back. The retrieved configuration is a `JsonObject`.

As we are using the port 8080 by default, you can still package our application and run it as before:

```bash
mvn clean package
java -jar target/my-first-app-1.0-SNAPSHOT-fat.jar
```

Simple right ?

## API-based configuration - Random port for the tests

Now that the application is configurable, let's try to provide a configuration. In our test, we are going to configure our application to use the port 8081. So, previously we were deploying our verticle with:

```java
vertx.deployVerticle(MyFirstVerticle.class.getName(), context.asyncAssertSuccess());
```

Let's now pass some _deployment options_:

```java
port = 8081;
DeploymentOptions options = new DeploymentOptions()
    .setConfig(new JsonObject().put("http.port", port)
);
vertx.deployVerticle(MyFirstVerticle.class.getName(), options, context.asyncAssertSuccess());
```

The `DeploymentOptions` object lets us customize various parameters. In particular, it lets us inject the `JsonObject` retrieved by the verticle when using the `config()` method.

Obviously, the test connecting to the server needs to be slightly modified to use the right port (`port` is a field):

```java
vertx.createHttpClient().getNow(port, "localhost", "/", response -> {
  response.handler(body -> {
    context.assertTrue(body.toString().contains("Hello"));
    async.complete();
  });
});
```

Ok, well, this does not really fix our issue. What happens when the port 8081 is used too. Let's now pick a random port:

```java
ServerSocket socket = new ServerSocket(0);
port = socket.getLocalPort();
socket.close();

DeploymentOptions options = new DeploymentOptions()
    .setConfig(new JsonObject().put("http.port", port)
    );

vertx.deployVerticle(MyFirstVerticle.class.getName(), options, context.asyncAssertSuccess());
```

So, the idea is very simple. We open a _server socket_ that would pick a random port (that's why we put 0 as parameter). We retrieve the used port and close the socket. Be aware that this method is **not** perfect and may fail if the picked port becomes used between the `close` method and the start of our HTTP server. However, it would work fine in the very high majority of the case.

With this in place, our test is now using a random port. Execute them with:

```bash
mvn clean test
```

## External configuration - Let's run on another port

Ok, well random port is not what we want in _production_. Could you imagine the face of your production team if you tell them that your application is picking a random port. It can actually be funny, but we should never mess with the production team.

So for the actual execution of your application, let's pass the configuration in an external file. The configuration is stored in a _json_ file.

Create the `src/main/conf/my-application-conf.json` with the following content:

```javascript
{
  "http.port" : 8082
}
```

And now, to use this configuration just launch your application with:

```bash
java -jar target/my-first-app-1.0-SNAPSHOT-fat.jar -conf src/main/conf/my-application-conf.json
```

Open a browser on http://localhost:8082, here it is !

How does that work ? Remember, our _fat jar_ is using the `Starter` class (provided by Vert.x) to launch our application. This class is reading the `-conf` parameter and create the corresponding deployment options when deploying our verticle.

## Conclusion

After having developed your first Vert.x application, we have seen how this application is configurable, and this without adding any complexity to our application. [In the next post](/blog/some-rest-with-vert-x/), we are going to see how we can use vertx-web to develop a small application serving static pages and a REST API. A bit more fancy, but still very simple.

Happy Coding and &amp; Stay Tuned!
