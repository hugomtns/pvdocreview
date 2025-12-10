# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PV Document Review is a comprehensive document review and approval system for photovoltaic (PV) project documentation. It features role-based access control, version management, PDF/image viewing with annotations, and a workflow-driven approval process. All data is stored locally in IndexedDB (no backend).

## Development Commands

### Essential Commands
```bash
# Development server (opens on http://localhost:5173)
npm run dev

# Production build (outputs to dist/)
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Testing Changes
1. Always run `npm run dev` and manually test changes in browser
2. Run `npm run build` to catch TypeScript errors before committing
3. Test with all three user roles: viewer, reviewer, admin (available on /login)

## Architecture Overview

### Tech Stack
- **Framework**: React 18 + TypeScript (strict mode)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 + custom BEM CSS (separate .css files per component)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand (3 stores: auth, document, comment)
- **Database**: Dexie.js (IndexedDB wrapper)
- **Routing**: React Router v6
- **PDF Rendering**: react-pdf (PDF.js)
- **Document Conversion**: mammoth.js (docx → HTML) + jsPDF (HTML → PDF)

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── CommentPanel/    # Comment display, input, filtering
│   ├── DocumentList/    # Document grid with cards
│   ├── DocumentViewer/  # PDF/image viewer + annotation layer
│   ├── Drawing/         # Visual markup tools (shapes, colors)
│   ├── Layout/          # App layout and header
│   ├── VersionHistory/  # Version selection sidebar
│   ├── WorkflowActions/ # Status change buttons
│   ├── WorkflowHistory/ # Timeline of workflow events
│   ├── RoleGate/        # Permission wrapper component
│   └── ui/              # shadcn/ui primitives
├── pages/               # Page-level components
│   ├── LoginPage.tsx            # Mock role selection
│   ├── DocumentListPage.tsx     # Document grid + upload
│   └── DocumentReviewPage.tsx   # Main review interface
├── stores/              # Zustand state management
│   ├── authStore.ts     # User authentication state
│   ├── documentStore.ts # Document & workflow management
│   └── commentStore.ts  # Comment & annotation management
├── lib/                 # Utilities and database
│   ├── db.ts           # Dexie database schema (4 tables)
│   ├── permissions.ts  # Role-based permission checks
│   ├── convertDocx.ts  # Word to PDF conversion
│   └── utils.ts        # General utilities
├── types/              # TypeScript type definitions
│   └── index.ts        # All shared types
└── App.tsx             # Routing configuration
```

### Path Aliases
Use `@/` prefix for all imports:
```typescript
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { useAuthStore } from '@/stores/authStore';
```

## State Management

### Three Zustand Stores

#### 1. Auth Store (`authStore.ts`)
- **Purpose**: Manages current user and mock authentication
- **State**: `currentUser: User | null`, `mockUsers: User[]`
- **Actions**: `login(userId)`, `logout()`
- **Persistence**: localStorage (key: `pv-docreview-user`)
- **Mock Users**:
  - `viewer-1`: Alex Viewer (view only)
  - `reviewer-1`: Sam Reviewer (comment + workflow)
  - `admin-1`: Jordan Admin (full access)

#### 2. Document Store (`documentStore.ts`)
- **Purpose**: Manages documents and workflow
- **State**: `documents: Document[]`, `loading`, `error`
- **Actions**:
  - `loadDocuments()` - fetch all from IndexedDB
  - `getDocument(id)` - get single document
  - `createDocument(data)` - create new document
  - `updateDocumentStatus(id, status)` - change workflow status
  - `recordWorkflowEvent(event)` - log status change
  - `getWorkflowEvents(documentId)` - get workflow history
- **Persistence**: IndexedDB via Dexie

#### 3. Comment Store (`commentStore.ts`)
- **Purpose**: Manages comments and annotations
- **State**: `comments: Comment[]`, `currentDocumentId`, `currentVersionId`, `loading`, `error`
- **Actions**:
  - `loadComments(documentId, versionId)` - load for document
  - `addComment(comment)` - create new comment
  - `updateComment(id, content)` - edit comment
  - `resolveComment(id)` / `unresolveComment(id)` - toggle resolution
  - `clearComments()` - reset state
