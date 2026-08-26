// Utility to apply dark mode classes to existing Tailwind classes
export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Dark mode class mappings for common patterns
export const darkClasses = {
  bg: {
    white: 'bg-white dark:bg-gray-800',
    gray50: 'bg-gray-50 dark:bg-gray-700',
    gray100: 'bg-gray-100 dark:bg-gray-700',
    blue50: 'bg-blue-50 dark:bg-blue-900/20',
    green50: 'bg-green-50 dark:bg-green-900/20',
    yellow50: 'bg-yellow-50 dark:bg-yellow-900/20',
    red50: 'bg-red-50 dark:bg-red-900/20',
    purple50: 'bg-purple-50 dark:bg-purple-900/20',
    orange50: 'bg-orange-50 dark:bg-orange-900/20',
  },
  text: {
    gray900: 'text-gray-900 dark:text-gray-100',
    gray800: 'text-gray-800 dark:text-gray-200',
    gray700: 'text-gray-700 dark:text-gray-300',
    gray600: 'text-gray-600 dark:text-gray-400',
    gray500: 'text-gray-500 dark:text-gray-400',
  },
  border: {
    gray200: 'border-gray-200 dark:border-gray-700',
    gray300: 'border-gray-300 dark:border-gray-600',
  },
  input: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100',
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600',
  },
};
