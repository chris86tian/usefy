import React from 'react';
import { X, Link } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Resource {
  id: string;
  name: string;
  url: string;
}

interface ResourceListProps {
  resources: Resource[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: 'name' | 'url', value: string) => void;
}

export const ResourceList: React.FC<ResourceListProps> = ({ resources, onRemove, onUpdate }) => {
  return (
    <div className="space-y-3">
      {resources.map((resource) => (
        <div 
          key={resource.id} 
          className={cn(
            "group relative",
            "flex flex-col sm:flex-row items-start sm:items-center",
            "space-y-2 sm:space-y-0 sm:space-x-3",
            "p-4 bg-white border border-gray-200",
            "rounded-lg shadow-sm",
            "transition-all duration-200",
            "hover:shadow-md hover:border-gray-300"
          )}
        >
          <div className="flex items-center space-x-2 text-gray-600">
            <Link className="h-4 w-4" />
          </div>

          <div className="flex-1 space-y-2 sm:space-y-0 sm:space-x-3 sm:flex sm:items-center">
            <Input
              value={resource.name}
              onChange={(e) => onUpdate(resource.id, 'name', e.target.value)}
              className="flex-1 bg-gray-800 text-white"
              placeholder="Resource name"
              aria-label="Resource name"
            />
            
            <Input
              value={resource.url}
              onChange={(e) => onUpdate(resource.id, 'url', e.target.value)}
              className="flex-1 bg-gray-800 text-white"
              placeholder="Resource URL"
              aria-label="Resource URL"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => onRemove(resource.id)}
            className={cn(
              "p-2 h-auto",
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
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <Link className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">No resources added yet</p>
        </div>
      )}
    </div>
  );
};

export default ResourceList;