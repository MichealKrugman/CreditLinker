"""
Evaluation module for trained models.
Provides metrics and validation for OCR model performance.
"""

from typing import Dict, List, Tuple, Optional
import numpy as np
from pathlib import Path
import json


class ModelEvaluator:
    """Evaluate OCR model performance."""
    
    def __init__(self):
        self.metrics = {}
    
    def calculate_character_accuracy(
        self, 
        predictions: List[str], 
        ground_truths: List[str]
    ) -> float:
        """
        Calculate character-level accuracy.
        
        Args:
            predictions: List of predicted text
            ground_truths: List of ground truth text
            
        Returns:
            Character accuracy as percentage
        """
        total_chars = 0
        correct_chars = 0
        
        for pred, gt in zip(predictions, ground_truths):
            total_chars += len(gt)
            correct_chars += sum(p == g for p, g in zip(pred, gt))
        
        return (correct_chars / total_chars * 100) if total_chars > 0 else 0.0
    
    def calculate_word_accuracy(
        self, 
        predictions: List[str], 
        ground_truths: List[str]
    ) -> float:
        """
        Calculate word-level accuracy.
        
        Args:
            predictions: List of predicted text
            ground_truths: List of ground truth text
            
        Returns:
            Word accuracy as percentage
        """
        correct = sum(pred == gt for pred, gt in zip(predictions, ground_truths))
        return (correct / len(predictions) * 100) if predictions else 0.0
    
    def calculate_edit_distance(self, pred: str, gt: str) -> int:
        """
        Calculate Levenshtein distance between two strings.
        
        Args:
            pred: Predicted string
            gt: Ground truth string
            
        Returns:
            Edit distance
        """
        m, n = len(pred), len(gt)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        
        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j
        
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if pred[i-1] == gt[j-1]:
                    dp[i][j] = dp[i-1][j-1]
                else:
                    dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
        
        return dp[m][n]
    
    def calculate_average_edit_distance(
        self, 
        predictions: List[str], 
        ground_truths: List[str]
    ) -> float:
        """
        Calculate average edit distance across all predictions.
        
        Args:
            predictions: List of predicted text
            ground_truths: List of ground truth text
            
        Returns:
            Average edit distance
        """
        distances = [
            self.calculate_edit_distance(pred, gt) 
            for pred, gt in zip(predictions, ground_truths)
        ]
        return np.mean(distances) if distances else 0.0
    
    def evaluate_detection(
        self,
        predicted_boxes: List[List[Tuple[int, int]]],
        ground_truth_boxes: List[List[Tuple[int, int]]],
        iou_threshold: float = 0.5
    ) -> Dict[str, float]:
        """
        Evaluate text detection performance.
        
        Args:
            predicted_boxes: List of predicted bounding boxes per image
            ground_truth_boxes: List of ground truth bounding boxes per image
            iou_threshold: IoU threshold for matching boxes
            
        Returns:
            Dictionary with precision, recall, f1-score
        """
        total_tp = 0
        total_fp = 0
        total_fn = 0
        
        for pred_boxes, gt_boxes in zip(predicted_boxes, ground_truth_boxes):
            matched_gt = set()
            
            for pred_box in pred_boxes:
                best_iou = 0
                best_gt_idx = -1
                
                for idx, gt_box in enumerate(gt_boxes):
                    if idx in matched_gt:
                        continue
                    
                    iou = self._calculate_iou(pred_box, gt_box)
                    if iou > best_iou:
                        best_iou = iou
                        best_gt_idx = idx
                
                if best_iou >= iou_threshold:
                    total_tp += 1
                    matched_gt.add(best_gt_idx)
                else:
                    total_fp += 1
            
            total_fn += len(gt_boxes) - len(matched_gt)
        
        precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0
        recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            "precision": precision * 100,
            "recall": recall * 100,
            "f1_score": f1 * 100,
            "true_positives": total_tp,
            "false_positives": total_fp,
            "false_negatives": total_fn
        }
    
    def _calculate_iou(
        self, 
        box1: List[Tuple[int, int]], 
        box2: List[Tuple[int, int]]
    ) -> float:
        """
        Calculate Intersection over Union (IoU) for two boxes.
        
        Args:
            box1: First box coordinates [(x1,y1), (x2,y2), (x3,y3), (x4,y4)]
            box2: Second box coordinates
            
        Returns:
            IoU value between 0 and 1
        """
        # Convert to bounding rectangles
        x1_min = min(p[0] for p in box1)
        y1_min = min(p[1] for p in box1)
        x1_max = max(p[0] for p in box1)
        y1_max = max(p[1] for p in box1)
        
        x2_min = min(p[0] for p in box2)
        y2_min = min(p[1] for p in box2)
        x2_max = max(p[0] for p in box2)
        y2_max = max(p[1] for p in box2)
        
        # Calculate intersection
        x_inter_min = max(x1_min, x2_min)
        y_inter_min = max(y1_min, y2_min)
        x_inter_max = min(x1_max, x2_max)
        y_inter_max = min(y1_max, y2_max)
        
        if x_inter_max < x_inter_min or y_inter_max < y_inter_min:
            return 0.0
        
        intersection = (x_inter_max - x_inter_min) * (y_inter_max - y_inter_min)
        
        # Calculate union
        area1 = (x1_max - x1_min) * (y1_max - y1_min)
        area2 = (x2_max - x2_min) * (y2_max - y2_min)
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def evaluate_end_to_end(
        self,
        predictions: List[str],
        ground_truths: List[str],
        predicted_boxes: Optional[List[List[Tuple[int, int]]]] = None,
        ground_truth_boxes: Optional[List[List[Tuple[int, int]]]] = None
    ) -> Dict[str, float]:
        """
        Comprehensive evaluation of full OCR pipeline.
        
        Args:
            predictions: Predicted text strings
            ground_truths: Ground truth text strings
            predicted_boxes: Optional detection boxes
            ground_truth_boxes: Optional ground truth boxes
            
        Returns:
            Dictionary with all metrics
        """
        results = {
            "word_accuracy": self.calculate_word_accuracy(predictions, ground_truths),
            "character_accuracy": self.calculate_character_accuracy(predictions, ground_truths),
            "average_edit_distance": self.calculate_average_edit_distance(predictions, ground_truths),
            "total_samples": len(predictions)
        }
        
        if predicted_boxes is not None and ground_truth_boxes is not None:
            detection_metrics = self.evaluate_detection(
                predicted_boxes, 
                ground_truth_boxes
            )
            results.update({f"detection_{k}": v for k, v in detection_metrics.items()})
        
        return results
    
    def save_results(self, results: Dict, output_path: Path):
        """
        Save evaluation results to JSON file.
        
        Args:
            results: Evaluation metrics dictionary
            output_path: Path to save results
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
    
    def print_results(self, results: Dict):
        """
        Pretty print evaluation results.
        
        Args:
            results: Evaluation metrics dictionary
        """
        print("\n" + "="*50)
        print("EVALUATION RESULTS")
        print("="*50)
        
        for key, value in results.items():
            if isinstance(value, float):
                print(f"{key:.<40} {value:.2f}")
            else:
                print(f"{key:.<40} {value}")
        
        print("="*50 + "\n")


def evaluate_model(
    model_path: Path,
    test_dataset_path: Path,
    output_path: Optional[Path] = None
) -> Dict[str, float]:
    """
    Convenience function to evaluate a trained model.
    
    Args:
        model_path: Path to trained model
        test_dataset_path: Path to test dataset
        output_path: Optional path to save results
        
    Returns:
        Evaluation metrics dictionary
    """
    evaluator = ModelEvaluator()
    
    # Load model and dataset
    # TODO: Implement model loading and prediction
    
    # Placeholder for actual evaluation
    results = {
        "word_accuracy": 0.0,
        "character_accuracy": 0.0,
        "average_edit_distance": 0.0
    }
    
    evaluator.print_results(results)
    
    if output_path:
        evaluator.save_results(results, output_path)
    
    return results
