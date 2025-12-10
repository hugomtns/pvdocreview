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
import './DocumentUploadDialog.css';

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface DocumentUploadDialogProps {
  children: React.ReactNode;
}

export function DocumentUploadDialog({ children }: DocumentUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createDocument } = useDocumentStore();
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

      // Create document
      const document = await createDocument({
        name: file.name,
        status: 'draft',
        currentVersionId: '', // Will be updated after version is created
        createdBy: currentUser.id,
      });

      // Create version
      const version: DocumentVersion = {
        id: crypto.randomUUID(),
        documentId: document.id,
        versionNumber: 1,
        fileName: file.name,
        fileType,
        originalFile,
        pdfFile,
        uploadedBy: currentUser.name,
        uploaderRole: currentUser.role,
        uploadedAt: new Date(),
        pageCount: 1, // Placeholder - will be calculated by PDF viewer
      };

      await db.versions.add(version);

      // Update document with current version
      await db.documents.update(document.id, {
        currentVersionId: version.id,
      });

      // Success - close dialog and reset
      setOpen(false);
      setFile(null);
      setError(null);

      // Reload documents to show the new one
      const { loadDocuments } = useDocumentStore.getState();
      await loadDocuments();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setOpen(false);
      setFile(null);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="document-upload-dialog">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a PDF, image (PNG, JPG), or Word document (.docx). Maximum file size: 50MB.
          </DialogDescription>
        </DialogHeader>

        <div className="document-upload-dialog__content">
          <div className="document-upload-dialog__field">
            <Label htmlFor="file-upload">Select File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {file && (
            <div className="document-upload-dialog__file-info">
              <p><strong>Selected file:</strong> {file.name}</p>
              <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Type:</strong> {getFileType(file)}</p>
              {getFileType(file) === 'docx' && (
                <p className="document-upload-dialog__conversion-notice">
                  ℹ This file will be converted to PDF for viewing
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="document-upload-dialog__error">
              {error}
            </div>
          )}

          {uploading && (
            <div className="document-upload-dialog__uploading">
              Uploading{file && getFileType(file) === 'docx' ? ' and converting' : ''}...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
