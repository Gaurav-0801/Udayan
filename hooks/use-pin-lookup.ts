"use client"

import { useState, useCallback } from "react"

interface LocationData {
  city: string
  state: string
  district: string
}

interface PinLookupResult {
  data: LocationData | null
  loading: boolean
  error: string | null
}

export function usePinLookup() {
  const [result, setResult] = useState<PinLookupResult>({
    data: null,
    loading: false,
    error: null,
  })

  const lookupPin = useCallback(async (pincode: string) => {
    if (!pincode || pincode.length !== 6) {
      setResult({ data: null, loading: false, error: null })
      return
    }

    setResult({ data: null, loading: true, error: null })

    try {
      // Using PostPin API for PIN code lookup
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      const data = await response.json()

      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
        const postOffice = data[0].PostOffice[0]
        setResult({
          data: {
            city: postOffice.Name,
            state: postOffice.State,
            district: postOffice.District,
          },
          loading: false,
          error: null,
        })
      } else {
        setResult({
          data: null,
          loading: false,
          error: "Invalid PIN code or no data found",
        })
      }
    } catch (error) {
      console.error("PIN lookup error:", error)
      setResult({
        data: null,
        loading: false,
        error: "Failed to lookup PIN code. Please try again.",
      })
    }
  }, [])

  return { ...result, lookupPin }
}
