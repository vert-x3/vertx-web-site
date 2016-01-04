---
title: ECMAScript 6/7 on the JVM with TypeScript and Vert.x
date: 2016-01-03
template: post.html
author: michel-kraemer
draft: true
---

Following the latest releases of [Vert.x 3.2](http://vertx.io) and
[vertx-lang-typescript 1.1.0](https://github.com/michel-kraemer/vertx-lang-typescript)
I figured it would be a good idea to give you a couple of examples how teaming
Vert.x and TypeScript helps you use ECMAScript 6 and 7 features on the JVM today.

The vertx-lang-typescript library adds [TypeScript](http://www.typescriptlang.org/) support to Vert.x 3.
TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It supports the
ECMAScript 6 (ECMAScript 2015, ES6) standard and also a few parts of ECMAScript 7 (ES7) already.

The library automatically compiles Vert.x verticles written in
TypeScript to JavaScript and executes them on the JVM. vertx-lang-typescript also provides
type definitions for the Vert.x JavaScript API. Use them in your favourite
TypeScript editor/IDE to get auto-completion, API documentation and meaningful error
messages. See the following screencast:

<img src="https://raw.githubusercontent.com/michel-kraemer/vertx-lang-typescript/aaa67228c998bf9dc64b5f45fb407ef56169efec/screencast.gif">

## ECMAScript 6/7 and Vert.x

Below you find an example verticle written in TypeScript. Well, I left all
the TypeScript-specific parts out. In fact the verticle is valid ECMAScript 6
(except for the last snippet [9] which is ECMAScript 7).

First, follow the [vertx-lang-typescript README](https://github.com/michel-kraemer/vertx-lang-typescript/blob/master/README.md)
to install the library and to enable TypeScript in Vert.x. Then extract the
type definitions (`vertx-lang-typescript-1.1.0-typings.zip`) into a new directory.
Create a new file named `es7verticle.ts` in this directory and copy the code
below into it. Finally, open your command prompt and execute

```bash
vertx run es7verticle.ts
```

This will run a small HTTP server that listens to requests on port 8080. If you
open your browser and go to http://localhost:8080 you will see the following:

<img class="img-responsive center-block" src="{{ site_url }}assets/blog/ecmascript-6-7-on-the-jvm-with-typscript-and-vertx/output.png" title="Output of the verticle written in TypeScript">

So far so good. Now let's have a look at the code. I numbered the individual
ECMAScript features used. Here's a complete list:

1. Use an *arrow function* to create a request handler (ES6)
2. *Block-scoped variables* do not pollute your global namespace (ES6)
3. Specify a *default value* for a function parameter (ES6)
4. Use *rest parameters* to collect multiple parameters in an array (ES6)
5. *Spread* the contents of an array to function parameters (ES6)
6. Iterate over array contents using the *for...of loop* (ES6)
7. *template strings* enable *string interpolation* and *multi-line strings* (ES6)
8. Use *classes* and *inheritance* (ES6)
9. Use the new *exponentiation operator* as a shortcut for `Math.pow()` (ES7)

<script src="https://gist.github.com/michel-kraemer/892866038dabcb8376e6.js"></script>

## Conclusion

The example demonstrates very well how you can use ECMAScript 6 (and parts of
7) on the JVM today. In fact, there are a lot more
[cool ES6 features](http://es6-features.org/) not included in the example such
as constants (`const`), the property shorthand or method properties.

TypeScript is so much more than just ES6. It actually has a
very good static type system that allows you to make compile-time type checks.
This is makes it much easier to write large Vert.x applications with many
verticles. Personally I really like the support that I get from my IDE when
programming TypeScript. Since vertx-lang-typescript comes with type definitions
for the Vert.x JavaScript API I get auto-completion and access to the documentation
right in the editor. I mostly use [Sublime](http://www.sublimetext.com/) by the
way, but I have tested it successfully with
[Visual Studio Code](https://code.visualstudio.com/), [Eclipse](http://www.eclipse.org/)
and [Atom](https://atom.io/).

Unfortunately, the only ES7 feature that you can use at the moment with
vertx-lang-typescript is the _exponentiation operator_. TypeScript 1.7 also
supports *decorators* but this feature is disabled at the moment in
vertx-lang-typescript because it is experimental and subject to change. I'll
keep you up to date when new features are introduced.

## Alternatives

We've recently [published a post](http://vertx.io/blog/vert-x-es6-back-to-the-future/)
on how to use ECMAScript 6 with Vert.x here on this blog. We used [Babel](https://babeljs.io/), a
compiler that translates ES6 to ES5.

Although this approach works well it is a bit harder to set up and use than the
one presented here. First, you need to wrap your Vert.x application in a NPM package.
Second, in order to run your application, you need to execute two commands.
You have to compile it with `npm run build` and then then call `npm start`.
With vertx-lang-typescript you only need one command. vertx-lang-typescript
also allows you to embed the TypeScript verticle in a larger Vert.x application
and also mix multiple languages in one project. This is not possible if you wrap
everything in a NPM package.

Finally, the approach based on Babel only supports ECMAScript 6 (2015), although
more features from ES7 will surely be introduced in Babel in the future.
TypeScript on the other hand gives you much more features such as static
typing that you will certainly find useful for any larger project.
