#!/bin/bash
# This script applies systematic replacements for dark mode and translations
# Run from project root: bash scripts/apply-fixes.sh

echo "Applying dark mode classes and Azerbaijani translations..."

# Common dark mode class patterns to replace
declare -A dark_classes=(
  ["bg-white "]="bg-white dark:bg-gray-800 "
  ["bg-gray-50 "]="bg-gray-50 dark:bg-gray-900 "
  ["bg-gray-100 "]="bg-gray-100 dark:bg-gray-800 "
  ["text-gray-900 "]="text-gray-900 dark:text-gray-100 "
  ["text-gray-800 "]="text-gray-800 dark:text-gray-200 "
  ["text-gray-700 "]="text-gray-700 dark:text-gray-300 "
  ["text-gray-600 "]="text-gray-600 dark:text-gray-400 "
  ["text-gray-500 "]="text-gray-500 dark:text-gray-400 "
  ["border-gray-200 "]="border-gray-200 dark:border-gray-700 "
  ["border-gray-300 "]="border-gray-300 dark:border-gray-600 "
  ["bg-blue-50 "]="bg-blue-50 dark:bg-blue-900/20 "
  ["bg-green-50 "]="bg-green-50 dark:bg-green-900/20 "
  ["bg-yellow-50 "]="bg-yellow-50 dark:bg-yellow-900/20 "
  ["bg-red-50 "]="bg-red-50 dark:bg-red-900/20 "
  ["bg-purple-50 "]="bg-purple-50 dark:bg-purple-900/20 "
  ["bg-orange-50 "]="bg-orange-50 dark:bg-orange-900/20 "
)

# Apply dark mode classes to all dashboard pages
for file in app/dashboard/{products,warehouses,orders,reports,analytics,settings}/page.tsx; do
  if [ -f "$file" ]; then
    echo "Processing $file for dark mode..."
    for old in "${!dark_classes[@]}"; do
      new="${dark_classes[$old]}"
      sed -i "s/${old}/${new}/g" "$file" 2>/dev/null || true
    done
  fi
done

echo "Dark mode classes applied!"
echo ""
echo "Note: Azerbaijani translations require manual import and replacement"
echo "Add to each page: import { t } from '@/lib/i18n';"
echo "Then replace text strings with translation keys"
