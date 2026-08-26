"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Clock } from "lucide-react";
import { getClientContacts } from "@/server/contacts";
import type { ClientContact } from "@pmg/db/schema";

interface ContactAutocompleteProps {
  organizationId: string;
  clientId: string | null;
  /** Current value of the contact name field */
  value: string;
  /** Called when the user selects a contact from the dropdown */
  onSelectContact: (contact: {
    name: string;
    email: string;
    phone: string;
  }) => void;
  /** Called when the user types a new name (for controlled input) */
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ContactAutocomplete({
  organizationId,
  clientId,
  value,
  onSelectContact,
  onChange,
  placeholder = "Contact person name",
  disabled = false,
  className = "",
}: ContactAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<ClientContact[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch contacts when clientId changes or user types
  const fetchContacts = useCallback(
    async (query: string) => {
      if (!clientId || !organizationId) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const contacts = await getClientContacts(
          organizationId,
          clientId,
          query || undefined,
        );
        setSuggestions(contacts);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId, clientId],
  );

  // Debounced fetch on input change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchContacts(value);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, fetchContacts]);

  // Fetch all contacts when input is focused (empty query)
  const handleFocus = useCallback(() => {
    if (clientId) {
      fetchContacts("");
      setIsOpen(true);
    }
  }, [clientId, fetchContacts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter suggestions to exclude exact match with current input
  const filteredSuggestions = useMemo(
    () =>
      suggestions.filter((s) => s.name.toLowerCase() !== value.toLowerCase()),
    [suggestions, value],
  );

  // Reset highlighted index when filtered suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredSuggestions.length]);

  // Select a contact from the dropdown — defined before handleKeyDown
  const handleSelectContact = (contact: ClientContact) => {
    onSelectContact({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone || "",
    });
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredSuggestions.length
        ) {
          handleSelectContact(filteredSuggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const showDropdown = isOpen && filteredSuggestions.length > 0;
  const activeDescendantId =
    highlightedIndex >= 0
      ? `contact-suggestion-${highlightedIndex}`
      : undefined;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 text-xs sm:text-sm"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-activedescendant={activeDescendantId}
          aria-autocomplete="list"
        />
      </div>

      {/* Suggestion dropdown */}
      {showDropdown && (
        <div
          id="contact-listbox"
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-xl border border-border/60 bg-popover shadow-lg overflow-hidden"
        >
          <div className="max-h-60 overflow-y-auto">
            {filteredSuggestions.map((contact, index) => (
              <button
                key={contact.id}
                id={`contact-suggestion-${index}`}
                type="button"
                role="option"
                aria-selected={index === highlightedIndex}
                className={`w-full px-3 py-2.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                  index === highlightedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectContact(contact);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {contact.name}
                    </span>
                    <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {contact.email && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isOpen && isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/60 bg-popover shadow-lg p-3 text-center text-xs text-muted-foreground">
          Loading contacts...
        </div>
      )}
    </div>
  );
}
