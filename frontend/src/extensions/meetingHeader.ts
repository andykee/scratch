import { Node, InputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { MeetingHeaderView } from '../components/MeetingHeaderView'

export const MeetingHeader = Node.create({
  name: 'meetingHeader',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      time: { default: '' },
      name: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="meeting-header"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'meeting-header', ...HTMLAttributes }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MeetingHeaderView)
  },

  addInputRules() {
    const nodeType = this.type
    return [
      new InputRule({
        find: /^\/meeting\s$/,
        handler({ state, range }) {
          const { tr } = state
          const $from = state.doc.resolve(range.from)
          const blockStart = $from.before($from.depth)
          const blockEnd = $from.after($from.depth)
          tr.replaceWith(blockStart, blockEnd, nodeType.create())
        },
      }),
    ]
  },
})
