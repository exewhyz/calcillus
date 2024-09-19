"use client";
import { useEffect, useRef } from "react";
import Draggable from "react-draggable";

import CanvasToolbar from "@/components/toolbar";
import Navbar from "@/components/Navbar";

import { useCalcillusStore } from "@/hooks/useStore";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    result,
    latexPosition,
    latexExpression,
    renderLatexToCanvas,
    initializeCanvas,
    setCanvasRef,
    setLatexPosition,
    draw,
    setIsDrawing,
    startDrawing,
    stopDrawing,
  } = useCalcillusStore();

  useEffect(() => {
    setCanvasRef(canvasRef);
    initializeCanvas();

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.MathJax.Hub.Config({
        tex2jax: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
        },
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [initializeCanvas, setCanvasRef]);

  useEffect(() => {
    if (latexExpression.length > 0 && window.MathJax) {
      setTimeout(() => {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }, 0);
    }
  }, [latexExpression]);

  useEffect(() => {
    if (result) {
      renderLatexToCanvas(result.expression, result.answer);
    }
  }, [result, renderLatexToCanvas]);

  return (
    <>
      <Navbar />
      <div className="p-4">
        <CanvasToolbar onAddImage={() => {}} />
        <canvas
          ref={canvasRef}
          id="canvas"
          className="relative bottom-0 w-full h-full bg-background"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={() => setIsDrawing(false)}
        />
        {latexExpression.map((latex, index) => (
          <Draggable
            key={index}
            defaultPosition={latexPosition}
            onStop={(_, data) => setLatexPosition({ x: data.x, y: data.y })}
          >
            <div className="absolute p-2 text-white rounded shadow-md">
              <div className="latex-content">{latex}</div>
            </div>
          </Draggable>
        ))}
      </div>
    </>
  );
}
