# What's the deal with Generators?

Like many things in the Rust Community [memes]("STEEEEVE TWEET") and new
features come and go really quickly or just never get stabilized (`box` syntax
when?).

<img class="center-block img-responsive" src="/static/images/"
     alt="Man who has a Rust Community head with girlfriend with nuclear
          steveklabnik meme for her head looks at another woman with a
          head that says Generators">

You might have heard about `Generators` and thought what's this even for? Or you
might have been part of the group, like me, who's been waiting for this for some
time. We'll explore just what they are, how they currently work, and some things
that could be improved with them. Note this is all experimental stuff. We may
not even have them in the future since only an [eRFC]() was passed! If you're from
far in the future you can follow along with the code by using the Nightly
compiler from 2017-08-29.


## Generators, Coroutines, and Async/Await oh my!

Wait didn't you say this was about generators? Yes I did, but it's worth noting
these topics are all interconnected in some way or another and were all added as
a result of the [eRFC]() that passed. Bear with me here. Let's go through each
one and learn a bit about what it is they even do:

### Coroutines

Coroutines? Doesn't this sound like Goroutines in Go? That's because they are!

<img class="center-block img-responsive" src="/static/images/"
     alt="We're Go now. This is fact">

If you're not familiar with Go/Coroutines they allow what's known as M:N
threading. For every system thread M (Rust makes them with std::thread::spawn),
you can have N lightweight threads. These N type threads share time on the
thread by calculating things and when they yield a value or control they
let another N type thread take over. Rust historically had this available in the
`libgreen` library that was removed from the Standard Library before 1.0.

Let's take a look at a small example.

```rust
#![feature(generators, generator_trait)]
fn main() {
  let mut coroutine_1 = || {
    println!("1");
    yield;
    println!("3");
    yield;
    println!("5");
  };

  let mut coroutine_2 = || {
    println!("2");
    yield;
    println!("4");
  }

  coroutine_1.resume();
  coroutine_2.resume();
  coroutine_1.resume();
  coroutine_2.resume();
  coroutine_1.resume();
}

```

This prints out:

```bash
1
2
3
4
5
```

Each time we call `resume` on one of the coroutines we continue off where we
left off in the execution of that function. When we call `yield` we exit the
function and return control flow to the main thread and save where we left off
there. In this way we can orchestrate multiple functions together in such a way
they would be faster. In a way they're asynchronous, but not exactly.
It's a simple example and doesn't show the full power that coroutines have but
it allows you to have multiple tasks operate on the same thread. If you set it
up right it can allow certain tasks to happen faster. It's really nice if you
have a limited number of CPUs and can't afford to spawn a lot of system threads.

### Async/Await

