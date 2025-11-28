document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.classList.add('theme-transition');
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        setTimeout(() => {
            html.classList.remove('theme-transition');
        }, 300);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            icon.title = 'Switch to light mode';
        } else {
            icon.className = 'fas fa-moon';
            icon.title = 'Switch to dark mode';
        }
    }

    tippy('[data-tippy-content]', {
        animation: 'scale-extreme',
        theme: 'material',
        arrow: true,
        delay: [100, 0],
        duration: [200, 150],
        interactive: true,
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 100;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                history.pushState(null, null, targetId);
            }
        });
    });

    const generateBtn = document.getElementById('generateBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const questionsContainer = document.getElementById('questionsContainer');
    const questionsList = document.getElementById('questionsList');
    const prevQuestionBtn = document.getElementById('prevQuestion');
    const nextQuestionBtn = document.getElementById('nextQuestion');
    const currentQuestionEl = document.getElementById('currentQuestion');
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const questionsAnsweredEl = document.getElementById('questionsAnswered');
    const tabAll = document.getElementById('tabAll');
    const tabUnanswered = document.getElementById('tabUnanswered');
    const tabAnswered = document.getElementById('tabAnswered');
    const startPracticingBtn = document.getElementById('startPracticing');
    
    if (startPracticingBtn) {
        startPracticingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('practice-now').scrollIntoView({ behavior: 'smooth' });
        });
    }

    let questions = [];
    let currentQuestionIndex = 0;
    let answeredQuestions = new Set();
    let currentFilter = 'all';
    let sessionStartTime = null;
    let correctAnswers = 0;

    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });

    if (generateBtn) generateBtn.addEventListener('click', generateQuestions);
    if (prevQuestionBtn) prevQuestionBtn.addEventListener('click', showPreviousQuestion);
    if (nextQuestionBtn) nextQuestionBtn.addEventListener('click', showNextQuestion);
    if (tabAll) tabAll.addEventListener('click', () => filterQuestions('all'));
    if (tabUnanswered) tabUnanswered.addEventListener('click', () => filterQuestions('unanswered'));
    if (tabAnswered) tabAnswered.addEventListener('click', () => filterQuestions('answered'));

    async function generateQuestions() {
        const category = document.getElementById('category').value;
        const difficulty = document.getElementById('difficulty').value;
        const count = parseInt(document.getElementById('questionCount').value);

        generateBtn.disabled = true;
        generateBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
        `;
        
        loadingIndicator.classList.remove('hidden');
        if (questionsContainer) questionsContainer.classList.add('hidden');

        sessionStartTime = new Date();
        
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const response = await fetch('/get_questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category: category,
                    difficulty: difficulty,
                    count: count
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch questions');
            }

            const data = await response.json();
            questions = data.questions;
            currentQuestionIndex = 0;
            answeredQuestions = new Set();
            correctAnswers = 0;
            
            // Update UI
            renderQuestions();
            updateQuestionCounter();
            updateNavigationButtons();
            
            // Show questions with animation
            loadingIndicator.classList.add('hidden');
            if (questionsContainer) {
                questionsContainer.classList.remove('hidden');
                questionsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Add animation class to questions container
                questionsContainer.classList.add('animate__animated', 'animate__fadeIn');
                setTimeout(() => {
                    questionsContainer.classList.remove('animate__animated', 'animate__fadeIn');
                }, 1000);
            }
            
            showToast('Questions generated successfully!', 'success');
            triggerConfetti();
            
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to generate questions. Please try again.', 'error');
        } finally {
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.innerHTML = `
                    <i class="fas fa-bolt"></i>
                    <span>Generate Questions</span>
                `;
            }
            loadingIndicator.classList.add('hidden');
        }
    }

    // Render Questions with animations
    function renderQuestions() {
        if (!questionsList) return;
        
        questionsList.innerHTML = '';
        
        questions.forEach((question, index) => {
            const isAnswered = answeredQuestions.has(index);
            const questionEl = document.createElement('div');
            questionEl.className = `question-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg ${isAnswered ? 'border-l-4 border-green-500' : ''}`;
            questionEl.dataset.index = index;
            questionEl.dataset.answered = isAnswered;
            questionEl.dataset.aos = 'fade-up';
            questionEl.dataset.aosDelay = (index * 100) + 100;
            
            // Format category name for display
            const categoryName = question.category 
                ? question.category.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
                : 'General';
            
            questionEl.innerHTML = `
                <div class="flex flex-col space-y-3">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-2">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyBadgeClass(question.difficulty)}">
                                    ${question.difficulty ? question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) : 'Medium'}
                                </span>
                                <span class="text-xs text-gray-500 dark:text-gray-400">${categoryName}</span>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${escapeHtml(question.question)}</h3>
                        </div>
                        <div class="ml-4 flex-shrink-0">
                            <label class="inline-flex items-center cursor-pointer group">
                                <div class="relative">
                                    <input type="checkbox" class="sr-only peer" ${isAnswered ? 'checked' : ''}>
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                                </div>
                                <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    ${isAnswered ? 'Answered' : 'Mark as answered'}
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="mt-4 space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Answer:</label>
                            <div class="relative">
                                <textarea 
                                    class="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-200" 
                                    rows="4" 
                                    placeholder="Type your detailed answer here..."
                                    data-gramm_editor="false"
                                >${question.userAnswer ? escapeHtml(question.userAnswer) : ''}</textarea>
                                <div class="absolute bottom-2 right-2 flex items-center space-x-1">
                                    <button class="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-colors" data-tippy-content="Format code">
                                        <i class="fas fa-code text-sm"></i>
                                    </button>
                                    <button class="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-colors" data-tippy-content="Insert code snippet">
                                        <i class="fas fa-terminal text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex flex-wrap items-center justify-between pt-2">
                            <div class="flex items-center space-x-2">
                                <button class="show-answer-btn inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors" 
                                        data-question-id="${question.id || index}">
                                    <i class="far fa-lightbulb mr-1.5"></i> 
                                    <span>Show Sample Answer</span>
                                </button>
                                
                                <button class="save-note-btn p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-colors" data-tippy-content="Save note">
                                    <i class="far fa-bookmark text-sm"></i>
                                </button>
                                
                                <button class="timer-btn p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-colors" data-tippy-content="Start timer">
                                    <i class="far fa-clock text-sm"></i>
                                </button>
                            </div>
                            
                            <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                <span class="whitespace-nowrap">Question ${index + 1} of ${questions.length}</span>
                                <span class="text-gray-300 dark:text-gray-600">•</span>
                                <span class="whitespace-nowrap">
                                    <i class="far fa-clock mr-1"></i> 
                                    <span class="time-spent">0:00</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="answer-container mt-4 hidden">
                        <div class="relative bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <div class="absolute top-2 right-2">
                                <button class="copy-answer-btn p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full transition-colors" data-tippy-content="Copy answer">
                                    <i class="far fa-copy text-sm"></i>
                                </button>
                            </div>
                            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <i class="fas fa-robot text-indigo-500 mr-2"></i>
                                Sample Answer
                            </h4>
                            <div class="answer-content prose prose-sm max-w-none dark:prose-invert">
                                <div class="animate-pulse flex space-x-4">
                                    <div class="flex-1 space-y-4 py-1">
                                        <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                                        <div class="space-y-2">
                                            <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                                            <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                    <i class="far fa-thumbs-up mr-1"></i> 
                                    <span>Was this helpful?</span>
                                </span>
                                <div class="flex space-x-1">
                                    <button class="feedback-btn p-1.5 text-gray-400 hover:text-green-500 dark:hover:text-green-400 rounded-full transition-colors" data-feedback="helpful" data-tippy-content="Helpful">
                                        <i class="far fa-thumbs-up"></i>
                                    </button>
                                    <button class="feedback-btn p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-colors" data-feedback="not-helpful" data-tippy-content="Not helpful">
                                        <i class="far fa-thumbs-down"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add event listeners
            const checkbox = questionEl.querySelector('input[type="checkbox"]');
            const textarea = questionEl.querySelector('textarea');
            const showAnswerBtn = questionEl.querySelector('.show-answer-btn');
            const copyAnswerBtn = questionEl.querySelector('.copy-answer-btn');
            const feedbackBtns = questionEl.querySelectorAll('.feedback-btn');
            const saveNoteBtn = questionEl.querySelector('.save-note-btn');
            const timerBtn = questionEl.querySelector('.timer-btn');
            
            if (checkbox) {
                checkbox.addEventListener('change', () => toggleAnswerStatus(index, checkbox.checked));
            }
            
            if (textarea) {
                textarea.addEventListener('input', () => saveAnswer(index, textarea.value));
                
                // Auto-resize textarea
                const adjustTextareaHeight = () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                };
                
                textarea.addEventListener('input', adjustTextareaHeight);
                // Initial adjustment
                setTimeout(adjustTextareaHeight, 100);
            }
            
            if (showAnswerBtn) {
                showAnswerBtn.addEventListener('click', (e) => toggleAnswer(e, questionEl));
            }
            
            if (copyAnswerBtn) {
                copyAnswerBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const answerContent = questionEl.querySelector('.answer-content').textContent.trim();
                    if (answerContent) {
                        navigator.clipboard.writeText(answerContent).then(() => {
                            const originalHTML = copyAnswerBtn.innerHTML;
                            copyAnswerBtn.innerHTML = '<i class="fas fa-check text-sm"></i>';
                            copyAnswerBtn.classList.remove('text-gray-400');
                            copyAnswerBtn.classList.add('text-green-500');
                            
                            setTimeout(() => {
                                copyAnswerBtn.innerHTML = originalHTML;
                                copyAnswerBtn.classList.remove('text-green-500');
                                copyAnswerBtn.classList.add('text-gray-400');
                            }, 2000);
                        });
                    }
                });
            }
            
            feedbackBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const feedbackType = btn.dataset.feedback;
                    handleFeedback(index, feedbackType, btn);
                });
            });
            
            if (saveNoteBtn) {
                saveNoteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Toggle active state
                    saveNoteBtn.classList.toggle('text-indigo-600');
                    saveNoteBtn.classList.toggle('dark:text-indigo-400');
                    saveNoteBtn.classList.toggle('text-gray-400');
                    
                    const icon = saveNoteBtn.querySelector('i');
                    if (icon) {
                        if (icon.classList.contains('far')) {
                            icon.classList.remove('far');
                            icon.classList.add('fas');
                            showToast('Note saved successfully!', 'success');
                        } else {
                            icon.classList.remove('fas');
                            icon.classList.add('far');
                        }
                    }
                });
            }
            
            if (timerBtn) {
                let timerInterval;
                let secondsSpent = 0;
                const timeSpentEl = questionEl.querySelector('.time-spent');
                
                const startTimer = () => {
                    timerInterval = setInterval(() => {
                        secondsSpent++;
                        const minutes = Math.floor(secondsSpent / 60);
                        const seconds = secondsSpent % 60;
                        if (timeSpentEl) {
                            timeSpentEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                        }
                    }, 1000);
                };
                
                const stopTimer = () => {
                    if (timerInterval) {
                        clearInterval(timerInterval);
                    }
                };
                
                timerBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const icon = timerBtn.querySelector('i');
                    
                    if (icon.classList.contains('fa-play')) {
                        // Start timer
                        icon.classList.remove('fa-play');
                        icon.classList.add('fa-pause');
                        startTimer();
                        timerBtn.setAttribute('data-tippy-content', 'Pause timer');
                    } else {
                        // Pause timer
                        icon.classList.remove('fa-pause');
                        icon.classList.add('fa-play');
                        stopTimer();
                        timerBtn.setAttribute('data-tippy-content', 'Start timer');
                    }
                    
                    // Update tooltip
                    if (tippy) {
                        const instance = tippy(timerBtn);
                        if (instance && instance[0]) {
                            instance[0].setContent(timerBtn.getAttribute('data-tippy-content'));
                        }
                    }
                });
                
                // Initialize with play icon
                const icon = timerBtn.querySelector('i');
                icon.classList.remove('fa-clock');
                icon.classList.add('fa-play');
            }
            
            questionsList.appendChild(questionEl);
        });
        
        // Initialize AOS for new elements
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }

    // Toggle answer visibility with animation
    function toggleAnswer(event, questionEl) {
        if (!questionEl) return;
        
        event.preventDefault();
        const answerContainer = questionEl.querySelector('.answer-container');
        const button = event.currentTarget;
        
        if (!answerContainer) return;
        
        if (answerContainer.classList.contains('hidden')) {
            // If we haven't loaded the answer yet, fetch it
            const questionId = button.dataset.questionId;
            const answerContent = answerContainer.querySelector('.answer-content');
            
            // Show loading state
            button.disabled = true;
            button.innerHTML = `
                <svg class="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading...</span>
            `;
            
            // Add a small delay for better UX
            setTimeout(() => {
                fetchSampleAnswer(questionId, answerContainer, button);
            }, 500);
            
            // Show the container with answer (will show loading state)
            answerContainer.classList.remove('hidden');
            
            // Scroll to the answer if it's not fully visible
            setTimeout(() => {
                answerContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
            
        } else {
            // Just hide the answer
            answerContainer.classList.add('hidden');
            button.innerHTML = `
                <i class="far fa-lightbulb mr-1.5"></i> 
                <span>Show Sample Answer</span>
            `;
        }
    }

    // Fetch sample answer from server with improved error handling
    async function fetchSampleAnswer(questionId, container, button) {
        if (!container) return;
        
        const answerContent = container.querySelector('.answer-content');
        if (!answerContent) return;
        
        try {
            const response = await fetch('/get_answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    question_id: questionId,
                    // Add any additional context if needed
                    context: {
                        difficulty: document.getElementById('difficulty')?.value,
                        category: document.getElementById('category')?.value
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const answerText = data.answer || 'No sample answer available for this question.';
            
            // Format the answer with Markdown if needed
            const formattedAnswer = formatAnswer(answerText);
            
            // Update the answer in the container with a nice fade-in effect
            answerContent.innerHTML = '';
            answerContent.innerHTML = formattedAnswer;
            
            // Apply syntax highlighting to code blocks
            applySyntaxHighlighting(answerContent);
            
            // Update the button
            if (button) {
                button.disabled = false;
                button.innerHTML = `
                    <i class="far fa-eye-slash mr-1.5"></i>
                    <span>Hide Answer</span>
                `;
            }
            
            // Store the answer in the questions array for future reference
            const questionIndex = parseInt(container.closest('.question-card')?.dataset.index);
            if (questions[questionIndex]) {
                questions[questionIndex].sampleAnswer = answerText;
            }
            
            // Initialize any interactive elements in the answer
            initializeAnswerInteractions(container);
            
            return true;
            
        } catch (error) {
            console.error('Error fetching answer:', error);
            
            // Show error state
            answerContent.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle text-yellow-500 text-2xl mb-2"></i>
                    <p class="text-sm text-gray-600 dark:text-gray-300">Failed to load the sample answer. Please try again later.</p>
                    <button class="mt-2 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium" onclick="window.location.reload()">
                        <i class="fas fa-sync-alt mr-1"></i> Retry
                    </button>
                </div>
            `;
            
            if (button) {
                button.disabled = false;
                button.innerHTML = `
                    <i class="far fa-lightbulb mr-1.5"></i> 
                    <span>Show Sample Answer</span>
                `;
            }
            
            return false;
        }
    }
    
    // Format answer text (supports Markdown)
    function formatAnswer(text) {
        if (!text) return '<p>No answer available.</p>';
        
        // Simple Markdown to HTML conversion (you might want to use a library like marked.js for production)
        let html = text
            // Headers
            .replace(/^# (.*$)/gm, '<h4 class="text-lg font-semibold mb-2 mt-4 text-gray-800 dark:text-white">$1</h4>')
            .replace(/^## (.*$)/gm, '<h5 class="text-md font-medium mb-1.5 mt-3 text-gray-800 dark:text-white">$1</h5>')
            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```(\w+)?\n([\s\S]*?)\n```/g, function(match, lang, code) {
                return `<pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded-md overflow-x-auto my-3"><code class="language-${lang || 'text'}">${escapeHtml(code)}</code></pre>`;
            })
            // Inline code
            .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
            // Lists
            .replace(/^\s*\* (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
            // Replace newlines with <br> for simple line breaks
            .replace(/\n\n/g, '</p><p class="mt-2">')
            // Wrap in paragraph if not already wrapped
            .replace(/^(?!<[a-z])(.*)$/gm, '<p class="text-gray-700 dark:text-gray-300 leading-relaxed">$1</p>');
            
        // Handle lists
        html = html.replace(/<li[^>]*>.*<\/li>/g, function(match) {
            return match;
        });
        
        // Wrap consecutive list items in ul
        html = html.replace(/(<li[^>]*>.*<\/li>)+/g, function(match) {
            return '<ul class="list-disc pl-5 my-2 space-y-1">' + match + '</ul>';
        });
        
        return html;
    }
    
    // Apply syntax highlighting to code blocks
    function applySyntaxHighlighting(container) {
        if (!container) return;
        
        // This is a simple implementation - in a real app, you might want to use a library like Prism.js or Highlight.js
        const codeBlocks = container.querySelectorAll('pre code');
        
        codeBlocks.forEach(block => {
            const lang = block.className.replace('language-', '') || 'text';
            const code = block.textContent;
            
            // Simple syntax highlighting based on language
            let highlightedCode = code;
            
            if (['javascript', 'js'].includes(lang)) {
                // JavaScript highlighting
                highlightedCode = code
                    // Comments
                    .replace(/(\/\*[\s\S]*?\*\/|\/\/.*)/g, '<span class="text-green-600 dark:text-green-400">$1</span>')
                    // Strings
                    .replace(/('.*?'|".*?"|`[\s\S]*?`)/g, '<span class="text-yellow-600 dark:text-yellow-400">$1</span>')
                    // Keywords
                    .replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|default|try|catch|finally|throw|new|this|class|extends|super|import|export|from|as|default|async|await|yield|of|in|instanceof|typeof|void|delete)\b/g, '<span class="text-purple-600 dark:text-purple-400 font-medium">$1</span>')
                    // Primitives
                    .replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, '<span class="text-blue-600 dark:text-blue-400">$1</span>')
                    // Numbers
                    .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="text-red-600 dark:text-red-400">$1</span>');
            } else if (['python', 'py'].includes(lang)) {
                // Python highlighting
                highlightedCode = code
                    // Comments
                    .replace(/(#.*$)/gm, '<span class="text-green-600 dark:text-green-400">$1</span>')
                    // Strings
                    .replace(/('''[\s\S]*?'''|"""[\s\S]*?"""|'.*?'|".*?")/g, '<span class="text-yellow-600 dark:text-yellow-400">$1</span>')
                    // Keywords
                    .replace(/\b(def|class|return|if|elif|else|for|while|in|try|except|finally|raise|with|as|import|from|as|lambda|nonlocal|global|yield|async|await|pass|break|continue|del|and|or|not|is|None|True|False)\b/g, '<span class="text-purple-600 dark:text-purple-400 font-medium">$1</span>')
                    // Numbers
                    .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="text-red-600 dark:text-red-400">$1</span>');
            } else if (['html', 'xml'].includes(lang)) {
                // HTML/XML highlighting
                highlightedCode = code
                    // Tags
                    .replace(/&lt;\/?([a-zA-Z][^\s>]*)([^>]*)&gt;/g, function(match, tag, attrs) {
                        return `&lt;<span class="text-red-600 dark:text-red-400">${tag}</span>${attrs}&gt;`;
                    })
                    // Attributes
                    .replace(/ (\w+)=/g, ' <span class="text-blue-600 dark:text-blue-400">$1</span>=')
                    // Comments
                    .replace(/&lt;!--[\s\S]*?--&gt;/g, '<span class="text-green-600 dark:text-green-400">$&</span>');
            } else if (['css'].includes(lang)) {
                // CSS highlighting
                highlightedCode = code
                    // Comments
                    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-green-600 dark:text-green-400">$1</span>')
                    // Selectors
                    .replace(/([\w-]+)\s*:/g, '<span class="text-purple-600 dark:text-purple-400">$1</span>:')
                    // Properties
                    .replace(/:\s*([^;}{]+);/g, ': <span class="text-blue-600 dark:text-blue-400">$1</span>;')
                    // IDs and classes
                    .replace(/[.#]([\w-]+)/g, '<span class="text-red-600 dark:text-red-400">$&</span>')
                    // Pseudo-classes
                    .replace(/:([\w-]+)/g, '<span class="text-yellow-600 dark:text-yellow-400">:$1</span>');
            } else if (['bash', 'sh', 'shell'].includes(lang)) {
                // Bash/Shell highlighting
                highlightedCode = code
                    // Comments
                    .replace(/(#.*$)/gm, '<span class="text-green-600 dark:text-green-400">$1</span>')
                    // Strings
                    .replace(/('.*?'|".*?"|`[\s\S]*?`)/g, '<span class="text-yellow-600 dark:text-yellow-400">$1</span>')
                    // Keywords
                    .replace(/\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|in|local|return|exit|export|readonly|declare|typeset)\b/g, '<span class="text-purple-600 dark:text-purple-400 font-medium">$1</span>')
                    // Commands
                    .replace(/\b(cd|ls|pwd|mkdir|rm|cp|mv|cat|grep|find|chmod|chown|sudo|apt|yum|dnf|pacman|brew|git|docker|kubectl|aws|gcloud|az|terraform)\b/g, '<span class="text-blue-600 dark:text-blue-400">$1</span>')
                    // Variables
                    .replace(/\$\{?\w+\}?/g, '<span class="text-red-600 dark:text-red-400">$&</span>');
            }
            
            block.innerHTML = highlightedCode;
            
            // Add copy button
            const copyButton = document.createElement('button');
            copyButton.className = 'absolute top-2 right-2 p-1 text-gray-400 hover:text-white bg-gray-200 hover:bg-gray-600 rounded-md text-xs transition-colors';
            copyButton.innerHTML = '<i class="far fa-copy"></i>';
            copyButton.title = 'Copy to clipboard';
            
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(code).then(() => {
                    copyButton.innerHTML = '<i class="fas fa-check"></i>';
                    copyButton.classList.remove('text-gray-400', 'hover:text-white');
                    copyButton.classList.add('text-green-500');
                    
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="far fa-copy"></i>';
                        copyButton.classList.remove('text-green-500');
                        copyButton.classList.add('text-gray-400', 'hover:text-white');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            });
            
            const pre = block.parentElement;
            if (pre) {
                pre.style.position = 'relative';
                pre.appendChild(copyButton);
            }
        });
    }
    
    // Initialize interactive elements in answer content
    function initializeAnswerInteractions(container) {
        if (!container) return;
        
        // Make external links open in new tab
        const links = container.querySelectorAll('a[href^="http"]');
        links.forEach(link => {
            if (!link.target) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            }
        });
        
        // Initialize tooltips
        if (typeof tippy !== 'undefined') {
            tippy(container.querySelectorAll('[data-tippy-content]'), {
                animation: 'scale-extreme',
                theme: 'material',
                arrow: true,
                delay: [100, 0],
                duration: [200, 150],
                interactive: true,
            });
        }
    }
    
    // Handle feedback submission
    function handleFeedback(questionIndex, feedbackType, button) {
        if (!questions[questionIndex]) return;
        
        const question = questions[questionIndex];
        const questionEl = document.querySelector(`.question-card[data-index="${questionIndex}"]`);
        
        if (!questionEl) return;
        
        // Update UI based on feedback
        const feedbackContainer = button.closest('.flex');
        if (feedbackContainer) {
            // Remove active state from all buttons in this container
            feedbackContainer.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('text-indigo-600', 'dark:text-indigo-400');
                btn.classList.add('text-gray-400');
            });
            
            // Add active state to clicked button
            button.classList.remove('text-gray-400');
            button.classList.add(
                feedbackType === 'helpful' 
                    ? 'text-green-500 dark:text-green-400' 
                    : 'text-red-500 dark:text-red-400'
            );
            
            // Show thank you message
            const thankYouMsg = document.createElement('span');
            thankYouMsg.className = 'text-xs text-gray-500 dark:text-gray-400 ml-2';
            thankYouMsg.textContent = feedbackType === 'helpful' ? 'Thanks for your feedback!' : 'We\'ll improve this answer.';
            
            // Remove any existing thank you message
            const existingMsg = feedbackContainer.querySelector('.thank-you-msg');
            if (existingMsg) {
                existingMsg.remove();
            }
            
            thankYouMsg.classList.add('thank-you-msg');
            feedbackContainer.appendChild(thankYouMsg);
            
            // Remove the message after a delay
            setTimeout(() => {
                if (thankYouMsg.parentNode === feedbackContainer) {
                    thankYouMsg.remove();
                }
            }, 3000);
        }
        
        // In a real app, you would send this feedback to your server
        console.log(`Feedback for question ${questionIndex}: ${feedbackType}`);
        
        // For demo purposes, we'll just log it
        if (feedbackType === 'helpful') {
            correctAnswers++;
            showToast('Thank you for your feedback!', 'success');
        } else {
            showToast('We\'ll use your feedback to improve our answers.', 'info');
        }
        
        // You could also update the question's data
        if (!question.feedback) {
            question.feedback = { helpful: 0, notHelpful: 0 };
        }
        
        if (feedbackType === 'helpful') {
            question.feedback.helpful++;
        } else {
            question.feedback.notHelpful++;
        }
        
        // Send feedback to server (commented out for demo)
        /*
        fetch('/submit_feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question_id: question.id,
                feedback_type: feedbackType,
                question_text: question.question,
                answer_text: question.sampleAnswer
            })
        }).catch(error => {
            console.error('Error submitting feedback:', error);
        });
        */
    }

    // Toggle answer status with animation
    function toggleAnswerStatus(index, isAnswered) {
        if (!questions[index]) return;
        
        const questionEl = document.querySelector(`.question-card[data-index="${index}"]`);
        if (!questionEl) return;
        
        // Update the answered questions set
        if (isAnswered) {
            answeredQuestions.add(index);
            
            // Add animation class
            questionEl.classList.add('animate__animated', 'animate__pulse');
            setTimeout(() => {
                questionEl.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
            
            // Show confetti for positive reinforcement
            if (answeredQuestions.size === 1) {
                // Only show confetti for the first answer to avoid being too distracting
                triggerConfetti();
            }
            
            // Show a celebratory message for the first few answers
            if (answeredQuestions.size === 1) {
                showToast('Great start! Keep going! 🚀', 'success');
            } else if (answeredQuestions.size === Math.floor(questions.length / 2)) {
                showToast(`You're halfway there! ${questions.length - answeredQuestions.size} to go!`, 'info');
            } else if (answeredQuestions.size === questions.length - 1) {
                showToast('Just one more question to go!', 'success');
            } else if (answeredQuestions.size === questions.length) {
                showToast('🎉 All questions completed! Great job!', 'success');
                
                // Show completion modal if all questions are answered
                showCompletionModal();
            }
            
        } else {
            answeredQuestions.delete(index);
        }
        
        // Update the question element
        questionEl.dataset.answered = isAnswered;
        questionEl.classList.toggle('border-l-4', isAnswered);
        questionEl.classList.toggle('border-green-500', isAnswered);
        
        // Update the status text
        const statusText = questionEl.querySelector('input[type="checkbox"] + span');
        if (statusText) {
            statusText.textContent = isAnswered ? 'Answered' : 'Mark as answered';
            
            // Add a checkmark icon when answered
            if (isAnswered) {
                if (!statusText.querySelector('.check-icon')) {
                    const checkIcon = document.createElement('i');
                    checkIcon.className = 'fas fa-check ml-1 check-icon';
                    statusText.appendChild(checkIcon);
                }
            } else {
                const checkIcon = statusText.querySelector('.check-icon');
                if (checkIcon) {
                    checkIcon.remove();
                }
            }
        }
        
        // Update the progress
        updateQuestionCounter();
        
        // If we're filtering, reapply the filter
        if (currentFilter !== 'all') {
            filterQuestions(currentFilter);
        }
    }

    // Save user's answer with auto-save indicator
    function saveAnswer(index, answer) {
        if (questions[index]) {
            questions[index].userAnswer = answer;
            questions[index].lastSaved = new Date().toISOString();
            
            // Show auto-save indicator
            const questionEl = document.querySelector(`.question-card[data-index="${index}"]`);
            if (questionEl) {
                let saveIndicator = questionEl.querySelector('.save-indicator');
                
                if (!saveIndicator) {
                    saveIndicator = document.createElement('span');
                    saveIndicator.className = 'save-indicator text-xs text-gray-500 dark:text-gray-400 ml-2';
                    const textarea = questionEl.querySelector('textarea');
                    if (textarea && textarea.parentNode) {
                        textarea.parentNode.appendChild(saveIndicator);
                    }
                }
                
                saveIndicator.textContent = 'Saving...';
                saveIndicator.classList.remove('text-gray-500', 'text-green-500');
                saveIndicator.classList.add('text-blue-500');
                
                // Simulate auto-save delay
                clearTimeout(window.saveTimeout);
                window.saveTimeout = setTimeout(() => {
                    saveIndicator.textContent = 'Saved';
                    saveIndicator.classList.remove('text-blue-500');
                    saveIndicator.classList.add('text-green-500');
                    
                    // Fade out after a delay
                    setTimeout(() => {
                        saveIndicator.textContent = '';
                    }, 2000);
                }, 800);
            }
            
            // In a real app, you would save this to a database
            // saveToDatabase(index, answer);
        }
    }
    
    // Simulate saving to database
    async function saveToDatabase(index, answer) {
        try {
            const response = await fetch('/save_answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question_id: questions[index]?.id,
                    answer: answer,
                    session_id: getSessionId()
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save answer');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving answer:', error);
            showToast('Failed to save your answer. Please try again.', 'error');
            throw error;
        }
    }
    
    // Generate a unique session ID
    function getSessionId() {
        let sessionId = localStorage.getItem('interview_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('interview_session_id', sessionId);
        }
        return sessionId;
    }

    // Navigation functions with smooth scrolling
    function showNextQuestion() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            updateQuestionCounter();
            updateNavigationButtons();
            scrollToCurrentQuestion();
        }
    }

    function showPreviousQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            updateQuestionCounter();
            updateNavigationButtons();
            scrollToCurrentQuestion();
        }
    }

    function scrollToCurrentQuestion() {
        const questionEl = document.querySelector(`.question-card[data-index="${currentQuestionIndex}"]`);
        if (questionEl) {
            // Add highlight effect
            questionEl.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2');
            setTimeout(() => {
                questionEl.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2');
            }, 2000);
            
            // Scroll to the question with offset for fixed header
            const headerOffset = 100;
            const elementPosition = questionEl.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Update question counter with progress
    function updateQuestionCounter() {
        if (currentQuestionEl) currentQuestionEl.textContent = currentQuestionIndex + 1;
        if (totalQuestionsEl) totalQuestionsEl.textContent = questions.length;
        
        const answeredCount = answeredQuestions.size;
        const totalQuestions = questions.length;
        const progressPercentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
        
        // Update the progress bar if it exists
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
            progressBar.setAttribute('aria-valuenow', progressPercentage);
        }
        
        // Update the progress text
        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = `${answeredCount} of ${totalQuestions} completed`;
        }
        
        // Update the questions answered counter
        if (questionsAnsweredEl) {
            questionsAnsweredEl.textContent = `${answeredCount} of ${totalQuestions} questions answered`;
            
            // Add a checkmark when all questions are answered
            const checkIcon = questionsAnsweredEl.querySelector('.check-icon');
            if (answeredCount === totalQuestions && totalQuestions > 0) {
                if (!checkIcon) {
                    const icon = document.createElement('i');
                    icon.className = 'fas fa-check-circle text-green-500 ml-2 check-icon';
                    questionsAnsweredEl.appendChild(icon);
                }
            } else if (checkIcon) {
                checkIcon.remove();
            }
        }
        
        // Update the progress circle if it exists
        const progressCircle = document.querySelector('.progress-ring-circle');
        if (progressCircle) {
            const radius = progressCircle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            const offset = circumference - (progressPercentage / 100) * circumference;
            
            progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
            progressCircle.style.strokeDashoffset = offset;
        }
        
        // Update the progress percentage text if it exists
        const progressPercentEl = document.querySelector('.progress-percent');
        if (progressPercentEl) {
            progressPercentEl.textContent = `${progressPercentage}%`;
        }
    }

    // Update navigation buttons state
    function updateNavigationButtons() {
        if (prevQuestionBtn) {
            prevQuestionBtn.disabled = currentQuestionIndex === 0;
            prevQuestionBtn.classList.toggle('opacity-50', currentQuestionIndex === 0);
            prevQuestionBtn.classList.toggle('cursor-not-allowed', currentQuestionIndex === 0);
        }
        
        if (nextQuestionBtn) {
            const isLastQuestion = currentQuestionIndex === questions.length - 1;
            nextQuestionBtn.disabled = isLastQuestion;
            nextQuestionBtn.classList.toggle('opacity-50', isLastQuestion);
            nextQuestionBtn.classList.toggle('cursor-not-allowed', isLastQuestion);
            
            // Update button text for the last question
            const buttonText = nextQuestionBtn.querySelector('span');
            if (buttonText) {
                buttonText.textContent = isLastQuestion ? 'All Done!' : 'Next Question';
            }
            
            // Update icon
            const icon = nextQuestionBtn.querySelector('i');
            if (icon) {
                icon.className = isLastQuestion ? 'fas fa-check ml-2' : 'fas fa-arrow-right ml-2';
            }
        }
        
        // Update the "Finish" button state
        const finishButton = document.getElementById('finishButton');
        if (finishButton) {
            const allAnswered = answeredQuestions.size === questions.length;
            finishButton.disabled = !allAnswered;
            finishButton.classList.toggle('opacity-50', !allAnswered);
            finishButton.classList.toggle('cursor-not-allowed', !allAnswered);
            finishButton.title = allAnswered ? 'Finish the interview' : 'Please answer all questions first';
        }
    }

    // Filter questions based on status
    function filterQuestions(filter) {
        currentFilter = filter;
        
        // Update active tab styles
        const tabs = [tabAll, tabUnanswered, tabAnswered];
        tabs.forEach((tab, index) => {
            if (!tab) return;
            
            const isActive = (filter === 'all' && index === 0) || 
                            (filter === 'unanswered' && index === 1) || 
                            (filter === 'answered' && index === 2);
            
            tab.classList.toggle('bg-indigo-100', isActive);
            tab.classList.toggle('text-indigo-700', isActive);
            tab.classList.toggle('dark:bg-indigo-900/30', isActive);
            tab.classList.toggle('dark:text-indigo-300', isActive);
            tab.classList.toggle('shadow-sm', isActive);
            
            if (!isActive) {
                tab.classList.add('hover:bg-gray-100', 'dark:hover:bg-gray-700/50');
            } else {
                tab.classList.remove('hover:bg-gray-100', 'dark:hover:bg-gray-700/50');
            }
        });
        
        // Show/hide questions based on filter
        document.querySelectorAll('.question-card').forEach(card => {
            const index = parseInt(card.dataset.index);
            const isAnswered = answeredQuestions.has(index);
            
            if (filter === 'all' || 
                (filter === 'answered' && isAnswered) || 
                (filter === 'unanswered' && !isAnswered)) {
                card.style.display = 'block';
                
                // Add a subtle animation when showing
                card.classList.add('animate__animated', 'animate__fadeIn');
                setTimeout(() => {
                    card.classList.remove('animate__animated', 'animate__fadeIn');
                }, 500);
            } else {
                card.style.display = 'none';
            }
        });
                    element.textContent = data.answer;
                }
            }
        } catch (error) {
            console.error('Error fetching sample answer:', error);
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = 'Could not load sample answer. Please try again.';
            }
        }
    }

    function finishSession() {
        const unansweredCount = currentQuestions.length - answeredQuestions.size;
        const message = unansweredCount > 0 
            ? `You've completed ${answeredQuestions.size} of ${currentQuestions.length} questions. You have ${unansweredCount} unanswered questions.`
            : 'Congratulations! You have answered all questions!';
        
        showToast(message, 'success');
        // In a real app, you might want to show a summary or redirect to a results page
    }

    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out flex items-center ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        
        // Show toast
        setTimeout(() => {
            toast.classList.remove('translate-y-16', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
            
            // Hide after 5 seconds
            setTimeout(() => {
                toast.classList.add('translate-y-16', 'opacity-0');
            }, 5000);
        }, 100);
    }

    function scrollToQuestionGenerator() {
        document.getElementById('questionsContainer').scrollIntoView({ behavior: 'smooth' });
    }

    function toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
    }

    function checkThemePreference() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
        }
        
        updateThemeIcon(document.documentElement.classList.contains('dark'));
    }

    function updateThemeIcon(isDark) {
        const icon = themeToggle.querySelector('i');
        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    window.saveAnswer = saveAnswer;
    window.fetchSampleAnswer = fetchSampleAnswer;
});
