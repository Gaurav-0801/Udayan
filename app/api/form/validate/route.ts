import { type NextRequest, NextResponse } from "next/server"
import {
  validateFieldWithDetails,
  validateAadhaarWithDetails,
  validatePANWithDetails,
  sanitizeFormData,
} from "@/lib/form-schema"

export async function POST(request: NextRequest) {
  try {
    const { fieldName, value, field } = await request.json()

    if (!fieldName || value === undefined || !field) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Sanitize the input value
    const sanitizedData = sanitizeFormData({ [fieldName]: value })
    const sanitizedValue = sanitizedData[fieldName]

    let validationResult

    // Use specific validation for certain fields
    if (fieldName === "aadhaar") {
      validationResult = validateAadhaarWithDetails(sanitizedValue)
    } else if (fieldName === "pan") {
      validationResult = validatePANWithDetails(sanitizedValue)
    } else {
      validationResult = validateFieldWithDetails(sanitizedValue, field)
    }

    return NextResponse.json({
      isValid: validationResult.isValid,
      error: validationResult.error || null,
      sanitizedValue: sanitizedValue,
    })
  } catch (error) {
    console.error("Validation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
