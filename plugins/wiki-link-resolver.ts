import { defineNuxtPlugin } from '#app'
import WikiLink from '~/components/content/WikiLink.vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('WikiLink', WikiLink)
  nuxtApp.vueApp.component('wiki-link', WikiLink)
})
