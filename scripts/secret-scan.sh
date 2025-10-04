#!/bin/bash

# Secret Scanning Script for CI/CD
# This script scans the codebase for potential secrets and sensitive information

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCAN_DIRS=("server" "client/src" "scripts")
EXCLUDE_DIRS=("node_modules" ".git" "dist" "build")
SECRET_PATTERNS=(
  "password\s*=\s*['\"][^'\"]*['\"]"
  "secret\s*=\s*['\"][^'\"]*['\"]"
  "key\s*=\s*['\"][^'\"]*['\"]"
  "token\s*=\s*['\"][^'\"]*['\"]"
  "api[_-]?key\s*=\s*['\"][^'\"]*['\"]"
  "private[_-]?key\s*=\s*['\"][^'\"]*['\"]"
  "access[_-]?token\s*=\s*['\"][^'\"]*['\"]"
  "refresh[_-]?token\s*=\s*['\"][^'\"]*['\"]"
  "jwt[_-]?secret\s*=\s*['\"][^'\"]*['\"]"
  "mongodb[_-]?uri\s*=\s*['\"][^'\"]*['\"]"
  "stripe[_-]?secret\s*=\s*['\"][^'\"]*['\"]"
  "razorpay[_-]?secret\s*=\s*['\"][^'\"]*['\"]"
  "webhook[_-]?secret\s*=\s*['\"][^'\"]*['\"]"
  "-----BEGIN.*PRIVATE KEY-----"
  "-----BEGIN.*RSA PRIVATE KEY-----"
  "-----BEGIN.*EC PRIVATE KEY-----"
  "sk_live_[a-zA-Z0-9]{24,}"
  "sk_test_[a-zA-Z0-9]{24,}"
  "pk_live_[a-zA-Z0-9]{24,}"
  "pk_test_[a-zA-Z0-9]{24,}"
  "rzp_live_[a-zA-Z0-9]{24,}"
  "rzp_test_[a-zA-Z0-9]{24,}"
  "whsec_[a-zA-Z0-9]{24,}"
  "mongodb\+srv://[^:]+:[^@]+@"
  "mongodb://[^:]+:[^@]+@"
)

# Allowed patterns (false positives)
ALLOWED_PATTERNS=(
  "password.*=.*process\.env\."
  "secret.*=.*process\.env\."
  "key.*=.*process\.env\."
  "token.*=.*process\.env\."
  "api[_-]?key.*=.*process\.env\."
  "private[_-]?key.*=.*process\.env\."
  "access[_-]?token.*=.*process\.env\."
  "refresh[_-]?token.*=.*process\.env\."
  "jwt[_-]?secret.*=.*process\.env\."
  "mongodb[_-]?uri.*=.*process\.env\."
  "stripe[_-]?secret.*=.*process\.env\."
  "razorpay[_-]?secret.*=.*process\.env\."
  "webhook[_-]?secret.*=.*process\.env\."
  "password.*=.*['\"][^'\"]*['\"]" # Allow empty passwords in examples
  "secret.*=.*['\"][^'\"]*['\"]" # Allow empty secrets in examples
  "key.*=.*['\"][^'\"]*['\"]" # Allow empty keys in examples
  "token.*=.*['\"][^'\"]*['\"]" # Allow empty tokens in examples
  "your[_-]?.*[_-]?key[_-]?id[_-]?here"
  "your[_-]?.*[_-]?secret[_-]?key"
  "your[_-]?.*[_-]?stripe[_-]?.*[_-]?key"
  "your[_-]?.*[_-]?razorpay[_-]?.*[_-]?key"
  "your[_-]?.*[_-]?mongodb[_-]?uri"
  "your[_-]?.*[_-]?jwt[_-]?secret"
  "test[_-]?.*[_-]?key"
  "test[_-]?.*[_-]?secret"
  "development[_-]?.*[_-]?key"
  "development[_-]?.*[_-]?secret"
  "example[_-]?.*[_-]?key"
  "example[_-]?.*[_-]?secret"
  "placeholder[_-]?.*[_-]?key"
  "placeholder[_-]?.*[_-]?secret"
)

# File extensions to scan
SCAN_EXTENSIONS=("js" "jsx" "ts" "tsx" "json" "env" "yaml" "yml" "md" "txt" "sh" "py" "java" "go" "php" "rb")

# Counters
TOTAL_FILES=0
SCANNED_FILES=0
SECRETS_FOUND=0
VIOLATIONS=()

