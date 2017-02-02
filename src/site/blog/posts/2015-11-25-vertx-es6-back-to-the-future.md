---
title: Vert.x ES6 back to the future
template: post.html
date: 2015-11-25
author: pmlopes
---

On [October 21th, 2015](http://backtothefuture.wikia.com/wiki/2015) we all rejoiced with the return from the past of
Marty McFly with his flying car and so on, however in the Vert.x world we were quite sad that the JavaScript support we
have was still using a technology released in [December 2009](https://en.wikipedia.org/wiki/ECMAScript#Versions). The
support for ES5 is not something that we Vert.x team controls but something that is inherited from running on top of
[Nashorn](http://openjdk.java.net/projects/nashorn/).

With all these nostalgic thoughts on my mind I've decided to bring us back to the future and by future I mean, lets
 start using a modern JavaScript, or more correctly, lets start using [ECMAScript 6](http://es6-features.org/).

It turned out to be quite simple to achieve this so I'll pick the hello world example and write it in ES6 just to show
how you can port your code to ES6 and still use the current Vert.x APIs. Note that Vert.x internals still are ES5 and
have not been touched or modified to support any of ES6 features.

## main

Traditionally your `main.js` file would reside in the root of your module (this is where `NPM` will look for it by
default); however as we are going to transpile to `ES5` you'll want to put your index file in `/src/main.js`.

However, because we are transpiling to `ES5`, your `package.json`'s main block should point to the transpiled `index.js`
file in the `/lib` directory.

```json
{
  "name": "vertx-es6",
  "version": "0.0.1",
  "private": true,

  "main": "lib/main.js",

  "scripts": {
    "build": "rm -Rf lib && ./node_modules/.bin/babel --out-dir lib src",
    "start": "./node_modules/.bin/vertx run lib/main.js"
  },

  "dependencies": {
    "vertx3-full": "3.1.0",
    "babel-cli": "6.2.0",
    "babel-preset-es2015": "6.1.18"
  }
}
```

As you can see, the main idea is to invoke the transpiler (Babel) when we are building our project, and run it using the
generated files. This is slightly equivalent to a compilation process you would have using compiled language.


## .npmignore

If you're planning to deploy your package to npm either local or private you should be aware that npm will exclude
anything listed on your `.gitignore` since we should ignore the generated code from git it need to inform npm to ignore
that rule and keep the `lib` directory. The `.gitignore` should be something like:

```
/lib
/node_modules
```

And the `.npmignore`:

```
/.gitignore
```

## Hello fat arrows and let keywords

So all the heavy work has been done, in order to create our hello world we just need to code some `ES6` in our
`src/main.js` file:

```javascript
var Router = require("vertx-web-js/router");
var server = vertx.createHttpServer();

var router = Router.router(vertx);

router.get("/").handler((ctx) => {

    let response = ctx.response();
    response.putHeader("content-type", "text/plain");

    response.end("Hello ES6 World!");
});

server.requestHandler(router.accept).listen(8080);
```

As you can see we're using fat arrows instead of writing a function closure and scoped variables using `let` keyword. If
you now compile your project:

```
npm run build
```

And then start it:

```
npm start
```

You have your first back to the future `ES6` verticle!
