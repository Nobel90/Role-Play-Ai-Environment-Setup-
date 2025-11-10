# JSON Structure Documentation

## Expected JSON Structure

Based on the UE5 integration, the JSON structure should contain an array of scenarios. Each scenario represents a card that appears in the "Scenario Selection" menu.

### Example JSON Structure

```json
{
  "scenarios": [
    {
      "id": "scenario-1",
      "title": "Having Difficult Conversations",
      "character": "Betty",
      "environment": "office",
      "description": "Practice having difficult conversations with Betty in an office setting"
    },
    {
      "id": "scenario-2",
      "title": "Shared Decision Making",
      "character": "Joshua",
      "environment": "clinic",
      "description": "Learn shared decision making with Joshua in a clinic environment"
    },
    {
      "id": "scenario-3",
      "title": "Motivational Interviewing",
      "character": "David",
      "environment": "hospital",
      "description": "Practice motivational interviewing techniques with David"
    },
    {
      "id": "scenario-4",
      "title": "Patient",
      "character": "Rachael",
      "environment": "home",
      "description": "Patient interaction scenario with Rachael"
    }
  ]
}
```

### Alternative Structure (if scenarios are at root level)

```json
[
  {
    "title": "Having Difficult Conversations",
    "character": "Betty",
    "environment": "office"
  },
  {
    "title": "Shared Decision Making",
    "character": "Joshua",
    "environment": "clinic"
  }
]
```

## Field Descriptions

- **id** (optional): Unique identifier for the scenario
- **title**: The main title of the scenario (e.g., "Having Difficult Conversations")
- **character**: Character name (e.g., "Betty", "Joshua")
- **environment**: Environment identifier that UE5 uses to load the correct scene
- **description** (optional): Additional description or notes

## Display Format

In the UE5 app, scenarios are displayed as:
- Card title: `{title} - {character}`
- Example: "Having Difficult Conversations - Betty"

## Notes

- The exact structure may vary based on UE5 app requirements
- The Scenario Management UI should be flexible enough to handle different structures
- Users can always fall back to raw JSON editing if needed

