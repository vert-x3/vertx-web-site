---
title: Vert.x featuring Continuous Delivery with Jenkins and Ansible
date: 2016-07-26
template: post.html
author: ricardohmon
---


## Preamble
This post was written in context of the project titled "[DevOps tooling for Vert.x applications](https://summerofcode.withgoogle.com/projects/#4858492141699072)", one of the Vert.x projects taking place during the 2016 edition of [Google Summer of Code](https://summerofcode.withgoogle.com/about/), a program that aims to bring together students with open source organizations, in order to help them to gain exposure to software development practices and real-world challenges.

## Introduction
System configuration management (e.g., Ansible) has been really hype in the recent years and there is a strong reason for that.
Configuration management facilitates configuring a new environment following a fixed _recipe_ or slightly varying it with the help of parameters. This has not only the advantages of being able to do it more frequently but it is less error-prone as doing it manually.
Beyond that, combining it with _Continuous Integration_ tools (e.g., Jenkins) allows making deployments as soon as a new codebase version is available, which represents the main building blocks of a _Continuous Delivery_ pipeline, one of the objectives of embracing
a DevOps culture.

Given that Vert.x is a framework that consists in a few libraries which can be shipped within a single fat jar, adopting a DevOps culture while developing a Vert.x-based application is straightforward.

## Creating a Jenkins build job using Job DSL
Jenkins has created a convenient way to define build jobs using a DSL. While this way avoids the hassle of configuring build jobs manually, it supports all features of the regular interface through its [API](https://jenkinsci.github.io/job-dsl-plugin/). It is possible to use Ansible together with Jenkins with the help of the Ansible [plugin](), whose instructions are also included in the Job DSL API. Alternatively to the Job DSL Plugin, Ansible can be used within the definition of Jenkins Pipeline, one of tool's most recent features.

Below is a sample job definition which can be used while creating a new _freestyle_ job and adding a new build step with the DSL script. Inside the script we notice how specific versions of JDK and Maven, available in the environment, are used; Git is selected as the SCM platform and a specific branch is built with a corresponding 15 code-changes checking interval; Maven's _package_ goal is used, which is instructed to package the application into a fat jar; and, lastly, Ansible is used to call a playbook in the environment and make a deployment to the defined target hosts.

```
job('vertx-microservices-workshop-job') {
    jdk('JDK8')
    scm {
        git('git://github.com/ricardohmon/vertx-microservices-workshop.git','without-docker')
    }
    triggers {
        scm('*/15 * * * *')
    }
    steps {
        def mvnInst = 'M3.3.9'
      maven {
        goals('-e clean package install')
            mavenInstallation(mvnInst)
            localRepository(LocalRepositoryLocation.LOCAL_TO_WORKSPACE)
      }
        maven {
            goals('-e package')
            mavenInstallation(mvnInst)
            rootPOM('solution/quote-generator/pom.xml')
            localRepository(LocalRepositoryLocation.LOCAL_TO_WORKSPACE)
        }
        maven {
            goals('-e package')
            mavenInstallation(mvnInst)
            rootPOM('solution/portfolio-service/pom.xml')
            localRepository(LocalRepositoryLocation.LOCAL_TO_WORKSPACE)
        }
        maven {
            goals('-e package')
            mavenInstallation(mvnInst)
            rootPOM('solution/audit-service/pom.xml')
            localRepository(LocalRepositoryLocation.LOCAL_TO_WORKSPACE)
        }
        maven {
            goals('-e package')
            mavenInstallation(mvnInst)
            rootPOM('solution/compulsive-traders/pom.xml')
            localRepository(LocalRepositoryLocation.LOCAL_TO_WORKSPACE)
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
An Ansible Playbook is quite convenient to deploy a Vert.x application. The required steps can be reduced as follows:

1. Prepare the target machine with the proper environment to run our application.
...This includes: 
..- Set up Java (pretty convenient to do it through a package manager).
[NOTE Don't forget | Vert.x requires Java 8 to run!]
..- Copy the Vert.x application package to the appropriate folder (quite simple using a fat jar).
..- In case necessary, copy the required config files.

```yaml
- name: Install Java 1.8 and some basic dependencies
  yum: name=\{\{item\}\} state=present
  with_items:
   - java-1.8.0-openjdk
- name: Ensure app dir exists
  file: path=/usr/share/vertx_app/ recurse=yes state=directory mode=0744
- name: Copy the Vert.x application jar package
  copy: src=\{\{ app_jar \}\} dest=/usr/share/vertx_app/app-fatjar.jar mode=0755
- name: Ensure config dir exists
  file: path=/etc/vertx_app/ recurse=yes state=directory mode=0744
- name: Copy the application config file if needed
  copy: src=\{\{ app_config \}\} dest=/etc/vertx_app/config.json mode=0755
  when: app_config is defined
```

2. Make sure to stop any previous running applications.
...We don't want duplicates of the same process running in the same machine.
[NOTE Hint | Be aware of the existence of the start/stop/list commands]

```yaml
- name: List running Vert.x applications
  command: java -jar /usr/share/vertx_app/app-fatjar.jar list
  register: running_app_list
- name: Stop app if it is already running (check if multiple instances)
  command: java -jar /usr/share/vertx_app/app-fatjar.jar stop \{\{ item | regex_replace('^(?P<V_id>.[8]-.[4]-.[4].[4].[12])\t.*', '\\g<V_id>') \}\}
  with_items: "\{\{ running_app_list.stdout_lines \}\}"
  when: item | regex_replace('.*\t(.*)$', '\\1') | match('.*/app-fatjar.jar$')
```

3. Run the application as a service in the hosting machine.
...Make sure to ignore the hang up signal with the help of `nohup` command. Otherwise, Ansible will be stuck at this step.

```yaml
- name: Run Vert.x application as a service, ignore the SIGHUP signal
  shell: nohup java \{\{ vertx_opts \}\} -jar /usr/share/vertx_app/app-fatjar.jar start \{\{ launch_params \}\}
  register: svc_run_out
- name: Print run output
  debug: var=svc_run_out.stdout_lines
```

4. Lastly confirm your application is running.

```yaml
- name: List again running Vert.x applications
  command: java -jar /usr/share/vertx_app/app-fatjar.jar list
```

## Sample sources and demo
The sample configurations presented before have been adapted to the Vert.x microservices [workshop](http://vertx-lab.dynamis-technologies.com/) to exemplify a real-world scenario. This set up is available in a [repository](https://github.com/ricardohmon/vertx-ansible) and contains, in addition, a pre-configured Jenkins-based demo that fetches the current version of a repository, builds it, packages a fat jar, and deploys it to VMs instances that host the microservices. The demo scenario requires Vagrant and Virtualbox to be launched.

### Launch instructions
* Clone or download this repository, and launch the demo using `vagrant up`
```
git clone https://github.com/ricardohmon/vertx-ansible.git
cd demo
vagrant up
```
This command will launch a virtual machine hosting Jenkins, condigure it with the require plugins, and also launch five additional VMs that will host the microservices after being deployed by Jenkins.

* Create a Jenkins freestyle build job using the DSL job script (seed job) found in `deployment-jobs/microservices_workshop_dsl.groovy` and build it.
[NOTE Tool configuration assumption | The DSL Job assumes the following tools (with names) have been configured in Jenkins: Java 8(`JDK8`), Maven (`M3.3.9`), Ansible (`Ansible2.0`)]
* The previous job will create a new job named `vertx-microservices-workshop-job`, which is charge of pull recent changes of the project, building it, and deploying it.

### Demo


