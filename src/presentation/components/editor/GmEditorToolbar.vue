<template>
  <div
    v-if="editor"
    class="editor-toolbar flex flex-wrap items-center gap-0.5 rounded-md border border-gm-border bg-gm-bg p-1"
    data-testid="editor-toolbar"
  >
    <!-- Text style -->
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
      :class="{ 'bg-gm-primary text-white': editor.isActive('bold') }"
      data-testid="toolbar-bold"
      title="Bold (Ctrl+B)"
      @click="editor.chain().focus().toggleBold().run()"
    >
      <strong>B</strong>
    </button>
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
      :class="{ 'bg-gm-primary text-white': editor.isActive('italic') }"
      data-testid="toolbar-italic"
      title="Italic (Ctrl+I)"
      @click="editor.chain().focus().toggleItalic().run()"
    >
      <em>I</em>
    </button>
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
      :class="{ 'bg-gm-primary text-white': editor.isActive('strike') }"
      data-testid="toolbar-strike"
      title="Strikethrough"
      @click="editor.chain().focus().toggleStrike().run()"
    >
      <del>S</del>
    </button>
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
      :class="{ 'bg-gm-primary text-white': editor.isActive('code') }"
      data-testid="toolbar-inline-code"
      title="Inline code"
      @click="editor.chain().focus().toggleCode().run()"
    >
      <code>&lt;/&gt;</code>
    </button>

    <span class="w-px bg-gm-border mx-1" />

    <!-- Headings -->
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
      :class="{ 'bg-gm-primary text-white': editor.isActive('heading', { level: 1 }) }"
      data-testid="toolbar-h1"
      title="Heading 1"
      @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
    >
      H1
    </button>
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
      :class="{ 'bg-gm-primary text-white': editor.isActive('heading', { level: 2 }) }"
      data-testid="toolbar-h2"
      title="Heading 2"
      @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
    >
      H2
    </button>
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
      :class="{ 'bg-gm-primary text-white': editor.isActive('heading', { level: 3 }) }"
      data-testid="toolbar-h3"
      title="Heading 3"
      @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
    >
      H3
    </button>

    <span class="w-px bg-gm-border mx-1" />

    <!-- Lists & blocks -->
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
      :class="{ 'bg-gm-primary text-white': editor.isActive('bulletList') }"
      data-testid="toolbar-bullet-list"
      title="Bullet list"
      @click="editor.chain().focus().toggleBulletList().run()"
    >
      • List
    </button>
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
      :class="{ 'bg-gm-primary text-white': editor.isActive('orderedList') }"
      data-testid="toolbar-ordered-list"
      title="Ordered list"
      @click="editor.chain().focus().toggleOrderedList().run()"
    >
      1. List
    </button>
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
      :class="{ 'bg-gm-primary text-white': editor.isActive('blockquote') }"
      data-testid="toolbar-blockquote"
      title="Blockquote"
      @click="editor.chain().focus().toggleBlockquote().run()"
    >
      &ldquo; Quote
    </button>
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
      :class="{ 'bg-gm-primary text-white': editor.isActive('codeBlock') }"
      data-testid="toolbar-code-block"
      title="Code block"
      @click="editor.chain().focus().toggleCodeBlock().run()"
    >
      &lt;/&gt; Code
    </button>

    <span class="w-px bg-gm-border mx-1" />

    <!-- Horizontal rule -->
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
      data-testid="toolbar-hr"
      title="Horizontal rule"
      @click="editor.chain().focus().setHorizontalRule().run()"
    >
      &mdash;
    </button>

    <span class="w-px bg-gm-border mx-1" />

    <!-- History -->
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      data-testid="toolbar-undo"
      title="Undo (Ctrl+Z)"
      :disabled="!editor.can?.().undo?.()"
      @click="editor.chain().focus().undo().run()"
    >
      ↶
    </button>
    <button
      type="button"
      class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      data-testid="toolbar-redo"
      title="Redo (Ctrl+Shift+Z)"
      :disabled="!editor.can?.().redo?.()"
      @click="editor.chain().focus().redo().run()"
    >
      ↷
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/core'

defineProps<{
  editor: Editor | null
}>()
</script>