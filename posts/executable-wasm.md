# Making wasm Executable On Linux
Published March th, 2018

It started with a tweet:

<a href="https://twitter.com/mgattozzi/status/974765243988574209">
  <img class="center-block img-responsive"
      src="/static/images/wasm-executable-tweet1.png"
      alt="What if I made a Linux kernel module to execute wasm directly? 🤔">
</a>

Which was quickly followed up by discussion and a possible solution:

<a href="https://twitter.com/badboy_/status/974767682850574337">
  <img class="center-block img-responsive"
      src="/static/images/wasm-executable-tweet2.png"
      alt="I mean you wouldn’t even need a kernel module to make `./your-app.wasm`
      work: https://blog.cloudflare.com/using-go-as-a-scripting-language-in-linux/
      … (referring to your original tweet)">
</a>

Which led to this tweet: # not sure about 

<a href="https://twitter.com/mgattozzi/status/974810805043679233">
  <img class="center-block img-responsive"
      src="/static/images/wasm-executable-tweet3.png"
      alt="Look I'm not saying I just made wasm files executable on linux, but I just made wasm files executable on linux">
</a>

How did it end up like this? Good question! This post will:

- Examine how executable wasm on Linux was accomplished
- Detail how _you_ can make your own executable wasm
- Note the current, serious limitations of this solution.
- How these limitations could be solved.

## wasm background

