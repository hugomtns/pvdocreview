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
  x: number;                    // Percentage (0-100) from left - single point OR top-left of highlight
  y: number;                    // Percentage (0-100) from top - single point OR top-left of highlight
  isHighlight?: boolean;        // Flag for highlight vs point (default: false)
  x2?: number;                  // Bottom-right x (for highlights)
  y2?: number;                  // Bottom-right y (for highlights)
  color?: string;               // Highlight color (default: #FFFF0080 - semi-transparent yellow)
}

// Drawing Shapes
export type ShapeType = 'circle' | 'rectangle';

export interface DrawingShape {
  id: string;
  type: ShapeType;
  page: number;
  color: string;                // Hex color code (e.g., '#FF0000')
  strokeWidth: number;          // 1-5px
  fill?: string;                // Optional fill color (semi-transparent)
  bounds: {
    x1: number;                 // Percentage (0-100) from left
    y1: number;                 // Percentage (0-100) from top
    x2: number;                 // Percentage (0-100) from left
    y2: number;                 // Percentage (0-100) from top
  };
}

export interface Comment {
  id: string;
  documentId: string;
  versionId: string;
  type: CommentType;
  anchor?: LocationAnchor;      // Only for location comments
  drawing?: DrawingShape;       // Optional drawing attached to comment
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: Date;
  updatedAt: Date;
  resolved: boolean;
  isPrivate: boolean;           // Default: false (public)
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
