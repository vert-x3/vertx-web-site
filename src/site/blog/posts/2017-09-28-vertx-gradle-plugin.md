---
title: An Eclipse Vert.x Gradle Plugin
template: post.html
date: 2017-09-28
author: jponge
draft: false
---

Eclipse Vert.x is a versatile toolkit, and as such it does not have any strong opinion on the tools that you should be using.

Gradle is a popular build tool in the JVM ecosystem, and it is quite easy to use for building Vert.x project as [show in one of the `vertx-examples` samples](https://github.com/vert-x3/vertx-examples/blob/master/gradle-verticles/gradle-verticle/build.gradle) where a so-called _fat Jar_ is being produced.

The new [Vert.x Gradle plugin](https://plugins.gradle.org/plugin/io.vertx.vertx-plugin) offers an _opinionated_ plugin for building Vert.x applications with Gradle.

It automatically applies the following plugins:

* `java` (and sets the source compatibility to Java 8),
* `application` + `shadow` to generate fat Jars with all dependencies bundled,
* `nebula-dependency-recommender-plugin` so that you can omit versions from modules from the the Vert.x stack.

The plugin automatically adds `io.vertx:vertx-core` as a `compile` dependency, so you don’t need to do it.

The plugin provides a `vertxRun` task that can take advantage of the Vert.x auto-reloading capabilities, so you can just run it then have your code being automatically compiled and reloaded as you make changes.

## Getting started

A minimal `build.gradle` looks like:

```groovy
plugins {
  id 'io.vertx.vertx-plugin' version '0.0.4'
}

repositories {
  jcenter()
}

vertx {
  mainVerticle = 'sample.App'
}
```

Provided `sample.App` is a Vert.x verticle, then:

1. `gradle shadowJar` builds an executable Jar with all dependencies: `java -jar build/libs/simple-project-fat.jar`, and
2. `gradle vertxRun` starts the application and automatically recompiles (`gradle classes`) and reloads the code when any file under `src/` is being added, modified or deleted.

## Using with Kotlin (or Groovy, or...)

The plugin integrates well with plugins that add configurations and tasks triggered by the `classes` task.

Here is how to use the plugin with Kotlin (replace the version numbers with the latest ones...):

```groovy
plugins {
  id 'io.vertx.vertx-plugin' version 'x.y.z'
  id 'org.jetbrains.kotlin.jvm' version 'a.b.c'
}

repositories {
  jcenter()
}

dependencies {
  compile 'io.vertx:vertx-lang-kotlin'
  compile 'org.jetbrains.kotlin:kotlin-stdlib-jre8'
}

vertx {
  mainVerticle = "sample.MainVerticle"
}

tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).all {
  kotlinOptions {
    jvmTarget = "1.8"
  }
}
```

## Using with WebPack (or any other custom task)

WebPack is popular to bundle web assets, and there is even [a guide for its integration with Gradle](https://guides.gradle.org/running-webpack-with-gradle/).

Mixing the Vert.x Gradle plugin with WebPack is very simple, especially in combination with the `com.moowork.node` plugin that integrates Node into Gradle.

Suppose we want to mix Vert.x code and JavaScript with Gradle and WebPack.
We assume a `package.json` as:

```javascript
{
  "name": "webpack-sample",
  "version": "0.0.1",
  "description": "A sample with Vert.x, Gradle and Webpack",
  "main": "src/main/webapp/index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "webpack": "^2.7.0"
  },
  "dependencies": {
    "axios": "^0.16.2"
  }
}
```

and `webpack.config.js` as:

```javascript
module.exports = {
  entry: './src/main/webapp/index.js',
  output: {
    filename: './build/resources/main/webroot/bundle.js'
  }
}
```

The `build.gradle` file is the following:

```groovy
plugins {
  id 'io.vertx.vertx-plugin' version '0.0.4'
  id 'com.moowork.node' version '1.2.0'
}

repositories {
  jcenter()
}

dependencies {
  compile "io.vertx:vertx-web"
}

vertx {
  mainVerticle = "sample.MainVerticle"
  watch = ["src/**/*", "build.gradle", "yarn.lock"]
  onRedeploy = ["classes", "webpack"]
}

task webpack(type: Exec) {
  inputs.file("$projectDir/yarn.lock")
  inputs.file("$projectDir/webpack.config.js")
  inputs.dir("$projectDir/src/main/webapp")
  outputs.dir("$buildDir/resources/main/webroot")
  commandLine "$projectDir/node_modules/.bin/webpack"
}
```

This custom build exposes a `webpack` task that invokes WebPack, with proper file tracking so that Gradle knows when the task is up-to-date or not.

The Node plugin adds many tasks, and integrates fine with `npm` or `yarn`, so fetching all NPM dependencies is done by calling `./gradlew yarn`.

The `vertxRun` task now redeploys on modifications to files in `src/` (and sub-folders), `build.gradle` and `yarn.lock`, calling both the `classes` and `webpack` tasks:

<iframe width="872" height="602" src="https://www.youtube.com/embed/OGy-1w8Z6Dc?rel=0" frameborder="0" allowfullscreen></iframe>

## Summary

The Vert.x Gradle plugin provides lots of defaults to configure a Gradle project for Vert.x applications, producing _fat Jars_ and offering a running task with automatic redeployment.
The plugin also integrates well with other plugins and external tools for which a Gradle task is available.

The project is still in its early stages and we are looking forward to hearing from you!

### Links

* [The project on GitHub](https://github.com/jponge/vertx-gradle-plugin)
* [The plugin on the Gradle plugins portal](https://plugins.gradle.org/plugin/io.vertx.vertx-plugin)
