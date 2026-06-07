import { MeetingService } from './meeting.service';
import type { CreateMeetingDto } from './dto';
export declare class MeetingController {
    private meetingService;
    constructor(meetingService: MeetingService);
    create(dto: CreateMeetingDto, req: any): Promise<{
        creator: {
            id: string;
            name: string;
            email: string;
        };
        participants: ({
            user: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            role: string;
            isSpeaker: boolean;
            userId: string;
            meetingId: string;
        })[];
    } & {
        id: string;
        title: string;
        date: string | null;
        startTime: Date | null;
        endTime: Date | null;
        status: string;
        backgroundInfo: string | null;
        agenda: string | null;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
    }>;
    findAll(req: any): Promise<({
        creator: {
            id: string;
            name: string;
            email: string;
        };
        participants: ({
            user: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            role: string;
            isSpeaker: boolean;
            userId: string;
            meetingId: string;
        })[];
    } & {
        id: string;
        title: string;
        date: string | null;
        startTime: Date | null;
        endTime: Date | null;
        status: string;
        backgroundInfo: string | null;
        agenda: string | null;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
    })[]>;
    getActionItemsStats(req: any): Promise<{
        totalCount: number;
    }>;
    getStats(req: any): Promise<{
        todayCount: number;
        weekTotalHours: string;
    }>;
    findOne(id: string, req: any): Promise<{
        creator: {
            id: string;
            name: string;
            email: string;
        };
        participants: ({
            user: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            role: string;
            isSpeaker: boolean;
            userId: string;
            meetingId: string;
        })[];
    } & {
        id: string;
        title: string;
        date: string | null;
        startTime: Date | null;
        endTime: Date | null;
        status: string;
        backgroundInfo: string | null;
        agenda: string | null;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
    }>;
    endMeeting(id: string, req: any): Promise<{
        id: string;
        title: string;
        date: string | null;
        startTime: Date | null;
        endTime: Date | null;
        status: string;
        backgroundInfo: string | null;
        agenda: string | null;
        createdAt: Date;
        updatedAt: Date;
        creatorId: string;
    }>;
    delete(id: string, req: any): Promise<{
        message: string;
    }>;
}
