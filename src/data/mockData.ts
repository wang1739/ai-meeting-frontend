export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'member' | 'admin';
  color: string;
}

export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'ongoing' | 'scheduled' | 'completed' | 'cancelled';
  attendees: string[];
  summary?: string;
  transcript?: TranscriptEntry[];
  actionItems?: ActionItem[];
  tags?: string[];
  mood?: number;
  recording?: string;
}

export interface TranscriptEntry {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
  translatedText?: string;
  bookmarked?: boolean;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  content: string;
  assignee: string;
  status: 'todo' | 'in_progress' | 'done';
  evidenceId?: string;
  dueDate?: string;
}

export interface Tag {
  id: string;
  word: string;
  frequency: number;
}

export const mockUsers: User[] = [
  { id: 'u1', name: '张明', email: 'zhangming@example.com', role: 'admin', color: '#4F46E5' },
  { id: 'u2', name: '李华', email: 'lihua@example.com', role: 'member', color: '#10B981' },
  { id: 'u3', name: '王芳', email: 'wangfang@example.com', role: 'member', color: '#F59E0B' },
  { id: 'u4', name: '赵磊', email: 'zhaolei@example.com', role: 'member', color: '#EF4444' },
  { id: 'u5', name: '陈静', email: 'chenjing@example.com', role: 'member', color: '#8B5CF6' },
  { id: 'u6', name: '刘洋', email: 'liuyang@example.com', role: 'member', color: '#EC4899' },
  { id: 'u7', name: '周婷', email: 'zhouting@example.com', role: 'member', color: '#06B6D4' },
  { id: 'u8', name: '吴强', email: 'wuqiang@example.com', role: 'member', color: '#F97316' },
];

const transcriptForMeeting1: TranscriptEntry[] = [
  { id: 't101', userId: 'u1', text: '大家下午好，今天的技术周会我们主要讨论三个议题：性能优化、代码审查规范和下周的发布计划。', timestamp: 0 },
  { id: 't102', userId: 'u2', text: '我先汇报一下性能优化的进展。上周我们对首页做了LCP优化，加载时间从3.2秒降到了1.8秒。', timestamp: 12 },
  { id: 't103', userId: 'u3', text: '这个提升很明显！具体做了哪些优化措施？', timestamp: 28 },
  { id: 't104', userId: 'u2', text: '主要是三方面：图片懒加载、代码分割和服务端渲染优化。另外我们使用了新的缓存策略。', timestamp: 35 },
  { id: 't105', userId: 'u1', text: '很好。那移动端的性能数据怎么样？', timestamp: 52 },
  { id: 't106', userId: 'u4', text: '移动端我们做了专项优化，首屏渲染时间从4.5秒降到了2.2秒。主要是优化了JavaScript执行时间和减少了网络请求。', timestamp: 58 },
  { id: 't107', userId: 'u5', text: '我补充一下，我们还对图片资源做了WebP格式的适配，节省了约40%的带宽。', timestamp: 78 },
  { id: 't108', userId: 'u1', text: '好的，性能优化这部分大家辛苦了。接下来讨论代码审查规范的问题。', timestamp: 95 },
  { id: 't109', userId: 'u6', text: '我觉得目前的PR审查流程有些繁琐，有时候一个小改动要等很久才能合并。', timestamp: 105 },
  { id: 't110', userId: 'u7', text: '同意。我建议对于紧急修复和小的样式调整，可以简化审查流程，只需要一个人批准就行。', timestamp: 118 },
  { id: 't111', userId: 'u1', text: '这个建议不错。但核心逻辑变更还是需要至少两人审查通过。我们可以制定一个分级审查制度。', timestamp: 132 },
  { id: 't112', userId: 'u8', text: '我整理了一份审查规范草案，可以发给大家参考。主要包括代码风格、测试覆盖率和文档要求。', timestamp: 148 },
  { id: 't113', userId: 'u1', text: '好，会后把草案发到群里，大家周二前反馈意见。最后一个议题，下周的发布计划。', timestamp: 165 },
  { id: 't114', userId: 'u2', text: '下周计划发布v2.8版本，包含12个新功能和24个bug修复。预计周四进行灰度发布。', timestamp: 178 },
  { id: 't115', userId: 'u3', text: '灰度比例怎么安排？先内部测试还是直接给部分用户？', timestamp: 195 },
  { id: 't116', userId: 'u2', text: '计划先5%内测用户，观察两天如果没有问题再扩大到30%，周末前全量发布。', timestamp: 202 },
  { id: 't117', userId: 'u1', text: '注意要做好回滚预案，如果有严重bug要能快速回退。大家还有问题吗？', timestamp: 218 },
  { id: 't118', userId: 'u5', text: '关于新功能的文档，我们前端组已经准备好了，会随版本一起更新。', timestamp: 232 },
  { id: 't119', userId: 'u1', text: '好的，今天会议就到这里。感谢大家的参与！', timestamp: 245 },
  { id: 't120', userId: 'u4', text: '我来整理会议记录和待办事项，稍后发到群里。', timestamp: 252 },
];

