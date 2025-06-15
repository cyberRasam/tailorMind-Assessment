const { ApiError, sendAccountVerificationEmail } = require("../../utils");
const { findAllStudents, findStudentDetail, findStudentToSetStatus, deleteStudent, updateUserProfile, updateUser, createUserProfile, createUser, findUserByEmail } = require("./students-repository");
const { findUserById } = require("../../shared/repository");
const { getAllClasses } = require("../classes/classes-repository");
const { getAllSections } = require("../sections/section-repository");

const checkStudentId = async (id) => {
    const isStudentFound = await findUserById(id);
    if (!isStudentFound) {
        throw new ApiError(404, "Student not found");
    }
}

const getAllStudents = async (payload) => {
    const students = await findAllStudents(payload);
    if (students.length <= 0) {
        throw new ApiError(404, "Students not found");
    }

    return students;
}

const getStudentDetail = async (id) => {
    await checkStudentId(id);

    const student = await findStudentDetail(id);
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    return student;
}

const validateClassAndSection = async (className, sectionName) => {
    // Get all active classes
    const allClasses = await getAllClasses();
    
    // Check if class exists
    const classData = allClasses.find(cls => cls.class_name === className);
    if (!classData) {
        const availableClasses = allClasses.map(cls => cls.class_name).join(', ');
        throw new Error(`Class '${className}' does not exist. Available classes: ${availableClasses}`);
    }
    
    // Get all active sections
    const allSections = await getAllSections();
    
    // Check if section exists for this class
    const sectionData = allSections.find(sec => 
        sec.section_name === sectionName && sec.class_name === className
    );
    
    if (!sectionData) {
        const availableSections = allSections
            .filter(sec => sec.class_name === className)
            .map(sec => sec.section_name)
            .join(', ');
        
        if (availableSections) {
            throw new Error(`Section '${sectionName}' does not exist for class '${className}'. Available sections for ${className}: ${availableSections}`);
        } else {
            throw new Error(`No sections available for class '${className}'`);
        }
    }
    
    return { classData, sectionData };
};

const extractStudentData = (data) => {
    return {
        userId: data.userId || null,
        name: data.name || null,
        roleId: 3, // Student role
        gender: data.gender || null,
        phone: data.phone || null,
        email: data.email || null,
        dob: data.dob ? new Date(data.dob) : null,
        currentAddress: data.currentAddress || null,
        permanentAddress: data.permanentAddress || null,
        fatherName: data.fatherName || null,
        fatherPhone: data.fatherPhone || null,
        motherName: data.motherName || null,
        motherPhone: data.motherPhone || null,
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        relationOfGuardian: data.relationOfGuardian || null,
        systemAccess: data.systemAccess || false,
        className: data.class || null,
        sectionName: data.section || null,
        admissionDt: data.admissionDate ? new Date(data.admissionDate) : null,
        roll: data.roll || null
    };
};

const addStudent = async (data) => {
    const studentData = extractStudentData(data);

    await validateClassAndSection(studentData.className, studentData.sectionName);

    // Check if user already exists
    const existingUser = await findUserByEmail(studentData.email);
    if (existingUser) {
        throw new Error('Email already exists');
    }

    // Create user (reporterId can be set to 1 or any default admin ID)
    const userId = await createUser({
        name: studentData.name,
        email: studentData.email,
        roleId: studentData.roleId,
        reporterId: 1 // Default admin ID or pass from request
    });

    // Create user profile
    await createUserProfile({
        userId,
        gender: studentData.gender,
        phone: studentData.phone,
        dob: studentData.dob,
        admissionDt: studentData.admissionDt,
        className: studentData.className,
        sectionName: studentData.sectionName,
        roll: studentData.roll,
        currentAddress: studentData.currentAddress,
        permanentAddress: studentData.permanentAddress,
        fatherName: studentData.fatherName,
        fatherPhone: studentData.fatherPhone,
        motherName: studentData.motherName,
        motherPhone: studentData.motherPhone,
        guardianName: studentData.guardianName,
        guardianPhone: studentData.guardianPhone,
        relationOfGuardian: studentData.relationOfGuardian
    });

    return {
        userId: userId,
        message: 'Student added successfully'
    };
};

const updateStudent = async (data) => {
    const studentData = extractStudentData(data);

    // Check if user exists
    await checkStudentId(studentData.userId);

    // Validate class and section
    await validateClassAndSection(studentData.className, studentData.sectionName);


    // Update user
    await updateUser(studentData.userId, {
        name: studentData.name,
        email: studentData.email,
        roleId: studentData.roleId,
        systemAccess: studentData.systemAccess
    });

    // Update user profile
    await updateUserProfile(studentData.userId, {
        gender: studentData.gender,
        phone: studentData.phone,
        dob: studentData.dob,
        admissionDt: studentData.admissionDt,
        className: studentData.className,
        sectionName: studentData.sectionName,
        roll: studentData.roll,
        currentAddress: studentData.currentAddress,
        permanentAddress: studentData.permanentAddress,
        fatherName: studentData.fatherName,
        fatherPhone: studentData.fatherPhone,
        motherName: studentData.motherName,
        motherPhone: studentData.motherPhone,
        guardianName: studentData.guardianName,
        guardianPhone: studentData.guardianPhone,
        relationOfGuardian: studentData.relationOfGuardian
    });

    return {
        userId: studentData.userId,
        message: 'Student updated successfully'
    };
};


const setStudentStatus = async ({ userId, reviewerId, status }) => {
    await checkStudentId(userId);
    
    const affectedRow = await findStudentToSetStatus({ userId, reviewerId, status });
    if (affectedRow <= 0) {
        throw new ApiError(500, "Unable to disable student");
    }

    return { message: "Student status changed successfully" };
}

const deleteStudentById = async (id) => {
    await checkStudentId(id);

    const message = await deleteStudent(id);
    if (!message) {
        throw new ApiError(500, "Unable to delete student");
    }

    return { message };
}

module.exports = {
    getAllStudents,
    getStudentDetail,
    addStudent,
    updateStudent,
    setStudentStatus,
    deleteStudentById,
};
