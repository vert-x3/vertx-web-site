<!DOCTYPE html>
<html lang="en">
<head>
  <title>Vert.x homepage</title>
  <meta charset="utf-8">
  <meta content="width=device-width, initial-scale=1.0" name="viewport">
  <meta content="" name="description">
  <meta content="" name="author">
  <!--<link href="stylesheets/bootstrap-community.css" media="screen" rel="stylesheet">-->
  <link href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css" rel="stylesheet">
  <link href="stylesheets/main.css" media="screen" rel="stylesheet">
  <!-- IE 6-8 support of HTML 5 elements -->
  <!--[if lt IE 9]>
  <script src="http://static.jboss.org/theme/js/libs/html5/pre3.6/html5.min.js"></script>
  <![endif]-->
  <link href="assets/favicons/vertx-favicon-5.ico" rel="shortcut icon">
  <script src="//code.jquery.com/jquery-1.11.2.min.js"></script>
</head>
<body>

  <#include "reactive_ribbon.ftl">
  <#include "header.ftl">
  
  <main>
	<#if content.body??>
	${content.body}
	<#else>
	  <#include "main.ftl">
	</#if>
  </main>
  
  <#include "footer.ftl">

  <span class="backToTop">
    <a href="#top">back to top</a>
  </span>
  <!--<script src="javascripts/bootstrap-community.js"></script>-->
  <script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js"></script>


</body>
</html>

