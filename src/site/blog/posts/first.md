---
title: A Catchy Title
template: post.html
date: 2015-06-26
draft: true
---
## Hello you

this is the first blog post ;-)

```
public void main(String[] args) {
  System.out.println("Hello");
}
```

## A Sub-section

this is a sub-section ... with great content

## Features:

* _this text is in italic_
* this text is **important**
* words_with_underscore_are_not_in_italic
* this is an autolink: http://vertx.io
* ~~Mistaken text.~~

### Code

Basic code:

```
function test() {
  console.log("notice the blank line before this function?");
}
```

Some ruby code:

```ruby
  require 'redcarpet'
  markdown = Redcarpet.new("Hello World!")
  puts markdown.to_html
```

### Tables

| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |

with alignment:

| Left-Aligned  | Center Aligned  | Right Aligned |
| :------------ |:---------------:| -----:|
| col 3 is      | some wordy text | $1600 |
| col 2 is      | centered        |   $12 |
| zebra stripes | are neat        |    $1 |
