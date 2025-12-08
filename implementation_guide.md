# PV Document Review POC — Implementation Plan

## Claude Code Instructions

**READ THIS FIRST BEFORE ANY IMPLEMENTATION**

You are implementing a document review application for photovoltaic design teams. This plan is organized into Epics and Stories. Follow these rules strictly:

### Implementation Rules

1. **One story at a time.** Complete and test each story before moving to the next. Do not implement multiple stories in a single session.

2. **One commit per story.** Each story should result in exactly one commit with a clear message referencing the story ID (e.g., `feat(E1-S1): implement mock login UI`).

3. **Test before committing.** Every story has acceptance criteria. Verify all criteria pass before committing. Run the app and manually test the feature.

4. **No premature optimization.** Implement the simplest solution that satisfies the acceptance criteria. Refactoring is a separate task.

5. **Follow the file structure.** Place files in the designated locations. Do not reorganize unless a story explicitly requires it.

6. **CSS in separate files.** No inline styles, no Tailwind. Each component has a corresponding `.css` file. Use BEM naming convention.

7. **Use shadcn/ui components.** Install and use shadcn/ui components where appropriate (buttons, dialogs, inputs, etc.). Customize via CSS variables.

8. **TypeScript strict mode.** All code must be properly typed. No `any` types unless absolutely necessary and documented.

9. **Ask before deviating.** If a story is unclear or you believe a different approach is better, ask before implementing.

### Commit Message Format

```
<type>(story-id): <short description>

<optional body with details>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

---

## Tech Stack Reference

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | React 18 + TypeScript | Strict mode enabled |
| Build | Vite | Default config |
| Components | shadcn/ui | Install as needed per story |
| Styling | Plain CSS (BEM) | Separate .css files per component |
| Storage | IndexedDB via Dexie.js | Local persistence |
| PDF Viewing | react-pdf (PDF.js) | Canvas-based rendering |
| PDF Annotation | Custom canvas overlay | Transparent layer for pins |
| Word → PDF | mammoth.js + jsPDF | Client-side conversion |
| State | Zustand | Lightweight stores |
| Routing | React Router v6 | Standard routing |

---

## File Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components (auto-generated)
│   ├── DocumentViewer/
│   │   ├── DocumentViewer.tsx
│   │   ├── DocumentViewer.css
│   │   ├── AnnotationLayer.tsx
│   │   ├── AnnotationLayer.css
│   │   ├── PageRenderer.tsx
│   │   └── PageRenderer.css
│   ├── CommentPanel/
│   │   ├── CommentPanel.tsx
│   │   ├── CommentPanel.css
│   │   ├── CommentThread.tsx
│   │   ├── CommentThread.css
│   │   ├── CommentInput.tsx
│   │   └── CommentInput.css
│   ├── DocumentList/
│   │   ├── DocumentList.tsx
│   │   ├── DocumentList.css
│   │   ├── DocumentCard.tsx
│   │   └── DocumentCard.css
│   ├── VersionHistory/
│   │   ├── VersionHistory.tsx
│   │   └── VersionHistory.css
│   ├── StatusBadge/
│   │   ├── StatusBadge.tsx
│   │   └── StatusBadge.css
│   ├── RoleGate/
│   │   ├── RoleGate.tsx
│   │   └── RoleGate.css
│   └── Layout/
│       ├── Layout.tsx
│       ├── Layout.css
│       ├── Header.tsx
│       └── Header.css
├── pages/
│   ├── LoginPage.tsx
│   ├── LoginPage.css
│   ├── DocumentListPage.tsx
│   ├── DocumentListPage.css
│   ├── DocumentReviewPage.tsx
│   └── DocumentReviewPage.css
├── stores/
│   ├── authStore.ts
│   ├── documentStore.ts
│   └── commentStore.ts
├── lib/
│   ├── db.ts
│   ├── convertDocx.ts
│   └── permissions.ts
├── types/
│   └── index.ts
├── styles/
│   ├── variables.css          # CSS custom properties (colors, spacing, etc.)
│   ├── reset.css              # CSS reset/normalize
│   └── global.css             # Global styles
├── App.tsx
├── App.css
└── main.tsx
```

