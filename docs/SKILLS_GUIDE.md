# 🛠️ Skills & Agents Guide - Hướng dẫn sử dụng

## 📋 Table of Contents
- [Available Skills & Agents](#available-skills--agents)
- [Output Directory](#output-directory)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## 🎯 Available Skills & Agents

### 1. 🎨 **frontend-design** (Skill)
**Purpose**: Create distinctive, production-grade frontend interfaces with high design quality

**Location**: `~/.claude/skills/frontend-design/`

**When to use**:
- Build web components, pages, applications
- Create landing pages, dashboards, admin panels
- Style or beautify existing UI
- Design posters, artifacts, HTML/CSS layouts

**How to trigger**:
```
✅ "Create a brutalist landing page for apartment booking"
✅ "Design a minimalist invoice page with elegant typography"
✅ "Use frontend-design skill to redesign this dashboard card"
✅ "Build a retro-futuristic room booking page with neon colors"
```

**Key Features**:
- Avoids generic AI aesthetics (no Inter/Roboto, no purple gradients)
- Bold aesthetic directions: brutalist, maximalist, minimalist luxury, retro-futuristic
- Production-grade code with exceptional attention to detail
- Creative typography, color systems, motion, layouts

---

### 2. 🎨 **ui-ux-pro-max** (Skill)
**Purpose**: Comprehensive UI/UX design intelligence with 50+ styles, 161 color palettes, 57 font pairings, 99 UX guidelines

**Location**: `~/.claude/skills/ui-ux-pro-max/`

**When to use**:
- Design new pages or components
- Choose color schemes, typography, spacing systems
- Review UI code for UX quality or accessibility
- Implement navigation, animations, responsive behavior
- Improve perceived quality, clarity, or usability

**How to trigger**:
```
✅ "Review RoomDetails component for UX issues"
✅ "Choose color palette for apartment management dashboard"
✅ "Check accessibility of the invoice modal"
✅ "Improve mobile experience of room listing page"
```

**Key Features**:
- Design system recommendations (style, color, typography, effects)
- Priority-based rules (Accessibility CRITICAL → Performance HIGH)
- Domain-specific searches (product, style, color, ux, chart, react-native)
- 99 UX guidelines with anti-patterns to avoid

**Usage Workflow**:
```bash
# Generate design system first
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "apartment management dashboard" --design-system

# Supplement with detailed searches
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "accessibility animation" --domain ux
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "minimalism dark" --domain style
```

---

### 3. 📊 **business-analyst** (Agent)
**Purpose**: Product discovery, requirements analysis, stakeholder interviews, market research, problem analysis

**Type**: Built-in agent (no installation needed)

**When to use**:
- Conduct stakeholder interviews
- Perform market research and competitive analysis
- Create product briefs and requirement documents
- Problem discovery and user needs analysis
- Brainstorm solutions for business problems

**How to trigger**:
```
✅ "Create product brief for extra services payment tracking feature"
✅ "Analyze requirements for room booking optimization"
✅ "Conduct market research on apartment management software"
✅ "Interview stakeholders for invoice generation improvements"
✅ "Discover pain points in current guest registration flow"
```

**Key Features**:
- Product brief creation
- Stakeholder interview scripts
- Market research reports
- Requirements gathering
- Problem discovery and analysis

**Output Location**: `analysis/` directory (gitignored)

---

### 4. 🔧 **update-config** (Skill)
**Purpose**: Modify Claude Code configuration via settings.json

**When to use**:
- Set up automated behaviors (hooks)
- Configure permissions
- Set environment variables
- Customize keybindings
- Troubleshoot settings issues

**How to trigger**:
```
✅ "Add permission to run npm commands"
✅ "Set DEBUG=true in environment"
✅ "Create hook to format files after saving"
✅ "Move permission to user settings"
```

---

### 5. 🧹 **simplify** (Skill)
**Purpose**: Review changed code for reuse, quality, and efficiency, then fix issues

**When to use**:
- After implementing a feature
- Before committing code
- When code feels complex or redundant
- To improve code quality

---

## 📁 Output Directory

### `analysis/` Folder
All AI-generated analysis documents are stored in the `analysis/` directory (gitignored).

**Structure**:
```
analysis/
├── README.md           # This file
├── product-brief-*.md          # Product requirements from business-analyst
├── stakeholder-interviews-*.md # Interview questions and findings
├── market-research-*.md        # Competitive analysis
├── requirements-*.md           # Detailed feature requirements
├── problem-analysis-*.md       # Issue analysis and solutions
└── ux-review-*.md              # UI/UX reviews from ui-ux-pro-max
```

**Why gitignored?**
- Avoids cluttering repository with frequently updated analysis
- Allows iteration without commit noise
- Keeps focus on implementation code

---

## 💡 Usage Examples

### Example 1: Feature Development Workflow
```
1. "Create product brief for monthly extra services payment tracking"
   → Generates: analysis/product-brief-extra-services-payment-[timestamp].md

2. "Review the product brief and analyze technical requirements"
   → Creates implementation plan

3. "Use ui-ux-pro-max to design payment tracking UI"
   → Generates design system and component recommendations

4. "Use frontend-design to build payment tracking modal"
   → Creates production-ready React component
```

### Example 2: UI Improvement Workflow
```
1. "Review RoomDetails component for accessibility issues"
   → Uses ui-ux-pro-max to audit
   → Outputs: analysis/ux-review-roomdetails-[timestamp].md

2. "Fix the accessibility issues mentioned in the review"
   → Implements fixes based on findings

3. "Redesign RoomDetails with better UX"
   → Uses ui-ux-pro-max + frontend-design
   → Creates improved component
```

### Example 3: Market Research Workflow
```
1. "Research apartment management software competitors"
   → business-analyst conducts market research
   → Outputs: analysis/market-research-competitors-[timestamp].md

2. "Analyze findings and identify opportunities"
   → business-analyst synthesizes insights
   → Creates product brief for new features

3. "Design dashboard based on research insights"
   → ui-ux-pro-max + frontend-design
   → Builds competitive UI
```

---

## 🎓 Best Practices

### 1. **Start with business-analyst for New Features**
Before coding, use business-analyst to:
- Understand user needs and pain points
- Define clear requirements
- Identify success metrics
- Research competitive landscape

**Example**:
```
"Analyze requirements for auto-payment feature before we start coding"
```

### 2. **Use ui-ux-pro-max Before Design**
Let ui-ux-pro-max guide design decisions:
- Generate design system first (`--design-system`)
- Review with domain searches (`--domain ux`, `--domain style`)
- Check accessibility and performance guidelines
- Avoid common anti-patterns

**Example**:
```
"Generate design system for payment history dashboard with ui-ux-pro-max"
```

### 3. **Use frontend-design for Implementation**
When you need actual code with high design quality:
- Provides specific aesthetic direction
- References design system from ui-ux-pro-max
- Requests production-grade, working code

**Example**:
```
"Use frontend-design to build payment history table with minimalist luxury aesthetic"
```

### 4. **Review Analysis Documents**
Check `analysis/` folder regularly:
- Review product briefs before implementation
- Reference UX reviews during coding
- Keep market research for strategic decisions

### 5. **Combine Skills for Best Results**
```
business-analyst (requirements)
→ ui-ux-pro-max (design system)
→ frontend-design (implementation)
```

---

## ⚡ Quick Reference

| Task | Use This | Example Trigger |
|------|----------|-----------------|
| Define feature requirements | business-analyst | "Create product brief for..." |
| Research competitors | business-analyst | "Market research for..." |
| Design system & colors | ui-ux-pro-max | "Generate design system for..." |
| Check accessibility | ui-ux-pro-max | "Review accessibility of..." |
| Build UI component | frontend-design | "Create [aesthetic] component for..." |
| Style existing UI | frontend-design | "Redesign this component with [style]..." |
| Review code quality | simplify | "Review this code for improvements" |
| Configure Claude | update-config | "Add permission for..." |

---

## 🔍 Troubleshooting

### Skill not being suggested?
1. Check skill installation: `ls ~/.claude/skills/`
2. Check settings: `cat ~/.claude/settings.json`
3. Restart Claude Code IDE

### Agent not working?
- business-analyst is built-in, just request the task
- No installation needed
- Automatically triggered by relevant keywords

### Output not saving to analysis/?
- Explicitly request: "Save the analysis to analysis/filename.md"
- Check .gitignore includes `analysis/`

---

## 📚 Additional Resources

- **Design System**: [docs/DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
- **Architecture**: [analysis/ARCHITECTURE_REVIEW.md](../analysis/ARCHITECTURE_REVIEW.md)
- **Component Analysis**: [analysis/COMPONENT_REFACTORING_ANALYSIS.md](../analysis/COMPONENT_REFACTORING_ANALYSIS.md)

---

**🎉 Ready to build beautiful, well-designed products with AI assistance!**
