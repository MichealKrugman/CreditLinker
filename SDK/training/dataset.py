"""
OCR Dataset - Data loading and preprocessing for training
"""

from typing import List, Tuple, Optional
import numpy as np
from pathlib import Path
import json


class OCRDataset:
    """
    Dataset class for OCR training
    
    Handles loading images and labels for detection/recognition training.
    """
    
    def __init__(
        self,
        data_dir: str,
        mode: str = 'train',
        task: str = 'recognition'  # 'detection' or 'recognition'
    ):
        """
        Initialize OCR dataset
        
        Args:
            data_dir: Directory containing images and labels
            mode: 'train', 'val', or 'test'
            task: 'detection' or 'recognition'
        """
        self.data_dir = Path(data_dir)
        self.mode = mode
        self.task = task
        
        self.images_dir = self.data_dir / mode / 'images'
        self.labels_dir = self.data_dir / mode / 'labels'
        
        self.samples = self._load_samples()
    
    def _load_samples(self) -> List[Tuple[Path, dict]]:
        """
        Load all samples from dataset
        
        Returns:
            List of (image_path, label_data) tuples
        """
        samples = []
        
        if not self.images_dir.exists():
            raise FileNotFoundError(f"Images directory not found: {self.images_dir}")
        
        # Load all image files
        image_files = sorted(self.images_dir.glob('*.jpg')) + \
                     sorted(self.images_dir.glob('*.png'))
        
        for img_path in image_files:
            # Find corresponding label file
            label_path = self.labels_dir / f"{img_path.stem}.json"
            
            if label_path.exists():
                with open(label_path, 'r') as f:
                    label_data = json.load(f)
                samples.append((img_path, label_data))
            else:
                print(f"Warning: No label found for {img_path.name}")
        
        return samples
    
    def __len__(self) -> int:
        """Get dataset size"""
        return len(self.samples)
    
    def __getitem__(self, idx: int) -> Tuple[np.ndarray, dict]:
        """
        Get a sample from dataset
        
        Args:
            idx: Sample index
            
        Returns:
            Tuple of (image, label_data)
        """
        import cv2
        
        img_path, label_data = self.samples[idx]
        
        # Load image
        image = cv2.imread(str(img_path))
        if image is None:
            raise ValueError(f"Failed to load image: {img_path}")
        
        # Convert BGR to RGB
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        return image, label_data
    
    def get_batch(self, indices: List[int]) -> Tuple[List[np.ndarray], List[dict]]:
        """
        Get a batch of samples
        
        Args:
            indices: List of sample indices
            
        Returns:
            Tuple of (images, labels)
        """
        images = []
        labels = []
        
        for idx in indices:
            img, label = self[idx]
            images.append(img)
            labels.append(label)
        
        return images, labels
    
    @staticmethod
    def create_label_file(
        image_path: str,
        boxes: Optional[List[List[int]]] = None,
        texts: Optional[List[str]] = None,
        output_path: Optional[str] = None
    ):
        """
        Create a label file for an image
        
        Args:
            image_path: Path to image file
            boxes: List of bounding boxes [[x1,y1,x2,y2,x3,y3,x4,y4], ...]
            texts: List of text labels
            output_path: Where to save label file (default: same dir as image)
        """
        label_data = {
            'image': str(image_path),
            'boxes': boxes or [],
            'texts': texts or [],
        }
        
        if output_path is None:
            img_path = Path(image_path)
            output_path = img_path.parent / f"{img_path.stem}.json"
        
        with open(output_path, 'w') as f:
            json.dump(label_data, f, indent=2)
    
    def split(
        self,
        train_ratio: float = 0.8,
        val_ratio: float = 0.1,
        test_ratio: float = 0.1,
        seed: int = 42
    ) -> Tuple['OCRDataset', 'OCRDataset', 'OCRDataset']:
        """
        Split dataset into train/val/test
        
        Args:
            train_ratio: Proportion for training
            val_ratio: Proportion for validation
            test_ratio: Proportion for testing
            seed: Random seed
            
        Returns:
            Tuple of (train_dataset, val_dataset, test_dataset)
        """
        import random
        
        assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, \
            "Ratios must sum to 1.0"
        
        random.seed(seed)
        indices = list(range(len(self)))
        random.shuffle(indices)
        
        n_train = int(len(indices) * train_ratio)
        n_val = int(len(indices) * val_ratio)
        
        train_indices = indices[:n_train]
        val_indices = indices[n_train:n_train + n_val]
        test_indices = indices[n_train + n_val:]
        
        # Create subset datasets
        train_dataset = OCRDataset.__new__(OCRDataset)
        train_dataset.__dict__.update(self.__dict__)
        train_dataset.samples = [self.samples[i] for i in train_indices]
        train_dataset.mode = 'train'
        
        val_dataset = OCRDataset.__new__(OCRDataset)
        val_dataset.__dict__.update(self.__dict__)
        val_dataset.samples = [self.samples[i] for i in val_indices]
        val_dataset.mode = 'val'
        
        test_dataset = OCRDataset.__new__(OCRDataset)
        test_dataset.__dict__.update(self.__dict__)
        test_dataset.samples = [self.samples[i] for i in test_indices]
        test_dataset.mode = 'test'
        
        return train_dataset, val_dataset, test_dataset
