---
title: Some Rest with Vert.x
template: post.html
date: 2015-07-27
author: cescoffier
---

## Previously in this blog series

This post is part of the _Introduction to Vert.x_ series. So, let's have a quick look about the content of the previous posts. In [the first post]({{ site_url }}blog/my-first-vert-x-3-application/), we developed a very simple Vert.x 3 application, and saw how this application can be tested, packaged and executed. In [the last post]({{ site_url }}blog/vert-x-application-configuration/), we saw how this application became configurable and how we can use a random port in test.

Well, nothing fancy... Let's go a bit further this time and develop a _CRUD-ish_ application. So an application exposing an HTML page interacting with the backend using a REST API. The level of _RESTfullness_ of the API is not the topic of this post, I let you decide as it's a very slippery topic.

So, in other words we are going to see:

* Vert.x Web - a framework that let you create Web applications easily using Vert.x
* How to expose static resources
* How to develop a REST API

The code developed in this post is available on the [post-3](https://github.com/cescoffier/my-vertx-first-app/tree/post-3) branch of this [Github](https://github.com/cescoffier/my-vertx-first-app) project. We are going to start from the  [post-2](https://github.com/cescoffier/my-vertx-first-app/tree/post-2) codebase.

So, let's start.

## Vert.x Web

As you may have notices in the previous posts, dealing with complex HTTP application using only Vert.x Core would be kind of cumbersome. That's the main reason behind [Vert.x Web](http://vertx.io/docs/vertx-web/java/). It makes the development of Vert.x base web applications really easy, without changing the philosophy.

To use Vert.x Web, you need to update the `pom.xml` file to add the following dependency:

```xml
<dependency>
  <groupId>io.vertx</groupId>
  <artifactId>vertx-web</artifactId>
  <version>3.0.0</version>
</dependency>
```

That's the only thing you need to use Vert.x Web. Sweet, no ?

Let's now use it. Remember, in the previous post, when we requested http://localhost:8080, we reply a nice _Hello World_ message. Let's do the same with Vert.x Web.  Open the `io.vertx.blog.first.MyFirstVerticle` class and change the `start` method to be:

```java
@Override
public void start(Future<Void> fut) {
 // Create a router object.
 Router router = Router.router(vertx);

 // Bind "/" to our hello message - so we are still compatible.
 router.route("/").handler(routingContext -> {
   HttpServerResponse response = routingContext.response();
   response
       .putHeader("content-type", "text/html")
       .end("<h1>Hello from my first Vert.x 3 application</h1>");
 });

 // Create the HTTP server and pass the "accept" method to the request handler.
 vertx
     .createHttpServer()
     .requestHandler(router::accept)
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

You may be surprise by the length of this snippet (in comparison to the previous code). But as we are going to see, it will make our app on steroids, just be patient.

As you can see, we start by creating a `Router` object. The router is the cornerstone of Vert.x Web. This object is responsible for dispatching the HTTP requests to the right _handler_. Two other concepts are very important in Vert.x Web:

* Routes - which let you define how request are dispatched
* Handlers - which are the actual action processing the requests and writing the result. Handlers can be chained.

If you understand these 3 concepts, you have understood everything in Vert.x Web.

Let's focus on this code first:

```java
router.route("/").handler(routingContext -> {
  HttpServerResponse response = routingContext.response();
  response
      .putHeader("content-type", "text/html")
      .end("<h1>Hello from my first Vert.x 3 application</h1>");
});
```

It _routes_ requests arriving on "/" to the given _handler_. Handlers receive a `RoutingContext` object. This handler is quite similar to the code we had before, and it's quite normal as it manipulates the same type of object: `HttpServerResponse`.

Let's now have a look to the rest of the code:

```java
vertx
    .createHttpServer()
    .requestHandler(router::accept)
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

It's basically the same code as before, except that we change the request handler. We pass `router::accept` to the handler. You may not be familiar with this notation. It's a reference to a method (here the method `accept` from the `router` object). In other worlds, it instructs vert.x to call the `accept` method of the `router` when it receives a request.

Let's try to see if this work:

```bash
mvn clean package
java -jar target/my-first-app-1.0-SNAPSHOT-fat.jar
```

By opening `http://localhost:8080` in your browser you should see the _Hello_ message. As we didn't change the behavior of the application, our tests are still valid.

## Exposing static resources

Ok, so we have a first application using vert.x web. Let's see some of the benefits. Let's start with serving static resources, such as an `index.html` page. Before we go further, I should start with a disclaimer: "the HTML page we are going to see here is ugly like hell : I'm not a UI guy". I should also add that there are probably plenty of better ways to implement this and a myriad of frameworks I should try, but that's not the point. I tried to keep things simple and just relying on JQuery and Twitter Bootstrap, so if you know a bit of JavaScript you can understand and edit the page.

Let's create the HTML page that will be the entry point of our application. Create an `index.html` page in `src/main/resources/assets` with the content from [here](https://github.com/cescoffier/my-vertx-first-app/blob/post-3/src/main/resources/assets/index.html). As it's just a HTML page with a bit of JavaScript, we won't detail the file here. If you have questions, just post comments.

Basically, the page is a simple _CRUD_ UI to manage my collection of _not-yet-finished_ bottles of Whisky. It was made in a generic way, so you can transpose it to your own collection. The list of product is displayed in the main table. You can create a new product, edit one or delete one. These actions are relying on a REST API (that we are going to implement) through AJAX calls. That's all.

Once this page is created, edit the `io.vertx.blog.first.MyFirstVerticle` class and change the `start` method to be:

```java
@Override
public void start(Future<Void> fut) {
 Router router = Router.router(vertx);
 router.route("/").handler(routingContext -> {
   HttpServerResponse response = routingContext.response();
   response
       .putHeader("content-type", "text/html")
       .end("<h1>Hello from my first Vert.x 3 application</h1>");
 });

 // Serve static resources from the /assets directory
 router.route("/assets/*").handler(StaticHandler.create("assets"));

 vertx
     .createHttpServer()
     .requestHandler(router::accept)
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

The only difference with the previous code is the `router.route("/assets/*").handler(StaticHandler.create("assets"));` line. So, what does this line mean? It's actually quite simple. It _routes_ requests on "/assets/*" to resources stored in the "assets" directory. So our `index.html` page is going to be served using `http://localhost:8080/assets/index.html`.

Before testing this, let's take a few seconds on the handler creation. All processing actions in Vert.x web are implemented as _handler_. To create a handler you always call the `create` method.

So, I'm sure you are impatient to see our beautiful HTML page. Let's build and run the application:

```bash
mvn clean package
java -jar target/my-first-app-1.0-SNAPSHOT-fat.jar
```

Now, open your browser to `http://localhost:8080/assets/index.html`. Here it is... Ugly right? I told you.

As you may notice too... the table is empty, this is because we didn't implement the REST API yet. Let's do that now.

## REST API with Vert.x Web

Vert.x Web makes the implementation of REST API really easy, as it basically _routes_ your URL to the right handler. The API is very simple, and will be structured as follows:

* `GET /api/whiskies` => get all bottles (`getAll`)
* `GET /api/whiskies/:id` => get the bottle with the corresponding id (`getOne`)
* `POST /api/whiskies` => add a new bottle (`addOne`)
* `PUT /api/whiskies/:id` => update a bottle (`updateOne`)
* `DELETE /api/whiskies/id` => delete a bottle (`deleteOne`)

### We need some data...

But before going further, let's create our _data_ object. Create the `src/main/java/io/vertx/blog/first/Whisky.java` with the following content:

```java
package io.vertx.blog.first;

import java.util.concurrent.atomic.AtomicInteger;

public class Whisky {

  private static final AtomicInteger COUNTER = new AtomicInteger();

  private final int id;

  private String name;

  private String origin;

  public Whisky(String name, String origin) {
    this.id = COUNTER.getAndIncrement();
    this.name = name;
    this.origin = origin;
  }

  public Whisky() {
    this.id = COUNTER.getAndIncrement();
  }

  public String getName() {
    return name;
  }

  public String getOrigin() {
    return origin;
  }

  public int getId() {
    return id;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setOrigin(String origin) {
    this.origin = origin;
  }
}
```

It's a very simple _bean_ class (so with getters and setters). We choose this format because Vert.x is relying on [Jackson](http://wiki.fasterxml.com/JacksonHome) to handle the JSON format. Jackson automates the serialization and deserialization of _bean_ classes, making our code much simpler.

Now, let's create a couple of bottles. In the `MyFirstVerticle` class, add the following code:

```java
// Store our product
private Map<Integer, Whisky> products = new LinkedHashMap<>();
// Create some product
private void createSomeData() {
  Whisky bowmore = new Whisky("Bowmore 15 Years Laimrig", "Scotland, Islay");
  products.put(bowmore.getId(), bowmore);
  Whisky talisker = new Whisky("Talisker 57° North", "Scotland, Island");
  products.put(talisker.getId(), talisker);
}
```

Then, in the `start` method, call the `createSomeData` method:

```java
@Override
public void start(Future<Void> fut) {

  createSomeData();

  // Create a router object.
  Router router = Router.router(vertx);

  // Rest of the method
}
```

As you have noticed, we don't really have a _backend_ here, it's just a (in-memory) map. Adding a backend will be covered by another post.

### Get our products

Enough decoration, let's implement the REST API. We are going to start with `GET /api/whiskies`. It returns the list of bottles in a JSON Array.

In the `start` method, add this line just below the static handler line:

```java
router.get("/api/whiskies").handler(this::getAll);
```

This line instructs the `router` to handle the `GET` requests on "/api/whiskies" by calling the `getAll` method. We could have inlined the handler code, but for clarity reasons let's create another  method:

```java
private void getAll(RoutingContext routingContext) {
  routingContext.response()
      .putHeader("content-type", "application/json; charset=utf-8")
      .end(Json.encodePrettily(products.values()));
}
```

As every _handler_ our method receives a `RoutingContext`. It populates the `response` by setting the `content-type` and the actual content. Because our content may contain _weird_ characters, we force the charset to UTF-8. To create the actual content, no need to compute the JSON string ourself. Vert.x lets us use the `Json` API. So `Json.encodePrettily(products.values())` computes the JSON string representing the set of bottles.

We could have used `Json.encodePrettily(products)`, but to make the JavaScript code simpler, we just return the set of bottles and not an object containing `ID => Bottle` entries.

With this in place, we should be able to retrieve the set of bottle from our HTML page. Let's try it:

```bash
mvn clean package
java -jar target/my-first-app-1.0-SNAPSHOT-fat.jar
```

Then open the HTML page in your browser (`http://localhost:8080/assets/index.html`), and should should see:

<img src="{{ site_url }}assets/blog/intro-series/post-3-My_Whisky_Collection.png" class="img-responsive">

I'm sure you are curious, and want to actually see what is returned by our REST API. Let's open a browser to `http://localhost:8080/api/whiskies`. You should get:

```
[ {
  "id" : 0,
  "name" : "Bowmore 15 Years Laimrig",
  "origin" : "Scotland, Islay"
}, {
  "id" : 1,
  "name" : "Talisker 57° North",
  "origin" : "Scotland, Island"
} ]
```

## Create a product

Now we can retrieve the set of bottles, let's create a new one. Unlike the previous REST API endpoint, this one need to read the request's body. For performance reason, it should be explicitly enabled. Don't be scared... it's just a handler.

In the `start` method, add these lines just below the line ending by `getAll`:

```java
router.route("/api/whiskies*").handler(BodyHandler.create());
router.post("/api/whiskies").handler(this::addOne);
```

The first line enables the reading of the request body for all routes under "/api/whiskies". We could have enabled it globally with `router.route().handler(BodyHandler.create())`.

The second line maps `POST` requests on `/api/whiskies` to the `addOne` method. Let's create this method:

```java
private void addOne(RoutingContext routingContext) {
  final Whisky whisky = Json.decodeValue(routingContext.getBodyAsString(),
      Whisky.class);
  products.put(whisky.getId(), whisky);
  routingContext.response()
      .setStatusCode(201)
      .putHeader("content-type", "application/json; charset=utf-8")
      .end(Json.encodePrettily(whisky));
}
```

The method starts by retrieving the `Whisky` object from the request body. It just reads the body into a String and passes it to the `Json.decodeValue` method. Once created it adds it to the _backend_ map and returns the created bottle as JSON.

Let's try this. Rebuild and restart the application with:

```
mvn clean package
java -jar target/my-first-app-1.0-SNAPSHOT-fat.jar
```

Then, refresh the HTML page and click on the `Add a new bottle` button. Enter the data such as: "Jameson" as name and "Ireland" as origin (purists would have noticed that this is actually a Whiskey and not a Whisky). The bottle should be added to the table.

[NOTE Status 201 ? | As you can see, we have set the response status to `201`. It means `CREATED`, and is the generally used in REST API that create an entity. By default vert.x web is setting the status to `200` meaning `OK`.]

### Finishing a bottle

Well, bottles do not last forever, so we should be able to delete a bottle. In the `start` method, add this line:

```java
router.delete("/api/whiskies/:id").handler(this::deleteOne);
```

In the URL, we define a _path parameter_ `:id`. So, when handling a matching request, Vert.x extracts the path segment corresponding to the parameter and let us access it in the handler method. For instance, `/api/whiskies/0` maps `id` to `0`.

Let's see how the parameter can be used in the handler method. Create the `deleteOne` method as follows:

```java
private void deleteOne(RoutingContext routingContext) {
  String id = routingContext.request().getParam("id");
  if (id == null) {
    routingContext.response().setStatusCode(400).end();
  } else {
    Integer idAsInteger = Integer.valueOf(id);
    products.remove(idAsInteger);
  }
  routingContext.response().setStatusCode(204).end();
}
```

The _path parameter_ is retrieved using `routingContext.request().getParam("id")`.  It checks whether it's `null` (not set), and in this case returns a `Bad Request` response (status code 400). Otherwise, it removes it from the _backend_ map.

[NOTE Status 204 ? | As you can see, we have set the response status to `204 - NO CONTENT`. Response to the HTTP Verb `delete` have generally no content.]

### The other methods

We won't detail `getOne` and `updateOne` as the implementations are straightforward and very similar. Their implementations are available on [GitHub](https://github.com/cescoffier/my-vertx-first-app/blob/post-3/src/main/java/io/vertx/blog/first/MyFirstVerticle.java).

### Cheers !

It's time to conclude this post. We have seen how Vert.x Web lets you implement a REST API easily and how it can serve static resources. A bit more fancy than before, but still pretty easy.

[In the next post](/blog/unit-and-integration-tests/) we are going to improve our tests to cover the REST API.

Say Tuned &amp; Happy Coding !
