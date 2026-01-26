"use client";

import {useNavigationStore} from "../../../../store/useNavigationStore";
import {useEffect} from "react";

export default function LikePage () {
  const { setCurrentPage } = useNavigationStore();

  useEffect(() => {
    setCurrentPage('detail');
  }, []);

  return (
      <div>
        Like Page
      </div>
  );
}