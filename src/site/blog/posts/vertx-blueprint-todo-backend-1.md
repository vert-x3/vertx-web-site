---
title: Vert.x Blueprint - Todo-Backend Tutorial (Part 1)
template: post.html
date: 2016-06-17
author: sczyh30
draft: true
---

## Table of contents

- [Preface](#preface)
- [Our application - Todo service](#our-application-todo-service)
- [Let's Start!](#let-s-start-)
    - [Gradle build file](#gradle-build-file)
    - [Todo entity](#todo-entity)
    - [Verticle](#verticle)
- [REST API with Vert.x Web](#rest-api-with-vert-x-web)
    - [Create HTTP server with route](#create-http-server-with-route)
    - [Configure the routes](#configure-the-routes)
    - [Asynchronous Pattern](#asynchronous-pattern)
    - [Todo logic implementation](#todo-logic-implementation)
        - [Vert.x Redis](#vert-x-redis)
        - [Store format](#store-format)
        - [Get/Get all](#get-get-all)
        - [Create Todo](#create-todo)
        - [Update](#update)
        - [Remove/Remove all](#remove-remove-all)
    - [Package with Vert.x Launcher](#package-with-vert-x-launcher)
    - [Run our service](#run-our-service)


## Preface

In this tutorial, we are going to use Vert.x to develop a RESTful web service - Todo Backend. This service provide a simple RESTful API in the form of a todo list, where we could add or complete todo stuff.

What you are going to learn:

- What is Vert.x and its basic design
- What is and how to use `Verticle`
- How to develop a REST API using Vert.x Web
- How to make use of **asynchronous development model**
- How to use persistence such as *Redis* and *MySQL* with the help of Vert.x data access components

This is the first part of **Vert.x Blueprint Project**. The code developed in this tutorial is available on [GitHub](https://github.com/sczyh30/vertx-blueprint-todo-backend/tree/master).

## Our application - Todo service

Our application is a todo list REST service. It's very simple. The entire API consists of about 5 distinct operations (create a todo, view a todo, modify a todo, list all todos, delete all todos), which correspond to CRUD operations.

So we could design the following routes:

- Add a todo entity: `POST /todos`
- Get a certain todo entity: `GET /todos/:todoId`
- Get all todo entities: `GET /todos`
- Update a todo entity: `PATCH /todos/:todoId`
- Delete a certain todo entity: `DELETE /todos/:todoId`
- Delete all todo entities: `DELETE /todos`

The level of *REST API* is not the topic of this post, so you could also design as you like.

Now let's start!

## Let's Start!

Vert.x core provides a fairly low level set of functionality for handling HTTP, and for some applications that will be sufficient. That's the main reason behind [Vert.x Web](http://vertx.io/docs/vertx-web/java). Vert.x-Web builds on Vert.x core to provide a richer set of functionality for building real web applications, more easily.

### Gradle build file

First, let's create the project. In this tutorial we use Gradle as build tool, but you can use any other build tools you prefer, such as Maven and SBT. Basically, you need a directory with:

1. a `src/main/java` directory
2. a `src/test/java` directory
3. a `build.gradle` file

The directory tree will be like this:

```
.
├── build.gradle
├── settings.gradle
├── src
│   ├── main
│   │   └── java
│   └── test
│       └── java
```

Let's create the `build.gradle` file:

```groovy
apply plugin: 'java'

targetCompatibility = 1.8
sourceCompatibility = 1.8

repositories {
  mavenCentral()
  mavenLocal()
}

dependencies {

  compile "io.vertx:vertx-core:3.3.0"
  compile 'io.vertx:vertx-web:3.3.0'

  testCompile 'io.vertx:vertx-unit:3.3.0'
  testCompile group: 'junit', name: 'junit', version: '4.12'
}
```

You might not be familiar with Gradle, that doesn't matter. Let's explain that:

- We set both `targetCompatibility` and `sourceCompatibility` to **1.8**. This point is **important** as Vert.x requires Java 8.
- In `dependencies` field, we declares our dependencies. `vertx-core` and `vert-web` for REST API.

As we created `build.gradle`, let's start writing code~

### Todo entity

First we need to create our data object - the `Todo` entity. Create the `src/main/java/io/vertx/blueprint/todolist/entity/Todo.java` file and write:

```Java
package io.vertx.blueprint.todolist.entity;

import io.vertx.codegen.annotations.DataObject;
import io.vertx.core.json.JsonObject;

import java.util.concurrent.atomic.AtomicInteger;


@DataObject(generateConverter = true)
public class Todo {

  private static final AtomicInteger acc = new AtomicInteger(0); // counter

  private int id;
  private String title;
  private Boolean completed;
  private Integer order;
  private String url;

  public Todo() {
  }

  public Todo(Todo other) {
    this.id = other.id;
    this.title = other.title;
    this.completed = other.completed;
    this.order = other.order;
    this.url = other.url;
  }

  public Todo(JsonObject obj) {
    TodoConverter.fromJson(obj, this);
  }

  public Todo(String jsonStr) {
    TodoConverter.fromJson(new JsonObject(jsonStr), this);
  }

  public Todo(int id, String title, Boolean completed, Integer order, String url) {
    this.id = id;
    this.title = title;
    this.completed = completed;
    this.order = order;
    this.url = url;
  }

  public JsonObject toJson() {
    JsonObject json = new JsonObject();
    TodoConverter.toJson(this, json);
    return json;
  }

  public int getId() {
    return id;
  }

  public void setId(int id) {
    this.id = id;
  }

  public void setIncId() {
    this.id = acc.incrementAndGet();
  }

  public static int getIncId() {
    return acc.get();
  }

  public static void setIncIdWith(int n) {
    acc.set(n);
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public Boolean isCompleted() {
    return getOrElse(completed, false);
  }

  public void setCompleted(Boolean completed) {
    this.completed = completed;
  }

  public Integer getOrder() {
    return getOrElse(order, 0);
  }

  public void setOrder(Integer order) {
    this.order = order;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;

    Todo todo = (Todo) o;

    if (id != todo.id) return false;
    if (!title.equals(todo.title)) return false;
    if (completed != null ? !completed.equals(todo.completed) : todo.completed != null) return false;
    return order != null ? order.equals(todo.order) : todo.order == null;

  }

  @Override
  public int hashCode() {
    int result = id;
    result = 31 * result + title.hashCode();
    result = 31 * result + (completed != null ? completed.hashCode() : 0);
    result = 31 * result + (order != null ? order.hashCode() : 0);
    return result;
  }

  @Override
  public String toString() {
    return "Todo -> {" +
      "id=" + id +
      ", title='" + title + '\'' +
      ", completed=" + completed +
      ", order=" + order +
      ", url='" + url + '\'' +
      '}';
  }

  private <T> T getOrElse(T value, T defaultValue) {
    return value == null ? defaultValue : value;
  }

  public Todo merge(Todo todo) {
    return new Todo(id,
      getOrElse(todo.title, title),
      getOrElse(todo.completed, completed),
      getOrElse(todo.order, order),
      url);
  }
}
```

Our `Todo` entity consists of id, title, order, url and a flag indicates if it is completed. This is a simple Java bean and could be marshaled to JSON format.

Here we make use of *Vert.x Codegen* to automatically generate JSON converter. To use Vert.x Codegen, we need add a dependency:

```gradle
compile 'io.vertx:vertx-codegen:3.3.0'
```

And we need a `package-info.java` file in the package in order to instruct Vert.x Codegen to generate code:

```java
/**
 * Indicates that this module contains classes that need to be generated / processed.
 */
@ModuleGen(name = "vertx-blueprint-todo-entity", groupPackage = "io.vertx.blueprint.todolist.entity")
package io.vertx.blueprint.todolist.entity;

import io.vertx.codegen.annotations.ModuleGen;
```

In fact Vert.x Codegen resembles a annotation processing tool(apt), so we should set up apt in `build.gradle`. Add the following content to `build.gradle`:

```gradle
task annotationProcessing(type: JavaCompile, group: 'build') {
  source = sourceSets.main.java
  classpath = configurations.compile
  destinationDir = project.file('src/main/generated')
  options.compilerArgs = [
    "-proc:only",
    "-processor", "io.vertx.codegen.CodeGenProcessor",
    "-AoutputDirectory=${destinationDir.absolutePath}"
  ]
}

sourceSets {
  main {
    java {
      srcDirs += 'src/main/generated'
    }
  }
}

compileJava {
  targetCompatibility = 1.8
  sourceCompatibility = 1.8

  dependsOn annotationProcessing
}
```

Then every time we compile our code, the Vert.x Codegen will automatically generate a converter class for class with `@DataObject` annotation. Here, you will get a class `TodoConverter` and you can use it in `Todo` data object.

### Verticle

Then we start writing our verticle. Create the `src/main/java/io/vertx/blueprint/todolist/verticles/SingleApplicationVerticle.java ` file and write following content:

```java
package io.vertx.blueprint.todolist.verticles;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import io.vertx.redis.RedisClient;
import io.vertx.redis.RedisOptions;

public class SingleApplicationVerticle extends AbstractVerticle {

  private static final String HTTP_HOST = "0.0.0.0";
  private static final String REDIS_HOST = "127.0.0.1";
  private static final int HTTP_PORT = 8082;
  private static final int REDIS_PORT = 6379;

  private RedisClient redis;

  @Override
  public void start(Future<Void> future) throws Exception {
      // TODO with start...
  }
}
```

Our class `SingleApplicationVerticle` extends `AbstractVerticle` class. In Vert.x, a **verticle** is a component of the application. We can deploy *verticles* to run the components.

The `start` method will be called when verticle is deployed. And notice this `start` method takes a parameter typed `Future<Void>`, which means this is asynchronous start method. The `Future` indicates whether your actions have been done. After done, you can call `complete` on the `Future` (or `fail`) to notify that you are done (success or failure).

So next step is to create a http server and configure the routes to handle HTTP requests.

## REST API with Vert.x Web

### Create HTTP server with route

Let's change the `start` method with:

```java
@Override
public void start(Future<Void> future) throws Exception {
  initData();

  Router router = Router.router(vertx); // <1>
  // CORS support
  Set<String> allowHeaders = new HashSet<>();
  allowHeaders.add("x-requested-with");
  allowHeaders.add("Access-Control-Allow-Origin");
  allowHeaders.add("origin");
  allowHeaders.add("Content-Type");
  allowHeaders.add("accept");
  Set<HttpMethod> allowMethods = new HashSet<>();
  allowMethods.add(HttpMethod.GET);
  allowMethods.add(HttpMethod.POST);
  allowMethods.add(HttpMethod.DELETE);
  allowMethods.add(HttpMethod.PATCH);

  router.route().handler(CorsHandler.create("*") // <2>
    .allowedHeaders(allowHeaders)
    .allowedMethods(allowMethods));
  router.route().handler(BodyHandler.create()); // <3>


  // TODO:routes

  vertx.createHttpServer() // <4>
    .requestHandler(router::accept)
    .listen(PORT, HOST, result -> {
        if (result.succeeded())
          future.complete();
        else
          future.fail(result.cause());
      });
}
```

Wow! A long snippet, yeah? Don't worry, I'll explain that.

First we create a `Router` object (1). The router is responsible for dispatching HTTP requests to the certain right handler. We could define routes to handle different requests with different handlers. A `Handler` is responsible for handling requests and writing result. The handlers will be invoked when corresponding request arrives. These concepts are very common in web development.

Then we created two sets, `allowHeaders` and `allowMethods`. And then we add some HTTP headers and methods to the set, and then we attach the `CorsHandler` to the router (2). The `route()` method with no parameters means that it matches all requests. These two sets are about *CORS support*.
The most common initial gotcha when implementing Todo-Backend is getting CORS headers right. Both the Todo-Backend web client and the Todo-Backend specs themselves will be running javascript from a different domain than the one where our API implementation will live.
That means we need to enable [CORS support](http://enable-cors.org/server.html) by including a couple of custom HTTP headers and responding to the relevant OPTIONS HTTP requests. We don't fall into the detail of CORS. We just need to know how it can support CORS.

Next we attach the `BodyHandler` to the router (3). The `BodyHandler` allows you to retrieve request bodies and read data. For example, we can retrieve JSON data from the request body when implementing our REST service. We could enable it globally with `router.route().handler(BodyHandler.create())`.

Finally we create a HTTP server with `vertx.createHttpServer()` method (4). Note, this is the functionality of Vert.x Core. We then attach our *router handler* to the server, which is actually the role of Vert.x Web.
You may not familiar with the format like `router::accept`. It's a method reference and here it constructs a handler that handles requests by route. When requests arrive, Vert.x will call `accept` method.
The server is bound to the 8082 port. And because the process might fail, we also pass a handler to `listen` method to check whether the server is established or failed.
As we mentioned above, we use `future.complete` to notify success and `future.fail` to notify failure.

So far, we have created the HTTP server. But you haven't see routes about our service yeah? It's time to declare them!

### Configure the routes

Now let's declare our todo service routes. As we mentioned above, we designed our route as follows:

- Add a todo entity: `POST /todos`
- Get a certain todo entity: `GET /todos/:todoId`
- Get all todo entities: `GET /todos`
- Update a todo entity: `PATCH /todos/:todoId`
- Delete a certain todo entity: `DELETE /todos/:todoId`
- Delete all todo entities: `DELETE /todos`

[NOTE Path Parameter | In the URL, We could define path parameters using placeholder `:` followed by the parameter name. When handling a matching request, Vert.x will automatically fetch the corresponding parameter. For example, `/todos/19` maps `todoId` to `19`.]

First we create a `Constants` class in the root package(`io.vertx.blueprint.todolist`) and store the path of routes:

```java
package io.vertx.blueprint.todolist;

public final class Constants {

  private Constants() {}

  /** API Route */
  public static final String API_GET = "/todos/:todoId";
  public static final String API_LIST_ALL = "/todos";
  public static final String API_CREATE = "/todos";
  public static final String API_UPDATE = "/todos/:todoId";
  public static final String API_DELETE = "/todos/:todoId";
  public static final String API_DELETE_ALL = "/todos";

}
```

Then in `start` method, replace `TODO` field with the following content:

```java
// routes
router.get(Constants.API_GET).handler(this::handleGetTodo);
router.get(Constants.API_LIST_ALL).handler(this::handleGetAll);
router.post(Constants.API_CREATE).handler(this::handleCreateTodo);
router.patch(Constants.API_UPDATE).handler(this::handleUpdateTodo);
router.delete(Constants.API_DELETE).handler(this::handleDeleteOne);
router.delete(Constants.API_DELETE_ALL).handler(this::handleDeleteAll);
```

The code is clear. We use corresponding method(e.g. `get`, `post`, `delete` ...) to bind the path to the route. And we call `handler` method to attach certain handler to the route. Note the type of handler is `Handler<RoutingContext>` and here we pass six method references to the `handler` method, each of which takes a `RoutingContext` parameter and returns void. We'll implement these six handler methods soon.

### Asynchronous Pattern

As we mentioned above, Vert.x is asynchronous and non-blocking. Every asynchronous method takes a `Handler` parameter as the callback and when the process is done, the handler will be called. There is also an equivalent pattern that returns a `Future` object:

```java
void doAsync(A a, B b, Handler<R> handler);
// these two are equivalent
Future<R> doAsync(A a, B b);
```

The `Future` object refers to the result of an action that may not start, or pending, or finish or fail. We could also attach a `Handler` on the `Future` object. The handler will be called when the future is assigned with result:

```java
Future<R> future = doAsync(A a, B b);
future.setHandler(r -> {
    if (r.failed()) {
        // do something on the failure
    } else {
        // do something on the result
    }
});
```

Most of Vert.x APIs are handler-based pattern. We will see both of the two patterns below.

### Todo logic implementation

Now It's time to implement our todo logic! Here we will use *Redis* as the backend persistence. [Redis](http://redis.io/) is an open source, in-memory data structure store, used as database, cache and message broker. It is often referred to as a data structure server since keys can contain strings, hashes, lists, sets and sorted sets. And fortunately, Vert.x provides us Vert.x-redis, a component that allows us to process data with Redis.

[NOTE How to install and run Redis? | Please follow the concrete instruction on [Redis Website](http://redis.io/download#installation). ]

#### Vert.x Redis

Vert.x-redis allows data to be saved, retrieved, searched for, and deleted in a Redis **asynchronously**. To use the Vert.x Redis client, we should add the following dependency to the *dependencies* section of `build.gradle`:

```gradle
compile 'io.vertx:vertx-redis-client:3.3.0'
```

We can access to Redis by `RedisClient` object. So we define a `RedisClient` object as a class object. Before we use `RedisClient`, we should connect to Redis and there is a config required. This config is provided in the form of `RedisOptions`. Let's implement `initData` method to init the `RedisClient` and test the connection:

```java
private void initData() {
  RedisOptions config = new RedisOptions()
      .setHost(config().getString("redis.host", REDIS_HOST))
      .setPort(config().getInteger("redis.port", REDIS_PORT));

  this.redis = RedisClient.create(vertx, config); // create redis client

  redis.hset(Constants.REDIS_TODO_KEY, "24", Json.encodePrettily( // test connection
    new Todo(24, "Something to do...", false, 1, "todo/ex")), res -> {
    if (res.failed()) {
      System.err.println("[Error] Redis service is not running!");
      res.cause().printStackTrace();
    }
  });

}
```

When we initialize the verticle, we first invoke `initData` method so that the redis client could be created.

#### Store format

As Redis support various format of data, We store our todo objects in a *Map*.
Every data in the map has key and value. Here we use `id` as key and todo entity in **JSON** format as value.

Recall, the map should have a name(key), so we name it as *VERT_TODO*. Let's add the following constant to the `Constants` class:

```java
public static final String REDIS_TODO_KEY = "VERT_TODO";
```

As we mentioned above, we have implemented method(or constructor) that converts between `Todo` entity and `JsonObject` with the help of generated `TodoConverter` class. Thus, we could make use of them in the following code.

#### Get/Get all

Let's implement the logic of getting todo objects. As we mentioned above, the hanlder method should take a `RoutingContext` as parameter and return void. Let's implement `handleGetTodo` method first:

```java
private void handleGetTodo(RoutingContext context) {
  String todoID = context.request().getParam("todoId"); // (1)
  if (todoID == null)
    sendError(400, context.response()); // (2)
  else {
    redis.hget(Constants.REDIS_TODO_KEY, todoID, x -> { // (3)
      if (x.succeeded()) {
        String result = x.result();
        if (result == null)
          sendError(404, context.response());
        else {
          context.response()
            .putHeader("content-type", "application/json")
            .end(result); // (4)
        }
      } else
        sendError(503, context.response());
    });
  }
}
```

First we retrieve the path parameter `todoId` using `getParam` (1). We should check whether the parameter exists and if not, the server should send a `400 Bad Request` error response to client (2); Here we wrap a method that could send error response:

```java
private void sendError(int statusCode, HttpServerResponse response) {
  response.setStatusCode(statusCode).end();
}
```

The `end` method is of vital importance. The response could be sent to client only if we call this method.

Back to the `handleGetTodo` method. If the parameter is okay, we could fetch the todo object by `todoId` from Redis. Here we use `hget` operation (3), which means get an entry by key from the map. Let's see the signature of `hget` method:

```java
RedisClient hget(String key, String field, Handler<AsyncResult<String>> handler);
```

The first parameter `key` is the name(key) of the map. The second parameter `field` is the key of the data. The third parameter is a handler that handles the result when action has been done. In the handler, first we should check if the action is successful. If not, the server should send a `503 Service Unavailable` error response to the client. If done, we could get the result. If the result is `null`, that indicates there is no todo object matches the `todoId` so we should return `404 Not Found` status. If the result is valid, we could write it to response by `end` method (4). Notice our REST API returns JSON data, so we set `content-type` header as JSON type.

The logic of `handleGetAll` is similar to `handleGetTodo`, but the implementation has some difference:

```java
private void handleGetAll(RoutingContext context) {
  redis.hvals(Constants.REDIS_TODO_KEY, res -> { // (1)
    if (res.succeeded()) {
      String encoded = Json.encodePrettily(res.result().stream() // (2)
        .map(x -> new Todo((String) x))
        .collect(Collectors.toList()));
      context.response()
        .putHeader("content-type", "application/json")
        .end(encoded); // (3)
    } else
      sendError(503, context.response());
  });
}
```

Here we use `hvals` operation (1). `hvals` returns all values in the hash stored at key. In Vert.x-redis, it returns data as a `JsonArray` object. In the handler we first check whether the action is successful as before. If okay, we could write the result to response. Notice that we cannot directly write the returning `JsonArray` to the response as each value in `JsonArray` we retrieved from Redis was escaped so some characters are not correct. So we should first convert them into todo entity and then re-encode them to JSON.

Here we use an approach with functional style. Because the `JsonArray` class implements `Iterable<Object>` interface (behave like `List` yeah?), we could convert it to `Stream` using `stream` method. The `Stream` here is not the IO stream, but data flow. Then we transform every value(in string format) to `Todo` entity, with the help of `map` operator. We don't explain `map` operator in detail but, it's really important in functional programming. After mapping, we collect the `Stream` in the form of `List<Todo>`. Now we could use `Json.encodePrettily` method to convert the list to JSON string. Finally we write the encoded result to response as before (3).

#### Create Todo

After having done two APIs above, you are more familiar with Vert.x~ Now let's implement the logic of creating todo :

```java
private void handleCreateTodo(RoutingContext context) {
  try {
    final Todo todo = wrapObject(new Todo(context.getBodyAsString()), context);
    final String encoded = Json.encodePrettily(todo);
    redis.hset(Constants.REDIS_TODO_KEY, String.valueOf(todo.getId()),
      encoded, res -> {
        if (res.succeeded())
          context.response()
            .setStatusCode(201)
            .putHeader("content-type", "application/json; charset=utf-8")
            .end(encoded);
        else
          sendError(503, context.response());
      });
  } catch (DecodeException e) {
    sendError(400, context.response());
  }
}
```

First we use `context.getBodyAsString()` to retrieve JSON data from the request body and decode JSON data to todo entity with the specific constructor (1). Here we implement a `wrapObject` method that give corresponding url and incremental id(if no id) to the todo data object:

```java
private Todo wrapObject(Todo todo, RoutingContext context) {
  int id = todo.getId();
  if (id > Todo.getIncId()) {
    Todo.setIncIdWith(id);
  } else if (id == 0)
    todo.setIncId();
  todo.setUrl(context.request().absoluteURI() + "/" + todo.getId());
  return todo;
}
```

This `wrapObject` method is of vital importance as the id of todos could not be duplicate. Here we use a mechanism like incremental integer.

And then we encode again to JSON string format using `Json.encodePrettily` method (2). Next we insert the todo entity into map with `hset` operator (3). If the action is successful, write response with status `201` (4).

[NOTE Status 201 ? | As you can see, we have set the response status to `201`. It means `CREATED`, and is the generally used in REST API that create an entity. By default Vert.x Web is setting the status to `200` meaning `OK`.]

In case of the invalid request body, we should catch `DecodeException`. Once the request body is invalid, we send response with `400 Bad Request` status code.

#### Update

Well, if you want to change your plan, you may need to update the todo entity. Let's implement it. The logic of updating todo is a little more complicated:

```java
// PATCH /todos/:todoId
private void handleUpdateTodo(RoutingContext context) {
  try {
    String todoID = context.request().getParam("todoId"); // (1)
    final Todo newTodo = new Todo(context.getBodyAsString()); // (2)
    // handle error
    if (todoID == null || newTodo == null) {
      sendError(400, context.response());
      return;
    }

    redis.hget(Constants.REDIS_TODO_KEY, todoID, x -> { // (3)
      if (x.succeeded()) {
        String result = x.result();
        if (result == null)
          sendError(404, context.response()); // (4)
        else {
          Todo oldTodo = new Todo(result);
          String response = Json.encodePrettily(oldTodo.merge(newTodo)); // (5)
          redis.hset(Constants.REDIS_TODO_KEY, todoID, response, res -> { // (6)
            if (res.succeeded()) {
              context.response()
                .putHeader("content-type", "application/json")
                .end(response); // (7)
            }
          });
        }
      } else
        sendError(503, context.response());
    });
  } catch (DecodeException e) {
    sendError(400, context.response());
  }
}
```

A little longer yet? Let's see the code. First we retrieve the path parameter `todoId` from the route context (1). This is the id of the todo entity we want to change. Then we get the new todo entity from the request body (2). This step may throw `DecodeException` so we should also catch that. To update our todo entity, we need to retrieve the old todo entity first. We use `hget` operator to retrieve the old todo entity (3) and then check whether it exists. If not, return `404 Not Found` status (4). After getting the old todo, we could use `merge` method (defined in `Todo` before) to merge old todo with new todo (5) and then encode to JSON string. Next we update todo by `hset` operator (6) (`hset` means if no key matches in Redis, then create; or else update). If the operation is successful, write response with `200 OK` status.

So this is the update process. Be patient, we have almost done it~ Let's implement the logic of removing todos.

#### Remove/Remove all

The logic of removing todos is much more easier. We use `hdel` operator to delete one certain todo entity and `del` operator to delete the entire todo map. If the operation is successful, write response with `204 No Content` status.

Here are the code:

```java
private void handleDeleteOne(RoutingContext context) {
  String todoID = context.request().getParam("todoId");
  redis.hdel(Constants.REDIS_TODO_KEY, todoID, res -> {
    if (res.succeeded())
      context.response().setStatusCode(204).end();
    else
      sendError(503, context.response());
  });
}

private void handleDeleteAll(RoutingContext context) {
  redis.del(Constants.REDIS_TODO_KEY, res -> {
    if (res.succeeded())
      context.response().setStatusCode(204).end();
    else
      sendError(503, context.response());
  });
}
```

[NOTE Status 204 ? | As you can see, we have set the response status to `204 - NO CONTENT`. Response to the HTTP method `delete` have generally no content.]

Wow! Our todo verticle is completed! Excited! But how to run our verticle? We need to *deploy* it. Fortunately, Vert.x provides us a launcher class - Vert.x Launcher, which could help deploy verticles and set configurations.

### Package with Vert.x Launcher

To build a jar package with Vert.x Launcher, add the following content to the `build.gradle` file:

```gradle
jar {
  // by default fat jar
  archiveName = 'vertx-blueprint-todo-backend-fat.jar'
  from { configurations.compile.collect { it.isDirectory() ? it : zipTree(it) } }
  manifest {
      attributes 'Main-Class': 'io.vertx.core.Launcher'
      attributes 'Main-Verticle': 'io.vertx.blueprint.todolist.verticles.SingleApplicationVerticle'
  }
}
```

- In the `jar` field, we configure it to generate **fat-jar** when compiles and point out the launcher class. A *fat-jar* is a convenient way to package a Vert.x application. It creates a jar containing both your application and all dependencies. Then, to launch it, you just need to execute `java -jar xxx.jar` without having to handle the `CLASSPATH`.

We set `Main-Class` attribute with `io.vertx.core.Launcher` so that we could make use of Vert.x Launcher to deploy verticle. And we set `Main-Verticle` attribute with the verticle class we want to deploy.

### Run our service

Now it's time to run our REST service! First we should start Redis service:

```bash
redis-server
```

Then let's build and run the application:

```bash
gradle build
java -jar build/libs/vertx-blueprint-todo-backend-fat.jar
```

If there are no problems, you will see `Succeeded in deploying verticle`. The most convenient way to test our todo REST APIs is to use [todo-backend-js-spec](https://github.com/TodoBackend/todo-backend-js-spec).

Input `http://127.0.0.1:8082/todos`:

![](/assets/blog/vertx-blueprint-todo-backend/todo-test-input.png)

Test result:

![TodoBackend Test Result](/assets/blog/vertx-blueprint-todo-backend/todo-test-result.png)

Of course, we could also visit the link directly or use other tools(e.g. `curl`):

```json
sczyh30@sczyh30-workshop:~$ curl http://127.0.0.1:8082/todos
[ {
  "id" : 20578623,
  "title" : "blah",
  "completed" : false,
  "order" : 95,
  "url" : "http://127.0.0.1:8082/todos/20578623"
}, {
  "id" : 1744802607,
  "title" : "blah",
  "completed" : false,
  "order" : 523,
  "url" : "http://127.0.0.1:8082/todos/1744802607"
}, {
  "id" : 981337975,
  "title" : "blah",
  "completed" : false,
  "order" : 95,
  "url" : "http://127.0.0.1:8082/todos/981337975"
} ]
```

Vert.x Launcher also accepts json file as the verticle config using `-conf`. We'll see it soon.

## Have a rest

Yeah~ Our todo service has been running correctly. But review the `SingleApplicationVerticle` class, you will find it very messy. The controller and service mix together, causing the class big. Besides, it's not convenient to extend our service if we mix services with the controller. Thus, we need to do refactor. See it in the [next post](/blog/vert-x-blueprint-todo-backend-tutorial-part-2/)!
