import { POST } from "@/app/api/form/validate/route"
import { NextRequest } from "next/server"
import jest from "jest"

// Mock the form schema functions
jest.mock("@/lib/form-schema", () => ({
  validateFormField: jest.fn(),
  sanitizeInput: jest.fn((input) => input?.trim() || ""),
}))

describe("/api/form/validate", () => {
  const mockValidateFormField = require("@/lib/form-schema").validateFormField
  const mockSanitizeInput = require("@/lib/form-schema").sanitizeInput

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("should validate valid Aadhaar number", async () => {
    mockValidateFormField.mockReturnValue("")
    mockSanitizeInput.mockReturnValue("123456789012")

    const request = new NextRequest("http://localhost:3000/api/form/validate", {
      method: "POST",
      body: JSON.stringify({
        fieldName: "aadhaar",
        value: "123456789012",
        field: {
          id: "aadhaar",
          name: "aadhaar",
          type: "text",
          label: "Aadhaar Number",
          required: true,
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.error).toBe("")
    expect(data.sanitizedValue).toBe("123456789012")
  })

  test("should reject invalid Aadhaar number", async () => {
    mockValidateFormField.mockReturnValue("Aadhaar number must be exactly 12 digits")
    mockSanitizeInput.mockReturnValue("12345")

    const request = new NextRequest("http://localhost:3000/api/form/validate", {
      method: "POST",
      body: JSON.stringify({
        fieldName: "aadhaar",
        value: "12345",
        field: {
          id: "aadhaar",
          name: "aadhaar",
          type: "text",
          label: "Aadhaar Number",
          required: true,
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Aadhaar number must be exactly 12 digits")
  })

  test("should handle empty field values", async () => {
    mockValidateFormField.mockReturnValue("Aadhaar Number is required")
    mockSanitizeInput.mockReturnValue("")

    const request = new NextRequest("http://localhost:3000/api/form/validate", {
      method: "POST",
      body: JSON.stringify({
        fieldName: "aadhaar",
        value: "",
        field: {
          id: "aadhaar",
          name: "aadhaar",
          type: "text",
          label: "Aadhaar Number",
          required: true,
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Aadhaar Number is required")
  })

  test("should handle malformed requests", async () => {
    const request = new NextRequest("http://localhost:3000/api/form/validate", {
      method: "POST",
      body: "invalid json",
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid request format")
  })
})