---

## Data Models

Define these in `src/types/index.ts`:

```typescript
// User & Auth
export type UserRole = 'viewer' | 'reviewer' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

// Document & Versioning
export type DocumentStatus = 
  | 'draft' 
  | 'in_review' 
  | 'changes_requested' 
  | 'approved' 
  | 'rejected';

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  fileType: 'pdf' | 'image' | 'docx';
  originalFile: Blob;           // Original uploaded file
  pdfFile: Blob;                // PDF for viewing (same as original if PDF/image)
  uploadedBy: string;           // User ID
  uploadedAt: Date;
  pageCount: number;
}

export interface Document {
  id: string;
  name: string;
  status: DocumentStatus;
  currentVersionId: string;
  createdBy: string;            // User ID
  createdAt: Date;
  updatedAt: Date;
}

// Comments & Annotations
export type CommentType = 'location' | 'document';

export interface LocationAnchor {
  page: number;
  x: number;                    // Percentage (0-100) from left
  y: number;                    // Percentage (0-100) from top
}

export interface Comment {
  id: string;
  documentId: string;
  versionId: string;
  type: CommentType;
  anchor?: LocationAnchor;      // Only for location comments
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: Date;
  updatedAt: Date;
  resolved: boolean;
}

// Workflow Actions
export type WorkflowAction = 
  | 'submit_for_review'
  | 'request_approval'
  | 'approve'
  | 'reject'
  | 'request_changes';

export interface WorkflowEvent {
  id: string;
  documentId: string;
  action: WorkflowAction;
  fromStatus: DocumentStatus;
  toStatus: DocumentStatus;
  actorId: string;
  actorName: string;
  comment?: string;
  createdAt: Date;
}
```

---

## Epic 1: Project Setup & Authentication

### E1-S1: Initialize Project

**Description:** Set up the Vite + React + TypeScript project with basic configuration.

**Tasks:**
- Create new Vite project with React + TypeScript template
- Configure TypeScript strict mode
- Set up folder structure as defined above
- Create CSS variables file with initial design tokens
- Create CSS reset file
- Install React Router v6

**Acceptance Criteria:**
- [ ] `npm run dev` starts the development server
- [ ] TypeScript compilation has no errors
- [ ] Folder structure matches the specification
- [ ] `src/styles/variables.css` contains color, spacing, and typography tokens
- [ ] Basic `App.tsx` renders "PV Document Review" heading

**Commit:** `chore(E1-S1): initialize vite project with folder structure`

---

### E1-S2: Install and Configure shadcn/ui

**Description:** Set up shadcn/ui component library for consistent UI components.

**Tasks:**
- Install shadcn/ui CLI and dependencies
- Initialize shadcn/ui with default configuration
- Install initial components: Button, Card, Dialog, Input, Label, Select
- Customize CSS variables to match design tokens

**Acceptance Criteria:**
- [ ] shadcn/ui is initialized and configured
- [ ] Button, Card, Dialog, Input, Label, Select components are available
- [ ] Components render correctly with custom CSS variables
- [ ] No styling conflicts between shadcn/ui and custom CSS

**Commit:** `chore(E1-S2): configure shadcn-ui component library`

---

### E1-S3: Define TypeScript Types

**Description:** Create all TypeScript interfaces and types for the application.

**Tasks:**
- Create `src/types/index.ts` with all type definitions
- Export all types from index file

**Acceptance Criteria:**
- [ ] All types from Data Models section are defined
- [ ] Types compile without errors
- [ ] Types are exported and importable

**Commit:** `feat(E1-S3): define typescript data models`

---

### E1-S4: Set Up Zustand Auth Store

**Description:** Create the authentication store with mock user management.

**Tasks:**
- Install Zustand
- Create `src/stores/authStore.ts`
- Implement mock users (one per role)
- Implement `login(userId)` and `logout()` actions
- Persist selected user to localStorage

**Acceptance Criteria:**
- [ ] Three mock users exist: Viewer, Reviewer, Admin
- [ ] `login()` sets current user in store
- [ ] `logout()` clears current user
- [ ] Selected user persists across page refresh
- [ ] Store is typed correctly

