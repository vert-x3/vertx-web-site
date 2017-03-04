---
title: Vert.x featuring Continuous Delivery with Jenkins and Ansible
date: 2016-09-28
template: post.html
author: ricardohmon
---
This blog entry describes an approach to adopt _Continuous Delivery_ for Vert.x applications using Jenkins and Ansible by taking advantage of the Jenkins Job DSL and Ansible plugins.

## Table of contents
- [Preamble](#preamble)
- [Introduction](#introduction)
- [Overview](#overview)
- [Creating a Jenkins build job using Job DSL](#creating-a-Jenkins-build-job-using-job-dSL)
- [Deploying Vert.x app using Ansible](#deploying-vertx-app-using-ansible)
- [Sample sources and demo](#sample-sources-and-demo)
    - [Launch instructions](#launch-instructions)
    - [Demo](#demo)
- [Conclusion](#conclusion)

## Preamble
This post was written in context of the project titled "[DevOps tooling for Vert.x applications](https://summerofcode.withgoogle.com/projects/#4858492141699072)", one of the projects at Vert.x taking place during the 2016 edition of [Google Summer of Code](https://summerofcode.withgoogle.com/about/), a program that aims to bring students together with open source organizations in order to help them to gain exposure to software development practices and real-world challenges.

## Introduction
System configuration management (e.g., Ansible) has been really hype in the recent years and there is a strong reason for that.
Configuration management facilitates configuring a new environment following a fixed _recipe_ or slightly varying it with the help of parameters. This has not only the advantage of being able to do it more frequently but reduces the chance of errors than doing it manually.  
Beyond that, combining it with _Continuous Integration_ tools (e.g., Jenkins) allows making a deployment as soon as a new codebase version is available, which represents the main building block of a _Continuous Delivery_ pipeline, one of the objectives of embracing a DevOps culture.

Given that Vert.x is a framework that consists in a few libraries which can be shipped within a single _fat jar_, adopting a DevOps culture while developing a Vert.x-based application is straightforward.

## Overview
As seen in the diagram below, this post describes a method to define a Jenkins build job which will react to changes in a code repository. After succesfully building the project, the job will execute an Ansible _playbook_ to deploy the new application version to the hosts specified within the Ansible configuration.

![Overview of the continous delivery process](/assets/blog/continuous-delivery-jenkins-ansible/ansible-jenkins-overview.svg)
## Creating a Jenkins build job using Job DSL
Jenkins has created a convenient way to define build jobs using a DSL. While this option avoids the hassle of configuring build jobs manually, it supports all features of the regular interface through its [API](https://jenkinsci.github.io/job-dsl-plugin/). It is possible to use Ansible together with Jenkins with the help of the Ansible [plugin](https://wiki.jenkins-ci.org/display/JENKINS/Ansible+Plugin/), whose instructions are also included in the Job DSL [API](https://github.com/jenkinsci/ansible-plugin/blob/master/README.md). Alternatively to the Job DSL Plugin, Ansible can be used inside the definition of Jenkins Pipeline, one of tool's most recent features.

Below is a sample job definition which can be used after creating a _freestyle_ job (seed job) and adding a new build step with the DSL script. In the script, there are a few things to notice:
* A name for the job created by the seed job is given.
* Specific versions of JDK, Maven, and Ansible (available in the environment) are used.
* Git is selected as the SCM platform and the target repository is defined. Also, the build job is triggered according to a specific interval.
* The Maven _package_ goal is invoked, which is instructed to package the application into a fat jar.
* Lastly, Ansible is used to call a playbook available in the filesystem. The app will be deployed to the defined target hosts and the credentials (configured in Jenkins) will be used to log into the target hosts. Additionally, enabling the `colorizedOutput` option will result in a friendlier formatting of the results in the console output. The contents of this playbook will be addressed in the next section.

```groovy
job('vertx-microservices-workshop-job') {
    jdk('JDK8')
    scm {
        git('git://github.com/ricardohmon/vertx-microservices-workshop.git')
    }
    triggers {
        scm('*/15 * * * *')
    }
    steps {

      def mvnInst = 'M3.3.9'  
      maven {  
        goals('package')  
        mavenInstallation(mvnInst)  
      }  
      ansiblePlaybook('/ansible/playbook.yml') {  
        inventoryPath('/ansible/hosts')  
        ansibleName('Ansible2.0')  
        credentialsId('vagrant-key')  
        colorizedOutput(true)  
      }  

    }  
}
```

## Deploying Vert.x app using Ansible
An Ansible Playbook results quite convenient to deploy a Vert.x application to a number of hosts while still taking considerations for each of them. Below is a sample playbook that deploys the respective application to each of the hosts described in an _inventory_ file. The playbook comprises the following tasks and takes the listed considerations:

1) A task that targets only hosts with a database.
- The target hosts is specified with the name of the host (or hosts group) defined in the inventory file.

2) Actual application deployment task. Here, several considerations are done:
- The application may require that only one host is updated at the time.  
This can be achieved with the `serial` option, while the order of the deployment to hosts can be enforced in the `hosts` option.    
[NOTE Host processing order | Even though we could have declared `all` hosts, Ansible does not provide an explicit way to specify the order.]
- Java is a system requirement for our Vert.x applications.  
Besides installing it (keep reading), we need to declare the `JAVA_HOME` environment variable.
- A deployment may just represent an update to an already running application (_Continuous Deployment_), hence it is convenient to stop the previous application inside the `pre_tasks` and take post-deployment actions in the `post_tasks`.
Vert.x ships with the convenient `start`/`stop`/`list` commands that result very helpful here. We can use the `list` command and extract (using regex) the `id` of the running application of its output to stop it before deploying a new version.
[NOTE Hint | If our solution includes a load balancer or proxy, we could deal with them at this step as described in Ansible's [best practices](http://docs.ansible.com/ansible/playbooks_delegation.html) for rolling updates]
- Call to a `role` that makes the actual application deployment. The Jenkins Ansible Plugin includes, between others, a `WORKSPACE` environment variable, which may result very helpful in the following tasks, as shown later.

```yaml
  # 1) Special task for the service with a db
- hosts: audit-service
  remote_user: vagrant
  become: yes
  roles:
    - db-setup

  # 2) Common tasks for all hosts
- hosts: quote-generator:portfolio-service:compulsive-traders:audit-service:trader-dashboard
  remote_user: vagrant
  become: yes
  serial: 1
  environment:
    JAVA_HOME: /usr/lib/jvm/jre-1.8.0-openjdk/

  pre_tasks:
  - name: Check if the app jar exists in the target already
    stat: path=/usr/share/vertx_app/app-fatjar.jar
    register: st
  - name: List running Vert.x applications
    command: java -jar /usr/share/vertx_app/app-fatjar.jar list
    register: running_app_list
    when: st.stat.exists == True
  - name: Stop app if it is already running (avoid multiple running instances)
    command: java -jar /usr/share/vertx_app/app-fatjar.jar stop {% raw %}{{ item | regex_replace('^(?P<V_id>.[8]-.[4]-.[4].[4].[12])\t.*', '\\g<V_id>') }}{% endraw %}
    with_items: "{% raw %}{{ running_app_list.stdout_lines|default([]) }}{% endraw %}"
    when: st.stat.exists == True and (item | regex_replace('.*\t(.*)$', '\\1') | match('.*/app-fatjar.jar$'))

  # Main role
  roles:
    - { role: vertx-app-deployment, jenkins_job_workspace: "{{ lookup('env', 'WORKSPACE') }}" }

  post_tasks:
  - name: List again running Vert.x applications
    command: java -jar /usr/share/vertx_app/app-fatjar.jar list
```

Once we took care of the actions shown before, the remaining tasks (included in the main deployment role) reduce to the following:

1) Prepare the target machine with the proper environment to run our application. This includes:
- Set up Java (pretty convenient to do it through a package manager).
- Copy the Vert.x application package to the appropriate folder (quite simple using a fat jar). The actual name and location of the jar package in the Jenkins environment can be defined using host-specific [variables](http://docs.ansible.com/ansible/playbooks_delegation.html).
- In case necessary, copy the required config files.

```yaml
- name: Install Java 1.8 and some basic dependencies
  yum: name={% raw %}{{ item }}{% endraw %} state=present
  with_items:
   - java-1.8.0-openjdk
- name: Ensure app dir exists
  file: path=/usr/share/vertx_app/ recurse=yes state=directory mode=0744
- name: Copy the Vert.x application jar package
  copy: src={% raw %}{{ app_jar }}{% endraw %} dest=/usr/share/vertx_app/app-fatjar.jar mode=0755
- name: Ensure config dir exists
  file: path=/etc/vertx_app/ recurse=yes state=directory mode=0744
- name: Copy the application config file if needed
  copy: src={% raw %}{{ app_config }}{% endraw %} dest=/etc/vertx_app/config.json mode=0755
  when: app_config is defined
```

2) Run the application as a service in the hosting machine.
- Make sure to ignore the hang up signal with the help of `nohup` command. Otherwise, Ansible will be stuck at this step.

```yaml
- name: Run Vert.x application as a service, ignore the SIGHUP signal
  shell: nohup java {% raw %}{{ vertx_opts }}{% endraw %} -jar /usr/share/vertx_app/app-fatjar.jar start {% raw %}{{ launch_params }}{% endraw %}
  register: svc_run_out
- name: Print run output
  debug: var=svc_run_out.stdout_lines
```

[NOTE Launching the Vert.x app | This example uses the `start` command to launch the application as a service. This method may result more comfortable than creating an [init.d script](http://vertx.io/blog/vert-x-3-init-d-script/) or calling Vert.x from [command line](https://github.com/vert-x3/vertx-examples/#running-at-the-command-line), which would have required to install the Vert.x libraries in an independent Ansible task. ]

This describes all the configuration needed to be able to build from a repository using Jenkins and deploy the results to our hosts with Ansible.


## Sample sources and demo
The sample configurations presented before are part of a complete demo focused on the Vert.x microservices [workshop](http://vertx-lab.dynamis-technologies.com/) to exemplify a basic Continuous Delivery scenario. This set up is available in a [repository](https://github.com/ricardohmon/vertx-ansible) and contains, in addition, a pre-configured Jenkins-based demo ready to host the build job described the previous sections. The demo scenario requires Vagrant and Virtualbox to be launched.

### Launch instructions
* Clone or download this repository, and launch the demo using `vagrant up`
```
git clone https://github.com/ricardohmon/vertx-ansible.git
cd demo
vagrant up
```
This command will launch a virtual machine hosting Jenkins with the required plugins installed (tools names needed) and also launch five additional VMs that will host the microservices deployed by Jenkins.

* Create a Jenkins freestyle build job using the DSL job script (seed job) found in `deployment-jobs/microservices_workshop_dsl.groovy` and build it.
[NOTE Tool configuration assumption | The DSL Job assumes the following tools (with names) have been configured in Jenkins: Java 8(`JDK8`), Maven (`M3.3.9`), Ansible (`Ansible2.0`)]
* After building the seed job, a new job(`vertx-microservices-workshop-job`) will be created, which will be in charge of pulling recent changes of the project, building it, and deploying it.

### Demo
Watch the previous demo in action in the following screencast:

<div class="embed-responsive embed-responsive-16by9">
<iframe class="embed-responsive-item" src="https://www.youtube.com/embed/GQd_Rfeu6Yo" frameborder="0" allowfullscreen></iframe>
</div>

## Conclusion
Continuous Delivery approach is a _must_ in modern software development lifecycles (including Vert.x-based applications) and a step further towards adopting a DevOps culture. There are a number of tools that enable it and one example is the combination of Jenkins + Ansible described in this post.    
While Jenkins offers the possibility to integrate recent changes perceived in a codebase and build runnable artifacts, Ansible can help to deploy them to hosting environments. The usage of both tools can be coupled easily with the help of the Job DSL plugin, a feature of Jenkins that allows describing a build job using a _domain-specific language_, which can help to integrate additional steps and tools to a _CD_ pipeline.

Further enhancements can be done to this basic pipeline, such as, integrating the recent [Pipeline plugin](https://wiki.jenkins-ci.org/display/JENKINS/Pipeline+Plugin), a feature that allows a better orchestration of CD stages; inclusion of notification and alerting services; and, ultimately a zero-downtime deployment approach, which could be achieved with the help of a proxy; plus, tons of options available trough Jenkins plugins.

Thanks for reading!
