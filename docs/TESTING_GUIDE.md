# DocFlow Testing Guide

The repository uses Vitest for frontend and unit coverage.

## Core paths

The highest-value regression paths include text and markdown parsing, HTML escaping for imported content, document permission behavior, autosave timing and save failures, and attachment upload validation.

## Manual editor smoke test

Sign in, create a document, edit title and content, reload, import a small text or markdown file, and confirm the content remains escaped and persists correctly. Then test a viewer account to confirm editing controls do not become an authorization bypass.
