import { useEffect } from "react"
import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { EditorContent, useEditor } from "@tiptap/react"
import Placeholder from "@tiptap/extension-placeholder"
import StarterKit from "@tiptap/starter-kit"

import { cn } from "@/lib/utils"

type TiptapFieldProps = {
  value: string
  onChange: (nextValue: string) => void
  editable?: boolean
  placeholder?: string
  className?: string
  singleLine?: boolean
  output?: "html" | "text"
  onFocus?: () => void
}

export function TiptapField({
  value,
  onChange,
  editable = true,
  placeholder,
  className,
  singleLine,
  output = "html",
  onFocus,
}: TiptapFieldProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      VariableDecorations,
    ],
    content: output === "text" ? textToHtml(value) : value,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn("lightsite-tiptap outline-none", className),
      },
      handleKeyDown: (_view, event) => {
        if (singleLine && event.key === "Enter") {
          event.preventDefault()
          return true
        }

        return false
      },
    },
    onUpdate: ({ editor }) => {
      onChange(output === "text" ? editor.getText() : editor.getHTML())
    },
    onFocus,
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return
    }

    const currentValue = output === "text" ? editor.getText() : editor.getHTML()
    if (currentValue === value) {
      return
    }

    editor.commands.setContent(output === "text" ? textToHtml(value) : value, { emitUpdate: false })
  }, [editor, output, value])

  useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  return <EditorContent editor={editor} />
}

const VariableDecorations = Extension.create({
  name: "variableDecorations",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("variableDecorations"),
        props: {
          decorations: ({ doc }) => {
            const decorations: Decoration[] = []
            const variablePattern = /\{\{[^{}]+\}\}/g

            doc.descendants((node, position) => {
              if (!node.isText || !node.text) {
                return
              }

              for (const match of node.text.matchAll(variablePattern)) {
                const start = position + (match.index ?? 0)
                const end = start + match[0].length

                decorations.push(
                  Decoration.inline(start, end, {
                    class: "lightsite-variable-token",
                  })
                )
              }
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})

function textToHtml(value: string) {
  return `<p>${escapeHtml(value || "")}</p>`
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
