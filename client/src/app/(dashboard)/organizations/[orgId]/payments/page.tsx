"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPrice } from "@/lib/utils"
import { useGetTransactionsQuery } from "@/state/api"
import { useUser } from "@clerk/nextjs"
import { useState } from "react"
import { SignInRequired } from "@/components/SignInRequired"
import Header from "@/components/Header"
import { Spinner } from "@/components/ui/Spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PaymentType = "all" | "stripe" | "paypal"

export default function Payments() {
  const [paymentType, setPaymentType] = useState<PaymentType>("all")
  const { user, isLoaded } = useUser()
  const { data: transactions, isLoading: isLoadingTransactions } = useGetTransactionsQuery(user?.id || "", {
    skip: !isLoaded || !user,
  })

  const filteredData =
    transactions?.filter((transaction) => {
      const matchesTypes = paymentType === "all" || transaction.paymentProvider === paymentType
      return matchesTypes
    }) || []

  if (!isLoaded) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) return <SignInRequired />

  return (
    <div className="space-y-4">
      <Header title="Payments" subtitle="View your billing history" />

      <Card className="shadow-sm">
        <CardHeader className="border-none">
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Select value={paymentType} onValueChange={(value: PaymentType) => setPaymentType(value)}>
              <SelectTrigger className="w-[180px] border-gray-200 shadow-sm">
                <SelectValue placeholder="Payment Type" />
              </SelectTrigger>
              <SelectContent className="border-none shadow-md">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoadingTransactions ? (
            <div className="flex h-[400px] items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableHead className="font-medium border-none">Date</TableHead>
                    <TableHead className="font-medium border-none">Amount</TableHead>
                    <TableHead className="font-medium border-none">Payment Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((transaction, index) => (
                      <TableRow 
                        key={transaction.transactionId}
                        className={index !== filteredData.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}
                      >
                        <TableCell className="border-none">{new Date(transaction.dateTime).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium border-none">{formatPrice(transaction.amount)}</TableCell>
                        <TableCell className="capitalize border-none">{transaction.paymentProvider}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground border-none">
                        No transactions to display
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}