/** 消息通知记录 — Mock 数据 */

export type PushStatus = 'pending' | 'pushed' | 'failed';

export type AuditTypeFilter = 'all' | 'group' | 'entry';

export type NotificationScenario =
  | 'reject'
  | 'sla_first'
  | 'sla_second'
  | 'pass'
  | 'other';

export type NotifyChannel = 'feishu' | 'wechat_mp';

export type RecipientKind = 'user' | 'agent';

export interface MessageNotificationRow {
  id: string;
  notifyAt: string;
  youbaoCode: string;
  recipientKind: RecipientKind;
  recipientName: string;
  auditType: 'group' | 'entry';
  scenario: NotificationScenario;
  channel: NotifyChannel;
  status: PushStatus;
  failReason: string;
}

export const AUDIT_TYPE_LABEL: Record<MessageNotificationRow['auditType'], string> = {
  group: '入群审核',
  entry: '录入审核',
};

export const SCENARIO_LABEL: Record<NotificationScenario, string> = {
  reject: '审核拒绝',
  sla_first: 'SLA首次预警',
  sla_second: 'SLA二次催促',
  pass: '审核通过',
  other: '其他',
};

export const CHANNEL_LABEL: Record<NotifyChannel, string> = {
  feishu: '飞书',
  wechat_mp: '微信服务号',
};

export const PUSH_STATUS_LABEL: Record<PushStatus, string> = {
  pending: '待发送',
  pushed: '已推送',
  failed: '推送失败',
};

const recipients: { k: RecipientKind; n: string }[] = [
  { k: 'user', n: '张三' },
  { k: 'agent', n: '王小明' },
  { k: 'user', n: '李四' },
  { k: 'agent', n: '李晓红' },
];

export function messageNotificationSeedData(): MessageNotificationRow[] {
  const rows: MessageNotificationRow[] = [];
  const scenarios: NotificationScenario[] = ['reject', 'sla_first', 'sla_second', 'pass', 'other'];
  const channels: NotifyChannel[] = ['feishu', 'wechat_mp'];
  const audit: MessageNotificationRow['auditType'][] = ['entry', 'group'];
  const statuses: PushStatus[] = ['pending', 'pushed', 'failed'];
  const failMsgs = ['未绑定 OpenID', '推送超时', '', '', ''];

  for (let i = 0; i < 42; i++) {
    const st = statuses[i % statuses.length];
    const { k, n } = recipients[i % recipients.length];
    rows.push({
      id: `mn-${i + 1}`,
      notifyAt: new Date(2026, 2, 1 + (i % 25), 8 + (i % 10), (i * 11) % 60).toISOString(),
      youbaoCode: `RB${String(200600 + i).slice(-6)}`,
      recipientKind: k,
      recipientName: n,
      auditType: audit[i % 2],
      scenario: scenarios[i % scenarios.length],
      channel: channels[i % 2],
      status: st,
      failReason: st === 'failed' ? failMsgs[i % failMsgs.length] || '未知错误' : '',
    });
  }
  return rows;
}