- **Key Behavior**: Loads ALL comments across ALL versions (comments have version badges)

## Database Schema (Dexie/IndexedDB)

Database name: **PVDocReviewDB** (current version: 4)

### Tables

#### `documents`
```typescript
{
  id: string              // Primary key
  name: string
  status: DocumentStatus  // draft | in_review | changes_requested | approved | rejected
  currentVersionId: string
  createdBy: string       // User ID
  createdAt: Date
  updatedAt: Date
}
// Indexes: id, status, createdBy, createdAt
```

#### `versions`
```typescript
{
  id: string
  documentId: string      // FK to documents
  versionNumber: number
  fileName: string
  fileType: 'pdf' | 'image' | 'docx'
  originalFile: Blob      // Raw uploaded file
  pdfFile: Blob          // Converted/displayable PDF
  uploadedBy: string      // Display name (e.g., "Jordan Admin")
  uploaderRole: UserRole
  uploadedAt: Date
  pageCount: number
}
// Indexes: id, documentId, versionNumber, uploadedAt, uploaderRole
```

#### `comments`
```typescript
{
  id: string
  documentId: string      // FK to documents
  versionId: string       // FK to versions
  type: 'location' | 'document'
  anchor?: LocationAnchor // For location comments
  content: string
  authorId: string
  authorName: string
  authorRole: UserRole
  createdAt: Date
  updatedAt: Date
  resolved: boolean
  isPrivate: boolean      // Visible only to author + admin
}
// Indexes: id, documentId, versionId, authorId, createdAt, isPrivate
```

#### `workflowEvents`
```typescript
{
  id: string
  documentId: string
  action: WorkflowAction
  fromStatus: DocumentStatus
  toStatus: DocumentStatus
  actorId: string
  actorName: string
  comment?: string        // Optional reason
  createdAt: Date
}
// Indexes: id, documentId, createdAt
```

## Key Features and Workflows

### 1. Document Workflow States
```
DRAFT → (submit_for_review) → IN_REVIEW
                                  ↓
                    ┌─────────────┼─────────────┐
                    ↓             ↓             ↓
            CHANGES_REQUESTED  APPROVED    REJECTED
                    ↓
            (submit_for_review)
                    ↓
               IN_REVIEW
```

**Permissions by Role:**
- **Viewer**: View only
- **Reviewer**: Submit for review, request approval
- **Admin**: All workflow actions (approve, reject, request changes)

### 2. Comment System

**Two Types:**
1. **Location Comments** - anchored to specific page coordinates with visual pins
2. **Document Comments** - general comments about entire document

**LocationAnchor Structure:**
```typescript
{
  page: number          // Page number (0-indexed)
  x: number            // Percentage (0-100) from left
  y: number            // Percentage (0-100) from top
  isHighlight?: boolean // Point vs highlight
  x2?: number          // Highlight right extent
  y2?: number          // Highlight bottom extent
  color?: string       // Highlight color
}
```

**Privacy:**
- Public comments: visible to all users
- Private comments: visible only to author + admin
- Controlled via `isPrivate` flag

**Resolution:**
- Reviewers and admins can resolve/unresolve comments
- Resolved comments shown with strikethrough/muted styling
- Filter toggle: show/hide resolved comments

### 3. Annotation System

**Annotation Mode** (for adding location comments):
- Enable: Press `A` key or click "Annotation Mode" button
- Point annotation: Click on page
- Highlight annotation: Click and drag (minimum 2% distance)
- Exit: Press `Esc` or disable button

**Drawing Mode** (visual markup, not persisted):
- Shape types: Rectangle, Circle, Freehand
- 8 preset colors
- 3 stroke widths: 2px, 4px, 7px
- Select and delete individual shapes
- Clear all button

### 4. Version Management

