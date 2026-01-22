"use client";

import {useEffect, useState} from "react";
import StepOneUI from "../../../components/WriteUI/StepOneUI";
import StepTwoUI from "../../../components/WriteUI/StepTwoUI";
import {useWriteStore} from "../../../store/useWriteStore";
import {useNavigationStore} from "../../../store/useNavigationStore";

export default function WritePage() {
  const { step, setStep, resetStep } = useWriteStore();
  const { setCurrentPage } = useNavigationStore();

  const [file, setFile] = useState<File | null>(null);
  const [outfitRegion, setOutfitRegion] = useState("");
  const [outfitDate, setOutfitDate] = useState<Date | null>(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    resetStep();
    setCurrentPage('write');
  }, []);

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