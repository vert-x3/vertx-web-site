---
title: Vert.x Blueprint - Todo-Backend Tutorial (Part 2)
template: post.html
date: 2016-06-17
author: sczyh30
draft: true
---

## Table of contents

- [Refactor: Decouple controller and service](#decouple-controller-and-service)
    - [Asynchronous service using Future](#asynchronous-service-using-future)
    - [Refactor!](#refactor-)
    - [Implement our service with Vert.x-Redis](#implement-our-service-with-vert-x-redis)
    - [Implement our service with Vert.x-JDBC](#implement-our-service-with-vert-x-jdbc)
    - [Run again!](#run-)
- [Cheers!](#cheers-)
- [From other frameworks?](#from-other-frameworks-)

## Preface

In the second part of the tutorial, we are going to do refactor in order to decouple controller and service.

## Decouple controller and service

### Asynchronous service using Future

So let's design our service interface. As we mentioned above, our service needs to be asynchronous, so it should either takes a `Handler` parameter or returns `Future`. But imagine, if there are many handlers compositing, You will fall into *callback hell*, which is terrible. Here, we design our todo service using `Future`.

Create `TodoService` interface in package `io.vertx.blueprint.todolist.service` and write:

```java
package io.vertx.blueprint.todolist.service;

import io.vertx.blueprint.todolist.entity.Todo;
import io.vertx.core.Future;

import java.util.List;
import java.util.Optional;


public interface TodoService {

  Future<Boolean> initData(); // init the data (or table)

  Future<Boolean> insert(Todo todo);

  Future<List<Todo>> getAll();

  Future<Optional<Todo>> getCertain(String todoID);

  Future<Todo> update(String todoId, Todo newTodo);

  Future<Boolean> delete(String todoId);

  Future<Boolean> deleteAll();

}
```

Notice that the `getCertain` method returns a `Future<Optional<Todo>>`. What's an `Optional`? It represents an object that might be null. Because the todoId we give might not exist in our persistence, we could wrap the result with `Optional`. `Optional` is intended to prevent `NullPointerException` and it is widely used in functional programming.

Now that we have designed our new asynchronous service interface, let's refactor the verticle!

### Refactor!

We create a new verticle to implement that. Create the `src/main/java/io/vertx/blueprint/todolist/verticles/TodoVerticle.java ` file and write:

```java
package io.vertx.blueprint.todolist.verticles;

import io.vertx.blueprint.todolist.Constants;
import io.vertx.blueprint.todolist.entity.Todo;
import io.vertx.blueprint.todolist.service.TodoService;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.AsyncResult;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.http.HttpMethod;
import io.vertx.core.http.HttpServerResponse;
import io.vertx.core.json.DecodeException;
import io.vertx.core.json.Json;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.CorsHandler;

import java.util.HashSet;
import java.util.Random;
import java.util.Set;
import java.util.function.Consumer;

public class TodoVerticle extends AbstractVerticle {

  private static final String HOST = "0.0.0.0";
  private static final int PORT = 8082;

  private TodoService service;

  private void initData() {
    // TODO
  }

  @Override
  public void start(Future<Void> future) throws Exception {
    Router router = Router.router(vertx);
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

    router.route().handler(BodyHandler.create());
    router.route().handler(CorsHandler.create("*")
      .allowedHeaders(allowHeaders)
      .allowedMethods(allowMethods));

    // routes
    router.get(Constants.API_GET).handler(this::handleGetTodo);
    router.get(Constants.API_LIST_ALL).handler(this::handleGetAll);
    router.post(Constants.API_CREATE).handler(this::handleCreateTodo);
    router.patch(Constants.API_UPDATE).handler(this::handleUpdateTodo);
    router.delete(Constants.API_DELETE).handler(this::handleDeleteOne);
    router.delete(Constants.API_DELETE_ALL).handler(this::handleDeleteAll);

    vertx.createHttpServer()
      .requestHandler(router::accept)
      .listen(PORT, HOST, result -> {
          if (result.succeeded())
            future.complete();
          else
            future.fail(result.cause());
        });

    initData();
  }

  private void handleCreateTodo(RoutingContext context) {
    // TODO
  }

  private void handleGetTodo(RoutingContext context) {
    // TODO
  }

  private void handleGetAll(RoutingContext context) {
    // TODO
  }

  private void handleUpdateTodo(RoutingContext context) {
    // TODO
  }

  private void handleDeleteOne(RoutingContext context) {
    // TODO
  }

  private void handleDeleteAll(RoutingContext context) {
     // TODO
  }

  private void sendError(int statusCode, HttpServerResponse response) {
    response.setStatusCode(statusCode).end();
  }

  private void badRequest(RoutingContext context) {
    context.response().setStatusCode(400).end();
  }

  private void notFound(RoutingContext context) {
    context.response().setStatusCode(404).end();
  }

  private void serviceUnavailable(RoutingContext context) {
    context.response().setStatusCode(503).end();
  }

  private Todo wrapObject(Todo todo, RoutingContext context) {
    int id = todo.getId();
    if (id > Todo.getIncId()) {
      Todo.setIncIdWith(id);
    } else if (id == 0)
      todo.setIncId();
    todo.setUrl(context.request().absoluteURI() + "/" + todo.getId());
    return todo;
  }
}
```

So familiar yeah? The main structure of the verticle doesn't vary very much. Now let's write each route handlers using our service interface.

First is `initData` method, which is used to init service and persistence. Here are the code:

```java
private void initData() {
  final String serviceType = config().getString("service.type", "redis");
  System.out.println("[INFO]Service Type: " + serviceType);
  switch (serviceType) {
    case "jdbc":
      service = new JdbcTodoService(vertx, config());
      break;
    case "redis":
    default:
      RedisOptions config = new RedisOptions()
        .setHost(config().getString("redis.host", "127.0.0.1"))
        .setPort(config().getInteger("redis.port", 6379));
      service = new RedisTodoService(vertx, config);
  }

  service.initData().setHandler(res -> {
      if (res.failed()) {
        System.err.println("[Error] Persistence service is not running!");
        res.cause().printStackTrace();
      }
    });
}
```

In `initData` method, we first read service type from the verticle config. Here we have two kinds of services: `redis` and `jdbc`, by default `redis`. Then we create corresponding service according to the service type, with the configuration we read from the config file. We'll see the config file later.

Then we attach a handler on the `Future` returned by `service.initData()`. The handler will be called once the future is assigned or failed. Once the initialization action fails, our service will print error info on the console.

Other handlers are similar to the version in `SingleApplicationVerticle`, but replace `redis` with `service`. We're not going to elaborate the detail. Just give code:

```java
/**
 * Wrap the result handler with failure handler (503 Service Unavailable)
 */
private <T> Handler<AsyncResult<T>> resultHandler(RoutingContext context, Consumer<T> consumer) {
  return res -> {
    if (res.succeeded()) {
      consumer.accept(res.result());
    } else {
      serviceUnavailable(context);
    }
  };
}

private void handleCreateTodo(RoutingContext context) {
  try {
    final Todo todo = wrapObject(new Todo(context.getBodyAsString()), context);
    final String encoded = Json.encodePrettily(todo);

    service.insert(todo).setHandler(resultHandler(context, res -> {
      if (res) {
        context.response()
          .setStatusCode(201)
          .putHeader("content-type", "application/json")
          .end(encoded);
      } else {
        serviceUnavailable(context);
      }
    }));
  } catch (DecodeException e) {
    sendError(400, context.response());
  }
}

private void handleGetTodo(RoutingContext context) {
  String todoID = context.request().getParam("todoId");
  if (todoID == null) {
    sendError(400, context.response());
    return;
  }

  service.getCertain(todoID).setHandler(resultHandler(context, res -> {
    if (!res.isPresent())
      notFound(context);
    else {
      final String encoded = Json.encodePrettily(res.get());
      context.response()
        .putHeader("content-type", "application/json")
        .end(encoded);
    }
  }));
}

private void handleGetAll(RoutingContext context) {
  service.getAll().setHandler(resultHandler(context, res -> {
    if (res == null) {
      serviceUnavailable(context);
    } else {
      final String encoded = Json.encodePrettily(res);
      context.response()
        .putHeader("content-type", "application/json")
        .end(encoded);
    }
  }));
}

private void handleUpdateTodo(RoutingContext context) {
  try {
    String todoID = context.request().getParam("todoId");
    final Todo newTodo = new Todo(context.getBodyAsString());
    // handle error
    if (todoID == null) {
      sendError(400, context.response());
      return;
    }
    service.update(todoID, newTodo)
      .setHandler(resultHandler(context, res -> {
        if (res == null)
          notFound(context);
        else {
          final String encoded = Json.encodePrettily(res);
          context.response()
            .putHeader("content-type", "application/json")
            .end(encoded);
        }
      }));
  } catch (DecodeException e) {
    badRequest(context);
  }
}

private Handler<AsyncResult<Boolean>> deleteResultHandler(RoutingContext context) {
  return res -> {
    if (res.succeeded()) {
      if (res.result()) {
        context.response().setStatusCode(204).end();
      } else {
        serviceUnavailable(context);
      }
    } else {
      serviceUnavailable(context);
    }
  };
}

private void handleDeleteOne(RoutingContext context) {
  String todoID = context.request().getParam("todoId");
  service.delete(todoID)
    .setHandler(deleteResultHandler(context));
}

private void handleDeleteAll(RoutingContext context) {
  service.deleteAll()
    .setHandler(deleteResultHandler(context));
}
```

Quite similar! Here we encapsulate two handler generator: `resultHandler` and `deleteResultHandler`. This can reduce some code.

Since our new verticle has been done, it's time to implement the services. We will implement two services using different persistence. One is our familiar *Redis*, the other is *MySQL*.

### Implement our service with Vert.x-Redis

Since you have implemented single version verticle with Redis just now, you are supposed to get accustomed to Vert.x-Redis. Here we just explain one `update` method, the others are similar and the code is on [GitHub](https://github.com/sczyh30/vertx-blueprint-todo-backend/blob/master/src/main/java/io/vertx/blueprint/todolist/service/RedisTodoService.java).

#### Monadic future

Recall the logic of *update* we wrote, we will discover that this is a composite of two actions - *get* and *insert*. So can we make use of existing `getCertain` and `insert` method? Of course! Because `Future` is composable. You can compose two or more futures. Sounds wonderful! Let's write:

```java
@Override
public Future<Todo> update(String todoId, Todo newTodo) {
  return this.getCertain(todoId).compose(old -> { // (1)
    if (old.isPresent()) {
      Todo fnTodo = old.get().merge(newTodo);
      return this.insert(fnTodo)
        .map(r -> r ? fnTodo : null); // (2)
    } else {
      return Future.succeededFuture(); // (3)
    }
  });
}
```

First we called `this.getCertain` method, which returns `Future<Optional<Todo>>`. Simultaneously we use `compose` operator to combine this future with another future (1). The `compose` operator takes a `Function<T, Future<U>>` as parameter, which, actually is a lambda takes input with type `T` and returns a `Future` with type `U` (`T` and `U` can be the same). Then we check whether the old todo exists. If so, we merge the old todo with the new todo, and then update the todo. Notice that `insert` method returns `Future<Boolean>`, so we should transform it into `Future<Todo>` by `map` operator (2). The `map` operator takes a `Function<T, U>` as parameter, which, actually is a lambda takes type `T` and returns type `U`. We then return the mapped `Future`. If not exists, we return a succeeded future with a null result (3). Finally return the composed `Future`.

[NOTE The essence of `Future` | In functional programming, `Future` is actually a kind of `Monad`. This is a complicated concept, and you can just (actually more complicated!) refer it as objects that can be composed(`compose` or `flatMap`) and transformed(`map`). This feature is often called **Monadic**. ]

Our redis service is done~ Next let's implement our jdbc service.

### Implement our service with Vert.x-JDBC

#### JDBC ++ Asynchronous

We are going to implement our jdbc version service using Vert.x-JDBC and MySQL. As we know, reading or writing data from database is an blocking action, which may take a long time. We must wait until the result is available, which is terrible. Fortunately, Vert.x-JDBC is **asynchronous**. That means we could interact with a database throught a JDBC driver asynchronously. So when you want to do:

```java
String SQL = "SELECT * FROM todo";
// ...
ResultSet rs = pstmt.executeQuery(SQL);
```

it will be:

```java
connection.query(SQL, result -> {
    // do something with result...
});
```

The asynchronous interactions are efficient as it avoids waiting for the result. The handler will be called once the result is available.

#### Dependencies

The first thing is to add some dependencies in our `build.gradle` file:

```groovy
compile 'io.vertx:vertx-jdbc-client:3.3.0'
compile 'mysql:mysql-connector-java:6.0.2'
```

The first dependency provides `vertx-jdbc-client`, while the other provides the MySQL JDBC driver. If you want to use other databases, just change the second dependency to your database driver.

#### Initialize the JDBC client

In Vert.x-JDBC, we get a database connection from `JDBCClient` object; So let's see how to create a `JDBCClient` instance.

Create `JdbcTodoService` class in `io.vertx.blueprint.todolist.service` package and write:

```java
package io.vertx.blueprint.todolist.service;

import io.vertx.blueprint.todolist.entity.Todo;

import io.vertx.core.Future;
import io.vertx.core.Vertx;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.sql.SQLConnection;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


public class JdbcTodoService implements TodoService {

  private final Vertx vertx;
  private final JsonObject config;
  private final JDBCClient client;

  public JdbcTodoService(JsonObject config) {
    this(Vertx.vertx(), config);
  }

  public JdbcTodoService(Vertx vertx, JsonObject config) {
    this.vertx = vertx;
    this.config = config;
    this.client = JDBCClient.createShared(vertx, config);
  }
}
```

We use `JDBCClient.createShared(vertx, config)` to create an instance of JDBC client. We pass a `JsonObject` instance as the configuration. We need to provide this configuration:

- *url* - the JDBC url such as `jdbc:mysql://localhost/vertx_blueprint`
- *driver_class* - the JDBC driver class name such as `com.mysql.cj.jdbc.Driver`
- *user* - user of the database
- *password* - password of the database

As we mentioned above, we will read this `JsonObject` from a config file.

Now we have the JDBC client. And we need a database table like this:

```sql
CREATE TABLE `todo` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) DEFAULT NULL,
  `completed` TINYINT(1) DEFAULT NULL,
  `order` INT(11) DEFAULT NULL,
  `url` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
)
```

Let's store the sql sentence in our service(we do not discuss how to design db and write sql here):

```java
private static final String SQL_CREATE = "CREATE TABLE IF NOT EXISTS `todo` (\n" +
  "  `id` int(11) NOT NULL AUTO_INCREMENT,\n" +
  "  `title` varchar(255) DEFAULT NULL,\n" +
  "  `completed` tinyint(1) DEFAULT NULL,\n" +
  "  `order` int(11) DEFAULT NULL,\n" +
  "  `url` varchar(255) DEFAULT NULL,\n" +
  "  PRIMARY KEY (`id`) )";
private static final String SQL_INSERT = "INSERT INTO `todo` " +
  "(`id`, `title`, `completed`, `order`, `url`) VALUES (?, ?, ?, ?, ?)";
private static final String SQL_QUERY = "SELECT * FROM todo WHERE id = ?";
private static final String SQL_QUERY_ALL = "SELECT * FROM todo";
private static final String SQL_UPDATE = "UPDATE `todo`\n" +
  "SET `id` = ?,\n" +
  "`title` = ?,\n" +
  "`completed` = ?,\n" +
  "`order` = ?,\n" +
  "`url` = ?\n" +
  "WHERE `id` = ?;";
private static final String SQL_DELETE = "DELETE FROM `todo` WHERE `id` = ?";
private static final String SQL_DELETE_ALL = "DELETE FROM `todo`";
```

Now that all SQLs are prepared ok, let's implement our JDBC todo service~

#### Implement JDBC service

In order to interact with database, we need to acquire connection from `JDBCClient` like this:

```java
client.getConnection(conn -> {
      if (conn.succeeded()) {
        final SQLConnection connection = conn.result();
        // do something...
      } else {
        // handle failure
      }
    });
```

Since every action of our service need a connection, we encapsulate a method that returns `Handler<AsyncResult<SQLConnection>>` so that it can reduce some duplicate code:

```java
private Handler<AsyncResult<SQLConnection>> connHandler(Future future, Handler<SQLConnection> handler) {
  return conn -> {
    if (conn.succeeded()) {
      final SQLConnection connection = conn.result();
      handler.handle(connection);
    } else {
      future.fail(conn.cause());
    }
  };
}
```

After getting the connection, we can do *CRUD* action on it:

- `query` : execute a query (raw SQL)
- `queryWithParams` : execute a prepared statement query
- `updateWithParams` : execute a prepared statement insert, update or delete operation
- `execute`: execute any SQL sentence

All methods are asynchronous so takes a `Handler` that will be called when the action performed.

Now let's write the `initData` method:

```java
@Override
public Future<Boolean> initData() {
  Future<Boolean> result = Future.future();
  client.getConnection(connHandler(result, connection ->
    connection.execute(SQL_CREATE, create -> {
      if (create.succeeded()) {
        result.complete(true);
      } else {
        result.fail(create.cause());
      }
      connection.close();
    })));
  return result;
}
```

This method create the `todo` table if it doesn't exist. Don't forget to close the connection.

[NOTE Closing connection | Don't forget to close the SQL connection when you are done. The connection will be given back to the connection pool and be reused.]

Now let's implement `insert` method:

```java
@Override
public Future<Boolean> insert(Todo todo) {
  Future<Boolean> result = Future.future();
  client.getConnection(connHandler(result, connection -> {
    connection.updateWithParams(SQL_INSERT, new JsonArray().add(todo.getId())
      .add(todo.getTitle())
      .add(todo.isCompleted())
      .add(todo.getOrder())
      .add(todo.getUrl()), r -> {
      if (r.failed()) {
        result.fail(r.cause());
      } else {
        result.complete(true);
      }
      connection.close();
    });
  }));
  return result;
}
```

This method uses the `updateWithParams` method with an *INSERT* statement, and pass params into a `JsonArray` object in turn. This kind of action avoids SQL injection. Once the statement has been executed, we creates a new `Todo` entity.

Now let's see `getCertain` method:

```java
@Override
public Future<Optional<Todo>> getCertain(String todoID) {
  Future<Optional<Todo>> result = Future.future();
  client.getConnection(connHandler(result, connection -> {
    connection.queryWithParams(SQL_QUERY, new JsonArray().add(todoID), r -> {
      if (r.failed()) {
        result.fail(r.cause());
      } else {
        List<JsonObject> list = r.result().getRows();
        if (list == null || list.isEmpty()) {
          result.complete(Optional.empty());
        } else {
          result.complete(Optional.of(new Todo(list.get(0))));
        }
      }
      connection.close();
    });
  }));
  return result;
}
```

Here after the statement having been executed, we got a `ResultSet` instance, which represents the results of a query. The list of column names are available with `getColumnNames`, and the actual results available with `getResults`. Here we retrieve the rows as a list of Json object instances with `getRows` method.

The `getAll`, `update`, `delete` and `deleteAll` methods follow the same pattern. You can look up the code on [GitHub](https://github.com/sczyh30/vertx-blueprint-todo-backend/blob/master/src/main/java/io/vertx/blueprint/todolist/service/JdbcTodoService.java).

### Run!

Let's create a `config` directory in the root directory. For `jdbc` type, we create a json config file `config_jdbc.json`:

```json
{
  "service.type": "jdbc",
  "url": "jdbc:mysql://localhost/vertx_blueprint?characterEncoding=UTF-8&useSSL=false",
  "driver_class": "com.mysql.cj.jdbc.Driver",
  "user": "vbpdb1",
  "password": "666666*",
  "max_pool_size": 30
}
```

You need to replace `url`, `user` and `password` field by your own. If you want to use other database, you should also replace `driver_class` field with appropriate driver class.

For `redis` type, we create a json config file `config.json`:

```json
{
  "service.type": "redis"
}
```

And we should also modify the build file. Here is the full content of the `build.gradle` file:

```gradle
plugins {
  id 'java'
}

version '1.0'

ext {
  vertxVersion = "3.3.0"
}

jar {
  // by default fat jar
  archiveName = 'vertx-blueprint-todo-backend-fat.jar'
  from { configurations.compile.collect { it.isDirectory() ? it : zipTree(it) } }
  manifest {
    attributes 'Main-Class': 'io.vertx.core.Launcher'
    attributes 'Main-Verticle': 'io.vertx.blueprint.todolist.verticles.TodoVerticle'
  }
}

repositories {
  jcenter()
  mavenCentral()
  mavenLocal()
}

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

dependencies {
  compile ("io.vertx:vertx-core:${vertxVersion}")
  compile ("io.vertx:vertx-web:${vertxVersion}")
  compile ("io.vertx:vertx-jdbc-client:${vertxVersion}")
  compile ("io.vertx:vertx-redis-client:${vertxVersion}")
  compile ("io.vertx:vertx-codegen:${vertxVersion}")
  compile 'mysql:mysql-connector-java:6.0.2'

  testCompile ("io.vertx:vertx-unit:${vertxVersion}")
  testCompile group: 'junit', name: 'junit', version: '4.12'
}


task wrapper(type: Wrapper) {
  gradleVersion = '2.12'
}
```

Can't wait yeah?~ Let's now build our application:

```bash
gradle build
```

Then we can run our application with Redis:

```bash
java -jar build/libs/vertx-blueprint-todo-backend-fat.jar -conf config/config.json
```

We can also run our application with MySQL:

```bash
java -jar build/libs/vertx-blueprint-todo-backend-fat.jar -conf config/config_jdbc.json
```

We could use [todo-backend-js-spec](https://github.com/TodoBackend/todo-backend-js-spec) to test our todo API. As we didn’t change the API, the test should run smoothly.

And we also provide a [Docker Compose config file](https://github.com/sczyh30/vertx-blueprint-todo-backend/blob/master/docker-compose.yml) that could help us run our service with Docker Compose. You can see it in the repo.

![Docker Compose](/assets/blog/vertx-blueprint-todo-backend/vbptds-docker-compose-running.png)

## Cheers!

Congratulations, you have finished the todo backend service~ In this long tutorial, you have learned the usage of `Vert.x Web`, `Vert.x Redis` and `Vert.x JDBC`, and most importantly, the **asynchronous development model** of Vert.x.

To learn more about Vert.x, you can visit [Blog on Vert.x Website](http://vertx.io/blog/archives/).

## From other frameworks?

Well, you might have used other frameworks before, like *Spring Boot*. In this section, I will use analogy to introduce the concepts about Vert.x Web.

### From Spring Boot/Spring MVC

In Spring Boot, we usually configure the routes and handle the http requests in the Controller:

```java
@RestController
@ComponentScan
@EnableAutoConfiguration
public class TodoController {

  @Autowired
  private TodoService service;

  @RequestMapping(method = RequestMethod.GET, value = "/todos/{id}")
  public Todo getCertain(@PathVariable("id") int id) {
    return service.fetch(id);
  }
}
```

In Spring Boot, we configure the route using the annotation `@RequestMapping`. In Vert.x Web, things are a little different. We configure the route on the `Router` instance. And because Vert.x Web is asynchronous, we attach a `Handler` as the controller method callback to each route.

As for sending response, we use `end` method to write HTTP response in Vert.x Web. In Spring Boot, we send response to client simply by returning the result directly in the controller method.

### From Play Framework 2

If you are from Play Framework 2, you must be familiar with its asynchronous programming model. In Play Framework 2, we configure the route on the `routes` file, like the pattern `method path controller`:

```scala
GET     /todos/:todoId      controllers.TodoController.handleGetCertain(todoId: Int)
```

In Vert.x Web, we configure the route on the `Router` instance. So we can rewrite the above config:

```java
router.get("/todos/:todoId").handler(this::handleGetCertain);
```

`this::handleGetCertain` is the method reference (handler) that handles the request.

In Play Framework 2, we use asynchronous pattern with `Future`. Every handler returns an `Action`, which refers to type `Request[A] => Result`. We write our logic inside the `block: => Future[Result]` (or simply `block: R[A] => Result`) function closure like this:

```scala
def handleGetCertain(todoId: Int): Action[AnyContent] = Action.async {
    service.getCertain(todoId) map { // service return `Future[Option[Todo]]`
        case Some(res) =>
            Ok(Json.toJson(res))
        case None =>
            NotFound()
    }
}
```

And in Vert.x, we use asynchronous pattern with *callback*. We could rewrite as follows:

```java
private void handleCreateTodo(RoutingContext context) {
    String todoId = context.request().getParam("todoId"); // get path variable
    service.getCertain(todoId).setHandler(r -> { // service return `Future<Optional<Todo>>`
        if (r.succeeded) {
            Optional<Todo> res = r.result;
            if (res.isPresent()) {
                context.response()
                    .putHeader("content-type", "application/json")
                    .end(Json.encodePrettily(res)); // write `Result` to response with Ok(200)
            } else {
                sendError(404, context.response()); // NotFound(404)
            }
        } else {
            sendError(503, context.response());
        }
    });
}
```

In Vert.x, We write result to response directly by `end` method rather than encapsulate it with `Result`.

### Want to use other persistence frameworks?

You may want to use other persistence frameworks or libraries in Vert.x application, e.g. Mybatis ORM or Jedis. That's OK. You can use anything you want in Vert.x. But notice, ORM framework like Mybatis is synchronous and blocking, so the process could block the event loop. Thus, we need to use blocking handlers(`blockingHandler` method) to handle blocking requests:

```java
router.get("/todos/:todoId").blockingHandler(routingContext -> {
            String todoID = routingContext.request().getParam("todoId");
            Todo res = service.fetch(todoID);

            // do something and send response....

            routingContext.next();
        });
```

Vert.x will handle the blocking request in worker thread rather than event loop thread, so that it won't block the event loop.