You might've heard the buzz [around wasm](https://mgattozzi.com/rust-wasm), but if you haven't, Wasm is a portable binary format at allows code to run at native-level speeds on the Web. I think this is a big deal, which is why I've been working with the Rust wasm Working Group to explore and understand this space. Wasm is perfect for CPU-bound tasks
and has already led to some significant improvements in things like [source map parsing](https://hacks.mozilla.org/2018/01/oxidizing-source-maps-with-rust-and-webassembly/).

Now, I bet some of you are thinking, "If wasm designed for the web, then why are you trying to run it on yourcomputer?" Mainly: we finally have a cross platform and open binary format that's not
controlled by any company. The people at Sun Microsystemse were ahead of
their time with the JVM and Java Web Applets, but the technology is closely linked and influenced by private companies. It's something anyone can implement an interpreter for and run!

I worked on this project because _I could_, but to also get people excited about wasm's promise and
possibilities. It allows us to realize the dream of "Compile once and run anywhere"! For instance, incompabilities between libraries written in C and others in in Rust can be resolved by compiling which simplifies linking and loading things. Multi-language projects because to work with as there is less pain with FFI to deal with! No longer will we have to be constrained by something like the C ABI—instead, we can target wasm and define something better together!

<!-- Next, let's cover _exactly how to make wasm executable then we can move on to it's limitations and the futurewhere they can be removed. -->

## wasm executables

Here's all the code needed to do this:

```rust
extern crate wasmi;

use std::env::args;
use std::fs::File;
use wasmi::{ModuleInstance, NopExternals, RuntimeValue, ImportsBuilder, Module};

fn load_from_file(filename: &str) -> Module {
    use std::io::prelude::*;
    let mut file = File::open(filename).unwrap();
    let mut buf = Vec::new();
    file.read_to_end(&mut buf).unwrap();
    Module::from_buffer(buf).unwrap()
}

fn main() {
    let args: Vec<_> = args().collect();
    if args.len() != 2 {
        println!("Usage: {} <wasm file>", args[0]);
        return;
    }

    // Here we load module using dedicated for this purpose
    // `load_from_file` function (which works only with modules)
    let module = load_from_file(&args[1]);
    let main = ModuleInstance::new(&module, &ImportsBuilder::default())
        .expect("Failed to instantiate module")
        .run_start(&mut NopExternals)
        .expect("Failed to run start function in module");
    let res = main.invoke_export("main", &[RuntimeValue::I32(0), RuntimeValue::I32(0)], &mut NopExternals);
    match res {
        Ok(Some(RuntimeValue::I32(i))) => println!("Return value: {}", i),
        Ok(Some(RuntimeValue::I64(i))) => println!("Return value: {}", i),
        Ok(Some(RuntimeValue::F32(i))) => println!("Return value: {}", i),
        Ok(Some(RuntimeValue::F64(i))) => println!("Return value: {}", i),
        Err(e) => println!("Failed to execute wasm. Error was: {}", e),
        _ => println!("Uhhhh woops?"),
    }
}
```

(Like most code, it's built on the shoulders of giants and
uses [Parity Tech's wasm interpreter](https://github.com/paritytech/wasmi) in order to interpret
the byte code.)

This code works by calling the `main` function from a Rust executable after instantiating
the module `start` function with `run_start`. While this detail is hidden in most Rust code, this code is  expecting a value of `isize` for `argc` and a `*const *const u8` pointer for `argv`. Here, I didn't make any assumptions as to what they would be in the interpreter, so passing in two values of 0 will
satisfy the program. Therefore, we'd be able to execute the program and get a return value. For normal Rust programs that execute correctly without errors, our return value would be `0`. 

You can run this program on a wasm file and it would execute it just fine if it had a `main` function which in the case of my testing it did because I was using Rust's `wasm32-unknown-uknown` function. The end result is no fun. So how did I get that value of ten in the tweet above? For that we'll need to look at the code used in wasm-add:

```rust
#![feature(start)]

#[start]
fn main(_argc: isize, _argv: *const *const u8) -> isize {
    let x = 5 + 5;
    x
}
```

Normally Rust's `main` function looks like this:

```rust
fn main() {
  // Your code here
}
```

But we're using the `start` feature. While normally implied in Rust programs we can actually specify
what function we use to start a binary program! In this case we slap it on to `main` so we can make
it return a value. The compiled wasm will then add 5 and 5 then return the value none the wiser as
to what it ran on. Neat so we can return a number! Okay cool so we can run the interpreter on
a wasm file and return number values, what about execution? How do we make it go `./wasm-add.wasm`
and not `cargo run -- wasm-add.wasm`? The [Cloudflare blog
post](https://blog.cloudflare.com/using-go-as-a-scripting-language-in-linux/) describes this in more
detail but it uses feature known as `binfmt_misc`. This allows Linux to learn how to run other files
besides ELF files. Because wasm in it's compiled form can't use the `#!` syntax to let the shell
know how to execute it we need to use this method to teach Linux what to do when it encounters this
file type. The incantation for that is this:

```bash
$ sudo sh -c 'echo :webasm:E::wasm::/Path/to/the/interpreter:OC | tee /proc/sys/fs/binfmt_misc/register'
```

This says create a thing called `webasm` that will execute files with the `E`xtension `wasm` using
the program specified here, using the permission/owner info on the binary itself, not the
interpreter.

Alright so with a binary and an interpreter we can now simply do this:

```bash
$ ./wasm-add.wasm
Return value: 10
```

Okay so that's the fun cool part and if you were thinking all I can return is numbers? Then for now
yes and I'd like to discuss those limitations before you consider porting all your code to compile
to wasm to make it runnable.

## wasm limitations

If you right now created a program with `println!()` in Rust, compiled it to wasm, then ran it you
would only have the return value printed out. The only reason anything could be printed was the
interpreter could do something with a return value, not because it knew how to run print specified
inside the code. How could it? wasm has a [spec](https://webassembly.github.io/spec/) that lets it
work and interact with the web and to call things like `console.log`. However, the spec says nothing
about a computer!

How would you define that? Syscalls? Syscalls are different between Windows, Mac, and Linux. They
don't even necessarily work the same way. So we can't compile our wasm code with the assumption
we're on a specific host. We don't know whether the code itself is on the web or an interpreted
environment! If we don't know that and have no standard way to define input and output then
essentially our programs will just run and not be interesting! In order for computers to be
interesting and useful they can't be "pure" functions they need to interact with things.
Unfortunately as it stands today the wasm spec doesn't have a way for us to define dealing with
input and output outside of web browsers and JS.

Here's the other limitation of this interpreter. If I compiled C code it uses the same function
signature for `main` essentially so it'll be fine. What about if we got some other language to
compile and work on wasm? What if it called it's beginning function `execute`? That's not
the case right now based off what can compile to wasm, but you can see the problem here, we invoked
the executable saying it would have a function `main` if it doesn't it won't work. If the program
doesn't have a `start` function here it won't work and the interpreter would fail. We could modify
the code to handle that but we want to make assumptions about binaries not if it's a library. You
can't execute libraries on computers so how can we make that distinction if it's compiled to wasm?

The other limitation is we can only return one number! I've been trying to get it to work as
a casted pointer to a String or something this weekend but to no avail, but if you can let me know!

To sum all of this up though this means one thing, we can run wasm on our computers but it's
essentially useless. How can we fix it though?

## wasm standards expansion

We need to change the spec is the solution to the whole problem. If we as programmers want this as
a possibility then we need to sit down and define just how we want wasm to signal to the interpreter
"Hey I want to print stuff" or "Hey I want to save a file" and so on and so on. There's a lot of
space here and to be honest I'm left with more questions than answers. How would we define it? How
would we make so that we have something that can work across all platforms if implemented correctly?
I don't really have the answer here. It's a tough question that deserves well thought out responses
and a well written specification based off that. Unfortunately, as we all know or eventually come to
know, is that once the spec is out there changing it becomes hard because you need to maintain
backwards compatibility. Just look at Windows path handling for a good example of all the crazy
stuff done to maintain that compatibility while still letting new things work.

However, with all of that being said I really think there's something here that's a big deal. I'm
not on the committee to change these things, but I think we should encourage those who are to
consider this going forward to evolving the spec beyond the initial MVP iteration. There's big
potential here to really make wasm something truly unifying in terms of programming and computers in
general. I'm really hoping more work will be done to explore this possibility in the future.

## Conclusion

There's a big unexplored space of what's possible. I'm hoping to work more with the [Rust wasm
Working Group](https://github.com/rust-lang-nursery/rust-wasm) on exploring this space to see what's
possible from our end to make things compatible with both execution on the web and on a computer, as
well as figuring out if we can get the interpreter to know what environment it's own and handle code
accordingly without breaking the spec. If you want to figure that out as well please come by and
discuss! I've opened up this issue [here](https://github.com/rust-lang-nursery/rust-wasm/issues/91)
to discuss it more!
