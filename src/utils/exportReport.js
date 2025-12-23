/**
 * 报告导出工具
 * 支持导出为PDF和图片格式
 */
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * 导出报告为PDF
 * @param {string} elementId - 要导出的元素ID
 * @param {string} filename - 导出文件名
 */
export async function exportToPDF(elementId, filename = '测评报告.pdf') {
  try {
    // 1. 获取报告DOM元素
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`未找到元素: ${elementId}`)
    }

    // 2. 转换为Canvas (提高分辨率以获得更清晰的PDF)
    const canvas = await html2canvas(element, {
      scale: 2,              // 提高清晰度（2倍分辨率）
      useCORS: true,         // 处理跨域图片
      backgroundColor: '#ffffff',  // 白色背景
      logging: false,        // 关闭日志
      windowWidth: element.scrollWidth,  // 完整宽度
      windowHeight: element.scrollHeight // 完整高度
    })

    // 3. 转换为图片数据
    const imgData = canvas.toDataURL('image/png', 1.0)

    // 4. 创建PDF文档（A4尺寸）
    const pdf = new jsPDF({
      orientation: 'portrait',  // 竖向
      unit: 'mm',
      format: 'a4',
      compress: true            // 压缩以减小文件大小
    })

    // 5. 计算图片在PDF中的尺寸
    const pdfWidth = 210      // A4宽度（mm）
    const pdfHeight = 297     // A4高度（mm）
    const margin = 10         // 页边距（mm）

    const imgWidth = pdfWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = margin

    // 6. 添加第一页
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= (pdfHeight - margin * 2)

    // 7. 如果内容超过一页，添加额外页面
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= (pdfHeight - margin * 2)
    }

    // 8. 下载PDF
    pdf.save(filename)

    return { success: true, message: 'PDF导出成功' }
  } catch (error) {
    console.error('PDF导出失败:', error)
    return { success: false, message: `导出失败：${error.message}` }
  }
}

/**
 * 导出报告为PNG图片
 * @param {string} elementId - 要导出的元素ID
 * @param {string} filename - 导出文件名
 */
export async function exportToImage(elementId, filename = '测评报告.png') {
  try {
    // 1. 获取报告DOM元素
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`未找到元素: ${elementId}`)
    }

    // 2. 转换为Canvas
    const canvas = await html2canvas(element, {
      scale: 2,              // 2倍分辨率，确保清晰
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    })

    // 3. 转换为Blob并触发下载
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('无法生成图片')
      }

      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename

      // 触发下载
      document.body.appendChild(link)
      link.click()

      // 清理
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 'image/png', 1.0)

    return { success: true, message: '图片导出成功' }
  } catch (error) {
    console.error('图片导出失败:', error)
    return { success: false, message: `导出失败：${error.message}` }
  }
}

/**
 * 导出简化版报告（去除交互元素，优化打印）
 * @param {string} elementId - 要导出的元素ID
 * @param {string} format - 导出格式 ('pdf' | 'png')
 * @param {string} filename - 导出文件名
 */
export async function exportSimplified(elementId, format = 'pdf', filename) {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`未找到元素: ${elementId}`)
    }

    // 临时隐藏不需要导出的元素（按钮、交互组件等）
    const elementsToHide = element.querySelectorAll('.export-btn, .back-btn, button, .interactive')
    elementsToHide.forEach(el => {
      el.style.display = 'none'
    })

    // 执行导出
    const result = format === 'pdf'
      ? await exportToPDF(elementId, filename || '测评报告.pdf')
      : await exportToImage(elementId, filename || '测评报告.png')

    // 恢复隐藏的元素
    elementsToHide.forEach(el => {
      el.style.display = ''
    })

    return result
  } catch (error) {
    console.error('简化版导出失败:', error)
    return { success: false, message: `导出失败：${error.message}` }
  }
}

/**
 * 检查浏览器是否支持导出功能
 */
export function checkExportSupport() {
  const canvas = document.createElement('canvas')
  const hasCanvas = !!(canvas.getContext && canvas.getContext('2d'))
  const hasBlob = typeof Blob !== 'undefined'
  const hasURL = typeof URL !== 'undefined' && URL.createObjectURL

  return {
    supported: hasCanvas && hasBlob && hasURL,
    features: {
      canvas: hasCanvas,
      blob: hasBlob,
      url: hasURL
    }
  }
}
