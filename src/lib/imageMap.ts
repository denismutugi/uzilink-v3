import type React from "react";
import heroImg from "../assets/images/hero_kenyan_textile_1790988200150.jpg";
import scrapsImg from "../assets/images/scraps_transformation_1790988212084.jpg";
import collectionImg from "../assets/images/kenyan_textile_collection_1790988223725.jpg";
import denimImg from "../assets/images/denim_textile_scraps_1791049107969.jpg";
import cottonImg from "../assets/images/cotton_jersey_scraps_1791049120724.jpg";
import fleeceImg from "../assets/images/synthetic_fleece_scraps_1791049134251.jpg";
import clothingImg from "../assets/images/used_clothing_bales_1791049152076.jpg";
import industrialImg from "../assets/images/industrial_textile_waste_1791049166827.jpg";

export { 
  heroImg, 
  scrapsImg, 
  collectionImg, 
  denimImg, 
  cottonImg, 
  fleeceImg, 
  clothingImg, 
  industrialImg 
};

export const categoryImages: Record<string, string> = {
  Denim: denimImg,
  denim: denimImg,
  Cotton: cottonImg,
  cotton: cottonImg,
  Synthetic: fleeceImg,
  synthetic: fleeceImg,
  Fleece: fleeceImg,
  fleece: fleeceImg,
  "Used clothing": clothingImg,
  "used clothing": clothingImg,
  Mitumba: clothingImg,
  mitumba: clothingImg,
  "Textile scraps": scrapsImg,
  "textile scraps": scrapsImg,
  "Industrial textile waste": industrialImg,
  "industrial textile waste": industrialImg,
  "Mixed textile": collectionImg,
  "mixed textile": collectionImg,
  "Linen & Canvas": scrapsImg,
  "linen & canvas": scrapsImg,
  Other: heroImg,
  other: heroImg,
};

const imageLookup: Record<string, string> = {
  hero: heroImg,
  "hero_kenyan_textile": heroImg,
  "hero_kenyan_textile_1790988200150.jpg": heroImg,
  "/assets/images/hero_kenyan_textile_1790988200150.jpg": heroImg,
  "/hero_kenyan_textile_1790988200150.jpg": heroImg,

  scraps: scrapsImg,
  "scraps_transformation": scrapsImg,
  "scraps_transformation_1790988212084.jpg": scrapsImg,
  "/assets/images/scraps_transformation_1790988212084.jpg": scrapsImg,
  "/scraps_transformation_1790988212084.jpg": scrapsImg,

  collection: collectionImg,
  "kenyan_textile_collection": collectionImg,
  "kenyan_textile_collection_1790988223725.jpg": collectionImg,
  "/assets/images/kenyan_textile_collection_1790988223725.jpg": collectionImg,
  "/kenyan_textile_collection_1790988223725.jpg": collectionImg,

  denim: denimImg,
  "denim_textile_scraps": denimImg,
  "denim_textile_scraps_1791049107969.jpg": denimImg,
  "/assets/images/denim_textile_scraps_1791049107969.jpg": denimImg,
  "/denim_textile_scraps_1791049107969.jpg": denimImg,

  cotton: cottonImg,
  "cotton_jersey_scraps": cottonImg,
  "cotton_jersey_scraps_1791049120724.jpg": cottonImg,
  "/assets/images/cotton_jersey_scraps_1791049120724.jpg": cottonImg,
  "/cotton_jersey_scraps_1791049120724.jpg": cottonImg,

  fleece: fleeceImg,
  synthetic: fleeceImg,
  "synthetic_fleece_scraps": fleeceImg,
  "synthetic_fleece_scraps_1791049134251.jpg": fleeceImg,
  "/assets/images/synthetic_fleece_scraps_1791049134251.jpg": fleeceImg,
  "/synthetic_fleece_scraps_1791049134251.jpg": fleeceImg,

  clothing: clothingImg,
  mitumba: clothingImg,
  "used_clothing_bales": clothingImg,
  "used_clothing_bales_1791049152076.jpg": clothingImg,
  "/assets/images/used_clothing_bales_1791049152076.jpg": clothingImg,
  "/used_clothing_bales_1791049152076.jpg": clothingImg,

  industrial: industrialImg,
  "industrial_textile_waste": industrialImg,
  "industrial_textile_waste_1791049166827.jpg": industrialImg,
  "/assets/images/industrial_textile_waste_1791049166827.jpg": industrialImg,
  "/industrial_textile_waste_1791049166827.jpg": industrialImg,

  // Replace legacy artisan workshop image with proper circular collection image
  artisan: collectionImg,
  artisans: collectionImg,
  "artisans_workshop": collectionImg,
  "artisans_workshop_1790988232395.jpg": collectionImg,
  "/assets/images/artisans_workshop_1790988232395.jpg": collectionImg,
};

