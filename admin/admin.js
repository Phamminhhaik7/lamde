let config = null;

// Load configuration
async function loadConfig() {
    try {
        const response = await fetch('../data/config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        config = await response.json();
        updateCategorySelects();
        renderExamList();
    } catch (error) {
        console.error('Error loading config:', error);
        // Nếu không thể tải file, khởi tạo cấu hình mặc định
        config = {
            subjects: {
                math: {
                    name: "Toán",
                    categories: {
                        moon: {
                            name: "Moon",
                            description: "Đề thi từ Moon",
                            exams: []
                        },
                        other: {
                            name: "Khác",
                            description: "Các đề thi khác",
                            exams: []
                        }
                    }
                },
                physics: {
                    name: "Vật lý",
                    categories: {
                        moon: {
                            name: "Moon",
                            description: "Đề thi từ Moon",
                            exams: []
                        },
                        other: {
                            name: "Khác",
                            description: "Các đề thi khác",
                            exams: []
                        }
                    }
                },
                chemistry: {
                    name: "Hóa học",
                    categories: {
                        moon: {
                            name: "Moon",
                            description: "Đề thi từ Moon",
                            exams: []
                        },
                        other: {
                            name: "Khác",
                            description: "Các đề thi khác",
                            exams: []
                        }
                    }
                }
            }
        };
        updateCategorySelects();
        renderExamList();
    }
}

// Update category selects when subject changes
function updateCategorySelects() {
    const subjectSelects = document.querySelectorAll('select[name="subject"]');
    subjectSelects.forEach(select => {
        select.addEventListener('change', function() {
            const categorySelect = this.closest('form').querySelector('select[name="category"]');
            const subject = this.value;
            categorySelect.innerHTML = '';
            
            Object.entries(config.subjects[subject].categories).forEach(([key, category]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        });
    });
}

// Handle category form submission
document.getElementById('add-category-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const subject = formData.get('subject');
    const categoryName = formData.get('category-name');
    const categoryDescription = formData.get('category-description');
    const categoryKey = categoryName.toLowerCase().replace(/\s+/g, '-');

    // Add new category to config
    config.subjects[subject].categories[categoryKey] = {
        name: categoryName,
        description: categoryDescription,
        exams: []
    };

    // Save config
    try {
        await saveConfig();
        alert('Thêm mục thành công!');
        this.reset();
        updateCategorySelects();
        renderExamList();
    } catch (error) {
        console.error('Error saving category:', error);
        alert('Không thể lưu mục mới. Vui lòng thử lại.');
    }
});

// Handle exam form submission
document.getElementById('add-exam-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const subject = formData.get('subject');
    const category = formData.get('category');
    const examName = formData.get('exam-name');
    const answerFile = formData.get('answer-file');

    // Read answer file
    try {
        const answerText = await answerFile.text();
        const answers = JSON.parse(answerText);
        
        // Create exam object
        const exam = {
            id: Date.now().toString(),
            name: examName,
            answers: answers
        };

        // Add exam to config
        config.subjects[subject].categories[category].exams.push(exam);

        // Save config
        await saveConfig();
        alert('Thêm đề thành công!');
        this.reset();
        renderExamList();
    } catch (error) {
        console.error('Error processing exam:', error);
        alert('Không thể xử lý file đáp án. Vui lòng kiểm tra lại.');
    }
});

// Save configuration
async function saveConfig() {
    try {
        const blob = new Blob([JSON.stringify(config, null, 4)], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        alert('Không thể lưu cấu hình. Vui lòng thử lại.');
        throw error;
    }
}

// Render exam list
function renderExamList() {
    const examList = document.getElementById('exam-list');
    examList.innerHTML = '';

    Object.entries(config.subjects).forEach(([subjectKey, subject]) => {
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'subject-section';
        subjectDiv.innerHTML = `<h3>${subject.name}</h3>`;

        Object.entries(subject.categories).forEach(([categoryKey, category]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-section';
            categoryDiv.innerHTML = `<h4>${category.name}</h4>`;

            if (category.exams.length > 0) {
                const examTable = document.createElement('table');
                examTable.innerHTML = `
                    <thead>
                        <tr>
                            <th>Tên đề</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                `;

                category.exams.forEach(exam => {
                    examTable.innerHTML += `
                        <tr>
                            <td>${exam.name}</td>
                            <td>
                                <button onclick="editExam('${subjectKey}', '${categoryKey}', '${exam.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteExam('${subjectKey}', '${categoryKey}', '${exam.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });

                examTable.innerHTML += '</tbody></table>';
                categoryDiv.appendChild(examTable);
            } else {
                categoryDiv.innerHTML += '<p>Chưa có đề nào</p>';
            }

            subjectDiv.appendChild(categoryDiv);
        });

        examList.appendChild(subjectDiv);
    });
}

// Edit exam
async function editExam(subject, category, examId) {
    const exam = config.subjects[subject].categories[category].exams.find(e => e.id === examId);
    if (!exam) return;

    const newName = prompt('Nhập tên mới cho đề:', exam.name);
    if (newName && newName !== exam.name) {
        exam.name = newName;
        await saveConfig();
        renderExamList();
    }
}

// Delete exam
async function deleteExam(subject, category, examId) {
    if (confirm('Bạn có chắc chắn muốn xóa đề này?')) {
        config.subjects[subject].categories[category].exams = 
            config.subjects[subject].categories[category].exams.filter(e => e.id !== examId);
        await saveConfig();
        renderExamList();
    }
}

// Initialize
loadConfig(); 