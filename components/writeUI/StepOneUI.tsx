"use client";

import {useEffect, useRef, useState} from "react";
import SmallButton from "../baseUI/SmallButton";

interface StepOneUIProps {
  file: File | null;
  setFile: (file: File | null) => void;
  onComplete: () => void;
}

export default function StepOneUI({file, setFile, onComplete}: StepOneUIProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [disable, setDisable] = useState(true);
  const [imageHeight, setImageHeight] = useState<number>(393); // 기본 높이

  // 이미지 크기 계산
  useEffect(() => {
    if (!file) {
      setImageHeight(393);
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const aspectRatio = img.height / img.width;

      // 최소 1:1, 최대 4:5
      const minHeight = 393;
      const maxHeight = 491;

      const calculatedHeight = 393 * aspectRatio;
      const finalHeight = Math.min(Math.max(calculatedHeight, minHeight), maxHeight);

      setImageHeight(finalHeight);
    };
  }, [file]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  }

  const handleFileChange = (e:React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        alert("이미지 파일만 업로드할 수 있습니다.");
        return;
      }
      setFile(selectedFile);
      setDisable(false);
    }
  }

  const handleNext = () => {
    if (!file) {
      alert("이미지를 선택해주세요.");
      return;
    }
    onComplete();
  }

  return (
      <div className="flex flex-col">
        <div
          onClick={handleImageClick}
          className="group w-full bg-light
                      flex items-center justify-center cursor-pointer
                      relative overflow-hidden"
          style={{ height: `${imageHeight}px` }}
        >
          {file ? (
              <img
                src={URL.createObjectURL(file)}
                alt="첨부할 이미지"
                className="w-full h-full object-cover"
              />
          ) : (
              <div className="flex flex-col items-center">
                <img
                    src="/Add_circle.png"
                    alt="이미지 첨부"
                    className="w-[65px] h-[65px] group-hover:scale-95 transition-all duration-100 ease-in-out"
                />
              </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex mt-[17px] mr-[20px] justify-end">
          <SmallButton onClick={handleNext} disabled={disable}>선택 완료</SmallButton>
        </div>
      </div>
  );
}