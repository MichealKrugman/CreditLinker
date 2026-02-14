"use client";

import { useMemo } from "react";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreGauge({ score, size = "md", showLabel = true }: ScoreGaugeProps) {
  // Clamp score between 0-100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Calculate grade and color
  const { grade, color, bgColor, label } = useMemo(() => {
    if (clampedScore >= 90) return { grade: "A+", color: "text-green-600", bgColor: "stroke-green-600", label: "Excellent" };
    if (clampedScore >= 80) return { grade: "A", color: "text-green-600", bgColor: "stroke-green-500", label: "Very Good" };
    if (clampedScore >= 70) return { grade: "B", color: "text-blue-600", bgColor: "stroke-blue-500", label: "Good" };
    if (clampedScore >= 60) return { grade: "C", color: "text-yellow-600", bgColor: "stroke-yellow-500", label: "Fair" };
    if (clampedScore >= 50) return { grade: "D", color: "text-orange-600", bgColor: "stroke-orange-500", label: "Below Average" };
    return { grade: "F", color: "text-red-600", bgColor: "stroke-red-500", label: "Poor" };
  }, [clampedScore]);

  // Size configurations
  const sizeConfig = {
    sm: { radius: 60, strokeWidth: 8, fontSize: "text-2xl", gradeSize: "text-sm" },
    md: { radius: 80, strokeWidth: 10, fontSize: "text-4xl", gradeSize: "text-lg" },
    lg: { radius: 100, strokeWidth: 12, fontSize: "text-5xl", gradeSize: "text-xl" },
  };

  const { radius, strokeWidth, fontSize, gradeSize } = sizeConfig[size];
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Radial Progress Circle */}
      <div className="relative">
        <svg
          width={(radius + strokeWidth) * 2}
          height={(radius + strokeWidth) * 2}
          className="transform -rotate-90"
        >
          {/* Background Circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress Circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            className={bgColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1s ease-in-out",
            }}
          />
        </svg>

        {/* Score & Grade in Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold ${fontSize} ${color}`}>
            {Math.round(clampedScore)}
          </div>
          <div className={`font-semibold ${gradeSize} ${color} opacity-80`}>
            {grade}
          </div>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className="text-center">
          <p className={`font-semibold ${color}`}>{label}</p>
          <p className="text-sm text-gray-500">Financial Identity Score</p>
        </div>
      )}
    </div>
  );
}