**Mock Users:**
```typescript
const MOCK_USERS: User[] = [
  { id: 'viewer-1', name: 'Alex Viewer', role: 'viewer' },
  { id: 'reviewer-1', name: 'Sam Reviewer', role: 'reviewer' },
  { id: 'admin-1', name: 'Jordan Admin', role: 'admin' },
];
```

**Commit:** `feat(E1-S4): implement zustand auth store with mock users`

---

### E1-S5: Create Login Page

**Description:** Build the mock login page where users select their role/persona.

**Tasks:**
- Create `src/pages/LoginPage.tsx` and `LoginPage.css`
- Display three cards, one per mock user
- Each card shows user name and role badge
- Clicking a card logs in as that user
- After login, redirect to document list

**Acceptance Criteria:**
- [ ] Login page displays at `/login`
- [ ] Three user cards are visible with name and role
- [ ] Clicking a card sets the user in auth store
- [ ] After login, user is redirected to `/documents`
- [ ] Page is styled cleanly using shadcn/ui Card component

**Commit:** `feat(E1-S5): create mock login page with role selection`

---

### E1-S6: Set Up Routing and Layout

**Description:** Configure React Router with protected routes and app layout.

**Tasks:**
- Create `src/components/Layout/Layout.tsx` with header and main content area
- Create `src/components/Layout/Header.tsx` showing current user and logout button
- Configure routes: `/login`, `/documents`, `/documents/:id`
- Implement route protection (redirect to login if not authenticated)

**Acceptance Criteria:**
- [ ] Unauthenticated users are redirected to `/login`
- [ ] Authenticated users see the Layout wrapper
- [ ] Header shows current user name and role badge
- [ ] Logout button clears auth and redirects to `/login`
- [ ] Routes are defined for login, document list, and document review

**Commit:** `feat(E1-S6): implement routing with protected routes and layout`

---

### E1-S7: Create RoleGate Component

**Description:** Build a permission wrapper component for role-based UI control.

**Tasks:**
- Create `src/components/RoleGate/RoleGate.tsx`
- Create `src/lib/permissions.ts` with permission checking utilities
- RoleGate accepts `allowedRoles` prop and renders children only if user has permission
- Support `fallback` prop for alternative content

**Acceptance Criteria:**
- [ ] `<RoleGate allowedRoles={['admin']}>` only renders for admin
- [ ] `<RoleGate allowedRoles={['reviewer', 'admin']}>` renders for both
- [ ] Fallback content renders when user lacks permission
- [ ] Component is typed correctly

**Commit:** `feat(E1-S7): create RoleGate permission component`

---

## Epic 2: Document Storage & Management

### E2-S1: Set Up Dexie.js Database

**Description:** Configure IndexedDB with Dexie for local document storage.

**Tasks:**
- Install Dexie.js
- Create `src/lib/db.ts` with database schema
- Define tables: documents, versions, comments, workflowEvents
- Create database instance

**Acceptance Criteria:**
- [ ] Dexie database initializes without errors
- [ ] All four tables are defined with correct indexes
- [ ] Database instance is exported and usable

**Schema:**
```typescript
db.version(1).stores({
  documents: 'id, status, createdBy, createdAt',
  versions: 'id, documentId, versionNumber, uploadedAt',
  comments: 'id, documentId, versionId, authorId, createdAt',
  workflowEvents: 'id, documentId, createdAt'
});
```

**Commit:** `feat(E2-S1): configure dexie indexeddb schema`

---

### E2-S2: Create Document Store

**Description:** Build Zustand store for document state management with Dexie persistence.

**Tasks:**
- Create `src/stores/documentStore.ts`
- Implement actions: `loadDocuments()`, `getDocument(id)`, `createDocument()`, `updateDocumentStatus()`
- Sync state with Dexie database
- Handle loading and error states

**Acceptance Criteria:**
- [ ] Documents load from IndexedDB on initialization
- [ ] `createDocument()` persists to IndexedDB and updates store
- [ ] `updateDocumentStatus()` updates both store and database
- [ ] Loading state is tracked
- [ ] Store is typed correctly

