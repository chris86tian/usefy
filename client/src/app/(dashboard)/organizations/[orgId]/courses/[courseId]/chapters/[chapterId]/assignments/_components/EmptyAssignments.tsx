import { Card, CardContent } from '@/components/ui/card'
import React from 'react'

export const EmptyAssignments = () => (
  <Card className="mt-4">
    <CardContent className="pt-6">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <h3 className="text-xl font-semibold mb-2">No Assignments Available</h3>
        <p className="text-muted-foreground">This chapter does not have any assignments yet.</p>
      </div>
    </CardContent>
  </Card>
)

