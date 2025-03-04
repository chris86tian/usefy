"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, UserPlus, UserCheck } from "lucide-react"
import { getUserName } from "@/lib/utils"
import { useAddLearnerToCohortMutation } from "@/state/api"

interface LearnersTabProps {
  cohort: any
  orgUsers: any
  orgId: string
  cohortId: string
  refetchCohort: () => void
}

const LearnersTab = ({ cohort, orgUsers, orgId, cohortId, refetchCohort }: LearnersTabProps) => {
  const [addLearnerToCohort] = useAddLearnerToCohortMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLearnerId, setSelectedLearnerId] = useState("")
  const [isAddLearnerDialogOpen, setIsAddLearnerDialogOpen] = useState(false)

  const handleAddLearner = async () => {
    if (!selectedLearnerId) {
      toast.error("Please select a learner")
      return
    }

    try {
      await addLearnerToCohort({
        organizationId: orgId,
        cohortId: cohortId,
        learnerId: selectedLearnerId,
      })
      toast.success("Learner added to cohort successfully")
      setIsAddLearnerDialogOpen(false)
      setSelectedLearnerId("")
      refetchCohort()
    } catch (error) {
      toast.error("Failed to add learner to cohort")
    }
  }

  const filteredLearners =
    orgUsers?.learners?.filter(
      (learner: any) =>
        !cohort?.learners.some((l: any) => l.id === learner.id) &&
        (getUserName(learner)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.emailAddresses[0].emailAddress?.toLowerCase().includes(searchTerm.toLowerCase())),
    ) || []

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Cohort Learners</h2>
        <Dialog open={isAddLearnerDialogOpen} onOpenChange={setIsAddLearnerDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Learner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Learner to Cohort</DialogTitle>
              <DialogDescription>Select a learner to add to this cohort.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search learners..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto border rounded-md">
                {filteredLearners?.length > 0 ? (
                  filteredLearners?.map((learner: any) => (
                    <div
                      key={learner.id}
                      className={`flex items-center justify-between p-3 hover:bg-accent cursor-pointer ${
                        selectedLearnerId === learner.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedLearnerId(learner.id)}
                    >
                      <div>
                        <p className="font-medium">{getUserName(learner)}</p>
                        <p className="text-sm text-muted-foreground">{learner.emailAddresses[0].emailAddress}</p>
                      </div>
                      {selectedLearnerId === learner.id && <UserCheck className="h-5 w-5 text-primary" />}
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-center text-muted-foreground">No learners found</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddLearnerDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLearner}>Add to Cohort</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohort.learners.length > 0 ? (
                cohort.learners.map((learner: any) => (
                  <TableRow key={learner.id}>
                    <TableCell className="font-medium">{getUserName(learner)}</TableCell>
                    <TableCell>{learner.emailAddresses[0].emailAddress}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No learners in this cohort
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

export default LearnersTab

