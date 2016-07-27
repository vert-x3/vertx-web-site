---
title: Centralized logging for Vert.x applications using the ELK stack
date: 2016-07-26
template: post.html
author: ricardohmon
---

Centralized logging is an important topic while building a Microservices architecture and it is a step forward to adopting the DevOps culture. Having an overall solution partitioned into a set of services distributed across the Internet can represent a challenge when trying to monitor the log output of each of them, hence, a tool that helps to accomplish this could be very helpful. This post entry describes a solution to achieve centralized logging of Vert.x applications using the [ELK stack](https://www.elastic.co/webinars/introduction-elk-stack); a set of tools including Logstash, Elasticsearch, and Kibana that are renowned to work seamlessly together.

## Table of contents
- [Overview]
- [Requirements]
- [App logging configuration]
    - [Log4j2 logging]
    - [Filebeat configuration]
- [ELK configuration]
    - [Logstash]
    - [Elasticsearch]
    - [Kibana]
- [Challenges]
- [Conclusion]

## Overview
As shown in the diagram below, the general centralized logging solution comprises two main elements: the application server running our Vert.x application and a separate server hosting the ELK stack. The link between these two elements is established using Filebeat, a highly configurable tool capable of shipping our application logs to the Logstash instance, our gateway to the ELK stack.

![Overview of centralized logging with ELK](/assets/blog/centralized-logging-using-elk/elk-overview.svg)

## Requirements
* Log output to file. Filebeat ships log data read from log files, hence it is important to configure Vert.x log output files.

## App logging configuration
Vert.x uses JUL logging as default, however, it [provides]({{ site_url }}docs/vertx-core/java/#_logging) also the means to configure Log4j or SLF4J as the logging frameworks. Let's take a look at a Log4j sample configuration.

### Log4j2 Logging
In order to enable Log4j, we take advantage of SLF4j's ability to attach different logging frameworks at runtime, therefore, we declare Log4j's binaries as dependencies in our Maven POM file, together with the SLF4J API. 
Additionally, for Vert.x applications it is important to keep the logging functions asynchronous, therefore, we include the LMAX Disruptor binaries in the classpath, as specified in the Log4J2 [docs](https://logging.apache.org/log4j/2.x/manual/async.html).

```xml
    <dependency>
      <groupId>org.slf4j</groupId>
      <artifactId>slf4j-api</artifactId>
      <version>${slf4j.version}</version>
    </dependency>
    <dependency>
      <groupId>org.apache.logging.log4j</groupId>
      <artifactId>log4j-slf4j-impl</artifactId>
      <version>${log4j2.version}</version>
    </dependency>
    <dependency>
      <groupId>org.apache.logging.log4j</groupId>
      <artifactId>log4j-api</artifactId>
      <version>${log4j2.version}</version>
    </dependency>
    <dependency>
      <groupId>org.apache.logging.log4j</groupId>
      <artifactId>log4j-core</artifactId>
      <version>${log4j2.version}</version>
    </dependency>
    <dependency>
      <groupId>com.lmax</groupId>
      <artifactId>disruptor</artifactId>
      <version>${disruptor.version}</version>
    </dependency>
```
An additional step to enable asynchronous Log4j logging in Vert.x involves setting two system properties: `vertx.logger-delegate-factory-class-name`, to configure the alternate logging framework; and `Log4jContextSelector`, to instruct Log4J to log asynchronously.

One last step concerning Log4j configuration involves specifying the format of the log output. The option followed in our example is through xml files placed in the *Resources* folder of the application, which will be automatically read by the logging framework at runtime. Inside this configuration, we set our logs to be saved to a filesystem path that will be required by Filebeat.

### Filebeat configuration
Now that we have configured the log output of our Vert.x application to be stored in the file system, we delegate to Filebeat the work of forwarding the logs to the Logstash instance. Filebeat can be configured through a YAML file containing the logs output location and the pattern to interpret multiline logs (i.e., stack traces). Also, the Logstash output plugin is configured with the host location and secured using the certificate from the machine hosting Logstash. We set the document_type to the type of instance that this log belongs, which could later on help us while indexing our logs inside Elasticsearch.

```yaml
    filebeat: 
      prospectors: 
        - 
          document_type: trader_dashboard
          paths: 
            - /var/log/vertx.log
          multiline:
            pattern: "^[0-9]+"
            negate: true
            match: after
    output: 
      logstash: 
        enabled: true
        hosts: 
          - elk:5044
        timeout: 15
        tls:
          insecure: false
          certificate_authoritites:
            - /etc/pki/tls/certs/logstash-beats.crt
```

## ELK configuration
To take fully advantage of the ELK stack with respect to Vert.x and our app logs, we need to configure each of the individual components, namely Logstash, Elasticsearch and Kibana.

### Logstash
Logstash is the component within the ELK stack that is in charge of aggregating the logs from each of the sources and forwarding them to the Elasticsearch instance.   
Configuring Logstash is straightforward with the help of the specific input and output plugings for Beats and Elasticsearch, respectively. 
In the previous section we mentioned that Filebeat could be easily coupled with Logstash. Now, we see that this can be done by just specifying `Beat` as the input plugin and set the parameters needed to be reached by our shippers (listening port, ssl key and certificate location).

```
    input {
      beats {
        port => 5044
        ssl => true
        ssl_certificate => "/etc/pki/tls/certs/logstash-beats.crt"
        ssl_key => "/etc/pki/tls/private/logstash-beats.key"
      }
    }
```
Now that we are ready to receive logs from the app, we can use Logstash filtering capabilities to specify the format of our logs and extract the fields so they can be indexed more efficiently by Elasticsearch.  
The grok filtering plugin comes handy in this situation. This plugin allows to declare the logs format using predefined and customized patterns based in regular expressions allowing to declare new fields from the information extracted from each log line. In the following block, we instruct Logstash to recognize our Log4j pattern inside a `message` field, which contains the log message shipped by Filebeat. After that, the date filtering plugin parses the timestamp field extracted in the previous step and replaces it for the timestamp that Filebeat placed when it read the log output file.

```
    filter {
      grok {
        break_on_match => false
        match =>  [ "message", "%{LOG4J}"]
      }
      date{
        match => [ "timestamp_string", "ISO8601"]
        remove_field => [ "timestamp_string" ]
      }
    }
```

The Log4j pattern is not included within the Logstash configuration, however, we can specify it using predefined data formats shipped with Logstash and adapt it to the specific log formats defined in our application, as shown next:

```apache
    # Pattern to match our Log4j format
    SPACING (?:[\s]+)
    LOGGER (?:[a-zA-Z$_][a-zA-Z$_0-9]*\.)*[a-zA-Z$_][a-zA-Z$_0-9]*
    LINE %{INT}?
    LOG4J %{TIMESTAMP_ISO8601:timestamp_string} %{LOGLEVEL:log_level}%{SPACING}%{LOGGER:logger_name}:%{LINE:loc_line} - %{JAVALOGMESSAGE:log_message}
```

### Elasticsearch
Elasticsearch is the central component that enables the efficient indexing and real-time search capabilities of the stack. To take the most advantage of Elasticsearch, we can provide an indexing template of our incoming logs, which can help to optimize the data storage and match the queries issued by Kibana at a later point.  
In the example below, we see a index template that would be applied to any index matching the pattern `_filebeat-*_`. Additionally, we declare our new log fields `_type_`, `_host_`, `_log_level_`, `_logger_name_`, and `_log_message_`, which are set as `_not_analyzed_` except for the last two that are set as `_analyzed_` allowing to perform queries based on regular expressions and not restricted by querying the full text. In the example, Logstash is configured to manage the log templates supplied to Elasticsearch.

```json
    {
      "mappings": {
        "_default_": {
          "_all": {
            "enabled": true,
            "norms": {
              "enabled": false
            }
          },
          "dynamic_templates": [
            {
              "template1": {
                "mapping": {
                  "doc_values": true,
                  "ignore_above": 1024,
                  "index": "not_analyzed",
                  "type": "{dynamic_type}"
                },
                "match": "*"
              }
            }
          ],
          "properties": {
            "@timestamp": {
              "type": "date"
            },
            "offset": {
              "type": "long",
              "doc_values": "true"
            },
            **"type": { "type": "string", "index": "not_analyzed" }**,
            **"host": { "type": "string", "index": "not_analyzed" }**,
            **"log_level": { "type": "string", "index": "not_analyzed" }**,
            **"logger_name": { "type": "string", "index": "analyzed" }**,
            **"log_message": { "type": "string", "index": "analyzed" }**
          }
        }
      },
      "settings": {
        "index.refresh_interval": "5s"
      },
      **"template": "filebeat-*"*
    }
```

### Kibana
Although we could fetch all our logs from Elasticsearch through its API, Kibana is a powerful tool that allows a more friendly query and visualization.
Besides the option to query our index data through the available index field names and search boxes allowing typing specific queries, Kibana provides the option to create our own Visualizations and Dashboards. Combined, they represent a powerful way to display data and gain insight in a customized manner.
Our Vert.x app example ships with a sample Dashboard that combines a set of visualizations that provides insight from the log messages according to their level, originating machine, and logger information.

## Conclusion
The ELK stack is a powerful set of tools that ease the aggregation of logs coming from distributed services into a central server. It is supported by a strong pillar, Elasticsearch, that provides the indexing and search capabilities of our log data. Also, it is accompanied by the input/output components: Logstash, which can be flexibly configured to accept different data sources; and Kibana, which can be customized to present the information in the most convenient way.

Logstash has been designed to work seamlessly with Filebeat, the log shipper which represents a robust solution that can be adapted to our already developed applications without having to make *significant* changes to our architecture. In addition, Logstash can accept varied types of sources, filter the data, and process it before delivering to Elasticsearch. This flexibility comes with the price of having extra elements in our log aggregation pipeline, which can represent an increase of processing overhead or a point-of-failure. This additional overhead could be avoided if an application would be capable of passing over its log output directly to Elasticsearch.