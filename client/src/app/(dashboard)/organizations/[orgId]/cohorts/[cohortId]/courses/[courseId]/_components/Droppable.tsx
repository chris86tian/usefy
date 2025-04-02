"use client"

import type React from "react"

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Plus, GripVertical, Lock, CalendarIcon, Unlock, Pen, FileQuestion, Brain } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/state/redux"
import {
  setSections,
  deleteSection,
  deleteChapter,
  openSectionModal,
  openChapterModal,
  updateSectionReleaseDate,
} from "@/state"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

export default function DroppableComponent() {
  const dispatch = useAppDispatch()
  const { sections } = useAppSelector((state) => state.global.courseEditor)

  const handleSectionDragEnd = (result: any) => {
    if (!result.destination) return

    const startIndex = result.source.index
    const endIndex = result.destination.index

    const updatedSections = [...sections]
    const [reorderedSection] = updatedSections.splice(startIndex, 1)
    updatedSections.splice(endIndex, 0, reorderedSection)
    dispatch(setSections(updatedSections))
  }

  const handleChapterDragEnd = (result: any, sectionIndex: number) => {
    if (!result.destination) return

    const startIndex = result.source.index
    const endIndex = result.destination.index

    const updatedSections = [...sections]
    const updatedChapters = [...updatedSections[sectionIndex].chapters]
    const [reorderedChapter] = updatedChapters.splice(startIndex, 1)
    updatedChapters.splice(endIndex, 0, reorderedChapter)
    updatedSections[sectionIndex].chapters = updatedChapters
    dispatch(setSections(updatedSections))
  }

  const toggleSectionLock = () => {
    const updatedSections = sections.map((section: Section) => ({
      ...section,
      releaseDate: section.releaseDate ? "" : new Date().toISOString(),
    }))
    dispatch(setSections(updatedSections))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Switch
          checked={sections.every(section => section.releaseDate === "")}
          onCheckedChange={toggleSectionLock}
        >
          {sections.every(section => section.releaseDate === "") ? "Unlock All Sections" : "Lock All Sections"}
        </Switch>
        <p className="text-muted-foreground text-sm">
          {sections.every(section => section.releaseDate === "") ? "All sections are locked" : "All sections are unlocked"}
        </p>
      </div>

      <DragDropContext onDragEnd={handleSectionDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
              {sections.map((section: Section, sectionIndex: number) => (
                <Draggable key={section.sectionId} draggableId={section.sectionId} index={sectionIndex}>
                  {(draggableProvider) => (
                    <Card
                      ref={draggableProvider.innerRef}
                      {...draggableProvider.draggableProps}
                      className={cn("border shadow-sm", sectionIndex % 2 === 0 ? "bg-background" : "bg-muted/30")}
                    >
                      <CardHeader className="p-4 pb-2">
                        <SectionHeader
                          section={section}
                          sectionIndex={sectionIndex}
                          dragHandleProps={draggableProvider.dragHandleProps}
                        />
                      </CardHeader>

                      <CardContent className="p-4 pt-0 space-y-3">
                        <DragDropContext onDragEnd={(result) => handleChapterDragEnd(result, sectionIndex)}>
                          <Droppable droppableId={`chapters-${section.sectionId}`}>
                            {(droppableProvider) => (
                              <div
                                ref={droppableProvider.innerRef}
                                {...droppableProvider.droppableProps}
                                className="space-y-2 mb-3"
                              >
                                {section.chapters.map((chapter: Chapter, chapterIndex: number) => (
                                  <Draggable
                                    key={chapter.chapterId}
                                    draggableId={chapter.chapterId}
                                    index={chapterIndex}
                                  >
                                    {(draggableProvider) => (
                                      <ChapterItem
                                        chapter={chapter}
                                        chapterIndex={chapterIndex}
                                        sectionIndex={sectionIndex}
                                        draggableProvider={draggableProvider}
                                      />
                                    )}
                                  </Draggable>
                                ))}
                                {droppableProvider.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            dispatch(
                              openChapterModal({
                                sectionIndex,
                                chapterIndex: null,
                              }),
                            )
                          }
                          className="w-full text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Chapter
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

const SectionHeader: React.FC<{ section: Section; sectionIndex: number; dragHandleProps: any }> = ({
  section,
  sectionIndex,
  dragHandleProps,
}) => {
  const dispatch = useAppDispatch()

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2" {...dragHandleProps}>
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
          <h3 className="text-lg font-medium">{section.sectionTitle}</h3>
        </div>
        {section.sectionDescription && (
          <p className="text-sm text-muted-foreground mt-1 ml-7">{section.sectionDescription}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "flex items-center gap-1 text-xs font-normal",
                !section.releaseDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {section.releaseDate ? (
                <span>{new Date(section.releaseDate).toLocaleDateString()}</span>
              ) : (
                <div className="flex items-center">
                  <Lock className="h-3 w-3 mr-1" />
                  <span>Locked</span>
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={section.releaseDate ? new Date(section.releaseDate) : undefined}
              onSelect={(date) => {
                dispatch(
                  updateSectionReleaseDate({
                    sectionIndex,
                    releaseDate: date ? date.toISOString() : "",
                  }),
                )
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => dispatch(openSectionModal({ sectionIndex }))}
        >
          <Edit className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => dispatch(deleteSection(sectionIndex))}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

const ChapterItem = ({
  chapter,
  chapterIndex,
  sectionIndex,
  draggableProvider,
}: {
  chapter: Chapter
  chapterIndex: number
  sectionIndex: number
  draggableProvider: any
}) => {
  const dispatch = useAppDispatch()

  return (
    <div
      ref={draggableProvider.innerRef}
      {...draggableProvider.draggableProps}
      {...draggableProvider.dragHandleProps}
      className={cn(
        "flex items-center justify-between p-2 rounded-md border",
        chapterIndex % 2 === 1 ? "bg-muted/50" : "bg-background",
      )}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <Badge variant="outline" className="mr-2 text-xs">
          {chapterIndex + 1}
        </Badge>
        <p className="text-sm font-medium">{chapter.title}</p>
        {chapter.assignments && chapter.assignments.length > 0 && (
          <Badge variant="outline" className="text-xs">
            <Pen className="h-3 w-3 mr-1" />
            {chapter.assignments.length}
          </Badge>
        )}
        {chapter.quiz && (
          <Badge variant="outline" className="text-xs">
            <Brain className="h-3 w-3 mr-1" />
          </Badge>
        )}
      </div>

      <div className="flex items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() =>
            dispatch(
              openChapterModal({
                sectionIndex,
                chapterIndex,
              }),
            )
          }
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() =>
            dispatch(
              deleteChapter({
                sectionIndex,
                chapterIndex,
              }),
            )
          }
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
