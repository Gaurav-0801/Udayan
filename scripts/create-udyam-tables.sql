-- Create Udyam submissions table
CREATE TABLE IF NOT EXISTS udyam_submissions (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Personal Information
    aadhaar_number TEXT NOT NULL,
    entrepreneur_name TEXT NOT NULL,
    mobile_number TEXT,
    email_address TEXT,
    
    -- Address Information
    pin_code TEXT,
    city TEXT,
    state TEXT,
    district TEXT,
    address TEXT,
    
    -- Business Information
    enterprise_name TEXT,
    pan_number TEXT,
    gst_number TEXT,
    business_type TEXT,
    activity_type TEXT,
    
    -- Verification Status
    aadhaar_verified BOOLEAN DEFAULT FALSE,
    otp_verified BOOLEAN DEFAULT FALSE,
    pan_verified BOOLEAN DEFAULT FALSE,
    
    -- Form Data
    form_data JSONB,
    submission_status TEXT DEFAULT 'draft'
);

-- Create OTP verification table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    aadhaar_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_udyam_aadhaar ON udyam_submissions(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_udyam_status ON udyam_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_otp_aadhaar ON otp_verifications(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);
