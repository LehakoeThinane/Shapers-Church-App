"use client";

import { useEffect, useState } from "react";
import { Image } from "react-native";
import QRCode from "qrcode";

export interface QrCodeProps {
  value: string;
  size?: number;
}

export function QrCode({ value, size = 200 }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) return null;
  return (
    // react-native's Image type has no `alt` prop (only RN-Web's runtime
    // does, via accessibilityLabel -> aria-label) — the a11y lint rule
    // can't see that, so it flags this as if the image were unlabeled.
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      source={{ uri: dataUrl }}
      style={{ width: size, height: size }}
      accessibilityLabel="Check-in QR code"
    />
  );
}
