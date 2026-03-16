import { useEffect, useRef } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/core'

const TAG_RE = /(#[a-zA-Z]\w*)/g

function toHighlightedHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(TAG_RE, '<span class="tag">$1</span>')
}

export function MeetingHeaderView({ node, updateAttributes }: NodeViewProps) {
  const timeRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLDivElement>(null)
  const { time, name } = node.attrs

  useEffect(() => {
    if (time === '' && name === '') {
      timeRef.current?.focus()
    }
  }, [])

  // Sync external name changes into the div when it's not focused
  useEffect(() => {
    const el = nameRef.current
    if (el && el !== document.activeElement) {
      el.innerHTML = name ? toHighlightedHTML(name) : ''
    }
  }, [name])

  function handleNameFocus() {
    const el = nameRef.current
    if (el) {
      el.textContent = name
      // Move cursor to end
      const range = document.createRange()
      const sel = window.getSelection()
      range.selectNodeContents(el)
      range.collapse(false)
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }

  function handleNameBlur() {
    const el = nameRef.current
    if (el) {
      el.innerHTML = el.textContent ? toHighlightedHTML(el.textContent) : ''
    }
  }

  function handleNameInput() {
    updateAttributes({ name: nameRef.current?.textContent ?? '' })
  }

  return (
    <NodeViewWrapper className="meeting-header">
      <div className="meeting-header-inner">
        <input
          ref={timeRef}
          className="meeting-header-time"
          placeholder="00:00"
          value={time}
          onChange={e => updateAttributes({ time: e.target.value })}
        />
        <div
          ref={nameRef}
          className="meeting-header-name"
          contentEditable
          suppressContentEditableWarning
          onFocus={handleNameFocus}
          onBlur={handleNameBlur}
          onInput={handleNameInput}
          data-placeholder="Meeting name"
        />
      </div>
    </NodeViewWrapper>
  )
}
