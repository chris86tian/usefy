import { CustomFormField } from "@/components/CustomFormField";
import CustomModal from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormLabel,
} from "@/components/ui/form";
import { SectionFormData, sectionSchema } from "@/lib/schemas";
import { addSection, closeSectionModal, editSection } from "@/state";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from 'lucide-react';
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useGetUploadFileUrlMutation } from "@/state/api";
import { useParams } from "next/navigation";

const SectionModal = () => {
  const params = useParams();
  const courseId = params.courseId as string;

  const dispatch = useAppDispatch();
  const { isSectionModalOpen, selectedSectionIndex, sections, } = useAppSelector(
    (state) => state.global.courseEditor
  );

  const section =
    selectedSectionIndex !== null ? sections[selectedSectionIndex] : null;
  
  const [files, setFiles] = useState<FileResource[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<string[]>([]);

  const methods = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    if (section) {
      methods.reset({
        title: section.sectionTitle,
        description: section.sectionDescription,
      });
    } else {
      methods.reset({
        title: "",
        description: "",
      });
    }
    if (section) {
      setFiles(section.files || []);
    } else {
      setFiles([]);
    }
  }, [section, methods]);

  const onClose = () => {
    dispatch(closeSectionModal());
  };

  const addFile = () => {
    setFiles([...files, {
      fileId: uuidv4(),
      title: "",
      description: "",
      fileUrl: ""
    }]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const onSubmit = (data: SectionFormData) => {
    const newSection: Section = {
      sectionId: section?.sectionId || uuidv4(),
      sectionTitle: data.title,
      sectionDescription: data.description,
      chapters: section?.chapters || [],
      releaseDate: section?.releaseDate || new Date().toISOString(),
      files: files.map(file => ({
        fileId: file.fileId,
        title: file.title,
        description: file.description,
        fileUrl: file.fileUrl,
      })),
    };

    if (selectedSectionIndex === null) {
      dispatch(addSection(newSection));
    } else {
      dispatch(editSection({
        index: selectedSectionIndex,
        section: newSection
      }));
    }

    toast.success(`Section updated successfully but you need to save the course to apply the changes`);
    dispatch(closeSectionModal());
  };

  const [getUploadFileUrl] = useGetUploadFileUrlMutation();

  const updateFile = (index: number, field: keyof FileResource, value: string | File) => {
    const updatedFiles = [...files];
    updatedFiles[index] = { ...updatedFiles[index], [field]: value };
    setFiles(updatedFiles);
  };
  
  // Modified updateFile function
  const handleFileUpload = async (index: number, file: File) => {
    
    try {
      // Get pre-signed URL from backend
      const { uploadUrl, fileUrl } = await getUploadFileUrl({
        courseId: courseId,
        sectionId: section?.sectionId || uuidv4(),
        fileName: file.name,
        fileType: file.type,
      }).unwrap();

      // Upload file to S3
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      // Update state with S3 URL
      const updatedFiles = [...files];
      updatedFiles[index] = {
        ...updatedFiles[index],
        fileUrl: fileUrl,
      };
      setFiles(updatedFiles);
    } catch (error) {
      console.error("File upload failed:", error);
      toast.error("Failed to upload file");
    }
  }
  const onFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await handleFileUpload(index, selectedFile);
    }
  };

  return (
    <CustomModal isOpen={isSectionModalOpen} onClose={() => dispatch(closeSectionModal())}>
      <div className="p-6 bg-white dark:bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add/Edit Section</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            <CustomFormField 
              name="title" 
              label="Section Title" 
              placeholder="Write section title here" 
              inputClassName="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />

            <CustomFormField
              name="description"
              label="Section Description"
              type="textarea"
              placeholder="Write section description here"
              inputClassName="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />

            {/* File Upload Section */}
            <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <FormLabel className="text-gray-600 dark:text-gray-300 text-sm mb-0">
                    Section Files ({files.length})
                  </FormLabel>
                </div>
                <Button type="button" onClick={addFile} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Add File
                </Button>
              </div>

              <div className="p-4 dark:bg-gray-800">
                {files.map((file, index) => (
                  <div key={file.fileId} className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
                      <Input
                        value={file.title}
                        onChange={(e) => updateFile(index, "title", e.target.value)}
                        placeholder="File Title"
                        className="text-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white dark:bg-gray-800">
                      <div className="mb-4">
                        <FormLabel className="text-gray-600 dark:text-gray-300 text-sm">
                          Upload File
                        </FormLabel>
                        {file.fileUrl ? (
                          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <p className="text-gray-600 dark:text-gray-300">File uploaded: {file.title}</p>
                          </div>
                        ) : (
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => onFileChange(index, e)}
                            className="dark:bg-gray-800 dark:text-white"
                          />
                        )}
                      </div>
                      
                      <textarea
                        value={file.description}
                        onChange={(e) => updateFile(index, "description", e.target.value)}
                        placeholder="File Description"
                        className="text-gray-600 w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white"
              >
                Save
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </CustomModal>
  );
};

export default SectionModal;