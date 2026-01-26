"use client";

import {useNavigationStore} from "../../../../../store/useNavigationStore";
import {useEffect} from "react";

export default function EditPasswordPage () {
  const { setCurrentPage } = useNavigationStore();

  useEffect(() => {
    setCurrentPage('password');
  }, []);

  return (
      <div>
        Password Page
      </div>
  );
}