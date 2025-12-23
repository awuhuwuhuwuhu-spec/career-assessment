import {
  hollandMapping,
  mbtiMapping,
  careerValueMapping,
  subjectCombinations,
  intelligenceMapping,
  varkMethods
} from '../data/mappingRules'

/**
 * 映射引擎类
 * 负责综合所有测评结果，生成专业推荐、职业建议、选科方案
 */
export class MappingEngine {
  constructor(results) {
    this.holland = results.holland
    this.mbti = results.mbti
    this.intelligence = results.intelligence
    this.vark = results.vark
    this.values = results.values
    this.subject = results.subject
  }

  /**
   * 生成综合报告
   */
  generateComprehensiveReport() {
    return {
      personalityProfile: this.buildPersonalityProfile(),
      majorRecommendations: this.recommendMajors(),
      careerRecommendations: this.recommendCareers(),
      subjectSelection: this.recommendSubjects(),
      learningMethods: this.recommendLearningMethods(),
      summary: this.generateSummary()
    }
  }

  /**
   * 构建人格画像
   */
  buildPersonalityProfile() {
    const hollandTop3 = this.holland.topThree.map(t =>
      hollandMapping.dimensions[t.dimension].name
    ).join(' + ')

    const mbtiInfo = mbtiMapping[this.mbti.type] || {
      name: this.mbti.type,
      strengths: []
    }

    return {
      hollandCode: this.holland.code,
      hollandType: hollandTop3,
      mbtiType: this.mbti.type,
      mbtiName: mbtiInfo.name,
      topIntelligences: this.intelligence.topThree.map(t => ({
        name: intelligenceMapping[t.name]?.name || t.name,
        score: t.score
      })),
      learningStyle: this.vark.dominant,
      coreValues: this.values.topFive.slice(0, 3).map(v => v.name)
    }
  }

  /**
   * 推荐专业（核心算法）
   */
  recommendMajors() {
    const majorScores = new Map()

    // 1. 基于霍兰德代码
    this.holland.topThree.forEach((dim, index) => {
      const weight = [40, 30, 20][index]
      const dimData = hollandMapping.dimensions[dim.dimension]

      if (dimData && dimData.majors) {
        dimData.majors.forEach(major => {
          this.addScore(majorScores, major, weight, 'holland')
        })
      }
    })

    // 2. 基于MBTI
    const mbtiData = mbtiMapping[this.mbti.type]
    if (mbtiData && mbtiData.majorCategories) {
      mbtiData.majorCategories.forEach(category => {
        this.addScore(majorScores, category, 20, 'mbti')
      })
    }

    // 3. 基于多元智能
    this.intelligence.topThree.forEach((intel, index) => {
      const weight = [25, 15, 10][index]
      const intelData = intelligenceMapping[intel.name]

      if (intelData && intelData.majors) {
        intelData.majors.forEach(major => {
          this.addScore(majorScores, major, weight, 'intelligence')
        })
      }
    })

    // 4. 基于学科效能感
    this.subject.topThree.forEach((sub, index) => {
      const weight = [20, 15, 10][index]
      const relatedMajors = this.getRelatedMajorsBySubject(sub.name)

      relatedMajors.forEach(major => {
        this.addScore(majorScores, major, weight, 'subject')
      })
    })

    // 排序并返回前10个
    const sorted = Array.from(majorScores.entries())
      .sort((a, b) => b[1].totalScore - a[1].totalScore)
      .slice(0, 10)

    return sorted.map(([major, data], index) => ({
      rank: index + 1,
      name: major,
      score: Math.round(data.totalScore),
      reasons: this.explainMajorMatch(major, data.sources)
    }))
  }

