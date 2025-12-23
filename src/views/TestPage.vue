<template>
  <div class="test-page">
    <div class="container" v-if="!loading">
      <!-- Header Info -->
      <div class="header-section">
        <div>
          <h2 class="test-title">{{ assessmentName }}</h2>
          <p class="test-subtitle">请根据你的直觉选择最符合的选项</p>
        </div>
        <div class="header-actions">
          <button class="overview-btn" @click="showOverview = true">
            <el-icon><List /></el-icon>
            <span>答题概览</span>
          </button>
          <div class="question-counter">
            <span class="current-number">{{ String(currentIndex + 1).padStart(2, '0') }}</span>
            <span class="total-number">/ {{ questions.length }}</span>
          </div>
        </div>
      </div>

      <!-- Minimal Progress Bar -->
      <div class="progress-bar-wrapper">
        <div
          class="progress-bar-fill"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>

      <!-- Question Card -->
      <transition name="slide-fade" mode="out-in">
        <div :key="currentIndex" class="question-wrapper">
          <div class="question-card">
            <h3 class="question-text">{{ currentQuestion.question }}</h3>

            <!-- 李克特量表（1-5分）-->
            <div v-if="assessmentType === 'likert'" class="likert-options">
              <div
                v-for="score in [5, 4, 3, 2, 1]"
                :key="score"
                class="likert-btn"
                :class="{ selected: currentAnswer === score }"
                @click="selectAnswer(score)"
              >
                <div class="likert-icon">{{ getLikertIcon(score) }}</div>
                <div class="likert-label">{{ getLikertLabel(score) }}</div>
              </div>
            </div>

            <!-- MBTI二选一 -->
            <div v-else-if="assessmentType === 'binary'" class="option-list">
              <button
                v-for="(option, index) in currentQuestion.options"
                :key="index"
                class="option-button"
                :class="{ selected: currentAnswer === index }"
                @click="selectAnswer(index)"
              >
                <span class="option-badge">{{ String.fromCharCode(65 + index) }}</span>
                {{ option.text }}
              </button>
            </div>

            <!-- VARK四选一 -->
            <div v-else-if="assessmentType === 'multiple'" class="option-list">
              <button
                v-for="(option, index) in currentQuestion.options"
                :key="index"
                class="option-button"
                :class="{ selected: currentAnswer === index }"
                @click="selectAnswer(index)"
              >
                <span class="option-badge">{{ String.fromCharCode(65 + index) }}</span>
                {{ option.text }}
              </button>
            </div>

            <!-- Navigation Buttons -->
            <div class="nav-buttons">
              <button
                @click="prevQuestion"
                :disabled="currentIndex === 0"
                class="nav-btn prev-btn"
              >
                上一题
              </button>

              <button
                v-if="isLastQuestion"
                @click="submitAssessment"
                class="nav-btn submit-btn"
              >
                完成测评
              </button>
              <button
                v-else
                @click="nextQuestion"
                class="nav-btn next-btn"
              >
                下一题
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Exit Link -->
      <div class="exit-section">
        <button @click="goBack" class="exit-link">
          保存进度并退出
        </button>
      </div>

      <!-- Question Overview -->
      <QuestionOverview
        v-model="showOverview"
        :questions="questions"
        :answers="answers"
        :current-index="currentIndex"
        @jump-to="jumpToQuestion"
      />
    </div>

    <!-- Loading State -->
    <div v-else class="loading-state">
      <el-icon class="is-loading loading-icon" :size="60"><Loading /></el-icon>
      <p class="loading-text">正在加载题目...</p>
      <p class="loading-subtext">{{ assessmentName }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssessmentStore } from '../stores/assessment'
import { useReportStore } from '../stores/report'
import { csvParser } from '../services/csvParser'
import { scoringEngine } from '../services/scoringEngine'
import { storageManager } from '../utils/storage'
import { ElMessage } from 'element-plus'
import { Loading, ArrowLeft, ArrowRight, Check, CircleCheck, List } from '@element-plus/icons-vue'
import QuestionOverview from '../components/QuestionOverview.vue'

const route = useRoute()
const router = useRouter()
const assessmentStore = useAssessmentStore()
const reportStore = useReportStore()

const assessmentId = route.params.assessmentId
const loading = ref(true)
const questions = ref([])
const answers = ref({})
const currentIndex = ref(0)
const currentAnswer = ref(null)
const autoNext = ref(false) // 是否正在自动跳题
const showOverview = ref(false) // 是否显示答题概览

// 当前测评信息
const assessment = computed(() =>
  assessmentStore.getAssessmentById(assessmentId)
)

const assessmentName = computed(() => assessment.value?.name || '')
const assessmentType = computed(() => assessment.value?.type || 'likert')

// 当前题目
const currentQuestion = computed(() => questions.value[currentIndex.value])

// 进度
const progressPercentage = computed(() =>
  Math.round(((currentIndex.value + 1) / questions.value.length) * 100)
)

// 进度条颜色
const progressColor = computed(() => {
  const percentage = progressPercentage.value
  if (percentage < 30) return '#f56c6c'
  if (percentage < 60) return '#e6a23c'
  if (percentage < 90) return '#409eff'
  return '#67c23a'
})

