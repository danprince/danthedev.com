---
title: "Day 10: Syntax Scoring"
date: 2021-12-10
series: ./
---

Bracket matching algorithms are on everyone's Advent of Code bingo cards, so I wasn't suprised to see one appear today.

For anyone who is unfamiliar, bracket matching usually involves iterating over a stream of opening and clothing brackets and checking that each opening bracket has a corresponding closing bracket.

```js
((())) // ok - each ( has a matching )

({[]}) // ok - each pair is balanced

[) // [ has no matching ]
```

The classic implementation involves iterating over the string and pushing open brackets onto a stack. When finding a closing bracket, check that it matches the opening bracket at the top of the stack, then pop it from the stack.

If a closing bracket doesn't match the opening bracket at the top of the stack, then there's a mismatch (e.g. `[)`). If there are any brackets left on the stack at the end, then the string is incomplete (e.g. `(((`).

## Part One
The first part of the puzzle involves finding the corrupted strings (mismatched brackets) and calculating a "syntax error score" based on awarding points depending on which bracket was used illegally.

I started out by encoded the rules for opening and closing brackets using tables.

```nim
const opening = { '(': ')', '[': ']', '{': '}', '<': '>' }.toTable
const closing = { ')': '(', ']': '[', '}': '{', '>': '<' }.toTable
```

Then the specific scores for illegal characters.

```nim
const errorScores = { ')': 3, ']': 57, '}': 1197, '>': 25137 }.toTable
```

I used the stack based algorithm mentioned above to find the corrupted character in a given string.

```nim
proc findCorruptedChar(line: string): Option[char] =
  var stack: seq[char]
  for c in line:
    if c in opening:
      stack.add(c)
    elif stack[^1] != closing[c]:
      return some(c)
    else:
      discard stack.pop()
```

Not every string will have a corrupted character, so I made use of [`Option`](https://nim-lang.org/docs/options.html), which will return `none` if a corrupted character is not found.

The `part1` procedure does some simple parsing then unwraps the result from `findCorruptedChar` and uses the `errorScores` table to calculate the score.

```nim
proc part1(input: string): int =
  for line in splitLines(input):
    let c = findCorruptedChar(line)
    if c.isSome:
      result += errorScores[c.get()]
```

## Part Two
The second part asks us to solve the other problem. Find and complete the lines _without_ corrupted characters.

For example, to complete `()[<` we would need `>]`.

The second part of this puzzle was to apply a slightly more complicated set of scoring rules to the completion string.

I started off by writing the scoring procedure.

```nim
const completeScores = { ')': 1, ']': 2, '}': 3, '>': 4 }.toTable

proc getCompletionScore(s: string): int =
  for c in s:
    result = result * 5 + completeScores[c]
```

Then tackling the code that actually calculated the completion string.

```nim
proc autocomplete(line: string): string =
  var input: seq[char] = line.toSeq
  var output: seq[char]
  var pairs: seq[char]

  while input.len > 0:
    let c = input.pop()

    if c in closing:
      pairs.add(c)
    elif pairs.len > 0 and opening[c] == pairs[^1]:
      discard pairs.pop()
    else:
      output.add(opening[c])

  output.join
```

This procedure starts at the end of the string, and moves forwards, adding the closing brackets to a `pairs` stack and popping them off when the opening bracket is found. When we find opening brackets that don't match, then we push their closing pair to an output stack.

Finally, we need to make sure that we only consider incomplete lines, and find the middle score (as per the puzzle description).

```nim
proc part2(input: string): int =
  var scores: seq[int]

  for line in splitLines(input):
    let c = findCorruptedChar(line)
    if c.isSome: continue

    let completion = autocomplete(line)
    let score = getCompletionScore(completion)
    scores.add(score)

  sort(scores)
  scores[scores.len div 2]
```

Not a particularly interesting puzzle, but still enjoyable with Nim. Here's the code:

[![GitHub](/icons/github.svg) Day 10](https://github.com/danprince/advent-of-code/blob/master/2021/day-10/main.nim){.center}
