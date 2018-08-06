---
title: The RSS reader tutorial. Step 2.
template: post.html
date: 2018-08-06
author: Sammers21
--- 

# Before

Before completing this step make sure that you have successfully cloned the RSS reader repository and checked out the `step_2_rx` branch:
```bash
git clone https://github.com/Sammers21/rss-reader
cd rss-reader
git checkout step_2_rx
```

In order to make sure that you are able to run the app you need to go to the [Running](https://github.com/Sammers21/rss-reader/tree/step_2_rx#running) section and 
follow the steps.

# What we want to do

The RSS reader example assumes implementing 3 endpoints. This article is dedicated to implementing the ` GET /user/{user_id}/rss_channels ` endpoint.

See [previous step](LINK_TO_THE_FIRST_STEP).

# Implementing

The endpoint will allow the fronted app show a list of RSS feeds a user subscribed on. Each time someone is accessing the endpoint the `AppVerticle#getRssChannels` method is called. We can implement this methods in this way:

```java
private void getRssChannels(RoutingContext ctx) {
    String userId = ctx.request().getParam("user_id");
    if (userId == null) {
        responseWithInvalidRequest(ctx);
    } else {
        Single<List<Row>> fullFetch = client.rxExecuteWithFullFetch(selectRssLinksByLogin.bind(userId));
        fullFetch.flattenAsFlowable(rows -> {
            List<String> links = rows.stream()
                    .map(row -> row.getString(0))
                    .collect(Collectors.toList());
            return links.stream().map(selectChannelInfo::bind).map(
                    statement -> client.rxExecuteWithFullFetch(statement)
            ).collect(Collectors.toList());
        }).flatMapSingle(singleOfRows -> singleOfRows)
                .flatMap(Flowable::fromIterable)
                .toList()
                .subscribe(listOfRows -> {
                    JsonObject responseJson = new JsonObject();
                    JsonArray channels = new JsonArray();

                    listOfRows.forEach(eachRow -> channels.add(
                            new JsonObject()
                                    .put("description", eachRow.getString(0))
                                    .put("title", eachRow.getString(1))
                                    .put("link", eachRow.getString(2))
                                    .put("rss_link", eachRow.getString(3))
                    ));

                    responseJson.put("channels", channels);
                    ctx.response().end(responseJson.toString());
                }, error -> {
                    log.error("failed to get rss channels", error);
                    ctx.response().setStatusCode(500).end("Unable to retrieve the info from C*");
                });
    }
}
```

Also, this method is using `selectChannelInfo` and `selectRssLinksByLogin` fields, they should be initialized in the `AppVerticle#prepareNecessaryQueries` method:


```java
private Single prepareNecessaryQueries() {
    Single<PreparedStatement> insertLoginWithLoginStatement = client.rxPrepare("INSERT INTO rss_by_user (login , rss_link ) VALUES ( ?, ?);");
    Single<PreparedStatement> selectChannelInfoByLinkStatement = client.rxPrepare("SELECT description, title, site_link, rss_link FROM channel_info_by_rss_link WHERE rss_link = ? ;");
    Single<PreparedStatement> selectRssLinksByLoginStatement = client.rxPrepare("SELECT rss_link FROM rss_by_user WHERE login = ? ;");
    insertLoginWithLoginStatement.subscribe(preparedStatement -> insertNewLinkForUser = preparedStatement);
    selectChannelInfoByLinkStatement.subscribe(preparedStatement -> selectChannelInfo = preparedStatement);
    selectRssLinksByLoginStatement.subscribe(preparedStatement -> selectRssLinksByLogin = preparedStatement);

    return insertLoginWithLoginStatement
            .compose(one -> selectChannelInfoByLinkStatement)
            .compose(another -> selectRssLinksByLoginStatement);
}
```

# Conclusion

On this step, we have successfully implemented the second endpoint, which allow the browser app to obtain channel information about specific user. To ensure that it is working fine, you need to visit your `localhost:8080` and click to the refresh button. Channel list should appear immediately.

[3rd step](LINK_TO_STEP_3).


Thanks for reading this. I hope you enjoyed reading this article. See you soon on our [Gitter channel](https://gitter.im/eclipse-vertx/vertx-users)!