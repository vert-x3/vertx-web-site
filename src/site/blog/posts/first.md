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

### Admonitions

A note with `[NOTE_title_|_content]` (replace _ by space):

[NOTE this is my title | this is the content of the note, it can be pretty long, and contain **important** messages. In can be very very long.... Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.]

[WARNING Warning Warning | You need to 
be careful about **this** (yes it can be multi-line)]

[INFO Info | Did you check the [news](http://lemonde.fr)?]

[IMPORTANT Something very important | don't forget to subscription to the google group.]


Title can be skipped using `[NOTE_content]` (replace _ by space):

[IMPORTANT Wow, this is an untitled important message.]

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

[NOTE this is the second content of the note, it can be pretty long, and contain **important** messages. In can be very very long.... la la la bouh boug Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.]
