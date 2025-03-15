"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, UserPlus, UserCheck, MailPlusIcon } from 'lucide-react'
import { getUserName } from "@/lib/utils"
import {
  useAddLearnerToCohortMutation,
  useRemoveLearnerFromCohortMutation,
  useGetCohortLearnersQuery,
  useInviteUserToCohortMutation,
} from "@/state/api"
import type { User } from "@clerk/nextjs/server"

interface CohortMembersProps {
  cohort: any
  orgUsers: { instructors: User[]; learners: User[]; admins: User[] }
  refetch: () => void
}

const CohortMembers = ({ cohort, orgUsers, refetch }: CohortMembersProps) => {
  const { data: learners, isLoading: cohortLearnersLoading } = useGetCohortLearnersQuery(
    { organizationId: cohort?.organizationId as string, cohortId: cohort?.cohortId as string },
    { skip: !cohort },
  )

  const [addLearnerToCohort] = useAddLearnerToCohortMutation()
  const [removeLearnerFromCohort] = useRemoveLearnerFromCohortMutation()
  const [inviteUserToCohort, {
    isLoading: inviteUserToCohortLoading,
  }] = useInviteUserToCohortMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLearnerId, setSelectedLearnerId] = useState("")
  const [activeDialog, setActiveDialog] = useState<'none' | 'addLearner' | 'inviteLearner'>('none')
  const [inviteEmail, setInviteEmail] = useState("")
  const [emailBatch, setEmailBatch] = useState<string[]>([])
  const [inviteRole, setInviteRole] = useState<string>("learner")

  const handleAddLearner = async () => {
    if (!selectedLearnerId) {
      toast.error("Please select a learner")
      return
    }

    try {
      await addLearnerToCohort({
        organizationId: cohort?.organizationId as string,
        cohortId: cohort?.cohortId as string,
        learnerId: selectedLearnerId,
      })

      toast.success("Learner added to cohort successfully")
      setActiveDialog('none')
      setSelectedLearnerId("")
      refetch()
    } catch (error) {
      toast.error("Failed to add learner to cohort")
      setActiveDialog('none')
      setSelectedLearnerId("")
    }
  }

  const handleAddByInvite = async () => {
    if (emailBatch.length === 0) {
      toast.error("Please enter at least one email address")
      return
    }

    try {
      for (const email of emailBatch) {
        await inviteUserToCohort({
          organizationId: cohort?.organizationId as string,
          cohortId: cohort?.cohortId as string,
          email: email.trim(),
          role: inviteRole,
        }).unwrap()
      }

      toast.success(`Invitations sent to ${emailBatch.join(", ")}`)
      setEmailBatch([])
      setInviteEmail("")
      setActiveDialog('none')
      refetch()
    } catch (error) {
      toast.error("Failed to send invitations")
    }
  }

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInviteEmail(value);

    const emails = value.split(',')
      .map(email => email.trim())
      .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    setEmailBatch(emails);
  };

  const handleRemoveLearner = async (learnerId: string) => {
    try {
      await removeLearnerFromCohort({
        organizationId: cohort?.organizationId as string,
        cohortId: cohort?.cohortId as string,
        learnerId,
      }).unwrap();

      toast.success("Learner removed from cohort successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to remove learner from cohort");
    }
  };

  const filteredLearners =
    orgUsers?.learners?.filter(
      (learner) =>
        !learners?.some((l) => l.id === learner.id) &&
        (getUserName(learner)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          learner.emailAddresses[0].emailAddress?.toLowerCase().includes(searchTerm.toLowerCase())),
    ) || []

  return (
    <>
      <div className="flex justify-end items-center">
        <div className="flex gap-2">
          <Dialog
            open={activeDialog === 'addLearner'}
            onOpenChange={(open) => {
              setActiveDialog(open ? 'addLearner' : 'none');
              if (!open) setSelectedLearnerId("");
            }}
          >
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
                    filteredLearners?.map((learner) => (
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
                <Button variant="outline" onClick={() => setActiveDialog('none')}>
                  Cancel
                </Button>
                <Button onClick={handleAddLearner}>Add to Cohort</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={activeDialog === 'inviteLearner'} onOpenChange={(open) => {
            setActiveDialog(open ? 'inviteLearner' : 'none');
            if (!open) {
              setEmailBatch([]);
              setInviteEmail("");
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <MailPlusIcon className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Members</DialogTitle>
                <DialogDescription>Enter the email addresses of the members you want to invite, separated by commas.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  type="text"
                  placeholder="Enter email addresses (comma separated)"
                  value={inviteEmail}
                  onChange={handleEmailInput}
                />
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learner">Learner</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveDialog('none')}>
                  Cancel
                </Button>
                <Button 
                  disabled={inviteUserToCohortLoading}
                  onClick={handleAddByInvite}
                >
                  {inviteUserToCohortLoading ? "Sending..." : "Send Invitations"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {learners && learners.length > 0 ? (
                learners.map((learner) => (
                  <TableRow key={learner.id}>
                    <TableCell className="font-medium">{getUserName(learner)}</TableCell>
                    <TableCell>{learner.emailAddresses[0].emailAddress}</TableCell>
                    <TableCell>
                      <Button onClick={() => handleRemoveLearner(learner.id)} variant="outline" size="sm">
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
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

export default CohortMembers
