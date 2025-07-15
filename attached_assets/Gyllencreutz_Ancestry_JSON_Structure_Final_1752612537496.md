
# Gyllencreutz Ancestry JSON Format (Final Version)

This document describes the structure and intended use of the final JSON export of the Gyllencreutz noble family tree.

---

## 📁 File Names

- `Gyllencreutz_Ancestry_Flat_CLEAN_Final.json`
- `Gyllencreutz_Ancestry_Nested_CLEAN_Final.json`

---

## 📐 Flat vs. Nested

| Format   | Use Case                                  | Notes |
|----------|-------------------------------------------|-------|
| Flat     | Programmatic manipulation, editing, searching | Easier for data editing |
| Nested   | Tree visualization (e.g., with D3.js)     | Includes Children array nested per generation |

---

## 🧬 Field Descriptions

| Field               | Description |
|--------------------|-------------|
| `ID`               | Unique lineage-based identifier (e.g., "9.2.4.2.1") |
| `Name`             | Full name of the individual |
| `Born`             | Year of birth |
| `Died`             | Year of death (`9999` means presumed deceased, unknown when) |
| `AgeAtDeath`       | Age at death, left blank if `Died = 9999` |
| `BiologicalSex`    | "Male" or "Female", inferred from Swedish name lists |
| `Notes`            | Marital, geographic, or historic information |
| `Father`           | ID of the individual's father |
| `DiedYoung`        | True if individual died under age 15 and had no children |
| `HasMaleChildren`  | True if they had at least one male descendant |
| `IsSuccessionSon`  | True if they are the primary noble successor of their generation |
| `MonarchDuringLife`| Array of monarch(s) reigning during life span (or just birth monarch for those with unknown death year) |

---

## ⚙️ Notes

- All `NaN` values have been replaced with `null` for full JSON compliance.
- `AgeAtDeath` is suppressed for those with unknown death year (9999).
- Flat JSON is ideal for editing or transforming, while nested JSON is ideal for direct display or tree visualization.

---

## Contact

This dataset is curated by the Gyllencreutz family. Contact the family archivist for corrections or updates.

