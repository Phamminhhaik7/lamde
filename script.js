// Biến toàn cục
let timeLeft = 90 * 60; // 90 phút (mặc định cho toán)
let answers = {}; // Lưu đáp án của người dùng
let correctAnswers = {}; // Lưu đáp án đúng từ file JSON
let currentQuestion = 1; // Câu hỏi hiện tại
let totalQuestions = 0; // Tổng số câu hỏi
let subject = 'math'; // Môn học mặc định
let score = {
    multipleChoice: 0,
    trueFalse: 0,
    shortAnswer: 0,
    total: 0
}; // Điểm số
let maxScore = {
    multipleChoice: 0,
    trueFalse: 0,
    shortAnswer: 0,
    total: 0
}; // Điểm tối đa
let correctCount = 0; // Số câu đúng
let incorrectCount = 0; // Số câu sai
let unansweredCount = 0; // Số câu chưa trả lời
let timerInterval; // Biến lưu interval của đồng hồ đếm ngược
let resultModal; // Biến lưu modal kết quả

// Khởi tạo ứng dụng
window.onload = () => {
    // Khởi tạo modal kết quả
    resultModal = new bootstrap.Modal(document.getElementById('result-modal'));

    // Thêm sự kiện cho nút tải đáp án mẫu
    document.getElementById('loadDefaultAnswers').addEventListener('click', loadDefaultAnswers);

    // Thêm sự kiện cho nút chọn môn học
    document.getElementById('subject').addEventListener('change', loadQuestions);

    // Tải câu hỏi và bắt đầu đồng hồ
    loadQuestions();
    startTimer();
    goToQuestion(1);

    // Thêm sự kiện cho input file
    document.getElementById('jsonFile').addEventListener('change', handleFileUpload);
    
    // Thêm sự kiện cho input text area
    document.getElementById('jsonText').addEventListener('input', handleTextChange);
};

// Đếm ngược thời gian
function startTimer() {
    const timerElement = document.getElementById('timer');

    // Xóa interval cũ nếu có
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitAnswers();
            return;
        }

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        // Đổi màu khi còn ít thời gian
        if (timeLeft < 300) { // 5 phút
            timerElement.classList.add('text-danger');
            timerElement.classList.add('blink');
        }

        timeLeft--;
    }, 1000);
}

// Tải đáp án mẫu
function loadDefaultAnswers() {
    // Sử dụng đáp án mẫu từ file answer.json
    fetch('answer.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải file đáp án mẫu');
            }
            return response.json();
        })
        .then(data => {
            correctAnswers = data;
            document.getElementById('fileStatus').textContent = 'Đã tải đáp án mẫu';
            document.getElementById('fileStatus').className = 'form-text text-success';
        })
        .catch(error => {
            console.error('Lỗi:', error);
            document.getElementById('fileStatus').textContent = 'Lỗi khi tải đáp án mẫu: ' + error.message;
            document.getElementById('fileStatus').className = 'form-text text-danger';
        });
}

// Xử lý tải file JSON
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            correctAnswers = JSON.parse(e.target.result);
            document.getElementById('fileStatus').textContent = 'Đã tải file đáp án thành công';
            document.getElementById('fileStatus').className = 'form-text text-success';
            document.getElementById('jsonText').value = "";
        } catch (error) {
            console.error('Lỗi khi phân tích file JSON:', error);
            document.getElementById('fileStatus').textContent = 'Lỗi: File JSON không hợp lệ';
            document.getElementById('fileStatus').className = 'form-text text-danger';
        }
    };

    reader.onerror = () => {
        document.getElementById('fileStatus').textContent = 'Lỗi khi đọc file';
        document.getElementById('fileStatus').className = 'form-text text-danger';
    };

    reader.readAsText(file);
}

