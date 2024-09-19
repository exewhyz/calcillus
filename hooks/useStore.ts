import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { LazyBrush } from "lazy-brush";

interface GeneratedResult {
  expression: string;
  answer: string;
}

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}

export interface CanvasState {
  tool: "brush" | "eraser" | "line" | "rectangle" | "circle" | "text" | "image";
  history: ImageData[];
  currentStep: number;
}

interface CalcillusState extends CanvasState {
  isDrawing: boolean;
  color: string;
  brushSize: number;
  dictOfVars: Record<string, string>;
  result: GeneratedResult | undefined;
  latexPosition: { x: number; y: number };
  latexExpression: string[];
  lazyBrush: LazyBrush;
  canvasRef: React.RefObject<HTMLCanvasElement> | null;
  canvasData: string | null; // New property to store canvas data
  startPosition: { x: number; y: number }

  setIsDrawing: (isDrawing: boolean) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setTool: (tool: CanvasState["tool"]) => void;
  setDictOfVars: (dictOfVars: Record<string, string>) => void;
  setResult: (result: GeneratedResult | undefined) => void;
  setLatexPosition: (position: { x: number; y: number }) => void;
  setLatexExpression: (expression: string[]) => void;
  setCanvasRef: (ref: React.RefObject<HTMLCanvasElement>) => void;
  setCanvasData: (data: string | null) => void; // New setter for canvas data

  resetState: () => void;
  renderLatexToCanvas: (expression: string, answer: string) => void;
  runCalculation: () => Promise<void>;
  initializeCanvas: () => void;
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  stopDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  resetCanvas: () => void;
  saveCanvasData: () => void; // New method to save canvas data
  restoreCanvasData: () => void; // New method to restore canvas data

  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  addToHistory: (imageData: ImageData) => void;
  drawShape: (
    shape: "rectangle" | "circle" | "line" | "arrow",
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => void;
  addText: (text: string, x: number, y: number) => void;
  addImage: (imageUrl: string, x: number, y: number) => void;
}

export const useCalcillusStore = create<CalcillusState>()(
  persist(
    (set, get) => ({
      tool: "brush",
      history: [],
      currentStep: 0,

      canUndo: false,
      canRedo: false,

      setTool: (tool) => set({ tool }),

      undo: () => {
        const { currentStep, history, canvasRef, saveCanvasData } = get();
        if (currentStep > 0 && canvasRef?.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.putImageData(history[currentStep - 1], 0, 0);
            set({ currentStep: currentStep - 1 });
            saveCanvasData();
            if (currentStep < history.length - 1) {
              set({ canUndo: false });
            } else {
              set({ canUndo: false });
            }
          }
        }
      },

      redo: () => {
        const { currentStep, history, canvasRef, saveCanvasData } = get();
        if (currentStep < history.length - 1 && canvasRef?.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.putImageData(history[currentStep + 1], 0, 0);
            set({ currentStep: currentStep + 1 });
            saveCanvasData(); // Save the drawn canvas state
          }
        }
      },

      addToHistory: (imageData) => {
        const { history, currentStep } = get();
        const newHistory = history.slice(0, currentStep + 1);
        // console.log(history);
        newHistory.push(imageData);
        set({ history: newHistory, currentStep: newHistory.length - 1 });
      },

      addText: (text, x, y) => {
        const { canvasRef, color, addToHistory } = get();
        if (!canvasRef?.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.font = "16px Arial";
          ctx.fillStyle = color;
          ctx.fillText(text, x, y);
          addToHistory(ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
      },

      addImage: (imageUrl, x, y) => {
        const { canvasRef, addToHistory } = get();
        if (!canvasRef?.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, x, y);
            addToHistory(ctx.getImageData(0, 0, canvas.width, canvas.height));
          };
          img.src = imageUrl;
        }
      },
      startPosition: { x: 0, y: 0 },
      isDrawing: false,
      color: "#ffffff",
      brushSize: 4,
      dictOfVars: {},
      result: undefined,
      latexPosition: { x: 10, y: 200 },
      latexExpression: [],
      lazyBrush: new LazyBrush({
        radius: 10,
        enabled: true,
        initialPoint: { x: 0, y: 0 },
      }),
      canvasRef: null,
      canvasData: null,

      setIsDrawing: (isDrawing) => set({ isDrawing }),
      setColor: (color) => set({ color }),
      setBrushSize: (size) => set({ brushSize: size }),
      setDictOfVars: (dictOfVars) => set({ dictOfVars }),
      setResult: (result) => set({ result }),
      setLatexPosition: (position) => set({ latexPosition: position }),
      setLatexExpression: (expression) => set({ latexExpression: expression }),
      setCanvasRef: (ref) => set({ canvasRef: ref }),
      setCanvasData: (data) => set({ canvasData: data }),

      renderLatexToCanvas: (expression, answer) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        set((state) => ({
          latexExpression: [...state.latexExpression, latex],
        }));
        const { canvasRef } = get();
        if (!canvasRef?.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      },

      runCalculation: async () => {
        const { canvasRef, dictOfVars } = get();
        if (!canvasRef?.current) return;
        const canvas = canvasRef.current;
        try {
          const response = await axios.post(
            "https://calc-be.vercel.app/calculate",
            {
              image: canvas.toDataURL("image/png"),
              dict_of_vars: dictOfVars,
            }
          );

          const resp = await response.data;
          console.log("Response", resp);

          resp.data.forEach((data: Response) => {
            if (data.assign) {
              set((state) => ({
                dictOfVars: {
                  ...state.dictOfVars,
                  [data.expr]: data.result,
                },
              }));
            }
          });
          const ctx = canvas.getContext("2d");
          const imageData = ctx!.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          let minX = canvas.width,
            minY = canvas.height,
            maxX = 0,
            maxY = 0;

          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const i = (y * canvas.width + x) * 4;
              if (imageData.data[i + 3] > 0) {
                // If pixel is not transparent
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
          }

          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;

          set({ latexPosition: { x: centerX, y: centerY } });

          resp.data.forEach((data: Response) => {
            setTimeout(() => {
              set({
                result: {
                  expression: data.expr,
                  answer: data.result,
                },
              });
            }, 1000);
          });
        } catch (error) {
          console.error("Error in calculation:", error);
        }
      },

      initializeCanvas: () => {
        const { canvasRef, restoreCanvasData } = get();
        if (!canvasRef?.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight - canvas.offsetTop;
          restoreCanvasData(); // Restore canvas data after initialization
        }
      },

      startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { canvasRef, color, brushSize } = get();
        if (!canvasRef?.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.beginPath();
          ctx.lineCap = "round";
          ctx.lineWidth = brushSize;
          ctx.strokeStyle = color;
          set({ startPosition: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } });
          set({ isDrawing: true });
        }
      },

