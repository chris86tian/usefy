import React from 'react';
import { X, Link, Image as ImageIcon, File, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Resource } from '@/lib/utils';
import Image from 'next/image';

interface ResourceListProps {
  resources: Resource[];
  uploadProgress: { [key: string]: number };
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: 'title' | 'url', value: string) => void;
}

const ResourcePreview = ({ resource, progress }: { resource: Resource; progress?: number }) => {
  if (progress !== undefined) {
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded bg-gray-100">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (resource.type === 'image' && resource.fileUrl) {
    return (
      <Image
        src={resource.fileUrl}
        alt={resource.title}
        className="w-full h-full object-cover"
      />
    );
  }

  const icons = {
    link: <Link className="h-4 w-4" />,
    image: <ImageIcon className="h-4 w-4" />,
    file: <File className="h-4 w-4" />
  };

  return (
    <div className="flex items-center justify-center w-12 h-12 rounded bg-gray-600">
      {icons[resource.type]}
    </div>
  );
};

export const ResourceList: React.FC<ResourceListProps> = ({ 
  resources, 
  uploadProgress, 
  onRemove, 
  onUpdate 
}) => {
  const getResourceTypeLabel = (type: Resource['type']) => {
    const labels = {
      link: 'Link',
      image: 'Image',
      file: 'File'
    };
    return labels[type];
  };

  return (
    <div className="space-y-3">
      {resources.map((resource) => {
        const progress = uploadProgress[resource.id];
        const isUploading = progress !== undefined;

        return (
          <div 
            key={resource.id} 
            className={cn(
              "group relative",
              "flex items-start",
              "p-4 bg-white border border-gray-200",
              "rounded-lg shadow-sm",
              "transition-all duration-200",
              "hover:shadow-md hover:border-gray-300",
              isUploading && "opacity-90"
            )}
          >
            <ResourcePreview resource={resource} progress={progress} />

            <div className="flex-1 ml-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {getResourceTypeLabel(resource.type)}
                </span>
                {isUploading && (
                  <span className="text-xs font-medium text-blue-500">
                    Uploading: {progress}%
                  </span>
                )}
              </div>

              {isUploading && (
                <Progress value={progress} className="h-1 mb-2" />
              )}

              <div className="space-y-2">
                <Input
                  value={resource.title}
                  onChange={(e) => onUpdate(resource.id, 'title', e.target.value)}
                  className="flex-1 bg-gray-800 text-white"
                  placeholder={`${getResourceTypeLabel(resource.type)} name`}
                  aria-label={`${getResourceTypeLabel(resource.type)} name`}
                  disabled={isUploading}
                />
                
                {resource.type === 'link' ? (
                  <Input
                    value={resource.url}
                    onChange={(e) => onUpdate(resource.id, 'url', e.target.value)}
                    className="flex-1 bg-gray-800 text-white"
                    placeholder="Resource URL"
                    aria-label="Resource URL"
                    disabled={isUploading}
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="truncate">
                      {resource.fileUrl || 'Uploading...'}
                    </span>
                    {resource.fileUrl && !isUploading && (
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 flex items-center space-x-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => onRemove(resource.id)}
              className={cn(
                "p-2 h-auto ml-2",
                "text-gray-400 hover:text-red-500",
                "opacity-0 group-hover:opacity-100",
                "transition-opacity duration-200"
              )}
              disabled={isUploading}
              aria-label="Remove resource"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      
      {resources.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">No resources added yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Add links, images, or files using the buttons below
          </p>
        </div>
      )}
    </div>
  );
};

export default ResourceList;