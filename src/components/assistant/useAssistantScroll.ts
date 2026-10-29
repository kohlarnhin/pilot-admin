import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { AssistantMessage } from './conversationStorage';

const SCROLL_FOLLOW_THRESHOLD = 72;

interface AssistantScrollOptions {
  isOpen: boolean;
  showHistory: boolean;
  messages: AssistantMessage[];
  isSending: boolean;
  hasMoreBefore: boolean;
  onLoadOlder: () => Promise<boolean>;
}

export function useAssistantScroll({ isOpen, showHistory, messages, isSending, hasMoreBefore, onLoadOlder }: AssistantScrollOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const anchorSpacerRef = useRef<HTMLDivElement>(null);
  const preservingAnchorRef = useRef(false);
  const anchorFrameRef = useRef<number | null>(null);
  const followLatestRef = useRef(true);
  const prependingRef = useRef(false);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);

  const clearAnchorSpacer = useCallback(() => {
    if (anchorSpacerRef.current) anchorSpacerRef.current.style.height = '0px';
  }, []);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = 'auto') => {
    const element = scrollRef.current;
    if (!element) return;
    clearAnchorSpacer();
    followLatestRef.current = true;
    setShowScrollToLatest(false);
    element.scrollTo({ top: element.scrollHeight, behavior });
  }, [clearAnchorSpacer]);

  const preserveScrollAnchor = useCallback((anchor: HTMLButtonElement, toggle: () => void) => {
    const element = scrollRef.current;
    if (!element) {
      toggle();
      return;
    }
    const previousTop = anchor.getBoundingClientRect().top;
    preservingAnchorRef.current = true;
    if (anchorFrameRef.current !== null) cancelAnimationFrame(anchorFrameRef.current);
    flushSync(toggle);
    clearAnchorSpacer();

    const targetTop = element.scrollTop + anchor.getBoundingClientRect().top - previousTop;
    const missingHeight = targetTop - (element.scrollHeight - element.clientHeight);
    // A collapsed list can otherwise clamp scrollTop and move the button even without following.
    if (missingHeight > 0 && anchorSpacerRef.current) {
      anchorSpacerRef.current.style.height = `${Math.ceil(missingHeight)}px`;
    }
    element.scrollTop = targetTop;
    const updateFollowing = () => {
      const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= SCROLL_FOLLOW_THRESHOLD;
      followLatestRef.current = nearBottom;
      setShowScrollToLatest(!nearBottom);
    };
    updateFollowing();
    // Cover the resize notification and scroll events caused by this synchronous layout change.
    anchorFrameRef.current = requestAnimationFrame(() => {
      anchorFrameRef.current = requestAnimationFrame(() => {
        preservingAnchorRef.current = false;
        anchorFrameRef.current = null;
        updateFollowing();
      });
    });
  }, [clearAnchorSpacer]);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element || prependingRef.current || preservingAnchorRef.current) return;
    clearAnchorSpacer();
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= SCROLL_FOLLOW_THRESHOLD;
    followLatestRef.current = nearBottom;
    setShowScrollToLatest(!nearBottom);
    if (element.scrollTop >= 10 || !hasMoreBefore || isSending) return;

    const previousHeight = element.scrollHeight;
    const previousTop = element.scrollTop;
    prependingRef.current = true;
    void onLoadOlder().then(loaded => {
      requestAnimationFrame(() => {
        if (loaded && scrollRef.current === element) {
          element.scrollTop = previousTop + element.scrollHeight - previousHeight;
        }
        prependingRef.current = false;
      });
    });
  }, [clearAnchorSpacer, hasMoreBefore, isSending, onLoadOlder]);

  useEffect(() => {
    if (!isOpen || showHistory) return;
    const frame = requestAnimationFrame(() => { if (!preservingAnchorRef.current) scrollToLatest(); });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, showHistory, scrollToLatest]);

  useEffect(() => {
    if (!isOpen || showHistory || prependingRef.current || !followLatestRef.current || preservingAnchorRef.current) return;
    const frame = requestAnimationFrame(() => { if (!preservingAnchorRef.current) scrollToLatest(); });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, showHistory, isSending, messages, scrollToLatest]);

  useEffect(() => {
    const content = contentRef.current;
    if (!isOpen || showHistory || !content) return;
    const observer = new ResizeObserver(() => {
      if (followLatestRef.current && !prependingRef.current && !preservingAnchorRef.current) scrollToLatest();
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [isOpen, showHistory, scrollToLatest]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!isOpen || showHistory || !element) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) clearAnchorSpacer();
    };
    element.addEventListener('wheel', clearAnchorSpacer, { passive: true });
    element.addEventListener('touchmove', clearAnchorSpacer, { passive: true });
    element.addEventListener('keydown', handleKeyDown);
    return () => {
      element.removeEventListener('wheel', clearAnchorSpacer);
      element.removeEventListener('touchmove', clearAnchorSpacer);
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [clearAnchorSpacer, isOpen, showHistory]);

  useEffect(() => () => {
    if (anchorFrameRef.current !== null) cancelAnimationFrame(anchorFrameRef.current);
  }, []);

  // Sending a new message resumes following even if the user had scrolled up.
  useEffect(() => {
    if (isSending) scrollToLatest();
  }, [isSending, scrollToLatest]);

  return { scrollRef, contentRef, anchorSpacerRef, showScrollToLatest, handleScroll, scrollToLatest, preserveScrollAnchor };
}
