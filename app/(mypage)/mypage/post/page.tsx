"use client";

import {useNavigationStore} from "../../../../store/useNavigationStore";
import {useEffect} from "react";

export default function MyPostPage () {
  const { setCurrentPage } = useNavigationStore();

  useEffect(() => {
    setCurrentPage('detail');
  }, []);

  return (
      <div>
        Post Page
      </div>
  );
}