/**
 * Returns a specific, realistic default image tailored to the material or category
 */
export function getDefaultImageForCategory(category?: string, material?: string): string {
  if (category && categoryImages[category]) {
    return categoryImages[category];
  }

  const matLower = `${material || ""} ${category || ""}`.toLowerCase();
  if (matLower.includes("denim") || matLower.includes("jean") || matLower.includes("twill")) return denimImg;
  if (matLower.includes("cotton") || matLower.includes("jersey") || matLower.includes("tee")) return cottonImg;
  if (matLower.includes("fleece") || matLower.includes("poly") || matLower.includes("pet") || matLower.includes("synthetic")) return fleeceImg;
  if (matLower.includes("clothing") || matLower.includes("mitumba") || matLower.includes("bale") || matLower.includes("garment")) return clothingImg;
  if (matLower.includes("industrial") || matLower.includes("offcut") || matLower.includes("factory") || matLower.includes("strip")) return industrialImg;
  if (matLower.includes("scrap") || matLower.includes("cutting") || matLower.includes("remnant")) return scrapsImg;
  if (matLower.includes("mix") || matLower.includes("shoddy") || matLower.includes("collection")) return collectionImg;

  return denimImg;
}

/**
 * Resolves any image URL string (relative, bundled, base64, or remote)
 * with category/material context to prevent duplicate images across listings.
 */
export function resolveImageUrl(url?: string | null, category?: string, material?: string): string {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return getDefaultImageForCategory(category, material);
  }

  const clean = url.trim();

  // If this was the dummy test placeholder (a short base64 test dummy that contaminated mock listings),
  // discard it and use the proper category-specific photo!
  if (clean.startsWith("data:") && (clean.length < 2500 || clean.includes("2wCEAAkGBxMSEhUTEhIW"))) {
    return getDefaultImageForCategory(category, material);
  }

  // If real user-uploaded base64 data URL or external https URL, use it directly
  if (clean.startsWith("data:") || clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  // Check lookup table for exact or filename match
  if (imageLookup[clean]) {
    return imageLookup[clean];
  }

  // Check partial key matches
  if (clean.includes("denim")) return denimImg;
  if (clean.includes("cotton") || clean.includes("jersey")) return cottonImg;
  if (clean.includes("fleece") || clean.includes("synthetic")) return fleeceImg;
  if (clean.includes("used_clothing") || clean.includes("clothing") || clean.includes("mitumba")) return clothingImg;
  if (clean.includes("industrial")) return industrialImg;
  if (clean.includes("scraps")) return scrapsImg;
  if (clean.includes("collection")) return collectionImg;
  if (clean.includes("artisan")) return collectionImg;
  if (clean.includes("hero")) return heroImg;

  // If url was a generic fallback, match by category/material
  if (category || material) {
    return getDefaultImageForCategory(category, material);
  }

  return clean.startsWith("/") ? clean : `/${clean}`;
}

/**
 * Universal image error fallback handler to attach to <img onError={...} />
 * Intelligently falls back to category-appropriate textile image instead of forcing everything to the same image.
 */
export function handleImageFallback(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.dataset.triedFallback) return;
  target.dataset.triedFallback = "true";
  
  const cat = target.dataset.category || "";
  const mat = target.dataset.material || "";
  target.src = getDefaultImageForCategory(cat, mat);
}
