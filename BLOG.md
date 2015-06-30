# Blog

This page explains how to write a blog post.

## The vert.x blog

The vert.x web site has a blog section. Feel free to contribute to the blog by
writing posts.

## Writing a post

First, fork the https://github.com/vert-x3/vertx-web-site project in order to create a pull request with your content.

**IMPORTANT**: The blog is only available in the `web-site-3.0.0` branch.

Once forked, create a new branch from the `web-site-3.0.0` branch. Create a markdown document in `src/site/blog/posts`. The file must use the `.md` extension.

The post must starts with some metadata contained in a _header_ part:

```
---
title: A Catchy Title
template: post.html
date: 2015-06-26
author: cescoffier
---
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

Once your post is written create a pull request and we will publish your post.

## Drafts

You can add a special metadata to hide the post from the web site:

```
draft: true
```

Drafts are not processed, so won't be generated at all.

## RSS Feed

The blog generates an Atom feed available on `http://vertx.io/feed.xml`.
