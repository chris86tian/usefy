import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useCreateAssignmentMutation, useUpdateAssignmentMutation } from '@/state/api';
import { v4 as uuidv4 } from 'uuid';

interface Assignment {
  assignmentId: string;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submissions: any[];
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [createAssignment] = useCreateAssignmentMutation();
  const [updateAssignment] = useUpdateAssignmentMutation();

  useEffect(() => {
    if (assignment && mode === 'edit') {
      setTitle(assignment.title);
      setDescription(assignment.description);
    }
  }, [assignment, mode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (mode === 'create') {
        const { data } = await createAssignment({
          chapterId,
          courseId,
          sectionId,
          assignment: {
            assignmentId: uuidv4(),
            title,
            description,
            submissions: []
          },
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
          assignment: {
            ...assignment,
            title,
            description,
          },
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
  };

  const modalTitle = mode === 'create' ? 'Create New Assignment' : 'Edit Assignment';
  const submitButtonText = mode === 'create' ? 'Create Assignment' : 'Update Assignment';
  const loadingText = mode === 'create' ? 'Creating...' : 'Updating...';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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