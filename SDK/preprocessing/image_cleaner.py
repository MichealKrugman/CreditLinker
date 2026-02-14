"""Image preprocessing for ledger photos"""

import cv2
import numpy as np


class ImageCleaner:
    """Cleans and enhances ledger images for OCR"""
    
    def process(self, image: np.ndarray) -> np.ndarray:
        """Full preprocessing pipeline"""
        gray = self._to_grayscale(image)
        deskewed = self.deskew(gray)
        denoised = self.remove_noise(deskewed)
        enhanced = self.enhance_contrast(denoised)
        binary = self.binarize(enhanced)
        clean = self.remove_lines(binary)
        return clean
    
    def _to_grayscale(self, image: np.ndarray) -> np.ndarray:
        """Convert to grayscale if needed"""
        if len(image.shape) == 3:
            return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        return image
    
    def deskew(self, image: np.ndarray) -> np.ndarray:
        """Fix rotation using Hough transform"""
        edges = cv2.Canny(image, 50, 150, apertureSize=3)
        lines = cv2.HoughLines(edges, 1, np.pi/180, 200)
        
        if lines is None:
            return image
        
        angles = [(theta * 180 / np.pi) - 90 for rho, theta in lines[:, 0]]
        median_angle = np.median(angles)
        
        if abs(median_angle) < 0.5:
            return image
        
        (h, w) = image.shape[:2]
        M = cv2.getRotationMatrix2D((w//2, h//2), median_angle, 1.0)
        return cv2.warpAffine(image, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
    
    def remove_noise(self, image: np.ndarray) -> np.ndarray:
        """Bilateral filter - preserves edges"""
        return cv2.bilateralFilter(image, 9, 75, 75)
    
    def enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """CLAHE for contrast enhancement"""
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        return clahe.apply(image)
    
    def binarize(self, image: np.ndarray) -> np.ndarray:
        """Otsu's thresholding"""
        _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return binary
    
    def remove_lines(self, image: np.ndarray) -> np.ndarray:
        """Remove ruled lines from ledger"""
        inv = cv2.bitwise_not(image)
        
        # Horizontal lines
        h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
        h_lines = cv2.morphologyEx(inv, cv2.MORPH_OPEN, h_kernel, iterations=2)
        
        # Vertical lines
        v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
        v_lines = cv2.morphologyEx(inv, cv2.MORPH_OPEN, v_kernel, iterations=2)
        
        lines = cv2.add(h_lines, v_lines)
        clean = cv2.subtract(inv, lines)
        return cv2.bitwise_not(clean)
