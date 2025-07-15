
# Gyllencreutz Ancestry JSON Format with MonarchDuringLife

This document provides a comprehensive description of the JSON data files representing the noble Gyllencreutz family lineage. These data files are intended for use in heritage visualization, historical analysis, and family archiving tools, including interactive web-based family trees (e.g., D3.js).

---

## 🎯 Purpose

The JSON files serve as a structured and extensible data source for:
- Visualizing the Gyllencreutz noble family tree over multiple centuries
- Highlighting noble succession according to Swedish nobility rules
- Enriching historical context by linking individuals to reigning Swedish monarchs
- Supporting advanced queries, searches, and visual interactions on modern genealogy websites

---

## 📦 File Names and Structure

- `Gyllencreutz_Ancestry_Flat_With_Monarchs_Combined.json` – flat list of individuals
- `Gyllencreutz_Ancestry_Nested_With_Monarchs_Combined.json` – hierarchical tree (nested by father-child relationships)

---

## 📐 Flat vs Nested

| Format   | Use Case                                  | Notes |
|----------|-------------------------------------------|-------|
| **Flat** | Editing, searching, programmatic updates  | Easier to parse and edit |
| **Nested** | Direct use in tree views (e.g., D3.js)     | Mirrors family structure using parent-child nesting |

---

## 🧬 Field Descriptions

| Field               | Type     | Description |
|--------------------|----------|-------------|
| `ID`               | string   | Unique lineage-based identifier (e.g., "9.2.4.2.1") showing generational path |
| `Name`             | string   | Full name of the individual |
| `Born`             | int      | Year of birth |
| `Died`             | int/null | Year of death (`9999` indicates unknown but presumed deceased) |
| `AgeAtDeath`       | int/null | Auto-calculated if `Born` and `Died` are available |
| `BiologicalSex`    | string   | `"Male"` or `"Female"` based on name inference |
| `Notes`            | string   | Marriages, noble titles, ranks, burial details, historical notes |
| `Father`           | string   | ID of the individual's father (used to build tree structure) |
| `DiedYoung`        | bool     | True if died before age 15 and had no children (likely breaks succession) |
| `HasMaleChildren`  | bool     | True if individual had at least one male child (used for noble inheritance logic) |
| `IsSuccessionSon`  | bool     | True if the person is the noble successor in their generation (oldest surviving son with descendants) |
| `MonarchDuringLife`| array    | List of monarchs who reigned during individual's lifespan. If `Died=9999`, this contains **only the monarch at birth** for conservative historical accuracy. |

---

## 👑 MonarchDuringLife – How It Works

- For individuals with known `Died` year:
  - Lists **all Swedish monarchs** whose reign overlaps with the person's life (`Born` to `Died`)
- For individuals with `Died = 9999`:
  - Lists **only** the monarch reigning at the person's birth (no speculation on lifespan)

Example:
```json
"MonarchDuringLife": ["Oscar II (1872–1907)", "Gustaf V (1907–1950)"]
```

---

## 🔄 Usage Scenarios

- **Search & Filter**: Filter by surname, birth period, monarch, or noble line
- **Visualize**: Use `nested` format for tree renderers like D3.js
- **Query Succession**: Trace `IsSuccessionSon` to visualize noble title path
- **Contextualize**: Show historical rulers with `MonarchDuringLife`

---

## 🛠️ Integration Notes

- Use `Father` to build child-parent relationships (for nested tree construction)
- `ID` is human-readable but also structurally important (acts like a path)
- All dates are in **years** (no month/day resolution)

---

## 📬 Contact

This data is curated and maintained as part of the Gyllencreutz noble family archive. For corrections, contributions, or technical integration help, contact the family data steward or website maintainer.

