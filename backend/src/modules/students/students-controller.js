const asyncHandler = require("express-async-handler");
const { getAllStudents, getStudentDetail, setStudentStatus, deleteStudentById, addStudent, updateStudent } = require("./students-service");

const handleGetAllStudents = asyncHandler(async (req, res) => {
    const students = await getAllStudents(req.query);
    res.json({ students });
});

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toString() !== 'Invalid Date';
};

const validateStudentInput = (data) => {
    const errors = [];
    
    // Required fields validation
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Valid email is required');
    }
    
    if (!data.gender || !['male', 'female', 'other'].includes(data.gender.toLowerCase())) {
        errors.push('Gender is required and must be male, female, or other');
    }
    
    if (!data.dob || !isValidDate(data.dob)) {
        errors.push('Date of birth is required and must be a valid date');
    }
    
    if (!data.class || typeof data.class !== 'string' || data.class.trim().length === 0) {
        errors.push('Class is required and must be a non-empty string');
    }
    
    if (!data.section || typeof data.section !== 'string' || data.section.trim().length === 0) {
        errors.push('Section is required and must be a non-empty string');
    }
    
    if (!data.roll) {
        errors.push('Roll number is required');
    } else {
        const rollNum = parseInt(data.roll);
        if (isNaN(rollNum) || rollNum <= 0) {
            errors.push('Roll number must be a positive integer');
        }
    }
    
    if (!data.fatherName || typeof data.fatherName !== 'string' || data.fatherName.trim().length === 0) {
        errors.push('Father name is required and must be a non-empty string');
    }
    
    if (!data.guardianName || typeof data.guardianName !== 'string' || data.guardianName.trim().length === 0) {
        errors.push('Guardian name is required and must be a non-empty string');
    }
    
    if (!data.guardianPhone || typeof data.guardianPhone !== 'string' || data.guardianPhone.trim().length === 0) {
        errors.push('Guardian phone is required and must be a non-empty string');
    }
    
    if (!data.relationOfGuardian || typeof data.relationOfGuardian !== 'string' || data.relationOfGuardian.trim().length === 0) {
        errors.push('Relation of guardian is required and must be a non-empty string');
    }
    
    if (!data.currentAddress || typeof data.currentAddress !== 'string' || data.currentAddress.trim().length === 0) {
        errors.push('Current address is required and must be a non-empty string');
    }
    
    if (!data.permanentAddress || typeof data.permanentAddress !== 'string' || data.permanentAddress.trim().length === 0) {
        errors.push('Permanent address is required and must be a non-empty string');
    }
    
    // Optional field validations
    if (data.phone && (typeof data.phone !== 'string' || data.phone.trim().length === 0)) {
        errors.push('Phone must be a non-empty string if provided');
    }
    
    if (data.admissionDate && !isValidDate(data.admissionDate)) {
        errors.push('Admission date must be a valid date if provided');
    }
    
    // Phone number validations for optional fields
    const optionalPhoneFields = ['fatherPhone', 'motherPhone'];
    optionalPhoneFields.forEach(field => {
        if (data[field] && (typeof data[field] !== 'string' || data[field].trim().length === 0)) {
            errors.push(`${field} must be a non-empty string if provided`);
        }
    });
    
    // Optional name fields
    if (data.motherName && (typeof data.motherName !== 'string' || data.motherName.trim().length === 0)) {
        errors.push('Mother name must be a non-empty string if provided');
    }
    
    // Date validations - ensure dates are not in the future for DOB
    if (data.dob && isValidDate(data.dob)) {
        const dobDate = new Date(data.dob);
        const today = new Date();
        if (dobDate > today) {
            errors.push('Date of birth cannot be in the future');
        }
        
        // Check if age is reasonable (between 3 and 25 years old)
        const age = today.getFullYear() - dobDate.getFullYear();
        if (age < 3 || age > 25) {
            errors.push('Student age must be between 3 and 25 years');
        }
    }
    
    return errors;
};

const handleAddStudent = async (req, res) => {
    // Input validation
    const validationErrors = validateStudentInput(req.body);
    if (validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                description: validationErrors.join(', ')
            }
        });
    }

    try {
        const result = await addStudent(req.body);
        
        if (result) {
            return res.status(201).json({
                success: true,
                data: {
                    userId: result.userId,
                    message: result.message
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                error: {
                    message: result.description
                }
            });
        }
    } catch (error) {
        console.error('Error in addStudent:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                description: error.message
            }
        });
    }
};

const handleUpdateStudent = async (req, res) => {
    // Input validation
    const validationErrors = validateStudentInput(req.body);
    if (validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                description: validationErrors.join(', ')
            }
        });
    }

    try {
        // Get userId from URL params
        req.body.userId = req.params.id;
        
        const result = await updateStudent(req.body);
        
        if (result) {
            return res.status(200).json({
                success: true,
                data: {
                    userId: result.userId,
                    message: result.message
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                error: {
                    message: result.message,
                    description: result.description
                }
            });
        }
    } catch (error) {
        console.error('Error in updateStudent:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                description: error.message
            }
        });
    }
};

const handleGetStudentDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const studentDetail = await getStudentDetail(id);
    res.json({ studentDetail });
});

const handleStudentStatus = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const {status} = req.body;
    const reviewerId = req.user?.id;
    if (reviewerId === userId) {
        return res.status(400).json({ message: "You cannot change your own status." });
    }
    if (reviewerId !==1) {
        return res.status(403).json({ message: "You do not have permission to change student status." });
    }
    const result = await setStudentStatus({ userId, reviewerId, status });
    res.json({ message: result.message });
});

const handleDeleteStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await deleteStudentById(id);
    res.json( result);
}
);

module.exports = {
    handleAddStudent,
    handleUpdateStudent,
    handleGetAllStudents,
    handleGetStudentDetail,
    handleStudentStatus,
    handleDeleteStudent,
};
