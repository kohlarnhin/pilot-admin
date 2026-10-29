import { useState } from 'react';
import { Modal } from '@/ui/modal';
import { Button } from '@/ui/button';
import { Checkbox } from '@/ui/controls';
import { message } from '@/ui/message';
import { useAuthStore } from '@/store/authStore';

export function AgentEntryDialog({ onChoose }: {
  source?: 'login';
  onChoose: (agent: boolean) => void;
}) {
  const [remember, setRemember] = useState(false);
  const [saving, setSaving] = useState(false);
  const patchPreferences = useAuthStore(state => state.patchPreferences);
  const choose = async (agent: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      if (remember) await patchPreferences({ agent_mode_entry: agent ? 'agent' : 'console' });
      onChoose(agent);
    } catch (error) {
      message.error((error as Error).message || '保存偏好失败，请重试');
      setSaving(false);
    }
  };
  return <Modal open title={'选择你的工作方式'} icon="square-terminal"
    width={480} closable={false} maskClosable={false} keyboard={false}
    footer={<>
      <Button disabled={saving} onClick={() => { void choose(false); }}>留在管理后台</Button>
      <Button loading={saving} onClick={() => { void choose(true); }}>进入 Agent 模式</Button>
    </>}>
    <p className="text-13 leading-7 text-slate-600">在全屏对话中查看概况、维护账号或执行巡检，也可以继续使用管理后台。</p>
    <div className="mt-5"><Checkbox checked={remember} disabled={saving} onChange={event => setRemember(event.target.checked)}>
      记住我的选择
    </Checkbox></div>
  </Modal>;
}
