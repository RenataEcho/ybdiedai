/**
 * ResizableImageView — TipTap ReactNodeView
 *
 * 渲染图片并在选中时显示右侧拖拽缩放手柄。
 * 拖动手柄 → 修改节点 width 属性 → 触发 editor.commands.updateAttributes。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

const MIN_WIDTH = 40;
const MAX_WIDTH = 1200;

export function ResizableImageView({ node, selected, updateAttributes, editor }: NodeViewProps) {
  const { src, alt, title, width } = node.attrs as {
    src: string;
    alt?: string;
    title?: string;
    width?: number | null;
  };

  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startW = useRef(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const displayWidth = width ?? undefined;

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!editor.isEditable) return;
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      startX.current = e.clientX;
      startW.current = imgRef.current?.getBoundingClientRect().width ?? (width ?? 300);
      setDragging(true);
    },
    [editor.isEditable, width]
  );

  const onHandlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      const delta = e.clientX - startX.current;
      const newW = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startW.current + delta));
      updateAttributes({ width: Math.round(newW) });
    },
    [dragging, updateAttributes]
  );

  const onHandlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      setDragging(false);
    },
    [dragging]
  );

  /* ESC 取消拖拽 */
  useEffect(() => {
    if (!dragging) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDragging(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dragging]);

  return (
    <NodeViewWrapper
      as="span"
      className="rte-img-wrapper"
      style={{ display: 'inline-block', position: 'relative', verticalAlign: 'bottom', userSelect: 'none' }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt ?? ''}
        title={title ?? ''}
        className="rte-img-inline"
        draggable
        style={{
          display: 'block',
          width: displayWidth ? `${displayWidth}px` : undefined,
          maxWidth: '100%',
          height: 'auto',
          borderRadius: 6,
          outline: selected ? '2px solid #6366f1' : 'none',
          outlineOffset: 2,
          cursor: editor.isEditable ? 'default' : 'default',
        }}
      />

      {/* 右侧缩放手柄（仅在选中且可编辑时显示） */}
      {selected && editor.isEditable && (
        <div
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          style={{
            position: 'absolute',
            right: -5,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 10,
            height: 32,
            borderRadius: 5,
            background: '#6366f1',
            cursor: 'ew-resize',
            zIndex: 10,
            boxShadow: '0 0 0 2px white, 0 1px 4px rgba(0,0,0,0.25)',
            touchAction: 'none',
          }}
          title="拖动调整图片宽度"
        />
      )}

      {/* 宽度提示气泡（拖动时显示） */}
      {dragging && width && (
        <div
          style={{
            position: 'absolute',
            top: -28,
            right: 0,
            background: '#1e2232',
            color: '#fff',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          {width}px
        </div>
      )}
    </NodeViewWrapper>
  );
}
