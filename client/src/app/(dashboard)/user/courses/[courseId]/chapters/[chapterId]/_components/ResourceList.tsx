import React from 'react';
import { X, Link, Image as ImageIcon, File, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Resource } from '@/lib/utils';
import Image from 'next/image';

interface ResourceListProps {
  resources: Resource[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: 'title' | 'url', value: string) => void;
}

const ResourcePreview = ({ resource }: { resource: Resource }) => {
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

export const ResourceList: React.FC<ResourceListProps> = ({ resources, onRemove, onUpdate }) => {
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
      {resources.map((resource) => (
        <div 
          key={resource.id} 
          className={cn(
            "group relative",
            "flex items-start",
            "p-4 bg-white border border-gray-200",
            "rounded-lg shadow-sm",
            "transition-all duration-200",
            "hover:shadow-md hover:border-gray-300"
          )}
        >
          <ResourcePreview resource={resource} />

          <div className="flex-1 ml-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {getResourceTypeLabel(resource.type)}
              </span>
            </div>

            <div className="space-y-2">
              <Input
                value={resource.title}
                onChange={(e) => onUpdate(resource.id, 'title', e.target.value)}
                className="flex-1 bg-gray-800 text-white"
                placeholder={`${getResourceTypeLabel(resource.type)} name`}
                aria-label={`${getResourceTypeLabel(resource.type)} name`}
              />
              
              {resource.type === 'link' ? (
                <Input
                  value={resource.url}
                  onChange={(e) => onUpdate(resource.id, 'url', e.target.value)}
                  className="flex-1 bg-gray-800 text-white"
                  placeholder="Resource URL"
                  aria-label="Resource URL"
                />
              ) : (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="truncate">{resource.fileUrl}</span>
                  {resource.fileUrl && (
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
            aria-label="Remove resource"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
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