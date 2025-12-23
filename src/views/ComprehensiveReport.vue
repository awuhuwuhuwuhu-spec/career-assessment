<template>
  <div class="report-page">
    <div class="container" v-if="!loading && report" id="report-content">
      <!-- 头部 -->
      <div class="header">
        <button @click="goBack" class="back-btn">← 返回首页</button>
        <h1 class="title">你的综合测评分析报告</h1>
        <p class="subtitle">生成时间: {{ generatedTime }}</p>

        <!-- 导出按钮组 -->
        <div class="export-actions">
          <button @click="handleExportPDF" class="export-btn" :disabled="exporting">
            📄 {{ exporting ? '导出中...' : '导出PDF' }}
          </button>
          <button @click="handleExportImage" class="export-btn" :disabled="exporting">
            🖼️ {{ exporting ? '导出中...' : '导出图片' }}
          </button>
        </div>
      </div>

      <div class="report-content">
        <!-- Grid Layout -->
        <div class="grid-layout">

          <!-- 1. Core Persona (Large Card) -->
          <div class="core-persona-card">
            <div class="persona-badge-wrapper">
              <div class="persona-badge">
                <span class="holland-code">{{ report.personalityProfile.hollandCode }}</span>
              </div>
              <div class="badge-label">霍兰德代码</div>
            </div>

            <div class="persona-content">
              <h3 class="persona-title">多元潜能者</h3>
              <p class="persona-description">
                你的代码显示你兼具<span class="highlight">{{ report.personalityProfile.hollandType }}</span>特质。
                这是一种非常平衡且具竞争力的组合。
              </p>
              <div class="trait-tags">
                <span class="trait-tag">逻辑严密</span>
                <span class="trait-tag">富有创意</span>
                <span class="trait-tag">行动派</span>
              </div>
            </div>
          </div>

          <!-- 2. MBTI & Learning Style (Stacked) -->
          <div class="side-cards">
            <div class="info-card">
              <div class="info-content">
                <div class="info-label">MBTI 类型</div>
                <div class="info-value">{{ report.personalityProfile.mbtiType }}</div>
                <div class="info-desc">{{ report.personalityProfile.mbtiName }}</div>
              </div>
              <div class="info-icon">🧠</div>
            </div>

            <div class="info-card">
              <div class="info-content">
                <div class="info-label">学习风格</div>
                <div class="info-value">{{ report.personalityProfile.learningStyle }}</div>
                <div class="info-desc">{{ getVarkName(report.personalityProfile.learningStyle) }}</div>
              </div>
              <div class="info-icon">🎯</div>
            </div>
          </div>

          <!-- 3. Major Recommendations -->
          <div class="major-recommendations-card">
            <div class="section-header">
              <span class="section-icon">📚</span>
              <h3 class="section-title">推荐专业方向</h3>
            </div>

            <div class="majors-list">
              <div
                v-for="major in report.majorRecommendations.slice(0, 3)"
                :key="major.rank"
                class="major-item"
              >
                <div class="major-header">
                  <span class="major-name">{{ major.name }}</span>
                  <span class="major-score">{{ Math.min(major.score, 100) }}% 匹配</span>
                </div>
                <div class="major-progress-bg">
                  <div class="major-progress-fill" :style="{ width: Math.min(major.score, 100) + '%' }"></div>
                </div>
                <div class="major-reasons">
                  <span v-for="(reason, idx) in major.reasons.slice(0, 2)" :key="idx" class="reason-tag">
                    {{ reason }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Career Recommendations Section (Full Width) -->
          <div class="careers-section">
            <div class="section-header">
              <span class="section-icon">💼</span>
              <h3 class="section-title">未来职业方向</h3>
            </div>

            <div class="careers-grid">
              <div
                v-for="career in report.careerRecommendations.slice(0, 6)"
                :key="career.rank"
                class="career-card"
              >
                <div class="career-header">
                  <span class="career-rank">#{{ career.rank }}</span>
                  <span class="match-badge">{{ career.matchScore }}%</span>
                </div>
                <h4 class="career-name">{{ career.name }}</h4>
                <p class="career-reason">{{ career.reasons[0] }}</p>
              </div>
            </div>
          </div>

          <!-- 5. AI Analysis Section (Prominent) -->
          <div class="ai-analysis-section">
            <div class="glow-effect"></div>

            <div class="ai-content">
              <div class="ai-header">
                <div class="ai-icon-wrapper">
                  <span class="ai-icon">✨</span>
                </div>
                <h3 class="ai-title">综合建议与发展方向</h3>
              </div>

              <div class="ai-body">
                <div class="summary-block">
                  <h4 class="summary-subtitle">📌 你的优势</h4>
                  <ul class="summary-list">
                    <li v-for="(strength, idx) in report.summary.strengths" :key="idx">
                      {{ strength }}
                    </li>
                  </ul>
                </div>

                <div class="summary-block">
                  <h4 class="summary-subtitle">🎯 发展建议</h4>
                  <ul class="summary-list">
                    <li v-for="(rec, idx) in report.summary.recommendations" :key="idx">
                      {{ rec }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- 6. Subject Selection (Full Width) -->
          <div class="subject-section">
            <div class="section-header">
              <span class="section-icon">📖</span>
              <h3 class="section-title">新高考选科建议（3+3模式）</h3>
            </div>

            <div class="subjects-wrapper">
              <div class="subjects-badges">
                <span class="subject-badge required">语文</span>
                <span class="subject-badge required">数学</span>
                <span class="subject-badge required">英语</span>
                <span
                  v-for="sub in report.subjectSelection.recommendation.subjects"
                  :key="sub"
                  class="subject-badge elective"
                >
                  {{ sub }}
                </span>
              </div>

              <div class="subject-info">
                <h4 class="subject-combo-name">{{ report.subjectSelection.analysis.name }}</h4>
                <p class="subject-desc">{{ report.subjectSelection.analysis.description }}</p>

                <div class="subject-meta">
                  <div class="meta-item">
                    <span class="meta-label">难度等级：</span>
                    <span class="meta-value">{{ report.subjectSelection.analysis.difficulty }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">专业覆盖：</span>
                    <span class="meta-value">{{ report.subjectSelection.analysis.coverage }}</span>
                  </div>
                </div>

                <div class="subject-majors">
                  <h5>适合专业：</h5>
                  <div class="major-tags">
                    <span
                      v-for="(major, idx) in report.subjectSelection.analysis.majors.slice(0, 6)"
                      :key="idx"
                      class="major-tag"
                    >
                      {{ major }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 7. Learning Methods -->
          <div class="learning-methods-section">
            <div class="section-header">
              <span class="section-icon">🎯</span>
              <h3 class="section-title">个性化学习方法建议</h3>
            </div>

            <div class="methods-content">
              <h4 class="methods-title">{{ report.learningMethods.name }}</h4>
              <ul class="methods-list">
                <li
                  v-for="(strategy, idx) in report.learningMethods.strategies"
                  :key="idx"
                  class="method-item"
                >
                  {{ strategy }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <div class="loading-spinner">⏳</div>
      <p class="loading-text">正在生成报告...</p>
    </div>

    <!-- 未完成提示 -->
    <div v-else class="empty-state">
      <p class="empty-text">请先完成所有测评</p>
      <button @click="goBack" class="primary-btn">返回首页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '../stores/report'
import { storageManager } from '../utils/storage'
import MappingEngine from '../services/mappingEngine'
import { ElMessage } from 'element-plus'
import { exportToPDF, exportToImage } from '../utils/exportReport'

const router = useRouter()
const reportStore = useReportStore()

const loading = ref(true)
const report = ref(null)
const exporting = ref(false)

const generatedTime = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
})

// VARK名称映射
const getVarkName = (type) => {
  const names = {
    V: '视觉型学习者',
    A: '听觉型学习者',
    R: '读写型学习者',
    K: '动觉型学习者'
  }
  return names[type] || '混合型学习者'
}

// 分数颜色
const getScoreColor = (score) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#409eff'
  if (score >= 40) return '#e6a23c'
  return '#f56c6c'
}

// 生成报告
onMounted(async () => {
  try {
    // 检查是否完成所有测评
    if (!storageManager.isAllCompleted()) {
      ElMessage.warning('请先完成所有测评')
      loading.value = false
      return
    }

    // 加载所有测评结果
    const results = {
      holland: storageManager.getAssessmentResult('holland'),
      mbti: storageManager.getAssessmentResult('mbti'),
      intelligence: storageManager.getAssessmentResult('intelligence'),
      vark: storageManager.getAssessmentResult('vark'),
      values: storageManager.getAssessmentResult('values'),
      subject: storageManager.getAssessmentResult('subject')
    }

    // 使用映射引擎生成综合报告
    const mappingEngine = new MappingEngine(results)
    report.value = mappingEngine.generateComprehensiveReport()

    // 保存报告
    storageManager.saveComprehensiveReport(report.value)
    reportStore.saveComprehensiveReport(report.value)

    loading.value = false
  } catch (error) {
    ElMessage.error('生成报告失败：' + error.message)
    console.error(error)
    loading.value = false
  }
})

const goBack = () => {
  router.push('/')
}

// 导出PDF
const handleExportPDF = async () => {
  exporting.value = true
  try {
    const filename = `测评报告_${generatedTime.value.replace(/\//g, '-')}.pdf`
    const result = await exportToPDF('report-content', filename)

    if (result.success) {
      ElMessage.success('PDF导出成功')
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('PDF导出失败：' + error.message)
    console.error('PDF导出错误:', error)
  } finally {
    exporting.value = false
  }
}

// 导出图片
const handleExportImage = async () => {
  exporting.value = true
  try {
    const filename = `测评报告_${generatedTime.value.replace(/\//g, '-')}.png`
    const result = await exportToImage('report-content', filename)

    if (result.success) {
      ElMessage.success('图片导出成功')
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('图片导出失败：' + error.message)
    console.error('图片导出错误:', error)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
/* Base Layout */
.report-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 40px 20px;
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 48px;
}

.back-btn {
  display: inline-block;
  background: none;
  border: none;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease;
  margin-bottom: 16px;
}

.back-btn:hover {
  color: #0f172a;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.subtitle {
  color: #94a3b8;
  font-size: 14px;
  margin: 0 0 20px 0;
}

/* 导出按钮组 */
.export-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.export-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}

.export-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3);
}

.export-btn:active:not(:disabled) {
  transform: translateY(0);
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media print {
  .export-actions,
  .back-btn {
    display: none;
  }
}


/* Grid Layout */
.grid-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .grid-layout {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 1. Core Persona Card */
.core-persona-card {
  background: white;
  border-radius: 24px;
  padding: 32px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
}

@media (min-width: 768px) {
  .core-persona-card {
    grid-column: span 2;
    flex-direction: row;
    align-items: flex-start;
  }
}

.persona-badge-wrapper {
  position: relative;
  flex-shrink: 0;
}

.persona-badge {
  width: 128px;
  height: 128px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.3);
}

.holland-code {
  font-size: 40px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.1em;
}

.badge-label {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
  white-space: nowrap;
}

.persona-content {
  flex: 1;
  text-align: center;
}

@media (min-width: 768px) {
  .persona-content {
    text-align: left;
  }
}

.persona-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.persona-description {
  color: #64748b;
  line-height: 1.7;
  margin: 0 0 16px 0;
}

.highlight {
  font-weight: 600;
  color: #0f172a;
}

.trait-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

@media (min-width: 768px) {
  .trait-tags {
    justify-content: flex-start;
  }
}

.trait-tag {
  padding: 6px 12px;
  background: #eef2ff;
  color: #4f46e5;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

/* 2. Side Cards (MBTI & Learning Style) */
.side-cards {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (min-width: 768px) {
  .side-cards {
    grid-column: span 1;
  }
}

.info-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.info-value {
  font-size: 32px;
  font-weight: 700;
  color: #7c3aed;
  margin-bottom: 4px;
}

.info-desc {
  font-size: 14px;
  color: #64748b;
}

.info-icon {
  font-size: 48px;
  flex-shrink: 0;
}

/* 3. Major Recommendations */
.major-recommendations-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .major-recommendations-card {
    grid-column: span 1;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.section-icon {
  font-size: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.majors-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.major-item {
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.major-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.major-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.major-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.major-score {
  font-size: 12px;
  font-weight: 600;
  color: #4f46e5;
}

.major-progress-bg {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.major-progress-fill {
  height: 100%;
  background: #4f46e5;
  border-radius: 9999px;
  transition: width 1s ease-out;
}

.major-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.reason-tag {
  font-size: 10px;
  color: #64748b;
  background: #f8fafc;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #f1f5f9;
}

/* 4. Careers Section */
.careers-section {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .careers-section {
    grid-column: span 3;
  }
}

.careers-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .careers-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .careers-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.career-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.career-card:hover {
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.career-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.career-rank {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.match-badge {
  background: #22c55e;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.career-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.career-reason {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* 5. AI Analysis Section */
.ai-analysis-section {
  background: linear-gradient(135deg, #312e81 0%, #1e293b 100%);
  border-radius: 24px;
  padding: 32px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .ai-analysis-section {
    grid-column: span 2;
  }
}

.glow-effect {
  position: absolute;
  top: 0;
  right: 0;
  width: 256px;
  height: 256px;
  background: #4f46e5;
  opacity: 0.2;
  filter: blur(80px);
  border-radius: 9999px;
  margin-right: -64px;
  margin-top: -64px;
}

.ai-content {
  position: relative;
  z-index: 10;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.ai-icon-wrapper {
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.ai-icon {
  font-size: 20px;
}

.ai-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.ai-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-block {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.summary-subtitle {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.summary-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.summary-list li {
  padding: 12px 16px;
  margin: 8px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid rgba(255, 255, 255, 0.3);
  line-height: 1.6;
  font-size: 14px;
}

/* 6. Subject Selection */
.subject-section {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .subject-section {
    grid-column: span 3;
  }
}

.subjects-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.subjects-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.subject-badge {
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
}

.subject-badge.required {
  background: #64748b;
  color: white;
}

.subject-badge.elective {
  background: #22c55e;
  color: white;
}

.subject-info {
  text-align: left;
}

.subject-combo-name {
  font-size: 18px;
  color: #4f46e5;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.subject-desc {
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.subject-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  gap: 8px;
}

.meta-label {
  font-weight: 600;
  color: #0f172a;
}

.meta-value {
  color: #64748b;
}

.subject-majors h5 {
  font-size: 14px;
  color: #0f172a;
  margin: 0 0 12px 0;
}

.major-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.major-tag {
  padding: 6px 12px;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  font-size: 12px;
}

/* 7. Learning Methods */
.learning-methods-section {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .learning-methods-section {
    grid-column: span 1;
  }
}

.methods-content {
  margin-top: 16px;
}

.methods-title {
  font-size: 16px;
  color: #4f46e5;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.methods-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.method-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #4f46e5;
  margin: 8px 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #0f172a;
}

.loading-spinner {
  font-size: 60px;
  margin-bottom: 24px;
}

.loading-text,
.empty-text {
  font-size: 20px;
  font-weight: 600;
  margin: 8px 0;
  color: #64748b;
}

.primary-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.2s ease;
}

.primary-btn:hover {
  background: #4338ca;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .report-page {
    padding: 16px;
    background: white;
  }

  .container {
    max-width: 100%;
    width: 100%;
    padding: 0;
  }

  .header {
    margin-bottom: 24px;
  }

  .title {
    font-size: 22px;
  }

  .subtitle {
    font-size: 12px;
  }

  .section-title {
    font-size: 16px;
  }

  .core-persona-card,
  .info-card,
  .major-recommendations-card,
  .careers-section,
  .ai-analysis-section,
  .subject-section,
  .learning-methods-section {
    padding: 20px;
    border-radius: 16px;
  }

  .persona-badge {
    width: 96px;
    height: 96px;
  }

  .holland-code {
    font-size: 32px;
  }

  .persona-title {
    font-size: 18px;
  }

  .persona-description {
    font-size: 14px;
  }

  .info-value {
    font-size: 24px;
  }

  .ai-analysis-section {
    padding: 24px;
  }

  .grid-layout {
    gap: 16px;
  }

  .section-header {
    margin-bottom: 16px;
  }

  .major-item,
  .career-card {
    padding: 16px;
    border-radius: 12px;
  }

  .export-actions {
    flex-direction: column;
  }

  .export-actions button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .report-page {
    padding: 12px;
  }

  .title {
    font-size: 20px;
  }

  .trait-tags {
    gap: 6px;
  }

  .trait-tag {
    font-size: 11px;
    padding: 4px 8px;
  }
}
</style>