**Commit:** `feat(E2-S2): implement document zustand store with dexie sync`

---

### E2-S3: Implement Word to PDF Conversion

**Description:** Create client-side conversion from .docx to PDF for viewing.

**Tasks:**
- Install mammoth.js and jsPDF
- Create `src/lib/convertDocx.ts`
- Implement `convertDocxToPdf(file: File): Promise<Blob>`
- Handle conversion errors gracefully

**Acceptance Criteria:**
- [ ] Function accepts .docx File and returns PDF Blob
- [ ] Converted PDF is readable and preserves text content
- [ ] Errors are caught and returned with meaningful messages
- [ ] Basic formatting (paragraphs, headings) is preserved

**Commit:** `feat(E2-S3): implement docx to pdf client-side conversion`

---

### E2-S4: Create Document Upload Flow

**Description:** Build UI for uploading new documents with file validation and conversion.

**Tasks:**
- Create upload dialog/modal using shadcn/ui Dialog
- Accept PDF, images (.png, .jpg, .jpeg), and .docx files
- Validate file type and size (max 50MB)
- Convert .docx to PDF on upload
- Create document and version records in database
- Show upload progress and success/error states

**Acceptance Criteria:**
- [ ] Upload dialog opens from document list page
- [ ] Only valid file types are accepted
- [ ] Files over 50MB show error message
- [ ] .docx files are converted to PDF automatically
- [ ] Document appears in list after successful upload
- [ ] Original file and PDF version are both stored
- [ ] Appropriate loading/success/error feedback shown

**Commit:** `feat(E2-S4): implement document upload with conversion`

---

### E2-S5: Create Document List Page

**Description:** Build the main document dashboard showing all documents.

**Tasks:**
- Create `src/pages/DocumentListPage.tsx` and CSS
- Create `src/components/DocumentList/DocumentCard.tsx` and CSS
- Create `src/components/StatusBadge/StatusBadge.tsx` and CSS
- Display documents in card grid
- Each card shows: name, status badge, version count, dates
- Clicking card navigates to document review page
- Add "Upload Document" button (admin only via RoleGate)

**Acceptance Criteria:**
- [ ] Document list loads and displays all documents
- [ ] Each card shows document name, status, version info
- [ ] Status badge shows correct color per status
- [ ] Clicking card navigates to `/documents/:id`
- [ ] Upload button only visible to admin users
- [ ] Empty state shown when no documents exist

**Commit:** `feat(E2-S5): create document list page with cards`

---

## Epic 3: Document Viewer

### E3-S1: Set Up PDF.js with react-pdf

**Description:** Configure PDF rendering infrastructure.

**Tasks:**
- Install react-pdf and configure worker
- Create `src/components/DocumentViewer/PageRenderer.tsx`
- Render single PDF page to canvas
- Handle loading and error states

**Acceptance Criteria:**
- [ ] PDF.js worker is configured correctly
- [ ] Single PDF page renders to canvas
- [ ] Loading spinner shown while rendering
- [ ] Error message shown if PDF fails to load

**Commit:** `feat(E3-S1): configure react-pdf with page renderer`

---

### E3-S2: Build Multi-Page Document Viewer

**Description:** Create full document viewer with page navigation.

**Tasks:**
- Create `src/components/DocumentViewer/DocumentViewer.tsx` and CSS
- Render all pages in scrollable container
- Add page number indicators
- Support zoom controls (fit width, fit page, percentage)
- Show current page based on scroll position

**Acceptance Criteria:**
- [ ] All PDF pages render in scrollable container
- [ ] Page numbers are visible
- [ ] Zoom controls work (fit width, fit page, 50%, 100%, 150%)
- [ ] Current page indicator updates on scroll
- [ ] Performance is acceptable for 20+ page documents

**Commit:** `feat(E3-S2): build multi-page document viewer with zoom`

---

### E3-S3: Create Document Review Page Shell

**Description:** Build the main review page layout integrating viewer and panels.

**Tasks:**
- Create `src/pages/DocumentReviewPage.tsx` and CSS
- Three-column layout: version sidebar (left), viewer (center), comments (right)
- Load document and current version from store/database
- Display document name and status in header area

