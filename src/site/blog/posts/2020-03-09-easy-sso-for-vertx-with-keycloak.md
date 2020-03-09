---
title: Easy SSO for Vert.x with Keycloak
template: post.html
date: 2020-03-09
draft: true
author: thomasdarimont
---

# Easy SSO for Vert.x with Keycloak

## TL;DR

In this blog post you'll learn:

- How to implement Single Sign-on with OpenID Connect
- How to use Keycloak's OpenID Discovery to infer OpenID provider configuration
- How to obtain user information
- How to check for authorization
- How to call a Bearer protected service with an Access Token
- How to implement logout

## Hello Blog

This is my first post in the Vert.x Blog and I must admit that up until now I have never used Vert.x in a real project.
"Why are you here?", you might ask... Well I currently have two main hobbies, learning new things and securing apps with [Keycloak](https://www.keycloak.org/).
So a few days ago, I stumbled upon the [Introduction to Vert.x video series on youtube](https://www.youtube.com/watch?v=LsaXy7SRXMY&list=PLkeCJDaCC2ZsnySdg04Aq9D9FpAZY6K5D) by [Deven Phillips](https://twitter.com/infosec812) and I was immediately hooked. Vert.x was a new thing for me, so the next logical step was to figure out how to secure a Vert.x app with Keycloak.

For this example I build a small web app with Vert.x that shows how to implement Single Sign-on (SSO) with Keycloak 
and OpenID Connect, obtain information about the current user, check for roles, call bearer protected services and properly handling logout.

## Keycloak

[Keycloak](https://www.keycloak.org/) is a Open Source Identity and Access Management solution which provides support for OpenID Connect 
based Singe-Sign on, among many other things. I briefly looked for ways to securing a Vert.x app with Keycloak 
and quickly found an [older Vert.x Keycloak integration example](https://vertx.io/blog/vertx-3-and-keycloak-tutorial/) in this very blog.
Whilst this is a good start for beginners, the example contains a few issues, e.g.:

- It uses hardcoded OpenID provider configuration
- Features a very simplistic integration (for the sake of simplicity)
- No user information used
- No logout functionality is shown

That somehow nerdsniped me a bit and so it came that, after a long day of consulting work, I sat down to create an example for a complete Keycloak integration based on [Vert.x OpenID Connect / OAuth2 Support](https://vertx.io/docs/vertx-auth-oauth2/java/).

So let's get started!

### Keycloak Setup

To secure a Vert.x app with Keycloak we of course need a Keycloak instance. Although [Keycloak has a great getting started guide](https://www.keycloak.org/docs/latest/getting_started/) I wanted to make it a bit easier to put everything together, therefore I prepared a local Keycloak docker container [as described here](https://github.com/thomasdarimont/vertx-playground/tree/master/keycloak-vertx#start-keycloak-with-the-vertx-realm) that you can start easily, which comes with all the required configuration in place.

The preconfigured Keycloak realm named `vertx` contains a `demo-client` for our Vert.x web app and a set 
of users for testing.

```
docker run \
  -it \
  --name vertx-keycloak \
  --rm \
  -e KEYCLOAK_USER=admin \
  -e KEYCLOAK_PASSWORD=admin \
  -e KEYCLOAK_IMPORT=/tmp/vertx-realm.json \
  -v $PWD/vertx-realm.json:/tmp/vertx-realm.json \
  -p 8080:8080 \
  quay.io/keycloak/keycloak:9.0.0
```


## Vert.x Web App

The simple web app consists of a single `Verticle`, runs on `http://localhost:8090` and provides a few routes with protected resources. [You can find the complete example here](https://github.com/thomasdarimont/vertx-playground/blob/master/keycloak-vertx/src/main/java/demo/MainVerticle.java).

The web app contains the following routes with handlers:

- `/` - The unprotected index page
- `/protected` - The protected page, which shows a greeting message, users need to login to access pages beneath this path.
- `/protected/user` - The protected user page, which shows some information about the user.
- `/protected/admin` - The protected admin page, which shows some information about the admin, only users with role `admin` can access this page.
- `/protected/userinfo` - The protected userinfo page, obtains user information from the bearer token protected userinfo endpoint in Keycloak.
- `/logout` - The protected logout resource, which triggers the user logout.

### Running the app

To run the app, we need to build our app via:
```
cd keycloak-vertx
mvn clean package
```

This creates a runnable jar, which we can run via:
```
java -jar target/*.jar
```

Note, that you need to start Keycloak, since our app will try to fetch configuration from Keycloak.

If the application is running, just browse to: `http://localhost:8090/`.

An example interaction with the app can be seen in the following gif:
![Vert.x Keycloak Integration Demo](/assets/blog/vertx-keycloak-integration/2020-03-07-vertx-keycloak-integration.gif)

### Router, SessionStore and CSRF Protection

We start the configuration of our web app by creating a `Router` where we can add custom handler functions for our routes.
To properly handle the authentication state we need to create a `SessionStore` and attach it to the `Router`.
The `SessionStore` is used by our OAuth2/OpenID Connect infrastructure to associate authentication information with a session.
By the way, the `SessionStore` can also be clustered if you need to distribute the server-side state. 

Note that if you want to keep your server stateless but still want to support clustering, 
then you could provide your own implementation of a `SessionStore` which stores the session information 
as an encrypted cookie on the Client.

```java
Router router = Router.router(vertx);

// Store session information on the server side
SessionStore sessionStore = LocalSessionStore.create(vertx);
SessionHandler sessionHandler = SessionHandler.create(sessionStore);
router.route().handler(sessionHandler);
```

In order to protected against CSRF attacks it is good practice to protect HTML forms with a CSRF token. 
We need this for our logout form that we'll see later. To do this we configure a `CSRFHandler` and add it to our `Router`:
```java
// CSRF handler setup required for logout form
String csrfSecret = "zwiebelfische";
CSRFHandler csrfHandler = CSRFHandler.create(csrfSecret);
router.route().handler(ctx -> {
            // Ensure csrf token request parameter is available for CsrfHandler
            // see Handling HTML forms https://vertx.io/docs/vertx-core/java/#_handling_requests
            ctx.request().setExpectMultipart(true);
            ctx.request().endHandler(v -> csrfHandler.handle(ctx));
        }
);
```

### Keycloak Setup via OpenID Connect Discovery

Our app is registered as a confidential OpenID Connect client with Authorization Code Flow in Keycloak,
thus we need to configure `client_id` and `client_secret`. Confidential clients are typically used
for server-side web applications, where one can securely store the `client_secret`. You can find out more
about[The different Client Access Types](https://www.keycloak.org/docs/latest/server_admin/index.html#_access-type) in the Keycloak documentation.

Since we don't want to configure things like OAuth2 / OpenID Connect Endpoints ourselves, we use Keycloak's OpenID Connect discovery endpoint to infer the necessary Oauth2 / OpenID Connect endpoint URLs.

```java
String hostname = System.getProperty("http.host", "localhost");
int port = Integer.getInteger("http.port", 8090);
String baseUrl = String.format("http://%s:%d", hostname, port);
String oauthCallbackPath = "/callback";

OAuth2ClientOptions clientOptions = new OAuth2ClientOptions()
    .setFlow(OAuth2FlowType.AUTH_CODE)
    .setSite(System.getProperty("oauth2.issuer", "http://localhost:8080/auth/realms/vertx"))
    .setClientID(System.getProperty("oauth2.client_id", "demo-client"))
    .setClientSecret(System.getProperty("oauth2.client_secret", "1f88bd14-7e7f-45e7-be27-d680da6e48d8"));

KeycloakAuth.discover(vertx, clientOptions, asyncResult -> {

    OAuth2Auth oauth2Auth = asyncResult.result();

    if (oauth2Auth == null) {
        throw new RuntimeException("Could not configure Keycloak integration via OpenID Connect Discovery Endpoint. Is Keycloak running?");
    }

    AuthHandler oauth2 = OAuth2AuthHandler.create(oauth2Auth, baseUrl + oauthCallbackPath)
        .setupCallback(router.get(oauthCallbackPath))
        // Additional scopes: openid for OpenID Connect
        .addAuthority("openid");

    // session handler needs access to the authenticated user, otherwise we get an infinite redirect loop
    sessionHandler.setAuthProvider(oauth2Auth);

    // protect resources beneath /protected/* with oauth2 handler
    router.route("/protected/*").handler(oauth2);

    // configure route handlers
    configureRoutes(router, webClient, oauth2Auth);
});

getVertx().createHttpServer().requestHandler(router).listen(port);
```

### Route handlers

We configure our route handlers via `configureRoutes`:
```java
private void configureRoutes(Router router, WebClient webClient, OAuth2Auth oauth2Auth) {

    router.get("/").handler(this::handleIndex);

    router.get("/protected").handler(this::handleGreet);
    router.get("/protected/user").handler(this::handleUserPage);
    router.get("/protected/admin").handler(this::handleAdminPage);

    // extract discovered userinfo endpoint url
    String userInfoUrl =  ((OAuth2AuthProviderImpl)oauth2Auth).getConfig().getUserInfoPath();
    router.get("/protected/userinfo").handler(createUserInfoHandler(webClient, userInfoUrl));

    router.post("/logout").handler(this::handleLogout);
}
```

The index handler exposes an unprotected resource:
```java
private void handleIndex(RoutingContext ctx) {
    respondWithOk(ctx, "text/html", "<h1>Welcome to Vert.x Keycloak Example</h1><br><a href=\"/protected\">Protected</a>");
}
```

### Extract User Information from the OpenID Connect ID Token

Our app exposes a simple greeting page which shows some information about the user and provides links to other pages.

The user greeting handler is protected by the Keycloak OAuth2 / OpenID Connect integration. To show information about
the current user, we first need to call the `ctx.user()` method to get an user object we can work with.
To access the OAuth2 token information, we need to cast it to `OAuth2TokenImpl`.

We can extract the user information like the username from the `IDToken` exposed by the user object via `user.idToken().getString("preferred_username")`. 
Note, there are many more claims like (name, email, givenanme, familyname etc.) available. The [OpenID Connect Core Specification](https://openid.net/specs/openid-connect-core-1_0.html#Claims) contains a list of available claims.

We also generate a list with links to the other pages which are supported:
```java
private void handleGreet(RoutingContext ctx) {

    OAuth2TokenImpl oAuth2Token = (OAuth2TokenImpl) ctx.user();

    String username = oAuth2Token.idToken().getString("preferred_username");

    String greeting = String.format("<h1>Hi %s @%s</h1><ul>" +
            "<li><a href=\"/protected/user\">User Area</a></li>" +
            "<li><a href=\"/protected/admin\">Admin Area</a></li>" +
            "<li><a href=\"/protected/userinfo\">User Info (Remote Call)</a></li>" +
            "</ul>", username, Instant.now());

    String logoutForm = createLogoutForm(ctx);

    respondWithOk(ctx, "text/html", greeting + logoutForm);
}
```

The user page handler shows information about the current user:
```java
private void handleUserPage(RoutingContext ctx) {

    OAuth2TokenImpl user = (OAuth2TokenImpl) ctx.user();

    String username = user.idToken().getString("preferred_username");
    String displayName = oAuth2Token.idToken().getString("name");

    String content = String.format("<h1>User Page: %s (%s) @%s</h1><a href=\"/protected\">Protected Area</a>", 
                                   username, displayName, Instant.now());
    respondWithOk(ctx, "text/html", content);
}
```

### Authorization: Checking for Required Roles

Our app exposes a simple admin page which shows some information for admins, which should only be visible for admins. Thus we require that users must have the `admin` realm role in Keycloak to be able to access the admin page.

This is done via a call to `user.isAuthorized("realm:admin", cb)`. The handler function `cb` exposes
the result of the authorization check via the `AsyncResult<Boolean> res`. If the current user has the
`admin` role then the result is `true` otherwise `false`:
```java
private void handleAdminPage(RoutingContext ctx) {

    OAuth2TokenImpl user = (OAuth2TokenImpl) ctx.user();

    // check for realm-role "admin"
    user.isAuthorized("realm:admin", res -> {

        if (!res.succeeded() || !res.result()) {
            respondWith(ctx, 403, "text/html", "<h1>Forbidden</h1>");
            return;
        }

        String username = user.idToken().getString("preferred_username");

        String content = String.format("<h1>Admin Page: %s @%s</h1><a href=\"/protected\">Protected Area</a>", 
                                        username, Instant.now());
        respondWithOk(ctx, "text/html", content);
    });
}
```

#### Call Services protected with Bearer Token

Often we need to call other services from our web app that are protected via Bearer Authentication. This means
that we need a valid `access token` to access a resource provided on another server.

To demonstrate this we use Keycloak's `/userinfo` endpoint as a straw man to demonstrate backend calls with a bearer token.

We can obtain the current valid `access token` via `user.opaqueAccessToken()`. 
Since we use a `WebClient` to call the protected endpoint, we need to pass the `access token` 
via the `Authorization` header by calling `bearerTokenAuthentication(user.opaqueAccessToken())` 
in the current `HttpRequest` object:

```java
private Handler<RoutingContext> createUserInfoHandler(WebClient webClient, String userInfoUrl) {

    return (RoutingContext ctx) -> {

        OAuth2TokenImpl user = (OAuth2TokenImpl) ctx.user();

        URI userInfoEndpointUri = URI.create(userInfoUrl);
        webClient
            .get(userInfoEndpointUri.getPort(), userInfoEndpointUri.getHost(), userInfoEndpointUri.getPath())
            // use the access token for calls to other services protected via JWT Bearer authentication
            .bearerTokenAuthentication(user.opaqueAccessToken())
            .as(BodyCodec.jsonObject())
            .send(ar -> {

                if (!ar.succeeded()) {
                    respondWith(ctx, 500, "application/json", "{}");
                    return;
                }

                JsonObject body = ar.result().body();
                respondWithOk(ctx, "application/json", body.encode());
            });
    };
}
```

### Handle logout

Now that we got a working SSO login with authorization, it would be great if we would allow users to logout again.
To do this we can leverage the built-in OpenID Connect logout functionality which can be called via `oAuth2Token.logout(cb)`.

The handler function `cb` exposes the result of the logout action via the `AsyncResult<Void> res`. 
If the logout was successfull we destory our session via `ctx.session().destroy()` and redirect the user to the index page.

The logout form is generated via the `createLogoutForm` method. 

Note, that we need to obtain the generated `CSRFToken` to generate it into a hidden form input field that's passed to the logout form:

```java
private void handleLogout(RoutingContext ctx) {

    OAuth2TokenImpl oAuth2Token = (OAuth2TokenImpl) ctx.user();
    oAuth2Token.logout(res -> {

        if (!res.succeeded()) {
            // the user might not have been logged out, to know why:
            respondWith(ctx, 500, "text/html", String.format("<h1>Logout failed %s</h1>", res.cause()));
            return;
        }

        ctx.session().destroy();
        ctx.response().putHeader("location", "/?logout=true").setStatusCode(302).end();
    });
}

private String createLogoutForm(RoutingContext ctx) {

    String csrfToken = ctx.get(CSRFHandler.DEFAULT_HEADER_NAME);

    return "<form action=\"/logout\" method=\"post\">"
            + String.format("<input type=\"hidden\" name=\"%s\" value=\"%s\">", CSRFHandler.DEFAULT_HEADER_NAME, csrfToken)
            + "<button>Logout</button></form>";
}
```

Some additional plumbing:
```java
private void respondWithOk(RoutingContext ctx, String contentType, String content) {
    respondWith(ctx, 200, contentType, content);
}

private void respondWith(RoutingContext ctx, int statusCode, String contentType, String content) {
    ctx.request().response() //
            .putHeader("content-type", contentType) //
            .setStatusCode(statusCode)
            .end(content);
}
```

## More examples

This concludes the Keycloak integration example.

Check out the complete example in [keycloak-vertx Examples Repo](https://github.com/thomasdarimont/vertx-playground/tree/master/keycloak-vertx).

Thank you for your time, stay tuned for more updates! If you want to learn more about Keycloak, feel free to reach out to me. You can find me via [thomasdarimont on twitter](https://twitter.com/thomasdarimont).

Happy Hacking!
