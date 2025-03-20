import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

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
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search courses..."
          className="pl-8"
        />
      </div>
  )
}
