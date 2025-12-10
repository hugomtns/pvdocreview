import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDocumentStore } from '@/stores/documentStore';
import { useAuthStore } from '@/stores/authStore';
import { convertDocxToPdf } from '@/lib/convertDocx';
import { db } from '@/lib/db';
import type { DocumentVersion } from '@/types';
import './VersionUploadDialog.css';

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface VersionUploadDialogProps {
  documentId: string;
  documentName: string;
  onVersionUploaded?: () => void;
}

export function VersionUploadDialog({ documentId, documentName, onVersionUploaded }: VersionUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { recordWorkflowEvent } = useDocumentStore();
  const currentUser = useAuthStore(state => state.currentUser);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a PDF, image (PNG, JPG), or Word document (.docx)');
      setFile(null);
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds 50MB limit');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const getFileType = (file: File): 'pdf' | 'image' | 'docx' => {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    return 'docx';
  };

  const countPdfPages = async (pdfBlob: Blob): Promise<number> => {
    try {
      const pdfjs = await import('pdfjs-dist');
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages;
    } catch (err) {
      console.error('Failed to count PDF pages:', err);
      return 1;
    }
  };

  const handleUpload = async () => {
    if (!file || !currentUser) return;

    setUploading(true);
    setError(null);

    try {
      const fileType = getFileType(file);
      let pdfFile: Blob = file;
      let originalFile: Blob = file;

      // Convert .docx to PDF
      if (fileType === 'docx') {
        try {
          pdfFile = await convertDocxToPdf(file);
        } catch (conversionError) {
          throw new Error(`Failed to convert Word document: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
        }
      }

      // Get existing versions to determine next version number
      const existingVersions = await db.versions
        .where('documentId')
        .equals(documentId)
        .toArray();

      const maxVersionNumber = Math.max(...existingVersions.map(v => v.versionNumber), 0);
      const newVersionNumber = maxVersionNumber + 1;

      // Count pages
      const pageCount = fileType === 'image' ? 1 : await countPdfPages(pdfFile);

      // Create new version
      const now = new Date();

      console.log('Creating version with currentUser:', currentUser);
      console.log('uploadedBy will be:', currentUser.name);
      console.log('uploaderRole will be:', currentUser.role);

      const newVersion: DocumentVersion = {
        id: crypto.randomUUID(),
        documentId,
        versionNumber: newVersionNumber,
        fileName: file.name,
        fileType: fileType === 'docx' ? 'pdf' : fileType,
        originalFile,
        pdfFile,
        uploadedBy: currentUser.name,
        uploaderRole: currentUser.role,
        uploadedAt: now,
        pageCount,
      };

      console.log('Created newVersion:', newVersion);

      // Save version to database
      await db.versions.add(newVersion);

      // Update document to point to new version as current
      const document = await db.documents.get(documentId);
      if (document) {
        await db.documents.update(documentId, {
          currentVersionId: newVersion.id,
          updatedAt: now,
        });

        // Record workflow event for new version upload
        await recordWorkflowEvent({
          documentId,
          action: 'submit_for_review',
          fromStatus: document.status,
          toStatus: document.status,
          actorId: currentUser.id,
          actorName: currentUser.name,
          comment: `Uploaded version ${newVersionNumber}`,
        });
      }

      // Success!
      setOpen(false);
      setFile(null);

      // Notify parent to refresh
      if (onVersionUploaded) {
        onVersionUploaded();
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload version');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setFile(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Upload New Version
        </Button>
      </DialogTrigger>
      <DialogContent className="version-upload-dialog">
        <DialogHeader>
          <DialogTitle>Upload New Version</DialogTitle>
          <DialogDescription>
            Upload a new version for "{documentName}"
          </DialogDescription>
        </DialogHeader>

        <div className="version-upload-dialog__form">
          <div className="version-upload-dialog__field">
            <Label htmlFor="version-file">Select File</Label>
            <Input
              id="version-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <p className="version-upload-dialog__hint">
              Supported: PDF, PNG, JPG, DOCX (max 50MB)
            </p>
          </div>

          {error && (
            <div className="version-upload-dialog__error">
              {error}
            </div>
          )}

          {file && !error && (
            <div className="version-upload-dialog__file-info">
              <strong>Selected:</strong> {file.name}
              <br />
              <strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
              <br />
              <strong>Type:</strong> {getFileType(file).toUpperCase()}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading || !!error}
          >
            {uploading ? (file && getFileType(file) === 'docx' ? 'Uploading and converting...' : 'Uploading...') : 'Upload Version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
