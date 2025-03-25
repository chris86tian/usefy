import { useState, useEffect } from 'react';
import { Document, Page, } from 'react-pdf';
import { Button } from "@/components/ui/button";
import { FileText, X, Loader2, CheckCircle, ExternalLink, Link as LinkIcon, MessageSquare } from "lucide-react";
import * as pdfjs from "pdfjs-dist"
import "pdfjs-dist/build/pdf.worker.min.mjs";
import PDFViewerModal from '@/components/PDFViewerModal';
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`
}
else {
  pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.min.mjs"
}


interface UploadedFilesProps {
  files: Array<{
    fileId: string;
    title: string;
    description?: string;
    fileUrl: string;
  }>;
  submissions?: Array<{
    submissionId: string;
    userId: string;
    comment?: string;
    fileUrls?: string[];
    links?: string[];
    timestamp?: string;
    userName?: string;
  }>;
  showSubmissions?: boolean;
}

const UploadedFiles = ({ files, submissions = [], showSubmissions = false }: UploadedFilesProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(showSubmissions && submissions.length > 0 ? "submissions" : "materials");

  const documentOptions = useMemo(() => ({
    httpHeaders: {
      'Access-Control-Allow-Origin': '*',
    },
  }), []);

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
    <div className="space-y-4">
      {(showSubmissions && submissions.length > 0) ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materials">
              Study Materials {files.length ? `(${files.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="submissions">
              Submissions {submissions.length ? `(${submissions.length})` : ""}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="materials" className="mt-4">
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
                      onClick={() => {
                        if (file.fileUrl) {
                          setError(null);
                          setIsLoading(true);
                          setSelectedFile(file.fileUrl);
                        }
                      }}
                    >
                      View PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="submissions" className="mt-4">
            <div className="grid gap-4">
              {submissions.map((submission) => (
                <Card key={submission.submissionId} className="border shadow-sm">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <CardTitle className="text-sm font-medium">
                          {submission.userName || "Anonymous User"}
                        </CardTitle>
                      </div>
                      {submission.timestamp && (
                        <Badge variant="outline" className="text-xs">
                          {formatDistanceToNow(new Date(submission.timestamp), { addSuffix: true })}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {submission.comment && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <MessageSquare className="h-3 w-3" />
                          <span>Comment</span>
                        </div>
                        <div className="p-3 bg-muted rounded-md text-sm">
                          {submission.comment}
                        </div>
                      </div>
                    )}
                    
                    {submission.fileUrls && submission.fileUrls.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <FileText className="h-3 w-3" />
                          <span>Files</span>
                        </div>
                        <div className="space-y-2">
                          {submission.fileUrls.map((fileUrl, index) => {
                            const fileName = fileUrl.split('/').pop() || `File ${index + 1}`;
                            const isPdf = fileName.toLowerCase().endsWith('.pdf');
                            
                            return (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <span className="text-sm truncate max-w-[200px]">{fileName}</span>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    if (isPdf) {
                                      setSelectedFile(fileUrl);
                                    } else {
                                      window.open(fileUrl, '_blank');
                                    }
                                  }}
                                >
                                  {isPdf ? 'View' : 'Download'}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {submission.links && submission.links.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <LinkIcon className="h-3 w-3" />
                          <span>Links</span>
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
                  </CardContent>
                </Card>
              ))}
              
              {submissions.length === 0 && (
                <div className="text-center p-8 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">No submissions yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <h3 className="text-lg font-semibold flex items-center gap-2 mt-5">
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
                    onClick={() => {
                      if (file.fileUrl) {
                        setError(null);
                        setIsLoading(true);
                        setSelectedFile(file.fileUrl);
                      }
                    }}
                  >
                    View PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <PDFViewerModal isOpen={!!selectedFile} onClose={() => setSelectedFile(null)}>
        <div className="bg-background rounded-lg p-6 h-auto max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">
              {files.find(f => f.fileUrl === selectedFile)?.title || selectedFile?.split('/').pop()}
            </h3>
            <Button
              className='w-15 h-15'
              onClick={() => setSelectedFile(null)}
            >
              <X className="w-10 h-10" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            {selectedFile && selectedFile.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={`${selectedFile}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="PDF Viewer"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <a 
                  href={selectedFile || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <FileText className="h-5 w-5" />
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </PDFViewerModal>
    </div>
  );
};

export default UploadedFiles;
