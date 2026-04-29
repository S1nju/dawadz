"use client"

import { useState } from "react"
import { Bell, Clock3, Pill, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { usePharmacyRequests } from "@/hooks/use-pharmacy-requests"
import axiosClient from "@/lib/axios-client"
import { useToast } from "@/hooks/use-toast"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type RequestItem = {
  request_id: string
  user_name: string
  medication: string
  city: string
  created_at: string
  attachment_image?: string
  status?: 'pending' | 'accepted' | 'canceled'
}

export function NotificationBell() {
  const { user, roles, isLoaded } = useAuth()
  const { toast } = useToast()
  const isPharmacy = isLoaded && roles.includes("pharmacy_admin")
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  
  // Get pharmacy city - ensure we have data before passing to hook
  const pharmacyCity = isPharmacy && user?.pharmacy?.city ? user.pharmacy.city : undefined
  
  // Only fetch requests if user is a pharmacy owner with a city
  const { requests, markAccepted } = usePharmacyRequests(pharmacyCity)
  const pendingCount = requests.filter((r) => r.status === "pending").length

  const handleViewRequest = (request: RequestItem) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
  }

  const handleAcceptRequest = async () => {
    if (!selectedRequest || isAccepting) return

    setIsAccepting(true)
    try {
      await axiosClient.post("/accepte-request", {
        request_id: selectedRequest.request_id,
      })

      markAccepted(selectedRequest.request_id)
      toast({
        title: "Request accepted",
        description: `You accepted ${selectedRequest.medication}. The user was notified.`,
      })

      setIsModalOpen(false)
      setSelectedRequest(null)
    } catch (error: any) {
      toast({
        title: "Acceptance failed",
        description: error?.response?.data?.message || "Could not accept request.",
        variant: "destructive",
      })
    } finally {
      setIsAccepting(false)
    }
  }

  // Don't show bell until auth is loaded
  if (!isLoaded) {
    return null
  }

  // Only show bell if pharmacy owner with requests
  if (!isPharmacy || !pharmacyCity) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full" disabled>
        <Bell className="size-5 opacity-50" />
        <span className="sr-only">No notifications</span>
      </Button>
    )
  }

  // Show bell with badge if there are requests
  if (requests.length === 0) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <Bell className="size-5" />
        <span className="sr-only">No notifications</span>
      </Button>
    )
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="size-5" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {pendingCount}
              </span>
            )}
            <span className="sr-only">Notifications ({pendingCount} pending)</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold text-sm">Medication Requests</h3>
            <p className="text-xs text-muted-foreground">
              {requests.filter((r) => r.status === "pending").length} pending • {requests.filter((r) => r.status === "accepted").length} accepted • {requests.filter((r) => r.status === "canceled").length} canceled
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="p-4 space-y-3">
              {requests.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No pending requests</p>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.request_id}
                    className="p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm">{request.medication}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          request.status === "accepted"
                            ? "bg-emerald-100 text-emerald-800"
                            : request.status === "canceled"
                              ? "bg-rose-100 text-rose-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {request.status === "accepted" ? "Accepted" : request.status === "canceled" ? "Canceled" : "Pending"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      From: <strong>{request.user_name}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleViewRequest(request as RequestItem)}
                      className="w-full"
                      disabled={request.status === "accepted" || request.status === "canceled"}
                    >
                      {request.status === "accepted" ? "Already accepted" : request.status === "canceled" ? "Canceled by user" : "View Request"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="size-5 text-primary" />
              Request Details
            </DialogTitle>
            <DialogDescription>
              Review the request and accept it directly from here.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Request ID</span>
                <span className="font-medium">{selectedRequest.request_id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><UserRound className="size-4" /> User</span>
                <span className="font-medium">{selectedRequest.user_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><Pill className="size-4" /> Medication</span>
                <span className="font-medium">{selectedRequest.medication}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">City</span>
                <span className="font-medium">{selectedRequest.city || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><Clock3 className="size-4" /> Sent at</span>
                <span className="font-medium">{new Date(selectedRequest.created_at).toLocaleString()}</span>
              </div>
              {selectedRequest.attachment_image && (
                <div className="space-y-2 pt-2">
                  <span className="text-muted-foreground text-sm">Attachment</span>
                  <div className="overflow-hidden rounded-xl border bg-muted/20">
                    <img
                      src={selectedRequest.attachment_image}
                      alt="Request attachment"
                      className="h-auto w-full max-h-72 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            <Button onClick={handleAcceptRequest} disabled={isAccepting || !selectedRequest || selectedRequest.status === "accepted"}>
              {isAccepting ? "Accepting..." : "Accept Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
