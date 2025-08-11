export const translations = {
  en: {
    title: "UDYAM REGISTRATION FORM - For New Enterprise who are not Registered yet as MSME",
    aadhaarSection: "Aadhaar Verification With OTP",
    aadhaarLabel: "1. Aadhaar Number/ आधार संख्या",
    nameLabel: "2. Name of Entrepreneur / उद्यमी का नाम",
    aadhaarPlaceholder: "Your Aadhaar No",
    namePlaceholder: "Name as per Aadhaar",
    validateButton: "Validate & Generate OTP",
    sendOTP: "Send OTP",
    verifyOTP: "Verify OTP",
    otpPlaceholder: "Enter 6-digit OTP",
    consentText:
      "I, the holder of the above Aadhaar, hereby give my consent to Ministry of MSME, Government of India, for using my Aadhaar number as alloted by UIDAI for Udyam Registration.",
    requirements: [
      "Aadhaar number shall be required for Udyam Registration.",
      "The Aadhaar number shall be of the proprietor in the case of a proprietorship firm, of the managing partner in the case of a partnership firm and of a karta in the case of a Hindu Undivided Family (HUF).",
      "In case of a Company or a Limited Liability Partnership or a Cooperative Society or a Society or a Trust, the organisation or its authorised signatory shall provide its GSTIN and PAN along with its Aadhaar number.",
    ],
    formSaved: "Form progress saved automatically",
    formRestored: "Previous form data restored",
    printForm: "Print Form",
    saveProgress: "Save Progress",
    uploadDocument: "Upload Document",
    documentUploaded: "Document uploaded successfully",
    accessibilityMode: "High Contrast Mode",
    languageToggle: "हिंदी",
  },
  hi: {
    title: "उद्यम पंजीकरण फॉर्म - नए उद्यम के लिए जो अभी तक MSME के रूप में पंजीकृत नहीं हैं",
    aadhaarSection: "OTP के साथ आधार सत्यापन",
    aadhaarLabel: "1. आधार संख्या / Aadhaar Number",
    nameLabel: "2. उद्यमी का नाम / Name of Entrepreneur",
    aadhaarPlaceholder: "आपका आधार नंबर",
    namePlaceholder: "आधार के अनुसार नाम",
    validateButton: "सत्यापित करें और OTP जेनरेट करें",
    sendOTP: "OTP भेजें",
    verifyOTP: "OTP सत्यापित करें",
    otpPlaceholder: "6-अंकीय OTP दर्ज करें",
    consentText:
      "मैं, उपरोक्त आधार का धारक, उद्यम पंजीकरण के लिए UIDAI द्वारा आवंटित अपने आधार संख्या का उपयोग करने के लिए MSME मंत्रालय, भारत सरकार को अपनी सहमति देता हूं।",
    requirements: [
      "उद्यम पंजीकरण के लिए आधार संख्या आवश्यक होगी।",
      "आधार संख्या स्वामित्व फर्म के मामले में स्वामी की, साझेदारी फर्म के मामले में प्रबंध साझेदार की और हिंदू अविभाजित परिवार (HUF) के मामले में कर्ता की होगी।",
      "कंपनी या सीमित देयता भागीदारी या सहकारी समिति या समाज या ट्रस्ट के मामले में, संगठन या इसके अधिकृत हस्ताक्षरकर्ता को अपने आधार संख्या के साथ GSTIN और PAN प्रदान करना होगा।",
    ],
    formSaved: "फॉर्म प्रगति स्वचालित रूप से सहेजी गई",
    formRestored: "पिछला फॉर्म डेटा पुनर्स्थापित",
    printForm: "फॉर्म प्रिंट करें",
    saveProgress: "प्रगति सहेजें",
    uploadDocument: "दस्तावेज़ अपलोड करें",
    documentUploaded: "दस्तावेज़ सफलतापूर्वक अपलोड किया गया",
    accessibilityMode: "उच्च कंट्रास्ट मोड",
    languageToggle: "English",
  },
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.en

export const useTranslation = (language: Language) => {
  const t = (key: TranslationKey): string | string[] => {
    return translations[language][key] || translations.en[key]
  }

  const tArray = (key: TranslationKey): string[] => {
    const value = translations[language][key] || translations.en[key]
    return Array.isArray(value) ? value : [value as string]
  }

  return { t, tArray }
}
