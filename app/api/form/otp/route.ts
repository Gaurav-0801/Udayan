"use client"

import { type NextRequest, NextResponse } from "next/server"
import { validateOTPWithDetails } from "@/lib/form-schema"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { action, aadhaar, otp } = await request.json()

    if (action === "send") {
      if (!aadhaar || aadhaar.length !== 12) {
        return NextResponse.json({ error: "Valid Aadhaar number is required" }, { status: 400 })
      }

      // Generate 6-digit OTP
      const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString()

      await prisma.otpVerification.create({
        data: {
          aadhaarNumber: aadhaar,
          otpCode: generatedOTP,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          attempts: 0,
        },
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

      const storedOTP = await prisma.otpVerification.findFirst({
        where: {
          aadhaarNumber: aadhaar,
          isVerified: false,
        },
        orderBy: { createdAt: "desc" },
      })

      if (!storedOTP) {
        return NextResponse.json({ error: "OTP not found. Please request a new OTP." }, { status: 400 })
      }

      if (new Date() > storedOTP.expiresAt) {
        await prisma.otpVerification.delete({
          where: { id: storedOTP.id },
        })
        return NextResponse.json({ error: "OTP has expired. Please request a new OTP." }, { status: 400 })
      }

      if (storedOTP.attempts >= 3) {
        await prisma.otpVerification.delete({
          where: { id: storedOTP.id },
        })
        return NextResponse.json({ error: "Too many failed attempts. Please request a new OTP." }, { status: 400 })
      }

      if (storedOTP.otpCode !== otp) {
        await prisma.otpVerification.update({
          where: { id: storedOTP.id },
          data: { attempts: storedOTP.attempts + 1 },
        })
        return NextResponse.json(
          { error: `Invalid OTP. ${3 - (storedOTP.attempts + 1)} attempts remaining.` },
          { status: 400 },
        )
      }

      await prisma.otpVerification.update({
        where: { id: storedOTP.id },
        data: { isVerified: true },
      })

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
