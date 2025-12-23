import Papa from 'papaparse'

/**
 * CSV解析服务类
 * 负责加载和解析6种不同格式的CSV测评题目
 */
export class CSVParser {
  /**
   * 加载CSV文件
   */
  async loadCSV(filename) {
    const response = await fetch(`/data/${filename}`)
    const csvText = await response.text()

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      })
    })
  }

  /**
   * 解析霍兰德职业兴趣测试
   * 格式: id, question, dimension
   */
  async parseHolland() {
    const data = await this.loadCSV('holland_test_questions.csv')
    return data.map(row => ({
      id: parseInt(row.id),
      question: row.question,
      dimension: row.dimension  // R, I, A, S, E, C
    }))
  }

  /**
   * 解析MBTI性格类型测评
   * 格式: id, question, option_a, dimension_a, option_b, dimension_b
   */
  async parseMBTI() {
    const data = await this.loadCSV('mbti_test_questions.csv')
    return data.map(row => ({
      id: parseInt(row.id),
      question: row.question,
      options: [
        { text: row.option_a, dimension: row.dimension_a },
        { text: row.option_b, dimension: row.dimension_b }
      ]
    }))
  }

  /**
   * 解析多元智能测评
   * 格式: id, question, dimension
   */
  async parseIntelligence() {
    const data = await this.loadCSV('multiple_intelligences_test_questions.csv')
    return data.map(row => ({
      id: parseInt(row.id),
      question: row.question,
      dimension: row.dimension
    }))
  }

  /**
   * 解析VARK学习风格测评
   * 格式: id, question, option_a, dimension_a, option_b, dimension_b, option_c, dimension_c, option_d, dimension_d
   */
  async parseVARK() {
    const data = await this.loadCSV('vark_test_questions.csv')
    return data.map(row => ({
      id: parseInt(row.id),
      question: row.question,
      options: [
        { text: row.option_a, dimension: row.dimension_a },
        { text: row.option_b, dimension: row.dimension_b },
        { text: row.option_c, dimension: row.dimension_c },
        { text: row.option_d, dimension: row.dimension_d }
      ]
    }))
  }

  /**
   * 解析职业价值观测评
   * 格式: id, question, factor, dimension
   */
  async parseCareerValues() {
    const data = await this.loadCSV('career_values_test_questions.csv')
    return data.map(row => ({
      id: parseInt(row.id),
      question: row.question,
      factor: row.factor,
      dimension: row.dimension
    }))
  }

  /**
   * 解析学科效能感测评
   * 格式: id, question, subject
   */
  async parseSubjectEfficacy() {
    const data = await this.loadCSV('subject_efficacy_test_questions.csv')
    return data.map(row => ({
      id: parseInt(row.id),
      question: row.question,
      subject: row.subject
    }))
  }

  /**
   * 根据测评ID加载对应的题目
   */
  async loadAssessmentQuestions(assessmentId) {
    const parsers = {
      holland: () => this.parseHolland(),
      mbti: () => this.parseMBTI(),
      intelligence: () => this.parseIntelligence(),
      vark: () => this.parseVARK(),
      values: () => this.parseCareerValues(),
      subject: () => this.parseSubjectEfficacy()
    }

    const parser = parsers[assessmentId]
    if (!parser) {
      throw new Error(`Unknown assessment ID: ${assessmentId}`)
    }

    return await parser()
  }
}

// 创建单例实例
export const csvParser = new CSVParser()
