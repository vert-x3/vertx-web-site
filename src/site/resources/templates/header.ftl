<!DOCTYPE html>
<html lang="en">
<head>
  <title>${content.title!"Vert.x"}</title>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <meta content="Vert.x is a tool-kit for building reactive applications on the JVM." name="description">
  <link href="stylesheets/main.css" media="screen" rel="stylesheet">
  <link href="assets/fonts/entypo/styles.css" media="screen" rel="stylesheet">
  <link href="javascripts/styles/rainbow.min.css" media="screen" rel="stylesheet">
  <!-- IE 6-8 support of HTML 5 elements -->
  <!--[if lt IE 9]>
  <script src="http://static.jboss.org/theme/js/libs/html5/pre3.6/html5.min.js"></script>
  <![endif]-->
  <link href="assets/favicons/vertx-favicon-5.ico" rel="shortcut icon">
  <link href="http://fonts.googleapis.com/css?family=Ubuntu:400,500,700,400italic" rel="stylesheet" type="text/css">
</head>
<body>

<a href="http://www.reactivemanifesto.org/" id="reactive-manifesto-banner">
  <img style="border: 0; position: fixed; right: 0; top:0; z-index: 9000"
    src="http://d379ifj7s9wntv.cloudfront.net/reactivemanifesto/images/ribbons/we-are-reactive-black-right.png">
</a>

<a id="skippy" class="sr-only sr-only-focusable" href="#content"><div class="container"><span class="skiplink-text">Skip to main content</span></div></a>

<header class="navbar navbar-default <#if content.type == "index">navbar-fixed-top<#else>navbar-static-top</#if>" id="top" role="banner">
  <div class="container">
    <div class="navbar-header">
      <button class="navbar-toggle collapsed" type="button" data-toggle="collapse" data-target="#vertx-navbar-collapse">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>
      <a href="index.html" class="navbar-brand"><img alt="Brand" src="assets/logo-sm.png"></a>
    </div>
    <nav class="collapse navbar-collapse" id="vertx-navbar-collapse">
      <ul class="nav navbar-nav navbar-right">
        <!--<li class=""><a href="vertx-home.html">HOME</a></li>-->
        <li><a href="https://bintray.com/vertx/downloads/distribution/view">Download</a></li>
        <li><a href="docs.html">Documentation</a></li>
        <li><a href="https://github.com/vert-x3/wiki/wiki">Wiki</a></li>
        <li class="dropdown">
          <a id="nav-community-label" href="#" class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true" role="button">
            Community
            <span class="caret"></span>
          </a>
          <ul class="dropdown-menu" role="menu" aria-labelledby="nav-community-label">
            <li role="presentation"><a role="menuitem" href="https://groups.google.com/forum/?fromgroups#!forum/vertx">User Google Group</a></li>
            <li role="presentation"><a role="menuitem" href="https://groups.google.com/forum/?fromgroups#!forum/vertx-dev">Developer Group</a></li>
          </ul>
        </li>
        <li><a href="http://vertx.io" class="vertx-2-link">Vert.x 2</a></li>
      </ul>
    </nav>
  </div>
</header>
