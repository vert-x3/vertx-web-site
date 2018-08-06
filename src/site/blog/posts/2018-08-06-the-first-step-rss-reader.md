---
title: The RSS reader tutorial. Step 1.
template: post.html
date: 2018-08-06
author: Sammers21
--- 

# Before

Before completing this step make sure that you have successfully cloned the RSS reader repository and checked out the `step_1` branch:
```bash
git clone https://github.com/Sammers21/rss-reader
cd rss-reader
git checkout step_1_rx
```

In order to make sure that you are able to run the app you need to go to the [Running](https://github.com/Sammers21/rss-reader/tree/step_1_rx#running) section and 
follow the steps.

## Schema

If you are familiar with [Apache Cassandra](http://cassandra.apache.org/) you 
should know that the way your data is stored in Cassandra is dependent on queries 
you are running. It means that you need first to figure out what kind of queries 
you will be running, and then you can produce a storage scheme.

In our case we'd like our application to have 3 endpoints:

1. POST /user/{user_id}/rss_link - for adding links to a user's feed
2. GET /user/{user_id}/rss_channels - for retrieving information about RSS channels a user subscribed on
3. GET /articles/by_rss_link?link={rss_link} - for retrieving about articles on a specific RSS channel

For implementing this endpoints the schema should look in this way:

```
CREATE TABLE rss_by_user (login text , rss_link text, PRIMARY KEY (login, rss_link));
CREATE TABLE articles_by_rss_link(rss_link text, pubDate timestamp, title text, article_link text, description text, PRIMARY KEY ( rss_link , pubDate , article_link));
CREATE TABLE channel_info_by_rss_link(rss_link text, last_fetch_time timestamp,title text, site_link text, description text, PRIMARY KEY(rss_link));
```

## What to do on this step

On this step we will implement only the first endpoint, while 2 others is for 2 anther steps.

## Project overview

There is two notable classes in the project: `AppVerticle` and `FetchVerticle`. The first one is a [Verticle](https://vertx.io/docs/vertx-core/java/#_verticles) responsible for HTTP request handling and storage schema initialization. The second one is a [Verticle](https://vertx.io/docs/vertx-core/java/#_verticles) as well, but responsible for RSS feeds fetching.

The idea is simple. When the application is starting the `AppVerticle` is deployed, then it tries to initialize storage schema, described in `src/main/resources/schema.cql` file by reading it and executing listed queries line by line. After the schema initialization the `AppVerticle` deploys `FetchVerticle` and starts a HTTP server.

## Implementing the endpoint

Now, it is time to implement the first endpoint. Pay attention to `TODO`s, they are for pointing you out about where changes should be made.


Now, let's have a look at the `AppVerticle#postRssLink` method. This method is called each time the first endpoint is called, so we can figure out what is the posted body and id of the user, who performed the request, directly there. There are 2 main things we want to do in this method:

1. Notifying via the [Event Bus](https://vertx.io/docs/vertx-core/java/#event_bus) the `FetchVerticle` to fetch given by user link link to an RSS feed.
2. Inserting an entry to the `rss_by_user` table.


This is how the `AppVerticle#postRssLink` method should be implemented:

```java
private void postRssLink(RoutingContext ctx) {
    ctx.request().bodyHandler(body -> {
        JsonObject bodyAsJson = body.toJsonObject();
        String link = bodyAsJson.getString("link");
        String userId = ctx.request().getParam("user_id");
        if (link == null || userId == null) {
            responseWithInvalidRequest(ctx);
        } else {
            vertx.eventBus().send("fetch.rss.link", link);
            BoundStatement query = insertNewLinkForUser.bind(userId, link);
            client.rxExecute(query).subscribe(
                    result -> {
                        ctx.response().end(new JsonObject().put("message", "The feed just added").toString());
                    }, error -> {
                        ctx.response().setStatusCode(400).end(error.getMessage());
                    }
            );
        }
    });
}

private void responseWithInvalidRequest(RoutingContext ctx) {
    ctx.response()
            .setStatusCode(400)
            .putHeader("content-type", "application/json; charset=utf-8")
            .end(invalidRequest().toString());
}

private JsonObject invalidRequest() {
    return new JsonObject().put("message", "Invalid request");
}
```

You may noticed that `insertNewLinkForUser` is a `PreparedStatement`, and should be initialized before the `AppVerticle` start. Let's do it in the `AppVerticle#prepareNecessaryQueries` method:


```java
private Single prepareNecessaryQueries() {
    Single<PreparedStatement> rxPrepare = client.rxPrepare("INSERT INTO rss_by_user (login , rss_link ) VALUES ( ?, ?);");
    rxPrepare.subscribe(preparedStatement -> insertNewLinkForUser = preparedStatement);
    return rxPrepare;
}
```

Also, we should not forget to fetch a RSS by the link sent to `FetchVerticle` via the Event Bus. We can do it in the `FetchVerticle#startFetchEventBusConsumer` method:

```java

private void startFetchEventBusConsumer() {
    vertx.eventBus().localConsumer("fetch.rss.link", message -> {
        String rssLink = (String) message.body();
        log.info("fetching " + rssLink);
        webClient.getAbs(rssLink).rxSend()
                .subscribe(response -> {
                    String bodyAsString = response.bodyAsString("UTF-8");
                    try {
                        RssChannel rssChannel = new RssChannel(bodyAsString);
                        BatchStatement batchStatement = new BatchStatement();
                        BoundStatement channelInfoInsertQuery = insertChannelInfo.bind(
                                rssLink, new Date(System.currentTimeMillis()), rssChannel.description, rssChannel.link, rssChannel.title
                        );
                        batchStatement.add(channelInfoInsertQuery);
                        for (Article article : rssChannel.articles) {
                            batchStatement.add(insertArticleInfo.bind(rssLink, article.pubDate, article.link, article.description, article.title));
                        }
                        cassandraClient.rxExecute(batchStatement).subscribe(
                                done -> log.info("Storage have just been updated with entries from: " + rssLink),
                                error -> log.error("Unable to update storage with entities fetched from: " + rssLink, error)
                        );
                    } catch (Exception e) {
                        log.error("Unable to handle: " + rssLink);
                    }
                }, e -> {
                    log.error("Unable to fetch: " + rssLink, e);
                });
    });
}
```

And, finally, this code would not work if `insertChannelInfo` and `insertArticleInfo` statements will not be initialized at verticle start. Let's to this in the `FetchVerticle#prepareNecessaryQueries` method:

```java
private Completable prepareNecessaryQueries() {
    Single<PreparedStatement> insertChannelInfoStatement = cassandraClient.rxPrepare("INSERT INTO channel_info_by_rss_link ( rss_link , last_fetch_time, description , site_link , title ) VALUES (?, ?, ?, ?, ?);");
    insertChannelInfoStatement.subscribe(preparedStatement -> insertChannelInfo = preparedStatement);
    Single<PreparedStatement> insertArticleInfoStatement = cassandraClient.rxPrepare("INSERT INTO articles_by_rss_link ( rss_link , pubdate , article_link , description , title ) VALUES ( ?, ?, ?, ?, ?);");
    insertArticleInfoStatement.subscribe(preparedStatement -> insertArticleInfo = preparedStatement);
    return Completable.concatArray(insertArticleInfoStatement.toCompletable(), insertChannelInfoStatement.toCompletable());
}
```


# Observing

After all this changes you should ensure that the first endpoint is working correctly. So you need to run the application, go to localhost:8080 insert a link to a rss feed there([BBC UK feed news](http://feeds.bbci.co.uk/news/uk/rss.xml) for example) and then click the _ENTER_ button. Now you can connect to your local Cassandra instance, for instance with [cqlsh](https://docs.datastax.com/en/cql/3.3/cql/cql_reference/cqlsh.html), and find out how RSS feed data had been saved in the rss_reader keyspace:

```sh
cqlsh> SELECT * FROM rss_reader.rss_by_user limit 1  ;

 login | rss_link
-------+-----------------------------------------
 Pavel | http://feeds.bbci.co.uk/news/uk/rss.xml

(1 rows)
cqlsh> SELECT description FROM rss_reader.articles_by_rss_link  limit 1;

 description
-------------------------------------
 BBC coverage of latest developments

(1 rows)
```

# Conclusion 

In this article we figured out how to implement the first endpoint of RSS-reader app. Here is the link to the next article: [Step 2](LINK_TO_STEP_2).


Thanks for reading this. I hope you enjoyed reading this article. See you soon on our [Gitter channel](https://gitter.im/eclipse-vertx/vertx-users)!