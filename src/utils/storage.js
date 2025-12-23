/**
 * LocalStorage管理类
 * 负责答题进度和结果的持久化存储
 */
export class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'assessment_data'
    this.ANSWER_PREFIX = 'assessment_answers_'
  }

  /**
   * 获取所有存储数据
   */
  getAllData() {
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : {
      results: {},
      progress: {},
      profile: {}
    }
  }

  /**
   * 保存所有数据
   */
  saveAllData(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
  }

  /**
   * 保存单个测评的结果
   */
  saveAssessmentResult(assessmentId, result) {
    const data = this.getAllData()
    data.results = data.results || {}
    data.results[assessmentId] = {
      ...result,
      completedAt: new Date().toISOString()
    }
    this.saveAllData(data)
  }

  /**
   * 获取单个测评的结果
   */
  getAssessmentResult(assessmentId) {
    const data = this.getAllData()
    return data.results?.[assessmentId] || null
  }

  /**
   * 保存答题进度（当前答到第几题）
   */
  saveAnswerProgress(assessmentId, questionIndex, answers) {
    const key = `${this.ANSWER_PREFIX}${assessmentId}`
    localStorage.setItem(key, JSON.stringify({
      questionIndex,
      answers,
      savedAt: new Date().toISOString()
    }))
  }

  /**
   * 获取答题进度
   */
  getAnswerProgress(assessmentId) {
    const key = `${this.ANSWER_PREFIX}${assessmentId}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  }

  /**
   * 清除单个测评的答题进度
   */
  clearAnswerProgress(assessmentId) {
    const key = `${this.ANSWER_PREFIX}${assessmentId}`
    localStorage.removeItem(key)
  }

  /**
   * 获取完成进度
   */
  getProgress() {
    const data = this.getAllData()
    const totalTests = 6
    const completed = Object.keys(data.results || {}).length

    return {
      completed,
      total: totalTests,
      percentage: Math.round((completed / totalTests) * 100),
      completedTests: Object.keys(data.results || {})
    }
  }

  /**
   * 检查是否所有测评都已完成
   */
  isAllCompleted() {
    const progress = this.getProgress()
    return progress.completed === progress.total
  }

  /**
   * 检查单个测评是否已完成
   */
  isAssessmentCompleted(assessmentId) {
    const data = this.getAllData()
    return !!data.results?.[assessmentId]
  }

  /**
   * 保存综合报告
   */
  saveComprehensiveReport(report) {
    const data = this.getAllData()
    data.comprehensiveReport = {
      ...report,
      generatedAt: new Date().toISOString()
    }
    this.saveAllData(data)
  }

  /**
   * 获取综合报告
   */
  getComprehensiveReport() {
    const data = this.getAllData()
    return data.comprehensiveReport || null
  }

  /**
   * 清除所有数据
   */
  clearAll() {
    // 清除主数据
    localStorage.removeItem(this.STORAGE_KEY)

    // 清除所有答题进度
    const assessmentIds = ['holland', 'mbti', 'intelligence', 'vark', 'values', 'subject']
    assessmentIds.forEach(id => {
      this.clearAnswerProgress(id)
    })
  }

  /**
   * 导出数据（用于备份）
   */
  exportData() {
    const data = this.getAllData()

    // 创建Blob对象
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `assessment_backup_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return data
  }

  /**
   * 导入数据（用于恢复）
   */
  async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          this.saveAllData(data)
          resolve(data)
        } catch (error) {
          reject(new Error('导入失败：文件格式不正确'))
        }
      }

      reader.onerror = () => {
        reject(new Error('导入失败：无法读取文件'))
      }

      reader.readAsText(file)
    })
  }

  /**
   * 获取存储使用情况
   */
  getStorageInfo() {
    const data = this.getAllData()
    const dataSize = new Blob([JSON.stringify(data)]).size

    return {
      dataSize: (dataSize / 1024).toFixed(2) + ' KB',
      resultCount: Object.keys(data.results || {}).length,
      hasReport: !!data.comprehensiveReport,
      lastUpdated: this.getLastUpdateTime()
    }
  }

  /**
   * 获取最后更新时间
   */
  getLastUpdateTime() {
    const data = this.getAllData()
    const times = []

    // 收集所有时间戳
    if (data.results) {
      Object.values(data.results).forEach(result => {
        if (result.completedAt) {
          times.push(new Date(result.completedAt))
        }
      })
    }

    if (data.comprehensiveReport?.generatedAt) {
      times.push(new Date(data.comprehensiveReport.generatedAt))
    }

    if (times.length === 0) return null

    // 返回最新的时间
    return new Date(Math.max(...times)).toLocaleString('zh-CN')
  }
}

// 创建单例实例
export const storageManager = new StorageManager()
