import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node } from '@tiptap/pm/model'

const hexColor = /(#[0-9a-f]{3,6})\b/gi

function findColors(doc: Node): DecorationSet {
  const decorations: Decoration[] = []

  doc.descendants((node, position) => {
    if (!node.text) return

    Array.from(node.text.matchAll(hexColor)).forEach(match => {
      const color = match[0]
      const index = match.index || 0
      const from = position + index
      const to = from + color.length
      decorations.push(
        Decoration.inline(from, to, {
          class: 'color',
          style: `--color: ${color}`,
        })
      )
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
            return findColors(doc)
          },
          apply(transaction, decorationSet) {
            if (transaction.docChanged) {
              return findColors(transaction.doc)
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