// Xử lý thay đổi trong text area
function handleTextChange(event) {
    const text = event.target.value;
    if (!text) return;
    try {
        correctAnswers = JSON.parse(text);
        document.getElementById('fileStatus').textContent = 'Đã tải đáp án từ text thành công';
        document.getElementById('fileStatus').className = 'form-text text-success';
        document.getElementById('jsonFile').value = "";
    } catch (error) {
        console.error('Lỗi khi phân tích JSON từ text:', error);
        document.getElementById('fileStatus').textContent = 'Lỗi: JSON từ text không hợp lệ';
        document.getElementById('fileStatus').className = 'form-text text-danger';
    }
}

// Tạo câu hỏi động dựa trên môn học
function loadQuestions() {
    subject = document.getElementById('subject').value;
    const multipleChoiceDiv = document.getElementById('multiple-choice');
    const trueFalseDiv = document.getElementById('true-false');
    const shortAnswerDiv = document.getElementById('short-answer');
    const questionNav = document.getElementById('question-nav');

    // Xóa nội dung cũ
    multipleChoiceDiv.innerHTML = '';
    trueFalseDiv.innerHTML = '';
    shortAnswerDiv.innerHTML = '';
    questionNav.innerHTML = '';

    // Số câu hỏi tùy theo môn học
    let multipleChoiceCount, shortAnswerCount;
    if (subject === 'math') {
        multipleChoiceCount = 12;
        shortAnswerCount = 6;
        timeLeft = 90 * 60; // 90 phút cho toán
    } else if (subject === 'physics' || subject === 'chemistry') {
        multipleChoiceCount = 18;
        shortAnswerCount = 6;
        timeLeft = 50 * 60; // 50 phút cho lý và hóa
    } else {
        multipleChoiceCount = 12;
        shortAnswerCount = 6;
        timeLeft = 90 * 60; // 90 phút cho toán (mặc định)
    }
    const trueFalseCount = 4; // Luôn có 4 câu đúng/sai
    totalQuestions = multipleChoiceCount + trueFalseCount + shortAnswerCount;

    // Tính điểm tối đa
    maxScore.multipleChoice = multipleChoiceCount * 0.25;
    maxScore.trueFalse = trueFalseCount * 1; // Mỗi câu đúng/sai tối đa 1 điểm
    maxScore.shortAnswer = subject === 'math' ? shortAnswerCount * 0.5 : shortAnswerCount * 0.25;
    maxScore.total = maxScore.multipleChoice + maxScore.trueFalse + maxScore.shortAnswer;

    // Tạo câu trắc nghiệm
    for (let i = 1; i <= multipleChoiceCount; i++) {
        multipleChoiceDiv.innerHTML += `
            <div class="mb-4 question" id="q${i}">
                <p class="fw-bold fs-5">Câu ${i}: Câu hỏi trắc nghiệm ${i}?</p>
                <div class="form-check form-check-lg">
                    <input class="form-check-input" type="radio" name="q${i}" id="q${i}A" value="A" onchange="saveAnswer(${i}, 'A')">
                    <label class="form-check-label fs-5" for="q${i}A">Đáp án A</label>
                </div>
                <div class="form-check form-check-lg">
                    <input class="form-check-input" type="radio" name="q${i}" id="q${i}B" value="B" onchange="saveAnswer(${i}, 'B')">
                    <label class="form-check-label fs-5" for="q${i}B">Đáp án B</label>
                </div>
                <div class="form-check form-check-lg">
                    <input class="form-check-input" type="radio" name="q${i}" id="q${i}C" value="C" onchange="saveAnswer(${i}, 'C')">
                    <label class="form-check-label fs-5" for="q${i}C">Đáp án C</label>
                </div>
                <div class="form-check form-check-lg">
                    <input class="form-check-input" type="radio" name="q${i}" id="q${i}D" value="D" onchange="saveAnswer(${i}, 'D')">
                    <label class="form-check-label fs-5" for="q${i}D">Đáp án D</label>
                </div>
                <div id="result-q${i}" class="result mt-2"></div>
            </div>
        `;
        questionNav.innerHTML += `<button class="btn btn-outline-primary" id="nav-q${i}" onclick="goToQuestion(${i})">${i}</button>`;
    }

    // Tạo câu đúng/sai với checkbox
    for (let i = multipleChoiceCount + 1; i <= multipleChoiceCount + trueFalseCount; i++) {
        trueFalseDiv.innerHTML += `
            <div class="mb-4 question" id="q${i}">
                <p class="fw-bold fs-5">Câu ${i}: Câu hỏi đúng/sai ${i - multipleChoiceCount}?</p>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <p class="mb-1 fs-5">a:</p>
                        <div class="form-check form-check-lg">
                            <input class="form-check-input" type="checkbox" id="q${i}a-true" onchange="saveTrueFalseAnswer(${i}, 'a', 'Đúng', this.checked)">
                            <label class="form-check-label fs-5" for="q${i}a-true">Đúng</label>
                        </div>
                        <div class="form-check form-check-lg">
                            <input class="form-check-input" type="checkbox" id="q${i}a-false" onchange="saveTrueFalseAnswer(${i}, 'a', 'Sai', this.checked)">
                            <label class="form-check-label fs-5" for="q${i}a-false">Sai</label>
                        </div>
                    </div>
                    <div class="checkbox-item">
                        <p class="mb-1 fs-5">b:</p>
                        <div class="form-check form-check-lg">
                            <input class="form-check-input" type="checkbox" id="q${i}b-true" onchange="saveTrueFalseAnswer(${i}, 'b', 'Đúng', this.checked)">
                            <label class="form-check-label fs-5" for="q${i}b-true">Đúng</label>
                        </div>
                        <div class="form-check form-check-lg">
                            <input class="form-check-input" type="checkbox" id="q${i}b-false" onchange="saveTrueFalseAnswer(${i}, 'b', 'Sai', this.checked)">
                            <label class="form-check-label fs-5" for="q${i}b-false">Sai</label>
                        </div>
                    </div>
                    <div class="checkbox-item">
                        <p class="mb-1 fs-5">c:</p>
                        <div class="form-check form-check-lg">
                            <input class="form-check-input" type="checkbox" id="q${i}c-true" onchange="saveTrueFalseAnswer(${i}, 'c', 'Đúng', this.checked)">
                            <label class="form-check-label fs-5" for="q${i}c-true">Đúng</label>
                        </div>
                        <div class="form-check form-check-lg">
                            <input class="form-check-input" type="checkbox" id="q${i}c-false" onchange="saveTrueFalseAnswer(${i}, 'c', 'Sai', this.checked)">
                            <label class="form-check-label fs-5" for="q${i}c-false">Sai</label>
                        </div>
                    </div>
                    <div class="checkbox-item">
                        <p class="mb-1 fs-5">d:</p>
                        <div class="form-check form-check-lg">
                            <input class="form-check-input" type="checkbox" id="q${i}d-true" onchange="saveTrueFalseAnswer(${i}, 'd', 'Đúng', this.checked)">
                            <label class="form-check-label fs-5" for="q${i}d-true">Đúng</label>
                        </div>
                        <div class="form-check form-check-lg">
                            <input class="form-check-input" type="checkbox" id="q${i}d-false" onchange="saveTrueFalseAnswer(${i}, 'd', 'Sai', this.checked)">
                            <label class="form-check-label fs-5" for="q${i}d-false">Sai</label>
                        </div>
                    </div>
                </div>
                <div id="result-q${i}" class="result mt-2"></div>
            </div>
        `;
        questionNav.innerHTML += `<button class="btn btn-outline-primary" id="nav-q${i}" onclick="goToQuestion(${i})">${i}</button>`;
    }

    // Tạo câu trả lời ngắn
    for (let i = multipleChoiceCount + trueFalseCount + 1; i <= totalQuestions; i++) {
        shortAnswerDiv.innerHTML += `
            <div class="mb-4 question" id="q${i}">
                <label for="answer-q${i}" class="form-label fw-bold fs-5">Câu ${i}: Câu hỏi trả lời ngắn ${i - multipleChoiceCount - trueFalseCount}?</label>
                <input type="text" class="form-control form-control-lg" id="answer-q${i}" oninput="saveAnswer(${i}, this.value)">
                <div id="result-q${i}" class="result mt-2"></div>
            </div>
        `;
        questionNav.innerHTML += `<button class="btn btn-outline-primary" id="nav-q${i}" onclick="goToQuestion(${i})">${i}</button>`;
    }

    // Reset thống kê và đáp án
    answers = {};
    score = {
        multipleChoice: 0,
        trueFalse: 0,
        shortAnswer: 0,
        total: 0
    };
    correctCount = 0;
    incorrectCount = 0;
    unansweredCount = 0;

    // Hiển thị câu hỏi đầu tiên
    goToQuestion(1);

    // Cập nhật thanh tiến trình
    updateProgressBar();
    
    // Bắt đầu lại đồng hồ
    startTimer();
}

