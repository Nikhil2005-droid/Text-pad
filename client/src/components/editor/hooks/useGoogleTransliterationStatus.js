import { useEffect, useState } from "react";
import { getTransliterationStatusAPI } from "../../../api.js";

export function useGoogleTransliterationStatus() {
  const [googleTransliterationStatus, setGoogleTransliterationStatus] = useState({
    checked: false,
    configured: false,
    supportedLanguages: [],
  });

  useEffect(() => {
    let isActive = true;

    getTransliterationStatusAPI()
      .then((data) => {
        if (!isActive) return;
        setGoogleTransliterationStatus({
          checked: true,
          configured: Boolean(data?.configured),
          supportedLanguages: Array.isArray(data?.supportedLanguages)
            ? data.supportedLanguages
            : [],
        });
      })
      .catch(() => {
        if (!isActive) return;
        setGoogleTransliterationStatus({
          checked: true,
          configured: false,
          supportedLanguages: [],
        });
      });

    return () => {
      isActive = false;
    };
  }, []);

  return googleTransliterationStatus;
}
