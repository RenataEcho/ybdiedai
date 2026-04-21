/**
 * ResizableImage — TipTap 自定义图片扩展
 *
 * 功能：
 * 1. inline 模式，多张图片可通过拖拽并排放置
 * 2. 图片选中后右侧显示拖拽手柄，拖动调整宽度（持久化 data-width 属性）
 */
import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResizableImageView } from './ResizableImageView';

export const IMAGE_INPUT_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/;

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setResizableImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        width?: number;
      }) => ReturnType;
    };
  }
}

export const ResizableImageExtension = Node.create({
  name: 'resizableImage',
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src:   { default: null },
      alt:   { default: null },
      title: { default: null },
      width: {
        default: null,
        parseHTML: (el) => {
          const v = el.getAttribute('data-width');
          return v ? Number(v) : null;
        },
        renderHTML: (attrs) =>
          attrs.width
            ? { 'data-width': String(attrs.width), style: `width:${attrs.width}px;max-width:100%` }
            : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes({ class: 'rte-img-inline' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },

  addCommands() {
    return {
      setResizableImage:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: IMAGE_INPUT_REGEX,
        type: this.type,
        getAttributes: (match) => ({ src: match[2], alt: match[1] }),
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('resizableImageDrop'),
        props: {
          handleDOMEvents: {
            drop(view, event) {
              const files = event.dataTransfer?.files;
              if (!files?.length) return false;
              const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
              if (!images.length) return false;
              event.preventDefault();
              const { schema } = view.state;
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? 0;
              images.forEach((image) => {
                const insertImage = (src: string) => {
                  const nodeType = schema.nodes['resizableImage'];
                  if (!nodeType) return;
                  const node = nodeType.create({ src, alt: image.name });
                  view.dispatch(view.state.tr.insert(pos, node));
                };
                // 优先走上传接口，失败降级 base64
                const form = new FormData();
                form.append('file', image);
                fetch('/__dev/api/upload-image', { method: 'POST', body: form })
                  .then((r) => r.ok ? r.json() as Promise<{ ok: boolean; url?: string }> : Promise.reject())
                  .then((json) => {
                    if (json.ok && json.url) { insertImage(json.url); return; }
                    throw new Error('no url');
                  })
                  .catch(() => {
                    const reader = new FileReader();
                    reader.onload = (e) => { const src = e.target?.result as string; if (src) insertImage(src); };
                    reader.readAsDataURL(image);
                  });
              });
              return true;
            },
          },
        },
      }),
    ];
  },
});
