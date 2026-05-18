# Article Editor Enhancement Design

## Goal

Upgrade the admin post editor from a minimal save form into a lightweight writing surface that is comfortable for day-to-day blog publishing. Keep the current single-page editor and existing Vue 3, Element Plus, TipTap, and shared API patterns.

## Approved Direction

Use the lightweight enhancement approach:

- Keep the editor as one page under `frontend/apps/admin/src/views/PostEditorView.vue`.
- Add practical editing actions before introducing heavier CMS workflow.
- Preserve the existing constructivist admin visual style: paper background, black borders, square controls, red primary action.
- Avoid first-version scope creep such as SEO fields, full public preview, scheduled publishing, or category/tag creation inside the editor.

## User Experience

The top of the page should show the page title, save state, word count, and primary actions. A draft can be saved without publishing, and a published post can be saved through the same form. The UI should show when a save is in progress, when it last succeeded, and when it failed.

The metadata area remains visible above and below the editor:

- Title with existing slug sync on blur.
- URL slug.
- Summary.
- Cover image selector backed by existing media assets and `coverMediaId`.
- Status, category, and tags.

The editing toolbar expands from `B`, `I`, list, and quote to the common first-version set:

- Bold.
- Italic.
- Heading 2.
- Heading 3.
- Bullet list.
- Blockquote.
- Link.
- Image.
- Code block.
- Undo.
- Redo.

Link insertion should prompt for a URL and apply it to the selected text. Image insertion should prompt for an image URL and insert an image node into the TipTap document. Cover image selection is separate from inline image insertion.

The page should warn before data loss. If the form or editor content differs from the last loaded or saved state, browser unload and route navigation should ask for confirmation.

## Data And State

Use the existing `PostForm` shape and `toPostInput` conversion. The design should continue sending `coverMediaId`, `status`, `categoryId`, `tagIds`, and `publishedAt` through the existing admin post endpoints.

Dirty state should compare a normalized snapshot of the current form against the last loaded or saved snapshot. After successful create or update, refresh the snapshot so leaving the page does not warn.

Save state should be local UI state:

- `idle`: no current save feedback.
- `saving`: disable save actions and show loading.
- `saved`: show a concise success message and last saved time.
- `error`: show the API or fallback error message.

No autosave is included in this version.

## Components And Boundaries

Keep the implementation local unless tests show a helper is useful:

- `PostEditorView.vue`: layout, editor commands, save state, dirty guards, media selection.
- `features/posts/postForm.ts`: validation and any small pure helpers needed for normalization or word counting.
- `features/posts/postForm.test.ts`: coverage for new helper behavior.

Do not introduce a global editor store or a new routing structure. If the toolbar grows later, it can become a separate component, but this version can remain scoped to the editor view.

## Error Handling

Validation errors stay in the existing page-level `el-alert`. Save failures should not navigate away; they should leave the form intact and show a visible error. Link and image prompts should ignore empty input rather than inserting broken markup.

If media loading fails, the editor should still work. The cover selector can show an empty state or no options while leaving `coverMediaId` nullable.

## Testing

Follow test-first implementation:

- Add unit coverage for any new form helper such as word counting or snapshot normalization.
- Add component or view-level coverage for visible save state, disabled save action while saving, and dirty guard behavior where practical.
- Run the admin test suite, then the frontend build or admin build to verify TypeScript and bundling.
- Use the in-app browser or Playwright to check the edited page visually at desktop width after implementation.

## Out Of Scope

- SEO title and description.
- Public post preview.
- Autosave.
- Scheduled publishing UI.
- Creating categories or tags from inside the editor.
- Public site rendering changes for cover images.
