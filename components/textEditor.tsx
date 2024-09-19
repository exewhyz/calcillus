import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextEditorProps {
  onAddText: (text: string, fontSize: number) => void;
  position: { x: number; y: number };
  onClose: () => void;
}

const TextEditor: React.FC<TextEditorProps> = ({
  onAddText,
  position,
  onClose,
}) => {
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(16);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddText(text, fontSize);
    }
  };

  return (
    <div
      className="absolute bg-white p-4 rounded shadow-md"
      style={{ left: position.x, top: position.y }}
    >
      <form onSubmit={handleSubmit}>
        <Input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text"
          className="mb-2"
        />
        <Input
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          placeholder="Font size"
          className="mb-2"
        />
        <div className="flex justify-between">
          <Button type="submit">Add Text</Button>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TextEditor;