      draw: (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { isDrawing, canvasRef, color, tool } = get();
        if (!isDrawing || !canvasRef?.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.strokeStyle = color;
          switch (tool) {
            case "brush":
              ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
              ctx.stroke();
              break;
            case "eraser":
              ctx.globalCompositeOperation = "destination-out";
              ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
              ctx.stroke();
              ctx.globalCompositeOperation = "source-over";
              break;
            default:
              break;
          }
        }
      },
      drawShape: (shape, startX, startY, endX, endY) => {
        const { canvasRef, color } = get();

        if (!canvasRef?.current) return;
        const canvas = canvasRef.current;

        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        ctx.strokeStyle = color;
        if (shape === "rectangle") {
          ctx.rect(startX, startY, endX - startX, endY - startY);
        } else if (shape === "circle") {
          const radius = Math.sqrt(
            Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
          );
          ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        } else if (shape === 'line') {
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
        }
        ctx.stroke();
      },

      stopDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { addToHistory, saveCanvasData, canvasRef, tool, drawShape, startPosition, addImage, addText } = get();
        const canvas = canvasRef?.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        set({ isDrawing: false });
        const endPos = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
        switch (tool) {
          case "rectangle":
            drawShape(tool, startPosition.x, startPosition.y, endPos.x, endPos.y);
            break;
          case "circle":
            drawShape(tool, startPosition.x, startPosition.y, endPos.x, endPos.y);
            break;
          case "line":
            drawShape(tool, startPosition.x, startPosition.y, endPos.x, endPos.y);
            break;
          case "text":
            const text = prompt("Enter text:");
            if (text) addText(text, endPos.x, endPos.y);
            break;
          case "image":
            const imageUrl = prompt("Enter image URL:");
            if (imageUrl) addImage(imageUrl, endPos.x, endPos.y);
            break;
          default:
            break;
        }
        if (!ctx) return;
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        img && addToHistory(img);
        saveCanvasData();
      },

      resetState: () => {
        set({
          isDrawing: false,
          history: [],
          dictOfVars: {},
          result: undefined,
          latexExpression: [],
          currentStep: -1,
          canUndo: false,
          canRedo: false,
          canvasData: null,
        });
      },

      resetCanvas: () => {
        const { canvasRef, saveCanvasData } = get();
        if (!canvasRef?.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          saveCanvasData(); // Save the cleared canvas state
        }
      },

      saveCanvasData: () => {
        const { canvasRef } = get();
        if (!canvasRef?.current) return;

        const canvas = canvasRef.current;
        const dataURL = canvas.toDataURL();
        set({ canvasData: dataURL });
      },
      restoreCanvasData: () => {
        const { canvasRef, canvasData } = get();
        if (!canvasRef?.current || !canvasData) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = canvasData;
        }
      },
    }),
    {
      name: "calcillus-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        color: state.color,
        tool: state.tool,
        result: state.result,
        dictOfVars: state.dictOfVars,
        latexPosition: state.latexPosition,
        latexExpression: state.latexExpression,
        canvasData: state.canvasData,
        // currentStep: state.currentStep,
        // canUndo: state.history.length > 1,
        // canRedo: state.currentStep < state.history.length - 1,
        // history: state.history,
      }),
    }
  )
);