// 是否最后一题
const isLastQuestion = computed(() =>
  currentIndex.value === questions.value.length - 1
)

// 李克特量表图标
const getLikertIcon = (score) => {
  const icons = {
    5: '😄',
    4: '🙂',
    3: '😐',
    2: '😕',
    1: '😞'
  }
  return icons[score]
}

// 李克特量表文字
const getLikertLabel = (score) => {
  const labels = {
    5: '非常符合',
    4: '比较符合',
    3: '一般',
    2: '不太符合',
    1: '完全不符合'
  }
  return labels[score]
}

// 加载题目
onMounted(async () => {
  try {
    questions.value = await csvParser.loadAssessmentQuestions(assessmentId)

    // 尝试加载之前的答题进度
    const saved = storageManager.getAnswerProgress(assessmentId)
    if (saved) {
      currentIndex.value = saved.questionIndex
      answers.value = saved.answers
      currentAnswer.value = answers.value[currentQuestion.value?.id] ?? null
    }

    loading.value = false
  } catch (error) {
    ElMessage.error('加载题目失败：' + error.message)
    router.push('/')
  }
})

// 监听当前题目变化，更新当前答案
watch(currentQuestion, (newQ) => {
  if (newQ) {
    currentAnswer.value = answers.value[newQ.id] ?? null
    autoNext.value = false // 重置自动跳题标志
  }
})

// 选择答案 - 自动跳题
const selectAnswer = (answer) => {
  currentAnswer.value = answer

  if (currentQuestion.value) {
    answers.value[currentQuestion.value.id] = answer

    // 保存进度到localStorage
    storageManager.saveAnswerProgress(
      assessmentId,
      currentIndex.value,
      answers.value
    )

    // 自动跳到下一题（延迟300ms，让用户看到选中效果）
    autoNext.value = true
    setTimeout(() => {
      if (isLastQuestion.value) {
        submitAssessment()
      } else {
        currentIndex.value++
      }
    }, 300)
  }
}

// 上一题
const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

// 下一题（手动点击）
const nextQuestion = () => {
  if (currentAnswer.value === null && currentAnswer.value !== 0) {
    ElMessage.warning('请选择一个答案')
    return
  }

  if (isLastQuestion.value) {
    submitAssessment()
  } else {
    currentIndex.value++
  }
}

// 提交测评
const submitAssessment = () => {
  // 检查是否所有题目都已回答
  const unanswered = questions.value.filter(q =>
    answers.value[q.id] === undefined || answers.value[q.id] === null
  )

  if (unanswered.length > 0) {
    ElMessage.warning(`还有 ${unanswered.length} 道题未回答，请完成所有题目`)
    return
  }

  // 计算得分
  const result = scoringEngine.calculateScore(
    assessmentId,
    questions.value,
    answers.value
  )

  // 保存结果
  storageManager.saveAssessmentResult(assessmentId, result)
  reportStore.saveResult(assessmentId, result)

  // 清除答题进度
  storageManager.clearAnswerProgress(assessmentId)

  // 标记为已完成
  assessmentStore.markCompleted(assessmentId)

  ElMessage.success({
    message: '测评完成！',
    type: 'success',
    duration: 2000
  })

  // 返回首页
  setTimeout(() => {
    router.push('/')
  }, 500)
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 跳转到指定题目
const jumpToQuestion = (index) => {
  currentIndex.value = index
}
</script>

<style scoped>
/* Base Layout */
.test-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 40px 20px;
}

.container {
  max-width: 768px;
  margin: 0 auto;
}

/* Header Section */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding: 0 8px;
}

.header-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.overview-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.overview-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.overview-btn .el-icon {
  font-size: 16px;
}

.test-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.test-subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 4px 0 0 0;
}

.question-counter {
  text-align: right;
}

.current-number {
  font-size: 24px;
  font-weight: 700;
  color: #4f46e5;
  font-variant-numeric: tabular-nums;
}

.total-number {
  font-size: 14px;
  color: #cbd5e1;
  margin-left: 4px;
}

/* Progress Bar */
.progress-bar-wrapper {
  height: 4px;
  width: 100%;
  background: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 48px;
}

.progress-bar-fill {
  height: 100%;
  background: #4f46e5;
  border-radius: 9999px;
  transition: width 0.5s ease-out;
}

/* Question Card */
.question-wrapper {
  margin-bottom: 32px;
}

.question-card {
  background: white;
  border-radius: 24px;
  padding: 48px 32px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
  min-height: 400px;
}

.question-text {
  font-size: 24px;
  line-height: 1.5;
  color: #1e293b;
  font-weight: 700;
  margin: 0 0 48px 0;
  text-align: left;
}

/* Likert Options */
.likert-options {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 48px;
}

.likert-btn {
  flex: 1;
  min-width: 100px;
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  border: 2px solid transparent;
}

.likert-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(79, 70, 229, 0.2);
}

.likert-btn.selected {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border-color: #4f46e5;
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
}

.likert-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.likert-label {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}

