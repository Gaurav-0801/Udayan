"use client"

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FormField } from "@/components/form-field"
import type { FormField as FormFieldType } from "@/lib/form-schema"
import jest from "jest" // Import jest to declare the variable

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe("FormField Component", () => {
  const mockOnChange = jest.fn()

  const aadhaarField: FormFieldType = {
    id: "aadhaar",
    name: "aadhaar",
    type: "text",
    label: "Aadhaar Number",
    placeholder: "Enter 12-digit Aadhaar number",
    required: true,
    maxlength: "12",
    validation: {
      pattern: "^\\d{12}$",
      message: "Aadhaar number must be exactly 12 digits",
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("should render form field correctly", () => {
    render(<FormField field={aadhaarField} value="" onChange={mockOnChange} />)

    expect(screen.getByLabelText("Aadhaar Number")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Enter 12-digit Aadhaar number")).toBeInTheDocument()
  })

  test("should show error message when provided", () => {
    render(
      <FormField
        field={aadhaarField}
        value="123"
        error="Aadhaar number must be exactly 12 digits"
        onChange={mockOnChange}
      />,
    )

    expect(screen.getByText("Aadhaar number must be exactly 12 digits")).toBeInTheDocument()
  })

  test("should call onChange when user types", async () => {
    const user = userEvent.setup()

    render(<FormField field={aadhaarField} value="" onChange={mockOnChange} />)

    const input = screen.getByPlaceholderText("Enter 12-digit Aadhaar number")
    await user.type(input, "123456789012")

    expect(mockOnChange).toHaveBeenCalledWith("123456789012")
  })

  test("should show OTP actions for Aadhaar field", () => {
    render(<FormField field={aadhaarField} value="123456789012" onChange={mockOnChange} showOTPActions={true} />)

    expect(screen.getByText("Send OTP")).toBeInTheDocument()
  })

  test("should handle OTP sending", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: "OTP sent successfully" }),
    })

    const user = userEvent.setup()

    render(<FormField field={aadhaarField} value="123456789012" onChange={mockOnChange} showOTPActions={true} />)

    const sendOTPButton = screen.getByText("Send OTP")
    await user.click(sendOTPButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/form/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          aadhaar: "123456789012",
        }),
      })
    })
  })

  test("should disable field when disabled prop is true", () => {
    render(<FormField field={aadhaarField} value="" onChange={mockOnChange} disabled={true} />)

    const input = screen.getByPlaceholderText("Enter 12-digit Aadhaar number")
    expect(input).toBeDisabled()
  })

  test("should enforce maxlength attribute", () => {
    render(<FormField field={aadhaarField} value="" onChange={mockOnChange} />)

    const input = screen.getByPlaceholderText("Enter 12-digit Aadhaar number")
    expect(input).toHaveAttribute("maxLength", "12")
  })
})
