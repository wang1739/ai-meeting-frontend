"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let AiService = class AiService {
    prisma;
    config;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async generateSummary(meetingId, userId) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id: meetingId },
            include: {
                creator: { select: { id: true, name: true } },
            },
        });
        if (!meeting)
            throw new common_1.NotFoundException('会议不存在');
        const isCreator = meeting.creatorId === userId;
        const participant = await this.prisma.meetingParticipant.findUnique({
            where: { meetingId_userId: { meetingId, userId } },
        });
        if (!isCreator && !participant) {
            throw new common_1.ForbiddenException('无权访问此会议');
        }
        const existingSummaries = await this.prisma.meetingSummary.findMany({
            where: { meetingId },
        });
        const existingActionItems = await this.prisma.actionItem.findMany({
            where: { meetingId },
        });
        if (existingSummaries.length > 0) {
            return this.buildResponse(existingSummaries, existingActionItems);
        }
        // 获取转写数据
        const transcriptSegments = await this.prisma.transcriptionSegment.findMany({
            where: { meetingId },
            orderBy: { startTimeMs: 'asc' },
        });
        const transcriptText = transcriptSegments.length > 0
            ? transcriptSegments.map((s) => `[${s.speakerLabel}] ${s.text}`).join('\n')
            : '';
        const agendaList = meeting.agenda || '无预设议程';
        const prompt = this.buildPrompt(meeting.title, agendaList, transcriptText);
        let summaryData;
        const apiKey = this.config.get('OPENAI_API_KEY');
        if (apiKey) {
            try {
                summaryData = await this.callOpenAI(prompt, apiKey);
            }
            catch {
                summaryData = this.getMockSummary(meeting.title, agendaList, transcriptText);
            }
        }
        else {
            summaryData = this.getMockSummary(meeting.title, agendaList, transcriptText);
        }
        await this.prisma.meetingSummary.createMany({
            data: [
                { meetingId, summaryType: 'one_line', content: summaryData.oneLineSummary },
                { meetingId, summaryType: 'detailed', content: summaryData.detailedSummary },
                { meetingId, summaryType: 'key_decisions', content: JSON.stringify(summaryData.keyDecisions) },
                { meetingId, summaryType: 'keywords', content: JSON.stringify(summaryData.keywords) },
            ],
        });
        if (summaryData.actionItems.length > 0) {
            await this.prisma.actionItem.createMany({
                data: summaryData.actionItems.map((item) => ({
                    meetingId,
                    description: item.description,
                    assigneeName: item.assignee,
                    assigneeUserId: userId,
                    dueDate: item.dueDate ? new Date(item.dueDate) : null,
                    status: 'open',
                })),
            });
        }
        const savedSummaries = await this.prisma.meetingSummary.findMany({
            where: { meetingId },
        });
        const savedActionItems = await this.prisma.actionItem.findMany({
            where: { meetingId },
        });
        return this.buildResponse(savedSummaries, savedActionItems);
    }
    buildPrompt(title, agenda, transcriptText) {
        let transcriptSection = '';
        if (transcriptText) {
            transcriptSection = `\n\n## 会议转写记录\n以下是本次会议的完整转写内容，请基于此进行分析和总结：\n\n${transcriptText}`;
        }
        return `你是一个专业的会议纪要助手。请根据以下会议信息生成结构化的会议摘要和行动项。

会议标题：${title}
会议议程：${agenda}${transcriptSection}

请严格按照以下 JSON 格式返回，不要包含其他内容：
{
  "oneLineSummary": "一句话总结会议内容（不超过50字）",
  "detailedSummary": "分段详细摘要（使用Markdown格式，包含## 会议背景、## 讨论要点、## 会议结论等章节）",
  "keyDecisions": ["决策1", "决策2", "决策3"],
  "actionItems": [
    {"description": "任务描述", "assignee": "负责人", "dueDate": "2026-06-10T18:00:00Z"}
  ],
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4"]
}`;
    }
    async callOpenAI(prompt, apiKey) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: '你是一个专业的会议纪要助手，总是返回有效的JSON。' },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' },
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    }
    getMockSummary(title, agenda, transcriptText) {
        const keywords = agenda.split(/[,，、\s]+/).filter(Boolean).slice(0, 4);
        let discussionPoints = '1. 与会人员就会议议题进行了充分讨论\n2. 确认了各项工作的优先级和时间节点\n3. 识别了潜在风险并制定了应对方案';
        if (transcriptText) {
            const lines = transcriptText.split('\n').filter(Boolean);
            const speakerSet = new Set(lines.map((l) => l.match(/^\[(.+?)\]/)?.[1]).filter(Boolean));
            const speakers = Array.from(speakerSet).join('、');
            discussionPoints = `与会人员（${speakers || '参会者'}）就会议议题进行了充分讨论\n2. 基于转写内容分析了各项议题的讨论要点\n3. 识别了关键决策和行动项`;
        }
        return {
            oneLineSummary: `本次会议围绕「${title}」展开讨论，明确了后续工作计划和分工安排。`,
            detailedSummary: `## 会议背景
本次会议议题为「${title}」，议程包括：${agenda}。

## 讨论要点
${discussionPoints}

## 会议结论
- 各项工作按计划推进
- 明确了各责任人的交付时间`,
            keyDecisions: [
                '确认了项目优先级和时间节点',
                '明确了各团队的分工职责',
                '制定了风险应对方案',
            ],
            actionItems: [
                { description: '整理会议纪要并发送给与会人员', assignee: '会议记录人', dueDate: new Date(Date.now() + 86400000).toISOString() },
                { description: '跟进各项任务的执行情况', assignee: '项目经理', dueDate: new Date(Date.now() + 3 * 86400000).toISOString() },
            ],
            keywords: keywords.length > 0 ? keywords : [title, '会议纪要', '行动计划', '任务分配'],
        };
    }
    buildResponse(summaries, actionItems) {
        const findSummary = (type) => summaries.find((s) => s.summaryType === type)?.content || '';
        let keyDecisions = [];
        try {
            keyDecisions = JSON.parse(findSummary('key_decisions'));
        }
        catch {
            keyDecisions = [];
        }
        let keywords = [];
        try {
            keywords = JSON.parse(findSummary('keywords'));
        }
        catch {
            keywords = [];
        }
        return {
            oneLineSummary: findSummary('one_line'),
            detailedSummary: findSummary('detailed'),
            keyDecisions,
            keywords,
            actionItems: actionItems.map((item) => ({
                id: item.id,
                description: item.description,
                assignee: item.assigneeName,
                dueDate: item.dueDate,
                status: item.status,
            })),
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], AiService);
//# sourceMappingURL=ai.service.js.map