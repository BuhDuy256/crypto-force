---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Read the guidelines from the pinned source below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Read [guidelines.md](./guidelines.md) in this skill directory before each review. It is a pinned copy of `command.md` from vercel-labs/web-interface-guidelines at commit `434b7f91364665f2f733b310ec54809bf8f37937`; do not fetch a newer version during a review. The file contains all the rules and output format instructions.

## Usage

When a user provides a file or pattern argument:
1. Read the guidelines from the pinned source above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.
