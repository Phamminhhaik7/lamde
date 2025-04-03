let questions = [];
let answers = {};
let timeLeft = 50 * 60; // Mặc định 50 phút
let currentQuestion = 0;
let answeredQuestions = new Set();
let currentSubject = 'physics'; // Mặc định là môn Vật lý

const subjectConfig = {
    physics: {
        multipleChoice: 16,
        trueFalse: 4,
        shortAnswer: 6,
        shortAnswerScore: 0.25,
        time: 50 // 50 phút
    },
    chemistry: {
        multipleChoice: 16,
        trueFalse: 4,
        shortAnswer: 6,
        shortAnswerScore: 0.25,
        time: 50 // 50 phút
    },
    math: {
        multipleChoice: 12,
        trueFalse: 4,
        shortAnswer: 6,
        shortAnswerScore: 0.5,
        time: 90 // 90 phút
    }
};

function getQuestionLabel(index, type) {
    const config = subjectConfig[currentSubject];
    if (type === 'multiple-choice') {
        return `Câu ${index + 1}`;
    } else if (type === 'true-false-multi') {
        return `Câu ${index - config.multipleChoice + 1}`;
    } else {
        return `Câu ${index - (config.multipleChoice + config.trueFalse) + 1}`;
    }
}

function getQuestionSection(type) {
    switch(type) {
        case 'multiple-choice':
            return 'PHẦN I: TRẮC NGHIỆM';
        case 'true-false-multi':
            return 'PHẦN II: ĐÚNG/SAI';
        case 'short-answer':
            return 'PHẦN III: TRẢ LỜI NGẮN';
        default:
            return '';
    }
}

function createQuestions() {
    const config = subjectConfig[currentSubject];
    questions = [];

    // Câu hỏi trắc nghiệm
    for (let i = 1; i <= config.multipleChoice; i++) {
        questions.push({
            question: `Câu hỏi trắc nghiệm ${i}?`,
            type: 'multiple-choice',
            options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
            answer: 'C' // Mặc định
        });
    }

    // Câu hỏi đúng/sai
    for (let i = 1; i <= config.trueFalse; i++) {
        questions.push({
            question: `Câu hỏi đúng/sai ${i}?`,
            type: 'true-false-multi',
            parts: ['a', 'b', 'c', 'd'],
            answer: {a: 'Đúng', b: 'Sai', c: 'Đúng', d: 'Sai'} // Mặc định
        });
    }

    // Câu hỏi trả lời ngắn
    for (let i = 1; i <= config.shortAnswer; i++) {
        questions.push({
            question: `Câu hỏi trả lời ngắn ${i}?`,
            type: 'short-answer',
            answer: 'Đáp án ngắn' // Mặc định
        });
    }
}

function renderQuestions() {
    const questionsDiv = document.getElementById('questions');
    const questionNav = document.getElementById('question-nav');
    questionsDiv.innerHTML = '';
    questionNav.innerHTML = '';
    
    let currentSection = '';
    
    questions.forEach((question, index) => {
        // Add section header if section changes
        const section = getQuestionSection(question.type);
        if (section !== currentSection) {
            questionsDiv.innerHTML += `<h2 class="section-header">${section}</h2>`;
            currentSection = section;
        }

        // Render main question content
        let questionHtml = `<div class="question ${index === 0 ? 'active' : ''}" data-index="${index}">
            <h3>${getQuestionLabel(index, question.type)}: ${question.question}</h3>`;

        if (question.type === 'multiple-choice') {
            questionHtml += '<div class="options">';
            question.options.forEach((option, optionIndex) => {
                const value = String.fromCharCode(65 + optionIndex);
                questionHtml += `<label><input type="radio" name="question${index + 1}" value="${value}"> ${option}</label>`;
            });
            questionHtml += '</div>';
        } else if (question.type === 'true-false-multi') {
            questionHtml += '<div class="options">';
            question.parts.forEach(part => {
                questionHtml += `<label>${part}: <input type="radio" name="question${index + 1}${part}" value="Đúng"> Đúng</label>`;
                questionHtml += `<label><input type="radio" name="question${index + 1}${part}" value="Sai"> Sai</label>`;
            });
            questionHtml += '</div>';
        } else if (question.type === 'short-answer') {
            questionHtml += `<input type="text" name="question${index + 1}">`;
        }

        questionHtml += '</div>';
        questionsDiv.innerHTML += questionHtml;

        // Render navigation button with section indicator
        const navButton = document.createElement('button');
        navButton.textContent = getQuestionLabel(index, question.type).replace('Câu ', '');
        if (index === 0 || 
            index === subjectConfig[currentSubject].multipleChoice || 
            index === subjectConfig[currentSubject].multipleChoice + subjectConfig[currentSubject].trueFalse) {
            navButton.classList.add('section-start');
        }
        navButton.setAttribute('data-index', index);
        navButton.addEventListener('click', () => goToQuestion(index));
        questionNav.appendChild(navButton);
    });

    // Load saved answers and update navigation
    loadSavedAnswers();
    updateProgress();
    updateQuestionNav();
}

