
# Gyllencreutz Ancestry JSON Data Format

This document describes the structure and purpose of the flat JSON file representing the Gyllencreutz noble family ancestry tree. It is suitable for data visualizations and analysis, particularly in D3-based tree views or other JavaScript tools.

---

## 📁 File Name
**`Gyllencreutz_Ancestry_Flat_With_BiologicalSex.json`**

---

## 📌 Structure
The file contains a flat array of individuals, each represented by a JSON object with the following properties:

| Field              | Type     | Description                                                                 |
|-------------------|----------|-----------------------------------------------------------------------------|
| `ID`              | string   | Unique identifier following lineage pattern (e.g., `9.2.4.2`)               |
| `Name`            | string   | Full name of the individual                                                 |
| `Born`            | int/null | Year of birth                                                               |
| `Died`            | int/null | Year of death; `9999` is used to indicate confirmed deceased when unknown   |
| `AgeAtDeath`      | int/null | Age at death if both birth and death years are known                        |
| `BiologicalSex`   | string   | `"Male"` or `"Female"`; inferred from name lists                            |
| `Notes`           | string   | Free-form notes (titles, marriages, historical events, etc.)                |
| `Father`          | string   | ID of the father node, forming the family structure                         |
| `DiedYoung`       | bool     | True if individual died before age 15 and had no children                   |
| `HasMaleChildren` | bool     | True if individual had at least one son                                     |
| `IsSuccessionSon`| bool     | True if this son continues the noble name succession                        |

---

## 🔄 Usage in Visualizations

### ✅ Recommended Use
- **Tree visualizations (D3.js, WindSurf)**
- **Searchable family explorer interfaces**
- **Genealogy tools and queries**

### 🔄 Tree Construction
Each node uses the `Father` property to determine placement in the hierarchy.

---

## 🛠️ Editing Tips
- Modify the `Notes` or `Died` fields for updates
- Maintain `ID` format for compatibility
- When editing lineage, update `Father` fields carefully

---

## 📬 Contact
For corrections, updates, or family contributions, please contact the data steward or project maintainer.
