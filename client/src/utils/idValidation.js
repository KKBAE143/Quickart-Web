/**
 * ID Validation Utilities for Indian Identity Documents
 * Provides format validation for Aadhaar, PAN, Driving License, and Voter ID
 */

/**
 * Verhoeff Algorithm for Aadhaar validation
 * Aadhaar uses Verhoeff checksum for the last digit
 */
const verhoeffD = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

const verhoeffP = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

const verhoeffInv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

function verhoeffValidate(num) {
    let c = 0
    const numArr = String(num).split('').reverse().map(Number)
    for (let i = 0; i < numArr.length; i++) {
        c = verhoeffD[c][verhoeffP[i % 8][numArr[i]]]
    }
    return c === 0
}

/**
 * Validate Aadhaar Number
 * - Must be exactly 12 digits
 * - Cannot start with 0 or 1
 * - Must pass Verhoeff checksum
 */
export function validateAadhaar(aadhaar) {
    const cleaned = String(aadhaar).replace(/\s|-/g, '')

    // Basic format check
    if (!/^\d{12}$/.test(cleaned)) {
        return {
            valid: false,
            message: 'Aadhaar must be exactly 12 digits'
        }
    }

    // Cannot start with 0 or 1
    if (/^[01]/.test(cleaned)) {
        return {
            valid: false,
            message: 'Aadhaar cannot start with 0 or 1'
        }
    }

    // Verhoeff checksum validation
    if (!verhoeffValidate(cleaned)) {
        return {
            valid: false,
            message: 'Invalid Aadhaar number (checksum failed)'
        }
    }

    return {
        valid: true,
        message: 'Valid Aadhaar format',
        formatted: `${cleaned.slice(0,4)} ${cleaned.slice(4,8)} ${cleaned.slice(8,12)}`
    }
}

/**
 * Validate PAN Card Number
 * Format: AAAAA9999A
 * - First 5 characters: Uppercase letters
 * - Next 4 characters: Digits
 * - Last character: Uppercase letter
 * - 4th character indicates holder type (P=Personal, C=Company, etc.)
 */
export function validatePAN(pan) {
    const cleaned = String(pan).toUpperCase().trim()

    // Basic format check: 5 letters + 4 digits + 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/
    if (!panRegex.test(cleaned)) {
        return {
            valid: false,
            message: 'PAN must be in format: AAAAA9999A (5 letters + 4 digits + 1 letter)'
        }
    }

    // Check 4th character for valid holder type
    const holderTypes = {
        'A': 'Association of Persons',
        'B': 'Body of Individuals',
        'C': 'Company',
        'F': 'Firm/Partnership',
        'G': 'Government',
        'H': 'Hindu Undivided Family',
        'L': 'Local Authority',
        'J': 'Artificial Juridical Person',
        'P': 'Individual/Person',
        'T': 'Trust'
    }

    const holderType = cleaned[3]
    if (!holderTypes[holderType]) {
        return {
            valid: false,
            message: 'Invalid PAN holder type (4th character)'
        }
    }

    return {
        valid: true,
        message: `Valid PAN (${holderTypes[holderType]})`,
        formatted: cleaned,
        holderType: holderTypes[holderType]
    }
}

/**
 * Validate Driving License Number
 * Format varies by state but generally: SS-RRYYYYNNNNNNN
 * - SS: State code (2 letters)
 * - RR: RTO code (2 digits)
 * - YYYY: Year of issue (4 digits)
 * - NNNNNNN: Serial number (7 digits)
 */
