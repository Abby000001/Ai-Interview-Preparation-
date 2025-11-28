from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import os
import random
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

INTERVIEW_QUESTONS = {
    'python': {
        'beginner': [
            "What are Python decorators and how do you use them?",
            "Explain the difference between lists and tuples in Python.",
            "What are Python's built-in data types?",
            "How does Python manage memory?",
            "What are list comprehensions?"
        ],
        'intermediate': [
            "What is the Global Interpreter Lock (GIL) in Python?",
            "Explain Python's garbage collection mechanism.",
            "What are Python's magic methods?",
            "How do you handle exceptions in Python?",
            "What are Python generators and how do they differ from iterators?"
        ],
        'advanced': [
            "How does Python's multiple inheritance work?",
            "Explain Python's metaclasses and when to use them.",
            "What are Python's descriptor protocol and attribute access?",
            "How would you optimize Python code for performance?",
            "Explain Python's GIL and its impact on multi-threading."
        ]
    },
    'data_science': {
        'beginner': [
            "What is the difference between supervised and unsupervised learning?",
            "How would you handle missing or corrupted data in a dataset?",
            "What is feature scaling and why is it important?",
            "Explain the bias-variance tradeoff.",
            "What is cross-validation and why is it important?"
        ],
        'intermediate': [
            "Explain the difference between L1 and L2 regularization.",
            "How does the k-means clustering algorithm work?",
            "What is the curse of dimensionality?",
            "Explain principal component analysis (PCA).",
            "What are the assumptions of linear regression?"
        ],
        'advanced': [
            "How would you design a recommendation system?",
            "Explain the math behind the Naive Bayes algorithm.",
            "What are some techniques for handling imbalanced datasets?",
            "How would you implement a custom loss function?",
            "Explain the difference between batch, mini-batch, and stochastic gradient descent."
        ]
    },
    'system_design': {
        'beginner': [
            "How would you design a URL shortening service like bit.ly?",
            "Explain the difference between SQL and NoSQL databases.",
            "What is load balancing and why is it important?",
            "How does caching work and when would you use it?",
            "What is a CDN and how does it work?"
        ],
        'intermediate': [
            "Design a distributed key-value store.",
            "How would you design Twitter's news feed?",
            "Explain the CAP theorem and its implications.",
            "How would you design a rate limiter?",
            "What are microservices and when would you use them?"
        ],
        'advanced': [
            "Design a global, distributed caching system.",
            "How would you design a real-time analytics system?",
            "Design a system that can handle millions of concurrent users.",
            "How would you design a distributed logging system?",
            "Design a system for real-time stock price updates."
        ]
    },
    'behavioral': {
        'beginner': [
            "Tell me about yourself.",
            "What are your strengths and weaknesses?",
            "Why do you want to work for our company?",
            "Where do you see yourself in 5 years?",
            "Why are you looking for a new opportunity?"
        ],
        'intermediate': [
            "Tell me about a time you faced a difficult challenge.",
            "Describe a time you had a conflict with a team member.",
            "How do you handle tight deadlines?",
            "Tell me about a time you made a mistake and how you handled it.",
            "How do you prioritize your work when you have multiple deadlines?"
        ],
        'advanced': [
            "Describe a time you had to convince your team to adopt a new technology.",
            "Tell me about a time you had to make a decision with incomplete information.",
            "How do you handle disagreements with management?",
            "Describe a time you had to learn a new technology quickly.",
            "Tell me about a time you failed and what you learned from it."
        ]
    }
}

SAMPLE_ANSWERS = {
    "What are Python decorators and how do you use them?": 
        "Python decorators are functions that modify the behavior of other functions. They allow you to add functionality to existing code without modifying the original function. For example, you can use decorators for logging, timing, access control, and more. The @ symbol is used to apply a decorator to a function.",
    "Explain the difference between lists and tuples in Python.":
        "Lists are mutable, meaning they can be modified after creation, while tuples are immutable. Lists are defined with square brackets [], and tuples with parentheses (). Tuples are generally faster than lists and can be used as dictionary keys since they're hashable, while lists cannot.",
    "What is the Global Interpreter Lock (GIL) in Python?":
        "The GIL is a mutex that protects access to Python objects, preventing multiple threads from executing Python bytecodes at once. This means that even in multi-threaded Python programs, only one thread can execute Python code at a time. The GIL can be a bottleneck in CPU-bound multi-threaded programs."
}

user_sessions = {}

def get_session_id():
    if 'session_id' not in session:
        session['session_id'] = os.urandom(16).hex()
        user_sessions[session['session_id']] = {
            'start_time': datetime.now(),
            'questions_answered': 0,
            'categories_attempted': set(),
            'difficulty_levels': {}
        }
    return session['session_id']

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_questions', methods=['POST'])
def get_questions():
    data = request.json
    category = data.get('category', 'python')
    difficulty = data.get('difficulty', 'beginner')
    count = min(int(data.get('count', 5)), 10)
    
    questions = INTERVIEW_QUESTIONS.get(category.lower(), {}).get(difficulty.lower(), [])
    
    selected_questions = random.sample(questions, min(count, len(questions))) if questions else []
    
    session_id = get_session_id()
    if category.lower() not in user_sessions[session_id]['categories_attempted']:
        user_sessions[session_id]['categories_attempted'].add(category.lower())
    
    return jsonify({
        'questions': selected_questions,
        'category': category,
        'difficulty': difficulty,
        'total_questions': len(selected_questions)
    })

@app.route('/get_answer', methods=['POST'])
def get_answer():
    data = request.json
    question = data.get('question', '')
    return jsonify({
        'answer': SAMPLE_ANSWERS.get(question, "Sample answer not available. This is a great opportunity to demonstrate your knowledge!")
    })

@app.route('/session/stats', methods=['GET'])
def get_session_stats():
    session_id = get_session_id()
    return jsonify({
        'questions_answered': user_sessions[session_id]['questions_answered'],
        'categories_attempted': list(user_sessions[session_id]['categories_attempted']),
        'session_duration': (datetime.now() - user_sessions[session_id]['start_time']).total_seconds()
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
