---
title: Simplified database transaction management with the Vert.x RxJava API
template: post.html
date: 2018-07-02
author: tsegismont
---

_TL;DR As of 3.5, managing database transactions with Vert.x requires a lot of boilerplate code._
_Vert.x 3.6 will provide helpers and `Observable` transformers to easily make a reactive flow transactional._

## Simple queries with the _"Rxified"_ API

The [Vert.x API for RxJava](https://vertx.io/docs/vertx-rx/java2/) is one of the most popular modules in the Vert.x stack.

So we make sure the _"Rxified"_ API is easy to use for common programming tasks, such as reading rows from a relational database and sending the result to the client:

```java
dbClient.rxQuery("SELECT name, duration FROM tracks WHERE album = 'The Israelites'")
  .map(ResultSet::getResults)
  .map(rows -> {
    // Transform DB rows into a client-friendly JSON object
  })
  .subscribe(json -> {
    // Send JSON to the client
  }, t -> {
    // Send error to the client
  });
```

## Managing transactions with Vert.x 3.5

But very often, developers have to implement complex interactions with the database, running inside a single transaction.
To do so, the implementation must follow this process:

- get a connection from the pool,
- start a transaction,
- execute queries,
- if all queries succeed, commit the transaction,
- otherwise, rollback the changes.

How does that translate to code?

```java
// Get a connection from the pool
dbClient.rxGetConnection().flatMap(sqlConnection -> {
  // Setting auto-commit mode to false implicitely starts a transaction
  return sqlConnection.rxSetAutoCommit(false)
    .andThen(
      // Database queries
      sqlConnection.rxExecute("INSERT INTO albums (name) VALUES ('The Israelites')")
        .andThen(sqlConnection.rxExecute("INSERT INTO tracks (album, name) VALUES ('The Israelites', 'Israelites')"))
        .andThen(sqlConnection.rxExecute("INSERT INTO tracks (album, name) VALUES ('The Israelites', 'Too Much Too Soon')"))
        .andThen(sqlConnection.rxQuery("SELECT name FROM tracks WHERE album = 'The Israelites'").map(ResultSet::getResults))
    )
    // Commit if all queries succeed
    .flatMap(rows -> sqlConnection.rxCommit().andThen(Single.just(rows)))
    .onErrorResumeNext(throwable -> {
      // On error, rollback the changes
      return sqlConnection.rxRollback().onErrorComplete()
        .andThen(sqlConnection.rxSetAutoCommit(true).onErrorComplete())
        .andThen(Single.error(throwable));
    }).flatMap(rows -> sqlConnection.rxSetAutoCommit(true).andThen(Single.just(rows)))
    .doFinally(sqlConnection::close);
}).map(rows -> {
  // Transform DB rows into a client-friendly JSON object
}).subscribe(json -> {
  // Send JSON to the client
}, t -> {
  // Send error to the client
});
```

That is a lot of boilerplate around the specific database queries...
It would be better to relieve the developer from maintaining it.

## Vert.x 3.6 tools for transaction management

That is why Vert.x 3.6 will provide _`Observable` transformers_ that can be applied to reactive flows with [`compose`](http://reactivex.io/RxJava/javadoc/io/reactivex/Flowable.html#compose-io.reactivex.FlowableTransformer-) to make them transactional:

* `SQLClientHelper#txFlowableTransformer`
* `SQLClientHelper#txObservableTransformer`
* `SQLClientHelper#txSingleTransformer`
* `SQLClientHelper#txMaybeTransformer`
* `SQLClientHelper#txCompletableTransformer`

These _transformers_ wrap the corresponding source of events with SQL transaction management.

```java
dbClient.rxGetConnection().flatMap(sqlConnection -> {
  return sqlConnection.rxExecute("INSERT INTO albums (name) VALUES ('The Israelites')")
    .andThen(sqlConnection.rxExecute("INSERT INTO tracks (album, name) VALUES ('The Israelites', 'Israelites')"))
    .andThen(sqlConnection.rxExecute("INSERT INTO tracks (album, name) VALUES ('The Israelites', 'Too Much Too Soon')"))
    .andThen(sqlConnection.rxQuery("SELECT name FROM tracks WHERE album = 'The Israelites'").map(ResultSet::getResults))
    .compose(SQLClientHelper.txSingleTransformer(sqlConnection))
    .doFinally(sqlConnection::close);
}).map(rows -> {
  // Transform DB rows into a client-friendly JSON object
}).subscribe(json -> {
  // Send JSON to the client
}, t -> {
  // Send error to the client
});
```

Source _transformers_ provide maximum flexibility: you are still able to execute operations with the connection after the transaction completes.

However, you usually do not need the connection after the changes are _commited_ or _rollbacked_.
In this case, you may simply create you source observable with one of the transactional helper methods in `io.vertx.reactivex.ext.sql.SQLClientHelper`.

Let's rewrite the previous example:

```java
SQLClientHelper.inTransactionSingle(client, sqlConnection -> {
  return sqlConnection.rxExecute("INSERT INTO albums (name) VALUES ('The Israelites')")
    .andThen(sqlConnection.rxExecute("INSERT INTO tracks (album, name) VALUES ('The Israelites', 'Israelites')"))
    .andThen(sqlConnection.rxExecute("INSERT INTO tracks (album, name) VALUES ('The Israelites', 'Too Much Too Soon')"))
    .andThen(sqlConnection.rxQuery("SELECT name FROM tracks WHERE album = 'The Israelites'").map(ResultSet::getResults))
}).map(rows -> {
  // Transform DB rows into a client-friendly JSON object
}).subscribe(json -> {
  // Send JSON to the client
}, t -> {
  // Send error to the client
});
```

## Give it a try

Vert.x 3.6 is expected around fall, but the code is already in master and _snapshots_ are regularly published to Sonatype's OSS repos.

So give it a try and feel free to provide your feeback on our user or dev [channels](https://vertx.io/community).
