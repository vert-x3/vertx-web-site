<!DOCTYPE html>
<html lang="en">
<head>
  <title>Vert.x homepage</title>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <meta content="" name="description">
  <meta content="" name="author">
  <link href="stylesheets/bootstrap-community.css" media="screen" rel="stylesheet">
  <!-- IE 6-8 support of HTML 5 elements -->
  <!--[if lt IE 9]>
  <script src="http://static.jboss.org/theme/js/libs/html5/pre3.6/html5.min.js"></script>
  <![endif]-->
  <link href="assets/favicons/vertx-favicon-5.ico" rel="shortcut icon">

  <script src="http://static.jboss.org/theme/js/libs/jquery/jquery-1.9.1.js"></script>
  <style>
    /* adjusting the vertical spacing for when a stickynav is engaged */
    .breadcrumb-fixed > .active {
      color: #8c8f91;
    }
    .breadcrumb-fixed {
      margin: 70px 0 10px;
      padding: 8px 15px;
      margin-bottom: 20px;
      list-style: none;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .breadcrumb-fixed > li {
      display: inline-block;
    }
  </style>
</head>
<body>

<!-- begin accesibility skip to top -->
<ul class="visuallyhidden" id="top">
  <li>
    <a accesskey="n" href="#nav" title="Skip to navigation">Skip to navigation</a>
  </li>
  <li>
    <a accesskey="c" href="#page" title="Skip to content">Skip to content</a>
  </li>
</ul>

<div class="container-fluid" id="content" style="padding-right: 0;">
  <div class="navbar navbar-default navbar-fixed" id="sticky-navbar">
    <div class="container">
      <div class="navbar-header">
        <button class="navbar-toggle collapsed" data-target="#navbar-1" data-toggle="collapse">
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <a class="navbar-brand" href="/vertx-home.html">
          <img alt="Brand" src="assets/logo-sm.png">
        </a>
      </div>
      <div class="collapse navbar-collapse" id="navbar-1">
        <ul class="nav navbar-nav navbar-right">
          <!--<li class=""><a href="vertx-home.html">HOME</a></li>-->
          <li class=""><a href="https://bintray.com/vertx/downloads/distribution/view">Download</a></li>
          <li class=""><a href="https://groups.google.com/forum/?fromgroups#!forum/vertx">User Google Group</a></li>
          <li class=""><a href="https://groups.google.com/forum/?fromgroups#!forum/vertx-dev">Developer Group</a></li>
          <li class=""><a href="https://github.com/vert-x3/issues-and-wiki/wiki">Wiki</a></li>
          <!--<li class=""><a href="followus.html">FOLLOW US</a></li>-->
        </ul>
      </div>
    </div>
  </div>
</div>

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

<div class="container">
  <div class="row">
  </div>
</div>
    <span class="backToTop">
      <a href="#top">back to top</a>
    </span>
<script src="javascripts/bootstrap-community.js"></script>
</body>
</html>