### Generators
Alright so what's a `Generator`? You generate values with `Generator`s! Seems
kind of self explanatory but not exactly. Let's consider an example where it
would be useful. Let's say you wanted to do something with a list of all prime
numbers. Traditionally you would either calculate the whole list (impossible to
do for all we know, we don't know how many primes there are), or calculate
a small subset of the list and return that. This is time consuming and what if
later we want to calculate values after that list's ending number? Would we have
to calculate all the primes before it? This gets computationally expensive if we
have to keep calling the function to find these values from the beginning over
and over again. It would be nice if we could save our progress in calculating
values and return them when we find the next one. Sounds like coroutines a bit?
That's because they kind of are! We'll create a prime finding generator so we
can just keep asking it for the next value as we need it. Granted while the
example below will continue to find more numbers there's a limit to how big
a number a computer can hold. One of those times where the physical limits
what's theoretically possible.

We'll use the Sieve of Eratosthenes to calculate primes. It will maintain the
state of the calculation inside of it making it easier to get the next prime,
rather than the part of the program calling the function. It makes it easier to
encapsulate that within the `Generator` rather than as part of the program.
Here's the code that will just print out values until either the computer runs
out of memory or we get a number bigger than what a `u128` can hold:

```rust
```

## Rustaceans first Generator

Now that our brain dump of just what the heck all this is is over we can start
writing Generators!

<img class="center-block img-responsive" src="/static/images/"
     alt="itshappening.jpg">

Let's take a look at this:

```rust
fn main() {
    let mut gen = || {
      println!("1");
      yield;
      println!("3");
      yield;
      println!("5");
    };
    gen.resume();
    println!("2");
    gen.resume();
    println!("4");
    gen.resume();
}
```

If you run this you should see:

```bash
1
2
3
4
5
```

Awwwwwww yeah `Generators`! What's going on here? Every time we call `resume` it
starts the function and goes until it hits a `yield` keyword. At that point it
stops execution and returns a value from the generator. In this case `()` since
`yield` has no value next to it. Next time we call `resume` it won't start at
the beginning of the function but the next line after we called `yield`! If we
called `resume` after those three times our generator wouldn't return anything
but `()` here since it's at the end of the function. Neat huh? This is the basis
for writing Generators/Coroutines in Rust. Calculate some value and yield it or
in this case change the execution flow of the program. This example is more like
a coroutine than a generator so let's actually write one that yields some
values!

```rust
#![feature(generators, generator_trait, i128_type)]

use std::ops::{ Generator, GeneratorState };

fn main() {
    let mut sieve = || {
        // Since everything is divisible by one and nothing by
        // zero, just put two here.
        let mut primes = vec![2];
        let mut current_num: u128 = 3;
        // These are the first few primes so yield their values.
        yield 0;
        yield 1;
        yield 2;
        let mut all = false;
        loop {
            all = false;
            for i in primes.iter() {
                if current_num % i == 0 {
                    all = false;
                    break;
                } else {
                    all = true;
                }
            }

            if all {
                primes.push(current_num);
                yield current_num;
                if let Some(x) = current_num.checked_add(1) {
                    current_num = x;
                } else {
                    break;
                }
            } else {
                if let Some(x) = current_num.checked_add(1) {
                    current_num = x;
                } else {
                    break;
                }
            }
        }
    };

    loop {
        match sieve.resume() {
            GeneratorState::Yielded(x) => println!("{}", x),
            GeneratorState::Complete(_) => break,
        }
    }
}
```

I ran this about 10 hours as a release build and it found about 1.8 million
primes and used up roughly 128MB of space and was still going strong before
I stopped it. Some interesting things to take note of here:

1. All of the state was encapsulated in the function. There was no need to have
   a vector store numbers, pass it to a function and have it used in order to do
   this algorithm. Instead only the function has access to stored values and can
   handle everything on it's own and instead only returns single values each
   time it's called. It's acting like a stream of values that are being
   generated at each call.
2. We used `yield` to return values unlike coroutines where we yielded nothing
   but exited the control flow from the function. Actually, this is a bit of
   a lie, it actually returned the value `()`. Think of it as something that
   doesn't do anything really. Pretty much any expression in Rust that doesn't
   return a value or create one, implicitly returns `()`. This is why coroutines
   and `Generators` are fairly similar. They both change the control flow but
   use it for different reasons and return different values. They're pretty much
   the same thing but we use the terms generator and coroutine to distinguish
   how they're used.

You'll see this later but we could implement a `Generator` as a type and have a
type that would yield primes as a stream, but it would not look as clean
syntactically. I hope this can be changed honestly as it's kind of annoying to
only be able to use `yield` in anonymous functions.

## Generators as Types


## Now you're iterating with Generators!

## Box me up before you go go!

Now you might be thinking, what if I could implement the `Generator` using
`yield` and `impl Generator`. I'm just going to tell you that as it currently
stands it won't work the way you expect it too.

```rust
fn gen_test() -> impl Generator {
    || {
      yield 1;
      yield 2;
    }
}
```

That won't compile. Okay so why not `Box` it up?

```rust
fn gen_test() -> Box<impl Generator> {
    Box::new(|| {
      yield 1;
      yield 2;
    })
}
```

This will compile. Cool you think now what if I just call it? Let's write it out
and test it:

```
fn main() {

    let x = gen_test();
    let y = Box::new(|| {
        yield 1;
        yield 2;
    });

    println!("{:?}", y.resume());
    println!("{:?}", x.resume());

}

fn gen_test() -> Box<impl Generator> {
    Box::new(|| {
      yield 1;
      yield 2;
    })
}
```

Alright now a quick `cargo check` aaaaaaaaaaaaaaaaaaaaaaaaaaaand:

```bash
Compiling generator v0.1.0 (file:///home/michael/Code/generator)
error[E0277]: the trait bound `<impl std::ops::Generator as std::ops::Generator>::Yield: std::fmt::Debug` is not satisfied
  --> src/main.rs:14:20
   |
14 |   println!("{:?}", x.resume());
   |                    ^^^^^^^^^^ `<impl std::ops::Generator as std::ops::Generator>::Yield` cannot be formatted using `:?`; if it is defined in your crate, add `#[derive(Debug)]` or manually implement it
   |
   = help: the trait `std::fmt::Debug` is not implemented for `<impl std::ops::Generator as std::ops::Generator>::Yield`
   = note: required because of the requirements on the impl of `std::fmt::Debug` for `std::ops::GeneratorState<<impl std::ops::Generator as std::ops::Generator>::Yield, <impl std::ops::Generator as std::ops::Generator>::Return>`
   = note: required by `std::fmt::Debug::fmt`

error[E0277]: the trait bound `<impl std::ops::Generator as std::ops::Generator>::Return: std::fmt::Debug` is not satisfied
  --> src/main.rs:14:20
   |
14 |   println!("{:?}", x.resume());
   |                    ^^^^^^^^^^ `<impl std::ops::Generator as std::ops::Generator>::Return` cannot be formatted using `:?`; if it is defined in your crate, add `#[derive(Debug)]` or manually implement it
   |
   = help: the trait `std::fmt::Debug` is not implemented for `<impl std::ops::Generator as std::ops::Generator>::Return`
   = note: required because of the requirements on the impl of `std::fmt::Debug` for `std::ops::GeneratorState<<impl std::ops::Generator as std::ops::Generator>::Yield, <impl std::ops::Generator as std::ops::Generator>::Return>`
   = note: required by `std::fmt::Debug::fmt`

error: aborting due to 2 previous errors

error: Could not compile `generator`.

To learn more, run the command again with --verbose.
```

Oh. Oh god no. This is one of the "Bad Rust Errors" where it tells you what's
wrong but not really. I haven't seen one of these in ages (because the compiler
team has done such a great job of making really good error messages <3).

You might notice `y` compiled just fine so why can't `x` even if they both
return the same thing? Well the compiler only knows that `gen_test()` returns
something that implements `Generator` but it doesn't know the types associated
with the `Yield` and `Return` field. As it stands today in Rust there really
isn't a way to get this to compile unless `impl Trait` is expanded out more in
the future and so the compiler doesn't know what to do with the type if you try
to use it. Something like `let z = x.resume()` compiles fine.

There's not much we can do about this now, so just don't try what I did and
spend 30 to 40 minutes digging through RFCs trying to find out if this is
possible or if you're just going insane trying to jam a star shaped block into a
triangle shaped hole. Your sanity will thank me later.

## Design suggestions

Now that we've seen what is currently possible with generators what could be
changed to make them better?

1. Allow writing Generator implementations for a type by hand but allow the use
   of yield syntax. It seems weird I can't use yield except inside an anonymous
   function. I would like to associate it with a zero sized type to generate
   values but currently that's not possible, and so the type ends up having to
   carry around state with it which seems weird. It's either that or an
   anonymous function but I don't like using those and I might want to use
   a generator multiple times in different places. Writing it that many times
   seems error prone and unergonomic.
2. If we don't go the way of associating it with types then a function that can
   return an `impl Generator` that works. This seems to be an even harder thing
   to do since this would require more RFCs and changing how `impl Trait` works.
   Cool but probably nowhere in scope for the compiler/lang team right now
   (unless I missed an RFC or two).
3. A third state for the `GeneratorState` that means the generator can no longer
   be called. This would make it easier to make in `Iterator` implementation for
   the generator that won't require extra state to check if it's finished.
   Something like this as an enum would make sense:

   ```rust
   pub enum GeneratorState<T,U> {
       Yielded(T),
       Complete(U),
       Exhausted
   }
   ```

   This makes it so that no matter what happens if I call resume no value comes
   back. I'm sure the compiler could insert something like:

   ```rust
   loop {
     yield GeneratorState::Exhausted;
   }
   ```

   At the end of the generator to denote that it's over. I can see some places
   where this would work but this is just an idea and one I would like to see
   implemented if possible. I'm betting there are also reasons against this that
   I might not know about because of LLVM or compiler internals so feel free to
   let me know if this is actually a terrible terrible idea!
4. Have an `impl Iterator` for `Generator` for easy use. This is kind of hard
   though if there are two possible return types and it's an anonymous function
   and not a type like we defined by hand earlier. This might work with a
   `Generator` that only returns one type and isn't an anonymous function. I'm
   not a fan of the two types being returned in general but I'm guessing there's
   some kind of reason as to why. Personally I'd be satisfied with just the one
   type.

Let me know what you think or if there are actually really good reasons not to
do it the way I mentioned!

## return GeneratorState::Completed(Conclusion::new());

Whew that was a lot, but it's over now! I hope this has given you a solid
introduction to playing around with the hottest new toy on the block in Rust.
If you didn't know about Coroutines/Generators/Async Await I hope you learned
a little bit about that as well so you can start leveraging it in your own
projects for fun as well as to provide feedback for the lang team. Remember this
is all experimental stuff to see where we should go from here and if it's viable
for Rust. Try it out and let problems you run into be known. This is the first
`eRFC` and the point of it is to play around and learn and provide feedback.
It'd be nice to see what others think or have done that I might have missed
since starting to play with this feature.