const transcriptForMeeting4: TranscriptEntry[] = [
  { id: 't401', userId: 'u1', text: '大家好，今天我们做项目复盘会议。回顾一下Q2的项目交付情况和遇到的问题。', timestamp: 0 },
  { id: 't402', userId: 'u3', text: '我先来。Q2我们一共完成了8个项目，其中6个按时交付，2个延期。延期原因主要是需求变更频繁。', timestamp: 15 },
  { id: 't403', userId: 'u4', text: '确实，B端那个项目中途改了三次需求，导致开发周期延长了将近两周。', timestamp: 32 },
  { id: 't404', userId: 'u1', text: '需求变更是难免的，关键是我们怎么做好变更管理。下次遇到大变更，要先评估影响再决定是否纳入当前迭代。', timestamp: 45 },
  { id: 't405', userId: 'u2', text: '我建议在项目启动阶段设置需求冻结时间点，之后的需求变更统一放到下一期。', timestamp: 62 },
  { id: 't406', userId: 'u5', text: '这个方案好。另外测试资源也是一个瓶颈，高峰期经常要排队等测试。', timestamp: 76 },
  { id: 't407', userId: 'u6', text: '测试这块我们已经在推进自动化测试了。目前核心业务线覆盖率达到了65%，目标是Q3达到85%。', timestamp: 88 },
  { id: 't408', userId: 'u1', text: '很好，自动化测试是长期投入，要坚持做。还有什么其他问题？', timestamp: 105 },
  { id: 't409', userId: 'u7', text: '跨部门协作方面，信息同步不够及时。有时候后端接口改了，前端到联调才发现。', timestamp: 115 },
  { id: 't410', userId: 'u8', text: '这个需要改进。我们每周一和周四加两次接口对齐会，每次15分钟，确保前后端信息同步。', timestamp: 130 },
  { id: 't411', userId: 'u1', text: '可以。还有就是文档沉淀，很多项目做完后文档没有及时更新，后续维护成本很高。', timestamp: 145 },
  { id: 't412', userId: 'u3', text: '我建议把文档更新作为项目验收的必要条件，不完不准结项。', timestamp: 162 },
  { id: 't413', userId: 'u4', text: '这个强制执行可能效果不一定好。我建议可以设置一个文档质量的评分机制，纳入绩效考核。', timestamp: 175 },
  { id: 't414', userId: 'u1', text: '两个都可以考虑，会后我们细化一下方案。技术债务方面呢？', timestamp: 192 },
  { id: 't415', userId: 'u2', text: '目前积累了大概40人天的技术债务，主要是老旧模块的重构和一些测试补全。计划在Q3消化掉。', timestamp: 202 },
  { id: 't416', userId: 'u1', text: '技术债务要控制好，每个迭代至少留20%的时间处理。不然会越滚越大。', timestamp: 220 },
  { id: 't417', userId: 'u5', text: '同意。另外我觉得我们的Code Review制度需要加强，有时候CR流于形式。', timestamp: 232 },
  { id: 't418', userId: 'u1', text: '好，今天的讨论很有价值。总结一下接下来要做的几件事。', timestamp: 248 },
];

