import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Modal } from '@/ui/modal';
import { Select } from '@/ui/select';
import { message } from '@/ui/message';
import type { UserPreferences } from '@/types';

export function AgentPreferencesDialog({ onClose }: { onClose: () => void }) {
  const preferences = useAuthStore(state => state.preferences);
  const patchPreferences = useAuthStore(state => state.patchPreferences);
  const [entry, setEntry] = useState(preferences.agent_mode_entry);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await patchPreferences({ agent_mode_entry: entry });
      message.success('Agent 模式偏好已保存');
      onClose();
    } catch (error) {
      message.error((error as Error).message || '保存偏好失败');
    } finally { setSaving(false); }
  };
  return <Modal open title="Agent 模式偏好" icon="square-terminal" description="偏好随当前浏览器中的账号保存。"
    confirmLoading={saving} onCancel={saving ? undefined : onClose} onOk={save} okText="保存" width={460}>
    <div className="space-y-5">
      <div><label htmlFor="agent-entry-preference" className="mb-2 block text-13 font-medium text-slate-700">登录后</label>
        <Select id="agent-entry-preference" value={entry} disabled={saving} className="w-full" onChange={value => setEntry(value as UserPreferences['agent_mode_entry'])}
          options={[{ value: 'ask', label: '每次登录时询问' }, { value: 'agent', label: '进入 Agent 模式' }, { value: 'console', label: '留在管理后台' }]} /></div>
    </div>
  </Modal>;
}
