import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Link, File, ImageIcon } from 'lucide-react';
import { useCreateAssignmentMutation, useUpdateAssignmentMutation } from '@/state/api';
import { v4 as uuidv4 } from 'uuid';
import { ResourceList } from './ResourceList';
import { AIGenerator } from './AIGenerator';
import { Resource, Assignment } from '@/lib/utils';
import { useGetUploadImageUrlMutation } from '@/state/api';
import { uploadAssignmentFile } from '@/lib/utils';

interface AssignmentModalProps {
  chapterId: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResourceType, setSelectedResourceType] = useState<Resource['type']>('link');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  
  const [createAssignment] = useCreateAssignmentMutation();
  const [updateAssignment] = useUpdateAssignmentMutation();
  const [getUploadImageUrl] = useGetUploadImageUrlMutation();

  useEffect(() => {
    if (assignment && mode === 'edit') {
      setTitle(assignment.title);
      setDescription(assignment.description);
      setResources(assignment.resources?.map(r => ({ ...r, type: r.url ? 'file' : 'link' })) || []);
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
    setUploadProgress({});
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
        
        // Add the resource immediately to show loading state
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

        // Update the resource with the file URL
        setResources(prev => 
          prev.map(r => 
            r.id === resourceId 
              ? { ...r, fileUrl, url: fileUrl } 
              : r
          )
        );
      } catch (error) {
        console.error('Failed to upload file:', error);
        // Remove the failed resource
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
        {isUploading ? 'Uploading...' : `Add ${selectedResourceType === 'image' ? 'Image' : 'File'}`}
      </Button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Assignment' : 'Edit Assignment'}</DialogTitle>
        </DialogHeader>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter assignment description"
              className="h-32"
              required
            />
          </div>

          <ResourceList 
            resources={resources} 
            uploadProgress={uploadProgress}
            onRemove={(id) => {
              setResources(resources.filter(r => r.id !== id));
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[id];
                return newProgress;
              });
            }}
            onUpdate={(id, field, value) => {
              setResources(resources.map(r => 
                r.id === id ? { ...r, [field]: value } : r
              ));
            }}
          />

          <div className="flex items-center space-x-2">
            <Select
              value={selectedResourceType}
              onValueChange={(value: Resource['type']) => setSelectedResourceType(value)}
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

          <AIGenerator onGenerate={({ title, description }) => {
            setTitle(title);
            setDescription(description);
          }} />

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
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentModal;