---
title: "Day 4: Giant Squid"
date: 2021-12-4
series: ./
---

Nothing gets you in the mood for Christmas like unethically rigging a game of chance in your favour.

Today's puzzle involved writing a bingo simulation to find the first and last boards to win, given a list of numbers to draw.

It was the first day where I reached for the object system to represent the puzzle state, rather than passing individual values between functions.

```nim
type
  Board = seq[int]

  Game = object
    boards: seq[Board]
    drawNumbers: seq[int]
    calledNumbers: seq[int]
```

If previous years are anything to go by, this will become a common theme in the later days, where the models and states are complex enough that they need to be formalised to keep your code clean.

Representing a 2D board with `seq[int]` might seem like an odd decision, but in programming languages without first class matrices, I tend to prefer to represent dense 2D arrays as one dimensional arrays in [row-major order](https://en.wikipedia.org/wiki/Row-_and_column-major_order). There are a few interesting trade-offs here, but I find it simplifies lots of operations when you're working with a flat list of values. As an example, consider the amount of code required to find the largest number in a `seq[int]` compared to a `seq[seq[int]]`.

- `drawNumbers` is a sequence of all the numbers that will be drawn
- `calledNumbers` is a sequence of all the numbers that have already been drawn

Let's start with the final part one procedure and work backwards from there.

```nim
proc part1(input: string): int =
  var game = parseGame(input)
  while game.drawNumbers.len > 0:
    game.drawNextNumber
    for board in game.boards:
      if game.hasWinState(board):
        return game.score(board)
```

Nim's syntax is clear enough that this almost reads like pseudocode.

Initially I tripped up by using `del` to remove the number from `drawNumbers`, which makes deletion an O(1) time operation by swapping the deleted index with the final index, the presumably shrinking the sequence by one in memory.

```nim/3
proc drawNextNumber(game: var Game) =
  let num = game.drawNumbers[0]
  game.drawNumbers.del(0)
  game.calledNumbers.add(num)
```

`delete` gives the desired behaviour. In hindsight, I probably should have reversed the list and treated it as a stack instead.

The `hasWinState` procedure is a little bit more involved, but it effectively just checks for completed rows and columns on each of the boards, given the current set of called numbers.

The final piece of the puzzle is the `score` procedure, which creates sets from the board and the called numbers, finds the _difference_ to get the unmarked numbers, sums them together and multiplies by the most recently called value.

```nim
proc score(game: var Game, board: Board): int =
  let numbers = board.toIntSet
  let calledNumbers = game.calledNumbers.toIntSet
  let unmarkedNumbers = numbers.difference(calledNumbers)
  let mostRecentCall = game.calledNumbers[^1]
  for n in unmarkedNumbers: result += n
  result *= mostRecentCall
```

The solution for part two of the puzzle involved finding the last rather than the first board, which meant that I was able to reuse most of the code. My first attempt looked something like this:

```nim/7
proc part2(input: string): int =
  var game = parseGame(input)
  while game.drawNumbers.len > 0:
    game.drawNextNumber
    for i, board in game.boards:
      if game.hasWinState(board):
        game.boards.delete(i)
        if game.boards.len == 1:
          return game.score(board)
```

This didn't work, because Nim doesn't allow you to modify the value of the thing you're iterating over, during iteration.

I solved this by filtering the entire list after each pass instead.

```nim/10
proc part2(input: string): int =
  var game = parseGame(input)
  while game.drawNumbers.len > 0:
    game.drawNextNumber
    for i, board in game.boards:
      if game.hasWinState(board):
        if game.boards.len == 1:
          return game.score(board)

    game.boards = game.boards.filterIt(not game.hasWinState(it))
```

The final alteration I made today was to start reading the examples from disk, rather than hardcoding them into my program.

```nim
when isMainModule:
  const example = slurp("example.txt")
  assert part1(example) == 4512
  assert part2(example) == 1924
  const input = slurp("input.txt")
  echo "Part 1: ", part1(input)
  echo "Part 2: ", part2(input)
```

I can plug away at the code until the assertions pass, at which point I'll get the first answer for my inputs too. So far, the type system is doing a good job at keeping runtime debugging to a minimum.

For reference, I'm now starting my day with the following template:

```nim
import std/[sequtils, strutils]

proc part1(input: string): int =
  0

proc part2(input: string): int =
  0

when isMainModule:
  const example = slurp("example.txt")
  assert part1(example) == 0
  assert part2(example) == 0

  const input = slurp("input.txt")
  echo "Part 1: ", part1(input)
  echo "Part 2: ", part2(input)
```

Here's today's code!

[![GitHub](/icons/github.svg) Day 4](https://github.com/danprince/advent-of-code/blob/master/2021/day-04/main.nim)
