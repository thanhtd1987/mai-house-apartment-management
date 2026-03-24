# ⚡ Quick Reference - Skills & Agents

## 🚀 Quick Commands

### 📊 business-analyst (Product Research)
```
✅ "Create product brief for [feature name]"
✅ "Research market for [topic]"
✅ "Analyze requirements for [feature]"
✅ "Conduct stakeholder interview for [topic]"
✅ "Discover pain points in [current flow]"
✅ "Analyze competitors in [industry]"
```
→ **Output**: `analysis/product-brief-*.md`, `analysis/market-research-*.md`

---

### 🎨 ui-ux-pro-max (Design Intelligence)
```
✅ "Generate design system for [page/component]"
✅ "Review [component] for accessibility issues"
✅ "Choose color palette for [product type]"
✅ "Check UX of [feature]"
✅ "Recommend font pairing for [style]"
✅ "Analyze navigation patterns for [app]"
```
→ **Design recommendations** + **UX guidelines**

**Script-based queries**:
```bash
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "[query]" --design-system
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "[query]" --domain ux
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "[query]" --domain style
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "[query]" --domain color
```

---

### 🎨 frontend-design (UI Implementation)
```
✅ "Create [aesthetic] component for [feature]"
✅ "Build [page type] with [style]"
✅ "Redesign [component] with [aesthetic direction]"
✅ "Style [UI element] with [specific style]"
```
→ **Production-ready code**

**Aesthetic options**:
- brutalist, maximalist, minimalist luxury
- retro-futuristic, organic, editorial
- industrial, art deco, glassmorphism

---

## 📋 Workflow Examples

### New Feature Development
```
1. "Create product brief for [feature]"
   ↓ (business-analyst)

2. "Generate design system for [feature]"
   ↓ (ui-ux-pro-max)

3. "Create [aesthetic] UI for [feature]"
   ↓ (frontend-design)

4. "Review implementation for accessibility"
   ↓ (ui-ux-pro-max)
```

### UI Improvement
```
1. "Review [component] for UX issues"
   ↓ (ui-ux-pro-max → analysis/ux-review-*.md)

2. "Fix issues found in review"
   ↓ (implement fixes)

3. "Redesign with better [aesthetic]"
   ↓ (frontend-design)
```

---

## 🎯 Common Tasks

| Task | Command |
|------|---------|
| Add feature | `"Create product brief for [feature]"` |
| Research | `"Market research for [topic]"` |
| Design system | `"Generate design system for [page]"` |
| Check a11y | `"Review [component] for accessibility"` |
| Build UI | `"Create [style] component for [feature]"` |
| Improve UX | `"Analyze UX of [flow]"` |
| Choose colors | `"Recommend palette for [product]"` |
| Fix design | `"Redesign [component] with [style]"` |

---

## 📁 Output Locations

```
analysis/
├── product-brief-[timestamp].md
├── market-research-[timestamp].md
├── ux-review-[timestamp].md
├── requirements-[timestamp].md
└── problem-analysis-[timestamp].md
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Skill not triggered | Be more specific with keywords |
| No output file | Request: "Save to analysis/filename.md" |
| Poor design results | Specify aesthetic direction clearly |
| Vague analysis | Provide context: audience, goals, constraints |

---

**💡 Tip**: Combine skills for best results!
```
business-analyst → ui-ux-pro-max → frontend-design
(requirements)   → (design)      → (implementation)
```