const transcriptForMeeting6: TranscriptEntry[] = [
  { id: 't601', userId: 'u2', text: '今天我们做新一期需求评审。先看搜索模块的优化需求。', timestamp: 0 },
  { id: 't602', userId: 'u3', text: '搜索模块的问题主要是准确率不够高，用户经常搜不到想要的内容。我们计划引入语义搜索。', timestamp: 10 },
  { id: 't603', userId: 'u1', text: '语义搜索的方案有评估过吗？大概的改造成本和时间？', timestamp: 28 },
  { id: 't604', userId: 'u3', text: '评估过了。基于现有的Elasticsearch升级到8.x版本，配合embedding模型。预估需要3周左右。', timestamp: 38 },
  { id: 't605', userId: 'u5', text: 'embedding模型我们选哪个？开源的还是调用商业API？', timestamp: 55 },
  { id: 't606', userId: 'u3', text: '建议先用开源的BGE模型，部署成本低，效果也够用。如果后续需要再升级到商业方案。', timestamp: 65 },
  { id: 't607', userId: 'u1', text: '可以。再看看第二个需求，数据看板的自定义功能。', timestamp: 82 },
  { id: 't608', userId: 'u4', text: '这个需求来自运营团队，他们希望可以自由拖拽组件来搭建自己的数据看板。', timestamp: 92 },
  { id: 't609', userId: 'u6', text: '类似Grafana的那种方案？这个前端工作量不小。', timestamp: 108 },
  { id: 't610', userId: 'u4', text: '对，但我们可以简化一些。不需要完全的flexible，提供10个预设模板和拖拽能力就够了。', timestamp: 116 },
  { id: 't611', userId: 'u2', text: '后端接口需要支持按维度聚合查询，这块改造量也不小。', timestamp: 132 },
  { id: 't612', userId: 'u1', text: '这个需求可以分两期做。第一期出基础的自定义看板，第二期再丰富组件库。', timestamp: 145 },
  { id: 't613', userId: 'u7', text: '第三个需求是通知中心的优化。用户现在反馈通知太多太杂，需要更精细的推送控制。', timestamp: 158 },
  { id: 't614', userId: 'u8', text: '我们设计了一个通知偏好设置页面，用户可以对每种通知类型单独开关，还可以设置免打扰时段。', timestamp: 172 },
  { id: 't615', userId: 'u1', text: '这个设计很好。不过要注意默认设置要合理，不要一上线用户就收不到重要通知了。', timestamp: 190 },
  { id: 't616', userId: 'u7', text: '放心，默认会保留重要通知的推送。后续还可以根据用户行为做智能推荐。', timestamp: 202 },
  { id: 't617', userId: 'u2', text: '还有一个用户体验提升的需求，移动端适配优化。', timestamp: 215 },
  { id: 't618', userId: 'u5', text: '我们做了用户调研，移动端的主要痛点是页面布局错乱和操作不便。计划用响应式方案重构主要页面。', timestamp: 225 },
];

export const mockMeetings: Meeting[] = [
  {
    id: 'm1',
    title: '产品评审会',
    startTime: '2026-06-03T10:00:00+08:00',
    endTime: '2026-06-03T11:30:00+08:00',
    duration: 90,
    status: 'ongoing',
    attendees: ['u1', 'u2', 'u3', 'u4', 'u5'],
    mood: 82,
    recording: 'https://example.com/recordings/m1',
    tags: ['产品', '评审', 'Q3计划'],
  },
  {
    id: 'm2',
    title: '技术周会',
    startTime: '2026-06-01T14:00:00+08:00',
    endTime: '2026-06-01T15:30:00+08:00',
    duration: 90,
    status: 'completed',
    attendees: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'],
    summary: '讨论了性能优化进展、代码审查规范修订以及下周v2.8版本发布计划。核心结论：首页LCP从3.2s降至1.8s，将实施分级审查制度，v2.8版本周四灰度发布。',
    transcript: transcriptForMeeting1,
    mood: 88,
    recording: 'https://example.com/recordings/m2',
    tags: ['技术', '周会', '性能优化', '发布计划'],
  },
  {
    id: 'm3',
    title: '每日站会',
    startTime: '2026-06-04T09:00:00+08:00',
    endTime: '2026-06-04T09:30:00+08:00',
    duration: 30,
    status: 'scheduled',
    attendees: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'],
    tags: ['站会', '日常'],
  },
  {
    id: 'm4',
    title: 'Q2项目复盘',
    startTime: '2026-05-28T15:00:00+08:00',
    endTime: '2026-05-28T16:30:00+08:00',
    duration: 90,
    status: 'completed',
    attendees: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'],
    summary: 'Q2完成8个项目，6个按时交付。主要问题：需求变更频繁、测试资源瓶颈、跨部门信息同步不及时、文档沉淀不足。制定了需求冻结、自动化测试推进、接口对齐会等改进措施。',
    transcript: transcriptForMeeting4,
    mood: 75,
    recording: 'https://example.com/recordings/m4',
    tags: ['复盘', 'Q2', '项目管理'],
  },
  {
    id: 'm5',
    title: '客户沟通会',
    startTime: '2026-05-29T11:00:00+08:00',
    endTime: '2026-05-29T12:00:00+08:00',
    duration: 60,
    status: 'cancelled',
    attendees: ['u1', 'u3', 'u7'],
    tags: ['客户', '沟通'],
  },
  {
    id: 'm6',
    title: '需求评审',
    startTime: '2026-05-26T13:00:00+08:00',
    endTime: '2026-05-26T14:30:00+08:00',
    duration: 90,
    status: 'completed',
    attendees: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8'],
    summary: '评审了四个需求：搜索模块语义搜索升级（3周改造）、自定义数据看板（分两期实现）、通知中心精细化推送控制、移动端响应式重构。所有需求通过评审，进入排期。',
    transcript: transcriptForMeeting6,
    mood: 80,
    recording: 'https://example.com/recordings/m6',
    tags: ['需求', '评审', '搜索', '数据看板'],
  },
];

