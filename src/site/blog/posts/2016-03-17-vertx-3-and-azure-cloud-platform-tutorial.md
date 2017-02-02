---
title: Vertx 3 and Azure cloud platform tutorial
date: 2016-03-17
template: post.html
author: pmlopes
---

Vert.x 3.2.1 applications can quickly be deployed on [Microsoft Azure](http://portal.azure.com/). Deployment is independent of your build so it is all about configuration.

## About Azure

Azure by design does not support `multicast` on the network virtualization level, however all virtual machines defined
on the same group are deployed on the same network (by default), so `TCP-IP` discovery can be enabled and quickly setup
to form a cluster.

This how you would deploy your app:

1. create a `fat-jar` with your app
2. create a `cluster.xml` with tcp-ip discovery
3. run your app with: `cp folder_of_your_cluster_xml_file -cluster -cluster-host VM_PRIVATE_IP`

## Screencast

The following screencast 

<div class="embed-responsive embed-responsive-16by9">
<iframe class="embed-responsive-item" src="https://www.youtube.com/embed/nGQs_swWwAM" frameborder="0" allowfullscreen></iframe>
</div>

Don't forget to follow our [youtube channel](https://www.youtube.com/channel/UCGN6L3tRhs92Uer3c6VxOSA)!
