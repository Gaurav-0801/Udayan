import { validateAadhaar, validatePAN, sanitizeInput, validateFormField } from "@/lib/form-schema"

describe("Form Validation Functions", () => {
  describe("validateAadhaar", () => {
    test("should validate correct Aadhaar number", () => {
      expect(validateAadhaar("123456789012")).toBe(true)
    })

    test("should reject invalid Aadhaar numbers", () => {
      expect(validateAadhaar("12345678901")).toBe(false) // 11 digits
      expect(validateAadhaar("1234567890123")).toBe(false) // 13 digits
      expect(validateAadhaar("12345678901a")).toBe(false) // contains letter
      expect(validateAadhaar("")).toBe(false) // empty
      expect(validateAadhaar("000000000000")).toBe(false) // all zeros
    })

    test("should handle edge cases", () => {
      expect(validateAadhaar("   123456789012   ")).toBe(false) // with spaces
      expect(validateAadhaar("123-456-789-012")).toBe(false) // with dashes
      expect(validateAadhaar(null as any)).toBe(false) // null
      expect(validateAadhaar(undefined as any)).toBe(false) // undefined
    })
  })

  describe("validatePAN", () => {
    test("should validate correct PAN format", () => {
      expect(validatePAN("ABCDE1234F")).toBe(true)
      expect(validatePAN("XYZAB9876C")).toBe(true)
    })

    test("should reject invalid PAN formats", () => {
      expect(validatePAN("ABCDE1234")).toBe(false) // 9 characters
      expect(validatePAN("ABCDE12345")).toBe(false) // 10 characters but wrong format
      expect(validatePAN("12345ABCDE")).toBe(false) // numbers first
      expect(validatePAN("ABCDEFGHIJ")).toBe(false) // all letters
      expect(validatePAN("1234567890")).toBe(false) // all numbers
      expect(validatePAN("")).toBe(false) // empty
    })

    test("should handle case sensitivity", () => {
      expect(validatePAN("abcde1234f")).toBe(true) // lowercase
      expect(validatePAN("AbCdE1234f")).toBe(true) // mixed case
    })
  })

  describe("sanitizeInput", () => {
    test("should remove dangerous characters", () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
      expect(sanitizeInput("SELECT * FROM users")).toBe("SELECT * FROM users")
      expect(sanitizeInput("Normal text 123")).toBe("Normal text 123")
    })

    test("should trim whitespace", () => {
      expect(sanitizeInput("  test  ")).toBe("test")
      expect(sanitizeInput("\n\ttest\n\t")).toBe("test")
    })

    test("should handle empty and null values", () => {
      expect(sanitizeInput("")).toBe("")
      expect(sanitizeInput("   ")).toBe("")
      expect(sanitizeInput(null as any)).toBe("")
      expect(sanitizeInput(undefined as any)).toBe("")
    })
  })

  describe("validateFormField", () => {
    const aadhaarField = {
      id: "aadhaar",
      name: "aadhaar",
      type: "text" as const,
      label: "Aadhaar Number",
      required: true,
      validation: {
        pattern: "^\\d{12}$",
        message: "Aadhaar number must be exactly 12 digits",
      },
    }

    const nameField = {
      id: "name",
      name: "name",
      type: "text" as const,
      label: "Name",
      required: true,
      validation: {
        pattern: "^[A-Za-z\\s]{2,50}$",
        message: "Name should contain only letters and spaces",
      },
    }

    test("should validate required fields", () => {
      expect(validateFormField(aadhaarField, "")).toBe("Aadhaar Number is required")
      expect(validateFormField(nameField, "")).toBe("Name is required")
    })

    test("should validate Aadhaar field", () => {
      expect(validateFormField(aadhaarField, "123456789012")).toBe("")
      expect(validateFormField(aadhaarField, "12345678901")).toBe("Aadhaar number must be exactly 12 digits")
      expect(validateFormField(aadhaarField, "abcd12345678")).toBe("Aadhaar number must be exactly 12 digits")
    })

    test("should validate name field", () => {
      expect(validateFormField(nameField, "John Doe")).toBe("")
      expect(validateFormField(nameField, "A")).toBe("Name should contain only letters and spaces")
      expect(validateFormField(nameField, "John123")).toBe("Name should contain only letters and spaces")
    })
  })
})
