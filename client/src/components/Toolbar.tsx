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
}

export function Toolbar({ onSearch }: ToolbarProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch(value)
  }

  return (
      <div className="flex-1">
        <Input
          type="search"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search courses..."
          className="w-full"
        />
      </div>
  )
}
