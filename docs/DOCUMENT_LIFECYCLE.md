# DocFlow document lifecycle

A document moves through creation, editing, autosave, sharing, and deletion.

## Ownership
A document has one owner. Shared users receive explicit viewer or editor permissions.

## Editing
Only owners and editors should be able to modify document content.

## Sharing
Only owners should manage collaborators and permissions.

## Deletion
Destructive actions should confirm the target document before removal and leave no unexpected shared state.
