import { type NextRequest, NextResponse } from "next/server"
import { validateOTPWithDetails } from "@/lib/form-schema"

const otpStorage = new Map<
  string,
  {
    otp: string
    expiresAt: number
    attempts: number
    verified: boolean
  }
>()

export async function POST(request: NextRequest) {
  try {
    const { action, aadhaar, otp } = await request.json()

    if (action === "send") {
      if (!aadhaar || aadhaar.length !== 12) {
        return NextResponse.json({ error: "Valid Aadhaar number is required" }, { status: 400 })
      }

      // Generate 6-digit OTP
      const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString()

      otpStorage.set(aadhaar, {
        otp: generatedOTP,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        attempts: 0,
        verified: false,
      })

      return NextResponse.json({
        success: true,
        message: "OTP generated successfully",
        otp: generatedOTP, // Return OTP for alert display
      })
    } else if (action === "verify") {
      // Verify OTP
      if (!aadhaar || !otp) {
        return NextResponse.json({ error: "Aadhaar number and OTP are required" }, { status: 400 })
      }

      const otpValidation = validateOTPWithDetails(otp)
      if (!otpValidation.isValid) {
        return NextResponse.json({ error: otpValidation.error }, { status: 400 })
      }

      const storedOTPData = otpStorage.get(aadhaar)
      if (!storedOTPData) {
        return NextResponse.json({ error: "OTP not found. Please request a new OTP." }, { status: 400 })
      }

      if (Date.now() > storedOTPData.expiresAt) {
        otpStorage.delete(aadhaar)
        return NextResponse.json({ error: "OTP has expired. Please request a new OTP." }, { status: 400 })
      }

      if (storedOTPData.attempts >= 3) {
        otpStorage.delete(aadhaar)
        return NextResponse.json({ error: "Too many failed attempts. Please request a new OTP." }, { status: 400 })
      }

      if (storedOTPData.otp !== otp) {
        storedOTPData.attempts += 1
        return NextResponse.json(
          { error: `Invalid OTP. ${3 - storedOTPData.attempts} attempts remaining.` },
          { status: 400 },
        )
      }

      storedOTPData.verified = true

      return NextResponse.json({
        success: true,
        message: "OTP verified successfully",
        verified: true,
      })
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "send" or "verify".' }, { status: 400 })
    }
  } catch (error) {
    console.error("OTP API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
