import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { courseCategories } from "@/lib/utils"

interface ToolbarProps {
  onSearch: (value: string) => void
  onCategoryChange: (value: string) => void
}

export function Toolbar({ onSearch, onCategoryChange }: ToolbarProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch(value)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mx-4">
      <div className="flex-1">
        <Input
          type="search"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search courses..."
          className="w-full"
        />
      </div>
      <Select onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {courseCategories.map((category) => (
            <SelectItem
              key={category.value}
              value={category.value}
            >
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
