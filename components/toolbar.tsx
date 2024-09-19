import {
  Pen,
  Square,
  Circle,
  Type,
  Image,
  Undo,
  Redo,
  Eraser,
  Save,
  Minus,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CanvasState, useCalcillusStore } from "@/hooks/useStore";
import { useRef } from "react";
import { Input } from "./ui/input";

interface CanvasToolbarProps {
  onAddImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ onAddImage }) => {
  const { history, tool, setTool, undo, redo, currentStep } =
    useCalcillusStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
  const canUndo = currentStep > 0;
  const canRedo = currentStep < history.length - 1;
  const tools = [
    { name: "brush", icon: Pen },
    { name: "eraser", icon: Eraser },
    { name: "line", icon: Minus },
    { name: "arrow", icon: ArrowRight },
    { name: "rectangle", icon: Square },
    { name: "circle", icon: Circle },
    { name: "text", icon: Type },
    { name: "image", icon: Image },
  ];

  return (
    <div className="flex items-center gap-2 mb-4">
      {tools.map(({ name, icon: Icon }) => (
        <Button
          key={name}
          variant={tool === name ? "default" : "outline"}
          size="icon"
          onClick={() => {
            setTool(name as CanvasState["tool"]);
            handleImageClick;
          }}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
      <Input
        type="file"
        ref={fileInputRef}
        onChange={onAddImage}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo}>
        <Undo className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={redo} disabled={!canRedo}>
        <Redo className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={() => ""}>
        <Save className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CanvasToolbar;
