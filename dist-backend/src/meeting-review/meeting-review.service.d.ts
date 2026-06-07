import { PrismaService } from '../prisma/prisma.service';
export declare class MeetingReviewService {
    private prisma;
    constructor(prisma: PrismaService);
    getSummary(meetingId: string, userId: string): Promise<{
        oneLineSummary: string;
        detailedSummary: string;
        keyDecisions: string[];
        keywords: string[];
    } | null>;
    getActionItems(meetingId: string, userId: string): Promise<{
        id: string;
        description: string;
        assignee: string;
        dueDate: string | null;
        status: string;
    }[]>;
}
