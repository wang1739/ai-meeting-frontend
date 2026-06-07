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
exports.TranscriptService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TranscriptService = class TranscriptService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(meetingId, userId, dto) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id: meetingId },
            select: { id: true, creatorId: true },
        });
        if (!meeting)
            throw new common_1.NotFoundException('会议不存在');
        const segment = await this.prisma.transcriptionSegment.create({
            data: {
                meetingId: meetingId,
                speakerLabel: dto.speakerLabel || 'Speaker',
                text: dto.text,
                startTimeMs: dto.startTimeMs || Math.floor(Date.now() - 3000),
                endTimeMs: dto.endTimeMs || Math.floor(Date.now()),
                isFinal: dto.isFinal !== undefined ? dto.isFinal : true,
            },
        });
        return segment;
    }
    async findAll(meetingId, userId) {
        const meeting = await this.prisma.meeting.findUnique({
            where: { id: meetingId },
            select: { id: true, creatorId: true },
        });
        if (!meeting)
            throw new common_1.NotFoundException('会议不存在');
        const segments = await this.prisma.transcriptionSegment.findMany({
            where: { meetingId: meetingId },
            orderBy: { startTimeMs: 'asc' },
        });
        return segments.map((s) => ({
            id: s.id,
            speakerLabel: s.speakerLabel,
            text: s.text,
            startTimeMs: s.startTimeMs,
            endTimeMs: s.endTimeMs,
            isFinal: s.isFinal,
            createdAt: s.createdAt,
        }));
    }
};
exports.TranscriptService = TranscriptService;
exports.TranscriptService = TranscriptService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TranscriptService);
