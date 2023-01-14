---
title: Zig Iterators
---

I came across an interesting little problem when converting some Python to Zig for a [recent project](https://github.com/danprince/zigrl). The code in question needed to wrap long strings of text to a fixed line length.

The `wrap` function from Python's [`textwrap`](https://docs.python.org/3/library/textwrap.html) module has the following basic signature.

```py
def wrap(text: str, width: int) -> list[str]:
```

It takes an input string and a line width, and returns list of lines of text that try not to exceed that line width.

```python
lines = wrap("This is a long string that needs to be wrapped over several lines", 20)

assert lines == [
  'This is a long',
  'string that needs to',
  'be wrapped over',
  'several lines',
]
```

A direct equivalent in Zig would look something like this.

```zig
// []const u8 is Zig's equivalent to `str`
fn wrap(text: []const u8, width: usize) [][]const u8
```

This signature is problematic because the length of the return type (a [slice](https://ziglang.org/documentation/master/#Slices) of strings) can't be known at compile time. This means the slice's backing array can't be compiled into the stack frame.

The simple way to sidestep this problem is to accept an allocator and declare the array on the heap instead.

```zig
fn wrap(text: []const u8, width: usize, allocator: std.mem.Allocator) [][]const u8 {
    const lines = std.ArrayList([]const u8).init(allocator);
    defer lines.deinit();
    // ...
    return lines.toOwnedSlice();
}
```

A direct port of the Python code would use this approach, but Zig doesn't have a garbage collector, so the caller becomes responsible for providing an allocator and eventually freeing that memory.

```zig
const lines = wrap(text, 40, allocator);
defer allocator.free(lines);
// ...
```

One of my earliest stumbling blocks in Zig was that splitting a string with `std.mem.split` returns a `SplitIterator` and not a slice of strings.

This pattern of returning an iterator is what allows the function to execute on the stack, with a fixed amount of memory. We can use an iterator to implement text wrapping with no memory allocations.

The general pattern for iterators in Zig is to use a struct with a `next` function that returns an optional value. It returns `null` when the iterator has finished.

```zig
const TextWrapIterator = struct {
    text: []const u8,
    width: usize,

    pub fn next(self: *TextWrapIterator) ?[]const u8 {
      // ...
    }
};
```

Our `wrap` function is going to return an instance of `TextWrapIterator`.

```zig
/// Returns an iterator that wraps text into lines of at most `width`
/// characters, attempting to break on the last space in each line.
pub fn wrap(text: []const u8, width: usize) TextWrapIterator {
    return .{
        .text = text,
        .width = width,
    };
}
```

This pattern works well with Zig's [payload capturing while loops](https://ziglang.org/documentation/master/#while-with-Optionals).

```zig
const text = "This is a long string that needs to be wrapped over several lines";
var lines_iter = wrap(text, 20);

while (lines_iter.next()) |line| {
    // ...
}
```

Let's write a quick test that we can use to guide the implementation.

```zig
const std = @import("std");
const testing = std.testing;

test "text wrapping" {
    const text = "This is a long string that needs to be wrapped over several lines";

    const lines = [_][]const u8{
        "This is a long",
        "string that needs",
        "to be wrapped over",
        "several lines",
    };

    var iter = wrap(text, 20);

    for (lines) |line| {
        try testing.expectEqualStrings(line, iter.next().?);
    }

    try testing.expectEqual(@as(?[]const u8, null), iter.next());
}
```

Time to implement it! The first case we need to handle is stopping the iterator when there is no more text.

```diff-zig
  pub fn next(self: *TextWrapIterator) ?[]const u8 {
+    if (self.text.len == 0) return null;
  }
```

There are [multiple algorithms](https://en.wikipedia.org/wiki/Line_wrap_and_word_wrap#Algorithm) for deciding where to add line breaks, but for this program it can be as simple as just breaking at the last space in each line.

Before we look for the last space, we need to consider all of the characters eligible to be in the current line. Zig's debug and safe [release modes](https://ziglang.org/documentation/master/#Build-Mode) include bounds checks that prevent us from accessing outside bounds of an array.

```zig
// This will cause a runtime panic if `self.width > self.text.len`
const line = self.text[0..self.width];
```

Let's make sure we're never going to exceed those bounds.

```diff-zig
  pub fn next(self: *TextWrapIterator) ?[]const u8 {
      if (self.text.len == 0) return null;
+     const end = std.math.min(self.width, self.text.len);
+     var line = self.text[0..end];
  }
```

Now we can use [`std.mem.lastIndexOfScalar`](https://ziglang.org/documentation/0.10.0/std/#root;mem.lastIndexOfScalar) to find the position of the last space. We can skip this step  if the line is already shorter than the wrapping width.

```diff-zig
  pub fn next(self: *TextWrapIterator) ?[]const u8 {
      // ...
+     if (line.len >= self.width) {
+         const last_space = std.mem.lastIndexOfScalar(u8, line, ' ');
+         if (last_space) |last_space_index| {
+             line = line[0..last_space_index];
+         }
+     }
  }
```

To get the tests passing we need to remove the spaces that we break on. The exclusive slicing syntax means the space ends up at the start of the next line.

```diff-zig
  pub fn next(self: *TextWrapIterator) ?[]const u8 {
      if (self.text.len == 0) return null;
+     if (self.text[0] == ' ') self.text = self.text[1..];

      // ...

      self.text = self.text[line.len..];
      return line;
  }
```

Finally, we need to remove the line from the text inside the iterator before we can return it.

```diff-zig
  pub fn next(self: *TextWrapIterator) ?[]const u8 {
      // ...
+     self.text = self.text[line.len..];
+     return line;
  }
```

This simple algorithm that doesn't account for many common considerations such as breaking on punctuation, respecting manual line breaks, soft-wrapping, or hyphenating split words, but a more complex version of `TextWrapIterator.next` could handle that stuff.

Let's throw some more tests at this code to check that it handles edge cases properly.

[Table driven tests](https://dave.cheney.net/2019/05/07/prefer-table-driven-tests) are a great way to reduce noise when testing these kinds of functions.

```zig
const cases = [_]struct {
    width: usize,
    actual: []const u8,
    expect: []const u8,
}{
    .{
        .width = 10,
        .actual = "",
        .expect = "",
    },
    .{
        .width = 20,
        .actual = "This is a long string that needs to be wrapped over several lines",
        .expect = 
        \\This is a long
        \\string that needs
        \\to be wrapped over
        \\several lines
        ,
    },
    .{
        .width = 3,
        .actual = "Gigantic",
        .expect =
        \\Gig
        \\ant
        \\ic
        ,
    },
    // ...
};
```

Here's a simple approach for writing the testing logic.

```zig
test "wrap" {
    // const cases = ...

    for (cases) |case| {
        var actual_iter = wrap(case.actual, case.width);
        var expect_iter = std.mem.tokenize(u8, case.expect, "\n");

        while (expect_iter.next()) |expect_line| {
            var actual_line = actual_iter.next().?;
            try testing.expectEqualStrings(expect_line, actual_line);
        }

        try testing.expectEqual(@as(?[]const u8, null), actual_iter.next());
    }
}
```

This will catch regressions, but unless the test cases are completely unambiguous it can be hard to tell exactly which one failed.

A more robust approach might involve using `actual_iter` to build an `actual` string, then comparing `actual` to `case.expect`. The conventional way of doing this involves heap allocations and therefore it has no place in this post!

When you write a string literal in a Zig program (such as the strings in our table driven tests) the length is fixed and the character data can be compiled directly into the executable's program data. We can take advantage of these known lengths to have the compiler allocate stack frame space for our `actual` strings.

The obvious implementation doesn't work though, because array lengths must be "comptime known" and inside the loop `case.expect.len` isn't a comptime value.

```diff-zig
  for (cases) |case| {
+     var actual: [case.expect.len]u8 = undefined;
      // ...
  }
```

We can solve this problem with [inline loops](https://ziglang.org/documentation/master/#inline-for).

```diff-zig
- for (cases) |case| {
+ inline for (cases) |case| {
+     var actual: [case.expect.len]u8 = undefined;
      // ...
  }
```

Unrolling the loop allows the compiler to resolve the values inside the loop at compile time.

Now we just need to stick the string back together with some newlines as it comes out of the iterator.

```zig
inline for (cases) |case| {
    var actual: [case.expect.len]u8 = undefined;
    var lines_iter = wrap(case.actual, case.max_width);
    var cursor: usize = 0;

    while (lines_iter.next()) |line| {
        std.mem.copy(u8, actual[cursor..], line);
        cursor += line.len;
        if (cursor < actual.len) {
            actual[cursor] = '\n';
            cursor += 1;
        }
    }

    try testing.expectEqualStrings(case.expect, &actual);
}
```

Now we'll see the the full context when there are regressions, rather than just the first line where there was a difference. Much better!

I hit a problem with the iterator approach as soon as I started using it in practice. The message log that I was implementing is printed from bottom to top, but the messages themselves need to be printed top to bottom. That would involve either needing to reverse the iterator which isn't possible, or knowing the number of lines before we wrap the text so that we can offset the printing.

A simple solution to this problem is to iterate twice, using the first iterator to calculate the offset, and the second to print the text.

```zig
var lines_iter = wrap(message.text, panel.width);
var height: usize = 0;
while (lines_iter.next()) |_| height += 1;

lines_iter = wrap(message.text, panel.width);
y -= height;

while (lines_iter.next()) |line| {
  print(x, y, line);
  y += 1;
}
```

There are a few opportunities for things to go out of sync which could be solved by implementing some kind of `TextWrapIterator.reset` function, but in this specific scenario we can do even better.

We know the max width of each line, we know the length of the text, and our iterator doesn't respect manual line breaks. We can use that calculate the number of lines this text will split onto.

```diff-zig
  const TextWrapIterator = struct {
      // ...

+     pub fn height(self: *TextWrapIterator) ?[]const u8 {
+       return self.text.len / self.width + 1;
+     }
  };
```

Division between `usize` integers will round down, hence the need for a `+ 1`.

The subtle problem with this function is that it will return an incorrect result if it's called after you start iterating and `self.text` starts changing. If that's a problem, then you can keep a reference to the original string in the struct and use that instead.

Here's the final version with a single iteration.

```zig
var lines_iter = wrap(message.text, panel.width);
y -= lines_iter.height();

while (lines_iter.next()) |line| {
  print(x, y, line);
  y += 1;
}
```

As a finishing touch we can add a safety check to prevent an infinite loop if the caller tries to wrap the string to a line width of `0`. Technically we don't need to account for negative line widths because `width` is an unsigned integer.

```diff-zig
  pub fn wrap(text: []const u8, width: usize) TextWrapIterator {
+     if (width <= 0) @panic("Cannot wrap zero-width lines");
      return .{
          .text = text,
          .width = width,
      };
  }
```
