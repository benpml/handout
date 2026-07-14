import { Extension } from "@tiptap/core"
import { HANDOUT_COLLECTION_LIMITS, HANDOUT_TEXT_LIMITS } from "@handout/domain"
import { Plugin } from "@tiptap/pm/state"

export const HandoutNextDocumentLimits = Extension.create({
  name: "handoutNextDocumentLimits",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction(transaction) {
          if (!transaction.docChanged) {
            return true
          }

          return (
            transaction.doc.childCount <= HANDOUT_COLLECTION_LIMITS.blocksPerTab &&
            topLevelBlocksAreWithinTextLimit(transaction.doc)
          )
        },
      }),
    ]
  },
})

function topLevelBlocksAreWithinTextLimit(doc: import("@tiptap/pm/model").Node) {
  let valid = true

  doc.forEach((node) => {
    if (!valid) {
      return
    }

    if (node.textContent.length > HANDOUT_TEXT_LIMITS.blockText) {
      valid = false
    }
  })

  return valid
}
