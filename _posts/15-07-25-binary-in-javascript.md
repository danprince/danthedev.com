---
layout: post
title: Binary in Javascript
---

Over the last week or so, I've spent my spare time working on a new [roguelike][0] game, with a focus on extensive and interesting planet generation. A key characteristic of the genre is that the game world is procedurally generated and this one is no exception.

In traditional roguelike spirit, there is no pre-rendered art. Everything is drawn as tile sized rectangles and ASCII/Unicode characters above them. Although generating the worlds is an interesting task, this post is going to look at the step that comes before. How do you store the data associated with each tile in an efficient way?

If you are used to low level memory management style programming or you've been bitmasking since childhood, then I'm afraid this isn't going to be anything new. However if you are interested in squeezing some efficiency out of Javascript, read on.

## The Tile

In this game, a tile is defined by its __type__ (earth, water, sand, rock), its __height__ (between 0 and 1) and whether it contains any __vegetation__. These values are very easy to express inside an object.

{% highlight javascript %}
var tiles = { WATER: 0, EARTH: 1, SAND: 2, ROCK: 3 };

var tile = {
  type: tiles.WATER,
  height: 0.54,
  vegetation: false
};
{% endhighlight %}

_Great, now I can just write a function which creates these tile objects and then store them all in a 2D array to represent the world..._

I suppose you could.

But what happens when you want to generate a map the size of a planet? You end up doing __a lot__ of memory allocation for all of these new objects you're building. The chances are, your Javascript implementation will try and do some very clever stuff in order to optimize this for you, but regardless; you're trying to make a lot of objects.

## Storage

One of the blessings of Javascript is that it is efficient enough for you to work in a high level style and enjoy great performance, simply because of the amount of work that goes into optimizing the underlying implementations. However, we shouldn't use this to exempt us from making optimisations of our own.

Even if your world is only 512x512, you have to deal with 262144 object instances, each of which contain at least two [64 bit floating point][1] numbers and an additional bit for the boolean. Oh and wait, you're storing a key alongside each value too and strings are made up of [16-bit unsigned integers][2].

| String | Chars | Bits |
| ------ | ----- | ---- |
| `"type"`       | 4 | 64 |
| `"height"`     | 6 | 96 |
| `"vegetation"` | 10 | 160 |

Altogether we have an extra `350 bits` and that's not even taking null terminators into account (they'll be back). Let's throw that together with the size of our values (`350 + 64 + 64 + 1 = 479`). So, each of our 3 field tile instances takes up `~60 bytes` of memory. Altogether your 512x512 map is taking up `~15695872` bytes or __`~14.97 megabytes`__ of data, just to store tiles. Sure you could shorten your keys and maybe even use an array instead, but you're still allocating huge amounts of memory.

If we actually perform this experiment in Chrome, we can use the memory profiler to see the amount of allocated memory for these objects.

![Chrome Memory Profile][12]

Our calculation was actually fairly close, but the V8 has done some smart things in order to save space. It only achieved a small reduction on our estimate. However, it's worth remembering that not all of these objects directly relate to our code. Some of them are created regardless. The code for this experiment can be found in [this gist][14].

With the current state of performance in browsers and the amount of RAM in modern devices, you'd probably get away with it as well. It isn't going to be garbage collected, unless you come up with a clever chunking system that would allow you to save unused tiles into in browser storage ([IndexedDB][3], [sessionStorage][4] etc), but 15mb of RAM isn't a lot these days. You've got take a moment to respect the developers who built games for devices with <128kb of memory.

What happens when you need to add a new field though? Another number, push the boat out and go as far as a string? You'll add a new key to your object. More bits, bigger formats, bad things all round.

## Binary to the Rescue

Let's re-evaluate our tile.

{% highlight javascript %}
var tiles = { WATER: 0, EARTH: 1, SAND: 2, ROCK: 3 };

var tile = {
  type: tiles.WATER,
  height: 0.54,
  vegetation: false
};
{% endhighlight %}

We don't yet know quite how big our tile set is going to get, but we can make a decent estimate of the likely upper limit. Let's be cautious and say 128.

Now our height has decimal precision and that is more complicated to store than regular integers. We need to decide on a limit and then simply store just that amount of precision instead. I can't see a need for more than two digits. Effectively, we can get away with storing them as integers (0 to 99).

Finally our vegetation boolean only needs a single bit and that is all there is to say about that.

How might this look if we had to use a binary format?

| Length | `8`    | `8`      | `1`          |
| ------ | ------ | -------- | ------------ |
| Field  | `type` | `height` | `vegetation` |

