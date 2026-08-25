import cv2
import numpy as np

class ImagePreprocessor:
    @staticmethod
    def preprocess_for_ocr(image_bytes: bytes) -> np.ndarray:
        """
        Enhances packaging label image for OCR:
        - Converts to Grayscale
        - Bilateral filtering to reduce glare while preserving text edges
        - Adaptive Gaussian Thresholding for curved/reflective plastic surfaces
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # 1. Grayscale conversion
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 2. Denoise with edge preservation
        denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

        # 3. Adaptive thresholding to handle uneven packaging shadows
        processed = cv2.adaptiveThreshold(
            denoised, 
            255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 
            31, 
            2
        )

        return processed