// Lưu đáp án của người dùng
function saveAnswer(question, option) {
    answers[question] = option;

    // Đánh dấu câu hỏi đã trả lời
    const navButton = document.getElementById(`nav-q${question}`);
    if (navButton) {
        navButton.classList.add('answered');
    }

    // Cập nhật thanh tiến trình
    updateProgressBar();
}

// Lưu đáp án đúng/sai
function saveTrueFalseAnswer(question, option, value, checked) {
    // Nếu chọn một giá trị, bỏ chọn giá trị còn lại
    if (checked) {
        if (value === 'Đúng') {
            document.getElementById(`q${question}${option}-false`).checked = false;
        } else {
            document.getElementById(`q${question}${option}-true`).checked = false;
        }

        // Lưu đáp án
        if (!answers[question]) answers[question] = {};
        answers[question][option] = value;
    } else {
        // Nếu bỏ chọn, xóa đáp án
        if (answers[question] && answers[question][option]) {
            delete answers[question][option];
            if (Object.keys(answers[question]).length === 0) {
                delete answers[question];
            }
        }
    }

    // Đánh dấu câu hỏi đã trả lời
    const navButton = document.getElementById(`nav-q${question}`);
    if (navButton && answers[question] && Object.keys(answers[question]).length > 0) {
        navButton.classList.add('answered');
    } else if (navButton) {
        navButton.classList.remove('answered');
    }

    // Cập nhật thanh tiến trình
    updateProgressBar();
}

