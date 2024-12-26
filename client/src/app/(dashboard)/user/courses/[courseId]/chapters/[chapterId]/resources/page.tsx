'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, File, Link, Image, VideoIcon, X } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

const Resources = () => {

  const user = useUser()
  const publicMetadata = user.user?.publicMetadata

  const [resources, setResources] = useState([
    { id: 1, type: 'pdf', name: 'Lesson Plan.pdf', url: '/sample.pdf' },
    { id: 2, type: 'video', name: 'Introduction Video', url: 'https://youtube.com/watch?v=123' },
    { id: 3, type: 'image', name: 'Diagram', url: '/diagram.png' },
  ])

  const [newResource, setNewResource] = useState({ type: 'pdf', name: '', url: '' })

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <File className="w-4 h-4" />
      case 'video':
        return <VideoIcon className="w-4 h-4" />
      case 'image':
        // eslint-disable-next-line jsx-a11y/alt-text
        return <Image className="w-4 h-4" />
      default:
        return <Link className="w-4 h-4" />
    }
  }

  const handleAddResource = () => {
    if (newResource.name && newResource.url) {
      setResources([...resources, { ...newResource, id: resources.length + 1 }])
      setNewResource({ type: 'pdf', name: '', url: '' })
    }
  }

  const handleRemoveResource = (id: number) => {
    setResources(resources.filter(resource => resource.id !== id))
  }

  if (!publicMetadata) {
    return null
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Course Resources</CardTitle>
        <CardDescription>Access and manage course materials</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view">View Resources</TabsTrigger>
            {publicMetadata.userType === 'teacher' && (
              <TabsTrigger value="add">Add Resources</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="view">
            <div className="space-y-4">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getIcon(resource.type)}
                    <span>{resource.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open(resource.url, '_blank')}>
                      Open
                    </Button>
                    {publicMetadata.userType === 'teacher' && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveResource(resource.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {publicMetadata.userType === 'teacher' && (
            <TabsContent value="add">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Resource Type</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newResource.type}
                    onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="video">Video Link</option>
                    <option value="image">Image</option>
                    <option value="link">Other Link</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Resource Name</Label>
                  <Input
                    placeholder="Enter resource name"
                    value={newResource.name}
                    onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Resource URL</Label>
                  <Input
                    placeholder="Enter resource URL"
                    value={newResource.url}
                    onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  />
                </div>

                <Button onClick={handleAddResource} className="w-full">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default Resources