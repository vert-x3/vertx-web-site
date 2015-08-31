# Blog

This page explains how to write a blog post.

## The vert.x blog

The vert.x web site has a blog section. Feel free to contribute to the blog by
writing posts.

## Writing a post

First, fork the https://github.com/vert-x3/vertx-web-site project in order to create a pull request with your content.

Once forked, create a new branch from the `master` branch. Create a markdown document in `src/site/blog/posts`. The file must use the `.md` extension.

The post must starts with some metadata contained in a _header_ part:

```
---
title: A Catchy Title
template: post.html
date: 2015-06-26
author: cescoffier
---

An introduction paragraph that will be use as _except_ in the RSS feed.

## Hello
...
```

Each line contained between the `---` lines are metadata. Are **required**:

* **title**: the post title
* **template**: must be `post.html`
* **date**: the publication date. The date must be provided using the `YYYY-MM-DD` format
* **author**: the Github account of the author, such as `cescoffier` or `vietj`

After the second `---`, you can start the post. To avoid messing up the style,
the first header (your title) should use `##`. Sub-section would use `###`.
The post are written in markdown, so code snippets are delimited using ` ``` `.

### Assets

If your post have asset, please add them into `src/site/assets/blog/a_directory_identifying_your_post`. Please keep assets size small. Assets are references using an absolute URL such as: `/assets/blog/...`.

### Style

1. Make sure your post does not contain hard wraps.
2. Ensure the code is using the right markdown syntax
3. Avoid tables

### Gist

If you have long code snippet, please use a _gist_ (http://gist.github.com). It will let reader to copy directly the code from gist, and also provide improvements.

Once your gist is created and ready, copy the _embed url_ in the post (at the right location). The embed url is a `script` inserting the Gist content.

### Admonitions

There is a built-in (home made) admonitions support for the blog posts. Are supported:

* NOTE
* INFO
* WARNING
* IMPORTANT

To create an admonition use the following syntax: `[NOTE title | content]` such as:

```
[NOTE this is my title | this is the content of the note, it can be pretty long, and contain **important** messages. In can be very very long.... Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.]

[WARNING Warning Warning | You need to
be careful about **this** (yes it can be multi-line)]

[INFO Info | Did you check the [news](http://lemonde.fr)?]

[IMPORTANT Something very important | don't forget to subscription to the google group.]
```

Title can be skipped using `[NOTE_content]`:

```
[IMPORTANT Wow, this is an untitled important message.]
```

### Making a PR

Once your post is written create a pull request and we will publish your post. The pull request should only contain the file related to your post. Before sending the pull request, add the following header:

```
draft: true
```

It lets us review the post and decide when it goes public.

### Publication

Once submitted your post is going to be published pretty soon. However, we won't publish more than two posts in a week, so it may be postponed a bit.

## Drafts

You can add a special metadata to hide the post from the web site:

```
draft: true
```

Drafts are not processed, so won't be generated at all.

## RSS Feed

The blog generates an Atom feed available on `http://vertx.io/feed.xml`. Don't forget to subscribe.
