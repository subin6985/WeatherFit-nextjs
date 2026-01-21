"use client";

import { useState } from "react";
import EmailVerificationUI from "../../../components/SignupUI/EmailVerificationUI";
import SetPasswordUI from "../../../components/SignupUI/SetPasswordUI";
import FinishUI from "../../../components/SignupUI/FinishUI";

export default function SignupPage() {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  return (
      <>
        {step === 1 && (
            <EmailVerificationUI
                email={email}
                setEmail={setEmail}
                onComplete={() => setStep(2)}
            />
        )}

        {step === 2 && (
            <SetPasswordUI
                password={password}
                setPassword={setPassword}
                onComplete={() => setStep(3)}
            />
        )}

        {step === 3 && (
            <FinishUI
                email={email}
                password={password}
                nickname={nickname}
                setNickname={setNickname}
            />
        )}
      </>
  );
}