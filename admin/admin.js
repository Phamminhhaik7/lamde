// GitHub configuration
const GITHUB_TOKEN = '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'; // Thêm GitHub token của bạn vào đây
const GITHUB_USERNAME = 'Phamminhhaik7';
const GITHUB_REPO = 'lamde';
const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/Phamminhhaik7/lamde/refs/heads/master/';
const GITHUB_CONFIG_URL = `${GITHUB_RAW_URL}/data/config.json`;
const GITHUB_ANSWERS_PATH = `${GITHUB_RAW_URL}/data/answers`;

let config = null;

// Get current SHA of a file
async function getFileSHA(path) {
    try {
        const response = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${path}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data.sha;
        }
        return null;
    } catch (error) {
        console.error('Error getting file SHA:', error);
        return null;
    }
}

// Update file on GitHub
async function updateGitHubFile(path, content, message) {
    try {
        const sha = await getFileSHA(path);
        const response = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                content: btoa(content),
                sha: sha
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update file');
        }

        return true;
    } catch (error) {
        console.error('Error updating file:', error);
        throw error;
    }
}

// Load configuration
async function loadConfig() {
    try {
        const response = await fetch(GITHUB_CONFIG_URL);
        if (response.ok) {
            config = await response.json();
        } else {
            // Tạo config mặc định nếu chưa có
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
        }
        updateCategorySelects();
        renderExamList();
    } catch (error) {
        console.error('Error loading config:', error);
        alert('Không thể tải cấu hình. Vui lòng thử lại.');
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

    try {
        const answerText = await answerFile.text();
        const answers = JSON.parse(answerText);
        
        // Generate unique filename for answer file
        const timestamp = Date.now();
        const filename = `${subject}_${category}_${timestamp}.json`;
        const answerUrl = `${GITHUB_ANSWERS_PATH}/${filename}`;

        // Create exam object with answer file URL
        const exam = {
            id: timestamp.toString(),
            name: examName,
            answerUrl: answerUrl,
            answers: answers
        };

        // Add exam to config
        config.subjects[subject].categories[category].exams.push(exam);

        // Update config.json on GitHub
        await updateGitHubFile(
            'data/config.json',
            JSON.stringify(config, null, 2),
            `Add new exam: ${examName}`
        );

        // Update answer file on GitHub
        await updateGitHubFile(
            `data/answers/${filename}`,
            JSON.stringify(answers, null, 2),
            `Add answers for exam: ${examName}`
        );

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
        localStorage.setItem('quizConfig', JSON.stringify(config));
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        alert('Không thể lưu cấu hình. Vui lòng thử lại.');
        throw error;
    }
}

// Export configuration
function exportConfig() {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import configuration
async function importConfig(file) {
    try {
        const text = await file.text();
        const importedConfig = JSON.parse(text);
        config = importedConfig;
        await saveConfig();
        updateCategorySelects();
        renderExamList();
        alert('Nhập cấu hình thành công!');
    } catch (error) {
        console.error('Error importing config:', error);
        alert('Không thể nhập file cấu hình. Vui lòng kiểm tra định dạng file.');
    }
}

// Render exam list with download links
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
                            <th>Đáp án</th>
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
                                <a href="${exam.answerUrl}" target="_blank" class="btn btn-sm btn-info">
                                    <i class="fas fa-download"></i> Tải đáp án
                                </a>
                            </td>
                            <td>
                                <button onclick="editExam('${subjectKey}', '${categoryKey}', '${exam.id}')" class="btn btn-sm btn-success">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteExam('${subjectKey}', '${categoryKey}', '${exam.id}')" class="btn btn-sm btn-danger">
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

// Add import/export buttons to the page
function addImportExportButtons() {
    const container = document.querySelector('.container');
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'import-export-buttons';
    buttonsDiv.innerHTML = `
        <button onclick="exportConfig()" class="btn btn-primary">
            <i class="fas fa-download"></i> Tải xuống cấu hình
        </button>
        <input type="file" id="importConfig" accept=".json" style="display: none">
        <button onclick="document.getElementById('importConfig').click()" class="btn btn-primary">
            <i class="fas fa-upload"></i> Tải lên cấu hình
        </button>
    `;
    container.insertBefore(buttonsDiv, container.firstChild);

    // Add event listener for file import
    document.getElementById('importConfig').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importConfig(e.target.files[0]);
        }
    });
}

// Initialize
loadConfig();
addImportExportButtons(); 