---
title: The RSS reader tutorial. Step 2.
template: post.html
date: 2018-08-27
author: Sammers21
--- 

# Quick recap

In [the previous step](https://vertx.io/blog/the-rss-reader-tutorial/) we have successfully implemented the first endpoint 
of the RSS reader app.

The RSS reader example assumes implementing 3 endpoints. This article is dedicated to implementing the ` GET /user/{user_id}/rss_channels ` endpoint.

Before completing this step, make sure your are in the `step_2` git branch:
```bash
git checkout step_2
```

# How we want the second endpoint to be implemented

Using the second endpoint we should be able to obtain an array of RSS channels by given `user_id`.

To achieve this we need to execute 2 following queries for obtaining:

1. RSS links the user provided for fetching:
    ```text
    SELECT rss_link FROM rss_by_user WHERE login = GIVEN_USER_ID ;
    ```
2. Channel info by a link:
    ```text
    SELECT description, title, site_link, rss_link FROM channel_info_by_rss_link WHERE rss_link = GIVEN_LINK ;
    ```

# Implementing

The endpoint will allow the fronted app show a list of RSS feeds a user subscribed on. Each time someone is accessing the endpoint the `AppVerticle#getRssChannels` method is called. We can implement this methods in this way:

```java
private void getRssChannels(RoutingContext ctx) {
    String userId = ctx.request().getParam("user_id");
    if (userId == null) {
        responseWithInvalidRequest(ctx);
    } else {
        Future<List<Row>> future = Future.future();
        client.executeWithFullFetch(selectRssLinksByLogin.bind(userId), future);
        future.compose(rows -> {
            List<String> links = rows.stream()
                    .map(row -> row.getString(0))
                    .collect(Collectors.toList());

            return CompositeFuture.all(
                    links.stream().map(selectChannelInfo::bind).map(statement -> {
                        Future<List<Row>> channelInfoRow = Future.future();
                        client.executeWithFullFetch(statement, channelInfoRow);
                        return channelInfoRow;
                    }).collect(Collectors.toList())
            );
        }).setHandler(h -> {
            if (h.succeeded()) {
                CompositeFuture result = h.result();
                List<List<Row>> results = result.list();
                List<Row> list = results.stream()
                        .flatMap(List::stream)
                        .collect(Collectors.toList());
                JsonObject responseJson = new JsonObject();
                JsonArray channels = new JsonArray();

                list.forEach(eachRow -> channels.add(
                        new JsonObject()
                                .put("description", eachRow.getString(0))
                                .put("title", eachRow.getString(1))
                                .put("link", eachRow.getString(2))
                                .put("rss_link", eachRow.getString(3))
                ));

                responseJson.put("channels", channels);
                ctx.response().end(responseJson.toString());
            } else {
                log.error("failed to get rss channels", h.cause());
                ctx.response().setStatusCode(500).end("Unable to retrieve the info from C*");
            }
        });
    }
}
```

Also, this method is using `selectChannelInfo` and `selectRssLinksByLogin` fields, they should be initialized in the `AppVerticle#prepareNecessaryQueries` method:


```java
 private Future<Void> prepareNecessaryQueries() {
        Future<PreparedStatement> selectChannelInfoPrepFuture = Future.future();
        client.prepare("SELECT description, title, site_link, rss_link FROM channel_info_by_rss_link WHERE rss_link = ? ;", selectChannelInfoPrepFuture);

        Future<PreparedStatement> selectRssLinkByLoginPrepFuture = Future.future();
        client.prepare("SELECT rss_link FROM rss_by_user WHERE login = ? ;", selectRssLinkByLoginPrepFuture);

        Future<PreparedStatement> insertNewLinkForUserPrepFuture = Future.future();
        client.prepare("INSERT INTO rss_by_user (login , rss_link ) VALUES ( ?, ?);", insertNewLinkForUserPrepFuture);

        return CompositeFuture.all(
                selectChannelInfoPrepFuture.compose(preparedStatement -> {
                    selectChannelInfo = preparedStatement;
                    return Future.succeededFuture();
                }),
                selectRssLinkByLoginPrepFuture.compose(preparedStatement -> {
                    selectRssLinksByLogin = preparedStatement;
                    return Future.succeededFuture();
                }),
                insertNewLinkForUserPrepFuture.compose(preparedStatement -> {
                    insertNewLinkForUser = preparedStatement;
                    return Future.succeededFuture();
                })
        ).mapEmpty();
    }
```

# Conclusion

On this step, we have successfully implemented the second endpoint, which allow the browser app to obtain channels information for a specific user. To ensure that it is working fine, you need to visit your `localhost:8080` and click to the refresh button. Channel list should appear immediately.

If you have any problems with completing this step you can checkout to `step_3`, where you can find all changes made for completing this step:
```bash
git checkout step_3
```


Thanks for reading this. I hope you enjoyed reading this article. See you soon on our [Gitter channel](https://gitter.im/eclipse-vertx/vertx-users)!
