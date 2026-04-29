"use client"

import { useState } from 'react'
import { useMedicationRequests } from '@/hooks/use-medication-requests'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Clock, Loader2, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

type MedicationRequestsViewProps = {
  mode?: 'send' | 'receive' | 'both'
}

export function MedicationRequestsView({ mode = 'both' }: MedicationRequestsViewProps) {
  const { requests, loading, error, sendRequest, acceptRequest } = useMedicationRequests()
  const [medicationId, setMedicationId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!medicationId || !quantity) return

    setSubmitting(true)
    try {
      await sendRequest(Number(medicationId), Number(quantity))
      setMedicationId('')
      setQuantity('')
    } catch (err) {
      console.error('Failed to send request:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptRequest = async (requestId: number) => {
    setSubmitting(true)
    try {
      await acceptRequest(requestId)
    } catch (err) {
      console.error('Failed to accept request:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const acceptedRequests = requests.filter((r) => r.status === 'accepted')

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Send Request Section */}
      {(mode === 'send' || mode === 'both') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="size-5" />
              Send Medication Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Medication ID</label>
                  <Input
                    type="number"
                    placeholder="Enter medication ID"
                    value={medicationId}
                    onChange={(e) => setMedicationId(e.target.value)}
                    disabled={submitting || loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={submitting || loading}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={!medicationId || !quantity || submitting || loading}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Send Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Receive Request Section */}
      {(mode === 'receive' || mode === 'both') && (
        <div className="space-y-4">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5 text-yellow-500" />
                  Pending Requests ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        Medication #{request.medication_id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {request.quantity} units
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={submitting}
                      className="shrink-0"
                    >
                      {submitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 size-4" />
                          Accept
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Accepted Requests */}
          {acceptedRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-500" />
                  Accepted Requests ({acceptedRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {acceptedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        Medication #{request.medication_id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {request.quantity} units
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Accepted on{' '}
                        {new Date(request.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-full bg-green-100 p-2">
                      <CheckCircle2 className="size-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {requests.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No medication requests yet
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
