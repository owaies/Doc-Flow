# DocFlow Testing Guide

The repository uses Vitest for frontend and unit coverage.

## Core paths

The highest-value regression paths include text and markdown parsing, HTML escaping for imported content, document permission behavior, autosave timing and save failures, attachment upload validation, and authentication session initialization.

The authentication provider subscribes to Supabase auth changes before reading the initial session. If a sign-in or sign-out event arrives while `getSession()` is pending, the event remains authoritative and the older initial read is ignored. The provider also avoids updating state after unmount.

## Manual editor smoke test

Sign in, create a document, edit title and content, reload, import a small text or markdown file, and confirm the content remains escaped and persists correctly. Then test a viewer account to confirm editing controls do not become an authorization bypass.

## Authentication session race check

With a delayed initial session read, trigger a sign-in or sign-out event before the read resolves. Confirm the event's user state remains visible after the delayed read completes. Navigate away while the initial read is pending and confirm the provider unsubscribes cleanly.
