---
title: Using the asynchronous SQL client
template: post.html
date: 2015-10-19
author: cescoffier
---

Finally, back... This post is the fifth post of the introduction to vert.x blog series, after a not-that-small break. In this post we are going to see how we can use JDBC in a vert.x application, and this, using the asynchronous API provided by the [vertx-jdbc-client](http://vertx.io/docs/vertx-jdbc-client/java/).

## Previously in the introduction to vert.x series

As it was quite some time since the last post, let's start by refreshing our mind about the four previous posts:

1. The [first post]({{ site_url }}blog/my-first-vert-x-3-application/) has described how to build a vert.x application with Maven and execute unit tests.
2. The [second post]({{ site_url }}blog/vert-x-application-configuration/) has described how this application can become configurable.
3. The [third post]({{ site_url }}blog/some-rest-with-vert-x/) has introduced [vertx-web](http://vertx.io/docs/vertx-web/java/), and a small collection management application has been developed. This application offers a REST API used by a HTML/JavaScript frontend.
4. The [previous post]({{ site_url }}blog/unit-and-integration-tests/) has presented how you can run integration tests to ensure the behavior of your application.

In this post, back to code. The current application uses an in-memory map to store the products. It's time to use a database. In this post we are going to use [HSQL](http://hsqldb.org/), but you can use any database providing a JDBC driver. Interactions with the database will be asynchronous and made using the [vertx-jdbc-client](http://vertx.io/docs/vertx-jdbc-client/java/).

The code of this post are available on this Github [project](https://github.com/cescoffier/my-vertx-first-app), in the [post-5 branch](https://github.com/cescoffier/my-vertx-first-app/tree/post-5) branch.

## Asynchronous?

One of the vert.x characteristics is being asynchronous. With an asynchronous API, you don't wait for a result, but you are notified when this result is ready. Just to illustrate this, let's take a very simple example.

Let's imagine an `add` method. Traditionally, you would use it like this: `int r = add(1, 1)`. This is a synchronous API as you are waiting for the result. An asynchronous version of this API would be: `add(1, 1, r -> { /* do something with the result */ })`. In this version, you pass a `Handler` called when the result has been computed. The method does not return anything, and could be implemented as:

```
public void add(int a, int b, Handler<Integer> resultHandler) {
	int r = a + b;
	resultHandler.handle(r);
}
```

Just to avoid misconceptions, asynchronous API are not about threads. As we can see in the `add` example, there are no threads involved.

## JDBC yes, but asynchronous

So, now that we have seen some basics about asynchronous API, let's have a look to the vertx-jdbc-client. This component lets us interact with a database through a JDBC driver. These interactions are asynchronous, so when you were doing:

```
String sql = "SELECT * FROM Products";
ResultSet rs = stmt.executeQuery(sql);
```

it will be:

```
connection.query("SELECT * FROM Products", result -> {
		// do something with the result
});
```

This model is more efficient as it avoids waiting for the result. You are notified when the result is available.

Let's now modify our application to use a database to store our products.

## Some maven dependencies

The first things we need to do it to declare two new Maven dependencies in our `pom.xml` file:

```
<dependency>
  <groupId>io.vertx</groupId>
  <artifactId>vertx-jdbc-client</artifactId>
  <version>3.1.0</version>
</dependency>
<dependency>
  <groupId>org.hsqldb</groupId>
  <artifactId>hsqldb</artifactId>
  <version>2.3.3</version>
</dependency>
```

The first dependency provides the vertx-jdbc-client, while the second one provide the HSQL JDBC driver. If you want to use another database, change this dependency. You will also need to change the JDBC url and JDBC driver class name later.

## Initializing the JDBC client

Now that we have added these dependencies, it's time to create our JDBC client:

In the `MyFirstVerticle` class, declare a new field `JDBCClient jdbc;`, and add the following line at the beginning of the `start` method:

```
jdbc = JDBCClient.createShared(vertx, config(), "My-Whisky-Collection");
```

This creates an instance of JDBC client, configured with the configuration provided to the verticle. To work correctly this configuration needs to provide:

* _url_ - the JDBC url such as `jdbc:hsqldb:mem:db?shutdown=true`
* _driver_class_ - the JDBC driver class such as `org.hsqldb.jdbcDriver`

Ok, we have the client, we need a connection to the database. This is achieved using the `jdbc.getConnection` that take a `Handler<AsyncResult<SQLConnection>>` as parameter. Let's have a deeper look to this type. It's a `Handler`, so it is called when the result is ready. This result is an instance of `AsyncResult<SQLConnection>`. `AsyncResult` is a structure provided by vert.x that lets us know if the operation was completed successfully or failed. In case of success, it provides the result, here an instance of `SQLConnection`.

When you receive an instance of `AsyncResult`, your code generally looks like:

```
if (ar.failed()) {
  System.err.println("The operation has failed...: "
      + ar.cause().getMessage());
} else {
  // Use the result:
  result = ar.result();
 }
```

So, let's go back to our `SQLConnection`. We need to retrieve it, and then start the rest of the application. This changes how we start the application, as it will become asynchronous. So, if we divide our startup sequence into small chunks it would be something like:

```
startBackend(
 (connection) -> createSomeData(connection,
     (nothing) -> startWebApp(
         (http) -> completeStartup(http, fut)
     ), fut
 ), fut);
```

with:

1. `startBackend` - retrieves a `SQLConnection` and then calls the next step
2. `createSomeData` - initializes the database and inserts some data. When done, it calls the next step
3. `startWebApp` - starts our web application
4. `completeStartup` - finalizes our start sequence

`fut` is the completion future passed by vert.x that let us report when we are started, or if an issue has been encountered while starting.

Let's have a look to `startBackend`:

```
  private void startBackend(Handler<AsyncResult<SQLConnection>> next, Future<Void> fut) {
    jdbc.getConnection(ar -> {
      if (ar.failed()) {
        fut.fail(ar.cause());
      } else {
        next.handle(Future.succeededFuture(ar.result()));
      }
    });
  }
```

This method retrieves a `SQLConnection`, check whether this operation succeeded. If so, it calls the next step. In case of failure, it reports it.

The other methods follow the same pattern: 1) check if the last operation has succeeded, 2) do the task, 3) call the next step.

