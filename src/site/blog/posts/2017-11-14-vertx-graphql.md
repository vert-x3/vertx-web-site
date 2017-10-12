---
title: Eclipse Vert.x meets GraphQL
template: post.html
date: 2017-11-14
author: jotschi
---

I recently added GraphQL support to [Gentics Mesh](https://github.com/gentics/mesh) and I thought it would be a good idea to boil down the essence of my implementation in example so that I could share it in a simpler form.
The example I'm about to show will not cover all aspects that I have added to the [Gentics Mesh API](https://getmesh.io/docs/beta/graphql.html) (e.g. paging, search and error handling) but it will give you a basic overview of the parts that I put together.
GraphQL does not require a GraphDB even if the name might suggest it.
 
Using a graphdb in combination with GraphQL does nevertheless provide you with some advantages which I will highlight later on.

## What is GraphQL? What is it good for?

GraphQL as the name suggests is a new query language which can be used to load exactly the amount of data which you ask for. 

The query is defined in way that the query fields correlate to the JSON data that is being retrieved. 
In our StarWars Demo domain model this query will load the name of human 1001 which is Darth Vader.

```
{
  vader: human(id: 1001) {
	  name
  }
}
```

Would result in:
```json
{
  "data": {
    "vader": {
      "name": "Darth Vader"
    }
  }
}
```

## The Demo App

The demo application I build makes use of the [graphql-java](https://github.com/graphql-java/graphql-java) library. The data is being stored in a graph database.
I use [OrientDB](http://orientdb.com/orientdb/) in combination with the [OGM Ferma](https://github.com/Syncleus/Ferma) to provide a data access layer.
GraphQL does not necessarily require a graph database but in this example I will make use of one and highlight the benefits of using a GraphDB for my usecase.

You can find the sources here: https://github.com/Jotschi/vertx-graphql-example

### Data

The [StarWarsData](https://github.com/Jotschi/vertx-graphql-example/blob/master/src/main/java/de/jotschi/vertx/data/StarWarsData.java) class creates a Graph which contains the Star Wars Movies and Characters, Planets and their relations.
The model is fairly simple. There is a single StarWarsRoot vertex which acts as a start element for various aggregation vertices: Movies are stored in MovieRoot, Planets in PlanetsRoot, Characters are stored in HumansRoot and DroidsRoot.

The model classes are used for wrappers of the specific graph vertices. The [Ferma OGM](http://syncleus.com/Ferma/) is used to provide these wrappers. Each class contains methods which can be used to traverse the graph to locate the needed vertices.
The found vertices are in turn again wrapped and can be used to locate other graph elements.

### Schema

The next thing we need is the GraphQL schema. The schema describes each element which can be retrieved. It also describes the properties and relationships for these elements.

The graphql-java library provides an API to create the object types and schema information.

```
private GraphQLObjectType createMovieType() {
  return newObject().name("Movie")
    .description("One of the films in the Star Wars universe.")

    // .title
    .field(newFieldDefinition().name("title")
        .description("Title of the episode.")
        .type(GraphQLString)
        .dataFetcher((env) -> {
          Movie movie = env.getSource();
          return movie.getName();
        }))

    // .description
    .field(newFieldDefinition().name("description")
        .description("Description of the episode.")
        .type(GraphQLString))

    .build();
}
```

A type can be referenced via a `GraphQLTypeReference` once it has been created and added to the schema. This is especially important if you need to add fields which reference other types.
Data fetchers are used to access the context, traverse the graph and retrieve properties from graph elements.

Another great source to learn more about the schema options is the [GarfieldSchema](https://github.com/graphql-java/graphql-java/blob/master/src/test/groovy/graphql/GarfieldSchema.java) example.

Finally all the created types must be referenced by a central object type [QueryType](https://github.com/Jotschi/vertx-graphql-example/blob/master/src/main/java/de/jotschi/vertx/data/StarWarsSchema.java#L204).
The query type object is basically the root object for the query.
It defines what query options are initially possible. In our case it is possible to load the hero of the sage, specific movies, humans or droids.

### Verticle

The [GraphQLVerticle](https://github.com/Jotschi/vertx-graphql-example/blob/master/src/main/java/de/jotschi/vertx/GraphQLVerticle.java) is used to accept the GraphQL request and process it.

The verticle also contains a StaticHandler to provide the Graphiql Browser web interface. This interface will allow you to quickly discover and experiment with GraphQL.

The [query handler](https://github.com/Jotschi/vertx-graphql-example/blob/master/src/main/java/de/jotschi/vertx/GraphQLVerticle.java#L77) accepts the query JSON data. 

An OrientDB transaction is being opened and the query is executed:

```java
demoData.getGraph().asyncTx((tx) -> {
	// Invoke the query and handle the resulting JSON
	GraphQL graphQL = newGraphQL(schema).build();
	ExecutionInput input = new ExecutionInput(query, null, queryJson, demoData.getRoot(), extractVariables(queryJson));
	tx.complete(graphQL.execute(input));
}, (AsyncResult<ExecutionResult> rh) -> {
	...
});
```

The execute method initially needs a context variable. This context passed along with the query.
In our case the context is the root element of the graph `demoData.getRoot()`.
This context element also serves as the initial source for our data fetchers.

```java
.dataFetcher((env) -> {
	StarWarsRoot root = env.getSource();
	return root.getHero();
}))
```

The data fetchers for the hero type on the other hand will be able to access the hero element since the fetcher above returned the element.
Using this mechanism it is possible to traverse the graph. It is important to note that each invocation on the domain model methods will directly access the graph database.
This way it is possible to influence the graph database query down to the lowest level. When omitting a property from the graphql query it will not be loaded from the graph.
Thus there is no need to write an additional data access layer. All operations are directly mapped to graph database.

The `StarWarsRoot` Ferma class `getHero()` method in turn defines a [TinkerPop Gremlin traversal](http://tinkerpop.apache.org/docs/3.3.0/tutorials/getting-started/#_graph_traversal_staying_simple) which is used to load the Vertex which represents the hero of the Star Wars saga.

[INFO Apache TinkerPop | [Apache TinkerPop](http://tinkerpop.apache.org/) is an open source, vendor-agnostic, graph framework / API which is supported by many graph database vendors. 
One part of TinkerPop is the Gremlin traversal language which is great to query graph databases.]

```java
...
public Droid getHero() {
	// Follow the HAS_ROOT edge and return the first found Vertex which could be found. 
	// Wrap the Vertex explicitly in the Droid Ferma class.  
	return traverse((g) -> g.out(HAS_HERO)).nextOrDefaultExplicit(Droid.class, null);
}
...
```

Once the query has been executed the result handler is being invoked. It contains some code to process the result data and potential errors.
It is important to note that a GraphQL query will always be answered with a 2xx HTTP status code.
If an element which is being referenced in the query can't be loaded an error will be added to the response JSON object.

### Testing

Testing is fairly straight forward. Although there are multiple approaches. One approach is to use unit testing directly on the GraphQL types. 
Another option is to run queries against the endpoint.  

The [GraphQLTest class](https://github.com/Jotschi/vertx-graphql-example/blob/master/src/test/java/de/jotschi/vertx/GraphQLTest.java) I wrote will run multiple queries against the endpoint.
A Parameterized JUnit test is used iterate over the queries.

A [typical query](https://github.com/Jotschi/vertx-graphql-example/blob/master/src/test/resources/graphql/full-query) does not only contain the query data.
The assertions on the response JSON are directly included in query using plain comments.

I build an [AssertJ](http://joel-costigliola.github.io/assertj/) assertion to check the comments of a query and verify that the assertion matches the response.
```java
	assertThat(response).compliesToAssertions(queryName);
```

## Run the example

You can run the example by executing the `GraphQLServer` class and access the [Graphiql browser on http://localhost:3000/browser/](http://localhost:3000/browser/?query=%7B%0A%20%20movies%20%7B%0A%20%20%20%20title%0A%20%20%7D%0A%20%20hero%20%7B%0A%20%20%20%20name%0A%20%20%7D%0A%7D%0A)

## Where to go from here?

The example is read-only. GraphQL also supports data mutation which can be used to actually modify and store data.
I have not yet explored that part of GraphQL but I assume it might not be that hard to add mutation support to the example.

Additionally it does not cover how to actually make use of such API. I recently [updated my Vert.x example](https://github.com/gentics/mesh-vertx-example/) which shows how to use Vert.x template handlers to build a small server which renders some pages using data which was loaded via GraphQL.

Thanks for reading. If you have any further questions or feedback don't hesitate to send me a tweet to [@Jotschi](https://twitter.com/Jotschi/) or [@genticsmesh](https://twitter.com/genticsmesh/).
