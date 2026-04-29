"use client"

import { CheckCircle2, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Pharmacy } from "@/components/PharmacyMap"

export type AcceptedRequestInfo = {
  requestId: number
  pharmacy: Pharmacy
  medicationName: string
  quantity: number
  acceptedAt: string
}

type AcceptedRequestsProps = {
  requests: AcceptedRequestInfo[]
  onSelectPharmacy: (pharmacy: Pharmacy) => void
  userLocation: [number, number] | null
}

export function AcceptedRequests({ requests, onSelectPharmacy, userLocation }: AcceptedRequestsProps) {
  if (requests.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs uppercase tracking-wide font-semibold text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200/50">
        ✓ {requests.length} Accepted Request{requests.length !== 1 ? "s" : ""} - Ready to Pick Up
      </h4>
      <div className="space-y-2">
        {requests.map((request) => (
          <div
            key={request.requestId}
            className="rounded-xl border border-green-200 bg-green-50/50 p-3 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-semibold text-foreground">{request.pharmacy.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  Accepted {new Date(request.acceptedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex size-6 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="size-4 text-green-600" />
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium text-foreground">{request.medicationName}</span> •{" "}
                <span className="text-green-700 font-medium">{request.quantity} units</span>
              </p>
              <p className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3 opacity-70" />
                {request.pharmacy.address}
              </p>
            </div>

            <Button
              onClick={() => onSelectPharmacy(request.pharmacy)}
              size="sm"
              className="w-full text-xs h-8"
            >
              Go to Pharmacy
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
