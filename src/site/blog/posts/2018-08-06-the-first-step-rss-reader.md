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
git checkout step_1
```

In order to make sure that you are able to run the app you need to go to the [Running](https://github.com/Sammers21/rss-reader/tree/step_1#running) section and 
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

The idea is simple. When the application is starting the `AppVerticle` is deployed, then it tries to initialize storage schema, described in `src/main/resources/schema.cql` by reading the file and executing described queries line by line. After the schema initialization the `AppVerticle` deploys `FetchVerticle` and starts a HTTP server.

## Implementing the endpoint


working....