**Upload Flow:**
```
Admin selects file → Validate type/size → Convert .docx to PDF (if needed)
  → Create DocumentVersion → Update currentVersionId → Store in IndexedDB
```

**Version Navigation:**
- Arrow keys: `←` previous (older), `→` next (newer)
- Click version cards in sidebar
- Current version has badge indicator
- Old version banner with "View Current Version" link

**Comment Persistence:**
- Comments from all versions visible with version badges (v1, v2, etc.)
- Helps track which version feedback relates to

### 5. Document Upload

**Supported Formats:**
- PDF (direct viewing)
- Images: PNG, JPG, JPEG (direct viewing)
- DOCX (converted to PDF via mammoth.js + jsPDF)

**Validation:**
- Max file size: 50MB
- Admin-only permission

**Conversion Pipeline for .docx:**
1. File → mammoth.js → HTML
2. HTML → jsPDF → PDF Blob
3. Store both originalFile (Blob) and pdfFile (Blob)

## Role-Based Permissions

### Permission Matrix
| Action                | Viewer | Reviewer | Admin |
|-----------------------|--------|----------|-------|
| View documents        | ✓      | ✓        | ✓     |
| View comments         | ✓      | ✓        | ✓     |
| Add comments          | ✗      | ✓        | ✓     |
| Resolve comments      | ✗      | ✓        | ✓     |
| Toggle annotation     | ✗      | ✓        | ✓     |
| Submit for review     | ✗      | ✓        | ✓     |
| Request approval      | ✗      | ✓        | ✓     |
| Approve/reject        | ✗      | ✗        | ✓     |
| Upload documents      | ✗      | ✗        | ✓     |
| Upload new version    | ✗      | ✗        | ✓     |

### Implementation

**RoleGate Component** (wrapper for conditional rendering):
```tsx
<RoleGate allowedRoles={['admin']}>
  <Button>Upload Document</Button>
</RoleGate>
```

**Permission Utilities** (`lib/permissions.ts`):
```typescript
hasPermission(userRole, allowedRoles): boolean
canAddComments(role): boolean
canResolveComments(role): boolean
canApproveReject(role): boolean  // admin only
canUploadDocuments(role): boolean  // admin only
```

**Comment Visibility**:
- Private comments filtered in component
- Only author + admin can view private comments
- Check performed before rendering CommentThread

## Styling Guidelines

### Tailwind CSS v4
- Primary styling method
- Custom CSS variables in `src/index.css`
- shadcn/ui uses Tailwind internally

### Custom CSS (BEM Convention)
- Each component CAN have a `.css` file for custom styles
- Use BEM naming: `.block__element--modifier`
- Example: `.comment-panel__thread--resolved`

### shadcn/ui Components
- Pre-built accessible components (Button, Dialog, Input, Card, etc.)
- Located in `src/components/ui/`
- Install new components: `npx shadcn@latest add [component]`
- Customize via CSS variables in `src/index.css`

## Important Implementation Notes

### TypeScript Strict Mode
- All code must be properly typed
- Avoid `any` unless absolutely necessary and documented
- Use `noUncheckedIndexedAccess: true` - always check array access
- Path aliases use `@/` prefix

### Database Migrations
- Current schema version: 4
- When adding new fields, create new version in `db.ts`:
  ```typescript
  this.version(5).stores({ ... }).upgrade(tx => {
    // Migration logic here
  });
  ```
- Never modify existing version definitions

### PDF.js Worker
- Configured in Vite config and PDF viewer
- Required for react-pdf to work
- Worker files copied to public during build

### IndexedDB Considerations
- All data stored locally in browser
- No backend/API calls
- Blob storage for files (PDFs, images)
- Database cleared if user clears browser data

### Keyboard Shortcuts
User-facing shortcuts (document in README.md):
- `A` - Toggle annotation mode
- `Esc` - Exit annotation mode
- `←/→` - Navigate versions
- `Ctrl/Cmd + Enter` - Submit forms

### Performance Considerations
- PDF rendering can be slow for large documents (20+ pages)
- Blobs stored in IndexedDB increase database size
- Consider pagination or lazy loading for document lists with many items

