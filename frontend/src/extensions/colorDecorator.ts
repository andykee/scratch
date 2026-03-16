import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node } from '@tiptap/pm/model'

const hexColor = /(#[0-9a-f]{3,6})\b/gi
const hashTag = /#[a-zA-Z]\w*/g

function findDecorations(doc: Node): DecorationSet {
  const decorations: Decoration[] = []

  doc.descendants((node, position) => {
    if (!node.text) return

    // Collect hex color ranges first (they take priority)
    const colorRanges: Array<[number, number]> = []
    Array.from(node.text.matchAll(hexColor)).forEach(match => {
      const color = match[0]
      const index = match.index || 0
      const from = position + index
      const to = from + color.length
      colorRanges.push([from, to])
      decorations.push(
        Decoration.inline(from, to, {
          class: 'color',
          style: `--color: ${color}`,
        })
      )
    })

    // Add tag decorations, skipping any that overlap a hex color
    Array.from(node.text.matchAll(hashTag)).forEach(match => {
      const index = match.index || 0
      const from = position + index
      const to = from + match[0].length
      const overlapsColor = colorRanges.some(([cf, ct]) => from < ct && to > cf)
      if (!overlapsColor) {
        decorations.push(
          Decoration.inline(from, to, { class: 'tag' })
        )
      }
    })
  })

  return DecorationSet.create(doc, decorations)
}

const colorDecoratorKey = new PluginKey('colorDecorator')

export const ColorDecorator = Extension.create({
  name: 'colorDecorator',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: colorDecoratorKey,
        state: {
          init(_, { doc }) {
            return findDecorations(doc)
          },
          apply(transaction, decorationSet) {
            if (transaction.docChanged) {
              return findDecorations(transaction.doc)
            }
            return decorationSet.map(transaction.mapping, transaction.doc)
          },
        },
        props: {
          decorations(state) {
            return colorDecoratorKey.getState(state)
          },
        },
      }),
    ]
  },
})
