import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { FileText, X, Loader2 } from "lucide-react";
import CustomModal from "@/components/CustomModal";

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface UploadedFilesProps {
  files: Array<{
    fileId: string;
    title: string;
    description?: string;
    fileUrl?: string;
  }>;
}

const UploadedFiles = ({ files }: UploadedFilesProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedFile) {
      setIsLoading(true);
      setPageNumber(1);
    }
  }, [selectedFile]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setIsLoading(false);
    setNumPages(numPages);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="w-5 h-5" /> Study Materials ({files.length})
      </h3>

      <div className="grid gap-4">
        {files.map((file) => (
          <div key={file.fileId} className="border rounded-lg p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{file.title}</h4>
                {file.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {file.description}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFile(file.fileUrl || null)}
              >
                View PDF
              </Button>
            </div>
          </div>
        ))}
      </div>

      <CustomModal isOpen={!!selectedFile} onClose={() => setSelectedFile(null)}>
        <div className="bg-background rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">
              {files.find(f => f.fileUrl === selectedFile)?.title}
            </h3>
            <Button
              variant="ghost"
              onClick={() => setSelectedFile(null)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="relative flex-1 overflow-auto">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
            
            <Document
              file={selectedFile}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={() => setIsLoading(false)}
              className="pdf-viewer"
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
                className="border rounded bg-white"
                loading={(
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                )}
              />
            </Document>

            <div className="sticky bottom-0 bg-background border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                    disabled={pageNumber >= numPages}
                  >
                    Next
                  </Button>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm">
                    Page {pageNumber} of {numPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                    >
                      -
                    </Button>
                    <span className="text-sm w-12 text-center">
                      {Math.round(scale * 100)}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScale(s => Math.min(2, s + 0.25))}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default UploadedFiles;