echo -e "${BLUE}🔍 Starting secret scan...${NC}"

# Function to check if file should be excluded
should_exclude_file() {
  local file="$1"
  
  for exclude_dir in "${EXCLUDE_DIRS[@]}"; do
    if [[ "$file" == *"$exclude_dir"* ]]; then
      return 0
    fi
  done
  
  return 1
}

# Function to check if pattern is allowed
is_allowed_pattern() {
  local line="$1"
  
  for allowed_pattern in "${ALLOWED_PATTERNS[@]}"; do
    if echo "$line" | grep -qiE "$allowed_pattern"; then
      return 0
    fi
  done
  
  return 1
}

# Function to scan a file for secrets
scan_file() {
  local file="$1"
  local file_violations=()
  
  # Check file extension
  local extension="${file##*.}"
  local should_scan=false
  
  for ext in "${SCAN_EXTENSIONS[@]}"; do
    if [[ "$extension" == "$ext" ]]; then
      should_scan=true
      break
    fi
  done
  
  if [[ "$should_scan" == false ]]; then
    return 0
  fi
  
  # Scan file for secret patterns
  while IFS= read -r line; do
    line_num=$((line_num + 1))
    
    for pattern in "${SECRET_PATTERNS[@]}"; do
      if echo "$line" | grep -qiE "$pattern"; then
        # Check if this is an allowed pattern
        if ! is_allowed_pattern "$line"; then
          file_violations+=("$line_num:$pattern:$line")
        fi
      fi
    done
  done < "$file"
  
  if [[ ${#file_violations[@]} -gt 0 ]]; then
    VIOLATIONS+=("$file:${file_violations[*]}")
    SECRETS_FOUND=$((SECRETS_FOUND + ${#file_violations[@]}))
  fi
  
  SCANNED_FILES=$((SCANNED_FILES + 1))
}

# Function to scan directory
scan_directory() {
  local dir="$1"
  
  if [[ ! -d "$dir" ]]; then
    echo -e "${YELLOW}⚠️ Directory $dir does not exist, skipping...${NC}"
    return 0
  fi
  
  echo -e "${BLUE}📁 Scanning directory: $dir${NC}"
  
  while IFS= read -r -d '' file; do
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    if ! should_exclude_file "$file"; then
      scan_file "$file"
    fi
  done < <(find "$dir" -type f -print0)
}

# Main scanning logic
main() {
  echo -e "${BLUE}🔍 Secret Scanning Report${NC}"
  echo -e "${BLUE}========================${NC}"
  
  # Scan specified directories
  for dir in "${SCAN_DIRS[@]}"; do
    scan_directory "$dir"
  done
  
  # Scan root directory for config files
  echo -e "${BLUE}📁 Scanning root directory for config files...${NC}"
  for file in .env* package.json *.md *.yml *.yaml; do
    if [[ -f "$file" ]]; then
      TOTAL_FILES=$((TOTAL_FILES + 1))
      scan_file "$file"
    fi
  done
  
  # Generate report
  echo -e "\n${BLUE}📊 Scan Results${NC}"
  echo -e "${BLUE}===============${NC}"
  echo -e "Total files found: ${TOTAL_FILES}"
  echo -e "Files scanned: ${SCANNED_FILES}"
  echo -e "Secrets found: ${SECRETS_FOUND}"
  
  if [[ ${#VIOLATIONS[@]} -gt 0 ]]; then
    echo -e "\n${RED}❌ SECRET VIOLATIONS FOUND:${NC}"
    echo -e "${RED}============================${NC}"
    
    for violation in "${VIOLATIONS[@]}"; do
      IFS=':' read -r file line_num pattern line <<< "$violation"
      echo -e "${RED}File: $file${NC}"
      echo -e "${RED}Line $line_num: $line${NC}"
      echo -e "${RED}Pattern: $pattern${NC}"
      echo -e "${RED}---${NC}"
    done
    
    echo -e "\n${RED}🚨 BUILD FAILED: Secrets detected in codebase${NC}"
    echo -e "${RED}Please remove or properly secure the above secrets.${NC}"
    echo -e "${YELLOW}💡 Use environment variables or secure secret management.${NC}"
    
    exit 1
  else
    echo -e "\n${GREEN}✅ No secrets detected in codebase${NC}"
    echo -e "${GREEN}🎉 Secret scan passed successfully!${NC}"
  fi
}

# Run main function
main "$@"

