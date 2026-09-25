# Document-sharing permissions

DocFlow distinguishes Owner, Editor, and Viewer access.

## Expected behavior

- Owners can manage their documents and sharing settings.
- Editors can modify shared document content but should not gain ownership controls.
- Viewers can read shared content without editing it.
- Server-side authorization remains the source of truth; UI restrictions are only presentation.

## Verification

Test each role against read, write, delete, and sharing operations after permission-related changes.
