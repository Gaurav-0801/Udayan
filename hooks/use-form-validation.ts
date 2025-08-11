"use client"

import { useState, useCallback, useMemo } from "react"
import {
  type FormStep,
  type FormState,
  validateStep,
  sanitizeFormData,
  type ValidationResult,
  validateFieldWithDetails,
} from "@/lib/form-schema"

export interface UseFormValidationProps {
  steps: FormStep[]
  initialData?: Record<string, string>
  onStepChange?: (step: number) => void
  onSubmit?: (data: Record<string, string>) => Promise<void>
}

export const useFormValidation = ({ steps, initialData = {}, onStepChange, onSubmit }: UseFormValidationProps) => {
  const [formState, setFormState] = useState<FormState>({
    currentStep: 1,
    formData: initialData,
    errors: {},
    isSubmitting: false,
    isValid: false,
    touchedFields: new Set(),
  })

  // Update field value
  const updateField = useCallback(
    (fieldName: string, value: string) => {
      setFormState((prev) => {
        const sanitizedData = sanitizeFormData({
          ...prev.formData,
          [fieldName]: value,
        })

        const currentStepData = steps.find((step) => step.step_number === prev.currentStep)
        const validation = currentStepData
          ? validateStep(currentStepData, sanitizedData)
          : { isValid: true, errors: {} }

        return {
          ...prev,
          formData: sanitizedData,
          errors: {
            ...prev.errors,
            ...validation.errors,
          },
          isValid: validation.isValid,
          touchedFields: new Set([...prev.touchedFields, fieldName]),
        }
      })
    },
    [steps],
  )

  // Validate single field
  const validateField = useCallback(
    (fieldName: string): ValidationResult => {
      const currentStepData = steps.find((step) => step.step_number === formState.currentStep)
      if (!currentStepData) return { isValid: true }

      const field = currentStepData.fields.find((f) => f.name === fieldName)
      if (!field) return { isValid: true }

      const value = formState.formData[fieldName] || ""
      return validateFieldWithDetails(value, field)
    },
    [steps, formState.currentStep, formState.formData],
  )

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    const currentStepData = steps.find((step) => step.step_number === formState.currentStep)
    if (!currentStepData) return true

    const validation = validateStep(currentStepData, formState.formData)

    setFormState((prev) => ({
      ...prev,
      errors: validation.errors,
      isValid: validation.isValid,
    }))

    return validation.isValid
  }, [steps, formState.currentStep, formState.formData])

  // Move to next step
  const nextStep = useCallback(async () => {
    if (!validateCurrentStep()) return false

    const nextStepNumber = formState.currentStep + 1
    if (nextStepNumber <= steps.length) {
      setFormState((prev) => ({
        ...prev,
        currentStep: nextStepNumber,
        errors: {},
      }))
      onStepChange?.(nextStepNumber)
      return true
    }
    return false
  }, [formState.currentStep, steps.length, validateCurrentStep, onStepChange])

  // Move to previous step
  const prevStep = useCallback(() => {
    const prevStepNumber = formState.currentStep - 1
    if (prevStepNumber >= 1) {
      setFormState((prev) => ({
        ...prev,
        currentStep: prevStepNumber,
        errors: {},
      }))
      onStepChange?.(prevStepNumber)
      return true
    }
    return false
  }, [formState.currentStep, onStepChange])

  // Submit form
  const submitForm = useCallback(async () => {
    if (!validateCurrentStep() || !onSubmit) return false

    setFormState((prev) => ({ ...prev, isSubmitting: true }))

    try {
      await onSubmit(formState.formData)
      return true
    } catch (error) {
      console.error("Form submission error:", error)
      return false
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }))
    }
  }, [validateCurrentStep, onSubmit, formState.formData])

  // Reset form
  const resetForm = useCallback(() => {
    setFormState({
      currentStep: 1,
      formData: initialData,
      errors: {},
      isSubmitting: false,
      isValid: false,
      touchedFields: new Set(),
    })
  }, [initialData])

  // Get current step data
  const currentStepData = useMemo(() => {
    return steps.find((step) => step.step_number === formState.currentStep)
  }, [steps, formState.currentStep])

  // Check if field has error
  const hasFieldError = useCallback(
    (fieldName: string): boolean => {
      return formState.touchedFields.has(fieldName) && !!formState.errors[fieldName]
    },
    [formState.touchedFields, formState.errors],
  )

  // Get field error message
  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      return formState.touchedFields.has(fieldName) ? formState.errors[fieldName] : undefined
    },
    [formState.touchedFields, formState.errors],
  )

  return {
    // State
    formState,
    currentStepData,

    // Actions
    updateField,
    validateField,
    validateCurrentStep,
    nextStep,
    prevStep,
    submitForm,
    resetForm,

    // Utilities
    hasFieldError,
    getFieldError,

    // Computed values
    isFirstStep: formState.currentStep === 1,
    isLastStep: formState.currentStep === steps.length,
    progress: Math.round((formState.currentStep / steps.length) * 100),
  }
}
