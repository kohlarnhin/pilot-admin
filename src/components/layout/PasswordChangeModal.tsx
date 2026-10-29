import { useState } from 'react';
import { authService } from '@/api/services/authService';
import { message } from '@/ui/message';
import { Modal } from '@/ui/modal';
import { Form } from '@/ui/form';
import { Input } from '@/ui/input';

/** The sidebar and workspace use the same password form and logout behavior. */
export function PasswordChangeModal({ open, onClose, onPasswordChanged }: {
  open: boolean;
  onClose: () => void;
  onPasswordChanged: () => void;
}) {
  const [changingPassword, setChangingPassword] = useState(false);
  const [form] = Form.useForm();
  const handleChangePassword = async (values: any) => {
    try {
      setChangingPassword(true);
      await authService.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      message.success('密码修改成功，请重新登录');
      onClose();
      form.resetFields();
      onPasswordChanged();
    } catch (error: any) {
      message.error(error.message || '密码修改失败');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Modal
      title="修改密码"
      icon="key-round"
      description="修改成功后需要使用新密码重新登录"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="确认修改"
      confirmLoading={changingPassword}
      width={420}
    >
      <Form form={form} onFinish={handleChangePassword}>
        <Form.Item name="oldPassword" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
          <Input.Password placeholder="请输入原密码" autoComplete="current-password" />
        </Form.Item>
        <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
          <Input.Password placeholder="请输入新密码" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          className="mb-0"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error('两次输入的新密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="请再次输入新密码" autoComplete="new-password" />
        </Form.Item>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </Form>
    </Modal>
  );
}
