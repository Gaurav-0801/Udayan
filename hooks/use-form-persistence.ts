"use client"

import { useState, useEffect } from "react"

interface FormPersistenceOptions {
  key: string
  debounceMs?: number
}

export function useFormPersistence<T extends Record<string, any>>(initialData: T, options: FormPersistenceOptions) {
  const { key, debounceMs = 1000 } = options
  const [data, setData] = useState<T>(initialData)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Load saved data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsedData = JSON.parse(saved)
        setData({ ...initialData, ...parsedData })
        setLastSaved(new Date(parsedData._timestamp || Date.now()))
      }
    } catch (error) {
      console.error("Failed to load saved form data:", error)
    }
  }, [key])

  // Save data with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          ...data,
          _timestamp: Date.now(),
        }
        localStorage.setItem(key, JSON.stringify(dataToSave))
        setLastSaved(new Date())
      } catch (error) {
        console.error("Failed to save form data:", error)
      }
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [data, key, debounceMs])

  const clearSaved = () => {
    try {
      localStorage.removeItem(key)
      setLastSaved(null)
    } catch (error) {
      console.error("Failed to clear saved data:", error)
    }
  }

  return {
    data,
    setData,
    lastSaved,
    clearSaved,
  }
}
