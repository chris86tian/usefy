"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Link as LinkIcon, 
  ExternalLink, 
  Clock, 
  MessageSquare,
  Download,
  UploadCloud,
  Loader2,
  X
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import PDFViewerModal from "@/components/PDFViewerModal"
import { Document, Page } from 'react-pdf';
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min.mjs";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
}

interface SubmissionViewerProps {
  submission: Submission
  open: boolean
  onOpenChange: (open: boolean) => void
  onResubmit?: () => void
}

export default function SubmissionViewer({
  submission,
  open,
  onOpenChange,
  onResubmit,
}: SubmissionViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const formattedDate = submission.timestamp ? formatDistanceToNow(new Date(submission.timestamp), { addSuffix: true }) : "Unknown date"

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setIsLoading(false);
    setError(null);
    setNumPages(numPages);
  };
  
  const handleDocumentLoadError = (error: Error) => {
    setIsLoading(false);
    setError('Failed to load PDF. Please check the file URL.');
    console.error('PDF load error:', error);
  };

  return (
    <>
      <Dialog 
        open={open && !selectedFile} 
        onOpenChange={onOpenChange}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                {submission.timestamp && (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>Submitted {formattedDate}</span>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {submission.comment && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Comment</h3>
                </div>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {submission.comment}
                </div>
              </div>
            )}

            {submission.fileUrls && submission.fileUrls.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Files</h3>
                </div>
                <div className="space-y-2">
                  {submission.fileUrls.map((fileUrl, index) => {
                    const fileName = fileUrl.split('/').pop() || `File ${index + 1}`
                    const isPdf = fileName.toLowerCase().endsWith('.pdf')
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <span className="text-sm truncate max-w-[200px]">{fileName}</span>
                        <div className="flex gap-2">
                          {isPdf && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedFile(fileUrl)}
                            >
                              View
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(fileUrl, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {submission.links && submission.links.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Links</h3>
                </div>
                <div className="space-y-2">
                  {submission.links.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                    >
                      <span className="text-sm truncate max-w-[300px]">{link}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="default" 
              onClick={() => {
                onOpenChange(false);
                if (onResubmit) onResubmit();
              }}
            >
              <UploadCloud className="h-4 w-4 mr-2" />
              Resubmit
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedFile && (
        <PDFViewerModal 
          isOpen={!!selectedFile}
          onClose={() => setSelectedFile(null)}
        >
          <div className="bg-background rounded-lg p-6 h-auto max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {selectedFile.split('/').pop()}
              </h3>
              <Button
                className='w-15 h-15'
                onClick={() => setSelectedFile(null)}
              >
                <X className="w-10 h-10" />
              </Button>
            </div>
    
            <div className="relative flex-1 overflow-auto">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
    
              {error && (
                <div className="text-center p-8 text-red-500">
                  {error}
                </div>
              )}
    
              {selectedFile && !error && (
                <Document
                  file={selectedFile}
                  onLoadSuccess={handleDocumentLoadSuccess}
                  onLoadError={handleDocumentLoadError}
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
              )}
    
              {!isLoading && !error && (
                <div className="sticky bottom-0 bg-background border-t pt-4 mt-4 z-50">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 text-gray-800 dark:text-white">
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
    
                    <span className="text-sm text-gray-800 dark:text-white mt-2 mr-7">
                      Page {pageNumber} of {numPages}
                    </span>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2 text-gray-800 dark:text-white">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                        >
                          -
                        </Button>
                        <span className="text-sm w-12 mt-2 text-center">
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
              )}
            </div>
          </div>
        </PDFViewerModal>
      )}
    </>
  )
}
