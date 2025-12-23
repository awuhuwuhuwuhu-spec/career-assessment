<template>
  <div class="home-page">
    <div class="container">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <div>
          <h2 class="welcome-title">你好, 同学 👋</h2>
          <p class="welcome-subtitle">今天准备探索什么？完成测评以解锁你的个性化报告。</p>
        </div>

        <el-button
          v-if="allCompleted"
          type="primary"
          size="large"
          @click="viewReport"
          class="report-btn-desktop"
        >
          ✨ 查看综合报告
        </el-button>
      </div>

      <!-- Status Grid -->
      <div class="status-grid">
        <!-- Progress Card -->
        <div class="progress-card">
          <div class="progress-decoration"></div>
          <div>
            <div class="progress-label">测评进度</div>
            <div class="progress-percentage">{{ progress.percentage }}%</div>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: progress.percentage + '%' }"></div>
            </div>
            <div class="progress-info">
              <span>已完成 {{ progress.completed }} 个</span>
              <span>共 {{ progress.total }} 个</span>
            </div>
          </div>
        </div>

        <!-- Action Card -->
        <div class="action-card" @click="viewReport">
          <div class="action-card-content">
            <div class="action-icon-wrapper">
              <el-icon class="action-icon" :size="24"><TrendCharts /></el-icon>
            </div>
            <div>
              <h3 class="action-title">生涯画像分析</h3>
              <p class="action-description">
                基于你的测评结果，AI 将为你生成包含专业推荐、性格优势和学习建议的深度报告。
              </p>
            </div>
          </div>
          <div class="action-arrow">
            <el-icon :size="20"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <!-- Assessment List -->
      <div class="assessment-section">
        <h3 class="section-title">测评任务</h3>

        <div class="assessment-grid">
          <div
            v-for="assessment in assessments"
            :key="assessment.id"
            class="assessment-card"
            :class="{ 'assessment-completed': assessment.completed }"
            @click="startAssessment(assessment)"
          >
            <div v-if="assessment.completed" class="completed-badge">
              <el-icon :size="24"><CircleCheck /></el-icon>
            </div>

            <div class="card-icon">{{ assessment.icon }}</div>

            <div class="card-content">
              <h4 class="card-title">{{ assessment.name }}</h4>
              <p class="card-description">{{ assessment.description }}</p>
            </div>

            <div class="card-footer">
              <div class="card-meta">
                <span class="meta-item">
                  <el-icon :size="12"><Clock /></el-icon>
                  {{ assessment.estimatedTime }}
                </span>
                <span class="meta-dot"></span>
                <span>{{ assessment.questionCount }} 题</span>
              </div>

              <span v-if="!assessment.completed" class="start-badge">
                开始
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Report Button -->
      <div v-if="allCompleted" class="report-btn-mobile">
        <el-button type="primary" size="large" @click="viewReport" style="width: 100%">
          ✨ 查看综合报告
        </el-button>
      </div>

      <!-- Data Management -->
      <div class="footer-actions">
        <el-button @click="clearAllData" text type="danger" size="small">
          清除所有数据
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAssessmentStore } from '../stores/assessment'
import { storageManager } from '../utils/storage'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Clock, ArrowRight, CircleCheck, TrendCharts } from '@element-plus/icons-vue'

const router = useRouter()
const assessmentStore = useAssessmentStore()

const assessments = computed(() => {
  return assessmentStore.assessments.map(a => ({
    ...a,
    completed: storageManager.isAssessmentCompleted(a.id)
  }))
})

const progress = computed(() => storageManager.getProgress())
const allCompleted = computed(() => storageManager.isAllCompleted())

const startAssessment = (assessment) => {
  if (assessment.completed) {
    ElMessageBox.confirm(
      '您已完成此测评，是否重新测评？',
      '提示',
      {
        confirmButtonText: '重新测评',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      router.push(`/test/${assessment.id}`)
    }).catch(() => {})
  } else {
    router.push(`/test/${assessment.id}`)
  }
}

const viewReport = () => {
  router.push('/report')
}

const clearAllData = () => {
  ElMessageBox.confirm(
    '确定要清除所有测评数据吗？此操作不可恢复。',
    '警告',
    {
      confirmButtonText: '确定清除',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    storageManager.clearAll()
    ElMessage.success('数据已清除')
    location.reload()
  }).catch(() => {})
}
</script>

<style scoped>
/* Base Layout */
.home-page {
  min-height: 100vh;
  padding: 40px 20px;
  background: #f8fafc;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* 移动端全宽布局 */
@media (max-width: 768px) {
  .home-page {
    padding: 16px;
  }

  .container {
    max-width: 100%;
    padding: 0;
  }
}

/* Welcome Section */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 32px;
}

.welcome-title {
  font-size: 30px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  color: #64748b;
  margin-top: 8px;
  font-size: 15px;
}

.report-btn-desktop {
  display: none;
  background: #0f172a !important;
  border: none !important;
  border-radius: 9999px !important;
  padding: 10px 20px !important;
  font-weight: 600 !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
}

@media (min-width: 768px) {
  .report-btn-desktop {
    display: inline-flex;
  }
}

/* Status Grid */
.status-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-bottom: 40px;
}

@media (min-width: 768px) {
  .status-grid {
    grid-template-columns: 1fr 2fr;
  }
}

/* Progress Card */
.progress-card {
  background: #4f46e5;
  border-radius: 24px;
  padding: 24px;
  color: white;
  box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 200px;
}

.progress-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 128px;
  height: 128px;
  background: white;
  opacity: 0.05;
  border-radius: 9999px;
  margin-right: -40px;
  margin-top: -40px;
  filter: blur(40px);
}

.progress-label {
  color: #c7d2fe;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.progress-percentage {
  font-size: 36px;
  font-weight: 700;
}

.progress-bar-container {
  margin-top: 32px;
}

.progress-bar-bg {
  width: 100%;
  background: rgba(79, 70, 229, 0.3);
  height: 8px;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: white;
  border-radius: 9999px;
  transition: width 1s ease-out;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #c7d2fe;
}

/* Action Card */
.action-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.action-card-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.action-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #fff7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-icon {
  color: #f97316;
}

.action-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
  transition: color 0.3s ease;
}

.action-card:hover .action-title {
  color: #4f46e5;
}

.action-description {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  max-width: 500px;
  margin: 0;
}

.action-arrow {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.action-card:hover .action-arrow {
  background: #eef2ff;
  color: #4f46e5;
}

/* Assessment Section */
.assessment-section {
  margin-top: 60px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 24px;
}

.assessment-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .assessment-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Assessment Card */
.assessment-card {
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.assessment-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.assessment-completed {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
}

.completed-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  color: #22c55e;
}

.card-icon {
  font-size: 48px;
  margin-bottom: 24px;
  transform-origin: left;
  transition: transform 0.3s ease;
}

.assessment-card:hover .card-icon {
  transform: scale(1.1);
}

.card-content {
  flex-grow: 1;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.assessment-card:hover .card-title {
  color: #4f46e5;
}

.card-description {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.card-footer {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-dot {
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: #cbd5e1;
}

.start-badge {
  color: #4f46e5;
  background: #eef2ff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.assessment-card:hover .start-badge {
  background: #4f46e5;
  color: white;
}

/* Mobile Report Button */
.report-btn-mobile {
  display: block;
  margin-top: 32px;
}

@media (min-width: 768px) {
  .report-btn-mobile {
    display: none;
  }
}

/* Footer Actions */
.footer-actions {
  text-align: center;
  margin-top: 40px;
}
</style>
