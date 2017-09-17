# RustConf 2017

Wow. RustConf was just an incredible experience. I'm currently flying back to
Boston collecting all of my thoughts about it all. RustConf was the first
conference I have ever spoken at and it was an uplifting experience filled with
wonderful people, great conversations in between talks and after the conference.
I wish it would have been possible for a multi day conference just to have more
time to pick people's brains and listen more to what everyone was doing or
learning something new. Alas, there's only so much time in a weekend to do this,
but I think it was time well spent.

I want to give a huge shout out to Leah Silber and the incredible team at Tilde,
as well as many others who spent the time organizing the conference and putting
it all together. At no point did I feel like I didn't know where to be,
everything just worked, and it was an enjoyable experience. Of course, all the
long hours of planning, behind the scenes work, and other things that make a
conference a conference aren't all that visible. However, the fruits of all that
labor made a conference that went smoothly and was a joy to participate in and
experience.

I'll give a recap of my experience from beginning to end and then cover a few
things about my talk as a retrospective, mostly what I might change, what I had
to cut, as well as where you can get the slides if you're interested. The talk
will go up eventually so I do hope you take the time to watch it as well as the
other speakers at RustConf who did a wonderful job!

## Friday

I woke up at 4am EST to go take a real early morning flight. I was operating on
about 4 hours of sleep at this point having had to fix my slides and clean it up
some more. With a lot of coffee in my system it was off to Logan. It ended up
being a relaxing flight (finally got to see Guardians of the Galaxy Vol. 2) and
I landed an hour early at PDX. I finally made it to the Nines signed in and
enjoyed some talk with quite a few Rustaceans for most of the day there and
grabbing lunch with some of them. I got to catch up with Steve Klabnik on what
to do next for the revamped `rustdoc` (which you should
[come help](https://github.com/steveklabnik/rustdoc) with!) as well as finally
meeting people like [hjr3](https://twitter.com/hjr3) who I have only interacted
with online!

Sean Griffin and I were both on EST time so we were starving before the
speakers dinner later that night so he and I got to chat and grabbed some food
before that. It was quite eye opening and I got to learn a bit more about Diesel
and how it works out. It's not as magical as it seems some times, but it's
really cool. Definitely watch his talk once it goes up! You'll learn a lot,
trust me!

After that I decompressed in my room for a bit before the dinner and caught up
with some github issues and continued to attempt to get my library
[curryrs](https://github.com/mgattozzi/curryrs) working again. Mainly allowing
you to use Haskell in Rust by turning on the runtime. I talked with Alex
Chrichton(SP?) at the conference about it later and I think he helped solve my
problem! It'll be nice to work on this again.

I went to the speakers dinner shortly after that and it was a really great
experience being able to meet the other speakers and have Steve read us
[@horse_js]() tweets. I still want a podcast of him just reading tweets.

Close to 18 hours after waking up I called it a day after checking over my
material for the day of RustConf and got some sleep.

## Saturday

This was the main event! After a light breakfast and some coffee I headed to the
conference hall and checked with the AV people that my laptop worked with the
equipment. Surprisingly I was able to get `xrandr` to work properly on the third
magical incantation of options and I didn't need to sacrifice anything in order
to appease it. Feeling sure I was able to show my slides after lunch I started
hanging out and chatting with people. I got to meet more of the Habitat.sh
people and catch up with [Fletcher Nichol]() with what's been going on since
RustFest earlier this year, as well as learn of some exciting things coming up.
Definitely looking forward to it! I also spent some time talking to the Facebook
people there as well now that they're writing a [Mercurial server in Rust]()
and I'm excited to see a large company using Rust in production.

It was just talking and meeting new people at that point and it was a great
lively atmosphere to be a part of early in the morning.

Then it started. Finally the moment we were waiting for, RustConf 2017.

### Talks

Carol Nichols, Niko Matsakis, and Aaron Turon: Opening Key Note

RustConf started off with members of the core team giving a perspective of where
Rust is, where we're trying to go, and have we accomplished 2017 Goals. Overall
an informative talk. That and Carol [stole some of my talk](), which is totally
fine because [I think it's important](), but also announced some new features for
`crates.io` mainly your README being rendered on the site! A much wanted feature
that meant I had to also [change my slides]() before going up there later. The
short version of the talk is, we're not there yet, but we're getting there and
the momentum is there. Do give it a watch later whenever it goes up. If you
don't follow the RFC repo at all and absorb Rust news 24/7 it's a great overview
of where everything is.

Andrew Brinker: A Tale of Teaching Rust

Sergio Benitez: Building Rocket

My talk was after lunch and I'll cover it close to the end of this post.

Naomi Testard: Menhir and Friends: the State of the Art of Parsing in Rust

Sean Griffin: Type System Tips of the Real World

Steve Jenson: Improving Rust Performance Through Profiling and Benchmarking

Isis Lovecruft and Henry DeValence: Fast, Safe, Pure-Rust Elliptic Curve Cryptography

Joe Duffy: Closing Keynote: Safe Systems Software and the Future of Computing

### Post-Conference

These talks were all great and I learned a lot from them all and I recommend
watching them all whenever they go up. I'm sure you'll learn a lot from them as
well! After that there were some unofficial meetups going on afterwards.
I got to meet [QuietMisdrevious]() in person as well as [Josh Tripplet]() and
had a great time getting some Mexican food with them, Sean Griffin, Steve
Klabnik and Ashley Williams and later meeting up with a ton of other Rustaceans
right down the block from where we got dinner. It was excellent just talking
about Rust, whether nachos were a sandwich (I vehemently stand by the fact that
they are not), and meeting some people I've wanted to meet and say hi to like
[Stepjang]() and [withoutboats](). It was a great time and one of my favorite
parts of the whole experience as I find talking with others really helps
solidify the sense of community that is hard to see because most of our
interactions are online with people we haven't met. I honestly just wish we
could fly every Rustacean out to a giant room and just let us all talk face to
face and just learn and discuss with each other. Not exactly possible but
I think it would be great fo give faces and voices to our online personas.

Unfortunately by 10pm I was exhausted as it was 1am for me (damn you jetlag) and
I had to cut talking with others short so I could get some sleep. Now here I am
the next day flying a couple miles up over the US writing about it all.

### My Talk: Shipping A Solid Rust Crate

My talk was a bit more of a meta talk. When asked to describe it prior to
RustConf I said, "It's all the things important for your codebase that isn't
the code itself." Unfortunately I only had 30 minutes so I couldn't stick
everything I wanted to talk about into the talk. I broke the talk down into
three parts:

- Tools available for a CI system and you should set one up
- Documents you need to have in your codebase (README, Documentation,
  CONTRIBUTING, etc.)
- How to announce your crate and where you can

I think this covered the general flow of shipping a new crate, first writing
tests and making sure the code actually works, second providing the information
on your crate that would make people consider using it, and three actually
telling people about it and some small tips regarding it. The talk overall was
well received (bar one thing which I'll cover below) and it was really nice to
hear that kind of feedback, especially considering it was my first conference
talk ever. It was kind of surreal, I went up, tarted talking, heard my voice and
it kept going for 30 minutes, and then I was done. It almost felt out of body
but apparently that didn't show so that's great! What would I have changed about
the talk though? After giving it and talking with others I have a few thoughts.

First was that I directly mentioned memo guy and that whole incident in my
slides. Some people brought it up with Manish and Steve Klabnik also mentioned
it to me later (which I'm actually grateful for) since it did upset some people
since it kind of continues to spread that message (which I did oppose during my
section of the Code of Conduct). If you were at RustConf and saw that and were
I apologize. It was a mistake I didn't even consider as a new speaker and going
forward in other talks not one I will repeat again.

Secondly, I would probably revamp the first section, while good for the flow
I felt I spent a bit more time there then I should have and would rather have
talked about things like including a CHANGELOG or being more nuanced on some of
the more hot button topics like having a Code of Conduct. I really feel like
some of the things I touched on could be full blown talks in their own right.

That being said I actually cut and rewrote some of the slides a lot. I had at
one point close to 70 slides thinking I wouldn't have enough content, but after
running it by coworkers I realized I had too much content. What did I actually
cut though?

- Extra slides about the importance of a Code of Conduct in your codebase
- Anime reaction face slides (my presentation is littered with them)
- More in depth talk about Cargo.toml (compressed to two slides)
- Compression of the CI slides into one less detailed one
- Example websites to for the announcement section
- 

What I wouldn't change

Where you can find it

### Conclusion

RustConf was a blast. It was an incredible opportunity and I would love to go
again next year if I have the chance. I really wish everyone could have been
there live who wanted to go merely because I just wanted to meet more
Rustaceans. You're an incredible bunch of people who I have the joy of
interacting with on a daily basis and I wish I had the opportunity of
interacting with you all more. Do try to go to a Rust conference if you can,
it's an experience you won't regret I think. Once again thank you to the
conference organizers, the awesome speakers, and Rust community for making
RustConf 2017 a treat and joy to experience.
