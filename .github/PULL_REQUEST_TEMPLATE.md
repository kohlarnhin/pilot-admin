## 变更与原因 / Change and reason

说明解决的问题、变更后的行为和影响范围；有关联 Issue 时请链接。
Describe the problem, resulting behavior and scope. Link related issues.

## 验证 / Verification

勾选已完成的检查；不适用项请说明原因，不要将未执行项标为通过。
Check only completed items; explain anything not applicable or not run.

- [ ] `pnpm install --frozen-lockfile` 成功，锁文件同步。 / Install passes and dependency changes include the lockfile.
- [ ] `pnpm lint`、`pnpm i18n:check`、`pnpm typecheck`、`pnpm test`、`pnpm build` 通过。 / All checks pass.
- [ ] UI 变更已在真实页面验证，附关键截图。 / UI changes verified in the running app with screenshots.
- [ ] 已检查 1280×720 / 1440×900 的操作列、滚动、面板与长列表。 / Checked action columns, document scroll isolation, panels and long lists at both sizes.
- [ ] 已检查键盘、焦点、错误恢复、三种角色及双语。 / Checked keyboard, focus, recovery, admin/operator/viewer and zh-CN/en-US.
- [ ] 生产预览不发送外部或后端请求。 / Production preview sends no external or backend requests.
- [ ] 文档已更新，保留视觉系统、service 接缝与共享助手运行时。 / Docs updated; existing design, service seams and shared assistant runtime preserved.

## 限制与后续 / Limits and follow-up

填写未覆盖的验证、兼容性限制或需要维护者关注的事项。
List unverified behavior, compatibility limits and anything requiring maintainer attention.
