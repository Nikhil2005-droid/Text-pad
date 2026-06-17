# User Flow Journey

## Entry Flow

1. User opens the app.
2. Splash screen appears briefly.
3. Workspace gate loads.
4. User sees:
   - workspace ID input
   - optional password input when needed
   - recent workspaces
   - documentation link
   - product explanation cards
5. User enters a workspace ID.
6. User clicks `Open Workspace` or presses Enter.

### New Workspace

1. Backend does not find the workspace ID.
2. Backend creates a workspace.
3. Frontend opens the workspace.
4. Workspace appears in recent workspaces.
5. User lands in the main workspace screen.

### Existing Public Workspace

1. Backend finds workspace.
2. Backend returns sanitized workspace data.
3. Frontend loads notes, code entries, preferences, and protected status.
4. User lands in the main workspace screen.

### Existing Protected Workspace

1. Backend finds workspace and sees password protection.
2. If no password is provided, frontend shows password prompt.
3. User enters password.
4. Backend verifies password.
5. Backend returns sanitized workspace and access token.
6. Frontend stores the temporary token in memory.
7. User lands in the main workspace screen.

## Main Workspace Screen

### Desktop Layout

1. Navbar remains sticky at the top.
2. Sidebar library appears on the left.
3. Editor panel appears on the right.
4. Sidebar can be resized.
5. Sidebar can be collapsed.
6. User can switch between Notes and Code from the sidebar tabs.

### Mobile Layout

1. Top mobile controls show:
   - `Open List`
   - swipe hint
   - Notes/Code mode selector
2. Editor takes the main screen.
3. User can open list with `Open List`.
4. User can swipe from the left edge to open the list.
5. Sidebar appears as a drawer.
6. Drawer can be closed by tapping backdrop, close button, or drag handle.

## Navbar Flow

1. User sees workspace identity and navigation.
2. User can toggle dark mode.
3. User can navigate to:
   - Workspace
   - Docs
   - Settings
4. Desktop nav has moving active and hover indicator.
5. Mobile menu uses a matching moving vertical indicator.
6. User can open workspace menu.
7. Workspace menu allows:
   - edit workspace name
   - edit workspace ID
   - open settings
   - lock or close workspace

## Sidebar Library Flow

1. User sees workspace name, workspace ID, note count, code count, sort label.
2. User chooses Notes or Code tab.
3. User can create:
   - New Note
   - New Code
4. User can search by title and body.
5. User can sort by:
   - recently updated
   - newest first
   - title A-Z
6. User can select multiple items.
7. User can delete selected items.
8. User can pin or unpin individual items.
9. User can rename individual items.
10. User can delete individual items.
11. Deleted items show toast with Undo restore.

## Note Creation Flow

1. User clicks `New Note`.
2. App saves any dirty active code entry first.
3. Backend creates note with defaults.
4. Note appears in sidebar.
5. Newly created note becomes active.
6. User writes title and body.
7. Save status updates as user saves.

## Note Editing Flow

1. User selects a note.
2. App saves current dirty note or code before switching.
3. Note title input appears.
4. Note body editor appears.
5. Header displays:
   - word count
   - saved time
   - language
   - save status
6. User edits title or content.
7. Dirty state is tracked.
8. User clicks Save.
9. Backend checks revision.
10. On success:
   - note updates
   - revision increments
   - saved timestamp updates
11. On conflict:
   - latest server note is loaded
   - toast offers Restore Draft

## Note Studio Flow

1. User clicks Note Studio button.
2. Desktop:
   - right panel opens in the editor layout.
3. Mobile:
   - rounded floating panel appears.
4. User can configure:
   - language
   - note font
   - text size
   - paper color
   - ruled lines
   - bold
   - italic
   - heading styles
   - script layout visibility
5. User closes Note Studio.

## Script Layout Flow

1. User selects a non-English note language.
2. Note Studio shows script layout controls.
3. User clicks `Show Layout`.
4. On mobile, Note Studio closes so writing remains visible.
5. Script layout appears below the note title.
6. User scrolls script sections horizontally.
7. User taps a character.
8. Character inserts into active title or body caret.
9. If inserting into body, editor keeps caret visible.

## Rich Text Flow

1. User focuses note body.
2. User selects toolbar action:
   - bold
   - italic
   - paragraph
   - heading
3. App restores editor selection.
4. Command applies to the selected text or active block.
5. App syncs normalized HTML and plain text.

## Code Creation Flow

1. User clicks `New Code`.
2. App saves any dirty active note first.
3. Backend creates code entry.
4. Code entry appears in sidebar.
5. Code editor becomes active.

## Code Editing Flow

1. User selects Code mode.
2. User selects a code entry.
3. Code Studio panel shows:
   - line count
   - saved time
   - status
   - code font select
   - Save
   - Finish
4. User edits title and code body.
5. Line numbers update based on line count.
6. Save sends title, code, and revision.
7. Backend handles conflicts like notes.

## Settings Flow

1. User clicks Settings in navbar.
2. Settings page loads workspace preferences.
3. User changes preferences.
4. Preference updates are queued to prevent racing writes.
5. UI shows saving state for the active preference.
6. User can edit workspace identity and security.

## Delete Workspace Flow

1. User clicks Delete Workspace from sidebar.
2. Confirmation dialog appears.
3. User confirms.
4. Backend deletes workspace.
5. Tokens are revoked.
6. User returns to workspace gate.

## Footer Flow

1. Footer shows `Developed by Nikhil`.
2. `Nikhil` is a highlighted link.
3. Hover or focus shows `View portfolio`.
4. Click opens Nikhil portfolio in a new tab.
