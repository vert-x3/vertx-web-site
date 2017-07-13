---
title: Writing secure Vert.x Web apps
date: 2015-09-14
template: post.html
author: pmlopes
---

This is a starting guide for securing vert.x web applications. It is by no means a comprehensive guide on web application security such as [OWASP](https://www.owasp.org). Standard rules and practices apply to vert.x apps as if they would to any other web framework.

The post will cover the items that always seem to come up on forums.

## Don't run as root

It is a common practise that your devops team member will constantly say, one shall run a service with the least amount of privileges necessary and no more. Although this might sound like folklore to less experienced developers that hit an issue when trying to run on privileged ports 80, 443, running as root solves it quickly but open a door to bigger problems. Lets look at this code:

```java
public class App extends AbstractVerticle {
  @Override
  public void start() {

    Router router = Router.router(vertx);

    router.route().handler(StaticHandler.create(""));

    vertx.createHttpServer().requestHandler(router::accept).listen(80);
  }
}

```

When started with the `CWD` set to `/` (`java -Dvertx.cwd=/ ...`) you just created a simple file server for all your server storage. Now imagine that you want to start this application you will hit the error:

```
Aug 26, 2015 2:02:18 PM io.vertx.core.http.impl.HttpServerImpl
SEVERE: java.net.SocketException: Permission denied
```

So if you do now run as `root` it will start, however in your browser now try to navigate to: `http://localhost/etc/shadow` congratulations you just exposed your server `logins` **and** `passwords`!

There are several ways to run as a under privileged user, you can use `iptables` to forward requests to higher ports, use `authbind`, run behind a proxy like `ngnix`, etc...

## Sessions

Many applications are going to deal with user sessions at some point.

Session cookies should have the `SECURE` and `HTTPOnly` flags set. This ensures that they can only be sent over `HTTPS` (you are using `HTTPS` right?) and there is no script access to the cookie client side:

```java
    Router router = Router.router(vertx);

    router.route().handler(CookieHandler.create());
    router.route().handler(SessionHandler
        .create(LocalSessionStore.create(vertx))
        .setCookieHttpOnlyFlag(true)
        .setCookieSecureFlag(true)
    );

    router.route().handler(routingContext -> {

      Session session = routingContext.session();

      Integer cnt = session.get("hitcount");
      cnt = (cnt == null ? 0 : cnt) + 1;

      session.put("hitcount", cnt);

      routingContext.response().end("Hitcount: " + cnt);
    });

    vertx.createHttpServer().requestHandler(router::accept).listen(8080);
```

And in this case when inspecting your browser you should see:

![nocookie](/assets/blog/vertx3-secure-webapps/nocookie.png)

Of course if you do not do that any script on your browser has the capability of reading, sniffing hijacking or tampering your sessions.

## Security Headers

There are plenty of security headers that help improve security with just a couple of lines of code. There is no need to explain them here since there are good [articles](http://recxltd.blogspot.nl/2012/03/seven-web-server-http-headers-that.html) online that will probably do it better than me.

Here is how one could implement a couple of them:

```java
public class App extends AbstractVerticle {

  @Override
  public void start() {

    Router router = Router.router(vertx);
    router.route().handler(ctx -> {
      ctx.response()
          // do not allow proxies to cache the data
          .putHeader("Cache-Control", "no-store, no-cache")
          // prevents Internet Explorer from MIME - sniffing a
          // response away from the declared content-type
          .putHeader("X-Content-Type-Options", "nosniff")
          // Strict HTTPS (for about ~6Months)
          .putHeader("Strict-Transport-Security", "max-age=" + 15768000)
          // IE8+ do not allow opening of attachments in the context of this resource
          .putHeader("X-Download-Options", "noopen")
          // enable XSS for IE
          .putHeader("X-XSS-Protection", "1; mode=block")
          // deny frames
          .putHeader("X-FRAME-OPTIONS", "DENY");
    });

    vertx.createHttpServer().requestHandler(router::accept).listen(8080);
  }
}
```

## Cross-Site Request Forgery (CSRF) Protection

Vert.x web provides CSRF protection using an included handler. To enable CSRF protections you need to add it to your router as you would add any other handler:

```java
public class App extends AbstractVerticle {

  @Override
  public void start() {

    Router router = Router.router(vertx);

    router.route().handler(CookieHandler.create());
    router.route().handler(SessionHandler
        .create(LocalSessionStore.create(vertx))
        .setCookieSecureFlag(true)
    );
    router.route().handler(CSRFHandler.create("not a good secret"));

    router.route().handler(ctx -> {
      ...
    });
```

The handler adds a CSRF token to requests which mutate state. In order change the state a (`XSRF-TOKEN`) cookie is set with a unique token, that is expected to be sent back in a (`X-XSRF-TOKEN`) header.

## Limit uploads

When dealing with uploads **always** define a upper bound, otherwise you will be vulnerable to `DDoS` attacks. For example lets say that you have the following code:

```java
public class App extends AbstractVerticle {

  @Override
  public void start() {

    Router router = Router.router(vertx);

    router.route().handler(BodyHandler.create());

    router.route().handler(ctx -> {
      ...
```

Now a bad intentioned person could generate a random file with 1GB of trash:

```
dd if=/dev/urandom of=ddos bs=1G count=1
```

And then upload it to your server:

```
curl --data-binary "@ddos" -H "Content-Type: application/octet-stream" -X POST http://localhost:8080/
```

Your application will happily try to handle this until one of 2 things happens, it will run out of disk space or memory. In order to mitigate these kind of attacks always specify the maximum allowed upload size:

```java
public class App extends AbstractVerticle {

  private static final int KB = 1024;
  private static final int MB = 1024 * KB;

  @Override
  public void start() {

    Router router = Router.router(vertx);
    router.route().handler(BodyHandler.create().setBodyLimit(50 * MB));
```

## Final Words

Although this is just a small list of things you should remember when implementing your application there are more comprehensive checklists to check:

* [OWASP Top Ten Project](https://www.owasp.org/index.php/Category:OWASP_Top_Ten_Project)
* [Preventing SQL Injection in Java](https://www.owasp.org/index.php/Preventing_SQL_Injection_in_Java)
* [Testing for NoSQL injection](https://www.owasp.org/index.php/Testing_for_NoSQL_injection)
