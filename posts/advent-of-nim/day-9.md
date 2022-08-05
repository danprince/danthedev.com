---
title: "Day 9: Smoke Basin"
date: 2021-12-9
series: ./
---

Today's puzzle required us to find low points and basins in a heightmap like this:

```txt
2199943210
3987894921
9856789892
8767896789
9899965678
```

`0` is the lowest possible value, and `9` is the highest.

Today's grid is dense, with fixed bounds, so we could use an array, but I prefer being able to index the map directly, rather than converting back and forth between indexes and `Point` tuples.

```nim
type
  Point = tuple[x: int, y: int]
  Heightmap = Table[Point, int]
```

Parsing the input wasn't too tricky.

```nim
func parseHeightMap(input: string): Heightmap =
  let lines = splitLines(input)
  for y, line in lines:
    for x, ch in line:
      result[(x, y)] = parseInt($ch)
```

## Part 1

We need to find the sum of the _risk levels_ of all the _low points_ on our heightmap.

A low point is defined as a location that has a lower height than all of it's adjacent locations.

We can start by creating an iterator that yields the adjacent points for a given point.

```nim
iterator adjacentPoints(p: Point): Point =
  let (x, y) = p
  yield (x - 1, y)
  yield (x + 1, y)
  yield (x, y - 1)
  yield (x, y + 1)
```

This iterator doesn't know anything about the boundaries of the heightmap though, so it will happily return points outside of the boundaries.

We can account for this by overloading the `[]` operator for `Heightmap`, to ensure that any accessing missing keys will return `9`, rather than throwing a runtime error. This gives the heightmap a "walled" effect.

```nim
func `[]`(map: Heightmap, p: Point): int =
  getOrDefault(map, p, 9)
```

It's cool that core bits of the syntax are implemented as procs that you can overload, but the tradeoff is that you have to learn type specific sematics for `[]` (and other operators).

In practice, if you're unsure which overload will be used, you can get more info by hovering over a specific usage of `[]`, and even jump to the definition.

We can use these new functions to determine whether a given point is a low point.

```nim
func isLowPoint(heights: Heightmap, point: Point): bool =
  result = true
  for next in adjacentPoints(point):
    if heights[point] >= heights[next]:
      return false
```

Finally we can calculate the risk level directly to solve the first part of the puzzle.

```nim
func part1(input: string): int =
  let heights = parseHeightMap(input)
  for point, height in heights:
    if isLowPoint(heights, point):
      result += 1 + height
```

## Part 2

The next part requires us to multiply the sizes of the three largest basins together.

A basin is defined as a set of points that all flow down to the same low point. Locations of height `9` do not belong to any basins.

We have a guarantee that other locations will be part of exactly one basin, so we know that basins _must_ be bounded by `9`s. If a boundary location was lower than `9` then it would be part of multiple basins!

I suspect that the intention here was for us to flow "uphill" from the low points we found in part one, but looking at the examples it seemed simpler to [flood fill](https://en.wikipedia.org/wiki/Flood_fill) across everything that wasn't a `9`.

```nim
func findBasins(heights: HeightMap): seq[seq[Point]] =
  var visited: HashSet[Point]

  for point, height in heights:
    if height >= 9 or point in visited: continue
    var basin: seq[Point]
    var stack = @[point]
    visited.incl(point)

    while stack.len > 0:
      let point = stack.pop
      basin.add(point)

      for next in point.adjacentPoints:
        if heights[next] >= 9 or next in visited: continue
        visited.incl(next)
        stack.add(next)

    result.add(basin)
    basin = @[]
```

There's quite a bit to break down here. The rough idea is to iterate over every point in the map, checking whether it _can_ be a part of basin (`<= 9`) and whether it's _already_ part of a basin we've identified (`in visited`).

If the point is valid and we haven't already visited it, then we start a stack based flood fill (depth-first search). When the stack is empty, we add the basin to the result, and continue.

Once we've discovered all basins, we can get the answer by multiplying the sizes of the three largest.

```nim
func part2(input: string): int =
  let heights = parseHeightMap(input)
  let basins = findBasins(heights)
  var sizes = basins.mapIt(it.len)
  sort(sizes, SortOrder.Descending)
  sizes[0] * sizes[1] * sizes[2]
```

## Conclusion
I tried a couple of things differently with Nim today.

### The `func` keyword
I find the `proc` keyword an odd decision on Nim's part. Variants of `function` (`func`, `fun`, `fn`, `defn`, `def`) are common across many languages and it feels like there needs to be an important distinction to justify using a different term. Whilst reading about Nim yesterday, I discovered that there is in fact a `func` keyword, too.

It's a shorthand for creating a proc with the `{.noSideEffect.}` pragma. I don't typically write procs that perform side effects, but I'm not keen on typing out that pragma alongside every `proc`, so I decided to try `func` out for today's puzzles.

As I understand, it's a relatively recent addition to the language, so you don't see it around much whilst reading the standard library, or other people's code.

I have mixed feelings.

I prefer reading _and_ writing `func`, and I like that I get the no side effect guarantee without pragmas, however, I found myself having to constantly switch back and forth between `func` and `proc` whenever I wanted to drop an `echo` to debug.

I can imagine for codebases with longer lifespans than this one, those guarantees are important enough to be worth it, but for Advent of Code, it just created extra work.

### Method Call Syntax
I've noticed that the documentation doesn't often use the method call syntax, and instead seems to prefer simple function calls (e.g. `len(xs)` instead of `xs.len`). I tried to use less of that syntax today, to see whether it felt any different.

It wasn't a huge change, but I think it's easier to write code that reads naturally when you are using method calls.

Here's all that code together:

[![GitHub](/icons/github.svg) Day 9](https://github.com/danprince/advent-of-code/blob/master/2021/day-09/main.nim)