  /**
   * 推荐职业（核心算法）
   */
  recommendCareers() {
    const careerScores = new Map()

    // 1. 霍兰德职业映射
    this.holland.topThree.forEach((dim, index) => {
      const weight = [35, 25, 15][index]
      const dimData = hollandMapping.dimensions[dim.dimension]

      if (dimData && dimData.careers) {
        dimData.careers.forEach(career => {
          this.addScore(careerScores, career, weight, 'holland')
        })
      }
    })

    // 2. MBTI职业映射
    const mbtiData = mbtiMapping[this.mbti.type]
    if (mbtiData && mbtiData.careers) {
      mbtiData.careers.forEach(career => {
        this.addScore(careerScores, career, 30, 'mbti')
      })
    }

    // 3. 多元智能职业映射
    this.intelligence.topThree.forEach((intel, index) => {
      const weight = [20, 15, 10][index]
      const intelData = intelligenceMapping[intel.name]

      if (intelData && intelData.careers) {
        intelData.careers.forEach(career => {
          this.addScore(careerScores, career, weight, 'intelligence')
        })
      }
    })

    // 4. 职业价值观筛选
    this.values.topFive.forEach((value, index) => {
      const weight = [25, 20, 15, 10, 5][index]
      const factorData = careerValueMapping.factors[value.name]

      if (factorData) {
        // 推荐职业加分
        if (factorData.highMatchCareers) {
          factorData.highMatchCareers.forEach(career => {
            this.addScore(careerScores, career, weight, 'value')
          })
        }

        // 排除不匹配的职业（减半分数）
        if (factorData.avoidCareers) {
          factorData.avoidCareers.forEach(avoid => {
            if (careerScores.has(avoid)) {
              const data = careerScores.get(avoid)
              data.totalScore *= 0.5
            }
          })
        }
      }
    })

    // 排序并返回前15个
    const sorted = Array.from(careerScores.entries())
      .sort((a, b) => b[1].totalScore - a[1].totalScore)
      .slice(0, 15)

    return sorted.map(([career, data], index) => ({
      rank: index + 1,
      name: career,
      matchScore: Math.round(data.totalScore),
      reasons: this.explainCareerMatch(career, data.sources)
    }))
  }

  /**
   * 推荐选科（3+3模式：六选三）
   */
  recommendSubjects() {
    const subjectScores = {}

    // 初始化6个可选学科的分数
    const electiveSubjects = ['物理', '化学', '生物', '政治', '历史', '地理']

    electiveSubjects.forEach(subject => {
      const subjectData = this.subject.sorted.find(s => s.name === subject)
      subjectScores[subject] = subjectData ? parseFloat(subjectData.score) * 20 : 0
    })

    // 根据霍兰德类型调整权重
    this.holland.topThree.forEach((dim, index) => {
      const dimData = hollandMapping.dimensions[dim.dimension]
      if (dimData && dimData.subjectBonus) {
        Object.entries(dimData.subjectBonus).forEach(([subject, bonus]) => {
          if (subjectScores[subject] !== undefined) {
            subjectScores[subject] += bonus * 100 * (1 - index * 0.3)
          }
        })
      }
    })

    // 排序选出前3个
    const sorted = Object.entries(subjectScores)
      .sort((a, b) => b[1] - a[1])

    const topThree = sorted.slice(0, 3).map(s => s[0]).sort()
    const combination = topThree.join('-')

    // 查找匹配的选科组合
    const combinationData = subjectCombinations[combination] || {
      name: '个性化组合',
      difficulty: '中等',
      coverage: '待分析',
      majors: ['根据具体情况分析'],
      description: '这是一个个性化的选科组合'
    }

    // 生成备选方案
    const alternatives = [
      sorted.slice(0, 3).map(s => s[0]),
      [sorted[0][0], sorted[1][0], sorted[3][0]],
      [sorted[0][0], sorted[2][0], sorted[3][0]]
    ].map(combo => {
      const key = combo.sort().join('-')
      return {
        subjects: combo,
        data: subjectCombinations[key] || combinationData
      }
    })

    return {
      recommendation: {
        subjects: topThree,
        combinationName: combination
      },
      analysis: combinationData,
      alternatives: alternatives.slice(1, 3)
    }
  }

  /**
   * 推荐学习方法
   */
  recommendLearningMethods() {
    const dominantStyle = this.vark.dominant
    const methods = varkMethods[dominantStyle] || {
      name: '混合型学习者',
      strategies: ['灵活运用多种学习方式']
    }

    return {
      type: dominantStyle,
      name: methods.name,
      strategies: methods.strategies,
      isMultimodal: this.vark.isMultimodal,
      percentages: this.vark.percentages
    }
  }