**Acceptance Criteria:**
- [ ] Page loads at `/documents/:id`
- [ ] Document data loads from database
- [ ] Three-column layout renders correctly
- [ ] Document name and status displayed
- [ ] Viewer shows current version PDF
- [ ] Responsive: panels collapse on smaller screens

**Commit:** `feat(E3-S3): create document review page layout`

---

### E3-S4: Support Image Document Viewing

**Description:** Extend viewer to handle image files (PNG, JPG).

**Tasks:**
- Detect file type and switch renderer
- Create image renderer component
- Apply same zoom controls to images
- Ensure annotation layer works with images

**Acceptance Criteria:**
- [ ] Image files display in viewer
- [ ] Zoom controls work for images
- [ ] Single "page" for images in page indicator
- [ ] Annotation layer compatible with images

**Commit:** `feat(E3-S4): add image file support to viewer`

---

## Epic 4: Annotations & Comments

### E4-S1: Create Comment Store

**Description:** Build Zustand store for comment management.

**Tasks:**
- Create `src/stores/commentStore.ts`
- Implement: `loadComments(documentId, versionId)`, `addComment()`, `updateComment()`, `resolveComment()`
- Sync with Dexie database
- Track loading state

**Acceptance Criteria:**
- [ ] Comments load for specific document/version
- [ ] New comments persist to database
- [ ] Comments can be marked as resolved
- [ ] Store properly typed

**Commit:** `feat(E4-S1): implement comment zustand store`

---

### E4-S2: Build Annotation Layer

**Description:** Create transparent overlay for placing location-based comments.

**Tasks:**
- Create `src/components/DocumentViewer/AnnotationLayer.tsx` and CSS
- Overlay transparent div on each page
- Track click position as percentage coordinates
- Show pin markers for existing location comments
- Clicking pin highlights corresponding comment

**Acceptance Criteria:**
- [ ] Transparent layer overlays each page
- [ ] Clicking captures x/y percentage coordinates
- [ ] Existing comments show as numbered pins
- [ ] Pins are positioned correctly regardless of zoom
- [ ] Clicking pin scrolls comment panel to that comment

**Commit:** `feat(E4-S2): create annotation overlay with pin markers`

---

### E4-S3: Build Comment Panel

**Description:** Create sidebar panel for viewing and adding comments.

**Tasks:**
- Create `src/components/CommentPanel/CommentPanel.tsx` and CSS
- Create `src/components/CommentPanel/CommentThread.tsx` and CSS
- Two sections: location comments (with page/pin reference), document comments
- Each comment shows: author, role badge, timestamp, content
- Sort by creation date

**Acceptance Criteria:**
- [ ] Panel shows all comments for current version
- [ ] Location comments show page number and pin indicator
- [ ] Document comments in separate section
- [ ] Author name, role badge, and timestamp visible
- [ ] Comments sorted chronologically
- [ ] Clicking location comment highlights pin on page

**Commit:** `feat(E4-S3): build comment panel with threads`

---

### E4-S4: Implement Comment Creation

**Description:** Add ability to create new comments.

**Tasks:**
- Create `src/components/CommentPanel/CommentInput.tsx` and CSS
- "Add comment" button opens input (document-level)
- Clicking on annotation layer prompts for comment (location-level)
- Enforce role permissions (viewer cannot comment)
- Save comment to store/database

**Acceptance Criteria:**
- [ ] Document-level comment can be added via button
- [ ] Location comment created by clicking on page
- [ ] Comment input shows shadcn/ui textarea and submit button
- [ ] Viewer role cannot add comments (button hidden)
- [ ] New comments appear immediately in panel
- [ ] Comments persist across page refresh

**Commit:** `feat(E4-S4): implement comment creation for both types`

---

### E4-S5: Add Comment Resolution

**Description:** Allow marking comments as resolved.

**Tasks:**
- Add "Resolve" button to comment thread (reviewer/admin only)
- Resolved comments show strikethrough or muted styling
- Add filter toggle: show/hide resolved comments
- Resolved pins show different color on annotation layer

