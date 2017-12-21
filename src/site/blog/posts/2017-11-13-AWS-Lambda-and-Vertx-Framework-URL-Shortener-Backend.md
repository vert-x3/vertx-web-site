---
title: Eclipse Vert.x based Framework URL Shortener Backend
template: post.html
date: 2017-12-21
author: pendula95
---

## AWS Lambda & Vertx Framework URL Shortener Backend

### Intro

Recently I stumbled upon [**Vertx**](http://vertx.io/). **Event-driven, asynchronized, lightweight, reactive, highly performant, polyglot** application framework. Ideal for writing **micro-services**. I played around with it for a while and really enjoyed the concept of **serverless** applications.

I developed a few apps and cases and started to wonder how to run and deploy them so that I get a 100% reliable service. I suddenly remembered the tech seminar that I attended recently, specifically session about serverless apps with [**AWS**](https://aws.amazon.com/) (Amazon Web Services) **Lambda**. Lambda is a serverless compute service that runs your code in response to events and automatically manages the underlying compute resources for you. Fairly similar concepts **Vertx** and **AWS Lambda**, so maybe they complement each other? As it turns out they do, **Vertx** can get most of your **Lambdas**…

Using the [**Serverless Framework**](https://serverless.com/) to create, manage and deploy your new **Lambdas** I was able to get this **micro-service** up and running in no time.

*Enough with the talk, lets see the implementation.*

### Code

*Handler Class, entry point of AWS Request.*

The first issue that I had was the **sync** Event Handler that is provided by AWS. So I had to by pass it with Future. In the Handler class I first initiate Vertx instance in a static block and deploy few Verticles that will do the work. This class only receives the event, extracts needed data from the request and passes the data to Vertx EventBus. After the Consumers handle the request, Handler class will generate a proper response and finish the AWS request.

<script src="https://gist.github.com/pendula95/583eb45bd0a7990136fba029bdcd555b.js"></script>

*Line 4-18:* This is where Vertx instance is created, Verticles are deployed and **Async JDBC** client is created. I figured out that it is better to created JDBC client here as in some cases I was timeout when that logic was in the Verticle start method.

*Line 27-36:* These are helper lines, parsing and formatting the data so I can pass it to the Verticles.

*Line 38-45:* I have decided to map the consumers to the address that is made of request method and url path, example POST/api. This means each API request is mapped to its own consumer in Verticle class.

*Line 47-77:* This is nothing but a block of code that handles the response that was passed from Verticles to the Future and generates the final response that will be return to API Gateway.

 

*UrlService, Vertx Verticle.*

Verticle class is pretty forward. Consumers that will process the message, methods for working with JDBC and helper methods for hashing/dehashing id. The logic behind url shortening is fairly simple here. Each long url is stored in database with a unique id and few additional columns. Row id is hashed and returned as short url. When retrieving long url hash is decoded to row id and long url is retrieved. Later user is redirected to long url. With this implementation, on 6 char short url (characters after the domain) you get 62^6 combinations which is 56 800 235 584 rows for storing your urls. TinyURL is currently at 6 long char urls (characters after domain). You can of course implement methods for reusing and recycling ids.

<script src="https://gist.github.com/pendula95/aeb4479162e6e33504add2af9fa68bc5.js"></script>

As said, this is all fairly straight forward, if you are already familiar with **Vertx**. If you are thinking why have I repeated the code for establish a **JDBC** connection, here is the explanation *(line: 10-16)*. I was getting Timeouts when creating JDBC connection in Verticles. To avoid this I also added this code to my Handler class. This way connection is created there and because of the **Vertx** implementation any later attempt to create it again will result in just getting the instances from the first invocation. This escaped the need to pass the instances directly from the Handler class when creating Verticle instances.

 

*Serverless configuration.*

Lastly I would like to share the serverless.yml, confirmation file that allows seamlessly deploy and management of AWS Lambda. With just a few commands and lines of configuration you are able to configure all necessary steps for deploying your AWS Lambda. Framework takes care of making configuration of Api-Gateway and other AWS hassle that would otherwise needed to be done by hand. In this case Lambda is invoked by HTTP events.
<script src="https://gist.github.com/pendula95/33adc47265072ed930c7df98c9ace7be.js"></script>

### Performance and Tests

**Vertx** async capabilities eased the stress and memory needs of traditional **AWS Lambdas** with sync methods. After performing load tests Lambdas that were written using Vertx framework preformed **10% faster and consumed 40% less memory**. As I have read somewhere in Vertx documentation, Sync methods will definitely finish the first request faster but in total Async will be faster in the end. This savings in memory and time will definitely reduce the cost of running your Lambdas and the little overhead with additional code is for sure worth it.

 

### Conclusion

To follow the pace of demanding needs for fast and resilient services we need to move from traditional Monoliths. Embracing the **micro service** architecture alone will not cut it, not anymore. With the rise and rapid advancement of **Cloud** solutions it has never been so easy to make a truly **Serverless** systems build upon network of **micro services**.
As you have seen **Vertx** with its async API makes the full advantage of **AWS Lambdas**, embracing them while also improving the performance and lowering the costs. With the help from **Serverless Framework** writing, deploying and managing your **Lambdas** has never been so easy.

If you are interested in the whole project, you can find it on [**GitHub**](https://github.com/pendula95/vertx-aws-url-shortener-service/tree/master).

[INFO Info | this is a re-publication of the following [blog post](http://lazarbulic.com/blog/2017/11/10/aws-lambda-vertx-framework-url-shortener-backend/)]