  /**
   * 生成总结 - 更具体、更实用的建议
   */
  generateSummary() {
    // 获取具体的优势信息
    const hollandDim = this.holland.topThree[0]
    const hollandInfo = hollandMapping.dimensions[hollandDim.dimension]
    const topIntel = this.intelligence.topThree[0]
    const intelInfo = intelligenceMapping[topIntel.name]
    const topSubject = this.subject.topThree[0]
    const topValue = this.values.topFive[0]

    // 构建具体的优势描述
    const strengths = [
      `你的职业兴趣集中在${hollandInfo.name}领域（得分${hollandDim.score}），表现出${hollandInfo.traits}的特质，这在同龄人中属于前${Math.round((100 - hollandDim.score / 60 * 100))}%`,
      `你的${intelInfo?.name || topIntel.name}非常突出（得分${topIntel.score}），这使你在${intelInfo?.majors?.[0] || '相关专业'}等领域具有天然优势`,
      `${topSubject.name}学科效能感达到${topSubject.score}分（满分5分），说明你在该科目上有较强的自信心和实际能力`,
      `你最看重的职业价值是"${topValue.name}"（得分${topValue.score}），这将成为未来职业选择的重要标准`
    ]

    // 基于MBTI生成更具体的发展建议
    const mbtiInfo = mbtiMapping[this.mbti.type]
    const learningStyle = this.vark.dominant
    const learningMethods = varkMethods[learningStyle]

    const recommendations = []

    // 1. 专业选择建议
    recommendations.push(
      `大学专业建议优先考虑：${this.recommendMajors().slice(0, 3).map(m => m.name).join('、')}，这些专业与你的兴趣、能力高度匹配`
    )

    // 2. 职业发展建议
    const topCareers = this.recommendCareers().slice(0, 3).map(c => c.name)
    recommendations.push(
      `未来职业方向可以重点关注：${topCareers.join('、')}。建议在大学期间通过实习、社团等方式积累相关经验`
    )

    // 3. 学习方法建议 - 具体化
    if (learningMethods && learningMethods.strategies.length > 0) {
      recommendations.push(
        `根据你的${learningMethods.name}特点，建议：${learningMethods.strategies[0]}。这能大幅提升学习效率`
      )
    }

    // 4. 基于MBTI的人际发展建议
    if (mbtiInfo) {
      const personalityTip = this.getPersonalityDevelopmentTip(this.mbti.type)
      if (personalityTip) {
        recommendations.push(personalityTip)
      }
    }

    // 5. 选科建议
    const subjectRec = this.recommendSubjects()
    recommendations.push(
      `新高考选科推荐：${subjectRec.recommendation.subjects.join('+')}。这个组合可覆盖${subjectRec.analysis.coverage}的招生专业，难度${subjectRec.analysis.difficulty}`
    )

    // 6. 基于职业价值观的提醒
    const valueAdvice = this.getValueBasedAdvice(topValue.name)
    if (valueAdvice) {
      recommendations.push(valueAdvice)
    }

    return {
      strengths,
      recommendations
    }
  }

  /**
   * 根据MBTI类型生成个性化发展建议
   */
  getPersonalityDevelopmentTip(mbtiType) {
    const tips = {
      'INTJ': '作为战略型人格，建议培养团队协作能力，避免过度追求完美导致拖延',
      'INTP': '建议加强项目执行力和成果展示能力，将创意转化为实际产出',
      'ENTJ': '在追求目标时要注意倾听他人意见，培养同理心以提升领导力',
      'ENTP': '建议提升专注力和项目完成度，不要同时开启太多新项目',
      'INFJ': '要注意在理想主义和现实之间找平衡，避免情绪过度投入导致疲惫',
      'INFP': '建议培养决断力和时间管理能力，将创意想法付诸实践',
      'ENFJ': '在关心他人的同时也要关注自己的需求，避免过度牺牲',
      'ENFP': '建议培养持续专注力，为重要目标制定计划并坚持执行',
      'ISTJ': '建议适当拥抱变化和创新，不要过于固守经验和规则',
      'ISFJ': '要学会适度拒绝他人请求，为自己的成长留出时间和精力',
      'ESTJ': '在追求效率时也要关注团队成员的情绪和需求',
      'ESFJ': '建议培养独立思考能力，不要过度在意他人评价',
      'ISTP': '建议提升长期规划能力，为未来发展设定明确目标',
      'ISFP': '要增强自我表达能力，让更多人了解你的想法和作品',
      'ESTP': '建议培养风险意识和长期思维，避免冲动决策',
      'ESFP': '要注重深度学习和专业能力培养，不只关注眼前快乐'
    }
    return tips[mbtiType] || null
  }

