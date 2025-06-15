const asyncHandler = require("express-async-handler");
const { getAllStudents, getStudentDetail, setStudentStatus, deleteStudentById, addStudent, updateStudent } = require("./students-service");

const handleGetAllStudents = asyncHandler(async (req, res) => {
    const students = await getAllStudents(req.query);
    res.json({ students });
});

const handleAddStudent = async (req, res) => {
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
    try {
        // Get userId from URL params
        req.body.userId = req.params.id;
        
        const result = await updateStudent(req.body);
        
        if (result.status) {
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
