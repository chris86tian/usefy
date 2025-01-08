"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Link } from 'lucide-react';
import { useCreateAssignmentMutation, useUpdateAssignmentMutation } from '@/state/api';
import { v4 as uuidv4 } from 'uuid';
import { ResourceList } from './ResourceList';
import { AIGenerator } from './AIGenerator';
import { Resource, Assignment } from '@/lib/utils';
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
  
  const [createAssignment] = useCreateAssignmentMutation();
  const [updateAssignment] = useUpdateAssignmentMutation();

  useEffect(() => {
    if (assignment && mode === 'edit') {
      setTitle(assignment.title);
      setDescription(assignment.description);
      setResources(assignment.resources || []);
    }
  }, [assignment, mode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('res:', resources);
      const assignmentData = {
        assignmentId: mode === 'create' ? uuidv4() : assignment!.assignmentId,
        title,
        description,
        resources,
        submissions: mode === 'create' ? [] : assignment!.submissions
      };

      if (mode === 'create') {
        const { data } = await createAssignment({
          chapterId,
          courseId,
          sectionId,
          assignment: assignmentData,
        });

        if (data) {
          onOpenChange(false);
          resetForm();
          onAssignmentChange?.();
        }
      } else if (mode === 'edit' && assignment) {
        const { data } = await updateAssignment({
          chapterId,
          courseId,
          sectionId,
          assignmentId: assignment.assignmentId,
          assignment: assignmentData,
        });

        if (data) {
          onOpenChange(false);
          onAssignmentChange?.();
        }
      }
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
  };

  const handleAddResource = (resource: Resource) => {
    console.log('resource:', resource);
    setResources([...resources, resource]);
  };

  const handleRemoveResource = (id: string) => {
    setResources(resources.filter(resource => resource.id !== id));
  };

  const handleAIGenerate = (generatedAssignment: { title: string; description: string }) => {
    setTitle(generatedAssignment.title);
    setDescription(generatedAssignment.description);
  };

  const modalTitle = mode === 'create' ? 'Create New Assignment' : 'Edit Assignment';
  const submitButtonText = mode === 'create' ? 'Create Assignment' : 'Update Assignment';
  const loadingText = mode === 'create' ? 'Creating...' : 'Updating...';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
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

          <ResourceList resources={resources} onRemove={handleRemoveResource} onUpdate={(id, field, value) => {
            setResources(resources.map(resource => resource.id === id ? { ...resource, [field]: value } : resource));
          }} />

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAddResource({
                id: uuidv4(),
                title: '',
                url: ''
              })}
            >
              <Link className="mr-2 h-4 w-4" />
              Add Link
            </Button>
          </div>

          <AIGenerator onGenerate={handleAIGenerate} />

          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingText}
                </>
              ) : (
                submitButtonText
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentModal;

