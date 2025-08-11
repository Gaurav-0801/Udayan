// Form schema types and validation utilities
export interface FormField {
  id: string
  name: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  maxlength?: string
  validation: {
    pattern: string
    message: string
  }
}

export interface FormStep {
  step_number: number
  title: string
  description: string
  fields: FormField[]
}

export interface UdyamFormStructure {
  steps: FormStep[]
  validation_rules: Record<
    string,
    {
      pattern: string
      message: string
    }
  >
  ui_components: {
    buttons: Array<{
      text: string
      type: string
    }>
  }
  metadata: {
    scraped_at: string
    source_url: string
    note?: string
  }
}

// Validation functions
export const validateField = (value: string, pattern: string): boolean => {
  const regex = new RegExp(pattern)
  return regex.test(value)
}

export const validateAadhaar = (aadhaar: string): boolean => {
  return /^\d{12}$/.test(aadhaar)
}

export const validatePAN = (pan: string): boolean => {
  return /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/.test(pan)
}

export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp)
}

export const validateName = (name: string): boolean => {
  return /^[A-Za-z\s]{2,50}$/.test(name)
}

// Form data loading utility
export const loadFormStructure = async (): Promise<UdyamFormStructure> => {
  try {
    const response = await fetch("/udyam-form-structure.json")
    if (!response.ok) {
      throw new Error("Failed to load form structure")
    }
    return await response.json()
  } catch (error) {
    console.error("Error loading form structure:", error)
    // Return fallback structure
    return {
      steps: [],
      validation_rules: {},
      ui_components: { buttons: [] },
      metadata: {
        scraped_at: new Date().toISOString(),
        source_url: "",
        note: "Fallback structure",
      },
    }
  }
}

export interface FormErrors {
  [key: string]: string | undefined
}

export interface FormState {
  currentStep: number
  formData: Record<string, string>
  errors: FormErrors
  isSubmitting: boolean
  isValid: boolean
  touchedFields: Set<string>
}

export interface ValidationResult {
  isValid: boolean
  error?: string
}

// Enhanced validation functions with detailed error messages
export const validateFieldWithDetails = (value: string, field: FormField): ValidationResult => {
  // Check if field is required
  if (field.required && (!value || value.trim() === "")) {
    return {
      isValid: false,
      error: `${field.label} is required`,
    }
  }

  // Skip pattern validation if field is empty and not required
  if (!value && !field.required) {
    return { isValid: true }
  }

  // Validate against pattern
  const regex = new RegExp(field.validation.pattern)
  if (!regex.test(value)) {
    return {
      isValid: false,
      error: field.validation.message,
    }
  }

  return { isValid: true }
}

// Specific validation functions with enhanced error handling
export const validateAadhaarWithDetails = (aadhaar: string): ValidationResult => {
  if (!aadhaar || aadhaar.trim() === "") {
    return { isValid: false, error: "Aadhaar number is required" }
  }

  if (aadhaar.length !== 12) {
    return { isValid: false, error: "Aadhaar number must be exactly 12 digits" }
  }

  if (!/^\d{12}$/.test(aadhaar)) {
    return { isValid: false, error: "Aadhaar number must contain only digits" }
  }

  return { isValid: true }
}

export const validatePANWithDetails = (pan: string): ValidationResult => {
  if (!pan || pan.trim() === "") {
    return { isValid: false, error: "PAN number is required" }
  }

  const panUpper = pan.toUpperCase()

  if (panUpper.length !== 10) {
    return { isValid: false, error: "PAN must be exactly 10 characters" }
  }

  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panUpper)) {
    return {
      isValid: false,
      error: "PAN format: 5 letters, 4 numbers, 1 letter (e.g., ABCDE1234F)",
    }
  }

  // Check for valid PAN structure patterns
  const firstThreeChars = panUpper.substring(0, 3)
  const fourthChar = panUpper.charAt(3)
  const fifthChar = panUpper.charAt(4)

  // Fourth character should be P for individual, C for company, etc.
  const validFourthChars = ["P", "C", "H", "F", "A", "T", "B", "L", "J", "G"]
  if (!validFourthChars.includes(fourthChar)) {
    return { isValid: false, error: "Invalid PAN category code" }
  }

  return { isValid: true }
}

