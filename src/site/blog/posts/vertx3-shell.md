---
title: Intro to Vert.x Shell
template: post.html
date: 2016-01-25
author: vietj
---

Vert.x Shell provides an extensible command line for Vert.x, accessible via SSH, Telnet or a nice Web interface. Vert.x Shell comes out of the box with plenty of commands for Vert.x which makes it very handy for doing simple management operations like deploying a Verticle or getting the list of deployed Verticles. One power feature of Vert.x Shell is its extensibility: one can easily augment Vert.x Shell with its own commands. Let's build an _http-client_ in JavaScript!

## Booting the Shell

Vert.x Shell can be started in a couple of lines depending on the connectors you configure. The documentation provides several examples showing the [Shell Service configuration](http://vertx.io/docs/vertx-shell/js/#_programmatic_service). For testing our command, we will use the Telnet protocol because it is easy to configure and use, so we just need to copy the corresponding section in _vertx-http-client.js_:

```
var ShellService = require("vertx-shell-js/shell_service");
var service = ShellService.create(vertx, {
  "telnetOptions" : {
    "host" : "localhost",
    "port" : 4000
  }
});
service.start();
```

We can run it:

```
Juliens-MacBook-Pro:java julien$ vertx run vertx-http-client.js
Succeeded in deploying verticle
```

And connect to the shell:

```
Juliens-MacBook-Pro:~ julien$ telnet localhost 4000
Trying ::1...
telnet: connect to address ::1: Connection refused
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
__      __ ______  _____  _______  __   __
\ \    / /|  ____||  _  \|__   __| \ \ / /
 \ \  / / | |____ | :_) |   | |     \   /
  \ \/ /  |  ____||   __/   | |      > /
   \  /   | |____ | |\ \    | |     / //\
    \/    |______||_| \_\   |_| o  /_/ \_\


%
```

You can now already use the shell, the _help_ command lists the available commands.

## Creating a command

For the sake of simplicity we will write a single script that starts the Shell service and deploys our command. In the real world you would probably have the command in one file and the deployment in another.

The [documentation](http://vertx.io/docs/vertx-shell/js/#_extending_vert_x_shell) explains how to add a new command to Vert.x shell, we can just copy this section and append it to the _vertx-http-client.js_ script:

```
var CommandBuilder = require("vertx-shell-js/command_builder");
var CommandRegistry = require("vertx-shell-js/command_registry");

var builder = CommandBuilder.command("http-client");
builder.processHandler(function (process) {

  // Write a message to the console
  process.write("Implement the client\n");

  // End the process
  process.end();
});

// Register the command
var registry = CommandRegistry.getShared(vertx);
registry.registerCommand(builder.build(vertx));
```

Now you can use the command just to see it in action:

```
% http-client
Implement the client
%
```

## Checking arguments

The _http-client_ requires an `url` argument, an argument check is performed at the beginning of the process handler:

```
// Check the url argument
if (process.args().length < 1) {
  process.write("Missing URL\n").end();
  return;
}
var url = process.args()[0];
```

## Implementing the command

The final step of this tutorial is the actual implementation of the client logic based on Vert.x HttpClient:

```
// Create the client request
var request = client.getAbs(url, function(response) {

  // Print the response in the shell console
  response.handler(function(buffer) {
    process.write(buffer.toString("UTF-8"));
  });

  // End the command when the response ends
  response.endHandler(function() {
    process.end();
  });
});

// Set a request handler to end the command with error
request.exceptionHandler(function(err) {
  process.write("Error: " + err.getMessage());
  process.end();
});

// End the http request
request.end();
```

And we can test the command in the shell:

```
% http-client http://vertx.io
http-client http://vertx.io
<!DOCTYPE html><html lang=en><head><title>Vert.x</title>...
...
/javascripts/sticky_header.js></script></body></html>%
```

## Finally

We have seen how easy it is to extend Vert.x with a shell and create an _http-client_ custom command, you can get the full source code [here](https://gist.github.com/vietj/51ff223bfb7cfcbc97ce).

Our command is very simple, it only implements the very minimum, in future posts we will improve the command with support with more HTTP methods, SSL support or header support with the the Vert.x CLI API.