### A bit of SQL...

Our client is ready, let's now write some SQL statements. Let's start by the `createSomeData` method that is part of the startup sequence:

```
private void createSomeData(AsyncResult<SQLConnection> result,
    Handler<AsyncResult<Void>> next, Future<Void> fut) {
    if (result.failed()) {
      fut.fail(result.cause());
    } else {
      SQLConnection connection = result.result();
      connection.execute(
          "CREATE TABLE IF NOT EXISTS Whisky (id INTEGER IDENTITY, name varchar(100), " +
          "origin varchar(100))",
          ar -> {
            if (ar.failed()) {
              fut.fail(ar.cause());
              connection.close();
              return;
            }
            connection.query("SELECT * FROM Whisky", select -> {
              if (select.failed()) {
                fut.fail(ar.cause());
                connection.close();
                return;
              }
              if (select.result().getNumRows() == 0) {
                insert(
                    new Whisky("Bowmore 15 Years Laimrig", "Scotland, Islay"),
                    connection,
                    (v) -> insert(new Whisky("Talisker 57° North", "Scotland, Island"),
                        connection,
                        (r) -> {
                          next.handle(Future.<Void>succeededFuture());
                          connection.close();
                        }));													
              } else {
                next.handle(Future.<Void>succeededFuture());
                connection.close();
              }
            });
          });
    }
  }
```
This method checks that the `SQLConnection` is available and then start executing some SQL statements. First, it creates the tables if there are not there yet. As you can see, the method called is structured as follows:

```
connection.execute(
    SQL statement,
    handler called when the statement has been executed
)
```

The handler receives an `AsyncResult<Void>`, _i.e._ a notification of the completion without an actual result.

