import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import GmSecret from '~/components/content/GmSecret.vue'

// ─── Issue #29: Task 5 — ::gm-secret MDC Component ─────────────────
// Asymmetric security: renders slot content ONLY for GMs,
// returns empty DOM for non-GM users (not just CSS-hidden).

// Mock the useGmStatus composable
const mockIsGm = ref(false)

vi.mock('~/composables/useGmStatus', () => ({
  useGmStatus: () => ({
    isGm: mockIsGm,
  }),
}))

function mountComponent(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(GmSecret, {
    props: { title: 'GM Note', ...props },
    slots,
  })
}

describe('Issue #29: ::gm-secret MDC Component', () => {
  beforeEach(() => {
    mockIsGm.value = false
  })

  describe('when user is GM (isGm = true)', () => {
    beforeEach(() => {
      mockIsGm.value = true
    })

    it('should render the default slot content', () => {
      const wrapper = mountComponent(
        { title: 'Trap Details' },
        { default: 'The trap has a DC 15 Perception check.' }
      )
      expect(wrapper.text()).toContain('The trap has a DC 15 Perception check.')
    })

    it('should render the title prop', () => {
      const wrapper = mountComponent(
        { title: 'Secret Treasure Room' },
        { default: 'Hidden gold.' }
      )
      expect(wrapper.text()).toContain('Secret Treasure Room')
    })

    it('should have a distinctive GM-styled container', () => {
      const wrapper = mountComponent(
        { title: 'GM Only' },
        { default: 'Secret content' }
      )
      expect(wrapper.find('[data-testid="gm-secret"]').exists()).toBe(true)
    })

    it('should render multiple children via default slot', () => {
      const wrapper = mountComponent(
        { title: 'Multi Content' },
        { default: '<p>Line 1</p><p>Line 2</p>' }
      )
      expect(wrapper.text()).toContain('Line 1')
      expect(wrapper.text()).toContain('Line 2')
    })
  })

  describe('when user is NOT GM (isGm = false)', () => {
    beforeEach(() => {
      mockIsGm.value = false
    })

    it('should render nothing — empty DOM', () => {
      const wrapper = mountComponent(
        { title: 'Trap Details' },
        { default: 'The trap has a DC 15 Perception check.' }
      )
      // Component should emit no visible output
      expect(wrapper.html()).toBe('<!--v-if-->')
    })

    it('should not render the title prop', () => {
      const wrapper = mountComponent(
        { title: 'Secret Treasure Room' },
        { default: 'Hidden gold.' }
      )
      expect(wrapper.text()).toBe('')
    })

    it('should NOT leak content into the DOM (not just CSS-hidden)', () => {
      const wrapper = mountComponent(
        { title: 'Secret Information' },
        { default: 'VIP content that must not leak.' }
      )
      // The content must not appear anywhere in the HTML output
      expect(wrapper.html()).not.toContain('VIP content')
      expect(wrapper.html()).not.toContain('Secret Information')
    })

    it('should have no gm-secret container in DOM', () => {
      const wrapper = mountComponent(
        { title: 'Hidden' },
        { default: 'Content' }
      )
      expect(wrapper.find('[data-testid="gm-secret"]').exists()).toBe(false)
    })
  })
})