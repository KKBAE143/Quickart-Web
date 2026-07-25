# 📚 Documentation Rules & Guidelines

## ⚠️ MANDATORY RULES

### Rule #1: Location
**ALL documentation MUST be placed in the `docs/` folder structure.**

- ✅ **CORRECT**: `docs/features/NEW_FEATURE_GUIDE.md`
- ❌ **WRONG**: `NEW_FEATURE_GUIDE.md` (root directory)

### Rule #2: Subfolder Selection
Choose the appropriate subfolder based on documentation type:

| Documentation Type | Subfolder | Example |
|-------------------|-----------|---------|
| Installation, Setup, Config | `docs/setup/` | `MONGODB_SETUP.md` |
| Features, Functionality | `docs/features/` | `EMAIL_SYSTEM.md` |
| Design, UI/UX, Styling | `docs/ui-ux/` | `COLOR_SCHEME_UPDATE.md` |
| Guides, References | `docs/guides/` | `QUICK_REFERENCE.md` |
| Troubleshooting, Fixes | `docs/troubleshooting/` | `FIX_UPLOAD_ERROR.md` |

### Rule #3: Naming Convention
Use **UPPERCASE** with **underscores**:

- ✅ `FEATURE_NAME_GUIDE.md`
- ✅ `SERVICE_SETUP.md`
- ✅ `FIX_ERROR_NAME.md`
- ❌ `feature-guide.md`
- ❌ `FeatureGuide.md`

### Rule #4: Update Index
Always update `docs/README.md` when adding new documentation.

### Rule #5: Check Guidelines
Read the README in each subfolder before creating documentation there.

---

## 📁 Folder Structure

```
docs/
├── README.md                       # Main documentation index
├── ORGANIZATION_SUMMARY.md         # Organization overview
│
├── setup/                          # Installation & Configuration
│   ├── README.md                   # Setup folder guide
│   └── [setup docs...]
│
├── features/                       # Feature Implementations
│   ├── README.md                   # Features folder guide
│   └── [feature docs...]
│
├── ui-ux/                          # Design & Styling
│   ├── README.md                   # UI/UX folder guide
│   └── [design docs...]
│
├── guides/                         # References & Guides
│   ├── README.md                   # Guides folder guide
│   ├── DOCUMENTATION_RULES.md     # This file
│   └── [other guides...]
│
└── troubleshooting/                # Error Fixes
    ├── README.md                   # Troubleshooting folder guide
    └── [troubleshooting docs...]
```

---

## 📝 Documentation Template

```markdown
# [Title in Title Case]

## Overview
Brief description of what this document covers.

## Prerequisites (if applicable)
- Prerequisite 1
- Prerequisite 2

## [Main Section 1]
Content here...

## [Main Section 2]
Content here...

## Examples
\`\`\`javascript
// Code examples
\`\`\`

## Troubleshooting (if applicable)
Common issues and solutions.

## See Also
- [Related Document 1](./RELATED_DOC.md)
- [Related Document 2](../features/FEATURE.md)

---

**Last Updated**: [Date]
**Author**: Quickart Development Team
```

---

## 🚫 What NOT to Do

### ❌ Don't Create Docs in Root
```
# WRONG
./NEW_FEATURE_GUIDE.md

# CORRECT
./docs/features/NEW_FEATURE_GUIDE.md
```

### ❌ Don't Use Wrong Naming
```
# WRONG
feature-guide.md
featureGuide.md
feature_Guide.md

# CORRECT
FEATURE_GUIDE.md
```

### ❌ Don't Forget to Update Index
When adding `docs/features/NEW_FEATURE.md`, also update `docs/README.md`.

### ❌ Don't Mix Categories
If it's a setup guide, put it in `setup/`, not `features/`.

---

## ✅ What TO Do

### ✅ Check Existing Structure First
Before creating documentation:
1. Check `docs/README.md` for overview
2. Read the subfolder's README
3. Look at similar documents for examples

### ✅ Use Descriptive Names
```
# GOOD
EMAIL_SYSTEM_GUIDE.md
MONGODB_CONFIGURATION.md
FIX_UPLOAD_ERROR.md

# AVOID
guide.md
setup.md
fix.md
```

### ✅ Keep It Updated
- Update dates when modifying documents
- Add version information if applicable
- Link to related documentation

### ✅ Follow Markdown Best Practices
- Use proper heading hierarchy (H1 → H2 → H3)
- Include code blocks with language syntax
- Add links to related documents
- Use tables for structured data
- Include examples where helpful

---

## 📖 Quick Decision Guide

**Ask yourself:**

1. **Is it about setup/installation?** → `docs/setup/`
2. **Is it about a feature?** → `docs/features/`
3. **Is it about design/UI?** → `docs/ui-ux/`
4. **Is it a reference/guide?** → `docs/guides/`
5. **Is it about fixing errors?** → `docs/troubleshooting/`

**Still unsure?** Check `docs/README.md` or ask!

---

## 🔍 Finding Documentation

### For New Team Members:
1. Start with `docs/README.md`
2. Read `docs/setup/QUICK_START.md`
3. Browse folders relevant to your work

### For Developers:
- Quick reference: `docs/guides/QUICK_REFERENCE.md`
- Feature docs: Browse `docs/features/`
- API docs: Check feature-specific docs

### For Designers:
- Design system: Browse `docs/ui-ux/`
- Color schemes: `docs/ui-ux/COLOR_SCHEME_UPDATE.md`
- Component docs: `docs/ui-ux/`

### For Troubleshooting:
- Check `docs/troubleshooting/`
- Search by error message
- Check feature-specific docs for known issues

---

## 🎯 Enforcement

These rules are **enforced in `.cursorrules`** file. The AI assistant will:
- ✅ Automatically place docs in correct folders
- ✅ Use proper naming conventions
- ✅ Update the documentation index
- ✅ Check guidelines before creating docs

---

## 📊 Documentation Statistics

| Folder | Files | Purpose |
|--------|-------|---------|
| setup | 7 | Installation & configuration |
| features | 7 | Feature implementations |
| ui-ux | 7 | Design & styling |
| guides | 3 | References & guides |
| troubleshooting | 1 | Error fixes |
| **Total** | **25** | **Organized documentation** |

---

## 🎉 Benefits of This System

1. **Easy Navigation** - Find docs quickly by category
2. **Consistency** - Same structure everywhere
3. **Scalability** - Grows naturally with project
4. **Professional** - Industry-standard organization
5. **Team-Friendly** - Clear rules for everyone
6. **Maintainable** - Easy to keep organized

---

**Created**: November 2, 2025  
**Status**: Active  
**Maintained By**: Quickart Development Team

