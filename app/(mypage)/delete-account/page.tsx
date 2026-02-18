"use client";

import { useState } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import { useRouter } from "next/navigation";
import Input from "../../../components/baseUI/Input";
import Button from "../../../components/baseUI/Button";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user, deleteAccount, deleteAccountGoogle } = useAuthStore();

  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const isGoogleUser = user?.providerData[0]?.providerId === "google.com";

  const handleDelete = async () => {
    // 확인 문구 체크
    if (confirmText !== "회원탈퇴") {
      alert("'회원탈퇴'를 정확히 입력해주세요.");
      return;
    }

    if (!isGoogleUser && !password) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    const confirmed = confirm(
        "정말로 탈퇴하시겠습니까?\n" +
        "모든 게시물과 데이터가 삭제되며 복구할 수 없습니다."
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      if (isGoogleUser) {
        await deleteAccountGoogle();
      } else {
        await deleteAccount(password);
      }

      alert("회원 탈퇴가 완료되었습니다.");

      router.replace("/");
    } catch (error: any) {
      alert(error.message || "회원 탈퇴에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex flex-col p-5 h-screen items-center">
        <h1 className="text-[24px] font-bold mb-5 text-red-600">
          회원 탈퇴
        </h1>

        <div className="mb-5 px-6 py-4 bg-red-50 border border-red-200 rounded-lg w-full max-w-[303px]">
          <p className="text-[14px] text-red-600 font-bold mb-2">
            ⚠️ 주의사항
          </p>
          <ul className="text-[12px] text-red-600 space-y-1">
            <li>• 모든 게시물과 댓글이 삭제됩니다.</li>
            <li>• 프로필 정보가 삭제됩니다.</li>
            <li>• 좋아요 기록이 삭제됩니다.</li>
            <li>• 삭제된 데이터는 복구할 수 없습니다.</li>
          </ul>
        </div>

        {isGoogleUser ? null : (
            <div className="mb-4 w-full max-w-[303px]">
              <label className="text-base text-[16px] mb-[5px] ml-7 block">
                비밀번호 확인
              </label>
              <div className="flex flex-col items-center">
                <Input
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="현재 비밀번호"
                />
              </div>
            </div>
          )
        }

        <div className="mb-6 w-full max-w-[303px]">
          <label className="text-base text-[16px] mb-[5px] ml-7 block">
            확인 문구 입력
          </label>
          <div className="flex flex-col items-center">
            <Input
                type="text"
                value={confirmText}
                onChange={setConfirmText}
                placeholder="회원탈퇴"
            />
          </div>
          <p className="text-[12px] text-middle mt-1 ml-7">
            * 정확히 '회원탈퇴'를 입력해주세요
          </p>
        </div>

        <div className="w-full max-w-[303px] flex flex-col items-center">
        <Button
            onClick={handleDelete}
            disabled={loading || confirmText !== "회원탈퇴"}
            isForDelete={true}
        >
          {loading ? "탈퇴 처리 중..." : "회원 탈퇴"}
        </Button>
        </div>
      </div>
  );
}