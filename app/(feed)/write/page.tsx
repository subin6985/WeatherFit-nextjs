"use client";

import { useState } from "react";
import StepOneUI from "../../../components/WriteUI/StepOneUI";
import StepTwoUI from "../../../components/WriteUI/StepTwoUI";

export default function WritePage() {
  const [step, setStep] = useState(1);

  const [file, setFile] = useState<File>(null);
  const [outfitRegion, setOutfitRegion] = useState("");
  const [outfitDate, setOutfitDate] = useState<Date>(null);
  const [content, setContent] = useState("");

  return (
      <>
        {step === 1 && (
            <StepOneUI
                file={file}
                setFile={setFile}
                onComplete={() => setStep(2)}
            />
        )}

        {step === 2 && (
            <StepTwoUI
                file={file}
                outfitRegion={outfitRegion}
                setOutfitRegion={setOutfitRegion}
                outfitDate={outfitDate}
                setOutfitDate={setOutfitDate}
                content={content}
                setContent={setContent}
            />
        )}
      </>
  );
}