const { ApiError, sendAccountVerificationEmail } = require("../../utils");
const { findAllStudents, findStudentDetail, findStudentToSetStatus, deleteStudent, updateUserProfile, updateUser, createUserProfile, createUser, findUserByEmail } = require("./students-repository");
const { findUserById } = require("../../shared/repository");
const { getAllClasses, getClassByName } = require("../classes/classes-repository");
const { getAllSections, getSectionByName } = require("../sections/section-repository");

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
    // Check if class exists
    const classData = await getClassByName(className);
    if (!classData) {
        // Get all available classes for error message
        const allClasses = await getAllClasses();
        const availableClasses = allClasses.map(cls => cls.name).join(', ');
        throw new Error(`Class '${className}' does not exist. Available classes: ${availableClasses}`);
    }
    
    // Check if section exists in the sections table
    const sectionData = await getSectionByName(sectionName);
    if (!sectionData) {
        // Get all available sections for error message
        const allSections = await getAllSections();
        const availableSections = allSections.map(sec => sec.name).join(', ');
        throw new Error(`Section '${sectionName}' does not exist. Available sections: ${availableSections}`);
    }
    
    // Check if the section is assigned to this class
    // The sections field in classes table contains comma-separated section names
    const classSections = classData.sections || '';
    const assignedSections = classSections.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    if (!assignedSections.includes(sectionName)) {
        const availableForClass = assignedSections.length > 0 ? assignedSections.join(', ') : 'None';
        throw new Error(`Section '${sectionName}' is not assigned to class '${className}'. Available sections for ${className}: ${availableForClass}`);
    }
    
    return { classData, sectionData };
};

const extractStudentData = (data) => {
    return {
        userId: data.userId || null,
        name: data.name?.trim() || null,
        roleId: 3, // Student role
        gender: data.gender?.toLowerCase() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim().toLowerCase() || null,
        dob: data.dob ? new Date(data.dob) : null,
        currentAddress: data.currentAddress?.trim() || null,
        permanentAddress: data.permanentAddress?.trim() || null,
        fatherName: data.fatherName?.trim() || null,
        fatherPhone: data.fatherPhone?.trim() || null,
        motherName: data.motherName?.trim() || null,
        motherPhone: data.motherPhone?.trim() || null,
        guardianName: data.guardianName?.trim() || null,
        guardianPhone: data.guardianPhone?.trim() || null,
        relationOfGuardian: data.relationOfGuardian?.trim() || null,
        systemAccess: data.systemAccess || false,
        className: data.class?.trim() || null,
        sectionName: data.section?.trim() || null,
        admissionDt: data.admissionDate ? new Date(data.admissionDate) : null,
        roll: data.roll ? parseInt(data.roll) : null
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
