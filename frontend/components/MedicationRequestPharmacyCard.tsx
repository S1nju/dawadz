"use client"

import { MapPin, AlertCircle } from "lucide-react"
import type { Pharmacy } from "@/components/PharmacyMap"

type MedicationRequestPharmacyCardProps = {
  pharmacy: Pharmacy
  isSelected: boolean
  isRouteActive?: boolean
  searchQuery: string
  onSelect: (pharmacy: Pharmacy) => void
  onGetDirections: (pharmacy: Pharmacy) => void
  error?: string
  isPending?: boolean
}

function parseTimeToMinutes(value?: string): number | null {
  if (!value) return null
  const [hoursRaw, minutesRaw] = value.split(":")
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return (hours * 60) + minutes
}

function getOpenStatus(pharmacy: Pharmacy): { label: string; isOpen: boolean } | null {
  const opensAt = parseTimeToMinutes(pharmacy.timeOpen)
  const closesAt = parseTimeToMinutes(pharmacy.timeCloses)
  if (opensAt === null || closesAt === null) return null

  const now = new Date()
  const nowMinutes = (now.getHours() * 60) + now.getMinutes()

  const isOpen = closesAt >= opensAt
    ? nowMinutes >= opensAt && nowMinutes < closesAt
    : nowMinutes >= opensAt || nowMinutes < closesAt

  return {
    label: isOpen ? "Open now" : "Closed now",
    isOpen,
  }
}

export function MedicationRequestPharmacyCard({
  pharmacy,
  isSelected,
  isRouteActive = false,
  searchQuery,
  onSelect,
  onGetDirections,
  error,
  isPending = false,
}: MedicationRequestPharmacyCardProps) {
  const openStatus = getOpenStatus(pharmacy)

  return (
    <div
      className={`relative overflow-hidden p-4 border text-card-foreground rounded-2xl transition-all duration-300 cursor-pointer group ${
        isSelected
          ? "bg-background border-primary/30 shadow-none"
          : "bg-card/60 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md hover:border-primary/40"
      } ${
        isPending
          ? "ring-1 ring-amber-400/30 shadow-amber-500/10"
          : ""
      }`}
      onClick={() => onSelect(pharmacy)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect(pharmacy)
        }
      }}
    >
      {isPending && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-400/10 via-transparent to-amber-400/10 animate-pulse" />
      )}

      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className={`font-semibold text-base transition-colors ${isSelected ? "text-foreground" : "group-hover:text-primary"}`}>
          {pharmacy.name}
        </h4>
        {isRouteActive
          ? <span className="text-[11px] font-medium text-primary">Route active</span>
          : isSelected
            ? <span className="text-[11px] font-medium text-primary">Selected</span>
            : null}
      </div>

      {isPending && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-[11px] font-medium text-amber-800">
          <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
          Request is being reviewed
        </div>
      )}

      <div className="flex items-start gap-2 text-muted-foreground text-sm mb-3">
        <MapPin className="size-4 shrink-0 mt-0.5 opacity-70" />
        <span className="leading-tight">{pharmacy.address}</span>
      </div>

      {error && (
        <div className="flex gap-2 mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs">
          <AlertCircle className="size-3 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-between items-center gap-2 mt-3">
        <div className="flex items-center gap-2">
          {openStatus && (
            <div
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm ${
                openStatus.isOpen
                  ? "text-emerald-700 bg-emerald-100/80 border-emerald-200/60"
                  : "text-slate-700 bg-slate-100/90 border-slate-300/60"
              }`}
            >
              {openStatus.label}
            </div>
          )}
          {searchQuery && pharmacy.hasDrug === true && (
            <div className="text-xs font-semibold text-green-700 bg-green-100/80 border border-green-200/50 px-2.5 py-1 rounded-full flex items-center shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 shrink-0 animate-pulse"></span>
              In stock
            </div>
          )}
          {searchQuery && pharmacy.hasDrug === false && (
            <div className="text-xs font-semibold text-rose-700 bg-rose-100/80 border border-rose-200/50 px-2.5 py-1 rounded-full flex items-center shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 shrink-0"></span>
              Not in stock
            </div>
          )}
          {isPending && !searchQuery && (
            <div className="text-xs font-semibold text-amber-800 bg-amber-100/80 border border-amber-200/70 px-2.5 py-1 rounded-full flex items-center shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 shrink-0 animate-pulse"></span>
              Awaiting reply
            </div>
          )}
          {!searchQuery && (
            <div className="text-xs font-medium text-muted-foreground bg-secondary/80 backdrop-blur-sm border border-border/50 px-2.5 py-1 rounded-lg">
              View details
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onGetDirections(pharmacy)
          }}
          className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {isRouteActive ? "Update route" : "Get directions"}
        </button>
      </div>
    </div>
  )
}
