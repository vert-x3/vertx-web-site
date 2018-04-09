---
title: Eclipse Vert.x metrics now with Micrometer.io
template: post.html
date: 2018-04-09
author: jotak
draft: false
---

Vert.x has already been providing metrics for some time, through the [vertx-dropwizard-metrics](https://vertx.io/docs/vertx-dropwizard-metrics/java/) and [vertx-hawkular-metrics](https://vertx.io/docs/vertx-hawkular-metrics/java/) modules. Both of them implement a service provider interface (SPI) to collect the Vert.x metrics and make them available to their respective backends.

A new module, [vertx-micrometer-metrics](https://vertx.io/docs/vertx-micrometer-metrics/java/), is now added to the family. It implements the same SPI, which means that it is able to provide the same metrics.
[_Micrometer.io_](http://micrometer.io/) is a pretty new metrics library, quite comparable to _dropwizard metrics_ in that it collects metrics in a local, in-memory registry and is able to store them in various backends such as _Graphite_ or _InfluxDB_. It has several advantages as we will see below.

## Tell me more about Micrometer

[_Micrometer.io_](http://micrometer.io/) describes itself as a a vendor-neutral application metrics facade.
It provides a well designed API, in Java, to define _gauges_, _counters_, _timers_ and _distribution summaries_.

Among the available backends, Micrometer natively supports _Graphite_, _InfluxDB_, _JMX_, _Prometheus_ and [several others](http://micrometer.io/docs). Prometheus is very popular in the Kubernetes and microservices ecosystems, so its support by Micrometer was a strong motivation for implementing it in Vert.x.

For the the moment, our implementation in Vert.x supports _Prometheus_, _InfluxDB_ and _JMX_. More should quickly come in the near future.

### Dimensionality

Another interesting aspect in Micrometer is that it handles metrics _dimensionality_: metrics can be associated with a set of key/value pairs (sometimes refered as _tags_, sometimes as _labels_). Every value brings a new dimension to the metric, so that in Prometheus or any other backend that supports dimensionality, we can query for datapoints of one or several dimensions, or query for datapoints aggregated over several dimensions.

  *Example: our metric `vertx_http_server_connections` accepts labels `local` and `remote`, that are used to store addresses on HTTP connections*

[NOTE | Prometheus is used in the following examples, but equivalent queries can be performed with _InfluxDB_.]

In Prometheus, the query `vertx_http_server_connections` will return as many timeseries as there are combinations of `local` and `remote` values. Example:

```
vertx_http_server_connections{local="0.0.0.0:8080",remote="1.1.1.1"}
vertx_http_server_connections{local="0.0.0.0:8080",remote="2.2.2.2"}
vertx_http_server_connections{local="0.0.0.0:8080",remote="3.3.3.3"}
```

To query on a single dimension, we must provide the labels:

`vertx_http_server_connections{local="0.0.0.0:8080",remote="1.1.1.1"}`. It will return a single timeseries.

To get an aggregate, Prometheus (PromQL) provides several [aggregation operators](https://prometheus.io/docs/prometheus/latest/querying/operators/#aggregation-operators):

`sum(vertx_http_server_connections)` will return the sum across all dimensions.

## So what are the Vert.x metrics?

People already familiar with the existing metrics modules (_dropwizard_ or _hawkular_) will not be too disoriented. They are roughly the same. The main difference is where previously, some metric names could have a variable part within - such as `vertx.eventbus.handlers.myaddress` - here we take advantage of dimensionality and we will have `vertx_eventbus_handlers{address="myaddress"}`.

Some other metrics are no longer useful, for instance the dropwizard's `vertx.eventbus.messages.pending`, `vertx.eventbus.messages.pending-local` and `vertx.eventbus.messages.pending-remote` are now just `vertx_eventbus_pending{side=local}` and `vertx_eventbus_pending{side=remote}` in micrometer. The sum of them can easily be computed at query time.

The metrics provided by Vert.x are dispatched into eight big families:

* **Net client**: distribution summaries of bytes sent and received, number of connections, etc.
* **Net server**: distribution summaries of bytes sent and received, number of connections, etc.
* **HTTP client**: counter of requests, response times, etc.
* **HTTP server**: counter of requests, processing times, etc.
* **Event bus**: counter of handlers, messages sent and received, etc.
* **Pool**: for worker pools and some datasource pools, queue size and waiting time, processing time, etc.
* **Verticles**: number of verticles deployed.

The full list of collected metrics is [available here](https://vertx.io/docs/vertx-micrometer-metrics/java/#_vert_x_core_tools_metrics).

## Getting started

This section will guide you through a quick setup to run a Vert.x application with Micrometer. The code examples used here are taken from the `micrometer-metrics-example` in `vertx-examples` repository, in Java, using _maven_. But the same could be done with other Vert.x supported languages, as well as _gradle_ instead of _maven_.

### Maven configuration

The configuration and the maven imports will vary according to the backend storage that will be used. For maven, the common part is always:

```xml
<dependency>
  <groupId>io.vertx</groupId>
  <artifactId>vertx-micrometer-metrics</artifactId>
  <version>3.5.1</version>
</dependency>
```

* Then, to report to InfluxDB:

```xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-influx</artifactId>
  <version>1.0.0</version>
</dependency>
```

* Or Prometheus:

```xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-prometheus</artifactId>
  <version>1.0.0</version>
</dependency>
<dependency>
  <groupId>io.vertx</groupId>
  <artifactId>vertx-web</artifactId>
  <version>3.5.1</version>
</dependency>
```

Remark that, since Prometheus pulls metrics from their source, they must be exposed on an HTTP endpoint. That's why `vertx-web` is imported here. It is not _absolutely_ necessary (it's possible to get the metrics registry content and expose it in any other way) but it's probably the easiest way to do.

* Or JMX:

```xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-jmx</artifactId>
  <version>1.0.0</version>
</dependency>
```

[NOTE Note | At the moment, it is not possible to report metrics to several backends at the same time. [It might be soon implemented](https://github.com/vert-x3/vertx-micrometer-metrics/issues/16)].

### Setting up Vert.x options

A `MicrometerMetricsOptions` object must be created and passed to `VertxOptions`, with one backend configured (though having no backend is possible: you would get metrics sent to a default Micrometer registry, but without any persistent storage).

* InfluxDB example:

```java
// Default InfluxDB options will push metrics to localhost:8086, db "default"
MicrometerMetricsOptions options = new MicrometerMetricsOptions()
  .setInfluxDbOptions(new VertxInfluxDbOptions().setEnabled(true))
  .setEnabled(true);
Vertx vertx = Vertx.vertx(new VertxOptions().setMetricsOptions(options));
// Then deploy verticles with this vertx instance
```

* Prometheus example:

```java
// Deploy with embedded server: prometheus metrics will be automatically exposed,
// independently from any other HTTP server defined
MicrometerMetricsOptions options = new MicrometerMetricsOptions()
  .setPrometheusOptions(new VertxPrometheusOptions()
    .setStartEmbeddedServer(true)
    .setEmbeddedServerOptions(new HttpServerOptions().setPort(8081))
    .setEnabled(true))
  .setEnabled(true);
Vertx vertx = Vertx.vertx(new VertxOptions().setMetricsOptions(options));
// Then deploy verticles with this vertx instance
```

* Or Prometheus with the `/metrics` endpoint bound to an existing HTTP server:

```java
// Deploy without embedded server: we need to "manually" expose the prometheus metrics
MicrometerMetricsOptions options = new MicrometerMetricsOptions()
  .setPrometheusOptions(new VertxPrometheusOptions().setEnabled(true))
  .setEnabled(true);
Vertx vertx = Vertx.vertx(new VertxOptions().setMetricsOptions(options));

Router router = Router.router(vertx);
PrometheusMeterRegistry registry = (PrometheusMeterRegistry) BackendRegistries.getDefaultNow();
// Setup a route for metrics
router.route("/metrics").handler(ctx -> {
  String response = registry.scrape();
  ctx.response().end(response);
});
vertx.createHttpServer().requestHandler(router::accept).listen(8080);
```

* JMX example:

```java
// Default JMX options will publish MBeans under domain "metrics"
MicrometerMetricsOptions options = new MicrometerMetricsOptions()
  .setJmxMetricsOptions(new VertxJmxMetricsOptions().setEnabled(true))
  .setEnabled(true);
Vertx vertx = Vertx.vertx(new VertxOptions().setMetricsOptions(options));
// Then deploy verticles with this vertx instance
```

### Setup the backend server

* [InfluxDB](https://www.influxdata.com/), by default, is expected to run on `localhost:8086` without authentication, database "default". It is configurable in `VertxInfluxDbOptions`.
If you don't have a running instance of InfluxDB, the shortest way to start is certainly with docker, just run:

```bash
docker run -p 8086:8086 influxdb
```

* [Prometheus](https://prometheus.io/docs/prometheus/latest/getting_started/) needs some configuration since it pulls metrics from the sources. Once it is installed, configure the scrape endpoints in `prometheus.yml`:

```yaml
- job_name: 'vertx-8081'
  static_configs:
    - targets: ['localhost:8081']
```

or, when using `/metrics` endpoint bound to an existing HTTP server:

```yaml
- job_name: 'vertx-8080'
  static_configs:
    - targets: ['localhost:8080']
```

* For JMX there is nothing special to configure.

### Collecting Vert.x metrics

From now on, all Vert.x metrics will be collected and sent to the configured backend. In our Vert.x example, we setup an HTTP server metrics:

```java
Router router = Router.router(vertx);
router.get("/").handler(ctx -> {
  ctx.response().end("Hello Micrometer from HTTP!");
});
vertx.createHttpServer().requestHandler(router::accept).listen(8080);
```

 And some event bus ping-pong:

```java
// Producer side
vertx.setPeriodic(1000, x -> {
  vertx.eventBus().send("greeting", "Hello Micrometer from event bus!");
});
```

```java
// Consumer side
vertx.eventBus().<String>consumer("greeting", message -> {
  String greeting = message.body();
  System.out.println("Received: " + greeting);
  message.reply("Hello back!");
});
```

To trigger some activity on the HTTP server, we can write a small bash script:

```bash
while true
do curl http://localhost:8080/
    sleep .8
done
```

### Viewing the results

[Grafana](https://grafana.com/) can be used to display the InfluxDB and Prometheus metrics. The `vertx-examples` repository contains two dashboards for that: [for InfluxDB](https://github.com/vert-x3/vertx-examples/blob/master/micrometer-metrics-examples/grafana/Vertx-InfluxDB.json) and [for Prometheus](https://github.com/vert-x3/vertx-examples/blob/master/micrometer-metrics-examples/grafana/Vertx-Prometheus.json).

##### HTTP server metrics
![HTTP server metrics](https://raw.githubusercontent.com/jotak/vertx-examples/micrometer-example/micrometer-metrics-examples/grafana/http-server-metrics.png)

##### Event bus metrics
![Event bus metrics](https://raw.githubusercontent.com/jotak/vertx-examples/micrometer-example/micrometer-metrics-examples/grafana/eventbus-metrics.png)

## Going further

We've seen the basic setup. There is a good bunch of options available, detailed [in the documentation](https://vertx.io/docs/vertx-micrometer-metrics/java/): how to disable some metrics domains, how to filter or rearrange labels, how to export metrics snapshots to Json objects, how to add JVM or processor instrumentation, etc.

Before we finish, there is one important point that we can cover here: defining custom metrics.
Because the module gives you access to its Micrometer registry, you can add your custom metrics there.

Getting the default registry is straightforward:

```java
MeterRegistry registry = BackendRegistries.getDefaultNow();
```

Then you have plain access to the [Micrometer API](https://micrometer.io/docs/concepts).

For instance, here is how you can track the execution time of a piece of code that is regularly called:

```java
MeterRegistry registry = BackendRegistries.getDefaultNow();
Timer timer = Timer
  .builder("my.timer")
  .description("Time tracker for my extremely sophisticated algorithm")
  .register(registry);

vertx.setPeriodic(1000, l -> {
  timer.record(() -> myExtremelySophisticatedAlgorithm());
});
```

Since it is using the same registry, there is no extra backend configuration to do.

## What's next?

The `vertx-micrometer-metrics` module will continue to be improved, with already two planned enhancements:

* [Adding more backends](https://github.com/vert-x3/vertx-micrometer-metrics/issues/15), like Graphite.
* [Allow to configure several backends](https://github.com/vert-x3/vertx-micrometer-metrics/issues/16), and not only one at the same time.

Would you miss any feature, please [ask on GitHub](https://github.com/vert-x3/vertx-micrometer-metrics/issues). Contributions and bug fixes are also welcome!

Now is time to enter the Metrics.