17 bits. We've managed to substantially cut back on our 479 bit object format. However, 17 is a _tricky_ number when it comes to storage. It won't quite fit into two bytes. We'd probably have to use 3, which would give us 7 bits of extra space for the future. However, if we knew this was going to be the canonical format, we could shorten the first field by 1 bit and use 7 bits to represent tile types instead. Condensing the format to fit nicely into two bytes is an exercise left for the reader.

_Whatever happens_, you say, _Javascript has no concept of bytes, so it's irrelevant_.

We could use an array of booleans, to store the individual bits in sequence, but then we put ourselves at the mercy of the implementation, not the specification. We don't want to risk the array being "optimized" into an object. All that work for nothing...

So, we'll use a number. Back up to 64 bits.

Let's take this example setup.

~~~
Tile:
  type: 4
  height: 0.48
  vegetation: true
~~~

We need to do a small amount of work to the height and vegetation properties, but afterwards, the underlying representation of these values looks like this.

| Field | Decimal | Binary |
| ----- | ------- | ------ |
| type       | `4`{:.alt}  | `00000100` |
| height     | `48`{:.alt} | `00110000` |
| vegetation | `1`{:.alt}  | `1` |

Here is our packaged up tile data type in all of its 17 bits of glory.

`00000100001100001` or just `2145`{:.alt}.

Now we come across another problem, how do we get those values into a number? `parseInt` with base 2? [Binary literals][5]?

Unbeknownst to some, Javascript comes equipped with a relatively good set of [bitwise operators][6]. We can use these to perform all kinds of binary operations on our data.

From here on, I'm going to assume that you have a degree of familiarity with logic gates and their basic function. If not, then you can catch up [here][7].

## Bitwise Operations

So, I want to take `4`{:.alt} (type), `48`{:.alt} (height) and `1`{:.alt} (vegetation) and end up with `2145`{:.alt}. The naive implementation might look something like this:

{% highlight javascript %}
function pack(type, height, vegetation) {
  return type.toString(2) + height.toString(2) + Number(vegetation).toString(2);
}
{% endhighlight %}

However, it's not quite that simple.

{% highlight javascript %}
assert.equal('00000100001100001', pack(4, 48, 1));

// "1001100001" is not equal to "00000100001100001"
{% endhighlight %}

We lost all of the padding at the front. This would break any other programs that used our format. The incorrect 8 bits would be read in as the type. There would be all kinds of issues. However, the biggest issue is that we are creating strings. The data is already there under the shell, we shouldn't need to do to any parsing or serialization.

### `|` Bitwise OR

Let's say that our packed version starts out as a number, set to 0.

`0000000000000000000000000000000000000000000000000000000000000000`

To insert our type into the end of that sequence, we can simply use the bitwise OR operator.

~~~
...00000000
   00000100 (tile type)
   -------- |
...00000100
~~~

In Javascript, that looks like this.

{% highlight javascript %}
function pack(type) {
  var packaged = 0;
  packaged = packaged | type;
  // ...
}
{% endhighlight %}

### `<<` Shift Left

Let's say that our packed version starts out as a number, set to 0.
Now our type is embedded, we need to make some more room at the end of the number for our height. If we reference our initial format design, we can check the field length for height. It was 8 bits.

Introducing the second useful bitwise operator, `<<`. The left bitshift. It simply moves the bit pattern left by how every many places you specify in the right hand side operand.

~~~
.......0000100
       0001000 (field length)
       ------- <<
00010000000000
~~~

Back to our function:

{% highlight javascript %}
function pack(type) {
  var packaged = 0;
  // insert the number at the end
  packaged = packaged | type;
  // shift for the next field
  packaged = packaged << 8;
  // ...
}
{% endhighlight %}

Then we simply rinse and repeat, until we have all of our fields inside our packaged number. Let's tidy up the code a bit and have a look at the finished function.

{% highlight javascript %}
function pack(type, height, vegetation) {
  var packaged = 0;

  packaged |= type;
  packaged <<= 8;
  packaged |= height;
  packaged <<= 1;
  packaged |= vegetation;

  return packaged;
}
{% endhighlight %}

We can condense some of the operators into terser forms and return the number at the end.

{% highlight javascript %}
assert.equal(2145, pack(4, 48, 1));
{% endhighlight %}

Tests passing. Spot on.

But how do we get values back out of this binary/number thing? Quite simply, do the opposite. For instance, let's say we want to read the height of our tile, but what we have in our tile array is `2145`{:.alt}.

### `>>` Shift Right

From our format, we know that the bit range for the height property is 1-8 (inclusive). To get those bits back to the start, we just can __shift right__ using the start of our range as our RHS operand.

~~~
00000100001100001 >> 1
00000010000110000
        ^-------^
     Heres our height
