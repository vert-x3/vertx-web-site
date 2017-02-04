---
title: OAuth2 got easy
template: post.html
date: 2016-12-02
author: pmlopes
---

`Oauth2` support exists in Eclipse Vert.x since version 3.2.0. The implementation follows the principles that rule the whole vert.x ecosystem: unopinionated, it does what you want it to do, simple but not too simple.

This works fine because `OAuth2` is a widely spread standard and vendors adhere to it quite well. However due to the API and the details of the specification it requires some knowledge on what kind of _flow_ your application needs to support, what are the endpoints for authorizing and getting tokens. This information, even though easily accessible to anyone who's got the time and will, to read the vendor documentation is easy to find, but it means that developers would need to spend time in a non-project problem-related task.

Vert.x thrives for being fast and productive, so what if we could help you focusing on your development tasks rather than reading Oauth2 provider documentation? This is what you can expect for the next release.

Out of the box you will find out that you can instantiate an OAuth2 provider as easy as:

```
Provider.create(vertx, clientId, clientSecret)
```

That's it! simple, to the point, sure it makes some assumptions, it assumes that you want to use the "`AUTH_CODE`" flow which is what you normally do for web applications with a backend.

The supported `Provider` implementations will configure the base API (which will be still available) with the correct URLs, scope encoding scheme or extra configuration such as "`shopId`"/"`GUID`" for `Shopify`/`Azure AD`.

So what supported `Provider`s can you already find?

 * [App.net](https://app.net/)
 * [Azure](https://azure.microsoft.com/en-us/)
 * [Box.com](https://box.com)
 * [Dropbox](https://dropbox.com)
 * [Facebook](https://facebook.com)
 * [Foursquare](https://foursquare.com)
 * [Github](http://github.com)
 * [Google](https://google.com) (either `AUTH_CODE` flow or `Server to Server` flow) 
 * [Instagram](https://instagram.com)
 * [Keycloak](https://keycloak.org)
 * [LinkedIn](https://linkedin.com)
 * [Mailchimp](https://mailchimp.com)
 * [Salesforce](https://salesforce.com)
 * [Shopify](https://shopify.com)
 * [Soundcloud](https://soundcloud.com)
 * [Stripe](https://stripe.com)
 * [Twitter](https://twitter.com)

That's a handful of `Provider`s, but there is more. Say that you want to ensure that your SSL connections are valid and want to control the certificate validation. Every provider also accepts a HttpClientOptions object that will be used internally when contacting your provider, so in this case, you have full security control of your connection, not just defaults.

You can expect this new code to land for 3.4 as it is not available in the current release (3.3.3).
