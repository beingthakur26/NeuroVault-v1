import React, { useEffect, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import axios from 'axios';
import { useAuth } from "@clerk/clerk-react";

export default function BlockEditor({ initialContent, itemId }) {
  const { getToken } = useAuth();
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [initDone, setInitDone] = useState(false);

  const editor = useCreateBlockNote();

  useEffect(() => {
    async function init() {
      if (initialContent && !initDone) {
        try {
          // Parse the raw generic text/markdown into Blocknote native JSON blocks format
          const blocks = await editor.tryParseMarkdownToBlocks(initialContent);
          editor.replaceBlocks(editor.document, blocks);
        } catch (e) {
          console.error("Failed to parse blocks:", e);
        }
        setInitDone(true);
      }
    }
    init();
  }, [initialContent, editor, initDone]);

  const saveContent = async () => {
    setSaveStatus("Saving...");
    try {
      const token = await getToken();
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      
      await axios.patch(`http://localhost:5000/api/items/${itemId}/content`, {
         content: markdown
      }, {
         headers: { Authorization: `Bearer ${token}` }
      });
      setSaveStatus("Saved");
    } catch (e) {
      console.error("Editor save failed", e);
      setSaveStatus("Error saving");
    }
  };

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (initDone && saveStatus === "Editing...") {
        saveContent();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [editor.document, initDone, saveStatus]);

  if (!initDone && initialContent) {
    return <div className="p-4 text-gray-500 animate-pulse">Initializing Editor...</div>;
  }

  return (
    <div className="relative bg-[#1a1a1a] rounded-xl border border-white/10 overflow-hidden shadow-inner">
      <div className="absolute top-2 right-4 z-10 text-xs text-gray-500 font-mono">
        {saveStatus}
      </div>
      <div className="p-4 min-h-[400px] prose prose-invert max-w-none">
        <BlockNoteView 
          editor={editor} 
          theme="dark" 
          onChange={() => setSaveStatus("Editing...")} 
        />
      </div>
    </div>
  );
}
