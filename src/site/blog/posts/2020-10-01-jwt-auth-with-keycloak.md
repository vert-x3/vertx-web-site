---
title: JWT authentication for Vert.x with Keycloak
template: post.html
date: 2020-10-01
author: thomasdarimont
draft: true
---

# JWT Authentication for Vert.x with Keycloak

## TL;DR

In this blog post you'll learn:

- JWT foundations
- How to protect routes with a JWT authentication
- How to extract claims from a JWT encoded token
- How to apply RBAC with Keycloak Realm roles

### Hello again

In my last blog post [Easy SSO for Vert.x with Keycloak](https://vertx.io/blog/easy-sso-for-vert-x-with-keycloak/) we learned how configure single Sign-on
for a Vert.x web application with Keycloak and OpenID connect. This time we'll see how we can use Keycloak in combination with Vert.x JWT Authentication support to protect an application.

### Keycloak Setup

To secure a Vert.x app with Keycloak we of course need a Keycloak instance. Although [Keycloak has a great getting started guide](https://www.keycloak.org/docs/latest/getting_started/) I wanted to make it a bit easier to put everything together, therefore I prepared a local Keycloak docker container [as described here](https://github.com/thomasdarimont/vertx-playground/tree/master/keycloak-vertx#start-keycloak-with-the-vertx-realm) that you can start easily, which comes with all the required configuration in place.

The preconfigured Keycloak realm named `vertx` contains a `vertx-service` for our Vert.x web app and a set
of users for testing. To ease testing, the `vertx-service` is configured with `direct access grant` enabled in Keycloak, which
enables support for the OAuth2 resource owner password credentials grant (ROPC) flow.

To start a Keycloak with the preconfigured realm, just start the docker container with the following command:
```
docker run \
  -it \
  --name vertx-keycloak \
  --rm \
  -e KEYCLOAK_USER=admin \
  -e KEYCLOAK_PASSWORD=admin \
  -e KEYCLOAK_IMPORT=/tmp/vertx-realm.json \
  -v $PWD/vertx-realm.json:/tmp/vertx-realm.json \
  -v $PWD/data:/opt/jboss/keycloak/standalone/data \
  -p 8080:8080 \
  quay.io/keycloak/keycloak:11.0.2
```

## Vert.x Web App

The example web app consists of a single `Verticle`, that runs on `http://localhost:3000` and provides a few routes with protected resources. [You can find the complete example here](https://github.com/thomasdarimont/vertx-playground/tree/master/jwt-service-vertx/src/main/java/demo/MainVerticle.java).

The web app contains the following routes with handlers:

- `/api/greet` - The protected greeting resource, which returns a greeting message, only authenticated users can access this resource.
- `/api/user` - The protected user resource, which returns some information about the user, only users with role `user` can access this resource.
- `/api/admin` - The protected user resource, which returns some information about the admin, only users with role `admin` can access this resource.

This example is built with Vert.x version 3.9.3.

### Running the app in the console

To run the app, we need to build it first:

```
cd jwt-service-vertx
mvn clean package
```

This creates a jar, which we can run:

```
java -jar target/*.jar
```

Note, that you need to start Keycloak first, since our app fetches the configuration from Keycloak on startup.

### Running the app in the IDE

You can also run the app directly from your favourite IDE like IntelliJ Idea or Eclipse.
To run the app from an IDE, you need to create a launch configuration and use the main class `io.vertx.core.Launcher`. Then set the the program arguments to
`run demo.MainVerticle` and use the classpath of the `jwt-service-vertx` module.

## JWT Authentication

### JWT Foundations

[JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519) is an open standard to securely exchange information between two parties in the form 
of [Base64URL](https://base64.guru/standards/base64url) encoded JSON objects. 
A JWT is just a string which comprises three base64url encoded parts header, payload and a signature, which are separated by a `.`. 

An example JWT can look like this:
```
eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJjN00xX2hkWjAtWDNyZTl1dmZLSFRDUWRxYXJQYnBMblVJMHltdkF0U1RzIn0.eyJleHAiOjE2MDEzMTg0MjIsImlhdCI6MTYwMTMxODEyMiwianRpIjoiNzYzNWY1YTEtZjFkNy00NTdkLWI4NjktYWQ0OTIzNTJmNGQyIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL2F1dGgvcmVhbG1zL3ZlcnR4IiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjI3YjNmYWMwLTlhZWMtNDQyMS04MWNmLWQ0YjAyNDI4ZjkwMSIsInR5cCI6IkJlYXJlciIsImF6cCI6InZlcnR4LXNlcnZpY2UiLCJzZXNzaW9uX3N0YXRlIjoiNjg3MDgyMTMtNDBiNy00NThhLWFlZTEtMzlkNmY5ZGEwN2FkIiwiYWNyIjoiMSIsInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIiwidXNlciJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoiZW1haWwgcHJvZmlsZSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiVGhlbyBUZXN0ZXIiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ0ZXN0ZXIiLCJnaXZlbl9uYW1lIjoiVGhlbyIsImZhbWlseV9uYW1lIjoiVGVzdGVyIiwiZW1haWwiOiJ0b20rdGVzdGVyQGxvY2FsaG9zdCJ9.NN1ZGE3f3LHE0u7T6Vfq5yPMKoZ6SmrUxoFopAXZm5wVgMOsJHB8BgHQTDm7u0oTVU0ZHlKH2-o11RKK7Mz0mLqMy2EPdkGY9Bqtj5LZ8oTp8FaVqY1g5Fr5veXYpOMbc2fke-e2hG8sAfSjWz1Mq9BUhJ7HdK7TTIte12pub2nbUs4APYystJWx49cYmUwZ-5c9X295V-NX9UksuMSzFItZ4cACVKi68m9lkR4RuNQKFTuLvWsorz9yRx884e4cnoT_JmfSfYBIl31FfnQzUtCjluUzuD9jVXc_vgC7num_0AreOZiUzpglb8UjKXjswTHF-v_nEIaq7YmM5WKpeg
```

The header and payload sections contain information as a JSON object, whereas the signature is just a plain string. JSON objects contain key value pairs which are called `claims`.

The claims information can be verified and trusted because it is digitally signed with the private key from a public/private key-pair. 
The signature can later be verified with a corresponding public key. The identifier of the public/private key-pair used to sign a JWT can be 
contained in a special claim called `kid` (key identifier) in the header section of the JWT.

An example for a JWT header that references a public/private key-pair looks like this:
```
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "c7M1_hdZ0-X3re9uvfKHTCQdqarPbpLnUI0ymvAtSTs"
}
```

It is quite common to use JWTs to convey information about authentication (user identity) and authorization (user roles, permissions). 
OpenID providers such as [Keycloak](https://www.keycloak.org/) can issue OAuth2 access tokens for users to clients in the form of JWTs. 
This access tokens can then in turn be used the access other services or APIs on behalf of the user. The server providing those services or 
APIs is often called  `resource server`.

A JWT payload generated by Keycloak looks like this:
```
{
  "exp": 1601318422,
  "iat": 1601318122,
  "jti": "7635f5a1-f1d7-457d-b869-ad492352f4d2",
  "iss": "http://localhost:8080/auth/realms/vertx",
  "aud": "account",
  "sub": "27b3fac0-9aec-4421-81cf-d4b02428f901",
  "typ": "Bearer",
  "azp": "vertx-service",
  "session_state": "68708213-40b7-458a-aee1-39d6f9da07ad",
  "acr": "1",
  "realm_access": {
    "roles": [
      "offline_access",
      "uma_authorization",
      "user"
    ]
  },
  "scope": "email profile",
  "email_verified": true,
  "name": "Theo Tester",
  "preferred_username": "tester",
  "given_name": "Theo",
  "family_name": "Tester",
  "email": "tom+tester@localhost"
}
```

If a `resource server` receives a request with such an access token, it needs to verify and inspect the access token before it can trust its content. 
To verify the token, the `resource server` needs to obtain the `public key` to check the token signature. 
This `public key` can either configured statically or fetched dynamically from the OpenID Provider by leveraging the `kid` information from the JWT header section. 
Note that most `OpenID providers`, such as Keycloak, provide a dedicated endpoint for dynamic public key lookups, e.g. `http://localhost:8080/auth/realms/vertx/protocol/openid-connect/certs`.
A standard for providing public key information is [JSON Web Key Set (JWKS)](https://tools.ietf.org/html/rfc7517). 
This JWKS information is usually cached by the resource server to avoid the overhead of fetching JWKS for every request.

An example response for Keycloak's JWKS endpoint looks like this:
```
{
   "keys":[
      {
         "kid":"c7M1_hdZ0-X3re9uvfKHTCQdqarPbpLnUI0ymvAtSTs",
         "kty":"RSA",
         "alg":"RS256",
         "use":"sig",
         "n":"iFuX2bAXA99Yrv6YEvpV9tjS52krP5UJ7lFL02Zl83PPV6PiLIWKTqF71bfTKnVDxO421xAsBw9f6dlgoyxxY1H_bzJQQryQkry7DA7tI_SnKVsehLgeF-tCcjRF_MF1kM14F1A5Zsu6oYIkMZvgJIRM-ejtz3aUcdnLcTvpPrmfvj7KwRgNsfm6Q-kO0-OAf6m6LaRvaC5VpTIRoVxXNhSIiGKuZ4d05Yk0-HdOR0D0sfOujYzleJmTGBEIAmdWpZqUXiSWbzmpw8mJmacFTP9v8lsTUYZrXc69xm5fHaNJ6PO_E-IKiPKT7OeoM2l3HIK76a4azVL1Ewbv1UtMFw",
         "e":"AQAB",
         "x5c":[
            "MIICmTCCAYECBgFwplKOujANBgkqhkiG9w0BAQsFADAQMQ4wDAYDVQQDDAV2ZXJ0eDAeFw0yMDAzMDQxNjExMzNaFw0zMDAzMDQxNjEzMTNaMBAxDjAMBgNVBAMMBXZlcnR4MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiFuX2bAXA99Yrv6YEvpV9tjS52krP5UJ7lFL02Zl83PPV6PiLIWKTqF71bfTKnVDxO421xAsBw9f6dlgoyxxY1H/bzJQQryQkry7DA7tI/SnKVsehLgeF+tCcjRF/MF1kM14F1A5Zsu6oYIkMZvgJIRM+ejtz3aUcdnLcTvpPrmfvj7KwRgNsfm6Q+kO0+OAf6m6LaRvaC5VpTIRoVxXNhSIiGKuZ4d05Yk0+HdOR0D0sfOujYzleJmTGBEIAmdWpZqUXiSWbzmpw8mJmacFTP9v8lsTUYZrXc69xm5fHaNJ6PO/E+IKiPKT7OeoM2l3HIK76a4azVL1Ewbv1UtMFwIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQBxcXiTtGoo4/eMNwhagYH8QpK1n7fxgzn4mkESU3wD+rnPOAh/xFmx5c3aq8X+8W2z7oopO86ZBSQ8HfbzViBP0uwvf7s7E6Q8FOqrUNv0Kj308A7hF1IOqOhCJE2nABIWJduYz5dWZN434Q9El30L1eOYTtjBUmCdP7/CM+1bvxIT+CYrWmjI9zCMJxhuixmLffppsLCjGtNgFBemjQyCrLxpEGCfy8QGb4pTY/XaHuJ7k6ZaQkVeTbeDzaZbHc9zT5qgf6w4Gp7y+uPZdAsasrwiqm3YBtyBfaK42luk09nHpV6PRKpftnyLVPwlQiJAW6ZMckvDwmnDst70msnb"
         ],
         "x5t":"MVYTXCx5cUQ8lT1ymIDDRYO7_ZI",
         "x5t#S256":"yBDVTlfR0e7cv3HxbbkfvGKVs5W1VQtFs7haE_js3DY"
      }
   ]
}
```
The `keys` array contains the JWKS structure with the public key information that belongs to the public/private key-pair which was used
to sign the JWT access token from above. Note the matching `kid` fields.

Now that we have the appropriate public key, we can use the information from the JWT header to validate the signature of the JWT access token.
If the signature is valid, we can go on and check additional claims from the payload section of the JWT, such as expiration, allowed issuer and audience etc. 

Now that we have the necessary building blocks in place, we can finally look at how to configure JWT authentication in Vert.x.

### JWT Authentication in Vert.x

Setting up JWT authentication in a Vert.x is quite easy. At first, we use a `WebClient` to dynamically fetch the JWKS information with the public key 
from the `/protocol/openid-connect/certs` endpoint relative to our Keycloak issuer URL. After that, we configure a `JWTAuth` instance with some 
`JWTOptions` and `JWTAuthOptions` to customize the JWT validation. 
Note that we use Keycloak's realm roles for authorization via the `JWTAuthOptions#setPermissionsClaimKey(..)` method.

In our example the whole JWT authentication setup happens in the method `setupJwtAuth`.

```java
private Future<Startup> setupJwtAuth(Startup startup) {

    var jwtConfig = startup.config.getJsonObject("jwt");
    var issuer = jwtConfig.getString("issuer");
    var issuerUri = URI.create(issuer);

    // derive JWKS uri from Keycloak issuer URI
    var jwksUri = URI.create(jwtConfig.getString("jwksUri", String.format("%s://%s:%d%s",
            issuerUri.getScheme(), issuerUri.getHost(), issuerUri.getPort(), issuerUri.getPath() + "/protocol/openid-connect/certs")));

    var promise = Promise.<JWTAuth>promise();

    // fetch JWKS from `/certs` endpoint
    webClient.get(jwksUri.getPort(), jwksUri.getHost(), jwksUri.getPath())
            .as(BodyCodec.jsonObject())
            .send(ar -> {

                if (!ar.succeeded()) {
                    startup.bootstrap.fail(String.format("Could not fetch JWKS from URI: %s", jwksUri));
                    return;
                }

                var response = ar.result();

                var jwksResponse = response.body();
                var keys = jwksResponse.getJsonArray("keys");

                // Configure JWT validation options
                var jwtOptions = new JWTOptions();
                jwtOptions.setIssuer(issuer);

                // extract JWKS from keys array
                var jwks = ((List<Object>) keys.getList()).stream()
                        .map(o -> new JsonObject((Map<String, Object>) o))
                        .collect(Collectors.toList());

                // configure JWTAuth
                var jwtAuthOptions = new JWTAuthOptions();
                jwtAuthOptions.setJwks(jwks);
                jwtAuthOptions.setJWTOptions(jwtOptions);
                jwtAuthOptions.setPermissionsClaimKey(jwtConfig.getString("permissionClaimsKey", "realm_access/roles"));

                JWTAuth jwtAuth = JWTAuth.create(vertx, jwtAuthOptions);
                promise.complete(jwtAuth);
            });

    return promise.future().compose(auth -> {
        jwtAuth = auth;
        return Future.succeededFuture(startup);
    });
}
```

### Protect routes with JWTAuthHandler

Now that our `JWTAuth` is configured, we can use the `JWTAuthHandler` in the `setupRouter` method to apply 
JWT authentication to all routes matching `/api/*`. The `JWTAuthHandler` validates received JWTs and performs 
some checks like expiration and allowed issuers. With that in place, we can setup our actual routes in `setupRoutes`.

```java
private Future<Startup> setupRouter(Startup startup) {

    router = Router.router(vertx);

    router.route("/api/*").handler(JWTAuthHandler.create(jwtAuth));

    return Future.succeededFuture(startup);
}

private Future<Startup> setupRoutes(Startup startup) {

    router.get("/api/greet").handler(this::handleGreet);
    router.get("/api/user").handler(this::handleUserData);
    router.get("/api/admin").handler(this::handleAdminData);

    return Future.succeededFuture(startup);
}
```

### Extracting user information from the JWTUser

To access user information in our `handleGreet` method, we cast the result of the `io.vertx.ext.web.RoutingContext#user` method to `JWTUser` 
which allows us to access token claim information via the `io.vertx.ext.auth.jwt.impl.JWTUser#principal` JSON object.

If we'd like to use the JWT access token for other service calls, we can extract the token from the `Authorization` header.

```java
private void handleGreet(RoutingContext ctx) {

    var jwtUser = (JWTUser) ctx.user();
    var username = jwtUser.principal().getString("preferred_username");
    var userId = jwtUser.principal().getString("sub");

    var accessToken = ctx.request().getHeader(HttpHeaders.AUTHORIZATION).substring("Bearer ".length());
    // Use accessToken for down-stream calls...

    ctx.request().response().end(String.format("Hi %s (%s) %s%n", username, userId, Instant.now()));
}
```

### Obtain access token from Keycloak for user `tester`

To test our application we can use the following `curl` commands in a bash like shell to obtain an JWT access token to call one
of our endpoints as the user `tester` with the role `user`.

Note that this example uses the cli tool [jq](https://stedolan.github.io/jq/) for JSON processing.

```bash
KC_USERNAME=tester
KC_PASSWORD=test
KC_CLIENT=vertx-service
KC_CLIENT_SECRET=ecb85cc5-f90d-4a03-8fac-24dcde57f40c
KC_REALM=vertx
KC_URL=http://localhost:8080/auth
KC_RESPONSE=$(curl  -k \
        -d "username=$KC_USERNAME" \
        -d "password=$KC_PASSWORD" \
        -d 'grant_type=password' \
        -d "client_id=$KC_CLIENT" \
        -d "client_secret=$KC_CLIENT_SECRET" \
        "$KC_URL/realms/$KC_REALM/protocol/openid-connect/token" \
    | jq .)

KC_ACCESS_TOKEN=$(echo $KC_RESPONSE| jq -r .access_token)
echo $KC_ACCESS_TOKEN
```

Here we use the JWT access token in the `Authorization` header with the `Bearer` prefix to call our `greet` route:
```bash
curl --silent -H "Authorization: Bearer $KC_ACCESS_TOKEN" http://localhost:3000/api/greet
```

Example output:
```bash
Hi tester (27b3fac0-9aec-4421-81cf-d4b02428f901) 2020-09-28T21:03:59.254230700Z
```

### Role based Access-Control with JWTUser

To leverage support for role based access control (RBAC) we can use the `io.vertx.ext.auth.User#isAuthorised` method
to check whether the current user has the required role. If the role is present we return some data about the user, otherwise
we send a response with status code 403 and a `forbidden` error message.

```java
private void handleUserData(RoutingContext ctx) {

    var jwtUser = (JWTUser) ctx.user();
    var username = jwtUser.principal().getString("preferred_username");
    var userId = jwtUser.principal().getString("sub");

    jwtUser.isAuthorized("user", res -> {

        if (!res.succeeded() || !res.result()) {
            toJsonResponse(ctx).setStatusCode(403).end("{\"error\": \"forbidden\"}");
            return;
        }

        JsonObject data = new JsonObject()
                .put("type", "user")
                .put("username", username)
                .put("userId", userId)
                .put("timestamp", Instant.now());

        toJsonResponse(ctx).end(data.toString());
    });
}

private void handleAdminData(RoutingContext ctx) {

    var jwtUser = (JWTUser) ctx.user();
    var username = jwtUser.principal().getString("preferred_username");
    var userId = jwtUser.principal().getString("sub");

    jwtUser.isAuthorized("admin", res -> {

        if (!res.succeeded() || !res.result()) {
            toJsonResponse(ctx).setStatusCode(403).end("{\"error\": \"forbidden\"}");
            return;
        }

        JsonObject data = new JsonObject()
                .put("type", "admin")
                .put("username", username)
                .put("userId", userId)
                .put("timestamp", Instant.now());

        toJsonResponse(ctx).end(data.toString());
    });
}
```


```bash
curl --silent -H "Authorization: Bearer $KC_ACCESS_TOKEN" http://localhost:3000/api/user
```

Output:
```json
{"type":"user","username":"tester","userId":"27b3fac0-9aec-4421-81cf-d4b02428f901","timestamp":"2020-09-28T21:07:49.340950300Z"}

```

```bash
curl --silent -H "Authorization: Bearer $KC_ACCESS_TOKEN" http://localhost:3000/api/admin
```

Output:
```
{"error": "forbidden"}
```

### Obtain access token from Keycloak for user `vadmin`

To check access with an `admin` role, we obtain a new token for the user `vadmin` which has the roles `admin` and `user`. 

```bash
KC_USERNAME=vadmin
KC_PASSWORD=test
KC_CLIENT=vertx-service
KC_CLIENT_SECRET=ecb85cc5-f90d-4a03-8fac-24dcde57f40c
KC_REALM=vertx
KC_URL=http://localhost:8080/auth
KC_RESPONSE=$(curl  -k \
        -d "username=$KC_USERNAME" \
        -d "password=$KC_PASSWORD" \
        -d 'grant_type=password' \
        -d "client_id=$KC_CLIENT" \
        -d "client_secret=$KC_CLIENT_SECRET" \
        "$KC_URL/realms/$KC_REALM/protocol/openid-connect/token" \
    | jq .)

KC_ACCESS_TOKEN=$(echo $KC_RESPONSE| jq -r .access_token)
echo $KC_ACCESS_TOKEN
```

```bash
curl --silent -H "Authorization: Bearer $KC_ACCESS_TOKEN" http://localhost:3000/api/user
```

Output:
```json
{"type":"user","username":"vadmin","userId":"75090eac-36ff-4cd8-847d-fc2941bc024e","timestamp":"2020-09-28T21:13:05.099393900Z"}
```

```
curl --silent -H "Authorization: Bearer $KC_ACCESS_TOKEN" http://localhost:3000/api/admin
```

Output:
```json
{"type":"admin","username":"vadmin","userId":"75090eac-36ff-4cd8-847d-fc2941bc024e","timestamp":"2020-09-28T21:13:34.945276500Z"}
```

### Conclusion

We learned how to configure a Vert.x application with JWT authentication powered by Keycloak. Although the configuration is quite complete
already, there are still some areas that can be improved, like the dynamic JWKS fetching on public-key pair rotation as well as extraction of nested roles.

Nevertheless this can serve as a good starting point for securing your own Vert.x services with JWT and Keycloak.

Check out the [complete example in keycloak-vertx Examples Repo](https://github.com/thomasdarimont/vertx-playground/tree/master/jwt-service-vertx).

Thank you for your time, stay tuned for more updates! If you want to learn more about Keycloak, feel free to reach out to me. You can find me via [thomasdarimont on twitter](https://twitter.com/thomasdarimont).

Happy Hacking!