.likert-btn.selected .likert-label {
  color: white;
}

/* Option List (Binary & Multiple) */
.option-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 48px;
}

.option-button {
  width: 100%;
  text-align: left;
  padding: 20px 24px;
  border-radius: 16px;
  border: 2px solid transparent;
  background: #f8fafc;
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  position: relative;
}

.option-button:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.option-button.selected {
  border-color: #4f46e5;
  background: rgba(79, 70, 229, 0.05);
  color: #4f46e5;
  font-weight: 600;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1);
}

.option-badge {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background: white;
  border: 2px solid #e2e8f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: #94a3b8;
  margin-right: 16px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.option-button.selected .option-badge {
  background: #4f46e5;
  border-color: #4f46e5;
  color: white;
}

/* Navigation Buttons */
.nav-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 32px;
  border-top: 1px solid #f8fafc;
}

.nav-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.prev-btn {
  background: transparent;
  color: #64748b;
}

.prev-btn:hover:not(:disabled) {
  background: #f8fafc;
  color: #0f172a;
}

.prev-btn:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.next-btn {
  color: #4f46e5;
  background: transparent;
  font-weight: 700;
}

.next-btn:hover {
  background: rgba(79, 70, 229, 0.05);
}

.submit-btn {
  background: #0f172a;
  color: white;
  padding: 12px 32px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.submit-btn:hover {
  background: #1e293b;
  transform: scale(1.02);
}

.submit-btn:active {
  transform: scale(0.98);
}

.arrow-icon {
  margin-left: 4px;
}

/* Exit Section */
.exit-section {
  text-align: center;
  margin-top: 32px;
}

.exit-link {
  color: #94a3b8;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: #e2e8f0;
  text-underline-offset: 4px;
  transition: color 0.2s ease;
}

.exit-link:hover {
  color: #64748b;
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #0f172a;
}

.loading-icon {
  margin-bottom: 24px;
  color: #4f46e5;
}

.loading-text {
  font-size: 20px;
  font-weight: 600;
  margin: 8px 0;
}

.loading-subtext {
  font-size: 16px;
  color: #94a3b8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .test-page {
    padding: 0;
    background: white;
    min-height: 100vh;
  }

  .container {
    max-width: 100%;
    width: 100%;
    padding: 8px;
  }

  .header-section {
    margin-bottom: 8px;
    flex-direction: row;
    gap: 8px;
    padding: 8px;
    background: #f8fafc;
    border-radius: 8px;
    align-items: center;
  }

  .header-section > div:first-child {
    flex: 1;
    min-width: 0;
  }

  .header-actions {
    flex-direction: column;
    gap: 6px;
    align-items: flex-end;
    flex-shrink: 0;
  }

  .overview-btn {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;
  }

  .overview-btn span {
    display: none;
  }

  .test-title {
    font-size: 14px;
    margin-bottom: 2px;
  }

  .test-subtitle {
    font-size: 11px;
    margin: 0;
  }

  .question-counter {
    text-align: right;
    white-space: nowrap;
  }

  .current-number {
    font-size: 14px;
  }

  .total-number {
    font-size: 11px;
  }

  .progress-bar-wrapper {
    margin-bottom: 8px;
    height: 2px;
  }

  .question-wrapper {
    margin-bottom: 8px;
  }

  .question-card {
    padding: 12px;
    min-height: unset;
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid #e2e8f0;
    background: #fafafa;
  }

  .question-text {
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 12px;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  /* 李克特量表 - 改为网格布局，充分利用横向空间 */
  .likert-options {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    margin-bottom: 12px;
  }

  .likert-btn {
    min-width: unset;
    padding: 8px 4px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .likert-icon {
    font-size: 24px;
    margin-bottom: 2px;
  }

  .likert-label {
    font-size: 10px;
    text-align: center;
    line-height: 1.2;
  }

  /* 选项列表 - 保持纵向，但更紧凑 */
  .option-list {
    gap: 6px;
    margin-bottom: 12px;
  }

  .option-button {
    padding: 10px 12px;
    font-size: 13px;
    line-height: 1.3;
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    border-radius: 8px;
  }

  .option-badge {
    width: 24px;
    height: 24px;
    font-size: 11px;
    margin-right: 8px;
  }

  .nav-buttons {
    padding-top: 10px;
    margin-top: 0;
    border-top: 1px solid #e2e8f0;
  }

  .nav-btn {
    padding: 8px 14px;
    font-size: 12px;
    border-radius: 6px;
  }

  .exit-section {
    margin-top: 8px;
    padding: 8px;
  }

  .exit-link {
    font-size: 11px;
  }

  .loading-state {
    padding: 20px;
  }

  .loading-icon {
    font-size: 48px !important;
  }

  .loading-text {
    font-size: 16px;
  }

  .loading-subtext {
    font-size: 13px;
  }
}

/* 超小屏幕（<360px）- 李克特量表改为3列 */
@media (max-width: 360px) {
  .likert-options {
    grid-template-columns: repeat(3, 1fr);
  }

  .likert-label {
    font-size: 9px;
  }
}
</style>
