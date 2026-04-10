import { useEffect } from 'react';
import { clampScale, distance, midpoint } from '../utils/panZoomMath';

type Options = { selector: string };

type ViewState = {
  originX: number;
  originY: number;
  scale: number;
};

export function usePanZoom({ selector }: Options) {
  useEffect(() => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;

    let isPanning = false;
    let startX = 0;
    let startY = 0;

    let isTouchPanning = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchOriginX = 0;
    let touchOriginY = 0;

    let isPinching = false;
    let pinchStartDistance = 1;
    let pinchStartScale = 1;
    let pinchStartMidX = 0;
    let pinchStartMidY = 0;
    let pinchOriginX = 0;
    let pinchOriginY = 0;

    let originX = 0;
    let originY = 0;
    let scale = 1;

    let rafId = 0;
    let isAnimating = false;
    let animationStartTime = 0;
    let animationStartOriginX = 0;
    let animationStartOriginY = 0;
    let animationStartScale = 1;
    let animationTargetOriginX = 0;
    let animationTargetOriginY = 0;
    let animationTargetScale = 1;
    const ANIMATION_DURATION = 550; // ms

    const emitViewChange = () => {
      window.dispatchEvent(
        new CustomEvent('mindmapp:viewchange', {
          detail: { originX, originY, scale },
        }),
      );
    };

    const applyTransform = () => {
      el.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
      emitViewChange();
    };

    const setView = (view: Partial<ViewState>) => {
      originX = typeof view.originX === 'number' ? view.originX : originX;
      originY = typeof view.originY === 'number' ? view.originY : originY;
      scale = typeof view.scale === 'number' ? clampScale(view.scale) : scale;
      applyTransform();
    };

    const getView = (): ViewState => ({ originX, originY, scale });

    // Smooth ease-out cubic: ease-out-cubic easing
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animateToView = (target: ViewState, duration = ANIMATION_DURATION) => {
      // Cancel any running animation
      if (rafId) cancelAnimationFrame(rafId);
      isAnimating = true;

      animationStartOriginX = originX;
      animationStartOriginY = originY;
      animationStartScale = scale;
      animationTargetOriginX = target.originX;
      animationTargetOriginY = target.originY;
      animationTargetScale = clampScale(target.scale);
      animationStartTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - animationStartTime;
        const t = Math.min(1, elapsed / duration);
        const eased = easeOutCubic(t);

        originX = animationStartOriginX + (animationTargetOriginX - animationStartOriginX) * eased;
        originY = animationStartOriginY + (animationTargetOriginY - animationStartOriginY) * eased;
        scale = animationStartScale + (animationTargetScale - animationStartScale) * eased;

        applyTransform();

        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          isAnimating = false;
          rafId = 0;
          // Snap to exact target at end
          originX = animationTargetOriginX;
          originY = animationTargetOriginY;
          scale = animationTargetScale;
          applyTransform();
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * -0.1;
      setView({ scale: scale + delta });
    };

    const resetView = () => {
      animateToView({ originX: 0, originY: 0, scale: 1 });
    };

    const onDoubleClick = () => resetView();

    (window as any).__mindmappResetView = resetView;
    (window as any).__mindmappPanZoom = { setView, getView, resetView, animateToView };

    const onMouseDown = (e: MouseEvent) => {
      if (!e.shiftKey) return;
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      el.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.style.transform = `translate(${originX + dx}px, ${originY + dy}px) scale(${scale})`;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isPanning) return;
      isPanning = false;
      originX += e.clientX - startX;
      originY += e.clientY - startY;
      applyTransform();
      el.style.cursor = 'default';
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        isTouchPanning = true;
        isPinching = false;
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchOriginX = originX;
        touchOriginY = originY;
      }

      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching = true;
        isTouchPanning = false;
        const p1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        const p2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
        pinchStartDistance = Math.max(1, distance(p1, p2));
        pinchStartScale = scale;
        const mid = midpoint(p1, p2);
        pinchStartMidX = mid.x;
        pinchStartMidY = mid.y;
        pinchOriginX = originX;
        pinchOriginY = originY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isTouchPanning) {
        e.preventDefault();
        const t = e.touches[0];
        setView({
          originX: touchOriginX + (t.clientX - touchStartX),
          originY: touchOriginY + (t.clientY - touchStartY),
        });
      }

      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const p1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        const p2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };

        const d = Math.max(1, distance(p1, p2));
        const ratio = d / pinchStartDistance;

        const mid = midpoint(p1, p2);
        setView({
          scale: pinchStartScale * ratio,
          originX: pinchOriginX + (mid.x - pinchStartMidX),
          originY: pinchOriginY + (mid.y - pinchStartMidY),
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isTouchPanning = false;
        isPinching = false;
        return;
      }

      if (e.touches.length === 1) {
        const t = e.touches[0];
        isPinching = false;
        isTouchPanning = true;
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchOriginX = originX;
        touchOriginY = originY;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') el.style.cursor = 'grab';
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') el.style.cursor = 'default';
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      delete (window as any).__mindmappResetView;
      delete (window as any).__mindmappPanZoom;
    };
  }, [selector]);
}
