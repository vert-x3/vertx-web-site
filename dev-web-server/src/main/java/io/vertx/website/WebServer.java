package io.vertx.website;

import io.vertx.core.Vertx;
import io.vertx.core.http.HttpServer;
import io.vertx.core.http.HttpServerOptions;
import io.vertx.ext.apex.addons.StaticServer;
import io.vertx.ext.apex.core.Router;

/**
 *
 * Simple web server for viewing web site locally during development
 *
 * Created by tim on 12/01/15.
 */
public class WebServer {

  public static void main(String[] args) {
    new WebServer().go();
  }

  private void go() {
    Vertx vertx = Vertx.vertx();
    Router router = Router.router(vertx);
    router.route().handler(StaticServer.staticServer("target/site"));

    HttpServer server = vertx.createHttpServer(new HttpServerOptions().setPort(8080).setHost("localhost"));
    server.requestHandler(router::accept);

    server.listen();
  }
}
