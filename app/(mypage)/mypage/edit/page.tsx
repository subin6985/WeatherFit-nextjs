"use client";

import {useNavigationStore} from "../../../../store/useNavigationStore";
import {useEffect} from "react";

export default function EditInfoPage () {
  const { setCurrentPage } = useNavigationStore();

  useEffect(() => {
    setCurrentPage('detail');
  }, []);

  return (
      <div>
        Edit Page
      </div>
  );
}