## Common Development Tasks

### Adding a New shadcn/ui Component
```bash
npx shadcn@latest add [component-name]
```
This installs the component in `src/components/ui/`

### Adding a New Permission Check
1. Add function to `src/lib/permissions.ts`
2. Use in component:
   ```tsx
   const canDoAction = canDoAction(currentUser?.role);
   if (!canDoAction) return null;
   ```
3. Or wrap with RoleGate:
   ```tsx
   <RoleGate allowedRoles={['admin', 'reviewer']}>
     <ActionButton />
   </RoleGate>
   ```

### Adding a New Document Status
1. Update `DocumentStatus` type in `src/types/index.ts`
2. Update workflow logic in `documentStore.ts`
3. Update StatusBadge component to handle new status
4. Update WorkflowActions to show appropriate buttons
5. Consider migration if database already has documents

### Adding a New Field to a Database Table
1. Update TypeScript interface in `src/types/index.ts`
2. Create new version in `src/lib/db.ts`:
   ```typescript
   this.version(5).stores({
     // Update index definition if field is indexed
     tableName: 'id, existingIndex, newFieldIndex'
   }).upgrade(tx => {
     // Add default value to existing records
     return tx.table('tableName').toCollection().modify(record => {
       record.newField = defaultValue;
     });
   });
   ```
3. Update store actions to handle new field

### Debugging IndexedDB
1. Open browser DevTools → Application → Storage → IndexedDB
2. Expand `PVDocReviewDB` to see tables
3. Click table to view records
4. Right-click database to delete for fresh start

### Testing with Different Roles
1. Navigate to `/login`
2. Click user card for desired role
3. Test feature with that role
4. Logout and switch roles to verify permissions

## Code Patterns and Conventions

### Store Usage Pattern
```typescript
// In component
const { documents, loadDocuments } = useDocumentStore();

useEffect(() => {
  loadDocuments();
}, [loadDocuments]);
```

### Dexie Database Operations
```typescript
// Create
await db.documents.add(newDocument);

// Read
const doc = await db.documents.get(id);
const allDocs = await db.documents.toArray();

// Update
await db.documents.update(id, { status: 'approved' });

// Delete
await db.documents.delete(id);

// Query
const drafts = await db.documents.where('status').equals('draft').toArray();
```

### File Blob Handling
```typescript
// Store file as Blob in IndexedDB
const blob = new Blob([file], { type: file.type });
await db.versions.add({ ...versionData, pdfFile: blob });

// Retrieve and create URL for viewing
const version = await db.versions.get(versionId);
const url = URL.createObjectURL(version.pdfFile);
// Remember to revoke: URL.revokeObjectURL(url)
```

### React Router Navigation
```typescript
// In component
const navigate = useNavigate();
navigate('/documents');
navigate(`/documents/${documentId}`);

// With state
navigate('/documents', { state: { message: 'Upload successful' } });
```

## Troubleshooting

### Build Errors
- **TypeScript errors**: Run `npm run build` to see all type errors
- **Missing types**: Ensure all imports use `@/` prefix and paths are correct
- **Strict mode**: Check for `undefined` values with optional chaining (`?.`)

### Runtime Errors
- **PDF not rendering**: Check browser console for PDF.js worker errors
- **Database errors**: Check IndexedDB in DevTools, may need to clear and refresh
- **Permission errors**: Verify current user role in auth store

### Performance Issues
- Large PDFs (50+ pages) may render slowly
- Consider reducing page rendering or implementing virtualization
- Check browser memory usage in DevTools

## Implementation Guide Reference

The `implementation_guide.md` file contains the original Epic/Story-based implementation plan. It follows a strict one-story-at-a-time approach with commit conventions. Use it as reference for:
- Historical implementation order
- Acceptance criteria for features
- Commit message format
- Testing checklists

However, the codebase is now complete and in active use. When making changes:
- Focus on the feature/fix at hand
- Follow existing patterns and conventions
- Test with all three roles
- Run build before committing
