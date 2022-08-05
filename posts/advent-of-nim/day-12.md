---
title: "Day 12: Passage Pathing"
date: 2021-12-12
series: ./
---

Today's problem was a spin on a pathfinding puzzle. We're given a set of instructions, like:

```txt
start-A
start-b
A-c
A-b
b-d
A-end
b-end
```

That describes a cave system, like:

```txt
    start
    /   \
c--A-----b--d
    \   /
     end
```

There are a mixture of large caves (capital letters) and small caves (lowercase letters).

All paths must start at `start` and end at `end`.

The edges aren't weighted, so we don't need a full adjacency matrix, so a `Table[Node, seq[Node]]` seems like the best fit for storing this structure.

```nim
type
  Node = string
  Graph = Table[Node, seq[Node]]

proc parseGraph(input: string): Graph =
  for line in input.splitLines():
    let parts = line.split("-")
    let (a, b) = (parts[0], parts[1])
    discard result.hasKeyOrPut(a, @[])
    discard result.hasKeyOrPut(b, @[])
    result[a].add(b)
    result[b].add(a)
```

<details>
  <summary>Sidenote: Seq Unpacking</summary>

It's a shame that you can't unpack from a seq in Nim. I don't really need the intermediate `parts` variable here. In many other languages you can unpack/destructure directly from iterable/sequential data structures.

```nim
let (a, b) = @[1, 2]
```

Instead, I need to unpack explicitly.

```nim
let a = parts[0]
let b = parts[1]
```

Or reconstruct the seq as a tuple.

```nim
let (a, b) = (parts[0], parts[1])
```

This could be worked around with macros, but I wish it was a part of the default language.

</details>

## Part One
The first part of this puzzle asks us to find all paths through the cave system, given the restriction that we can only visit small caves once.

Given that we're looking for all paths (rather than the shortest path) a depth-first search should be sufficient.

I ended up using an object type to represent a specific search, to make it easier to track whether a given cave had already been visited.

```nim/4-6
type
  Node = string
  Graph = Table[Node, seq[Node]]
  Search = object
    node: Node
    visits: HashSet[Node]
```

The `node` property tracks the current node and the `visits` property tracks all nodes we visited before the current one.

I also created a `VisitRule` type, as a way to encode the rules about whether a given cave could be visited.

```nim
type
  VisitRule = proc (search: Search, node: Node): bool
```

Next I implemented `add` for the `Search` type.

```nim
proc add(search: Search, node: Node): Search =
  result = search
  result.node = node
  result.visits.incl(node)
```

Then the depth first search:

```nim
proc countPaths(graph: Graph, canVisit: VisitRule): int =
  var stack = @[Search(node: "start")]
  while stack.len > 0:
    let search = stack.pop()
    for next in graph[search.node]:
      if next == "start": continue
      if next == "end": result += 1; continue
      if search.canVisit(next): stack.add(search.add(next))
```

And finally the visit rule.

```nim
proc isLargeCave(name: string): bool =
  name[0] >= 'A' and name[0] <= 'Z'

proc canVisitSmallCavesOnce(search: Search, node: Node): bool =
  node.isLargeCave or node notin search.visits

proc part1(input: string): int =
  parseGraph(input).countPaths(canVisitSmallCavesOnce)
```

## Part Two
The next part wants the same answer, but modifies the rules, allowing us to visit a single small cave twice.

I couldn't think of a efficient way to encode this with a `VisitRule` without having the details leak into the `Search` itself.

I ended up just tracking whether we'd visited a duplicate as part of the `Search` object.

```nim/5
type
  Search = object
    node: Node
    visits: HashSet[Node]
    duplicate: bool
```

This also required a tweak to the `add` proc.

```nim/5-7
proc add(search: Search, node: Node): Search =
  result = search
  result.node = node
  result.visits.incl(node)
  if result.duplicate: return
  result.duplicate = node in search.visits
```

Then it was possible to write the visit rule and get an answer.

```nim
proc canVisitOneSmallCaveTwice(search: Search, node: Node): bool =
  if node.isLargeCave: return true
  if node notin search.visits: return true
  not search.duplicate

proc part2(input: string): int =
  parseGraph(input).countPaths(canVisitOneSmallCaveTwice)
```

Complete solution on GitHub:

[![GitHub](/icons/github.svg) Day 12](https://github.com/danprince/advent-of-code/blob/master/2021/day-12/main.nim)

