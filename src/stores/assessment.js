import { defineStore } from 'pinia'

export const useAssessmentStore = defineStore('assessment', {
  state: () => ({
    // 6个测评的基本信息
    assessments: [
      {
        id: 'holland',
        name: '霍兰德职业兴趣测试',
        description: '了解你的职业兴趣类型（RIASEC模型）',
        questionCount: 60,
        estimatedTime: '10分钟',
        type: 'likert',
        icon: '🎯',
        completed: false
      },
      {
        id: 'mbti',
        name: 'MBTI性格类型测评',
        description: '探索你的人格类型（16种人格）',
        questionCount: 72,
        estimatedTime: '12分钟',
        type: 'binary',
        icon: '🧠',
        completed: false
      },
      {
        id: 'intelligence',
        name: '多元智能测评',
        description: '发现你的优势智能（加德纳8种智能）',
        questionCount: 80,
        estimatedTime: '15分钟',
        type: 'likert',
        icon: '💡',
        completed: false
      },
      {
        id: 'vark',
        name: 'VARK学习风格测评',
        description: '了解你的学习方式（视听读写动）',
        questionCount: 20,
        estimatedTime: '5分钟',
        type: 'multiple',
        icon: '📚',
        completed: false
      },
      {
        id: 'values',
        name: '职业价值观测评',
        description: '明确你的职业追求（13个价值因素）',
        questionCount: 52,
        estimatedTime: '10分钟',
        type: 'likert',
        icon: '⭐',
        completed: false
      },
      {
        id: 'subject',
        name: '学科效能感测评',
        description: '评估你对各学科的自信程度（9个学科）',
        questionCount: 99,
        estimatedTime: '15分钟',
        type: 'likert',
        icon: '📊',
        completed: false
      }
    ],

    // 当前测评数据
    currentAssessment: null,
    currentQuestions: [],
    currentAnswers: {},
    currentQuestionIndex: 0
  }),

  getters: {
    // 获取完成进度
    progress: (state) => {
      const completed = state.assessments.filter(a => a.completed).length
      return {
        completed,
        total: state.assessments.length,
        percentage: Math.round((completed / state.assessments.length) * 100)
      }
    },

    // 是否全部完成
    allCompleted: (state) => {
      return state.assessments.every(a => a.completed)
    },

    // 根据ID获取测评
    getAssessmentById: (state) => (id) => {
      return state.assessments.find(a => a.id === id)
    }
  },

  actions: {
    // 标记测评为已完成
    markCompleted(assessmentId) {
      const assessment = this.assessments.find(a => a.id === assessmentId)
      if (assessment) {
        assessment.completed = true
      }
    },

    // 设置当前测评
    setCurrentAssessment(assessmentId) {
      this.currentAssessment = assessmentId
      this.currentQuestionIndex = 0
    },

    // 设置当前题目
    setCurrentQuestions(questions) {
      this.currentQuestions = questions
    },

    // 保存答案
    saveAnswer(questionId, answer) {
      this.currentAnswers[questionId] = answer
    },

    // 下一题
    nextQuestion() {
      if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
        this.currentQuestionIndex++
      }
    },

    // 上一题
    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--
      }
    },

    // 重置当前测评
    resetCurrent() {
      this.currentAssessment = null
      this.currentQuestions = []
      this.currentAnswers = {}
      this.currentQuestionIndex = 0
    }
  }
})
