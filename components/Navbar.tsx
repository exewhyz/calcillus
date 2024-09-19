import { ModeToggle } from "@/components/toggleTheme";

import ColorSwitcher from "@/components/colorSwitcher";
import Logo from "@/components/logo";

import { Button } from "@/components/ui/button";

import { useCalcillusStore } from "@/hooks/useStore";

const Navbar = () => {
  const { resetState, resetCanvas, runCalculation } = useCalcillusStore();

  const handleReset = () => {
    resetState();
    resetCanvas();
  };
  return (
    <nav className="flex justify-between gap-2 items-center h-16 bg-background shadow-md px-10">
      <Logo />
      <ColorSwitcher />
      <div className="flex items-center justify-center gap-2">
        <Button
          onClick={handleReset}
          className="w-20"
          variant="destructive"
          size={"icon"}
        >
          Reset
        </Button>
        <Button onClick={runCalculation} className="w-20" size="icon">
          Calculate
        </Button>
        <ModeToggle />
      </div>
    </nav>
  );
};

export default Navbar;
