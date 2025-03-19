"use client"

import type React from "react"

import { useState, useRef } from "react"
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
import {
  Search,
  UserPlus,
  UserCheck,
  MailPlusIcon,
  UploadIcon,
  AlertCircle,
  FileIcon,
  UploadCloudIcon,
} from "lucide-react"
import { getUserName } from "@/lib/utils"
import {
  useAddLearnerToCohortMutation,
  useRemoveLearnerFromCohortMutation,
  useGetCohortLearnersQuery,
  useInviteUserToCohortMutation,
} from "@/state/api"
import type { User } from "@clerk/nextjs/server"
import { Spinner } from "@/components/ui/Spinner"
import NotFound from "@/components/NotFound"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CohortMembersProps {
  cohort: Cohort
  orgUsers: { instructors: User[]; learners: User[]; admins: User[] }
}

interface CsvUser {
  name: string
  email: string
}

const CohortMembers = ({ cohort, orgUsers }: CohortMembersProps) => {
  const {
    data: learners,
    isLoading: cohortLearnersLoading,
    refetch,
  } = useGetCohortLearnersQuery({ organizationId: cohort.organizationId, cohortId: cohort.cohortId })

  const [addLearnerToCohort, { isLoading: addLearnerToCohortLoading }] = useAddLearnerToCohortMutation()
  const [removeLearnerFromCohort, { isLoading: removeLearnerFromCohortLoading }] = useRemoveLearnerFromCohortMutation()
  const [inviteUserToCohort, { isLoading: inviteUserToCohortLoading }] = useInviteUserToCohortMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [memberSearchTerm, setMemberSearchTerm] = useState("")
  const [selectedLearnerId, setSelectedLearnerId] = useState("")
  const [activeDialog, setActiveDialog] = useState<"none" | "addLearner" | "inviteLearner" | "csvUpload">("none")
  const [inviteEmail, setInviteEmail] = useState("")
  const [emailBatch, setEmailBatch] = useState<string[]>([])
  const [inviteRole, setInviteRole] = useState<string>("learner")

  // CSV upload states
  const [csvUsers, setCsvUsers] = useState<CsvUser[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [isSendingBatch, setIsSendingBatch] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [removingLearnerId, setRemovingLearnerId] = useState<string | null>(null)

  if (cohortLearnersLoading) return <Spinner />
  if (!learners) return <NotFound message="Learners not found" />

  const handleRemoveLearner = async (learnerId: string) => {
    setRemovingLearnerId(learnerId)

    try {
      await removeLearnerFromCohort({
        organizationId: cohort.organizationId,
        cohortId: cohort.cohortId,
        learnerId,
      }).unwrap()

      refetch()
    } catch (error) {
      toast.error("Failed to remove learner from cohort")
    } finally {
      setRemovingLearnerId(null) // Reset state after removal
    }
  }

  const handleAddLearner = async () => {
    if (!selectedLearnerId) {
      toast.error("Please select a learner")
      return
    }

    try {
      await addLearnerToCohort({
        organizationId: cohort.organizationId,
        cohortId: cohort.cohortId,
        learnerId: selectedLearnerId,
      })

      setActiveDialog("none")
      setSelectedLearnerId("")
      refetch()
    } catch (error) {
      toast.error("Failed to add learner to cohort")
      setActiveDialog("none")
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
          organizationId: cohort.organizationId,
          cohortId: cohort.cohortId,
          email: email.trim(),
          role: inviteRole,
        }).unwrap()
      }

      toast.success(`Invitations sent to ${emailBatch.join(", ")}`)
      setEmailBatch([])
      setInviteEmail("")
      setActiveDialog("none")
      refetch()
    } catch (error) {
      toast.error("Failed to send invitations")
    }
  }

  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInviteEmail(value)

    const emails = value
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))

    setEmailBatch(emails)
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null)
    setCsvUsers([])

    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setCsvError("Please upload a CSV file")
      return
    }

    setCsvFile(file)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const rows = text.split("\n")
        
        const startRow = rows[0].toLowerCase().includes("name") || rows[0].toLowerCase().includes("email") ? 1 : 0

        const parsedUsers: CsvUser[] = []
        for (let i = startRow; i < rows.length; i++) {
          const row = rows[i].trim()
          if (!row) continue

          const columns = row.split(",")
          if (columns.length < 2) continue

          const name = columns[0].trim()
          const email = columns[1].trim()

          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue

          parsedUsers.push({ name, email })
        }

        if (parsedUsers.length === 0) {
          setCsvError("No valid users found in the CSV file")
          return
        }

        setCsvUsers(parsedUsers)
      } catch (error) {
        setCsvError("Failed to parse CSV file")
      }
    }

    reader.readAsText(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    setCsvError(null)
    setCsvUsers([])

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setCsvError("Please upload a CSV file")
      return
    }

    setCsvFile(file)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const rows = text.split("\n")

        // Skip header row if it exists
        const startRow = rows[0].toLowerCase().includes("name") || rows[0].toLowerCase().includes("email") ? 1 : 0

        const parsedUsers: CsvUser[] = []
        for (let i = startRow; i < rows.length; i++) {
          const row = rows[i].trim()
          if (!row) continue

          const columns = row.split(",")
          if (columns.length < 2) continue

          const name = columns[0].trim()
          const email = columns[1].trim()

          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue

          parsedUsers.push({ name, email })
        }

        if (parsedUsers.length === 0) {
          setCsvError("No valid users found in the CSV file")
          return
        }

        setCsvUsers(parsedUsers)
      } catch (error) {
        setCsvError("Failed to parse CSV file")
      }
    }

    reader.readAsText(file)
  }

  const handleSendCsvInvitations = async () => {
    if (csvUsers.length === 0) {
      toast.error("No valid users to invite")
      return
    }

    setIsSendingBatch(true)
    setUploadProgress(0)

    try {
      let successCount = 0

      for (let i = 0; i < csvUsers.length; i++) {
        const user = csvUsers[i]

        try {
          await inviteUserToCohort({
            organizationId: cohort.organizationId,
            cohortId: cohort.cohortId,
            email: user.email,
            role: inviteRole,
            name: user.name || undefined,
          }).unwrap()

          successCount++
        } catch (error) {
          console.error(`Failed to invite ${user.email}:`, error)
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / csvUsers.length) * 100))
      }

      if (successCount === csvUsers.length) {
        toast.success(`Successfully sent ${successCount} invitations`)
      } else {
        toast.success(`Sent ${successCount} out of ${csvUsers.length} invitations`)
      }

      setCsvUsers([])
      setCsvFile(null)
      setActiveDialog("none")
      refetch()
    } catch (error) {
      toast.error("Failed to send invitations")
    } finally {
      setIsSendingBatch(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const filteredLearners = orgUsers.learners.filter(
    (learner) =>
      !learners.some((l) => l.id === learner.id) &&
      (getUserName(learner).toLowerCase().includes(searchTerm.toLowerCase()) ||
        learner.emailAddresses[0].emailAddress.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const filteredMembers = learners.filter(
    (learner) =>
      getUserName(learner).toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
      learner.emailAddresses[0].emailAddress.toLowerCase().includes(memberSearchTerm.toLowerCase()),
  )

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            className="pl-8"
            value={memberSearchTerm}
            onChange={(e) => setMemberSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Dialog
            open={activeDialog === "addLearner"}
            onOpenChange={(open) => {
              setActiveDialog(open ? "addLearner" : "none")
              if (!open) setSelectedLearnerId("")
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
                <Button variant="outline" onClick={() => setActiveDialog("none")}>
                  Cancel
                </Button>
                <Button disabled={addLearnerToCohortLoading} onClick={handleAddLearner}>
                  {addLearnerToCohortLoading ? "Adding..." : "Add Learner"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={activeDialog === "inviteLearner"}
            onOpenChange={(open) => {
              setActiveDialog(open ? "inviteLearner" : "none")
              if (!open) {
                setEmailBatch([])
                setInviteEmail("")
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <MailPlusIcon className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Members</DialogTitle>
                <DialogDescription>
                  Enter the email addresses of the members you want to invite, separated by commas.
                </DialogDescription>
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
                <Button variant="outline" onClick={() => setActiveDialog("none")}>
                  Cancel
                </Button>
                <Button disabled={inviteUserToCohortLoading} onClick={handleAddByInvite}>
                  {inviteUserToCohortLoading ? "Sending..." : "Send Invitations"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New CSV Upload Dialog */}
          <Dialog
            open={activeDialog === "csvUpload"}
            onOpenChange={(open) => {
              setActiveDialog(open ? "csvUpload" : "none")
              if (!open) {
                setCsvUsers([])
                setCsvFile(null)
                setCsvError(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <UploadCloudIcon className="mr-2 h-4 w-4" />
                Bulk Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Invite Members</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with names and email addresses to invite multiple members at once. The CSV should
                  have two columns: full name and email address.
                </DialogDescription>
              </DialogHeader>

              {!csvUsers.length && !csvError && (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleCsvUpload} />
                  <UploadIcon className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">CSV file (max 1MB)</p>
                  {csvFile && <p className="mt-2 text-sm font-medium">{csvFile.name}</p>}
                </div>
              )}

              {csvError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{csvError}</AlertDescription>
                </Alert>
              )}

              {csvUsers.length > 0 && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{csvFile?.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{csvUsers.length} users found</span>
                  </div>

                  <div className="max-h-[200px] overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvUsers.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell>{user.name || "—"}</TableCell>
                            <TableCell>{user.email}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Select value={inviteRole} onValueChange={(value) => setInviteRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role for all users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learner">Learner</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                    </SelectContent>
                  </Select>

                  {isSendingBatch && (
                    <div className="w-full bg-secondary rounded-full h-2.5 mt-2">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCsvUsers([])
                    setCsvFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                  }}
                  disabled={isSendingBatch || csvUsers.length === 0}
                >
                  Clear
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActiveDialog("none")} disabled={isSendingBatch}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendCsvInvitations} disabled={isSendingBatch || csvUsers.length === 0}>
                    {isSendingBatch ? `Sending (${uploadProgress}%)` : `Send ${csvUsers.length} Invitations`}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((learner) => (
                    <TableRow key={learner.id}>
                      <TableCell className="font-medium">{getUserName(learner)}</TableCell>
                      <TableCell>{learner.emailAddresses[0].emailAddress}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={removingLearnerId === learner.id}
                          onClick={() => handleRemoveLearner(learner.id)}
                        >
                          {removingLearnerId === learner.id ? "Removing..." : "Remove"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      {memberSearchTerm ? "No matching members found" : "No learners in this cohort"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default CohortMembers

