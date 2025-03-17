import json
import csv

def convert_jsonl_to_csv_and_json(
    jsonl_input_path, 
    csv_output_path, 
    json_output_path
):
    """
    Reads a JSONL file with at least the fields:
      'code', 'description', 'detailed_context'
    Drops 'description' and outputs two new files:
      1. A CSV with columns [code, detailed_context].
      2. A JSON file with an array of {code, detailed_context} objects.
    """

    results = []

    with open(jsonl_input_path, 'r', encoding='utf-8') as f_in, \
         open(csv_output_path, 'w', newline='', encoding='utf-8') as f_csv, \
         open(json_output_path, 'w', encoding='utf-8') as f_json:

        # Setup CSV writer
        csv_writer = csv.writer(f_csv)
        # Write CSV header
        csv_writer.writerow(["code", "detailed_context"])

        for line in f_in:
            # Each line is a JSON object
            record = json.loads(line)

            # Extract only what we need
            code = record.get("code", "")
            detailed_context = record.get("detailed_context", "")

            # Write to CSV
            csv_writer.writerow([code, detailed_context])

            # Keep track for the JSON array
            results.append({
                "code": code,
                "detailed_context": detailed_context
            })

        # Write out as a single JSON array
        json.dump(results, f_json, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    # Example usage:
    input_file = r"C:\Users\kaust\PycharmProjects\OMC_website\data\icd10_cm_code_detailed.jsonl"
    output_csv = r"C:\Users\kaust\PycharmProjects\OMC_website\data\icd10_cm_code_detailed.csv"
    output_json = r"C:\Users\kaust\PycharmProjects\OMC_website\data\icd10_cm_code_detailed.json"

    convert_jsonl_to_csv_and_json(input_file, output_csv, output_json)

    print("Conversion complete!")
