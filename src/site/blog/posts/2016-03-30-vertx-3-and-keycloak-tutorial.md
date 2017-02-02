---
title: Vertx 3 and Keycloak tutorial
date: 2016-03-30
template: post.html
author: pmlopes
---

With the upcoming release of Vert.x 3.3 securing your application with Keycloak is even easier than before.

## About Keycloak

Keycloak describes itself as an _Open Source Identity and Access Management For Modern Applications and Services_.

With Keycloak you can quickly add _Authentication_ and _Authorization_ to your vert.x application. The easy way is to
setup a realm on keycloak and once you're done, export the configuration to your vert.x app.

This how you would secure your app:

1. create a `OAuth2Auth` instance with `OAuth2Auth.createKeycloak(...)`
2. copy your config from the keycloak admin GUI
3. setup your callback according to what you entered on keycloak
4. secure your resource with `router.route("/protected/*").handler(oauth2)`

## Screencast

The following screencast explains how you can do this from scratch:

<iframe width="1280" height="720" src="https://www.youtube.com/embed/c20igjL69Mo" frameborder="0" allowfullscreen></iframe>

Don't forget to follow our [youtube channel](https://www.youtube.com/channel/UCGN6L3tRhs92Uer3c6VxOSA)!
