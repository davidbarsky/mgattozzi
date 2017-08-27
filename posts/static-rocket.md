# Using Rocket to Generate a Static Site

Published August 27th, 2017

At RustConf this year I got to meet Sergio, the creator of `Rocket`, and watch
his presentation on it. I would recommend watching it when it comes out as it
debunks the whole "magic/unstable" aspect that seems to revolve around `Rocket`.
One of the things that stood out that I had missed was the ability to rank
routes for matching paths. I had been wanting to revamp my site which was using
React to be more static in nature. I had used React mostly to become familiar
with it but maintainability wise it was just unfeasible for me and I wanted
something simpler.

The goal was to have a top level posts directory that would turn the file name
into the page URL and then have it render the markdown as HTML for the user.
This was tricky because if I didn't keep the existing URLs properly it would
break links to my site and that's just not a fun experience. Working within
these constraints though I managed to do it with `Tera` for template based
rendering and `comrak` a GitHub Flavored Markdown renderer (which is now what
crates.io uses for README files). This has ended up being more maintainable for
me and allows me to throw up posts for review that aren't actually linked to on
the site for instance. I'm hoping to extend this out more overtime to make the
site a little more automatic in nature but for now this is a good start.

Let's take a look at the code to see how I did this. Right now the directory of
the site is laid out like this:

```bash
.
├── Cargo.lock
├── Cargo.toml
├── highlight.js
├── keybase.txt
├── LICENSE-APACHE
├── LICENSE-MIT
├── migrations
├── posts
├── README.md
├── Rocket.toml
├── src
├── static
├── target
└── templates
```

The important directories are `static`, `posts`, and `templates`. `static`
contains all of the assets the site needs to run such as CSS files, images, etc.
`posts` contains the markdown of every post here on the site you're reading this
on and finally `templates` contains the `Tera` templates for how to layout the
site. We'll be looking at two specific routes for the site that `Rocket` uses to
determine how to render everything:

```rust
#[get("/static/<file..>", rank=1)]
fn static_files(file: PathBuf) -> Option<NamedFile>{
    NamedFile::open(Path::new("static").join(file)).ok()
}

#[get("/<posts..>", rank=2)]
fn posts(mut posts: PathBuf) -> Option<Template> {
    posts.set_extension("md");
    let path = Path::new("posts").join(&posts);
    let file = NamedFile::open(&path);

    match file {
        Ok(file) => {
            let mut buffer = String::new();
            let mut reader = BufReader::new(file);
            match reader.read_to_string(&mut buffer) {
                Ok(_) => {
                    let post = Post::new(markdown_to_html(&buffer, &ComrakOptions::default()));
                    Some(Template::render("post", post))
                },
                Err(_) => None
            }
        },
        Err(_) => {
            posts.set_extension("");
            let nav = posts.to_str().unwrap().clone();
            match nav {
                "about"    => Some(Template::render("about",    Nav::new(1))),
                "archive"  => Some(Template::render("archive",  Nav::new(2))),
                "contact"  => Some(Template::render("contact",  Nav::new(3))),
                "resume"   => Some(Template::render("resume",   Nav::new(4))),
                "counting" => Some(Template::render("counting", Nav::new(5))),
                _          => None,
            }
        },
    }
}
```

The first route is the static one. We give it a `rank=1` so that it's checked
against first. That's because `/static/<file..>` is a bit more specific than
`/<posts..>` which could include the `/static` in it's path name. `Rocket` doesn't
know they're separate directories but we need to have it try this one first. If
it matches the static path then it opens the file and returns it!

The meat and potatoes of this whole thing is this portion:

```rust
#[get("/<posts..>", rank=2)]
fn posts(mut posts: PathBuf) -> Option<Template> {
```

Here we've defined that if it can't match static assets use this route instead.
It returns a `Template` type if the route matches and will render the given
template that's passed in. I should note that `Template` rendering is part of
the `rocket_contrib` crate and to have it be active I had to activate the
feature like so in my `Cargo.toml`:

```toml
[dependencies.rocket_contrib]
version = "0.3"
default-features = false
features = ["tera_templates", "json"]
```

I should note that you can also use `Handlebar` templates if you prefer as well!
Alright so now we want `Rocket` to attempt to open the markdown file that
represents the post:

```rust
    posts.set_extension("md");
    let path = Path::new("posts").join(&posts);
    let file = NamedFile::open(&path);
```

First we add `md` as an extension to the file name, otherwise the path wouldn't
have it since the URL scheme for the site doesn't have people put the file name
extension on at the end. Next we create a `Path` to point to the actual markdown
file and we have `Rocket` attempt to open it. Now if it actually finds the file
then this bit of code occurs:

```rust
    match file {
        Ok(file) => {
            let mut buffer = String::new();
            let mut reader = BufReader::new(file);
            match reader.read_to_string(&mut buffer) {
                Ok(_) => {
                    let post = Post::new(markdown_to_html(&buffer, &ComrakOptions::default()));
                    Some(Template::render("post", post))
                },
                Err(_) => None
            }
        },
```

