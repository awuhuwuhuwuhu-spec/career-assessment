import { defineStore } from 'pinia'

export const useReportStore = defineStore('report', {
  state: () => ({
    // 各测评的结果
    results: {
      holland: null,      // 霍兰德结果
      mbti: null,         // MBTI结果
      intelligence: null, // 多元智能结果
      vark: null,         // VARK结果
      values: null,       // 职业价值观结果
      subject: null       // 学科效能感结果
    },

    // 综合报告
    comprehensiveReport: null,

    // 报告生成时间
    generatedAt: null
  }),

  getters: {
    // 检查是否所有结果都已生成
    hasAllResults: (state) => {
      return Object.values(state.results).every(result => result !== null)
    },

    // 检查是否有综合报告
    hasReport: (state) => {
      return state.comprehensiveReport !== null
    }
  },

  actions: {
    // 保存单项测评结果
    saveResult(assessmentId, result) {
      this.results[assessmentId] = result

      // 保存到localStorage
      const storageKey = `assessment_result_${assessmentId}`
      localStorage.setItem(storageKey, JSON.stringify(result))
    },

    // 保存综合报告
    saveComprehensiveReport(report) {
      this.comprehensiveReport = report
      this.generatedAt = new Date().toISOString()

      // 保存到localStorage
      localStorage.setItem('comprehensive_report', JSON.stringify({
        report,
        generatedAt: this.generatedAt
      }))
    },

    // 从localStorage加载所有结果
    loadFromStorage() {
      // 加载各测评结果
      Object.keys(this.results).forEach(key => {
        const storageKey = `assessment_result_${key}`
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          this.results[key] = JSON.parse(stored)
        }
      })

      // 加载综合报告
      const reportData = localStorage.getItem('comprehensive_report')
      if (reportData) {
        const { report, generatedAt } = JSON.parse(reportData)
        this.comprehensiveReport = report
        this.generatedAt = generatedAt
      }
    },

    // 清除所有数据
    clearAll() {
      this.results = {
        holland: null,
        mbti: null,
        intelligence: null,
        vark: null,
        values: null,
        subject: null
      }
      this.comprehensiveReport = null
      this.generatedAt = null

      // 清除localStorage
      Object.keys(this.results).forEach(key => {
        localStorage.removeItem(`assessment_result_${key}`)
      })
      localStorage.removeItem('comprehensive_report')
    }
  }
})