function updateProgress() {
    const progress = document.getElementById('progress');
    const progressText = document.getElementById('progress-text');
    const percentage = (answeredQuestions.size / questions.length) * 100;
    progress.style.width = `${percentage}%`;
    progressText.textContent = `${answeredQuestions.size}/${questions.length} câu đã trả lời`;
}

function saveAnswer() {
    const question = questions[currentQuestion];
    const questionNumber = currentQuestion + 1;
    let answer = null;

    if (question.type === 'multiple-choice') {
        const selected = document.querySelector(`input[name="question${questionNumber}"]:checked`);
        if (selected) {
            answer = selected.value;
            answeredQuestions.add(currentQuestion);
        }
    } else if (question.type === 'true-false-multi') {
        answer = {};
        let hasAnswer = true;
        question.parts.forEach(part => {
            const selected = document.querySelector(`input[name="question${questionNumber}${part}"]:checked`);
            if (selected) {
                answer[part] = selected.value;
            } else {
                hasAnswer = false;
            }
        });
        if (hasAnswer) {
            answeredQuestions.add(currentQuestion);
        }
    } else if (question.type === 'short-answer') {
        const input = document.querySelector(`input[name="question${questionNumber}"]`);
        if (input.value.trim()) {
            answer = input.value;
            answeredQuestions.add(currentQuestion);
        }
    }

    if (answer) {
        localStorage.setItem(`answer_${questionNumber}`, JSON.stringify(answer));
        updateProgress();
        updateQuestionNav();
    }
}

function loadSavedAnswers() {
    questions.forEach((_, index) => {
        const questionNumber = index + 1;
        const savedAnswer = localStorage.getItem(`answer_${questionNumber}`);
        if (savedAnswer) {
            const answer = JSON.parse(savedAnswer);
            const question = questions[index];
            
            if (question.type === 'multiple-choice') {
                const radio = document.querySelector(`input[name="question${questionNumber}"][value="${answer}"]`);
                if (radio) radio.checked = true;
            } else if (question.type === 'true-false-multi') {
                Object.entries(answer).forEach(([part, value]) => {
                    const radio = document.querySelector(`input[name="question${questionNumber}${part}"][value="${value}"]`);
                    if (radio) radio.checked = true;
                });
            } else if (question.type === 'short-answer') {
                const input = document.querySelector(`input[name="question${questionNumber}"]`);
                if (input) input.value = answer;
            }
            
            answeredQuestions.add(index);
        }
    });
}

function updateQuestionNav() {
    const buttons = document.querySelectorAll('.question-nav button');
    buttons.forEach((button, index) => {
        button.classList.remove('current', 'answered');
        if (index === currentQuestion) {
            button.classList.add('current');
        }
        if (answeredQuestions.has(index)) {
            button.classList.add('answered');
        }
    });
}

function goToQuestion(index) {
    saveAnswer();
    const questions = document.querySelectorAll('.question');
    questions[currentQuestion].classList.remove('active');
    currentQuestion = index;
    questions[currentQuestion].classList.add('active');
    updateQuestionNav();
    
    // Update navigation buttons
    document.getElementById('prev-btn').disabled = currentQuestion === 0;
    document.getElementById('next-btn').disabled = currentQuestion === questions.length - 1;
}

function navigateQuestion(direction) {
    saveAnswer();
    const questions = document.querySelectorAll('.question');
    questions[currentQuestion].classList.remove('active');
    
    if (direction === 'next') {
        currentQuestion = Math.min(currentQuestion + 1, questions.length - 1);
    } else {
        currentQuestion = Math.max(currentQuestion - 1, 0);
    }
    
    questions[currentQuestion].classList.add('active');
    updateQuestionNav();
    
    // Update navigation buttons
    document.getElementById('prev-btn').disabled = currentQuestion === 0;
    document.getElementById('next-btn').disabled = currentQuestion === questions.length - 1;
}

document.getElementById('prev-btn').addEventListener('click', () => navigateQuestion('prev'));
document.getElementById('next-btn').addEventListener('click', () => navigateQuestion('next'));

// Update submit function to show confirmation
document.getElementById('submit').addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn nộp bài? Bạn sẽ không thể thay đổi câu trả lời sau khi nộp.')) {
        submitTest();
    }
});

