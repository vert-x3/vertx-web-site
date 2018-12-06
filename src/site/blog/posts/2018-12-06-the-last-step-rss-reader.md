---
title: The RSS reader tutorial. Step 3.
template: post.html
date: 2018-12-06
author: Sammers21
--- 

# Quick recap

Now that [Vert.x 3.6.0 has been released](https://vertx.io/blog/eclipse-vert-x-3-6-0-released/), it's the perfect time to conclude our [Vert.x Cassandra Client](https://vertx.io/docs/vertx-cassandra-client/java/) tutorial!

In [the previous step](https://vertx.io/blog/the-rss-reader-tutorial-step-2/) we have successfully implemented the second endpoint 
of the RSS reader app.

The RSS reader example assumes implementing 3 endpoints. This article is dedicated to implementing the last `GET /articles/by_rss_link?link={rss_link}` endpoint.

Before completing this step, make sure your are in the `step_3` git branch:
```bash
git checkout step_3
```

# Implementing the 3rd endpoint

The 3rd endpoint serves a list of articles, related to a specific RSS channel. In a request, we specify RSS channel by providing a link. On the application side, after receiving a request we execute the following query:

```text
SELECT title, article_link, description, pubDate FROM articles_by_rss_link WHERE rss_link = RSS_LINK_FROM_REQUEST ;
```

# Implementation

For obtaining articles by RSS link we need to prepare a related statement first. Change `AppVerticle#prepareSelectArticlesByRssLink` in this way:

```java
private Future<Void> prepareSelectArticlesByRssLink() {
    return Util.prepareQueryAndSetReference(client,
            "SELECT title, article_link, description, pubDate FROM articles_by_rss_link WHERE rss_link = ? ;",
            selectArticlesByRssLink
    );
}
``` 

And now, we can implement the `AppVerticle#getArticles` method. Basically, it will use the `selectArticlesByRssLink` statement for finding articles by the given link. Here's the implementation:

```java
private void getArticles(RoutingContext ctx) {
    String link = ctx.request().getParam("link");
    if (link == null) {
        responseWithInvalidRequest(ctx);
    } else {
        client.executeWithFullFetch(selectArticlesByRssLink.bind(link), handler -> {
            if (handler.succeeded()) {
                List<Row> rows = handler.result();

                JsonObject responseJson = new JsonObject();
                JsonArray articles = new JsonArray();

                rows.forEach(eachRow -> articles.add(
                        new JsonObject()
                                .put("title", eachRow.getString(0))
                                .put("link", eachRow.getString(1))
                                .put("description", eachRow.getString(2))
                                .put("pub_date", eachRow.getTimestamp(3).getTime())
                ));

                responseJson.put("articles", articles);
                ctx.response().end(responseJson.toString());
            } else {
                log.error("failed to get articles for " + link, handler.cause());
                ctx.response().setStatusCode(500).end("Unable to retrieve the info from C*");
            }
        });
    }
}
```

# Conclusion

During the series we have showed how the RSS reader app can be implemented with [Vert.x Cassandra client](https://github.com/vert-x3/vertx-cassandra-client).

Thanks for reading this. I hope you enjoyed reading this series. See you soon on our [Gitter channel](https://gitter.im/eclipse-vertx/vertx-users)!