**Acceptance Criteria:**
- [ ] Resolve button visible for reviewer and admin
- [ ] Resolved comments visually distinguished
- [ ] Filter toggle works
- [ ] Resolved pins show in grey/muted color
- [ ] Viewer cannot resolve comments

**Commit:** `feat(E4-S5): add comment resolution functionality`

---

## Epic 5: Review Workflow

### E5-S1: Create Workflow Event Logging

**Description:** Build infrastructure for tracking workflow state changes.

**Tasks:**
- Create workflow event recording in document store
- Log: action, from/to status, actor, timestamp, optional comment
- Query events by document ID

**Acceptance Criteria:**
- [ ] Workflow events saved to database
- [ ] Events linked to document ID
- [ ] Events include all required fields
- [ ] Events retrievable by document

**Commit:** `feat(E5-S1): implement workflow event logging`

---

### E5-S2: Build Status Change UI

**Description:** Create UI for workflow actions based on current status and role.

**Tasks:**
- Add workflow action buttons to document review page header
- Show appropriate actions based on current status and user role
- Confirmation dialog before status change
- Optional comment field for status change

**Action Matrix:**

| Current Status | Viewer | Reviewer | Admin |
|---------------|--------|----------|-------|
| Draft | - | Submit for Review | Submit for Review, Approve |
| In Review | - | Request Approval | Approve, Reject, Request Changes |
| Changes Requested | - | Submit for Review | Submit for Review, Approve |
| Approved | - | - | - |
| Rejected | - | - | Reopen (→ Draft) |

**Acceptance Criteria:**
- [ ] Correct buttons shown per status/role combination
- [ ] Confirmation dialog appears before action
- [ ] Optional comment can be added
- [ ] Status updates after confirmation
- [ ] Workflow event is logged

**Commit:** `feat(E5-S2): build status change ui with role permissions`

---

### E5-S3: Display Workflow History

**Description:** Show timeline of workflow events on document.

**Tasks:**
- Create workflow history section in document review page
- Display events as timeline
- Show: action, actor, timestamp, comment

**Acceptance Criteria:**
- [ ] Workflow history visible on review page
- [ ] Events shown in chronological order
- [ ] Each event shows action, who, when, and comment if present
- [ ] Timeline updates after new status change

**Commit:** `feat(E5-S3): display workflow event history timeline`

---

## Epic 6: Versioning

### E6-S1: Create Version History Panel

**Description:** Build sidebar panel showing all versions of a document.

**Tasks:**
- Create `src/components/VersionHistory/VersionHistory.tsx` and CSS
- List all versions with: version number, uploader, date
- Highlight current version being viewed
- Click to switch viewed version

**Acceptance Criteria:**
- [ ] All versions listed in descending order (newest first)
- [ ] Current version highlighted
- [ ] Clicking version loads that version in viewer
- [ ] Comments panel updates to show version-specific comments

**Commit:** `feat(E6-S1): create version history panel`

---

### E6-S2: Implement Version Upload

**Description:** Allow admin to upload new versions of a document.

**Tasks:**
- Add "Upload New Version" button (admin only)
- Reuse upload dialog with version context
- Increment version number automatically
- Set new version as current version
- Log workflow event for new version

**Acceptance Criteria:**
- [ ] Upload button visible only to admin
- [ ] New version increments version number
- [ ] New version becomes current version
- [ ] Version appears in history panel
- [ ] Previous versions remain accessible
- [ ] Workflow event logged

**Commit:** `feat(E6-S2): implement new version upload for admin`

---

### E6-S3: Add Version Comparison Indicator

**Description:** Help users understand which version comments belong to.

**Tasks:**
- Show version badge on each comment
- When viewing old version, show banner indicating it's not current
- Add "View current version" quick action

**Acceptance Criteria:**
- [ ] Comments show version number badge
- [ ] Banner appears when viewing non-current version
- [ ] "View current version" link works
- [ ] Clear visual distinction between current and historical versions

**Commit:** `feat(E6-S3): add version context indicators`

---

## Epic 7: Polish & Testing

### E7-S1: Empty States and Loading States

**Description:** Add proper feedback for all loading and empty scenarios.

