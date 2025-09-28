import textwrap
import sys
import os

def read_file_content(filepath):
    """Reads and returns the content of a file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        return f"// File not found: {os.path.basename(filepath)}\n"
    except Exception:
        return f"// Error reading file: {os.path.basename(filepath)}\n"

def generate_combined_markdown(cpp_path, py_path, java_path):
    """
    Reads code from C++, Python, and Java files and combines them
    into a single Markdown string.
    """
    cpp_code = read_file_content(cpp_path)
    py_code = read_file_content(py_path)
    java_code = read_file_content(java_path)

    combined_content = textwrap.dedent(f"""\
### Code Implementation

<MultiLanguageCodeBlock>

```cpp
{cpp_code.strip()}
```

```python
{py_code.strip()}
```

```java
{java_code.strip()}
```

</MultiLanguageCodeBlock>""")

    print(combined_content)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python merge_solutions.py <cpp_file> <py_file> <java_file>", file=sys.stderr)
        sys.exit(1)

    cpp_file = sys.argv[1]
    py_file = sys.argv[2]
    java_file = sys.argv[3]

    generate_combined_markdown(cpp_file, py_file, java_file)
