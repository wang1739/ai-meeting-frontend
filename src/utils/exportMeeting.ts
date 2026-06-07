import { saveAs } from 'file-saver'

function formatDate(dateStr: string): string {
  if (!dateStr) return '未知'
  try {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return '未知'
  }
}

/* ================================================================
   Word 导出
   ================================================================ */
export async function exportWord(meeting: any, summary: any, actionItems: any[]) {
  const { Document: Doc, Packer: Pk, Paragraph: Par, HeadingLevel: HL } = await import('docx')

  const children: any[] = []

  // Title
  children.push(new Par({
    text: meeting.title || '会议纪要',
    heading: HL.TITLE,
  }))

  // Basic info
  children.push(new Par({
    text: `日期: ${formatDate(meeting.startTime)}  时长: ${meeting.duration ? meeting.duration + '分钟' : '未知'}`,
    spacing: { after: 200 },
  }))

  // One-line summary
  if (summary?.oneLineSummary) {
    children.push(new Par({
      text: 'Summary',
      heading: HL.HEADING_2,
      spacing: { before: 300 },
    }))
    children.push(new Par({
      text: summary.oneLineSummary,
      spacing: { after: 200 },
    }))
  }

  // Detailed summary
  if (summary?.detailedSummary) {
    children.push(new Par({
      text: 'Detailed Summary',
      heading: HL.HEADING_2,
      spacing: { before: 300 },
    }))

    const detailLines = summary.detailedSummary.split('\n')
    for (const line of detailLines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      if (trimmed.startsWith('## ')) {
        children.push(new Par({
          text: trimmed.replace(/^#+\s*/, ''),
          heading: HL.HEADING_3,
        }))
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        children.push(new Par({
          text: trimmed.substring(2),
          bullet: { level: 0 },
        }))
      } else {
        children.push(new Par({ text: trimmed }))
      }
    }
  }

  // Key Decisions
  if (summary?.keyDecisions?.length > 0) {
    children.push(new Par({
      text: 'Key Decisions',
      heading: HL.HEADING_2,
      spacing: { before: 300 },
    }))
    summary.keyDecisions.forEach((d: string) => {
      children.push(new Par({ text: d, bullet: { level: 0 } }))
    })
  }

  // Action Items
  if (actionItems?.length > 0) {
    children.push(new Par({
      text: 'Action Items',
      heading: HL.HEADING_2,
      spacing: { before: 300 },
    }))
    actionItems.forEach((item: any) => {
      const status = item.status === 'open' ? '[Open]' : item.status === 'in_progress' ? '[In Progress]' : '[Done]'
      const assignee = item.assignee || item.assigneeName || 'Unassigned'
      children.push(new Par({
        text: `${status} ${item.description} - Assignee: ${assignee}`,
        bullet: { level: 0 },
        spacing: { after: 100 },
      }))
    })
  }

  const doc = new Doc({ sections: [{ children }] })
  const blob = await Pk.toBlob(doc)
  const fileName = `会议纪要-${meeting.title || '未命名'}-${new Date().toLocaleDateString('zh-CN')}.docx`
  saveAs(blob, fileName)
}