import type { ButtonHTMLAttributes } from 'react';

/** 同一 tablist 只保留选中项的 Tab 入口，方向键聚焦时自动切换。 */
export function getRovingTabProps(
  selected: boolean,
  onSelect: () => void,
  orientation: 'horizontal' | 'vertical' = 'horizontal',
): Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'tabIndex' | 'onFocus' | 'onKeyDown'> {
  return {
    tabIndex: selected ? 0 : -1,
    onFocus: () => { if (!selected) onSelect(); },
    onKeyDown: (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
      const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
      const previousKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
      if (![nextKey, previousKey, 'Home', 'End'].includes(event.key)) return;
      const list = event.currentTarget.closest('[role="tablist"]');
      if (!list) return;
      const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled):not([aria-disabled="true"])'))
        .filter((tab) => tab.closest('[role="tablist"]') === list);
      const current = tabs.indexOf(event.currentTarget);
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : (current + (event.key === nextKey ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault();
      tabs[index]?.focus();
    },
  };
}
