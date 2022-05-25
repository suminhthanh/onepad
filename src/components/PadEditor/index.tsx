import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import ListItem from "@tiptap/extension-list-item";
import CharacterCount from "@tiptap/extension-character-count";

import ControlBar from "./ControlBar";
import { updatePad } from "../../services/pads";
import { useEffect, useState } from "react";

interface IPadEditorProp {
  id: string;
  content: string;
}

const PlaceholderConfig = Placeholder.configure({
  placeholder: "Write something …",
});

let timer = 0;

const HighlightConfigure = Highlight.configure({
  multicolor: true,
});

const TaskListConfigure = TaskList.configure({
  HTMLAttributes: {
    class: "task-list",
  },
});

const limit = null;
const CharacterCountConfigure = CharacterCount.configure({
  limit,
});

const extensions = [
  StarterKit,
  HighlightConfigure,
  Typography,
  PlaceholderConfig,
  TaskListConfigure,
  TaskItem.configure({
    nested: true,
  }),
  ListItem,
  CharacterCountConfigure,
];

export default function PadEditor({ id, content }: IPadEditorProp) {
  const [update, setUpdate] = useState(0);

  const editor = useEditor({
    extensions: extensions,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none m-auto",
      },
    },
    content: content,
    onUpdate: ({ editor }) => {
      setUpdate((prevUpdate) => prevUpdate + 1);
    },
  });

  useEffect(() => {
    if (editor) {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        const { content } = editor.getJSON();
        const title = content ? content[0] : null;
        let newTitle = "";

        if (title && title.content) {
          newTitle = title.content.reduce((prev, next) => {
            prev += next.text || "";
            return prev;
          }, "");
        }

        updatePad({ id, title: newTitle, content: editor.getHTML() });
      }, 600) as unknown as number;
    }

    // eslint-disable-next-line
  }, [update]);

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line
  }, [content]);

  return (
    <div className="tiptap-container">
      <EditorContent
        editor={editor}
        className="tiptap-main-content"
        spellCheck={false}
      />
      <ControlBar editor={editor} />
      <div className="character-count">
        {editor && editor.storage.characterCount.words()} words
      </div>
    </div>
  );
}