**Tasks:**
- Loading skeletons for document list
- Loading spinner for document viewer
- Empty state for no documents
- Empty state for no comments
- Error boundaries with friendly messages

**Acceptance Criteria:**
- [ ] All async operations show loading feedback
- [ ] Empty states have helpful messages and actions
- [ ] Errors don't crash the app
- [ ] Error messages are user-friendly

**Commit:** `feat(E7-S1): add loading and empty states throughout`

---

### E7-S2: Keyboard Navigation and Accessibility

**Description:** Ensure basic accessibility standards are met.

**Tasks:**
- Add keyboard navigation for major actions
- Ensure focus management in dialogs
- Add aria-labels to interactive elements
- Test with screen reader

**Acceptance Criteria:**
- [ ] Tab navigation works logically
- [ ] Dialogs trap focus correctly
- [ ] Interactive elements have labels
- [ ] No critical accessibility errors

**Commit:** `feat(E7-S2): improve keyboard navigation and accessibility`

---

### E7-S3: Responsive Layout Adjustments

**Description:** Ensure usability on tablet-sized screens.

**Tasks:**
- Test on 1024px and 768px viewports
- Collapse sidebars to toggleable panels on smaller screens
- Ensure touch targets are adequate size
- Maintain core functionality on smaller screens

**Acceptance Criteria:**
- [ ] Usable at 1024px width
- [ ] Sidebars collapse with toggle buttons at 768px
- [ ] Touch targets minimum 44px
- [ ] No horizontal scrolling

**Commit:** `feat(E7-S3): add responsive layout for tablets`

---

### E7-S4: Final Review and Documentation

**Description:** Clean up code and document for handoff.

**Tasks:**
- Remove console.logs and dead code
- Add README with setup instructions
- Document mock users and test scenarios
- Add inline comments for complex logic

**Acceptance Criteria:**
- [ ] No console warnings or errors
- [ ] README explains how to run the app
- [ ] Test scenarios documented
- [ ] Code is clean and commented where needed

**Commit:** `docs(E7-S4): add documentation and clean up code`

---

## Story Checklist Template

Use this for each story:

```markdown
## Story: [ID] - [Title]

### Before Starting
- [ ] Read story description and acceptance criteria
- [ ] Understand dependencies (previous stories complete?)
- [ ] Identify files to create/modify

### Implementation
- [ ] Create/modify files per specification
- [ ] Follow CSS and TypeScript conventions
- [ ] Use shadcn/ui components where appropriate

### Testing
- [ ] Run `npm run dev` - no console errors
- [ ] Run `npm run build` - no TypeScript errors
- [ ] Manually test all acceptance criteria
- [ ] Test with each role (viewer/reviewer/admin) if relevant

### Commit
- [ ] Stage only files related to this story
- [ ] Write commit message: `<type>(story-id): description`
- [ ] Commit

### Done
- [ ] All acceptance criteria pass
- [ ] Code is clean and follows conventions
- [ ] Ready for next story
```

---

## Quick Reference: Role Permissions

| Action | Viewer | Reviewer | Admin |
|--------|--------|----------|-------|
| View documents | ✓ | ✓ | ✓ |
| View comments | ✓ | ✓ | ✓ |
| Add comments | ✗ | ✓ | ✓ |
| Resolve comments | ✗ | ✓ | ✓ |
| Request approval | ✗ | ✓ | ✓ |
| Approve/Reject | ✗ | ✗ | ✓ |
| Upload documents | ✗ | ✗ | ✓ |
| Upload new version | ✗ | ✗ | ✓ |
| Change status | ✗ | Limited | Full |

---

## Status Transitions

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
┌───────┐     ┌───────────┐     ┌──────────┐            │
│ Draft │────▶│ In Review │────▶│ Approved │            │
└───────┘     └───────────┘     └──────────┘            │
    ▲               │                                    │
    │               │                                    │
    │               ▼                                    │
    │         ┌───────────────────┐                     │
    └─────────│ Changes Requested │                     │
              └───────────────────┘                     │
                                                        │
              ┌──────────┐                              │
              │ Rejected │──────────────────────────────┘
              └──────────┘        (Admin reopen)
```

---

*End of Implementation Plan*