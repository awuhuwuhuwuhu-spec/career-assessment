/**
 * 评分引擎类
 * 负责计算6种测评的得分和结果
 */
export class ScoringEngine {
  /**
   * 霍兰德职业兴趣测试评分
   * 题型：是/否题（60题）
   * 计分：统计各维度选"是"的数量
   * 结果：前三位组成霍兰德代码
   */
  scoreHolland(questions, answers) {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }

    // 统计各维度得分
    questions.forEach(q => {
      const answer = answers[q.id]
      if (answer === true || answer === 'yes' || answer === '是') {
        scores[q.dimension]++
      }
    })

    // 排序并取前三位
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(entry => ({
        dimension: entry[0],
        score: entry[1],
        percentage: Math.round((entry[1] / 10) * 100)  // 每个维度10题
      }))

    const code = sorted.slice(0, 3).map(s => s.dimension).join('')

    return {
      code,                    // 霍兰德代码，如"RIA"
      scores,                  // 各维度原始分数
      sorted,                  // 按得分排序的维度
      topThree: sorted.slice(0, 3)  // 前三个维度
    }
  }

  /**
   * MBTI性格类型测评评分
   * 题型：二选一（72题，每维度18题）
   * 计分：统计E-I、S-N、T-F、J-P各维度得分
   * 结果：4个字母组合
   */
  scoreMBTI(questions, answers) {
    const scores = {
      E: 0, I: 0,
      S: 0, N: 0,
      T: 0, F: 0,
      J: 0, P: 0
    }

    // 统计各维度选择次数
    questions.forEach(q => {
      const answer = answers[q.id]
      if (answer !== undefined && answer !== null) {
        const selectedOption = q.options[answer]
        if (selectedOption) {
          scores[selectedOption.dimension]++
        }
      }
    })

    // 确定各维度倾向
    const type =
      (scores.E >= scores.I ? 'E' : 'I') +
      (scores.S >= scores.N ? 'S' : 'N') +
      (scores.T >= scores.F ? 'T' : 'F') +
      (scores.J >= scores.P ? 'J' : 'P')

    // 计算各维度百分比
    const percentages = {
      EI: Math.round((scores.E / (scores.E + scores.I)) * 100),
      SN: Math.round((scores.S / (scores.S + scores.N)) * 100),
      TF: Math.round((scores.T / (scores.T + scores.F)) * 100),
      JP: Math.round((scores.J / (scores.J + scores.P)) * 100)
    }

    return {
      type,            // MBTI类型，如"INTJ"
      scores,          // 各字母得分
      percentages,     // 各维度百分比
      dimensions: {
        energyFlow: scores.E > scores.I ? 'E' : 'I',
        information: scores.S > scores.N ? 'S' : 'N',
        decision: scores.T > scores.F ? 'T' : 'F',
        lifestyle: scores.J > scores.P ? 'J' : 'P'
      }
    }
  }

  /**
   * 多元智能测评评分
   * 题型：李克特5分量表（80题，8个维度各10题）
   * 计分：各维度求平均分，标准化为百分制
   */
  scoreMultipleIntelligences(questions, answers) {
    const dimensions = [
      'Linguistic',
      'Logical-Mathematical',
      'Spatial',
      'Bodily-Kinesthetic',
      'Musical',
      'Interpersonal',
      'Intrapersonal',
      'Naturalist'
    ]

    const rawScores = {}
    const counts = {}

    dimensions.forEach(dim => {
      rawScores[dim] = 0
      counts[dim] = 0
    })

    // 累加各维度分数
    questions.forEach(q => {
      const answer = answers[q.id]
      if (answer !== undefined && answer !== null) {
        rawScores[q.dimension] += parseInt(answer)
        counts[q.dimension]++
      }
    })

    // 计算平均分和标准化分数
    const averages = {}
    const normalized = {}

    dimensions.forEach(dim => {
      if (counts[dim] > 0) {
        averages[dim] = (rawScores[dim] / counts[dim]).toFixed(2)
        normalized[dim] = Math.round((rawScores[dim] / (counts[dim] * 5)) * 100)
      } else {
        averages[dim] = 0
        normalized[dim] = 0
      }
    })

    // 排序
    const sorted = Object.entries(normalized)
      .sort((a, b) => b[1] - a[1])
      .map(([name, score]) => ({ name, score }))

    return {
      rawScores,               // 原始总分
      averages,                // 平均分
      normalizedScores: normalized,  // 标准化为百分制
      sorted,                  // 按分数排序
      topThree: sorted.slice(0, 3)   // 前三个优势智能
    }
  }

  /**
   * VARK学习风格测评评分
   * 题型：四选一（20题）
   * 计分：统计各学习风格被选次数
   */
  scoreVARK(questions, answers) {
    const scores = { V: 0, A: 0, R: 0, K: 0 }

    // 统计各风格选择次数
    questions.forEach(q => {
      const answer = answers[q.id]
      if (answer !== undefined && answer !== null) {
        const selectedOption = q.options[answer]
        if (selectedOption) {
          scores[selectedOption.dimension]++
        }
      }
    })

    const total = Object.values(scores).reduce((a, b) => a + b, 0)

    // 计算百分比
    const percentages = {}
    Object.entries(scores).forEach(([key, value]) => {
      percentages[key] = Math.round((value / total) * 100)
    })

    // 找出主导学习风格
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
    const dominant = sorted[0][0]

    // 判断是否为混合型（前两名差距小于15%）
    const isMultimodal = percentages[sorted[0][0]] - percentages[sorted[1][0]] < 15

    return {
      scores,          // 原始分数
      percentages,     // 百分比
      dominant,        // 主导风格
      isMultimodal,    // 是否混合型
      sorted: sorted.map(([name, score]) => ({ name, score }))
    }
  }

  /**
   * 职业价值观测评评分
   * 题型：李克特5分量表（52题，13个因素）
   * 计分：各因素求平均分
   */
  scoreCareerValues(questions, answers) {
    const factors = {}
    const counts = {}

    // 初始化
    questions.forEach(q => {
      if (!factors[q.factor]) {
        factors[q.factor] = 0
        counts[q.factor] = 0
      }
    })

    // 累加分数
    questions.forEach(q => {
      const answer = answers[q.id]
      if (answer !== undefined && answer !== null) {
        factors[q.factor] += parseInt(answer)
        counts[q.factor]++
      }
    })

    // 计算平均分
    const averages = {}
    Object.keys(factors).forEach(factor => {
      if (counts[factor] > 0) {
        averages[factor] = (factors[factor] / counts[factor]).toFixed(2)
      } else {
        averages[factor] = 0
      }
    })

    // 排序
    const sorted = Object.entries(averages)
      .sort((a, b) => b[1] - a[1])
      .map(([name, score]) => ({ name, score: parseFloat(score) }))

    return {
      factorScores: averages,   // 各因素平均分
      sorted,                   // 按分数排序
      topFive: sorted.slice(0, 5)  // 前五个核心价值观
    }
  }

  /**
   * 学科效能感测评评分
   * 题型：李克特5分量表（99题，9个学科各11题）
   * 计分：各学科求平均分
   */
  scoreSubjectEfficacy(questions, answers) {
    const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理']

    const scores = {}
    const counts = {}

    subjects.forEach(sub => {
      scores[sub] = 0
      counts[sub] = 0
    })

    // 累加分数
    questions.forEach(q => {
      const answer = answers[q.id]
      if (answer !== undefined && answer !== null) {
        scores[q.subject] += parseInt(answer)
        counts[q.subject]++
      }
    })

    // 计算平均分
    const averages = {}
    subjects.forEach(sub => {
      if (counts[sub] > 0) {
        averages[sub] = (scores[sub] / counts[sub]).toFixed(2)
      } else {
        averages[sub] = 0
      }
    })

    // 排序
    const sorted = Object.entries(averages)
      .sort((a, b) => b[1] - a[1])
      .map(([name, score]) => ({ name, score: parseFloat(score) }))

    return {
      subjectScores: averages,  // 各学科平均分
      sorted,                   // 按分数排序
      topThree: sorted.slice(0, 3),  // 前三个优势学科
      ranking: sorted           // 完整排名
    }
  }

  /**
   * 根据测评ID计算得分
   */
  calculateScore(assessmentId, questions, answers) {
    const scorers = {
      holland: () => this.scoreHolland(questions, answers),
      mbti: () => this.scoreMBTI(questions, answers),
      intelligence: () => this.scoreMultipleIntelligences(questions, answers),
      vark: () => this.scoreVARK(questions, answers),
      values: () => this.scoreCareerValues(questions, answers),
      subject: () => this.scoreSubjectEfficacy(questions, answers)
    }

    const scorer = scorers[assessmentId]
    if (!scorer) {
      throw new Error(`Unknown assessment ID: ${assessmentId}`)
    }

    return scorer()
  }
}

// 创建单例实例
export const scoringEngine = new ScoringEngine()
