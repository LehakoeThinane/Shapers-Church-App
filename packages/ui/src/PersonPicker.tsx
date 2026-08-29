import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import type { Person } from "@shapers/types";
import { Text } from "./Text";
import { TextField } from "./TextField";
import { theme } from "./theme";

export interface PersonPickerProps {
  people: Person[];
  selectedPersonId?: string | null;
  onSelect: (person: Person) => void;
  placeholder?: string;
}

// Search-filtered, tap-to-select list of people. Used everywhere an admin
// needs to pick a person — role assignment, group membership. Doesn't fetch
// anything itself; the caller passes the list (getChurchPeople()) so this
// stays a plain presentational component, same as the rest of this package.
export function PersonPicker({
  people,
  selectedPersonId,
  onSelect,
  placeholder = "Search people...",
}: PersonPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? people.filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(query.trim().toLowerCase()))
    : people;

  return (
    <View>
      <TextField label="Search" placeholder={placeholder} value={query} onChangeText={setQuery} />
      <ScrollView style={{ maxHeight: 220 }}>
        {filtered.length === 0 ? (
          <Text style={{ color: theme.color.textMuted, paddingVertical: theme.spacing(2) }}>No matches.</Text>
        ) : (
          filtered.map((person) => {
            const selected = person.id === selectedPersonId;
            return (
              <Pressable key={person.id} onPress={() => onSelect(person)}>
                <View
                  style={{
                    paddingVertical: theme.spacing(2),
                    paddingHorizontal: theme.spacing(2),
                    borderRadius: theme.radius.sm,
                    backgroundColor: selected ? theme.glass.backgroundElevated : "transparent",
                  }}
                >
                  <Text style={selected ? { fontWeight: "600" as const } : undefined}>
                    {person.first_name} {person.last_name}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
