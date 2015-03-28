<!DOCTYPE html>
<html lang="en">
<head>
  <title>Vert.x</title>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <meta content="Vert.x is a tool-kit for building reactive applications on the JVM." name="description">
  <link href="stylesheets/main.css" media="screen" rel="stylesheet">
  <link href="assets/fonts/entypo/styles.css" media="screen" rel="stylesheet">
  <!-- IE 6-8 support of HTML 5 elements -->
  <!--[if lt IE 9]>
  <script src="http://static.jboss.org/theme/js/libs/html5/pre3.6/html5.min.js"></script>
  <![endif]-->
  <link href="assets/favicons/vertx-favicon-5.ico" rel="shortcut icon">
  <link href="http://fonts.googleapis.com/css?family=Ubuntu:400,500,700,400italic" rel="stylesheet" type="text/css">
</head>
<body>

<a href="http://www.reactivemanifesto.org/">
  <img style="border: 0; position: fixed; right: 0; top:0; z-index: 9000"
    src="http://d379ifj7s9wntv.cloudfront.net/reactivemanifesto/images/ribbons/we-are-reactive-black-right.png">
</a>

<a id="skippy" class="sr-only sr-only-focusable" href="#content"><div class="container"><span class="skiplink-text">Skip to main content</span></div></a>

<header class="navbar navbar-static-top" id="top" role="banner">
  <div class="container">
    <div class="navbar-header">
      <button class="navbar-toggle collapsed" type="button" data-toggle="collapse" data-target=".bs-navbar-collapse">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>
      <a href="index.html" class="navbar-brand"><img alt="Brand" src="assets/logo-sm.png"></a>
    </div>
    <nav class="collapse navbar-collapse bs-navbar-collapse">
      <ul class="nav navbar-nav navbar-right">
        <!--<li class=""><a href="vertx-home.html">HOME</a></li>-->
        <li class=""><a href="https://bintray.com/vertx/downloads/distribution/view">Download</a></li>
        <li class=""><a href="https://groups.google.com/forum/?fromgroups#!forum/vertx">User Google Group</a></li>
        <li class=""><a href="https://groups.google.com/forum/?fromgroups#!forum/vertx-dev">Developer Group</a></li>
        <li class=""><a href="https://github.com/vert-x3/wiki/wiki">Wiki</a></li>
        <li class=""><a href="http://vertx.io" class="vertx-2-link">Vert.x 2</a></li>
      </ul>
    </nav>
  </div>
</header>

<#if content.body??>
${content.body}
<#else>
  <#include "index.html">
</#if>

<#--<footer class="container-fluid" style="margin-top: 130px">-->
  <#--<div class="row">-->
    <#--<div class="col-md-2 col-md-offset-1">-->
      <#--<h4>Navigate</h4>-->
      <#--<ul class="list-unstyled">-->
        <#--<li>-->
          <#--<a href="docs/manual.html" title="Learn">Learn</a>-->
        <#--</li>-->
        <#--<li>-->
          <#--<a href="docs/getting_started.html" title="Get Started">Get Started</a>-->
        <#--</li>-->
        <#--<!---->
                    <#--<li>-->
                      <#--<a href="#" title="Download">Download</a>-->
                    <#--</li>-->
        <#--&ndash;&gt;-->
      <#--</ul>-->
    <#--</div>-->
    <#--<div class="col-md-2">-->
      <#--<h4>Community</h4>-->
      <#--<ul class="list-unstyled">-->
        <#--<li>-->
          <#--<a href="https://groups.google.com/forum/vertx" title="Forums">Forums</a>-->
        <#--</li>-->
        <#--<li>-->
          <#--<a href="https://twitter.com/vertx_project" title="Twitter">Twitter</a>-->
        <#--</li>-->
      <#--</ul>-->
    <#--</div>-->
    <#--<div class="col-md-2">-->
      <#--<h4>Project</h4>-->
      <#--<ul class="list-unstyled">-->
        <#--<li>-->
          <#--<a href="https://groups.google.com/d/forum/vertx-dev" title="Join the team">Join the team</a>-->
        <#--</li>-->
        <#--<li>-->
          <#--<a href="https://github.com/vert-x3/" title="Join the team">Repository</a>-->
        <#--</li>-->
        <#--<li>-->
          <#--<a href="https://vertx.ci.cloudbees.com/view/vert.x-3/" title="Continuous integration">Continuous integration</a>-->
        <#--</li>-->
      <#--</ul>-->
    <#--</div>-->
    <#--<div class="col-md-3 col-md-offset-1">-->
    <#--</div>-->
  <#--</div>-->
<#--</footer>-->

<script src="http://static.jboss.org/theme/js/libs/jquery/jquery-1.9.1.js"></script>
<script src="javascripts/bootstrap.js"></script>

</body>
</html>