// Cập nhật thanh tiến trình
function updateProgressBar() {
    const answeredCount = Object.keys(answers).length;
    const percentage = Math.round((answeredCount / totalQuestions) * 100);

    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', percentage);
    progressBar.textContent = `${percentage}%`;
}

// Điều hướng đến câu hỏi cụ thể
function goToQuestion(question) {
    // Xóa lớp active khỏi tất cả câu hỏi
    document.querySelectorAll('.question').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });

    // Xóa lớp current khỏi tất cả nút điều hướng
    document.querySelectorAll('#question-nav button').forEach(btn => {
        btn.classList.remove('current');
    });

    // Hiển thị câu hỏi hiện tại
    const currentQuestionElement = document.getElementById(`q${question}`);
    if (currentQuestionElement) {
        currentQuestionElement.style.display = 'block';
        currentQuestionElement.classList.add('active');
        currentQuestion = question;

        // Đánh dấu nút điều hướng hiện tại
        const navButton = document.getElementById(`nav-q${question}`);
        if (navButton) {
            navButton.classList.add('current');
        }
    }
}

// Chuyển đến câu hỏi trước
function prevQuestion() {
    if (currentQuestion > 1) {
        goToQuestion(currentQuestion - 1);
    }
}

// Chuyển đến câu hỏi tiếp theo
function nextQuestion() {
    if (currentQuestion < totalQuestions) {
        goToQuestion(currentQuestion + 1);
    }
}

