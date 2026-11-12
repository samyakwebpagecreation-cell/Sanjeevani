import { useRef, useState, useEffect, useCallback } from 'react';

export interface UseChatScrollOptions {
  latestAssistantId: string | null;
  streamingRevision: number;
  isConversationEmpty: boolean;
}

/**
 * Scroll handling hook for Sanjeevani AI Guardian (Section B)
 * - When a new assistant message starts, scrolls its TOP to the top of the scroller
 *   (scroll-margin-top: 12px), never to the bottom, so the first step is visible immediately.
 * - While content streams in, never moves the scroll position.
 * - If new content lands off-screen below the fold, exposes `showJumpToLatest = true`
 *   and `jumpToLatest()` handler.
 */
export function useChatScroll({
  latestAssistantId,
  streamingRevision,
  isConversationEmpty
}: UseChatScrollOptions) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledAssistantIdRef = useRef<string | null>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const checkOffscreenContent = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || isConversationEmpty) {
      setShowJumpToLatest(false);
      return;
    }
    const distanceFromBottom =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    setShowJumpToLatest(distanceFromBottom > 64);
  }, [isConversationEmpty]);

  // 1. When a NEW assistant message starts, scroll its TOP to the top of the scroller (scroll-margin-top: 12px)
  useEffect(() => {
    if (!latestAssistantId || isConversationEmpty) {
      lastScrolledAssistantIdRef.current = null;
      setShowJumpToLatest(false);
      return;
    }

    if (lastScrolledAssistantIdRef.current === latestAssistantId) {
      return;
    }

    lastScrolledAssistantIdRef.current = latestAssistantId;

    const alignAssistantMessageTop = () => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const targetEl = scroller.querySelector<HTMLElement>(
        `[data-message-id="${latestAssistantId}"]`
      );
      if (!targetEl) return;

      const scrollerRect = scroller.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const targetTopInScroller =
        targetRect.top - scrollerRect.top + scroller.scrollTop;

      scroller.scrollTo({
        top: Math.max(0, targetTopInScroller - 12),
        behavior: 'auto'
      });
    };

    alignAssistantMessageTop();
    const rafId = requestAnimationFrame(alignAssistantMessageTop);
    return () => cancelAnimationFrame(rafId);
  }, [latestAssistantId, isConversationEmpty]);

  // 2. While content streams in, DO NOT move scroll position; only detect if new content landed off-screen
  useEffect(() => {
    if (streamingRevision === 0 || isConversationEmpty) return;
    const scroller = scrollerRef.current;
    if (!scroller || !latestAssistantId) return;

    const targetEl = scroller.querySelector<HTMLElement>(
      `[data-message-id="${latestAssistantId}"]`
    );
    if (!targetEl) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    if (targetRect.bottom > scrollerRect.bottom + 28) {
      setShowJumpToLatest(true);
    }
  }, [streamingRevision, latestAssistantId, isConversationEmpty]);

  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const distanceFromBottom =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (distanceFromBottom <= 40) {
      setShowJumpToLatest(false);
    }
  }, []);

  const jumpToLatest = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (latestAssistantId) {
      const targetEl = scroller.querySelector<HTMLElement>(
        `[data-message-id="${latestAssistantId}"]`
      );
      if (targetEl) {
        const scrollerRect = scroller.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        // If user is above the message, scroll to its top; if already reading it, scroll down to reveal new content
        if (targetRect.top < scrollerRect.top - 20) {
          scroller.scrollTo({
            top: scroller.scrollHeight - scroller.clientHeight,
            behavior: 'smooth'
          });
        } else {
          const targetTopInScroller =
            targetRect.top - scrollerRect.top + scroller.scrollTop;
          scroller.scrollTo({
            top: Math.max(0, targetTopInScroller - 12),
            behavior: 'smooth'
          });
        }
        setShowJumpToLatest(false);
        return;
      }
    }
    scroller.scrollTo({
      top: scroller.scrollHeight - scroller.clientHeight,
      behavior: 'smooth'
    });
    setShowJumpToLatest(false);
  }, [latestAssistantId]);

  return {
    scrollerRef,
    showJumpToLatest,
    handleScroll,
    jumpToLatest,
    checkOffscreenContent
  };
}
