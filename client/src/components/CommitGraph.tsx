import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useGetCommitsQuery } from "@/state/api"
import { useUser } from "@clerk/nextjs"

const CommitGrid = () => {
  const { user } = useUser()
  const { data: commits } = useGetCommitsQuery({ userId: user?.id || "" })

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-700"
    if (count <= 2) return "bg-green-900"
    if (count <= 4) return "bg-green-700"
    if (count <= 6) return "bg-green-500"
    return "bg-green-300"
  }

  const formatDate = (dateString: string | number | Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: "short", year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const processCommits = () => {
    if (!commits) return []

    const commitMap = new Map<string, number>()
    commits.forEach((commit) => {
      const date = new Date(commit.date).toISOString().split("T")[0]
      commitMap.set(date, (commitMap.get(date) || 0) + commit.count)
    })

    const now = new Date()
    const info = []
    for (let i = 356; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]
      info.push({
        date: dateString,
        count: commitMap.get(dateString) || 0,
      })
    }
    return info
  }

  const info = processCommits()

  const weeks: { date: string; count: number }[][] = []
  let currentWeek: { date: string; count: number }[] = []
  info.forEach((day, index) => {
    currentWeek.push(day)
    if (currentWeek.length === 7 || index === info.length - 1) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  const getMonths = () => {
    const months: string[] = []
    info.forEach((day, index) => {
      const date = new Date(day.date)
      const monthYear = date.toLocaleString("default", { month: "short", year: "2-digit" })
      if (index === 0 || monthYear !== months[months.length - 1]) {
        months.push(monthYear)
      }
    })
    return months
  }

  const months = getMonths()

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle>Commit Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            {months.map((month, index) => (
              <span key={index} className="w-14 text-center">
                {month}
              </span>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-4">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-3 h-3 rounded-sm ${getColor(day.count)} hover:ring-2 hover:ring-white hover:ring-opacity-50 transition-all`}
                    title={`${formatDate(day.date)}: ${day.count} commits`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-700" />
            <div className="w-3 h-3 rounded-sm bg-green-900" />
            <div className="w-3 h-3 rounded-sm bg-green-700" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <div className="w-3 h-3 rounded-sm bg-green-300" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default CommitGrid

