import { type NextRequest, NextResponse } from "next/server"
import { validateAllSteps, sanitizeFormData } from "@/lib/form-schema"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { formData, fields } = await request.json()

    if (!formData || !fields) {
      return NextResponse.json({ error: "Missing form data or field definitions" }, { status: 400 })
    }

    // Sanitize form data
    const sanitizedData = sanitizeFormData(formData)

    // Create mock steps for validation
    const mockSteps = [
      {
        step_number: 1,
        title: "Form Submission",
        description: "Main form",
        fields: fields,
      },
    ]

    // Validate all fields
    const validation = validateAllSteps(mockSteps, sanitizedData)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          errors: validation.errors,
        },
        { status: 400 },
      )
    }

    const submission = await prisma.udyamSubmission.create({
      data: {
        aadhaarNumber: sanitizedData.aadhaar || "",
        entrepreneurName: sanitizedData.name || "",
        mobileNumber: sanitizedData.mobile,
        emailAddress: sanitizedData.email,
        pinCode: sanitizedData.pincode,
        city: sanitizedData.city,
        state: sanitizedData.state,
        district: sanitizedData.district,
        address: sanitizedData.address,
        enterpriseName: sanitizedData.enterprise_name,
        panNumber: sanitizedData.pan,
        gstNumber: sanitizedData.gst,
        businessType: sanitizedData.business_type,
        activityType: sanitizedData.activity_type,
        aadhaarVerified: sanitizedData.aadhaar_verified === "true",
        otpVerified: sanitizedData.otp_verified === "true",
        panVerified: sanitizedData.pan_verified === "true",
        formData: sanitizedData,
        submissionStatus: "submitted",
      },
    })

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: "Form submitted successfully",
      data: sanitizedData,
    })
  } catch (error) {
    console.error("Form submission API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get("id")

    if (submissionId) {
      const submission = await prisma.udyamSubmission.findUnique({
        where: { id: submissionId },
      })

      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 })
      }

      return NextResponse.json(submission)
    }

    const submissions = await prisma.udyamSubmission.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const total = await prisma.udyamSubmission.count()

    return NextResponse.json({
      submissions,
      total,
    })
  } catch (error) {
    console.error("Get submissions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
