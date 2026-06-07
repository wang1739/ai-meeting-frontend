import { MeetingReviewService } from './meeting-review.service';
export declare class MeetingReviewController {
    private readonly reviewService;
    constructor(reviewService: MeetingReviewService);
    getSummary(id: string, req: any): Promise<{
        oneLineSummary: string;
        detailedSummary: string;
        keyDecisions: string[];
        keywords: string[];
    } | null>;
    getActionItems(id: string, req: any): Promise<{
        id: string;
        description: string;
        assignee: string;
        dueDate: string | null;
        status: string;
    }[]>;
}
