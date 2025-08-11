"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { FormField as FormFieldType } from "@/lib/form-schema"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  field: FormFieldType
  value: string
  error?: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  showOTPActions?: boolean
  onOTPVerified?: () => void
}

export function FormField({
  field,
  value,
  error,
  onChange,
  onBlur,
  disabled = false,
  showOTPActions = false,
  onOTPVerified,
}: FormFieldProps) {
  const [showValue, setShowValue] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [isLoadingOTP, setIsLoadingOTP] = useState(false)
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const [otpError, setOtpError] = useState("")
  const [failedAttempts, setFailedAttempts] = useState(0)
  const { toast } = useToast()

  const isOTPField = field.id === "otp" || field.name === "otp"
  const isAadhaarField = field.id.includes("aadhaar") || field.name.includes("aadhaar")
  const isPANField = field.id.includes("pan") || field.name.includes("pan")

  const shouldShowPassword = (isAadhaarField || isPANField) && !showValue

  const handleSendOTP = async () => {
    console.log("Send OTP clicked", { value, length: value?.length })

    if (!value || value.length !== 12) {
      console.log("Invalid Aadhaar validation failed", { value, length: value?.length })
      toast({
        title: "Invalid Aadhaar",
        description: "Please enter a valid 12-digit Aadhaar number",
        variant: "destructive",
      })
      return
    }

    console.log("Starting OTP request...")
    setIsLoadingOTP(true)

    try {
      console.log("Making API call to /api/form/otp")
      const response = await fetch("/api/form/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "send",
          aadhaar: value,
        }),
      })

      console.log("API response received", { status: response.status, ok: response.ok })
      const result = await response.json()
      console.log("API result:", result)

      if (response.ok) {
        setOtpSent(true)
        if (result.otp) {
          alert(
            `Your OTP is: ${result.otp}\n\nThis OTP is valid for 5 minutes. Please enter it below to verify your Aadhaar.`,
          )
        }
        toast({
          title: "OTP Generated",
          description: "OTP has been generated successfully. Please check the alert for your OTP.",
        })
      } else {
        console.error("API error:", result)
        toast({
          title: "Failed to Send OTP",
          description: result.error || "An error occurred while sending OTP",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Send OTP error:", error)
      toast({
        title: "Network Error",
        description: "Failed to send OTP. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingOTP(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP")
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      })
      return
    }

    setOtpError("")
    setIsVerifyingOTP(true)

    try {
      const response = await fetch("/api/form/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "verify",
          aadhaar: value,
          otp: otpValue,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setOtpVerified(true)
        setOtpError("")
        setFailedAttempts(0)
        toast({
          title: "OTP Verified",
          description: "OTP verified successfully",
        })
        if (onOTPVerified) {
          onOTPVerified()
        }
      } else {
        const newFailedAttempts = failedAttempts + 1
        setFailedAttempts(newFailedAttempts)

        let errorMessage = "Invalid OTP. Please check and try again."

        if (result.error?.includes("expired")) {
          errorMessage = "OTP has expired. Please request a new OTP."
        } else if (result.error?.includes("invalid")) {
          errorMessage = `Invalid OTP. ${3 - newFailedAttempts} attempts remaining.`
        } else if (newFailedAttempts >= 3) {
          errorMessage = "Too many failed attempts. Please request a new OTP."
          setOtpSent(false)
          setOtpValue("")
          setFailedAttempts(0)
        }

        setOtpError(errorMessage)
        toast({
          title: "Verification Failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Verify OTP error:", error)
      setOtpError("Network error. Please check your connection and try again.")
      toast({
        title: "Network Error",
        description: "Failed to verify OTP. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifyingOTP(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label
        htmlFor={field.id}
        className={cn("text-sm font-medium", field.required && "after:content-['*'] after:text-red-500 after:ml-1")}
      >
        {field.label}
      </Label>

      <div className="relative">
        <Input
          id={field.id}
          name={field.name}
          type={shouldShowPassword ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={field.placeholder}
          maxLength={field.maxlength ? Number.parseInt(field.maxlength) : undefined}
          disabled={disabled}
          className={cn(
            "w-full",
            error && "border-red-500 focus:border-red-500",
            otpVerified && isAadhaarField && "border-green-500",
            (isAadhaarField || isPANField) && "pr-10",
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />

        {/* Show/Hide toggle for sensitive fields */}
        {(isAadhaarField || isPANField) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowValue(!showValue)}
            tabIndex={-1}
          >
            {showValue ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
          </Button>
        )}

        {otpVerified && isAadhaarField && (
          <CheckCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>

      {showOTPActions && isAadhaarField && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendOTP}
              disabled={disabled || !value || value.length !== 12 || isLoadingOTP || otpVerified}
            >
              {isLoadingOTP && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {otpSent ? "Resend OTP" : "Send OTP"}
            </Button>
            {otpVerified && (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="mr-1 h-4 w-4" />
                Verified
              </div>
            )}
          </div>

          {otpSent && !otpVerified && (
            <div className="space-y-2">
              <Label htmlFor="otp-input" className="text-sm font-medium">
                Enter OTP
              </Label>
              <div className="flex gap-2">
                <Input
                  id="otp-input"
                  type="text"
                  value={otpValue}
                  onChange={(e) => {
                    setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))
                    if (otpError) setOtpError("")
                  }}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className={cn("flex-1", otpError && "border-red-500")}
                />
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleVerifyOTP}
                  disabled={!otpValue || otpValue.length !== 6 || isVerifyingOTP || failedAttempts >= 3}
                >
                  {isVerifyingOTP && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify
                </Button>
              </div>

              {otpError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{otpError}</AlertDescription>
                </Alert>
              )}

              {failedAttempts > 0 && failedAttempts < 3 && !otpError && (
                <div className="text-xs text-amber-600">
                  {failedAttempts} failed attempt{failedAttempts > 1 ? "s" : ""}. {3 - failedAttempts} remaining.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription id={`${field.id}-error`} className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success message for verified Aadhaar */}
      {otpVerified && isAadhaarField && (
        <Alert className="py-2 border-green-500 text-green-700">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm">Aadhaar verified successfully</AlertDescription>
        </Alert>
      )}

      {/* Field hints */}
      {!error && (
        <div className="text-xs text-gray-500">
          {isPANField && "Format: ABCDE1234F (5 letters, 4 numbers, 1 letter)"}
          {isAadhaarField && !otpVerified && "Enter your 12-digit Aadhaar number"}
          {isAadhaarField && otpSent && !otpVerified && "OTP displayed in alert popup"}
        </div>
      )}
    </div>
  )
}
