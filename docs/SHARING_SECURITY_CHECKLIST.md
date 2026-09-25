# DocFlow sharing security checklist

DocFlow supports Owner, Editor, and Viewer permissions.

## Owner
Owners can manage their documents and sharing settings.

## Editor
Editors can modify document content but should not gain destructive owner-only controls.

## Viewer
Viewers must remain read-only.

## Regression
Test each role directly against document reads, edits, deletes, and sharing operations. Repeat the checks after changes to database policies or server actions.
