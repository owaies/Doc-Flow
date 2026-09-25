# DocFlow autosave test plan

DocFlow uses debounced client-side autosaving for document content.

## Core cases
- Edit text and wait for the saved state.
- Make several rapid edits and confirm the latest content wins.
- Reload after a successful save and confirm content persists.
- Simulate a failed save and verify the UI exposes the failure.

## Collaboration
Verify sharing permissions remain unchanged while autosave runs.

## Boundary cases
Test empty documents, long documents, rapid typing, network interruptions, and browser refresh during a pending save.
