import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import HomePage from "@/app/page"
import jest from "jest"

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe("Form Submission Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("should complete full form submission flow", async () => {
    // Mock successful validation
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: "", sanitizedValue: "123456789012" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: "", sanitizedValue: "John Doe" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, submissionId: "SUB123456" }),
      })

    const user = userEvent.setup()

    render(<HomePage />)

    // Fill Aadhaar field
    const aadhaarInput = screen.getByPlaceholderText("Your Aadhaar No")
    await user.type(aadhaarInput, "123456789012")

    // Fill name field
    const nameInput = screen.getByPlaceholderText("Name as per Aadhaar")
    await user.type(nameInput, "John Doe")

    // Check consent checkbox
    const consentCheckbox = screen.getByRole("checkbox")
    await user.click(consentCheckbox)

    // Submit form
    const submitButton = screen.getByText("Validate & Generate OTP")
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/form/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("123456789012"),
      })
    })
  })

  test("should prevent submission without consent", async () => {
    const user = userEvent.setup()

    render(<HomePage />)

    // Fill required fields but don't check consent
    const aadhaarInput = screen.getByPlaceholderText("Your Aadhaar No")
    await user.type(aadhaarInput, "123456789012")

    const nameInput = screen.getByPlaceholderText("Name as per Aadhaar")
    await user.type(nameInput, "John Doe")

    // Try to submit without consent
    const submitButton = screen.getByText("Validate & Generate OTP")
    await user.click(submitButton)

    // Should not make API call
    expect(mockFetch).not.toHaveBeenCalledWith("/api/form/submit", expect.any(Object))
  })

  test("should handle validation errors", async () => {
    // Mock validation error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Aadhaar number must be exactly 12 digits" }),
    })

    const user = userEvent.setup()

    render(<HomePage />)

    const aadhaarInput = screen.getByPlaceholderText("Your Aadhaar No")
    await user.type(aadhaarInput, "12345") // Invalid Aadhaar

    await waitFor(() => {
      expect(screen.getByText("Aadhaar number must be exactly 12 digits")).toBeInTheDocument()
    })
  })
})
