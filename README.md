# 🎓 青少年生涯规划测评系统

一个基于Vue 3的纯前端教育测评网站，为中学生提供科学的生涯规划建议。

## ✨ 功能特点

- **6套科学测评工具**（共383道题）
  - 霍兰德职业兴趣测试（60题）
  - MBTI性格类型测评（72题）
  - 多元智能测评（80题）
  - VARK学习风格测评（20题）
  - 职业价值观测评（52题）
  - 学科效能感测评（99题）

- **智能综合分析**
  - 大学专业推荐（Top 10）
  - 未来职业方向（Top 15）
  - 新高考选科建议（3+3模式，六选三）
  - 个性化学习方法建议

- **用户友好设计**
  - 纯前端，无需后端服务器
  - 答题进度自动保存
  - 支持中断续答
  - 报告可导出（PDF/图片）

## 🛠️ 技术栈

- **前端框架**：Vue 3 + Vite
- **UI组件库**：Element Plus
- **状态管理**：Pinia
- **路由**：Vue Router
- **图表库**：ECharts
- **数据解析**：PapaParse
- **报告导出**：jsPDF + html2canvas

## 📦 安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发

```bash
npm run dev
```

访问 `http://localhost:5173`

### 3. 构建生产版本

```bash
npm run build
```

构建后的文件在 `dist` 目录

## 🚀 部署到Vercel

### 方式1：通过Vercel CLI

```bash
npm install -g vercel
vercel
```

### 方式2：通过Vercel网站

1. 访问 [vercel.com](https://vercel.com)
2. 导入GitHub仓库
3. Vercel会自动检测Vite项目并部署

## 📁 项目结构

```
assessment-platform/
├── public/
│   └── data/                # CSV测评题目
├── src/
│   ├── views/               # 页面组件
│   ├── stores/              # Pinia状态管理
│   ├── services/            # 业务逻辑
│   ├── data/                # 映射规则
│   ├── utils/               # 工具函数
│   └── router/              # 路由配置
├── vercel.json              # Vercel配置
└── package.json
```

## 🎯 核心算法

### 专业推荐算法

```
总分 = 霍兰德匹配(40分) + MBTI匹配(20分) +
       多元智能匹配(25分) + 学科效能感匹配(20分)
```

### 选科建议算法（3+3模式）

1. 基于学科效能感得分排序
2. 结合霍兰德类型调整权重
3. 考虑目标专业的选科要求
4. 生成主推组合 + 2个备选方案

## 📝 注意事项

1. **数据隐私**：所有数据仅存储在用户浏览器本地
2. **免责声明**：报告仅供参考，不作为升学决策唯一依据
3. **浏览器兼容**：建议使用Chrome/Edge/Safari最新版本

## 📄 许可证

MIT
