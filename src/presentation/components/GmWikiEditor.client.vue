<template>
  <div>
    <input v-model="title" data-testid="wiki-title" type="text" placeholder="Node Title" />
    <input v-model="path" data-testid="wiki-path" type="text" placeholder="ltree path" />
    <MdEditor v-model="content" theme="dark" language="en-US" preview-theme="github" />
    <button data-testid="wiki-save" @click="handleSave">Save</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

const props = defineProps<{
  initialTitle?: string
  initialContent?: string
  initialPath?: string
}>()

const emit = defineEmits<{
  save: [payload: { title: string; content: string; path: string }]
}>()

const title = ref(props.initialTitle ?? '')
const content = ref(props.initialContent ?? '')
const path = ref(props.initialPath ?? '')

function handleSave() {
  emit('save', { title: title.value, content: content.value, path: path.value })
}
</script>