export function validateDrivingLicense(dl) {
    const cleaned = String(dl).toUpperCase().replace(/\s|-/g, '')

    // Indian state codes
    const stateCodes = [
        'AN', 'AP', 'AR', 'AS', 'BR', 'CG', 'CH', 'DD', 'DL', 'GA',
        'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH',
        'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'OR', 'PB', 'PY', 'RJ',
        'SK', 'TN', 'TS', 'TR', 'UK', 'UP', 'WB'
    ]

    // General format: State(2) + RTO(2) + Year(4) + Serial(7) = 15 chars
    // Some states have slight variations
    const dlRegex = /^([A-Z]{2})(\d{2})(\d{4})(\d{7})$/
    const match = cleaned.match(dlRegex)

    if (!match) {
        // Try alternate format: State(2) + Year(2) + Serial(11) = 15 chars
        const altRegex = /^([A-Z]{2})(\d{13})$/
        const altMatch = cleaned.match(altRegex)

        if (!altMatch) {
            return {
                valid: false,
                message: 'Invalid DL format. Expected: SS-RR-YYYY-NNNNNNN (e.g., MH-02-2020-1234567)'
            }
        }

        const stateCode = altMatch[1]
        if (!stateCodes.includes(stateCode)) {
            return {
                valid: false,
                message: `Invalid state code: ${stateCode}`
            }
        }

        return {
            valid: true,
            message: 'Valid DL format',
            formatted: cleaned,
            stateCode
        }
    }

    const [, stateCode, rtoCode, year, serial] = match

    // Validate state code
    if (!stateCodes.includes(stateCode)) {
        return {
            valid: false,
            message: `Invalid state code: ${stateCode}`
        }
    }

    // Validate year (reasonable range)
    const yearNum = parseInt(year)
    const currentYear = new Date().getFullYear()
    if (yearNum < 1970 || yearNum > currentYear) {
        return {
            valid: false,
            message: `Invalid year of issue: ${year}`
        }
    }

    return {
        valid: true,
        message: 'Valid DL format',
        formatted: `${stateCode}-${rtoCode}-${year}-${serial}`,
        stateCode,
        rtoCode,
        yearOfIssue: yearNum
    }
}

/**
 * Validate Voter ID (EPIC)
 * Format: AAA9999999 (3 letters + 7 digits)
 */
export function validateVoterID(voterId) {
    const cleaned = String(voterId).toUpperCase().trim()

    // Format: 3 letters + 7 digits
    const voterIdRegex = /^[A-Z]{3}\d{7}$/

    if (!voterIdRegex.test(cleaned)) {
        return {
            valid: false,
            message: 'Voter ID must be in format: AAA9999999 (3 letters + 7 digits)'
        }
    }

    return {
        valid: true,
        message: 'Valid Voter ID format',
        formatted: cleaned
    }
}

/**
 * Validate ID based on type
 */
export function validateID(idType, idNumber) {
    switch (idType) {
        case 'AADHAAR':
            return validateAadhaar(idNumber)
        case 'PAN':
            return validatePAN(idNumber)
        case 'DRIVING_LICENSE':
            return validateDrivingLicense(idNumber)
        case 'VOTER_ID':
            return validateVoterID(idNumber)
        default:
            return {
                valid: false,
                message: 'Unknown ID type'
            }
    }
}

/**
 * Get placeholder text for ID input based on type
 */
export function getIDPlaceholder(idType) {
    switch (idType) {
        case 'AADHAAR':
            return '1234 5678 9012'
        case 'PAN':
            return 'ABCDE1234F'
        case 'DRIVING_LICENSE':
            return 'MH-02-2020-1234567'
        case 'VOTER_ID':
            return 'ABC1234567'
        default:
            return 'Enter ID number'
    }
}

/**
 * Get help text for ID input based on type
 */
export function getIDHelpText(idType) {
    switch (idType) {
        case 'AADHAAR':
            return '12-digit Aadhaar number (cannot start with 0 or 1)'
        case 'PAN':
            return 'Format: ABCDE1234F (5 letters + 4 digits + 1 letter)'
        case 'DRIVING_LICENSE':
            return 'Format: State-RTO-Year-Serial (e.g., MH-02-2020-1234567)'
        case 'VOTER_ID':
            return 'Format: 3 letters + 7 digits (e.g., ABC1234567)'
        default:
            return ''
    }
}

export default {
    validateAadhaar,
    validatePAN,
    validateDrivingLicense,
    validateVoterID,
    validateID,
    getIDPlaceholder,
    getIDHelpText
}
