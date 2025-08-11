"use client"

import { useState, useEffect, useRef } from "react"
import { FormField } from "@/components/form-field"
import { DocumentUpload } from "@/components/document-upload"
import { ProgressTracker } from "@/components/progress-tracker"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useFormPersistence } from "@/hooks/use-form-persistence"
import { usePinLookup } from "@/hooks/use-pin-lookup"
import { useTranslation, type Language } from "@/lib/i18n"
import type { FormField as FormFieldType } from "@/lib/form-schema"
import { ChevronDown, Save, Printer, Globe, Contrast, MapPin, CheckCircle, RotateCcw } from "lucide-react"

interface FormData {
  aadhaar: string
  name: string
  pincode: string
  city: string
  state: string
  district: string
  [key: string]: string // Allow string indexing
}

export default function UdyamRegistrationForm() {
  const [language, setLanguage] = useState<Language>("en")
  const [highContrast, setHighContrast] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({})
  const [consentChecked, setConsentChecked] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([])
  const [pincode, setPincode] = useState("")
  const [isFormSubmitted, setIsFormSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState<string>("")
  const { toast } = useToast()
  const { t, tArray } = useTranslation(language) // Added tArray to destructuring
  const { data: locationData, loading: pinLoading, error: pinError, lookupPin } = usePinLookup()

  const {
    data: formData,
    setData: setFormData,
    lastSaved,
  } = useFormPersistence(
    {
      aadhaar: "",
      name: "",
      pincode: "",
      city: "",
      state: "",
      district: "",
    } as FormData, // Added type assertion
    { key: "udyam-form-data" },
  )

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }
  }, [highContrast])

  useEffect(() => {
    if (pincode.length === 6) {
      lookupPin(pincode)
    }
  }, [pincode, lookupPin])

  useEffect(() => {
    if (locationData) {
      setFormData((prev) => ({
        ...prev,
        city: locationData.city,
        state: locationData.state,
        district: locationData.district,
      }))
      toast({
        title: "Location Found",
        description: `Auto-filled: ${locationData.city}, ${locationData.state}`,
      })
    }
  }, [locationData, setFormData, toast])

  const udyamFields: FormFieldType[] = [
    {
      id: "aadhaar",
      name: "aadhaar",
      type: "text",
      label: t("aadhaarLabel") as string,
      placeholder: t("aadhaarPlaceholder") as string,
      required: true,
      maxlength: "12",
      validation: {
        pattern: "^\\d{12}$",
        message: "Aadhaar number must be exactly 12 digits",
      },
    },
    {
      id: "name",
      name: "name",
      type: "text",
      label: t("nameLabel") as string,
      placeholder: t("namePlaceholder") as string,
      required: true,
      validation: {
        pattern: "^[A-Za-z\\s]{2,50}$",
        message: "Name should contain only letters and spaces (2-50 characters)",
      },
    },
  ]

  const progressSteps = ["Aadhaar Verification", "Business Details"]

  const validateField = async (fieldName: string, value: string) => {
    const field = udyamFields.find((f) => f.name === fieldName)
    if (!field) return

    setIsValidating((prev) => ({ ...prev, [fieldName]: true }))

    try {
      const response = await fetch("/api/form/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldName,
          value,
          field,
        }),
      })

      const result = await response.json()

      if (result.error && response.status !== 200) {
        setErrors((prev) => ({ ...prev, [fieldName]: result.error }))
      } else {
        setErrors((prev) => ({ ...prev, [fieldName]: result.error || "" }))
        if (result.sanitizedValue !== undefined) {
          setFormData((prev) => ({ ...prev, [fieldName]: result.sanitizedValue }))
        }
      }
    } catch (error) {
      console.error("Validation error:", error)
      setErrors((prev) => ({ ...prev, [fieldName]: "Validation failed. Please try again." }))
    } finally {
      setIsValidating((prev) => ({ ...prev, [fieldName]: false }))
    }
  }

  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleFieldChange = async (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))

    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }))
    }

    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }

    // Only validate if field has minimum required length
    const field = udyamFields.find((f) => f.name === fieldName)
    const shouldValidate =
      field &&
      value.trim() &&
      ((fieldName === "aadhaar" && value.length === 12) || (fieldName !== "aadhaar" && value.length > 0))

    if (shouldValidate) {
      validationTimeoutRef.current = setTimeout(() => {
        validateField(fieldName, value)
      }, 500)
    }
  }

  const handleOTPVerified = async () => {
    if (!consentChecked) {
      toast({
        title: "Consent Required",
        description: "Please provide consent to proceed with Udyam Registration.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const validationPromises = udyamFields.map((field) =>
        validateField(field.name, (formData as FormData)[field.name] || ""),
      )
      await Promise.all(validationPromises)

      const hasErrors = Object.values(errors).some((error) => error && error.trim() !== "")
      if (hasErrors) {
        toast({
          title: "Validation Error",
          description: "Please fix the errors before submitting.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/form/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData,
          fields: udyamFields,
          documents: uploadedDocuments.map((f) => f.name),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmissionId(result.submissionId)
        setIsFormSubmitted(true)
        toast({
          title: "Success!",
          description: `Form submitted successfully. ID: ${result.submissionId}`,
        })
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "An error occurred while submitting the form.",
          variant: "destructive",
        })
        if (result.errors) {
          setErrors(result.errors)
        }
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Network Error",
        description: "Failed to submit form. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Udyam Registration Form - ${submissionId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; }
            .value { margin-left: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Udyam Registration Form</h1>
            <p>Submission ID: ${submissionId}</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="field">
            <span class="label">Aadhaar Number:</span>
            <span class="value">${formData.aadhaar}</span>
          </div>
          <div class="field">
            <span class="label">Name:</span>
            <span class="value">${formData.name}</span>
          </div>
          <div class="field">
            <span class="label">PIN Code:</span>
            <span class="value">${formData.pincode}</span>
          </div>
          <div class="field">
            <span class="label">City:</span>
            <span class="value">${formData.city}</span>
          </div>
          <div class="field">
            <span class="label">State:</span>
            <span class="value">${formData.state}</span>
          </div>
          <div class="field">
            <span class="label">District:</span>
            <span class="value">${formData.district}</span>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleReset = () => {
    setFormData({ aadhaar: "", name: "", pincode: "", city: "", state: "", district: "" })
    setErrors({})
    setConsentChecked(false)
    setUploadedDocuments([])
    setIsFormSubmitted(false)
    setSubmissionId("")
    setPincode("")
    toast({
      title: "Form Reset",
      description: "Form has been reset successfully.",
    })
  }

  const handleSubmit = async () => {
    if (!consentChecked) {
      toast({
        title: "Consent Required",
        description: "Please provide consent to proceed with Udyam Registration.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const validationPromises = udyamFields.map((field) =>
        validateField(field.name, (formData as FormData)[field.name] || ""),
      )
      await Promise.all(validationPromises)

      const hasErrors = Object.values(errors).some((error) => error && error.trim() !== "")

      if (hasErrors) {
        toast({
          title: "Validation Error",
          description: "Please fix the errors before submitting.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/form/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData,
          fields: udyamFields,
          documents: uploadedDocuments.map((f) => f.name),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmissionId(result.submissionId)
        setIsFormSubmitted(true)
        toast({
          title: "Success!",
          description: `Form submitted successfully. ID: ${result.submissionId}`,
        })
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "An error occurred while submitting the form.",
          variant: "destructive",
        })
        if (result.errors) {
          setErrors(result.errors)
        }
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Network Error",
        description: "Failed to submit form. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isFormSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">भारत</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">सूक्ष्म, लघु और मध्यम उद्यम मंत्रालय</h1>
                  <p className="text-sm opacity-90">Ministry of Micro, Small & Medium Enterprises</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600 mb-2">Form Submitted Successfully!</h2>
              <p className="text-gray-600">Your Udyam registration form has been submitted.</p>
              <p className="text-sm text-gray-500 mt-2">
                Submission ID: <strong>{submissionId}</strong>
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                <Printer className="w-4 h-4 mr-2" />
                Print Form
              </Button>
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Submit Another Form
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-100 ${highContrast ? "high-contrast" : ""}`}>
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white print:bg-purple-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <div className="text-purple-600 font-bold text-sm">GOI</div>
                </div>
                <div>
                  <div className="text-sm font-medium">सूक्ष्म, लघु और मध्यम उद्यम मंत्रालय</div>
                  <div className="text-xs opacity-90">Ministry of Micro, Small & Medium Enterprises</div>
                </div>
              </div>
            </div>

            {/* Added accessibility and language controls */}
            <div className="flex items-center space-x-4 print:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHighContrast(!highContrast)}
                className="text-white hover:text-purple-200"
                aria-label="Toggle high contrast mode"
              >
                <Contrast className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === "en" ? "hi" : "en")}
                className="text-white hover:text-purple-200"
                aria-label="Toggle language"
              >
                <Globe className="h-4 w-4 mr-1" />
                {t("languageToggle")}
              </Button>
            </div>

            <nav className="hidden md:flex items-center space-x-6 print:hidden">
              <a href="#" className="text-white hover:text-purple-200 border-b-2 border-white pb-1">
                Home
              </a>
              <a href="#" className="text-white hover:text-purple-200">
                NIC Code
              </a>
              <div className="relative group">
                <button className="flex items-center text-white hover:text-purple-200">
                  Useful Documents <ChevronDown className="ml-1 h-4 w-4" />
                </button>
              </div>
              <div className="relative group">
                <button className="flex items-center text-white hover:text-purple-200">
                  Print / Verify <ChevronDown className="ml-1 h-4 w-4" />
                </button>
              </div>
              <div className="relative group">
                <button className="flex items-center text-white hover:text-purple-200">
                  Update Details <ChevronDown className="ml-1 h-4 w-4" />
                </button>
              </div>
              <div className="relative group">
                <button className="flex items-center text-white hover:text-purple-200">
                  Login <ChevronDown className="ml-1 h-4 w-4" />
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Added form action buttons */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => console.log("Save functionality not implemented")}>
              <Save className="h-4 w-4 mr-1" />
              {t("saveProgress")}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              {t("printForm")}
            </Button>
          </div>
          {lastSaved && <p className="text-sm text-gray-500">Last saved: {lastSaved.toLocaleTimeString()}</p>}
        </div>

        <ProgressTracker currentStep={currentStep} totalSteps={2} steps={progressSteps} />

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-8 text-center">{t("title")}</h1>

            <div className="bg-blue-500 text-white px-4 py-3 rounded-t-lg">
              <h2 className="text-lg font-medium">{t("aadhaarSection")}</h2>
            </div>

            <div className="border border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {udyamFields.map((field) => (
                  <div key={field.id}>
                    <FormField
                      field={field}
                      value={(formData as FormData)[field.name] || ""} // Added type assertion
                      error={errors[field.name]}
                      onChange={(value) => handleFieldChange(field.name, value)}
                      onBlur={() => validateField(field.name, (formData as FormData)[field.name] || "")} // Added type assertion
                      disabled={isSubmitting || isValidating[field.name]}
                      showOTPActions={field.name === "aadhaar"}
                      onOTPVerified={field.name === "aadhaar" ? handleOTPVerified : undefined}
                    />
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 text-gray-800">Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="pincode" className="text-sm font-medium text-gray-700 mb-2 block">
                      PIN Code <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="pincode"
                        type="text"
                        value={pincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                          setPincode(value)
                          setFormData((prev) => ({ ...prev, pincode: value }))
                        }}
                        placeholder="Enter 6-digit PIN code"
                        maxLength={6}
                        className="pr-10"
                      />
                      <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      {pinLoading && (
                        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                      )}
                    </div>
                    {pinError && <p className="text-red-500 text-sm mt-1">{pinError}</p>}
                  </div>

                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700 mb-2 block">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="City will be auto-filled"
                      className={locationData ? "bg-green-50 border-green-300" : ""}
                      readOnly={!!locationData}
                    />
                  </div>

                  <div>
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700 mb-2 block">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="state"
                      type="text"
                      value={formData.state || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                      placeholder="State will be auto-filled"
                      className={locationData ? "bg-green-50 border-green-300" : ""}
                      readOnly={!!locationData}
                    />
                  </div>

                  <div>
                    <Label htmlFor="district" className="text-sm font-medium text-gray-700 mb-2 block">
                      District
                    </Label>
                    <Input
                      id="district"
                      type="text"
                      value={formData.district || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))}
                      placeholder="District will be auto-filled"
                      className={locationData ? "bg-green-50 border-green-300" : ""}
                      readOnly={!!locationData}
                    />
                  </div>
                </div>
              </div>

              {/* Added document upload section */}
              <div className="mb-6 print:hidden">
                <DocumentUpload
                  label={t("uploadDocument") as string}
                  onUpload={setUploadedDocuments}
                  multiple={true}
                  acceptedTypes={[".pdf", ".jpg", ".jpeg", ".png"]}
                  maxSize={5}
                />
              </div>

              <div className="mb-6 space-y-2 text-sm text-gray-700">
                <ul className="list-disc list-inside space-y-1">
                  {tArray("requirements").map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consent"
                    checked={consentChecked}
                    onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                    className="mt-1"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed">
                    {t("consentText")}
                  </label>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                <Button
                  onClick={currentStep === 2 ? handleSubmit : () => setCurrentStep(2)}
                  disabled={isSubmitting || !consentChecked}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                >
                  {isSubmitting ? "Processing..." : currentStep === 2 ? t("validateButton") : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Added print styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:bg-purple-700 { background-color: #7c3aed !important; }
          body { font-size: 12px; }
          .container { max-width: none; margin: 0; padding: 0; }
        }
        
        .high-contrast {
          filter: contrast(150%) brightness(120%);
        }
        
        .high-contrast input,
        .high-contrast button {
          border: 2px solid #000 !important;
        }
      `}</style>
    </div>
  )
}