export const validateOTPWithDetails = (otp: string): ValidationResult => {
  if (!otp || otp.trim() === "") {
    return { isValid: false, error: "OTP is required" }
  }

  if (otp.length !== 6) {
    return { isValid: false, error: "OTP must be exactly 6 digits" }
  }

  if (!/^\d{6}$/.test(otp)) {
    return { isValid: false, error: "OTP must contain only numbers" }
  }

  return { isValid: true }
}

export const validateNameWithDetails = (name: string): ValidationResult => {
  if (!name || name.trim() === "") {
    return { isValid: false, error: "Name is required" }
  }

  const trimmedName = name.trim()

  if (trimmedName.length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters long" }
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: "Name must not exceed 50 characters" }
  }

  if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
    return { isValid: false, error: "Name should contain only letters and spaces" }
  }

  // Check for consecutive spaces
  if (/\s{2,}/.test(trimmedName)) {
    return { isValid: false, error: "Name should not contain consecutive spaces" }
  }

  // Check for leading/trailing spaces
  if (trimmedName !== name) {
    return { isValid: false, error: "Name should not have leading or trailing spaces" }
  }

  return { isValid: true }
}

// Form validation utilities
export const validateStep = (
  stepData: FormStep,
  formData: Record<string, string>,
): { isValid: boolean; errors: FormErrors } => {
  const errors: FormErrors = {}
  let isValid = true

  stepData.fields.forEach((field) => {
    const value = formData[field.name] || ""
    const result = validateFieldWithDetails(value, field)

    if (!result.isValid) {
      errors[field.name] = result.error
      isValid = false
    }
  })

  return { isValid, errors }
}

export const validateAllSteps = (
  steps: FormStep[],
  formData: Record<string, string>,
): { isValid: boolean; errors: FormErrors; stepErrors: Record<number, FormErrors> } => {
  const allErrors: FormErrors = {}
  const stepErrors: Record<number, FormErrors> = {}
  let isValid = true

  steps.forEach((step) => {
    const stepValidation = validateStep(step, formData)
    stepErrors[step.step_number] = stepValidation.errors

    Object.assign(allErrors, stepValidation.errors)

    if (!stepValidation.isValid) {
      isValid = false
    }
  })

  return { isValid, errors: allErrors, stepErrors }
}

// Form data sanitization
export const sanitizeFormData = (formData: Record<string, string>): Record<string, string> => {
  const sanitized: Record<string, string> = {}

  Object.entries(formData).forEach(([key, value]) => {
    if (typeof value === "string") {
      // Trim whitespace
      let sanitizedValue = value.trim()

      // Convert PAN to uppercase
      if (key.toLowerCase().includes("pan")) {
        sanitizedValue = sanitizedValue.toUpperCase()
      }

      // Remove non-numeric characters from Aadhaar and OTP
      if (key.toLowerCase().includes("aadhaar") || key.toLowerCase().includes("otp")) {
        sanitizedValue = sanitizedValue.replace(/\D/g, "")
      }

      sanitized[key] = sanitizedValue
    } else {
      sanitized[key] = value
    }
  })

  return sanitized
}

// Form progress calculation
export const calculateProgress = (currentStep: number, totalSteps: number): number => {
  return Math.round((currentStep / totalSteps) * 100)
}

// Form completion check
export const isStepComplete = (step: FormStep, formData: Record<string, string>): boolean => {
  return step.fields.every((field) => {
    if (!field.required) return true
    const value = formData[field.name]
    return value && value.trim() !== ""
  })
}

export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input || typeof input !== "string") {
    return ""
  }

  // Remove dangerous characters and trim whitespace
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[<>]/g, "")
    .trim()
}

export const validateFormField = (field: FormField, value: string): string => {
  // Check if field is required
  if (field.required && (!value || value.trim() === "")) {
    return `${field.label} is required`
  }

  // Skip pattern validation if field is empty and not required
  if (!value && !field.required) {
    return ""
  }

  // Validate against pattern
  const regex = new RegExp(field.validation.pattern)
  if (!regex.test(value)) {
    return field.validation.message
  }

  return ""
}
