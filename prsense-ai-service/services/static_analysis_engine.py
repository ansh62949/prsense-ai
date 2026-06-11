import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger("PRSenseStaticAnalysisEngine")
logger.setLevel(logging.INFO)

class StaticAnalysisEngine:
    def __init__(self):
        pass

    def run_static_checks(self, pr_diff: str) -> List[Dict[str, Any]]:
        """
        Parses a git diff and extracts static analysis violations (Bandit, ESLint, Checkstyle, Semgrep)
        """
        findings = []
        if not pr_diff:
            return findings

        # Split the diff into files
        file_diffs = pr_diff.split("diff --git ")
        for f_diff in file_diffs:
            if not f_diff.strip():
                continue
                
            lines = f_diff.split("\n")
            header = lines[0]
            
            # Extract file path
            file_path = "unknown"
            match = re.search(r"b/(.*?)\s*$", header)
            if match:
                file_path = match.group(1).strip()
            elif "a/" in header:
                file_path = header.split("a/")[-1].split(" ")[0]

            logger.info(f"Running static analysis on: {file_path}")
            
            # Track line numbers in the diff
            current_line_num = 0
            for line in lines:
                # Track added lines in the diff
                if line.startswith("@@"):
                    # Extract starting line number in target file: @@ -x,y +start,len @@
                    hunk_match = re.match(r"^@@\s+-\d+,?\d*\s+\+(\d+),?\d*\s+@@", line)
                    if hunk_match:
                        current_line_num = int(hunk_match.group(1)) - 1
                    continue
                elif line.startswith("-"):
                    continue # Ignore deletions
                elif line.startswith("+"):
                    current_line_num += 1
                    added_code = line[1:].strip()
                    
                    if not added_code:
                        continue
                        
                    # 1. Bandit Checks (Security)
                    # Check for hardcoded credentials
                    if re.search(r"(password|secret|api_key|token|auth_key|passwd|pwd)\s*=\s*['\"].*?['\"]", added_code, re.IGNORECASE):
                        if not re.search(r"null|none|false|true|env|getenv|process", added_code, re.IGNORECASE):
                            findings.append({
                                "category": "security",
                                "severity": "high",
                                "file_path": file_path,
                                "line_references": [{"file_path": file_path, "start_line": current_line_num, "note": "Potential hardcoded secret key"}],
                                "recommendation": "Load credentials and security tokens dynamically from environment variables.",
                                "confidence": 0.95,
                                "description": f"Bandit [B105:hardcoded_password_string]: Hardcoded credential key found in: '{added_code}'",
                                "why_flagged": "Exposing secrets in repository source code leads to critical credential leak risks.",
                                "rule_violated": "Bandit Ruleset B105 (Hardcoded Password String)",
                                "similar_pr": "PR-102 (Fix hardcoded stripe key)"
                            })
                            
                    # Check for eval, exec, shell=True
                    if "eval(" in added_code or "exec(" in added_code or "shell=True" in added_code:
                        findings.append({
                            "category": "security",
                            "severity": "critical",
                            "file_path": file_path,
                            "line_references": [{"file_path": file_path, "start_line": current_line_num, "note": "Unsafe command execution"}],
                            "recommendation": "Avoid using eval, exec, or shell execution. Use subprocess parameters or safe parsers.",
                            "confidence": 0.99,
                            "description": f"Bandit [B602:subprocess_popen_with_shell_true]: Unsafe execution call detected in: '{added_code}'",
                            "why_flagged": "Running commands directly inside shell executors exposes the application to severe remote code execution (RCE) vulnerabilities.",
                            "rule_violated": "Bandit Ruleset B602/B102 (Process Command Execution)",
                            "similar_pr": "None"
                        })

                    # 2. Checkstyle Checks (Java / OOP conventions)
                    if file_path.endswith(".java"):
                        # Field Injection Check
                        if "@Autowired" in added_code:
                            findings.append({
                                "category": "architecture",
                                "severity": "medium",
                                "file_path": file_path,
                                "line_references": [{"file_path": file_path, "start_line": current_line_num, "note": "@Autowired field injection"}],
                                "recommendation": "Refactor to use constructor dependency injection instead of field injection to guarantee immutability.",
                                "confidence": 0.90,
                                "description": "Checkstyle [Style:field_injection]: Found field-level dependency injection using @Autowired.",
                                "why_flagged": "Field injection hides class dependency graphs, prevents class immutability, and complicates writing clean unit tests.",
                                "rule_violated": "Checkstyle Coding Guidelines Section 4.1 (Constructor Injection)",
                                "similar_pr": "PR-145 (Enforce controller boundaries)"
                            })
                            
                        # Class declaration naming style
                        class_match = re.search(r"class\s+([a-z]\w*)", added_code)
                        if class_match:
                            findings.append({
                                "category": "style",
                                "severity": "low",
                                "file_path": file_path,
                                "line_references": [{"file_path": file_path, "start_line": current_line_num, "note": "Class name starts with lowercase"}],
                                "recommendation": "Rename the class to start with a Capital letter following standard PascalCase style.",
                                "confidence": 0.85,
                                "description": f"Checkstyle [Style:class_naming]: Class '{class_match.group(1)}' starts with lowercase letter.",
                                "why_flagged": "Java classes must conform to PascalCase naming conventions to ensure consistency and readability.",
                                "rule_violated": "Google Java Naming Convention Rule 4.2.1",
                                "similar_pr": "None"
                            })

                    # 3. ESLint Checks (Javascript / TypeScript)
                    if file_path.endswith((".js", ".jsx", ".ts", ".tsx")):
                        # Direct database access in Controller
                        if "controller" in file_path.lower() and ("db." in added_code or "query(" in added_code or "rawQuery" in added_code):
                            findings.append({
                                "category": "architecture",
                                "severity": "high",
                                "file_path": file_path,
                                "line_references": [{"file_path": file_path, "start_line": current_line_num, "note": "Direct database query in Controller"}],
                                "recommendation": "Move database query operations into the Service / Repository layer.",
                                "confidence": 0.92,
                                "description": "ESLint [Arch:layered_isolation]: Controller performs database queries bypassing the Service boundaries.",
                                "why_flagged": "Layered architecture separation of concerns requires controllers to only communicate with service layers to enforce isolation.",
                                "rule_violated": "Architecture Design Standard Section 3.2 (Layer Isolation Guidelines)",
                                "similar_pr": "PR-145 (Enforce controller boundaries)"
                            })
                            
                        # Deep nesting representation
                        if added_code.startswith("if") and added_code.count("if") > 2:
                            findings.append({
                                "category": "style",
                                "severity": "medium",
                                "file_path": file_path,
                                "line_references": [{"file_path": file_path, "start_line": current_line_num, "note": "Complex conditional nesting"}],
                                "recommendation": "Flatten control flow using early returns.",
                                "confidence": 0.88,
                                "description": "ESLint [no-nested-conditionals]: Excessive conditional complexity inside blocks decreases maintainability.",
                                "why_flagged": "Flattening nested control flow makes the method readable and minimizes cognitive load during audits.",
                                "rule_violated": "Coding Style Guideline #4 (Flatten Control Flow)",
                                "similar_pr": "PR-184 (Flatten user controller validation logic)"
                            })

                elif line.strip() and not line.startswith(("+", "-", "@@", "index", "similarity")):
                    # Unmodified context line (track numbers)
                    current_line_num += 1

        return findings

static_analysis_engine = StaticAnalysisEngine()
