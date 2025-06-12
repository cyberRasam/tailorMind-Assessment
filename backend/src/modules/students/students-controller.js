const asyncHandler = require("express-async-handler");
const { getAllStudents, addNewStudent, getStudentDetail, setStudentStatus, updateStudent, deleteStudentById } = require("./students-service");

const handleGetAllStudents = asyncHandler(async (req, res) => {
    const students = await getAllStudents(req.query);
    res.json({ students });
});

const handleAddStudent = asyncHandler(async (req, res) => {
    const payload = req.body;
    const result = await addNewStudent(payload);
    res.status(201).json({ message: result.message });
});

const handleUpdateStudent = asyncHandler(async (req, res) => {
    const payload = req.body;
    payload.id = req.params.id;
    const result = await updateStudent(payload);
    res.json({ message: result.message });
});

const handleGetStudentDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const studentDetail = await getStudentDetail(id);
    res.json({ studentDetail });
});

const handleStudentStatus = asyncHandler(async (req, res) => {
    const { userId, reviewerId, status } = req.body;
    const result = await setStudentStatus({ userId, reviewerId, status });
    res.json({ message: result.message });
});

const handleDeleteStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const message = await deleteStudentById(id);
    res.json({ message });
}
);

module.exports = {
    handleGetAllStudents,
    handleGetStudentDetail,
    handleAddStudent,
    handleStudentStatus,
    handleUpdateStudent,
    handleDeleteStudent,
};
