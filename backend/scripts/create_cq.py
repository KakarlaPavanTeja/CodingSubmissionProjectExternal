# File: backend/scripts/create_cq.py
import json, uuid, base64, re, random, copy, sys

def parse_test_cases(test_cases_data):
    test_cases = []
    order_update = 1
    for tc in test_cases_data["test_cases"]:
        test_case = {
            "id": str(uuid.uuid4()), "input": tc["input"], "output": tc.get("output", ""),
            "is_hidden": order_update > 2, "weightage": None, "evaluation_type": "DEFAULT",
            "display_text": None, "criteria": None, "tags": [], "order": order_update
        }
        if "multiple_possible_output" in tc and tc["multiple_possible_output"]:
            test_case["multiple_possible_output"] = True
            test_case["outputs"] = tc["outputs"]
        test_cases.append(test_case)
        order_update += 1
    return test_cases

def assign_weights(test_cases, difficulty_level):
    level = difficulty_level.strip().upper()
    totals = {"EASY": 20, "MEDIUM": 25, "HARD": 30}
    if level not in totals: raise ValueError(f"Unknown difficulty level: {difficulty_level}")
    total_score = totals[level]
    n = len(test_cases)
    if n == 0: return test_cases
    min_weight = 0.1
    if total_score < n * min_weight: raise ValueError(f"Total score {total_score} too small.")
    weights = [min_weight] * n
    remaining = total_score - n * min_weight
    random_parts = [random.random() for _ in range(n)]
    total_parts = sum(random_parts) if sum(random_parts) > 0 else 1
    for i in range(n):
        extra = (random_parts[i] / total_parts) * remaining
        weights[i] = round(weights[i] + extra, 2)
    diff = round(total_score - sum(weights), 2)
    weights[-1] = round(weights[-1] + diff, 2)
    for i, tc in enumerate(test_cases): tc["weightage"] = weights[i]
    return test_cases

def parse_section(content, start_marker, end_marker):
    try:
        start_index = content.find(start_marker) + len(start_marker)
        end_index = content.find(end_marker, start_index)
        return content[start_index:end_index].strip()
    except (ValueError, IndexError): return ""

def encode_code_to_base64(code):
    return base64.b64encode(code.encode()).decode()

def main(lua_filename, testcases_filename):
    try:
        with open(lua_filename, 'r', encoding='utf-8') as file: content = file.read()
        with open(testcases_filename, 'r', encoding='utf-8') as tc_file: test_cases_data = json.load(tc_file)

        difficulty_level = parse_section(content, "----------QUESTION_LEVEL_START----------", "----------QUESTION_LEVEL_END----------")
        test_cases = assign_weights(parse_test_cases(test_cases_data[0]), difficulty_level)
        question_id = str(uuid.uuid4())
        coding_details_id = str(uuid.uuid4())
        solution_id = str(uuid.uuid4())

        json_data = [{
            "test_cases": test_cases, "total_score": {"EASY": 20, "MEDIUM": 25, "HARD": 30}[difficulty_level],
            "question_type": "CODING", "question_asked_by_companies_info": [],
            "question": {
                "difficulty": difficulty_level,
                "content": parse_section(content, "----------QUESTION_DESCRIPTION_START----------", "----------QUESTION_DESCRIPTION_END----------"),
                "short_text": parse_section(content, "----------SHORT_TEXT_START----------", "----------SHORT_TEXT_END----------"),
                "multimedia": [], "language": "ENGLISH", "content_type": "MARKDOWN",
                "question_id": question_id, "default_tag_names": [], "concept_tag_names": [], "metadata": None
            },
            "coding_question_details": [
                {"code_content": parse_section(content, "----------CODE_CONTENT_CPP_START----------", "----------CODE_CONTENT_CPP_END----------"), "default_code": True, "language": "CPP", "code_id": coding_details_id, "is_function_based": True},
                {"code_content": parse_section(content, "----------CODE_CONTENT_PYTHON_START----------", "----------CODE_CONTENT_PYTHON_END----------"), "default_code": False, "language": "PYTHON39", "code_id": coding_details_id, "is_function_based": True},
                {"code_content": parse_section(content, "----------CODE_CONTENT_JAVA_START----------", "----------CODE_CONTENT_JAVA_END----------"), "default_code": False, "language": "JAVA", "code_id": coding_details_id, "is_function_based": True}
            ],
            "language_code_repository_details": [
                {"language": "CPP", "file_path_to_execute": "main.cpp", "default_file_path_to_submit_code": "solution.cpp", "code_repository": [{"file_name": "main.cpp", "file_type": "FILE", "file_content": encode_code_to_base64(parse_section(content, "----------CODE_BASE64_CPP_START----------", "----------CODE_BASE64_CPP_END----------"))}]},
                {"language": "PYTHON39", "file_path_to_execute": "main.py", "default_file_path_to_submit_code": "solution.py", "code_repository": [{"file_name": "main.py", "file_type": "FILE", "file_content": encode_code_to_base64(parse_section(content, "----------CODE_BASE64_PYTHON_START----------", "----------CODE_BASE64_PYTHON_END----------"))}]},
                {"language": "JAVA", "file_path_to_execute": "Main.java", "default_file_path_to_submit_code": "Solution.java", "code_repository": [{"file_name": "Main.java", "file_type": "FILE", "file_content": encode_code_to_base64(parse_section(content, "----------CODE_BASE64_JAVA_START----------", "----------CODE_BASE64_JAVA_END----------"))}]}
            ],
            "solutions": [], "hints": [], "code_repository_details": None,
            "test_case_evaluation_metrics": [
                {"language": "CPP", "time_limit_to_execute_in_seconds": 1.0},
                {"language": "PYTHON39", "time_limit_to_execute_in_seconds": 4.0},
                {"language": "JAVA", "time_limit_to_execute_in_seconds": 2.0}
            ]
        }]
        # Instead of writing to a file, print the JSON to standard output for the Node.js server.
        print(json.dumps(json_data, indent=4))
    except Exception as e:
        print(f"Error in create_cq.py: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python create_cq.py <lua_file_path> <testcases_file_path>", file=sys.stderr)
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])