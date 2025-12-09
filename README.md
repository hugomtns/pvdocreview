# PV Document Review Application

A comprehensive document review and approval system for photovoltaic (PV) project documentation, built with React, TypeScript, and IndexedDB.

## Features

### Authentication & Authorization
- Role-based access control (Viewer, Reviewer, Admin)
- Secure login system
- Protected routes based on user roles

### Document Management
- Upload and manage PDF, image (PNG/JPG), and Word (.docx) documents
- Automatic .docx to PDF conversion
- Version control with full history
- Document status workflow (Draft → In Review → Approved/Changes Requested)

### Document Viewing
- PDF and image viewer with zoom controls
- Page-by-page navigation
- Annotation support with location-based comments
- Support for multiple file formats

### Comments & Collaboration
- Location-based comments with visual pins
- Document-level comments
- Comment resolution workflow
- Comments persist across versions with version badges
- Real-time comment status tracking

### Workflow Management
- Status-based workflow with configurable actions
- Workflow history timeline
- Approval/rejection with optional comments
- Role-based action permissions

### Version Control
- Upload new document versions
- Version history panel
- Compare versions with visual indicators
- Version-specific comments with badges

### Accessibility
- Keyboard navigation support
  - `A` - Toggle annotation mode
  - `Esc` - Exit annotation mode
  - `←/→` - Navigate between versions
  - `Ctrl/Cmd + Enter` - Submit forms
- ARIA labels for screen readers
- Touch-friendly interface (44px minimum touch targets)
- Responsive design for mobile and tablet

## Tech Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4 with custom BEM CSS
- **UI Components:** shadcn/ui
- **State Management:** Zustand
- **Database:** Dexie.js (IndexedDB wrapper)
- **Routing:** React Router v6
- **PDF Rendering:** react-pdf (PDF.js)
- **Document Conversion:** mammoth.js + jsPDF

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/hugomtns/pvdocreview.git
cd pvdocreview
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

4. Build for production
```bash
npm run build
```

## Usage

### User Roles

**Viewer**
- View documents
- View comments
- Read-only access

**Reviewer**
- All Viewer permissions
- Add comments (location and document-level)
- Resolve/unresolve comments
- Toggle annotation mode
- Submit documents for review

**Admin**
- All Reviewer permissions
- Upload new documents
- Upload new versions
- Approve/reject documents
- Full workflow control

### Keyboard Shortcuts

- `A` - Toggle annotation mode (when not typing)
- `Esc` - Exit annotation mode
- `←` - Navigate to previous (older) version
- `→` - Navigate to next (newer) version
- `Ctrl/Cmd + Enter` - Submit comment or workflow action

### Workflow States

1. **Draft** - Initial state
2. **In Review** - Submitted for review
3. **Changes Requested** - Needs revisions
4. **Approved** - Final approval

### Adding Comments

**Location Comments:**
1. Enable annotation mode (click "+ Annotation Mode" or press `A`)
2. Click on the document where you want to comment
3. Enter your comment text
4. Submit with `Ctrl/Cmd + Enter` or click button

**Document Comments:**
1. Open the Comments panel (right sidebar)
2. Click "+ Add Document Comment"
3. Enter your comment
4. Submit

### Managing Versions

**Uploading New Version (Admin only):**
1. Click "Upload New Version" button
2. Select file (PDF, PNG, JPG, or DOCX)
3. File is automatically converted if needed
4. New version becomes current version
5. Old comments remain visible with version badges

**Viewing Previous Versions:**
1. Open Versions panel (left sidebar)
2. Click on any version to view it
3. Warning banner appears when viewing old version
4. Click "View Current Version" to return

## Project Structure

```
src/
├── components/         # React components
│   ├── CommentPanel/   # Comment display and input
│   ├── DocumentList/   # Document grid display
│   ├── DocumentViewer/ # PDF and image viewers
│   ├── VersionHistory/ # Version management
│   ├── WorkflowActions/# Status change controls
│   └── ...
├── pages/             # Page components
│   ├── LoginPage.tsx
│   ├── DocumentListPage.tsx
│   └── DocumentReviewPage.tsx
├── stores/            # Zustand state management
│   ├── authStore.ts
│   ├── commentStore.ts
│   └── documentStore.ts
├── lib/               # Utilities and database
│   ├── db.ts          # Dexie database schema
│   └── convertDocx.ts # Document conversion
└── types/             # TypeScript type definitions
    └── index.ts
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Contributing

Contributions are welcome! Please ensure all tests pass and follow the existing code style.