document.getElementById('answer-file').addEventListener('change', handleAnswerFile);

function handleAnswerFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            answers = JSON.parse(event.target.result);
        } catch (error) {
            console.error('Lỗi khi phân tích cú pháp file JSON đáp án:', error);
            alert('File JSON đáp án không hợp lệ. Vui lòng kiểm tra lại.');
        }
    };

    reader.readAsText(file);
}

function submitTest() {
    let score = 0;
    const results = [];
    const config = subjectConfig[currentSubject];

    questions.forEach((question, index) => {
        const questionNumber = index + 1;
        let userAnswer;
        let correctAnswer = answers[questionNumber.toString()];
        let isCorrect = false;
        let points = 0;

        if (question.type === 'multiple-choice') {
            userAnswer = document.querySelector(`input[name="question${questionNumber}"]:checked`)?.value;
            isCorrect = userAnswer === correctAnswer;
            points = isCorrect ? (10 / config.multipleChoice) : 0;
            score += points;
        } else if (question.type === 'true-false-multi') {
            userAnswer = {};
            let correctParts = 0;
            question.parts.forEach(part => {
                userAnswer[part] = document.querySelector(`input[name="question${questionNumber}${part}"]:checked`)?.value;
                if (userAnswer[part] === correctAnswer[part]) {
                    correctParts++;
                }
            });
            points = (correctParts / 4) * (10 / config.trueFalse);
            score += points;
            isCorrect = correctParts === 4;
        } else if (question.type === 'short-answer') {
            userAnswer = document.querySelector(`input[name="question${questionNumber}"]`).value;
            isCorrect = userAnswer === correctAnswer;
            points = isCorrect ? config.shortAnswerScore : 0;
            score += points;
        }

        results.push({
            question: question.question,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            points: points.toFixed(2)
        });
    });

    displayResults(score, results);
}

function displayResults(score, results) {
    const resultDiv = document.getElementById('result');
    
    resultDiv.innerHTML = `
        <div class="result-summary">
            <h2>Kết quả bài kiểm tra ${currentSubject === 'physics' ? 'Vật lý' : 
                                     currentSubject === 'chemistry' ? 'Hóa học' : 'Toán'}</h2>
            <div class="score">
                ${score.toFixed(2)}/10 điểm (${(score * 10).toFixed(1)}%)
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Câu hỏi</th>
                    <th>Điểm</th>
                    <th>Kết quả</th>
                </tr>
            </thead>
            <tbody>`;

    results.forEach((result, index) => {
        resultDiv.innerHTML += `
            <tr>
                <td>
                    <strong>Câu ${index + 1}:</strong> ${result.question}
                    <div class="answer-comparison">
                        <div class="answer-box">
                            <strong>Câu trả lời của bạn:</strong><br>
                            ${formatAnswer(result.userAnswer)}
                        </div>
                        <div class="answer-box">
                            <strong>Đáp án đúng:</strong><br>
                            ${formatAnswer(result.correctAnswer)}
                        </div>
                    </div>
                </td>
                <td>${result.points}</td>
                <td>
                    <span class="${result.isCorrect ? 'result-correct' : 'result-incorrect'}">
                        ${result.isCorrect ? 'Đúng' : 'Sai'}
                    </span>
                </td>
            </tr>
        `;
    });

    resultDiv.innerHTML += `</tbody></table>`;
}

function formatAnswer(answer) {
    if (!answer) return 'Chưa trả lời';
    if (typeof answer === 'string') return answer;
    if (typeof answer === 'object') {
        return Object.entries(answer)
            .map(([key, value]) => `${key}: ${value}`)
            .join('<br>');
    }
    return JSON.stringify(answer);
}

function updateCountdown() {
    const minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    document.getElementById('time').textContent = `${minutes}:${seconds}`;
    timeLeft--;

    if (timeLeft < 0) {
        clearInterval(countdownInterval);
        submitTest();
    }
}

const countdownInterval = setInterval(updateCountdown, 1000);

// Thêm event listener cho việc chọn môn học
document.getElementById('subject-select').addEventListener('change', function(e) {
    if (confirm('Thay đổi môn học sẽ xóa tất cả câu trả lời hiện tại. Bạn có chắc chắn muốn tiếp tục?')) {
        currentSubject = e.target.value;
        localStorage.clear(); // Xóa các câu trả lời đã lưu
        answeredQuestions.clear();
        timeLeft = subjectConfig[currentSubject].time * 60; // Cập nhật thời gian
        createQuestions();
        renderQuestions();
    } else {
        e.target.value = currentSubject; // Khôi phục lại giá trị cũ
    }
});

createQuestions();
renderQuestions();
