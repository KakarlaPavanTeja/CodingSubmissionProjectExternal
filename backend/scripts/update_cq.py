# File: backend/scripts/update_cq.py
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
    if total_score < n * min_weight: raise ValueError(f"Total score {total_score} is too small.")
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

def main(existing_json_path, lua_path, testcases_path):
    try:
        with open(existing_json_path, 'r', encoding='utf-8') as f: existing_json_data = json.load(f)
        with open(lua_path, 'r', encoding='utf-8') as f: lua_content = f.read()
        with open(testcases_path, 'r', encoding='utf-8') as f: new_test_cases_data = json.load(f)

        difficulty_level = parse_section(lua_content, "----------QUESTION_LEVEL_START----------", "----------QUESTION_LEVEL_END----------")
        new_test_cases_with_weights = assign_weights(parse_test_cases(new_test_cases_data[0]), difficulty_level)

        if len(existing_json_data[0]['test_cases']) == len(new_test_cases_with_weights):
            for i, tc in enumerate(new_test_cases_with_weights):
                tc['id'] = existing_json_data[0]['test_cases'][i]['id']

        target_question = existing_json_data[0]
        target_question['test_cases'] = new_test_cases_with_weights
        target_question['total_score'] = {"EASY": 20, "MEDIUM": 25, "HARD": 30}.get(difficulty_level.upper())
        target_question['question']['difficulty'] = difficulty_level
        target_question['question']['content'] = parse_section(lua_content, "----------QUESTION_DESCRIPTION_START----------", "----------QUESTION_DESCRIPTION_END----------")
        target_question['question']['short_text'] = parse_section(lua_content, "----------SHORT_TEXT_START----------", "----------SHORT_TEXT_END----------")

        for detail in target_question['coding_question_details']:
            if detail['language'] == 'CPP': detail['code_content'] = parse_section(lua_content, "----------CODE_CONTENT_CPP_START----------", "----------CODE_CONTENT_CPP_END----------")
            elif detail['language'] == 'PYTHON39': detail['code_content'] = parse_section(lua_content, "----------CODE_CONTENT_PYTHON_START----------", "----------CODE_CONTENT_PYTHON_END----------")
            elif detail['language'] == 'JAVA': detail['code_content'] = parse_section(lua_content, "----------CODE_CONTENT_JAVA_START----------", "----------CODE_CONTENT_JAVA_END----------")

        for repo in target_question['language_code_repository_details']:
            if repo['language'] == 'CPP': repo['code_repository'][0]['file_content'] = encode_code_to_base64(parse_section(lua_content, "----------CODE_BASE64_CPP_START----------", "----------CODE_BASE64_CPP_END----------"))
            elif repo['language'] == 'PYTHON39': repo['code_repository'][0]['file_content'] = encode_code_to_base64(parse_section(lua_content, "----------CODE_BASE64_PYTHON_START----------", "----------CODE_BASE64_PYTHON_END----------"))
            elif repo['language'] == 'JAVA': repo['code_repository'][0]['file_content'] = encode_code_to_base64(parse_section(lua_content, "----------CODE_BASE64_JAVA_START----------", "----------CODE_BASE64_JAVA_END----------"))

        # Instead of writing to a file, print the JSON to standard output for the Node.js server.
        print(json.dumps(existing_json_data, indent=4))
    except Exception as e:
        print(f"Error in update_cq.py: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python update_cq.py <existing_json_path> <lua_path> <testcases_path>", file=sys.stderr)
        sys.exit(1)
    main(sys.argv[1], sys.argv[2], sys.argv[3])