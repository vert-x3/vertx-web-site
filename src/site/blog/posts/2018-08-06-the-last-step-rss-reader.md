---
title: The RSS reader tutorial. Step 3.
template: post.html
date: 2018-08-06
author: Sammers21
--- 

# Before

Before completing this step make sure that you have successfully cloned the RSS reader repository and checked out the `step_3_rx` branch:
```bash
git clone https://github.com/Sammers21/rss-reader
cd rss-reader
git checkout step_3_rx
```

In order to make sure that you are able to run the app you need to go to the [Running](https://github.com/Sammers21/rss-reader/tree/step_3_rx#running) section and 
follow the steps.

# What we want to do

The RSS reader example assumes implementing 3 endpoints. This article is dedicated to implementing the last `GET /articles/by_rss_link?link={rss_link}` endpoint - for retrieving information about articles on a specific RSS channel .

See [previous step](LINK_TO_THE_SECOND_STEP).

# Implementing

For obtaining articles by RSS link we need to prepare a related statement first. Change `AppVerticle#prepareNecessaryQueries` in this way:

```java
private Single prepareNecessaryQueries() {
    Single<PreparedStatement> insertLoginWithLoginStatement = client.rxPrepare("INSERT INTO rss_by_user (login , rss_link ) VALUES ( ?, ?);");
    Single<PreparedStatement> selectChannelInfoByLinkStatement = client.rxPrepare("SELECT description, title, site_link, rss_link FROM channel_info_by_rss_link WHERE rss_link = ? ;");
    Single<PreparedStatement> selectRssLinksByLoginStatement = client.rxPrepare("SELECT rss_link FROM rss_by_user WHERE login = ? ;");
    Single<PreparedStatement> selectArticlesByRssLinkStatement = client.rxPrepare("SELECT title, article_link, description, pubDate FROM articles_by_rss_link WHERE rss_link = ? ;");

    insertLoginWithLoginStatement.subscribe(preparedStatement -> insertNewLinkForUser = preparedStatement);
    selectChannelInfoByLinkStatement.subscribe(preparedStatement -> selectChannelInfo = preparedStatement);
    selectRssLinksByLoginStatement.subscribe(preparedStatement -> selectRssLinksByLogin = preparedStatement);
    selectArticlesByRssLinkStatement.subscribe(preparedStatement -> selectArticlesByRssLink = preparedStatement);

    return insertLoginWithLoginStatement
            .compose(one -> selectChannelInfoByLinkStatement)
            .compose(another -> selectRssLinksByLoginStatement)
            .compose(another -> selectArticlesByRssLinkStatement);
}
``` 

And now, we can implement the `AppVerticle#getArticles` method. Basically, it will use the `selectArticlesByRssLink` statement for finding articles by the given link. Implementation:

```java
private void getArticles(RoutingContext ctx) {
    String link = ctx.request().getParam("link");
    if (link == null) {
        responseWithInvalidRequest(ctx);
    } else {
        client.rxExecuteWithFullFetch(selectArticlesByRssLink.bind(link)).subscribe(
                rows -> {
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
                }, error -> {
                    log.error("failed to get articles for " + link, error);
                    ctx.response().setStatusCode(500).end("Unable to retrieve the info from C*");
                }
        );
    }
}
```

# Conclusion

During the series you have implemented the RSS reader app, which is aimed to show, how can you use Eclipse Vert.x Cassandra client
along with Rx Java 2 API for implementing real app.

Thanks for reading this. I hope you enjoyed reading this series. See you soon on our [Gitter channel](https://gitter.im/eclipse-vertx/vertx-users)!