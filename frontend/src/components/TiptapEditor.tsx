import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'

const lowlight = createLowlight(common)

interface Props {
  content: object
  onUpdate: (json: object) => void
}

export function TiptapEditor({ content, onUpdate }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Write something...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON())
    },
  })

  return <EditorContent editor={editor} className="tiptap-editor" />
}