~~~

### `&` Bitwise AND

To get it out, we need to find a way to ignore whatever comes behind it. We'll need to use what's called a bitmask in order to isolate the positions we're interested in.

A bitmask is just a pattern of bits that can be used with bitwise operators to modify other patterns in useful ways. In this case, we'll create a bitmask to help us isolate the first 8 bits of our number.

Not surprisingly, it looks like this: `000000011111111` or 
`255`{:.alt}.

Combine that with a bitwise AND and you will left with all other bits zero'ed except for in the first 8 positions.

~~~
0000010000110000
0000000011111111
---------------- &
0000000000110000
~~~

Let's put on our human vision again and we'll see:

{% highlight javascript %}
var packed = 2145;

var height = (packed >> 1) & 255;
console.log(height); // 48
{% endhighlight %}

That's all there is to it.

## Roundup

* Performing field lookups will be faster than doing a key lookup for object.
* Reduced our tile structure to ~12.5% of the original size.
* These tiles can be stored in [TypedArrays][8] for further memory efficiency and performance benefits.
* The size can become as little as ~3% if you fit the format into two bytes, then store it in a [Uint16Array][9] (see demo below).

We can repeat the earlier experiment and compare the object implementation (on the left) to the binary implementation (on the right).

![][12]
![][13]

As far as your program is concerned, it is the exact same data. We could read a lot more into this data, but I'll save that for another time. Again, the code is in [the gist][14].
 
## Sharp Edges
If you're anything like me, mixing this kind of code with functional or object oriented styles feels messy. Looking for some object properties with dot notation and some with `>>` and `&` is upsetting. In order to improve the experience, I've written a tiny library for removing the sharp edges. It allows you to design lightweight formats for dealing with unsigned integers.

{% highlight javascript %}
var Tile = new BinaryFormat([
  { length: 8, name: 'type' },
  { length: 8, name: 'height' },
  { length: 1, name: 'vegetation' }
]);

Tile.pack(4, 48, 1);   // 2145
Tile.unpack(2145);     // { type: 4, height: 48, vegetation: 1 }
Tile.unpackArray(2145) // [4, 48, 1]
{% endhighlight %}

Of course for performance critical moments, you don't want to unpack the numbers; just jump in and get bitwise to your heart's content.

Check it out on [GitHub][10].

## Demo
Finally, what would this kind of very hypothetical rambling be without a demo to back it up? Below is a minimalistic implementation of a terrain generator, using [tiny-binary-format][10] and the [Diamond-Square][11] implementation from my game.

<a class="jsbin-embed" href="http://jsbin.com/zeqevi/embed?js,output">JS Bin on jsbin.com</a><script src="http://static.jsbin.com/js/embed.min.js?3.34.1"></script>

All tiles are packed into a binary format, then stored in Uint16Arrays.

The initial generation time could be faster, but the fault is with the diamond square implementation, not the tile format. It could be optimized, but that's not the point.

To render the tiles, we use their height as the lightness value for a hsl colour to create the transition effects. Any tiles with the vegetation flag set, will also have a green `,` rendered above them.

I've got plans for another post, focusing on achieving rendering performance for when you need to draw a large amount of text on your canvas.

[0]: https://en.wikipedia.org/wiki/Roguelike "Wikipedia on Roguelike"
[1]: http://www.ecma-international.org/ecma-262/5.1/#sec-4.3.19 "ECMA Specification on Numbers"
[2]: http://www.ecma-international.org/ecma-262/5.1/#sec-4.3.16 "ECMA Specification on Strings"
[3]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API "MDN IndexedDB"
[4]: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage "MDN sessionStorage"
[5]: https://babeljs.io/repl/#?experimental=true&evaluate=true&loose=false&spec=false&code=0b1010%0A0b1111%0A%0A0o12%0A0o17%0A%0A0xA%0A0xF%0A%0A10%0A15 "Binary & Octal Literals"
[6]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators "MDN Bitwise Operators"
[7]: http://www.hardwaresecrets.com/introduction-to-logic-gates/ "Intro to Logic Gates"
[8]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays "MDN Typed Arrays"
[9]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Uint16Array "MDN Uint16Array"
[10]: https://github.com/danprince/tiny-binary-format "Tiny Binary Format"
[11]: https://en.wikipedia.org/wiki/Diamond-square_algorithm "Wikipedia on Diamond Square"
[12]: http://i.imgur.com/G1Spj4K.png "Memory Profile for Objects"
[13]: http://i.imgur.com/3bYQ4AI.png "Memory Profile for Binary"
[14]: https://gist.github.com/danprince/7f4174a11378dc29dcd8 "Gist for Tile Memory"
