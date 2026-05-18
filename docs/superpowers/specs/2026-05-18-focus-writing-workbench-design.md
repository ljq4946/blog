# Focus Writing Workbench Design

## Status

Approved direction: A, focused writing workbench.

This design improves the existing admin article editor by borrowing practical patterns from open-source publishing tools without turning the project into a heavier CMS.

Reference patterns:

- [Ghost editor cards](https://ghost.org/help/cards/): content insertion through focused rich-media controls.
- [WordPress block editor](https://wordpress.org/documentation/article/wordpress-block-editor/): keep writing central, with toolbar, content area, and settings sidebar as separate workspace zones.
- [WordPress autosaves and revisions](https://wordpress.org/documentation/article/revisions/): use autosave as recovery support without replacing deliberate publish actions.
- [Decap CMS editorial workflow](https://decapcms.org/docs/editorial-workflows/): make draft, review, and publish states explicit for editors.

## Goals

- Make the article editor easier to use for everyday writing.
- Keep the main writing surface visually dominant.
- Move metadata and publishing readiness into a right-side panel.
- Add autosave, local draft recovery, preview, and publish checks.
- Preserve the current Vue 3, Element Plus, TipTap, and admin API stack.
- Keep the change scoped to the admin editor, with tests around behavior.

## Non-Goals

- No full WordPress/Gutenberg-style block editor.
- No chapter, volume, or serialized novel workflow.
- No collaborative editing.
- No server-side revision history.
- No new backend tables or API endpoints.
- No public site rendering changes unless needed to keep existing content compatible.

## Current Context

The current editor already supports:

- Creating and editing posts in `PostEditorView.vue`.
- TipTap rich text editing.
- Title, slug, summary, cover, status, category, and tags.
- Save draft and publish actions.
- Word count, save state, and dirty-leave protection.

The next iteration should build on that foundation instead of replacing it.

## User Experience

The page becomes a writing workbench:

- Top bar: back, save draft, publish, current save/autosave status.
- Main column: title, compact toolbar, editor, and preview mode.
- Right panel: publish readiness, status, cover, category, tags, summary, slug.

The main column should feel like the place where writing happens. Metadata should remain easy to reach, but it should not interrupt the writing flow.

### Edit And Preview Modes

The editor gets a segmented control:

- Edit: shows the TipTap editor and toolbar.
- Preview: renders the current title, summary, cover, and article HTML as a reader-facing preview inside the admin page.

Preview should not save automatically just by being opened. It reflects the current in-memory form state.

### Autosave

Autosave is debounced after edits settle.

Rules:

- Existing posts autosave as draft/published using the current status.
- New posts autosave only after title and slug are valid.
- If autosave creates a new post, it creates a draft and then replaces the route with `/posts/:id`.
- Autosave does not run while another save is in progress.
- Autosave does not run when validation for required fields fails.
- Manual save and publish remain available and should override the debounce.

The UI should distinguish:

- Saving.
- Autosaved.
- Manually saved.
- Save failed.
- Local recovery available.

### Local Draft Recovery

The editor writes a local recovery snapshot to `localStorage` whenever the form changes.

Rules:

- New post key: `post-editor:new`.
- Existing post key: `post-editor:<id>`.
- The snapshot stores form data, content HTML, and a timestamp.
- On load, if a newer local snapshot differs from the server snapshot, show a restore/discard prompt inside the editor.
- Successful server save clears or refreshes the recovery snapshot.

This is a fallback for browser crashes, accidental navigation, or failed autosave.

### Publish Checks

The right panel shows a checklist before publishing.

Required checks:

- Title is present.
- URL slug is present.
- Body content is not empty.

Recommended checks:

- Summary is present.
- Category is selected.
- At least one tag is selected.
- Cover image is selected.

Publishing should be blocked only by failed required checks. Recommended checks should show warnings but still allow publishing.

### Metadata Panel

The right panel contains:

- Save/autosave status and last saved time.
- Publish checklist.
- Status selector.
- Slug field.
- Summary textarea.
- Cover selector and preview.
- Category selector.
- Tags selector.

On smaller screens, the panel should stack below the editor.

## Data And State

Keep the existing `PostForm` shape and `toPostInput` conversion.

Add pure helpers in `features/posts/postForm.ts` where useful:

- `publishChecklist(form)`.
- `canAutosavePost(form)`.
- `postRecoveryKey(postId?)`.
- `postRecoverySnapshot(form)`.

The view owns orchestration state:

- `saveState`.
- `saveMode` for manual save vs autosave.
- `lastSavedAt`.
- `lastAutosavedAt`.
- `recoveryPrompt`.
- `activeMode` for edit vs preview.

The dirty snapshot logic should continue comparing normalized form state.

## Components And Boundaries

Keep the implementation small and local:

- `PostEditorView.vue`: page orchestration, editor setup, save/autosave flow, preview switch.
- `PostPublishPanel.vue`: right-side metadata panel and publish checklist if the view becomes too large.
- `features/posts/postForm.ts`: pure helpers for validation, autosave eligibility, publish checks, word count, and recovery snapshots.
- Tests stay beside the existing admin view and post form tests.

Do not introduce a global editor store for this iteration.

## Error Handling

- Manual save failures show a visible error and keep the content in place.
- Autosave failures show a non-blocking warning state and preserve local recovery data.
- Local recovery parse errors are ignored and clear the invalid snapshot.
- Media loading failures should not block writing.
- Empty link or image URL prompts remain no-ops.

## Accessibility And Responsiveness

- The edit/preview control should be keyboard accessible.
- Checklist items should be visible text, not color-only state.
- Toolbar buttons should have accessible labels.
- The two-column layout collapses to one column below tablet width.
- Text must fit inside controls on mobile and desktop.

## Testing

Use test-first implementation.

Pure helper tests:

- Required and recommended publish checks.
- Autosave eligibility for new and existing posts.
- Recovery key and snapshot behavior.
- Word count behavior remains covered.

View tests:

- Edit/preview toggle renders the expected state.
- Autosave waits for valid new-post fields before creating a draft.
- Autosave updates existing posts without navigation.
- Save failures preserve content and show an error.
- Recovery prompt can restore or discard local content.
- Publish is blocked when required checks fail and allowed with only recommended warnings.

Verification:

- Run the admin test suite.
- Run the admin build.
- Open the editor in the in-app browser and verify desktop and mobile layouts.

## Open Questions Resolved

- First version uses A, focused writing workbench.
- The local admin editor remains the only implementation surface.
- Autosave is in scope.
- Preview is in scope.
- Server-side revisions are out of scope.
