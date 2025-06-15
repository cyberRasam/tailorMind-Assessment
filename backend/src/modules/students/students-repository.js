const { processDBRequest } = require("../../utils");

const getRoleId = async (roleName) => {
    const query = "SELECT id FROM roles WHERE name ILIKE $1";
    const queryParams = [roleName];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0].id;
}

const findAllStudents = async (payload) => {
    const { name, className, section, roll } = payload;
    let query = `
        SELECT
            t1.id,
            t1.name,
            t1.email,
            t1.last_login AS "lastLogin",
            t1.is_active AS "systemAccess"
        FROM users t1
        LEFT JOIN user_profiles t3 ON t1.id = t3.user_id
        WHERE t1.role_id = 3`;
    let queryParams = [];
    if (name) {
        query += ` AND t1.name = $${queryParams.length + 1}`;
        queryParams.push(name);
    }
    if (className) {
        query += ` AND t3.class_name = $${queryParams.length + 1}`;
        queryParams.push(className);
    }
    if (section) {
        query += ` AND t3.section_name = $${queryParams.length + 1}`;
        queryParams.push(section);
    }
    if (roll) {
        query += ` AND t3.roll = $${queryParams.length + 1}`;
        queryParams.push(roll);
    }

    query += ' ORDER BY t1.id';

    const { rows } = await processDBRequest({ query, queryParams });
    return rows;
}

const findUserByEmail = async (email) => {
    const result = await processDBRequest({
        query: 'SELECT * FROM users WHERE email = $1',
        queryParams: [email]
    });
    return result.rows[0];
};

const createUser = async (userData) => {
    const { name, email, roleId, reporterId } = userData;
    const result = await processDBRequest({
        query: `
            INSERT INTO users (name, email, role_id, created_dt, reporter_id)
            VALUES ($1, $2, $3, NOW(), $4)
            RETURNING id
        `,
        queryParams: [name, email, roleId, reporterId]
    });
    return result.rows[0].id;
};

const createUserProfile = async (profileData) => {
    const {
        userId, gender, phone, dob, admissionDt, className, sectionName, roll,
        currentAddress, permanentAddress, fatherName, fatherPhone, motherName,
        motherPhone, guardianName, guardianPhone, relationOfGuardian
    } = profileData;

    await processDBRequest({
        query: `
            INSERT INTO user_profiles (
                user_id, gender, phone, dob, admission_dt, class_name, section_name, roll,
                current_address, permanent_address, father_name, father_phone, mother_name,
                mother_phone, guardian_name, guardian_phone, relation_of_guardian
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `,
        queryParams: [
            userId, gender, phone, dob, admissionDt, className, sectionName, roll,
            currentAddress, permanentAddress, fatherName, fatherPhone, motherName,
            motherPhone, guardianName, guardianPhone, relationOfGuardian
        ]
    });
};

const updateUser = async (userId, userData) => {
    const { name, email, roleId, systemAccess } = userData;
    await processDBRequest({
        query: `
            UPDATE users 
            SET name = $1, email = $2, role_id = $3, is_active = $4, updated_dt = NOW()
            WHERE id = $5
        `,
        queryParams: [name, email, roleId, systemAccess, userId]
    });
};

const updateUserProfile = async (userId, profileData) => {
    const {
        gender, phone, dob, admissionDt, className, sectionName, roll,
        currentAddress, permanentAddress, fatherName, fatherPhone, motherName,
        motherPhone, guardianName, guardianPhone, relationOfGuardian
    } = profileData;

    await processDBRequest({
        query: `
            UPDATE user_profiles 
            SET gender = $1, phone = $2, dob = $3, admission_dt = $4, class_name = $5,
                section_name = $6, roll = $7, current_address = $8, permanent_address = $9,
                father_name = $10, father_phone = $11, mother_name = $12, mother_phone = $13,
                guardian_name = $14, guardian_phone = $15, relation_of_guardian = $16
            WHERE user_id = $17
        `,
        queryParams: [
            gender, phone, dob, admissionDt, className, sectionName, roll,
            currentAddress, permanentAddress, fatherName, fatherPhone, motherName,
            motherPhone, guardianName, guardianPhone, relationOfGuardian, userId
        ]
    });
};


const findStudentDetail = async (id) => {
    const query = `
        SELECT
            u.id,
            u.name,
            u.email,
            u.is_active AS "systemAccess",
            p.phone,
            p.gender,
            p.dob,
            p.class_name AS "class",
            p.section_name AS "section",
            p.roll,
            p.father_name AS "fatherName",
            p.father_phone AS "fatherPhone",
            p.mother_name AS "motherName",
            p.mother_phone AS "motherPhone",
            p.guardian_name AS "guardianName",
            p.guardian_phone AS "guardianPhone",
            p.relation_of_guardian as "relationOfGuardian",
            p.current_address AS "currentAddress",
            p.permanent_address AS "permanentAddress",
            p.admission_dt AS "admissionDate",
            r.name as "reporterName"
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN users r ON u.reporter_id = r.id
        WHERE u.id = $1`;
    const queryParams = [id];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0];
}

const findStudentToSetStatus = async ({ userId, reviewerId, status }) => {
    const now = new Date();
    const query = `
        UPDATE users
        SET
            is_active  = $1,
            status_last_reviewed_dt = $2,
            status_last_reviewer_id = $3
        WHERE id = $4
    `;
    
    const queryParams = [status, now, reviewerId, userId];
    const { rowCount } = await processDBRequest({ query, queryParams });
    return rowCount
}

const findStudentToUpdate = async (paylaod) => {
    const { basicDetails: { name, email }, id } = paylaod;
    const currentDate = new Date();
    const query = `
        UPDATE users
        SET name = $1, email = $2, updated_dt = $3
        WHERE id = $4;
    `;
    const queryParams = [name, email, currentDate, id];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows;
}

const deleteStudent = async (id) => {
    await processDBRequest({ query: 'DELETE FROM user_profiles WHERE user_id = $1', queryParams: [id] });
    const {rowCount} = await processDBRequest({ query: 'DELETE FROM users WHERE id = $1', queryParams: [id] });
    if (rowCount <= 0) {
        throw new Error("Unable to delete student");
    }
    return "Student deleted successfully";
}

module.exports = {
    getRoleId,
    findAllStudents,
    createUser,
    createUserProfile,
    updateUser,
    updateUserProfile,
    findStudentDetail,
    findUserByEmail,
    findStudentToSetStatus,
    findStudentToUpdate,
    deleteStudent,
};
