---
title: "Day 7: The Treachery of Whales"
date: 2021-12-7
series: ./
---

Today's puzzle involved figuring out the fastest way to align a swarm of horizontal trajectory crab submarines. The submarines each use one unit of fuel when they move to an adjacent position.

I chose to solve part one with a simple brute force approach. Iterate through every possible position and calculate the fuel cost of moving every submarine there. If the total cost was lower than the previous best, then use that as the new best cost.

```nim
proc part1(input: string): int =
  result = high(int)
  let positions = input.split(",").map(parseInt)
  for target in min(positions) .. max(positions):
    let cost = costOfMove(positions, target)
    if cost < result: result = cost
```

Because we're working in one-dimensional space, calculating the fuel costs was straightforward.

```nim
proc costOfMove(positions: seq[int], target: int): int =
  for position in positions:
    result += abs(position - target)
```

Part two was a nearly identical problem, it just needed different logic for calculating the fuel costs.

This time, the first time a submarine moves, it uses one unit of fuel, the second time it moves it uses two, the third time three, and so on. In other terms, when the distance is `n` the fuel cost is given by the following formula.

```
1 + 2 + 3 + ... + n
```

I had to Google to find out the proper name for "factorial with addition". The sequence of numbers is known as [triangular numbers](https://en.wikipedia.org/wiki/Triangular_number) and there's a [formula](https://en.wikipedia.org/wiki/Triangular_number#Formula) we can use to calculate the _nth_ triangular number.

We can copy the solution for part one and swap out the fuel cost function.

```nim
proc crabCostOfMove(positions: seq[int], target: int): int =
  for position in positions:
    let n = abs(position - target)
    result += (n * (n + 1)) div 2

proc part2(input: string): int =
  let positions = input.split(",").map(parseInt)
  for target in min(positions) .. max(positions):
    let cost = crabCostOfMove(positions, target)
    if cost < result: result = cost
```

I haven't talked about it yet, but Nim's `result` variable is `return` keyword. It can look a bit magical and having a pre-initialised variable (from the return type of the procedure) seems like it has the potential to cause confusion. That said, it feels good to avoid duplication when declaring a return type, and a return variable.

There's not much on GitHub that didn't make it into the blog today, but here's the code, nonetheless!

[![GitHub](/icons/github.svg) Day 7](https://github.com/danprince/advent-of-code/blob/master/2021/day-07/main.nim)