It creates a new `String` and a `BufReader` that opens the file. It reads the
whole file to the `String` buffer, renders the markdown using `comrak`'s
`markdown_to_html` function and creates a new `Post` which I'll get to soon.
This is then passed to `Tera`'s render function for the `post` template that's in
the `templates` directory. If it fails to render the post it returns a `None`
which corresponds to a `404` error. It's a neat little implementation that works
well for posts! What about if it couldn't find the file at all?

That's where this bit comes in:

```rust
        Err(_) => {
            posts.set_extension("");
            let nav = posts.to_str().unwrap().clone();
            match nav {
                "about"    => Some(Template::render("about",    Nav::new(1))),
                "archive"  => Some(Template::render("archive",  Nav::new(2))),
                "contact"  => Some(Template::render("contact",  Nav::new(3))),
                "resume"   => Some(Template::render("resume",   Nav::new(4))),
                "counting" => Some(Template::render("counting", Nav::new(5))),
                _          => None,
            }
        },
    }
}
```

First we clear off the `md` extension since it's not a markdown file and instead
try to render one of the other templates that are for the navbar elements like
`about` and `archive`. They're created using a `Nav` type I created. To
understand the `Nav` and `Post` type I mentioned earlier we should take a look
at the `base.tera` template that all the other templates inherit from:

```none
<html>
<head>
  // Truncated for brevity mostly metadata things about the site static assets
  // etc.
</head>
<header>
  <nav class="navbar navbar-default">
      // Part of the navbar truncated
          <ul class="nav navbar-nav">
            <li>
              <a href="/about">
              {% if url == 1 %}
                <div class="glyphicon glyphicon-user selected"></div>
                <div class="nav-bar-text selected">
              {% else %}
                <div class="glyphicon glyphicon-user"></div>
                <div class="nav-bar-text">
              {% endif %}
                  &nbsp;About
                </div>
              </a>
            </li>
            <li>
              <a href="/archive" active-class="active">
              {% if url == 2 %}
                <div class="glyphicon glyphicon-pencil selected"></div>
                <div class="nav-bar-text selected">
              {% else %}
                <div class="glyphicon glyphicon-pencil"></div>
                <div class="nav-bar-text">
              {% endif %}
                  &nbsp;Archive
                </div>
              </a>
            </li>
            <li>
              <a href="/contact" active-class="active">
              {% if url == 3 %}
                <div class="glyphicon glyphicon-envelope selected"></div>
                <div class="nav-bar-text selected">
              {% else %}
                <div class="glyphicon glyphicon-envelope"></div>
                <div class="nav-bar-text">
              {% endif %}
                      &nbsp;Contact
                </div>
              </a>
            </li>
            <li>
              <a href="/resume" active-class="active">
              {% if url == 4 %}
                <div class="glyphicon glyphicon-list selected"></div>
                <div class="nav-bar-text selected">
              {% else %}
                <div class="glyphicon glyphicon-list"></div>
                <div class="nav-bar-text">
              {% endif %}
                  &nbsp;Resume
                </div>
              </a>
            </li>
            <li>
              <a href="https://github.com/mgattozzi">
                <div class="glyphicon glyphicon-console"></div>
                <div class="nav-bar-text">
                  &nbsp;Github
                </div>
              </a>
            </li>
          </ul>
      // End tags truncated
</header>
<body>
  <div class="content">
    {% block content %}
    {% endblock content %}
  </div>
</body>
</html>
```

If you look you'll see that `Tera` can do conditional based formatting. In this
case `url` is a value used to determine which part of the navbar should be
colored black depending on the page. So if you're on the `archive` page the
Archive text at the top should be black. Down at the bottom you'll also see the
`block content` section. Depending on the template we can place items that will
be rendered in here. For instance this is the `post.terra` template:

```none
{% extends "base" %}
{% block content %}
  {{ data }}
{% endblock content %}
```

It extends the `base` template and will place anything passed in with a data
field inside the part with `{{ data }}` in the `block content` section of the
`base` template! With that let's take a look at the `Nav` and `Post` types I
mentioned earlier:

```rust
#[derive(Deserialize, Serialize)]
pub struct Nav {
    url: i32,
}

impl Nav {
    pub fn new(url: i32) -> Self {
        Self { url }
    }
}

#[derive(Deserialize, Serialize)]
pub struct Post {
    data: String,
    url: i32,
}

impl Post {
    pub fn new(data: String) -> Self {
        Self { data, url: -1 }
    }
}
```

`Nav` only has a `url` field but `Post` has a `url` and a `data` field. Why is
that? Well the templates for anything but the post only has the conditional to
determine if the top should be colored at all. Thus it needs a number in a field
labeled `url` in order for it to render. It doesn't have any other data that
needs to inserted at all. However, with posts we want to render the markdown so
we need the `data` field for the `post` template. We also need the `url` value
though since it's in the `base` template, otherwise all the posts would fail to
render at all.

## Conclusion
That's all there is to it. I'm hoping to extend this in many more ways, make it
a bit easier to handle/less clunky with how I handle things but so far this is
a nice beginning and I'm hoping to leverage the template's power a lot better
than I already am as well as adding some other neat features to the site to make
it nice to work with.