[NOTE Closing connection| Don't forget to close the SQL connection when you are done. The connection will be given back to the connection pool and be reused.]

In the code of this handler, we check whether or not the statement has been executed correctly, and if so we check to see if the table already contains some data, if not, it inserts data using the `insert` method:

```
private void insert(Whisky whisky, SQLConnection connection, Handler<AsyncResult<Whisky>> next) {
  String sql = "INSERT INTO Whisky (name, origin) VALUES ?, ?";
  connection.updateWithParams(sql,
      new JsonArray().add(whisky.getName()).add(whisky.getOrigin()),
      (ar) -> {
        if (ar.failed()) {
          next.handle(Future.failedFuture(ar.cause()));
          return;
        }
        UpdateResult result = ar.result();
        // Build a new whisky instance with the generated id.
        Whisky w = new Whisky(result.getKeys().getInteger(0), whisky.getName(), whisky.getOrigin());
        next.handle(Future.succeededFuture(w));
      });
}
```

This method uses the `updateWithParams` method with an _INSERT_ statement, and pass values. This approach avoids SQL injection. Once the the statement has been executed, we creates a new `Whisky` object with the created (auto-generated) id.

## Some REST with a pinch of SQL

The method described  above is part of our start sequence. But what about the method invoked by our REST API. Let's have a look to the `getAll` method. This method is called by the web front-end to retrieve all stored products:

```
 private void getAll(RoutingContext routingContext) {
    jdbc.getConnection(ar -> {
      SQLConnection connection = ar.result();
      connection.query("SELECT * FROM Whisky", result -> {
        List<Whisky> whiskies = result.result().getRows().stream().map(Whisky::new).collect(Collectors.toList());
        routingContext.response()
            .putHeader("content-type", "application/json; charset=utf-8")
            .end(Json.encodePrettily(whiskies));
        connection.close(); // Close the connection		
      });
    });
  }
```

This method gets a `SQLConnection`, and then issue a query. Once the result has been retrieved it writes the HTTP response as before. The `getOne`, `deleteOne`, `updateOne` and `addOne` methods follow the same pattern. Notice that the connection can be closed after the response has been written.

Let's have a look to the result provided to the handler passed to the `query` method. It gets a `ResultSet`, which contains the query result. Each row is a `JsonObject`, so if your data object has a constructor taking a `JsonObject` as unique argument, creating there objects is straightforward.

## Test, test, and test again

We need to slightly update our tests to configure the `JDBCClient`. In the `MyFirstVertilceTest` class, change the `DeploymentOption` object created in the `setUp` method to be:

```
    DeploymentOptions options = new DeploymentOptions()
        .setConfig(new JsonObject()
            .put("http.port", port)
            .put("url", "jdbc:hsqldb:mem:test?shutdown=true")
            .put("driver_class", "org.hsqldb.jdbcDriver")
        );
```

In addition to the `http.port`, we also put the JDBC url and the class of the JDBC driver. We use an in-memory database for tests.

The same modification needs to be done in the `src/test/resources/my-it-config.json` file:

```
{
  "http.port": ${http.port},
  "url": "jdbc:hsqldb:mem:it-test?shutdown=true",
  "driver_class": "org.hsqldb.jdbcDriver"
}
```

The `src/main/conf/my-application-conf.json` file also needs to be updated, not for the tests, but to run the application:

```
{
  "http.port" : 8082,
  "url": "jdbc:hsqldb:file:db/whiskies",
  "driver_class": "org.hsqldb.jdbcDriver"
}
```

The JDBC url is a bit different in this last file, as we store the database on the file system.

## Show time!

Let's now build our application:

`mvn clean package`

As we didn't change the API (neither the public java one nor the REST), test should run smoothly.

Then launch the application with:

`java -jar target/my-first-app-1.0-SNAPSHOT-fat.jar -conf src/main/conf/my-application-conf.json `

Open your browser to `http://localhost:8082/assets/index.html`, and you should see the application using the database. This time the products are stored in a database persisted on the file system. So, if we stop and restart the application, the data is restored.

## Conclusion

In this post, we saw how you can use JDBC database with vert.x, and thus without too much burden. You may have been surprised by the asynchronous development model, but once you start using it, it's hard to come back.

In the [next post](http://vertx.io/blog/combine-vert-x-and-mongo-to-build-a-giant/), we see how the same application can use mongoDB instead of HSQL.

Stay tuned, and happy coding !
