---
title: Vert.x 3 init.d Script
date: 2015-07-02
template: post.html
author: cescoffier
---

Let's say you have a Vert.x 3 application you want to install on a Linux server. But you want the _old school_ way (I meant not the docker way &#9786;). So, in other words, you need an _init.d_ script. This post proposes an _init.d_ script that you can use to start / stop / restart a Vert.x 3 application.

## Prerequisites

The proposed script assumes your application is packaged as a _fat jar_. So, your application is going to be launched using `java -jar your-fat-jar ...`.

## The script

The _init.d_ scripts have to reply to a set of _commands_:

* `start` : starts the application (if not yet started)
* `stop` : stops the application (if started)
* `status` : let you know if the application is started or not
* `restart` : restart the application

These _commands_ are invoked using:

```shell
service my-service-script start
service my-service-script stop
service my-service-script status
service my-service-script restart
```

In general, service scripts are hooked in the boot and shutdown sequences to start and stop automatically during the system starts and stops.

So, enough talks, let's look at the script:

<script src="https://gist.github.com/cescoffier/ccc8b391787e93f4e6e0.js"></script>

## Using the script

First download the script from the [here](https://gist.githubusercontent.com/cescoffier/ccc8b391787e93f4e6e0/raw/my-vertx-application).

You need to set a couple of variables located at the beginning of the file:

```
# The directory in which your application is installed
APPLICATION_DIR="/opt/my-vertx-app"
# The fat jar containing your application
APPLICATION_JAR="maven-verticle-3.0.0-fat.jar"
# The application argument such as -cluster -cluster-host ...
APPLICATION_ARGS=""
# vert.x options and system properties (-Dfoo=bar).
VERTX_OPTS=""
# The path to the Java command to use to launch the application (must be java 8+)
JAVA=/opt/java/java/bin/java
```

The rest of the script can stay as it is, but feel free to adapt it to your needs. Once you have set these variables based on your environment, move the file to `/etc/init.d` and set it as executable:

```shell
sudo mv my-vertx-application /etc/init.d
sudo chmod +x my-vertx-application
```

Then, you should be able to start your application using:

```
sudo service my-vertx-application start
```

Depending to your operating system, adding the hooks to the boot and shutdown sequence differs. For instance on Ubuntu you need to use the `update-rc.d` command while on CentOS `chkconfig` is used

**That's all, enjoy !**
