---
title: Vert.x3 says "hello" to NPM users
date: 2015-07-13
template: post.html
author: pmlopes
---

In programming literature it has become the standard to create a hello world program as the first example. In this
article I'll be demonstrating how `NPM` users can quickly get started with `vert.x`. You will see that it is not
that different and in fact it can be done using the tools you're used to. Note that although we are using `NPM` we are
not relying on `node.js`, all `javascript` code runs on the `JVM`.


## Hello World Examples

Here are four simple hello world examples. The comments in the code explain how the code works and the text around it
explain what it does and how to test it.


## Hello Console

This example is about as plain as it can get. It prints the words "`Hello World`" to the terminal. If you're a
javascript developer you should be already used to `npm` and know that you always start a project with the file
`package.json`:

```javascript
{
  "name": "vertx3-hello-console",
  "private": true,
  "dependencies": {
    "vertx3-min": "3.0.0-1"
  },
  "scripts": {
    "start": "./node_modules/.bin/vertx run server.js"
  }
}
```

Note that we have a dependency wich is obvious `vert.x` now note that there are 3 flavours of this dependency:

* [min](https://www.npmjs.com/package/vertx3-min)
* [base](https://www.npmjs.com/package/vertx3-base)
* [full](https://www.npmjs.com/package/vertx3-full)

According to your needs you can pick a different flavour, since for a simple hello world we only need the minimal that
is the one we add to the dependency property.

Now we need to do a simple hello app, we will call this file "`server.js`":

```javascript
// Call the console.log function.
console.log("Hello World");
```

You can run this by executing:

```bash
npm install
npm start
```

The first command retrieve the vert.x stack while the seconds starts your program.

## Hello HTTP

I'd guess that while it's not the only use case for `vert.x`, most people are using it as a web application platform. So
the next example will be a simple HTTP server that responds to every request with the plain text message "`Hello World`"
`server.js`:

```javascript
vertx.createHttpServer()
  .requestHandler(function (req) {
    req.response()
      .putHeader("content-type", "text/plain")
      .end("Hello World!");
}).listen(8080);
```

Now you can reuse the same `package.json` we've just defined in the previous section and start the server with
`npm start`. Once the server starts you can open a browser to `http://localhost:8080` and enjoy the message.


## Hello TCP

`Vert.x` also makes an excellent TCP server, and here is an example that responds to all TCP connections with the
message "Hello World" and then closes the connection `server.js`:

```javascript
var server = vertx.createNetServer();
server.connectHandler(function (socket) {
  socket.write("Hello World!\n");
  socket.close();
});

server.listen(7000, "localhost");
```

Again reuse the previous `package.json` and test it by doing `telnet localhost 7000`.


## Hello Web

Often you won't be using `vert.x` built-in libraries because they are designed to be very low level. This makes `vert.x`
quick, nimble, and easy to maintain, but if you are planning to build a complex application you want some productivity
and rely on a simple web framework. For this specific case there is `vert.x web`,
[a simple, yet productive framework](http://vertx.io/docs/#web), to build fast web application with routing, template
rendering, lots of middleware etc...usually not enough to get started on a real world application. This example shows an
HTTP server that responds with "Hello World" to all requests to "/" and responds with a 404 error to everything else
`server.js`:

```javascript
var Router = require("vertx-web-js/router");
var server = vertx.createHttpServer();

var router = Router.router(vertx);

router.get("/").handler(function (ctx) {
  // This handler will be called for "/" requests
  var response = ctx.response();
  response.putHeader("content-type", "text/plain");

  // Write to the response and end it
  response.end("Hello World!");
});

server.requestHandler(router.accept).listen(8080);
```

In order to test this, you will need to install the `vertx3-full` stack. There are two ways to do this. You can either
install it globally `npm install -g vertx3-full` or add it as a dependency to our `package.json` as we have done before,
for example `package.json`:

```javascript
{
  "name": "vertx3-hello-web",
  "private": true,
  "dependencies": {
    "vertx3-full": "3.0.0-1"
  },
  "scripts": {
    "start": "./node_modules/.bin/vertx run server.js"
  }
}
```

That's it for now. Hopefully this will help you get started working with `vert.x`!