// Tính điểm khi hoàn thành
function submitAnswers() {
    // Kiểm tra xem đã tải file đáp án chưa
    if (Object.keys(correctAnswers).length === 0) {
        alert('Vui lòng tải lên file JSON chứa đáp án hoặc nhập đáp án vào ô text trước khi chấm điểm!');
        return;
    }

    // Reset điểm số
    score = {
        multipleChoice: 0,
        trueFalse: 0,
        shortAnswer: 0,
        total: 0
    };
    correctCount = 0;
    incorrectCount = 0;
    unansweredCount = 0;

    const multipleChoiceCount = subject === 'math' ? 12 : 18;
    const trueFalseCount = 4;

    // Tính điểm trắc nghiệm
    for (let i = 1; i <= multipleChoiceCount; i++) {
        const resultDiv = document.getElementById(`result-q${i}`);
        if (answers[i] === correctAnswers[i.toString()]) {
            score.multipleChoice += 0.25;
            correctCount++;
            resultDiv.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i> Đúng';
            resultDiv.className = 'result mt-2 text-success';
        } else if (answers[i] === undefined) {
            unansweredCount++;
            resultDiv.innerHTML = '<i class="bi bi-dash-circle-fill text-secondary"></i> Chưa trả lời';
            resultDiv.className = 'result mt-2 text-secondary';
        } else {
            incorrectCount++;
            resultDiv.innerHTML = `<i class="bi bi-x-circle-fill text-danger"></i> Sai (Đáp án đúng: ${correctAnswers[i.toString()]})`;
            resultDiv.className = 'result mt-2 text-danger';
        }
    }

    // Tính điểm đúng/sai
    for (let i = multipleChoiceCount + 1; i <= multipleChoiceCount + trueFalseCount; i++) {
        const resultDiv = document.getElementById(`result-q${i}`);
        let correctSubCount = 0;
        const userAnswer = answers[i] || {};
        const correctAnswer = correctAnswers[i.toString()];

        if (correctAnswer) {
            let resultHTML = '<ul class="list-group list-group-flush mt-2">';

            ['a', 'b', 'c', 'd'].forEach(option => {
                if (userAnswer[option] === correctAnswer[option]) {
                    correctSubCount++;
                    resultHTML += `<li class="list-group-item text-success"><i class="bi bi-check-circle-fill"></i> ${option.toUpperCase()}: ${correctAnswer[option]}</li>`;
                } else if (userAnswer[option] === undefined) {
                    resultHTML += `<li class="list-group-item text-secondary"><i class="bi bi-dash-circle-fill"></i> ${option.toUpperCase()}: Chưa trả lời (Đáp án: ${correctAnswer[option]})</li>`;
                } else {
                    resultHTML += `<li class="list-group-item text-danger"><i class="bi bi-x-circle-fill"></i> ${option.toUpperCase()}: ${userAnswer[option]} (Đáp án: ${correctAnswer[option]})</li>`;
                }
            });

            resultHTML += '</ul>';

            // Tính điểm theo số ý đúng
            let pointsEarned = 0;
            if (correctSubCount === 1) pointsEarned = 0.1;
            else if (correctSubCount === 2) pointsEarned = 0.25;
            else if (correctSubCount === 3) pointsEarned = 0.5;
            else if (correctSubCount === 4) pointsEarned = 1;

            score.trueFalse += pointsEarned;

            // Hiển thị kết quả
            resultDiv.innerHTML = `<div class="alert ${correctSubCount > 0 ? 'alert-success' : 'alert-danger'}">
                Đúng ${correctSubCount}/4 ý (${pointsEarned} điểm)
                ${resultHTML}
            </div>`;

            if (correctSubCount > 0) {
                correctCount++;
            } else if (Object.keys(userAnswer).length === 0) {
                unansweredCount++;
            } else {
                incorrectCount++;
            }
        }
    }

    // Tính điểm trả lời ngắn
    const shortAnswerPoints = subject === 'math' ? 0.5 : 0.25;
    for (let i = multipleChoiceCount + trueFalseCount + 1; i <= totalQuestions; i++) {
        const resultDiv = document.getElementById(`result-q${i}`);
        const userAnswer = (answers[i] || '').trim();
        const correctAnswer = correctAnswers[i.toString()];

        if (userAnswer === correctAnswer) {
            score.shortAnswer += shortAnswerPoints;
            correctCount++;
            resultDiv.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i> Đúng';
            resultDiv.className = 'result mt-2 text-success';
        } else if (userAnswer === '') {
            unansweredCount++;
            resultDiv.innerHTML = '<i class="bi bi-dash-circle-fill text-secondary"></i> Chưa trả lời';
            resultDiv.className = 'result mt-2 text-secondary';
        } else {
            incorrectCount++;
            resultDiv.innerHTML = `<i class="bi bi-x-circle-fill text-danger"></i> Sai (Đáp án đúng: ${correctAnswer})`;
            resultDiv.className = 'result mt-2 text-danger';
        }
    }

    // Tính tổng điểm
    score.total = score.multipleChoice + score.trueFalse + score.shortAnswer;

    // Hiển thị kết quả trong modal
    document.getElementById('final-score').textContent = score.total.toFixed(2);
    document.getElementById('correct-count').textContent = correctCount;
    document.getElementById('incorrect-count').textContent = incorrectCount;
    document.getElementById('unanswered-count').textContent = unansweredCount;

    document.getElementById('mc-score').textContent = score.multipleChoice.toFixed(2);
    document.getElementById('mc-max').textContent = maxScore.multipleChoice.toFixed(2);

    document.getElementById('tf-score').textContent = score.trueFalse.toFixed(2);
    document.getElementById('tf-max').textContent = maxScore.trueFalse.toFixed(2);

    document.getElementById('sa-score').textContent = score.shortAnswer.toFixed(2);
    document.getElementById('sa-max').textContent = maxScore.shortAnswer.toFixed(2);

    document.getElementById('total-score').textContent = score.total.toFixed(2);
    document.getElementById('total-max').textContent = maxScore.total.toFixed(2);

    // Tạo chi tiết kết quả câu hỏi
    displayQuestionResultsDetail();

    // Hiển thị modal kết quả
    resultModal.show();
}

