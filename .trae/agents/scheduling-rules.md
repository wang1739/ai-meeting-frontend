# SOLO Agent 调度规则 — NLP流水线配置

> 本文件定义了NLP文本处理智能体的调度流程和职责边界。
> 工程类任务（页面、接口、Git提交、建表）沿用 FrontAgent / BackAgent / DBAgent / TestAgent / GitAgent。

---

## 一、NLP智能体流水线

```mermaid
flowchart LR
    A[前端上传音频流] --> B{@AsrAgent}
    B -->|始终调用| C1[@MoodAgent]
    B -->|开启翻译| C2[@TranslateAgent]
    B --> D{@SummaryAgent}
    D -->|用户指令/会议结束| E[@TaskAgent]
    E --> F[BackAgent 入库]
    G[AI面板提问] --> H[@QaRagAgent]
    I[议程管控开启] --> J[@TopicCheckAgent]
```

### 步骤明细

| 步骤 | 触发器 | 执行智能体 | 说明 |
|------|--------|-----------|------|
| 1 | 前端上传会议音频流 | **@AsrAgent** | 语音转写 → 结构化文本输出 |
| 2a | Asr输出 + 开启翻译 | **@TranslateAgent** | 实时双语字幕翻译 |
| 2b | Asr输出（始终调用） | **@MoodAgent** | 发言情绪语速分析 |
| 3 | 用户指令【总结近5分钟】/ 会议结束 | **@SummaryAgent** | 生成分层会议摘要 |
| 4 | SummaryAgent 完成输出 | **@TaskAgent** → @BackAgent 入库 | 提取待办任务，写入MySQL |
| 5 | 用户在AI面板提问 | **@QaRagAgent** | 基于RAG知识库问答 |
| 6 | 会议开启议程管控（定时轮询） | **@TopicCheckAgent** | 检测话题偏离并提醒 |

---

## 二、智能体权限矩阵

### NLP文本智能体（仅文本处理，禁止改代码）

| 智能体 | 职责 | 权限 |
|--------|------|------|
| AsrAgent | 语音转写结构化 | ❌ 禁止修改Vue/Java/SQL/配置/Git |
| SummaryAgent | 会议摘要生成 | ❌ 同上 |
| TaskAgent | 行动项抽取 | ❌ 同上 |
| QaRagAgent | RAG知识库问答 | ❌ 同上 |
| TranslateAgent | 实时字幕翻译 | ❌ 同上 |
| MoodAgent | 情绪语速分析 | ❌ 同上 |
| TopicCheckAgent | 议题偏离检测 | ❌ 同上 |

### 工程智能体（放开全部权限）

| 智能体 | 职责 | 权限 |
|--------|------|------|
| FrontAgent | 前端页面开发 | ✅ 全部代码/Git |
| BackAgent | 后端接口/业务 | ✅ 全部代码/SQL/Git |
| DBAgent | 数据库表结构/SQL | ✅ 全部SQL/Git |
| TestAgent | 测试用例/集成测试 | ✅ 全部代码/Git |
| GitAgent | 版本控制/CI | ✅ 全部Git操作 |

---

## 三、数据流转关系

```
音频流
  │
  ▼
@AsrAgent ──► @TranslateAgent（双语字幕 → 前端WebSocket）
  │
  ├─► @MoodAgent（情绪数据 → 前端主持人面板）
  │
  ▼
@SummaryAgent ──► @TaskAgent ──► @BackAgent（MySQL任务表）
  │                                    │
  │                                    ▼
  │                              向量库（供QaRagAgent检索）
  │
  ▼
@QaRagAgent（用户提问 ← 检索向量库 → 带来源的答案）

@TopicCheckAgent（定时轮询 ← 议程+发言 → 偏离提醒 → 前端看板）
```

---

## 四、统一约束

> 以上7个NLP智能体**仅在文本层面处理数据**，禁止触碰：
> - Vue / React 前端代码
> - Java / SpringBoot 后端代码
> - SQL / 数据库脚本
> - 项目配置文件（yml / properties / json / xml）
> - Git 提交、分支、合并等版本控制操作
>
> 所有代码编写、SQL建表、Git提交等工程操作**仅由 FrontAgent / BackAgent / DBAgent / TestAgent / GitAgent 执行**。
