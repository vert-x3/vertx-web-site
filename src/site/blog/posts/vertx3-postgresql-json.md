---
title: Vert.x3 and PostgreSQL JSON type
date: 2015-07-03
template: post.html
author: pmlopes
---
One of the interesting features of NoSQL databases is their schema-less mode of operation. This feature is very useful
during project prototyping and early development since at early the stages of development of projects all data
structures are not clear or have been defined yet. The reason of this post is not to discuss about that subject, but to
show that sometimes you can also use NoSQL with a more traditional database engine like [PostgreSQL](http://www.postgresql.org/).

Since version [9.3](http://www.postgresql.org/docs/9.3/static/datatype-json.html) there is support for JSON however with
version [9.4](http://www.postgresql.org/docs/9.4/static/datatype-json.html) there is even better support with the new type
JSONB. I will now show how to use the basic JSON type in a simple REST application written with Vert.x3:

<script src="https://gist.github.com/pmlopes/47f7f02b0b102b5e68d8.js"></script>

Now all you need to do is play with this REST service, for this you can use curl to create a sale:

```shell
$ curl \
    -i \
    -H "Content-Type: application/json" \
    -X POST \
    -d '{"id": 1, "customer_name": "John", "items": {"description": "milk", "quantity": 4}}' \
    http://localhost:8080/sales

HTTP/1.1 201 Created
Content-Length: 0
$
```

And if you want to read that new document:

```shell
$ curl -i -H "Accept: application/json" -X GET http://localhost:8080/sales/1
HTTP/1.1 200 OK
content-type: application/json
Content-Length: 75

{"id":1,"customer_name":"John","items":{"description":"milk","quantity":4}}
$
```
