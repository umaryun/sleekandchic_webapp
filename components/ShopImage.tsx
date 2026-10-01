import Image, { type ImageProps } from "next/image";
import { isOptimizableImage } from "@/lib/images";

/** next/image that falls back to the original file for hosts it can't optimise. */
export default function ShopImage({ src, alt, ...props }: ImageProps & { src: string }) {
  return <Image src={src} alt={alt} unoptimized={!isOptimizableImage(src)} {...props} />;
}