export const mockActionItems: ActionItem[] = [
  { id: 'a1', meetingId: 'm2', content: '整理代码审查规范草案并发送给团队', assignee: 'u8', status: 'done', evidenceId: 't112' },
  { id: 'a2', meetingId: 'm2', content: 'v2.8版本灰度发布方案准备', assignee: 'u2', status: 'in_progress' },
  { id: 'a3', meetingId: 'm2', content: '整理会议记录和待办事项', assignee: 'u4', status: 'done', evidenceId: 't120' },
  { id: 'a4', meetingId: 'm4', content: '制定需求变更管理流程', assignee: 'u1', status: 'in_progress' },
  { id: 'a5', meetingId: 'm4', content: '推进核心业务线自动化测试覆盖率到85%', assignee: 'u6', status: 'todo', dueDate: '2026-09-30' },
  { id: 'a6', meetingId: 'm4', content: '定期召开接口对齐会（每周一、四）', assignee: 'u8', status: 'todo' },
  { id: 'a7', meetingId: 'm4', content: '细化文档质量评分机制方案', assignee: 'u3', status: 'in_progress' },
  { id: 'a8', meetingId: 'm6', content: '搜索模块语义搜索方案详细设计', assignee: 'u3', status: 'todo', dueDate: '2026-06-10' },
  { id: 'a9', meetingId: 'm6', content: '自定义数据看板第一期开发排期', assignee: 'u4', status: 'in_progress', dueDate: '2026-06-07' },
  { id: 'a10', meetingId: 'm6', content: '通知偏好设置页面UI设计', assignee: 'u7', status: 'todo', dueDate: '2026-06-14' },
];

export const mockTags: Tag[] = [
  { id: 'tag1', word: '性能优化', frequency: 15 },
  { id: 'tag2', word: '产品评审', frequency: 12 },
  { id: 'tag3', word: '需求分析', frequency: 11 },
  { id: 'tag4', word: '技术架构', frequency: 10 },
  { id: 'tag5', word: '项目管理', frequency: 9 },
  { id: 'tag6', word: '代码审查', frequency: 8 },
  { id: 'tag7', word: '自动化测试', frequency: 7 },
  { id: 'tag8', word: '用户体验', frequency: 7 },
  { id: 'tag9', word: '发布计划', frequency: 6 },
  { id: 'tag10', word: '数据看板', frequency: 5 },
  { id: 'tag11', word: '跨部门协作', frequency: 4 },
  { id: 'tag12', word: '技术债务', frequency: 4 },
  { id: 'tag13', word: '语义搜索', frequency: 3 },
  { id: 'tag14', word: '移动端适配', frequency: 3 },
  { id: 'tag15', word: '通知优化', frequency: 2 },
];

/**
 * 根据当前时间返回时段问候语
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return '早上好';
  if (hour >= 12 && hour < 18) return '下午好';
  return '晚上好';
}