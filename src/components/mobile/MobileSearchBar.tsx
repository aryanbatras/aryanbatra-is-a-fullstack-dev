"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import styles from "@/styles/components/mobile/MobileSearchBar.module.css";

interface MobileSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Show scope buttons below search */
  scopes?: string[];
  /** Active scope */
  activeScope?: string;
  onScopeChange?: (scope: string) => void;
}

/**
 * iOS-style prominent search bar.
 *
 * - Rounded rectangle with magnifying glass icon
 * - Placeholder text
 * - Clear button (X) when text is present
 * - Optional scope bar below (Recents, Documents, etc.)
 * - 36px height
 */
export default function MobileSearchBar({
  value,
  onChange,
  placeholder = "Search",
  scopes,
  activeScope,
  onScopeChange,
}: MobileSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchBar}>
        <Search size={16} strokeWidth={2} className={styles.searchIcon} />
        <input
          ref={inputRef}
          className={styles.searchInput}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          aria-label={placeholder}
        />
        {value && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <X size={16} strokeWidth={2} />
          </button>
        )}
      </div>
      {scopes && scopes.length > 0 && (
        <div className={styles.scopeBar}>
          {scopes.map((scope) => (
            <button
              key={scope}
              type="button"
              className={`${styles.scopeBtn} ${
                activeScope === scope ? styles.scopeBtnActive : ""
              }`}
              onClick={() => onScopeChange?.(scope)}
            >
              {scope}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