function displayQuestionResultsDetail() {
    const questionResultsDetailDiv = document.getElementById('question-results-detail');
    questionResultsDetailDiv.innerHTML = ''; // Clear previous results

    const multipleChoiceCount = subject === 'math' ? 12 : 18;
    const trueFalseCount = 4;

    // Kết quả trắc nghiệm
    for (let i = 1; i <= multipleChoiceCount; i++) {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('mb-3', 'p-3', 'border', 'rounded', 'question-result-item');
        let resultIcon = '';
        let resultText = '';
        let resultClass = '';
        let questionContent = '';

        questionContent = `<p class="fw-bold">Câu ${i}: Câu hỏi trắc nghiệm ${i}?</p>`;


        if (answers[i] === correctAnswers[i.toString()]) {
            resultIcon = '<i class="bi bi-check-circle-fill text-success me-2"></i>';
            resultText = `Đúng - Bạn đã chọn ${answers[i]}`;
            resultClass = 'border-success';
        } else if (answers[i] === undefined) {
            resultIcon = '<i class="bi bi-dash-circle-fill text-secondary me-2"></i>';
            resultText = 'Chưa trả lời';
            resultClass = 'border-secondary';
        } else {
            resultIcon = '<i class="bi bi-x-circle-fill text-danger me-2"></i>';
            resultText = `Sai - Bạn đã chọn ${answers[i]}, đáp án đúng là ${correctAnswers[i.toString()]}`;
            resultClass = 'border-danger';
        }

        questionDiv.innerHTML = `<div class="${resultClass}"><h6 class="d-flex align-items-center">${resultIcon} ${resultText}</h6>${questionContent}</div>`;
        questionResultsDetailDiv.appendChild(questionDiv);
    }

    // Kết quả đúng/sai
    for (let i = multipleChoiceCount + 1; i <= multipleChoiceCount + trueFalseCount; i++) {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('mb-3', 'p-3', 'border', 'rounded', 'question-result-item');
        let resultIcon = '<i class="bi bi-exclamation-circle-fill text-warning me-2"></i>';
        let resultText = 'Đúng/Sai - Kết quả chi tiết:';
        let resultClass = 'border-warning';
        let detailList = '<ul class="list-unstyled">';
        let hasCorrect = false;
        let hasIncorrect = false;
        let hasUnanswered = false;
        const userAnswer = answers[i] || {};
        const correctAnswer = correctAnswers[i.toString()];
        let questionContent = `<p class="fw-bold">Câu ${i}: Câu hỏi đúng/sai ${i - multipleChoiceCount}?</p>`;


        if (correctAnswer) {
            ['a', 'b', 'c', 'd'].forEach(option => {
                let optionResult = '';
                let optionIcon = '';
                if (userAnswer[option] === correctAnswer[option]) {
                    optionIcon = '<i class="bi bi-check-circle-fill text-success me-2"></i>';
                    optionResult = `<li class="text-success d-flex align-items-center">${optionIcon} ${option.toUpperCase()}: Đúng</li>`;
                    hasCorrect = true;
                } else if (userAnswer[option] === undefined) {
                    optionIcon = '<i class="bi bi-dash-circle-fill text-secondary me-2"></i>';
                    optionResult = `<li class="text-secondary d-flex align-items-center">${optionIcon} ${option.toUpperCase()}: Chưa trả lời (Đáp án: ${correctAnswer[option]})</li>`;
                    hasUnanswered = true;
                } else {
                    optionIcon = '<i class="bi bi-x-circle-fill text-danger me-2"></i>';
                    optionResult = `<li class="text-danger d-flex align-items-center">${optionIcon} ${option.toUpperCase()}: Sai - Bạn chọn ${userAnswer[option]} (Đáp án: ${correctAnswer[option]})</li>`;
                    hasIncorrect = true;
                }
                detailList += optionResult;
            });
        }
        detailList += '</ul>';

        if (hasCorrect && !hasIncorrect && !hasUnanswered) {
            resultClass = 'border-success';
        } else if (hasIncorrect) {
            resultClass = 'border-danger';
        } else if (hasUnanswered) {
            resultClass = 'border-secondary';
        }

        questionDiv.innerHTML = `<div class="${resultClass}"><h6 class="d-flex align-items-center">${resultIcon} ${resultText}</h6>${questionContent}${detailList}</div>`;
        questionResultsDetailDiv.appendChild(questionDiv);
    }

    // Kết quả trả lời ngắn
    const shortAnswerPoints = subject === 'math' ? 0.5 : 0.25;
    for (let i = multipleChoiceCount + trueFalseCount + 1; i <= totalQuestions; i++) {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('mb-3', 'p-3', 'border', 'rounded', 'question-result-item');
        let userAnswer = (answers[i] || '').trim();
        let correctAnswer = correctAnswers[i.toString()];
        let resultIcon = '';
        let resultText = '';
        let resultClass = '';
        let questionContent = `<p class="fw-bold">Câu ${i}: Câu hỏi trả lời ngắn ${i - multipleChoiceCount - trueFalseCount}?</p>`;


        if (userAnswer === correctAnswer) {
            resultIcon = '<i class="bi bi-check-circle-fill text-success me-2"></i>';
            resultText = `Đúng - Đáp án của bạn: ${userAnswer}`;
            resultClass = 'border-success';
        } else if (userAnswer === '') {
            resultIcon = '<i class="bi bi-dash-circle-fill text-secondary me-2"></i>';
            resultText = 'Chưa trả lời';
            resultClass = 'border-secondary';
        } else {
            resultIcon = '<i class="bi bi-x-circle-fill text-danger me-2"></i>';
            resultText = `Sai - Đáp án của bạn: ${userAnswer}, đáp án đúng là ${correctAnswer}`;
            resultClass = 'border-danger';
        }

        questionDiv.innerHTML = `<div class="${resultClass}"><h6 class="d-flex align-items-center">${resultIcon} ${resultText}</h6>${questionContent}</div>`;
        questionResultsDetailDiv.appendChild(questionDiv);
    }
}
