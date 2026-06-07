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
exports.MeetingReviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MeetingReviewService = class MeetingReviewService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary(meetingId, userId) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id: meetingId },
        });
        if (!meeting)
            throw new common_1.NotFoundException('会议不存在');
        const summary = await this.prisma.summary.findUnique({
            where: { meetingId },
        });
        if (!summary) {
            return null;
        }
        return {
            oneLineSummary: summary.oneLineSummary || '',
            detailedSummary: summary.detailedSummary || '',
            keyDecisions: Array.isArray(summary.keyDecisions) ? summary.keyDecisions : [],
            keywords: Array.isArray(summary.keywords) ? summary.keywords : [],
        };
    }
    async getActionItems(meetingId, userId) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id: meetingId },
        });
        if (!meeting)
            throw new common_1.NotFoundException('会议不存在');
        const items = await this.prisma.actionItem.findMany({
            where: { meetingId },
        });
        return items.map((item) => ({
            id: item.id,
            description: item.description,
            assignee: item.assigneeUserId || '',
            dueDate: item.dueDate ? (item.dueDate instanceof Date ? item.dueDate.toISOString() : item.dueDate) : null,
            status: item.status,
        }));
    }
};
exports.MeetingReviewService = MeetingReviewService;
exports.MeetingReviewService = MeetingReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MeetingReviewService);
//# sourceMappingURL=meeting-review.service.js.map