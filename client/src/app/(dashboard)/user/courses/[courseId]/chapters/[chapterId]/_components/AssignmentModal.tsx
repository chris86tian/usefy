import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Link, File, ImageIcon, Plus, X, Wand2, Code2 } from 'lucide-react';
import { useCreateAssignmentMutation, useUpdateAssignmentMutation } from '@/state/api';
import { v4 as uuidv4 } from 'uuid';
import { ResourceList } from './ResourceList';
import { useGetUploadImageUrlMutation } from '@/state/api';
import { uploadAssignmentFile } from '@/lib/utils';

interface AssignmentModalProps {
  chapterId: string;
  chapter?: Chapter;
  sectionId: string;
  courseId: string;
  assignment?: Assignment;
  mode?: 'create' | 'edit';
  onAssignmentChange?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AssignmentModal = ({ 
  chapterId,
  chapter, 
  sectionId, 
  courseId, 
  assignment,
  mode = 'create',
  onAssignmentChange,
  open,
  onOpenChange
}: AssignmentModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [hints, setHints] = useState<string[]>([]);
  const [newHint, setNewHint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResourceType, setSelectedResourceType] = useState<'link' | 'image' | 'file'>('link');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const [createAssignment] = useCreateAssignmentMutation();
  const [updateAssignment] = useUpdateAssignmentMutation();
  const [getUploadImageUrl] = useGetUploadImageUrlMutation();

  useEffect(() => {
    if (assignment && mode === 'edit') {
      setTitle(assignment.title);
      setDescription(assignment.description);
      setResources(assignment.resources?.map(r => ({ ...r, type: r.url ? 'file' : 'link' })) || []);
      setHints(assignment.hints || []);
    }
  }, [assignment, mode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const assignmentData = {
        assignmentId: mode === 'create' ? uuidv4() : assignment!.assignmentId,
        title,
        description,
        resources,
        hints,
        submissions: mode === 'create' ? [] : assignment!.submissions
      };

      if (mode === 'create') {
        await createAssignment({
          chapterId,
          courseId,
          sectionId,
          assignment: assignmentData,
        });
      } else if (mode === 'edit' && assignment) {
        await updateAssignment({
          chapterId,
          courseId,
          sectionId,
          assignmentId: assignment.assignmentId,
          assignment: assignmentData,
        });
      }
      
      onOpenChange(false);
      if (mode === 'create') resetForm();
      onAssignmentChange?.();
    } catch (error) {
      console.error(`Failed to ${mode} assignment:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setResources([]);
    setHints([]);
    setUploadProgress({});
  };

  const handleAddHint = () => {
    if (newHint.trim()) {
      setHints([...hints, newHint.trim()]);
      setNewHint("");
    }
  };

  const handleRemoveHint = (index: number) => {
    setHints(hints.filter((_, i) => i !== index));
  };

  const handleAddResource = async (type: Resource['type'], file?: File) => {
    if (!file && type === 'link') {
      const newResource: Resource = {
        id: uuidv4(),
        title: '',
        url: '',
        type,
      };
      setResources([...resources, newResource]);
      return;
    }

    if (file) {
      const resourceId = uuidv4();
      setIsUploading(true);
      setUploadProgress(prev => ({ ...prev, [resourceId]: 0 }));

      try {
        const newResource: Resource = {
          id: resourceId,
          title: file.name,
          url: '',
          type,
        };
        
        setResources(prev => [...prev, newResource]);

        const fileUrl = await uploadAssignmentFile(
          file, 
          getUploadImageUrl,
          (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [resourceId]: Math.round(progress * 100)
            }));
          }
        );

        setResources(prev => 
          prev.map(r => 
            r.id === resourceId 
              ? { ...r, fileUrl, url: fileUrl } 
              : r
          )
        );
      } catch (error) {
        console.error('Failed to upload file:', error);
        setResources(prev => prev.filter(r => r.id !== resourceId));
      } finally {
        setIsUploading(false);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[resourceId];
          return newProgress;
        });
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleAddResource(selectedResourceType, file);
    }
  };

  const renderResourceButton = () => {
    const icons = {
      link: <Link className="mr-2 h-4 w-4" />,
      image: <ImageIcon className="mr-2 h-4 w-4" />,
      file: <File className="mr-2 h-4 w-4" />,
      code: <Code2 className="mr-2 h-4 w-4" />
    };

    if (selectedResourceType === 'link') {
      return (
        <Button
          type="button"
          variant="outline"
          onClick={() => handleAddResource('link')}
        >
          {icons.link}
          Add Link
        </Button>
      );
    }

    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById('file-upload')?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          icons[selectedResourceType]
        )}
        {isUploading ? 'Uploading...' : `Add ${selectedResourceType === 'image' ? 'Image' : selectedResourceType === 'file' ? 'File' : 'Code'}`}
      </Button>
    );
  };

  const generateAssignment = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/generate-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignmentTitle: chapter?.title,
          assignmentDescription: chapter?.content
        })
      });
  
      const generatedAssignment = await response.json();
  
      setTitle(generatedAssignment.title);
      setDescription(generatedAssignment.description);
      setHints(generatedAssignment.hints || []);
    } catch (error) {
      console.error('Failed to generate assignment:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const insertCodeBlock = () => {
    const textArea = document.getElementById('description');
    const start = (textArea as HTMLTextAreaElement)?.selectionStart;
    const end = (textArea as HTMLTextAreaElement)?.selectionEnd;
    const text = description;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    
    const codeBlock = `\n\`\`\`\n${selection || 'Enter your code here'}\n\`\`\`\n`;
    setDescription(before + codeBlock + after);
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  const renderMarkdown = (text: string) => {
    return text.split('```').map((block, index) => {
      if (index % 2 === 1) {
        return (
          <pre key={index} className="bg-gray-900 p-4 rounded-md">
            <code>{block.trim()}</code>
          </pre>
        );
      }
      return <p key={index} className="whitespace-pre-wrap">{block}</p>;
    });
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Assignment' : 'Edit Assignment'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          {mode === 'create' && (
            <Button
              type="button"
              onClick={generateAssignment}
              disabled={isGeneratingAI}
              className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter assignment title"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="description">Description</Label>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={insertCodeBlock}
                  >
                    Add Code Block
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={togglePreview}
                  >
                    {isPreview ? 'Edit' : 'Preview'}
                  </Button>
                </div>
              </div>
              
              {isPreview ? (
                <div className="border rounded-md bg-gray-800 p-4">
                  {renderMarkdown(description)}
                </div>
              ) : (
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter assignment description. Use ``` to create code blocks."
                  className="w-full min-h-[8rem] p-4 border rounded-md resize-y bg-gray-800 text-white"
                  required
                />
              )}
            </div>

            <div className="space-y-4">
              <Label>Hints</Label>
              <div className="space-y-4">
                {hints.map((hint, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input 
                      value={hint}
                      onChange={(e) => {
                        const newHints = [...hints]
                        newHints[index] = e.target.value
                        setHints(newHints)
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveHint(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newHint}
                    onChange={(e) => setNewHint(e.target.value)}
                    placeholder="Add a new hint..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddHint()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddHint}
                    disabled={!newHint.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <ResourceList 
              resources={resources} 
              uploadProgress={uploadProgress}
              onRemove={(id) => {
                setResources(resources.filter(r => r.id !== id))
                setUploadProgress(prev => {
                  const newProgress = { ...prev }
                  delete newProgress[id]
                  return newProgress
                })
              }}
              onUpdate={(id, field, value) => {
                setResources(resources.map(r => 
                  r.id === id ? { ...r, [field]: value } : r
                ))
              }}
            />

            <div className="flex items-center space-x-2">
              <Select
                value={selectedResourceType}
                onValueChange={(value: 'link' | 'image' | 'file') => setSelectedResourceType(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                </SelectContent>
              </Select>
              {renderResourceButton()}
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={selectedResourceType === 'image' ? 'image/*' : undefined}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  mode === 'create' ? 'Create Assignment' : 'Update Assignment'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentModal;