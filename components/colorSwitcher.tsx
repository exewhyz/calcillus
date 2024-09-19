import { Pen } from "lucide-react";

import { SWATCHES } from "@/constants";
import { cn } from "@/lib/utils";

import { useCalcillusStore } from "@/hooks/useStore";
import { useRouter } from "next/navigation";

const ColorSwitcher = () => {
  const { color, setColor } = useCalcillusStore();
  const router = useRouter();
  const handleColorSwitcher = (color: string) => {
    router.push(`/?color=${color}`);
    setColor(color);
  };
  return (
    <div className="flex gap-x-2 rounded items-center justify-center">
      {SWATCHES.map((swatch) => (
        <div
          key={swatch}
          className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-solid"
          style={{ backgroundColor: swatch }}
          onClick={() => handleColorSwitcher(swatch)}
        >
          {color === swatch && (
            <Pen
              className={cn(
                "w-3",
                swatch === "#000000" ? "text-white" : "text-black"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ColorSwitcher;
