"""Local serialization regression tests; no model loading or transcription."""
import json
import unittest
from align import json_timestamp


class TimestampSerializationTests(unittest.TestCase):
    def test_valid_values_are_unchanged(self):
        for value in [0, 0.25, 30.24]:
            self.assertEqual(json_timestamp(value), value)

    def test_missing_and_nonfinite_are_json_null(self):
        for value in [None, float("nan"), float("inf"), -float("inf")]:
            self.assertEqual(json.dumps(json_timestamp(value), allow_nan=False), "null")

    def test_finite_invalid_bounds_are_left_for_strict_boundary_checks(self):
        self.assertEqual(json_timestamp(-1), -1)


if __name__ == "__main__":
    unittest.main()