  /**
   * 根据职业价值观生成实用建议
   */
  getValueBasedAdvice(topValue) {
    const adviceMap = {
      '利他主义': '建议在大学期间参与志愿服务和社会实践，积累助人经验；考虑报考师范、医学、社工等利他性强的专业',
      '安全感': '建议重点关注公务员、事业编、国企等招聘信息；选择就业率高、行业稳定的专业如师范、医学、会计等',
      '经济报酬': '建议选择高薪行业对应专业（金融、计算机、法律等）；大学期间要重视实习经历和技能证书，提升市场竞争力',
      '自主性': '建议培养专业技能和独立工作能力；考虑设计、编程、写作等自由度较高的专业和职业',
      '成就感': '建议选择具有挑战性的专业和职业；设定清晰的阶段性目标，通过完成高难度任务获得满足感',
      '声望地位': '建议选择医生、律师、教授等社会认可度高的职业路径；注重学历提升和专业资质考取',
      '工作生活平衡': '建议避开高强度行业（投行、外科等）；考虑教师、公务员等工作时间相对规律的职业',
      '创造性': '建议选择设计、建筑、艺术、产品等创意相关专业；多参与创新创业活动',
      '社会交往': '建议选择市场、人力、公关等人际互动频繁的专业；多参与社团活动锻炼社交能力',
      '智力激发': '建议选择研究型大学和基础学科；未来可考虑读研深造，从事科研或高端技术工作',
      '领导管理': '建议培养管理知识和领导能力；大学期间争取担任学生干部，积累管理经验',
      '多样性': '建议选择咨询、传媒、市场等工作内容丰富的行业；避免重复性高的工作',
      '环境舒适': '建议优先考虑办公室工作；避开户外、高危、体力劳动型职业'
    }
    return adviceMap[topValue] || null
  }

  // ========== 辅助方法 ==========

  addScore(scoreMap, item, points, source) {
    if (!scoreMap.has(item)) {
      scoreMap.set(item, { totalScore: 0, sources: [] })
    }
    const data = scoreMap.get(item)
    data.totalScore += points
    data.sources.push(source)
  }

  getRelatedMajorsBySubject(subject) {
    const mapping = {
      '语文': ['汉语言文学', '新闻学', '历史学', '哲学'],
      '数学': ['数学与应用数学', '统计学', '金融工程', '精算学'],
      '英语': ['英语', '翻译', '国际关系', '国际商务'],
      '物理': ['物理学', '应用物理', '工程力学', '核工程'],
      '化学': ['化学', '应用化学', '化学工程', '材料科学'],
      '生物': ['生物科学', '生物技术', '生态学', '生物医学工程'],
      '政治': ['政治学', '法学', '社会学', '公共管理'],
      '历史': ['历史学', '考古学', '文物保护', '博物馆学'],
      '地理': ['地理科学', '地理信息科学', '城乡规划', '测绘工程']
    }
    return mapping[subject] || []
  }

  explainMajorMatch(major, sources) {
    const reasons = []
    if (sources.includes('holland')) {
      reasons.push(`符合你的${this.holland.topThree[0].dimension}型职业兴趣`)
    }
    if (sources.includes('mbti')) {
      reasons.push(`与${this.mbti.type}人格类型匹配`)
    }
    if (sources.includes('intelligence')) {
      reasons.push(`契合你的优势智能`)
    }
    if (sources.includes('subject')) {
      reasons.push(`你在相关学科表现出较高能力`)
    }
    return reasons
  }

  explainCareerMatch(career, sources) {
    const reasons = []
    if (sources.includes('holland')) {
      reasons.push(`符合${hollandMapping.dimensions[this.holland.topThree[0].dimension].name}型兴趣`)
    }
    if (sources.includes('mbti')) {
      reasons.push(`与${this.mbti.type}人格类型相匹配`)
    }
    if (sources.includes('value')) {
      reasons.push(`满足你的核心职业价值观`)
    }
    if (sources.includes('intelligence')) {
      reasons.push(`发挥你的优势智能`)
    }
    return reasons
  }
}

export default MappingEngine
