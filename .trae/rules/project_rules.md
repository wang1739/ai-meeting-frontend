# AI智能会议助手 - 自定义智能体注册与调度规则

## 一、自定义NLP智能体列表

本项目的自定义智能体定义在 `.trae/agents/` 目录下，Trae IDE 应加载以下7个NLP文本处理智能体：

### 1. AsrAgent — 语音转写&说话人识别
- 文件：`.trae/agents/AsrAgent.md`
- 职责：PCM音频流 → 结构化转写JSON（说话人、文本、时间戳）
- 触发条件：前端上传会议音频流
- 输出交付：SummaryAgent、MoodAgent

### 2. SummaryAgent — 分层摘要生成
- 文件：`.trae/agents/SummaryAgent.md`
- 职责：转写+议程+附件 → 结构化摘要（总概括、决议、关键词、话题时间线）
- 触发条件：用户指令【总结近5分钟】/ 会议结束
- 输出交付：TaskAgent + 向量库

### 3. TaskAgent — 行动项抽取
- 文件：`.trae/agents/TaskAgent.md`
- 职责：转写+摘要+用户列表 → 任务数组（负责人、截止时间、原文上下文）
- 触发条件：SummaryAgent 完成输出后自动调用
- 输出交付：BackAgent 落地入库

### 4. QaRagAgent — RAG知识库问答
- 文件：`.trae/agents/QaRagAgent.md`
- 职责：用户提问+检索片段 → 带来源引用的答案
- 触发条件：用户在AI面板提问
- 输出交付：前端显示

### 5. TranslateAgent — 实时双语翻译
- 文件：`.trae/agents/TranslateAgent.md`
- 职责：转写文本+目标语种 → 翻译结果
- 触发条件：AsrAgent 输出 + 开启翻译
- 输出交付：前端WebSocket双语字幕

### 6. MoodAgent — 情绪语速分析
- 文件：`.trae/agents/MoodAgent.md`
- 职责：单段发言 → 情绪/语速分析 + 主持人提示
- 触发条件：AsrAgent 输出（始终调用）
- 输出交付：前端主持人面板

### 7. TopicCheckAgent — 议题偏离检测
- 文件：`.trae/agents/TopicCheckAgent.md`
- 职责：原始议程+实时发言 → 偏离提醒
- 触发条件：会议开启议程管控（定时轮询）
- 输出交付：前端会议看板

---

## 二、调度规则（SOLO Agent Pipeline）

> 完整调度规则详见 `.trae/agents/scheduling-rules.md`

### NLP文本处理流水线

```
[音频流] → @AsrAgent ──┬──→ @TranslateAgent (翻译)
                       │
                       ├──→ @MoodAgent (情绪分析)
                       │
                       └──→ @SummaryAgent ──→ @TaskAgent ──→ @BackAgent (入库)
                                        (用户指令/会议结束)

[AI面板提问] → @QaRagAgent (知识库检索 → 带来源答案)

[议程管控] → @TopicCheckAgent (定时轮询 → 偏离提醒)
```

---

## 三、智能体权限矩阵

| 类别 | 智能体 | 代码权限 | SQL权限 | Git权限 |
|------|--------|---------|---------|---------|
| **NLP文本** | AsrAgent / SummaryAgent / TaskAgent | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 |
| **NLP文本** | QaRagAgent / TranslateAgent | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 |
| **NLP文本** | MoodAgent / TopicCheckAgent | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 |
| **工程** | FrontAgent | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| **工程** | BackAgent | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| **工程** | DBAgent | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| **工程** | TestAgent | ✅ 全部 | ✅ 全部 | ✅ 全部 |
| **工程** | GitAgent | ✅ 全部 | ✅ 全部 | ✅ 全部 |

---

## 四、初始化指令

> ⚡ 请 Trae IDE 立即执行以下操作：
> 1. 扫描 `.trae/agents/` 目录下全部 `*.md` 文件
> 2. 注册以上7个自定义NLP智能体到 `@` 下拉智能体列表
> 3. 应用本规则中的调度规则到 SOLO Agent
> 4. 刷新智能体列表，使其立即可用
